function exportSVG() {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(getStyledSvgCopy());
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    downloadUrl(url, "tree_visualization.svg");
    URL.revokeObjectURL(url);
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

function downloadUrl(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
