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

    const startX = 90;
    const startY = 80;
    const maxRowWidth = 1700;
    const treeGapX = 70;
    const treeGapY = 140;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0;
    let maxWidth = startX;
    let maxHeight = startY;

    const displayItems = getForestDisplayItems(forest);

    displayItems.forEach(function(item) {
        if (item.type === "hidden") {
            if (currentX > startX && currentX + 140 > maxRowWidth) {
                currentX = startX;
                currentY += rowHeight + treeGapY;
                rowHeight = 0;
            }

            currentX += drawHiddenTreesPlaceholder(currentX, currentY, item.count) + treeGapX;
            rowHeight = Math.max(rowHeight, 260);
            maxWidth = Math.max(maxWidth, currentX);
            maxHeight = Math.max(maxHeight, currentY + rowHeight);
            return;
        }

        const tree = item.tree;
        const treeId = tree.id || item.originalIndex;
        const treeRoot = getVisibleForestTreeRoot(tree.root || tree);
        const treeConfig = createAutoLayoutConfig(treeRoot, getBaseTreeConfig(overviewConfig));

        if (currentX > startX && currentX + treeConfig.layoutWidth > maxRowWidth) {
            currentX = startX;
            currentY += rowHeight + treeGapY;
            rowHeight = 0;
        }

        const treeGroup = createForestTreeGroup(treeRoot, treeId, currentX, currentY, treeConfig);
        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(0, 95)");

        drawDecisionTree(treeRoot, drawingGroup, treeConfig, {
            ...getTreeInteractions(),
            idPrefix: "forest-" + treeId,
            treeKey: "forest-" + treeId
        });

        currentX += treeConfig.layoutWidth + treeGapX;
        rowHeight = Math.max(rowHeight, treeConfig.layoutHeight + 95);
        maxWidth = Math.max(maxWidth, currentX);
        maxHeight = Math.max(maxHeight, currentY + rowHeight);
    });

    resizeSvg(maxWidth + 120, maxHeight + 160);
}

function getForestDisplayItems(forest) {
    const treeItems = getVisibleForestTreeItems(forest);

    if (!forest || !Array.isArray(forest.trees)) {
        return [];
    }

    if (forestTreeIndices.length || forest.trees.length <= treeItems.length) {
        return treeItems.map(function(item) {
            return {
                type: "tree",
                tree: item.tree,
                originalIndex: item.originalIndex
            };
        });
    }

    const hiddenCount = forest.trees.length - treeItems.length;
    const firstItems = treeItems.slice(0, Math.max(1, treeItems.length - 1));
    const lastItem = {
        tree: forest.trees[forest.trees.length - 1],
        originalIndex: forest.trees.length
    };

    return firstItems
        .map(function(item) {
            return {
                type: "tree",
                tree: item.tree,
                originalIndex: item.originalIndex
            };
        })
        .concat([
            {
                type: "hidden",
                count: hiddenCount
            },
            {
                type: "tree",
                tree: lastItem.tree,
                originalIndex: lastItem.originalIndex
            }
        ]);
}

function getVisibleForestTreeItems(forest) {
    if (!forest || !Array.isArray(forest.trees)) {
        return [];
    }

    if (forestTreeIndices.length) {
        return forestTreeIndices
            .map(function(treeIndex) {
                return {
                    tree: forest.trees[treeIndex - 1],
                    originalIndex: treeIndex
                };
            })
            .filter(function(item) {
                return item.tree;
            });
    }

    return forest.trees
        .slice(0, forestTreeLimit)
        .map(function(tree, index) {
            return {
                tree: tree,
                originalIndex: index + 1
            };
        });
}

// Cree le groupe SVG reserve a un arbre dans la vue foret.
function createForestTreeGroup(treeRoot, treeId, xPosition, yPosition, config) {
    const titleX = getRootX(treeRoot, config);
    const treeGroup = zoomLayer
        .append("g")
        .attr("transform", "translate(" + xPosition + ", " + yPosition + ")");

    treeGroup.append("text")
        .attr("class", "tree-title")
        .attr("x", titleX)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .text("Arbre " + treeId);

    return treeGroup;
}

// Bloc visuel utilise quand une foret contient plus d'arbres que la limite.
function drawHiddenTreesPlaceholder(xPosition, yPosition, hiddenTreeCount) {
    const group = zoomLayer
        .append("g")
        .attr("class", "hidden-trees-group")
        .attr("transform", "translate(" + xPosition + ", " + yPosition + ")");

    group.append("text")
        .attr("class", "hidden-trees-dots")
        .attr("x", 70)
        .attr("y", 185)
        .attr("text-anchor", "middle")
        .text("...");

    group.append("text")
        .attr("class", "hidden-trees-label")
        .attr("x", 70)
        .attr("y", 215)
        .attr("text-anchor", "middle")
        .text(hiddenTreeCount + " arbres");

    return 140;
}

