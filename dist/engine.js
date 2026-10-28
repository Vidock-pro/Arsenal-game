/** Règles du jeu : ce fichier ne dépend ni de la page HTML ni du navigateur.
 * Les fonctions reçoivent la partie (state), puis une ressource ou un produit.
 * Les identifiants enregistrés sont conservés pour lire les anciennes sauvegardes.
 */
export const COUNTRIES = {
  fr: {
    name: 'France',
    motto: 'L’ingéniosité au service de l’industrie',
    bonus: 'Recherche +15 %',
    icon: 'FR',
  },
  us: {
    name: 'USA',
    motto: 'La puissance des grandes manufactures',
    bonus: 'Production +15 %',
    icon: 'US',
  },
  de: {
    name: 'Allemagne',
    motto: 'La précision des ateliers',
    bonus: 'Prix de vente des équipements +15 %',
    icon: 'DE',
  },
  su: { name: 'URSS', motto: 'La force des grands complexes', bonus: 'Récolte +15 %', icon: 'SU' },
  jp: {
    name: 'Japon',
    motto: 'Chaque matière au service de la production',
    bonus: 'Matières consommées en production −10 %',
    icon: 'JP',
  },
};
export const RESOURCE_CAPACITY_GROWTH = 5 / (1.5 * 1.3);
export const RESOURCES = [
  ['coal', 'Charbon', 'Mine de charbon', 'Énergie consommée par les ateliers de production.'],
  [
    'cotton',
    'Coton',
    'Plantation de coton',
    'Fibres pour les uniformes et le matériel de soutien.',
  ],
  ['wood', 'Bois', 'Scierie', 'Caisses, matériel de soutien et crosses.'],
  ['copper', 'Cuivre', 'Mine de cuivre', 'Composants métalliques des équipements et véhicules.'],
  [
    'gunpowder',
    'Poudre à canon',
    'Dépôt de poudre',
    'Approvisionnement des ateliers de munitions.',
  ],
  [
    'iron',
    'Minerai de fer',
    'Carrière de fer',
    'Pièces mécaniques pour armes, véhicules et avions.',
  ],
  ['rubber', 'Caoutchouc', 'Concession d’hévéas', 'Pneus et joints des véhicules.'],
  [
    'shale',
    'Schiste bitumineux',
    'Carrière de schiste',
    'Approvisionnement énergétique des véhicules légers.',
  ],
  ['oil', 'Pétrole brut', 'Champ pétrolier', 'Carburants et lubrifiants pour les moteurs.'],
  ['manganese', 'Manganèse', 'Mine de manganèse', 'Alliages des half-tracks et des blindages.'],
  ['nickel', 'Nickel', 'Mine de nickel', 'Alliages avancés pour blindages et moteurs.'],
  ['bauxite', 'Bauxite', 'Carrière de bauxite', 'Métal léger destiné aux ateliers d’aviation.'],
].map(([id, name, site, desc], i) => ({
  id,
  name,
  site,
  desc,
  tier: i,
  previous: i
    ? [
        'coal',
        'cotton',
        'wood',
        'copper',
        'gunpowder',
        'iron',
        'rubber',
        'shale',
        'oil',
        'manganese',
        'nickel',
      ][i - 1]
    : null,
  rate: 0.4,
  cost: i ? Math.ceil(100 * 2.5 ** (i - 1)) : 90,
  icon: '◆',
}));
// Recherches : coûts en ressources, durée, prérequis et coordonnées des illustrations.
const LEGACY_TECHS = [
  {
    id: 'steam',
    name: 'Machines à vapeur',
    desc: 'Récolte de toutes les ressources + 20 %.',
    cost: { coal: 60, cotton: 20 },
    time: 30,
    requires: [],
    x: 404,
    y: 274,
    w: 275,
    h: 111,
  },
  {
    id: 'assembly',
    name: 'Chaîne de montage',
    desc: 'Production 25 % plus rapide. Autorise les véhicules légers et camions.',
    cost: { coal: 100, wood: 60, iron: 40, copper: 20 },
    time: 50,
    requires: ['steam'],
    x: 398,
    y: 485,
    w: 285,
    h: 111,
  },
  {
    id: 'alloys',
    name: 'Alliages avancés',
    desc: 'Autorise les blindés, après leurs étapes précédentes.',
    cost: { coal: 150, iron: 100, manganese: 40, nickel: 20 },
    time: 75,
    requires: ['steam'],
    x: 753,
    y: 485,
    w: 277,
    h: 109,
  },
  {
    id: 'chemistry',
    name: 'Chimie industrielle',
    desc: 'Autorise les grenades, munitions de fusil et obus.',
    cost: { coal: 80, gunpowder: 50, copper: 30 },
    time: 45,
    requires: ['steam'],
    x: 752,
    y: 273,
    w: 278,
    h: 113,
  },
  {
    id: 'series',
    name: 'Production en série',
    desc: 'Prix de vente de tous les équipements + 25 %.',
    cost: { coal: 180, wood: 80, iron: 120, copper: 60 },
    time: 100,
    requires: ['assembly', 'alloys'],
    x: 402,
    y: 700,
    w: 274,
    h: 109,
  },
  {
    id: 'logistics',
    name: 'Transport motorisé',
    desc: 'Récolte + 25 %. Capacité des stocks doublée.',
    cost: { coal: 140, iron: 80, rubber: 40, oil: 30 },
    time: 90,
    requires: ['assembly', 'chemistry'],
    x: 752,
    y: 699,
    w: 277,
    h: 111,
  },
];

