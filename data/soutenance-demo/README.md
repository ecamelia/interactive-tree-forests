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

## Conseils de demo

- Commencer par `01-tree-tres-petit.json` pour expliquer la logique de base.
- Passer a `03-tree-grand-iris.json` pour montrer un arbre plus complexe.
- Utiliser `05-forest-vote-moyenne.json` pour illustrer le vote majoritaire.
- Terminer par `06-forest-grande-iris.json` si tu veux montrer une foret plus
  impressionnante.

## Remarque

Un script `python/generate_soutenance_demo.py` a ete ajoute pour generer des
jeux supplementaires, mais il necessite `scikit-learn` dans l'environnement.
