import './config.js';
import './modal.js'; 

import { initBestFilm } from './sections/bestFilm.js';
import { initTopRatedSection } from './sections/topRated.js';
import { initFixedGenreSection } from './sections/fixedGenre.js';
import { initAutresSection } from './sections/autresDropdown.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Best film
  const bestId = await initBestFilm();

  // 2) Top rated (exclude best)
  const topRated = initTopRatedSection();
  await topRated.load(bestId);

  // 3) Two fixed-genre sections
  const g1 = initFixedGenreSection({
    sectionId: 'genre-one',
    gridId: 'grid-genre-one',
    toggleId: 'genre-one-toggle',
  });
  const g2 = initFixedGenreSection({
    sectionId: 'genre-two',
    gridId: 'grid-genre-two',
    toggleId: 'genre-two-toggle',
  });
  if (g1?.load) await g1.load();
  if (g2?.load) await g2.load();

  // 4) Autres dropdown + grid (exclude g1/g2)
  const excluded = [g1?.genreName, g2?.genreName].filter(Boolean);
  const autres = initAutresSection();
  await autres.buildDropdown(excluded, 8);
});