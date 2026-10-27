// Vérifie les écrans dans un DOM minimal, sans ouvrir de navigateur.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
function mount(options = {}) {
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
    localStorage: { getItem: options.getItem || (() => null), setItem() {} },
    document: {
      querySelector: get,
      getElementById: get,
      addEventListener(name, fn) {
        events[name] = fn;
      },
    },
    window: { Audio: options.Audio, addEventListener() {} },
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
    vm.runInContext('TECHS.length', ui.context),
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

test('Research shows one connected tree without categories or filters', () => {
  const ui = mount();
  vm.runInContext("state=newGame('fr');view='research';shell();", ui.context);
  const html = ui.get('#content').innerHTML;
  assert.equal((html.match(/class="research-tree technology-tree"/g) || []).length, 1);
  assert.ok(!html.includes('class="research-branch"'));
  assert.ok(html.includes('Bureau d’études'));
  assert.equal((html.match(/data-research-node=/g) || []).length, 29);
  assert.ok(!html.includes('data-research-branch'));
  assert.ok(html.includes('research-map-scroll'));
  assert.ok(html.includes('data-research-jump="precision"'));
  assert.ok(html.includes('data-research-jump="mixed_tracks"'));
  ui.events.click({ target: { closest: () => ({ dataset: { researchJump: 'precision' } }) } });
  assert.ok(ui.get('#content').innerHTML.includes('aria-controls="research-detail-precision"'));
  assert.equal(vm.runInContext('pinnedResearch', ui.context), 'precision');
});

test('Single tree paths never cross unrelated paths or pass through other nodes', () => {
  const ui = mount();
  const layouts = vm.runInContext('[researchLayout()]', ui.context);
  for (const layout of layouts) {
    const edges = [];
    for (const tech of layout.techs)
      for (const parent of [layout.parents[tech.id]]) {
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

test('Telegrams queue simultaneous events and work without audio support', () => {
  const ui = mount();
  vm.runInContext("notify('Recherche terminée');notify('Salaires impayés');", ui.context);
  assert.equal(ui.get('#telegram-message').textContent, 'Recherche terminée');
  assert.ok(ui.get('#toast').innerHTML.includes('TÉLÉGRAMME'));
  ui.elapse(6500);
  ui.elapse(300);
  assert.equal(ui.get('#telegram-message').textContent, 'Salaires impayés');
  ui.events.click({ target: { closest: () => ({ dataset: { action: 'telegram-close' } }) } });
  ui.elapse(300);
  assert.equal(vm.runInContext('telegramActive', ui.context), false);
});

test('Unpaid workers trigger one telegram per interruption, including partial crews', () => {
  const ui = mount();
  vm.runInContext(
    "state=newGame('fr');state.workers.coal=[0,30];checkPayrollNotice();checkPayrollNotice();",
    ui.context,
  );
  assert.match(ui.get('#telegram-message').textContent, /Salaires impayés/);
  assert.equal(vm.runInContext('telegramQueue.length', ui.context), 0);
  vm.runInContext(
    'state.workers.coal=[30,30];checkPayrollNotice();state.workers.coal=[0,0];checkPayrollNotice();',
    ui.context,
  );
  assert.equal(vm.runInContext('telegramQueue.length', ui.context), 1);
});

test('Telegram sound preference toggles without blocking game actions', () => {
  const ui = mount(),
    button = { dataset: { action: 'telegram-sound' }, setAttribute() {} };
  ui.events.click({ target: { closest: () => button } });
  assert.equal(vm.runInContext('telegramMuted', ui.context), true);
  assert.equal(button.textContent, 'Son coupé');
  ui.events.click({ target: { closest: () => button } });
  assert.equal(vm.runInContext('telegramMuted', ui.context), false);
});

test('Music uses one looping player, remembers volume and pauses in hidden tabs', () => {
  const ui = mount();
  let creates = 0,
    plays = 0,
    pauses = 0;
  ui.context.window.Audio = class {
    constructor(src) {
      this.src = src;
      creates++;
    }
    play() {
      plays++;
      return Promise.resolve();
    }
    pause() {
      pauses++;
    }
  };
  vm.runInContext("screen='game';syncMusic();syncMusic();", ui.context);
  assert.equal(creates, 1);
  assert.equal(vm.runInContext('musicPlayer.loop', ui.context), true);
  assert.equal(vm.runInContext('musicPlayer.src', ui.context), 'assets/rising-sun-game-loop.wav');
  vm.runInContext('musicPlayer.onplaying();', ui.context);
  for (let i = 0; i < 81; i++) ui.elapse(50);
  ui.events.input({ target: { id: 'music-volume', value: '18' } });
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0.18 * 0.12);
  ui.events.input({ target: { id: 'music-volume', value: '100' } });
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0.12);
  vm.runInContext('syncMusic();', ui.context);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0.12);
  ui.context.document.hidden = true;
  ui.events.visibilitychange();
  assert.equal(pauses, 1);
  ui.context.document.hidden = false;
  ui.events.visibilitychange();
  assert.equal(plays, 4);
  ui.events.click({ target: { closest: () => ({ dataset: { action: 'music-toggle' } }) } });
  assert.equal(vm.runInContext('musicEnabled', ui.context), false);
  assert.equal(pauses, 2);
  ui.events.visibilitychange();
  assert.equal(plays, 4);
});

test('Menu theme loops and switches to the game track without creating a second player', () => {
  const ui = mount();
  let creates = 0,
    pauses = 0;
  ui.context.window.Audio = class {
    constructor(src) {
      this.src = src;
      creates++;
    }
    play() {
      return Promise.resolve();
    }
    pause() {
      pauses++;
    }
  };
  vm.runInContext('syncMusic();', ui.context);
  assert.equal(vm.runInContext('musicPlayer.src', ui.context), 'assets/dogs-of-war-menu-loop.wav');
  assert.equal(vm.runInContext('musicPlayer.loop', ui.context), true);
  vm.runInContext("state=newGame('fr');shell();", ui.context);
  assert.equal(vm.runInContext('musicPlayer.src', ui.context), 'assets/rising-sun-game-loop.wav');
  vm.runInContext('title();', ui.context);
  assert.equal(vm.runInContext('musicPlayer.src', ui.context), 'assets/dogs-of-war-menu-loop.wav');
  vm.runInContext("selected='us';title();", ui.context);
  assert.equal(creates, 1);
  assert.equal(pauses, 2);
  assert.ok(!ui.get('#app').innerHTML.includes('menu-music-volume'));
});

test('Title offers settings and retries blocked autoplay on a background click', async () => {
  let attempts = 0;
  const ui = mount({
    Audio: class {
      constructor(src) {
        this.src = src;
        this.paused = true;
      }
      pause() {
        this.paused = true;
      }
      play() {
        attempts++;
        if (attempts === 1) return Promise.reject(new Error('Autoplay blocked'));
        this.paused = false;
        return Promise.resolve();
      }
    },
  });
  assert.equal(attempts, 1);
  assert.ok(ui.get('#app').innerHTML.includes('title-settings'));
  assert.equal(vm.runInContext('musicPlayer.src', ui.context), 'assets/dogs-of-war-menu-loop.wav');
  await Promise.resolve();
  ui.events.click({ target: { closest: () => null } });
  assert.equal(attempts, 2);
  assert.equal(vm.runInContext('musicPlayer.paused', ui.context), false);
});

test('Initial autoplay respects a saved music-off preference', () => {
  let creates = 0;
  const ui = mount({
    getItem: (key) => (key === 'arsenal.music.enabled' ? 'false' : null),
    Audio: class {
      constructor() {
        creates++;
      }
    },
  });
  ui.events.click({ target: { closest: () => null } });
  ui.events.keydown({ key: 'Enter' });
  assert.equal(creates, 0);
});

test('Title settings show menu audio and disable export before a game exists', () => {
  const ui = mount();
  const dialog = { innerHTML: '', addEventListener() {}, showModal() {} };
  ui.context.document.createElement = () => dialog;
  ui.context.document.body = { append() {} };
  vm.runInContext('settings();', ui.context);
  assert.ok(dialog.innerHTML.includes('Dogs of War · Musique du menu'));
  assert.ok(dialog.innerHTML.includes('Retour au menu'));
  assert.match(dialog.innerHTML, /data-action="export"\s+disabled/);
});

test('Music fades in only after playback begins and restarts softly after pausing', () => {
  const ui = mount({
    Audio: class {
      constructor(src) {
        this.src = src;
        this.paused = true;
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
    },
  });
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0);
  ui.elapse(5000);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0);
  vm.runInContext('musicPlayer.onplaying();', ui.context);
  for (let i = 0; i < 40; i++) ui.elapse(50);
  const halfway = vm.runInContext('musicPlayer.volume', ui.context);
  assert.ok(halfway > 0.02 && halfway < 0.022);
  vm.runInContext('syncMusic();musicPlayer.onplaying();', ui.context);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), halfway);
  ui.events.input({ target: { id: 'music-volume', value: '20' } });
  assert.ok(vm.runInContext('musicPlayer.volume', ui.context) < 0.013);
  ui.context.document.hidden = true;
  ui.events.visibilitychange();
  ui.elapse(5000);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0);
  ui.context.document.hidden = false;
  ui.events.visibilitychange();
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0);
  vm.runInContext('musicPlayer.onplaying();', ui.context);
  for (let i = 0; i < 81; i++) ui.elapse(50);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0.2 * 0.12);
  vm.runInContext("state=newGame('fr');shell();", ui.context);
  assert.equal(vm.runInContext('musicPlayer.volume', ui.context), 0);
});

