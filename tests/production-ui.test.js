// Vérifie les écrans dans un DOM minimal, sans ouvrir de navigateur.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
function mount() {
  const nodes = new Map(),
    events = {},
    timers = [],
    timeouts = new Map();
  let time = 0,
    nextTimeout = 0;
  const get = (id) => {
    if (!nodes.has(id))
      nodes.set(id, {
        innerHTML: '',
        textContent: '',
        dataset: {},
        style: {},
        parentElement: {},
        setAttribute(k, v) {
          this[k] = v;
        },
        classList: { add() {}, remove() {} },
      });
    return nodes.get(id);
  };
  const context = vm.createContext({
    structuredClone,
    localStorage: { getItem: () => null, setItem() {} },
    document: {
      querySelector: get,
      getElementById: get,
      addEventListener(name, fn) {
        events[name] = fn;
      },
    },
    window: { addEventListener() {} },
    setInterval(fn) {
      timers.push(fn);
    },
    setTimeout(fn, delay) {
      const id = ++nextTimeout;
      timeouts.set(id, { fn, at: time + delay });
      return id;
    },
    clearTimeout(id) {
      timeouts.delete(id);
    },
  });
  vm.runInContext(
    fs.readFileSync(new URL('dist/engine.js', root), 'utf8').replaceAll('export ', '') +
      '\n' +
      fs
        .readFileSync(new URL('dist/app.js', root), 'utf8')
        .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/engine\.js['"];?/, ''),
    context,
  );
  return {
    get,
    context,
    events,
    timers,
    elapse(ms) {
      time += ms;
      for (const [id, t] of timeouts)
        if (t.at <= time) {
          timeouts.delete(id);
          t.fn();
        }
    },
  };
}
test('Production renders all 19 national cards and filters without missing imagery', () => {
  for (const country of ['fr', 'us', 'de', 'su']) {
    const ui = mount();
    vm.runInContext(`state=newGame('${country}');view='production';shell();`, ui.context);
    const html = ui.get('#content').innerHTML;
    assert.equal((html.match(/<article\s+class="production-card/g) || []).length, 19);
    assert.ok(!html.includes('undefined'));
    assert.ok(!html.includes('NaN'));
    assert.ok(fs.existsSync(new URL(`dist/assets/production-${country}.png`, root)));
    assert.equal(ui.get('toggle-uniform').disabled, true);
    vm.runInContext(
      "state.levels.cotton=1;state.tech=['sewing'];state.credits=75;act(state,'patent','uniform');state.factories=1;act(state,'assign-factory','uniform');shell();",
      ui.context,
    );
    assert.equal(ui.get('toggle-uniform').disabled, false);
    assert.equal(ui.get('toggle-support').disabled, true);
    ui.events.click({ target: { closest: () => ({ dataset: { productionFilter: 'Aviation' } }) } });
    assert.equal(
      (ui.get('#content').innerHTML.match(/<article\s+class="production-card/g) || []).length,
      3,
    );
    assert.ok(ui.get('#content').innerHTML.includes('Bombardier'));
    vm.runInContext("view='storage';shell();", ui.context);
    assert.ok(!ui.get('#content').innerHTML.includes('undefined'));
  }
});
test('A completed first item refreshes the production prerequisites', () => {
  const ui = mount();
  vm.runInContext(
    "state=newGame('fr');state.levels.cotton=1;state.levels.wood=1;state.resources.cotton=4;state.resources.coal=2;state.tech=['sewing','confection'];state.credits=1000;act(state,'patent','uniform');state.factories=1;act(state,'assign-factory','uniform');view='production';shell();act(state,'toggle','uniform');last=Date.now()-8100;",
    ui.context,
  );
  ui.timers[0]();
  assert.equal(ui.get('toggle-support').disabled, true);
  vm.runInContext("view='patents';shell();", ui.context);
  assert.equal(ui.get('patent-support').disabled, false);
  assert.ok(ui.get('made-uniform').textContent.startsWith('1 '));
});

test('Patent catalog shows national images, research gates, affordability and acquisition', () => {
  for (const country of ['fr', 'us', 'de', 'su']) {
    const ui = mount();
    vm.runInContext(`state=newGame('${country}');view='patents';shell();`, ui.context);
    const html = ui.get('#content').innerHTML;
    assert.equal((html.match(/<article\s+class="production-card/g) || []).length, 19);
    assert.ok(html.includes(`production-${country}.png`));
    assert.ok(!/undefined|NaN|redevances/.test(html));
    assert.equal(ui.get('patent-uniform').disabled, true);
    vm.runInContext("state.tech=['sewing'];state.credits=74;updateNumbers();", ui.context);
    assert.equal(ui.get('patent-uniform').disabled, true);
    vm.runInContext('state.credits=75;updateNumbers();', ui.context);
    assert.equal(ui.get('patent-uniform').disabled, false);
    ui.events.click({
      target: { closest: () => ({ dataset: { action: 'patent', id: 'uniform' } }) },
    });
    assert.ok(ui.get('#content').innerHTML.includes('ACQUIS'));
    assert.equal(ui.get('total-income').textContent, '1 / 19');
  }
});

test('Research displays live material costs and enables with materials and no gold', () => {
  const ui = mount();
  vm.runInContext("state=newGame('fr');view='research';shell();", ui.context);
  assert.ok(ui.get('#content').innerHTML.includes('Ressources nécessaires'));
  assert.ok(!ui.get('#content').innerHTML.includes('undefined'));
  assert.equal(ui.get('research-steam').disabled, true);
  assert.equal(ui.get('research-cost-steam-coal').textContent, '0 / 120');
  vm.runInContext(
    'state.resources.coal=120;state.resources.cotton=40;updateNumbers();',
    ui.context,
  );
  assert.equal(ui.get('research-steam').disabled, false);
  assert.equal(ui.get('research-cost-steam-coal')['data-missing'], 'false');
  ui.events.click({
    target: { closest: () => ({ dataset: { action: 'research', id: 'steam' } }) },
  });
  assert.ok(ui.get('#content').innerHTML.includes('research-time'));
  assert.equal(ui.get('credits').textContent, '0 or');
  assert.equal(ui.get('research-assembly').disabled, true);
});

test('Research tree renders prerequisite links and click-pinned dossiers', () => {
  const ui = mount();
  vm.runInContext("state=newGame('fr');view='research';shell();", ui.context);
  let html = ui.get('#content').innerHTML;
  assert.equal((html.match(/data-research-node=/g) || []).length, 29);
  assert.equal(
    (html.match(/<path\s+class=/g) || []).length,
    vm.runInContext(
      'TECHS.reduce((n,t)=>n+t.requires.filter(id=>TECHS.find(parent=>parent.id===id).branch===t.branch).length,0)',
      ui.context,
    ),
  );
  assert.equal((html.match(/class="research-detail"/g) || []).length, 29);
  assert.ok(html.includes('aria-controls="research-detail-steam"'));
  ui.events.click({ target: { closest: () => ({ dataset: { researchNode: 'chemistry' } }) } });
  html = ui.get('#content').innerHTML;
  assert.equal((html.match(/data-pinned="true"/g) || []).length, 1);
  assert.ok(/aria-label=\"Chimie des poudres · ACCESSIBLE\"\s+aria-expanded=\"true\"/.test(html));
  ui.events.click({ target: { closest: () => ({ dataset: { researchClose: 'chemistry' } }) } });
  assert.ok(!ui.get('#content').innerHTML.includes('data-pinned="true"'));
  vm.runInContext(
    "state.tech=['steam'];state.research={id:'assembly',remaining:10};shell();",
    ui.context,
  );
  html = ui.get('#content').innerHTML;
  assert.ok(html.includes('Chaudières industrielles · VALIDÉ'));
  assert.ok(html.includes('Chaîne de montage · EN COURS'));
  assert.ok(html.includes('Chimie des poudres · ACCESSIBLE'));
});

test('Research hover opens only after one continuous second on the square', () => {
  const ui = mount(),
    attrs = {},
    square = {
      isConnected: true,
      contains: (x) => x === square,
      setAttribute(k, v) {
        attrs[k] = v;
      },
      closest: (selector) => (selector === '.research-square' ? square : node),
    };
  const node = {
    contains: (x) => x === square || x === node,
    setAttribute(k, v) {
      attrs[k] = v;
    },
    removeAttribute(k) {
      delete attrs[k];
    },
    getAttribute: () => 'false',
    querySelector: () => square,
  };
  ui.events.pointerover({ target: { closest: () => null }, relatedTarget: null });
  ui.elapse(2500);
  assert.equal(attrs['data-preview'], undefined);
  ui.events.pointerover({ target: square, relatedTarget: null });
  ui.elapse(999);
  assert.equal(attrs['data-preview'], undefined);
  ui.events.pointerout({ target: square, relatedTarget: node });
  ui.elapse(1);
  assert.equal(attrs['data-preview'], undefined);
  ui.events.pointerover({ target: square, relatedTarget: node });
  ui.elapse(999);
  assert.equal(attrs['data-preview'], undefined);
  ui.elapse(1);
  assert.equal(attrs['data-preview'], 'true');
  ui.events.pointerout({ target: square, relatedTarget: node });
  assert.equal(attrs['data-preview'], 'true');
  ui.events.pointerout({ target: square, relatedTarget: null });
  assert.equal(attrs['data-preview'], undefined);
  assert.equal(attrs['aria-expanded'], 'false');
});

test('Production displays factory purchase and allocation controls', () => {
  const ui = mount();
  vm.runInContext(
    "state=newGame('fr');view='production';state.tech=['sewing'];state.credits=2000;state.levels.cotton=1;act(state,'patent','uniform');shell();",
    ui.context,
  );
  assert.ok(ui.get('#content').innerHTML.includes('factory-icon'));
  assert.equal(ui.get('toggle-uniform').disabled, true);
  assert.equal(ui.get('assign-factory-uniform').disabled, true);
  ui.events.click({ target: { closest: () => ({ dataset: { action: 'buy-factory' } }) } });
  assert.equal(ui.get('assign-factory-uniform').disabled, false);
  ui.events.click({
    target: { closest: () => ({ dataset: { action: 'assign-factory', id: 'uniform' } }) },
  });
  assert.equal(ui.get('toggle-uniform').disabled, false);
  assert.equal(ui.get('factory-summary').textContent, '1 usines · 0 disponibles');
});

// Les détails d’équilibrage restent dans la documentation, pas dans les écrans.
test('Game screens retain controls without detailed mechanics copy', () => {
  const ui = mount();
  for (const view of ['harvest', 'market', 'production', 'research', 'patents', 'storage']) {
    vm.runInContext(`state=newGame('fr');view='${view}';shell();`, ui.context);
    const html = ui.get('#content').innerHTML;
    assert.ok(
      !/Prix ×1,3|base 1 000 or|Chaque usine produit|Chaque clic rapporte|Chaque licence s’achète|payés d’avance/.test(
        html,
      ),
    );
    assert.ok(!/undefined|NaN/.test(html));
  }
});

test('Research shows seven separate trees with cross-branch references and no filters', () => {
  const ui = mount();
  vm.runInContext("state=newGame('fr');view='research';shell();", ui.context);
  const html = ui.get('#content').innerHTML;
  assert.equal((html.match(/class="research-branch"/g) || []).length, 7);
  assert.equal((html.match(/data-research-node=/g) || []).length, 29);
  assert.ok(!html.includes('data-research-branch'));
  assert.ok(!html.includes('research-map-scroll'));
  assert.ok(html.includes('data-research-jump="precision"'));
  assert.ok(html.includes('data-research-jump="mixed_tracks"'));
  ui.events.click({ target: { closest: () => ({ dataset: { researchJump: 'precision' } }) } });
  assert.ok(ui.get('#content').innerHTML.includes('aria-controls="research-detail-precision"'));
  assert.equal(vm.runInContext('pinnedResearch', ui.context), 'precision');
});

test('Local tree paths never cross unrelated paths or pass through other nodes', () => {
  const ui = mount();
  const layouts = vm.runInContext('researchBranches.map(researchLayout)', ui.context);
  for (const layout of layouts) {
    const edges = [];
    for (const tech of layout.techs)
      for (const parent of tech.requires) {
        if (!layout.positions[parent]) continue;
        const a = layout.positions[parent],
          b = layout.positions[tech.id];
        assert.equal(b.depth, a.depth + 1);
        edges.push({ parent, child: tech.id, a, b });
      }
    for (const edge of edges)
      for (const other of edges) {
        if (edge === other || edge.parent === other.parent) continue;
        if (edge.a.depth !== other.a.depth) continue;
        const left = Math.min(edge.a.x, edge.b.x),
          right = Math.max(edge.a.x, edge.b.x);
        const otherLeft = Math.min(other.a.x, other.b.x),
          otherRight = Math.max(other.a.x, other.b.x);
        assert.ok(
          right < otherLeft || otherRight < left,
          'Les couloirs de deux sous-arbres doivent rester séparés',
        );
      }
    for (const position of Object.values(layout.positions)) {
      assert.ok(position.x > 0 && position.x < 100);
      assert.ok(position.depth * 220 + 180 <= layout.height);
    }
  }
});
