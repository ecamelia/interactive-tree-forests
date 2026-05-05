from sklearn.datasets import load_digits
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier

from sklearn_export_utils import forest_to_json, save_json, tree_to_json


digits = load_digits()
X = digits.data
y = digits.target
feature_names = [
    "pixel_" + str(index // 8) + "_" + str(index % 8)
    for index in range(X.shape[1])
]

tree_model = DecisionTreeClassifier(max_depth=5, random_state=0)
tree_model.fit(X, y)

forest_model = RandomForestClassifier(
    n_estimators=5,
    max_depth=5,
    random_state=0
)
forest_model.fit(X, y)

tree_json = {
    "dataset": "digits",
    "classes": [int(label) for label in tree_model.classes_],
    "root": tree_to_json(tree_model.tree_, feature_names)
}

forest_json = forest_to_json(forest_model, feature_names, "digits")

save_json(tree_json, "digits_tree.json")
save_json(forest_json, "digits_forest.json")
