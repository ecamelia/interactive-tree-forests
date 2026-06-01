// Rendu general
function renderTrainingView() {
    const decisionMap = getCurrentTreeCount() ? createDecisionMap() : [];
    drawDecisionMap(decisionMap);
    drawTreeMaps();
    updateTrainingStatus(decisionMap);
}

function createDecisionMap() {
    const cells = [];
    const gridSize = mapConfig.gridSize;
    const domains = getCurrentDomains();
    const xDomain = domains.xDomain;
    const yDomain = domains.yDomain;

    for (let xIndex = 0; xIndex < gridSize; xIndex += 1) {
        for (let yIndex = 0; yIndex < gridSize; yIndex += 1) {
            const x = interpolateDomain(xDomain, (xIndex + 0.5) / gridSize);
            const y = interpolateDomain(yDomain, (yIndex + 0.5) / gridSize);
            const observation = createObservation(x, y);
            const votes = getForestVotes(observation);
            const predictedClass = getMajorityClass(votes);

            cells.push({
                xIndex: xIndex,
                yIndex: yIndex,
                xMin: interpolateDomain(xDomain, xIndex / gridSize),
                xMax: interpolateDomain(xDomain, (xIndex + 1) / gridSize),
                yMin: interpolateDomain(yDomain, yIndex / gridSize),
                yMax: interpolateDomain(yDomain, (yIndex + 1) / gridSize),
                class: predictedClass,
                confidence: votes[predictedClass] / getCurrentTreeCount()
            });
        }
    }

    return cells;
}

// Echelles du graphique
function createObservation(xValue, yValue) {
    const observation = {};

    observation[trainingState.featureNames[0]] = xValue;
    observation[trainingState.featureNames[1]] = yValue;

    return observation;
}

function getPointFeatureValue(point, featureName) {
    return Number(point[featureName]);
}

function getCurrentDomains() {
    return {
        xDomain: getFeatureDomain(trainingState.featureNames[0]),
        yDomain: getFeatureDomain(trainingState.featureNames[1])
    };
}

function getFeatureDomain(featureName) {
    const values = trainingState.points
        .map(function(point) {
            return getPointFeatureValue(point, featureName);
        })
        .filter(Number.isFinite);
    const thresholds = [];

    trainingState.forest.forEach(function(tree) {
        collectFeatureThresholds(tree, featureName, thresholds);
    });

    const allValues = values.concat(thresholds);

    if (!allValues.length) {
        return [0, 1];
    }

    const minValue = d3.min(allValues);
    const maxValue = d3.max(allValues);

    if (minValue === maxValue) {
        return [minValue - 1, maxValue + 1];
    }

    const padding = Math.max((maxValue - minValue) * 0.08, 0.02);
    return [minValue - padding, maxValue + padding];
}

function interpolateDomain(domain, ratio) {
    return domain[0] + ratio * (domain[1] - domain[0]);
}

function collectFeatureThresholds(node, featureName, thresholds) {
    if (!node || node.type === "leaf") {
        return;
    }

    if (node.feature === featureName && Number.isFinite(Number(node.threshold))) {
        thresholds.push(Number(node.threshold));
    }

    collectFeatureThresholds(node.left, featureName, thresholds);
    collectFeatureThresholds(node.right, featureName, thresholds);
}

