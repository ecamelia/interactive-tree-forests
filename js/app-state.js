const VIEW_TYPE = {
    FOREST: "forest",
    TREE: "tree"
};

const OPTION_SCOPE = {
    TREE: "tree",
    NODE: "node"
};

const svg = d3.select("#tree-view");
const tooltip = d3.select("#tooltip");
const exportSvgButton = d3.select("#export-tree-button");
const exportPngButton = d3.select("#export-tree-png");
const exportD3CodeButton = d3.select("#export-d3-code-button");
const jsonFileInput = document.getElementById("json-file-input");
const fileStatus = document.getElementById("file-status");
const maxDepthSelect = document.getElementById("max-depth-select");
const pathModeCheckbox = document.getElementById("path-mode-checkbox");
const clearPathButton = document.getElementById("clear-path-button");

const optionScopeInputs = {
    tree: document.getElementById("scope-tree"),
    node: document.getElementById("scope-node")
};

const optionInputs = {
    condition: document.getElementById("node-show-condition"),
    gini: document.getElementById("node-show-gini"),
    samples: document.getElementById("node-show-samples"),
    value: document.getElementById("node-show-value"),
    class: document.getElementById("node-show-class")
};

const detailConfig = {
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 700,
    layoutHeight: 480,
    translateX: 200,
    translateY: 80,
    textStartY: -30,
    textStep: 22
};

const overviewConfig = {
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 780,
    layoutHeight: 560,
    textStartY: -30,
    textStep: 22
};

const globalDisplayOptions = {
    condition: true,
    gini: true,
    samples: true,
    value: true,
    class: true
};

const nodeDisplayOptions = {};
const pathNodeIds = new Set();
const zoomLayer = svg.append("g");
const zoomBehavior = d3.zoom()
    .scaleExtent([0.6, 3])
    .on("zoom", function(event) {
        zoomLayer.attr("transform", event.transform);
    });

let selectedNode = null;
let currentView = VIEW_TYPE.FOREST;
let currentForest = null;
let currentTree = null;
let optionScope = OPTION_SCOPE.TREE;
let maxVisibleDepth = "all";
let pathModeEnabled = false;
