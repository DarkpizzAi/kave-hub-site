// Brand: renders household-look.md live (one card per section) instead of a
// copy of it, so this page can never drift from the actual design rules -
// a change to the source doc shows up here on next load, no page edit.
// Plain for now; a visual "at a glance" sample is a later pass.

import * as data from '../data.js';
import { el, card, header, renderDocCards, emptyNote } from '../ui.js';

const TYPE_SAMPLES = [
  ['app-title', '--fs-display', '600', 'The app header'],
  ['sheet-title', '--fs-title-lg', '600', 'Bottom-sheet titles'],
  ['section-title', '--fs-lede', '600', 'Section titles'],
  ['body', '--fs-body', '400', 'Inputs, card titles'],
  ['control', '--fs-ui', '400', 'List rows, buttons'],
  ['caption', '--fs-meta', '400', 'Card meta, tags'],
];

const THEME_ACCENTS = [
  ['Cobalt', '#1a73e8'],
  ['Amber', '#f4b400'],
  ['Chartreuse', '#d7d63a'],
];

function typeSamples() {
  const c = card('Type');
  for (const [role, fs, fw, note] of TYPE_SAMPLES) {
    c.append(el('p', {
      style: `font-size:var(${fs});font-weight:${fw};margin:0 0 8px;color:var(--text)`,
    }, role + ' - ' + note));
  }
  return c;
}

function colourSamples() {
  const c = card('Colour');
  const shared = ['bg', 'surface', 'panel', 'text', 'text-dim', 'border'];
  const row = el('div', { class: 'palette-row' });
  for (const name of shared) {
    row.append(el('span', {
      class: 'palette-swatch',
      style: `background:var(--${name})`,
      title: name,
    }));
  }
  c.append(el('p', { class: 'tab-section-sub' }, 'Shared: ' + shared.join(', ')), row);

  const arow = el('div', { class: 'palette-row' });
  for (const [name, hex] of THEME_ACCENTS) {
    arow.append(el('span', { class: 'palette-swatch', style: `background:${hex}`, title: name }));
  }
  c.append(el('p', { class: 'tab-section-sub' }, 'Accent per theme: ' + THEME_ACCENTS.map(t => t[0]).join(', ')), arow);
  return c;
}

// "At a glance" shows the same font/colour samples as before, but as two
// cards side by side, each carrying a "jump to" button down into the real
// section further down the page - so the nice-looking preview doesn't also
// duplicate that section's content (or its sidebar entry: both preview
// cards opt out of the TOC, the real "Type"/"Colour" sections don't).
function atAGlance(container, typeId, colourId) {
  container.append(el('h2', {}, 'At a glance'));
  const type = typeSamples();
  type.classList.add('no-toc');
  if (typeId) type.append(el('a', { class: 'btn', href: '#' + typeId }, 'Jump to fonts'));
  const colour = colourSamples();
  colour.classList.add('no-toc');
  if (colourId) colour.append(el('a', { class: 'btn', href: '#' + colourId }, 'Jump to colours'));
  container.append(el('div', { class: 'cards2' }, type, colour));
}

export default async function brand(container) {
  container.append(header('brand', ''));
  const doc = await data.doc('/brand/data/household-look.md');
  if (!doc) { container.append(emptyNote('household-look.md not found.')); return; }

  // Render the rules first (off-screen) so the real Type/Colour sections
  // exist with real ids before the at-a-glance jump buttons need them, then
  // move the whole thing into place after the at-a-glance block.
  const rules = el('div');
  rules.append(el('h2', {}, 'Rules'));
  renderDocCards(rules, doc, { skipCode: true, skipHeadings: [/^history$/i] });
  const findCard = title => [...rules.querySelectorAll('.tab-section-title')]
    .find(t => t.textContent === title)?.closest('.tab-section');

  atAGlance(container, findCard('Type')?.id, findCard('Colour')?.id);
  container.append(...rules.childNodes);
}
