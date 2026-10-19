document.addEventListener('DOMContentLoaded', () => {
    const password = localStorage.getItem('admin_pass');
    if (!password) {
        window.location.href = '/admin';
        return;
    }

    // Load current content
    fetch('/api/content')
        .then(res => res.json())
        .then(data => {
            document.getElementById('phoneNumber').value = data.phoneNumber || '';
            document.getElementById('instagramUrl').value = data.instagramUrl || '';
            document.getElementById('heroTitleElite').value = data.heroTitleElite || '';
            document.getElementById('heroTitleNY').value = data.heroTitleNY || '';
            document.getElementById('heroDescription').value = data.heroDescription || '';
        })
        .catch(err => {
            console.error('Error loading content:', err);
            showStatus('Error loading content', true);
        });

    // Save functionality
    document.getElementById('save-btn').addEventListener('click', () => {
        const content = {
            phoneNumber: document.getElementById('phoneNumber').value,
            instagramUrl: document.getElementById('instagramUrl').value,
            heroTitleElite: document.getElementById('heroTitleElite').value,
            heroTitleNY: document.getElementById('heroTitleNY').value,
            heroDescription: document.getElementById('heroDescription').value
        };

        const saveBtn = document.getElementById('save-btn');
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, content })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showStatus(data.error, true);
                if (data.error === 'Unauthorized') {
                    localStorage.removeItem('admin_pass');
                    window.location.href = '/admin';
                }
            } else {
                showStatus('Changes saved successfully');
            }
        })
        .catch(err => {
            console.error('Error saving content:', err);
            showStatus('Error saving content', true);
        })
        .finally(() => {
            saveBtn.innerText = 'Save Changes';
            saveBtn.disabled = false;
        });
    });
});

function showStatus(msg, isError = false) {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.innerText = msg;
    statusMsg.style.color = isError ? '#ef4444' : '#10b981';
    setTimeout(() => {
        statusMsg.innerText = '';
    }, 4000);
}

function logout() {
    localStorage.removeItem('admin_pass');
    window.location.href = '/admin';
}
