import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"


def tree_to_json(tree, feature_names, node=0):
    samples = int(tree.n_node_samples[node])
    value = get_node_value(tree, node, samples)

    if tree.children_left[node] == -1 and tree.children_right[node] == -1:
        return {
            "type": "leaf",
            "gini": round(float(tree.impurity[node]), 3),
            "samples": samples,
            "value": value,
            "class": get_predicted_class(value)
        }

    return {
        "type": "node",
        "feature": feature_names[tree.feature[node]],
        "threshold": round(float(tree.threshold[node]), 3),
        "gini": round(float(tree.impurity[node]), 3),
        "samples": samples,
        "value": value,
        "left": tree_to_json(tree, feature_names, tree.children_left[node]),
        "right": tree_to_json(tree, feature_names, tree.children_right[node])
    }


def forest_to_json(model, feature_names, dataset_name):
    return {
        "model_type": "random_forest",
        "dataset": dataset_name,
        "classes": [int(label) for label in model.classes_],
        "trees": [
            {
                "id": index + 1,
                "weight": 1,
                "root": tree_to_json(estimator.tree_, feature_names)
            }
            for index, estimator in enumerate(model.estimators_)
        ]
    }


def samples_to_json(X, y, feature_names):
    return [
        {
            **{
                feature_names[index]: round(float(value), 6)
                for index, value in enumerate(row)
            },
            "class": int(label)
        }
        for row, label in zip(X, y)
    ]


def save_json(data, filename):
    DATA_DIR.mkdir(exist_ok=True)
    output_path = DATA_DIR / filename

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

    print(f"Fichier genere : {output_path.relative_to(PROJECT_ROOT)}")


def get_node_value(tree, node, samples):
    values = [float(value) for value in tree.value[node][0]]

    if sum(values) <= 1.00001 and samples > 1:
        values = [value * samples for value in values]

    return [int(round(value)) for value in values]


def get_predicted_class(value):
    return int(max(range(len(value)), key=value.__getitem__))
