// Outils d'explication : tester une observation et colorer le chemin suivi.
function setupObservationControls() {
    runObservationButton.addEventListener("click", runObservationExplanation);
    testObservationsFileInput.addEventListener("change", loadTestObservationsFile);

    clearObservationButton.addEventListener("click", function() {
        clearPath();
        observationResult.textContent = "Chemin effacé.";
        testObservationResults.innerHTML = "";
        redrawCurrentView();
    });
}

function updateObservationPanel() {
    const roots = getCurrentRootsForFeatures();

    observationInputs.innerHTML = "";
    testObservationResults.innerHTML = "";

    if (!roots.length) {
        observationPanel.classList.add("is-disabled");
        observationResult.textContent = "Chargez un arbre ou une foret.";
        return;
    }

    observationPanel.classList.remove("is-disabled");
    createObservationInputs(getFeatureNames(roots));
}

function createObservationInputs(featureNames) {
    featureNames.forEach(function(featureName) {
        const label = document.createElement("label");
        label.textContent = featureName + " ";

        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.001";
        input.dataset.feature = featureName;

        label.appendChild(input);
        observationInputs.appendChild(label);
    });

    observationResult.textContent = featureNames.length
        ? "Entrez une observation ou chargez un fichier test."
        : "Aucune feature trouvée dans cet arbre.";
}

function runObservationExplanation() {
    const observation = readObservationValues();

    if (!Object.keys(observation).length) {
        alert("Entre au moins une valeur pour tester une observation.");
        return;
    }

    if (!hasAllObservationValues(observation)) {
        alert("Remplis toutes les valeurs de l'observation.");
        return;
    }

    clearPath();

    if (currentView === VIEW_TYPE.TREE) {
        explainTreeObservation(currentTree, observation, "single");
        redrawCurrentView();
        return;
    }

    if (currentView === VIEW_TYPE.FOREST) {
        explainForestObservation(observation);
        redrawCurrentView();
    }
}

function explainTreeObservation(tree, observation, idPrefix) {
    const prediction = addDecisionPath(tree.root || tree, observation, idPrefix);
    observationResult.textContent = "Classe prédite : " + prediction;
}

function explainForestObservation(observation) {
    const votes = {};
    const visibleTrees = getVisibleForestTreeItems(currentForest);

    currentForest.trees.forEach(function(tree, index) {
        const treeId = tree.id || index + 1;
        const isVisibleTree = visibleTrees.some(function(item) {
            return item.tree === tree;
        });
        const idPrefix = isVisibleTree ? "forest-" + treeId : null;
        const prediction = addDecisionPath(tree.root || tree, observation, idPrefix);

        votes[prediction] = (votes[prediction] || 0) + 1;
    });

    observationResult.textContent = "Votes foret : " + formatVotes(votes);
}

function loadTestObservationsFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            const observations = normalizeTestObservations(data);

            if (!observations.length) {
                observationResult.textContent = "Le fichier test ne contient aucune observation valide.";
                return;
            }

            const results = observations.map(predictObservationFromCurrentModel);
            observationResult.textContent = "Fichier test : " + results.length + " observations";
            renderTestObservationResults(results);
        } catch (error) {
            console.error(error);
            observationResult.textContent = "Erreur : fichier test JSON invalide.";
            testObservationResults.innerHTML = "";
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function normalizeTestObservations(data) {
    const rows = Array.isArray(data)
        ? data
        : data.observations || data.tests || data.data || [];

    return rows
        .map(normalizeTestObservation)
        .filter(Boolean);
}

function normalizeTestObservation(row, index) {
    if (!row || typeof row !== "object") {
        return null;
    }

    const observation = {};

    getFeatureNames(getCurrentRootsForFeatures()).forEach(function(featureName) {
        const value = Number(row[featureName]);

        if (Number.isFinite(value)) {
            observation[featureName] = value;
        }
    });

    if (!Object.keys(observation).length || !hasAllFeatureValues(observation)) {
        return null;
    }

    return {
        index: Number.isFinite(Number(row.id)) ? row.id : index + 1,
        observation: observation,
        expectedClass: row.class !== undefined ? row.class : row.expected
    };
}

function hasAllFeatureValues(observation) {
    return getFeatureNames(getCurrentRootsForFeatures()).every(function(featureName) {
        return observation[featureName] !== undefined;
    });
}

function predictObservationFromCurrentModel(testCase) {
    if (currentView === VIEW_TYPE.TREE) {
        const prediction = predictTreeObservation(currentTree.root || currentTree, testCase.observation);

        return {
            ...testCase,
            prediction: prediction
        };
    }

    const votes = getForestVotes(testCase.observation);

    return {
        ...testCase,
        prediction: getBestVoteClass(votes),
        votes: votes
    };
}

function predictTreeObservation(tree, observation) {
    let currentNode = tree;

    while (currentNode && currentNode.type !== "leaf") {
        const featureValue = observation[currentNode.feature];
        currentNode = featureValue <= currentNode.threshold ? currentNode.left : currentNode.right;
    }

    return currentNode ? currentNode.class : undefined;
}

function getForestVotes(observation) {
    const votes = {};

    currentForest.trees.forEach(function(tree) {
        const prediction = predictTreeObservation(tree.root || tree, observation);
        votes[prediction] = (votes[prediction] || 0) + 1;
    });

    return votes;
}

function getBestVoteClass(votes) {
    return Object.keys(votes).reduce(function(bestClass, currentClass) {
        if (votes[currentClass] === votes[bestClass]) {
            return Number(currentClass) < Number(bestClass) ? currentClass : bestClass;
        }

        return votes[currentClass] > votes[bestClass] ? currentClass : bestClass;
    });
}

function renderTestObservationResults(results) {
    testObservationResults.innerHTML = "";

    testObservationResults.appendChild(createTestResultsSummary(results));

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "test-results-table-wrapper";

    const table = document.createElement("table");
    table.className = "test-results-table";

    const header = document.createElement("thead");
    header.innerHTML = "<tr><th>#</th><th>Prédit</th><th>Attendu</th><th>Statut</th><th>Votes</th></tr>";
    table.appendChild(header);

    const body = document.createElement("tbody");

    results.forEach(function(result) {
        const row = document.createElement("tr");
        const isCorrect = result.expectedClass === undefined ||
            String(result.prediction) === String(result.expectedClass);

        row.className = isCorrect ? "is-correct" : "is-wrong";
        row.innerHTML =
            "<td>" + result.index + "</td>" +
            "<td>Classe " + result.prediction + "</td>" +
            "<td>" + formatExpectedClass(result.expectedClass) + "</td>" +
            "<td>" + formatResultStatus(result.expectedClass, isCorrect) + "</td>" +
            "<td>" + formatVoteBadges(result.votes) + "</td>";

        body.appendChild(row);
    });

    table.appendChild(body);
    tableWrapper.appendChild(table);
    testObservationResults.appendChild(tableWrapper);
}

function createTestResultsSummary(results) {
    const summary = getTestResultsSummary(results);
    const container = document.createElement("div");
    container.className = "test-results-summary";

    container.appendChild(createSummaryItem("Observations", summary.total));
    container.appendChild(createSummaryItem("Correctes", summary.correct));
    container.appendChild(createSummaryItem("Erreurs", summary.wrong));
    container.appendChild(createSummaryItem("Exactitude", summary.accuracy));

    return container;
}

function getTestResultsSummary(results) {
    const evaluatedResults = results.filter(function(result) {
        return result.expectedClass !== undefined;
    });
    const correctResults = evaluatedResults.filter(function(result) {
        return String(result.prediction) === String(result.expectedClass);
    });
    const wrongCount = evaluatedResults.length - correctResults.length;

    return {
        total: results.length,
        correct: correctResults.length,
        wrong: wrongCount,
        accuracy: evaluatedResults.length
            ? Math.round((correctResults.length / evaluatedResults.length) * 100) + "%"
            : "-"
    };
}

function createSummaryItem(label, value) {
    const item = document.createElement("div");
    item.className = "test-summary-item";

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    item.appendChild(valueElement);
    item.appendChild(labelElement);

    return item;
}

function formatExpectedClass(expectedClass) {
    return expectedClass === undefined ? "-" : "Classe " + expectedClass;
}

function formatResultStatus(expectedClass, isCorrect) {
    if (expectedClass === undefined) {
        return "-";
    }

    return isCorrect ? "OK" : "Erreur";
}

function formatVoteBadges(votes) {
    if (!votes) {
        return "-";
    }

    return Object.keys(votes)
        .sort()
        .map(function(className) {
            return "<span class=\"vote-badge\">C" + className + " : " + votes[className] + "</span>";
        })
        .join("");
}

function addDecisionPath(tree, observation, idPrefix) {
    let currentNode = tree;
    let prediction = currentNode.class;
    const nodeIds = idPrefix ? createNodeIdMap(tree, idPrefix) : null;

    while (currentNode) {
        if (nodeIds) {
            pathNodeIds.add(nodeIds.get(currentNode));
        }

        if (currentNode.type === "leaf") {
            prediction = currentNode.class;
            break;
        }

        const featureValue = observation[currentNode.feature];
        const goLeft = featureValue <= currentNode.threshold;

        currentNode = goLeft ? currentNode.left : currentNode.right;
    }

    return prediction;
}

function createNodeIdMap(tree, idPrefix) {
    const root = d3.hierarchy(tree, function(d) {
        return [d.left, d.right].filter(Boolean);
    });
    const nodeIds = new Map();

    root.descendants().forEach(function(d, index) {
        nodeIds.set(d.data, idPrefix + "-node-" + index);
    });

    return nodeIds;
}

function hasAllObservationValues(observation) {
    const inputs = Array.from(observationInputs.querySelectorAll("input"));

    return inputs.every(function(input) {
        return observation[input.dataset.feature] !== undefined;
    });
}

function readObservationValues() {
    const values = {};

    observationInputs.querySelectorAll("input").forEach(function(input) {
        if (input.value === "") {
            return;
        }

        values[input.dataset.feature] = Number(input.value);
    });

    return values;
}

function getCurrentRootsForFeatures() {
    if (currentView === VIEW_TYPE.TREE && currentTree) {
        return [currentTree.root || currentTree];
    }

    if (currentView === VIEW_TYPE.FOREST && currentForest && currentForest.trees.length) {
        return currentForest.trees.map(function(tree) {
            return tree.root || tree;
        });
    }

    return [];
}

function getFeatureNames(roots) {
    const features = new Set();

    roots.forEach(function(root) {
        visitTreeNodes(root, function(node) {
            if (node.type !== "leaf" && node.feature) {
                features.add(node.feature);
            }
        });
    });

    return Array.from(features);
}

function formatVotes(votes) {
    return Object.keys(votes)
        .sort()
        .map(function(className) {
            return "classe " + className + " = " + votes[className];
        })
        .join(", ");
}
