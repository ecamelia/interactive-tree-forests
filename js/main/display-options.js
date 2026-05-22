// Active les cases qui changent le contenu des noeuds.
function setupOptionInputs() {
    Object.keys(optionInputs).forEach(function(optionName) {
        optionInputs[optionName].addEventListener("change", function(event) {
            updateDisplayOption(optionName, event.target.checked);
        });
    });
}

// Active le choix entre modification globale et modification par noeud.
function setupOptionScopeInputs() {
    Object.keys(optionScopeInputs).forEach(function(scopeName) {
        optionScopeInputs[scopeName].addEventListener("change", function(event) {
            optionScope = event.target.value;
            syncOptionsPanelWithCurrentScope();
            updateOptionInputsState();
        });
    });
}

// Applique une option soit a tout l'arbre, soit au noeud selectionne.
function updateDisplayOption(optionName, isChecked) {
    if (optionScope === OPTION_SCOPE.TREE) {
        globalDisplayOptions[optionName] = isChecked;
        redrawCurrentView();
        return;
    }

    if (!selectedNode) {
        optionInputs[optionName].checked = false;
        alert("Selectionne d'abord un noeud.");
        return;
    }

    if (!nodeDisplayOptions[selectedNode.nodeId]) {
        nodeDisplayOptions[selectedNode.nodeId] = createNodeDisplayOptions(selectedNode);
    }

    nodeDisplayOptions[selectedNode.nodeId][optionName] = isChecked;
    redrawCurrentView();
}

// Met le panneau en accord avec le mode choisi.
function syncOptionsPanelWithCurrentScope() {
    if (optionScope === OPTION_SCOPE.TREE) {
        updateOptionsPanel(globalDisplayOptions);
        return;
    }

    if (!selectedNode) {
        return;
    }

    if (!nodeDisplayOptions[selectedNode.nodeId]) {
        nodeDisplayOptions[selectedNode.nodeId] = createNodeDisplayOptions(selectedNode);
    }

    updateOptionsPanel(nodeDisplayOptions[selectedNode.nodeId]);
}

// Coche ou decoche les cases selon les options donnees.
function updateOptionsPanel(displayOptions) {
    optionInputs.condition.checked = displayOptions.condition;
    optionInputs.gini.checked = displayOptions.gini;
    optionInputs.samples.checked = displayOptions.samples;
    optionInputs.value.checked = displayOptions.value;
    optionInputs.class.checked = displayOptions.class;
}

// Evite de modifier un noeud tant qu'aucun noeud n'est selectionne.
function updateOptionInputsState() {
    const shouldDisable = optionScope === OPTION_SCOPE.NODE && !selectedNode;

    Object.keys(optionInputs).forEach(function(optionName) {
        optionInputs[optionName].disabled = shouldDisable;
    });
}

// Priorite aux options propres au noeud, sinon options globales.
function getNodeDisplayOptions(d) {
    if (nodeDisplayOptions[d.nodeId]) {
        return nodeDisplayOptions[d.nodeId];
    }

    return globalDisplayOptions;
}

// Un noeud personnalise part toujours de l'affichage courant.
function createNodeDisplayOptions(d) {
    const currentOptions = getNodeDisplayOptions(d);

    return {
        condition: currentOptions.condition,
        gini: currentOptions.gini,
        samples: currentOptions.samples,
        value: currentOptions.value,
        class: currentOptions.class
    };
}
