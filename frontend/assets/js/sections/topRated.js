import { topRated } from '../api.js';
import { createGridSection } from '../ui/gridController.js';
import { GRID_MAX, filterOutId } from '../utils/utils.js';

export function initTopRatedSection() {
  const els = {
    grid: document.getElementById('top-rated-grid'),
    toggle: document.getElementById('tr-toggle'),
  };

  const ctrl = createGridSection({ gridEl: els.grid, toggleBtn: els.toggle });
  ctrl.bindToggle();
  ctrl.bindResize();

  async function load(excludeIdValue) {
    try {
      const HEADROOM = 10;
      const data = await topRated({ limit: GRID_MAX + HEADROOM, page: 1 });
      const list = Array.isArray(data?.results) ? data.results : data;
      const filtered = filterOutId(list, excludeIdValue);
      ctrl.setItems(filtered.slice(0, GRID_MAX));
    } catch (err) {
      console.error('[Top rated] fetch failed:', err);
      ctrl.setItems([]);
    }
  }

  return { load, ctrl };
}