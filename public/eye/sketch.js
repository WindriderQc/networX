let capture;
let capturewidth = 640;    
let captureheight = 480;

let emotions = ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"];
const timeSpans = ['Minute', 'Last15Minutes', 'Last30Minutes', 'Hour', 'Day', 'Week'];
const emotionKeys = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];

// Define a fixed color palette for emotions
const emotionColors = [
    '#E2E2E2', // Neutral
    '#FF6384', // Happy
    '#36A2EB', // Sad
    '#FFCE56', // Angry
    '#4BC0C0', // Fearful
    '#9966FF', // Disgusted
    '#FF9F40'  // Surprised
];



let faceapi;


let detections = [];

// Time span data storage
let lastMinuteData = [];
let last15MinutesData = [];
let last30MinutesData = [];
let lastHourData = [];
let lastDayData = [];
let lastWeekData = [];

// Frequency of updates in milliseconds (1000ms = 1 second)
const updateFrequency = 1000; // Change this value for different frequencies




   // Sample emotion data
   const emotionData = [
    { timestamp: '2024-10-01', emotions: { joy: 5, sadness: 2, anger: 3 } },
    { timestamp: '2024-10-02', emotions: { joy: 7, sadness: 1, anger: 4 } },
   
    // Add more entries as needed
];


// Extract timestamps and emotion keys
const timestamps = emotionData.map(data => data.timestamp);
//const emotionKeys = Object.keys(emotionData[0].emotions);

// Prepare datasets for each emotion key
const datasets = emotionKeys.map(emotionKey => {
    return {
        label: emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1), // Capitalize the label
        data: emotionData.map(data => data.emotions[emotionKey]),
        fill: false, // Set to true if you want to fill under the line
        borderColor: getRandomColor(), // Random color for each emotion
        tension: 0.1 // Adjust tension for smoother curves
    };
});

// Function to get a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


// Variables to store Chart.js instances
let chartLastMinute, chartLast15Minutes, chartLast30Minutes, chartLastHour, chartLastDay, chartLastWeek, timeline;

let captureRunning = true; // Capture state

function setup() {
  let canvas = createCanvas(capturewidth, captureheight);
  canvas.parent('sketch-holder');
  
  capture = createCapture(VIDEO);
  capture.size(capturewidth, captureheight);
  capture.hide();
  
  const faceOptions = { withLandmarks: true, withExpressions: true, withDescriptors: false };
  faceapi = ml5.faceApi(capture, faceOptions, faceReady);

  // Create the initial charts
  chartLastMinute = createEmotionChart('emotionChartLastMinute', [0, 0, 0, 0, 0, 0, 0], 'Last Minute', chartLastMinute);
  chartLast15Minutes = createEmotionChart('emotionChartLast15Minutes', [0, 0, 0, 0, 0, 0, 0], 'Last 15 Minutes', chartLast15Minutes);
  chartLast30Minutes = createEmotionChart('emotionChartLast30Minutes', [0, 0, 0, 0, 0, 0, 0], 'Last 30 Minutes', chartLast30Minutes);
  chartLastHour = createEmotionChart('emotionChartLastHour', [0, 0, 0, 0, 0, 0, 0], 'Last Hour', chartLastHour);
  chartLastDay = createEmotionChart('emotionChartLastDay', [0, 0, 0, 0, 0, 0, 0], 'Last Day', chartLastDay);
  chartLastWeek = createEmotionChart('emotionChartLastWeek', [0, 0, 0, 0, 0, 0, 0], 'Last Week', chartLastWeek);

  // Add start/stop button
  let button = createButton('Stop Camera');
  button.position(10, height + 10);
  button.mousePressed(toggleCapture);


  timeline = createTimeline();



}


function createTimeline() {
    const canvasElement = document.getElementById("emotionTimeline");

    if (!canvasElement) {
        console.error(`Canvas with id emotionTimeline not found.`);
        return;
    }

    canvasElement.height = 140;
    const ctx = canvasElement.getContext('2d');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Start with an empty label array
            datasets: emotionKeys.map((emotionKey, index) => {
                return {
                    label: emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1),
                    data: emotionData.map(data => data.emotions[emotionKey]),
                    fill: false,
                    borderColor: emotionColors[index], // Use fixed colors
                    tension: 0.1
                };
            })
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 20 // Limit number of ticks on x-axis
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Emotion Level'
                    },
                    min: 0,
                    max: 100 // Adjust max value based on your data
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}



function faceReady() {
  faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  
  detections = result;
  let currentTime = Date.now();


  if (detections.length > 0) {
    for (let i = 0; i < detections.length; i++) {
      let expressionData = {
        time: currentTime,
        emotions: { ...detections[i].expressions }
      };
      
      updateEmotionData(expressionData);
    }
  }

  if (captureRunning) {
    faceapi.detect(gotFaces); // Continuously detect faces if the capture is running
  }
}


