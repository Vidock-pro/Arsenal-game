import {
  MAX_FACTORIES,
  factoryCost,
  freeFactories,
  productionBatch,
  productionRecipe,
  patentRequirements,
  productName,
  productionUnlocked,
  productionRequirements,
  hireCost,
  WAGE,
  PAY_PERIOD,
  MARKET_PRICES,
  available,
  activeWorkers,
  COUNTRIES,
  RESOURCES,
  TECHS,
  PRODUCTS,
  PATENTS,
  newGame,
  rate,
  capacity,
  upgradeCost,
  unlocked,
  researchTime,
  productTime,
  salePrice,
  affordable,
  advance,
  act,
  validateSave,
} from './engine.js';
const $ = (s) => document.querySelector(s),
  KEY = 'arsenal.save.v1';
let productionFilter = 'all',
  pinnedResearch = null;
let researchHoverTimer = null,
  researchHoverSquare = null;
// Annule une ouverture différée quand le joueur change de cible ou d’écran.
function cancelResearchHover() {
  clearTimeout(researchHoverTimer);
  researchHoverTimer = null;
  researchHoverSquare = null;
}
let state = null,
  view = 'harvest',
  selected = 'fr',
  screen = 'title',
  last = Date.now(),
  saved = true,
  toastTimer;
const fmt = (n) => Math.floor(n).toLocaleString('fr-FR');
const money = (n) => Math.ceil(n).toLocaleString('fr-FR');
const compact = (n) =>
  n >= 1000 ? n.toLocaleString('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }) : fmt(n);
const dec = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const clock = (n) =>
  `${Math.floor(Math.max(0, n) / 60)
    .toString()
    .padStart(2, '0')}:${Math.ceil(Math.max(0, n) % 60)
    .toString()
    .padStart(2, '0')}`;
const names = {
  harvest: 'Ressources',
  market: 'Marché',
  production: 'Production',
  research: 'Recherche',
  patents: 'Brevets',
  storage: 'Stockage',
};
const icons = { harvest: '⚒', production: '⚙', research: '⚗', patents: '▤', storage: '▥' };
// Affiche brièvement un message après une action.
function notify(t) {
  $('#toast').textContent = t;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
// Enregistre la partie ; une erreur de stockage ne doit pas bloquer le jeu.
function save() {
  if (!state) return;
  try {
    state.lastSaved = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    saved = true;
  } catch {
    saved = false;
  }
}
let offlineMessage = '';
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    state = validateSave(raw);
    const elapsed = Math.min(28800, Math.max(0, (Date.now() - state.lastSaved) / 1000));
    advance(state, elapsed);
    if (elapsed > 60)
      offlineMessage = `Vos ateliers ont travaillé ${Math.floor(elapsed / 60)} min pendant votre absence.`;
    save();
  }
} catch {
  offlineMessage =
    'La sauvegarde locale est illisible. Vous pouvez importer une copie ou commencer une nouvelle partie.';
}
const flag = (id) =>
  /* HTML */ `<span class="flag ${id}" role="img" aria-label="${COUNTRIES[id].name}"
    >${id === 'su'
      ? /* HTML */ `<svg
          class="soviet-flag"
          viewBox="0 0 42 27"
          aria-hidden="true"
          focusable="false"
        >
          <path fill="#a5352b" d="M0 0h42v27H0z" />
          <g fill="#edc966">
            <path d="m10 2 1 3h3l-2.5 2 1 3L10 8l-2.5 2 1-3L6 5h3z" />
            <path d="M12 10c5 1 7 5 5 8-2 4-7 4-10 1l-3 4-2-2 4-4 2 2c3 2 7 0 7-3 0-2-1-4-3-6z" />
            <path d="m5 11 2-2 6 5-2 2-2-2-2 2-3-3 2-2zm4 4 2-2 7 8-2 2z" />
          </g>
        </svg>`
      : ''}</span
  >`;
