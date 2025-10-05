import './config.js';
import { topRated, meaningfulDescriptionFor, listAllGenres, listFilmsInGenre } from './api.js';
import { FALLBACK_SVG_DATA, viaProxy } from './posters.js';   // ⬅️ use viaProxy
import './modal.js';

// --------------------------- DOM refs for the “Best film” section
const els = {
  bestImg:   document.getElementById('best-img'),
  bestTitle: document.getElementById('best-title'),
  bestDesc:  document.getElementById('best-desc'),
  bestBtn:   document.getElementById('best-details-btn')
           || document.querySelector('#best-film .jsi-btn--primary'),
};

// --------------------------- Breakpoints + counts used by all grids  // NEW
const BP = { md: 768, lg: 992 };
const GRID_MAX = 6;      // desktop visible count (3 x 2)
const XS_COLLAPSED = 2;  // mobile collapsed
const MD_COLLAPSED = 4;  // tablet collapsed
const EXPANDED = 6;      // expanded on xs/md

// --------------------------- HELPERS

// Shortens text description if unable to fit in container
function truncate(text, max = 240) {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return (i > 0 ? cut.slice(0, i) : cut) + '…';
}

// Pick first movie with a non-empty description
async function pickFirstValidMovie(candidates, maxChecks = 10) {
  const n = Math.min(candidates.length, maxChecks);
  for (let i = 0; i < n; i++) {
    const m = candidates[i];
    const blurb = await meaningfulDescriptionFor(m);
    if (blurb) return { movie: m, blurb };
  }
  return null;
}

// Excludes one id from a list (used by Top Rated)
function filterOutId(list, id) {
  if (id == null) return list;
  const sid = String(id);
  return list.filter(m => String(m.id) !== sid);
}

// initial visible count by viewport
function computeVisibleCount(expanded, w = window.innerWidth) {
  if (w >= BP.lg) return GRID_MAX;
  if (w >= BP.md) return expanded ? EXPANDED : MD_COLLAPSED;
  return expanded ? EXPANDED : XS_COLLAPSED;
}

//--------------------------- Best Film Section

// gathers data for best film
function renderBest({ movie, blurb }) {
  if (els.bestImg) {
    els.bestImg.src = FALLBACK_SVG_DATA; // instant placeholder
    els.bestImg.alt = movie.title || '';
    els.bestImg.decoding = 'async';
    els.bestImg.setAttribute('sizes', '(min-width: 992px) 25vw, 100vw');
    els.bestImg.src = viaProxy(movie.image_url); // always goes through backend proxy to avoid 404 console errors
  }
  if (els.bestTitle) els.bestTitle.textContent = movie.title || '';
  if (els.bestDesc)  els.bestDesc.textContent  = truncate(blurb, 240);
  if (els.bestBtn)   els.bestBtn.onclick       = () => window.openMovieModal?.(movie);
}

// Renders Best Film UI
async function initBestFilm() {
  try {
    const data = await topRated({ limit: 15 });
    const list = Array.isArray(data?.results) ? data.results : data;

    const chosen = await pickFirstValidMovie(list, 10);
    if (chosen) {
      renderBest(chosen);
      return chosen.movie?.id ?? null;   // ← return the ID
    }

    // graceful fallback
    els.bestTitle && (els.bestTitle.textContent = 'Meilleur film introuvable');
    els.bestDesc  && (els.bestDesc.textContent  = 'Aucun film avec affiche et description disponibles.');
    els.bestImg   && (els.bestImg.src = FALLBACK_SVG_DATA);
    return null;
  } catch (err) {
    console.error('[Best film] init failed:', err);
    els.bestImg && (els.bestImg.src = FALLBACK_SVG_DATA);
    return null;
  }
}

//--------------------------- Top Rated Section

// Function to set the HTML for a top-rated card to be inserted in the grid
function buildCard(item){
  const col = document.createElement('div');
  col.className = 'col';
  col.setAttribute('role', 'listitem');

  col.innerHTML = `
    <article class="film-card">
      <figure class="poster-box m-0">
        <img
          class="poster-img d-block w-100 h-100"
          alt="${item.title ? `Affiche de ${item.title}` : 'Affiche de film'}"
          src="${FALLBACK_SVG_DATA}"
          referrerpolicy="no-referrer"
        >
        <figcaption class="visually-hidden">${item.title || ''}</figcaption>

        <div class="film-overlay jusitify-content-center">
          <div class="overlay-top">
            <h3 class="overlay-title-sm m-0">
              ${item.title || ''}
            </h3>
          </div>

          <div class="overlay-bottom">
            <button
              type="button"
              class="jsi-btn jsi-btn--overlay"
              aria-label="Afficher les détails pour ${item.title || 'ce film'}"
              data-id="${item.id}"
            >
              Détails
            </button>
          </div>
        </div>
      </figure>
    </article>
  `;

  const img = col.querySelector('img.poster-img');
  img.src = viaProxy(item.image_url || '');

  const btn = col.querySelector('.jsi-btn--overlay');
  btn.addEventListener('click', () => window.openMovieModal?.(item));

  return col;
}

