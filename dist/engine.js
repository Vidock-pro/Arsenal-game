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
};
export const RESOURCE_RATE_GROWTH = 5 / (1.5 * 1.3);
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
  rate: 0.4 * RESOURCE_RATE_GROWTH ** i,
  cost: i ? 100 * 5 ** (i - 1) : 90,
  icon: '◆',
}));
// Recherches : coûts en ressources, durée, prérequis et coordonnées des illustrations.
export const TECHS = [
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
  unlock: unlock || 'steam',
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
// Crée une partie vide avec seulement le charbon accessible.
export function newGame(country, now = Date.now()) {
  if (!COUNTRIES[country]) throw Error('Pays invalide');
  return {
    version: 6,
    factories: 0,
    country,
    credits: 0,
    resources: Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0])),
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
export const MAX_FACTORIES = 250;
export const factoryCost = (state) => Math.ceil(1000 * 1.3 ** Math.floor(state.factories / 5));
// Un lot commencé garde ses usines réservées jusqu’à son achèvement.
export const freeFactories = (state) =>
  state.factories - state.lines.reduce((n, line) => n + Math.max(line.factories, line.batch), 0);
// Limiter le lot aux usines, aux matières disponibles et à la place en stock.
export const productionBatch = (state, product, line) =>
  Math.max(
    0,
    Math.min(
      line.factories,
      9999 - line.stock,
      ...Object.entries(product.recipe).map(([id, n]) => Math.floor(state.resources[id] / n)),
    ),
  );
export const capacity = (state, resource = RESOURCES[0]) =>
  Math.ceil(5000 * RESOURCE_RATE_GROWTH ** resource.tier) *
  (state.tech.includes('logistics') ? 2 : 1);
export const HIRE_COST = 25,
  WAGE = 2,
  PAY_PERIOD = 60;
// Arrondir le prix final seulement, pour conserver la progression prévue.
export const hireCost = (state, resource) =>
  Math.ceil(HIRE_COST * 1.3 ** state.workers[resource.id].length);
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
  unlocked(state, resource)
    ? resource.rate *
      state.levels[resource.id] *
      activeWorkers(state, resource) *
      (state.country === 'su' ? 1.15 : 1) *
      (state.tech.includes('steam') ? 1.2 : 1) *
      (state.tech.includes('logistics') ? 1.25 : 1)
    : 0;
export const upgradeCost = (state, resource) =>
  Math.ceil(resource.cost * 1.65 ** state.levels[resource.id]);
export const researchTime = (state, t) => t.time / (state.country === 'fr' ? 1.15 : 1);
export const productTime = (state, product) =>
  product.time / (state.country === 'us' ? 1.15 : 1) / (state.tech.includes('assembly') ? 1.25 : 1);
export const salePrice = (state, product) =>
  Math.ceil(
    product.value *
      (state.country === 'de' ? 1.15 : 1) *
      (state.tech.includes('series') ? 1.25 : 1),
  );
export const affordable = (state, cost) =>
  Object.entries(cost).every(([k, v]) => state.resources[k] >= v);
// Fait avancer salaires, récolte, recherches et production, au maximum sur huit heures.
export function advance(state, seconds) {
  let left = Math.max(0, Math.min(28800, Number(seconds) || 0));
  while (left > 1e-8) {
    // Le salaire finance une minute ; sans or, l’ouvrier attend le prochain paiement.
    for (const resource of RESOURCES)
      for (let i = 0; i < state.workers[resource.id].length; i++)
        if (state.workers[resource.id][i] <= 1e-8 && state.credits >= WAGE) {
          state.credits -= WAGE;
          state.workers[resource.id][i] = PAY_PERIOD;
        }
    const remaining = Object.values(state.workers)
      .flat()
      .filter((t) => t > 1e-8);
    const dt = Math.min(1, left, ...remaining);
    left -= dt;
    state.elapsed += dt;
    for (const resource of RESOURCES)
      state.resources[resource.id] = Math.min(
        capacity(state, resource),
        state.resources[resource.id] + rate(state, resource) * dt,
      );
    for (const resource of RESOURCES)
      state.workers[resource.id] = state.workers[resource.id].map((t) => Math.max(0, t - dt));
    if (state.research) {
      state.research.remaining -= dt;
      if (state.research.remaining <= 0) {
        state.tech.push(state.research.id);
        state.research = null;
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
          for (const [id, n] of Object.entries(product.recipe)) state.resources[id] -= n * batch;
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
  }
  return state;
}
// Valide une action avant de dépenser ses coûts. Renvoie false si elle est impossible.
export function act(state, type, id) {
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
    state.resources[id] = Math.min(capacity(state, resource), state.resources[id] + 1);
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
      state.credits < hireCost(state, resource) + WAGE
    )
      return false;
    state.credits -= hireCost(state, resource) + WAGE;
    state.workers[id].push(PAY_PERIOD);
    return true;
  }
  if (type === 'dismiss') {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (!resource || !state.workers[id].length) return false;
    state.workers[id].pop();
    return true;
  }
  if (['sell-resource', 'sell-ten', 'sell-all'].includes(type)) {
    const resource = RESOURCES.find((resource) => resource.id === id);
    if (!resource) return false;
    const amount =
      type === 'sell-all' ? Math.floor(state.resources[id]) : type === 'sell-ten' ? 10 : 1;
    if (amount <= 0 || state.resources[id] < amount) return false;
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
  const unique = (a) => new Set(a).size === a.length;
  if (
    !state ||
    ![1, 2, 3, 4, 5, 6].includes(state.version) ||
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
          !(key === 'patents' && state.version >= 5 ? PATENTS : TECHS).some((t) => t.id === id),
      )
    )
      throw Error('Technologies invalides');
  if (
    state.tech.some(
      (id) => !TECHS.find((t) => t.id === id).requires.every((k) => state.tech.includes(k)),
    ) ||
    state.patents.some(
      (id) =>
        !state.tech.includes(
          state.version >= 5 ? PRODUCTS.find((product) => product.id === id).unlock : id,
        ),
    )
  )
    throw Error('Progression incohérente');
  if (
    state.research &&
    (!TECHS.some((t) => t.id === state.research.id) ||
      state.tech.includes(state.research.id) ||
      !finite(state.research.remaining, 200) ||
      !TECHS.find((t) => t.id === state.research.id).requires.every((k) => state.tech.includes(k)))
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
      for (const parent of TECHS.find((t) => t.id === id).requires) grant(parent);
      if (!state.tech.includes(id)) state.tech.push(id);
    };
    for (const id of state.patents) grant(PRODUCTS.find((product) => product.id === id).unlock);
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
  return state;
}
