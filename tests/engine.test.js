// Vérifie les règles, les coûts, les sauvegardes et la progression des cinq nations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  productionRecipe,
  armyStats,
  serializeSave,
  FRONT_ITEMS,
  takeAssaultWarning,
  enemyPower,
  factoryCost,
  storageUpgradeCost,
  freeFactories,
  productionUnlocked,
  productionRequirements,
  productName,
  PRODUCT_NAMES,
  MARKET_PRICES,
  capacity,
  available,
  upgradeCost,
  COUNTRIES,
  PRODUCTS,
  researchTime,
  productTime,
  salePrice,
  hireCost,
  workerWage,
  workerMultiplier,
  autoSalesUnlocked,
  newGame,
  act,
  advance,
  RESOURCES,
  rate,
  validateSave,
  TECHS,
  PATENTS,
} from '../dist/engine.js';
function legacyLines() {
  return ['rifle', 'truck', 'tank'].map((id) => ({
    id,
    enabled: false,
    remaining: 0,
    stock: 0,
    made: 0,
  }));
}
function grant(s, id) {
  for (const parent of TECHS.find((t) => t.id === id).requires) grant(s, parent);
  if (!s.tech.includes(id)) s.tech.push(id);
}
function permit(s, id = 'uniform') {
  s.tech = [];
  grant(s, PRODUCTS.find((p) => p.id === id).unlock);
  s.patents = [id];
  s.lines.find((l) => l.id === id).licensed = true;
  s.factories = 1;
  s.lines.find((l) => l.id === id).factories = 1;
  return s;
}
function established(country) {
  const s = newGame(country);
  s.credits = 700;
  Object.assign(s.resources, { coal: 70, cotton: 100, wood: 100, iron: 90 });
  s.levels.cotton = 1;
  s.levels.wood = 1;
  s.levels.iron = 1;
  return s;
}

test('Each nation gets only its own 15 percent bonus', () => {
  for (const id of Object.keys(COUNTRIES)) {
    const s = established(id);
    act(s, 'hire', 'coal');
    assert.ok(Math.abs(rate(s, RESOURCES[0]) - 0.4 * (id === 'su' ? 1.15 : 1)) < 1e-10);
    assert.equal(researchTime(s, TECHS[0]), 30 / (id === 'fr' ? 1.15 : 1));
    assert.equal(productTime(s, PRODUCTS[0]), 8 / (id === 'us' ? 1.15 : 1));
    assert.equal(salePrice(s, PRODUCTS[0]), id === 'de' ? 17 : 14);
    const gold = s.credits;
    s.resources.coal = 1;
    act(s, 'sell-resource', 'coal');
    assert.equal(s.credits, gold + 1);
    grant(s, 'series');
    assert.equal(salePrice(s, PRODUCTS[0]), Math.ceil(14 * 1.25 * (id === 'de' ? 1.15 : 1)));
    assert.doesNotThrow(() => validateSave(s));
  }
  const us = permit(established('us')),
    de = permit(established('de'));
  act(us, 'toggle', 'uniform');
  act(de, 'toggle', 'uniform');
  advance(us, 7);
  advance(de, 7);
  assert.equal(us.lines[0].stock, 1);
  assert.equal(de.lines[0].stock, 0);
});
test('Production consumes one recipe at cycle start, then sale pays once', () => {
  const s = permit(established('fr'));
  assert.ok(act(s, 'toggle', 'uniform'));
  advance(s, 1);
  assert.equal(s.resources.cotton, 96);
  assert.equal(s.resources.coal, 68);
  advance(s, 7);
  assert.equal(s.lines[0].stock, 1);
  assert.equal(s.resources.cotton, 96);
  act(s, 'sell', 'uniform');
  assert.equal(s.credits, 714);
  assert.equal(s.totalSold, 1);
  assert.equal(act(s, 'sell', 'uniform'), false);
});
test('Blocked actions never spend funds', () => {
  let s = established('fr');
  assert.equal(act(s, 'research', 'series'), false);
  assert.equal(act(s, 'patent', 'steam'), false);
  assert.equal(act(s, 'upgrade', 'platinum'), false);
  assert.equal(s.credits, 700);
});
test('Research and a paid patent are both required, with no recurring income', () => {
  const s = established('fr');
  assert.equal(act(s, 'patent', 'uniform'), false);
  assert.ok(act(s, 'research', 'sewing'));
  assert.equal(act(s, 'patent', 'uniform'), false);
  advance(s, 27);
  assert.equal(act(s, 'toggle', 'uniform'), false);
  s.credits = 74;
  assert.equal(act(s, 'patent', 'uniform'), false);
  s.credits = 75;
  assert.ok(act(s, 'patent', 'uniform'));
  assert.equal(s.credits, 0);
  assert.equal(act(s, 'patent', 'uniform'), false);
  assert.ok(productionUnlocked(s, PRODUCTS[0]));
  advance(s, 60);
  assert.equal(s.credits, 0);
  assert.deepEqual(validateSave(s), s);
});

test('Offline calculation matches one-second simulation and caps at 8 hours', () => {
  let a = permit(established('de'));
  act(a, 'toggle', 'uniform');
  act(a, 'research', 'steam');
  let b = structuredClone(a);
  advance(a, 600);
  for (let i = 0; i < 600; i++) advance(b, 1);
  assert.deepEqual(a, b);
  let c = permit(established('fr'));
  advance(c, 999999);
  assert.equal(c.elapsed, 28800);
  assert.ok(c.resources.wood <= 5000);
});
test('Pausing preserves in-flight work without consuming extra inputs', () => {
  const s = permit(established('fr'));
  act(s, 'toggle', 'uniform');
  advance(s, 3);
  act(s, 'toggle', 'uniform');
  const stock = structuredClone(s.resources);
  advance(s, 20);
  assert.equal(s.lines[0].remaining, 5);
  assert.deepEqual(s.resources, stock);
  act(s, 'toggle', 'uniform');
  advance(s, 5);
  assert.equal(s.lines[0].stock, 1);
});
test('Save validation rejects malformed and malicious data', () => {
  let s = established('fr');
  assert.deepEqual(validateSave(JSON.stringify(s)), s);
  assert.throws(() => validateSave('{}'));
  s.credits = -1;
  assert.throws(() => validateSave(s));
  s = established('fr');
  s.tech = ['steam', 'steam'];
  assert.throws(() => validateSave(s));
  s = established('fr');
  s.country = '<img>';
  assert.throws(() => validateSave(s));
  s = established('fr');
  s.lines[0].remaining = Infinity;
  assert.throws(() => validateSave(s));
});
test('Complete production progression is reachable for every nation', () => {
  for (const country of Object.keys(COUNTRIES)) {
    const s = newGame(country);
    s.credits = 1e11;
    for (const r of RESOURCES) s.resources[r.id] = 4000;
    for (const t of TECHS) {
      for (const r of RESOURCES) s.resources[r.id] = 4000;
      assert.ok(act(s, 'research', t.id));
      advance(s, 200);
    }
    for (const r of RESOURCES) {
      if (!s.levels[r.id]) assert.ok(act(s, 'upgrade', r.id));
      s.resources[r.id] = 4000;
    }
    s.factories = 19;
    for (const p of PRODUCTS) {
      assert.ok(act(s, 'patent', p.id));
      assert.ok(act(s, 'assign-factory', p.id));
      assert.ok(productionUnlocked(s, p));
      assert.ok(act(s, 'toggle', p.id));
      advance(s, productTime(s, p));
      act(s, 'toggle', p.id);
      assert.equal(s.lines.find((l) => l.id === p.id).made, 1);
    }
    assert.ok(s.lines.every((l) => l.made === 1));
    assert.deepEqual(validateSave(s), s);
  }
});

