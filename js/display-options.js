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

// Active les controles de style du noeud selectionne.
function setupNodeStyleControls() {
    nodeStyleFillInput.addEventListener("input", updateSelectedNodeStyle);
    nodeStyleTextInput.addEventListener("input", updateSelectedNodeStyle);
    nodeStyleFontSizeInput.addEventListener("change", updateSelectedNodeStyle);
    nodeStyleWidthInput.addEventListener("change", updateSelectedNodeStyle);
    nodeStyleHeightInput.addEventListener("change", updateSelectedNodeStyle);

    resetNodeStyleButton.addEventListener("click", function() {
        if (!selectedNode) {
            return;
        }

        delete nodeStyleOptions[selectedNode.nodeId];
        syncNodeStylePanelWithSelection();
        redrawCurrentView();
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

// Le style direct est volontairement limite au mode detaille.
function updateNodeStyleInputsState() {
    const shouldDisable = !selectedNode || displayMode !== "detail";

    nodeStylePanel.classList.toggle("is-disabled", shouldDisable);
    nodeStyleFillInput.disabled = shouldDisable;
    nodeStyleTextInput.disabled = shouldDisable;
    nodeStyleFontSizeInput.disabled = shouldDisable;
    nodeStyleWidthInput.disabled = shouldDisable;
    nodeStyleHeightInput.disabled = shouldDisable;
    resetNodeStyleButton.disabled = shouldDisable;
}

function updateSelectedNodeStyle() {
    if (!selectedNode || displayMode !== "detail") {
        return;
    }

    nodeStyleOptions[selectedNode.nodeId] = {
        fill: nodeStyleFillInput.value,
        textColor: nodeStyleTextInput.value,
        fontSize: Number(nodeStyleFontSizeInput.value) || 16,
        width: Number(nodeStyleWidthInput.value) || detailConfig.boxWidth,
        height: Number(nodeStyleHeightInput.value) || detailConfig.boxHeight
    };

    redrawCurrentView();
}

function syncNodeStylePanelWithSelection() {
    const style = selectedNode ? getNodeStyleOptions(selectedNode) : getDefaultNodeStyle();

    nodeStyleFillInput.value = style.fill;
    nodeStyleTextInput.value = style.textColor;
    nodeStyleFontSizeInput.value = style.fontSize;
    nodeStyleWidthInput.value = style.width;
    nodeStyleHeightInput.value = style.height;
    updateNodeStyleInputsState();
}

// Priorite aux options propres au noeud, sinon options globales.
function getNodeDisplayOptions(d) {
    if (nodeDisplayOptions[d.nodeId]) {
        return nodeDisplayOptions[d.nodeId];
    }

    return globalDisplayOptions;
}

function getNodeStyleOptions(d) {
    if (nodeStyleOptions[d.nodeId]) {
        return nodeStyleOptions[d.nodeId];
    }

    return getDefaultNodeStyle(d);
}

function getDefaultNodeStyle(d) {
    return {
        fill: d ? getNodeColor(d) : "#ffffff",
        textColor: "#111111",
        fontSize: 16,
        width: detailConfig.boxWidth,
        height: detailConfig.boxHeight
    };
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
