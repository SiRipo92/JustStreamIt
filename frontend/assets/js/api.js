import { API_BASE } from './config.js';

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

// Build a detail URL from an item or id. Always ensures ?format=json.
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
  const inline =
    item?.long_description?.trim?.() ||
    item?.description?.trim?.();
  if (inline) return inline;

  const d = await movieDetail(item, { signal });
  return d.long_description?.trim?.() || d.description?.trim?.() || '';
 }
