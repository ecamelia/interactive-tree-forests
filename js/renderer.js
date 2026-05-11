// Fonctions generales du rendu.
// Les details propres aux arbres, aux forets et au layout sont separes
// dans tree-renderer.js, forest-renderer.js, tree-depth-utils.js et layout-utils.js.

// Message affiche avant qu'un fichier JSON soit charge.
function showEmptyState() {
    // On remet l'etat courant a zero, car aucune visualisation n'est active.
    currentView = null;
    currentForest = null;
    currentTree = null;

    // On nettoie l'ancien dessin et on remet le zoom a sa position de depart.
    clearTreeView();
    resetZoom();

    // Les panneaux de la sidebar doivent aussi revenir a leur etat initial.
    updateForestTotalStatus();
    updateObservationPanel();
    setEmptySvgStyle();
}

// Nettoie la zone de dessin avant un nouvel affichage.
function clearTreeView() {
    zoomLayer.selectAll("*").remove();
}

// Redessine la vue actuelle apres un changement d'option.
function redrawCurrentView() {
    // Cette fonction est appelee quand une option change.
    // Elle redessine le meme type de visualisation que celle deja affichee.
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
