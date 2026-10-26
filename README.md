# ARSENAL — Les industries de guerre

Version 0.2 jouable d'un idle game industriel, en français, dans une ambiance 1914–1945. HTML, CSS et JavaScript natifs, sans dépendance, compte ni clé API.

## Jouer immédiatement

1. Décompressez **tout** le ZIP.
2. Ouvrez **JOUER.html** dans Chrome, Firefox ou Edge.
3. Choisissez France, USA, Allemagne ou URSS, puis « Fonder mon industrie ».

Les images doivent rester dans `dist/assets/`. Ne lancez pas le fichier directement depuis l'aperçu du ZIP. Si le navigateur restreint la sauvegarde des fichiers locaux, utilisez le serveur local ci-dessous et exportez vos parties dans le menu ☰.

## Serveur local (conseillé pour développer)

Avec Python 3, depuis la racine du projet :

```sh
python -m http.server 8000 --directory dist
```

Ouvrez http://localhost:8000. Sur Windows, remplacez `python` par `py` si nécessaire. Aucun `npm install` n'est nécessaire.

## Boucle de jeu

- Une nouvelle partie commence avec uniquement le charbon accessible, des stocks vides et 0 or. Chaque clic donne 1 ressource.
- Ordre des exploitations : charbon → coton → bois → cuivre → poudre à canon → minerai de fer → caoutchouc → schiste bitumineux → pétrole brut → manganèse → nickel → bauxite.
- Chaque nouveau site nécessite le précédent. Le coton coûte 100 or, puis les ouvertures coûtent cinq fois plus à chaque palier. Les recherches ne bloquent plus l’ouverture des ressources.
- Le marché permet de vendre 1, 10 ou toutes les unités entières. Le prix unitaire vaut 1,5 puissance le rang de la ressource (charbon = rang 0). Le prix unitaire est arrondi à l’or supérieur avant multiplication par la quantité : vendre un lot rapporte autant que vendre unité par unité. Tous les prix d’achat et de vente sont des entiers, arrondis vers le haut. La trésorerie est affichée à l’entier supérieur ; les fractions provenant des revenus passifs restent conservées en interne, sans arrondi à chaque cycle.
- Le rendement d’un ouvrier au niveau 1 vaut 0,4 × (5 / (1,5 × 1,3)) puissance le rang, par seconde. Le temps théorique de financement du site suivant avec le revenu brut d’un ouvrier du dernier site augmente ainsi de 30 % par palier. Les arrondis des prix peuvent légèrement modifier ce repère. Il exclut les salaires, les bonus, les autres exploitations, les améliorations et le coût d’embauche : le temps réel dépend du développement du joueur.
- Les capacités de stockage augmentent dans la même proportion que les rendements, et sont doublées par Transport motorisé.
- L’embauche coûte 25 × 1,3 puissance le nombre d’ouvriers déjà engagés sur le site, arrondi à l’or supérieur, plus 2 or pour la première minute. Le salaire reste fixé à 2 or par minute et par ouvrier, payés d’avance. Sans or, le travail se met en pause ; il reprend lorsque les fonds sont disponibles. Les salaires s’appliquent également hors ligne et lorsque le stock est plein.
- Les boutons − et + permettent de libérer ou d’engager un ouvrier. Libérer un ouvrier réduit le prix de la prochaine embauche ; les salaires déjà payés ne sont pas remboursés.
- Les améliorations augmentent le rendement des ouvriers ; le clic reste à +1.
- Production comporte 19 étapes : uniforme → matériel de soutien → munition de pistolet → pistolet → grenade → munition de fusil → fusil → mitrailleuse → obus → canon d’artillerie → jeep → camion → half-track → char léger → char moyen → char lourd → avion de reconnaissance → avion de chasse → bombardier.
- Chaque étape demande un premier exemplaire de la précédente, ses exploitations de matières premières et, selon l’équipement, une recherche. Les conditions sont affichées sur chaque carte. Des filtres permettent de sélectionner équipement, armement, artillerie, véhicules, blindés ou aviation.
- Les ingrédients sont consommés au début du cycle, jamais en pause. Une ligne en attente de ressources reprend lorsqu’elles sont disponibles. Le stockage d’équipements est limité à 9 999 unités par ligne ; vendre libère la place.
- Chaque nation possède 19 appellations et illustrations propres. Les visuels sont des vues de côté sur fond vert quadrillé de table à dessin industrielle. Les variantes nationales ont les mêmes recettes de jeu ; les bonus de nation s’appliquent séparément.
- Les recettes utilisent directement les 12 matières premières en unités abstraites. Le prix de base d’un équipement dépasse la valeur marchande de ses ingrédients, avec une marge croissante selon le palier. La production de matières intermédiaires (tissu, acier, carburant raffiné) n’est pas encore un système séparé.

