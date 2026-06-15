// Demarrage de l'application.
startApp();

function startApp() {
    // On prepare les controles avant d'afficher l'ecran d'accueil.
    svg.call(zoomBehavior);
    setupEvents();
    updateZoomControls(1);
    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
    syncNodeDetailsPanelWithSelection();
    showEmptyState();
}

// Lie les boutons et menus HTML aux actions JavaScript.
function setupEvents() {
    jsonFileInput.addEventListener("change", handleJsonFile);

    exportSvgButton.on("click", function() {
        exportSVG();
    });

    exportPngButton.on("click", function() {
        exportPNG();
    });

    exportD3CodeButton.on("click", function(){
        handleD3CodeExport();
    });

    setupZoomControls();

    forestTreeIndicesInput.addEventListener("change", function(event){
        forestTreeIndices = parseForestTreeIndices(event.target.value);
        resetNodeSelection();
        clearPath();
        updateForestTotalStatus();
        redrawCurrentView();
    });

    displayModeSelect.addEventListener("change", function(event) {
        // Le mode general/detaille change la forme des noeuds.
        displayMode = event.target.value;
        resetNodeSelection();
        redrawCurrentView();
    });

    maxDepthInput.addEventListener("change", function(event) {
        maxVisibleDepth = parseMaxVisibleDepth(event.target.value);
        event.target.value = maxVisibleDepth || "";
        resetNodeSelection();
        clearPath();
        redrawCurrentView();
    });

    forestTreeLimitInput.addEventListener("change", function(event) {
        // Certains arbres de la foret peuvent etre masques par un bloc "...".
        forestTreeLimit = Math.max(1, Number(event.target.value) || 1);
        event.target.value = forestTreeLimit;
        resetNodeSelection();
        clearPath();
        updateForestTotalStatus();
        redrawCurrentView();
    });

    setupOptionInputs();
    setupOptionScopeInputs();
    setupPathControls();
    setupObservationControls();
}

function setupZoomControls() {
    zoomOutButton.addEventListener("click", function() {
        changeZoomByFactor(0.8);
    });

    zoomInButton.addEventListener("click", function() {
        changeZoomByFactor(1.25);
    });

    zoomResetButton.addEventListener("click", function() {
        resetZoom();
    });

    zoomRangeInput.addEventListener("input", function(event) {
        setZoomScale(Number(event.target.value) / 100);
    });
}

function changeZoomByFactor(factor) {
    const currentTransform = d3.zoomTransform(svg.node());
    setZoomScale(currentTransform.k * factor);
}

function setZoomScale(scale) {
    const extent = zoomBehavior.scaleExtent();
    const clampedScale = Math.max(extent[0], Math.min(extent[1], scale));

    svg.call(zoomBehavior.scaleTo, clampedScale);
}

function updateZoomControls(scale) {
    const zoomPercent = Math.round(scale * 100);

    zoomRangeInput.value = String(zoomPercent);
    zoomResetButton.textContent = zoomPercent + "%";
}

// Indique combien d'arbres sont visibles par rapport au total de la foret.
function updateForestTotalStatus() {
    if (!currentForest || currentView !== VIEW_TYPE.FOREST) {
        forestTotalStatus.textContent = "Aucune foret chargee";
        return;
    }

    const totalTrees = currentForest.trees.length;
    const visibleTrees = getVisibleForestTreeItems(currentForest).length;

    forestTotalStatus.textContent = visibleTrees + " / " + totalTrees + " arbres affiches";
}

// Exporte le code D3 correspondant a ce qui est affiche.
function handleD3CodeExport() {
    const visualization = getCurrentVisualizationData();

    if (!visualization.data) {
        alert("Charge d'abord un arbre ou une foret.");
        return;
    }

    try {
        exportCurrentD3Code(visualization);
        fileStatus.textContent = "Code D3.js exporte";
    } catch (error) {
        console.error(error);
        alert("Impossible d'exporter le code D3.js.");
    }
}

// Donnees utilisees par les exports.
function getCurrentVisualizationData() {
    if (currentView === VIEW_TYPE.TREE) {
        return {
            type: VIEW_TYPE.TREE,
            data: currentTree,
            pathNodeIds: Array.from(pathNodeIds),
            maxVisibleDepth: maxVisibleDepth
        };
    }

    return {
        type: VIEW_TYPE.FOREST,
        data: currentForest,
        pathNodeIds: Array.from(pathNodeIds),
        forestTreeLimit: forestTreeLimit,
        forestTreeIndices: forestTreeIndices,
        maxVisibleDepth: maxVisibleDepth
    };
}

function parseMaxVisibleDepth(input) {
    if (!input.trim()) {
        return null;
    }

    const depth = Number(input);

    if (!Number.isInteger(depth) || depth < 1) {
        return null;
    }

    return depth;
}

function parseForestTreeIndices(input) {
    if (!input.trim()) {
        return [];
    }

    return input
        .split(",")
        .map(function(index) {
            return Number(index.trim());
        })
        .filter(function(index) {
            return Number.isInteger(index) && index > 0;
        });
}
