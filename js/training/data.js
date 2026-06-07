// Donnees : generation et chargement JSON
function generateTrainingData() {
    const count = Number(pointCountInput.value) || 160;
    const noise = Number(noiseInput.value) || 0;
    const datasetType = datasetSelect.value;
    const random = createSeededRandom(trainingState.seed);
    trainingState.featureNames = ["x1", "x2"];
    trainingState.modelFeatureNames = datasetType === "circles"
        ? ["x1", "x2", "r2"]
        : ["x1", "x2"];
    trainingState.classes = [0, 1];

    trainingState.points = Array.from({ length: count }, function(_, index) {
        if (datasetType === "circles") {
            return createCirclePoint(index, count, noise, random);
        }

        if (datasetType === "diagonal") {
            return createDiagonalPoint(noise, random);
        }

        return createMoonPoint(index, count, noise, random);
    });
}

function loadForestJsonFile(event) {
    const file = event.target.files[0];

    if (!file) {
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
                renderTrainingView();
                statusText.textContent = "Données chargées : " + file.name + ". Appuie sur ▶ pour entraîner la forêt.";
                return;
            }

            loadPretrainedForestJson(data, file.name);
        } catch (error) {
            console.error(error);
            statusText.textContent = "Erreur : fichier JSON invalide.";
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function loadPretrainedForestJson(data, fileName) {
    const roots = getForestRootsFromJson(data);

    if (!roots.length) {
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
    if (!node || node.type === "leaf") {
        return;
    }

    if (node.feature && !features.includes(node.feature)) {
        features.push(node.feature);
    }

    collectTreeFeatures(node.left, features);
    collectTreeFeatures(node.right, features);
}

function getJsonPoints(data) {
    if (!data || !Array.isArray(data.data)) {
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
    if (!node) {
        return;
    }

    if (Number.isFinite(Number(node.class))) {
        classes.add(Number(node.class));
    }

    collectTreeClasses(node.left, classes);
    collectTreeClasses(node.right, classes);
}

// Jeux de donnees de demonstration
function createMoonPoint(index, count, noise, random) {
    const upper = index < count / 2;
    const angle = random() * Math.PI;
    const radius = 0.34 + random() * 0.08;
    let x = 0.5 + Math.cos(angle) * radius;
    let y = upper
        ? 0.54 + Math.sin(angle) * radius * 0.62
        : 0.43 - Math.sin(angle) * radius * 0.62;

    if (!upper) {
        x += 0.18;
    }

    x += (random() - 0.5) * noise;
    y += (random() - 0.5) * noise;

    return createTrainingPoint(keepInUnit(x), keepInUnit(y), upper ? 1 : 0);
}

function createCirclePoint(index, count, noise, random) {
    const inner = index < count / 2;
    const angle = random() * Math.PI * 2;
    const radius = inner
        ? 0.16 + random() * 0.12
        : 0.34 + random() * 0.14;
    const x = 0.5 + Math.cos(angle) * radius + (random() - 0.5) * noise;
    const y = 0.5 + Math.sin(angle) * radius + (random() - 0.5) * noise;

    return createTrainingPoint(keepInUnit(x), keepInUnit(y), inner ? 0 : 1);
}

function createDiagonalPoint(noise, random) {
    const x = random();
    const y = random();
    const boundary = 0.48 + Math.sin(x * Math.PI * 2) * 0.12;
    const noisyY = y + (random() - 0.5) * noise;

    return createTrainingPoint(keepInUnit(x), keepInUnit(noisyY), noisyY > boundary ? 1 : 0);
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
