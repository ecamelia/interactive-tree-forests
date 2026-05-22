// Fonctions qui limitent la profondeur des arbres affiches.

function getVisibleTreeRoot(tree) {
    if (!maxVisibleDepth) {
        return tree;
    }

    // Pour un arbre seul, on limite la profondeur uniquement si l'utilisateur l'a demandee.
    return cloneTreeUntilDepth(tree, 1, maxVisibleDepth);
}

function getVisibleForestTreeRoot(tree) {
    const visibleDepth = maxVisibleDepth || defaultForestDepth;

    // Pour une foret, on limite la profondeur par defaut afin de garder une vue lisible.
    return cloneTreeUntilDepth(tree, 1, visibleDepth);
}

function cloneTreeUntilDepth(node, currentDepth, maxDepth) {
    // On cree une copie pour ne pas modifier directement les donnees JSON chargees.
    const copy = { ...node };

    // Quand la profondeur maximale est atteinte, on cache les enfants
    // et on marque le noeud pour afficher "..." dans le rectangle.
    if (currentDepth >= maxDepth && (node.left || node.right)) {
        delete copy.left;
        delete copy.right;
        copy.collapsed = true;
        return copy;
    }

    if (node.left) {
        copy.left = cloneTreeUntilDepth(node.left, currentDepth + 1, maxDepth);
    }

    if (node.right) {
        copy.right = cloneTreeUntilDepth(node.right, currentDepth + 1, maxDepth);
    }

    return copy;
}