// Découpe une illustration dans une planche regroupant plusieurs images.
function art(atlas, x, y, w, h, cls = '') {
  return /* HTML */ `<div
    class="art ${cls}"
    style="--x:${x};--y:${y};--w:${w};--h:${h};aspect-ratio:${w}/${h}"
  >
    <img
      src="assets/${atlas}-atlas.png"
      alt=""
      draggable="false"
      style="width:${(1536 / w) * 100}%;left:${(-x / w) * 100}%;top:${(-y / h) * 100}%"
    />
  </div>`;
}
// Toutes les petites icônes utilisent des silhouettes simples dans des cases régulières.
// Les dimensions du dessin sont indépendantes de la taille du bouton ou de la carte.
function compactIcon(atlas, index, columns, rows, classes) {
  return /* HTML */ `<span class="${classes} compact-icon" aria-hidden="true"
    ><img
      src="assets/${atlas}"
      alt=""
      draggable="false"
      style="width:${columns * 100}%;height:${rows * 100}%;left:${-(index % columns) *
      100}%;top:${-Math.floor(index / columns) * 100}%"
  /></span>`;
}
function resourceIcon(id) {
  return compactIcon(
    'resource-icons-simple.png',
    RESOURCES.findIndex((resource) => resource.id === id),
    4,
    3,
    'resource-icon generated-icon',
  );
}
function resourceScene(resource) {
  return /* HTML */ `<div class="art resource-scene" role="img" aria-label="${resource.site}">
    <img
      src="assets/resources-atlas.png"
      alt=""
      draggable="false"
      style="width:400%;height:300%;left:${-(resource.tier % 4) * 100}%;top:${-Math.floor(
        resource.tier / 4,
      ) * 100}%"
    />
  </div>`;
}
function navArt(id) {
  const index = ['harvest', 'market', 'production', 'research', 'patents', 'storage'].indexOf(id);
  return compactIcon('ui-icons-simple.png', index, 3, 3, 'nav-art menu-icon');
}
// Construit les compteurs et les raccourcis du panneau de gestion.
function management() {
  return /* HTML */ `<aside class="management">
    <h2>GESTION</h2>
    <section class="management-card">
      <h3>RENDEMENT</h3>
      <div class="management-stat">
        <span>Récolte auto / min</span><strong id="total-rate"></strong>
      </div>
      <div class="management-stat">
        <span>Salaires / min</span><strong id="total-wages"></strong>
      </div>
      <div class="management-stat">
        <span>Lignes acquises</span><strong id="total-income"></strong>
      </div>
      <div class="management-stat">
        <span>Unités livrées</span><strong id="total-sold"></strong>
      </div>
    </section>
    <section class="management-card">
      <h3>BUREAU D’ÉTUDES</h3>
      ${art('research', 1140, 214, 371, 265)}
      <p id="project-status"></p>
      <div class="meter"><i id="management-research"></i></div>
      <button class="upgrade full" data-view="research">RECHERCHE →</button>
    </section>
    <section class="management-card">
      <h3>ARCHIVE</h3>
      <img
        class="archive-illustration"
        src="assets/archive-library.png"
        alt="Bibliothèque administrative : dossiers, registres et meubles à archives"
        draggable="false"
      />
      <div class="management-stat">
        <span>Technologies</span><strong>${state.tech.length} / ${TECHS.length}</strong>
      </div>
      <div class="management-stat">
        <span>Brevets</span><strong>${state.patents.length} / ${PRODUCTS.length}</strong>
      </div>
      <button class="secondary full" data-view="storage">VOIR LES STOCKS</button>
    </section>
    <div class="live-dot">USINE OPÉRATIONNELLE</div>
  </aside>`;
}
// Affiche le choix de nation et les commandes de reprise de partie.
function title() {
  screen = 'title';
  $('#app').innerHTML = /* HTML */ `<main class="title-screen">
    <header class="title-top">
      <a class="brand" href="#">A<span class="brand-rule"></span></a
      ><span>JEU DE GESTION INDUSTRIELLE · 1914—1945</span
      ><span class="edition">ÉDITION PIXEL / 0.2</span>
    </header>
    <div class="title-body">
      <div class="eyebrow"><i></i> LES INDUSTRIES DE GUERRE</div>
      <h1>ARSENAL<span>Le pouvoir se construit.</span></h1>
      <p class="intro">
        Des premières mines aux grandes manufactures.<br />Récoltez, inventez, produisez. Bâtissez
        votre héritage industriel.
      </p>
      <div class="choose-label">
        <span>01</span> CHOISISSEZ VOTRE NATION <small>Une sauvegarde locale par navigateur.</small>
      </div>
      <div class="countries">
        ${Object.entries(COUNTRIES)
          .map(
            ([id, c]) =>
              /* HTML */ `<button
                class="country ${id === selected ? 'selected' : ''}"
                data-country="${id}"
                aria-pressed="${id === selected}"
              >
                ${flag(id)}<span class="country-name">${c.name}</span
                ><span class="country-motto">${c.motto}</span><strong>${c.bonus}</strong
                ><span class="check">${id === selected ? '✓' : '○'}</span>
              </button>`,
          )
          .join('')}
      </div>
      <div class="title-actions">
        <button class="primary start" data-action="start">
          FONDER MON INDUSTRIE <span>→</span></button
        >${state
          ? /* HTML */ `<button class="secondary" data-action="continue">
              Reprendre · ${COUNTRIES[state.country].name} →
            </button>`
          : ''}
      </div>
      <p class="title-note">
        ${state
          ? 'Une nouvelle partie remplacera votre sauvegarde, après confirmation.'
          : 'Une économie à développer. Des inventions à maîtriser. À votre rythme.'}
      </p>
    </div>
    <footer class="title-footer">
      <span>SOLO · PROGRESSION HORS LIGNE · SANS COMPTE</span>
      <div>
        <button data-action="import">Importer une partie</button
        ><a href="arsenal-source.zip" download>Code source ↗</a><span>MIT · Open source</span>
      </div>
    </footer>
  </main>`;
}
// Choisit un objectif court en fonction de la progression.
function goal() {
  if (!Object.values(state.workers).some((crew) => crew.length))
    return 'Engagez votre premier ouvrier.';
  const next = RESOURCES.find((resource) => !state.levels[resource.id]);
  if (next) return `Prochaine exploitation : ${next.name} · ${fmt(next.cost)} or.`;
  if (!state.lines.some((line) => line.enabled || line.made))
    return 'Préparez votre première ligne d’uniformes.';
  if (!state.totalSold) return 'Première livraison : vendez votre premier lot dans Production.';
  if (state.research)
    return 'Vos ingénieurs travaillent. Rassemblez les ressources nécessaires à la prochaine avancée.';
  if (!state.tech.length) return 'Préparez votre atelier de confection.';
  if (!state.patents.length) return 'Achetez votre première licence de production dans Brevets.';
  return 'Développez vos ateliers, approvisionnez la recherche et débloquez les blindés.';
}
// Reconstruit la structure de l’écran, puis ses compteurs.
function shell() {
  screen = 'game';
  const c = COUNTRIES[state.country];
  $('#app').innerHTML = /* HTML */ `<div class="game-shell">
    <header class="topbar">
      <button class="wordmark" data-action="home">
        ARSENAL<small>LES INDUSTRIES DE GUERRE</small>
      </button>
      <div class="nation-label">
        ${flag(state.country)}<span>${c.name}<small>${c.bonus}</small></span>
      </div>
      <div class="resource-stocks" role="group" aria-label="Stocks de ressources">
        ${RESOURCES.map(
          (resource) =>
            /* HTML */ `<div
              class="resource-stock"
              title="${resource.name}"
              aria-label="${resource.name}"
              role="group"
              tabindex="0"
            >
              ${resourceIcon(resource.id)}<strong id="header-stock-${resource.id}"></strong>
            </div>`,
        ).join('')}
      </div>
      <div class="wallet">
        ${wageIcon()}
        <div><small>TRÉSORERIE</small><strong id="credits"></strong></div>
      </div>
      <button class="icon-btn" data-action="settings" aria-label="Sauvegarde et paramètres">
        ☰
      </button>
    </header>
    <aside class="sidebar">
      <div class="sidebar-label">COMPLEXE INDUSTRIEL</div>
      <nav>
        ${Object.entries(names)
          .map(
            ([id, name]) =>
              /* HTML */ `<button data-view="${id}" class="${view === id ? 'active' : ''}">
                ${navArt(id)}${name}<b>${id === 'research' && state.research ? '•' : ''}</b>
              </button>`,
          )
          .join('')}
      </nav>
      ${art('harvest', 9, 447, 250, 563, 'sidebar-scene')}
      <div class="sidebar-bottom">
        <div class="live-dot">USINE OPÉRATIONNELLE</div>
        <p>L’avenir appartient<br />à ceux qui le fabriquent.</p>
        <a href="arsenal-source.zip" download>↗ Code source · MIT</a
        ><button data-action="home">← Écran titre</button>
      </div>
    </aside>
    <main class="workspace">
      <div class="page-heading">
        <div>
          <p class="eyebrow">
            DIRECTION DES OPÉRATIONS /
            <span>${String(Object.keys(names).indexOf(view) + 1).padStart(2, '0')}</span>
          </p>
          <h1>
            ${{
              harvest: 'Récolte des ressources',
              market: 'Marché des matières premières',
              production: 'Ateliers de production',
              research: 'Bureau de recherche',
              patents: 'Bureau des brevets',
              storage: 'Magasins & réserves',
            }[view]}
          </h1>
        </div>
        <span class="date-badge">CAMPAGNE INDUSTRIELLE<br /><strong>1936</strong></span>
      </div>
      <div class="mission">
        <span>ORDRE DU JOUR</span>
        <p id="current-goal">${goal()}</p>
      </div>
      <div class="workspace-layout">
        <div id="content"></div>
        ${management()}
      </div>
      <footer class="game-footer">
        <span id="save-status">● Sauvegarde automatique</span
        ><span>ARSENAL / VERSION 0.2 · ÉCONOMIE FICTIVE</span>
      </footer>
    </main>
  </div>`;
  renderContent();
  updateNumbers();
}
function workerIcon() {
  return compactIcon('ui-icons-simple.png', 6, 3, 3, 'worker-icon workforce-icon');
}
function wageIcon() {
  return compactIcon('ui-icons-simple.png', 7, 3, 3, 'wage-icon workforce-icon');
}
// Affiche les exploitations, leurs stocks et leurs ouvriers.
function harvest() {
  return /* HTML */ `<div class="section-intro">
      <p>Gérez vos exploitations et leurs ouvriers.</p>
      <span>12 RESSOURCES · OUVERTURE PROGRESSIVE</span>
    </div>
    <div class="resource-grid">
      ${RESOURCES.map((resource, i) => {
        const open = unlocked(state, resource),
          ready = available(state, resource);
        const reason = ready
          ? 'Achetez cette exploitation pour accéder à sa ressource.'
          : `Ouvrez d’abord : ${RESOURCES.find((x) => x.id === resource.previous).name}.`;
        return /* HTML */ `<article class="resource-card ${!open ? 'locked' : ''}">
          <header>
            <h2>${resourceIcon(resource.id)}${resource.name}</h2>
            <span class="level" id="level-${resource.id}"></span>
          </header>
          ${resourceScene(resource)}
          <div class="resource-info">
            <span class="serial">EXPLOITATION ${String(i + 1).padStart(2, '0')}</span>
            <p>${resource.desc}</p>
            ${!open
              ? /* HTML */ `<div class="lock-info">${reason}</div>
                  <button
                    class="upgrade full"
                    data-action="upgrade"
                    data-id="${resource.id}"
                    id="upgrade-${resource.id}"
                  ></button>`
              : /* HTML */ `<div class="stock-row">
                    <div><small>EN RÉSERVE</small><strong id="stock-${resource.id}"></strong></div>
                    <span class="rate" id="rate-${resource.id}"></span>
                  </div>
                  <div class="meter"><i id="bar-${resource.id}"></i></div>
                  <div class="card-actions">
                    <button
                      class="secondary"
                      data-action="harvest"
                      data-id="${resource.id}"
                      id="harvest-${resource.id}"
                    >
                      Récolter +1</button
                    ><button
                      class="upgrade"
                      data-action="upgrade"
                      data-id="${resource.id}"
                      id="upgrade-${resource.id}"
                    ></button>
                  </div>
                  <section class="worker-panel" aria-label="Ouvriers et salaires">
                    <div
                      class="worker-counter"
                      id="crew-${resource.id}"
                      role="group"
                      aria-label="Ouvriers engagés"
                    >
                      ${workerIcon()}<strong id="workers-${resource.id}">0</strong
                      ><span
                        class="worker-status"
                        id="worker-status-${resource.id}"
                        role="img"
                      ></span>
                    </div>
                    <div class="worker-controls">
                      <button
                        class="secondary"
                        data-action="dismiss"
                        data-id="${resource.id}"
                        id="dismiss-${resource.id}"
                        aria-label="Libérer un ouvrier — ${resource.name}"
                        title="Libérer un ouvrier"
                      >
                        −</button
                      ><button
                        class="upgrade"
                        data-action="hire"
                        data-id="${resource.id}"
                        id="hire-${resource.id}"
                        aria-label="Engager un ouvrier — ${resource.name}, ${hireCost(
                          state,
                          resource,
                        ) + WAGE} or"
                        title="Embauche : ${hireCost(
                          state,
                          resource,
                        )} or + ${WAGE} or pour la première minute "
                      >
                        +
                      </button>
                    </div>
                    <div
                      class="worker-wages"
                      id="wages-${resource.id}"
                      role="group"
                      title="Salaire : ${WAGE} or / ouvrier / min"
                    >
                      ${wageIcon()}<strong id="payroll-${resource.id}">0</strong
                      ><small>/ min</small>
                    </div>
                  </section>`}
          </div>
        </article>`;
      }).join('')}
    </div>`;
}
// Affiche les ventes de matières premières.
function market() {
  return /* HTML */ `<div class="section-intro">
      <p>Vendez vos matières premières pour financer vos ouvriers et de nouvelles exploitations.</p>
      <span>PRIX FIXES · PAIEMENT IMMÉDIAT</span>
    </div>
    <div class="market-grid">
      ${RESOURCES.map(
        (resource) =>
          /* HTML */ `<article class="storage-panel market-card">
            <h2 class="resource-name">${resourceIcon(resource.id)}${resource.name}</h2>
            <p class="market-price">
              ${money(MARKET_PRICES[resource.id])} or <small>/ unité</small>
            </p>
            <p>En réserve : <strong id="stock-${resource.id}"></strong></p>
            <div class="market-actions">
              <button
                class="secondary"
                data-action="sell-resource"
                data-id="${resource.id}"
                id="sell-resource-${resource.id}"
              >
                Vendre 1 · ${money(MARKET_PRICES[resource.id])} or</button
              ><button
                class="secondary"
                data-action="sell-ten"
                data-id="${resource.id}"
                id="sell-ten-${resource.id}"
              >
                Vendre 10 · ${money(MARKET_PRICES[resource.id] * 10)} or</button
              ><button
                class="upgrade"
                data-action="sell-all"
                data-id="${resource.id}"
                id="sell-all-${resource.id}"
              ></button>
            </div>
          </article>`,
      ).join('')}
    </div>`;
}
function vehicle(id) {
  const product = PRODUCTS.find((product) => product.id === id);
  return /* HTML */ `<div
    class="production-sprite"
    role="img"
    aria-label="${productName(state, product)}, vue de côté sur une table à dessin industrielle"
  >
    <img
      src="assets/production-${state.country}.png"
      alt=""
      draggable="false"
      style="left:${-(product.tier % 5) * 100}%;top:${-Math.floor(product.tier / 5) * 100}%"
    />
  </div>`;
}
function factoryIcon() {
  return compactIcon('ui-icons-simple.png', 2, 3, 3, 'factory-icon');
}
// Affiche le parc d’usines et les lignes de la catégorie sélectionnée.
function production() {
  const groups = ['all', ...new Set(PRODUCTS.map((product) => product.kind))];
  const selected = PRODUCTS.filter(
    (product) => productionFilter === 'all' || product.kind === productionFilter,
  );
  return /* HTML */ `<div class="section-intro">
      <p>Gérez vos usines et vos lignes de production.</p>
      <span
        >${PRODUCTS.filter((product) => productionUnlocked(state, product)).length} /
        ${PRODUCTS.length} ATELIERS ACCESSIBLES</span
      >
    </div>
    <section class="factory-pool">
      ${factoryIcon()}
      <div>
        <strong>PARC INDUSTRIEL</strong>
        <p id="factory-summary"></p>
      </div>
      <button class="upgrade" data-action="buy-factory" id="buy-factory"></button>
    </section>
    <nav class="production-filters" aria-label="Catégories de production">
      ${groups
        .map(
          (group) =>
            /* HTML */ `<button
              class="secondary ${productionFilter === group ? 'selected' : ''}"
              data-production-filter="${group}"
              aria-pressed="${productionFilter === group}"
            >
              ${group === 'all' ? 'Tout' : group}
            </button>`,
        )
        .join('')}
    </nav>
    <div class="production-list">
      ${selected
        .map((product) => {
          const line = state.lines.find((line) => line.id === product.id),
            requirements = productionRequirements(state, product),
            lock = requirements.length > 0,
            number = String(product.tier + 1).padStart(2, '0');
          return /* HTML */ `<article class="production-card ${lock ? 'production-locked' : ''}">
            <div class="product-art">
              <span class="serial">ATELIER ${number} / ${product.kind}</span>${vehicle(
                product.id,
              )}<span class="blueprint-label"
                >PLAN D’ENSEMBLE · ${COUNTRIES[state.country].icon} / ${number}</span
              >
            </div>
            <div class="product-details">
              <div class="product-heading">
                <div>
                  <p class="product-category">${number} · ${product.name}</p>
                  <h2>${productName(state, product)}</h2>
                </div>
                <span id="status-${product.id}" class="status"></span>
              </div>
              <div class="recipe" aria-label="Matières par unité">
                ${Object.entries(productionRecipe(state, product))
                  .map(
                    ([id, n]) =>
                      /* HTML */ `<span
                        title="${RESOURCES.find((resource) => resource.id === id).name}"
                        >${resourceIcon(id)}<b>${fmt(n)}</b
                        ><small
                          >${RESOURCES.find((resource) => resource.id === id).name}</small
                        ></span
                      >`,
                  )
                  .join('')}
              </div>
              ${lock
                ? /* HTML */ `<div class="production-requirements">
                    <strong>À DÉBLOQUER</strong>
                    <ul>
                      ${requirements.map((reason) => /* HTML */ `<li>${reason}</li>`).join('')}
                    </ul>
                    ${product.unlock && !state.tech.includes(product.unlock)
                      ? '<button class="secondary" data-view="research">Ouvrir la recherche →</button>'
                      : ''}${!state.patents.includes(product.id)
                      ? '<button class="upgrade" data-view="patents">Acheter le brevet →</button>'
                      : ''}
                  </div>`
                : ''}
              <div class="factory-allocation">
                ${factoryIcon()}<strong id="factories-${product.id}"></strong
                ><button
                  class="secondary"
                  data-action="release-factory"
                  data-id="${product.id}"
                  id="release-factory-${product.id}"
                  aria-label="Retirer une usine — ${product.name}"
                >
                  −</button
                ><button
                  class="upgrade"
                  data-action="assign-factory"
                  data-id="${product.id}"
                  id="assign-factory-${product.id}"
                  aria-label="Affecter une usine — ${product.name}"
                >
                  +</button
                ><small id="batch-${product.id}"></small>
              </div>
              <div class="production-stats">
                <span>${dec(productTime(state, product))} s / cycle</span
                ><span>${money(salePrice(state, product))} or / unité</span
                ><span id="made-${product.id}"></span>
              </div>
              <div class="meter"><i id="progress-${product.id}"></i></div>
              <div class="card-actions">
                <button
                  class="secondary"
                  data-action="toggle"
                  data-id="${product.id}"
                  id="toggle-${product.id}"
                ></button
                ><button
                  class="upgrade"
                  data-action="sell"
                  data-id="${product.id}"
                  id="sell-${product.id}"
                ></button>
              </div>
            </div>
          </article>`;
        })
        .join('')}
    </div>`;
}
const researchBranches = [
  'Textile',
  'Armement',
  'Munitions',
  'Véhicules',
  'Blindés',
  'Aviation',
  'Industrie',
];
// Réutilise les pictogrammes compacts pour garder la même palette que les autres écrans.
function researchIcon(id) {
  const materials = {
    sewing: 'cotton',
    confection: 'cotton',
    chemistry: 'gunpowder',
    cartridges: 'copper',
    casting: 'iron',
    rifle_cartridges: 'copper',
    long_arms: 'wood',
    armor: 'manganese',
    alloys: 'nickel',
    airframes: 'bauxite',
    steam: 'coal',
    electricity: 'copper',
    engines: 'oil',
    heavy_engines: 'oil',
    aero_engines: 'oil',
    light_armor: 'iron',
  };
  if (materials[id]) return resourceIcon(materials[id]);
  const icon = [
    'assembly',
    'chassis',
    'mixed_tracks',
    'heavy_press',
    'artillery_machining',
  ].includes(id)
    ? 2
    : ['aviation', 'multiengine'].includes(id)
      ? 3
      : id === 'series'
        ? 4
        : id === 'logistics'
          ? 5
          : 8;
  return compactIcon('ui-icons-simple.png', icon, 3, 3, 'technology-icon');
}
// Chaque branche forme un arbre local : les sous-arbres occupent des couloirs distincts.
// Les prérequis d’une autre branche sont des renvois cliquables, jamais des traits traversants.
function researchLayout(branch) {
  const techs = TECHS.filter((tech) => tech.branch === branch);
  const ids = new Set(techs.map((tech) => tech.id));
  const children = (id) => techs.filter((tech) => tech.requires.includes(id));
  const roots = techs.filter((tech) => !tech.requires.some((id) => ids.has(id)));
  const leaves = (id) =>
    Math.max(
      1,
      children(id).reduce((total, child) => total + leaves(child.id), 0),
    );
  const lanes = roots.reduce((total, root) => total + leaves(root.id), 0);
  const positions = {};
  let cursor = 0;
  function place(tech, depth) {
    const start = cursor,
      descendants = children(tech.id);
    if (descendants.length) descendants.forEach((child) => place(child, depth + 1));
    else cursor++;
    positions[tech.id] = { x: ((start + cursor) / 2 / lanes) * 100, depth };
  }
  roots.forEach((root) => place(root, 0));
  return {
    techs,
    positions,
    lanes,
    height: (Math.max(...Object.values(positions).map((position) => position.depth)) + 1) * 220,
  };
}
function research() {
  return /* HTML */ `<div class="section-intro">
      <p>Consultez les dossiers de recherche.</p>
      <span>${state.tech.length} / ${TECHS.length} RECHERCHES</span>
    </div>
    <div class="research-forest">
      ${researchBranches
        .map((branch) => {
          const layout = researchLayout(branch);
          return /* HTML */ `<section class="research-branch">
            <h2>
              ${branch}<small
                >${layout.techs.filter((tech) => state.tech.includes(tech.id)).length} /
                ${layout.techs.length}</small
              >
            </h2>
            <div
              class="research-tree technology-tree"
              style="height:${layout.height}px"
              aria-label="Arbre ${branch}"
            >
              <svg
                class="research-links"
                viewBox="0 0 320 ${layout.height}"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                ${layout.techs
                  .flatMap((tech) =>
                    tech.requires
                      .filter((id) => layout.positions[id])
                      .map((id) => {
                        const from = layout.positions[id],
                          to = layout.positions[tech.id];
                        return /* HTML */ `<path
                          class="${state.tech.includes(id) ? 'fulfilled' : ''}"
                          d="M${from.x * 3.2} ${from.depth * 220 + 74} V${from.depth * 220 +
                          202} H${to.x * 3.2} V${to.depth * 220 + 18}"
                        />`;
                      }),
                  )
                  .join('')}
              </svg>
              ${layout.techs
                .map((t) => {
                  const i = TECHS.indexOf(t);
                  const done = state.tech.includes(t.id),
                    running = state.research?.id === t.id,
                    ready = t.requires.every((k) => state.tech.includes(k)),
                    { x, depth } = layout.positions[t.id],
                    status = done
                      ? 'VALIDÉ'
                      : running
                        ? 'EN COURS'
                        : ready
                          ? 'ACCESSIBLE'
                          : 'VERROUILLÉ';
                  return /* HTML */ `<div
                    class="research-node ${done
                      ? 'completed'
                      : running
                        ? 'running'
                        : ready
                          ? 'available'
                          : 'locked'}"
                    style="left:${x}%;top:${depth * 220 + 18}px;--lanes:${layout.lanes}"
                    data-pinned="${pinnedResearch === t.id}"
                  >
                    <button
                      class="research-square"
                      data-research-node="${t.id}"
                      aria-label="${t.name} · ${status}"
                      aria-expanded="${pinnedResearch === t.id}"
                      aria-controls="research-detail-${t.id}"
                    >
                      ${researchIcon(t.id)}<span class="research-node-mark" aria-hidden="true"
                        >${done ? '✓' : running ? '◷' : ready ? '+' : '×'}</span
                      ></button
                    ><span class="research-node-name">${t.name}</span
                    ><span class="research-node-state">${status}</span>
                    ${t.requires
                      .filter((id) => TECHS.find((parent) => parent.id === id).branch !== t.branch)
                      .map((id) => {
                        const prerequisite = TECHS.find((parent) => parent.id === id);
                        return /* HTML */ `<button
                          class="research-prerequisite ${state.tech.includes(id) ? 'met' : ''}"
                          data-research-jump="${id}"
                          title="${prerequisite.branch} · ${prerequisite.name}"
                        >
                          ${state.tech.includes(id) ? '✓' : '↗'} ${prerequisite.name}
                        </button>`;
                      })
                      .join('')}
                    <section
                      class="research-detail"
                      id="research-detail-${t.id}"
                      aria-label="${t.name}"
                    >
                      <button
                        class="research-detail-close"
                        data-research-close="${t.id}"
                        aria-label="Fermer le dossier"
                      >
                        ×
                      </button>
                      <div class="resource-info">
                        <span class="serial"
                          >DOSSIER R–0${i + 1} /
                          ${done ? 'VALIDÉ' : running ? 'EN COURS' : 'RECHERCHE'}</span
                        >
                        <h2>${t.name}</h2>
                        <p><strong>Effets :</strong> ${t.desc}</p>
                        <p>
                          <strong>Brevets :</strong> ${PRODUCTS.filter(
                            (product) => product.unlock === t.id,
                          )
                            .map((product) => product.name)
                            .join(', ') || 'Amélioration industrielle'}.
                        </p>
                        <div class="tech-requirements">
                          <strong>Prérequis :</strong> ${t.requires.length
                            ? t.requires.map((k) => TECHS.find((x) => x.id === k).name).join(', ')
                            : 'Aucun'}
                        </div>
                        ${!done && !running
                          ? /* HTML */ `<div
                              class="research-costs"
                              aria-label="Ressources nécessaires"
                            >
                              <strong class="research-cost-heading">Ressources nécessaires :</strong
                              >${Object.entries(t.cost)
                                .map(
                                  ([id, n]) =>
                                    /* HTML */ `<div class="research-cost">
                                      ${resourceIcon(id)}<span
                                        >${RESOURCES.find((resource) => resource.id === id)
                                          .name}</span
                                      ><strong id="research-cost-${t.id}-${id}"></strong>
                                    </div>`,
                                )
                                .join('')}
                            </div>`
                          : ''}${done
                          ? '<div class="done-label">✓ Technologie maîtrisée</div>'
                          : running
                            ? /* HTML */ `<div class="meter"><i id="research-bar"></i></div>
                                <div class="research-time" id="research-time"></div>`
                            : /* HTML */ `<button
                                class="upgrade full"
                                data-action="research"
                                data-id="${t.id}"
                                id="research-${t.id}"
                                ${!ready ? 'disabled' : ''}
                              >
                                Lancer la recherche <small>${clock(researchTime(state, t))}</small>
                              </button>`}
                      </div>
                    </section>
                  </div>`;
                })
                .join('')}
            </div>
          </section>`;
        })
        .join('')}
    </div>
    <div class="research-legend">
      <span>□ Verrouillé</span><span>＋ Accessible</span><span>◷ En cours</span
      ><span>✓ Validé</span>
    </div>`;
}
// Affiche les licences acquises et les achats encore disponibles.
function patents() {
  return /* HTML */ `<div class="section-intro">
      <p>Acquérez les brevets de vos prochains équipements.</p>
      <span>${state.patents.length} / ${PRODUCTS.length} LICENCES ACQUISES</span>
    </div>
    <div class="production-list patent-catalog">
      ${PATENTS.map((product) => {
        const owns = state.patents.includes(product.id),
          requirements = patentRequirements(state, product);
        return /* HTML */ `<article
          class="production-card ${!owns && requirements.length ? 'production-locked' : ''}"
        >
          <div class="product-art">
            <span class="serial"
              >BREVET ${String(product.tier + 1).padStart(2, '0')} / ${product.kind}</span
            >${vehicle(product.id)}<span class="blueprint-label"
              >DOSSIER D’EXPLOITATION · ${COUNTRIES[state.country].icon}</span
            >
          </div>
          <div class="product-details">
            <div class="product-heading">
              <div>
                <p class="product-category">${product.name}</p>
                <h2>${productName(state, product)}</h2>
              </div>
              <span class="status"
                >${owns ? 'ACQUIS' : requirements.length ? 'VERROUILLÉ' : 'DISPONIBLE'}</span
              >
            </div>
            <p>
              Recherche : ${TECHS.find((t) => t.id === product.unlock).name} ·
              ${state.tech.includes(product.unlock) ? 'validée' : 'requise'}
            </p>
            <p>Autorise la ligne de production ${product.name}.</p>
            ${!owns && requirements.length
              ? /* HTML */ `<div class="production-requirements">
                  <ul>
                    ${requirements.map((resource) => /* HTML */ `<li>${resource}</li>`).join('')}
                  </ul>
                </div>`
              : ''}
            <div class="production-stats"><span>${wageIcon()} ${money(product.cost)} or</span></div>
            <div class="card-actions">
              ${owns
                ? '<button class="upgrade" data-view="production">Ouvrir la production →</button>'
                : /* HTML */ `<button
                      class="upgrade"
                      data-action="patent"
                      data-id="${product.id}"
                      id="patent-${product.id}"
                    >
                      Acheter le brevet · ${money(product.cost)} or</button
                    >${!state.tech.includes(product.unlock)
                      ? '<button class="secondary" data-view="research">Recherche →</button>'
                      : requirements.length
                        ? '<button class="secondary" data-view="production">Production précédente →</button>'
                        : ''}`}
            </div>
          </div>
        </article>`;
      }).join('')}
    </div>`;
}
// Regroupe les stocks de matières et les équipements à vendre.
function storage() {
  return /* HTML */ `<div class="section-intro">
      <p>Vos matières premières et vos équipements disponibles.</p>
      <span>INVENTAIRE</span>
    </div>
    <section class="storage-panel">
      <h2>Registre des matières premières</h2>
      ${RESOURCES.map(
        (resource) =>
          /* HTML */ `<div class="inventory-row">
            <span class="resource-name">${resourceIcon(resource.id)}${resource.name}</span>
            <div class="meter"><i id="bar-${resource.id}"></i></div>
            <strong id="stock-${resource.id}"></strong><small id="rate-${resource.id}"></small>
          </div>`,
      ).join('')}
    </section>
    <section class="storage-panel">
      <h2>Équipements prêts à livrer</h2>
      ${PRODUCTS.map(
        (product, i) =>
          /* HTML */ `<div class="inventory-row">
            <span>${productName(state, product)}</span><strong id="warehouse-${product.id}"></strong
            ><button
              class="upgrade"
              data-action="sell"
              data-id="${product.id}"
              id="sell-${product.id}"
            ></button>
          </div>`,
      ).join('')}
    </section>`;
}
// Reconstruit uniquement le contenu de l’onglet ouvert.
function renderContent() {
  cancelResearchHover();
  $('#content').innerHTML = { harvest, market, production, research, patents, storage }[view]();
}
function text(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function width(id, v) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, v)) + '%';
}
function disable(id, value) {
  const el = document.getElementById(id);
  if (el) el.disabled = value;
}
// Rafraîchit les valeurs et les boutons sans reconstruire tout l’écran.
function updateNumbers() {
  if (screen !== 'game') return;
  text('credits', money(state.credits) + ' or');
  text('current-goal', goal());
  text(
    'total-wages',
    fmt(Object.values(state.workers).reduce((n, crew) => n + crew.length * WAGE, 0)) + ' or',
  );
  text(
    'total-rate',
    '+ ' + dec(RESOURCES.reduce((sum, resource) => sum + rate(state, resource) * 60, 0)),
  );
  text('total-income', state.patents.length + ' / ' + PRODUCTS.length);
  text('total-sold', fmt(state.totalSold));
  text(
    'project-status',
    state.research
      ? TECHS.find((t) => t.id === state.research.id).name + ' · ' + clock(state.research.remaining)
      : 'Ingénieurs disponibles',
  );
  width(
    'management-research',
    state.research
      ? 100 *
          (1 -
            state.research.remaining /
              researchTime(
                state,
                TECHS.find((t) => t.id === state.research.id),
              ))
      : 0,
  );
  text(
    'save-status',
    saved ? '● Sauvegarde automatique' : '⚠ Sauvegarde indisponible · exportez votre partie',
  );
  updateResourceNumbers();
  updateProductionNumbers();
  for (const t of TECHS) {
    disable(
      'research-' + t.id,
      !!state.research ||
        state.tech.includes(t.id) ||
        !affordable(state, t.cost) ||
        !t.requires.every((k) => state.tech.includes(k)),
    );
    for (const [id, n] of Object.entries(t.cost)) {
      text('research-cost-' + t.id + '-' + id, fmt(state.resources[id]) + ' / ' + fmt(n));
      const el = document.getElementById('research-cost-' + t.id + '-' + id);
      if (el) el.setAttribute('data-missing', String(state.resources[id] < n));
    }
  }
  if (state.research) {
    const t = TECHS.find((t) => t.id === state.research.id);
    width('research-bar', 100 * (1 - state.research.remaining / researchTime(state, t)));
    text('research-time', `${clock(state.research.remaining)} · Recherche en cours`);
  }
  for (const product of PATENTS)
    disable(
      'patent-' + product.id,
      state.patents.includes(product.id) ||
        patentRequirements(state, product).length > 0 ||
        state.credits < product.cost,
    );
}
// Stocks, prix du marché et disponibilité des ouvriers.
function updateResourceNumbers() {
  for (const resource of RESOURCES) {
    text('stock-' + resource.id, fmt(state.resources[resource.id]));
    const stockEl = document.getElementById('stock-' + resource.id);
    if (stockEl) stockEl.title = `Capacité : ${fmt(capacity(state, resource))}`;
    text('header-stock-' + resource.id, compact(state.resources[resource.id]));
    const headerStock = document.getElementById('header-stock-' + resource.id);
    if (headerStock) {
      headerStock.setAttribute('aria-label', fmt(state.resources[resource.id]));
      headerStock.parentElement.title = `${resource.name} : ${fmt(state.resources[resource.id])}`;
    }
    text('rate-' + resource.id, `+ ${dec(rate(state, resource) * 60)} / min`);
    text(
      'level-' + resource.id,
      state.levels[resource.id] ? `NIV. ${state.levels[resource.id]}` : 'À OUVRIR',
    );
    text(
      'upgrade-' + resource.id,
      `${state.levels[resource.id] ? 'Améliorer' : 'Ouvrir'} · ${fmt(upgradeCost(state, resource))} ◉`,
    );
    disable(
      'upgrade-' + resource.id,
      !available(state, resource) ||
        state.levels[resource.id] >= 100 ||
        state.credits < upgradeCost(state, resource),
    );
    width('bar-' + resource.id, (state.resources[resource.id] / capacity(state, resource)) * 100);
    const crew = state.workers[resource.id],
      active = activeWorkers(state, resource),
      quantity = Math.floor(state.resources[resource.id]);
    text('workers-' + resource.id, crew.length);
    text('payroll-' + resource.id, crew.length * WAGE);
    const crewStatus = !crew.length
      ? 'Aucun ouvrier'
      : active < crew.length
        ? `${active} au travail, ${crew.length - active} en pause : salaire manquant`
        : `${active} au travail · prochain salaire dans ${Math.ceil(Math.min(...crew))} s`;
    const statusEl = document.getElementById('worker-status-' + resource.id);
    if (statusEl) {
      statusEl.textContent = active < crew.length ? 'Ⅱ' : '●';
      statusEl.dataset.state = !crew.length ? 'empty' : active < crew.length ? 'paused' : 'active';
      statusEl.title = crewStatus;
      statusEl.setAttribute('aria-label', crewStatus);
    }
    const crewEl = document.getElementById('crew-' + resource.id);
    if (crewEl) {
      crewEl.title = crewStatus;
      crewEl.setAttribute('aria-label', `${crew.length} ouvrier(s) · ${crewStatus}`);
    }
    const wagesEl = document.getElementById('wages-' + resource.id);
    if (wagesEl)
      wagesEl.setAttribute('aria-label', `Salaires : ${crew.length * WAGE} or par minute`);
    disable('harvest-' + resource.id, state.resources[resource.id] >= capacity(state, resource));
    disable(
      'hire-' + resource.id,
      state.credits < hireCost(state, resource) + WAGE || crew.length >= 100,
    );
    disable('dismiss-' + resource.id, !crew.length);
    disable('sell-resource-' + resource.id, quantity < 1);
    disable('sell-ten-' + resource.id, quantity < 10);
    disable('sell-all-' + resource.id, quantity < 1);
    text(
      'sell-all-' + resource.id,
      `Tout vendre (${fmt(quantity)}) · ${money(quantity * MARKET_PRICES[resource.id])} or`,
    );
  }
}

