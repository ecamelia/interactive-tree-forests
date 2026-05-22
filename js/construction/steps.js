// Logique de construction progressive d'un arbre.

function getConstructionTreeRoot(data) {
    if (data && data.root) {
        return data.root;
    }

    if (data && Array.isArray(data.trees) && data.trees.length) {
        return data.trees[0].root || data.trees[0];
    }

    if (data && (data.type === "node" || data.type === "leaf")) {
        return data;
    }

    throw new Error("Format d'arbre non reconnu");
}

function createBuildSteps(tree) {
    const internalPaths = getInternalNodePaths(tree);
    const steps = [
        {
            tree: cloneTreeForBuildStep(tree, new Set()),
            activePath: null,
            revealedPaths: []
        }
    ];

    internalPaths.forEach(function(path, index) {
        const revealedPaths = new Set(internalPaths.slice(0, index + 1));

        steps.push({
            tree: cloneTreeForBuildStep(tree, revealedPaths),
            activePath: path,
            revealedPaths: internalPaths.slice(0, index + 1)
        });
    });

    return steps;
}

function getInternalNodePaths(tree) {
    const paths = [];
    const queue = [
        {
            node: tree,
            path: "root"
        }
    ];

    while (queue.length) {
        const item = queue.shift();

        if (!item.node.left && !item.node.right) {
            continue;
        }

        paths.push(item.path);

        if (item.node.left) {
            queue.push({
                node: item.node.left,
                path: item.path + ".left"
            });
        }

        if (item.node.right) {
            queue.push({
                node: item.node.right,
                path: item.path + ".right"
            });
        }
    }

    return paths;
}

function cloneTreeForBuildStep(node, revealedPaths, path = "root") {
    const copy = {
        ...node,
        buildPath: path
    };

    if ((node.left || node.right) && !revealedPaths.has(path)) {
        delete copy.left;
        delete copy.right;
        copy.collapsed = true;
        return copy;
    }

    if (node.left) {
        copy.left = cloneTreeForBuildStep(node.left, revealedPaths, path + ".left");
    }

    if (node.right) {
        copy.right = cloneTreeForBuildStep(node.right, revealedPaths, path + ".right");
    }

    return copy;
}

function getNodeByPath(tree, path) {
    if (!path) {
        return null;
    }

    return path
        .split(".")
        .slice(1)
        .reduce(function(node, direction) {
            return node ? node[direction] : null;
        }, tree);
}
