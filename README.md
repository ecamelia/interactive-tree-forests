# Arbres et forets interactifs

Ce projet est une application web interactive pour visualiser, tester et
expliquer des arbres de decision et des forets d'arbres.

Il a ete developpe dans le cadre de mon stage. Le but est surtout pedagogique :
rendre plus visibles les notions de noeud, seuil, feuille, vote de foret et
region de decision.

Le projet relie trois parties :

```text
Python / scikit-learn -> JSON -> JavaScript / D3.js
```

Python sert a generer certains modeles et datasets d'exemple. Le JSON garde la
structure des arbres sous une forme simple. JavaScript lit ces donnees et D3.js
les affiche dans le navigateur.

## Lancer le projet

Depuis le dossier du projet :

```bash
cd /Users/cameliaermurache/Desktop/Stage/arbres-forets-interactifs
npm install
npm run serve
```

Puis ouvrir :

```text
http://localhost:8004/index.html
```

Le serveur local est important, car les navigateurs bloquent parfois certains
chargements quand on ouvre directement un fichier HTML.

## Pages du projet

Le projet contient une page d'accueil et trois pages principales.

### `index.html`

Page d'accueil du projet.

Elle presente rapidement l'application et donne acces aux trois parties :

- visualisation;
- construction pas a pas;
- entrainement interactif d'une foret.

### `visualisation.html`

Page de visualisation principale.

Elle permet de charger un fichier JSON contenant un arbre ou une foret. La page
detecte automatiquement le type de modele :

- un arbre simple si le fichier contient `root`;
- une foret si le fichier contient `trees`.

Fonctionnalites :

- affichage d'un arbre ou d'une foret;
- zoom et deplacement dans le SVG;
- choix des informations visibles dans les noeuds;
- limitation de la profondeur affichee;
- selection d'un noeud;
- test d'une observation;
- chargement d'un fichier de test;
- export SVG, PNG et code D3.js.

### `construction.html`

Page de construction pas a pas.

Elle montre comment les frontieres de decision apparaissent au fur et a mesure
que l'arbre se developpe. A chaque etape, un noeud est ajoute et la carte de
decision est mise a jour.

Cette page permet d'expliquer qu'une condition comme :

```text
x1 <= 0.45
```

coupe l'espace en deux zones.

### `entrainement-foret.html`

Page d'entrainement interactif.

Elle permet de charger des datasets d'exemple, puis d'ajouter les arbres d'une
foret un par un. La carte principale montre la decision collective de la foret,
tandis que les petites cartes montrent la decision de chaque arbre.

Deux moteurs sont disponibles :

- `code pedagogique` : implementation JavaScript maison;
- `bibliotheque ml-random-forest` : implementation basee sur une librairie JS.

Le mode pedagogique sert a comprendre l'algorithme. Le mode bibliotheque sert a
comparer avec une implementation existante.

## Structure des dossiers

```text
arbres-forets-interactifs/
├── index.html
├── visualisation.html
├── construction.html
├── entrainement-foret.html
├── css/
│   └── style.css
├── data/
├── js/
│   ├── shared/
│   ├── main/
│   ├── construction/
│   └── training/
├── python/
├── vendor/
├── package.json
└── package-lock.json
```

## Choix techniques

Le projet utilise des fichiers JSON comme format d'echange, car ils sont faciles
a produire avec Python et faciles a lire avec JavaScript. Cela permet de garder
une separation claire entre la generation des modeles et leur visualisation.

D3.js est utilise pour le dessin SVG : arbres, liens, axes, points et cartes de
decision. Ce choix donne plus de controle sur le placement des noeuds et sur les
interactions.

Pour l'entrainement des forets dans le navigateur, deux approches sont gardees :
un code pedagogique ecrit en JavaScript pour comprendre les etapes, et
`ml-random-forest` pour comparer avec une bibliotheque existante.

## Role des dossiers JavaScript

### `js/shared/`

Code commun reutilise par plusieurs pages.

- `tree-viz.js` dessine les noeuds, les liens, les textes et les couleurs.
- `layout-utils.js` calcule la profondeur, les feuilles et les espacements.

