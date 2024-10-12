let faceapi;
let detections = [];
let isDetecting = false;

const emotionMap = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '🤢',
  surprised: '😲'
};

const videoElement = document.getElementById('video');
const overlay = document.getElementById('overlay');
const emotionDisplay = document.getElementById('emotion');
const confidenceDisplay = document.getElementById('confidence');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const canvas = overlay.getContext('2d');

// Initialize webcam
async function setupWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 },
      audio: false
    });
    videoElement.srcObject = stream;
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
  } catch (err) {
    alert('Error accessing webcam: ' + err);
  }
}

// Initialize Face API
async function initializeFaceAPI() {
  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: false,
    minConfidence: 0.4
  };
  faceapi = await ml5.faceApi(videoElement, faceOptions, modelReady);
}

// Model Ready Callback
function modelReady() {
  console.log('FaceAPI model loaded!');
}

// Detect Faces and Emotions
function detect() {
  if (isDetecting) {
    faceapi.detect(gotResults);
  }
}

// Handle Detection Results
function gotResults(err, result) {
  if (err) {
    console.error(err);
    return;
  }

  detections = result;

  // Clear canvas
  canvas.clearRect(0, 0, overlay.width, overlay.height);

  if (detections && detections.length > 0) {
    detections.forEach((detection) => {
      // Draw facial landmarks
      drawLandmarks(detection);

      // Get dominant emotion
      const expressions = detection.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const [emotion, confidence] = sorted[0];

      // Update UI
      emotionDisplay.innerHTML = `${emotionMap[emotion] || '🤔'} ${capitalize(emotion)}`;
      confidenceDisplay.innerHTML = `Confidence: ${(confidence * 100).toFixed(2)}%`;
      document.body.style.backgroundColor = getEmotionColor(emotion);
    });
  } else {
    emotionDisplay.innerHTML = '--';
    confidenceDisplay.innerHTML = 'Confidence: --';
    document.body.style.backgroundColor = '#f0f4f8'; // Original background color
  }

  // Continue detection with throttling
  setTimeout(() => detect(), 200); // Detect every 200ms
}

// Draw Facial Landmarks on Canvas
function drawLandmarks(detection) {
  const { landmarks } = detection;
  canvas.strokeStyle = '#00FF00';
  canvas.lineWidth = 2;

  landmarks.positions.forEach((position) => {
    canvas.beginPath();
    canvas.arc(position._x, position._y, 2, 0, 2 * Math.PI);
    canvas.stroke();
  });
}

// Capitalize Function
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Map Emotions to Colors
function getEmotionColor(emotion) {
  const colorMap = {
    neutral: '#808080',
    happy: '#FFD700',
    sad: '#1E90FF',
    angry: '#FF4500',
    fearful: '#8A2BE2',
    disgusted: '#228B22',
    surprised: '#FF69B4'
  };
  return colorMap[emotion] || '#FFFFFF';
}

// Start Detection
startButton.addEventListener('click', () => {
  if (!isDetecting) {
    isDetecting = true;
    detect();
  }
});

// Stop Detection
stopButton.addEventListener('click', () => {
  isDetecting = false;
  emotionDisplay.innerHTML = '--';
  confidenceDisplay.innerHTML = 'Confidence: --';
  canvas.clearRect(0, 0, overlay.width, overlay.height);
  document.body.style.backgroundColor = '#f0f4f8'; // Reset to original color
});

// Initialize the app
async function init() {
  await setupWebcam();
  await initializeFaceAPI();
}

init();
