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
- Chaque nouveau site nécessite le précédent. Le coton coûte 100 or, puis les ouvertures coûtent 2,5 fois plus à chaque palier, arrondies à l’or supérieur. Les recherches ne bloquent plus l’ouverture des ressources.
- Le marché permet de choisir une quantité entière avec un curseur et un champ numérique synchronisés, limités au stock disponible, ou de tout vendre. Le stock apparaît à gauche du nom de la ressource. Le prix unitaire vaut 1,5 puissance le rang de la ressource (charbon = rang 0). Le prix unitaire est arrondi à l’or supérieur avant multiplication par la quantité : vendre un lot rapporte autant que vendre unité par unité. Tous les prix d’achat et de vente sont des entiers, arrondis vers le haut. La trésorerie est affichée à l’entier supérieur.
- Le rendement de base est identique : 0,4 ressource par seconde et par ouvrier, soit 24 par minute au niveau 1. Le niveau du site et les bonus multiplient ce rendement. Chaque ressource commence avec 500 places. Ses extensions d’entrepôt doublent sa capacité ; Transport industriel conserve son multiplicateur de capacité.
- L’embauche coûte `ceil(25 × 1,5^rang × 1,3^ouvriers)` plus le premier salaire. Le salaire par ouvrier vaut 50 % de la valeur de vente de sa récolte de base par minute, payé d’avance (12 or pour le charbon). Les améliorations et bonus de rendement ne le majorent pas. Quand le stock est plein, la récolte s’arrête et le salaire diminue de 50 % (6 or pour le charbon) ; le salaire déjà prépayé se consomme deux fois moins vite. Après une vente ou une extension, le travail et le salaire normal reprennent. Il dépend de la ressource, pas de la taille de l’équipe. Sans fonds suffisants pour le salaire du site, l’ouvrier attend ; il reprend dès que ce salaire peut être payé.
- À 5, 10 et 25 ouvriers rémunérés sur un site, le rendement de l’équipe gagne respectivement +25 %, +50 % et +100 % (paliers non cumulés). Les salaires restent inchangés ; les ouvriers impayés ne comptent pas pour le bonus.
- Les boutons − et + permettent de libérer ou d’engager un ouvrier. Libérer un ouvrier réduit le prix de la prochaine embauche ; les salaires déjà payés ne sont pas remboursés.
- Les améliorations augmentent le rendement des ouvriers et la quantité par clic (égale au niveau du site).
- Production comporte 19 étapes : uniforme → matériel de soutien → munition de pistolet → pistolet → grenade → munition de fusil → fusil → mitrailleuse → obus → canon d’artillerie → jeep → camion → half-track → char léger → char moyen → char lourd → avion de reconnaissance → avion de chasse → bombardier.
- Chaque étape demande la recherche associée terminée et un brevet acheté. Acheter le brevet nécessite un premier exemplaire de l’équipement précédent ; lancer la production nécessite aussi ses exploitations de matières premières. Chaque équipement dispose désormais de sa propre recherche de déblocage. Les conditions sont affichées sur chaque carte. Des filtres permettent de sélectionner équipement, armement, artillerie, véhicules, blindés ou aviation.
- Les ingrédients sont consommés au début du cycle, jamais en pause. Une ligne en attente de ressources reprend lorsqu’elles sont disponibles. Le stockage d’équipements est limité à 9 999 unités par ligne ; vendre libère la place.
- Chaque nation possède 19 appellations et illustrations propres. Les visuels sont des vues de côté sur fond vert quadrillé de table à dessin industrielle. Les variantes nationales ont les mêmes recettes de jeu ; les bonus de nation s’appliquent séparément.
- Les recettes utilisent directement les 12 matières premières en unités abstraites. Le prix de base d’un équipement dépasse la valeur marchande de ses ingrédients, avec une marge croissante selon le palier. La production de matières intermédiaires (tissu, acier, carburant raffiné) n’est pas encore un système séparé.

- Brevets est un catalogue de 19 licences avec les illustrations nationales. Chaque achat est unique, coûte cinq fois la valeur de vente de base (minimum 75 or, arrondi supérieur), et autorise une ligne. Les brevets ne génèrent plus de revenus passifs.

### Arbre des recherches

29 recherches dans un seul arbre, reliées au Bureau d’études, sans catégories ni filtres. Chaque recherche est reliée à son premier prérequis ; les prérequis supplémentaires restent visibles sous forme de renvois cliquables et dans sa fiche. Les sous-arbres occupent des couloirs distincts, sans croisement. La carte défile sur les petits écrans. Le survol d’une seconde ouvre la fiche ; le clic la garde ouverte, y compris sur écran tactile.

Les coûts en ressources des 29 recherches ont été doublés : la confection initiale demande 60 charbon et 80 coton, et les chaudières 120 charbon et 40 coton. Les durées et prérequis restent identiques. Les ressources sont consommées une seule fois au lancement. Une seule recherche est active à la fois. Les 19 équipements ont chacun une recherche dédiée, suivie de l’achat de leur brevet en or. La progression des brevets conserve l’exigence d’un premier exemplaire de l’équipement précédent. Le début est : Machines à coudre industrielles → brevet Uniforme → première production. La recherche Machines à coudre offre une usine disponible à attribuer et débloque la vente automatique. Les achats suivants conservent leur base de 1 000 or et leur progression par groupes de cinq usines possédées.

