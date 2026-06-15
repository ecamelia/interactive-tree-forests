// Indicateurs affiches dans la barre du haut
function updateTrainingStatus(decisionMap) {
    const targetTrees = getTargetTreeCount();
    const currentTreeCount = getCurrentTreeCount();

    stepLabel.textContent = "Arbres";
    epochText.textContent = currentTreeCount + " / " + targetTrees;

    if (!currentTreeCount) {
        agreementText.textContent = "-";
        accuracyText.textContent = "-";
        statusText.textContent = trainingState.pendingForest
            ? "Forêt JSON prête. Appuie sur ▶ pour afficher les arbres progressivement."
            : "Appuie sur ▶ pour entraîner la forêt arbre par arbre.";
        return;
    }

    const accuracy = getTrainingAccuracy();

    const averageConfidence = d3.mean(decisionMap, function(cell) {
        return cell.confidence;
    }) || 0;

    agreementText.textContent = Math.round(averageConfidence * 100) + "%";
    accuracyText.textContent = Math.round(accuracy * 100) + "%";

    statusText.textContent = currentTreeCount + " arbres entraînés. " +
        trainingState.points.length + " points affichés. " +
        "Exactitude sur les points : " + Math.round(accuracy * 100) + "%. " +
        "Accord moyen : " + Math.round(averageConfidence * 100) + "%.";
}

function getTrainingAccuracy() {
    const correct = trainingState.points.filter(function(point) {
        return predictCurrentTrainingModel(point).className === point.class;
    }).length;

    return correct / trainingState.points.length;
}
