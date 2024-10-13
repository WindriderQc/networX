const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron'); // Optional: For scheduling scans

const app = express();
const PORT = 3000;
const RESULTS_FILE = 'results.csv';
const SCAN_COMMAND = 'ipscan -f:range 192.168.1.1 192.168.1.254 -o results.csv -s -q';

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for Home Page
app.get('/', (req, res) => {
    res.render('index', { currentPage: 'home' });
});

// Route for gCoder Page
app.get('/gcoder', (req, res) => {
    res.render('gcoder', { currentPage: 'gcoder' });
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

// Optional: Schedule a scan every hour
cron.schedule('0 * * * *', () => {
    exec(SCAN_COMMAND, (error, stdout, stderr) => {
        if (error) {
            console.error(`Scheduled scan error: ${error.message}`);
        } else {
            console.log('Scheduled IP scan completed successfully');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
