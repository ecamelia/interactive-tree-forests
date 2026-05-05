// Demarrage de l'application.
startApp();

function startApp() {
    // On prepare les controles avant d'afficher l'ecran d'accueil.
    svg.call(zoomBehavior);
    setupEvents();
    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
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

    exportD3CodeButton.on("click", handleD3CodeExport);

    maxDepthSelect.addEventListener("change", function(event) {
        // Changer les niveaux peut masquer des noeuds du chemin.
        maxVisibleDepth = event.target.value;
        resetNodeSelection();
        clearPath();
        redrawCurrentView();
    });

    displayModeSelect.addEventListener("change", function(event) {
        // Le mode general/detaille change la forme des noeuds.
        displayMode = event.target.value;
        resetNodeSelection();
        redrawCurrentView();
    });

    forestTreeLimitInput.addEventListener("change", function(event) {
        // Certains arbres de la foret peuvent etre masques par un bloc "...".
        forestTreeLimit = Math.max(1, Number(event.target.value) || 1);
        event.target.value = forestTreeLimit;
        resetNodeSelection();
        clearPath();
        redrawCurrentView();
    });

    setupOptionInputs();
    setupOptionScopeInputs();
    setupPathControls();
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
            pathNodeIds: Array.from(pathNodeIds)
        };
    }

    return {
        type: VIEW_TYPE.FOREST,
        data: currentForest,
        pathNodeIds: Array.from(pathNodeIds),
        forestTreeLimit: forestTreeLimit
    };
}
