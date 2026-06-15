// Point d'entree de la page construction pas a pas.

const constructionJsonFileInput = document.getElementById("construction-json-file-input");
const constructionFileStatus = document.getElementById("construction-file-status");
const prevBuildStepButton = document.getElementById("prev-build-step");
const nextBuildStepButton = document.getElementById("next-build-step");
const resetBuildStepButton = document.getElementById("reset-build-step");
const constructionZoomOutButton = document.getElementById("construction-zoom-out-button");
const constructionZoomInButton = document.getElementById("construction-zoom-in-button");
const constructionZoomResetButton = document.getElementById("construction-zoom-reset-button");
const constructionZoomRangeInput = document.getElementById("construction-zoom-range-input");
const buildStepStatus = document.getElementById("build-step-status");
const constructionSvg = d3.select("#construction-tree-view");
const constructionLayer = constructionSvg.append("g");
const constructionZoomBehavior = d3.zoom()
    .scaleExtent([0.2, 3])
    .on("zoom", function(event) {
        constructionLayer.attr("transform", event.transform);
        updateConstructionZoomControls(event.transform.k);
    });
const regionSvg = d3.select("#construction-region-view");
const regionLayer = regionSvg.append("g");

let originalBuildTree = null;
let originalBuildModel = null;
let buildSteps = [];
let currentBuildStep = 0;
let demoPoints = [];
let regionFeatureNames = ["x1", "x2"];

constructionSvg.call(constructionZoomBehavior);
updateConstructionZoomControls(1);

constructionJsonFileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    readConstructionJsonFile(file);
    event.target.value = "";
});

prevBuildStepButton.addEventListener("click", function() {
    showBuildStep(currentBuildStep - 1);
});

nextBuildStepButton.addEventListener("click", function() {
    showBuildStep(currentBuildStep + 1);
});

resetBuildStepButton.addEventListener("click", function() {
    showBuildStep(0);
});

constructionZoomOutButton.addEventListener("click", function() {
    changeConstructionZoomByFactor(0.8);
});

constructionZoomInButton.addEventListener("click", function() {
    changeConstructionZoomByFactor(1.25);
});

constructionZoomResetButton.addEventListener("click", function() {
    resetConstructionZoom();
});

constructionZoomRangeInput.addEventListener("input", function(event) {
    setConstructionZoomScale(Number(event.target.value) / 100);
});

function readConstructionJsonFile(file) {
    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            originalBuildModel = data;
            originalBuildTree = getConstructionTreeRoot(data);
            buildSteps = isConstructionForestModel(data)
                ? createForestBuildSteps(data)
                : createBuildSteps(originalBuildTree);
            regionFeatureNames = getRegionFeatureNames(data, originalBuildTree);
            demoPoints = getRegionPoints(data, originalBuildTree);

            constructionFileStatus.textContent = "Fichier chargé : " + file.name;
            document.body.classList.add("construction-active");
            resetConstructionZoom();
            showBuildStep(0);
        } catch (error) {
            console.error(error);
            constructionFileStatus.textContent = "Erreur de chargement";
            disableBuildControls();
        }
    };

    reader.readAsText(file);
}

function showBuildStep(stepIndex) {
    if (!buildSteps.length) {
        disableBuildControls();
        return;
    }

    currentBuildStep = Math.max(0, Math.min(stepIndex, buildSteps.length - 1));

    const step = buildSteps[currentBuildStep];
    if (isConstructionForestModel(step.model || originalBuildModel)) {
        drawConstructionForest(step.model || originalBuildModel);
    } else {
        drawConstructionTree(step.tree, step.activePath);
    }
    drawDecisionRegions(step.tree, step.activePath, step.model || originalBuildModel);
    updateBuildControls();
}

function updateBuildControls() {
    if (isConstructionForestModel(originalBuildModel)) {
        prevBuildStepButton.disabled = currentBuildStep <= 0;
        nextBuildStepButton.disabled = currentBuildStep >= buildSteps.length - 1;
        resetBuildStepButton.disabled = currentBuildStep === 0;
        buildStepStatus.textContent =
            "Étape " + (currentBuildStep + 1) + " / " + buildSteps.length +
            " - " + (currentBuildStep + 1) + " arbre(s) affiche(s)";
        return;
    }

    prevBuildStepButton.disabled = currentBuildStep <= 0;
    nextBuildStepButton.disabled = currentBuildStep >= buildSteps.length - 1;
    resetBuildStepButton.disabled = currentBuildStep === 0;
    buildStepStatus.textContent = "Étape " + (currentBuildStep + 1) + " / " + buildSteps.length;
}

function disableBuildControls() {
    prevBuildStepButton.disabled = true;
    nextBuildStepButton.disabled = true;
    resetBuildStepButton.disabled = true;
    buildStepStatus.textContent = "Aucun arbre chargé";
}

function resetConstructionZoom() {
    constructionSvg.call(constructionZoomBehavior.transform, d3.zoomIdentity);
}

function changeConstructionZoomByFactor(factor) {
    const currentTransform = d3.zoomTransform(constructionSvg.node());
    setConstructionZoomScale(currentTransform.k * factor);
}

function setConstructionZoomScale(scale) {
    const extent = constructionZoomBehavior.scaleExtent();
    const clampedScale = Math.max(extent[0], Math.min(extent[1], scale));

    constructionSvg.call(constructionZoomBehavior.scaleTo, clampedScale);
}

function updateConstructionZoomControls(scale) {
    const zoomPercent = Math.round(scale * 100);

    constructionZoomRangeInput.value = String(zoomPercent);
    constructionZoomResetButton.textContent = zoomPercent + "%";
}

function isConstructionForestModel(model) {
    return model && Array.isArray(model.trees) && model.trees.length;
}

function createForestBuildSteps(forest) {
    return forest.trees.map(function(_, index) {
        const visibleTrees = forest.trees.slice(0, index + 1);

        return {
            tree: visibleTrees[visibleTrees.length - 1].root || visibleTrees[visibleTrees.length - 1],
            activePath: null,
            model: {
                ...forest,
                trees: visibleTrees
            }
        };
    });
}