Les coûts, durées et prérequis complets sont centralisés dans `TECHS` (`dist/engine.js`). Les positions affichées sont calculées à partir du premier prérequis de chaque recherche ; `col` et `row` conservent les anciens repères du catalogue. Les branches suivent le schéma proposé : presses et poudres se rejoignent pour les cartouches ; motorisation et métallurgie se rejoignent pour les blindés ; confection et motorisation se rejoignent pour l’aviation.

Les recherches facultatives d’Industrie apportent : chaudières +20 % de récolte, électrification +15 % de vitesse de production, chaîne de montage +25 % de vitesse, outillage −10 % de matières consommées, contrôle qualité +25 % au prix de vente. Les bonus de vitesse se multiplient. Les recettes réduites peuvent contenir des fractions, conservées dans les stocks ; les transactions en or restent arrondies à l’entier supérieur. Transport industriel conserve l’ancien bonus logistique (+25 % de récolte et capacité doublée).

### Compatibilité des anciennes parties

Les sauvegardes v1 à v6 passent en version 7. Les exploitations existantes restent utilisables même si les nouveaux sites intermédiaires ne sont pas encore ouverts. Les nouvelles ressources commencent à zéro. Le platine est converti à son ancien prix (6 or par unité) et ses ouvriers rejoignent le charbon ; si la limite de 100 ouvriers est atteinte, les ouvriers excédentaires sont compensés à hauteur de l’embauche de base et de leur salaire prépayé restant. La migration ne remet pas la partie à zéro. Les anciennes lignes fusil et camion conservent leur état ; l’ancienne ligne char devient char moyen. Stocks, travail en cours et nombres fabriqués sont conservés. Les lignes déjà acquises, actives ou ayant produit conservent leur licence et obtiennent les recherches nécessaires. Les anciens certificats à redevances sont remboursés une seule fois à leur prix d’achat. Si une recherche ainsi accordée était en cours, elle est remboursée et arrêtée. Les autres lignes suivent le nouveau parcours.

La migration vers le nouvel arbre accorde les prérequis des recherches conservées et les recherches correspondant aux brevets auparavant accessibles. Les usines, lots payés et stocks sont conservés. Une recherche en cours garde son temps restant ; si elle est déjà accordée par la conversion, son coût historique en matières est restitué une seule fois.

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

12 ressources, 19 lignes de production par nation, 29 recherches, 19 brevets, écran de stocks et sauvegardes. Les illustrations d'exploitation proviennent des maquettes ; les équipements sont illustrés en pixel art sur des planches de dessin industriel. Pas encore de sons, de campagne scénarisée, de simulation énergétique séparée ni de prestige. L'équilibrage vise un premier prototype jouable.


## Références visuelles de production

Les modèles sont des inspirations historiques adaptées à un monde alternatif, et non des reproductions muséographiques exactes. Les vêtements et kits sont présentés à plat ; véhicules et armes en profil. La catégorie « Jeep » comprend les véhicules légers nationaux équivalents. Les véhicules américains des Forces françaises libres sont explicitement identifiés ; le M26 américain correspond à la fin de guerre en 1945.

- Musée des Blindés / ministère des Armées : https://www.defense.gouv.fr/chemins-memoire/tourisme-memoire/lieux-memoire/musees-du-ministere-armees-anciens-combattants/musee-blindes
- B1 bis : https://museedesblindes.fr/les_chars/b1-bis/
- National Museum of the USAF, Piper L-4 : https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/197424/piper-l-4a-grasshopper/
- USAF, avions de 1939-1945 : https://www.afhistory.af.mil/FAQs/Fact-Sheets/Article/459025/army-air-forces-aircraft-a-definitive-moment/
- Tank Museum, M26 en 1945 : https://tankmuseum.org/article/bridge-at-remagen

### Usines de production

Une nouvelle partie commence sans usine. Dans Production, achetez des usines puis affectez-les avec les boutons + et −. Une usine produit un objet par cycle ; le lot est limité par les matières disponibles et la place en stock. Chaque objet consomme sa recette entière, au lancement du cycle. Le prix d’une usine est `ceil(1000 × 1,3^floor(nombre acheté / 5))` : achats 1–5 à 1 000 or, 6–10 à 1 300, 11–15 à 1 690. Le parc est limité à 250 usines.

Les modifications d’affectation concernent le prochain cycle. Les usines participant à un lot déjà payé restent réservées jusqu’à son achèvement, même en pause. Les sauvegardes antérieures passent en version 6 et reçoivent une usine par ligne acquise ; les lots en cours restent d’une unité. L’icône d’usine est une illustration pixel art sur fond transparent, dans la palette olive et laiton.

## Lire et modifier les sources

