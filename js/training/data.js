async function generateTrainingData() {
    const count = Number(pointCountInput.value) || 160;
    const datasetType = datasetSelect.value;
    trainingState.featureNames = ["x1", "x2"];
    trainingState.modelFeatureNames = datasetType === "circles"
        ? ["x1", "x2", "r2"]
        : ["x1", "x2"];
    trainingState.classes = [0, 1];

    await prepareSklearnDatasetPoints(datasetType, count);

    if (trainingState.datasetDisplayPoints.length === 0) {
        trainingState.points = [];
        updateTrainingFileStatus("Aucun dataset chargé");
        return;
    }

    trainingState.points = Array.from({ length: count }, function(_, index) {
        if (datasetType === "moons") {
            return createMoonPoint(index);
        }

        if (datasetType === "circles") {
            return createCirclePoint(index);
        }

        if (datasetType === "diagonal") {
            return createDiagonalPoint(index);
        }
    });

    updateTrainingFileStatus(
        "Dataset sklearn : " + getDatasetLabel(datasetType) + " (" + trainingState.points.length + " points)"
    );
}

async function prepareSklearnDatasetPoints(datasetType, count) {
    try {
        if (trainingState.datasetSourcePoints[datasetType] === undefined) {
            const response = await fetch(getSklearnDatasetFile(datasetType));

            if (response.ok === false) {
                throw new Error("Chargement impossible");
            }

            const data = await response.json();
            trainingState.datasetSourcePoints[datasetType] = getPointsFromTrainingJson(data);
        }

        trainingState.datasetDisplayPoints = selectTrainingPoints(
            trainingState.datasetSourcePoints[datasetType],
            count
        );
    } catch (error) {
        console.error("Dataset sklearn indisponible.", error);
        trainingState.datasetDisplayPoints = [];
        statusText.textContent = "Erreur : impossible de charger le dataset sklearn.";
    }
}

function getSklearnDatasetFile(datasetType) {
    const files = {
        moons: "data/training-moons-sklearn.json",
        circles: "data/training-circles-sklearn.json",
        diagonal: "data/training-diagonal-sklearn.json"
    };

    return files[datasetType] || files.moons;
}

function getDatasetLabel(datasetType) {
    const labels = {
        moons: "lunes",
        circles: "cercles",
        diagonal: "diagonale"
    };

    return labels[datasetType] || datasetType;
}

function updateTrainingFileStatus(text) {
    if (trainingFileStatus) {
        trainingFileStatus.textContent = text;
    }
}

function getPointsFromTrainingJson(data) {
    if (data === null || data === undefined || !Array.isArray(data.data)) {
        return [];
    }

    return data.data.map(function(point) {
        return createTrainingPoint(
            Number(point.x1),
            Number(point.x2),
            Number(point.class)
        );
    }).filter(function(point) {
        return Number.isFinite(point.x1) &&
            Number.isFinite(point.x2) &&
            Number.isFinite(point.class);
    });
}

function selectTrainingPoints(points, count) {
    if (points.length <= count) {
        return points;
    }

    const random = createSeededRandom(trainingState.seed);
    return points.slice().sort(function() {
        return random() - 0.5;
    }).slice(0, count);
}

