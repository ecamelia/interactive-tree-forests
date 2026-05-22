// Dessin de l'arbre dans la page construction.

const constructionDetailConfig = {
    nodeShape: "box",
    boxWidth: 145,
    boxHeight: 76,
    layoutWidth: 560,
    layoutHeight: 360,
    translateX: 130,
    translateY: 60,
    textStartY: -30,
    textStep: 16
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
        .attr("width", Math.max(1200, Math.ceil(config.layoutWidth + config.translateX * 2)))
        .attr("height", Math.max(700, Math.ceil(config.layoutHeight + config.translateY + 160)));
}
