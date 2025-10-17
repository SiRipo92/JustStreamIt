import { API_BASE } from './config.js';

export const FALLBACK_SVG_DATA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">
       <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
             font-family="sans-serif" font-size="20" fill="#6c757d">
         Poster indisponible
       </text>
     </svg>`
  );

// Always pass imdb when available
export function viaProxy(remoteUrl, imdbUrl) {
  if (!remoteUrl && !imdbUrl) return FALLBACK_SVG_DATA;
  const u = new URL(`${API_BASE}/titles/posters/`);
  if (remoteUrl) u.searchParams.set('url', remoteUrl);
  if (imdbUrl)   u.searchParams.set('imdb', imdbUrl);
  return u.toString();
}