function shouldRecordData(freqms = 4000) {
    // Example logic: Record every 5 seconds (5000 ms)
    return (Date.now() % freqms < 100); // Adjust as needed

    /*if (frameCount % 20 === 0) { // Only record every third frame
        return true;
    }
    return false;*/
}

function updateEmotionData(expressionData) {
    const currentTime = Date.now();

    // Filter out old data for each time span
    lastMinuteData = lastMinuteData.filter(d => currentTime - d.time <= 60000); // 1 minute
    last15MinutesData = last15MinutesData.filter(d => currentTime - d.time <= 900000); // 15 minutes
    last30MinutesData = last30MinutesData.filter(d => currentTime - d.time <= 1800000); // 30 minutes
    lastHourData = lastHourData.filter(d => currentTime - d.time <= 3600000); // 1 hour
    lastDayData = lastDayData.filter(d => currentTime - d.time <= 86400000); // 1 day
    lastWeekData = lastWeekData.filter(d => currentTime - d.time <= 604800000); // 1 week

    // Add new data to each time span
    lastMinuteData.push(expressionData);
    last15MinutesData.push(expressionData);
    last30MinutesData.push(expressionData);
    lastHourData.push(expressionData);
    lastDayData.push(expressionData);
    lastWeekData.push(expressionData);



    // Add logic to decide whether to record the data
    const recordData = shouldRecordData(); 
    // Add point to timeline every second
    if (timeline && recordData) {
        const emotionValues = emotionKeys.map(emotion => expressionData.emotions[emotion]);
        const timestamp = new Date(currentTime).toLocaleTimeString(); // Format the current time

        // Add new point to timeline
        timeline.data.labels.push(timestamp);
        emotionKeys.forEach((emotionKey, index) => {
            if (!timeline.data.datasets[index]) {
                timeline.data.datasets[index] = { ...datasets[index] }; // Create dataset if it doesn't exist
            }
            timeline.data.datasets[index].data.push((emotionValues[index]*100).toFixed(2));
        });

        // Limit the number of points shown on the timeline
        if (timeline.data.labels.length > 60) { // Keep only last 60 seconds
            timeline.data.labels.shift();
            emotionKeys.forEach((emotionKey, index) => {
                timeline.data.datasets[index].data.shift();
            });
        }

        timeline.update(); // Refresh the chart
    }

    // Update charts and stats
    updateCharts();
    updateTopStats();
}


function draw() {
  background(0);
  image(capture, 0, 0, capturewidth, captureheight);

  if (detections.length > 0) {
    detections.forEach(detection => {
      let points = detection.landmarks.positions;
      fill('green');
      points.forEach(point => {
        circle(point._x, point._y, 5);
      });

      // Display emotion levels
      emotionKeys.forEach((emotion, index) => {
        let emotionLevel = detection.expressions[emotion];
        text(`${emotion}: ${nf(emotionLevel * 100, 2, 1)}%`, 40, 30 + 30 * index);
        rect(40, 30 + 30 * index, emotionLevel * 100, 10);
      });
    });
  }
}

