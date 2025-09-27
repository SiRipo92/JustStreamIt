import { topRated, descriptionFor } from './http.js';
import { FALLBACK_SVG_DATA, normalizePoster, imgLoadsOnce } from './poster.js';

// --- DOM refs for the “Best film” section
const els = {
  bestImg:   document.getElementById('best-img'),
  bestTitle: document.getElementById('best-title'),
  bestDesc:  document.getElementById('best-desc'),
  // Prefer an explicit ID; fall back to the primary button inside #best-film
  bestBtn:   document.getElementById('best-details-btn')
          || document.querySelector('#best-film .jsi-btn--primary'),
};

// --- Small helper: truncate a string on a word boundary
function truncate(text, max = 240) {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return (i > 0 ? cut.slice(0, i) : cut) + '…';
}

/**
 * Pick the first movie with BOTH:
 *  - a poster URL that actually loads (single attempt, cached in poster.js)
 *  - a non-empty description (inline or from the detail endpoint)
 *
 * @param {Array<object>} candidates - movies from the top-rated endpoint
 * @param {number} maxChecks - safety cap to avoid excessive probing
 * @returns {Promise<{movie: object, posterUrl: string, blurb: string} | null>}
 */
async function pickFirstValidMovie(candidates, maxChecks = 8) {
  const n = Math.min(candidates.length, maxChecks);
  for (let i = 0; i < n; i++) {
    const m = candidates[i];

    // Many IMDb poster URLs include crop/resize fragments that 404; normalize them.
    const posterUrl = normalizePoster(m.image_url);

    // Probe poster + fetch description in parallel to keep it snappy.
    const [okPoster, blurb] = await Promise.all([
      imgLoadsOnce(posterUrl),
      descriptionFor(m),
    ]);

    if (okPoster && blurb) {
      return { movie: m, posterUrl, blurb };
    }
  }
  return null;
}

/**
 * Fill the Best Film DOM with the chosen movie
 * (image is set to a no-request SVG fallback first, then swapped).
 */
function renderBest({ movie, posterUrl, blurb }) {
  if (els.bestImg) {
    // No-network placeholder prevents broken-image icon and console spam.
    els.bestImg.src = FALLBACK_SVG_DATA;
    els.bestImg.alt = movie.title || '';
    els.bestImg.decoding = 'async';
    els.bestImg.setAttribute('sizes', '(min-width: 992px) 25vw, 100vw');

    // Assign the tested poster; if it still fails, the fallback remains in place.
    els.bestImg.onerror = null;
    els.bestImg.src = posterUrl;
  }

  if (els.bestTitle) els.bestTitle.textContent = movie.title || '';
  if (els.bestDesc)  els.bestDesc.textContent  = truncate(blurb, 240);

  // The details button opens your modal (defined in modal.js).
  if (els.bestBtn) els.bestBtn.onclick = () => window.openMovieModal?.(movie);
}

/**
 * Entry point: fetch candidates, pick a valid one, render or fallback.
 * Called on DOMContentLoaded.
 */
async function initBestFilm() {
  try {
    // Ask for more than one so we can gracefully skip broken entries.
    const data = await topRated({ limit: 15 });
    const list = Array.isArray(data?.results) ? data.results : data;

    const chosen = await pickFirstValidMovie(list, 8);
    if (chosen) {
      renderBest(chosen);
      return;
    }

    // Graceful fallback: text message + inline placeholder (no extra network)
    if (els.bestTitle) els.bestTitle.textContent = 'Meilleur film introuvable';
    if (els.bestDesc)  els.bestDesc.textContent  = 'Aucun film avec affiche et description disponibles.';
    if (els.bestImg)   els.bestImg.src = FALLBACK_SVG_DATA;
  } catch (err) {
    console.error('[Best film] init failed:', err);
  }
}

// Run once DOM is ready
document.addEventListener('DOMContentLoaded', initBestFilm);