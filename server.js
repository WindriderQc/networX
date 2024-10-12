const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const RESULTS_FILE = 'results.csv';
const SCAN_COMMAND = 'ipscan -f:range 192.168.1.1 192.168.1.254 -o results.csv -s -q';


// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static('public'));

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




// Route for Home Page
app.get('/', (req, res) => {
    res.render('index'); // Renders 'views/index.ejs'
});

// Route for gCoder Page
app.get('/gCoder', (req, res) => {
    res.render('gCoder'); // Renders 'views/gCoder.ejs'
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});