// Dessine un arbre D3 dans le groupe SVG donne.
function drawDecisionTree(data, group, config, options = {}) {
    // d3.hierarchy transforme le JSON recursif en structure exploitable par D3.
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    // d3.tree calcule les positions x/y des noeuds.
    const layout = createTreeLayout(config);
    layout(root);
    normalizeTreeLayout(root, config);
    const idPrefix = options.idPrefix || "tree";
    const treeKey = options.treeKey || idPrefix;

    root.descendants().forEach(function(d, index){
        d.nodeId = idPrefix + "-node-" + index;
        d.treeKey = treeKey;
    });

    root.descendants().forEach(function(d) {
        d.boxSize = getNodeBoxSize(d, config, options);
    });

    // Liens parent-enfant.
    group.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .classed("path-link", function(d) {
            return options.isPathLink ? options.isPathLink(d) : false;
        })
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y + getNodeVerticalOffset(d.source, config); })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y - getNodeVerticalOffset(d.target, config); });

    // Groupes SVG des noeuds.
    const nodes = group.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .classed("selected-node", function(d) {
            return options.isNodeSelected ? options.isNodeSelected(d) : false;
        })
        .classed("path-node", function(d) {
            return options.isPathNode ? options.isPathNode(d) : false;
        })
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    if (isCircleMode(config)) {
        // Mode general : noeuds ronds, sans texte interne.
        nodes.append("circle")
            .attr("class", "node-circle")
            .attr("fill", getNodeColor)
            .attr("r", config.nodeRadius);
    } else {
        nodes.append("rect")
            .attr("class", "node-box")
            .attr("fill", getNodeColor)
            .attr("x", function(d) { return -d.boxSize.width / 2; })
            .attr("y", function(d) { return -d.boxSize.height / 2; })
            .attr("width", function(d) { return d.boxSize.width; })
            .attr("height", function(d) { return d.boxSize.height; });
    }

    if (options.onNodeMouseOver) {
        // Les interactions sont optionnelles pour garder la fonction reutilisable.
        nodes
            .on("mouseover", function(event, d) {
                options.onNodeMouseOver(event, d.data);
            })
            .on("mousemove", function(event, d) {
                options.onNodeMouseMove(event, d.data);
            })
            .on("mouseout", function(event, d) {
                options.onNodeMouseOut(event, d.data);
            });
    }

    if (options.onNodeClick){
        nodes.on("click", function(event, d) {
            event.stopPropagation();
            event.preventDefault();

            options.onNodeClick(event, d);
        });
    }

    if (!isCircleMode(config)) {
        // Mode detail : texte affiche dans chaque rectangle.
        nodes.each(function(d) {
            const lines = getNodeTextForHierarchyNode(d, options);
            const textStep = getNodeTextStep(config);
            const textStartY = getNodeTextStartY(lines, textStep);

            d3.select(this)
                .selectAll(".node-text")
                .data(lines)
                .enter()
                .append("text")
                .attr("class", "node-text")
                .attr("x", 0)
                .attr("y", function(_, index) {
                    return textStartY + index * textStep;
                })
                .attr("text-anchor", "middle")
                .text(function(line) {
                    return line;
                });
        });
    }
}

function isCircleMode(config) {
    return config.nodeShape === "circle";
}

// Permet aux lignes d'arriver au bord du noeud, pas au centre.
function getNodeVerticalOffset(d, config) {
    if (isCircleMode(config)) {
        return config.nodeRadius;
    }

    return d.boxSize.height / 2;
}

function getBranchLabelX(link) {
    const middle = (link.source.x + link.target.x) / 2;
    const direction = link.source.children[0] === link.target ? -1 : 1;

    return middle + direction * 18;
}

function getBranchLabelY(link) {
    const sourceBottom = link.source.y + link.source.boxSize.height / 2;
    const targetTop = link.target.y - link.target.boxSize.height / 2;

    return sourceBottom + (targetTop - sourceBottom) * 0.45;
}

// Calcule la position horizontale de la racine pour centrer le titre.
function getRootX(data, config) {
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const layout = createTreeLayout(config);
    layout(root);
    normalizeTreeLayout(root, config);

    return root.x;
}

function createTreeLayout(config) {
    const layout = d3.tree();

    if (config.nodeGapX && config.nodeGapY) {
        return layout.nodeSize([config.nodeGapX, config.nodeGapY]);
    }

    return layout.size([config.layoutWidth, config.layoutHeight]);
}

