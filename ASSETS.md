# Provenance des visuels

- `industry.png` : illustration d'accueil générée pour Arsenal.
- `harvest-atlas.png`, `research-atlas.png` : maquettes générées dans cette conversation. L'interface découpe visuellement les scènes par conteneurs CSS, sans afficher les textes des maquettes comme commandes interactives.
- `patents-atlas.png` : dessins des dossiers de brevet, issus de la maquette.
- `equipment-atlas.png` : neuf sprites générés, trois équipements par pays.
- `materials-atlas.png` : textures pixel art générées (métal kaki, laiton, papier et plan quadrillé).
- `arsenal-pixel.ttf` : police bitmap originale, sous licence MIT ; source dans `tools/build-pixel-font.py`.
- Police pixel locale et police monospace du système, pas de CDN ni de traceur. Aucune ressource distante au lancement.

Images générées par IA, fournies pour réutilisation avec le projet dans la mesure des droits disponibles ; aucune exclusivité garantie. Code MIT.

- `dist/assets/archive-library.png` : bibliothèque administrative en pixel art, générée par IA pour le panneau Archive.

- `dist/assets/resources-atlas.png` : planche de 12 exploitations en pixel art, générée par IA, 4 colonnes × 3 lignes dans l’ordre de progression.

- `dist/assets/resource-icons-atlas.png` : huit icônes de ressources en pixel art, fond transparent, générées avec l’outil intégré ImageGen. Ordre : coton, cuivre, poudre à canon, schiste, pétrole, manganèse, nickel, bauxite.

- `dist/assets/classic-resource-icons.png` : charbon, bois, minerai de fer et caoutchouc isolés sur fond transparent avec ImageGen intégré, depuis la planche originale. Grille 2 × 2.

- `dist/assets/menu-icons-atlas.png` : six icônes de menu pixel art sur fond transparent, créées avec ImageGen intégré. Grille 3 × 2 : ressources, marché, production, recherche, brevets, stockage.

- `dist/assets/workforce-icons.png` : ouvrier casqué et pièces de salaire, pixel art transparent généré avec ImageGen intégré, deux cases carrées côte à côte.

- `dist/assets/production-fr.png`, `production-us.png`, `production-de.png`, `production-su.png` : 19 équipements par nation, profils pixel art sur fond de table à dessin vert quadrillé, créés avec ImageGen intégré. Grilles de 5 colonnes × 4 lignes, dernière case vide. Les premières versions en perspective ont été écartées. Prompts : `tools/production-art-prompts.txt`.

- `dist/assets/factory-icon.png` : usine industrielle illustrée en pixel art, tons olive et laiton, fond transparent ; générée avec imagegen pour Arsenal.

### Icônes compactes (version simplifiée)

- `dist/assets/resource-icons-simple.png` : 12 silhouettes en grille 4 × 3, dans l’ordre de `RESOURCES`.
- `dist/assets/ui-icons-simple.png` : grille 3 × 3 : récolte, marché, usine ; recherche, brevets, stockage ; ouvrier, lingots, engrenage.
- Illustrations générées avec imagegen, fond transparent, aplats larges sans textures fines. Affichage à 24, 28 ou 32 pixels selon l’emplacement. La production et le parc d’usines partagent le même dessin d’usine.
- Les anciennes planches sont conservées dans les sources mais ne sont plus utilisées par les petites icônes de l’interface.


## Équipements japonais

`dist/assets/production-jp.png` : planche créée avec ImageGen intégré, à partir de `production-fr.png` comme référence de style et de disposition. Les noms et le gameplay restent dans le code, pas dans l’image.

Consignes du prompt : atlas paysage 15:8, cinq colonnes et quatre lignes égales, dernière case vide, fond vert olive de table à dessin industrielle avec quadrillage discret et séparations fines. Pixel art 16 bits, teintes kaki, ocre et acier. Objets centrés sans débordement ni textes. Armes, véhicules et avions en profil vers la droite. Chaque case suit l’ordre exact : tenue Type 98 ; brancard et sac médical ; cartouches 8 mm ; Nambu Type 14 ; grenade Type 97 ; cartouches 7,7 mm ; Arisaka Type 99 ; mitrailleuse Type 99 ; obus de 75 mm ; canon Type 90 ; Kurogane ; camion Isuzu Type 94 ; Ho-Ha ; Ha-Go ; Chi-Ha ; O-I interprété comme prototype uchronique ; Ki-46 ; A6M2 Zero ; G4M ; case vide. Pas de cocardes françaises, marquages japonais discrets sur les avions. La planche française sert de référence graphique seulement.


