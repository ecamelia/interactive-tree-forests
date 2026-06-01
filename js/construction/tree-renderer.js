// Dessin de l'arbre dans la page construction.

const constructionDetailConfig = {
    nodeShape: "box",
    boxWidth: 118,
    boxHeight: 62,
    layoutWidth: 460,
    layoutHeight: 300,
    translateX: 95,
    translateY: 45,
    textStartY: -24,
    textStep: 13
};

function drawConstructionTree(tree, activePath) {
    constructionLayer.selectAll("*").remove();

    const config = createAutoLayoutConfig(tree, constructionDetailConfig);
    const group = constructionLayer
        .append("g")
        .attr("transform", "translate(" + config.translateX + ", " + config.translateY + ")");

    drawDecisionTree(tree, group, config, {
        idPrefix: "construction",
        treeKey: "construction",
        getNodeDisplayOptions: function(d) {
            return {
                condition: d.data.type !== "leaf",
                gini: true,
                samples: true,
                value: true,
                class: false
            };
        },
        isPathNode: function(d) {
            return activePath && d.data.buildPath === activePath;
        }
    });

    constructionSvg
        .attr("width", Math.max(900, Math.ceil(config.layoutWidth + config.translateX * 2)))
        .attr("height", Math.max(560, Math.ceil(config.layoutHeight + config.translateY + 130)));
}

function drawConstructionForest(forest) {
    constructionLayer.selectAll("*").remove();

    const items = getConstructionForestItems(forest);
    const startX = 70;
    const startY = 70;
    const treeGapX = 70;
    const treeGapY = 95;
    const maxRowWidth = 1040;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0;
    let maxWidth = startX;
    let maxHeight = startY;

    items.forEach(function(item) {
        if (item.type === "hidden") {
            if (currentX > startX && currentX + 120 > maxRowWidth) {
                currentX = startX;
                currentY += rowHeight + treeGapY;
                rowHeight = 0;
            }

            drawHiddenForestCount(currentX, currentY, item.count);
            currentX += 120 + treeGapX;
            rowHeight = Math.max(rowHeight, 220);
            maxWidth = Math.max(maxWidth, currentX);
            maxHeight = Math.max(maxHeight, currentY + rowHeight);
            return;
        }

        const root = item.tree.root || item.tree;
        const config = createAutoLayoutConfig(root, {
            ...constructionDetailConfig,
            boxWidth: 118,
            boxHeight: 64,
            layoutWidth: 320,
            layoutHeight: 250,
            translateX: 75,
            translateY: 45,
            textStartY: -24,
            textStep: 14
        });

        if (currentX > startX && currentX + config.layoutWidth > maxRowWidth) {
            currentX = startX;
            currentY += rowHeight + treeGapY;
            rowHeight = 0;
        }

        const treeGroup = constructionLayer
            .append("g")
            .attr("transform", "translate(" + currentX + ", " + currentY + ")");

        treeGroup.append("text")
            .attr("class", "tree-title")
            .attr("x", config.layoutWidth / 2)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Arbre " + item.originalIndex);

        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(" + config.translateX + ", " + (config.translateY + 35) + ")");

        drawDecisionTree(root, drawingGroup, config, {
            idPrefix: "construction-forest-" + item.originalIndex,
            treeKey: "construction-forest-" + item.originalIndex,
            getNodeDisplayOptions: function(d) {
                return {
                    condition: d.data.type !== "leaf",
                    gini: false,
                    samples: false,
                    value: false,
                    class: d.data.type === "leaf"
                };
            }
        });

        currentX += config.layoutWidth + treeGapX;
        rowHeight = Math.max(rowHeight, config.layoutHeight + 110);
        maxWidth = Math.max(maxWidth, currentX);
        maxHeight = Math.max(maxHeight, currentY + rowHeight);
    });

    constructionSvg
        .attr("width", Math.max(1200, Math.ceil(maxWidth + 100)))
        .attr("height", Math.max(700, Math.ceil(maxHeight + 120)));
}

function getConstructionForestItems(forest) {
    const visibleLimit = 4;
    const trees = Array.isArray(forest.trees) ? forest.trees : [];

    if (trees.length <= visibleLimit + 1) {
        return trees.map(function(tree, index) {
            return {
                type: "tree",
                tree: tree,
                originalIndex: index + 1
            };
        });
    }

    return trees.slice(0, visibleLimit).map(function(tree, index) {
        return {
            type: "tree",
            tree: tree,
            originalIndex: index + 1
        };
    }).concat([
        {
            type: "hidden",
            count: trees.length - visibleLimit - 1
        },
        {
            type: "tree",
            tree: trees[trees.length - 1],
            originalIndex: trees.length
        }
    ]);
}

function drawHiddenForestCount(xPosition, yPosition, hiddenTreeCount) {
    const group = constructionLayer
        .append("g")
        .attr("transform", "translate(" + xPosition + ", " + yPosition + ")");

    group.append("text")
        .attr("class", "hidden-trees-dots")
        .attr("x", 60)
        .attr("y", 120)
        .attr("text-anchor", "middle")
        .text("...");

    group.append("text")
        .attr("class", "hidden-trees-label")
        .attr("x", 60)
        .attr("y", 150)
        .attr("text-anchor", "middle")
        .text(hiddenTreeCount + " arbres");
}

function getTreeInteractions() {
    return {};
}
