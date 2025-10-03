import './config.js';
import { topRated, descriptionFor } from './api.js';
import { FALLBACK_SVG_DATA, viaProxy } from './poster.js';   // ⬅️ use viaProxy
import './modal.js';

// --- DOM refs for the “Best film” section
const els = {
  bestImg:   document.getElementById('best-img'),
  bestTitle: document.getElementById('best-title'),
  bestDesc:  document.getElementById('best-desc'),
  bestBtn:   document.getElementById('best-details-btn')
           || document.querySelector('#best-film .jsi-btn--primary'),
};

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

// Renders gathered data for Best Film
function renderBest({ movie, blurb }) {
  if (els.bestImg) {
    els.bestImg.src = FALLBACK_SVG_DATA; // instant placeholder
    els.bestImg.alt = movie.title || '';
    els.bestImg.decoding = 'async';
    els.bestImg.setAttribute('sizes', '(min-width: 992px) 25vw, 100vw');
    els.bestImg.src = viaProxy(movie.image_url); // ⬅️ always go through backend proxy
  }
  if (els.bestTitle) els.bestTitle.textContent = movie.title || '';
  if (els.bestDesc)  els.bestDesc.textContent  = truncate(blurb, 240);
  if (els.bestBtn)   els.bestBtn.onclick       = () => window.openMovieModal?.(movie);
}

// Makes call for best film, verifies data is present, renders
async function initBestFilm() {
  try {
    const data = await topRated({ limit: 15 });
    const list = Array.isArray(data?.results) ? data.results : data;
    const chosen = await pickFirstValidMovie(list, 10);
    if (chosen) return renderBest(chosen);

    // graceful fallback
    els.bestTitle && (els.bestTitle.textContent = 'Meilleur film introuvable');
    els.bestDesc  && (els.bestDesc.textContent  = 'Aucun film avec affiche et description disponibles.');
    els.bestImg   && (els.bestImg.src = FALLBACK_SVG_DATA);
  } catch (err) {
    console.error('[Best film] init failed:', err);
    els.bestImg && (els.bestImg.src = FALLBACK_SVG_DATA);
  }
}

document.addEventListener('DOMContentLoaded', initBestFilm);