test('New game starts with only manual coal and empty treasury', () => {
  const s = newGame('su');
  assert.equal(s.credits, 0);
  assert.equal(s.levels.coal, 1);
  advance(s, 600);
  assert.ok(Object.values(s.resources).every((n) => n === 0));
  assert.ok(act(s, 'harvest', 'coal'));
  assert.equal(s.resources.coal, 1);
  for (const id of ['wood', 'iron', 'platinum', 'rubber']) {
    assert.equal(act(s, 'harvest', id), false);
    assert.equal(act(s, 'hire', id), false);
  }
});
test('Manual sales fund the first worker and new sites', () => {
  const s = newGame('fr');
  for (let i = 0; i < 37; i++) act(s, 'harvest', 'coal');
  assert.ok(act(s, 'sell-all', 'coal'));
  assert.equal(s.credits, 37);
  assert.ok(act(s, 'hire', 'coal'));
  assert.equal(s.credits, 0);
  advance(s, 60);
  assert.ok(Math.abs(s.resources.coal - 24) < 1e-8);
  const stock = s.resources.coal;
  advance(s, 60);
  assert.equal(s.resources.coal, stock);
  assert.equal(s.credits, 0);
  assert.ok(act(s, 'sell-all', 'coal'));
  advance(s, 1);
  assert.equal(s.credits, 12);
  assert.equal(s.resources.coal, 0);
  assert.ok(s.harvestProgress.coal > 0);
  s.credits = 350;
  assert.equal(act(s, 'upgrade', 'wood'), false);
  assert.ok(act(s, 'upgrade', 'cotton'));
  assert.ok(act(s, 'upgrade', 'wood'));
  assert.equal(s.credits, 0);
  assert.ok(act(s, 'harvest', 'wood'));
  assert.equal(s.resources.wood, 1);
  assert.equal(rate(s, RESOURCES[1]), 0);
});
test('Hiring, wages, dismissal and full stores cannot create unpaid labor', () => {
  const s = newGame('fr');
  s.credits = 26;
  assert.equal(act(s, 'hire', 'coal'), false);
  assert.equal(s.credits, 26);
  s.credits = 100;
  act(s, 'hire', 'coal');
  act(s, 'hire', 'coal');
  assert.equal(s.credits, 18);
  s.resources.coal = capacity(s, RESOURCES[0]);
  advance(s, 61);
  assert.equal(s.credits, 18);
  assert.equal(s.resources.coal, 500);
  assert.equal(act(s, 'harvest', 'coal'), false);
  act(s, 'dismiss', 'coal');
  act(s, 'dismiss', 'coal');
  advance(s, 120);
  assert.equal(s.credits, 18);
  assert.equal(act(s, 'dismiss', 'coal'), false);
});
test('Market respects unit prices, whole units, and available inventory', () => {
  const s = newGame('fr');
  s.resources.iron = 10.5;
  assert.ok(act(s, 'sell-ten', 'iron'));
  assert.equal(s.credits, 10 * MARKET_PRICES.iron);
  assert.equal(s.resources.iron, 0.5);
  assert.equal(act(s, 'sell-all', 'iron'), false);
  assert.equal(act(s, 'sell-resource', 'iron'), false);
  assert.equal(act(s, 'sell-all', 'bad-id'), false);
  s.resources.nickel = 3.5;
  assert.ok(act(s, 'sell-all', 'nickel'));
  assert.equal(s.credits, 10 * MARKET_PRICES.iron + 3 * MARKET_PRICES.nickel);
  assert.equal(s.resources.nickel, 0.5);
});
test('Payroll is identical offline and in quarter-second updates', () => {
  const a = newGame('fr');
  a.credits = 45;
  act(a, 'hire', 'coal');
  const b = structuredClone(a);
  advance(a, 800);
  for (let i = 0; i < 3200; i++) advance(b, 0.25);
  assert.equal(a.credits, b.credits);
  assert.deepEqual(a.workers, b.workers);
  assert.ok(Math.abs(a.resources.coal - b.resources.coal) < 1e-7);
});
test('Save migration preserves legacy assets and validates new payroll', () => {
  const old = established('fr');
  old.version = 1;
  old.lines = legacyLines();
  old.resources.platinum = 0;
  old.levels.platinum = 0;
  delete old.workers;
  const migrated = validateSave(old);
  assert.equal(migrated.version, 12);
  assert.equal(migrated.credits, 700);
  assert.equal(migrated.resources.wood, 100);
  assert.equal(rate(migrated, RESOURCES[0]), 0);
  const s = newGame('fr');
  s.credits = 100;
  act(s, 'hire', 'coal');
  advance(s, 12.25);
  assert.deepEqual(validateSave(s), s);
  for (const value of [-1, 61, Infinity, '60']) {
    const invalid = structuredClone(s);
    invalid.workers.coal = [value];
    assert.throws(() => validateSave(invalid));
  }
  const invalid = structuredClone(s);
  invalid.workers.wood = [60];
  assert.throws(() => validateSave(invalid));
  const missing = structuredClone(s);
  delete missing.workers;
  assert.throws(() => validateSave(missing));
});

test('Hiring scales per site while salaries stay fixed', () => {
  const s = newGame('fr');
  s.credits = 1000;
  const coal = RESOURCES[0],
    wood = RESOURCES[1];
  for (const price of [25, 33, 43, 55]) {
    assert.equal(hireCost(s, coal), price);
    const before = s.credits;
    assert.ok(act(s, 'hire', 'coal'));
    assert.equal(before - s.credits, price + workerWage(coal));
  }
  assert.equal(hireCost(s, wood), 38);
  const before = s.credits;
  advance(s, 61);
  assert.equal(before - s.credits, 48);
  const saved = validateSave(s);
  assert.equal(hireCost(saved, coal), hireCost(s, coal));
  act(s, 'dismiss', 'coal');
  assert.equal(hireCost(s, coal), 55);
  s.credits = 66;
  const crew = structuredClone(s.workers.coal);
  assert.equal(act(s, 'hire', 'coal'), false);
  assert.equal(s.credits, 66);
  assert.deepEqual(s.workers.coal, crew);
  s.credits = 67;
  assert.ok(act(s, 'hire', 'coal'));
  assert.equal(s.credits, 0);
});

test('All twelve sites open in order with x2.5 costs and x1.5 sale prices', () => {
  assert.deepEqual(
    RESOURCES.map((r) => r.id),
    [
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
      'bauxite',
    ],
  );
  const s = newGame('fr');
  s.credits = 1e11;
  for (let i = 1; i < RESOURCES.length; i++) {
    const r = RESOURCES[i],
      previous = RESOURCES[i - 1];
    for (const later of RESOURCES.slice(i + 1)) assert.equal(available(s, later), false);
    assert.equal(r.cost, Math.ceil(100 * 2.5 ** (i - 1)));
    assert.equal(MARKET_PRICES[r.id], Math.ceil(1.5 ** i));
    assert.ok(act(s, 'upgrade', r.id));
    assert.ok(act(s, 'harvest', r.id));
    assert.equal(s.resources[r.id], 1);
    assert.ok(act(s, 'hire', r.id));
    assert.ok(rate(s, r) > 0);
    assert.equal(capacity(s, r), 500);
  }
  assert.deepEqual(validateSave(s), s);
});
test('Version 2 migration retains workers, converts platinum, and preserves accessible legacy sites', () => {
  const old = newGame('fr');
  old.version = 2;
  old.lines = legacyLines();
  old.credits = 10;
  old.resources = { coal: 12, wood: 30, iron: 40, rubber: 5, platinum: 7 };
  old.levels = { coal: 1, wood: 2, iron: 1, rubber: 1, platinum: 1 };
  old.workers = { coal: [40], wood: [25], iron: [], rubber: [], platinum: [12] };
  const s = validateSave(old);
  assert.equal(s.version, 12);
  assert.equal(s.credits, 52);
  assert.equal(s.resources.cotton, 0);
  assert.equal(s.resources.wood, 30);
  assert.deepEqual(s.workers.coal, [40, 12]);
  assert.deepEqual(s.workers.wood, [25]);
  assert.ok(act(s, 'harvest', 'wood'));
  assert.equal('platinum' in s.resources, false);
  assert.deepEqual(validateSave(s), s);
  old.resources.platinum = -1;
  assert.throws(() => validateSave(old));
});
test('Resource sales round up and late-game capacity survives save/load', () => {
  const s = newGame('us');
  s.resources.cotton = 1;
  act(s, 'sell-resource', 'cotton');
  assert.equal(s.credits, 2);
  const r = RESOURCES.at(-1);
  s.levels[r.id] = 1;
  s.workers[r.id] = [60];
  s.storageLevels[r.id] = 5;
  s.resources[r.id] = 10000;
  s.credits = 100;
  advance(s, 60);
  assert.ok(s.resources.bauxite > 10000);
  assert.ok(s.resources.bauxite < capacity(s, r));
  assert.deepEqual(validateSave(s), s);
});

