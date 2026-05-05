// Exporte le SVG affiche, en ajoutant les styles necessaires dans le fichier.
function exportSVG() {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(getStyledSvgCopy());
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    downloadBlob(blob, "tree_visualization.svg");
}

// Convertit le SVG courant en image PNG via un canvas.
function exportPNG() {
    const svgElement = document.getElementById("tree-view");
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(getStyledSvgCopy());
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const image = new Image();

    image.onload = function() {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth;
        canvas.height = svgElement.clientHeight;

        const context = canvas.getContext("2d");
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        const pngUrl = canvas.toDataURL("image/png");
        downloadUrl(pngUrl, "tree_visualization.png");

        URL.revokeObjectURL(url);
    };

    image.src = url;
}

// Genere un fichier JavaScript capable de redessiner la vue courante.
function exportCurrentD3Code(visualization) {
    const code = buildD3CodeExport(visualization);
    const blob = new Blob([code], { type: "text/plain" });

    downloadBlob(blob, "tree_d3_export.js");
}

// Telecharge un Blob en laissant le temps au navigateur de demarrer le download.
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    downloadUrl(url, filename);

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}

function downloadUrl(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Produit un exemple autonome de code D3 avec les donnees deja integrees.
function buildD3CodeExport(visualization) {
    const dataString = JSON.stringify(visualization.data, null, 4);
    const pathString = JSON.stringify(visualization.pathNodeIds || [], null, 4);
    const nodeStyleString = JSON.stringify(visualization.nodeStyleOptions || {}, null, 4);
    const isForest = visualization.type === "forest";
    const exportedForestTreeLimit = visualization.forestTreeLimit || 3;

    return `// Code D3.js exporte depuis le projet visualisation-arbres.
// Pour l'utiliser, il faut charger D3.js dans la page HTML :
// <script src="https://d3js.org/d3.v7.min.js"></script>
// Puis ajouter un SVG :
// <svg id="tree-view" width="3000" height="900"></svg>

const exportedData = ${dataString};
const exportedPathNodeIds = new Set(${pathString});
const exportedNodeStyleOptions = ${nodeStyleString};
const exportedForestTreeLimit = ${exportedForestTreeLimit};

const svg = d3.select("#tree-view");
const layer = svg.append("g");

const config = {
    boxWidth: 190,
    boxHeight: 100,
    maxBoxWidth: 430,
    layoutWidth: 780,
    layoutHeight: 560,
    textStartY: -30,
    textStep: 22
};

const zoom = d3.zoom()
    .scaleExtent([0.6, 3])
    .on("zoom", function(event) {
        layer.attr("transform", event.transform);
    });

svg.call(zoom);

if (${isForest}) {
    drawForest(exportedData);
} else {
    drawTree(exportedData);
}

function drawForest(forest) {
    layer.selectAll("*").remove();

    const treeSpacing = 1200;
    const visibleTrees = forest.trees.slice(0, exportedForestTreeLimit);
    const hiddenTreeCount = Math.max(0, forest.trees.length - visibleTrees.length);

    visibleTrees.forEach(function(tree, index) {
        const treeId = tree.id || index + 1;
        const treeRoot = tree.root || tree;
        const titleX = getRootX(treeRoot);

        const treeGroup = layer
            .append("g")
            .attr("transform", "translate(" + (90 + index * treeSpacing) + ", 70)");

        treeGroup.append("text")
            .attr("class", "tree-title")
            .attr("x", titleX)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Arbre " + treeId);

        drawTreeInGroup(
            treeRoot,
            treeGroup.append("g").attr("transform", "translate(0, 60)"),
            "forest-" + treeId
        );
    });

    if (hiddenTreeCount > 0) {
        const placeholderX = 90 + visibleTrees.length * treeSpacing;
        const group = layer
            .append("g")
            .attr("transform", "translate(" + placeholderX + ", 70)");

        group.append("text")
            .attr("x", 120)
            .attr("y", 170)
            .attr("text-anchor", "middle")
            .attr("font-size", 56)
            .attr("font-weight", "bold")
            .attr("fill", "#555")
            .text("...");

        group.append("text")
            .attr("x", 120)
            .attr("y", 210)
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .attr("fill", "#666")
            .text(hiddenTreeCount + " arbres masques");
    }
}

function drawTree(tree) {
    layer.selectAll("*").remove();

    const group = layer
        .append("g")
        .attr("transform", "translate(200, 80)");

    drawTreeInGroup(tree.root || tree, group, "single");
}

function drawTreeInGroup(data, group, idPrefix) {
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const localConfig = createAutoLayoutConfig(data);
    const layout = d3.tree().size([localConfig.layoutWidth, localConfig.layoutHeight]);
    layout(root);

    root.descendants().forEach(function(d, index) {
        d.nodeId = idPrefix + "-node-" + index;
        d.nodeStyle = getNodeStyle(d);
        d.boxSize = getNodeBoxSize(d.data, localConfig, d.nodeStyle);
    });

    group.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y + d.source.boxSize.height / 2; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y - d.target.boxSize.height / 2; })
        .attr("stroke", function(d) {
            return isPathLink(d) ? "#ff8c00" : "#111";
        })
        .attr("stroke-width", function(d) {
            return isPathLink(d) ? 6 : 2;
        });

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
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .text(function(d) {
            return d.source.children[0] === d.target ? "True" : "False";
        });

    const nodes = group.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    nodes.append("rect")
        .attr("x", function(d) { return -d.boxSize.width / 2; })
        .attr("y", function(d) { return -d.boxSize.height / 2; })
        .attr("width", function(d) { return d.boxSize.width; })
        .attr("height", function(d) { return d.boxSize.height; })
        .attr("fill", function(d) { return d.nodeStyle.fill; })
        .attr("stroke", function(d) {
            return exportedPathNodeIds.has(d.nodeId) ? "#ff8c00" : "#111";
        })
        .attr("stroke-width", function(d) {
            return exportedPathNodeIds.has(d.nodeId) ? 6 : 2;
        });

    nodes.each(function(d) {
        const lines = getNodeText(d.data);
        const textStep = getNodeTextStep(localConfig, d.nodeStyle);
        const textStartY = getNodeTextStartY(lines, textStep);

        d3.select(this)
            .selectAll("text.node-text")
            .data(lines)
            .enter()
            .append("text")
            .attr("class", "node-text")
            .attr("x", 0)
            .attr("y", function(_, index) {
                return textStartY + index * textStep;
            })
            .attr("text-anchor", "middle")
            .attr("fill", d.nodeStyle.textColor)
            .attr("font-size", d.nodeStyle.fontSize)
            .text(function(line) {
                return line;
            });
    });
}

function isPathLink(link) {
    return exportedPathNodeIds.has(link.source.nodeId) &&
        exportedPathNodeIds.has(link.target.nodeId);
}

function getRootX(data) {
    const localConfig = createAutoLayoutConfig(data);
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const layout = d3.tree().size([localConfig.layoutWidth, localConfig.layoutHeight]);
    layout(root);

    return root.x;
}

function createAutoLayoutConfig(tree) {
    const maxBoxWidth = getMaxNodeBoxWidth(tree);
    const leafCount = countLeaves(tree);
    const depth = getTreeDepth(tree);

    return {
        ...config,
        layoutWidth: Math.max(config.layoutWidth, Math.max(1, leafCount - 1) * (maxBoxWidth + 150)),
        layoutHeight: Math.max(config.layoutHeight, Math.max(1, depth - 1) * (config.boxHeight + 95))
    };
}

function getNodeBoxSize(node, localConfig, style) {
    const lines = getNodeText(node);
    const longestLine = lines.reduce(function(longest, line) {
        return Math.max(longest, line.length);
    }, 0);
    const autoWidth = Math.min(
        localConfig.maxBoxWidth,
        Math.max(localConfig.boxWidth, Math.ceil(longestLine * style.fontSize * 0.47 + 34))
    );
    const autoHeight = Math.max(localConfig.boxHeight, lines.length * getNodeTextStep(localConfig, style) + 34);
    const width = style.width || autoWidth;
    const height = style.height || autoHeight;

    return { width: width, height: height };
}

function getNodeStyle(d) {
    if (exportedNodeStyleOptions[d.nodeId]) {
        return exportedNodeStyleOptions[d.nodeId];
    }

    return {
        fill: getNodeColor(d),
        textColor: "#111111",
        fontSize: 16,
        width: config.boxWidth,
        height: config.boxHeight
    };
}

function getNodeTextStep(localConfig, style) {
    return Math.max(localConfig.textStep, style.fontSize + 6);
}

function getNodeTextStartY(lines, textStep) {
    return -((lines.length - 1) * textStep) / 2 + 5;
}

function getMaxNodeBoxWidth(tree) {
    let maxWidth = config.boxWidth;

    visitTreeNodes(tree, function(node) {
        maxWidth = Math.max(maxWidth, getNodeBoxSize(node, config, {
            fill: "white",
            textColor: "#111111",
            fontSize: 16,
            width: config.boxWidth,
            height: config.boxHeight
        }).width);
    });

    return maxWidth;
}

function countLeaves(node) {
    if (!node.left && !node.right) {
        return 1;
    }

    return (node.left ? countLeaves(node.left) : 0) +
        (node.right ? countLeaves(node.right) : 0);
}

function getTreeDepth(node) {
    const leftDepth = node.left ? getTreeDepth(node.left) : 0;
    const rightDepth = node.right ? getTreeDepth(node.right) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
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

    return "#c7b9ff";
}

function getNodeText(node) {
    const lines = [];

    if (node.type !== "leaf") {
        lines.push(node.feature + " <= " + node.threshold);
    }

    lines.push("gini = " + node.gini);
    lines.push("samples = " + node.samples);
    lines.push("value = " + formatNodeValue(node.value));

    if (node.type === "leaf") {
        lines.push("classe " + node.class);
    }

    return lines;
}

function formatValue(value) {
    return "[" + value.join(", ") + "]";
}

function formatNodeValue(value) {
    if (!Array.isArray(value) || value.length <= 5) {
        return formatValue(value);
    }

    return "[" + value.slice(0, 3).join(", ") + ", ..., " + value[value.length - 1] + "]";
}
`;
}

// Clone le SVG et y injecte les styles utiles aux exports SVG/PNG.
function getStyledSvgCopy() {
    const svgElement = document.getElementById("tree-view");
    const svgCopy = svgElement.cloneNode(true);

    svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
        .link {
            stroke: #111;
            stroke-width: 2;
        }

        .path-link {
            stroke: #ff8c00;
            stroke-width: 6;
        }

        .node-box,
        .node-circle {
            stroke: #111;
            stroke-width: 2;
        }

        .selected-node .node-box,
        .selected-node .node-circle {
            stroke: #ff8c00;
            stroke-width: 9;
        }

        .path-node .node-box,
        .path-node .node-circle {
            stroke: #ff8c00;
            stroke-width: 6;
        }

        .selected-node.path-node .node-box,
        .selected-node.path-node .node-circle {
            stroke-width: 9;
        }

        .node-text {
            font-size: 16px;
            font-family: Arial, sans-serif;
        }

        .branch-label {
            font-size: 16px;
            font-weight: bold;
            font-family: Arial, sans-serif;
        }

        .tree-title {
            font-size: 18px;
            font-weight: bold;
            font-family: Arial, sans-serif;
        }

        .hidden-trees-dots {
            fill: #555;
            font-size: 56px;
            font-weight: bold;
            font-family: Arial, sans-serif;
        }

        .hidden-trees-label {
            fill: #666;
            font-size: 16px;
            font-family: Arial, sans-serif;
        }
    `;

    svgCopy.insertBefore(style, svgCopy.firstChild);
    svgCopy.insertBefore(createSvgBackground(svgCopy), style.nextSibling);

    return svgCopy;
}

// Ajoute un fond blanc reel dans le fichier exporte, pas seulement en CSS.
function createSvgBackground(svgElement) {
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const width = svgElement.getAttribute("width") || svgElement.clientWidth || 1200;
    const height = svgElement.getAttribute("height") || svgElement.clientHeight || 700;

    background.setAttribute("x", 0);
    background.setAttribute("y", 0);
    background.setAttribute("width", width);
    background.setAttribute("height", height);
    background.setAttribute("fill", "white");

    return background;
}
