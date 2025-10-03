import { API_BASE } from './config.js';

// Inline fallback SVG
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

// Route every poster through the backend proxy (no client-side normalize)
export function viaProxy(remoteUrl) {
  if (!remoteUrl || typeof remoteUrl !== 'string') return FALLBACK_SVG_DATA;
  const u = new URL(`${API_BASE}/titles/posters/`);
  u.searchParams.set('url', remoteUrl);
  return u.toString();
}
