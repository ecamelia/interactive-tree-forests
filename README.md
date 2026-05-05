# Visualisation d'arbres et de forets

Ce projet est un debut d'outil JavaScript pour afficher des arbres de decision
et des forets d'arbres dans une page web avec D3.js.

L'idee principale est de faire le lien entre un modele entraine en Python avec
`scikit-learn` et une visualisation dans le navigateur. Python sert a exporter
la structure du modele en JSON, puis JavaScript lit ce JSON et dessine l'arbre.

Ce n'est pas encore une librairie complete, mais le code est organise pour
aller dans cette direction.

## Objectif du projet

L'objectif n'est pas seulement de faire une page HTML qui affiche un arbre. Le
but est de construire progressivement un outil reutilisable qui pourra :

- lire un arbre de decision exporte depuis `scikit-learn`;
- lire une foret contenant plusieurs arbres;
- afficher automatiquement le bon type de visualisation selon le fichier JSON;
- personnaliser les informations visibles dans les noeuds;
- exporter la visualisation en SVG ou en PNG;
- exporter un fichier JavaScript contenant le code D3.js de la visualisation.

Le principe general est :

```text
Python / scikit-learn -> JSON -> JavaScript / D3.js -> SVG dans le navigateur
```

## Structure du projet

```text
visualisation-arbres/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app-state.js
│   ├── app.js
│   ├── data-loader.js
│   ├── display-options.js
│   ├── interactions.js
│   ├── path-tools.js
│   ├── renderer.js
│   ├── tree-viz.js
│   └── export-utils.js
├── data/
│   ├── tree.json
│   ├── tree-small.json
│   ├── tree-medium.json
│   ├── tree-big.json
│   ├── leaf-only.json
│   ├── forest.json
│   ├── forest-small.json
│   └── forest-medium.json
└── python/
    ├── export_tree.py
    └── export_forest.py
```

## Role des fichiers

### `index.html`

C'est la page de demonstration. Elle contient :

- un bouton pour charger un fichier JSON;
- les boutons d'export SVG, PNG et code D3.js;
- un panneau pour choisir les informations affichees dans les noeuds;
- le SVG principal ou les arbres sont dessines;
- le chargement des fichiers JavaScript.

Le bouton `Charger JSON` remplace les anciens boutons "arbre" et "foret". Le
programme regarde le contenu du fichier et decide automatiquement quoi afficher.

### `css/style.css`

Ce fichier contient le style de la page :

- la mise en page generale;
- les boutons;
- le panneau d'options;
- les noeuds;
- les liens entre les noeuds;
- les couleurs des feuilles;
- le tooltip au survol.

### `js/tree-viz.js`

C'est le fichier le plus important pour la visualisation.

Il contient la fonction :

```js
drawDecisionTree(data, group, config, options)
```

Cette fonction transforme le JSON en structure D3 avec `d3.hierarchy`, calcule
la position des noeuds avec `d3.tree`, puis dessine :

- les lignes entre les noeuds;
- les labels `True` et `False`;
- les rectangles des noeuds;
- les textes dans les noeuds;
- les couleurs des feuilles selon la classe.

Ce fichier est la base de la future librairie.

### Organisation du JavaScript

La partie JavaScript est separee en plusieurs fichiers pour eviter d'avoir un
seul fichier trop long.

L'ordre de chargement dans `index.html` est important, car les fichiers
partagent des fonctions globales simples.

### `js/app-state.js`

Ce fichier contient l'etat general de la page :

- les constantes `VIEW_TYPE` et `OPTION_SCOPE`;
- les elements HTML recuperes avec `document.getElementById`;
- les configurations de taille des arbres;
- les options d'affichage globales;
- l'etat courant : arbre affiche, foret affichee, noeud selectionne, niveau
  maximal affiche.

### `js/app.js`

Ce fichier sert seulement au demarrage de l'application.

Il fait :

- l'initialisation du zoom;
- la connexion des boutons aux fonctions;
- l'affichage du message d'accueil avant le chargement d'un JSON.

