import json
from pathlib import Path

from sklearn.datasets import load_iris, make_moons
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

from sklearn_export_utils import forest_to_json, samples_to_json, tree_to_json


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "data" / "soutenance-demo"


def save_json(data, filename):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    print(f"Fichier genere : {output_path.relative_to(PROJECT_ROOT)}")


def tree_payload(model, X, y, feature_names, dataset_name):
    return {
        "dataset": dataset_name,
        "classes": [int(label) for label in model.classes_],
        "features": feature_names,
        "root": tree_to_json(model.tree_, feature_names),
        "data": samples_to_json(X, y, feature_names),
    }


def forest_payload(model, X, y, feature_names, dataset_name):
    payload = forest_to_json(model, feature_names, dataset_name)
    payload["features"] = feature_names
    payload["data"] = samples_to_json(X, y, feature_names)
    return payload


def observation_payload(X, y, feature_names):
    observations = []
    for index, (row, label) in enumerate(zip(X, y), start=1):
        sample = {"id": index}
        for feature_index, value in enumerate(row):
            sample[feature_names[feature_index]] = round(float(value), 6)
        sample["class"] = int(label)
        observations.append(sample)
    return {"observations": observations}


def build_iris_demo():
    iris = load_iris()
    selected_features = [2, 3]
    X = iris.data[:, selected_features]
    y = iris.target
    feature_names = [iris.feature_names[index] for index in selected_features]

    tree_small = DecisionTreeClassifier(max_depth=3, random_state=7)
    tree_large = DecisionTreeClassifier(max_depth=6, random_state=7)
    forest_small = RandomForestClassifier(
        n_estimators=3,
        max_depth=4,
        random_state=7,
    )
    forest_large = RandomForestClassifier(
        n_estimators=9,
        max_depth=6,
        random_state=7,
    )

    for model in [tree_small, tree_large, forest_small, forest_large]:
        model.fit(X, y)

    save_json(
        tree_payload(tree_small, X, y, feature_names, "iris_demo_small_tree"),
        "01-tree-iris-small.json",
    )
    save_json(
        tree_payload(tree_large, X, y, feature_names, "iris_demo_large_tree"),
        "02-tree-iris-large.json",
    )
    save_json(
        forest_payload(forest_small, X, y, feature_names, "iris_demo_small_forest"),
        "03-forest-iris-small.json",
    )
    save_json(
        forest_payload(forest_large, X, y, feature_names, "iris_demo_large_forest"),
        "04-forest-iris-large.json",
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.12,
        random_state=11,
        stratify=y,
    )
    save_json(
        observation_payload(X_test, y_test, feature_names),
        "09-test-observations-iris.json",
    )


def build_moons_demo():
    X, y = make_moons(n_samples=260, noise=0.19, random_state=21)
    feature_names = ["x1", "x2"]

    tree_small = DecisionTreeClassifier(max_depth=3, random_state=21)
    tree_large = DecisionTreeClassifier(
        max_depth=8,
        min_samples_leaf=2,
        random_state=21,
    )
    forest_small = RandomForestClassifier(
        n_estimators=4,
        max_depth=4,
        random_state=21,
    )
    forest_large = RandomForestClassifier(
        n_estimators=12,
        max_depth=7,
        min_samples_leaf=2,
        random_state=21,
    )

    for model in [tree_small, tree_large, forest_small, forest_large]:
        model.fit(X, y)

    save_json(
        tree_payload(tree_small, X, y, feature_names, "moons_demo_small_tree"),
        "05-tree-moons-small.json",
    )
    save_json(
        tree_payload(tree_large, X, y, feature_names, "moons_demo_large_tree"),
        "06-tree-moons-large.json",
    )
    save_json(
        forest_payload(forest_small, X, y, feature_names, "moons_demo_small_forest"),
        "07-forest-moons-small.json",
    )
    save_json(
        forest_payload(forest_large, X, y, feature_names, "moons_demo_large_forest"),
        "08-forest-moons-large.json",
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.08,
        random_state=5,
        stratify=y,
    )
    save_json(
        observation_payload(X_test, y_test, feature_names),
        "10-test-observations-moons.json",
    )


def write_readme():
    readme = """# Soutenance demo

Fichiers JSON prepares pour une demonstration rapide.

Ordre conseille :
1. 01-tree-iris-small.json
2. 02-tree-iris-large.json
3. 03-forest-iris-small.json
4. 04-forest-iris-large.json
5. 05-tree-moons-small.json
6. 06-tree-moons-large.json
7. 07-forest-moons-small.json
8. 08-forest-moons-large.json

Fichiers de test :
- 09-test-observations-iris.json
- 10-test-observations-moons.json

Conseils demo :
- utiliser Iris pour montrer un cas multi-classes simple et lisible ;
- utiliser Moons pour montrer des frontieres de decision plus parlantes ;
- comparer les versions small / large pour montrer l'impact de la profondeur ;
- comparer les versions tree / forest pour expliquer le vote majoritaire.
"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "README.md").write_text(readme, encoding="utf-8")
    print(f"Fichier genere : {(OUTPUT_DIR / 'README.md').relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    build_iris_demo()
    build_moons_demo()
    write_readme()
