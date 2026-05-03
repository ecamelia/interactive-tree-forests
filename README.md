# Visualisation d'arbres

Petit debut de projet pour afficher un arbre de decision ou une foret
d'arbres dans une page web.

## Idee du projet

Le projet suit cette chaine :

```text
Python -> modele arbre/foret -> JSON -> JavaScript -> SVG
```

Python sert a entrainer ou recuperer un arbre.
Le JSON sert a transporter les donnees.
JavaScript avec D3.js sert a afficher l'arbre.

## Fichiers

```text
index.html          page web
css/style.css       style de la page
js/app.js           affichage D3.js
data/tree.json      exemple d'arbre seul
data/forest.json    exemple de foret avec plusieurs arbres
python/export_tree.py script Python pour generer tree.json
python/export_forest.py script Python pour generer forest.json
```

## Lancer la page

Depuis le dossier `visualisation-arbres` :

```bash
python3 -m http.server 8002
```

Puis ouvrir :

```text
http://localhost:8002
```

## Principe pour une foret

Une foret contient plusieurs arbres :

```json
{
  "model_type": "random_forest",
  "trees": [
    { "id": 1, "root": {} },
    { "id": 2, "root": {} }
  ]
}
```

La page lit `data/forest.json`, remplit le menu, puis affiche l'arbre choisi.