// Arbre actuel : position, branche et prérequis sont partagés avec l’interface.
export const TECHS = [
  {
    id: 'sewing',
    name: 'Machines à coudre industrielles',
    branch: 'Textile',
    requires: [],
    cost: {
      coal: 60,
      cotton: 80,
    },
    time: 30,
    col: 1,
    row: 1,
    desc: 'Confection des uniformes. Offre une première usine et débloque la vente automatique du surplus.',
  },
  {
    id: 'press',
    name: 'Presses d’emboutissage',
    branch: 'Armement',
    requires: [],
    cost: {
      coal: 100,
      wood: 60,
      copper: 60,
    },
    time: 35,
    col: 2,
    row: 1,
    desc: 'Formage des pièces métalliques.',
  },
  {
    id: 'chemistry',
    name: 'Chimie des poudres',
    branch: 'Munitions',
    requires: [],
    cost: {
      coal: 120,
      gunpowder: 80,
    },
    time: 40,
    col: 3,
    row: 1,
    desc: 'Prépare les branches de munitions et d’artillerie.',
  },
  {
    id: 'steam',
    name: 'Chaudières industrielles',
    branch: 'Industrie',
    requires: [],
    cost: {
      coal: 120,
      cotton: 40,
    },
    time: 30,
    col: 7,
    row: 1,
    desc: 'Récolte automatique +20 %.',
  },
  {
    id: 'confection',
    name: 'Confection renforcée',
    branch: 'Textile',
    requires: ['sewing'],
    cost: {
      cotton: 160,
      wood: 70,
    },
    time: 40,
    col: 1,
    row: 2,
    desc: 'Équipement de soutien.',
  },
  {
    id: 'cartridges',
    name: 'Fabrication de cartouches',
    branch: 'Munitions',
    requires: ['press', 'chemistry'],
    cost: {
      coal: 140,
      copper: 120,
      gunpowder: 100,
    },
    time: 45,
    col: 3,
    row: 2,
    desc: 'Munitions de pistolet.',
  },
  {
    id: 'electricity',
    name: 'Électrification des ateliers',
    branch: 'Industrie',
    requires: ['steam'],
    cost: {
      coal: 200,
      copper: 160,
      iron: 100,
    },
    time: 55,
    col: 7,
    row: 2,
    desc: 'Production 15 % plus rapide.',
  },
  {
    id: 'precision',
    name: 'Usinage de précision',
    branch: 'Armement',
    requires: ['press'],
    cost: {
      coal: 160,
      copper: 80,
      iron: 120,
    },
    time: 50,
    col: 2,
    row: 3,
    desc: 'Armes individuelles et pièces mécaniques.',
  },
  {
    id: 'casting',
    name: 'Fonderie de corps métalliques',
    branch: 'Munitions',
    requires: ['chemistry'],
    cost: {
      coal: 180,
      iron: 140,
      gunpowder: 100,
    },
    time: 50,
    col: 3,
    row: 3,
    desc: 'Corps de grenades et pièces de fonderie.',
  },
  {
    id: 'airframes',
    name: 'Structures aéronautiques légères',
    branch: 'Aviation',
    requires: ['confection'],
    cost: {
      wood: 320,
      cotton: 240,
      bauxite: 280,
    },
    time: 100,
    col: 6,
    row: 3,
    desc: 'Structures légères pour l’aviation.',
  },
  {
    id: 'assembly',
    name: 'Chaîne de montage',
    branch: 'Industrie',
    requires: ['electricity'],
    cost: {
      coal: 300,
      wood: 160,
      iron: 240,
      copper: 120,
    },
    time: 80,
    col: 7,
    row: 3,
    desc: 'Production 25 % plus rapide.',
  },
  {
    id: 'rifle_cartridges',
    name: 'Cartouches standardisées',
    branch: 'Munitions',
    requires: ['cartridges'],
    cost: {
      coal: 200,
      copper: 180,
      gunpowder: 160,
    },
    time: 60,
    col: 3,
    row: 4,
    desc: 'Munitions de fusil.',
  },
  {
    id: 'long_arms',
    name: 'Fabrication d’armes longues',
    branch: 'Armement',
    requires: ['precision'],
    cost: {
      coal: 220,
      wood: 200,
      iron: 240,
    },
    time: 65,
    col: 2,
    row: 4,
    desc: 'Fabrication des fusils.',
  },
  {
    id: 'engines',
    name: 'Moteurs à combustion',
    branch: 'Véhicules',
    requires: ['precision'],
    cost: {
      coal: 360,
      iron: 280,
      copper: 160,
      rubber: 100,
      shale: 120,
    },
    time: 80,
    col: 4,
    row: 4,
    desc: 'Motorisation des véhicules légers.',
  },
  {
    id: 'armor',
    name: 'Métallurgie du blindage',
    branch: 'Blindés',
    requires: ['casting'],
    cost: {
      coal: 400,
      iron: 400,
      manganese: 160,
    },
    time: 90,
    col: 5,
    row: 4,
    desc: 'Prépare les blindages des véhicules chenillés.',
  },
  {
    id: 'tooling',
    name: 'Outillage standardisé',
    branch: 'Industrie',
    requires: ['electricity'],
    cost: {
      coal: 360,
      iron: 320,
      copper: 180,
    },
    time: 90,
    col: 7,
    row: 4,
    desc: 'Consommation de matières en production −10 %.',
  },
  {
    id: 'automatic',
    name: 'Mécanismes automatiques',
    branch: 'Armement',
    requires: ['long_arms'],
    cost: {
      coal: 320,
      copper: 180,
      iron: 360,
    },
    time: 80,
    col: 2,
    row: 5,
    desc: 'Fabrication des mitrailleuses.',
  },
  {
    id: 'heavy_press',
    name: 'Emboutissage lourd',
    branch: 'Munitions',
    requires: ['casting', 'press'],
    cost: {
      coal: 340,
      copper: 240,
      iron: 320,
      gunpowder: 260,
    },
    time: 85,
    col: 3,
    row: 5,
    desc: 'Production des obus.',
  },
  {
    id: 'chassis',
    name: 'Châssis renforcés',
    branch: 'Véhicules',
    requires: ['engines'],
    cost: {
      coal: 440,
      iron: 480,
      wood: 240,
      rubber: 160,
      oil: 120,
    },
    time: 95,
    col: 4,
    row: 5,
    desc: 'Fabrication des camions.',
  },
  {
    id: 'aviation',
    name: 'Construction aéronautique',
    branch: 'Aviation',
    requires: ['airframes', 'engines'],
    cost: {
      coal: 520,
      wood: 360,
      bauxite: 520,
      copper: 240,
      oil: 280,
    },
    time: 130,
    col: 6,
    row: 5,
    desc: 'Fabrication des avions de reconnaissance.',
  },
  {
    id: 'series',
    name: 'Contrôle qualité',
    branch: 'Industrie',
    requires: ['tooling'],
    cost: {
      coal: 440,
      iron: 400,
      copper: 240,
      nickel: 80,
    },
    time: 100,
    col: 7,
    row: 5,
    desc: 'Prix de vente des équipements +25 %.',
  },
  {
    id: 'artillery_machining',
    name: 'Usinage des pièces d’artillerie',
    branch: 'Munitions',
    requires: ['heavy_press', 'precision'],
    cost: {
      coal: 480,
      iron: 560,
      copper: 260,
      wood: 200,
    },
    time: 100,
    col: 3,
    row: 6,
    desc: 'Fabrication des canons.',
  },
  {
    id: 'mixed_tracks',
    name: 'Trains de roulement mixtes',
    branch: 'Véhicules',
    requires: ['chassis'],
    cost: {
      coal: 520,
      iron: 600,
      rubber: 220,
      oil: 180,
      manganese: 120,
    },
    time: 110,
    col: 4,
    row: 6,
    desc: 'Fabrication des half-tracks.',
  },
  {
    id: 'aero_engines',
    name: 'Moteurs aéronautiques performants',
    branch: 'Aviation',
    requires: ['aviation'],
    cost: {
      coal: 700,
      bauxite: 800,
      nickel: 360,
      oil: 440,
      copper: 320,
    },
    time: 160,
    col: 6,
    row: 6,
    desc: 'Fabrication des avions de chasse.',
  },
  {
    id: 'logistics',
    name: 'Transport industriel',
    branch: 'Industrie',
    requires: ['assembly'],
    cost: {
      coal: 280,
      iron: 160,
      rubber: 80,
      oil: 60,
    },
    time: 90,
    col: 7,
    row: 6,
    desc: 'Récolte automatique +25 %. Capacité des stocks doublée.',
  },
  {
    id: 'light_armor',
    name: 'Blindage et chenilles',
    branch: 'Blindés',
    requires: ['armor', 'mixed_tracks'],
    cost: {
      coal: 600,
      iron: 720,
      manganese: 260,
      oil: 200,
    },
    time: 120,
    col: 5,
    row: 7,
    desc: 'Fabrication des chars légers.',
  },
  {
    id: 'multiengine',
    name: 'Construction multimoteur',
    branch: 'Aviation',
    requires: ['aero_engines'],
    cost: {
      coal: 1000,
      bauxite: 1300,
      nickel: 520,
      oil: 700,
      copper: 480,
    },
    time: 190,
    col: 6,
    row: 7,
    desc: 'Fabrication des bombardiers.',
  },
  {
    id: 'alloys',
    name: 'Aciers alliés et transmissions renforcées',
    branch: 'Blindés',
    requires: ['light_armor'],
    cost: {
      coal: 760,
      iron: 960,
      manganese: 360,
      nickel: 200,
      oil: 260,
    },
    time: 145,
    col: 5,
    row: 8,
    desc: 'Fabrication des chars moyens.',
  },
  {
    id: 'heavy_engines',
    name: 'Motorisation lourde',
    branch: 'Blindés',
    requires: ['alloys'],
    cost: {
      coal: 1000,
      iron: 1300,
      manganese: 480,
      nickel: 360,
      oil: 400,
    },
    time: 170,
    col: 5,
    row: 9,
    desc: 'Fabrication des chars lourds.',
  },
];
const PRODUCT_RESEARCH = [
  'sewing',
  'confection',
  'cartridges',
  'precision',
  'casting',
  'rifle_cartridges',
  'long_arms',
  'automatic',
  'heavy_press',
  'artillery_machining',
  'engines',
  'chassis',
  'mixed_tracks',
  'light_armor',
  'alloys',
  'heavy_engines',
  'aviation',
  'aero_engines',
  'multiengine',
];
// Les recettes sont des quantités de jeu, pas des procédés réels de fabrication.
export const PRODUCTS = [
  ['uniform', 'Uniforme', 'Équipement', { coal: 2, cotton: 4 }, 8, null],
  ['support', 'Matériel de soutien', 'Équipement', { coal: 3, cotton: 6, wood: 5 }, 10, null],
  [
    'pistol_ammo',
    'Munition de pistolet',
    'Armement',
    { coal: 4, copper: 6, gunpowder: 4 },
    12,
    null,
  ],
  ['pistol', 'Pistolet', 'Armement', { coal: 6, copper: 5, iron: 10 }, 15, 'steam'],
  ['grenade', 'Grenade', 'Armement', { coal: 6, gunpowder: 8, iron: 8 }, 18, 'chemistry'],
  [
    'rifle_ammo',
    'Munition de fusil',
    'Armement',
    { coal: 8, copper: 12, gunpowder: 10 },
    22,
    'chemistry',
  ],
  ['rifle', 'Fusil', 'Armement', { coal: 10, wood: 14, iron: 22 }, 26, 'steam'],
  [
    'machine_gun',
    'Mitrailleuse',
    'Armement',
    { coal: 16, wood: 8, copper: 12, iron: 38 },
    32,
    'series',
  ],
  [
    'shell',
    'Obus',
    'Artillerie',
    { coal: 20, copper: 20, gunpowder: 28, iron: 30 },
    38,
    'chemistry',
  ],
  [
    'artillery',
    'Canon d’artillerie',
    'Artillerie',
    { coal: 35, wood: 20, copper: 25, iron: 75 },
    45,
    'series',
  ],
  [
    'jeep',
    'Jeep',
    'Véhicules',
    { coal: 40, cotton: 15, copper: 30, iron: 85, rubber: 35, shale: 30 },
    55,
    'assembly',
  ],
  [
    'truck',
    'Camion',
    'Véhicules',
    { coal: 55, cotton: 30, wood: 45, copper: 40, iron: 120, rubber: 55, oil: 40 },
    65,
    'assembly',
  ],
  [
    'halftrack',
    'Half-track',
    'Véhicules',
    { coal: 70, copper: 55, iron: 160, rubber: 65, oil: 55, manganese: 30 },
    75,
    'logistics',
  ],
  [
    'light_tank',
    'Char léger',
    'Blindés',
    { coal: 90, copper: 65, iron: 220, rubber: 50, oil: 75, manganese: 60 },
    90,
    'alloys',
  ],
  [
    'medium_tank',
    'Char moyen',
    'Blindés',
    { coal: 120, copper: 80, iron: 320, rubber: 65, oil: 100, manganese: 90, nickel: 50 },
    110,
    'alloys',
  ],
  [
    'heavy_tank',
    'Char lourd',
    'Blindés',
    { coal: 160, copper: 110, iron: 450, rubber: 80, oil: 140, manganese: 140, nickel: 100 },
    130,
    'alloys',
  ],
  [
    'recon',
    'Avion de reconnaissance',
    'Aviation',
    {
      coal: 180,
      cotton: 60,
      wood: 100,
      copper: 120,
      rubber: 60,
      oil: 150,
      nickel: 70,
      bauxite: 160,
    },
    150,
    'logistics',
  ],
  [
    'fighter',
    'Avion de chasse',
    'Aviation',
    { coal: 220, copper: 150, iron: 140, rubber: 70, oil: 200, nickel: 120, bauxite: 280 },
    180,
    'series',
  ],
  [
    'bomber',
    'Bombardier',
    'Aviation',
    { coal: 300, copper: 220, iron: 220, rubber: 100, oil: 300, nickel: 180, bauxite: 450 },
    220,
    'series',
  ],
].map(([id, name, kind, recipe, time, unlock], tier) => ({
  id,
  name,
  kind,
  recipe,
  time,
  unlock: PRODUCT_RESEARCH[tier],
  legacyUnlock: unlock || 'steam',
  tier,
  value: Math.ceil(
    Object.entries(recipe).reduce(
      (sum, [id, n]) =>
        sum + n * Math.ceil(1.5 ** RESOURCES.find((resource) => resource.id === id).tier),
      0,
    ) *
      (1.4 + tier * 0.06),
  ),
}));
// Chaque nation garde les mêmes règles mais possède ses propres noms et illustrations.
export const PRODUCT_NAMES = {
  fr: [
    'Tenue française modèle 1935',
    'Équipement de soutien français',
    'Cartouches de pistolet françaises',
    'Pistolet automatique 1935A',
    'Grenade F1',
    'Cartouches de fusil françaises',
    'MAS 36',
    'Hotchkiss modèle 1914',
    'Obus français',
    'Canon de 75 modèle 1897',
    'Willys MB · Forces françaises libres',
    'Renault AGK',
    'M5 Half-track · Forces françaises libres',
    'Hotchkiss H39',
    'SOMUA S35',
    'B1 bis',
    'Potez 63.11',
    'Dewoitine D.520',
    'LeO 451',
  ],
  us: [
    'Tenue de campagne M1943',
    'Équipement de soutien américain',
    'Cartouches de pistolet américaines',
    'Colt M1911A1',
    'Grenade Mk 2',
    'Cartouches de fusil américaines',
    'M1 Garand',
    'Browning M1919',
    'Obus américain',
    'Howitzer M2A1',
    'Willys MB',
    'GMC CCKW',
    'M3 Half-track',
    'M5A1 Stuart',
    'M4 Sherman',
    'M26 Pershing · 1945',
    'Piper L-4 Grasshopper',
    'P-51 Mustang',
    'B-17 Flying Fortress',
  ],
  de: [
    'Tenue de campagne M1936',
    'Équipement de soutien allemand',
    'Cartouches de pistolet allemandes',
    'Walther P38',
    'Stielhandgranate 24',
    'Cartouches de fusil allemandes',
    'Karabiner 98k',
    'MG 42',
    'Obus allemand',
    'LeFH 18',
    'Volkswagen Kübelwagen',
    'Opel Blitz',
    'Sd.Kfz. 251',
    'Panzer II',
    'Panzer IV',
    'Tiger I',
    'Focke-Wulf Fw 189',
    'Messerschmitt Bf 109',
    'Heinkel He 111',
  ],
  su: [
    'Tenue Gymnastiorka et casque SSh-40',
    'Équipement de soutien soviétique',
    'Cartouches de pistolet soviétiques',
    'Tokarev TT-33',
    'Grenade F1',
    'Cartouches de fusil soviétiques',
    'Mosin-Nagant 1891/30',
    'DP-27',
    'Obus soviétique',
    'ZiS-3',
    'GAZ-67',
    'ZiS-5',
    'ZiS-42',
    'T-70',
    'T-34-85',
    'IS-2',
    'Polikarpov Po-2',
    'Yakovlev Yak-3',
    'Petlyakov Pe-2',
  ],
  jp: [
    'Tenue de campagne Type 98',
    'Équipement de soutien japonais',
    'Cartouches de pistolet 8 mm Nambu',
    'Nambu Type 14',
    'Grenade Type 97',
    'Cartouches de fusil 7,7 mm',
    'Arisaka Type 99',
    'Mitrailleuse légère Type 99',
    'Obus japonais de 75 mm',
    'Canon Type 90 de 75 mm',
    'Type 95 Kurogane',
    'Isuzu Type 94',
    'Type 1 Ho-Ha',
    'Type 95 Ha-Go',
    'Type 97 Chi-Ha',
    'O-I · prototype uchronique',
    'Mitsubishi Ki-46',
    'Mitsubishi A6M2 Zero',
    'Mitsubishi G4M',
  ],
};
export const productName = (state, product) => PRODUCT_NAMES[state.country][product.tier];
// Liste les conditions encore manquantes pour acheter le brevet.
export function patentRequirements(state, product) {
  const missing = [];
  if (!state.tech.includes(product.unlock))
    missing.push('Recherche : ' + TECHS.find((t) => t.id === product.unlock).name);
  if (
    !state.patents.includes(product.id) &&
    product.tier &&
    state.lines.find((line) => line.id === PRODUCTS[product.tier - 1].id).made < 1
  )
    missing.push('Fabriquer : ' + PRODUCTS[product.tier - 1].name);
  return missing;
}
// Ajoute les conditions de licence et d’exploitation nécessaires à la fabrication.
export function productionRequirements(state, product) {
  const missing = patentRequirements(state, product);
  if (!state.patents.includes(product.id)) missing.push('Acheter le brevet : ' + product.name);
  const sites = Object.keys(product.recipe)
    .filter((id) => !state.levels[id])
    .map((id) => RESOURCES.find((resource) => resource.id === id).name);
  if (sites.length) missing.push('Ouvrir : ' + sites.join(', '));
  return missing;
}
export const productionUnlocked = (state, product) =>
  productionRequirements(state, product).length === 0;
