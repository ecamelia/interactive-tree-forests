// Prediction : vote des arbres
function getMajorityClass(counts) {
    return Number(Object.keys(counts).reduce(function(bestClass, currentClass) {
        if (counts[currentClass] === counts[bestClass]) {
            return Number(currentClass) < Number(bestClass) ? currentClass : bestClass;
        }

        return counts[currentClass] > counts[bestClass] ? currentClass : bestClass;
    }));
}

function predictCurrentTrainingModel(observation) {
    if (isLibraryForestMode()) {
        return getLibraryPrediction(observation);
    }

    // En mode pedagogique, la foret predit par vote majoritaire.
    const votes = getForestVotes(observation);
    const predictedClass = getMajorityClass(votes);

    return {
        className: predictedClass,
        confidence: votes[predictedClass] / Math.max(1, getCurrentTreeCount())
    };
}

function getForestVotes(observation) {
    return trainingState.forest.reduce(function(votes, tree) {
        const prediction = predictTree(tree, observation);
        votes[prediction] = (votes[prediction] || 0) + 1;
        return votes;
    }, {});
}

function predictTree(tree, observation) {
    let node = tree;

    // On descend dans l'arbre en suivant les conditions jusqu'a une feuille.
    while (node && node.type !== "leaf") {
        node = observation[node.feature] <= node.threshold ? node.left : node.right;
    }

    return node ? node.class : 0;
}
