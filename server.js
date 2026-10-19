const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const ADMIN_PASSWORD = 'admin123'; // Hardcoded for Phase 1

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve Admin Pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// API Routes
app.get('/api/content', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read content' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/content', (req, res) => {
    const { password, content } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    fs.writeFile(DATA_FILE, JSON.stringify(content, null, 2), (err) => {
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
