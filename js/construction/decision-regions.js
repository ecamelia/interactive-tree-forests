// Dessin des regions de decision de l'arbre courant.

function drawDecisionRegions(tree, activePath) {
    regionLayer.selectAll("*").remove();

    const margin = {
        top: 20,
        right: 20,
        bottom: 48,
        left: 54
    };
    const innerWidth = 430;
    const innerHeight = 420;
    const xDomain = getRegionDomain(demoPoints, "x1");
    const yDomain = getRegionDomain(demoPoints, "x2");
    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([margin.left, margin.left + innerWidth]);
    const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([margin.top + innerHeight, margin.top]);

    drawRegionBackgrounds(tree, xScale, yScale, xDomain, yDomain);
    drawRegionAxes(xScale, yScale, margin, innerWidth, innerHeight);
    drawRegionSplitLines(tree, activePath, xScale, yScale, xDomain, yDomain);
    drawRegionPoints(xScale, yScale);
}

function drawRegionBackgrounds(tree, xScale, yScale, xDomain, yDomain) {
    const regions = getVisibleDecisionRegions(tree, {
        xMin: xDomain[0],
        xMax: xDomain[1],
        yMin: yDomain[0],
        yMax: yDomain[1]
    });

    regionLayer.selectAll(".region-background")
        .data(regions)
        .enter()
        .append("rect")
        .attr("class", "region-background")
        .attr("x", function(region) {
            return xScale(region.bounds.xMin);
        })
        .attr("y", function(region) {
            return yScale(region.bounds.yMax);
        })
        .attr("width", function(region) {
            return Math.max(0, xScale(region.bounds.xMax) - xScale(region.bounds.xMin));
        })
        .attr("height", function(region) {
            return Math.max(0, yScale(region.bounds.yMin) - yScale(region.bounds.yMax));
        })
        .attr("fill", function(region) {
            return getRegionColor(region.className);
        });
}

function drawRegionAxes(xScale, yScale, margin, innerWidth, innerHeight) {
    regionLayer.append("g")
        .attr("transform", "translate(0, " + (margin.top + innerHeight) + ")")
        .call(d3.axisBottom(xScale).ticks(5));

    regionLayer.append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(yScale).ticks(5));

    regionLayer.append("text")
        .attr("x", margin.left + innerWidth / 2)
        .attr("y", margin.top + innerHeight + 40)
        .attr("text-anchor", "middle")
        .text(regionFeatureNames[0]);

    regionLayer.append("text")
        .attr("x", -(margin.top + innerHeight / 2))
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text(regionFeatureNames[1]);
}

function drawRegionPoints(xScale, yScale) {
    regionLayer.selectAll(".region-point")
        .data(demoPoints)
        .enter()
        .append("circle")
        .attr("class", "region-point")
        .attr("cx", function(point) {
            return xScale(point.x1);
        })
        .attr("cy", function(point) {
            return yScale(point.x2);
        })
        .attr("r", 4.5)
        .attr("fill", function(point) {
            return getRegionColor(point.class);
        });
}

function drawRegionSplitLines(tree, activePath, xScale, yScale, xDomain, yDomain) {
    visitVisibleSplits(tree, {
        xMin: xDomain[0],
        xMax: xDomain[1],
        yMin: yDomain[0],
        yMax: yDomain[1]
    }, function(node, bounds) {
        if (node.feature !== regionFeatureNames[0] && node.feature !== regionFeatureNames[1]) {
            return;
        }

        regionLayer.append("line")
            .attr("class", node.buildPath === activePath ? "region-split-line is-active" : "region-split-line")
            .attr("x1", node.feature === regionFeatureNames[0] ? xScale(node.threshold) : xScale(bounds.xMin))
            .attr("x2", node.feature === regionFeatureNames[0] ? xScale(node.threshold) : xScale(bounds.xMax))
            .attr("y1", node.feature === regionFeatureNames[0] ? yScale(bounds.yMin) : yScale(node.threshold))
            .attr("y2", node.feature === regionFeatureNames[0] ? yScale(bounds.yMax) : yScale(node.threshold));
    });
}

function visitVisibleSplits(node, bounds, callback) {
    if (!node || node.collapsed || (!node.left && !node.right)) {
        return;
    }

    callback(node, bounds);

    const childBounds = splitRegionBounds(node, bounds);
    visitVisibleSplits(node.left, childBounds.left, callback);
    visitVisibleSplits(node.right, childBounds.right, callback);
}

function getVisibleDecisionRegions(node, bounds) {
    if (!node) {
        return [];
    }

    if (node.collapsed || (!node.left && !node.right)) {
        return [
            {
                bounds: bounds,
                className: getMostLikelyClass(node)
            }
        ];
    }

    if (!isSupportedRegionSplit(node)) {
        return [
            {
                bounds: bounds,
                className: getMostLikelyClass(node)
            }
        ];
    }

    const childBounds = splitRegionBounds(node, bounds);

    return getVisibleDecisionRegions(node.left, childBounds.left)
        .concat(getVisibleDecisionRegions(node.right, childBounds.right));
}

