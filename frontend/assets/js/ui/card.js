import { FALLBACK_SVG_DATA, viaProxy } from '../posters.js';

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
          src="${FALLBACK_SVG_DATA}"
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
  img.src = viaProxy(item.image_url || '');

  const btn = col.querySelector('.jsi-btn--overlay');
  btn.addEventListener('click', () => window.openMovieModal?.(item));

  return col;
}