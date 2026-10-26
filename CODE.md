# Guide des sources d’Arsenal

## Où intervenir ?

| Fichier | Rôle |
| --- | --- |
| `dist/engine.js` | Données, prix, prérequis, actions, passage du temps et sauvegardes. |
| `dist/app.js` | Écrans, textes, boutons et mise à jour des compteurs. |
| `dist/style.css` | Mise en page et composants de base. |
| `dist/pixel-skin.css` | Habillage pixel art, puis ajustements des composants. |
| `dist/index.html` | Page qui charge les sources séparément. |
| `dist/assets/` | Illustrations, icônes et police. |
| `tests/engine.test.js` | Vérifications des règles et de la compatibilité des sauvegardes. |
| `tests/production-ui.test.js` | Vérifications des écrans et des interactions dans un DOM simplifié. |
| `package-release.py` | Fabrication de la page autonome et de l’archive. |
| `tools/build-pixel-font.py` | Reconstruction facultative de la police, avec fonttools. |
| `tools/*-prompt*.txt` | Consignes ayant servi à générer les illustrations. |

`JOUER.html` est généré : modifier les fichiers dans `dist/`, puis reconstruire la page. Les tests d’interface ne remplacent pas une vérification visuelle dans un navigateur.

## Comment une action se déroule

1. Le bouton indique son action et sa cible avec `data-action` et `data-id`.
2. L’interface transmet ces valeurs à `act(state, type, id)`.
3. Le moteur vérifie les conditions avant de modifier les stocks, l’or ou les lignes.
4. Si l’action réussit, l’interface enregistre la partie et actualise l’affichage.

Le moteur n’utilise pas le DOM : on peut le tester sans navigateur. L’interface ne décide pas seule qu’un achat est possible ; même un bouton mal activé est contrôlé par le moteur.

## Lire l’état d’une partie

- `resources` contient les stocks ; `levels`, les niveaux des exploitations.
- `workers` conserve le temps de salaire restant pour chaque ouvrier.
- `tech` contient les recherches terminées ; `research`, le projet en cours.
- `patents` contient les licences achetées.
- `factories` est le nombre total d’usines possédées.
- Chaque entrée de `lines` contient son stock, son activité, le temps restant, les usines affectées et la taille du lot déjà commencé (`batch`).

Une usine participant à un lot reste réservée jusqu’à la fin de ce lot. C’est pourquoi `freeFactories` tient compte à la fois de l’affectation souhaitée et du lot en cours. Les matières sont payées au début du lot ; mettre en pause ne les prélève pas une seconde fois.

## Passage du temps et sauvegardes

`advance` simule les salaires, la récolte, les recherches et la production. Le même code fonctionne pendant la partie et au retour après une absence. Les petits pas de simulation permettent de respecter les fins de salaires et les fins de lots.

`validateSave` vérifie les valeurs, puis migre les anciennes versions. Ne pas renommer les identifiants enregistrés ni supprimer une migration sans prévoir la conversion des anciennes parties.

## Affichage et styles

`shell` reconstruit la structure générale ; `renderContent` choisit l’onglet. `updateNumbers` actualise les valeurs courantes et délègue aux fonctions de récolte et de production. Les blocs `/* HTML */` sont des chaînes HTML : leur annotation permet de les mettre en forme automatiquement.

Les deux feuilles de style sont chargées dans l’ordre `style.css`, puis `pixel-skin.css`. Les ajustements placés plus bas peuvent remplacer des règles précédentes. Cet ordre a été conservé pendant la remise en forme pour préserver l’apparence du jeu.

Les détails d’équilibrage appartiennent au README et aux commentaires. L’écran du joueur affiche surtout les actions disponibles, leurs coûts et les conditions manquantes.

## Vérifier une modification

```sh
npm test
npm run format:check
python package-release.py
```

Installer les outils de formatage avec `npm ci` si nécessaire. Pour appliquer le format, utiliser `npm run format`. La création du ZIP exclut `node_modules`, les caches Python et les archives précédentes.