// Le brevet coûte cinq fois la valeur de vente de base, avec un minimum de 75 or.
export const PATENTS = PRODUCTS.map((product) => ({
  ...product,
  cost: Math.max(75, Math.ceil(product.value * 5)),
}));
const LEGACY_PATENT_COSTS = {
  steam: 250,
  assembly: 500,
  alloys: 650,
  chemistry: 450,
  series: 1000,
  logistics: 900,
};
// Le front avance uniquement pendant le jeu actif ; les livraisons sont explicites.
export const ASSAULT_DELAY = 600;
export const FRONT_ITEMS = ['uniform', 'support', 'rifle', 'rifle_ammo'];
export function newFront() {
  return {
    wave: 1,
    remaining: ASSAULT_DELAY,
    status: 'preparing',
    defeats: 0,
    victories: 0,
    battles: 0,
    soldiers: 10,
    reservists: 20,
    equipment: { uniform: 0, support: 0, rifle: 10, rifle_ammo: 30 },
    lastBattle: null,
  };
}
export const enemyPower = (state) => Math.min(1e12, Math.ceil(12 * 1.35 ** (state.front.wave - 1)));
export function armyStats(state) {
  const f = state.front;
  const armed = Math.min(f.soldiers, f.equipment.rifle);
  const supplied = Math.min(armed, f.equipment.rifle_ammo);
  const support = Math.min(f.equipment.support, Math.ceil(f.soldiers / 10), 5);
  const morale = 1 - 0.1 * Math.min(2, f.defeats);
  return {
    armed,
    supplied,
    support,
    morale,
    power:
      Math.round((supplied + (f.soldiers - supplied) * 0.25) * (1 + support * 0.1) * morale * 100) /
      100,
  };
}
// Détruire d’abord les usines libres. Un lot touché perd seulement ses unités détruites.
function destroyFactories(state, count) {
  let remaining = Math.max(0, count - freeFactories(state));
  for (const line of [...state.lines].reverse()) {
    if (!remaining) break;
    const occupied = Math.max(line.factories, line.batch);
    const removed = Math.min(remaining, occupied);
    const kept = occupied - removed;
    line.factories = Math.min(line.factories, kept);
    line.batch = Math.min(line.batch, kept);
    if (!line.batch) line.remaining = 0;
    if (!line.factories && !line.batch) line.enabled = false;
    remaining -= removed;
  }
  state.factories -= count;
}
// Arrondir la réquisition une seule fois sur l’ensemble des sites, puis la répartir.
function requisitionWorkers(state) {
  const sites = RESOURCES.map((r) => ({ id: r.id, count: state.workers[r.id].length }));
  const target = Math.ceil(sites.reduce((n, r) => n + r.count, 0) * 0.25);
  let allocated = 0;
  for (const r of sites) {
    r.take = Math.floor(r.count * 0.25);
    allocated += r.take;
  }
  sites.sort((a, b) => b.count * 0.25 - b.take - (a.count * 0.25 - a.take));
  for (const r of sites)
    if (allocated < target && r.take < r.count) {
      r.take++;
      allocated++;
    }
  for (const r of sites) state.workers[r.id].splice(state.workers[r.id].length - r.take, r.take);
  state.front.reservists += target;
  return target;
}
function resolveAssault(state) {
  const f = state.front,
    stats = armyStats(state),
    enemy = enemyPower(state);
  const won = stats.power >= enemy;
  const losses = Math.min(
    f.soldiers,
    Math.ceil((f.soldiers * (won ? 0.05 : 0.25)) / (1 + stats.support * 0.2)),
  );
  const rifleLosses = f.soldiers
    ? Math.min(f.equipment.rifle, Math.ceil((losses * stats.armed) / f.soldiers))
    : 0;
  f.equipment.rifle_ammo -= stats.supplied;
  f.equipment.support -= stats.support;
  f.equipment.rifle -= rifleLosses;
  f.soldiers -= losses;
  const report = {
    wave: f.wave,
    won,
    power: stats.power,
    enemy,
    losses,
    ammunition: stats.supplied,
    support: stats.support,
    factories: 0,
    requisitioned: 0,
    reward: 0,
  };
  f.battles++;
  if (won) {
    report.reward = Math.min(1e9, Math.ceil(100 * 1.3 ** (f.wave - 1)));
    state.credits += report.reward;
    f.victories++;
    f.wave++;
    f.defeats = 0;
    f.reservists += 10;
    f.status = 'preparing';
  } else {
    f.defeats++;
    if (f.defeats === 3) f.status = 'ended';
    else {
      report.factories = Math.ceil(state.factories * 0.1);
      destroyFactories(state, report.factories);
      report.requisitioned = requisitionWorkers(state);
      f.status = 'paused';
    }
  }
  f.remaining = ASSAULT_DELAY;
  f.lastBattle = report;
}

