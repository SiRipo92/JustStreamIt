import { API_BASE } from './config.js';


// --------------------------- Globally scoped variables
const PLACEHOLDER_PATTERNS = [
  /^\|+$/,            // just pipes
  /^-+$/,             // just dashes
  /^—+$/,             // em-dashes
  /^add a plot/i,     // "Add a Plot »"
  /^n\/?a$/i,         // N/A / NA
  /^unknown$/i,
];

const norm = t => String(t ?? '').replace(/\s+/g, ' ').trim();
const isPlaceholder = s => PLACEHOLDER_PATTERNS.some(re => re.test(s));

// --------------------------- Placeholder detection

// Prefer long_description, else description (both normalized)
function pickRawDescription(d) {
  const long  = norm(d?.long_description);
  const short = norm(d?.description);
  return long || short || '';
}

// --------------------------- HTTP helpers

// Generic JSON fetch with basic error handling
export async function getJSON(url, opt = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    ...opt,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// --------------------------- Api call functions

// GETTERS FOR SINGLE FILM DETAILS
export function detailUrlFrom(itemOrId) {
  if (typeof itemOrId === 'object' && itemOrId?.url && itemOrId.url.startsWith('http')) {
    const u = new URL(itemOrId.url);
    if (!u.searchParams.has('format')) u.searchParams.set('format', 'json');
    return u.toString();
  }
  if (typeof itemOrId === 'object' && itemOrId?.id != null) {
    return `${API_BASE}/titles/${itemOrId.id}/?format=json`;
  }
  if (itemOrId != null) {
    return `${API_BASE}/titles/${itemOrId}/?format=json`;
  }
  throw new Error('detailUrlFrom: cannot resolve URL');
}

// Top-rated list (sorted by imdb_score, then votes).
export function topRated({ limit = 12, page = 1 } = {}) {
  const url = `${API_BASE}/titles/?sort_by=-imdb_score,-votes&page_size=${limit}&page=${page}`;
  return getJSON(url);
}

// Movie detail by id OR by passing a list item object.
export function movieDetail(itemOrId, { signal } = {}) {
  return getJSON(detailUrlFrom(itemOrId), { signal });
}

// --------------------------- Description APIs

// A) Best Film / grid: only return real text, else '' (no fallbacks)
export async function meaningfulDescriptionFor(item, { signal } = {}) {
  // Try inline first
  const inline = pickRawDescription(item);
  if (inline && !isPlaceholder(inline)) return inline;

  // Then detail
  try {
    const d = await movieDetail(item, { signal });
    const full = pickRawDescription(d);
    return full && !isPlaceholder(full) ? full : '';
  } catch {
    return '';
  }
}

// B) Modal: return real text or friendly message
export async function sanitizedDescriptionFor(item, { signal } = {}) {
  const inline = pickRawDescription(item);
  if (inline && !isPlaceholder(inline)) return inline;

  try {
    const d = await movieDetail(item, { signal });
    const full = pickRawDescription(d);
    if (full && !isPlaceholder(full)) return full;

    // Placeholder present in data
    return (inline || full)
      ? "La description du film n’existe pas actuellement."
      : "Les données descriptives sont manquantes.";
  } catch {
    // Could not fetch details
    return inline
      ? "La description du film n’existe pas actuellement."
      : "Les données descriptives sont manquantes.";
  }
}

// Back-compatability: keeps the old name but makes it the sanitized variant
export const descriptionFor = sanitizedDescriptionFor;