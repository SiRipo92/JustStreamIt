import { FALLBACK_URL, viaProxy, rememberPoster, getCachedPoster } from '../posters.js';

// Function to set the HTML for a top-rated card to be inserted in the grid
export function buildCard(item){
  const col = document.createElement('div');
  col.className = 'col';
  col.setAttribute('role', 'listitem');

  col.innerHTML = `
    <article class="film-card">
      <figure class="poster-box m-0">
        <img
          class="poster-img d-block w-100 h-100"
          alt="${item.title ? `Affiche de ${item.title}` : 'Affiche de film'}"
          src="${FALLBACK_URL}"
          referrerpolicy="no-referrer"
        >
        <figcaption class="visually-hidden">${item.title || ''}</figcaption>

        <div class="film-overlay jusitify-content-center">
          <div class="overlay-top">
            <h3 class="overlay-title-sm m-0">
              ${item.title || ''}
            </h3>
          </div>

          <div class="overlay-bottom">
            <button
              type="button"
              class="jsi-btn jsi-btn--overlay"
              aria-label="Afficher les détails pour ${item.title || 'ce film'}"
              data-id="${item.id}"
            >
              Détails
            </button>
          </div>
        </div>
      </figure>
    </article>
  `;

  const img = col.querySelector('img.poster-img');
  if (img) {
    img.src = FALLBACK_URL;
    img.src = viaProxy(item.image_url || '', item.imdb_url || '');

    // When the image actually loads, cache the final URL
    img.addEventListener('load', () => {
      const finalUrl = img.currentSrc || img.src;
      rememberPoster(item.id, finalUrl);
    });

    img.onerror = () => {
      const forceImdb = viaProxy('', item.imdb_url || '');
      const next = (img.src !== forceImdb) ? forceImdb : FALLBACK_URL;
      img.src = next;
      // If it loads later, the 'load' handler above will cache it.
    };
  }

  const btn = col.querySelector('.jsi-btn--overlay');
  if (btn) {
    btn.addEventListener('click', () => {
      // 1) Prefer the URL we cached on successful load
      let posterSrc = getCachedPoster(item.id);

      // 2) If not cached yet, but the <img> is already loaded, use it
      if (!posterSrc && img && img.complete && img.naturalWidth > 0) {
        posterSrc = img.currentSrc || img.src;
      }

      // 3) Still nothing? Build from the card data (last resort)
      if (!posterSrc) {
        posterSrc = viaProxy(item.image_url || '', item.imdb_url || '');
      }

      window.openMovieModal?.({ ...item, _poster_src: posterSrc });
    });
  }

  return col;
}