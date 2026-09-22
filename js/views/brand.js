// Brand: renders household-look.md live (one card per section) instead of a
// copy of it, so this page can never drift from the actual design rules -
// a change to the source doc shows up here on next load, no page edit.
// Plain for now; a visual "at a glance" sample is a later pass.

import * as data from '../data.js';
import { findSection, firstTable } from '../md.js';
import { el, header, renderDocCards, emptyNote } from '../ui.js';

function atAGlance(container, doc) {
  const colour = findSection(doc, /^colour$/i);
  const t = firstTable(colour);
  const themes = t ? t.rows.map(r => r[0]).filter(Boolean) : [];
  const bits = ['Rubik type.', 'Shape rule: pills choose, rectangles act.'];
  if (themes.length) bits.push('Themes: ' + themes.join(', ') + '.');
  container.append(el('p', { class: 'tab-section-sub' }, bits.join(' ')));
}

export default async function brand(container) {
  container.append(header('brand', ''));
  const doc = await data.doc('/brand/data/household-look.md');
  if (!doc) { container.append(emptyNote('household-look.md not found.')); return; }
  atAGlance(container, doc);
  renderDocCards(container, doc, { skipCode: true });
}
