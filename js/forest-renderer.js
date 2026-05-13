// Fonctions dediees a l'affichage d'une foret d'arbres.

// Affiche une foret en limitant le nombre d'arbres visibles si besoin.
function drawForest(forest) {
    // On memorise que la vue courante est une foret.
    // Cela permettra de la redessiner si l'utilisateur change une option.
    currentView = VIEW_TYPE.FOREST;
    currentForest = forest;

    // Avant de dessiner, on met l'interface dans un etat propre.
    updateForestTotalStatus();
    resetZoom();
    setActiveSvgStyle();
    clearTreeView();

    // Variables de placement : on pose les arbres de gauche a droite,
    // puis on passe a la ligne suivante quand la largeur maximale est atteinte.
    const startX = 90;
    const startY = 80;
    const maxRowWidth = 1700;
    const treeGapX = 70;
    const treeGapY = 140;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0;
    let maxWidth = startX;
    let maxHeight = startY;

    const displayItems = getForestDisplayItems(forest);

    // On affiche les arbres visibles, en ajoutant un bloc de "arbres caches"
    // si la foret en contient plus que la limite.
    displayItems.forEach(function(item) {
        if (item.type === "hidden") {
            if (currentX > startX && currentX + 140 > maxRowWidth) {
                currentX = startX;
                currentY += rowHeight + treeGapY;
                rowHeight = 0;
            }

            // Le bloc de "arbres caches" a une taille fixe,
            // qui ne depend pas du nombre d'arbres caches.
            currentX += drawHiddenTreesPlaceholder(currentX, currentY, item.count) + treeGapX;
            rowHeight = Math.max(rowHeight, 260);
            maxWidth = Math.max(maxWidth, currentX);
            maxHeight = Math.max(maxHeight, currentY + rowHeight);
            return;
        }

        // Les arbres visibles sont affiches normalement.
        const tree = item.tree;
        const treeId = tree.id || item.originalIndex;
        const treeRoot = getVisibleForestTreeRoot(tree.root || tree);
        const treeConfig = createAutoLayoutConfig(treeRoot, getBaseTreeConfig(overviewConfig));

        // Si l'arbre depasse la largeur maximale, on le place sur la ligne suivante.
        if (currentX > startX && currentX + treeConfig.layoutWidth > maxRowWidth) {
            currentX = startX;
            currentY += rowHeight + treeGapY;
            rowHeight = 0;
        }

        // Chaque arbre de la foret a son propre groupe, pour faciliter le placement et les interactions.
        const treeGroup = createForestTreeGroup(treeRoot, treeId, currentX, currentY, treeConfig);

        // Le groupe principal contient le titre "Arbre X".
        // Le groupe de dessin est decale vers le bas pour laisser la place a ce titre.
        const drawingGroup = treeGroup
            .append("g")
            .attr("transform", "translate(0, 95)");

        // La fonction drawDecisionTree fait le dessin detaille de l'arbre :
        // noeuds, liens, textes et interactions.
        drawDecisionTree(treeRoot, drawingGroup, treeConfig, {
            ...getTreeInteractions(),
            idPrefix: "forest-" + treeId,
            treeKey: "forest-" + treeId
        });

        // On met a jour les variables de placement pour le prochain arbre.
        currentX += treeConfig.layoutWidth + treeGapX;
        rowHeight = Math.max(rowHeight, treeConfig.layoutHeight + 95);
        maxWidth = Math.max(maxWidth, currentX);
        maxHeight = Math.max(maxHeight, currentY + rowHeight);
    });

    // Une fois tous les arbres places, on agrandit le SVG pour contenir toute la foret.
    resizeSvg(maxWidth + 120, maxHeight + 160);
}

// Prepare la liste des elements a afficher dans une foret.
// Chaque element est soit un arbre, soit un bloc "..." qui represente des arbres caches.
function getForestDisplayItems(forest) {
    const treeItems = getVisibleForestTreeItems(forest);

    if (!forest || !Array.isArray(forest.trees)) {
        return [];
    }

    // Si l'utilisateur a choisi des indices precis, on n'ajoute pas de bloc "...".
    // On affiche exactement les arbres demandes.
    if (forestTreeIndices.length || forest.trees.length <= treeItems.length) {
        return treeItems.map(function(item) {
            return {
                type: "tree",
                tree: item.tree,
                originalIndex: item.originalIndex
            };
        });
    }

    // Si la foret contient plus d'arbres que la limite, on garde le debut,
    // on ajoute "...", puis on affiche le dernier arbre de la foret.
    const hiddenCount = forest.trees.length - treeItems.length;
    const firstItems = treeItems.slice(0, Math.max(1, treeItems.length - 1));
    const lastItem = {
        tree: forest.trees[forest.trees.length - 1],
        originalIndex: forest.trees.length
    };

    return firstItems
        .map(function(item) {
            return {
                type: "tree",
                tree: item.tree,
                originalIndex: item.originalIndex
            };
        })
        .concat([
            {
                type: "hidden",
                count: hiddenCount
            },
            {
                type: "tree",
                tree: lastItem.tree,
                originalIndex: lastItem.originalIndex
            }
        ]);
}

function getVisibleForestTreeItems(forest) {
    if (!forest || !Array.isArray(forest.trees)) {
        return [];
    }

    // Les indices saisis dans l'interface commencent a 1,
    // mais les tableaux JavaScript commencent a 0.
    if (forestTreeIndices.length) {
        return forestTreeIndices
            .map(function(treeIndex) {
                return {
                    tree: forest.trees[treeIndex - 1],
                    originalIndex: treeIndex
                };
            })
            .filter(function(item) {
                return item.tree;
            });
    }

    // Sans indices precis, on affiche les premiers arbres selon la limite choisie.
    return forest.trees
        .slice(0, forestTreeLimit)
        .map(function(tree, index) {
            return {
                tree: tree,
                originalIndex: index + 1
            };
        });
}

// Cree le groupe SVG reserve a un arbre dans la vue foret.
function createForestTreeGroup(treeRoot, treeId, xPosition, yPosition, config) {
    // Le titre est centre au-dessus de la racine de l'arbre.
    const titleX = getRootX(treeRoot, config);

    // Chaque arbre est place dans un groupe SVG independant.
    const treeGroup = zoomLayer
        .append("g")
        .attr("transform", "translate(" + xPosition + ", " + yPosition + ")");

    treeGroup.append("text")
        .attr("class", "tree-title")
        .attr("x", titleX)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .text("Arbre " + treeId);

    return treeGroup;
}

// Bloc visuel utilise quand une foret contient plus d'arbres que la limite.
function drawHiddenTreesPlaceholder(xPosition, yPosition, hiddenTreeCount) {
    const group = zoomLayer
        .append("g")
        .attr("class", "hidden-trees-group")
        .attr("transform", "translate(" + xPosition + ", " + yPosition + ")");

    group.append("text")
        .attr("class", "hidden-trees-dots")
        .attr("x", 70)
        .attr("y", 185)
        .attr("text-anchor", "middle")
        .text("...");

    group.append("text")
        .attr("class", "hidden-trees-label")
        .attr("x", 70)
        .attr("y", 215)
        .attr("text-anchor", "middle")
        .text(hiddenTreeCount + " arbres");

    return 140;
}