// Crée une partie vide avec seulement le charbon accessible.
export function newGame(country, now = Date.now()) {
  if (!COUNTRIES[country]) throw Error('Pays invalide');
  return {
    version: 10,
    front: newFront(),
    starterFactoryGranted: false,
    autoSales: Object.fromEntries(RESOURCES.map((r) => [r.id, { enabled: false, reserve: 100 }])),
    storageLevels: Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0])),
    factories: 0,
    country,
    credits: 0,
    resources: Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0])),
    harvestProgress: Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0])),
    levels: Object.fromEntries(
      RESOURCES.map((resource) => [resource.id, resource.id === 'coal' ? 1 : 0]),
    ),
    workers: Object.fromEntries(RESOURCES.map((resource) => [resource.id, []])),
    tech: [],
    research: null,
    patents: [],
    lines: PRODUCTS.map((product) => ({
      id: product.id,
      enabled: false,
      remaining: 0,
      stock: 0,
      made: 0,
      factories: 0,
      batch: 0,
      licensed: false,
    })),
    totalSold: 0,
    lastSaved: now,
    elapsed: 0,
  };
}
// Récompense unique, y compris pour les anciennes parties. Au plafond, compenser en or.
function grantStarterFactory(state) {
  if (!state.tech.includes('sewing') || state.starterFactoryGranted) return;
  if (state.factories < MAX_FACTORIES) state.factories++;
  else state.credits += 1000;
  state.starterFactoryGranted = true;
}
export const autoSalesUnlocked = (state) => state.tech.includes('sewing');
// Ne vendre que des unités entières au-dessus de la réserve choisie.
function sellSurplus(state) {
  if (!autoSalesUnlocked(state)) return;
  for (const resource of RESOURCES) {
    const rule = state.autoSales[resource.id];
    if (!rule.enabled || !unlocked(state, resource)) continue;
    const amount = Math.max(0, Math.floor(state.resources[resource.id] - rule.reserve));
    state.resources[resource.id] -= amount;
    state.credits += amount * MARKET_PRICES[resource.id];
  }
}
export const WORKER_MILESTONES = [
  { count: 5, multiplier: 1.25 },
  { count: 10, multiplier: 1.5 },
  { count: 25, multiplier: 2 },
];
export const workerMultiplier = (count) =>
  WORKER_MILESTONES.filter((step) => count >= step.count).at(-1)?.multiplier ?? 1;