test('All transaction prices round upward and batch sales equal individual sales', () => {
  const a = newGame('fr'),
    b = newGame('fr');
  for (const r of RESOURCES) {
    assert.equal(MARKET_PRICES[r.id], Math.ceil(1.5 ** r.tier));
    a.resources[r.id] = 10;
    b.resources[r.id] = 10;
    act(a, 'sell-ten', r.id);
    for (let i = 0; i < 10; i++) act(b, 'sell-resource', r.id);
    assert.equal(a.credits, b.credits);
    assert.ok(Number.isInteger(a.credits));
    a.levels[r.id] = 3;
    assert.equal(upgradeCost(a, r), Math.ceil(r.cost * 1.65 ** 3));
  }
  for (const country of Object.keys(COUNTRIES))
    for (const p of PRODUCTS) {
      const s = newGame(country);
      s.tech.push('series');
      assert.equal(salePrice(s, p), Math.ceil(p.value * (country === 'de' ? 1.15 : 1) * 1.25));
    }
});

test('Nineteen categories have five named national variants and positive-margin recipes', () => {
  assert.deepEqual(
    PRODUCTS.map((p) => p.id),
    [
      'uniform',
      'support',
      'pistol_ammo',
      'pistol',
      'grenade',
      'rifle_ammo',
      'rifle',
      'machine_gun',
      'shell',
      'artillery',
      'jeep',
      'truck',
      'halftrack',
      'light_tank',
      'medium_tank',
      'heavy_tank',
      'recon',
      'fighter',
      'bomber',
    ],
  );
  for (const country of Object.keys(COUNTRIES)) {
    assert.equal(PRODUCT_NAMES[country].length, 19);
    for (const p of PRODUCTS) {
      assert.ok(productName(newGame(country), p));
      const raw = Object.entries(p.recipe).reduce((sum, [id, n]) => sum + MARKET_PRICES[id] * n, 0);
      assert.ok(p.value > raw);
    }
  }
});
test('Production gates previous item, resource sites and research separately', () => {
  const s = established('fr');
  const pistol = PRODUCTS.find((p) => p.id === 'pistol');
  assert.equal(act(s, 'toggle', 'support'), false);
  assert.equal(act(s, 'toggle', 'pistol'), false);
  s.lines[0].made = 1;
  grant(s, 'confection');
  assert.equal(productionUnlocked(s, PRODUCTS[1]), false);
  assert.ok(act(s, 'patent', 'support'));
  assert.ok(productionUnlocked(s, PRODUCTS[1]));
  s.tech = [];
  s.lines[2].made = 1;
  s.levels.copper = 1;
  assert.ok(productionRequirements(s, pistol).some((x) => x.startsWith('Recherche')));
  grant(s, 'precision');
  s.credits = 10000;
  assert.ok(act(s, 'patent', 'pistol'));
  assert.ok(productionUnlocked(s, pistol));
  s.levels.iron = 0;
  assert.equal(productionUnlocked(s, pistol), false);
});
test('Shortages wait without spending and resume after supply', () => {
  const s = permit(established('fr'));
  s.resources.cotton = 0;
  act(s, 'toggle', 'uniform');
  advance(s, 20);
  assert.equal(s.lines[0].made, 0);
  assert.equal(s.resources.coal, 70);
  s.resources.cotton = 4;
  advance(s, 8);
  assert.equal(s.lines[0].stock, 1);
  assert.equal(s.resources.cotton, 0);
  advance(s, 20);
  assert.equal(s.lines[0].stock, 1);
});
test('Full finished stock pauses consumption until a sale', () => {
  const s = permit(established('fr'));
  s.lines[0].stock = 9999;
  act(s, 'toggle', 'uniform');
  advance(s, 20);
  assert.equal(s.resources.coal, 70);
  act(s, 'sell', 'uniform');
  advance(s, 8);
  assert.equal(s.lines[0].stock, 1);
});
test('Production timing carries fractional seconds consistently across updates', () => {
  const a = permit(established('us'));
  grant(a, 'assembly');
  act(a, 'toggle', 'uniform');
  const b = structuredClone(a);
  advance(a, 70);
  for (let i = 0; i < 280; i++) advance(b, 0.25);
  assert.equal(a.lines[0].made, b.lines[0].made);
  assert.ok(Math.abs(a.lines[0].remaining - b.lines[0].remaining) < 1e-7);
  assert.deepEqual(a.resources, b.resources);
});
test('Version 3 line migration preserves stock, in-flight work and old unlocks', () => {
  const old = established('fr');
  old.version = 3;
  old.lines = legacyLines();
  old.lines[0] = { id: 'rifle', enabled: true, remaining: 5, stock: 7, made: 12 };
  old.lines[2].stock = 2;
  const s = validateSave(old);
  assert.equal(s.version, 12);
  assert.equal(s.lines.length, 19);
  const rifle = s.lines.find((l) => l.id === 'rifle');
  assert.equal(rifle.stock, 7);
  assert.equal(rifle.remaining, 5);
  assert.equal(rifle.licensed, true);
  assert.equal(s.lines.find((l) => l.id === 'medium_tank').stock, 2);
  advance(s, 5);
  assert.equal(rifle.stock, 8);
  assert.equal(s.lines[0].made, 0);
  assert.deepEqual(validateSave(s), s);
});
test('Production save validation rejects missing, duplicated, unknown or malformed lines', () => {
  for (const mutate of [
    (s) => s.lines.pop(),
    (s) => (s.lines[1].id = s.lines[0].id),
    (s) => (s.lines[0].id = 'unknown'),
    (s) => (s.lines[0].licensed = 'yes'),
    (s) => (s.lines[0].remaining = 301),
  ]) {
    const s = newGame('fr');
    mutate(s);
    assert.throws(() => validateSave(s));
  }
});

test('Version 4 migration refunds royalty certificates once and preserves acquired lines', () => {
  const old = established('fr');
  old.version = 4;
  old.tech = ['steam'];
  old.patents = ['steam'];
  old.lines[0].licensed = true;
  old.lines[0].made = 3;
  old.lines[0].stock = 2;
  const s = validateSave(old);
  assert.equal(s.version, 12);
  assert.equal(s.credits, 950);
  assert.deepEqual(s.patents, ['uniform']);
  assert.equal(s.lines[0].stock, 2);
  assert.ok(productionUnlocked(s, PRODUCTS[0]));
  assert.deepEqual(validateSave(s), s);
  const fresh = newGame('fr');
  fresh.version = 4;
  assert.deepEqual(validateSave(fresh).patents, []);
});
test('New saves cannot bypass licenses or research with the legacy flag', () => {
  const s = newGame('fr');
  s.lines[0].licensed = true;
  assert.equal(productionUnlocked(s, PRODUCTS[0]), false);
  assert.throws(() => validateSave(s));
  s.patents = ['uniform'];
  assert.throws(() => validateSave(s));
});

