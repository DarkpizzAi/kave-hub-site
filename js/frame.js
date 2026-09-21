// The page frame's sidebar: the contents card and the other sidebar card
// types. The sidebar column is always present so the main column never moves;
// these cards fill it when a page has something for it.

import { el } from './ui.js';

let detach = null;

export function tocEntries(root) {
  return [...root.querySelectorAll('.tab-section[id]')]
    .filter(s => s.querySelector('.tab-section-title'))
    .map(s => ({ id: s.id, title: s.querySelector('.tab-section-title').textContent }));
}

// Two or more titled sections and more than about two screens of content.
export function shouldShowToc(count, contentHeight, viewportHeight) {
  return count >= 2 && contentHeight > 2 * viewportHeight;
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
    const b = el('button', { type: 'button', class: 'toc-row' }, e.title);
    b.addEventListener('click', () => document.getElementById(e.id).scrollIntoView());
    return b;
  });
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
  detach = () => { sheet.removeEventListener('scroll', spy); cardEl.remove(); };
  return true;
}