export const MAX_FACTORIES = 250;
export const factoryCost = (state) => Math.ceil(1000 * 1.3 ** Math.floor(state.factories / 5));
// Un lot commencé garde ses usines réservées jusqu’à son achèvement.
export const freeFactories = (state) =>
  state.factories - state.lines.reduce((n, line) => n + Math.max(line.factories, line.batch), 0);
// Limiter le lot aux usines, aux matières disponibles et à la place en stock.
// La réduction porte sur les matières consommées, jamais sur la valeur de vente.
export const productionRecipe = (state, product) =>
  Object.fromEntries(
    Object.entries(product.recipe).map(([id, amount]) => [
      id,
      // Deux décimales évitent les résidus binaires lors du cumul des réductions.
      Math.round(
        amount *
          (state.tech.includes('tooling') ? 0.9 : 1) *
          (state.country === 'jp' ? 0.9 : 1) *
          100,
      ) / 100,
    ]),
  );
export const productionBatch = (state, product, line) =>
  Math.max(
    0,
    Math.min(
      line.factories,
      9999 - line.stock,
      ...Object.entries(productionRecipe(state, product)).map(([id, n]) =>
        Math.floor((state.resources[id] + 1e-9) / n),
      ),
    ),
  );
export const MAX_STORAGE_LEVEL = 30;
export const storageUpgradeCost = (state, resource) =>
  Math.ceil(100 * 1.5 ** resource.tier * 1.6 ** (state.storageLevels?.[resource.id] ?? 0));
export const capacity = (state, resource = RESOURCES[0]) =>
  500 * 2 ** (state.storageLevels?.[resource.id] ?? 0) * (state.tech.includes('logistics') ? 2 : 1);
export const HIRE_COST = 25,
  WAGE = 2,
  PAY_PERIOD = 60;
// Arrondir le prix final seulement, pour conserver la progression prévue.
export const hireCost = (state, resource) =>
  Math.ceil(HIRE_COST * 1.5 ** resource.tier * 1.3 ** state.workers[resource.id].length);
// Le salaire dépend du site, jamais du nombre d’ouvriers déjà engagés.
export const workerWage = (resource, state = null) => {
  const base = Math.ceil(resource.rate * PAY_PERIOD * MARKET_PRICES[resource.id] * 0.5);
  return state && state.resources[resource.id] >= capacity(state, resource)
    ? Math.ceil(base / 2)
    : base;
};
export const MARKET_PRICES = Object.fromEntries(
  RESOURCES.map((resource) => [resource.id, Math.ceil(1.5 ** resource.tier)]),
);
export const available = (state, resource) =>
  state.levels[resource.id] > 0 || !resource.previous || state.levels[resource.previous] > 0;
export const unlocked = (state, resource) =>
  state.levels[resource.id] > 0 && available(state, resource);
export const activeWorkers = (state, resource) =>
  state.workers[resource.id].filter((t) => t > 1e-8).length;
export const rate = (state, resource) =>
  unlocked(state, resource) && state.resources[resource.id] < capacity(state, resource)
    ? resource.rate *
      state.levels[resource.id] *
      activeWorkers(state, resource) *
      workerMultiplier(activeWorkers(state, resource)) *
      (state.country === 'su' ? 1.15 : 1) *
      (state.tech.includes('steam') ? 1.2 : 1) *
      (state.tech.includes('logistics') ? 1.25 : 1)
    : 0;
export const upgradeCost = (state, resource) =>
  Math.ceil(resource.cost * 1.65 ** state.levels[resource.id]);
export const researchTime = (state, t) => t.time / (state.country === 'fr' ? 1.15 : 1);
export const productTime = (state, product) =>
  product.time /
  (state.country === 'us' ? 1.15 : 1) /
  (state.tech.includes('assembly') ? 1.25 : 1) /
  (state.tech.includes('electricity') ? 1.15 : 1);
export const salePrice = (state, product) =>
  Math.ceil(
    product.value *
      (state.country === 'de' ? 1.15 : 1) *
      (state.tech.includes('series') ? 1.25 : 1),
  );
export const affordable = (state, cost) =>
  Object.entries(cost).every(([k, v]) => state.resources[k] >= v);