Le guide [CODE.md](CODE.md) décrit les fichiers, les principales fonctions et le parcours d’une action. Les commentaires du moteur et de l’interface expliquent les décisions utiles en français. Les explications détaillées d’équilibrage restent dans ce README ; l’interface conserve les prix, coûts, prérequis et états nécessaires pour jouer.

Pour conserver la même mise en forme après une modification : `npm ci`, puis `npm run format`. `npm run format:check` vérifie le format sans modifier les fichiers. Prettier est seulement un outil de développement ; le jeu ne charge aucune dépendance JavaScript externe. `npm test` fonctionne sans installer Prettier.

Après modification des sources, lancer `python package-release.py` pour régénérer `JOUER.html` et l’archive source. L’assemblage utilise explicitement UTF-8 sur tous les systèmes et accepte les imports sur plusieurs lignes.


## Ambiance sonore

Le menu de sélection des nations joue « Dogs of War » (`dogs-of-war-menu-loop.wav`). La partie joue « Medal of Honor Rising Sun Main Theme » (`rising-sun-game-loop.wav`). Les deux boucles proviennent des MP3 fournis par l’utilisateur, avec raccord fondu et niveau de fond modéré.

Un seul lecteur change de piste entre le menu et la partie. Choisir une autre nation dans le menu ou naviguer entre les onglets en partie ne redémarre pas la musique. La lecture commence après une interaction, se met en pause lorsque l’onglet est masqué et reprend à son retour. Le bouton Musique et le volume conservent leurs réglages. Le son des télégrammes reste indépendant.

L’ancienne composition originale « Quart de nuit » et son script `compose-music.py` sont conservés dans les sources mais ne sont plus utilisés par le lecteur.

Les deux pistes musicales sont atténuées par un gain de 0,12 (environ −18 dB), appliqué après le réglage du joueur, y compris aux préférences existantes. Les télégrammes ne sont pas concernés.


## Extensions d’entrepôt

Dans Stockage, chaque exploitation ouverte peut acheter sa propre extension : 500 → 1 000 → 2 000 places, jusqu’à 30 extensions. Le prix vaut `ceil(100 × 1,5^rang × 1,6^extensions)` or. L’en-tête affiche seulement les ressources dont l’exploitation est possédée. Les sauvegardes passent en version 8 ; les anciennes capacités sont converties en extensions gratuites suffisantes, sans retirer de stock. Les stocks d’équipements ne sont pas concernés.


### Vente automatique et équilibrage (version 9)

Dans le marché, chaque exploitation possédée peut vendre automatiquement son surplus après la recherche Machines à coudre. L’option est désactivée par défaut, avec une réserve initiale de 100 unités par ressource. Le joueur saisit sa réserve puis clique sur Enregistrer. Seules les unités entières au-dessus de cette réserve sont vendues, au prix habituel, en ligne comme hors ligne. La réserve limite les ventes automatiques, pas la consommation par la production ou les recherches. Une réserve égale à la capacité empêche la vente automatique : il faut garder une marge pour exporter. Les ventes manuelles restent disponibles.

Les anciennes sauvegardes migrent en version 9 sans perdre leurs stocks ni leurs affectations. Si Machines à coudre est déjà acquise, elles reçoivent elles aussi une usine offerte, une seule fois ; au plafond de 250 usines, la récompense est remplacée par 1 000 or. Les réglages automatiques commencent désactivés. Les achats passés ne sont pas recalculés.

Repère de début de partie : dans une simulation à un clic charbon par seconde jusqu’au premier uniforme, avec un ouvrier charbon puis coton, ventes pour financer les salaires, recherche et brevet dès que possible, l’usine arrive vers 6 min 48 et le premier uniforme vers 6 min 55. Après cela, sans nouveaux clics de récolte et avec vente des uniformes une fois par minute, ce parcours produit 141 uniformes et possède 1 443 or à 30 minutes. Il s’agit d’un scénario de vérification, pas d’une durée promise aux joueurs ; les choix d’investissement et la fréquence des actions changent le résultat.


### Japon

Cinquième nation sélectionnable, identifiant de sauvegarde `jp`, drapeau Hinomaru. Bonus : matières consommées par la production −10 %, sans effet sur les recherches, salaires, coûts d’achat ni prix de vente. La réduction se multiplie avec Outillage (0,9 × 0,9 = 0,81, soit −19 % au total), avec des recettes calculées à deux décimales comme les recettes réduites existantes. Les anciens pays conservent leurs bonus.

Le catalogue de 19 équipements comprend notamment Nambu Type 14, Arisaka Type 99, Type 1 Ho-Ha, Type 95 Ha-Go, Type 97 Chi-Ha, Mitsubishi Ki-46, A6M2 Zero et G4M. Le char lourd O-I est explicitement nommé « prototype uchronique » : sa production en série appartient au monde alternatif du jeu. Les illustrations sont des interprétations artistiques, pas des plans techniques.

Repères consultés pour les modèles : [Nambu Type 14 — Australian War Memorial](https://www.awm.gov.au/collection/C285580), [mitrailleuse Type 99 — Australian War Memorial](https://www.awm.gov.au/collection/C238970), [A6M2 Zero — National Museum of the USAF](https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196313/mitsubishi-a6m2-zero/).
