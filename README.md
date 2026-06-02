# Visualisation d'arbres et de forets

Ce projet est une application web pour visualiser, tester et expliquer des
arbres de decision et des forets d'arbres. L'objectif est de faire le lien entre
un modele appris avec Python, un format JSON lisible, et une visualisation
interactive dans le navigateur avec D3.js.

Le principe general est :

```text
Python / scikit-learn -> JSON -> JavaScript / D3.js -> SVG interactif
```

Le projet contient trois pages :

- `index.html` : visualisation principale d'un arbre ou d'une foret;
- `construction.html` : construction pas a pas d'un arbre et regions de decision;
- `entrainement-foret.html` : entrainement interactif d'une foret, arbre par arbre.

## Lancer le projet

Depuis le dossier `visualisation-arbres` :

```bash
python3 -m http.server 8003
```

Puis ouvrir :

```text
http://localhost:8003/index.html
```

Un serveur local est preferable, car le navigateur bloque parfois certains
chargements quand on ouvre directement les fichiers HTML.

## Methode

Le projet se base sur une separation simple :

- Python entraine les modeles et exporte leur structure;
- JSON garde les arbres sous une forme independante du langage;
- JavaScript lit le JSON, calcule le placement, puis dessine avec D3.js;
- l'utilisateur peut ensuite explorer, tester et exporter la visualisation.

Pour un arbre, chaque noeud contient une condition comme
`petal width <= 0.8`. Les feuilles contiennent la classe predite. Pour une
foret, le fichier contient plusieurs arbres, puis la prediction finale se fait
par vote majoritaire.

## Visualisation principale

La page `index.html` permet de charger un fichier JSON. Le code detecte
automatiquement le type de fichier :

- si le JSON contient `trees`, il affiche une foret;
- si le JSON contient `root` ou un noeud `type: "node"`, il affiche un arbre.

Fonctionnalites principales :

- affichage d'un arbre ou d'une foret;
- zoom et deplacement dans le SVG;
- choix des informations visibles dans les noeuds;
- limitation de la profondeur affichee;
- selection d'un noeud et panneau de details;
- test d'une observation saisie a la main;
- test d'un fichier contenant plusieurs observations;
- export SVG, PNG et code D3.js.

Les resultats de test sont affiches dans un panneau separe avec :

- le nombre d'observations;
- le nombre de predictions correctes;
- le nombre d'erreurs;
- l'exactitude;
- le detail ligne par ligne.

## Construction pas a pas

La page `construction.html` sert a expliquer comment un arbre construit des
regions de decision.

A chaque etape :

- un nouveau noeud de l'arbre apparait;
- la frontiere correspondante apparait dans le graphique;
- les regions colorees montrent quelle classe est predite dans chaque zone;
- la legende associe chaque couleur a une classe.

Cette page est surtout pedagogique : elle montre que chaque condition de l'arbre
coupe l'espace selon une feature et un seuil.

## Entrainement interactif d'une foret

La page `entrainement-foret.html` permet d'observer l'effet d'une foret qui se
construit progressivement.

Le bouton de lecture ajoute les arbres un par un. A chaque arbre ajoute :

- une carte individuelle montre la decision de cet arbre;
- la carte collective est recalculee;
- chaque point de la grille recoit les votes des arbres deja entraines;
- la classe finale est la classe qui a le plus de votes.

Le bouton `Calculer directement` construit toute la foret en une seule fois.

Cette partie utilise un entrainement JavaScript maison inspire du principe CART :

- on cherche des seuils possibles sur les deux features;
- on choisit la coupe qui reduit le mieux l'impurete de Gini;
- on repete recursivement jusqu'a la profondeur maximale;
- chaque arbre utilise un echantillon bootstrap;
- la foret combine les arbres par vote majoritaire.

L'objectif n'est pas de remplacer scikit-learn, mais de rendre le fonctionnement
visible et interactif dans le navigateur.

## Fichiers importants

```text
visualisation-arbres/
├── index.html
├── construction.html
├── entrainement-foret.html
├── css/
│   └── style.css
├── js/
│   ├── shared/
│   │   ├── tree-viz.js
│   │   └── layout-utils.js
│   ├── main/
│   ├── construction/
│   └── training/
├── data/
└── python/
```

