// Petites fonctions utilitaires
function getTreeDepth(node) {
    if (!node || node.type === "leaf") {
        return 0;
    }

    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function countLeaves(node) {
    if (!node) {
        return 0;
    }

    if (node.type === "leaf") {
        return 1;
    }

    return countLeaves(node.left) + countLeaves(node.right);
}

function getTrainingColor(className) {
    const colors = ["#a6cee3", "#fb9a99", "#c7b9ff", "#b2df8a", "#fdbf6f", "#cab2d6"];
    const index = trainingState.classes.indexOf(Number(className));

    return colors[index >= 0 ? index % colors.length : 0];
}

function createSeededRandom(seed) {
    let value = seed % 2147483647;

    if (value <= 0) {
        value += 2147483646;
    }

    return function() {
        value = value * 16807 % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function keepInUnit(value) {
    if (value < 0) {
        return Math.min(1, -value);
    }

    if (value > 1) {
        return Math.max(0, 2 - value);
    }

    return value;
}

function round(value) {
    return Math.round(value * 1000) / 1000;
}
