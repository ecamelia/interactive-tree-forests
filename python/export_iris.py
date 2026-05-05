from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier

from sklearn_export_utils import forest_to_json, save_json, tree_to_json


iris = load_iris()
X = iris.data
y = iris.target
feature_names = [name.replace(" (cm)", "") for name in iris.feature_names]

tree_model = DecisionTreeClassifier(max_depth=4, random_state=0)
tree_model.fit(X, y)

forest_model = RandomForestClassifier(
    n_estimators=5,
    max_depth=4,
    random_state=0
)
forest_model.fit(X, y)

tree_json = {
    "dataset": "iris",
    "classes": [int(label) for label in tree_model.classes_],
    "root": tree_to_json(tree_model.tree_, feature_names)
}

forest_json = forest_to_json(forest_model, feature_names, "iris")

save_json(tree_json, "iris_tree.json")
save_json(forest_json, "iris_forest.json")