test('Research consumes exact materials once, never gold, and rejects missing materials atomically', () => {
  for (const t of TECHS) {
    const s = newGame('fr');
    s.tech = TECHS.filter((x) => x.id !== t.id).map((x) => x.id);
    s.credits = 0;
    for (const [id, n] of Object.entries(t.cost)) s.resources[id] = n;
    const missing = Object.keys(t.cost).at(-1);
    s.resources[missing] -= 1;
    const before = structuredClone(s);
    assert.equal(act(s, 'research', t.id), false);
    assert.deepEqual(s, before);
    s.resources[missing]++;
    assert.ok(act(s, 'research', t.id));
    assert.equal(s.credits, 0);
    for (const id of Object.keys(t.cost)) assert.equal(s.resources[id], 0);
    const paid = structuredClone(s);
    assert.equal(act(s, 'research', t.id), false);
    assert.deepEqual(s, paid);
    advance(s, 200);
    assert.ok(s.tech.includes(t.id));
    assert.equal(s.credits, 0);
    assert.equal(act(s, 'research', t.id), false);
  }
});
test('Existing research continues on load without charging resources again', () => {
  const s = newGame('fr');
  s.research = { id: 'steam', remaining: 10 };
  const loaded = validateSave(s);
  advance(loaded, 10);
  assert.ok(loaded.tech.includes('steam'));
  assert.equal(loaded.credits, 0);
  assert.ok(Object.values(loaded.resources).every((n) => n === 0));
});

test('Factory prices rise every five purchases and unassigned lines cannot run', () => {
  const s = newGame('fr');
  s.credits = 100000;
  for (let i = 0; i < 16; i++) {
    const price = Math.ceil(1000 * 1.3 ** Math.floor(i / 5));
    assert.equal(factoryCost(s), price);
    const before = s.credits;
    assert.ok(act(s, 'buy-factory'));
    assert.equal(s.credits, before - price);
  }
  assert.equal(freeFactories(s), 16);
  assert.equal(act(s, 'assign-factory', 'uniform'), false);
  s.tech = ['sewing'];
  act(s, 'patent', 'uniform');
  s.levels.cotton = 1;
  assert.equal(act(s, 'toggle', 'uniform'), false);
  assert.ok(act(s, 'assign-factory', 'uniform'));
  assert.ok(act(s, 'toggle', 'uniform'));
  assert.ok(act(s, 'release-factory', 'uniform'));
  assert.equal(s.lines[0].enabled, false);
  s.credits = 0;
  const before = s.factories;
  assert.equal(act(s, 'buy-factory'), false);
  assert.equal(s.factories, before);
});
test('Factories produce paid batches, reserve factories during cycles and respect shortages', () => {
  const s = permit(established('fr'));
  s.factories = 3;
  act(s, 'assign-factory', 'uniform');
  act(s, 'assign-factory', 'uniform');
  assert.equal(freeFactories(s), 0);
  assert.equal(act(s, 'assign-factory', 'uniform'), false);
  act(s, 'toggle', 'uniform');
  advance(s, 1);
  assert.equal(s.resources.cotton, 88);
  assert.equal(s.lines[0].batch, 3);
  assert.ok(act(s, 'release-factory', 'uniform'));
  assert.equal(freeFactories(s), 0);
  assert.ok(act(s, 'assign-factory', 'uniform'));
  act(s, 'toggle', 'uniform');
  advance(s, 20);
  assert.equal(s.lines[0].remaining, 7);
  act(s, 'toggle', 'uniform');
  advance(s, 7);
  assert.equal(s.lines[0].stock, 3);
  assert.equal(s.lines[0].made, 3);
  assert.equal(s.lines[0].batch, 0);
  assert.ok(act(s, 'release-factory', 'uniform'));
  s.resources.cotton = 4;
  advance(s, 8);
  assert.equal(s.lines[0].stock, 4);
  assert.equal(s.resources.cotton, 0);
  assert.deepEqual(validateSave(s), s);
});
test('Factory batches survive save and offline updates without overfilling stocks', () => {
  const a = permit(established('us'));
  a.factories = 3;
  a.lines[0].factories = 3;
  a.lines[0].stock = 9998;
  act(a, 'toggle', 'uniform');
  advance(a, 1);
  assert.equal(a.lines[0].batch, 1);
  const b = validateSave(a);
  advance(a, 30);
  for (let i = 0; i < 120; i++) advance(b, 0.25);
  assert.equal(a.lines[0].stock, 9999);
  assert.equal(a.lines[0].stock, b.lines[0].stock);
  assert.deepEqual(a.resources, b.resources);
});
test('Factory migration preserves ongoing work and rejects over-allocation', () => {
  const old = permit(established('fr'));
  old.version = 5;
  old.tech = ['steam'];
  old.lines[0].remaining = 3;
  old.lines[0].enabled = true;
  delete old.factories;
  for (const l of old.lines) {
    delete l.factories;
    delete l.batch;
  }
  const s = validateSave(old);
  assert.equal(s.factories, 2);
  assert.equal(s.lines[0].batch, 1);
  advance(s, 3);
  assert.equal(s.lines[0].stock, 1);
  assert.deepEqual(validateSave(s), s);
  for (const mutate of [
    (s) => (s.factories = -1),
    (s) => (s.lines[0].factories = 2),
    (s) => (s.lines[0].batch = 2),
    (s) => (s.factories = 1.5),
  ]) {
    const bad = permit(established('fr'));
    mutate(bad);
    assert.throws(() => validateSave(bad));
  }
});

test('Reassigned factories remain reserved until their paid batch finishes', () => {
  const s = permit(established('fr'));
  act(s, 'toggle', 'uniform');
  advance(s, 1);
  assert.ok(act(s, 'release-factory', 'uniform'));
  assert.equal(s.lines[0].factories, 0);
  assert.ok(act(s, 'toggle', 'uniform'));
  assert.ok(act(s, 'toggle', 'uniform'));
  assert.equal(freeFactories(s), 0);
  assert.deepEqual(validateSave(s), s);
  advance(s, 7);
  assert.equal(s.lines[0].stock, 1);
  assert.equal(s.lines[0].enabled, false);
  assert.equal(freeFactories(s), 1);
  assert.deepEqual(validateSave(s), s);
});

