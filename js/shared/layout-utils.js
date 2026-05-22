// Fonctions qui calculent automatiquement l'espace necessaire pour dessiner un arbre.

// Calcule un layout assez large pour eviter que les noeuds se chevauchent.
function createAutoLayoutConfig(tree, baseConfig) {
    // Ces valeurs decrivent la taille de l'arbre et servent a adapter l'espacement.
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
    // Plus il y a de feuilles, plus l'espace supplementaire est reduit
    // pour eviter que les grands arbres deviennent trop larges.
    const extraSpace = leafCount <= 2 ? 34 : Math.max(22, 52 - leafCount * 4);

    return maxBoxWidth + extraSpace;
}

function getAutoVerticalGap(baseConfig, depth) {
    // Les arbres profonds sont rendus plus compacts verticalement.
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
    // Layout temporaire : il sert seulement a mesurer la place necessaire,
    // le vrai dessin sera fait ensuite dans tree-viz.js.
    const root = d3.hierarchy(tree, function(d) {
        return [d.left, d.right].filter(Boolean);
    });
    const layout = d3.tree().nodeSize([horizontalGap, verticalGap]);

    layout(root);

    const nodes = root.descendants();
    const minX = d3.min(nodes, function(d) { return d.x; });
    const maxX = d3.max(nodes, function(d) { return d.x; });
    const maxY = d3.max(nodes, function(d) { return d.y; });

    // On ajoute maxBoxWidth pour tenir compte de la largeur des rectangles eux-memes.
    return {
        width: (maxX - minX) + maxBoxWidth,
        height: maxY + baseNodeHeightPadding(verticalGap)
    };
}

function baseNodeHeightPadding(verticalGap) {
    // Marge basse pour que les dernieres feuilles ne soient pas collees au bord du SVG.
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
