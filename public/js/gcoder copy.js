console.log("Welcome to gCoder v0.1a")

// Check for Web Serial API support
if ("serial" in navigator) {
    console.log("Web Serial API supported.");
} else {
    alert("Web Serial API not supported by this browser. Please use Google Chrome.");
}



// Global variables to store port and reader
let port;
let reader;

// Connect to the printer on button click
document.getElementById('connectButton').addEventListener('click', connectToPrinter);

  // Send GCODE button click
document.getElementById('sendGcodeButton').addEventListener('click', async () => {
    const gcodeInput = document.getElementById('gcodeInput').value;
    await sendGcode(gcodeInput);
});



// Function to connect to the printer
async function connectToPrinter() {
    try {
        console.log('Attempting serial connection');
        port = await navigator.serial.requestPort(); // Request a port
        await port.open({ baudRate: 57600  }); // Open the port
        reader = port.readable.getReader(); // Get a reader to read responses
        console.log('Serial connection to:', port);
        // Update connection status
        document.getElementById('connectionStatus').innerText = 'Connected ';

        initializePrinterInfo();

    } catch (error) {
        console.error('Error connecting to printer:', error);
    }
}


// Function to send GCODE to the printer
async function sendGcode(gcode) {
    try {
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        const command = encoder.encode(gcode + '\n'); // Add newline for GCODE
        await writer.write(command);
        writer.releaseLock();
        
        // After sending GCODE, fetch the printer status
        await fetchPrinterStatus();
    } catch (error) {
        console.error('Error sending GCODE:', error);
    }
}

// Function to fetch printer status
async function fetchPrinterStatus() {
    try {
        // Send a command to get the status (this is device-specific)
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        const command = encoder.encode('M105\n'); // Example command to get temperature status

        await writer.write(command);
        writer.releaseLock();

        // Read the response
        const response = await reader.read();
        const decoder = new TextDecoder();
        const statusData = decoder.decode(response.value);
        console.log('Printer Status:', statusData);
        
        // Update UI with printer status
        document.getElementById('gcodeResponse').innerText = statusData; // Display response
        document.getElementById('gcodeResponse').style.display = 'block';

        // Parse statusData to update other UI elements like temperatures, status, etc.
        // Assuming statusData is formatted correctly, you would parse it here.
        // Example: if statusData is 'T:200.00 /0.00 B:60.00 /0.00', you could extract these values.
        const [hotendTemp, bedTemp] = statusData.match(/T:([\d\.]+)/)?.slice(1) || [0, 0];
        document.getElementById('hotendTemp').innerText = `${hotendTemp}°C`;
        document.getElementById('bedTemp').innerText = `${bedTemp}°C`;

    } catch (error) {
        console.error('Error fetching printer status:', error);
    }
}






function getIP() {
    sendGcode("M552 S0");
}



let inputDone;
let outputDone;
let inputStream;
let outputStream;

// Dashboard Elements
//const connectButton = document.getElementById('connectButton');
const connectionStatus = document.getElementById('connectionStatus');
const printerStatus = document.getElementById('printerStatus');
const statusIndicator = document.getElementById('statusIndicator');
const printerName = document.getElementById('printerName');
const printerIP = document.getElementById('printerIP');
const hotendTemp = document.getElementById('hotendTemp');
const bedTemp = document.getElementById('bedTemp');
const printProgressBar = document.getElementById('printProgressBar');
const printProgressText = document.getElementById('printProgressText');
const currentGcode = document.getElementById('currentGcode');

// GCODE Input Elements
const sendGcodeButton = document.getElementById('sendGcodeButton');
const gcodeInput = document.getElementById('gcodeInput');

// Premade Sequences
const premadeSequencesGroup = document.getElementById('premadeSequencesGroup');
const premadeSequences = {
    "Home All Axes": "G28",
    "Get IP": "M552 S0",
    "Start Print": "M109 S200\nM190 S60\nG92 E0\nG1 F140 E30",
    // Add more sequences as needed
};

// Custom Script Elements
const saveScriptButton = document.getElementById('saveScriptButton');
const scriptNameInput = document.getElementById('scriptName');
const scriptGcodesInput = document.getElementById('scriptGcodes');
const exportScriptsButton = document.getElementById('exportScriptsButton');
const importScriptsButton = document.getElementById('importScriptsButton');
const importFileInput = document.getElementById('importFileInput');

// Initialize Custom Scripts from localStorage
let customScripts = {};

function loadCustomScripts() {
    const savedScripts = localStorage.getItem('customScripts');
    if (savedScripts) {
        try {
            customScripts = JSON.parse(savedScripts);
        } catch (e) {
            console.error("Error parsing saved scripts:", e);
            customScripts = {};
        }
    } else {
        customScripts = {};
    }
}

function saveCustomScripts() {
    localStorage.setItem('customScripts', JSON.stringify(customScripts));
}

function createPremadeButton(name) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary premade-sequence';
    button.setAttribute('data-sequence', name);
    button.textContent = name;
    premadeSequencesGroup.appendChild(button);

    // Add event listener
    button.addEventListener('click', () => {
        const sequenceName = button.getAttribute('data-sequence');
        const commands = premadeSequences[sequenceName];
        if (commands) {
            const cmds = commands.split('\n');
            cmds.forEach(cmd => sendGcode(cmd));
            currentGcode.textContent = sequenceName;
        }
    });
}

// Load custom scripts and create buttons on page load
function initializeCustomScripts() {
    loadCustomScripts();
    for (const [name, cmds] of Object.entries(customScripts)) {
        premadeSequences[name] = cmds.join('\n'); // Merge into premadeSequences
        createPremadeButton(name);
    }
}

