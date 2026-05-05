// Message affiche avant qu'un fichier JSON soit charge.
function showEmptyState() {
    currentView = null;
    currentForest = null;
    currentTree = null;
    clearTreeView();
    resetZoom();
    updateForestTotalStatus();
    updateObservationPanel();
    setEmptySvgStyle();
}

// Affiche une foret en limitant le nombre d'arbres visibles si besoin.
function drawForest(forest) {
    currentView = VIEW_TYPE.FOREST;
    currentForest = forest;
    updateForestTotalStatus();
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    let currentX = 90;
    let maxHeight = 0;

    const visibleTrees = forest.trees.slice(0, forestTreeLimit);
    const hiddenTreeCount = Math.max(0, forest.trees.length - visibleTrees.length);

    visibleTrees.forEach(function(tree, index) {
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

    if (hiddenTreeCount > 0) {
        currentX += drawHiddenTreesPlaceholder(currentX, hiddenTreeCount);
        maxHeight = Math.max(maxHeight, 360);
    }

    resizeSvg(currentX + 120, maxHeight + 220);
}

// Cree le groupe SVG reserve a un arbre dans la vue foret.
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

// Bloc visuel utilise quand une foret contient plus d'arbres que la limite.
function drawHiddenTreesPlaceholder(xPosition, hiddenTreeCount) {
    const group = zoomLayer
        .append("g")
        .attr("class", "hidden-trees-group")
        .attr("transform", "translate(" + xPosition + ", 70)");

    group.append("text")
        .attr("class", "hidden-trees-dots")
        .attr("x", 120)
        .attr("y", 170)
        .attr("text-anchor", "middle")
        .text("...");

    group.append("text")
        .attr("class", "hidden-trees-label")
        .attr("x", 120)
        .attr("y", 210)
        .attr("text-anchor", "middle")
        .text(hiddenTreeCount + " arbres masques");

    return 280;
}

// Affiche un seul arbre dans la zone principale.
function drawTree(tree) {
    currentView = VIEW_TYPE.TREE;
    currentTree = tree;
    updateForestTotalStatus();
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

// Nettoie la zone de dessin avant un nouvel affichage.
function clearTreeView() {
    zoomLayer.selectAll("*").remove();
}

// Redessine la vue actuelle apres un changement d'option.
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

// Revient a la position initiale du zoom.
function resetZoom() {
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
}

// Ajuste le SVG a la taille necessaire pour l'arbre affiche.
function resizeSvg(width, height) {
    svg
        .attr("width", Math.max(1200, Math.ceil(width)))
        .attr("height", Math.max(700, Math.ceil(height)));
}

// Style plus leger quand aucun fichier n'est encore charge.
function setEmptySvgStyle() {
    document.body.classList.add("empty-view");
    svg.classed("empty-state", true);
    emptyState.classList.remove("is-hidden");
}

// Style normal quand une visualisation est affichee.
function setActiveSvgStyle() {
    document.body.classList.remove("empty-view");
    svg.classed("empty-state", false);
    emptyState.classList.add("is-hidden");
}

// Calcule un layout assez large pour eviter que les noeuds se chevauchent.
function createAutoLayoutConfig(tree, baseConfig) {
    const leafCount = countLeaves(tree);
    const depth = getTreeDepth(tree);
    const maxBoxWidth = getMaxVisibleNodeBoxWidth(tree, baseConfig, getTreeInteractions());
    const horizontalGap = maxBoxWidth + (isOverviewMode() ? 90 : 150);
    const verticalGap = baseConfig.boxHeight + (isOverviewMode() ? 80 : 95);

    return {
        ...baseConfig,
        maxBoxWidth: maxBoxWidth,
        layoutWidth: Math.max(baseConfig.layoutWidth, Math.max(1, leafCount - 1) * horizontalGap),
        layoutHeight: Math.max(baseConfig.layoutHeight, Math.max(1, depth - 1) * verticalGap)
    };
}

// Le mode general remplace les rectangles par des cercles plus compacts.
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

// Retourne l'arbre entier ou seulement les premiers niveaux.
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

// Copie l'arbre en coupant les branches au niveau demande.
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

// Nombre de feuilles utilise pour calculer l'espace horizontal.
function countLeaves(node) {
    if (!node.left && !node.right) {
        return 1;
    }

    return (node.left ? countLeaves(node.left) : 0) +
        (node.right ? countLeaves(node.right) : 0);
}

// Profondeur utilisee pour calculer l'espace vertical.
function getTreeDepth(node) {
    const leftDepth = node.left ? getTreeDepth(node.left) : 0;
    const rightDepth = node.right ? getTreeDepth(node.right) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
}