// Usines disponibles, lots en cours et commandes de chaque ligne.
function updateProductionNumbers() {
  text('factory-summary', state.factories + ' usines · ' + freeFactories(state) + ' disponibles');
  text(
    'buy-factory',
    state.factories >= MAX_FACTORIES
      ? 'Limite atteinte'
      : 'Acheter · ' + money(factoryCost(state)) + ' or',
  );
  disable('buy-factory', state.factories >= MAX_FACTORIES || state.credits < factoryCost(state));
  for (const product of PRODUCTS) {
    const line = state.lines.find((line) => line.id === product.id);
    text('factories-' + product.id, line.factories);
    text(
      'batch-' + product.id,
      line.remaining > 0
        ? line.batch + ' unités en cours'
        : productionBatch(state, product, line) + ' unités disponibles / cycle',
    );
    disable(
      'assign-factory-' + product.id,
      (freeFactories(state) < 1 && line.factories >= line.batch) ||
        !state.patents.includes(product.id),
    );
    disable('release-factory-' + product.id, !line.factories);
    text(
      'status-' + product.id,
      !line.factories && !line.batch
        ? 'AUCUNE USINE'
        : line.enabled
          ? line.remaining > 0
            ? 'EN PRODUCTION'
            : line.stock >= 9999
              ? 'STOCK PLEIN'
              : !productionUnlocked(state, product)
                ? 'PRÉREQUIS MANQUANTS'
                : affordable(state, productionRecipe(state, product))
                  ? 'DÉMARRAGE'
                  : 'MATIÈRES MANQUANTES'
          : productionUnlocked(state, product) || line.remaining > 0
            ? 'À L’ARRÊT'
            : 'VERROUILLÉ',
    );
    disable(
      'toggle-' + product.id,
      !line.enabled &&
        ((!line.factories && !line.batch) ||
          (line.remaining <= 0 && !productionUnlocked(state, product))),
    );
    text('toggle-' + product.id, line.enabled ? 'Ⅱ Suspendre' : '▶ Lancer la production');
    text(
      'sell-' + product.id,
      `Vendre ${line.stock} · ${fmt(line.stock * salePrice(state, product))} ◉`,
    );
    disable('sell-' + product.id, !line.stock);
    text('made-' + product.id, `${line.made} unités fabriquées`);
    text('warehouse-' + product.id, `${line.stock} en stock`);
    width(
      'progress-' + product.id,
      line.remaining > 0 ? 100 * (1 - line.remaining / productTime(state, product)) : 0,
    );
  }
}

