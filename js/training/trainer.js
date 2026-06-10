async function trainForestFromControls() {
    stopTrainingAnimation();

    if (trainingState.points.length === 0) {
        await generateTrainingData();
    }

    if (isLibraryForestMode()) {
        try {
            await trainLibraryForestFromControls();
        } catch (error) {
            showLibraryError(error);
        }

        return;
    }

    if (trainingState.pendingForest) {
        trainingState.forest = trainingState.pendingForest.slice();
        renderTrainingView();
        return;
    }

    const options = getTrainingOptions();
    trainingState.forest = trainRandomForest(options.treeCount, options);
    renderTrainingView();
}

function resetTrainingForest() {
    trainingState.forest = [];
    resetLibraryForest();
    renderTrainingView();
}

async function startTrainingAnimation() {
    if (trainingState.points.length === 0) {
        await generateTrainingData();
    }

    if (getCurrentTreeCount() >= getTargetTreeCount()) {
        resetTrainingForest();
    }

    trainingState.playing = true;
    playButton.textContent = "❚❚";
    runTrainingLoop();
}

function stopTrainingAnimation() {
    trainingState.playing = false;
    playButton.textContent = "▶";

    if (trainingState.playTimer) {
        window.clearTimeout(trainingState.playTimer);
        trainingState.playTimer = null;
    }
}

async function runTrainingLoop() {
    const finished = await addTrainingStep();

    if (finished || !trainingState.playing) {
        stopTrainingAnimation();
        return;
    }

    trainingState.playTimer = window.setTimeout(runTrainingLoop, 550);
}

async function addTrainingStep() {
    if (isLibraryForestMode()) {
        try {
            return await trainLibraryForestStep();
        } catch (error) {
            showLibraryError(error);
            return true;
        }
    }

    return addTrainingTreeStep();
}

function addTrainingTreeStep() {
    const options = getTrainingOptions();
    const targetTrees = getTargetTreeCount();
    const currentCount = getCurrentTreeCount();

    if (currentCount >= targetTrees) {
        renderTrainingView();
        return true;
    }

    if (trainingState.pendingForest) {
        trainingState.forest.push(trainingState.pendingForest[trainingState.forest.length]);
        renderTrainingView();
        return trainingState.forest.length >= targetTrees;
    }

    trainingState.forest.push(trainRandomTree(trainingState.points, options, currentCount));
    renderTrainingView();

    return trainingState.forest.length >= targetTrees;
}

function getTargetTreeCount() {
    return trainingState.pendingForest
        ? trainingState.pendingForest.length
        : getTrainingOptions().treeCount;
}

function getCurrentTreeCount() {
    if (isLibraryForestMode()) {
        return trainingState.libraryTreeCount;
    }

    return trainingState.forest.length;
}

function getTrainingOptions() {
    return {
        treeCount: Number(treeCountInput.value) || 12,
        maxDepth: Number(maxDepthInput.value) || 4,
        minSamples: Number(minSamplesInput.value) || 6,
        bootstrapRatio: Number(bootstrapRatioInput.value) || 1
    };
}

function trainRandomForest(treeCount, options) {
    return Array.from({ length: treeCount }, function(_, treeIndex) {
        return trainRandomTree(trainingState.points, options, treeIndex);
    });
}

function trainRandomTree(points, options, treeIndex) {
    const random = createSeededRandom(trainingState.seed + treeIndex * 97 + 13);
    const sampleSize = Math.max(1, Math.round(points.length * options.bootstrapRatio));

    const sampledPoints = Array.from({ length: sampleSize }, function() {
        return points[Math.floor(random() * points.length)];
    });

    return buildTree(sampledPoints, 0, options, random);
}

function buildTree(points, depth, options, random) {
    const counts = countClasses(points);
    const majorityClass = getMajorityClass(counts);

    if (
        depth >= options.maxDepth ||
        points.length < options.minSamples ||
        Object.keys(counts).length <= 1
    ) {
        return createLeaf(points, counts, majorityClass);
    }

    const split = findBestSplit(points, random);

    if (split === null) {
        return createLeaf(points, counts, majorityClass);
    }

    return {
        type: "node",
        feature: split.feature,
        threshold: round(split.threshold),
        gini: round(giniImpurity(points)),
        samples: points.length,
        value: getClassValues(counts),
        left: buildTree(split.leftPoints, depth + 1, options, random),
        right: buildTree(split.rightPoints, depth + 1, options, random)
    };
}

function createLeaf(points, counts, majorityClass) {
    return {
        type: "leaf",
        class: majorityClass,
        gini: round(giniImpurity(points)),
        samples: points.length,
        value: getClassValues(counts)
    };
}

function findBestSplit(points, random) {
    const features = trainingState.modelFeatureNames.slice().sort(function() {
        return random() - 0.5;
    });
    let bestSplit = null;

    features.forEach(function(feature) {
        const values = Array.from(new Set(points.map(function(point) {
            return getPointFeatureValue(point, feature);
        })))
            .filter(Number.isFinite)
            .sort(function(a, b) {
                return a - b;
            });

        for (let index = 1; index < values.length; index += 1) {
            const threshold = (values[index - 1] + values[index]) / 2;
            const leftPoints = points.filter(function(point) {
                return getPointFeatureValue(point, feature) <= threshold;
            });
            const rightPoints = points.filter(function(point) {
                return getPointFeatureValue(point, feature) > threshold;
            });

            if (leftPoints.length === 0 || rightPoints.length === 0) {
                continue;
            }

            const score = weightedGini(leftPoints, rightPoints);

            if (bestSplit === null || score < bestSplit.score) {
                bestSplit = {
                    feature: feature,
                    threshold: threshold,
                    leftPoints: leftPoints,
                    rightPoints: rightPoints,
                    score: score
                };
            }
        }
    });

    return bestSplit;
}

function weightedGini(leftPoints, rightPoints) {
    const total = leftPoints.length + rightPoints.length;

    return (leftPoints.length / total) * giniImpurity(leftPoints) +
        (rightPoints.length / total) * giniImpurity(rightPoints);
}

function giniImpurity(points) {
    if (points.length === 0) {
        return 0;
    }

    const counts = countClasses(points);

    return 1 - Object.keys(counts).reduce(function(sum, className) {
        const probability = counts[className] / points.length;
        return sum + probability * probability;
    }, 0);
}

function countClasses(points) {
    return points.reduce(function(counts, point) {
        counts[point.class] = (counts[point.class] || 0) + 1;
        return counts;
    }, {});
}

function getClassValues(counts) {
    return trainingState.classes.map(function(className) {
        return counts[className] || 0;
    });
}
