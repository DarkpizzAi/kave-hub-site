// Brand: draws brand/data/look-recap.md live, in three columns (plain
// Material 3, changed by kave, added by kave), with each line's sample built
// from the real kit (m3/, synced from the hub). The page holds no content of
// its own: a change to the file shows here on the next load (Isa, 06/11/2026).
//
// The kit is a Material 3 stylesheet and the rest of the site is not, yet, so
// the page draws inside a shadow root: the kit and this page's own sheet style
// only what is in it. The colour tokens sit on :root (index.html links them)
// and reach inside through inheritance.
//
// How the file is read: a ## heading with ### items under it is a column (its
// first paragraph is the column's line), a ### heading is a card, "Sample: key"
// draws a sample, "Decided: ..." is shown small, and a ## heading with no
// ### items is a note across the page.

import * as data from '../data.js';
import { inline } from '../md.js';
import { el, emptyNote } from '../ui.js';

export const RECAP_PATH = '/brand/data/look-recap.md';

// The site's palette picks the kit's theme: Chartreuse, else Cobalt (the kit
// has no Amber).
function applySeed(root = document.documentElement) {
  if (root.dataset.palette === 'chartreuse') root.dataset.seed = 'chartreuse';
  else delete root.dataset.seed;
}

const GROUPS = [['food', 'Food and drink', '🍽️'], ['nights', 'Nights out', '🎵'], ['culture', 'Culture and fun', '🎬'],
  ['outdoors', 'Outdoors', '🏖️'], ['travel', 'Travel', '✈️'], ['life', 'Life', '🩺'], ['other', 'Other', '📌']];

const icon = (name, cls = '') => el('span', { class: ('m3-icon ' + cls).trim(), 'aria-hidden': 'true' }, name);

// Each sample is built from kit classes and this page's own classes; no inline
// style (the CSP refuses it) and no text from the file.
export const SAMPLES = {
  type: () => [el('span', { class: 'm3-headline-s' }, 'Headline'), el('span', { class: 'm3-title-m' }, 'Title'),
    el('span', { class: 'm3-body-m' }, 'Body'), el('span', { class: 'm3-label-m' }, 'Label')],
  buttons: () => [el('button', { type: 'button', class: 'm3-btn m3-btn--tonal' }, 'Tonal'),
    el('button', { type: 'button', class: 'm3-btn m3-btn--outlined' }, 'Outlined'),
    el('button', { type: 'button', class: 'm3-btn m3-btn--text' }, 'Text'),
    el('span', { class: 'm3-chip is-selected' }, icon('check'), 'Chip')],
  icons: () => ['search', 'settings', 'shopping_cart', 'explore'].map(n => icon(n)),
  surfaces: () => [el('div', { class: 'r-sw' }, ...['page', 'cards', 'rows', 'highest'].map(k => el('i', { class: 'r-sw-' + k, title: k })))],
  themes: () => [el('span', { class: 'r-seed r-seed-cobalt' }, 'Cobalt'), el('span', { class: 'r-seed r-seed-chartreuse' }, 'Chartreuse')],
  fills: () => [el('button', { type: 'button', class: 'm3-btn m3-btn--filled' }, 'Accent'), el('span', { class: 'r-fade m3-label-l' }, 'Accent fade')],
  link: () => [el('span', { class: 'r-link m3-body-m' }, 'A link')],
  hero: () => [el('div', { class: 'r-hero' }, icon('confirmation_number', 'r-acc'), el('span', { class: 'm3-headline-s r-acc' }, '12'),
    el('span', { class: 'm3-body-m' }, 'tickets this year'))],
  'data-colours': () => [el('div', { class: 'r-tags' }, ...GROUPS.slice(0, 6).map(([k, l]) =>
    el('span', { class: 'm3-tag r-k-' + k }, el('span', { class: 'm3-dot' }), l)))],
  'event-fills': () => [el('div', { class: 'r-evs' }, ...GROUPS.map(([k, l, e]) =>
    el('div', { class: 'r-ev r-ev-' + k }, el('span', { class: 'm3-emoji' }, e), el('span', { class: 'm3-label-l' }, l))))],
  emoji: () => [el('span', { class: 'm3-emoji r-big' }, '🍻 🎸 🏖️ ✈️ 🎂')],
  widths: () => [el('div', { class: 'r-w' }, el('i', { class: 'r-w-720' })),
    el('div', { class: 'r-w' }, el('i', { class: 'r-w-696' }), el('b', { class: 'r-w-24' }), el('i', { class: 'r-w-400' }))],
  grouped: () => [el('div', { class: 'm3-grouped r-grouped' },
    el('div', { class: 'm3-list-item' }, el('span', { class: 'm3-body-l' }, 'First row')),
    el('div', { class: 'm3-list-item' }, el('span', { class: 'm3-body-l' }, 'Last row')))],
  'app-icons': () => ['soup_kitchen', 'explore', 'savings'].map(n => el('span', { class: 'r-app' }, icon(n))),
};