// Initial load
initializeCustomScripts();


/*
async function readLoop() {
    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                // Allow the serial port to be closed later.
                reader.releaseLock();
                break;
            }
            if (value) {
                handleSerialData(value);
            }
        } catch (error) {
            console.error("Read error:", error);
            break;
        }
    }
}

function handleSerialData(data) {
    const lines = data.split('\n');
    lines.forEach(line => {
        parseGcodeResponse(line.trim());
    });
}

function parseGcodeResponse(line) {
    console.log("Received:", line);

    if (line.toLowerCase().includes("ok")) {
        printerStatus.textContent = "Idle";
        statusIndicator.style.backgroundColor = "green";
    } else if (line.toLowerCase().includes("start")) {
        printerStatus.textContent = "Printing";
        statusIndicator.style.backgroundColor = "orange";
    } else if (line.startsWith("T:")) {
        const regex = /T:(\d+)\s*\/\d+\s*B:(\d+)\s*\/\d+/;
        const matches = line.match(regex);
        if (matches) {
            hotendTemp.textContent = `${matches[1]}°C`;
            bedTemp.textContent = `${matches[2]}°C`;
        }
    } else if (line.startsWith("Print Progress:")) {
        const regex = /Print Progress:\s*(\d+)%/;
        const matches = line.match(regex);
        if (matches) {
            const progress = parseInt(matches[1]);
            printProgressBar.style.width = `${progress}%`;
            printProgressText.textContent = `${progress}%`;
        }
    } else if (line.startsWith("Printer Name:")) {
        const name = line.replace("Printer Name:", "").trim();
        printerName.textContent = name;
    } else if (line.startsWith("IP Address:")) {
        const ip = line.replace("IP Address:", "").trim();
        printerIP.textContent = ip;
    }
}

async function sendGcode(command) {
    if (outputStream) {
        const writer = outputStream.getWriter();
        await writer.write(new TextEncoder().encode(`${command}\n`));
        writer.releaseLock();
        currentGcode.textContent = command;
    } else {
        alert("Serial port not connected.");
    }
}

// Event Listener for Send Button
sendGcodeButton.addEventListener('click', () => {
    const command = gcodeInput.value.trim();
    if (command) {
        sendGcode(command);
        gcodeInput.value = '';
    }
});

// Event Listener for Enter Key in GCODE Input
gcodeInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        sendGcodeButton.click();
    }
});
*/
// Attach listeners to initial premade buttons
attachPremadeButtonListeners();

function attachPremadeButtonListeners() {
    const existingButtons = document.querySelectorAll('.premade-sequence');
    existingButtons.forEach(button => {
        button.removeEventListener('click', handlePremadeButtonClick); // Prevent duplicate listeners
        button.addEventListener('click', handlePremadeButtonClick);
    });
}

function handlePremadeButtonClick(event) {
    const button = event.currentTarget;
    const sequenceName = button.getAttribute('data-sequence');
    const commands = premadeSequences[sequenceName];
    if (commands) {
        const cmds = commands.split('\n');
        cmds.forEach(cmd => sendGcode(cmd));
        currentGcode.textContent = sequenceName;
    }
}

// Event Listeners for Custom Scripts
saveScriptButton.addEventListener('click', () => {
    const scriptName = scriptNameInput.value.trim();
    const scriptGcodes = scriptGcodesInput.value.trim();

    if (!scriptName) {
        alert("Please enter a script name.");
        return;
    }

    if (!scriptGcodes) {
        alert("Please enter GCODE commands.");
        return;
    }

    if (premadeSequences.hasOwnProperty(scriptName)) {
        if (!confirm("A script with this name already exists. Overwrite?")) {
            return;
        }
    }

    const commands = scriptGcodes.split('\n').map(cmd => cmd.trim()).filter(cmd => cmd);
    premadeSequences[scriptName] = commands.join('\n');
    customScripts[scriptName] = commands;

    saveCustomScripts();
    createPremadeButton(scriptName);
    scriptNameInput.value = '';
    scriptGcodesInput.value = '';
});

// Event Listener for Export Scripts
exportScriptsButton.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customScripts));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "customScripts.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

// Event Listener for Import Scripts
importScriptsButton.addEventListener('click', () => {
    importFileInput.click();
});

// Event Listener for Import File
importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedScripts = JSON.parse(event.target.result);
                for (const [name, cmds] of Object.entries(importedScripts)) {
                    premadeSequences[name] = cmds.join('\n'); // Merge into premadeSequences
                    createPremadeButton(name);
                }
                customScripts = { ...customScripts, ...importedScripts }; // Keep existing scripts and add new
                saveCustomScripts();
            } catch (e) {
                alert("Error importing scripts: " + e);
            }
        };
        reader.readAsText(file);
    }
});

// Fetch Cron Tasks - Example implementation
async function fetchCronTasks() {
    try {
        const response = await fetch('/cron'); // Adjust this endpoint based on your server setup
        if (!response.ok) throw new Error('Network response was not ok');
        const tasks = await response.json();
        console.log("Cron Tasks:", tasks);
        // Update the UI or handle tasks as needed
    } catch (error) {
        console.error("Error fetching cron tasks:", error);
    }
}

// Call fetchCronTasks every 10 seconds
//setInterval(fetchCronTasks, 10000);
//fetchCronTasks()

// Fetch Printer Status periodically (optional)
async function initializePrinterInfo() {
    fetchPrinterStatus(); // Initial call
    setInterval(fetchPrinterStatus, 30000); // Repeat every 30 seconds
}