### `js/data-loader.js`

Ce fichier gere les donnees JSON :

- le chargement du fichier JSON choisi par l'utilisateur;
- la detection automatique entre arbre simple et foret;
- la verification du format JSON.

La detection se fait simplement :

- si le JSON contient `trees`, c'est une foret;
- si le JSON contient `type: "node"` ou `type: "leaf"`, c'est un arbre.

### `js/renderer.js`

Ce fichier gere l'affichage principal :

- l'affichage d'un arbre simple;
- l'affichage d'une foret;
- le zoom et le deplacement dans le SVG;
- l'ajustement automatique de l'espace pour les arbres plus grands;
- le choix du nombre de niveaux affiches.
- le mode d'affichage detaille ou general.

### `js/interactions.js`

Ce fichier gere les interactions avec les noeuds :

- le tooltip au survol;
- la selection d'un noeud;

### `js/path-tools.js`

Ce fichier gere le mode chemin :

- activation ou desactivation du mode chemin;
- ajout ou suppression d'un noeud dans le chemin;
- effacement du chemin;
- detection des noeuds et liens qui doivent etre colores.

### `js/display-options.js`

Ce fichier gere les cases du panneau d'affichage :

- les options d'affichage pour tout l'arbre;
- les options d'affichage pour un seul noeud selectionne.

### `js/export-utils.js`

Ce fichier contient les fonctions d'export :

```js
exportSVG()
exportPNG()
exportCurrentD3Code(...)
```

L'export SVG copie le SVG affiche dans la page et ajoute les styles utiles pour
garder les lignes, les couleurs et les textes.

L'export PNG transforme d'abord le SVG en image, puis le dessine dans un
`canvas` avant de telecharger le fichier.

L'export D3.js telecharge un fichier `.js` qui contient les donnees affichees et
un exemple de code D3 pour redessiner l'arbre ou la foret dans un autre SVG.

### `data/`

Ce dossier contient des fichiers JSON pour tester l'outil.

Arbres simples :

- `tree.json` : arbre de base;
- `tree-small.json` : petit arbre avec une seule condition;
- `tree-medium.json` : arbre un peu plus complet;
- `tree-big.json` : arbre plus grand avec plusieurs niveaux;
- `leaf-only.json` : cas special avec seulement une feuille.

Forets :

- `forest.json` : foret de base;
- `forest-small.json` : petite foret;
- `forest-medium.json` : foret avec plusieurs arbres.

Ces fichiers servent surtout a verifier que le bouton `Charger JSON` fonctionne
bien avec plusieurs formes de donnees.

### `python/export_tree.py`

Ce script entraine un `DecisionTreeClassifier` avec `scikit-learn`, puis exporte
sa structure en JSON.

Le but est de recuperer les informations importantes de l'arbre :

- la feature utilisee dans chaque noeud;
- le seuil de separation;
- le gini;
- le nombre d'echantillons;
- les valeurs par classe;
- la classe predite dans les feuilles.

### `python/export_forest.py`

Ce script fait la meme chose, mais avec un `RandomForestClassifier`.

Une foret contient plusieurs arbres. Le script exporte donc une liste `trees`,
ou chaque element contient la racine d'un arbre.

## Lancer le projet

Depuis le dossier `visualisation-arbres` :

```bash
python3 -m http.server 8002
```

Puis ouvrir :

```text
http://localhost:8002
```

Il faut passer par un serveur local, car le navigateur bloque souvent le
chargement de fichiers JSON si on ouvre seulement le fichier HTML directement.

## Utilisation

1. Ouvrir la page dans le navigateur.
2. La page affiche le message `Chargez votre fichier JSON`.
3. Cliquer sur `Charger JSON`.
4. Choisir un fichier dans le dossier `data/`.
5. Le programme affiche automatiquement un arbre ou une foret.
6. Utiliser les cases pour choisir les informations visibles dans les noeuds.
7. Utiliser `Exporter SVG`, `Exporter PNG` ou `Exporter code D3.js` si besoin.

