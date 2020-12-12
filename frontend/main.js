// Our input frames will come from here.
const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const controlsElement = document.getElementsByClassName("control-panel")[0];
const actionsElement = document.getElementsByClassName("actions")[0];
const canvasCtx = canvasElement.getContext("2d");

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector(".loading");
spinner.ontransitionend = () => {
  spinner.style.display = "none";
};

let lastYVal = null;
let isLastActionRecent = false;
let isLastToggleRecent = false;
const difference = (a, b) => a - b;

const debounce = (func, wait, immediate) => {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const logAction = (action) => {
  const tag = document.createElement("p");
  const text = document.createTextNode(action);

  tag.appendChild(text);
  actionsElement.append(tag);
  actionsElement.scrollTop = actionsElement.scrollHeight;
};

const toggle = () => {
  if (isLastToggleRecent) {
    return;
  }

  isLastToggleRecent = true;

  fetch("/api/toggle/", {
    method: "POST",
  });

  setTimeout(() => {
    isLastToggleRecent = false;
  }, 1000);

  logAction("toogle");
};

const changeLight = (diff) => {
  if (isLastActionRecent) {
    return;
  }

  isLastActionRecent = true;
  const action = diff > 0 ? "up" : "down";

  fetch("/api/bright/", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action }),
  });

  setTimeout(() => {
    isLastActionRecent = false;
  }, 1500);
  logAction(action);
};

const movingDirection = (landmarks) => {
  const currentValue = landmarks[0].y;
  const diff = difference(lastYVal, currentValue);
  if (!lastYVal || (Math.abs(diff) > 0.1 && Math.abs(diff) < 0.6)) {
    lastYVal = currentValue;
    changeLight(diff);
  }
};

const onResults = (results) => {
  // Hide the spinner.
  document.body.classList.add("loaded");

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === "Right";
      const landmarks = results.multiHandLandmarks[index];
      movingDirection(landmarks);

      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: isRightHand ? "#00FF00" : "#FF0000",
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: isRightHand ? "#00FF00" : "#FF0000",
        fillColor: isRightHand ? "#FF0000" : "#00FF00",
      });
    }
  }
  canvasCtx.restore();
};

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
  },
});
hands.onResults(onResults);

/**
 * Instantiate a camera. We'll feed each frame we receive into the solution.
 */
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
  selfieMode: true,
  maxNumHands: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
})
  .add([
    new StaticText({ title: "MediaPipe Hands" }),
    fpsControl,
    new Toggle({ title: "Selfie Mode", field: "selfieMode" }),
    new Slider({
      title: "Max Number of Hands",
      field: "maxNumHands",
      range: [1, 4],
      step: 1,
    }),
    new Slider({
      title: "Min Detection Confidence",
      field: "minDetectionConfidence",
      range: [0, 1],
      step: 0.01,
    }),
    new Slider({
      title: "Min Tracking Confidence",
      field: "minTrackingConfidence",
      range: [0, 1],
      step: 0.01,
    }),
  ])
  .on((options) => {
    videoElement.classList.toggle("selfie", options.selfieMode);
    hands.setOptions(options);
  });

// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands
//model
const URL = "http://" + window.location.host + "/teachablemachine/";

async function createModel() {
  const checkpointURL = URL + "model.json"; // model topology
  const metadataURL = URL + "metadata.json"; // model metadata

  const recognizer = speechCommands.create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    checkpointURL,
    metadataURL
  );

  // check that model and metadata are loaded via HTTPS requests.
  await recognizer.ensureModelLoaded();

  return recognizer;
}

async function init() {
  const recognizer = await createModel();
  const classLabels = recognizer.wordLabels(); // get class labels

  // listen() takes two arguments:
  // 1. A callback function that is invoked anytime a word is recognized.
  // 2. A configuration object with adjustable fields
  recognizer.listen(
    (result) => {
      const scores = result.scores; // probability of prediction for each class
      // render the probability scores per class
      for (let i = 0; i < classLabels.length; i++) {
        if (classLabels[i] === "snap" && result.scores[i] > 0.5) {
          toggle();
        }
      }
    },
    {
      includeSpectrogram: true, // in case listen should return result.spectrogram
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5, // probably want between 0.5 and 0.75. More info in README
    }
  );
}

init();
