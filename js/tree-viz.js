// Dessine un arbre D3 dans le groupe SVG donne.
function drawDecisionTree(data, group, config, options = {}) {
    // d3.hierarchy transforme le JSON recursif en structure exploitable par D3.
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    // d3.tree calcule les positions x/y des noeuds.
    const layout = d3.tree().size([config.layoutWidth, config.layoutHeight]);
    layout(root);
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

    if (!isCircleMode(config)) {
        // Les labels True/False sont gardes uniquement en mode detail.
        group.selectAll(".branch-label")
            .data(root.links())
            .enter()
            .append("text")
            .attr("class", "branch-label")
            .attr("x", function(d) {
                const middle = (d.source.x + d.target.x) / 2;
                const offset = d.source.children[0] === d.target ? -22 : 22;

                return middle + offset;
            })
            .attr("y", function(d) { return (d.source.y + d.target.y) / 2 - 18; })
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.source.children[0] === d.target ? "True" : "False";
            });
    }

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
            .attr("fill", function(d) {
                return getNodeStyleForHierarchyNode(d, options).fill;
            })
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
            const style = getNodeStyleForHierarchyNode(d, options);
            const textStep = getNodeTextStep(config, style);
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
                .attr("fill", style.textColor)
                .attr("font-size", style.fontSize)
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

// Calcule la position horizontale de la racine pour centrer le titre.
function getRootX(data, config) {
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const layout = d3.tree().size([config.layoutWidth, config.layoutHeight]);
    layout(root);

    return root.x;
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
    const style = getNodeStyleForHierarchyNode(d, options);
    const autoWidth = estimateNodeTextWidth(lines, config, style);
    const autoHeight = estimateNodeTextHeight(lines, config, style);
    const width = style.width || autoWidth;
    const height = style.height || autoHeight;

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

function getNodeStyleForHierarchyNode(d, options = {}) {
    if (options.getNodeStyleOptions) {
        return options.getNodeStyleOptions(d);
    }

    return {
        fill: getNodeColor(d),
        textColor: "#111111",
        fontSize: 16
    };
}

function estimateNodeTextWidth(lines, config, style = { fontSize: 16 }) {
    const longestLine = lines.reduce(function(longest, line) {
        return Math.max(longest, line.length);
    }, 0);
    const estimatedWidth = longestLine * style.fontSize * 0.47 + 34;

    return Math.min(
        config.maxBoxWidth || 430,
        Math.max(config.boxWidth, Math.ceil(estimatedWidth))
    );
}

function estimateNodeTextHeight(lines, config, style = { fontSize: 16 }) {
    const verticalPadding = 34;
    const estimatedHeight = lines.length * getNodeTextStep(config, style) + verticalPadding;

    return Math.max(config.boxHeight, estimatedHeight);
}

function getNodeTextStep(config, style) {
    return Math.max(config.textStep, style.fontSize + 6);
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
        const style = getNodeStyleForHierarchyNode(fakeHierarchyNode, options);
        maxWidth = Math.max(maxWidth, style.width || estimateNodeTextWidth(lines, config, style));
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
        lines.push(node.feature + " <= " + node.threshold);
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

    return lines;
}

function formatValue(value) {
    return "[" + value.join(", ") + "]";
}

// Affichage compact utile pour les datasets multi-classes comme digits.
function formatNodeValue(value) {
    if (!Array.isArray(value) || value.length <= 5) {
        return formatValue(value);
    }

    return "[" + value.slice(0, 3).join(", ") + ", ..., " + value[value.length - 1] + "]";
}
