const https = require('https');
const fs = require('fs');
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');


const app = express();
const PORT = 3000;
const HTTPS_PORT = 3443;
const RESULTS_FILE = 'results.csv';
const SCAN_COMMAND = 'ipscan -f:range 192.168.1.1 192.168.1.254 -o results.csv -s -q';

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(cors());

// SSL certificate and key files
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

// HTTPS server
https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running on https://localhost:${HTTPS_PORT}`);
});

// Your existing routes and other Express.js logic...

// Route for Home Page
app.get('/', (req, res) => {
    console.log("GET request received at /");
    res.render('index', { currentPage: 'home' });
});

// Route for gCoder Page
app.get('/gcoder', (req, res) => {
    res.render('gcoder', { currentPage: 'gcoder' });
});

// Route to get cron tasks
app.get('/cron', (req, res) => {
    res.json(cronTasks);
});

// Route to perform IP scan and serve results
app.get('/scan', (req, res) => {
    const filePath = path.join(__dirname, RESULTS_FILE);
    const fileAgeLimit = 60 * 60 * 1000; // 1 hour in milliseconds

    fs.stat(filePath, (err, stats) => {
        if (err || (Date.now() - stats.mtimeMs) > fileAgeLimit) {
            exec(SCAN_COMMAND, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing scan: ${error.message}`);
                    return res.status(500).send('Error executing scan');
                }
                res.sendFile(filePath);
            });
        } else {
            res.sendFile(filePath);
        }
    });
});

// Regular HTTP server to redirect to HTTPS (optional)
app.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
    console.log(`Redirecting to HTTPS on https://localhost:${HTTPS_PORT}`);
});
