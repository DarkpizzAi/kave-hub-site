// The app switcher: a chip in the header naming the current page, and a popup
// of tiles built like Spoon's bottom navigation (an icon in a pill, the name
// below). The tile list comes from the plugin manifest at runtime.

import { el } from './ui.js';
import { glyph } from './glyphs.js';

const COLS = 3;

export function nextIndex(i, key, count, cols = COLS) {
  const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[key];
  if (!step) return i;
  const n = i + step;
  return n < 0 || n >= count ? i : n;
}

export function buildTiles(plugins) {
  const tiles = [{ key: 'home', label: 'home', href: '#/' }];
  for (const p of plugins) {
    tiles.push({ key: p.name, label: p.name, href: '#/' + p.name });
    if (p.name === 'household') {
      tiles.push({ key: 'infrastructure', label: 'infrastructure', href: '#/household/infrastructure' });
    }
  }
  tiles.push({ key: 'settings', label: 'settings', href: '#/settings' });
  return tiles;
}

export function currentKey(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return 'home';
  if (parts[0] === 'household' && parts[1] === 'infrastructure') return 'infrastructure';
  return parts[0];
}

export function mountSwitcher(bar) {
  const label = el('span', { class: 'chip-label' });
  const chip = el('button', { type: 'button', class: 'page-chip', id: 'chip', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
    label, glyph('chevron', 16));
  const menu = el('div', { class: 'switcher', role: 'menu', hidden: '' });
  bar.append(chip, menu);

  function tiles() { return [...menu.querySelectorAll('.app-tile')]; }

  function open() {
    // CSSOM, not an inline style attribute: the CSP forbids those.
    menu.style.left = Math.round(chip.getBoundingClientRect().left) + 'px';
    menu.hidden = false;
    chip.setAttribute('aria-expanded', 'true');
    (menu.querySelector('.app-tile.cur') || tiles()[0]).focus();
  }
  function close(refocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    chip.setAttribute('aria-expanded', 'false');
    if (refocus) chip.focus();
  }

  chip.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', () => close());
  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target) && !chip.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { close(true); return; }
    const list = tiles();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const n = nextIndex(i, e.key, list.length);
    if (n !== i || ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      list[n].focus();
    }
  });

  function setTiles(list, current) {
    menu.innerHTML = '';
    for (const t of list) {
      const a = el('a', { class: 'app-tile' + (t.key === current ? ' cur' : ''), href: t.href, role: 'menuitem' },
        el('span', { class: 'nav-icon' }, glyph(t.key, 24)),
        el('span', { class: 'tile-name' }, t.label));
      menu.append(a);
    }
    const cur = list.find(t => t.key === current);
    label.textContent = cur ? cur.label : current;
  }

  return { setTiles, close };
}
