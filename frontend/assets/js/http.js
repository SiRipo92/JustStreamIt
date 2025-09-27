import { API_BASE } from './config.js';

export async function getJSON(url, opt = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, ...opt });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

export function topRated({ limit = 12, page = 1 } = {}) {
  return getJSON(`${API_BASE}/titles/?sort_by=-imdb_score,-votes&page_size=${limit}&page=${page}`);
}

export function movieDetail(id) {
  return getJSON(`${API_BASE}/titles/${id}?format=json`);
}

export async function descriptionFor(movie) {
  const inline = movie?.description?.trim?.();
  if (inline) return inline;
  const d = await movieDetail(movie.id);
  return d.description?.trim?.() || d.long_description?.trim?.() || '';
}