function normalizeTreeLayout(root, config) {
    if (!config.nodeGapX || !config.nodeGapY) {
        return;
    }

    const padding = (config.maxBoxWidth || config.boxWidth) / 2;
    const minX = d3.min(root.descendants(), function(d) {
        return d.x;
    });

    root.descendants().forEach(function(d) {
        d.x = d.x - minX + padding;
    });
}

// Couleur simple des feuilles selon la classe predite.
function getNodeColor(d) {
    if (d.data.type !== "leaf") {
        return "white";
    }

    if (d.data.class === 0) {
        return "#a6cee3";
    }

    if (d.data.class === 1) {
        return "#fb9a99";
    }

    if (d.data.class === 2) {
        return "#c7b9ff";
    }

    return "white";
}

// Dimensionne un rectangle selon le texte reel du noeud.
function getNodeBoxSize(d, config, options = {}) {
    if (isCircleMode(config)) {
        return {
            width: config.boxWidth,
            height: config.boxHeight
        };
    }

    const lines = getNodeTextForHierarchyNode(d, options);
    const width = estimateNodeTextWidth(lines, config);
    const height = estimateNodeTextHeight(lines, config);

    return {
        width: width,
        height: height
    };
}

function getNodeTextForHierarchyNode(d, options = {}) {
    const displayOptions = options.getNodeDisplayOptions
        ? options.getNodeDisplayOptions(d)
        : getDefaultNodeDisplayOptions(d.data);

    return getNodeText(d.data, displayOptions);
}

function estimateNodeTextWidth(lines, config) {
    const longestLine = lines.reduce(function(longest, line) {
        return Math.max(longest, line.length);
    }, 0);
    const charWidth = 5.6;
    const horizontalPadding = 18;
    const estimatedWidth = longestLine * charWidth + horizontalPadding;

    return Math.min(
        config.maxBoxWidth || 430,
        Math.max(config.boxWidth, Math.ceil(estimatedWidth))
    );
}

function estimateNodeTextHeight(lines, config) {
    const verticalPadding = 16;
    const estimatedHeight = lines.length * getNodeTextStep(config) + verticalPadding;

    return Math.max(config.boxHeight, estimatedHeight);
}

function getNodeTextStep(config) {
    return config.textStep;
}

function getNodeTextStartY(lines, textStep) {
    return -((lines.length - 1) * textStep) / 2 + 5;
}

// Largeur maximale utile pour calculer l'espacement horizontal de l'arbre.
function getMaxVisibleNodeBoxWidth(tree, config, options = {}) {
    if (isCircleMode(config)) {
        return config.boxWidth;
    }

    let maxWidth = config.boxWidth;

    visitTreeNodes(tree, function(node) {
        const fakeHierarchyNode = { data: node };
        const lines = getNodeTextForHierarchyNode(fakeHierarchyNode, options);
        maxWidth = Math.max(maxWidth, estimateNodeTextWidth(lines, config));
    });

    return maxWidth;
}

function visitTreeNodes(node, callback) {
    callback(node);

    if (node.left) {
        visitTreeNodes(node.left, callback);
    }

    if (node.right) {
        visitTreeNodes(node.right, callback);
    }
}

// Affichage par defaut quand aucun choix utilisateur n'est donne.
function getDefaultNodeDisplayOptions(node) {
    return {
        condition: node.type !== "leaf",
        gini: true,
        samples: true,
        value: true,
        class: node.type === "leaf"
    };
}

// Construit les lignes de texte visibles dans un noeud.
function getNodeText(node, displayOptions) {
    const lines = [];

    if (displayOptions.condition && node.type !== "leaf") {
        lines.push(formatFeatureName(node.feature) + " <= " + node.threshold);
    }

    if (displayOptions.gini) {
        lines.push("gini = " + node.gini);
    }

    if (displayOptions.samples) {
        lines.push("samples = " + node.samples);
    }

    if (displayOptions.value) {
        lines.push("value = " + formatNodeValue(node.value));
    }

    if (displayOptions.class && node.type === "leaf") {
        lines.push("classe " + node.class);
    }

    if (node.collapsed) {
        lines.push("...");
    }

    return lines;
}

function formatValue(value) {
    return "[" + value.join(", ") + "]";
}

function formatFeatureName(featureName) {
    return String(featureName).replace(/\s*\(cm\)/g, "");
}

// Affichage compact utile pour les datasets multi-classes comme digits.
function formatNodeValue(value) {
    if (!Array.isArray(value) || value.length <= 5) {
        return formatValue(value);
    }

    return "[" + value.slice(0, 3).join(", ") + ", ..., " + value[value.length - 1] + "]";
}
