import { listFilmsInGenre } from '../api.js';
import { createGridSection } from '../ui/gridController.js';
import { GRID_MAX } from '../utils/utils.js';

// default export function to generate a section based on genre/category
export function initFixedGenreSection({ sectionId, gridId, toggleId }) {
  const section = document.getElementById(sectionId);
  if (!section) return null;

  const genreName = (section.dataset.genre || '').trim();
  const gridEl = document.getElementById(gridId);
  const toggleBtn = document.getElementById(toggleId);
  const ctrl = createGridSection({ gridEl, toggleBtn });

  ctrl.bindToggle();
  ctrl.bindResize();

  async function load() {
    try {
      const res = await listFilmsInGenre({ genreName, limit: GRID_MAX, page: 1 });
      const list = Array.isArray(res?.results) ? res.results : res;
      ctrl.setItems(list.slice(0, GRID_MAX));
    } catch (err) {
      console.error(`[Genre ${genreName}] fetch failed:`, err);
      ctrl.setItems([]);
    }
  }

  return { ctrl, load, genreName };
}