// Affiche un seul arbre dans la zone principale.
function drawTree(tree) {
    currentView = VIEW_TYPE.TREE;
    currentTree = tree;
    updateForestTotalStatus();
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    const treeRoot = getVisibleTreeRoot(tree);
    const treeConfig = createAutoLayoutConfig(treeRoot, getBaseTreeConfig(detailConfig));
    const group = zoomLayer
        .append("g")
        .attr("transform", "translate(" + treeConfig.translateX + ", " + treeConfig.translateY + ")");

    drawDecisionTree(treeRoot, group, treeConfig, {
        ...getTreeInteractions(),
        idPrefix: "single",
        treeKey: "single"
    });

    resizeSvg(
        treeConfig.layoutWidth + treeConfig.translateX * 2,
        treeConfig.layoutHeight + treeConfig.translateY + 160
    );
}

function getVisibleTreeRoot(tree) {
    if (!maxVisibleDepth) {
        return tree;
    }

    return cloneTreeUntilDepth(tree, 1, maxVisibleDepth);
}

function getVisibleForestTreeRoot(tree) {
    const visibleDepth = maxVisibleDepth || defaultForestDepth;

    return cloneTreeUntilDepth(tree, 1, visibleDepth);
}

function cloneTreeUntilDepth(node, currentDepth, maxDepth) {
    const copy = { ...node };

    if (currentDepth >= maxDepth && (node.left || node.right)) {
        delete copy.left;
        delete copy.right;
        copy.collapsed = true;
        return copy;
    }

    if (node.left) {
        copy.left = cloneTreeUntilDepth(node.left, currentDepth + 1, maxDepth);
    }

    if (node.right) {
        copy.right = cloneTreeUntilDepth(node.right, currentDepth + 1, maxDepth);
    }

    return copy;
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
    const horizontalGap = getAutoHorizontalGap(maxBoxWidth, leafCount);
    const verticalGap = getAutoVerticalGap(baseConfig, depth);
    const minLayoutWidth = getAutoMinLayoutWidth(baseConfig, leafCount);
    const minLayoutHeight = getAutoMinLayoutHeight(baseConfig, depth);
    const nodeSizedBounds = getNodeSizedLayoutBounds(tree, horizontalGap, verticalGap, maxBoxWidth);

    return {
        ...baseConfig,
        maxBoxWidth: maxBoxWidth,
        nodeGapX: horizontalGap,
        nodeGapY: verticalGap,
        layoutWidth: Math.max(minLayoutWidth, nodeSizedBounds.width),
        layoutHeight: Math.max(minLayoutHeight, nodeSizedBounds.height)
    };
}

function getAutoHorizontalGap(maxBoxWidth, leafCount) {
    const extraSpace = leafCount <= 2 ? 34 : Math.max(22, 52 - leafCount * 4);

    return maxBoxWidth + extraSpace;
}

function getAutoVerticalGap(baseConfig, depth) {
    if (depth <= 2) {
        return baseConfig.boxHeight + 42;
    }

    if (depth <= 4) {
        return baseConfig.boxHeight + 34;
    }

    return baseConfig.boxHeight + 28;
}

function getAutoMinLayoutWidth(baseConfig, leafCount) {
    if (leafCount <= 2) {
        return 240;
    }

    if (leafCount <= 4) {
        return 340;
    }

    return baseConfig.layoutWidth;
}

function getAutoMinLayoutHeight(baseConfig, depth) {
    if (depth <= 2) {
        return 140;
    }

    if (depth <= 4) {
        return 250;
    }

    return baseConfig.layoutHeight;
}

function getNodeSizedLayoutBounds(tree, horizontalGap, verticalGap, maxBoxWidth) {
    const root = d3.hierarchy(tree, function(d) {
        return [d.left, d.right].filter(Boolean);
    });
    const layout = d3.tree().nodeSize([horizontalGap, verticalGap]);

    layout(root);

    const nodes = root.descendants();
    const minX = d3.min(nodes, function(d) { return d.x; });
    const maxX = d3.max(nodes, function(d) { return d.x; });
    const maxY = d3.max(nodes, function(d) { return d.y; });

    return {
        width: (maxX - minX) + maxBoxWidth,
        height: maxY + baseNodeHeightPadding(verticalGap)
    };
}

function baseNodeHeightPadding(verticalGap) {
    return Math.max(80, Math.round(verticalGap * 0.55));
}

// Le mode general remplace les rectangles par des cercles plus compacts.
function getBaseTreeConfig(baseConfig) {
    if (isOverviewMode()) {
        return {
            ...baseConfig,
            nodeShape: "circle",
            nodeRadius: 18,
            boxWidth: 36,
            boxHeight: 36,
            textStartY: 0,
            textStep: 0
        };
    }

    return baseConfig;
}

function isOverviewMode() {
    return displayMode === "overview";
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