function splitRegionBounds(node, bounds) {
    const threshold = Number(node.threshold);
    const leftBounds = { ...bounds };
    const rightBounds = { ...bounds };

    if (node.feature === regionFeatureNames[0]) {
        leftBounds.xMax = Math.min(leftBounds.xMax, threshold);
        rightBounds.xMin = Math.max(rightBounds.xMin, threshold);
    }

    if (node.feature === regionFeatureNames[1]) {
        leftBounds.yMax = Math.min(leftBounds.yMax, threshold);
        rightBounds.yMin = Math.max(rightBounds.yMin, threshold);
    }

    return {
        left: leftBounds,
        right: rightBounds
    };
}

function isSupportedRegionSplit(node) {
    return Number.isFinite(Number(node.threshold)) &&
        (node.feature === regionFeatureNames[0] || node.feature === regionFeatureNames[1]);
}

function getRegionFeatureNames(data, tree) {
    const treeFeatures = getTreeFeatureNames(tree);
    const dataFeatures = Array.isArray(data.features) ? data.features : getDataFeatureNames(data);
    const dataFeaturesInTree = dataFeatures.filter(function(featureName) {
        return treeFeatures.includes(featureName);
    });

    if (dataFeaturesInTree.length >= 2) {
        return dataFeaturesInTree.slice(0, 2);
    }

    if (treeFeatures.length >= 2) {
        return treeFeatures.slice(0, 2);
    }

    if (dataFeatures.length >= 2) {
        return dataFeatures.slice(0, 2);
    }

    return ["x1", "x2"];
}

function getTreeFeatureNames(tree) {
    const features = [];
    visitTreeForFeatures(tree, features);
    return features;
}

function visitTreeForFeatures(node, features) {
    if (!node || node.type === "leaf") {
        return;
    }

    if (node.feature && !features.includes(node.feature)) {
        features.push(node.feature);
    }

    visitTreeForFeatures(node.left, features);
    visitTreeForFeatures(node.right, features);
}

function getDataFeatureNames(data) {
    if (!data || !Array.isArray(data.data) || !data.data.length) {
        return [];
    }

    return Object.keys(data.data[0]).filter(function(key) {
        return key !== "class";
    });
}

function getRegionPoints(data, tree) {
    if (data && Array.isArray(data.data) && data.data.length) {
        const points = data.data
            .map(normalizeRegionPoint)
            .filter(Boolean);

        if (points.length) {
            return points;
        }
    }

    return createDemoPoints(tree);
}

function normalizeRegionPoint(point) {
    const xValue = Number(point[regionFeatureNames[0]]);
    const yValue = Number(point[regionFeatureNames[1]]);

    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
        return null;
    }

    return {
        x1: xValue,
        x2: yValue,
        class: Number.isFinite(Number(point.class)) ? Number(point.class) : 0
    };
}

function getRegionDomain(points, propertyName) {
    const values = points
        .map(function(point) {
            return Number(point[propertyName]);
        })
        .filter(Number.isFinite);

    if (!values.length) {
        return [0, 1];
    }

    const minValue = d3.min(values);
    const maxValue = d3.max(values);

    if (minValue === maxValue) {
        return [minValue - 1, maxValue + 1];
    }

    const padding = (maxValue - minValue) * 0.08;
    return [minValue - padding, maxValue + padding];
}

function createDemoPoints(tree) {
    const points = [];

    for (let index = 0; index < 120; index += 1) {
        const x1 = seededRandom(index * 2 + 1);
        const x2 = seededRandom(index * 2 + 2);
        const observation = {};

        observation[regionFeatureNames[0]] = x1;
        observation[regionFeatureNames[1]] = x2;

        points.push({
            x1: x1,
            x2: x2,
            class: predictTreeClass(tree, observation)
        });
    }

    return points;
}

function seededRandom(seed) {
    const value = Math.sin(seed * 999) * 10000;
    return value - Math.floor(value);
}

function predictTreeClass(tree, observation) {
    let node = tree;

    while (node && (node.left || node.right)) {
        const featureValue = observation[node.feature];

        if (!Number.isFinite(featureValue)) {
            break;
        }

        node = featureValue <= Number(node.threshold) ? node.left : node.right;
    }

    return getMostLikelyClass(node || tree);
}

function getMostLikelyClass(node) {
    if (!node) {
        return 0;
    }

    if (Number.isFinite(Number(node.class))) {
        return Number(node.class);
    }

    if (Array.isArray(node.value) && node.value.length) {
        return node.value.reduce(function(bestIndex, currentValue, currentIndex) {
            return currentValue > node.value[bestIndex] ? currentIndex : bestIndex;
        }, 0);
    }

    return 0;
}

function getRegionColor(className) {
    const colors = ["#a6cee3", "#fb9a99", "#c7b9ff"];
    return colors[className] || "#dddddd";
}
