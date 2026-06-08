// Rendu general
function renderTrainingView() {
    mapTitle.textContent = "Décision collective de la forêt";

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

    // La carte est une grille : chaque cellule reçoit la classe predite par le modele.
    for (let xIndex = 0; xIndex < gridSize; xIndex += 1) {
        for (let yIndex = 0; yIndex < gridSize; yIndex += 1) {
            const x = interpolateDomain(xDomain, (xIndex + 0.5) / gridSize);
            const y = interpolateDomain(yDomain, (yIndex + 0.5) / gridSize);
            const observation = createObservation(x, y);
            const prediction = predictCurrentTrainingModel(observation);

            cells.push({
                xIndex: xIndex,
                yIndex: yIndex,
                xMin: interpolateDomain(xDomain, xIndex / gridSize),
                xMax: interpolateDomain(xDomain, (xIndex + 1) / gridSize),
                yMin: interpolateDomain(yDomain, yIndex / gridSize),
                yMax: interpolateDomain(yDomain, (yIndex + 1) / gridSize),
                class: prediction.className,
                confidence: prediction.confidence
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
    observation.r2 = getCenteredDistance(xValue, yValue);

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

    // Les seuils des arbres sont inclus pour que la carte couvre bien les coupures.
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
        drawDecisionBackground(xScale, yScale, domains, Math.round(innerWidth), Math.round(innerHeight));
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

function drawDecisionBackground(xScale, yScale, domains, pixelWidth, pixelHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const context = canvas.getContext("2d");
    const imageData = context.createImageData(pixelWidth, pixelHeight);
    const data = imageData.data;

    // Chaque pixel est classe par le modele pour former la carte de decision.
    for (let xIndex = 0; xIndex < pixelWidth; xIndex += 1) {
        for (let yIndex = 0; yIndex < pixelHeight; yIndex += 1) {
            const x = interpolateDomain(domains.xDomain, (xIndex + 0.5) / pixelWidth);
            const y = interpolateDomain(domains.yDomain, 1 - (yIndex + 0.5) / pixelHeight);
            const prediction = predictCurrentTrainingModel(createObservation(x, y));
            const color = d3.color(getConfidenceColor(prediction.className, prediction.confidence));
            const pixelIndex = (yIndex * pixelWidth + xIndex) * 4;

            data[pixelIndex] = color.r;
            data[pixelIndex + 1] = color.g;
            data[pixelIndex + 2] = color.b;
            data[pixelIndex + 3] = 255;
        }
    }

    context.putImageData(imageData, 0, 0);

    mapSvg.append("image")
        .attr("class", "training-map-background")
        .attr("x", xScale(domains.xDomain[0]))
        .attr("y", yScale(domains.yDomain[1]))
        .attr("width", pixelWidth)
        .attr("height", pixelHeight)
        .attr("preserveAspectRatio", "none")
        .attr("href", canvas.toDataURL("image/png"));
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
    sideTitle.textContent = "Cartes individuelles des arbres";

    // Les cartes de droite montrent chaque arbre avant le vote collectif.
    if (isLibraryForestMode()) {
        drawLibraryForestMaps();
        return;
    }

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

function drawLibraryForestMaps() {
    if (!trainingState.libraryModel) {
        drawLibraryForestSummary();
        return;
    }

    const visibleTrees = Math.min(trainingState.libraryTreeCount, 8);

    for (let index = 0; index < visibleTrees; index += 1) {
        const card = document.createElement("article");
        card.className = "training-tree-card";

        const title = document.createElement("h3");
        title.textContent = "Arbre " + (index + 1);
        card.appendChild(title);

        const summary = document.createElement("p");
        summary.textContent = "estimateur de ml-random-forest";
        card.appendChild(summary);

        const miniSvg = d3.select(card)
            .append("svg")
            .attr("width", 170)
            .attr("height", 130);

        drawLibraryMiniMap(miniSvg, index);
        treeMapsContainer.appendChild(card);
    }

    if (trainingState.libraryTreeCount > 8) {
        const extra = document.createElement("article");
        extra.className = "training-tree-card training-tree-card-extra";
        extra.textContent = "... " + (trainingState.libraryTreeCount - 8) + " arbres en plus";
        treeMapsContainer.appendChild(extra);
    }
}

function drawLibraryForestSummary() {
    const card = document.createElement("article");
    card.className = "training-tree-card training-library-card";

    const title = document.createElement("h3");
    title.textContent = "ml-random-forest";
    card.appendChild(title);

    const summary = document.createElement("p");
    summary.textContent = trainingState.libraryModel
        ? trainingState.libraryTreeCount + " arbres entraînés par la bibliothèque."
        : "La bibliothèque sera chargée au lancement de l'entraînement.";
    card.appendChild(summary);

    treeMapsContainer.appendChild(card);
}

function drawLibraryMiniMap(svgSelection, treeIndex) {
    const width = 170;
    const height = 130;
    const margin = 8;
    const domains = getCurrentDomains();
    const canvas = createMiniMapCanvas(width - margin * 2, height - margin * 2, function(x, y) {
        return getConfidenceColor(predictLibraryTree(treeIndex, createObservation(x, y)), 0.55);
    }, domains);

    drawMiniMapImage(svgSelection, canvas, width, height, margin);
}

function drawMiniTreeMap(svgSelection, tree) {
    const width = 170;
    const height = 130;
    const margin = 8;
    const domains = getCurrentDomains();
    const canvas = createMiniMapCanvas(width - margin * 2, height - margin * 2, function(x, y) {
        return getConfidenceColor(predictTree(tree, createObservation(x, y)), 0.55);
    }, domains);

    drawMiniMapImage(svgSelection, canvas, width, height, margin);
}

function createMiniMapCanvas(width, height, getColor, domains) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    const imageData = context.createImageData(width, height);
    const data = imageData.data;

    for (let xIndex = 0; xIndex < width; xIndex += 1) {
        for (let yIndex = 0; yIndex < height; yIndex += 1) {
            const x = interpolateDomain(domains.xDomain, (xIndex + 0.5) / width);
            const y = interpolateDomain(domains.yDomain, 1 - (yIndex + 0.5) / height);
            const color = d3.color(getColor(x, y));
            const pixelIndex = (yIndex * width + xIndex) * 4;

            data[pixelIndex] = color.r;
            data[pixelIndex + 1] = color.g;
            data[pixelIndex + 2] = color.b;
            data[pixelIndex + 3] = 255;
        }
    }

    context.putImageData(imageData, 0, 0);

    return canvas;
}

function drawMiniMapImage(svgSelection, canvas, width, height, margin) {
    svgSelection.append("image")
        .attr("x", margin)
        .attr("y", margin)
        .attr("width", width - margin * 2)
        .attr("height", height - margin * 2)
        .attr("preserveAspectRatio", "none")
        .attr("href", canvas.toDataURL("image/png"));
}
