# ARSENAL — Les industries de guerre

Version 0.2 jouable d'un idle game industriel, en français, dans une ambiance 1914–1945. HTML, CSS et JavaScript natifs, sans dépendance, compte ni clé API.

## Jouer immédiatement

1. Décompressez **tout** le ZIP.
2. Ouvrez **JOUER.html** dans Chrome, Firefox ou Edge.
3. Choisissez France, Allemagne ou URSS, puis « Fonder mon industrie ».

Les images doivent rester dans `dist/assets/`. Ne lancez pas le fichier directement depuis l'aperçu du ZIP. Si le navigateur restreint la sauvegarde des fichiers locaux, utilisez le serveur local ci-dessous et exportez vos parties dans le menu ☰.

## Serveur local (conseillé pour développer)

Avec Python 3, depuis la racine du projet :

```sh
python -m http.server 8000 --directory dist
```

Ouvrez http://localhost:8000. Sur Windows, remplacez `python` par `py` si nécessaire. Aucun `npm install` n'est nécessaire.

## Boucle de jeu

- Récoltez manuellement (+5) ou automatiquement charbon, bois et fer ; améliorez leurs exploitations.
- Dans Production, lancez la ligne de fusils. Les ingrédients sont consommés au début de chaque cycle. Vendez les lots pour gagner des crédits.
- Recherchez les machines à vapeur, puis le montage, les alliages et la chimie. Le caoutchouc est nécessaire aux camions et aux chars ; le platine aux chars.
- Après recherche, ouvrez les exploitations déverrouillées en cliquant « Exploiter ».
- Déposez vos brevets : les licences rapportent des crédits automatiquement.
- Suspendez les lignes pour économiser les ressources. Une ligne à court de matières reprend automatiquement quand le stock suffit.

### Les trois pays

| Nation | Bonus | Fusil | Blindé |
|---|---|---|---|
| France | Recherche 20 % plus rapide | MAS 36 | B1 bis |
| Allemagne | Fabrication 15 % plus rapide | Karabiner 98k | Panzer IV |
| URSS | Récolte +20 % | Mosin-Nagant | T-34 |

La campagne est fictive : le millésime 1936 est une ambiance de départ et non une simulation chronologique exacte. Les neuf équipements disposent de sprites pixel art spécifiques à leur nation ; ces illustrations restent des interprétations artistiques. Les valeurs, recettes et brevets sont des mécaniques ludiques, pas des instructions techniques historiques.

## Sauvegarde

Sauvegarde locale toutes les cinq secondes et lors des actions, avec une seule partie par origine de navigateur. Une nouvelle partie demande confirmation avant remplacement. Export/import JSON dans ☰, validation des fichiers, progression hors ligne plafonnée à 8 heures. Les changements d'URL, de port, de navigateur ou le passage de JOUER.html au serveur local changent l'espace de stockage : utilisez l'export/import. Pas de synchronisation cloud ni de multijoueur.

## Mettre sur GitHub Pages

1. Créez un dépôt GitHub et ajoutez **tous les fichiers et dossiers de ce projet**, y compris `.github/`.
2. Dans Settings → Pages, choisissez **GitHub Actions**.
3. Le workflow inclus publie `dist/` lors d'un push sur `main`, ou via le lancement manuel dans Actions.

Le jeu utilise des chemins relatifs : il fonctionne aussi sous `https://votre-compte.github.io/nom-du-depot/`. Vous pouvez également copier le contenu de `dist/` sur n'importe quel hébergeur statique. Pas de backend requis.

## Structure

- `dist/index.html` : entrée web.
- `dist/style.css` : structure de l’interface.
- `dist/pixel-skin.css` : identité pixel art, matériaux, cadres et adaptation aux petits écrans.
- `dist/assets/arsenal-pixel.ttf` : police originale intégrée ; source dans `tools/build-pixel-font.py` (fonttools requis uniquement pour la régénérer).
- `dist/engine.js` : données, économie et simulation déterministe.
- `dist/app.js` : interface, sauvegardes et événements.
- `dist/assets/` : illustrations locales, aucune dépendance distante.
- `tests/engine.test.js` : tests du moteur avec le lanceur natif Node.js.
- `package-release.py` : reconstruit JOUER.html et le ZIP source.
- `JOUER.html` : version assemblée pour ouverture directe ; modifier les fichiers source puis régénérer.

## Tester et préparer une version

Avec Node.js 18 ou plus récent :

```sh
npm test
```

Avec Python 3 :

```sh
python package-release.py
```

Le ZIP est produit dans `dist/arsenal-source.zip` et le fichier JOUER.html est mis à jour. Le workflow GitHub Pages régénère aussi ces fichiers avant déploiement.

## Licence et images

Code sous licence MIT : réutilisation, modification, redistribution et usage commercial autorisés. Les illustrations ont été générées par IA pour ce projet ; elles sont fournies avec les mêmes permissions de réutilisation dans la mesure des droits disponibles, sans garantie d'exclusivité. Les noms historiques sont employés à titre descriptif. Voir LICENSE et ASSETS.md.

## Périmètre de cette première version

5 ressources, 3 lignes de production par nation, 6 recherches, 6 brevets, écran de stocks et sauvegardes. Les illustrations d'exploitation proviennent des maquettes ; les équipements de production sont des SVG schématiques. Pas encore de sons, de campagne scénarisée, de gestion d'énergie/ouvriers ni de prestige. L'équilibrage vise un premier prototype jouable.
