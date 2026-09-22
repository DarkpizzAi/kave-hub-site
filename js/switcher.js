// The app switcher: a chip in the header naming the current page, and a popup
// of tiles built like Spoon's bottom navigation (an icon in a pill, the name
// below). The tile list is the explicit page list in routes.js.

import { el } from './ui.js';
import { glyph } from './glyphs.js';
import { PAGES, SECTIONS, keyFor } from './routes.js';

const COLS = 3;

// mountSwitcher is called again on every shell rebuild (re-auth, first-run
// setup), each time on a fresh bar/menu. The two listeners below go on
// document, which outlives the bar, so without this they'd pile up one pair
// per rebuild. Track and remove the previous pair before adding the new one.
let docListeners = null;

export function nextIndex(i, key, count, cols = COLS) {
  const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[key];
  if (!step) return i;
  const n = i + step;
  return n < 0 || n >= count ? i : n;
}

export function buildTiles() {
  return PAGES.map(p => ({ key: p.key, label: p.label, href: p.href, section: p.section, glyph: p.glyph }));
}

export function currentKey(hash) {
  return keyFor(hash);
}

export function mountSwitcher(bar) {
  const label = el('span', { class: 'chip-label' });
  const chip = el('button', { type: 'button', class: 'page-chip', id: 'chip', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
    label, glyph('chevron', 16));
  const menu = el('div', { class: 'switcher', role: 'menu', hidden: '' });
  bar.append(chip, menu);

  function tiles() { return [...menu.querySelectorAll('.app-tile')]; }

  function open() {
    const list = tiles();
    if (!list.length) return;
    // CSSOM, not an inline style attribute: the CSP forbids those. The chip's
    // offsetParent is the sticky bar, the frame the absolute menu sits in, so
    // offsetLeft stays right under horizontal scroll (viewport rects do not).
    menu.style.left = chip.offsetLeft + 'px';
    menu.hidden = false;
    chip.setAttribute('aria-expanded', 'true');
    (menu.querySelector('.app-tile.cur') || list[0])?.focus();
  }
  function close(refocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    chip.setAttribute('aria-expanded', 'false');
    if (refocus) chip.focus();
  }

  chip.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', () => close());

  if (docListeners) {
    document.removeEventListener('click', docListeners.click);
    document.removeEventListener('keydown', docListeners.keydown);
  }
  docListeners = {
    click: e => {
      if (!menu.hidden && !menu.contains(e.target) && !chip.contains(e.target)) close();
    },
    keydown: e => {
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
    },
  };
  document.addEventListener('click', docListeners.click);
  document.addEventListener('keydown', docListeners.keydown);

  function setTiles(list, current) {
    menu.innerHTML = '';
    for (const section of SECTIONS) {
      const group = list.filter(t => t.section === section);
      if (!group.length) continue;
      menu.append(el('div', { class: 'switcher-label' }, section));
      for (const t of group) {
        const a = el('a', { class: 'app-tile' + (t.key === current ? ' cur' : ''), href: t.href, role: 'menuitem' },
          el('span', { class: 'nav-icon' }, glyph(t.glyph || t.key, 24)),
          el('span', { class: 'tile-name' }, t.label));
        menu.append(a);
      }
    }
    const cur = list.find(t => t.key === current);
    label.textContent = cur ? cur.label : current;
  }

  return { setTiles, close };
}
