startApp();

function startApp() {
    svg.call(zoomBehavior);
    setupEvents();
    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
    loadDefaultData();
}

function setupEvents() {
    jsonFileInput.addEventListener("change", handleJsonFile);

    exportSvgButton.on("click", function() {
        exportSVG();
    });

    exportPngButton.on("click", function() {
        exportPNG();
    });

    exportD3CodeButton.on("click", handleD3CodeExport);

    maxDepthSelect.addEventListener("change", function(event) {
        maxVisibleDepth = event.target.value;
        resetNodeSelection();
        clearPath();
        redrawCurrentView();
    });

    displayModeSelect.addEventListener("change", function(event) {
        displayMode = event.target.value;
        resetNodeSelection();
        redrawCurrentView();
    });

    setupOptionInputs();
    setupOptionScopeInputs();
    setupPathControls();
}

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

function getCurrentVisualizationData() {
    if (currentView === VIEW_TYPE.TREE) {
        return {
            type: VIEW_TYPE.TREE,
            data: currentTree,
            pathNodeIds: Array.from(pathNodeIds)
        };
    }

    return {
        type: VIEW_TYPE.FOREST,
        data: currentForest,
        pathNodeIds: Array.from(pathNodeIds)
    };
}
