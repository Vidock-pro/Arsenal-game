import {
  FRONT_ITEMS,
  armyStats,
  enemyPower,
  autoSalesUnlocked,
  workerMultiplier,
  WORKER_MILESTONES,
  MAX_FACTORIES,
  MAX_STORAGE_LEVEL,
  storageUpgradeCost,
  factoryCost,
  freeFactories,
  productionBatch,
  productionRecipe,
  patentRequirements,
  productName,
  productionUnlocked,
  productionRequirements,
  hireCost,
  workerWage,
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
const fmt = (n) =>
  Math.floor(n)
    .toLocaleString('fr-FR')
    .replace(/[\u00a0\u202f]/g, ' ');
// Afficher précisément les économies de matières, sans tronquer les recettes.
const recipeAmount = (n) =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/[\u00a0\u202f]/g, ' ');
const money = (n) => fmt(Math.ceil(n));
// Unités et espaces explicites : aucun caractère absent de la police du jeu.
const compact = (n) => {
  const units = [
    [1e12, 'T'],
    [1e9, 'Md'],
    [1e6, 'M'],
    [1e3, 'k'],
  ];
  const unit = units.find(([value]) => n >= value);
  if (!unit) return fmt(n);
  return String(Math.floor((n / unit[0]) * 10) / 10).replace('.', ',') + ' ' + unit[1];
};
const dec = (n) =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }).replace(/[\u00a0\u202f]/g, ' ');
const clock = (n) => {
  const seconds = Math.ceil(Math.max(0, n));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
};
const names = {
  harvest: 'Ressources',
  market: 'Marché',
  production: 'Production',
  research: 'Recherche',
  patents: 'Brevets',
  storage: 'Stockage',
  front: 'Front',
};
const icons = { harvest: '⚒', production: '⚙', research: '⚗', patents: '▤', storage: '▥' };
// Un seul lecteur : thème du menu ou ambiance de partie, sans superposition.
// Atténuation commune aux deux pistes, y compris pour les volumes déjà mémorisés.
const MUSIC_BACKGROUND_GAIN = 0.12;
let musicPlayer = null,
  musicTrack = null,
  musicFade = 0,
  musicFadeTimer = null,
  musicTransitionTimer = null,
  pendingMusicTrack = null,
  musicEnabled = true,
  musicVolume = 0.35;
