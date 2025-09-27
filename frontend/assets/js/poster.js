export const FALLBACK_SVG_DATA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 540">
       <rect width="100%" height="100%" fill="#e9ecef"/>
       <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
             font-family="sans-serif" font-size="20" fill="#6c757d">
         Poster indisponible
       </text>
     </svg>`
  );

const posterOK = new Map();

export function normalizePoster(url) {
  return url ? url.replace(/(\._V1_)[^.]+(\.jpg)$/i, '$1.jpg') : '';
}

export function imgLoadsOnce(url, timeout = 6000) {
  if (!url) return Promise.resolve(false);
  if (posterOK.has(url)) return Promise.resolve(posterOK.get(url));

  return new Promise(resolve => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const to = setTimeout(() => { img.src = ''; posterOK.set(url, false); resolve(false); }, timeout);
    img.onload  = () => { clearTimeout(to); posterOK.set(url, true);  resolve(true);  };
    img.onerror = () => { clearTimeout(to); posterOK.set(url, false); resolve(false); };
    img.src = url;
  });
}