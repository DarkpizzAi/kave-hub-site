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

function atAGlance(container) {
  container.append(typeSamples(), colourSamples());
}

export default async function brand(container) {
  container.append(header('brand', ''));
  const doc = await data.doc('/brand/data/household-look.md');
  if (!doc) { container.append(emptyNote('household-look.md not found.')); return; }
  atAGlance(container, doc);
  renderDocCards(container, doc, { skipCode: true });
}