test('Technology graph has unique positions, no cycles and all equipment prerequisites', () => {
  assert.equal(TECHS.length, 29);
  assert.equal(new Set(TECHS.map((t) => t.id)).size, 29);
  assert.equal(new Set(TECHS.map((t) => `${t.col},${t.row}`)).size, 29);
  const visit = (id, path = []) => {
    assert.ok(!path.includes(id));
    const tech = TECHS.find((t) => t.id === id);
    assert.ok(tech);
    for (const parent of tech.requires) {
      assert.ok(TECHS.find((t) => t.id === parent).row < tech.row);
      visit(parent, [...path, id]);
    }
  };
  for (const tech of TECHS) {
    visit(tech.id);
    for (const [id, n] of Object.entries(tech.cost)) {
      assert.ok(RESOURCES.some((r) => r.id === id));
      assert.ok(Number.isInteger(n) && n > 0);
    }
  }
  assert.equal(PRODUCTS[0].unlock, 'sewing');
  assert.equal(new Set(PRODUCTS.map((p) => p.unlock)).size, 19);
  for (const product of PRODUCTS) visit(product.unlock);
});
test('Optional industrial research applies speed, material and sale bonuses independently', () => {
  const s = permit(established('us')),
    p = PRODUCTS[0];
  const original = structuredClone(p.recipe),
    baseTime = productTime(s, p),
    baseSale = salePrice(s, p);
  grant(s, 'electricity');
  assert.equal(productTime(s, p), baseTime / 1.15);
  grant(s, 'assembly');
  assert.ok(Math.abs(productTime(s, p) - baseTime / 1.15 / 1.25) < 1e-10);
  grant(s, 'tooling');
  assert.equal(productionRecipe(s, p).cotton, 3.6);
  s.resources.cotton = 3.6;
  s.resources.coal = 1.8;
  assert.ok(act(s, 'toggle', 'uniform'));
  advance(s, productTime(s, p));
  assert.equal(s.lines[0].stock, 1);
  assert.ok(s.resources.cotton < 1e-8);
  assert.deepEqual(p.recipe, original);
  assert.equal(salePrice(s, p), baseSale);
  grant(s, 'series');
  assert.equal(salePrice(s, p), Math.ceil(p.value * 1.25));
  assert.deepEqual(validateSave(s), s);
});
test('Version 6 technology migration preserves owned equipment and paid work', () => {
  const old = newGame('fr');
  old.version = 6;
  old.tech = ['steam'];
  old.patents = ['uniform'];
  old.lines[0].licensed = true;
  old.lines[0].factories = 1;
  old.factories = 1;
  old.lines[0].remaining = 4;
  old.lines[0].batch = 1;
  old.lines[0].enabled = true;
  old.research = { id: 'assembly', remaining: 20 };
  old.levels.cotton = 1;
  const next = validateSave(old);
  assert.equal(next.version, 12);
  assert.ok(next.tech.includes('sewing'));
  assert.ok(next.tech.includes('precision'));
  assert.ok(next.tech.includes('electricity'));
  assert.equal(next.research.remaining, 20);
  assert.equal(next.lines[0].remaining, 4);
  assert.equal(next.lines[0].batch, 1);
  assert.deepEqual(validateSave(next), next);
  advance(next, 20);
  assert.ok(next.tech.includes('assembly'));
  assert.equal(next.lines[0].stock, 1);
  const bad = structuredClone(old);
  bad.tech = ['assembly'];
  assert.throws(() => validateSave(bad));
});
test('Current saves reject a technology without its full prerequisites', () => {
  const s = newGame('fr');
  s.tech = ['multiengine'];
  assert.throws(() => validateSave(s));
  s.tech = ['sewing'];
  s.research = { id: 'aviation', remaining: 10 };
  assert.throws(() => validateSave(s));
});

test('Manual harvest increases with site upgrades and respects storage capacity', () => {
  for (const country of Object.keys(COUNTRIES)) {
    const s = newGame(country),
      coal = RESOURCES.find((r) => r.id === 'coal');
    s.credits = 100000;
    for (let level = 1; level <= 5; level++) {
      const before = s.resources.coal;
      assert.ok(act(s, 'harvest', 'coal'));
      assert.equal(s.resources.coal - before, level);
      if (level < 5) assert.ok(act(s, 'upgrade', 'coal'));
    }
    s.resources.coal = capacity(s, coal) - 2;
    assert.ok(act(s, 'harvest', 'coal'));
    assert.equal(s.resources.coal, capacity(s, coal));
    assert.equal(act(s, 'harvest', 'coal'), false);
    assert.equal(act(s, 'harvest', 'cotton'), false);
  }
});

test('Resource rank scales hiring and wages but all workers share the same base yield', () => {
  const s = newGame('fr');
  s.credits = 1e9;
  for (const r of RESOURCES) {
    s.levels[r.id] = 1;
    const wage = 12 * MARKET_PRICES[r.id];
    assert.equal(workerWage(r), wage);
    for (let count = 0; count < 2; count++) {
      const price = Math.ceil(25 * 1.5 ** r.tier * 1.3 ** count);
      assert.equal(hireCost(s, r), price);
      const before = s.credits;
      assert.ok(act(s, 'hire', r.id));
      assert.equal(before - s.credits, price + wage);
    }
    assert.equal(rate(s, r), 0.8);
  }
  const before = s.credits;
  advance(s, 61);
  assert.equal(
    before - s.credits,
    RESOURCES.reduce((sum, r) => sum + 2 * workerWage(r), 0),
  );
  for (const r of RESOURCES) assert.equal(s.resources[r.id], 48);
  assert.deepEqual(validateSave(s), s);
});

test('An expensive site waits for its own wage and resumes with enough gold', () => {
  const s = newGame('fr'),
    r = RESOURCES.at(-1);
  for (const site of RESOURCES) s.levels[site.id] = 1;
  s.workers[r.id] = [0];
  s.credits = workerWage(r) - 1;
  advance(s, 1);
  assert.equal(s.resources[r.id], 0);
  s.credits = workerWage(r);
  advance(s, 1);
  assert.equal(s.credits, 0);
  assert.equal(s.resources[r.id], 0);
  assert.equal(s.harvestProgress[r.id], 0.4);
});

test('Mixed resource wages and yields match offline and small-step simulation', () => {
  const a = newGame('su');
  a.credits = 1000;
  for (const r of RESOURCES) {
    a.levels[r.id] = 1;
    a.workers[r.id] = [12, 60];
  }
  const b = structuredClone(a);
  advance(a, 180);
  for (let i = 0; i < 720; i++) advance(b, 0.25);
  assert.equal(a.credits, b.credits);
  for (const r of RESOURCES) {
    assert.ok(Math.abs(a.resources[r.id] - b.resources[r.id]) < 1e-7);
    assert.deepEqual(a.workers[r.id], b.workers[r.id]);
  }
});

test('Custom resource sales charge exactly the chosen whole quantity and reject invalid requests', () => {
  const s = newGame('fr');
  s.resources.cotton = 25.75;
  for (const quantity of [0, -1, 1.5, 26, NaN, Infinity, '10', undefined]) {
    const before = structuredClone(s);
    assert.equal(act(s, 'sell-quantity', 'cotton', quantity), false);
    assert.deepEqual(s, before);
  }
  assert.equal(act(s, 'sell-quantity', 'missing', 1), false);
  assert.ok(act(s, 'sell-quantity', 'cotton', 17));
  assert.equal(s.resources.cotton, 8.75);
  assert.equal(s.credits, 17 * MARKET_PRICES.cotton);
  assert.ok(act(s, 'sell-quantity', 'cotton', 8));
  assert.equal(s.resources.cotton, 0.75);
});

test('Automatic harvesting credits whole units without losing partial work on save', () => {
  const s = newGame('fr');
  s.workers.coal = [60];
  for (let i = 0; i < 9; i++) {
    advance(s, 0.25);
    assert.equal(s.resources.coal, 0);
  }
  const loaded = validateSave(s);
  advance(loaded, 0.25);
  assert.equal(loaded.resources.coal, 1);
  advance(loaded, 57.5);
  assert.equal(loaded.resources.coal, 24);
  assert.ok(Number.isInteger(loaded.resources.coal));
  const old = newGame('fr');
  delete old.harvestProgress;
  old.resources.coal = 3.75;
  const migrated = validateSave(old);
  assert.equal(migrated.resources.coal, 3);
  assert.equal(migrated.harvestProgress.coal, 0.75);
  for (const bad of [NaN, -1, 1, Infinity]) {
    const invalid = structuredClone(s);
    invalid.harvestProgress.coal = bad;
    assert.throws(() => validateSave(invalid));
  }
});

test('New warehouses start at 500 per resource and upgrades are paid and independent', () => {
  const s = newGame('fr'),
    coal = RESOURCES[0],
    cotton = RESOURCES[1];
  for (const r of RESOURCES) assert.equal(capacity(s, r), 500);
  s.credits = 99;
  assert.equal(act(s, 'expand-storage', 'coal'), false);
  s.credits = 1000;
  assert.equal(act(s, 'expand-storage', 'cotton'), false);
  const cost = storageUpgradeCost(s, coal);
  assert.ok(act(s, 'expand-storage', 'coal'));
  assert.equal(s.credits, 1000 - cost);
  assert.equal(capacity(s, coal), 1000);
  assert.equal(capacity(s, cotton), 500);
  assert.ok(storageUpgradeCost(s, coal) > cost);
  assert.deepEqual(validateSave(s), s);
  const invalid = structuredClone(s);
  invalid.storageLevels.coal = -1;
  assert.throws(() => validateSave(invalid));
});

