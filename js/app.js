const svg = d3.select("#tree-view");
const forestViewButton = d3.select("#forest-view-button");
const singleTreeButton = d3.select("#single-tree-button");
const tooltip = d3.select("#tooltip");
const exportSvgButton = d3.select("#export-tree-button");
const exportPngButton = d3.select("#export-tree-png");
const zoomLayer = svg.append("g");

const nodeDisplayOptions = {};
let selectedNode = null;
let currentView = "forest";
let currentForest = null;
let currentSingleTree = null;

const optionInputs = {
    condition: document.getElementById("node-show-condition"),
    gini: document.getElementById("node-show-gini"),
    samples: document.getElementById("node-show-samples"),
    value: document.getElementById("node-show-value"),
    class: document.getElementById("node-show-class")
};

svg.call(
    d3.zoom()
        .scaleExtent([0.6, 3])
        .on("zoom", function(event) {
            zoomLayer.attr("transform", event.transform);
        })
);

const detailConfig = {
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 700,
    layoutHeight: 480,
    translateX: 200,
    translateY: 80,
    textStartY: -30,
    textStep: 22
};

const overviewConfig = {
    boxWidth: 190,
    boxHeight: 100,
    layoutWidth: 780,
    layoutHeight: 560,
    textStartY: -30,
    textStep: 22
};

Promise.all([
    d3.json("data/forest.json"),
    d3.json("data/tree.json")
]).then(function(files) {
    const forest = files[0];
    const singleTree = files[1];

    initApp(forest, singleTree);
});

function initApp(forest, singleTree) {
    currentForest = forest;
    currentSingleTree = singleTree;

    forestViewButton.on("click", function() {
        drawForest(forest);
    });

    singleTreeButton.on("click", function() {
        drawTree(singleTree);
    });

    exportSvgButton.on("click", function(){
        exportSVG();
    });

    exportPngButton.on("click", function(){
        exportPNG();
    });

    setupNodeOptionInputs();

    drawForest(forest);
}

function drawForest(forest) {
    currentView = "forest";
    currentForest = forest;
    zoomLayer.selectAll("*").remove();

    const treeSpacing = 950;

    forest.trees.forEach(function(tree, index) {
        const titleX = getRootX(tree.root, overviewConfig);

        const treeGroup = zoomLayer
            .append("g")
            .attr("transform", "translate(" + (90 + index * treeSpacing) + ", 70)");

        treeGroup.append("text")
            .attr("class", "tree-title")
            .attr("x", titleX)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Arbre " + tree.id);

        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(0, 60)");

        drawDecisionTree(tree.root, drawingGroup, overviewConfig, {
            ...getTreeInteractions(),
            idPrefix: "forest-" + tree.id,
            treeKey: "forest-" + tree.id
        });
    });
}

function drawTree(data) {
    currentView = "single";
    currentSingleTree = data;
    zoomLayer.selectAll("*").remove();

    const group = zoomLayer
        .append("g")
        .attr("transform", "translate(" + detailConfig.translateX + ", " + detailConfig.translateY + ")");

    drawDecisionTree(data, group, detailConfig, {
        ...getTreeInteractions(),
        idPrefix: "single",
        treeKey: "single"
    });
}

function getTreeInteractions() {
    return {
        onNodeMouseOver: showTooltip,
        onNodeMouseMove: moveTooltip,
        onNodeMouseOut: hideTooltip,
        onNodeClick: selectNodeForOptions,
        getNodeDisplayOptions: getNodeDisplayOptions,
        isNodeSelected: isNodeSelected
    };
}


function showTooltip(event, node) {
    tooltip
        .style("display", "block")
        .html(getTooltipText(node));

    moveTooltip(event);
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.clientX + 14) + "px")
        .style("top", (event.clientY + 14) + "px");
}

function hideTooltip() {
    tooltip.style("display", "none");
}

function getTooltipText(node) {
    if (node.type === "leaf") {
        return (
            "<strong>Feuille</strong><br>" +
            "gini : " + node.gini + "<br>" +
            "samples : " + node.samples + "<br>" +
            "value : " + formatValue(node.value) + "<br>" +
            "classe : " + node.class
        );
    }

    return (
        "<strong>Noeud de decision</strong><br>" +
        "condition : " + node.feature + " <= " + node.threshold + "<br>" +
        "gini : " + node.gini + "<br>" +
        "samples : " + node.samples + "<br>" +
        "value : " + formatValue(node.value)
    );
}

function selectNodeForOptions(event, d) {
    selectedNode = d;

    if (!nodeDisplayOptions[d.nodeId]) {
        nodeDisplayOptions[d.nodeId] = createDefaultNodeDisplayOptions(d.data);
    }

    updateOptionsPanel(d, nodeDisplayOptions[d.nodeId]);
}

function isNodeSelected(d) {
    return selectedNode && selectedNode.nodeId === d.nodeId;
}

function createDefaultNodeDisplayOptions(nodeData) {
    return {
        condition: nodeData.type !== "leaf",
        gini: true,
        samples: true,
        value: true,
        class: nodeData.type === "leaf"
    };
}

function getNodeDisplayOptions(d) {
    if (!nodeDisplayOptions[d.nodeId]) {
        nodeDisplayOptions[d.nodeId] = createDefaultNodeDisplayOptions(d.data);
    }

    return nodeDisplayOptions[d.nodeId];
}

function updateOptionsPanel(node, displayOptions) {
    optionInputs.condition.checked = displayOptions.condition;
    optionInputs.gini.checked = displayOptions.gini;
    optionInputs.samples.checked = displayOptions.samples;
    optionInputs.value.checked = displayOptions.value;
    optionInputs.class.checked = displayOptions.class;
}

function setupNodeOptionInputs() {
    Object.keys(optionInputs).forEach(function(optionName) {
        optionInputs[optionName].addEventListener("change", function(event) {
            if (!selectedNode) {
                return;
            }

            nodeDisplayOptions[selectedNode.nodeId][optionName] = event.target.checked;
            redrawCurrentView();
        });
    });
}

function redrawCurrentView() {
    if (currentView === "single") {
        drawTree(currentSingleTree);
        return;
    }

    drawForest(currentForest);
}
