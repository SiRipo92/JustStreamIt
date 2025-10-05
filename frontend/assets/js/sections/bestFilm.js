import { topRated, meaningfulDescriptionFor } from '../api.js';
import { FALLBACK_SVG_DATA, viaProxy } from '../posters.js';
import { truncate } from '../utils/utils.js';

//--------------------------- Best Film Section

const els = {
  bestImg:   document.getElementById('best-img'),
  bestTitle: document.getElementById('best-title'),
  bestDesc:  document.getElementById('best-desc'),
  bestBtn:   document.getElementById('best-details-btn')
           || document.querySelector('#best-film .jsi-btn--primary'),
};

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
export async function initBestFilm() {
  try {
    const data = await topRated({ limit: 15 });
    const list = Array.isArray(data?.results) ? data.results : data;

    const chosen = await pickFirstValidMovie(list, 10);
    if (chosen) {
      renderBest(chosen);
      return chosen.movie?.id ?? null;   // ← returns the ID
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