test('Old warehouses migrate without losing stock or previous capacity', () => {
  const s = newGame('fr');
  s.version = 7;
  delete s.storageLevels;
  s.resources.coal = 6200;
  const loaded = validateSave(s);
  assert.equal(loaded.resources.coal, 6200);
  for (const r of RESOURCES)
    assert.ok(capacity(loaded, r) >= Math.ceil(5000 * (5 / (1.5 * 1.3)) ** r.tier));
  assert.ok(capacity(loaded, RESOURCES[0]) >= 6200);
  assert.deepEqual(validateSave(loaded), loaded);
});

test('Full warehouses halve wages, preserve prepaid work and resume after selling', () => {
  const s = newGame('fr'),
    coal = RESOURCES[0];
  s.credits = 100;
  s.resources.coal = capacity(s, coal);
  assert.equal(workerWage(coal), 12);
  assert.equal(workerWage(coal, s), 6);
  assert.ok(act(s, 'hire', 'coal'));
  assert.equal(s.credits, 69);
  assert.equal(rate(s, coal), 0);
  advance(s, 60);
  assert.equal(s.resources.coal, 500);
  assert.equal(s.workers.coal[0], 0);
  advance(s, 10);
  assert.equal(s.credits, 63);
  assert.equal(s.workers.coal[0], 25);
  act(s, 'sell-quantity', 'coal', 100);
  assert.equal(workerWage(coal, s), 12);
  assert.equal(rate(s, coal), 0.4);
  advance(s, 25);
  assert.equal(s.resources.coal, 410);
  assert.equal(s.workers.coal[0], 0);
  advance(s, 1);
  assert.equal(s.credits, 151);
});

test('Filling a warehouse stretches prepaid wages equally online and offline', () => {
  const a = newGame('fr');
  a.credits = 1000;
  a.resources.coal = 499;
  act(a, 'hire', 'coal');
  const b = structuredClone(a);
  advance(a, 119);
  for (let i = 0; i < 476; i++) advance(b, 0.25);
  assert.equal(a.resources.coal, 500);
  assert.equal(a.credits, 957);
  assert.equal(a.credits, b.credits);
  assert.ok(Math.abs(a.workers.coal[0] - b.workers.coal[0]) < 1e-8);
  assert.deepEqual(validateSave(a), a);
  a.credits = 0;
  advance(a, 180);
  assert.equal(a.workers.coal[0], 0);
  assert.equal(a.resources.coal, 500);
});

test('Sewing awards one free factory and unlocks optional automatic sales', () => {
  const s = established('fr');
  assert.equal(autoSalesUnlocked(s), false);
  assert.equal(act(s, 'toggle-auto-sale', 'coal'), false);
  const credits = s.credits;
  assert.ok(act(s, 'research', 'sewing'));
  advance(s, 30);
  assert.equal(s.factories, 1);
  assert.equal(s.credits, credits);
  assert.equal(s.starterFactoryGranted, true);
  assert.ok(autoSalesUnlocked(s));
  assert.equal(factoryCost(s), 1000);
  advance(s, 60);
  assert.equal(validateSave(s).factories, 1);
  assert.ok(RESOURCES.every((r) => !s.autoSales[r.id].enabled));
});

test('Older saves receive the factory once without changing stocks or allocations', () => {
  const old = permit(established('fr'));
  old.version = 8;
  delete old.autoSales;
  delete old.starterFactoryGranted;
  const next = validateSave(old);
  assert.equal(next.factories, old.factories + 1);
  assert.deepEqual(next.resources, old.resources);
  assert.deepEqual(next.lines, old.lines);
  assert.deepEqual(validateSave(next), next);
  const empty = newGame('fr');
  empty.version = 8;
  assert.equal(validateSave(empty).factories, 0);
});

test('Paid crew milestones increase yield without increasing per-worker wages', () => {
  const s = newGame('fr'),
    coal = RESOURCES[0];
  for (const [count, bonus] of [
    [4, 1],
    [5, 1.25],
    [9, 1.25],
    [10, 1.5],
    [24, 1.5],
    [25, 2],
  ]) {
    s.workers.coal = Array(count).fill(60);
    assert.equal(workerMultiplier(count), bonus);
    assert.ok(Math.abs(rate(s, coal) - count * 0.4 * bonus) < 1e-8);
    assert.equal(workerWage(coal, s), 12);
  }
  s.workers.coal = [60, 60, 60, 60, 0];
  assert.equal(rate(s, coal), 1.6);
  s.resources.coal = 500;
  assert.equal(rate(s, coal), 0);
  assert.equal(workerWage(coal, s), 6);
});

test('Automatic sales respect reserves, site ownership, unlocks and whole units', () => {
  const s = newGame('fr');
  s.tech = ['sewing'];
  s.resources.coal = 150.5;
  assert.equal(act(s, 'toggle-auto-sale', 'cotton'), false);
  assert.ok(act(s, 'toggle-auto-sale', 'coal'));
  assert.ok(act(s, 'set-auto-reserve', 'coal', 120));
  for (const value of [-1, 501, NaN, Infinity, 1.5, '20'])
    assert.equal(act(s, 'set-auto-reserve', 'coal', value), false);
  advance(s, 1);
  assert.equal(s.resources.coal, 120.5);
  assert.equal(s.credits, 30);
  assert.equal(s.autoSales.coal.reserve, 120);
  assert.deepEqual(validateSave(s), s);
  act(s, 'toggle-auto-sale', 'coal');
  s.resources.coal = 200;
  advance(s, 1);
  assert.equal(s.resources.coal, 200);
});

test('Automatic trade funds wages and matches online progress through stock-full transitions', () => {
  const a = newGame('su');
  a.tech = ['sewing'];
  a.resources.coal = 500;
  a.workers.coal = [0, 0, 0, 0, 0];
  a.autoSales.coal = { enabled: true, reserve: 100 };
  const b = structuredClone(a);
  advance(a, 600);
  for (let i = 0; i < 2400; i++) advance(b, 0.25);
  assert.equal(a.credits, b.credits);
  assert.equal(a.resources.coal, 100);
  assert.equal(a.resources.coal, b.resources.coal);
  a.workers.coal.forEach((t, i) => assert.ok(Math.abs(t - b.workers.coal[i]) < 1e-7));
  assert.ok(a.credits > 400);
});

test('Automatic trade can restart unpaid crew from another working crew', () => {
  const a = newGame('fr');
  a.tech = ['sewing'];
  a.levels.cotton = 1;
  a.workers.coal = [60];
  a.workers.cotton = [0];
  a.autoSales.coal = { enabled: true, reserve: 0 };
  a.autoSales.cotton = { enabled: true, reserve: 0 };
  const b = structuredClone(a);
  advance(a, 180);
  for (let i = 0; i < 720; i++) advance(b, 0.25);
  assert.equal(a.credits, b.credits);
  assert.deepEqual(a.resources, b.resources);
  for (const r of RESOURCES)
    a.workers[r.id].forEach((t, i) => assert.ok(Math.abs(t - b.workers[r.id][i]) < 1e-7));
});

test('Automatic sale save settings reject malformed values', () => {
  for (const mutate of [
    (s) => delete s.autoSales,
    (s) => (s.autoSales.coal.reserve = -1),
    (s) => (s.autoSales.coal.reserve = Infinity),
    (s) => (s.autoSales.coal.enabled = 'yes'),
    (s) => (s.autoSales.coal.enabled = true),
    (s) => (s.starterFactoryGranted = true),
  ]) {
    const s = newGame('fr');
    mutate(s);
    assert.throws(() => validateSave(s));
  }
});

