function getTreeInteractions() {
    return {
        onNodeMouseOver: showTooltip,
        onNodeMouseMove: moveTooltip,
        onNodeMouseOut: hideTooltip,
        onNodeClick: selectNodeForOptions,
        getNodeDisplayOptions: getNodeDisplayOptions,
        isNodeSelected: isNodeSelected,
        isPathNode: isPathNode,
        isPathLink: isPathLink
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

    if (optionScope === OPTION_SCOPE.NODE) {
        updateOptionsPanel(nodeDisplayOptions[d.nodeId]);
    }

    if (pathModeEnabled) {
        togglePathNode(d);
        redrawCurrentView();
    }
}

function isNodeSelected(d) {
    return selectedNode && selectedNode.nodeId === d.nodeId;
}

function resetNodeSelection() {
    selectedNode = null;

    Object.keys(nodeDisplayOptions).forEach(function(nodeId) {
        delete nodeDisplayOptions[nodeId];
    });

    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
}

function setupPathControls() {
    pathModeCheckbox.addEventListener("change", function(event) {
        pathModeEnabled = event.target.checked;
    });

    clearPathButton.addEventListener("click", function() {
        clearPath();
        redrawCurrentView();
    });
}

function togglePathNode(d) {
    if (pathNodeIds.has(d.nodeId)) {
        pathNodeIds.delete(d.nodeId);
        return;
    }

    pathNodeIds.add(d.nodeId);
}

function clearPath() {
    pathNodeIds.clear();
}

function isPathNode(d) {
    return pathNodeIds.has(d.nodeId);
}

function isPathLink(link) {
    return pathNodeIds.has(link.source.nodeId) && pathNodeIds.has(link.target.nodeId);
}
