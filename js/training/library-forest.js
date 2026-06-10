function isLibraryForestMode() {
    return engineSelect && engineSelect.value === "library";
}

function resetLibraryForest() {
    trainingState.libraryModel = null;
    trainingState.libraryTreeCount = 0;
    trainingState.libraryLoading = false;
    trainingState.libraryTraining = false;
}

async function trainLibraryForestFromControls() {
    await trainLibraryForest(getTargetTreeCount());
}

async function trainLibraryForestStep() {
    const targetTrees = getTargetTreeCount();

    if (trainingState.libraryTreeCount >= targetTrees) {
        renderTrainingView();
        return true;
    }

    await trainLibraryForest(trainingState.libraryTreeCount + 1);
    return trainingState.libraryTreeCount >= targetTrees;
}

async function trainLibraryForest(treeCount) {
    if (trainingState.libraryTraining) {
        return false;
    }

    if (trainingState.points.length === 0) {
        await generateTrainingData();
    }

    trainingState.libraryTraining = true;
    statusText.textContent = "Entraînement avec ml-random-forest...";

    try {
        const RandomForestClassifier = await getRandomForestClassifier();
        const model = new RandomForestClassifier(getLibraryOptions(treeCount));

        model.train(getLibraryTrainingMatrix(), getLibraryLabels());

        trainingState.libraryModel = model;
        trainingState.libraryTreeCount = treeCount;
        renderTrainingView();
    } finally {
        trainingState.libraryTraining = false;
    }

    return true;
}

async function getRandomForestClassifier() {
    if (trainingState.libraryClassifier) {
        return trainingState.libraryClassifier;
    }

    trainingState.libraryLoading = true;
    statusText.textContent = "Chargement de la bibliothèque ml-random-forest...";

    const module = await import("../../vendor/ml-random-forest.bundle.mjs?v=1");

    trainingState.libraryClassifier = module.RandomForestClassifier;
    trainingState.libraryLoading = false;

    return trainingState.libraryClassifier;
}

function getLibraryOptions(treeCount) {
    const featureCount = trainingState.modelFeatureNames.length;

    return {
        nEstimators: treeCount,
        maxFeatures: Math.max(1, Math.round(Math.sqrt(featureCount))),
        replacement: Number(bootstrapRatioInput.value) > 0,
        noOOB: true,
        treeOptions: {
            maxDepth: Number(maxDepthInput.value) || 4,
            minNumSamples: Number(minSamplesInput.value) || 6
        },
        seed: trainingState.seed
    };
}

function getLibraryTrainingMatrix() {
    return trainingState.points.map(function(point) {
        return trainingState.modelFeatureNames.map(function(featureName) {
            return getPointFeatureValue(point, featureName);
        });
    });
}

function getLibraryLabels() {
    return trainingState.points.map(function(point) {
        return Number(point.class);
    });
}

function getLibraryPrediction(observation) {
    if (trainingState.libraryModel === null) {
        return {
            className: 0,
            confidence: 0
        };
    }

    const votes = getLibraryVotes(observation);
    const predictedClass = Object.keys(votes).length
        ? getMajorityClass(votes)
        : predictLibraryForest(observation);
    const voteCount = votes[predictedClass] || trainingState.libraryTreeCount || 1;

    return {
        className: predictedClass,
        confidence: voteCount / Math.max(1, trainingState.libraryTreeCount)
    };
}

function predictLibraryTree(treeIndex, observation) {
    const predictions = getLibraryEstimatorPredictions(observation);

    if (Number.isFinite(Number(predictions[treeIndex]))) {
        return Number(predictions[treeIndex]);
    }

    return predictLibraryForest(observation);
}

function predictLibraryForest(observation) {
    if (trainingState.libraryModel === null) {
        return 0;
    }

    const votes = getLibraryVotes(observation);

    if (Object.keys(votes).length) {
        return getMajorityClass(votes);
    }

    const prediction = trainingState.libraryModel.predict([getLibraryRow(observation)]);
    return Number(prediction[0]);
}

function getLibraryVotes(observation) {
    return getLibraryEstimatorPredictions(observation).reduce(function(votes, prediction) {
        const className = Number(prediction);

        if (Number.isFinite(className)) {
            votes[className] = (votes[className] || 0) + 1;
        }

        return votes;
    }, {});
}

function getLibraryEstimatorPredictions(observation) {
    if (trainingState.libraryModel === null || typeof trainingState.libraryModel.predictionValues !== "function") {
        return [];
    }

    const values = trainingState.libraryModel.predictionValues([getLibraryRow(observation)]);

    if (Array.isArray(values)) {
        return Array.isArray(values[0]) ? values[0] : values;
    }

    if (values && Number.isFinite(values.rows) && typeof values.getRow === "function" && values.rows > 0) {
        return values.getRow(0);
    }

    if (values && typeof values.to1DArray === "function") {
        return values.to1DArray();
    }

    if (values && typeof values.to2DArray === "function") {
        const matrix = values.to2DArray();
        return matrix.length === 1 ? matrix[0] : matrix.map(function(row) {
            return row[0];
        });
    }

    return [];
}

function getLibraryRow(observation) {
    return trainingState.modelFeatureNames.map(function(featureName) {
        return Number(observation[featureName]);
    });
}

function showLibraryError(error) {
    trainingState.libraryLoading = false;
    trainingState.libraryTraining = false;
    console.error(error);
    statusText.textContent = "Erreur bibliothèque : " + getErrorMessage(error);
}

function getErrorMessage(error) {
    return error && error.message
        ? error.message
        : "ml-random-forest n'a pas pu être chargé.";
}
