# Dossier de demo soutenance

Ce dossier rassemble des fichiers JSON deja compatibles avec l'application,
renommes pour etre plus simples a presenter pendant une demonstration.

## Ordre conseille

1. `01-tree-tres-petit.json`
   Arbre minimal, parfait pour expliquer rapidement la structure
   `racine -> branches -> feuilles`.

2. `02-tree-moyen.json`
   Arbre plus riche, utile pour montrer davantage de niveaux de decision.

3. `03-tree-grand-iris.json`
   Grand arbre multi-classes base sur Iris, utile pour montrer un cas plus
   realiste et plus dense.

4. `04-forest-tres-petite.json`
   Petite foret, bien pour introduire la difference entre arbre unique et
   ensemble d'arbres.

5. `05-forest-vote-moyenne.json`
   Foret binaire plus lisible pour expliquer le vote majoritaire.

6. `06-forest-grande-iris.json`
   Grande foret multi-classes, utile pour terminer avec un cas complet.

## Fichiers de test

- `07-test-observations-demo.json`
- `08-test-observations-iris.json`

## Alternatives ajoutees

- `09-tree-3-classes.json`
  Arbre a 3 classes avec regions de decision plus parlantes visuellement.
  Tres utile si tu veux eviter le petit arbre avec seulement deux feuilles
  rouges et deux feuilles bleues.

- `10-forest-3-classes-iris.json`
  Foret Iris multi-classes. Plus riche visuellement et plus "realiste" pour
  une demonstration de foret aleatoire.

- `11-tree-construction-lisible.json`
  Arbre binaire plus equilibre et plus lisible que l'exemple le plus petit.
  Bien adapte si tu veux un premier exemple simple, sans rendu trop minimal.

## Conseils de demo

- Commencer par `01-tree-tres-petit.json` pour expliquer la logique de base.
- Si tu n'aimes pas le rendu du premier exemple, remplacer directement
  `01-tree-tres-petit.json` par `11-tree-construction-lisible.json`.
- Passer a `03-tree-grand-iris.json` pour montrer un arbre plus complexe.
- Utiliser `09-tree-3-classes.json` si tu veux une diapo ou une demo plus
  visuelle avec trois classes bien distinctes.
- Utiliser `05-forest-vote-moyenne.json` pour illustrer le vote majoritaire.
- Utiliser `10-forest-3-classes-iris.json` si tu veux une foret plus elegante
  visuellement que les petits exemples binaires.
- Terminer par `06-forest-grande-iris.json` si tu veux montrer une foret plus
  impressionnante.

## Remarque

Un script `python/generate_soutenance_demo.py` a ete ajoute pour generer des
jeux supplementaires, mais il necessite `scikit-learn` dans l'environnement.
