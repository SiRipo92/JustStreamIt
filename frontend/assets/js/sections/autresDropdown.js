import { listAllGenres, listFilmsInGenre } from '../api.js';
import { createGridSection } from '../ui/gridController.js';
import { GRID_MAX } from '../utils/utils.js';

export function initAutresSection() {
  const els = {
    gridEl: document.getElementById('filtered-genres-grid-wrapper'),
    toggleBtn: document.getElementById('filtered-genres-toggle'),
    root: document.getElementById('autres-dd'),
    btn: document.getElementById('autres-dd-button'),
    label: document.getElementById('autres-dd-label'),
    menu: document.getElementById('autres-menu'),
  };

  const ctrl = createGridSection({ gridEl: els.gridEl, toggleBtn: els.toggleBtn });
  ctrl.bindToggle();
  ctrl.bindResize();

  async function loadForGenre(genreName) {
    try {
      const res = await listFilmsInGenre({ genreName, limit: GRID_MAX, page: 1 });
      const list = Array.isArray(res?.results) ? res.results : res;
      ctrl.setItems(list.slice(0, GRID_MAX));
    } catch (err) {
      console.error('[Autres] fetch failed:', err);
      ctrl.setItems([]);
    }
  }

  function setMenuOpen(open) {
    if (!els.root || !els.btn) return;
    els.root.dataset.open = String(open);
    els.btn.setAttribute('aria-expanded', String(open));
    if (open && els.menu) els.menu.focus();
  }

  function selectItem(name) {
    if (!els.menu || !els.label) return;
    els.menu.querySelectorAll('.dd-item').forEach(li => {
      const sel = li.dataset.value === name;
      li.classList.toggle('is-selected', sel);
      li.setAttribute('aria-selected', String(sel));
    });
    const li = els.menu.querySelector(`.dd-item[data-value="${CSS.escape(name)}"]`);
    const label = li ? (li.querySelector('.dd-item-label')?.textContent || name) : name;
    els.label.textContent = label;
  }

  async function getGenreCountByName(genreName) {
    const res = await listFilmsInGenre({ genreName, limit: 1, page: 1 });
    return typeof res?.count === 'number'
      ? res.count
      : (Array.isArray(res?.results) ? res.results.length : 0);
  }

  async function buildDropdown(excludedNames = [], topN = 8) {
    if (!els.root || !els.btn || !els.menu || !els.label) return;

    els.btn.onclick = () => setMenuOpen(els.root.dataset.open !== 'true');

    const all = await listAllGenres();
    const allNames = all.map(g => g.name).filter(Boolean);

    const ex = new Set(excludedNames.map(s => s.toLowerCase()));
    const eligible = allNames.filter(n => !ex.has(String(n).toLowerCase()));

    const counted = await Promise.all(eligible.map(async name => {
      try {
        const count = await getGenreCountByName(name);
        return { name, count };
      } catch {
        return { name, count: 0 };
      }
    }));

    counted.sort((a, b) => b.count - a.count);
    const top = counted.slice(0, topN).filter(g => g.count > 0);

    els.menu.innerHTML = '';
    for (const { name } of top) {
      const li = document.createElement('li');
      li.className = 'dd-item';
      li.setAttribute('role', 'option');
      li.dataset.value = name;
      li.innerHTML = `
        <span class="dd-item-label">${name}</span>
        <span class="dd-check" aria-hidden="true">✅</span>
      `;
      li.addEventListener('click', async () => {
        selectItem(name);
        setMenuOpen(false);
        await loadForGenre(name);
      });
      els.menu.appendChild(li);
    }

    if (top.length) {
      selectItem(top[0].name);
      await loadForGenre(top[0].name);
    } else {
      els.label.textContent = 'Aucun genre disponible';
      ctrl.setItems([]);
    }

    // Close on outside click / Esc (scoped)
    document.addEventListener('click', (e) => {
      if (!els.root) return;
      if (!els.root.contains(e.target)) setMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    });
  }

  return { buildDropdown, loadForGenre };
}