const text = (block) => (block.kind === 'p' ? block.text : '');

// The file's sections -> columns of items, and notes.
export function readRecap(doc) {
  const out = { title: doc.title, intro: '', columns: [], notes: [] };
  let col = null;
  const lead = doc.sections.find(s => s.level === 0);
  if (lead) out.intro = lead.blocks.map(text).filter(Boolean).join(' ');
  for (const s of doc.sections) {
    if (s.level === 2) {
      col = { title: s.heading, line: s.blocks.map(text).filter(Boolean).join(' '), items: [] };
      out.columns.push(col);
    } else if (s.level === 3 && col) {
      const item = { title: s.heading, body: [], sample: null, decided: null };
      for (const b of s.blocks) {
        const t = text(b);
        const m = t.match(/^Sample:\s*([\w-]+)\s*$/i);
        const d = t.match(/^Decided:\s*(.+)$/i);
        if (m) item.sample = m[1].toLowerCase();
        else if (d) item.decided = d[1];
        else if (t) item.body.push(t);
      }
      col.items.push(item);
    }
  }
  out.notes = out.columns.filter(c => !c.items.length);
  out.columns = out.columns.filter(c => c.items.length);
  return out;
}

function itemCard(item) {
  const c = el('div', { class: 'r-it' }, el('div', { class: 'm3-title-m' }, item.title));
  for (const t of item.body) c.append(el('div', { class: 'm3-body-m', html: inline(t) }));
  const make = item.sample && SAMPLES[item.sample];
  if (make) c.append(el('div', { class: 'r-demo' }, ...make()));
  if (item.decided) c.append(el('div', { class: 'r-src m3-label-s', html: inline(item.decided) }));
  return c;
}

export default async function brand(container) {
  applySeed();
  const doc = await data.doc(RECAP_PATH);
  if (!doc) { container.append(emptyNote('look-recap.md not found.')); return; }
  const r = readRecap(doc);

  const host = el('div', { class: 'brand-recap-host' });
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.append(el('link', { rel: 'stylesheet', href: 'm3/kave-m3.css' }), el('link', { rel: 'stylesheet', href: 'css/brand-recap.css' }));
  const page = el('div', { class: 'r-page' },
    el('div', { class: 'r-head' }, el('div', { class: 'm3-headline-m' }, r.title || 'The kave look'),
      r.intro ? el('div', { class: 'm3-body-l r-intro', html: inline(r.intro) }) : null));
  const cols = el('div', { class: 'r-cols' });
  r.columns.forEach((col, i) => {
    cols.append(el('section', { class: 'r-col' + (i === 0 ? ' r-col-m3' : '') },
      el('header', {}, el('span', { class: 'm3-title-l' }, col.title), col.line ? el('span', { class: 'm3-body-m', html: inline(col.line) }) : null),
      ...col.items.map(itemCard)));
  });
  page.append(cols);
  for (const n of r.notes) page.append(el('div', { class: 'r-note m3-body-m' }, el('div', { class: 'm3-title-s' }, n.title), el('div', { html: inline(n.line) })));
  shadow.append(page);
  container.append(host);
}
