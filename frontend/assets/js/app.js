import './config.js';
import { topRated, descriptionFor } from './api.js';
import { FALLBACK_SVG_DATA, viaProxy } from './posters.js';   // ⬅️ use viaProxy
import './modal.js';


// --------------------------- Globally scoped variables

// --- DOM refs for the “Best film” section
const els = {
  bestImg:   document.getElementById('best-img'),
  bestTitle: document.getElementById('best-title'),
  bestDesc:  document.getElementById('best-desc'),
  bestBtn:   document.getElementById('best-details-btn')
           || document.querySelector('#best-film .jsi-btn--primary'),
};

// --- Top Rated grid section
const trEls = {
  grid: document.getElementById('top-rated-grid'),
  toggle: document.getElementById('tr-toggle'),
};

const TR_MAX = 6; // always fetches 6 films at most
const trItems = []; // initializes an empty list of top-rated films
let trExpanded = false;  // initalizes a flag boolean that can be toggled to expand films


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
    const blurb = await descriptionFor(m);
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
function visibleCount(){
    const w = window.innerWidth;
    if (w >= 992) return TR_MAX;  // desktop 3x2 without toggle
    if (w >= 768) return trExpanded ? 6 : 4;  // tablet 2x2 with toggle
    return trExpanded ? 6 : 2;  // mobile 1 x 2 with toggle
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

    // Card component using a string literal
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

                <!-- Overlay for poster -->
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

    // set poster via proxy
    const img = col.querySelector('img.poster-img');
    img.src = viaProxy(item.image_url || '');

    // hooks modal opener
    const btn = col.querySelector('.jsi-btn--overlay');
    btn.addEventListener('click', () => window.openMovieModal?.(item));

    // returns the column
    return col;
}

// Renders built card on client side
function renderTopRated(){
    const { grid, toggle } = trEls;
    if (!grid) return;

    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = '';

    const numCards = Math.min(trItems.length, visibleCount());
    const frag = document.createDocumentFragment();

    // Loops through number of cards to display set in list
    for (let i = 0; i < numCards; i++) frag.appendChild(buildCard(trItems[i]));
    grid.appendChild(frag);
    grid.setAttribute('aria-busy', 'false');  // moves flag back to false once loading is done

    // Toggle visibility of more/less cards on Mobile & Tablet
    if (toggle) {
        const onDesktop = window.innerWidth >=992;
        const wrap = toggle.closest('.d-lg-none');  // matches toggle div around button in HTML
        if (wrap) wrap.classList.toggle('d-none', onDesktop);

        toggle.setAttribute('aria-expanded', String(trExpanded));
        const more = toggle.dataset.labelMore || 'Voir plus';
        const less = toggle.dataset.labelLess || 'Voir moins';
        toggle.textContent = trExpanded ? less : more;
    }
}

async function initTopRated(excludeIdValue){
    try{
        // Fetch a few extra in case the featured one is in this list
        const HEADROOM = 10;
        const data = await topRated({ limit: TR_MAX + HEADROOM, page: 1 });
        const list = Array.isArray(data?.results) ? data.results : data;

        const filtered = filterOutId(list, excludeIdValue);
        trItems.splice(0, trItems.length, ...filtered.slice(0, TR_MAX));
        renderTopRated();

        console.debug('[Top rated] excluded id =', excludeIdValue, 'first card =', trItems[0]?.id);
    } catch (err) {
        console.error('[Top rated] fetch failed:', err);
    }
}

// Toggle click functionality
if (trEls.toggle){
    trEls.toggle.addEventListener('click', () => {
        trExpanded = !trExpanded;
        renderTopRated();
    });
}


//--------------------------- Event Listeners

// Will re-render if screen is resized
let _resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimeout);
    _resizeTimeout = setTimeout(renderTopRated, 120);
});

document.addEventListener('DOMContentLoaded', async () => {
  const bestId = await initBestFilm();
  await initTopRated(bestId);
});