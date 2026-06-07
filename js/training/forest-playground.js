// Evenements de l'interface
initTrainingPage();

function initTrainingPage() {
    bindTrainingEvents();
    generateTrainingData();
    resetTrainingForest();
}

function bindTrainingEvents() {
    regenerateButton.addEventListener("click", regenerateData);
    trainButton.addEventListener("click", trainForestFromControls);
    resetButton.addEventListener("click", resetTraining);
    playButton.addEventListener("click", toggleTrainingAnimation);
    stepButton.addEventListener("click", addOneTree);
    jsonFileInput.addEventListener("change", loadForestJsonFile);

    [datasetSelect, pointCountInput, noiseInput].forEach(function(input) {
        input.addEventListener("change", regenerateData);
    });

    [treeCountInput, maxDepthInput, minSamplesInput, bootstrapRatioInput].forEach(function(input) {
        input.addEventListener("change", resetForestAfterOptionChange);
    });

    engineSelect.addEventListener("change", resetTraining);
}

function regenerateData() {
    stopTrainingAnimation();
    trainingState.featureNames = ["x1", "x2"];
    trainingState.classes = [0, 1];
    trainingState.pendingForest = null;
    trainingState.seed += 1;
    generateTrainingData();
    resetTrainingForest();
}

function resetTraining() {
    stopTrainingAnimation();
    resetTrainingForest();
}

function toggleTrainingAnimation() {
    if (trainingState.playing) {
        stopTrainingAnimation();
        return;
    }

    startTrainingAnimation();
}

async function addOneTree() {
    stopTrainingAnimation();
    await addTrainingStep();
}

function resetForestAfterOptionChange() {
    stopTrainingAnimation();

    if (!trainingState.pendingForest) {
        resetTrainingForest();
    }
}
