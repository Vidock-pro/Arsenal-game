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