// Les fractions représentent du travail en cours, jamais des unités vendables.
function initializeHarvestProgress(state) {
  if (state.harvestProgress !== undefined) return;
  state.harvestProgress = Object.fromEntries(
    RESOURCES.map((resource) => {
      const amount = state.resources[resource.id];
      state.resources[resource.id] = Math.floor(amount);
      return [resource.id, amount - Math.floor(amount)];
    }),
  );
}
// Fait avancer salaires, récolte, recherches et production, au maximum sur huit heures.
export function advance(state, seconds, { frontActive = false } = {}) {
  if (state.front.status === 'ended') return state;
  initializeHarvestProgress(state);
  let left = Math.max(0, Math.min(28800, Number(seconds) || 0));
  while (left > 1e-8 && state.front.status !== 'ended') {
    sellSurplus(state);
    // Le salaire finance une minute ; sans or, l’ouvrier attend le prochain paiement.
    for (const resource of RESOURCES)
      for (let i = 0; i < state.workers[resource.id].length; i++)
        if (state.workers[resource.id][i] <= 1e-8 && state.credits >= workerWage(resource, state)) {
          state.credits -= workerWage(resource, state);
          state.workers[resource.id][i] =
            PAY_PERIOD * (workerWage(resource, state) / workerWage(resource));
        }
    // Le salaire prépayé se consomme deux fois moins vite lorsque le stock est plein.
    const wageFactors = Object.fromEntries(
      RESOURCES.map((resource) => [
        resource.id,
        workerWage(resource, state) / workerWage(resource),
      ]),
    );
    const remaining = RESOURCES.flatMap((resource) =>
      state.workers[resource.id]
        .filter((time) => time > 1e-8)
        .map((time) => time / wageFactors[resource.id]),
    );
    // Couper exactement à l’instant où un stock se remplit, même hors ligne.
    const filling = RESOURCES.map((resource) => {
      const speed = rate(state, resource);
      return speed > 0
        ? (Math.ceil(capacity(state, resource) - state.resources[resource.id]) -
            state.harvestProgress[resource.id]) /
            speed
        : Infinity;
    }).filter((time) => time > 1e-8);
    // Découper aux unités récoltées vendables pour garder les mêmes salaires hors ligne.
    const waitingForWages = RESOURCES.some((r) => state.workers[r.id].some((t) => t <= 1e-8));
    const saleEvents =
      waitingForWages && autoSalesUnlocked(state)
        ? RESOURCES.map((resource) => {
            const speed = rate(state, resource);
            return state.autoSales[resource.id].enabled && speed > 0
              ? (1 - state.harvestProgress[resource.id]) / speed
              : Infinity;
          }).filter((time) => time > 1e-8)
        : [];
    const frontTime =
      frontActive && state.front.status === 'preparing' ? state.front.remaining : Infinity;
    const dt = Math.min(1, left, ...remaining, ...filling, ...saleEvents, frontTime);
    left -= dt;
    state.elapsed += dt;
    for (const resource of RESOURCES) {
      const id = resource.id,
        limit = capacity(state, resource);
      if (state.resources[id] >= limit) {
        state.harvestProgress[id] = 0;
        continue;
      }
      const progress = state.harvestProgress[id] + rate(state, resource) * dt;
      const whole = Math.floor(progress + 1e-9);
      state.resources[id] = Math.min(limit, state.resources[id] + whole);
      state.harvestProgress[id] = state.resources[id] >= limit ? 0 : Math.max(0, progress - whole);
    }
    for (const resource of RESOURCES)
      state.workers[resource.id] = state.workers[resource.id].map((t) =>
        Math.max(0, t - dt * wageFactors[resource.id]),
      );
    if (state.research) {
      state.research.remaining -= dt;
      if (state.research.remaining <= 0) {
        state.tech.push(state.research.id);
        state.research = null;
        grantStarterFactory(state);
      }
    }
    for (const line of state.lines) {
      const product = PRODUCTS.find((x) => x.id === line.id);
      if (!line.enabled) continue;
      // Un pas de temps peut terminer un lot et commencer le suivant.
      let budget = dt;
      while (budget > 1e-8) {
        if (line.remaining <= 1e-8) {
          const batch = productionBatch(state, product, line);
          if (!batch || !productionUnlocked(state, product)) break;
          for (const [id, n] of Object.entries(productionRecipe(state, product)))
            state.resources[id] = Math.max(0, state.resources[id] - n * batch);
          line.batch = batch;
          line.licensed = true;
          line.remaining = productTime(state, product);
        }
        const used = Math.min(budget, line.remaining);
        line.remaining -= used;
        budget -= used;
        if (line.remaining <= 1e-8) {
          line.remaining = 0;
          line.stock += line.batch;
          line.made += line.batch;
          line.batch = 0;
          if (!line.factories) {
            line.enabled = false;
            break;
          }
        }
      }
    }
    sellSurplus(state);
    if (frontActive && state.front.status === 'preparing') {
      state.front.remaining = Math.max(0, state.front.remaining - dt);
      if (state.front.remaining <= 1e-8) resolveAssault(state);
    }
  }
  return state;
}
// Valide une action avant de dépenser ses coûts. Renvoie false si elle est impossible.
export function act(state, type, id, requestedAmount) {
  if (state.front.status === 'ended') return false;
  if (type === 'front-assault') {
    resolveAssault(state);
    return true;
  }
  if (type === 'front-resume') {
    if (state.front.status !== 'paused') return false;
    state.front.status = 'preparing';
    state.front.remaining = ASSAULT_DELAY;
    return true;
  }
  if (type === 'front-deliver') {
    if (!FRONT_ITEMS.includes(id) || !Number.isSafeInteger(requestedAmount) || requestedAmount <= 0)
      return false;
    const line = state.lines.find((l) => l.id === id);
    if (!line || line.stock < requestedAmount || state.front.equipment[id] + requestedAmount > 1e9)
      return false;
    line.stock -= requestedAmount;
    state.front.equipment[id] += requestedAmount;
    return true;
  }
  if (type === 'front-recruit') {
    const count = Math.min(state.front.reservists, state.front.equipment.uniform);
    if (!count) return false;
    state.front.reservists -= count;
    state.front.equipment.uniform -= count;
    state.front.soldiers += count;
    return true;
  }

  if (type === 'toggle-auto-sale' || type === 'set-auto-reserve') {
    const resource = RESOURCES.find((r) => r.id === id);
    if (!resource || !unlocked(state, resource) || !autoSalesUnlocked(state)) return false;
    const rule = state.autoSales[id];
    if (type === 'toggle-auto-sale') rule.enabled = !rule.enabled;
    else {
      if (
        !Number.isSafeInteger(requestedAmount) ||
        requestedAmount < 0 ||
        requestedAmount > capacity(state, resource)
      )
        return false;
      rule.reserve = requestedAmount;
    }
    return true;
  }
  if (type === 'expand-storage') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (
      !resource ||
      !unlocked(state, resource) ||
      !state.storageLevels ||
      state.storageLevels[id] >= MAX_STORAGE_LEVEL ||
      state.credits < storageUpgradeCost(state, resource)
    )
      return false;
    state.credits -= storageUpgradeCost(state, resource);
    state.storageLevels[id]++;
    return true;
  }

  if (type === 'buy-factory') {
    if (state.factories >= MAX_FACTORIES || state.credits < factoryCost(state)) return false;
    state.credits -= factoryCost(state);
    state.factories++;
    return true;
  }
  if (type === 'assign-factory' || type === 'release-factory') {
    const line = state.lines.find((line) => line.id === id);
    if (!line) return false;
    if (type === 'assign-factory') {
      if ((freeFactories(state) < 1 && line.factories >= line.batch) || !state.patents.includes(id))
        return false;
      line.factories++;
    } else {
      if (!line.factories) return false;
      line.factories--;
      if (!line.factories && !line.remaining) line.enabled = false;
    }
    return true;
  }
  if (type === 'harvest') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (!resource || !unlocked(state, resource) || state.resources[id] >= capacity(state, resource))
      return false;
    // Un niveau de site apporte une unité par clic, dans la limite du stock.
    state.resources[id] = Math.min(
      capacity(state, resource),
      state.resources[id] + state.levels[id],
    );
    return true;
  }
  if (type === 'upgrade') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (
      !resource ||
      !available(state, resource) ||
      state.levels[id] >= 100 ||
      state.credits < upgradeCost(state, resource)
    )
      return false;
    state.credits -= upgradeCost(state, resource);
    state.levels[id]++;
    return true;
  }
  if (type === 'hire') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (
      !resource ||
      !unlocked(state, resource) ||
      state.workers[id].length >= 100 ||
      state.credits < hireCost(state, resource) + workerWage(resource, state)
    )
      return false;
    state.credits -= hireCost(state, resource) + workerWage(resource, state);
    state.workers[id].push(PAY_PERIOD * (workerWage(resource, state) / workerWage(resource)));
    return true;
  }
  if (type === 'dismiss') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (!resource || !state.workers[id].length) return false;
    state.workers[id].pop();
    return true;
  }
  if (['sell-resource', 'sell-ten', 'sell-all', 'sell-quantity'].includes(type)) {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (!resource) return false;
    const amount =
      type === 'sell-quantity'
        ? requestedAmount
        : type === 'sell-all'
          ? Math.floor(state.resources[id])
          : type === 'sell-ten'
            ? 10
            : 1;
    if (!Number.isSafeInteger(amount) || amount <= 0 || state.resources[id] < amount) return false;
    state.resources[id] -= amount;
    state.credits += amount * MARKET_PRICES[id];
    return true;
  }
  if (type === 'research') {
    const t = TECHS.find((t) => t.id === id);
    if (
      !t ||
      state.research ||
      state.tech.includes(id) ||
      !t.requires.every((k) => state.tech.includes(k)) ||
      !affordable(state, t.cost)
    )
      return false;
    for (const [resource, amount] of Object.entries(t.cost)) state.resources[resource] -= amount;
    state.research = { id, remaining: researchTime(state, t) };
    return true;
  }
  if (type === 'patent') {
    const product = PATENTS.find((product) => product.id === id);
    if (
      !product ||
      patentRequirements(state, product).length ||
      state.patents.includes(id) ||
      state.credits < product.cost
    )
      return false;
    state.credits -= product.cost;
    state.patents.push(id);
    state.lines.find((line) => line.id === id).licensed = true;
    return true;
  }
  if (type === 'toggle') {
    const line = state.lines.find((line) => line.id === id),
      product = PRODUCTS.find((product) => product.id === id);
    if (
      !line ||
      (!line.enabled &&
        ((!line.factories && !line.batch) ||
          (line.remaining <= 0 && !productionUnlocked(state, product))))
    )
      return false;
    line.enabled = !line.enabled;
    return true;
  }
  if (type === 'sell') {
    const line = state.lines.find((line) => line.id === id),
      product = PRODUCTS.find((product) => product.id === id);
    if (!line || !line.stock) return false;
    state.credits += line.stock * salePrice(state, product);
    state.totalSold += line.stock;
    line.stock = 0;
    return true;
  }
  return false;
}
// Contrôle les données importées et adapte les anciennes versions sans perdre la progression.
export function validateSave(raw) {
  const state = typeof raw === 'string' ? JSON.parse(raw) : structuredClone(raw);
  const finite = (n, max = 1e12) =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
  const saveTechs = state?.version < 7 ? LEGACY_TECHS : TECHS;
  const unlockForSave = (product) => (state.version < 7 ? product.legacyUnlock : product.unlock);
  const unique = (a) => new Set(a).size === a.length;
  if (
    !state ||
    ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(state.version) ||
    !COUNTRIES[state.country] ||
    !finite(state.credits) ||
    !finite(state.elapsed) ||
    !finite(state.totalSold) ||
    !finite(state.lastSaved, Date.now() + 60000)
  )
    throw Error('Sauvegarde invalide');
  // Versions 1 et 2 : conserver les sites et les salaires en ajoutant les nouvelles ressources.
  if (state.version < 3) {
    const legacy = ['coal', 'wood', 'iron', 'platinum', 'rubber'];
    for (const id of legacy) {
      if (
        !finite(state.resources?.[id], 10000) ||
        !Number.isInteger(state.levels?.[id]) ||
        !finite(state.levels[id], 100)
      )
        throw Error('Ressources invalides');
      if (
        state.version === 2 &&
        (!Array.isArray(state.workers?.[id]) ||
          state.workers[id].length > 100 ||
          state.workers[id].some((t) => !finite(t, PAY_PERIOD)) ||
          (state.workers[id].length && !state.levels[id]))
      )
        throw Error('Ouvriers invalides');
    }
    const old = state.workers || {};
    state.credits += state.resources.platinum * 6;
    state.resources = Object.fromEntries(
      RESOURCES.map((resource) => [resource.id, state.resources[resource.id] ?? 0]),
    );
    state.levels = Object.fromEntries(
      RESOURCES.map((resource) => [resource.id, state.levels[resource.id] ?? 0]),
    );
    state.workers = Object.fromEntries(
      RESOURCES.map((resource) => [
        resource.id,
        state.version === 1 ? [] : (old[resource.id] ?? []),
      ]),
    );
    if (state.version === 2)
      for (const time of old.platinum) {
        if (state.workers.coal.length < 100) {
          state.workers.coal.push(time);
          state.levels.coal = Math.max(1, state.levels.coal);
        } else state.credits += HIRE_COST + (WAGE * time) / PAY_PERIOD;
      }
    state.version = 3;
  }
  for (const resource of RESOURCES)
    if (
      !finite(state.resources?.[resource.id], 1e12) ||
      !Number.isInteger(state.levels?.[resource.id]) ||
      state.levels[resource.id] < 0 ||
      state.levels[resource.id] > 100
    )
      throw Error('Ressources invalides');
  for (const key of ['tech', 'patents'])
    if (
      !Array.isArray(state[key]) ||
      !unique(state[key]) ||
      state[key].some(
        (id) =>
          !(key === 'patents' && state.version >= 5 ? PATENTS : saveTechs).some((t) => t.id === id),
      )
    )
      throw Error('Technologies invalides');
  if (
    state.tech.some(
      (id) => !saveTechs.find((t) => t.id === id).requires.every((k) => state.tech.includes(k)),
    ) ||
    state.patents.some(
      (id) =>
        !state.tech.includes(
          state.version >= 5 ? unlockForSave(PRODUCTS.find((product) => product.id === id)) : id,
        ),
    )
  )
    throw Error('Progression incohérente');
  if (
    state.research &&
    (!saveTechs.some((t) => t.id === state.research.id) ||
      state.tech.includes(state.research.id) ||
      !finite(state.research.remaining, 200) ||
      !saveTechs
        .find((t) => t.id === state.research.id)
        .requires.every((k) => state.tech.includes(k)))
  )
    throw Error('Recherche invalide');
  const legacyLines = state.version < 4;
  if (
    !Array.isArray(state.lines) ||
    state.lines.length !== (legacyLines ? 3 : PRODUCTS.length) ||
    !unique(state.lines.map((line) => line.id))
  )
    throw Error('Lignes invalides');
  for (const line of state.lines)
    if (
      !(legacyLines
        ? ['rifle', 'truck', 'tank'].includes(line.id)
        : PRODUCTS.some((product) => product.id === line.id)) ||
      typeof line.enabled !== 'boolean' ||
      !finite(line.remaining, 300) ||
      !Number.isInteger(line.stock) ||
      !finite(line.stock, 9999) ||
      !Number.isInteger(line.made) ||
      !finite(line.made) ||
      (!legacyLines && typeof line.licensed !== 'boolean')
    )
      throw Error('Production invalide');
  if (legacyLines) {
    const old = Object.fromEntries(
      state.lines.map((line) => [line.id === 'tank' ? 'medium_tank' : line.id, line]),
    );
    state.lines = PRODUCTS.map((product) =>
      old[product.id]
        ? { ...old[product.id], id: product.id, licensed: true }
        : {
            id: product.id,
            enabled: false,
            remaining: 0,
            stock: 0,
            made: 0,
            factories: 0,
            batch: 0,
            licensed: false,
          },
    );
    state.version = 4;
  }
  if (state.version < 5) {
    // Avant la version 5 : rembourser les redevances et conserver les lignes acquises.
    state.credits += state.patents.reduce((sum, id) => sum + LEGACY_PATENT_COSTS[id], 0);
    state.patents = state.lines
      .filter(
        (line) =>
          line.licensed || line.enabled || line.made > 0 || line.stock > 0 || line.remaining > 0,
      )
      .map((line) => line.id);
    const grant = (id) => {
      for (const parent of saveTechs.find((t) => t.id === id).requires) grant(parent);
      if (!state.tech.includes(id)) state.tech.push(id);
    };
    for (const id of state.patents)
      grant(unlockForSave(PRODUCTS.find((product) => product.id === id)));
    for (const line of state.lines) line.licensed = state.patents.includes(line.id);
    if (state.research && state.tech.includes(state.research.id)) {
      state.credits += {
        steam: 240,
        assembly: 450,
        alloys: 650,
        chemistry: 400,
        series: 1300,
        logistics: 1000,
      }[state.research.id];
      state.research = null;
    }
    state.version = 5;
  }
  // Avant la version 6 : attribuer une usine à chaque ligne déjà acquise.
  if (state.version < 6) {
    for (const line of state.lines) {
      line.factories = line.licensed ? 1 : 0;
      line.batch = line.remaining > 0 ? 1 : 0;
    }
    state.factories = state.lines.reduce((n, line) => n + line.factories, 0);
    state.version = 6;
  }
  // Ancien arbre : préserver les technologies et les brevets accessibles, une seule fois.
  if (state.version < 7) {
    const oldTech = [...state.tech];
    const grant = (id) => {
      for (const parent of TECHS.find((t) => t.id === id).requires) grant(parent);
      if (!state.tech.includes(id)) state.tech.push(id);
    };
    state.tech = [];
    for (const id of oldTech) grant(id);
    for (const product of PRODUCTS)
      if (oldTech.includes(product.legacyUnlock) || state.patents.includes(product.id))
        grant(product.unlock);
    if (state.research) {
      const id = state.research.id;
      if (state.tech.includes(id)) {
        // La recherche payée devenue acquise est remboursée en matières.
        for (const [resource, amount] of Object.entries(LEGACY_TECHS.find((t) => t.id === id).cost))
          state.resources[resource] += amount;
        state.research = null;
      } else for (const parent of TECHS.find((t) => t.id === id).requires) grant(parent);
    }
    state.version = 7;
  }
  if (
    !Number.isInteger(state.factories) ||
    !finite(state.factories, MAX_FACTORIES) ||
    state.lines.some(
      (line) =>
        !Number.isInteger(line.factories) ||
        !finite(line.factories, MAX_FACTORIES) ||
        !Number.isInteger(line.batch) ||
        !finite(line.batch, MAX_FACTORIES) ||
        line.remaining > 0 !== line.batch > 0 ||
        line.stock + line.batch > 9999 ||
        (line.factories > 0 && !line.licensed) ||
        (line.enabled && !line.factories && !line.batch),
    ) ||
    freeFactories(state) < 0
  )
    throw Error('Usines invalides');
  if (
    !finite(state.credits) ||
    state.lines.some(
      (line) =>
        line.licensed !== state.patents.includes(line.id) ||
        ((line.enabled || line.remaining > 0 || line.made > 0 || line.stock > 0) && !line.licensed),
    )
  )
    throw Error('Brevets incohérents');
  for (const resource of RESOURCES) {
    const crew = state.workers?.[resource.id];
    if (
      !Array.isArray(crew) ||
      crew.length > 100 ||
      crew.some((t) => !finite(t, PAY_PERIOD)) ||
      (crew.length && !unlocked(state, resource))
    )
      throw Error('Ouvriers invalides');
  }
  // Anciennes parties : attribuer assez d’extensions pour conserver les capacités et stocks.
  if (state.version < 8) {
    const bonus = state.tech.includes('logistics') ? 2 : 1;
    state.storageLevels = Object.fromEntries(
      RESOURCES.map((resource) => {
        const previous = Math.ceil(5000 * RESOURCE_CAPACITY_GROWTH ** resource.tier);
        const required = Math.max(previous, state.resources[resource.id] / bonus);
        return [
          resource.id,
          Math.min(MAX_STORAGE_LEVEL, Math.max(0, Math.ceil(Math.log2(required / 500)))),
        ];
      }),
    );
    state.version = 8;
  }
  if (
    !state.storageLevels ||
    RESOURCES.some(
      (resource) =>
        !Number.isInteger(state.storageLevels[resource.id]) ||
        !finite(state.storageLevels[resource.id], MAX_STORAGE_LEVEL),
    )
  )
    throw Error('Extensions de stockage invalides');
  if (state.version < 9) {
    state.autoSales = Object.fromEntries(
      RESOURCES.map((r) => [r.id, { enabled: false, reserve: 100 }]),
    );
    state.starterFactoryGranted = false;
    grantStarterFactory(state);
    state.version = 9;
  }
  if (
    typeof state.starterFactoryGranted !== 'boolean' ||
    (state.starterFactoryGranted && !state.tech.includes('sewing')) ||
    !state.autoSales ||
    RESOURCES.some((r) => {
      const rule = state.autoSales[r.id];
      return (
        !rule ||
        typeof rule.enabled !== 'boolean' ||
        !Number.isSafeInteger(rule.reserve) ||
        !finite(rule.reserve) ||
        (rule.enabled && (!autoSalesUnlocked(state) || !unlocked(state, r)))
      );
    })
  )
    throw Error('Vente automatique ou récompense invalide');
  initializeHarvestProgress(state);
  if (
    !state.harvestProgress ||
    typeof state.harvestProgress !== 'object' ||
    RESOURCES.some(
      (resource) =>
        !Number.isFinite(state.harvestProgress[resource.id]) ||
        state.harvestProgress[resource.id] < 0 ||
        state.harvestProgress[resource.id] >= 1,
    )
  )
    throw Error('Progression de récolte invalide');
  if (state.version < 10) {
    state.front = newFront();
    state.version = 10;
  }
  const f = state.front;
  const whole = (n) => Number.isSafeInteger(n) && finite(n, 1e9);
  if (
    !f ||
    !['preparing', 'paused', 'ended'].includes(f.status) ||
    !whole(f.wave) ||
    f.wave < 1 ||
    !finite(f.remaining, ASSAULT_DELAY) ||
    !whole(f.defeats) ||
    f.defeats > 3 ||
    !whole(f.victories) ||
    f.wave !== f.victories + 1 ||
    !whole(f.battles) ||
    f.battles < f.victories + f.defeats ||
    !whole(f.soldiers) ||
    !whole(f.reservists) ||
    !f.equipment ||
    FRONT_ITEMS.some((id) => !whole(f.equipment[id])) ||
    (f.status === 'ended') !== (f.defeats === 3) ||
    (f.status === 'paused' && ![1, 2].includes(f.defeats)) ||
    (f.lastBattle !== null &&
      (!f.lastBattle ||
        typeof f.lastBattle.won !== 'boolean' ||
        !whole(f.lastBattle.wave) ||
        f.lastBattle.wave < 1 ||
        !finite(f.lastBattle.power) ||
        !finite(f.lastBattle.enemy) ||
        ['losses', 'ammunition', 'support', 'factories', 'requisitioned', 'reward'].some(
          (k) => !whole(f.lastBattle[k]),
        )))
  )
    throw Error('Front invalide');
  return state;
}
