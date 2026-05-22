// Fonctions transmises au moteur de dessin pour rendre les noeuds interactifs.
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

// Affiche les details du noeud au survol.
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

// Texte affiche dans le tooltip selon le type de noeud.
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

// Selectionne un noeud et applique aussi le mode chemin s'il est active.
function selectNodeForOptions(event, d) {
    selectedNode = d;

    if (!nodeDisplayOptions[d.nodeId]) {
        nodeDisplayOptions[d.nodeId] = createNodeDisplayOptions(d);
    }

    updateOptionInputsState();

    if (optionScope === OPTION_SCOPE.NODE) {
        updateOptionsPanel(nodeDisplayOptions[d.nodeId]);
    }

    syncNodeDetailsPanelWithSelection();

    if (pathModeEnabled) {
        togglePathNode(d);
    }

    redrawCurrentView();
}

function isNodeSelected(d) {
    return selectedNode && selectedNode.nodeId === d.nodeId;
}

// Remet la selection locale a zero quand la structure affichee change.
function resetNodeSelection() {
    selectedNode = null;

    Object.keys(nodeDisplayOptions).forEach(function(nodeId) {
        delete nodeDisplayOptions[nodeId];
    });

    updateOptionsPanel(globalDisplayOptions);
    updateOptionInputsState();
    syncNodeDetailsPanelWithSelection();
}

function syncNodeDetailsPanelWithSelection() {
    if (!selectedNode) {
        nodeDetailsPanel.classList.add("is-disabled");
        nodeDetailsContent.textContent = "Aucun noeud sélectionné.";
        return;
    }

    nodeDetailsPanel.classList.remove("is-disabled");
    nodeDetailsContent.textContent = getReadableNodeDetails(selectedNode.data);
}

function getReadableNodeDetails(node) {
    const parts = [];

    if (node.type === "leaf") {
        parts.push("Feuille");
        parts.push("classe " + node.class);
    } else {
        parts.push("Noeud de décision");
        parts.push(node.feature + " <= " + node.threshold);
    }

    parts.push("gini = " + node.gini);
    parts.push("samples = " + node.samples);
    parts.push("value = " + formatValue(node.value));

    return parts.join(" | ");
}
