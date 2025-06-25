const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from web directory
app.use(express.static(path.join(__dirname, 'web')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/appeal', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'appeal.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'admin.html'));
});

// API endpoint for bot status (optional)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Serve download page
app.get('/files', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'download.html'));
});

// Download ZIP endpoint
app.get('/download-zip', (req, res) => {
    const filePath = path.join(__dirname, 'lily-discord-bot.tar.gz');
    res.download(filePath, 'lily-discord-bot.zip', (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(404).send('File not found');
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`📝 Appeal form: http://localhost:${PORT}/appeal`);
});

module.exports = app;