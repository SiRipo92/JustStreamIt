// Breakpoints + counts used by all grids  // NEW
export const BP = { md: 768, lg: 992 };
export const GRID_MAX = 6;      // desktop visible count (3 x 2)
export const XS_COLLAPSED = 2;  // mobile collapsed
export const MD_COLLAPSED = 4;  // tablet collapsed
export const EXPANDED = 6;      // expanded on xs/md

// Shortens text description if unable to fit in container
export function truncate(text, max = 240) {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return (i > 0 ? cut.slice(0, i) : cut) + '…';
}

// Excludes one id from a list (used by Top Rated)
export function filterOutId(list, id) {
  if (id == null) return list;
  const sid = String(id);
  return list.filter(m => String(m.id) !== sid);
}

// initial visible count by viewport
export function computeVisibleCount(expanded, w = window.innerWidth) {
  if (w >= BP.lg) return GRID_MAX;
  if (w >= BP.md) return expanded ? EXPANDED : MD_COLLAPSED;
  return expanded ? EXPANDED : XS_COLLAPSED;
}