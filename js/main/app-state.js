// Les deux types de donnees que l'outil peut afficher.
const VIEW_TYPE = {
    FOREST: "forest",
    TREE: "tree"
};

// Indique si les options modifient tout l'arbre ou seulement un noeud.
const OPTION_SCOPE = {
    TREE: "tree",
    NODE: "node"
};

// Elements HTML utilises par les differents modules.
const svg = d3.select("#tree-view");
const tooltip = d3.select("#tooltip");
const emptyState = document.getElementById("empty-state");
const exportSvgButton = d3.select("#export-tree-button");
const exportPngButton = d3.select("#export-tree-png");
const exportD3CodeButton = d3.select("#export-d3-code-button");
const zoomOutButton = document.getElementById("zoom-out-button");
const zoomInButton = document.getElementById("zoom-in-button");
const zoomResetButton = document.getElementById("zoom-reset-button");
const zoomRangeInput = document.getElementById("zoom-range-input");
const jsonFileInput = document.getElementById("json-file-input");
const fileStatus = document.getElementById("file-status");
const displayModeSelect = document.getElementById("display-mode-select");
const maxDepthInput = document.getElementById("max-depth-input");
const forestTreeLimitInput = document.getElementById("forest-tree-limit-input");
const forestTreeIndicesInput = document.getElementById("forest-tree-indices-input");
const forestTotalStatus = document.getElementById("forest-total-status");
const pathModeCheckbox = document.getElementById("path-mode-checkbox");
const clearPathButton = document.getElementById("clear-path-button");
const nodeDetailsPanel = document.getElementById("node-details-panel");
const nodeDetailsContent = document.getElementById("node-details-content");
const observationPanel = document.getElementById("observation-panel");
const observationInputs = document.getElementById("observation-inputs");
const runObservationButton = document.getElementById("run-observation-button");
const clearObservationButton = document.getElementById("clear-observation-button");
const testObservationsFileInput = document.getElementById("test-observations-file-input");
const observationResult = document.getElementById("observation-result");
const testObservationResults = document.getElementById("test-observation-results");

// Choix du niveau d'application des options d'affichage.
const optionScopeInputs = {
    tree: document.getElementById("scope-tree"),
    node: document.getElementById("scope-node")
};

// Cases qui pilotent le contenu affiche dans les noeuds.
const optionInputs = {
    condition: document.getElementById("node-show-condition"),
    gini: document.getElementById("node-show-gini"),
    samples: document.getElementById("node-show-samples"),
    value: document.getElementById("node-show-value"),
    class: document.getElementById("node-show-class")
};

// Reglages de depart pour un arbre seul.
// Ils peuvent etre agrandis automatiquement si l'arbre est plus large.
const detailConfig = {
    nodeShape: "box",
    boxWidth: 118,
    boxHeight: 62,
    layoutWidth: 460,
    layoutHeight: 300,
    translateX: 95,
    translateY: 45,
    textStartY: -24,
    textStep: 13
};

// Reglages de depart pour les arbres d'une foret.
// Le placement horizontal est gere ailleurs, car plusieurs arbres peuvent etre
// affiches cote a cote.
const overviewConfig = {
    nodeShape: "box",
    boxWidth: 118,
    boxHeight: 62,
    layoutWidth: 520,
    layoutHeight: 340,
    textStartY: -24,
    textStep: 13
};

// Affichage par defaut quand aucune personnalisation n'est appliquee
const globalDisplayOptions = {
    condition: true,
    gini: true,
    samples: true,
    value: true,
    class: true
};

// Personnalisations propres a certains noeuds.
const nodeDisplayOptions = {};

// Noeuds actuellement marques comme faisant partie du chemin.
const pathNodeIds = new Set();

// Couche qui contient le dessin. Le zoom agit sur cette couche entiere.
const zoomLayer = svg.append("g");
const zoomBehavior = d3.zoom()
    .scaleExtent([0.2, 3])
    .on("zoom", function(event) {
        zoomLayer.attr("transform", event.transform);
        updateZoomControls(event.transform.k);
    });

// Etat courant garde en memoire pendant l'utilisation.
let selectedNode = null;
let currentView = null;
let currentForest = null;
let currentTree = null;
let currentLoadedFilename = "";
let optionScope = OPTION_SCOPE.TREE;
let displayMode = "detail";
let maxVisibleDepth = null;
const defaultForestDepth = 4;
let forestTreeLimit = 3;
let forestTreeIndices = [];
let pathModeEnabled = false;