try {
  musicEnabled = localStorage.getItem('arsenal.music.enabled') !== 'false';
  const storedVolume = localStorage.getItem('arsenal.music.volume');
  if (storedVolume !== null && Number.isFinite(Number(storedVolume)))
    musicVolume = Math.max(0, Math.min(1, Number(storedVolume)));
} catch {}
// Monte doucement vers le volume choisi, sans toucher au niveau des télégrammes.
function applyMusicVolume() {
  if (musicPlayer) musicPlayer.volume = musicVolume * MUSIC_BACKGROUND_GAIN * musicFade;
}
function resetMusicFade() {
  clearTimeout(musicFadeTimer);
  musicFadeTimer = null;
  musicFade = 0;
  applyMusicVolume();
}
function startMusicFade() {
  if (
    !musicEnabled ||
    document.hidden ||
    pendingMusicTrack ||
    musicFadeTimer !== null ||
    musicFade >= 1
  )
    return;
  function step() {
    musicFadeTimer = null;
    if (!musicEnabled || document.hidden || musicPlayer.paused) return;
    musicFade = Math.min(1, musicFade + 1 / 80);
    applyMusicVolume();
    if (musicFade < 1) musicFadeTimer = setTimeout(step, 50);
  }
  musicFadeTimer = setTimeout(step, 50);
}
// Un seul lecteur : descente de 1,5 s, changement à silence, puis montée de 4 s.
function cancelMusicTransition() {
  clearTimeout(musicTransitionTimer);
  musicTransitionTimer = null;
  pendingMusicTrack = null;
}
function fadeToMusic(track) {
  pendingMusicTrack = track;
  if (musicTransitionTimer !== null) return;
  clearTimeout(musicFadeTimer);
  musicFadeTimer = null;
  const initial = musicFade;
  let step = 0;
  function lower() {
    musicTransitionTimer = null;
    if (!musicEnabled || document.hidden) {
      cancelMusicTransition();
      return;
    }
    musicFade = initial * Math.max(0, 1 - ++step / 30);
    applyMusicVolume();
    if (step < 30) musicTransitionTimer = setTimeout(lower, 50);
    else {
      const next = pendingMusicTrack;
      cancelMusicTransition();
      musicPlayer.pause();
      resetMusicFade();
      musicPlayer.src = next;
      musicTrack = next;
      musicPlayer.play()?.catch(() => {});
    }
  }
  musicTransitionTimer = setTimeout(lower, 50);
}
function syncMusic() {
  if (!musicEnabled || document.hidden) {
    cancelMusicTransition();
    musicPlayer?.pause();
    resetMusicFade();
    return;
  }
  const track =
    screen === 'title'
      ? 'assets/dogs-of-war-menu-loop.wav'
      : screen === 'defeat'
        ? 'assets/the-way-defeat.mp3'
        : 'assets/rising-sun-game-loop.wav';
  if (!musicPlayer) {
    if (!window.Audio) return;
    musicPlayer = new window.Audio(track);
    musicTrack = track;
    musicPlayer.loop = true;
    musicPlayer.preload = 'auto';
    musicPlayer.onplaying = startMusicFade;
  }
  if (musicTrack !== track && !musicPlayer.paused && musicFade > 0) {
    fadeToMusic(track);
    return;
  }
  if (pendingMusicTrack) {
    cancelMusicTransition();
    startMusicFade();
  }
  if (musicTrack !== track) {
    musicPlayer.pause();
    resetMusicFade();
    musicPlayer.src = track;
    musicTrack = track;
  }
  if (musicPlayer.paused) resetMusicFade();
  applyMusicVolume();
  // La lecture attend un geste si le navigateur bloque le démarrage automatique.
  musicPlayer.play()?.catch(() => {});
}
// Pictogramme vectoriel lisible, sans dépendre des emojis du système.
function musicSpeakerIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>
    ${
      musicEnabled
        ? '<path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>'
        : '<path d="m16 9 6 6m0-6-6 6"/>'
    }
  </svg>`;
}
function musicButton() {
  const label = `${musicEnabled ? 'Couper' : 'Activer'} la musique`;
  return `<button type="button" class="secondary music-toggle" data-action="music-toggle" aria-pressed="${musicEnabled}" aria-label="${label}" title="${label}">${musicSpeakerIcon()}</button>`;
}
function refreshMusicButtons() {
  document.querySelectorAll?.('[data-action="music-toggle"]').forEach((button) => {
    button.innerHTML = musicSpeakerIcon();
    button.setAttribute('title', `${musicEnabled ? 'Couper' : 'Activer'} la musique`);
    button.setAttribute('aria-pressed', String(musicEnabled));
    button.setAttribute('aria-label', `${musicEnabled ? 'Couper' : 'Activer'} la musique`);
  });
}
// Les dépêches attendent leur tour : deux événements simultanés restent lisibles.
const telegramQueue = [];
let telegramActive = false,
  telegramAudio = null,
  wagesBlocked = false;
let telegramMuted = false;
try {
  telegramMuted = localStorage.getItem('arsenal.telegram.muted') === 'true';
} catch {}

// Le navigateur autorise le son après un geste du joueur. Aucun fichier audio à charger.
function unlockTelegramAudio() {
  if (telegramMuted) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    telegramAudio ||= new Audio();
    if (telegramAudio.state === 'suspended') telegramAudio.resume().catch(() => {});
  } catch {
    /* Le télégramme reste visible si le son est indisponible. */
  }
}
function playTelegramSound() {
  if (telegramMuted || !telegramAudio || telegramAudio.state !== 'running') return;
  try {
    const audio = telegramAudio,
      duration = 0.8;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    // Bruit de papier ponctué de petits claquements de rouleau, à faible volume.
    for (let i = 0; i < samples.length; i++) {
      const t = i / audio.sampleRate;
      const pulse = t % 0.085 < 0.012 ? 1 : 0.16;
      samples[i] = (Math.random() * 2 - 1) * pulse * (1 - t / duration);
    }
    const source = audio.createBufferSource(),
      filter = audio.createBiquadFilter(),
      gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    gain.gain.value = 0.09;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    source.start();
  } catch {
    /* Une erreur audio ne doit jamais interrompre la partie. */
  }
}
function showNextTelegram() {
  if (telegramActive || !telegramQueue.length) return;
  telegramActive = true;
  const message = telegramQueue.shift(),
    toast = $('#toast');
  toast.innerHTML = `<div class="telegram-heading"><strong>TÉLÉGRAMME</strong><span>ARSENAL · SERVICE DES DÉPÊCHES</span></div>
    <p id="telegram-message" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="telegram-footer"><span>FIN DE TRANSMISSION</span><button data-action="telegram-sound" aria-pressed="${telegramMuted}">${telegramMuted ? 'Son coupé' : 'Son actif'}</button><button data-action="telegram-close" aria-label="Fermer le télégramme">×</button></div>`;
  $('#telegram-message').textContent = message;
  toast.classList.add('show');
  playTelegramSound();
  toastTimer = setTimeout(closeTelegram, Math.max(6500, message.length * 55));
}
function closeTelegram() {
  if (!telegramActive) return;
  clearTimeout(toastTimer);
  $('#toast').classList.remove('show');
  toastTimer = setTimeout(() => {
    telegramActive = false;
    showNextTelegram();
  }, 300);
}
function notify(message) {
  if (screen === 'defeat') return;
  if (!telegramQueue.includes(message)) telegramQueue.push(message);
  showNextTelegram();
}
// Signale une interruption une seule fois, jusqu’à la reprise du paiement.
function checkPayrollNotice() {
  const stopped = RESOURCES.filter(
    (resource) =>
      state.workers[resource.id].some((time) => time <= 1e-8) &&
      state.credits < workerWage(resource, state),
  );
  const blocked = stopped.length > 0;
  if (blocked && !wagesBlocked)
    notify(
      'Salaires impayés. Récolte suspendue pour les ouvriers non rémunérés : ' +
        stopped.map((resource) => resource.name).join(', ') +
        '.',
    );
  wagesBlocked = blocked;
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
  if (id === 'front') {
    // Deux baïonnettes : acier nervuré, garde, plaquettes de bois et rivets.
    const bayonet = `<path d="M32 3 37 14v23h4v5h-5v14l-1 5h-7l-1-5V42h-5v-5h5V14z" fill="#20251d" stroke="#11170f" stroke-width="2"/>
      <path d="m32 5 4 10v22h-8V15z" fill="#a4ada5"/>
      <path d="m32 5 1 11v21h-5V15z" fill="#d9d8bd"/>
      <path d="M33 15h2v20h-2z" fill="#646f69"/>
      <path d="M29 17h2v16h-2z" fill="#89958b"/>
      <path d="M23 38h17v3H23z" fill="#7d8877"/>
      <path d="M24 38h15v1H24z" fill="#c3b98e"/>
      <path d="M29 42h6v14h-6z" fill="#8d6037"/>
      <path d="M29 43h2v12h-2z" fill="#b08952"/>
      <path d="M33 43h2v13h-2z" fill="#654529"/>
      <path d="M29 46h6v1h-6zm0 5h6v1h-6z" fill="#4d3925"/>
      <path d="M31 44h2v2h-2zm0 8h2v2h-2z" fill="#d2c398"/>
      <path d="M28 57h8v3h-8z" fill="#8a907d"/>
      <path d="M29 57h6v1h-6z" fill="#d0c7a1"/>`;
    return `<span class="nav-art menu-icon compact-icon front-icon" aria-hidden="true"><svg viewBox="0 0 64 64">${[-43, 43].map((angle) => `<g transform="rotate(${angle} 32 32)">${bayonet}</g>`).join('')}</svg></span>`;
  }
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
  if (musicPlayer) syncMusic();
  $('#app').innerHTML = /* HTML */ `<main class="title-screen">
    <header class="title-top">
      <a class="brand" href="#">A<span class="brand-rule"></span></a
      ><span>JEU DE GESTION INDUSTRIELLE · 1914—1945</span
      ><span class="edition">ÉDITION PIXEL / 0.2</span>
      <button
        class="icon-btn title-settings"
        data-action="settings"
        aria-label="Paramètres"
        title="Paramètres"
      >
        ☰
      </button>
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
  if (state.front.status === 'ended')
    return 'Front effondré. Campagne terminée. Le bilan reste consultable dans Front.';
  if (state.front.status === 'paused')
    return 'Assauts suspendus. Réarmez votre armée dans Front avant de reprendre.';
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
// La fin de campagne remplace toute l’interface : aucun contrôle ne reste derrière.
function defeatScreen() {
  screen = 'defeat';
  clearTimeout(toastTimer);
  telegramQueue.length = 0;
  telegramActive = false;
  $('#toast').classList.remove('show');
  $('#toast').innerHTML = '';
  document.querySelector('dialog')?.close?.();
  const f = state.front;
  $('#app').innerHTML = `<main class="defeat-screen">
    <section class="defeat-panel" aria-labelledby="defeat-title">
      <span class="defeat-stamp">TRANSMISSION INTERROMPUE</span>
      <p class="defeat-eyebrow">ÉTAT-MAJOR · ${COUNTRIES[state.country].name}</p>
      <h1 id="defeat-title">DÉFAITE</h1>
      <div class="defeat-rule" aria-hidden="true"></div>
      <p class="defeat-lead">Le front s’est effondré.</p>
      <p>Trois défaites consécutives ont mis fin à votre campagne. Les ateliers se taisent.</p>
      <dl class="defeat-summary"><div><dt>Dernière vague</dt><dd>${fmt(f.wave)}</dd></div><div><dt>Victoires</dt><dd>${fmt(f.victories)}</dd></div><div><dt>Assauts affrontés</dt><dd>${fmt(f.battles)}</dd></div></dl>
      <p class="defeat-saved">Le bilan de votre campagne est conservé.</p>
      <button class="secondary" id="defeat-home" data-action="home">Retour à l’écran titre</button>
    </section>
  </main>`;
  syncMusic();
  document.getElementById('defeat-home')?.focus?.();
}
function shell() {
  if (state.front.status === 'ended') {
    defeatScreen();
    return;
  }
  screen = 'game';
  if (musicPlayer) syncMusic();
  const c = COUNTRIES[state.country];
  $('#app').innerHTML = /* HTML */ `<div class="game-shell">
    <header class="topbar">
      <div class="brand-banner">
        <button class="wordmark" data-action="home">
          ARSENAL<small>LES INDUSTRIES DE GUERRE</small>
        </button>
        <div class="header-controls" aria-label="Paramètres et musique">
          <button class="icon-btn" data-action="settings" aria-label="Sauvegarde et paramètres">
            ☰
          </button>
        </div>
      </div>
      <div class="nation-label">
        ${flag(state.country)}<span>${c.name}<small>${c.bonus}</small></span>
      </div>
      <div class="resource-stocks" role="group" aria-label="Stocks de ressources">
        ${RESOURCES.filter((resource) => unlocked(state, resource))
          .map(
            (resource) =>
              /* HTML */ `<div
                class="resource-stock"
                title="${resource.name}"
                aria-label="${resource.name}"
                role="group"
                tabindex="0"
              >
                ${resourceIcon(resource.id)}<strong id="header-stock-${resource.id}"></strong
                ><span class="header-capacity" id="header-capacity-${resource.id}"></span>
              </div>`,
          )
          .join('')}
      </div>
      <div class="wallet">
        ${wageIcon()}
        <div><small>TRÉSORERIE</small><strong id="credits"></strong></div>
      </div>
    </header>
    <aside class="sidebar">
      <div class="sidebar-label">COMPLEXE INDUSTRIEL</div>
      <nav>
        ${Object.entries(names)
          .map(
            ([id, name]) =>
              /* HTML */ `<button
                data-view="${id}"
                aria-label="${name}"
                title="${name}"
                class="${view === id ? 'active' : ''}"
              >
                ${navArt(id)}<span class="menu-label">${name}</span
                ><b>${id === 'research' && state.research ? '•' : ''}</b>
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
              front: 'Quartier général du front',
            }[view]}
          </h1>
        </div>
        <span class="date-badge">CAMPAGNE INDUSTRIELLE<br /><strong>1936</strong></span>
      </div>
      <div class="mission">
        <span>ORDRE DU JOUR</span>
        <p id="current-goal">${goal()}</p>
        <button class="secondary" data-view="front" id="front-global-status"></button>
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
                    <div>
                      <small>EN RÉSERVE</small><strong id="stock-${resource.id}"></strong
                      ><small class="stock-capacity"
                        >MAX <span id="capacity-${resource.id}"></span
                      ></small>
                    </div>
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
                      Récolter +${state.levels[resource.id]}</button
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
                      ${workerIcon()}<span class="worker-label">Ouvrier</span
                      ><strong id="workers-${resource.id}">0</strong
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
                        ) + workerWage(resource, state)} or"
                        title="Embauche : ${hireCost(state, resource)} or + ${workerWage(
                          resource,
                          state,
                        )} or pour la première minute "
                      >
                        +</button
                      ><span class="worker-hire-price" id="hire-price-${resource.id}"
                        >${money(hireCost(state, resource) + workerWage(resource, state))} or</span
                      >
                    </div>
                    <div
                      class="worker-wages"
                      id="wages-${resource.id}"
                      role="group"
                      title="Salaire : ${workerWage(resource, state)} or / ouvrier / min"
                    >
                      ${wageIcon()}<strong id="payroll-${resource.id}">0</strong
                      ><small>/ min</small>
                    </div>
                    <small class="worker-condition" id="worker-condition-${resource.id}"></small>
                    <small class="worker-bonus" id="worker-bonus-${resource.id}"></small>
                  </section>`}
          </div>
        </article>`;
      }).join('')}
    </div>`;
}
// Affiche les ventes de matières premières.
// La sélection reste stable quand les stocks montent, mais ne dépasse jamais le stock vendable.
const marketQuantities = {};
function updateMarketQuantity(id) {
  if (!state || !RESOURCES.some((resource) => resource.id === id)) return;
  const stock = Math.floor(state.resources[id]);
  const selected = Math.max(0, Math.min(stock, marketQuantities[id] ?? Math.min(1, stock)));
  marketQuantities[id] = selected;
  const field = document.getElementById('market-quantity-' + id);
  const slider = document.getElementById('market-slider-' + id);
  for (const input of [field, slider]) {
    if (!input) continue;
    input.max = String(stock);
    input.disabled = stock === 0;
    // Laisser le joueur vider le champ pendant sa saisie.
    if (!(input === field && document.activeElement === field && field.value === ''))
      input.value = String(selected);
  }
  text('market-owned-' + id, fmt(stock));
  text(
    'sell-quantity-' + id,
    `Vendre ${fmt(selected)} · ${money(selected * MARKET_PRICES[id])} or`,
  );
  disable('sell-quantity-' + id, selected <= 0);
  disable('market-more-' + id, selected >= stock);
  disable('market-less-' + id, selected <= 0);
}
function editMarketQuantity(event) {
  const id = event.target.dataset?.marketQuantity;
  if (!id || !state || !RESOURCES.some((resource) => resource.id === id)) return;
  const value = Number(event.target.value);
  marketQuantities[id] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  updateMarketQuantity(id);
  if (event.type === 'change') event.target.value = String(marketQuantities[id]);
}
document.addEventListener('input', (event) => {
  editMarketQuantity(event);
  if (event.target.id?.startsWith('front-quantity-')) updateFrontNumbers();
  // Le curseur de musique partage le même événement délégué.
  if (event.target.id !== 'music-volume') return;
  musicVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
  applyMusicVolume();
  try {
    localStorage.setItem('arsenal.music.volume', String(musicVolume));
  } catch {}
});
document.addEventListener('change', editMarketQuantity);
function autoSaleControls(resource) {
  if (!autoSalesUnlocked(state) || !unlocked(state, resource)) return '';
  const rule = state.autoSales[resource.id];
  return /* HTML */ `<section
    class="auto-sale-controls"
    aria-label="Vente automatique : ${resource.name}"
  >
    <button
      class="secondary"
      data-action="toggle-auto-sale"
      data-id="${resource.id}"
      id="auto-sale-${resource.id}"
      aria-pressed="${rule.enabled}"
    ></button>
    <label for="auto-reserve-${resource.id}">Réserve à conserver</label>
    <div class="auto-reserve-row">
      <input
        id="auto-reserve-${resource.id}"
        type="number"
        min="0"
        max="${capacity(state, resource)}"
        step="1"
        value="${rule.reserve}"
        inputmode="numeric"
        aria-label="Réserve de ${resource.name}"
      />
      <button class="secondary" data-action="set-auto-reserve" data-id="${resource.id}">
        Enregistrer
      </button>
    </div>
    <small id="auto-reserve-status-${resource.id}"></small>
  </section>`;
}
function market() {
  return /* HTML */ `<div class="section-intro">
      <p>Vendez vos matières premières pour financer vos ouvriers et de nouvelles exploitations.</p>
      <span
        >${autoSalesUnlocked(state)
          ? 'VENTE AUTOMATIQUE DISPONIBLE'
          : 'VENTE AUTO : RECHERCHE MACHINES À COUDRE'}</span
      >
    </div>
    <div class="market-grid">
      ${RESOURCES.map(
        (resource) =>
          /* HTML */ `<article class="storage-panel market-card">
            <h2 class="resource-name">
              <strong class="market-owned" id="market-owned-${resource.id}"></strong>${resourceIcon(
                resource.id,
              )}${resource.name}
            </h2>
            <p class="market-price">
              ${money(MARKET_PRICES[resource.id])} or <small>/ unité</small>
            </p>
            <div class="market-quantity-controls">
              <label for="market-quantity-${resource.id}">Quantité à vendre</label>
              <div class="market-quantity-inputs">
                <input
                  type="range"
                  min="0"
                  max="0"
                  step="1"
                  value="0"
                  id="market-slider-${resource.id}"
                  data-market-quantity="${resource.id}"
                  aria-label="Quantité à vendre : ${resource.name}"
                />
                <div class="market-number-field">
                  <input
                    type="number"
                    min="0"
                    max="0"
                    step="1"
                    value="0"
                    inputmode="numeric"
                    id="market-quantity-${resource.id}"
                    data-market-quantity="${resource.id}"
                  />
                  <div class="market-number-arrows">
                    <button
                      type="button"
                      class="market-step market-step-up"
                      data-market-step="1"
                      data-id="${resource.id}"
                      id="market-more-${resource.id}"
                      aria-label="Augmenter la quantité de ${resource.name}"
                      title="Augmenter la quantité"
                    >
                      <span aria-hidden="true"></span>
                    </button>
                    <button
                      type="button"
                      class="market-step market-step-down"
                      data-market-step="-1"
                      data-id="${resource.id}"
                      id="market-less-${resource.id}"
                      aria-label="Diminuer la quantité de ${resource.name}"
                      title="Diminuer la quantité"
                    >
                      <span aria-hidden="true"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="market-actions">
              <button
                class="upgrade"
                data-action="sell-quantity"
                data-id="${resource.id}"
                id="sell-quantity-${resource.id}"
              ></button>
              <button
                class="upgrade"
                data-action="sell-all"
                data-id="${resource.id}"
                id="sell-all-${resource.id}"
              ></button>
            </div>
            ${autoSaleControls(resource)}
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
                        >${resourceIcon(id)}<b>${recipeAmount(n)}</b
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
// Le premier prérequis dessine la branche principale. Les autres restent des renvois.
// Chaque sous-arbre possède ses couloirs pour éviter tout croisement.
function researchLayout() {
  const root = 'research-root';
  const techs = TECHS;
  const parents = Object.fromEntries(techs.map((tech) => [tech.id, tech.requires[0] || root]));
  const children = (id) => techs.filter((tech) => parents[tech.id] === id);
  const leaves = (id) =>
    Math.max(
      1,
      children(id).reduce((total, child) => total + leaves(child.id), 0),
    );
  const lanes = leaves(root);
  const positions = {};
  let cursor = 0;
  function place(id, depth) {
    const start = cursor,
      descendants = children(id);
    if (descendants.length) descendants.forEach((child) => place(child.id, depth + 1));
    else cursor++;
    positions[id] = { x: ((start + cursor) / 2 / lanes) * 100, depth };
  }
  place(root, 0);
  return {
    root,
    techs,
    parents,
    positions,
    lanes,
    width: lanes * 160,
    height: (Math.max(...Object.values(positions).map((position) => position.depth)) + 1) * 220,
  };
}
function research() {
  const layout = researchLayout();
  return /* HTML */ `<div class="section-intro">
      <p>Consultez les dossiers de recherche.</p>
      <span>${state.tech.length} / ${TECHS.length} RECHERCHES</span>
    </div>
    <div class="research-map-scroll" tabindex="0" aria-label="Arbre de technologie">
      <div
        class="research-tree technology-tree"
        style="height:${layout.height}px;min-width:max(${layout.width}px, ${layout.lanes * 10}rem)"
      >
        <div
          class="research-node research-root"
          style="left:${layout.positions[layout.root].x}%;top:18px;--lanes:${layout.lanes}"
        >
          <span class="research-square"
            >${compactIcon('ui-icons-simple.png', 3, 3, 3, 'technology-icon')}</span
          >
          <span class="research-node-name">Bureau d’études</span>
        </div>
        <svg
          class="research-links"
          viewBox="0 0 320 ${layout.height}"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          ${layout.techs
            .flatMap((tech) =>
              [layout.parents[tech.id]].map((id) => {
                const from = layout.positions[id],
                  to = layout.positions[tech.id];
                return /* HTML */ `<path
                  class="${id === layout.root || state.tech.includes(id) ? 'fulfilled' : ''}"
                  d="M${from.x * 3.2} ${from.depth * 220 + 74} V${from.depth * 220 + 202} H${to.x *
                  3.2} V${to.depth * 220 + 18}"
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
              status = done ? 'VALIDÉ' : running ? 'EN COURS' : ready ? 'ACCESSIBLE' : 'VERROUILLÉ';
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
                .filter((id) => id !== layout.parents[t.id])
                .map((id) => {
                  const prerequisite = TECHS.find((parent) => parent.id === id);
                  return /* HTML */ `<button
                    class="research-prerequisite ${state.tech.includes(id) ? 'met' : ''}"
                    data-research-jump="${id}"
                    title="Prérequis supplémentaire : ${prerequisite.name}"
                  >
                    ${state.tech.includes(id) ? '✓' : '↗'} ${prerequisite.name}
                  </button>`;
                })
                .join('')}
              <section class="research-detail" id="research-detail-${t.id}" aria-label="${t.name}">
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
                    ? /* HTML */ `<div class="research-costs" aria-label="Ressources nécessaires">
                        <strong class="research-cost-heading">Ressources nécessaires :</strong
                        >${Object.entries(t.cost)
                          .map(
                            ([id, n]) =>
                              /* HTML */ `<div class="research-cost">
                                ${resourceIcon(id)}<span
                                  >${RESOURCES.find((resource) => resource.id === id).name}</span
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
            <strong
              ><span id="stock-${resource.id}"></span
              ><small class="stock-capacity">
                / <span id="capacity-${resource.id}"></span></small></strong
            ><small id="rate-${resource.id}"></small>
            <button
              class="upgrade storage-expand"
              data-action="expand-storage"
              data-id="${resource.id}"
              id="expand-storage-${resource.id}"
            ></button>
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
// Rapport persistant : aucune perte n’est cachée dans un simple message temporaire.
function battleReport() {
  const r = state.front.lastBattle;
  if (!r) return '<p>Aucun assaut pour le moment.</p>';
  return `<h3>${r.won ? 'VICTOIRE' : state.front.status === 'ended' ? 'CAPITULATION' : 'DÉFAITE'} · Vague ${fmt(r.wave)}</h3>
    <p>Puissance engagée : ${recipeAmount(r.power)} / ${fmt(r.enemy)}</p>
    <p>${fmt(r.losses)} soldats perdus · ${fmt(r.ammunition)} munitions consommées · ${fmt(r.support)} soutiens utilisés</p>
    <p>${fmt(r.factories)} usines détruites · ${fmt(r.requisitioned)} ouvriers réquisitionnés</p>
    ${r.won ? `<p>Récompense : ${money(r.reward)} or · 10 réservistes arrivés</p>` : ''}`;
}
function front() {
  const f = state.front;
  return `<section class="storage-panel front-overview">
    <h2>${f.status === 'ended' ? 'CAMPAGNE TERMINÉE' : 'DÉFENDRE LE FRONT'}</h2>
    <p id="front-status" role="status"></p>
    <div class="front-stats">
      <p>Vague <strong id="front-wave"></strong></p><p>Prochain assaut <strong id="front-timer"></strong></p>
      <p>Notre puissance <strong id="front-power"></strong></p><p>Menace ennemie <strong id="front-enemy"></strong></p>
      <p>Soldats <strong id="front-soldiers"></strong></p><p>Réservistes <strong id="front-reservists"></strong></p>
      <p>Défaites consécutives <strong id="front-defeats"></strong></p><p>Moral <strong id="front-morale"></strong></p>
    </div>
    <div class="front-actions">
      <button class="primary" id="front-assault" data-action="front-assault">Déclencher l’assaut</button>
      ${f.status === 'paused' ? '<button class="secondary" data-action="front-resume">Reprendre la préparation · 10 min</button>' : ''}
      <button class="secondary" id="front-recruit" data-action="front-recruit">Équiper les réservistes</button>
    </div>
    <p>Un uniforme équipe un réserviste. Les soldats sans fusil ou sans munition défendent moins efficacement. Le soutien renforce l’armée et réduit ses pertes.</p>
    <p>Le compte à rebours avance uniquement pendant le jeu actif. Après une victoire, la vague suivante arrive dans 10 minutes.</p>
    <p>1re et 2e défaites : −10 % d’usines et −25 % d’ouvriers réquisitionnés, arrondis au supérieur. Moral : −10 %, puis −20 %. Une victoire restaure le moral. 3e défaite consécutive : fin de partie.</p>
    ${f.status === 'ended' ? '<p>Votre industrie est arrêtée. La sauvegarde et le bilan restent disponibles.</p><button class="secondary" data-action="home">Retour à l’écran titre</button>' : ''}
  </section>
  <section class="storage-panel front-log">${battleReport()}</section>
  <section class="storage-panel front-supply"><h2>APPROVISIONNER L’ARMÉE</h2>
    <p>Seuls les équipements que vous livrez ici sont envoyés au front.</p>
    ${FRONT_ITEMS.map((id) => {
      const p = PRODUCTS.find((p) => p.id === id);
      return `<div class="front-supply-row"><div><h3>${p.name}</h3><p>${productName(state, p)}</p>
        <p>En stock : <strong id="front-stock-${id}"></strong> · Au front : <strong id="front-equipped-${id}"></strong></p></div>
        <div class="front-delivery"><label for="front-quantity-${id}">Quantité</label>
        <div class="market-number-field">
          <input type="number" id="front-quantity-${id}" min="1" step="1" value="1" inputmode="numeric" />
          <div class="market-number-arrows">
            <button type="button" class="market-step market-step-up" data-front-step="1" data-id="${id}" id="front-more-${id}" aria-label="Augmenter la livraison : ${p.name}"><span aria-hidden="true"></span></button>
            <button type="button" class="market-step market-step-down" data-front-step="-1" data-id="${id}" id="front-less-${id}" aria-label="Réduire la livraison : ${p.name}"><span aria-hidden="true"></span></button>
          </div>
        </div>
        <button class="secondary" data-action="front-deliver" data-id="${id}" id="front-deliver-${id}">Livrer</button></div></div>`;
    }).join('')}
  </section>`;
}
function updateFrontNumbers() {
  if (view !== 'front') return;
  const f = state.front,
    stats = armyStats(state);
  text(
    'front-status',
    f.status === 'ended'
      ? 'Trois défaites consécutives : le front s’est effondré.'
      : f.status === 'paused'
        ? 'Assauts suspendus : réarmez votre armée.'
        : 'Préparation en cours.',
  );
  text('front-wave', f.wave);
  text('front-timer', f.status === 'preparing' ? clock(f.remaining) : '—');
  text('front-power', recipeAmount(stats.power));
  text('front-enemy', fmt(enemyPower(state)));
  text('front-soldiers', fmt(f.soldiers));
  text('front-reservists', fmt(f.reservists));
  text('front-defeats', `${f.defeats} / 3`);
  text('front-morale', `${Math.round(stats.morale * 100)} %`);
  disable('front-assault', f.status === 'ended');
  disable('front-recruit', !f.reservists || !f.equipment.uniform);
  for (const id of FRONT_ITEMS) {
    const stock = state.lines.find((l) => l.id === id).stock;
    text('front-stock-' + id, fmt(stock));
    text('front-equipped-' + id, fmt(f.equipment[id]));
    disable('front-deliver-' + id, stock < 1);
    const input = document.getElementById('front-quantity-' + id);
    if (input) {
      input.min = stock ? '1' : '0';
      input.max = String(stock);
      input.disabled = f.status === 'ended' || stock === 0;
      if (document.activeElement !== input) {
        const chosen = Math.floor(Number(input.value) || 1);
        input.value = String(stock ? Math.max(1, Math.min(stock, chosen)) : 0);
      }
      const quantity = Number(input.value);
      disable('front-more-' + id, !stock || quantity >= stock);
      disable('front-less-' + id, !stock || quantity <= 1);
      disable(
        'front-deliver-' + id,
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > stock,
      );
    }
  }
}
function announceBattle() {
  const f = state.front,
    r = f.lastBattle;
  notify(
    f.status === 'ended'
      ? 'Capitulation. Trois défaites consécutives : campagne terminée. Consultez votre bilan dans Front.'
      : `${r.won ? 'Victoire' : 'Défaite'} au front, vague ${r.wave}. ${r.losses} soldats perdus. ${r.factories} usines détruites, ${r.requisitioned} ouvriers réquisitionnés.${r.won ? ' La prochaine vague se prépare.' : ' Assauts suspendus : réarmez votre armée.'}`,
  );
}

// Reconstruit uniquement le contenu de l’onglet ouvert.
function renderContent() {
  cancelResearchHover();
  $('#content').innerHTML = { harvest, market, production, research, patents, storage, front }[
    view
  ]();
}
function text(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
// Prix accompagné des mêmes lingots que la trésorerie et les salaires.
function goldLabel(id, label) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<span class="gold-price-label">${label}${wageIcon()}</span>`;
  el.setAttribute('aria-label', label + ' or');
}
function width(id, v) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, v)) + '%';
}
function disable(id, value) {
  const el = document.getElementById(id);
  if (el) el.disabled = value || state?.front.status === 'ended';
}
// Rafraîchit les valeurs et les boutons sans reconstruire tout l’écran.
function updateNumbers() {
  if (screen !== 'game') return;
  updateFrontNumbers();
  text(
    'front-global-status',
    state.front.status === 'ended'
      ? 'Front · campagne terminée'
      : state.front.status === 'paused'
        ? 'Front · assauts suspendus'
        : `Front · vague ${state.front.wave} · ${clock(state.front.remaining)}`,
  );
  text('credits', money(state.credits) + ' or');
  text('current-goal', goal());
  text(
    'total-wages',
    fmt(
      RESOURCES.reduce(
        (n, resource) => n + state.workers[resource.id].length * workerWage(resource, state),
        0,
      ),
    ) + ' or',
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
    const maxStock = capacity(state, resource);
    text('capacity-' + resource.id, fmt(maxStock));
    const storageMaxed = state.storageLevels[resource.id] >= MAX_STORAGE_LEVEL;
    if (view === 'storage') {
      if (!unlocked(state, resource)) text('expand-storage-' + resource.id, 'Exploitation requise');
      else if (storageMaxed) text('expand-storage-' + resource.id, 'Capacité maximale');
      else
        goldLabel(
          'expand-storage-' + resource.id,
          `Agrandir à ${fmt(maxStock * 2)} · ${money(storageUpgradeCost(state, resource))}`,
        );
      disable(
        'expand-storage-' + resource.id,
        !unlocked(state, resource) ||
          storageMaxed ||
          state.credits < storageUpgradeCost(state, resource),
      );
    }

    text('header-capacity-' + resource.id, '/ ' + compact(maxStock));
    text('stock-' + resource.id, fmt(state.resources[resource.id]));
    const stockEl = document.getElementById('stock-' + resource.id);
    if (stockEl) stockEl.title = `Capacité : ${fmt(capacity(state, resource))}`;
    text('header-stock-' + resource.id, compact(state.resources[resource.id]));
    const headerStock = document.getElementById('header-stock-' + resource.id);
    if (headerStock) {
      headerStock.setAttribute(
        'aria-label',
        `${fmt(state.resources[resource.id])} sur ${fmt(maxStock)}`,
      );
      headerStock.parentElement.title = `${resource.name} : ${fmt(state.resources[resource.id])} / ${fmt(maxStock)}`;
    }
    text('rate-' + resource.id, `+ ${dec(rate(state, resource) * 60)} / min`);
    text(
      'level-' + resource.id,
      state.levels[resource.id] ? `NIV. ${state.levels[resource.id]}` : 'À OUVRIR',
    );
    goldLabel(
      'upgrade-' + resource.id,
      `${state.levels[resource.id] ? 'Améliorer' : 'Ouvrir'} · ${fmt(upgradeCost(state, resource))}`,
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
    text(
      'hire-price-' + resource.id,
      money(hireCost(state, resource) + workerWage(resource, state)) + ' or',
    );
    text('payroll-' + resource.id, crew.length * workerWage(resource, state));
    const full = state.resources[resource.id] >= maxStock;
    const crewStatus = !crew.length
      ? 'Aucun ouvrier'
      : active < crew.length
        ? `${active} au travail, ${crew.length - active} en pause : salaire manquant`
        : full
          ? 'Chômage partiel · stock plein · salaire réduit de 50 %'
          : `${active} au travail · prochain salaire dans ${Math.ceil(Math.min(...crew))} s`;
    text(
      'worker-condition-' + resource.id,
      full && crew.length ? 'Chômage partiel · salaire −50 %' : '',
    );
    const multiplier = workerMultiplier(active);
    const nextBonus = WORKER_MILESTONES.find((step) => step.count > active);
    text(
      'worker-bonus-' + resource.id,
      multiplier > 1
        ? `Équipe · récolte +${Math.round((multiplier - 1) * 100)} %`
        : 'Prochain bonus : 5 ouvriers',
    );
    const bonusEl = document.getElementById('worker-bonus-' + resource.id);
    if (bonusEl)
      bonusEl.title = nextBonus
        ? `Prochain palier : ${nextBonus.count} ouvriers rémunérés`
        : 'Bonus maximal de l’équipe';
    const statusEl = document.getElementById('worker-status-' + resource.id);
    if (statusEl) {
      statusEl.textContent = active < crew.length || full ? 'Ⅱ' : '●';
      statusEl.dataset.state = !crew.length
        ? 'empty'
        : active < crew.length
          ? 'paused'
          : full
            ? 'idle'
            : 'active';
      statusEl.title = crewStatus;
      statusEl.setAttribute('aria-label', crewStatus);
    }
    const crewEl = document.getElementById('crew-' + resource.id);
    if (crewEl) {
      crewEl.title = crewStatus;
      crewEl.setAttribute('aria-label', `${crew.length} ouvrier(s) · ${crewStatus}`);
    }
    const wagesEl = document.getElementById('wages-' + resource.id);
    if (wagesEl) {
      wagesEl.title = `Salaire : ${workerWage(resource, state)} or / ouvrier / min`;
      wagesEl.setAttribute(
        'aria-label',
        `Salaires : ${crew.length * workerWage(resource, state)} or par minute`,
      );
    }
    disable('harvest-' + resource.id, state.resources[resource.id] >= capacity(state, resource));
    disable(
      'hire-' + resource.id,
      state.credits < hireCost(state, resource) + workerWage(resource, state) || crew.length >= 100,
    );
    disable('dismiss-' + resource.id, !crew.length);
    if (view === 'market') {
      updateMarketQuantity(resource.id);
      const rule = state.autoSales[resource.id];
      text(
        'auto-sale-' + resource.id,
        rule.enabled ? 'Vente auto : active' : 'Activer la vente auto',
      );
      const toggle = document.getElementById('auto-sale-' + resource.id);
      if (toggle) toggle.setAttribute('aria-pressed', String(rule.enabled));
      text('auto-reserve-status-' + resource.id, `Réserve enregistrée : ${fmt(rule.reserve)}`);
      const reserve = document.getElementById('auto-reserve-' + resource.id);
      if (reserve) reserve.max = String(capacity(state, resource));
    }
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
    goldLabel(
      'sell-' + product.id,
      `Vendre ${line.stock} · ${fmt(line.stock * salePrice(state, product))}`,
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
      <h2>Paramètres</h2>
      <button class="icon-btn" aria-label="Fermer">×</button>
    </div>
    <p>
      Votre partie est sauvegardée dans ce navigateur. Exportez-la pour changer d’appareil ou
      conserver une copie.
    </p>
    <section class="music-settings" aria-label="Ambiance musicale">
      <strong
        >${screen === 'title'
          ? 'Dogs of War · Musique du menu'
          : 'Rising Sun · Musique de partie'}</strong
      >
      ${musicButton()}
      <label for="music-volume">Volume de la musique</label>
      <input
        id="music-volume"
        type="range"
        min="0"
        max="100"
        step="1"
        value="${Math.round(musicVolume * 100)}"
      />
    </section>
    <div class="modal-actions">
      <button type="button" class="primary" data-action="export" ${!state ? 'disabled' : ''}>
        Exporter la sauvegarde</button
      ><button type="button" class="secondary" data-action="import">Importer une sauvegarde</button
      ><a class="secondary" href="arsenal-source.zip" download>Télécharger le code source ↗</a>
    </div>
    <button class="secondary full">
      ${screen === 'title' ? 'Retour au menu' : 'Retour à l’usine'}
    </button>
  </form>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.showModal();
}
// Exporte une copie de la sauvegarde au format JSON.
function download() {
  if (!state) return;
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
// Le premier geste clavier peut aussi débloquer le son après un refus d’autoplay.
document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (!musicPlayer || musicPlayer.paused) syncMusic();
});
// Les boutons décrivent leur action dans leurs attributs data-* ; le moteur la valide.
document.addEventListener('click', (e) => {
  unlockTelegramAudio();
  const button = e.target.closest('button,a');
  if (screen === 'defeat' && button?.dataset.action !== 'home') return;
  if (button?.dataset.action !== 'music-toggle') syncMusic();
  if (!button) return;
  if (button.dataset.frontStep) {
    const id = button.dataset.id;
    if (!state || state.front.status === 'ended' || !FRONT_ITEMS.includes(id)) return;
    const stock = state.lines.find((line) => line.id === id).stock;
    const input = document.getElementById('front-quantity-' + id);
    if (!input || !stock) return;
    input.value = String(
      Math.max(
        1,
        Math.min(stock, Math.floor(Number(input.value) || 1) + Number(button.dataset.frontStep)),
      ),
    );
    updateFrontNumbers();
    return;
  }
  if (button.dataset.marketStep) {
    const id = button.dataset.id;
    if (!state || !RESOURCES.some((resource) => resource.id === id)) return;
    marketQuantities[id] = (marketQuantities[id] ?? 0) + Number(button.dataset.marketStep);
    updateMarketQuantity(id);
    return;
  }
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
  if (a === 'music-toggle') {
    musicEnabled = !musicEnabled;
    try {
      localStorage.setItem('arsenal.music.enabled', String(musicEnabled));
    } catch {}
    syncMusic();
    refreshMusicButtons();
    return;
  }
  if (a === 'telegram-close') {
    closeTelegram();
    return;
  }
  if (a === 'telegram-sound') {
    telegramMuted = !telegramMuted;
    button.textContent = telegramMuted ? 'Son coupé' : 'Son actif';
    button.setAttribute('aria-pressed', String(telegramMuted));
    try {
      localStorage.setItem('arsenal.telegram.muted', String(telegramMuted));
    } catch {}
    if (!telegramMuted) unlockTelegramAudio();
    return;
  }
  if (a === 'start') {
    if (
      state &&
      !confirm(
        'Créer une nouvelle industrie et remplacer la sauvegarde actuelle ? Pensez à l’exporter avant.',
      )
    )
      return;
    state = newGame(selected);
    wagesBlocked = false;
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
  if (a === 'front-deliver' && state) {
    const input = document.getElementById('front-quantity-' + button.dataset.id);
    if (input && input.value.trim() && act(state, a, button.dataset.id, Number(input.value))) {
      save();
      updateNumbers();
    } else
      notify('Livraison impossible : choisissez une quantité entière disponible dans votre stock.');
    return;
  }
  if (a === 'set-auto-reserve' && state) {
    const input = document.getElementById('auto-reserve-' + button.dataset.id);
    if (
      input &&
      input.value.trim() !== '' &&
      act(state, a, button.dataset.id, Number(input.value))
    ) {
      save();
      updateNumbers();
    } else notify('Choisissez une réserve entière entre zéro et la capacité du stock.');
    return;
  }
  if (state && act(state, a, button.dataset.id, marketQuantities[button.dataset.id])) {
    save();
    if (['harvest', 'sell-resource', 'sell-ten', 'sell-all', 'sell-quantity'].includes(a)) {
      updateNumbers();
      return;
    }
    shell();
    if (a === 'patent') notify('Brevet acquis. Votre ligne de production est autorisée.');
    if (a === 'front-assault') announceBattle();
  } else
    notify(
      state?.front.status === 'ended'
        ? 'Campagne terminée. Votre bilan reste consultable dans Front.'
        : 'Conditions ou ressources insuffisantes.',
    );
});
// Le moteur reçoit le temps écoulé réel, y compris après une pause du navigateur.
setInterval(() => {
  const now = Date.now();
  if (state) {
    const before = state.tech.length,
      battlesBefore = state.front.battles,
      completed = state.lines.filter((line) => line.made > 0).length;
    advance(state, (now - last) / 1000, {
      frontActive: screen === 'game' && !document.hidden && now - last < 2000,
    });
    if (state.front.battles !== battlesBefore) {
      save();
      if (state.front.status === 'ended') view = 'front';
      if (screen === 'game') shell();
      announceBattle();
    }
    checkPayrollNotice();
    if (state.tech.length !== before) {
      if (screen === 'game') shell();
      notify(
        'Recherche terminée : ' +
          TECHS.find((t) => t.id === state.tech.at(-1)).name +
          (state.tech.at(-1) === 'sewing'
            ? '. Une usine offerte est disponible. Vente automatique débloquée au marché.'
            : ''),
      );
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
  if (musicPlayer) syncMusic();
});
window.addEventListener('pagehide', save);
title();
// Tente le démarrage dès l’ouverture ; un refus sera retenté au premier geste.
syncMusic();