// Dessin de la carte de decision
function drawDecisionMap(cells) {
    mapSvg.selectAll("*").remove();

    const innerWidth = mapConfig.width - mapConfig.margin.left - mapConfig.margin.right;
    const innerHeight = mapConfig.height - mapConfig.margin.top - mapConfig.margin.bottom;
    const domains = getCurrentDomains();
    const xScale = d3.scaleLinear().domain(domains.xDomain).range([mapConfig.margin.left, mapConfig.margin.left + innerWidth]);
    const yScale = d3.scaleLinear().domain(domains.yDomain).range([mapConfig.margin.top + innerHeight, mapConfig.margin.top]);

    if (cells.length) {
        mapSvg.selectAll(".training-map-cell")
            .data(cells)
            .enter()
            .append("rect")
            .attr("class", "training-map-cell")
            .attr("x", function(cell) {
                return xScale(cell.xMin);
            })
            .attr("y", function(cell) {
                return yScale(cell.yMax);
            })
            .attr("width", function(cell) {
                return xScale(cell.xMax) - xScale(cell.xMin);
            })
            .attr("height", function(cell) {
                return yScale(cell.yMin) - yScale(cell.yMax);
            })
            .attr("fill", function(cell) {
                return getTrainingColor(cell.class);
            })
            .attr("fill-opacity", function(cell) {
                return 0.25 + cell.confidence * 0.55;
            });
    }

    mapSvg.selectAll(".training-point")
        .data(trainingState.points)
        .enter()
        .append("circle")
        .attr("class", "training-point")
        .attr("cx", function(point) {
            return xScale(getPointFeatureValue(point, trainingState.featureNames[0]));
        })
        .attr("cy", function(point) {
            return yScale(getPointFeatureValue(point, trainingState.featureNames[1]));
        })
        .attr("r", 4.3)
        .attr("fill", function(point) {
            return getTrainingColor(point.class);
        });

    mapSvg.append("g")
        .attr("transform", "translate(0," + (mapConfig.margin.top + innerHeight) + ")")
        .call(d3.axisBottom(xScale).ticks(5));

    mapSvg.append("g")
        .attr("transform", "translate(" + mapConfig.margin.left + ",0)")
        .call(d3.axisLeft(yScale).ticks(5));

    mapSvg.append("text")
        .attr("x", mapConfig.margin.left + innerWidth / 2)
        .attr("y", mapConfig.height - 10)
        .attr("text-anchor", "middle")
        .text(trainingState.featureNames[0]);

    mapSvg.append("text")
        .attr("x", -(mapConfig.margin.top + innerHeight / 2))
        .attr("y", 18)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text(trainingState.featureNames[1]);

    drawTrainingLegend();
}

function drawTrainingLegend() {
    const legend = mapSvg.append("g")
        .attr("class", "training-legend")
        .attr("transform", "translate(" + (mapConfig.margin.left + 8) + ", " + (mapConfig.margin.top + 8) + ")");

    trainingState.classes.forEach(function(className, index) {
        const item = legend.append("g")
            .attr("transform", "translate(" + (index * 92) + ", 0)");

        item.append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", getTrainingColor(className))
            .attr("stroke", "#555");

        item.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text("classe " + className);
    });
}

// Dessin des cartes individuelles
function drawTreeMaps() {
    treeMapsContainer.innerHTML = "";

    trainingState.forest.slice(0, 8).forEach(function(tree, index) {
        const card = document.createElement("article");
        card.className = "training-tree-card";

        const title = document.createElement("h3");
        title.textContent = "Arbre " + (index + 1);
        card.appendChild(title);

        const summary = document.createElement("p");
        summary.textContent = "profondeur " + getTreeDepth(tree) + ", " + countLeaves(tree) + " feuilles";
        card.appendChild(summary);

        const miniSvg = d3.select(card)
            .append("svg")
            .attr("width", 170)
            .attr("height", 130);

        drawMiniTreeMap(miniSvg, tree);
        treeMapsContainer.appendChild(card);
    });

    if (trainingState.forest.length > 8) {
        const extra = document.createElement("article");
        extra.className = "training-tree-card training-tree-card-extra";
        extra.textContent = "... " + (trainingState.forest.length - 8) + " arbres en plus";
        treeMapsContainer.appendChild(extra);
    }
}

function drawMiniTreeMap(svgSelection, tree) {
    const size = 28;
    const width = 170;
    const height = 130;
    const margin = 8;

    const domains = getCurrentDomains();

    for (let xIndex = 0; xIndex < size; xIndex += 1) {
        for (let yIndex = 0; yIndex < size; yIndex += 1) {
            const x = interpolateDomain(domains.xDomain, (xIndex + 0.5) / size);
            const y = interpolateDomain(domains.yDomain, (yIndex + 0.5) / size);
            const prediction = predictTree(tree, createObservation(x, y));

            svgSelection.append("rect")
                .attr("x", margin + xIndex * ((width - margin * 2) / size))
                .attr("y", margin + (size - yIndex - 1) * ((height - margin * 2) / size))
                .attr("width", (width - margin * 2) / size + 0.2)
                .attr("height", (height - margin * 2) / size + 0.2)
                .attr("fill", getTrainingColor(prediction))
                .attr("fill-opacity", 0.55);
        }
    }
}