test('Japan reduces production materials only and combines with industrial tooling', () => {
  const s = newGame('jp'),
    p = PRODUCTS[0];
  assert.deepEqual(productionRecipe(s, p), { coal: 1.8, cotton: 3.6 });
  assert.equal(productTime(s, p), 8);
  assert.equal(salePrice(s, p), 14);
  assert.equal(researchTime(s, TECHS[0]), 30);
  s.workers.coal = [60];
  assert.equal(rate(s, RESOURCES[0]), 0.4);
  assert.equal(workerWage(RESOURCES[0], s), 12);
  grant(s, 'tooling');
  assert.deepEqual(productionRecipe(s, p), { coal: 1.62, cotton: 3.24 });
  const game = permit(newGame('jp'));
  game.levels.cotton = 1;
  game.resources.coal = 1.8;
  game.resources.cotton = 3.6;
  assert.ok(act(game, 'toggle', 'uniform'));
  advance(game, 8);
  assert.equal(game.lines[0].stock, 1);
  assert.equal(game.resources.coal, 0);
  assert.equal(game.resources.cotton, 0);
  assert.deepEqual(validateSave(game), game);
  assert.equal(PRODUCT_NAMES.jp.length, 19);
});

test('First assault arrives at ten active minutes and never during offline progress', () => {
  const s = newGame('fr');
  advance(s, 1200);
  assert.equal(s.front.remaining, 600);
  assert.equal(s.front.battles, 0);
  advance(s, 599.75, { frontActive: true });
  assert.equal(s.front.battles, 0);
  advance(s, 0.25, { frontActive: true });
  assert.equal(s.front.battles, 1);
  assert.equal(s.front.status, 'paused');
  advance(s, 1200, { frontActive: true });
  assert.equal(s.front.battles, 1);
  assert.deepEqual(validateSave(s), s);
});

test('Manual assault, victory, reserve recruitment and ammunition are deterministic', () => {
  const s = newGame('fr');
  s.lines[0].stock = 8;
  assert.equal(act(s, 'front-deliver', 'uniform', 9), false);
  for (const amount of [-1, 0, 0.5, NaN, '2'])
    assert.equal(act(s, 'front-deliver', 'uniform', amount), false);
  assert.ok(act(s, 'front-deliver', 'uniform', 8));
  assert.equal(s.lines[0].stock, 0);
  assert.equal(act(s, 'front-recruit'), false);
  assert.equal(s.front.soldiers, 18);
  assert.equal('reservists' in s.front, false);
  assert.equal(s.front.equipment.uniform, 0);
  assert.equal(armyStats(s).power, 12);
  assert.ok(act(s, 'front-assault'));
  assert.equal(s.front.victories, 1);
  assert.equal(s.front.wave, 2);
  assert.equal(s.front.status, 'preparing');
  assert.equal(s.front.remaining, 600);
  assert.equal(s.front.equipment.rifle_ammo, 20);
  assert.equal(s.front.soldiers, 17);
  assert.equal(s.credits, 100);
  assert.equal('reservists' in s.front, false);
  assert.equal(s.front.lastBattle.factories, 0);
  assert.equal(s.front.lastBattle.requisitioned, 0);
  assert.deepEqual(validateSave(s), s);
});

test('First two defeats destroy factories and requisition total crews; third ends the game', () => {
  const s = newGame('fr');
  s.factories = 11;
  for (const r of RESOURCES.slice(0, 4)) {
    s.levels[r.id] = 1;
    s.workers[r.id] = [60];
  }
  act(s, 'front-assault');
  assert.equal(s.front.defeats, 1);
  assert.equal(s.factories, 9);
  assert.equal(s.front.lastBattle.requisitioned, 1);
  assert.equal(Object.values(s.workers).flat().length, 3);
  assert.equal('reservists' in s.front, false);
  assert.equal(armyStats(s).morale, 0.9);
  assert.deepEqual(validateSave(s), s);
  act(s, 'front-assault');
  assert.equal(s.front.defeats, 2);
  assert.equal(s.factories, 8);
  assert.equal(Object.values(s.workers).flat().length, 2);
  assert.equal(armyStats(s).morale, 0.8);
  act(s, 'front-assault');
  assert.equal(s.front.status, 'ended');
  assert.equal(s.factories, 8);
  assert.equal(Object.values(s.workers).flat().length, 2);
  assert.equal('reservists' in s.front, false);
  assert.equal(s.front.lastBattle.factories, 0);
  assert.equal(s.front.lastBattle.requisitioned, 0);
  const ended = structuredClone(s);
  advance(s, 600, { frontActive: true });
  assert.deepEqual(s, ended);
  for (const action of [
    'harvest',
    'front-assault',
    'front-resume',
    'hire',
    'buy-factory',
    'front-recruit',
  ])
    assert.equal(act(s, action, 'coal'), false);
  assert.deepEqual(validateSave(s), s);
});

test('Factory destruction reduces occupied batches without refunds or over-allocation', () => {
  const s = permit(established('fr'));
  s.factories = 10;
  s.lines[0].factories = 10;
  s.resources.coal = 100;
  s.resources.cotton = 100;
  act(s, 'toggle', 'uniform');
  advance(s, 1);
  assert.equal(s.lines[0].batch, 10);
  const resources = structuredClone(s.resources);
  act(s, 'front-assault');
  assert.equal(s.factories, 9);
  assert.equal(s.lines[0].factories, 9);
  assert.equal(s.lines[0].batch, 9);
  assert.deepEqual(s.resources, resources);
  assert.equal(freeFactories(s), 0);
  assert.deepEqual(validateSave(s), s);
  s.lines[0].factories = 0;
  advance(s, 7);
  assert.equal(s.lines[0].stock, 9);
  const one = permit(established('fr'));
  act(one, 'toggle', 'uniform');
  advance(one, 1);
  act(one, 'front-assault');
  assert.equal(one.factories, 0);
  assert.equal(one.lines[0].batch, 0);
  assert.equal(one.lines[0].remaining, 0);
  assert.equal(one.lines[0].enabled, false);
  assert.deepEqual(validateSave(one), one);
});

test('A victory restores morale and the defeat counter without restoring industry', () => {
  const s = newGame('fr');
  s.factories = 10;
  s.workers.coal = [60, 60, 60, 60];
  act(s, 'front-assault');
  s.front.soldiers = 50;
  s.front.equipment.rifle = 50;
  s.front.equipment.rifle_ammo = 100;
  act(s, 'front-assault');
  assert.equal(s.front.defeats, 0);
  assert.equal(armyStats(s).morale, 1);
  assert.equal(s.factories, 9);
  assert.equal(s.workers.coal.length, 3);
  assert.equal(s.front.wave, 2);
  assert.equal(s.front.remaining, 600);
  assert.deepEqual(validateSave(s), s);
});

test('Support reduces losses and no ammunition reduces army power', () => {
  const s = newGame('fr');
  assert.equal(armyStats(s).power, 10);
  s.front.equipment.rifle_ammo = 0;
  assert.equal(armyStats(s).power, 2.5);
  s.front.equipment.rifle_ammo = 30;
  s.front.equipment.support = 1;
  assert.equal(armyStats(s).power, 11);
  act(s, 'front-assault');
  assert.equal(s.front.equipment.support, 0);
  assert.ok(s.front.lastBattle.losses <= 3);
});

test('Front advances identically in a long active call and quarter-second calls', () => {
  const a = newGame('fr');
  a.front.soldiers = 100;
  a.front.equipment.rifle = 100;
  a.front.equipment.rifle_ammo = 1000;
  const b = structuredClone(a);
  advance(a, 1201, { frontActive: true });
  for (let i = 0; i < 4804; i++) advance(b, 0.25, { frontActive: true });
  assert.deepEqual(a.front, b.front);
  assert.equal(a.credits, b.credits);
});