function createEmotionChart(canvasId, emotionData, label, chartInstance) {
    const canvasElement = document.getElementById(canvasId);
    
    canvasElement.height = 140;


    if (!canvasElement) {
      console.error(`Canvas with id ${canvasId} not found.`);
      return;
    }
  
    const ctx = canvasElement.getContext('2d');
    
    // Destroy existing chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }
  
    return new Chart(ctx, {
      /*type: 'bar',
      data: {
        labels: emotions,
        datasets: [{
          label: label,
          data: emotionData,
          backgroundColor: emotionKeys.map((_, i) => `rgba(${i * 30}, 99, 132, 0.2)`), // Unique colors
          borderColor: emotionKeys.map((_, i) => `rgba(${i * 30}, 99, 132, 1)`),
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }*/
        type: 'pie',
        data: {
            labels: ['Neutral', 'Happy', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised'],
            datasets: [{
                data: [
                    emotionData.neutral,
                    emotionData.happy,
                    emotionData.sad,
                    emotionData.angry,
                    emotionData.fearful,
                    emotionData.disgusted,
                    emotionData.surprised,
                ],        
                backgroundColor: emotionColors, // Use fixed colors
                hoverBackgroundColor: emotionColors, // Use same colors for hover
           
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false, // Allow custom sizing
           // borderColor: '#AF5', // Optional: color of the connector line
            layout: {
                padding: {
                    top: 10, // Adjust as necessary for spacing
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    position: 'right', // Position the legend to the right
                    labels: {
                        boxWidth: 10, // Width of the color box
                        font: {
                            size: 10, // Smaller font size
                        },
                        padding: 1 // Padding around the legend items
                    }
                },
                title: {
                    display: true,
                    text: `Emotion Distribution for the ${label}`,
                    padding:1
                },
            
                elements: {
                    arc: {
                        borderWidth: 1, // Optional: Set border width if desired
                    },
                },

                datalabels: {
                    //anchor: 'end',
                    //align: 'end',
                    formatter: (value, context) => {
                        // Show label only if slice is large enough
                        const total = context.chart.data.datasets[0].data.reduce((acc, val) => acc + val, 0);
                        const percentage = (value / total) * 100;
    
                        return percentage > 5 ? value.toFixed(0) : ''; // Adjust threshold as needed
                    },
                    /*formatter: ((context, args) => {
                        const index = args.dataIndex;
                        return args.chart.data.labels[index];
                    })*/
                    //color: 'black',
                    offset: 10, // Adjust offset for spacing
            
                    // Custom label line if slice is too small
                    line: {
                        show: true,
                        //color: '#fff', // Color of the line
                    },
                },

                

                // Explicitly set height and width here (optional)
               // aspectRatio: 1, // Set aspect ratio to make it square (if desired)
            }
        }, 
        plugins: [ChartDataLabels]
    });
  }
  

function updateChart(chartInstance, data) {
    if (chartInstance) {
      chartInstance.data.datasets[0].data = data; // Update the data in the dataset
      chartInstance.update(); // Refresh the chart
    }
}

function updateCharts() {
  const lastMinuteAverages = calculateAverageEmotion(lastMinuteData);
  const last15MinutesAverages = calculateAverageEmotion(last15MinutesData);
  const last30MinutesAverages = calculateAverageEmotion(last30MinutesData);
  const lastHourAverages = calculateAverageEmotion(lastHourData);
  const lastDayAverages = calculateAverageEmotion(lastDayData);
  const lastWeekAverages = calculateAverageEmotion(lastWeekData);

  // Prepare data for charts
  const lastMinuteDataSet = emotionKeys.map(emotion => lastMinuteAverages[emotion] * 100);
  const last15MinutesDataSet = emotionKeys.map(emotion => last15MinutesAverages[emotion] * 100);
  const last30MinutesDataSet = emotionKeys.map(emotion => last30MinutesAverages[emotion] * 100);
  const lastHourDataSet = emotionKeys.map(emotion => lastHourAverages[emotion] * 100);
  const lastDayDataSet = emotionKeys.map(emotion => lastDayAverages[emotion] * 100);
  const lastWeekDataSet = emotionKeys.map(emotion => lastWeekAverages[emotion] * 100);

  // Update the charts with the new data
  updateChart(chartLastMinute, lastMinuteDataSet);
  updateChart(chartLast15Minutes, last15MinutesDataSet);
  updateChart(chartLast30Minutes, last30MinutesDataSet);
  updateChart(chartLastHour, lastHourDataSet);
  updateChart(chartLastDay, lastDayDataSet);
  updateChart(chartLastWeek, lastWeekDataSet);
}

function calculateAverageEmotion(emotionData) {
    //console.log("Data being processed for averages: ", emotionData);
    let sum = { neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 };
    emotionData.forEach(d => {
        for (let emotion in d.emotions) {
        sum[emotion] += d.emotions[emotion];
        }
    });

    let averages = {};
    for (let emotion in sum) {
        averages[emotion] = (sum[emotion] / emotionData.length) || 0; // Avoid divide by 0
    }
    return averages;
}


function updateTopStats() {
  
    const averages = {
      Minute: calculateAverageEmotion(lastMinuteData),
      Last15Minutes: calculateAverageEmotion(last15MinutesData),
      Last30Minutes: calculateAverageEmotion(last30MinutesData),
      Hour: calculateAverageEmotion(lastHourData),
      Day: calculateAverageEmotion(lastDayData),
      Week: calculateAverageEmotion(lastWeekData),
    };
    //console.log("Averages being calculated:", averages);
    timeSpans.forEach(span => {
      emotionKeys.forEach(emotion => {

        const value = averages[span][emotion];
        const cardHTML = createCard(capitalize(emotion), value * 100); // Multiply by 100
        document.getElementById(`${emotion}${span}`).innerHTML = cardHTML;


        /*let key = `${emotion}${span}`;
        //console.log(key)
        let topStat = document.getElementById(key);
        if (topStat) {
          topStat.textContent = `${(averages[span][emotion] * 100).toFixed(2)}%`;
        }*/
      });
    });
  }
  

function toggleCapture() {
  if (captureRunning) {
    capture.stop(); // Stop the video feed
    captureRunning = false;
    this.html('Start Camera'); // Update button text
  } else {
    capture.start(); // Start the video feed
    captureRunning = true;
    this.html('Stop Camera'); // Update button text
    faceapi.detect(gotFaces); // Resume face detection
  }
}



// Helper function to create a Bootstrap card for an emotion
function createCard(emotion, value) {
    return` 
      <div class="card text-center mx-1 mb-2 p-0">
        <div class="card-header p-1 m-0 text-truncate" style="font-size: 0.8rem;">
          ${emotion}
        </div>
        <div class="card-body p-0">
          <h5 class="card-title" style="font-size: 0.9rem;">${value.toFixed(2)}%</h5>
        </div>
      </div>`
    ;
  }


// Capitalize the first letter of each emotion
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  