test('Compact counters avoid unsupported spaces and preserve readable units', () => {
  const ui = mount();
  const examples = [
    [999, '999'],
    [1000, '1 k'],
    [1234567, '1,2 M'],
    [2500000000, '2,5 Md'],
  ];
  for (const [value, expected] of examples) {
    const result = vm.runInContext(`compact(${value})`, ui.context);
    assert.equal(result, expected);
    assert.ok(!/[\u00a0\u202f?]/.test(result));
  }
  assert.equal(vm.runInContext('fmt(12345)', ui.context), '12 345');
});

test('Resource capacity is visible in the header and all inventory views and refreshes', () => {
  const ui = mount();
  for (const v of ['harvest', 'storage']) {
    vm.runInContext(`state=newGame('fr');view='${v}';shell();`, ui.context);
    assert.ok(ui.get('#content').innerHTML.includes('id="capacity-coal"'));
    assert.ok(ui.get('#app').innerHTML.includes('id="header-capacity-coal"'));
    const before = ui.get('capacity-coal').textContent;
    vm.runInContext("state.tech.push('logistics');updateResourceNumbers();", ui.context);
    assert.notEqual(ui.get('capacity-coal').textContent, before);
    assert.equal(
      ui.get('capacity-coal').textContent,
      vm.runInContext('fmt(capacity(state,RESOURCES[0]))', ui.context),
    );
    assert.ok(ui.get('header-stock-coal').parentElement.title.includes('/'));
  }
});