test('Existing saves get a fresh ten-minute front; malformed current fronts are rejected', () => {
  const old = newGame('jp');
  old.version = 9;
  old.elapsed = 40000;
  delete old.front;
  const s = validateSave(old);
  assert.equal(s.version, 12);
  assert.equal(s.front.remaining, 600);
  assert.equal(s.front.battles, 0);
  assert.deepEqual(validateSave(s), s);
  for (const mutate of [
    (s) => delete s.front,
    (s) => (s.front.defeats = 4),
    (s) => (s.front.status = 'ended'),
    (s) => (s.front.remaining = -1),
    (s) => (s.front.equipment.rifle = -1),
    (s) => (s.front.soldiers = 1.5),
    (s) => (s.front.lastBattle = { won: true }),
  ]) {
    const bad = newGame('fr');
    mutate(bad);
    assert.throws(() => validateSave(bad));
  }
});

test('All nineteen finished goods can be delivered without duplicating inventory', () => {
  const s = newGame('fr');
  assert.equal(FRONT_ITEMS.length, 19);
  for (const p of PRODUCTS) {
    const line = s.lines.find((l) => l.id === p.id);
    line.stock = 3;
    const before = s.front.equipment[p.id];
    assert.ok(act(s, 'front-deliver', p.id, 3));
    assert.equal(line.stock, 0);
    assert.equal(s.front.equipment[p.id], p.id === 'uniform' ? 0 : before + 3);
    if (p.id === 'uniform') assert.equal(s.front.soldiers, 13);
    assert.equal(act(s, 'front-deliver', p.id, 1), false);
  }
  assert.deepEqual(validateSave(s), s);
});
test('Heavy equipment requires crews and ammunition, which are consumed once', () => {
  const s = newGame('fr');
  s.front.equipment.rifle = 0;
  s.front.equipment.artillery = 2;
  assert.equal(armyStats(s).power, 2.5);
  s.front.equipment.shell = 1;
  assert.equal(armyStats(s).used.artillery, 1);
  assert.equal(armyStats(s).power, 21.5);
  act(s, 'front-assault');
  assert.equal(s.front.equipment.shell, 0);
  assert.equal(s.front.lastBattle.ammunition, 1);
  s.front.soldiers = 0;
  s.front.equipment.shell = 10;
  assert.equal(armyStats(s).power, 0);
});
test('Pistols, grenades and logistics contribute with no double assignment', () => {
  const s = newGame('fr');
  const e = s.front.equipment;
  e.rifle = 0;
  e.pistol = 10;
  e.pistol_ammo = 10;
  assert.equal(armyStats(s).power, 7.5);
  e.grenade = 10;
  e.jeep = 1;
  e.truck = 1;
  assert.ok(armyStats(s).power > 12.5);
  act(s, 'front-assault');
  assert.equal(e.pistol_ammo, 1);
  assert.equal(e.grenade, 1);
});
test('Each vehicle and aircraft has a useful combat role', () => {
  for (const id of [
    'machine_gun',
    'halftrack',
    'light_tank',
    'medium_tank',
    'heavy_tank',
    'fighter',
    'bomber',
    'recon',
    'jeep',
    'truck',
  ]) {
    const s = newGame('fr');
    s.front.soldiers = 100;
    Object.assign(s.front.equipment, { rifle: 0, rifle_ammo: 100, shell: 100 });
    const before = armyStats(s).power;
    s.front.equipment[id] = 1;
    assert.ok(armyStats(s).power > before, id);
  }
});
test('Warning is issued once at one minute, survives reload and resets after a battle', () => {
  const s = newGame('fr');
  assert.equal(takeAssaultWarning(s), false);
  s.front.remaining = 60;
  assert.equal(takeAssaultWarning(s), true);
  const restored = validateSave(s);
  assert.equal(takeAssaultWarning(restored), false);
  act(s, 'front-assault');
  assert.equal(takeAssaultWarning(s), false);
  act(s, 'front-resume');
  s.front.remaining = 59;
  assert.equal(takeAssaultWarning(s), true);
});
test('Old front saves gain missing equipment and reserve reinforcement only once', () => {
  const s = newGame('fr');
  s.version = 10;
  s.front.reservists = 20;
  for (const id of FRONT_ITEMS)
    if (!['uniform', 'support', 'rifle', 'rifle_ammo'].includes(id)) delete s.front.equipment[id];
  delete s.front.assaultWarned;
  const restored = validateSave(s);
  assert.equal('reservists' in restored.front, false);
  assert.equal(restored.front.equipment.artillery, 0);
  assert.deepEqual(validateSave(restored), restored);
});
test('Enemy growth and reserve arrivals scale with victorious waves', () => {
  const s = newGame('fr');
  s.front.soldiers = 100;
  s.front.equipment.rifle = 100;
  s.front.equipment.rifle_ammo = 1000;
  assert.equal(enemyPower(s), 12);
  act(s, 'front-assault');
  assert.equal(enemyPower(s), 16);
  assert.equal('reservists' in s.front, false);
  act(s, 'front-assault');
  assert.equal(enemyPower(s), 21);
  assert.equal('reservists' in s.front, false);
});

test('Uniform delivery creates soldiers directly without a reserve limit', () => {
  const s = newGame('fr');
  s.lines[0].stock = 500;
  assert.ok(act(s, 'front-deliver', 'uniform', 500));
  assert.equal(s.front.soldiers, 510);
  assert.equal(s.front.equipment.uniform, 0);
  assert.equal(s.lines[0].stock, 0);
  assert.deepEqual(validateSave(s), s);
  s.lines[0].stock = 1;
  s.front.soldiers = 1e9;
  assert.equal(act(s, 'front-deliver', 'uniform', 1), false);
  assert.equal(s.lines[0].stock, 1);
});
test('Version 11 migrates already delivered uniforms once and removes reserves', () => {
  const s = newGame('fr');
  s.version = 11;
  s.front.equipment.uniform = 12;
  s.front.reservists = 2;
  const restored = validateSave(s);
  assert.equal(restored.front.soldiers, 22);
  assert.equal(restored.front.equipment.uniform, 0);
  assert.equal('reservists' in restored.front, false);
  assert.deepEqual(validateSave(restored), restored);
});

test('Overwhelming victory preserves army power and does not spend all ammunition', () => {
  const s = newGame('fr');
  s.front.soldiers = 12000;
  s.front.equipment.rifle = 12000;
  s.front.equipment.rifle_ammo = 12000;
  const before = armyStats(s).power;
  act(s, 'front-assault');
  assert.ok(armyStats(s).power > before * 0.99);
  assert.ok(s.front.lastBattle.losses <= 1);
  assert.equal(s.front.lastBattle.ammunition, 12);
  assert.ok(s.front.equipment.rifle > 11990);
});
test('Small attacks do not destroy a vehicle from every equipped family', () => {
  const s = newGame('fr');
  s.front.soldiers = 12000;
  for (const id of ['rifle', 'rifle_ammo', 'pistol_ammo', 'shell']) s.front.equipment[id] = 12000;
  for (const id of ['jeep', 'truck', 'recon', 'fighter', 'bomber', 'heavy_tank'])
    s.front.equipment[id] = 1;
  act(s, 'front-assault');
  for (const id of ['jeep', 'truck', 'recon', 'fighter', 'bomber', 'heavy_tank'])
    assert.equal(s.front.equipment[id], 1, id);
});
test('Encoded and legacy save round trips retain actual stock separately from total production', () => {
  const s = permit(newGame('fr'));
  s.levels.cotton = 1;
  s.lines[0].stock = 0;
  s.lines[0].made = 950;
  const encoded = serializeSave(s);
  assert.ok(!encoded.includes('soldiers'));
  assert.equal(validateSave(encoded).lines[0].stock, 0);
  s.lines[0].stock = 7;
  for (const raw of [serializeSave(s), JSON.stringify(s)]) {
    const restored = validateSave(raw);
    assert.equal(restored.lines[0].stock, 7);
    assert.equal(restored.lines[0].made, 950);
  }
  const broken = JSON.parse(encoded);
  broken.payload = broken.payload.slice(0, -2) + 'AA';
  assert.throws(() => validateSave(broken));
  assert.throws(() => validateSave(' '.repeat(200001)));
});
