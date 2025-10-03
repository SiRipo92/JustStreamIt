import { API_BASE } from './config.js';  // used as a constant

// Provides a fallback image in case none is retrieved
export const FALLBACK_SVG_DATA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">
       <!-- transparent background; CSS supplies the gray -->
       <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
             font-family="sans-serif" font-size="20" fill="#6c757d">
         Poster indisponible
       </text>
     </svg>`
  );

// Normalizes IMDb variants
function normalizePoster(url) {
  return url ? url.replace(/(\._V1_)[^.]+(\.jpg)$/i, '$1.jpg') : '';
}

// Routes all posters through the backend proxy
// Proxy was added in /backend/api/v1/titles/posters.py
export function viaProxy(remoteUrl) {
  if (!remoteUrl) return FALLBACK_SVG_DATA;
  const u = new URL(`${API_BASE}/titles/posters/`);
  u.searchParams.set('url', normalizePoster(remoteUrl));
  return u.toString();
}