// Lecture du fichier JSON choisi par l'utilisateur.
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

// FileReader transforme le fichier local en texte, puis en objet JavaScript.
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

// Choisit automatiquement le bon affichage selon la structure du JSON.
function renderJsonData(data) {
    clearPath();

    if (isForestData(data)) {
        drawForest(data);
        updateObservationPanel();
        return;
    }

    if (isTreeData(data)) {
        drawTree(getTreeRoot(data));
        updateObservationPanel();
        return;
    }

    throw new Error("Format JSON non reconnu");
}

// Une foret contient une liste d'arbres.
function isForestData(data) {
    return data && Array.isArray(data.trees);
}

// Un arbre peut etre donne directement, ou enveloppe dans une cle root.
function isTreeData(data) {
    return data && (
        data.type === "node" ||
        data.type === "leaf" ||
        data.root
    );
}

// Accepte les deux formats : { root: ... } ou directement le noeud racine.
function getTreeRoot(data) {
    return data.root || data;
}
