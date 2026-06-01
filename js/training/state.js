// Etat de la page
const trainingState = {
    points: [],
    forest: [],
    seed: 11,
    playing: false,
    playTimer: null,
    pendingForest: null,
    featureNames: ["x1", "x2"],
    classes: [0, 1]
};

// Elements HTML utilises par la page
const datasetSelect = document.getElementById("training-dataset-select");
const pointCountInput = document.getElementById("training-point-count");
const noiseInput = document.getElementById("training-noise-input");
const treeCountInput = document.getElementById("training-tree-count");
const maxDepthInput = document.getElementById("training-max-depth");
const minSamplesInput = document.getElementById("training-min-samples");
const bootstrapRatioInput = document.getElementById("training-bootstrap-ratio");
const jsonFileInput = document.getElementById("training-json-file-input");
const regenerateButton = document.getElementById("training-regenerate-data");
const trainButton = document.getElementById("training-run");
const resetButton = document.getElementById("training-reset");
const playButton = document.getElementById("training-play");
const stepButton = document.getElementById("training-step");
const epochText = document.getElementById("training-epoch");
const agreementText = document.getElementById("training-agreement");
const accuracyText = document.getElementById("training-accuracy");
const statusText = document.getElementById("training-status");
const mapSvg = d3.select("#training-decision-map");
const treeMapsContainer = document.getElementById("training-tree-maps");

// Dimensions du graphique principal.
const mapConfig = {
    margin: { top: 22, right: 24, bottom: 46, left: 52 },
    width: 620,
    height: 520,
    gridSize: 90
};