### `js/shared/`

Ce dossier contient les fonctions communes :

- `tree-viz.js` dessine les noeuds, les liens, les textes et les couleurs;
- `layout-utils.js` calcule la profondeur, le nombre de feuilles et les espacements.

### `js/main/`

Ce dossier gere la page principale :

- chargement JSON;
- detection arbre / foret;
- affichage principal;
- options d'affichage;
- selection des noeuds;
- test des observations;
- export SVG, PNG et D3.js.

### `js/construction/`

Ce dossier gere la construction pas a pas :

- creation des etapes;
- dessin de l'arbre a l'etape courante;
- dessin des regions de decision;
- affichage de la legende.

### `js/training/`

Ce dossier gere l'entrainement interactif :

- generation des datasets;
- chargement de donnees JSON;
- apprentissage des arbres;
- prediction par vote;
- calcul des metriques;
- dessin de la carte collective et des cartes individuelles.

## Exemples de donnees

Arbres :

- `data/tree-small.json`;
- `data/tree-medium.json`;
- `data/tree-regions-2-classes.json`;
- `data/tree-regions-3-classes.json`;
- `data/iris_tree.json`.

Forets :

- `data/forest-small.json`;
- `data/forest-demo-vote.json`;
- `data/iris_forest.json`.

Tests :

- `data/test-observations-demo.json`;
- `data/test-observations-iris.json`.

Donnees pour l'entrainement interactif :

- `data/training-points-demo.json`.

## Format JSON d'un arbre

Un noeud interne contient une condition :

```json
{
  "type": "node",
  "feature": "x2",
  "threshold": 0.5,
  "gini": 0.49,
  "samples": 20,
  "value": [11, 9],
  "left": {},
  "right": {}
}
```

Une feuille contient la classe predite :

```json
{
  "type": "leaf",
  "gini": 0,
  "samples": 6,
  "value": [6, 0],
  "class": 0
}
```

## Format JSON d'une foret

Une foret contient une liste d'arbres :

```json
{
  "model_type": "random_forest",
  "features": ["x1", "x2"],
  "classes": [0, 1],
  "trees": [
    {
      "id": 1,
      "root": {}
    }
  ]
}
```

Chaque `root` correspond a un arbre au meme format qu'un arbre simple.

## Format JSON pour tester des observations

Un fichier de test contient une liste d'observations. Chaque observation contient
les features attendues par le modele et, si on veut calculer l'exactitude, la
classe attendue.

```json
{
  "observations": [
    { "id": 1, "x1": 0.2, "x2": 0.4, "class": 0 },
    { "id": 2, "x1": 0.8, "x2": 0.7, "class": 1 }
  ]
}
```

## Export Python

Les scripts Python generent des fichiers JSON depuis `scikit-learn`.

```bash
/opt/anaconda3/bin/python python/export_iris.py
/opt/anaconda3/bin/python python/export_digits.py
```

Le fichier `python/sklearn_export_utils.py` contient les fonctions communes pour
transformer les objets sklearn en JSON.

## Comment presenter le projet

Une presentation simple peut suivre cet ordre :

1. Le modele est entraine en Python.
2. Sa structure est sauvegardee en JSON.
3. Le navigateur lit ce JSON et reconstruit l'arbre.
4. D3.js dessine les noeuds, les liens et les couleurs.
5. Pour une foret, plusieurs arbres sont affiches et la prediction se fait par vote.
6. Les regions de decision montrent visuellement quelles zones appartiennent a chaque classe.
7. La page d'entrainement montre progressivement comment la decision collective evolue.

## Limites actuelles

Le projet est un prototype fonctionnel. Les limites principales sont :

- les tres grands arbres restent difficiles a lire;
- l'API publique d'une vraie librairie n'est pas encore definie;
- l'entrainement JavaScript est pedagogique, moins complet que scikit-learn;
- les regions de decision sont surtout adaptees a deux features numeriques.

## Pistes d'amelioration

- ajouter une recherche de noeud;
- ajouter une mini-carte pour les grands arbres;
- permettre de comparer deux forets;
- ajouter plus de metriques sur les fichiers de test;
- creer une vraie API reutilisable autour de `drawDecisionTree`.
