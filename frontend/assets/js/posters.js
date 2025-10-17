import { API_BASE } from './config.js';

// Single canonical fallback served by backend (keeps UI consistent)
export const FALLBACK_URL = `${API_BASE}/titles/posters/`; // no params → SVG

// Keep the data-URI for legacy code, but prefer FALLBACK_URL
export const FALLBACK_SVG_DATA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">'
    + '<rect width="100%" height="100%" fill="#e9ecef"/>'
    + '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" '
    + 'font-family="sans-serif" font-size="20" fill="#fffff">'
    + 'Poster indisponible</text></svg>'
  );

export function viaProxy(remoteUrl, imdbUrl) {
  const u = new URL(`${API_BASE}/titles/posters/`);
  if (remoteUrl) u.searchParams.set('url', remoteUrl);
  if (imdbUrl)   u.searchParams.set('imdb', imdbUrl);
  return u.toString(); // if both empty → backend fallback URL
}

// Added cache to improve consistency between page loading posters and modal posters

// -------- Poster cache (id -> resolved working URL) --------
const PosterCache = new Map(); // number -> string

export function isBackendFallback(url) {
  try {
    const u = new URL(url);
    return u.pathname.endsWith('/titles/posters/') && !u.search;
  } catch {
    return true; // treat invalid URLs as "do not cache"
  }
}
export function hasImdbParam(url) {
  try { return new URL(url).searchParams.has('imdb'); }
  catch { return typeof url === 'string' && url.includes('imdb='); }
}

/**
 * Cache a confirmed, non-fallback poster URL.
 * @returns {boolean} true if cached, false otherwise
 */
export function rememberPoster(id, url) {
  if (!id || !url) return false;
  if (isBackendFallback(url)) return false;
  PosterCache.set(id, url);
  return true;
}

export function getCachedPoster(id) {
  return id ? (PosterCache.get(id) || '') : '';
}