// --------------------------- Generic grid controller  // NEW
function createGridSection({ gridEl, toggleBtn }) {
  const state = { items: [], expanded: false };

  function render() {
    if (!gridEl) return;
    gridEl.setAttribute('aria-busy', 'true');
    gridEl.innerHTML = '';

    const count = computeVisibleCount(state.expanded);
    const n = Math.min(state.items.length, count);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) frag.appendChild(buildCard(state.items[i]));
    gridEl.appendChild(frag);
    gridEl.setAttribute('aria-busy', 'false');

    if (toggleBtn) {
      const onDesktop = window.innerWidth >= BP.lg;
      const wrap = toggleBtn.closest('.d-lg-none');
      if (wrap) wrap.classList.toggle('d-none', onDesktop);
      toggleBtn.setAttribute('aria-expanded', String(state.expanded));
      const more = toggleBtn.dataset.labelMore || 'Voir plus';
      const less = toggleBtn.dataset.labelLess || 'Voir moins';
      toggleBtn.textContent = state.expanded ? less : more;
    }
  }

  function setItems(list) {
    state.items = Array.isArray(list) ? list : [];
    render();
  }

  function bindToggle() {
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
      state.expanded = !state.expanded;
      render();
    });
  }

  function bindResize() {
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(render, 120);
    });
  }

  return { state, setItems, render, bindToggle, bindResize };
}
// --------------------------- Top Rated (now uses controller)  // REPLACED
const topRatedEls = {
  grid: document.getElementById('top-rated-grid'),
  toggle: document.getElementById('tr-toggle'),
};
const topRatedCtrl = createGridSection({ gridEl: topRatedEls.grid, toggleBtn: topRatedEls.toggle });
topRatedCtrl.bindToggle();
topRatedCtrl.bindResize();

async function loadTopRated(excludeIdValue){
  try {
    const HEADROOM = 10; // fetch a few more to allow exclusion
    const data = await topRated({ limit: GRID_MAX + HEADROOM, page: 1 });
    const list = Array.isArray(data?.results) ? data.results : data;
    const filtered = filterOutId(list, excludeIdValue);
    topRatedCtrl.setItems(filtered.slice(0, GRID_MAX));
    console.debug('[Top rated] excluded id =', excludeIdValue, 'first card =', filtered[0]?.id);
  } catch (err) {
    console.error('[Top rated] fetch failed:', err);
    topRatedCtrl.setItems([]);
  }
}

// --------------------------- Fixed-genre sections (#1 and #2)  // NEW
function initFixedGenreSection({ sectionId, gridId, toggleId }) {
  const section = document.getElementById(sectionId);
  if (!section) return null;

  const genreName = (section.dataset.genre || '').trim(); // trusts data-genre in HTML
  const gridEl = document.getElementById(gridId);
  const toggleBtn = document.getElementById(toggleId);
  const ctrl = createGridSection({ gridEl, toggleBtn });

  ctrl.bindToggle();
  ctrl.bindResize();

  async function load() {
    try {
      const res = await listFilmsInGenre({ genreName, limit: GRID_MAX, page: 1 });
      const list = Array.isArray(res?.results) ? res.results : res;
      ctrl.setItems(list.slice(0, GRID_MAX));
    } catch (err) {
      console.error(`[Genre ${genreName}] fetch failed:`, err);
      ctrl.setItems([]);
    }
  }

  return { ctrl, load, genreName };
}

const g1 = initFixedGenreSection({
  sectionId: 'genre-one',
  gridId: 'grid-genre-one',
  toggleId: 'genre-one-toggle',
});
const g2 = initFixedGenreSection({
  sectionId: 'genre-two',
  gridId: 'grid-genre-two',
  toggleId: 'genre-two-toggle',
});


// =================== AUTRES (custom dropdown) ===================

// Count movies in a genre (use limit=1; read total 'count' from paginated payload)
async function getGenreCountByName(genreName) {
  const res = await listFilmsInGenre({ genreName, limit: 1, page: 1 });
  return typeof res?.count === 'number'
    ? res.count
    : (Array.isArray(res?.results) ? res.results.length : 0);
}