test('Worker UI uses resource-specific hiring, salary and unpaid notifications', () => {
  const ui = mount();
  vm.runInContext(
    "state=newGame('fr');RESOURCES.forEach(r=>state.levels[r.id]=1);state.workers.cotton=[60,60];view='harvest';shell();",
    ui.context,
  );
  assert.equal(Number(ui.get('payroll-cotton').textContent), 6);
  assert.equal(ui.get('total-wages').textContent, '6 or');
  assert.equal(ui.get('hire-price-cotton').textContent, '67 or');
  vm.runInContext('state.workers.cotton=[0];state.credits=2;checkPayrollNotice();', ui.context);
  assert.match(ui.get('#telegram-message').textContent, /Coton/);
});

test('Market quantity inputs synchronize, clamp to live stock and sell the chosen amount', () => {
  const ui = mount();
  vm.runInContext(
    "state=newGame('fr');state.resources.coal=25.75;view='market';shell();",
    ui.context,
  );
  const html = ui.get('#content').innerHTML;
  assert.ok(!html.includes('data-action="sell-ten"'));
  assert.ok(!html.includes('data-action="sell-resource"'));
  assert.ok(html.includes('id="market-owned-coal"'));
  ui.events.input({ target: { dataset: { marketQuantity: 'coal' }, value: '17' } });
  assert.equal(ui.get('market-slider-coal').value, '17');
  assert.equal(ui.get('market-quantity-coal').value, '17');
  assert.equal(ui.get('market-slider-coal').max, '25');
  ui.events.click({
    target: { closest: () => ({ dataset: { action: 'sell-quantity', id: 'coal' } }) },
  });
  assert.equal(vm.runInContext('state.credits', ui.context), 17);
  assert.equal(vm.runInContext('state.resources.coal', ui.context), 8.75);
  assert.equal(ui.get('market-quantity-coal').value, '8');
  assert.equal(ui.get('market-owned-coal').textContent, '8');
  ui.events.input({ target: { dataset: { marketQuantity: 'coal' }, value: '999' } });
  assert.equal(ui.get('market-slider-coal').value, '8');
  vm.runInContext('state.resources.coal=100;updateNumbers();', ui.context);
  assert.equal(ui.get('market-slider-coal').value, '8');
  ui.events.input({ target: { dataset: { marketQuantity: 'coal' }, value: '' } });
  assert.equal(ui.get('sell-quantity-coal').disabled, true);
  vm.runInContext('state.resources.coal=0;updateNumbers();', ui.context);
  assert.equal(ui.get('market-slider-coal').disabled, true);
});
