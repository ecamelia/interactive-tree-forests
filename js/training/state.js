// Etat partage par les fichiers de la page
const trainingState = {
    points: [],
    forest: [],
    seed: 11,
    playing: false,
    playTimer: null,
    pendingForest: null,
    libraryModel: null,
    libraryTreeCount: 0,
    libraryClassifier: null,
    libraryLoading: false,
    libraryTraining: false,
    datasetSourcePoints: {},
    datasetDisplayPoints: [],
    featureNames: ["x1", "x2"],
    modelFeatureNames: ["x1", "x2"],
    classes: [0, 1]
};

// Elements de l'interface
const datasetSelect = document.getElementById("training-dataset-select");
const pointCountInput = document.getElementById("training-point-count");
const noiseInput = document.getElementById("training-noise-input");
const treeCountInput = document.getElementById("training-tree-count");
const engineSelect = document.getElementById("training-engine-select");
const maxDepthInput = document.getElementById("training-max-depth");
const minSamplesInput = document.getElementById("training-min-samples");
const bootstrapRatioInput = document.getElementById("training-bootstrap-ratio");
const jsonFileInput = document.getElementById("training-json-file-input");
const trainingFileStatus = document.getElementById("training-file-status");
const regenerateButton = document.getElementById("training-regenerate-data");
const trainButton = document.getElementById("training-run");
const resetButton = document.getElementById("training-reset");
const playButton = document.getElementById("training-play");
const stepButton = document.getElementById("training-step");
const stepLabel = document.getElementById("training-step-label");
const epochText = document.getElementById("training-epoch");
const agreementText = document.getElementById("training-agreement");
const accuracyText = document.getElementById("training-accuracy");
const statusText = document.getElementById("training-status");
const mapSvg = d3.select("#training-decision-map");
const treeMapsContainer = document.getElementById("training-tree-maps");
const mapTitle = document.getElementById("training-map-title");
const sideTitle = document.getElementById("training-side-title");

// Dimensions du graphique principal
const mapConfig = {
    margin: { top: 26, right: 28, bottom: 54, left: 62 },
    width: 820,
    height: 680,
    gridSize: 110
};
