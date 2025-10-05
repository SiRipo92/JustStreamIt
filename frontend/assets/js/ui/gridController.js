import { computeVisibleCount, BP } from '../utils/utils.js';
import { buildCard } from './card.js';

export function createGridSection({ gridEl, toggleBtn }) {
  const state = { items: [], expanded: false };

  function render() {
    if (!gridEl) return;
    gridEl.setAttribute('aria-busy', 'true');
    gridEl.innerHTML = '';

    const count = computeVisibleCount(state.expanded);
    const n = Math.min(state.items.length, count);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) frag.appendChild(buildCard(state.items[i]));
    gridEl.appendChild(frag);
    gridEl.setAttribute('aria-busy', 'false');

    if (toggleBtn) {
      const onDesktop = window.innerWidth >= BP.lg;
      const wrap = toggleBtn.closest('.d-lg-none');
      if (wrap) wrap.classList.toggle('d-none', onDesktop);
      toggleBtn.setAttribute('aria-expanded', String(state.expanded));
      const more = toggleBtn.dataset.labelMore || 'Voir plus';
      const less = toggleBtn.dataset.labelLess || 'Voir moins';
      toggleBtn.textContent = state.expanded ? less : more;
    }
  }

  function setItems(list) {
    state.items = Array.isArray(list) ? list : [];
    render();
  }

  function bindToggle() {
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
      state.expanded = !state.expanded;
      render();
    });
  }

  function bindResize() {
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(render, 120);
    });
  }

  return { state, setItems, render, bindToggle, bindResize };
}