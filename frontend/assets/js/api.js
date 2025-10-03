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

// --------------------------- Helper functions

// tiny helpers
function norm(t) {
  return String(t ?? '').replace(/\s+/g, ' ').trim();
}

function isMeaningful(t) {
  const s = norm(t);
  if (!s) return false;
  return !PLACEHOLDER_PATTERNS.some(re => re.test(s));
}

/**
 * Returns the best human-friendly description string.
 * - Prefer a meaningful long_description, else description.
 * - If fields exist but are placeholders (like "|" / "Add a Plot »"): "Film description does not currently exist."
 * - If nothing provided at all: "Description data is missing."
 */
export function sanitizeDescriptionFields(d) {
  const long = d?.long_description;
  const short = d?.description;

  const anyProvided =
    norm(long).length > 0 || norm(short).length > 0;

  const good =
    (isMeaningful(long) && norm(long)) ||
    (isMeaningful(short) && norm(short));

  if (good) return good;
  if (anyProvided) return 'Film description does not currently exist.';
  return 'Description data is missing.';
}



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

// Get description for an item: inline if present, else fetch detail.
export async function descriptionFor(item, { signal } = {}) {
  const first = sanitizeDescriptionFields(item);
  // If we already have a meaningful description, stop here.
  if (
    first !== "La description du film n'exist pas actuellement." &&
    first !== 'Les données descriptives sont manquantes.'
  ) {
    return first;
  }

  // Try detail endpoint in case it has a better summary.
  try {
    const d = await movieDetail(item, { signal });
    return sanitizeDescriptionFields(d);
  } catch {
    return first;
  }
}
