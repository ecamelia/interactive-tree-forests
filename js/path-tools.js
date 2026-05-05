// Branche les controles du mode chemin.
function setupPathControls() {
    pathModeCheckbox.addEventListener("change", function(event) {
        pathModeEnabled = event.target.checked;
    });

    clearPathButton.addEventListener("click", function() {
        clearPath();
        redrawCurrentView();
    });
}

// Ajoute ou retire un noeud du chemin colore.
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

// Un lien fait partie du chemin si ses deux extremites sont selectionnees.
function isPathLink(link) {
    return pathNodeIds.has(link.source.nodeId) && pathNodeIds.has(link.target.nodeId);
}
