// The page frame's sidebar: the contents card and the other sidebar card
// types. The sidebar column is always present so the main column never moves;
// these cards fill it when a page has something for it.

import { el } from './ui.js';
import { introFor } from './routes.js';

let detach = null;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// For human reading in the sidebar: "2026-09-21 - Title" becomes "21-Sep Title".
// The page keeps the exact date; only the sidebar row is shortened.
export function shortLabel(title) {
  const m = title.match(/^(\d{4})-(\d{2})-(\d{2}) - (.+)$/);
  return m ? `${m[3]}-${MONTHS[+m[2] - 1]} ${m[4]}` : title;
}

let groupSeq = 0;

// The page's outline in document order: group headings (the views' h2) and the
// section cards under them. A card after a group heading is one level down; a
// page with no group headings stays flat.
export function tocEntries(root) {
  const out = [];
  let grouped = false;
  for (const n of root.querySelectorAll('h2, .tab-section[id]')) {
    // a section folded away in a closed details block cannot be scrolled to
    if (n.closest('details')) continue;
    if (n.tagName === 'H2') {
      // only page-level group headings, not headings inside a card
      if (n.closest('.card') || !n.textContent.trim()) continue;
      if (!n.id) n.id = 'grp-' + (++groupSeq);
      out.push({ id: n.id, title: n.textContent, depth: 0 });
      grouped = true;
      continue;
    }
    const t = n.querySelector('.tab-section-title');
    if (!t) continue;
    out.push({ id: n.id, title: t.textContent, depth: grouped ? 1 : 0 });
  }
  return out;
}

// Two or more titled sections and more than about two screens of content.
export function shouldShowToc(count, contentHeight, viewportHeight) {
  return count >= 2 && contentHeight > 2 * viewportHeight;
}

// Blank space to add after the content so the last titled section can scroll
// to the top of the sheet, which is what a contents click asks for.
export function tailSpace(clientHeight, contentHeight, lastTop, pad) {
  return Math.max(0, lastTop - pad - (contentHeight - clientHeight));
}

export function sideCard(label, ...children) {
  return el('div', { class: 'side-card' }, el('p', { class: 'side-label' }, label), ...children);
}

export function figuresCard(label, items) {
  const grid = el('div', { class: 'fig-grid' });
  for (const it of items) {
    grid.append(el('div', { class: 'fig' },
      el('div', { class: 'fig-value' }, String(it.value)),
      el('div', { class: 'fig-caption' }, it.caption)));
  }
  return sideCard(label, grid);
}

export function topicsCard(label, items) {
  const list = el('div', { class: 'topics' });
  for (const it of items) {
    list.append(el('div', { class: 'topic' },
      el('span', { class: 'topic-dot' }),
      el('div', {}, el('div', { class: 'topic-title' }, it.title),
        it.note ? el('div', { class: 'topic-note' }, it.note) : null)));
  }
  return sideCard(label, list);
}

export function linksCard(label, items) {
  const links = items.map(it => {
    const a = el('a', { class: 'side-link', href: it.href, target: '_blank', rel: 'noopener noreferrer' }, it.label);
    return a;
  });
  return sideCard(label, ...links);
}

export function detachToc() {
  if (detach) { detach(); detach = null; }
}

// Adds the contents card to `side` when the page qualifies, and highlights
// the section in view as the sheet scrolls. The sheet is the scroll container
// (the page itself never scrolls up and down), so the listener is on the
// sheet. Returns whether the card was added.
export function attachToc(sheet, side, win = window) {
  detachToc();
  const entries = tocEntries(sheet);
  if (!shouldShowToc(entries.length, sheet.scrollHeight, win.innerHeight)) return false;

  const rows = entries.map(e => {
    const b = el('button', { type: 'button', class: 'toc-row' + (e.depth ? ' toc-sub' : ''), title: e.title }, shortLabel(e.title));
    b.addEventListener('click', () => document.getElementById(e.id).scrollIntoView());
    return b;
  });
  const spacer = el('div', { class: 'toc-tail', 'aria-hidden': 'true' });
  const fit = () => {
    const last = document.getElementById(entries[entries.length - 1].id);
    const pad = parseFloat(getComputedStyle(sheet).scrollPaddingTop) || 0;
    spacer.style.height = '0px';
    const lastTop = last.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop;
    spacer.style.height = tailSpace(sheet.clientHeight, sheet.scrollHeight, lastTop, pad) + 'px';
  };
  sheet.append(spacer);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  if (ro) { ro.observe(sheet); [...sheet.children].forEach(c => { if (c !== spacer) ro.observe(c); }); }
  window.addEventListener('resize', fit);
  fit();

  const cardEl = sideCard('On this page', ...rows);
  cardEl.classList.add('toc');
  side.prepend(cardEl);

  const spy = () => {
    // a section is current once its top has passed 60px below the sheet's top edge
    const line = sheet.getBoundingClientRect().top + 60;
    let cur = entries[0].id;
    for (const e of entries) {
      if (document.getElementById(e.id).getBoundingClientRect().top < line) cur = e.id;
    }
    rows.forEach((r, i) => r.classList.toggle('on', entries[i].id === cur));
  };
  sheet.addEventListener('scroll', spy, { passive: true });
  spy();
  detach = () => {
    sheet.removeEventListener('scroll', spy);
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
    spacer.remove();
    cardEl.remove();
  };
  return true;
}

// The one line under a page's title area. None for pages without an intro.
export function introLine(key) {
  const text = introFor(key);
  return text ? el('p', { class: 'page-intro' }, text) : null;
}
