// Fonctions dediees a l'affichage d'un arbre seul.

// Affiche un seul arbre dans la zone principale.
function drawTree(tree) {
    // On memorise que la vue courante est un arbre simple.
    currentView = VIEW_TYPE.TREE;
    currentTree = tree;

    // Preparation de l'interface avant le nouveau dessin.
    updateForestTotalStatus();
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    const treeRoot = getVisibleTreeRoot(tree);
    const treeConfig = createAutoLayoutConfig(treeRoot, getBaseTreeConfig(detailConfig));

    // Pour un arbre seul, on utilise le decalage defini dans detailConfig.
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
