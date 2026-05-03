import json

from sklearn.tree import DecisionTreeClassifier


X = [
    [0.1, 0.2],
    [0.2, 0.3],
    [0.3, 0.4],
    [0.8, 0.4],
    [0.9, 0.5],
    [1.0, 0.6],
    [1.1, 0.7],
    [0.2, 1.0],
    [0.3, 1.1],
    [0.4, 1.2],
]

y = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0]

feature_names = ["x1", "x2"]

model = DecisionTreeClassifier(max_depth=3, random_state=0)
model.fit(X, y)


def tree_to_json(tree, node=0):
    value = [int(v) for v in tree.value[node][0]]

    if tree.children_left[node] == -1 and tree.children_right[node] == -1:
        return {
            "type": "leaf",
            "gini": round(float(tree.impurity[node]), 3),
            "samples": int(tree.n_node_samples[node]),
            "value": value,
            "class": int(tree.value[node][0].argmax())
        }

    return {
        "type": "node",
        "feature": feature_names[tree.feature[node]],
        "threshold": round(float(tree.threshold[node]), 3),
        "gini": round(float(tree.impurity[node]), 3),
        "samples": int(tree.n_node_samples[node]),
        "value": value,
        "left": tree_to_json(tree, tree.children_left[node]),
        "right": tree_to_json(tree, tree.children_right[node])
    }


tree_json = tree_to_json(model.tree_)

with open("../data/tree.json", "w", encoding="utf-8") as file:
    json.dump(tree_json, file, indent=2, ensure_ascii=False)

print("Fichier data/tree.json genere.")
