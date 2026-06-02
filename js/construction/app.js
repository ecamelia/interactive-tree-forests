// Point d'entree de la page construction pas a pas.

const constructionJsonFileInput = document.getElementById("construction-json-file-input");
const constructionFileStatus = document.getElementById("construction-file-status");
const prevBuildStepButton = document.getElementById("prev-build-step");
const nextBuildStepButton = document.getElementById("next-build-step");
const resetBuildStepButton = document.getElementById("reset-build-step");
const buildStepStatus = document.getElementById("build-step-status");
const constructionSvg = d3.select("#construction-tree-view");
const constructionLayer = constructionSvg.append("g");
const constructionZoomBehavior = d3.zoom()
    .scaleExtent([0.5, 3])
    .on("zoom", function(event) {
        constructionLayer.attr("transform", event.transform);
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

function readConstructionJsonFile(file) {
    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            originalBuildModel = data;
            originalBuildTree = getConstructionTreeRoot(data);
            buildSteps = isConstructionForestModel(data)
                ? [{ tree: originalBuildTree, activePath: null }]
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
    if (isConstructionForestModel(originalBuildModel)) {
        drawConstructionForest(originalBuildModel);
    } else {
        drawConstructionTree(step.tree, step.activePath);
    }
    drawDecisionRegions(step.tree, step.activePath, originalBuildModel);
    updateBuildControls();
}

function updateBuildControls() {
    if (isConstructionForestModel(originalBuildModel)) {
        prevBuildStepButton.disabled = true;
        nextBuildStepButton.disabled = true;
        resetBuildStepButton.disabled = true;
        buildStepStatus.textContent = "Forêt : " + originalBuildModel.trees.length + " arbres";
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

function isConstructionForestModel(model) {
    return model && Array.isArray(model.trees) && model.trees.length;
}
