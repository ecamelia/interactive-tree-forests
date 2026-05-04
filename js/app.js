const svg = d3.select("#tree-view");
const tooltip = d3.select("#tooltip");
const exportSvgButton = d3.select("#export-tree-button");
const exportPngButton = d3.select("#export-tree-png");
const jsonFileInput = document.getElementById("json-file-input");
const fileStatus = document.getElementById("file-status");
const zoomLayer = svg.append("g");
const zoomBehavior = d3.zoom()
    .scaleExtent([0.6, 3])
    .on("zoom", function(event) {
        zoomLayer.attr("transform", event.transform);
    });

const nodeDisplayOptions = {};
let selectedNode = null;
let currentView = "forest";
let currentForest = null;
let currentSingleTree = null;
let optionScope = "tree";

const globalDisplayOptions = {
    condition: true,
    gini: true,
    samples: true,
    value: true,
    class: true
};

const optionScopeInputs = {
    tree: document.getElementById("scope-tree"),
    node: document.getElementById("scope-node")
};

const optionInputs = {
    condition: document.getElementById("node-show-condition"),
    gini: document.getElementById("node-show-gini"),
    samples: document.getElementById("node-show-samples"),
    value: document.getElementById("node-show-value"),
    class: document.getElementById("node-show-class")
};

svg.call(zoomBehavior);

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

    jsonFileInput.addEventListener("change", handleJsonFile);

    exportSvgButton.on("click", function(){
        exportSVG();
    });

    exportPngButton.on("click", function(){
        exportPNG();
    });

    setupNodeOptionInputs();
    setupOptionScopeInputs();
    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();

    drawForest(forest);
}

function handleJsonFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        let jsonData;

        try {
            jsonData = JSON.parse(loadEvent.target.result);
        } catch (error) {
            console.error(error);
            alert("Le fichier choisi n'est pas un JSON valide.");
            fileStatus.textContent = "Erreur JSON";
            return;
        }

        try {
            resetNodeSelection();
            renderJsonData(jsonData);
            fileStatus.textContent = "Fichier charge : " + file.name;
        } catch (error) {
            console.error(error);
            alert("Le JSON est valide, mais son format ne correspond pas encore au visualiseur.");
            fileStatus.textContent = "Format non reconnu";
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function renderJsonData(data) {
    if (isForestData(data)) {
        drawForest(data);
        return;
    }

    if (isTreeData(data)) {
        drawTree(getTreeRoot(data));
        return;
    }

    throw new Error("Format JSON non reconnu");
}

function isForestData(data) {
    return data && Array.isArray(data.trees);
}

function isTreeData(data) {
    return data && (
        data.type === "node" ||
        data.type === "leaf" ||
        data.root
    );
}

function getTreeRoot(data) {
    return data.root || data;
}

function resetNodeSelection() {
    selectedNode = null;

    Object.keys(nodeDisplayOptions).forEach(function(nodeId) {
        delete nodeDisplayOptions[nodeId];
    });

    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
}

function drawForest(forest) {
    currentView = "forest";
    currentForest = forest;
    resetZoom();
    zoomLayer.selectAll("*").remove();

    const treeSpacing = 950;

    forest.trees.forEach(function(tree, index) {
        const treeId = tree.id || index + 1;
        const treeRoot = tree.root || tree;
        const titleX = getRootX(treeRoot, overviewConfig);

        const treeGroup = zoomLayer
            .append("g")
            .attr("transform", "translate(" + (90 + index * treeSpacing) + ", 70)");

        treeGroup.append("text")
            .attr("class", "tree-title")
            .attr("x", titleX)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Arbre " + treeId);

        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(0, 60)");

        drawDecisionTree(treeRoot, drawingGroup, overviewConfig, {
            ...getTreeInteractions(),
            idPrefix: "forest-" + treeId,
            treeKey: "forest-" + treeId
        });
    });
}

function drawTree(data) {
    currentView = "single";
    currentSingleTree = data;
    resetZoom();
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
        nodeDisplayOptions[d.nodeId] = createNodeDisplayOptions(d);
    }

    updateOptionInputsState();

    if (optionScope === "node") {
        updateOptionsPanel(nodeDisplayOptions[d.nodeId]);
    }
}

function isNodeSelected(d) {
    return selectedNode && selectedNode.nodeId === d.nodeId;
}

function getNodeDisplayOptions(d) {
    if (nodeDisplayOptions[d.nodeId]) {
        return nodeDisplayOptions[d.nodeId];
    }

    return globalDisplayOptions;
}

function createNodeDisplayOptions(d) {
    const currentOptions = getNodeDisplayOptions(d);

    return {
        condition: currentOptions.condition,
        gini: currentOptions.gini,
        samples: currentOptions.samples,
        value: currentOptions.value,
        class: currentOptions.class
    };
}

function updateOptionsPanel(displayOptions) {
    optionInputs.condition.checked = displayOptions.condition;
    optionInputs.gini.checked = displayOptions.gini;
    optionInputs.samples.checked = displayOptions.samples;
    optionInputs.value.checked = displayOptions.value;
    optionInputs.class.checked = displayOptions.class;
}

function setupNodeOptionInputs() {
    Object.keys(optionInputs).forEach(function(optionName) {
        optionInputs[optionName].addEventListener("change", function(event) {
            if (optionScope === "tree") {
                globalDisplayOptions[optionName] = event.target.checked;
                redrawCurrentView();
                return;
            }

            if (!selectedNode) {
                event.target.checked = false;
                alert("Selectionne d'abord un noeud.");
                return;
            }

            if (!nodeDisplayOptions[selectedNode.nodeId]) {
                nodeDisplayOptions[selectedNode.nodeId] = createNodeDisplayOptions(selectedNode);
            }

            nodeDisplayOptions[selectedNode.nodeId][optionName] = event.target.checked;
            redrawCurrentView();
        });
    });
}

function setupOptionScopeInputs() {
    Object.keys(optionScopeInputs).forEach(function(scopeName) {
        optionScopeInputs[scopeName].addEventListener("change", function(event) {
            optionScope = event.target.value;

            if (optionScope === "tree") {
                updateOptionsPanel(globalDisplayOptions);
            } else if (selectedNode) {
                if (!nodeDisplayOptions[selectedNode.nodeId]) {
                    nodeDisplayOptions[selectedNode.nodeId] = createNodeDisplayOptions(selectedNode);
                }

                updateOptionsPanel(nodeDisplayOptions[selectedNode.nodeId]);
            }

            updateOptionInputsState();
        });
    });
}

function updateOptionInputsState() {
    const shouldDisable = optionScope === "node" && !selectedNode;

    Object.keys(optionInputs).forEach(function(optionName) {
        optionInputs[optionName].disabled = shouldDisable;
    });
}

function redrawCurrentView() {
    if (currentView === "single") {
        drawTree(currentSingleTree);
        return;
    }

    drawForest(currentForest);
}

function resetZoom() {
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
}