// Elements for Autres
const autres = {
  gridEl: document.getElementById('filtered-genres-grid-wrapper'),
  toggleBtn: document.getElementById('filtered-genres-toggle'),
  root: document.getElementById('autres-dd'),
  btn: document.getElementById('autres-dd-button'),
  label: document.getElementById('autres-dd-label'),
  menu: document.getElementById('autres-menu'),
};

const autresCtrl = createGridSection({ gridEl: autres.gridEl, toggleBtn: autres.toggleBtn });
autresCtrl.bindToggle();
autresCtrl.bindResize();

// Load movies for a picked genre
async function loadAutresForGenre(genreName) {
  try {
    const res = await listFilmsInGenre({ genreName, limit: GRID_MAX, page: 1 });
    const list = Array.isArray(res?.results) ? res.results : res;
    autresCtrl.setItems(list.slice(0, GRID_MAX));
  } catch (err) {
    console.error('[Autres] fetch failed:', err);
    autresCtrl.setItems([]);
  }
}

// Open/close state
function setMenuOpen(open) {
  if (!autres.root || !autres.btn) return;
  autres.root.dataset.open = String(open);
  autres.btn.setAttribute('aria-expanded', String(open));
  if (open && autres.menu) autres.menu.focus();
}
// Visual selection + button label
function selectAutresItem(name) {
  if (!autres.menu || !autres.label) return;
  autres.menu.querySelectorAll('.dd-item').forEach(li => {
    const sel = li.dataset.value === name;
    li.classList.toggle('is-selected', sel);
    li.setAttribute('aria-selected', String(sel));
  });
  const li = autres.menu.querySelector(`.dd-item[data-value="${CSS.escape(name)}"]`);
  const label = li ? (li.querySelector('.dd-item-label')?.textContent || name) : name;
  autres.label.textContent = label;
}

// Build the dropdown list, exclude fixed genres, sort by count desc, default = first
async function buildAutresDropdown(excludedNames = [], topN = 8) {
  if (!autres.root || !autres.btn || !autres.menu || !autres.label) return;

  // Button toggles the menu
  autres.btn.onclick = () => setMenuOpen(autres.root.dataset.open !== 'true');

  // 1) Fetch all genres
  const all = await listAllGenres();                   // [{id,name}, ...]
  const allNames = all.map(g => g.name).filter(Boolean);

  // 2) Exclude fixed genres (from sections 1 & 2)
  const ex = new Set(excludedNames.map(s => s.toLowerCase()));
  const eligible = allNames.filter(n => !ex.has(String(n).toLowerCase()));

  // 3) Count each eligible (parallel)
  const counted = await Promise.all(eligible.map(async name => {
    try {
      const count = await getGenreCountByName(name);
      return { name, count };
    } catch {
      return { name, count: 0 };
    }
  }));

  // 4) Sort by count desc and take topN with count>0
  counted.sort((a, b) => b.count - a.count);
  const top = counted.slice(0, topN).filter(g => g.count > 0);

  // 5) Render items into <ul id="autres-menu">
  autres.menu.innerHTML = '';
  for (const { name, count } of top) {
    const li = document.createElement('li');
    li.className = 'dd-item';
    li.setAttribute('role', 'option');
    li.dataset.value = name;
    li.innerHTML = `
      <span class="dd-item-label">${name}</span>
      <span class="dd-check" aria-hidden="true">✅</span>
    `;
    li.addEventListener('click', async () => {
      selectAutresItem(name);
      setMenuOpen(false);
      await loadAutresForGenre(name);
    });
    autres.menu.appendChild(li);
  }

  // 6) Default: first item selected + load its films
  if (top.length) {
    selectAutresItem(top[0].name);
    await loadAutresForGenre(top[0].name);
  } else {
    autres.label.textContent = 'Aucun genre disponible';
    autresCtrl.setItems([]);
  }
}

// --------------------------- Boot sequence (single DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
  const bestId = await initBestFilm();
  await loadTopRated(bestId);

  if (g1?.load) await g1.load();
  if (g2?.load) await g2.load();

  const excluded = [g1?.genreName, g2?.genreName].filter(Boolean);

  // Build + populate the custom dropdown (and auto-load the first genre)
  await buildAutresDropdown(excluded, 8);
});

// Close on outside click / Esc
document.addEventListener('click', (e) => {
  if (!autres.root) return;
  if (!autres.root.contains(e.target)) setMenuOpen(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenuOpen(false);
});
