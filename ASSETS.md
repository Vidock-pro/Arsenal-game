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
