from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier

from sklearn_export_utils import forest_to_json, samples_to_json, save_json, tree_to_json


iris = load_iris()
# *2 et 3* data set genere 2D tjrs / pas tre false tensorflow.js,
# entrenemnt arbre via javascript, lanser du python, trouver une libra
selected_features = [2, 3]
X = iris.data[:, selected_features]
y = iris.target
feature_names = [iris.feature_names[i] for i in selected_features]
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
    "features": feature_names,
    "root": tree_to_json(tree_model.tree_, feature_names)
}

forest_json = forest_to_json(forest_model, feature_names, "iris")
iris_samples = samples_to_json(X, y, feature_names)
tree_with_data_json = {
    **tree_json,
    "data": iris_samples
}
forest_with_data_json = {
    **forest_json,
    "features": feature_names,
    "data": iris_samples
}

save_json(tree_with_data_json, "iris_tree.json")
save_json(forest_with_data_json, "iris_forest.json")
