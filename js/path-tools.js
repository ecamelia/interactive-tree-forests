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