## Personnalisation des noeuds

Le panneau d'options propose deux modes :

- `tout l'arbre` : les cases s'appliquent a tous les noeuds affiches;
- `noeud selectionne` : les cases s'appliquent seulement au noeud clique.

Les informations que l'on peut afficher ou cacher sont :

- `condition`;
- `gini`;
- `samples`;
- `value`;
- `class`.

Cela permet de commencer avec une visualisation complete, puis de simplifier
l'affichage si l'arbre devient trop charge.

Pour les grands arbres, le menu `niveaux` permet d'afficher seulement les
premiers niveaux de l'arbre. Par exemple, choisir `3` affiche la racine et les
deux niveaux suivants. L'option `tous` affiche l'arbre entier.

Le menu `mode` permet de changer le style d'affichage :

- `detaillé` : noeuds rectangulaires avec les informations dans chaque noeud;
- `general` : noeuds ronds, sans texte, pour voir plus facilement la structure.

Le mode `chemin` permet de cliquer sur plusieurs noeuds pour les colorer. Si
deux noeuds selectionnes sont relies directement, le lien entre eux est colore
aussi. Le bouton `Effacer chemin` remet le chemin a zero.

## Format JSON d'un arbre

Un noeud interne contient une condition :

```json
{
  "type": "node",
  "feature": "x2",
  "threshold": 0.85,
  "gini": 0.48,
  "samples": 10,
  "value": [6, 4],
  "left": {},
  "right": {}
}
```

Une feuille contient une classe predite :

```json
{
  "type": "leaf",
  "gini": 0.0,
  "samples": 3,
  "value": [3, 0],
  "class": 0
}
```

## Format JSON d'une foret

Une foret contient une liste d'arbres :

```json
{
  "model_type": "random_forest",
  "classes": [0, 1],
  "trees": [
    {
      "id": 1,
      "weight": 1,
      "root": {}
    }
  ]
}
```

Chaque `root` correspond a un arbre au meme format que les fichiers d'arbre
simple.

## Fonctionnalites actuelles

- Chargement d'un fichier JSON depuis la page.
- Detection automatique arbre / foret.
- Affichage d'un arbre de decision.
- Affichage d'une foret.
- Zoom et deplacement.
- Tooltip au survol d'un noeud.
- Couleur des feuilles selon la classe.
- Personnalisation globale de l'affichage.
- Personnalisation d'un noeud selectionne.
- Creation d'un chemin colore en selectionnant plusieurs noeuds.
- Ajustement automatique de l'espacement selon la taille de l'arbre.
- Affichage limite aux premiers niveaux pour les grands arbres.
- Mode d'affichage general avec des noeuds ronds.
- Export SVG.
- Export PNG.
- Export du code D3.js de la visualisation courante.

## Limites actuelles

Le projet fonctionne comme prototype, mais il reste encore plusieurs choses a
ameliorer pour avoir une vraie librairie :

- l'API publique n'est pas encore definie;
- les tres grands arbres peuvent encore necessiter des modes plus avances;
- les forets avec beaucoup d'arbres devront avoir un systeme de filtrage;
- l'export du code D3.js est un premier exemple, pas encore une API complete;
- les zones de decision ne sont pas encore implementees.

## Prochaines etapes

Les prochaines ameliorations possibles sont :

- separer encore plus la partie librairie et la partie demonstration;
- creer une API simple, par exemple `TreeViz.drawTree(...)`;
- ameliorer le mode grands arbres avec recherche, mini-carte ou focus sur une branche;
- ajouter un champ pour choisir les indices des arbres a afficher dans une foret;
- ajouter les zones de decision;
- documenter le format JSON attendu;
- preparer des exemples avec des jeux de donnees plus connus, comme Iris ou
  Digits.

## Statut

Pour le moment, le projet est une base fonctionnelle. Il permet deja de tester
le lien entre Python, JSON et D3.js, et il servira de point de depart pour une
librairie de visualisation d'arbres de decision et de forets.