### Compatibilité des anciennes parties

Les sauvegardes v1/v2/v3 passent en version 4. Les exploitations existantes restent utilisables même si les nouveaux sites intermédiaires ne sont pas encore ouverts. Les nouvelles ressources commencent à zéro. Le platine est converti à son ancien prix (6 or par unité) et ses ouvriers rejoignent le charbon ; si la limite de 100 ouvriers est atteinte, les ouvriers excédentaires sont compensés à hauteur de l’embauche de base et de leur salaire prépayé restant. La migration ne remet pas la partie à zéro. Les anciennes lignes fusil et camion conservent leur état ; l’ancienne ligne char devient char moyen. Stocks, travail en cours et nombres fabriqués sont conservés. Ces trois lignes bénéficient d’une licence de continuité ; les autres suivent le nouveau parcours.

### Les quatre pays

| Nation | Bonus | Fusil | Blindé |
|---|---|---|---|
| France | Recherche +15 % | MAS 36 | B1 bis |
| USA | Production +15 % | Fusil américain | Char américain |
| Allemagne | Prix de vente des équipements +15 % | Karabiner 98k | Panzer IV |
| URSS | Récolte +15 % | Mosin-Nagant | T-34 |

La campagne est fictive : le millésime 1936 est une ambiance de départ et non une simulation chronologique exacte. Les équipements disposent de sprites pixel art ; chaque nation possède sa propre planche de 19 équipements. Ces illustrations restent des interprétations artistiques. Les bonus de recherche et de production multiplient la vitesse par 1,15. Le bonus allemand concerne uniquement les équipements, avec un prix final arrondi à l’or supérieur. Le clic manuel reste à +1 pour toutes les nations. Les valeurs, recettes et brevets sont des mécaniques ludiques, pas des instructions techniques historiques.

## Sauvegarde

Sauvegarde locale toutes les cinq secondes et lors des actions, avec une seule partie par origine de navigateur. Une nouvelle partie demande confirmation avant remplacement. Export/import JSON dans ☰, validation des fichiers, progression hors ligne plafonnée à 8 heures. Les changements d'URL, de port, de navigateur ou le passage de JOUER.html au serveur local changent l'espace de stockage : utilisez l'export/import. Pas de synchronisation cloud ni de multijoueur. Les sauvegardes de version 1 conservent leurs stocks, leur or et leurs exploitations ; elles sont migrées sans ouvriers. Fondez une nouvelle industrie pour tester le départ avec une seule ressource.

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

12 ressources, 19 lignes de production par nation, 6 recherches, 6 brevets, écran de stocks et sauvegardes. Les illustrations d'exploitation proviennent des maquettes ; les équipements sont illustrés en pixel art sur des planches de dessin industriel. Pas encore de sons, de campagne scénarisée, de simulation énergétique séparée ni de prestige. L'équilibrage vise un premier prototype jouable.


## Références visuelles de production

Les modèles sont des inspirations historiques adaptées à un monde alternatif, et non des reproductions muséographiques exactes. Les vêtements et kits sont présentés à plat ; véhicules et armes en profil. La catégorie « Jeep » comprend les véhicules légers nationaux équivalents. Les véhicules américains des Forces françaises libres sont explicitement identifiés ; le M26 américain correspond à la fin de guerre en 1945.

- Musée des Blindés / ministère des Armées : https://www.defense.gouv.fr/chemins-memoire/tourisme-memoire/lieux-memoire/musees-du-ministere-armees-anciens-combattants/musee-blindes
- B1 bis : https://museedesblindes.fr/les_chars/b1-bis/
- National Museum of the USAF, Piper L-4 : https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/197424/piper-l-4a-grasshopper/
- USAF, avions de 1939-1945 : https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/459025/army-air-forces-aircraft-a-definitive-moment/
- Tank Museum, M26 en 1945 : https://tankmuseum.org/article/bridge-at-remagen
