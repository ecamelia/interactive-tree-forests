from sklearn.datasets import make_circles, make_classification, make_moons
from sklearn.preprocessing import MinMaxScaler

from sklearn_export_utils import save_json


def export_dataset(filename, dataset_name, source, X, y, scale=False):
    if scale:
        X = MinMaxScaler().fit_transform(X)

    points = [
        {
            "x1": round(float(row[0]), 4),
            "x2": round(float(row[1]), 4),
            "class": int(label)
        }
        for row, label in zip(X, y)
    ]

    save_json(
        {
            "dataset": dataset_name,
            "source": source,
            "features": ["x1", "x2"],
            "classes": [0, 1],
            "data": points
        },
        filename
    )


moons_X, moons_y = make_moons(
    n_samples=1200,
    noise=0.16,
    random_state=42
)

circles_X, circles_y = make_circles(
    n_samples=1200,
    noise=0.08,
    factor=0.45,
    random_state=42
)

diagonal_X, diagonal_y = make_classification(
    n_samples=1200,
    n_features=2,
    n_informative=2,
    n_redundant=0,
    n_repeated=0,
    n_clusters_per_class=1,
    class_sep=1.4,
    random_state=42
)

export_dataset(
    "training-moons-sklearn.json",
    "sklearn_make_moons",
    "sklearn.datasets.make_moons",
    moons_X,
    moons_y
)

export_dataset(
    "training-circles-sklearn.json",
    "sklearn_make_circles",
    "sklearn.datasets.make_circles",
    circles_X,
    circles_y,
    scale=True
)

export_dataset(
    "training-diagonal-sklearn.json",
    "sklearn_make_classification",
    "sklearn.datasets.make_classification",
    diagonal_X,
    diagonal_y,
    scale=True
)
