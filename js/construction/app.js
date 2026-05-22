// Point d'entree de la page construction pas a pas.

const constructionJsonFileInput = document.getElementById("construction-json-file-input");
const constructionFileStatus = document.getElementById("construction-file-status");
const prevBuildStepButton = document.getElementById("prev-build-step");
const nextBuildStepButton = document.getElementById("next-build-step");
const resetBuildStepButton = document.getElementById("reset-build-step");
const buildStepStatus = document.getElementById("build-step-status");
const buildStepExplanation = document.getElementById("build-step-explanation");
const constructionSvg = d3.select("#construction-tree-view");
const constructionLayer = constructionSvg.append("g");
const regionSvg = d3.select("#construction-region-view");
const regionLayer = regionSvg.append("g");

let originalBuildTree = null;
let buildSteps = [];
let currentBuildStep = 0;
let demoPoints = [];
let regionFeatureNames = ["x1", "x2"];

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
            originalBuildTree = getConstructionTreeRoot(data);
            buildSteps = createBuildSteps(originalBuildTree);
            regionFeatureNames = getRegionFeatureNames(data, originalBuildTree);
            demoPoints = getRegionPoints(data, originalBuildTree);

            constructionFileStatus.textContent = "Fichier chargé : " + file.name;
            document.body.classList.add("construction-active");
            showBuildStep(0);
        } catch (error) {
            console.error(error);
            constructionFileStatus.textContent = "Erreur de chargement";
            buildStepExplanation.textContent = "Le fichier choisi n'est pas un arbre JSON valide.";
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
    drawConstructionTree(step.tree, step.activePath);
    drawDecisionRegions(step.tree, step.activePath);
    updateBuildControls();
    updateBuildExplanation(step);
}

function updateBuildControls() {
    prevBuildStepButton.disabled = currentBuildStep <= 0;
    nextBuildStepButton.disabled = currentBuildStep >= buildSteps.length - 1;
    resetBuildStepButton.disabled = currentBuildStep === 0;
    buildStepStatus.textContent = "Étape " + (currentBuildStep + 1) + " / " + buildSteps.length;
}

function updateBuildExplanation(step) {
    if (currentBuildStep === 0) {
        buildStepExplanation.textContent = "Étape initiale : seule la racine est visible. Les enfants sont encore masqués par un nœud réduit.";
        return;
    }

    const node = getNodeByPath(originalBuildTree, step.activePath);

    if (!node) {
        buildStepExplanation.textContent = "Un nouveau nœud est révélé dans l'arbre.";
        return;
    }

    buildStepExplanation.textContent = "On développe le nœud : " +
        node.feature + " <= " + node.threshold +
        ". Ses branches gauche et droite deviennent visibles.";
}

function disableBuildControls() {
    prevBuildStepButton.disabled = true;
    nextBuildStepButton.disabled = true;
    resetBuildStepButton.disabled = true;
    buildStepStatus.textContent = "Aucun arbre chargé";
}
