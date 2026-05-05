// Types de visualisation disponibles.
const VIEW_TYPE = {
    FOREST: "forest",
    TREE: "tree"
};

// Portee des options d'affichage.
const OPTION_SCOPE = {
    TREE: "tree",
    NODE: "node"
};

// Elements principaux de l'interface.
const svg = d3.select("#tree-view");
const tooltip = d3.select("#tooltip");
const exportSvgButton = d3.select("#export-tree-button");
const exportPngButton = d3.select("#export-tree-png");
const exportD3CodeButton = d3.select("#export-d3-code-button");
const jsonFileInput = document.getElementById("json-file-input");
const fileStatus = document.getElementById("file-status");
const maxDepthSelect = document.getElementById("max-depth-select");
const displayModeSelect = document.getElementById("display-mode-select");
const pathModeCheckbox = document.getElementById("path-mode-checkbox");
const clearPathButton = document.getElementById("clear-path-button");

// Choix entre options globales et options par noeud.
const optionScopeInputs = {
    tree: document.getElementById("scope-tree"),
    node: document.getElementById("scope-node")
};

// Cases correspondant aux informations visibles dans les noeuds.
const optionInputs = {
    condition: document.getElementById("node-show-condition"),
    gini: document.getElementById("node-show-gini"),
    samples: document.getElementById("node-show-samples"),
    value: document.getElementById("node-show-value"),
    class: document.getElementById("node-show-class")
};

// Configuration de base pour un arbre seul.
// Le layout automatique peut agrandir ces dimensions si l'arbre contient
// beaucoup de feuilles.
const detailConfig = {
    nodeShape: "box",
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 700,
    layoutHeight: 480,
    translateX: 200,
    translateY: 80,
    textStartY: -30,
    textStep: 22
};

// Configuration de base pour les arbres d'une foret.
// Contrairement a detailConfig, le placement horizontal est gere par renderer.js : 
// plusieurs arbres peuvent etre affiches cote a cote.
const overviewConfig = {
    nodeShape: "box",
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 780,
    layoutHeight: 560,
    textStartY: -30,
    textStep: 22
};

// Options appliquees par defaut a tous les noeuds.
const globalDisplayOptions = {
    condition: true,
    gini: true,
    samples: true,
    value: true,
    class: true
};

// Options personnalisees pour certains noeuds.
const nodeDisplayOptions = {};

// Noeuds appartenant au chemin colore.
const pathNodeIds = new Set();

// Groupe SVG qui recoit le zoom et le deplacement.
// Tous les elements dessines sont places dans ce groupe pour appliquer une
// seule transformation D3 a toute la visualisation.
const zoomLayer = svg.append("g");
const zoomBehavior = d3.zoom()
    .scaleExtent([0.6, 3])
    .on("zoom", function(event) {
        zoomLayer.attr("transform", event.transform);
    });

// Etat courant de l'application.
let selectedNode = null;
let currentView = null;
let currentForest = null;
let currentTree = null;
let optionScope = OPTION_SCOPE.TREE;
let maxVisibleDepth = "all";
let displayMode = "detail";
let pathModeEnabled = false;
