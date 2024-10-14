console.log("Welcome to gCoder v0.1")

// Check for Web Serial API support
if ("serial" in navigator) {
    console.log("Web Serial API supported.");
} else {
    alert("Web Serial API not supported by this browser. Please use Google Chrome.");
}

// Global variables to store port and reader
let port;
let reader;

// Dashboard Elements
const connectButton = document.getElementById('connectButton');
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
const gcodeResponse = document.getElementById('gcodeResponse');

// GCODE Input Elements
const sendGcodeButton = document.getElementById('sendGcodeButton');
const gcodeInput = document.getElementById('gcodeInput');


// Premade Sequences
const premadeSequencesGroup = document.getElementById('premadeSequencesGroup');
const premadeSequences = {
    "Home All Axes": "G28",
    "Get IP": "M552",
    "Start Print": "M109 S200\nM190 S60\nG92 E0\nG1 F140 E30",
    "Basic Status": "M408",
    "Detailed Status": "M408 S3"
    // Add more sequences as needed
};



// Function to dynamically create buttons
function createPremadeSequenceButtons() {
    for (const [label, command] of Object.entries(premadeSequences)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('btn', 'btn-secondary', 'premade-sequence');
        button.dataset.sequence = label; // Set the label as the data attribute
        button.textContent = label; // Set the button text to the label
        
        // Append the button to the div
        premadeSequencesGroup.appendChild(button);
        
        // Optional: Add event listener for handling button click
        button.addEventListener('click', () => {
            console.log(`Executing command for ${label}: ${command}`);
            // Add your code here to send the G-code command to the printer
            // For example, send the `command` string to the printer via serial
        });
    }
}

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
        console.log("Premade button clicked: ", commands )
        const cmds = commands.split('\n');
        cmds.forEach(async (cmd) => await sendGcode(cmd));
        currentGcode.textContent = sequenceName;
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
        
    } catch (error) {
        console.error('Error sending GCODE:', error);
        alert("Serial port may not be not connected?");
    }
}


async function readLoop() {
    let buffer = '';

    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            if (value) {
                // Convert Uint8Array to a string and add it to the buffer
                const textDecoder = new TextDecoder();
                buffer += textDecoder.decode(value, { stream: true });

                // Split the buffer into lines and process complete lines
                let lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the last partial line in the buffer
                
                lines.forEach(line => {
                    parseGcodeResponse(line.trim());
                });
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
   
        // Handle specific string responses if needed


        if (line.startsWith("{")) {
            try {
                const jsonResponse = JSON.parse(line);

                // Now you can access properties directly from jsonResponse
                if (jsonResponse.name) {
                    // Update printer name
                    printerName.textContent = jsonResponse.name;

                    // Update the dashboard header with the printer name
                    document.getElementById('dashboard').querySelector('.card-header').textContent = `${jsonResponse.name} Dashboard`;
                }

                if (jsonResponse.temps) {
                    // Access temperature data
                    const activeToolTemp = jsonResponse.temps.current[0];
                    const bedTempValue = jsonResponse.temps.bed.current;
                    hotendTemp.textContent = `${activeToolTemp}°C`;
                    bedTemp.textContent = `${bedTempValue}°C`;
                }

                if (jsonResponse.status && jsonResponse.status.toLowerCase() === 'o') {
                    printerStatus.textContent = "Idle";
                    statusIndicator.classList.add("bg-success");
                }
                
            } catch (error) {  console.log("Error parsing JSON response:", error);   }
        }
        else if (line.startsWith("ok T:")) {
            // Temperature status response
            const regex = /ok T:(\d+\.\d+)\s*\/\d+\.\d+\s*T0:\d+\.\d+\s*\/\d+\.\d+\s*B:(\d+\.\d+)\s*\/\d+\.\d+/;
            const matches = line.match(regex);
            if (matches) {
                hotendTemp.textContent = `${matches[1]}°C`;
                bedTemp.textContent = `${matches[2]}°C`;
            }
        } else if (line.includes("IP address")) {
            // Extract IP address
            const regex = /IP address (\d+\.\d+\.\d+\.\d+)/;
            const matches = line.match(regex);
            if (matches) {
                const ipAddress = matches[1];
                console.log("IP Address:", ipAddress);
                printerIP.textContent = ipAddress;
            }
        } else if (line.startsWith("Print Progress:")) {
            // Extract print progress percentage
            const regex = /Print Progress:\s*(\d+)%/;
            const matches = line.match(regex);
            if (matches) {
                const progress = parseInt(matches[1]);
                printProgressBar.style.width = `${progress}%`;
                printProgressText.textContent = `${progress}%`;
            }
        } else if (line.toLowerCase().includes("ok")) {
            // General "ok" response
            printerStatus.textContent = "Idle";
            statusIndicator.classList.add("bg-success");
        } else if (line.startsWith("")){
            console.log();
        }
        else {
            console.log("Received:", line);
        }
    
}






// Connect to the printer on button click
connectButton.addEventListener('click', connectToPrinter);
// Event Listener for Send GCODE button click
sendGcodeButton.addEventListener('click', async () => {
    const command = gcodeInput.value.trim();
    if (command) {
        await sendGcode(command);
        gcodeInput.value = '';
    }
});
// Event Listener for Enter Key in GCODE Input
gcodeInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        sendGcodeButton.click();
    }
});



// Function to fetch printer status
async function fetchPrinterStatus() {
    try {
        //await sendGcode('M105\n');
       // await sendGcode('M552\n');
       // await sendGcode('M587\n');
        await sendGcode('M408 S3\n');
       
    } catch (error) {
        console.error('Error fetching printer status:', error);
    }
}



// Function to connect to the printer
async function connectToPrinter() {
    try {
        console.log('Attempting serial connection');
        port = await navigator.serial.requestPort(); // Request a port
        await port.open({ baudRate: 57600  }); // Open the port
        reader = port.readable.getReader(); // Get a reader to read responses
        console.log('Serial connection to:', port);
        // Update connection status
        connectionStatus.innerText = 'Connected ';
        printerStatus.innerText = 'Connected ';
        // Remove the 'bg-danger' class and add the 'bg-success' class
        switchClass(statusIndicator,"bg-danger","bg-success");
        // Disable the button
        connectButton.disabled = true;

        // Call the function to create the buttons
        createPremadeSequenceButtons();
        // Attach listeners to initial premade buttons
        attachPremadeButtonListeners();

        fetchPrinterStatus(); setInterval(fetchPrinterStatus, 5000);

        readLoop();

    } catch (error) {
        console.error('Error connecting to printer:', error);
    }
}















// TOOLS
function switchClass(element, oldClass, newClass) {
    element.classList.remove(oldClass);
    element.classList.add(newClass);
}
