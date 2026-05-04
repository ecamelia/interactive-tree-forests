function loadDefaultData() {
    Promise.all([
        d3.json("data/forest.json"),
        d3.json("data/tree.json")
    ]).then(function(files) {
        currentForest = files[0];
        currentTree = files[1];
        drawForest(currentForest);
    }).catch(function(error) {
        console.error(error);
        fileStatus.textContent = "Erreur chargement donnees";
    });
}

function handleJsonFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    readJsonFile(file, function(data) {
        try {
            resetNodeSelection();
            renderJsonData(data);
            fileStatus.textContent = "Fichier charge : " + file.name;
        } catch (error) {
            console.error(error);
            fileStatus.textContent = "Format non reconnu";
            alert("Le JSON est valide, mais son format ne correspond pas encore au visualiseur.");
        }
    });

    event.target.value = "";
}

function readJsonFile(file, onSuccess) {
    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const data = JSON.parse(loadEvent.target.result);
            onSuccess(data);
        } catch (error) {
            console.error(error);
            fileStatus.textContent = "Erreur JSON";
            alert("Le fichier choisi n'est pas un JSON valide.");
        }
    };

    reader.readAsText(file);
}

function renderJsonData(data) {
    if (isForestData(data)) {
        drawForest(data);
        return;
    }

    if (isTreeData(data)) {
        drawTree(getTreeRoot(data));
        return;
    }

    throw new Error("Format JSON non reconnu");
}

function isForestData(data) {
    return data && Array.isArray(data.trees);
}

function isTreeData(data) {
    return data && (
        data.type === "node" ||
        data.type === "leaf" ||
        data.root
    );
}

function getTreeRoot(data) {
    return data.root || data;
}