// Ouvre les outils de sauvegarde et de restauration.
function settings() {
  const d = document.createElement('dialog');
  d.innerHTML = /* HTML */ `<form method="dialog">
    <div class="modal-header">
      <h2>Archives de l’industrie</h2>
      <button class="icon-btn" aria-label="Fermer">×</button>
    </div>
    <p>
      Votre partie est sauvegardée dans ce navigateur. Exportez-la pour changer d’appareil ou
      conserver une copie.
    </p>
    <div class="modal-actions">
      <button type="button" class="primary" data-action="export">Exporter la sauvegarde</button
      ><button type="button" class="secondary" data-action="import">Importer une sauvegarde</button
      ><a class="secondary" href="arsenal-source.zip" download>Télécharger le code source ↗</a>
    </div>
    <button class="secondary full">Retour à l’usine</button>
  </form>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.showModal();
}
// Exporte une copie de la sauvegarde au format JSON.
function download() {
  save();
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `arsenal-${state.country}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Sauvegarde exportée.');
}
// Valide le fichier avant de remplacer la partie courante.
function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file || file.size > 100000) throw Error();
      const next = validateSave(await file.text());
      if (state && !confirm('Remplacer votre partie actuelle par cette sauvegarde ?')) return;
      state = next;
      advance(state, Math.max(0, (Date.now() - state.lastSaved) / 1000));
      save();
      last = Date.now();
      document.querySelector('dialog')?.close();
      shell();
      notify('Sauvegarde restaurée.');
    } catch {
      notify('Fichier invalide : choisissez une sauvegarde Arsenal au format JSON.');
    }
  };
  input.click();
}
// Seul le carré lance le délai de survol. La fiche reste ensuite accessible.
document.addEventListener('pointerover', (e) => {
  const square = e.target.closest('.research-square');
  if (!square || e.pointerType === 'touch' || square.contains(e.relatedTarget)) return;
  cancelResearchHover();
  researchHoverSquare = square;
  researchHoverTimer = setTimeout(() => {
    if (researchHoverSquare !== square || !square.isConnected) return;
    square.closest('.research-node').setAttribute('data-preview', 'true');
    square.setAttribute('aria-expanded', 'true');
    researchHoverTimer = null;
  }, 1000);
});
document.addEventListener('pointerout', (e) => {
  const square = e.target.closest('.research-square');
  if (square && !square.contains(e.relatedTarget) && researchHoverSquare === square)
    cancelResearchHover();
  const node = e.target.closest('.research-node');
  if (node && !node.contains(e.relatedTarget)) {
    node.removeAttribute('data-preview');
    node
      .querySelector('.research-square')
      .setAttribute(
        'aria-expanded',
        node.getAttribute('data-pinned') === 'true' ? 'true' : 'false',
      );
  }
});
// Les boutons décrivent leur action dans leurs attributs data-* ; le moteur la valide.
document.addEventListener('click', (e) => {
  const button = e.target.closest('button,a');
  if (!button) return;
  if (button.dataset.researchNode) {
    pinnedResearch =
      pinnedResearch === button.dataset.researchNode ? null : button.dataset.researchNode;
    renderContent();
    updateNumbers();
    return;
  }
  if (button.dataset.researchClose) {
    pinnedResearch = null;
    renderContent();
    updateNumbers();
    return;
  }
  if (button.dataset.researchJump) {
    pinnedResearch = button.dataset.researchJump;
    renderContent();
    updateNumbers();
    document
      .querySelector(`[data-research-node="${pinnedResearch}"]`)
      ?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    return;
  }
  if (button.dataset.productionFilter) {
    productionFilter = button.dataset.productionFilter;
    renderContent();
    updateNumbers();
    return;
  }
  if (button.dataset.country) {
    selected = button.dataset.country;
    title();
    return;
  }
  if (button.dataset.view) {
    view = button.dataset.view;
    shell();
    return;
  }
  const a = button.dataset.action;
  if (!a) return;
  if (a === 'start') {
    if (
      state &&
      !confirm(
        'Créer une nouvelle industrie et remplacer la sauvegarde actuelle ? Pensez à l’exporter avant.',
      )
    )
      return;
    state = newGame(selected);
    view = 'harvest';
    last = Date.now();
    save();
    shell();
    return;
  }
  if (a === 'continue') {
    last = Date.now();
    shell();
    if (offlineMessage) {
      notify(offlineMessage);
      offlineMessage = '';
    }
    return;
  }
  if (a === 'home') {
    save();
    title();
    return;
  }
  if (a === 'settings') {
    settings();
    return;
  }
  if (a === 'export') {
    download();
    return;
  }
  if (a === 'import') {
    importSave();
    return;
  }
  if (state && act(state, a, button.dataset.id)) {
    save();
    if (['harvest', 'sell-resource', 'sell-ten', 'sell-all'].includes(a)) {
      updateNumbers();
      return;
    }
    shell();
    if (a === 'patent') notify('Brevet acquis. Votre ligne de production est autorisée.');
  } else notify('Conditions ou ressources insuffisantes.');
});
// Le moteur reçoit le temps écoulé réel, y compris après une pause du navigateur.
setInterval(() => {
  const now = Date.now();
  if (state) {
    const before = state.tech.length,
      completed = state.lines.filter((line) => line.made > 0).length;
    advance(state, (now - last) / 1000);
    if (state.tech.length !== before) {
      if (screen === 'game') shell();
      notify('Recherche terminée : ' + TECHS.find((t) => t.id === state.tech.at(-1)).name);
    } else if (
      screen === 'game' &&
      ['production', 'patents'].includes(view) &&
      completed !== state.lines.filter((line) => line.made > 0).length
    ) {
      shell();
    }
    updateNumbers();
  }
  last = now;
}, 250);
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('pagehide', save);
title();
