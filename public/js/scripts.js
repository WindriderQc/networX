// public/js/scripts.js

function init() {
    console.log("Initialization started"); // Debugging
    //launchScan()
}

async function launchScan() {

    fetch('/scan')
      .then(response => {
        console.log("Received response from /scan"); // Debugging
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(csvText => {
        //console.log("CSV Text Received:", csvText); // Debugging
        let parsedData = Papa.parse(csvText, { header: true });
        console.log("Parsed Data:", parsedData);  // Debugging
        displaySummary(parsedData.data);
        displayData(parsedData.data);
      })
      .catch(error => {
        console.error('Error fetching CSV:', error);
        document.getElementById('summary').innerHTML = `<div class="alert alert-danger" role="alert">
          Failed to load network scan results.
        </div>`;
      });

}


function displaySummary(table) {
    let connectedDevices = 0;
    let openPorts = new Set();

    table.forEach(row => {
      if (row['IP'] && row['Ping'] !== '[n/a]') {
        connectedDevices++;
        if (row['Ports'] && row['Ports'] !== '[n/s]') {
          row['Ports'].split('.').forEach(port => {
            if (port.trim() !== '[n/a]') {
              openPorts.add(port.trim());
            }
          });
        }
      }
    });

    let summaryContent = `
      <p><strong>Number of Devices Connected:</strong> ${connectedDevices}</p>
      <p><strong>List of Opened Ports:</strong> ${Array.from(openPorts).join(', ')}</p>
    `;

    document.getElementById('summary').innerHTML = summaryContent;
}

function displayData(table) {
    if (table.length === 0) {
      document.getElementById('results').innerHTML = `<div class="alert alert-info" role="alert">
        No scan results to display.
      </div>`;
      return;
    }

    let htmlContent = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>IP Address</th>
            <th>Ping</th>
            <th>Hostname</th>
            <th>Ports</th>
          </tr>
        </thead>
        <tbody>
    `;

    table.forEach(row => {
      //console.log(row);  // Debugging: Log each row
      if (row['IP'] && row['Ping'] !== '[n/a]') {  // Check for valid IP and Ping
        htmlContent += `
          <tr>
            <td>${row['IP']}</td>
            <td>${row['Ping']}</td>
            <td>${row['Hostname']}</td>
            <td>${row['Ports']}</td>
          </tr>
        `;
      }
    });

    htmlContent += `
        </tbody>
      </table>
    `;

    document.getElementById('results').innerHTML = htmlContent;
}

// Initialize the setup function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
