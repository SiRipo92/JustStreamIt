import { movieDetail } from './api.js';
import { FALLBACK_SVG_DATA, viaProxy } from './poster.js';

// tiny helpers
const $ = id => document.getElementById(id);
const setText = (id, v = '') => { const el = $(id); if (el) el.textContent = v; };
const join = (arr, sep = ', ') => Array.isArray(arr) ? arr.filter(Boolean).join(sep) : '';
const yearFrom = d => d?.year ?? (d?.date_published ? String(d.date_published).slice(0, 4) : '');

const fmtYearGenres = d => [yearFrom(d), join(d?.genres, ', ')].filter(Boolean).join(' - ');
const fmtRatedRuntimeCountries = d => {
  const rated = d?.rated || d?.rating || null;
  const minutes = Number.isFinite(d?.duration) ? `${d.duration} minutes` : null;
  const countries = d?.countries?.length ? `(${d.countries.join(' / ')})` : null;
  return [rated, minutes, countries].filter(Boolean).join(' - ');
};
const fmtImdb = d => {
  const s = d?.imdb_score ?? d?.avg_vote;
  return s ? `${s}/10` : '—';
};


// Calculate gross-sum earned worldwide and display
// ---- Possible keys for formatting (handles many keys + K/M/B suffix) ----
const GROSS_KEYS = [
  'worldwide_gross_income',
  'worldwide_income',
  'gross_worldwide',
  'world_gross',
  'usa_gross_income',
  'us_gross_income',
  'usa_gross',
  'us_gross',
  'gross_income',
  'box_office',
  'boxoffice',
  'revenue',
  'income',
];

//
function pickGross(detail = {}) {
  for (const k of GROSS_KEYS) {
    const v = detail[k];
    if (v != null && v !== '' && v !== 'N/A') return v;
  }
  // last-resort scan
  for (const [k, v] of Object.entries(detail)) {
    if (/(gross|income|box.?office|revenue)/i.test(k) && v != null && v !== '' && v !== 'N/A') {
      return v;
    }
  }
  return null;
}

// Takes monetary value and returns formatted figure (1248028 = 1.24M)
function parseMoney(raw) {
  if (raw == null) return NaN;
  if (typeof raw === 'number') return isFinite(raw) ? raw : NaN;
  if (typeof raw !== 'string') return NaN;

  // normalizes weird spaces + turn words into M/B/K ( for short number formatting)
  let up = raw
    .toUpperCase()
    .replace(/[\u00A0\u202F]/g, ' ')  // NBSP / thin space
    .replace(/\bMILLION(S)?\b/g, 'M')
    .replace(/\bBILLION(S)?\b/g, 'B')
    .replace(/\bTHOUSAND(S)?\b/g, 'K')
    .trim();

  const unitMatch = up.match(/([MBK])[^A-Z]*$/);
  const unit = unitMatch ? unitMatch[1] : null;

  // keeps only digits and separators
  let s = up.replace(/[^0-9.,]/g, '');

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // EU: "1.234.567,89"
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: "1,234,567.89"
      s = s.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    const parts = s.split(',');
    s = parts[parts.length - 1].length <= 2
        ? s.replace(/,/g, '.')
        : s.replace(/,/g, '');
  }

  s = s.replace(/\s/g, '');
  let n = parseFloat(s);
  if (!isFinite(n)) return NaN;

  if (unit === 'B') n *= 1e9;
  else if (unit === 'M') n *= 1e6;
  else if (unit === 'K') n *= 1e3;

  return n;
}

// Retrieves box-office gross sums in US currency format (Billions, Millions, Thousands)
function fmtGross(detail) {
  const raw = pickGross(detail);
  const n = parseMoney(raw);
  if (!Number.isFinite(n) || n <= 0) return '—';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    const $ = '$';
    if (n >= 1e9) return `${$}${(n / 1e9).toFixed(1)}b`;
    if (n >= 1e6) return `${$}${(n / 1e6).toFixed(1)}m`;
    if (n >= 1e3) return `${$}${(n / 1e3).toFixed(0)}k`;
    return `${$}${n}`;
  }
}

// fetch detail (uses provided url when present; else /titles/<id>/?format=json)
async function fetchDetail(movieOrId) {
  const id = typeof movieOrId === 'object' ? movieOrId.id : movieOrId;
  if (!id) throw new Error('openMovieModal: no movie id provided');

  let url = (typeof movieOrId === 'object' && movieOrId.url)
    ? movieOrId.url
    : `${API_BASE}/titles/${id}/`;
  if (!url.includes('?')) url += '?format=json';

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`);
  return res.json();
}

// ---- Render modal ----
function fillModal(detail) {
  // title
  setText('movieModalTitle', detail?.title || '');

  // poster (always returns 200; real jpeg or inline SVG fallback)
  const img = $('mm-poster');
  if (img) {
    img.alt = detail?.title || '';
    img.src = FALLBACK_SVG_DATA;
    img.src = viaProxy(detail?.image_url || '');
  }

  // summary (both placements)
  const summary = detail?.long_description || detail?.description || '';
  setText('mm-summary', summary);
  setText('mm-summary-inline', summary);

  // meta block
  setText('mm-year-genres',   fmtYearGenres(detail));
  setText('mm-rated-runtime', fmtRatedRuntimeCountries(detail));
  setText('mm-imdb',          fmtImdb(detail));
  setText('mm-boxoffice',     fmtGross(detail));

  // credits + summary
  setText('mm-directors', join(detail?.directors) || '—');
  setText('mm-actors',    join(detail?.actors)    || '—');

}

// ---- Public facing API
export async function openMovieModal(movieOrId) {
  try {
    const detail = await fetchDetail(movieOrId);
    fillModal(detail);

    const modalEl = $('movieModal');
    const modal = window.bootstrap?.Modal.getOrCreateInstance(modalEl, { backdrop: true });
    modal.show();
  } catch (err) {
    console.error('[Modal] failed to open:', err);
  }
}

// DEV ONLY: open the modal with a fake detail to test box-office formats
window.debugModalWithGross = function (raw) {
  const fake = {
    id: 0,
    title: 'Test Film',
    year: 2021,
    duration: 120,
    countries: ['USA'],
    genres: ['Action'],
    directors: ['Jane Doe'],
    actors: ['Alpha', 'Bravo'],
    description: 'Dev test of gross display.',
    image_url: '', // uses fallback
    worldwide_gross_income: raw, // tries numbers or strings
  };
  fillModal(fake);
  const el = document.getElementById('movieModal');
  const modal = window.bootstrap?.Modal.getOrCreateInstance(el, { backdrop: true });
  modal.show();
};
// keep the global hook expected by app.js
window.openMovieModal = openMovieModal;