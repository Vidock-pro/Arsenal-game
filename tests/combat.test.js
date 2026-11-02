import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame,
  armyStats,
  enemyArmy,
  enemyPower,
  battlePreview,
  simulateCombat,
  COMBAT_UNITS,
  act,
  validateSave,
  serializeSave,
  FRONT_ITEMS,
} from '../dist/engine.js';
function army(men, equipment = {}) {
  const s = newGame('fr');
  s.front.soldiers = men;
  for (const id of FRONT_ITEMS) s.front.equipment[id] = 0;
  Object.assign(s.front.equipment, equipment);
  return s;
}
function fight(a, b) {
  return simulateCombat(armyStats(a), armyStats(b));
}

test('Men, equipment and ammunition are distinct and snapshots are pure', () => {
  assert.equal(armyStats(army(10)).power, 0);
  assert.equal(armyStats(army(0, { rifle: 10, rifle_ammo: 10 })).power, 0);
  assert.equal(armyStats(army(1, { rifle: 1 })).power, 0.5);
  assert.equal(armyStats(army(1, { rifle: 1, rifle_ammo: 1 })).power, 1);
  const s = army(20, { rifle: 20, rifle_ammo: 7 });
  const before = structuredClone(s);
  const stats = armyStats(s);
  assert.equal(stats.power, 13.5);
  assert.equal(stats.groups.filter((g) => g.dry)[0].count, 13);
  battlePreview(s);
  fight(s, newGame('fr'));
  assert.deepEqual(s, before);
});
test('Every collective equipment requires its exact crew and ammunition', () => {
  for (const id of [
    'artillery',
    'light_tank',
    'medium_tank',
    'heavy_tank',
    'fighter',
    'bomber',
    'machine_gun',
    'halftrack',
  ]) {
    const u = COMBAT_UNITS[id],
      e = { [id]: 1, [u.ammo]: u.rounds };
    assert.equal(armyStats(army(u.crew - 1, e)).used[id], 0, id);
    assert.equal(armyStats(army(u.crew, e)).used[id], 1, id);
    assert.equal(armyStats(army(u.crew, { ...e, [u.ammo]: u.rounds - 1 })).used[id], 0, id);
  }
});
test('Mixed allocations conserve every man and reserve ammunition only once', () => {
  for (let men = 0; men < 100; men++) {
    const s = army(
      men,
      Object.fromEntries(FRONT_ITEMS.map((id) => [id, id === 'uniform' ? 0 : 13])),
    );
    const a = armyStats(s);
    assert.equal(a.idle + a.groups.reduce((n, g) => n + g.men, 0), men);
    for (const id of FRONT_ITEMS) {
      assert.ok(a.used[id] <= s.front.equipment[id]);
      assert.ok(a.spent[id] <= s.front.equipment[id]);
    }
    for (const g of a.groups) assert.equal(g.men, g.count * COMBAT_UNITS[g.id].crew);
    for (const id of Object.keys(COMBAT_UNITS))
      assert.equal(
        a.used[id] + (a.reserves.find((r) => r.id === id)?.count || 0),
        s.front.equipment[id],
      );
  }
});
test('Identical infantry holds the front and both sides suffer the same losses', () => {
  const a = army(20, { rifle: 20, rifle_ammo: 20 });
  const r = fight(a, a);
  assert.equal(r.won, true);
  assert.equal(r.draw, true);
  assert.equal(r.losses, r.enemyLosses);
  assert.equal(r.spent.rifle_ammo, 20);
});
test('Counters matter at equal nominal power, artillery needs protection', () => {
  const inf = army(24, { rifle: 24, rifle_ammo: 100 });
  const tanks = army(6, { medium_tank: 2, shell: 100 });
  const mg = army(12, { machine_gun: 6, rifle_ammo: 100 });
  assert.equal(fight(tanks, inf).won, true);
  assert.equal(fight(mg, inf).won, true);
  assert.equal(fight(mg, tanks).won, false);
  const exposed = army(6, { artillery: 3, shell: 100 });
  const protectedGuns = army(12, { artillery: 3, rifle: 6, shell: 100, rifle_ammo: 100 });
  assert.ok(fight(tanks, exposed).power > fight(tanks, protectedGuns).power);
});
test('Aircraft alone cannot hold ground and bombers cannot scale without ground forces', () => {
  const ground = army(20, { rifle: 20, rifle_ammo: 100 });
  for (const id of ['bomber', 'fighter']) {
    const planes = army(400, { [id]: 100, shell: 10000, rifle_ammo: 10000 });
    assert.equal(fight(planes, ground).won, false);
    assert.equal(fight(planes, ground).power, 0);
  }
  const huge = army(4020, { rifle: 20, bomber: 1000, shell: 10000, rifle_ammo: 100 });
  assert.ok(fight(huge, ground).power <= 30);
});
test('Interception reduces strikes; fighters without aerial targets consume no ammunition', () => {
  const attackers = army(100, { rifle: 40, bomber: 10, rifle_ammo: 1000, shell: 1000 });
  const without = army(100, { rifle: 50, rifle_ammo: 1000 });
  const withFighters = army(100, { rifle: 50, fighter: 20, rifle_ammo: 1000 });
  assert.ok(fight(attackers, withFighters).power < fight(attackers, without).power);
  const r = fight(withFighters, without);
  assert.ok(r.spent.rifle_ammo <= 50);
  assert.equal(r.phases[0].playerLosses, 0);
});
test('Overwhelming rule is symmetric and reserves do not take casualties', () => {
  const large = army(200, { rifle: 200, rifle_ammo: 1000, support: 20 });
  const small = army(20, { rifle: 20, rifle_ammo: 1000, bomber: 30 });
  const a = fight(large, small),
    b = fight(small, large);
  assert.equal(a.overwhelming, true);
  assert.equal(a.losses, 0);
  assert.equal(b.enemyLosses, 0);
  assert.equal(a.spent.support, 0);
  assert.ok(a.spent.rifle_ammo <= 2);
  assert.equal(a.enemyLosses, b.losses);
  assert.equal(b.destroyed.bomber, 0);
});
test('Phases never double count deaths or consume more than available stocks', () => {
  let seed = 12345;
  const rnd = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  for (let k = 0; k < 200; k++) {
    const a = army(rnd(300)),
      b = army(rnd(300));
    for (const s of [a, b])
      for (const id of FRONT_ITEMS) if (id !== 'uniform') s.front.equipment[id] = rnd(80);
    const r = fight(a, b);
    assert.equal(
      r.phases.reduce((n, p) => n + p.playerLosses, 0),
      r.losses,
    );
    assert.ok(r.losses <= a.front.soldiers);
    assert.ok(r.enemyLosses <= b.front.soldiers);
    for (const id of FRONT_ITEMS) {
      assert.ok(Number.isSafeInteger(r.spent[id]));
      assert.ok(r.spent[id] >= 0);
      assert.ok(r.spent[id] + r.destroyed[id] <= a.front.equipment[id], id);
    }
  }
});
test('Fifteen waves retain exponential budgets and all actual battles round-trip', () => {
  for (let wave = 1; wave <= 15; wave++) {
    const s = army(1000, {
      rifle: 500,
      medium_tank: 30,
      fighter: 20,
      bomber: 10,
      artillery: 20,
      rifle_ammo: 10000,
      shell: 10000,
    });
    Object.assign(s.front, { wave, victories: wave - 1, battles: wave - 1 });
    const enemy = enemyArmy(s);
    assert.equal(enemy.budget, Math.ceil(12 * 1.3 ** (wave - 1)));
    assert.equal(enemyPower(s), enemy.budget);
    act(s, 'front-assault');
    assert.deepEqual(validateSave(serializeSave(s)), s);
  }
});
test('Legacy inventory is preserved and new battle details reject injected values', () => {
  const s = army(45, { rifle: 20, rifle_ammo: 10, artillery: 4, shell: 2 });
  assert.deepEqual(validateSave(serializeSave(s)), s);
  act(s, 'front-assault');
  for (const mutate of [
    (r) => (r.phases[0].name = '<img src=x>'),
    (r) => (r.destroyed.rifle = -1),
    (r) => (r.phases[0].playerLosses = 0.5),
    (r) => (r.draw = 'yes'),
  ]) {
    const bad = structuredClone(s);
    mutate(bad.front.lastBattle);
    assert.throws(() => validateSave(bad));
  }
});

test('Ground units cannot kill pilots through the terrestrial casualty phase', () => {
  const air = army(40, { bomber: 10, shell: 100 });
  const ground = army(20, { rifle: 20, rifle_ammo: 100 });
  const r = fight(air, ground);
  assert.equal(r.won, false);
  assert.equal(r.losses, 0);
  assert.equal(r.destroyed.bomber, 0);
});