### `js/main/`

Code de la page `visualisation.html`.

Il gere le chargement JSON, l'affichage des arbres et forets, les interactions,
les options d'affichage, les tests d'observations et les exports.

### `js/construction/`

Code de la page `construction.html`.

Il gere les etapes de construction, le dessin de l'arbre courant et les regions
de decision associees.

### `js/training/`

Code de la page `entrainement-foret.html`.

- `state.js` contient l'etat partage de la page.
- `data.js` charge les datasets d'exemple ou un JSON donne par l'utilisateur.
- `trainer.js` contient l'entrainement pedagogique.
- `library-forest.js` utilise `ml-random-forest`.
- `prediction.js` centralise les predictions.
- `render.js` dessine la carte principale et les cartes individuelles.
- `metrics.js` calcule l'exactitude et l'accord moyen.
- `utils.js` contient les fonctions utilitaires.
- `forest-playground.js` branche les boutons de l'interface.

## Comment les fichiers travaillent ensemble

Le projet est separe par page, mais le principe reste le meme :

1. Une page HTML contient les zones visibles : boutons, panneaux, SVG.
2. Un fichier JavaScript lit les elements HTML et garde l'etat courant.
3. Les donnees viennent soit d'un JSON charge par l'utilisateur, soit de fichiers
   JSON prepares avec `scikit-learn`.
4. Les fonctions de prediction calculent la classe d'une observation.
5. Les fonctions de rendu dessinent le resultat avec D3.js.

Pour la page principale, le chemin est :

```text
visualisation.html
-> js/main/renderer.js
-> js/shared/tree-viz.js
-> js/main/interactions.js
-> js/main/decision-explainer.js
```

Pour la page d'entrainement, le chemin est :

```text
entrainement-foret.html
-> js/training/forest-playground.js
-> js/training/data.js
-> js/training/trainer.js ou js/training/library-forest.js
-> js/training/prediction.js
-> js/training/render.js
```

Cette separation evite d'avoir tout le projet dans un seul gros fichier. Chaque
fichier a un role precis : donnees, entrainement, prediction, rendu ou
interaction.

## Entrainement pedagogique

Le fichier `js/training/trainer.js` construit une foret d'arbres directement en
JavaScript.

Le principe est le suivant :

1. On cree un echantillon bootstrap pour chaque arbre.
2. On cherche plusieurs seuils possibles sur les features.
3. On calcule l'impurete de Gini pour chaque separation.
4. On garde la separation qui reduit le mieux l'impurete.
5. On recommence recursivement jusqu'a la profondeur maximale.
6. Les feuilles predisent la classe majoritaire.
7. La foret combine les arbres avec un vote majoritaire.

Ce moteur ne cherche pas a remplacer une vraie bibliotheque comme scikit-learn.
Je l'ai garde pour pouvoir expliquer le fonctionnement interne d'une foret,
et pour montrer l'ajout progressif des arbres dans l'interface.

Les fonctions importantes sont :

- `trainRandomTree()` : cree un arbre avec un echantillon bootstrap.
- `buildTree()` : construit recursivement les noeuds et les feuilles.
- `findBestSplit()` : cherche la meilleure condition de separation.
- `giniImpurity()` : mesure si un groupe contient des classes melangees.

Ce code sert surtout a montrer la methode : on voit comment un arbre choisit une
condition, comment il se divise, puis comment plusieurs arbres peuvent ensuite
voter ensemble.

## Entrainement avec bibliotheque

Le fichier `js/training/library-forest.js` utilise la bibliotheque
`ml-random-forest`.

La dependance est declaree dans `package.json` :

```json
"ml-random-forest": "^2.1.0"
```

Pour la page HTML statique, une version navigateur est gardee dans :

```text
vendor/ml-random-forest.bundle.mjs
```

Cette copie est utilisee car le fichier npm principal repose sur `require(...)`,
qui n'est pas directement utilisable dans Safari sans outil de build.

Les fonctions importantes sont :

