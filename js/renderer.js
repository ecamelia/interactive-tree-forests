function showEmptyState() {
    clearTreeView();
    resetZoom();
    setEmptySvgStyle();

    const width = getAvailableSvgWidth();
    const height = 360;

    svg
        .attr("width", width)
        .attr("height", height);

    zoomLayer.append("text")
        .attr("class", "empty-message")
        .attr("x", width / 2)
        .attr("y", height / 2 - 12)
        .attr("text-anchor", "middle")
        .text("Chargez votre fichier JSON");

    zoomLayer.append("text")
        .attr("class", "empty-submessage")
        .attr("x", width / 2)
        .attr("y", height / 2 + 24)
        .attr("text-anchor", "middle")
        .text("L'outil affichera automatiquement un arbre ou une foret.");
}

function drawForest(forest) {
    currentView = VIEW_TYPE.FOREST;
    currentForest = forest;
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    let currentX = 90;
    let maxHeight = 0;

    forest.trees.forEach(function(tree, index) {
        const treeId = tree.id || index + 1;
        const treeRoot = tree.root || tree;
        const visibleTreeRoot = getVisibleTreeRoot(treeRoot);
        const treeConfig = createAutoLayoutConfig(visibleTreeRoot, getBaseTreeConfig(overviewConfig));
        const treeGroup = createForestTreeGroup(visibleTreeRoot, treeId, currentX, treeConfig);
        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(0, 60)");

        drawDecisionTree(visibleTreeRoot, drawingGroup, treeConfig, {
            ...getTreeInteractions(),
            idPrefix: "forest-" + treeId,
            treeKey: "forest-" + treeId
        });

        currentX += treeConfig.layoutWidth + 320;
        maxHeight = Math.max(maxHeight, treeConfig.layoutHeight);
    });

    resizeSvg(currentX + 120, maxHeight + 220);
}

function createForestTreeGroup(treeRoot, treeId, xPosition, config) {
    const titleX = getRootX(treeRoot, config);
    const treeGroup = zoomLayer
        .append("g")
        .attr("transform", "translate(" + xPosition + ", 70)");

    treeGroup.append("text")
        .attr("class", "tree-title")
        .attr("x", titleX)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .text("Arbre " + treeId);

    return treeGroup;
}

function drawTree(tree) {
    currentView = VIEW_TYPE.TREE;
    currentTree = tree;
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    const visibleTreeRoot = getVisibleTreeRoot(tree);
    const treeConfig = createAutoLayoutConfig(visibleTreeRoot, getBaseTreeConfig(detailConfig));
    const group = zoomLayer
        .append("g")
        .attr("transform", "translate(" + treeConfig.translateX + ", " + treeConfig.translateY + ")");

    drawDecisionTree(visibleTreeRoot, group, treeConfig, {
        ...getTreeInteractions(),
        idPrefix: "single",
        treeKey: "single"
    });

    resizeSvg(
        treeConfig.layoutWidth + treeConfig.translateX * 2,
        treeConfig.layoutHeight + treeConfig.translateY + 160
    );
}

function clearTreeView() {
    zoomLayer.selectAll("*").remove();
}

function redrawCurrentView() {
    if (currentView === VIEW_TYPE.TREE) {
        drawTree(currentTree);
        return;
    }

    if (currentView === VIEW_TYPE.FOREST) {
        drawForest(currentForest);
        return;
    }

    showEmptyState();
}

function resetZoom() {
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
}

function resizeSvg(width, height) {
    svg
        .attr("width", Math.max(1200, Math.ceil(width)))
        .attr("height", Math.max(700, Math.ceil(height)));
}

function getAvailableSvgWidth() {
    const main = document.querySelector("main");

    if (!main) {
        return 1200;
    }

    const styles = window.getComputedStyle(main);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const availableWidth = main.clientWidth - paddingLeft - paddingRight;

    return Math.max(700, availableWidth);
}

function setEmptySvgStyle() {
    document.body.classList.add("empty-view");
    svg.classed("empty-state", true);
}

function setActiveSvgStyle() {
    document.body.classList.remove("empty-view");
    svg.classed("empty-state", false);
}

function createAutoLayoutConfig(tree, baseConfig) {
    const leafCount = countLeaves(tree);
    const depth = getTreeDepth(tree);
    const horizontalGap = baseConfig.boxWidth + (isOverviewMode() ? 90 : 130);
    const verticalGap = baseConfig.boxHeight + (isOverviewMode() ? 80 : 95);

    return {
        ...baseConfig,
        layoutWidth: Math.max(baseConfig.layoutWidth, Math.max(1, leafCount - 1) * horizontalGap),
        layoutHeight: Math.max(baseConfig.layoutHeight, Math.max(1, depth - 1) * verticalGap)
    };
}

function getBaseTreeConfig(baseConfig) {
    if (!isOverviewMode()) {
        return baseConfig;
    }

    return {
        ...baseConfig,
        nodeShape: "circle",
        nodeRadius: 13,
        boxWidth: 26,
        boxHeight: 26,
        textStartY: 0,
        textStep: 0
    };
}

function isOverviewMode() {
    return displayMode === "overview";
}

function getVisibleTreeRoot(tree) {
    const maxDepth = getMaxVisibleDepth();

    if (!maxDepth) {
        return tree;
    }

    return cloneTreeUntilDepth(tree, 1, maxDepth);
}

function getMaxVisibleDepth() {
    if (maxVisibleDepth === "all") {
        return null;
    }

    return Number(maxVisibleDepth);
}

function cloneTreeUntilDepth(node, currentDepth, maxDepth) {
    const copy = { ...node };

    if (currentDepth >= maxDepth) {
        delete copy.left;
        delete copy.right;
        return copy;
    }

    if (node.left) {
        copy.left = cloneTreeUntilDepth(node.left, currentDepth + 1, maxDepth);
    } else {
        delete copy.left;
    }

    if (node.right) {
        copy.right = cloneTreeUntilDepth(node.right, currentDepth + 1, maxDepth);
    } else {
        delete copy.right;
    }

    return copy;
}

function countLeaves(node) {
    if (!node.left && !node.right) {
        return 1;
    }

    return (node.left ? countLeaves(node.left) : 0) +
        (node.right ? countLeaves(node.right) : 0);
}

function getTreeDepth(node) {
    const leftDepth = node.left ? getTreeDepth(node.left) : 0;
    const rightDepth = node.right ? getTreeDepth(node.right) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
}
