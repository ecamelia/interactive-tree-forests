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
        .attr("y1", function(d) { return d.source.y + getNodeVerticalOffset(config); })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y - getNodeVerticalOffset(config); });

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
            .attr("fill", getNodeColor)
            .attr("x", -config.boxWidth / 2)
            .attr("y", -config.boxHeight / 2)
            .attr("width", config.boxWidth)
            .attr("height", config.boxHeight);
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
        nodes.on("pointerdown", function(event, d) {
            event.stopPropagation();
            event.preventDefault();

            options.onNodeClick(event, d);
        });
    }

    if (!isCircleMode(config)) {
        // Mode detail : texte affiche dans chaque rectangle.
        nodes.each(function(d) {
            const displayOptions = options.getNodeDisplayOptions
                ? options.getNodeDisplayOptions(d)
                : getDefaultNodeDisplayOptions(d.data);

            const lines = getNodeText(d.data, displayOptions);

            d3.select(this)
                .selectAll(".node-text")
                .data(lines)
                .enter()
                .append("text")
                .attr("class", "node-text")
                .attr("x", 0)
                .attr("y", function(_, index) {
                    return config.textStartY + index * config.textStep;
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
function getNodeVerticalOffset(config) {
    if (isCircleMode(config)) {
        return config.nodeRadius;
    }

    return config.boxHeight / 2;
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
        lines.push("value = " + formatValue(node.value));
    }

    if (displayOptions.class && node.type === "leaf") {
        lines.push("classe " + node.class);
    }

    return lines;
}

function formatValue(value) {
    return "[" + value.join(", ") + "]";
}
