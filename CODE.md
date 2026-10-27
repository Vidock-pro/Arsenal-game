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

## Arbre technologique

`TECHS` définit les 29 recherches : `branch` pour le domaine, `col` et `row` pour les anciens repères, `requires` pour les liens, `cost` pour les ressources et `time` pour la durée. L’ordre des définitions suit les prérequis. `PRODUCT_RESEARCH` associe les 19 produits aux recherches. `LEGACY_TECHS` et `legacyUnlock` servent uniquement à valider puis convertir les sauvegardes antérieures à la version 7.

`productionRecipe` applique la réduction de matières de l’outillage sans modifier la recette de base ni le prix de vente. Le calcul du lot, le prélèvement et l’interface utilisent tous cette fonction. Les recettes effectives peuvent être fractionnaires ; les prix en or restent entiers.

`researchLayout` construit un seul arbre enraciné dans le Bureau d’études. Le premier prérequis définit le parent principal ; chaque sous-arbre réserve ses propres couloirs. Les autres prérequis deviennent des renvois cliquables, sans traits traversants. Toutes les conditions restent contrôlées par le moteur.


## Télégrammes

`notify` ajoute les dépêches à une file, affichée une notification à la fois. `checkPayrollNotice` détecte les interruptions de salaire, y compris lorsqu’une partie des ouvriers reste payée. Le son est synthétisé avec Web Audio après une interaction ; son absence ne bloque pas le jeu. Le bouton de son conserve sa préférence séparément de la sauvegarde. Le papier est dessiné en CSS, avec une animation désactivée si le système demande moins de mouvement.


## Lisibilité et affichage des stocks

Le bloc final de `pixel-skin.css` définit les tailles de lecture en `rem` avec une base `clamp` qui augmente sur les grandes fenêtres. Les textes explicatifs utilisent Courier New ; la police pixel reste sur les titres. Les fonds des panneaux sont des dégradés CSS sans étirement de l’atlas ; les illustrations et planches d’objets conservent leurs images.

`compact` utilise des suffixes explicites (k, M, Md, T) et des espaces ordinaires pour éviter les glyphes manquants. `updateResourceNumbers` actualise aussi les capacités visibles dans l’en-tête, les ressources, le marché et le stockage. La limite vient toujours de `capacity`, sans modification des règles de stockage.

La musique monte progressivement pendant quatre secondes à partir de l’événement `playing`. Une pause ou un changement de piste remet le fondu à zéro ; les clics ordinaires ne relancent pas un fondu déjà en cours.