La police Arsenal Pixel 1.1 ajoute la virgule et la ponctuation des valeurs numériques. Les espaces insécables et le signe moins Unicode sont pris en charge. Les caractères non dessinés ne sont plus déclarés dans la police : le navigateur peut utiliser sa police de repli. Après reconstruction avec `tools/build-pixel-font.py`, exécuter `python tools/test-pixel-font.py` (FontTools nécessaire). L’icône Front est un dessin SVG natif : deux baïonnettes croisées, lames en acier avec nervure, gardes métalliques et poignées de bois rivetées.


- `dist/assets/the-way-defeat.mp3` : copie du fichier « Zack Hemsey - The Way (Instrumental).mp3 » fourni par l’utilisateur, utilisée pour l’écran de défaite. Musique de Zack Hemsey, distincte des illustrations générées et de la licence MIT du code ; aucun transfert de droits n’est impliqué. Le panneau délabré est réalisé en CSS (rouille, rayures, bords abîmés).


## Garnison française (prototype)
- `dist/assets/front-base-fr.png` : décor original généré avec l’outil intégré image_gen ; base française de 1939, casernes, hangar et cour vide, pixel art olive/kaki.
- Brief de génération : paysage 3:2, vue oblique surélevée, bâtiments en arrière-plan, deux tiers inférieurs libres, sans personnages ni véhicules ni texte, palette olive/kaki/brun/laiton et pixels nets.
- `dist/assets/front-units-fr-v3.png` : atlas transparent de quatre sprites généré avec l’outil intégré image_gen, à partir d’une première planche inspirée de `production-fr.png`. Soldat, jeep, char et avion sont affichés en couches indépendantes.
- Brief final : quatre cellules carrées, soldats français en casque Adrian, jeep, char et avion à hélice français en vue de face/trois quarts ; pixel art de jeu de stratégie des années 1990, gros pixels visibles, palette limitée, ombrages par amas de pixels et contours en escalier ; fond réellement transparent, sans texte ni panneaux. Les dessins sont stylisés, sans modèle historique exact revendiqué.
- La scène est ramenée au ratio 640/250 et les unités se chevauchent par plans : aviation, blindés, véhicules, infanterie. Les rangs de soldats sont décalés pour laisser leurs silhouettes lisibles.


### Correction de l’avion de garnison

`dist/assets/front-plane-fr-v4.png` : sprite indépendant corrigé avec l’outil intégré image_gen, à partir de `front-units-fr-v3.png`. Brief : conserver le chasseur français en pixel art et sa vue de trois quarts, retirer la fausse dérive tricolore près du nez, ne garder que la dérive arrière et dessiner trois pales noires à extrémité jaune reliées au cône central. Fond transparent, avion entier, aucun autre objet. Les trois autres modèles restent dans leur atlas existant.


`dist/assets/front-plane-fr-v5.png` : correction avec image_gen intégré du modèle v4. Brief : ne modifier que l’hélice, trois pales liées au même moyeu, disposition en Y inversé (haut, bas-droite, bas-gauche), écartement régulier dans le plan de rotation avec perspective, extrémités jaunes ; préserver avion, palette, pixels et transparence.

## Garnisons des autres nations

Création avec l’outil intégré image_gen. Les quatre atlas transparents `dist/assets/front-units-us.png`, `front-units-su.png`, `front-units-de.png`, `front-units-jp.png` reprennent la palette et le pixel art des équipements de Production, avec des silhouettes nationales distinctes. Les équipements sont des représentations stylisées, pas des reproductions techniques exactes.

Prompt commun : atlas carré transparent en quatre cellules (soldat en haut à gauche, véhicule léger à droite, char en bas à gauche, avion à droite), vue de face/trois quarts, pixel art détaillé par amas de pixels, palette olive/brun/acier, contours nets, objets isolés sans sol ni texte, hélice cohérente et une seule queue à l’arrière de l’avion.
- USA : GI avec casque M1, Willys MB, Sherman, chasseur inspiré du P-51, étoiles américaines.
- URSS : fantassin en casque et uniforme kaki, GAZ-67, T-34, chasseur inspiré du Yak-9, étoiles rouges.
- Allemagne : fantassin avec Stahlhelm, véhicule inspiré du Kübelwagen, Panzer IV et chasseur inspiré du Bf 109, croix blanches/noires.
- Japon : fantassin avec casque Type 90, Kurogane Type 95, Type 97 Chi-Ha et chasseur inspiré du Zero, cocardes rouges.

`dist/assets/front-base-neutral.png` : édition du décor français avec image_gen. Prompt : retirer uniquement le drapeau français et son mât, reconstruire le fond, préserver les bâtiments, la cour vide, le cadrage et la palette pixel art. Utilisé pour les quatre autres nations ; leur nom apparaît dans l’en-tête de la garnison.