- `getRandomForestClassifier()` : charge la bibliotheque depuis `vendor/`.
- `trainLibraryForest()` : cree le modele et lance `model.train(X, y)`.
- `getLibraryTrainingMatrix()` : transforme les points en matrice `X`.
- `getLibraryLabels()` : transforme les classes en tableau `y`.
- `getLibraryPrediction()` : recupere la classe predite et la confiance.

Ce mode montre une version plus proche d'un usage reel : l'entrainement est
confie a une bibliotheque, et le reste du projet se concentre sur l'affichage,
les cartes de decision et l'interaction.

## Comment expliquer la carte de decision

La carte de decision est calculee comme une grille. Pour chaque petite zone du
graphique, le programme cree une observation fictive :

```text
observation = { x1: valeur_x, x2: valeur_y }
```

Ensuite le modele predit une classe pour cette observation. La couleur de la
zone correspond a la classe predite. Dans une foret, la couleur vient du vote
majoritaire des arbres.

La carte principale montre donc la decision collective. Les petites cartes de
droite permettent de comparer cette decision avec les decisions individuelles
des arbres.

## Donnees d'exemple

Le dossier `data/` contient plusieurs fichiers utiles pour tester le projet.

Arbres :

- `tree-small.json`
- `tree-medium.json`
- `tree-regions-2-classes.json`
- `tree-regions-3-classes.json`
- `iris_tree.json`

Forets :

- `forest-small.json`
- `forest-demo-vote.json`
- `iris_forest.json`

Tests :

- `test-observations-demo.json`
- `test-observations-iris.json`

Donnees d'entrainement :

- `training-points-demo.json`
- `training-moons-sklearn.json`
- `training-circles-sklearn.json`
- `training-diagonal-sklearn.json`

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

## Format JSON pour les tests

Un fichier de test contient une liste d'observations :

```json
{
  "observations": [
    { "id": 1, "x1": 0.2, "x2": 0.4, "class": 0 },
    { "id": 2, "x1": 0.8, "x2": 0.7, "class": 1 }
  ]
}
```

La classe attendue est optionnelle, mais elle permet de calculer l'exactitude.

## Scripts Python

Le dossier `python/` contient les scripts qui exportent des modeles
`scikit-learn` vers JSON.

Commande principale :

```bash
/opt/anaconda3/bin/python python/export_iris.py
```

Le fichier `python/sklearn_export_utils.py` contient les fonctions communes pour
transformer les arbres sklearn en JSON.

Le fichier `python/export_training_datasets.py` genere les datasets de la page
d'entrainement avec `scikit-learn` :

```text
make_moons          -> dataset lunes
make_circles        -> dataset cercles
make_classification -> dataset diagonale
```

Les resultats sont enregistres dans `data/`, puis charges par
`js/training/data.js`.

## Bibliotheques utilisees

- D3.js : dessin SVG, axes, points, liens et cartes.
- ml-random-forest : entrainement Random Forest en JavaScript.
- scikit-learn : generation de certains modeles JSON avec Python.

Le projet n'utilise pas `node_modules/` directement dans GitHub. Ce dossier est
regenere avec :

```bash
npm install
```

Le fichier `vendor/ml-random-forest.bundle.mjs` est garde dans le depot car il
permet d'utiliser la bibliotheque dans le navigateur sans configuration de
build.

## Points a presenter

Pour une soutenance, l'explication peut suivre cet ordre :

1. Le modele peut venir de Python ou etre entraine dans le navigateur.
2. La structure est representee en JSON.
3. Le navigateur reconstruit les arbres a partir du JSON.
4. D3.js dessine la visualisation.
5. Une foret combine plusieurs arbres par vote majoritaire.
6. Les regions de decision montrent visuellement la classe predite.
7. La page training compare une implementation pedagogique avec une bibliotheque.

## Limites

- Les tres grands arbres restent difficiles a lire.
- Les regions de decision sont surtout adaptees a deux features.
- Le mode pedagogique ne remplace pas une bibliotheque complete.
- Le bundle dans `vendor/` sert a garder la page utilisable sans outil de build.