function loadForestJsonFile(event) {
    const file = event.target.files[0];

    if (file === undefined) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            const dataFeatureNames = getDataFeatureNamesFromJson(data);

            if (dataFeatureNames.length >= 2 && Array.isArray(data.data) && data.data.length) {
                stopTrainingAnimation();
                trainingState.featureNames = dataFeatureNames.slice(0, 2);
                trainingState.modelFeatureNames = dataFeatureNames.slice();
                trainingState.pendingForest = null;
                trainingState.forest = [];
                trainingState.points = getJsonPoints(data);
                trainingState.classes = getJsonClasses(data);
                pointCountInput.max = Math.max(Number(pointCountInput.max) || 0, trainingState.points.length);
                pointCountInput.value = trainingState.points.length;
                updateTrainingFileStatus("Fichier chargé : " + file.name + " (" + trainingState.points.length + " points)");
                renderTrainingView();
                statusText.textContent = "Données chargées : " + file.name + ". Appuie sur ▶ pour entraîner la forêt.";
                return;
            }

            loadPretrainedForestJson(data, file.name);
        } catch (error) {
            console.error(error);
            updateTrainingFileStatus("Fichier JSON invalide");
            statusText.textContent = "Erreur : fichier JSON invalide.";
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function loadPretrainedForestJson(data, fileName) {
    const roots = getForestRootsFromJson(data);

    if (roots.length === 0) {
        statusText.textContent = "Le fichier JSON ne contient ni data entraînable ni forêt valide.";
        return;
    }

    stopTrainingAnimation();
    trainingState.featureNames = getJsonFeatureNames(data, roots);
    trainingState.modelFeatureNames = trainingState.featureNames.slice();
    trainingState.pendingForest = roots;
    trainingState.forest = [];
    trainingState.points = getJsonPoints(data);
    trainingState.classes = getJsonClasses(data);
    updateTrainingFileStatus("Forêt chargée : " + fileName);
    renderTrainingView();
    statusText.textContent = "Forêt pré-entraînée chargée : " + fileName + ". Appuie sur ▶ pour afficher les arbres progressivement.";
}

function getDataFeatureNamesFromJson(data) {
    if (data && Array.isArray(data.features) && data.features.length >= 2) {
        return data.features;
    }

    if (data && Array.isArray(data.data) && data.data.length) {
        return Object.keys(data.data[0]).filter(function(key) {
            return key !== "class";
        });
    }

    return [];
}

function getForestRootsFromJson(data) {
    if (data && Array.isArray(data.trees)) {
        return data.trees.map(function(tree) {
            return tree.root || tree;
        }).filter(Boolean);
    }

    if (data && data.root) {
        return [data.root];
    }

    if (data && (data.type === "node" || data.type === "leaf")) {
        return [data];
    }

    return [];
}

function getJsonFeatureNames(data, roots) {
    if (data && Array.isArray(data.features) && data.features.length >= 2) {
        return data.features.slice(0, 2);
    }

    const features = [];

    roots.forEach(function(root) {
        collectTreeFeatures(root, features);
    });

    return features.length >= 2 ? features.slice(0, 2) : ["x1", "x2"];
}

function collectTreeFeatures(node, features) {
    if (node === null || node === undefined || node.type === "leaf") {
        return;
    }

    if (node.feature && !features.includes(node.feature)) {
        features.push(node.feature);
    }

    collectTreeFeatures(node.left, features);
    collectTreeFeatures(node.right, features);
}

function getJsonPoints(data) {
    if (data === null || data === undefined || !Array.isArray(data.data)) {
        return [];
    }

    return data.data
        .map(function(point) {
            const firstValue = Number(point[trainingState.featureNames[0]]);
            const secondValue = Number(point[trainingState.featureNames[1]]);

            if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
                return null;
            }

            return {
                ...point,
                class: Number.isFinite(Number(point.class)) ? Number(point.class) : 0
            };
        })
        .filter(Boolean);
}

function getJsonClasses(data) {
    if (data && Array.isArray(data.classes) && data.classes.length) {
        return data.classes.map(Number).filter(Number.isFinite);
    }

    const classes = new Set();

    trainingState.points.forEach(function(point) {
        if (Number.isFinite(Number(point.class))) {
            classes.add(Number(point.class));
        }
    });

    trainingState.forest.forEach(function(tree) {
        collectTreeClasses(tree, classes);
    });

    return Array.from(classes).sort(function(a, b) {
        return a - b;
    });
}

function collectTreeClasses(node, classes) {
    if (node === null || node === undefined) {
        return;
    }

    if (Number.isFinite(Number(node.class))) {
        classes.add(Number(node.class));
    }

    collectTreeClasses(node.left, classes);
    collectTreeClasses(node.right, classes);
}

function createMoonPoint(index) {
    return createTrainingPointFromDataset(index);
}

function createCirclePoint(index) {
    return createTrainingPointFromDataset(index);
}

function createDiagonalPoint(index) {
    return createTrainingPointFromDataset(index);
}

function createTrainingPointFromDataset(index) {
    const point = trainingState.datasetDisplayPoints[index % trainingState.datasetDisplayPoints.length];

    return createTrainingPoint(point.x1, point.x2, point.class);
}

function createTrainingPoint(xValue, yValue, className) {
    return {
        x1: xValue,
        x2: yValue,
        r2: getCenteredDistance(xValue, yValue),
        class: className
    };
}

function getCenteredDistance(xValue, yValue) {
    const xDistance = xValue - 0.5;
    const yDistance = yValue - 0.5;

    return xDistance * xDistance + yDistance * yDistance;
}
