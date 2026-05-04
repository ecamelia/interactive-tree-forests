function exportSVG() {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(getStyledSvgCopy());
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    downloadBlob(blob, "tree_visualization.svg");
}

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
        context.drawImage(image, 0, 0);

        const pngUrl = canvas.toDataURL("image/png");
        downloadUrl(pngUrl, "tree_visualization.png");

        URL.revokeObjectURL(url);
    };

    image.src = url;
}

function exportCurrentD3Code(visualization) {
    const code = buildD3CodeExport(visualization);
    const blob = new Blob([code], { type: "text/plain" });

    downloadBlob(blob, "tree_d3_export.js");
}

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

function buildD3CodeExport(visualization) {
    const dataString = JSON.stringify(visualization.data, null, 4);
    const isForest = visualization.type === "forest";

    return `// Code D3.js exporte depuis le projet visualisation-arbres.
// Pour l'utiliser, il faut charger D3.js dans la page HTML :
// <script src="https://d3js.org/d3.v7.min.js"></script>
// Puis ajouter un SVG :
// <svg id="tree-view" width="3000" height="900"></svg>

const exportedData = ${dataString};

const svg = d3.select("#tree-view");
const layer = svg.append("g");

const config = {
    boxWidth: 190,
    boxHeight: 100,
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

    const treeSpacing = 950;

    forest.trees.forEach(function(tree, index) {
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

        drawTreeInGroup(treeRoot, treeGroup.append("g").attr("transform", "translate(0, 60)"));
    });
}

function drawTree(tree) {
    layer.selectAll("*").remove();

    const group = layer
        .append("g")
        .attr("transform", "translate(200, 80)");

    drawTreeInGroup(tree.root || tree, group);
}

function drawTreeInGroup(data, group) {
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const layout = d3.tree().size([config.layoutWidth, config.layoutHeight]);
    layout(root);

    group.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y + config.boxHeight / 2; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y - config.boxHeight / 2; })
        .attr("stroke", "#111")
        .attr("stroke-width", 2);

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
        .attr("x", -config.boxWidth / 2)
        .attr("y", -config.boxHeight / 2)
        .attr("width", config.boxWidth)
        .attr("height", config.boxHeight)
        .attr("fill", getNodeColor)
        .attr("stroke", "#111")
        .attr("stroke-width", 2);

    nodes.each(function(d) {
        const lines = getNodeText(d.data);

        d3.select(this)
            .selectAll("text.node-text")
            .data(lines)
            .enter()
            .append("text")
            .attr("class", "node-text")
            .attr("x", 0)
            .attr("y", function(_, index) {
                return config.textStartY + index * config.textStep;
            })
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .text(function(line) {
                return line;
            });
    });
}

function getRootX(data) {
    const root = d3.hierarchy(data, function(d) {
        return [d.left, d.right].filter(Boolean);
    });

    const layout = d3.tree().size([config.layoutWidth, config.layoutHeight]);
    layout(root);

    return root.x;
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
    lines.push("value = " + formatValue(node.value));

    if (node.type === "leaf") {
        lines.push("classe " + node.class);
    }

    return lines;
}

function formatValue(value) {
    return "[" + value.join(", ") + "]";
}
`;
}

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

        .node-box {
            stroke: #111;
            stroke-width: 2;
        }

        .selected-node .node-box {
            stroke: #ff8c00;
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
    `;

    svgCopy.insertBefore(style, svgCopy.firstChild);

    return svgCopy;
}
