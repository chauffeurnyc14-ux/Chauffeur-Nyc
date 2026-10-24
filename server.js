const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Disable information disclosure headers
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
    // Content-Security-Policy tailored to existing integrations (Tailwind CDN, Google Fonts, FontAwesome, AOS, WhatsApp, Instagram)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; " +
        "img-src 'self' data: https: blob:; " +
        "media-src 'self' data: blob:; " +
        "connect-src 'self' https://cdn.tailwindcss.com; " +
        "frame-ancestors 'self'; " +
        "form-action 'self' https://wa.me;"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('X-XSS-Protection', '0');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
});

// Protect sensitive files and directories from static exposure
const BLOCKED_PATHS = [
    /^\/server\.js$/i,
    /^\/package(\-lock)?\.json$/i,
    /^\/data(\/|$)/i,
    /^\/\.git/i,
    /^\/\.env/i,
    /^\/\.DS_Store/i,
    /^\/node_modules/i
];

app.use((req, res, next) => {
    const cleanPath = req.path;
    for (const pattern of BLOCKED_PATHS) {
        if (pattern.test(cleanPath)) {
            return res.status(404).send('Not Found');
        }
    }
    next();
});

// Parse JSON bodies with strict size limit to mitigate DoS
app.use(bodyParser.json({ limit: '50kb' }));

// Static file serving with dotfiles denied
app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: 'index.html'
}));

// In-Memory Rate Limiter Helper
function createRateLimiter({ windowMs, maxRequests, message }) {
    const clients = new Map();

    // Clean up stale entries every 5 minutes
    const cleanupInterval = Math.min(windowMs, 300000);
    setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of clients.entries()) {
            if (now - record.startTime > windowMs) {
                clients.delete(ip);
            }
        }
    }, cleanupInterval).unref();

    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = clients.get(ip) || { count: 0, startTime: now };

        if (now - record.startTime > windowMs) {
            record.count = 1;
            record.startTime = now;
        } else {
            record.count++;
        }
        clients.set(ip, record);

        if (record.count > maxRequests) {
            res.setHeader('Retry-After', Math.ceil((record.startTime + windowMs - now) / 1000));
            return res.status(429).json({ error: message || 'Too many requests, please try again later.' });
        }
        next();
    };
}

// Rate limiters: Auth endpoint max 5 attempts/15min; API content max 30 requests/min
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again after 15 minutes.'
});

const contentLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many requests. Please slow down.'
});

// Constant-Time String Comparison to Prevent Timing Attacks
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

// Serve Admin Pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Admin Authentication Route
app.post('/api/login', authLimiter, (req, res) => {
    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (safeCompare(password, ADMIN_PASSWORD)) {
        return res.json({ success: true, message: 'Authenticated successfully' });
    }
    return res.status(401).json({ error: 'Invalid password' });
});

// API Routes
app.get('/api/content', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read content' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            res.status(500).json({ error: 'Failed to parse content data' });
        }
    });
});

app.post('/api/content', contentLimiter, (req, res) => {
    const { password, content } = req.body || {};

    if (!password || !safeCompare(password, ADMIN_PASSWORD)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        return res.status(400).json({ error: 'Invalid content payload format' });
    }

    // Whitelist and sanitize allowed fields
    const ALLOWED_FIELDS = ['phoneNumber', 'instagramUrl', 'heroTitleElite', 'heroTitleNY', 'heroDescription'];
    const sanitized = {};

    for (const field of ALLOWED_FIELDS) {
        if (field in content) {
            if (typeof content[field] !== 'string') {
                return res.status(400).json({ error: `Field '${field}' must be a string` });
            }
            if (content[field].length > 500) {
                return res.status(400).json({ error: `Field '${field}' exceeds 500 character limit` });
            }
            sanitized[field] = content[field];
        }
    }

    fs.writeFile(DATA_FILE, JSON.stringify(sanitized, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save content' });
        }
        res.json({ message: 'Content updated successfully' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`CMS Server running at http://localhost:${PORT}`);
    console.log(`Admin Login: http://localhost:${PORT}/admin`);
});
