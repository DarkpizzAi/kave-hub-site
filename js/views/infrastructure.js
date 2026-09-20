// Household sub-page (#/household/infrastructure): how the five devices talk
// to each other and to GitHub / Drive, and the flows that cross them.
// Reads household/data/infrastructure.md.

import * as data from '../data.js';
import { findSection, firstTable, isTemplateText } from '../md.js';
import { el, card, header, chip, emptyNote } from '../ui.js';

function rows(doc, re) {
  const s = doc && findSection(doc, re);
  const t = s && firstTable(s);
  return t ? t.rows : [];
}

export default async function infrastructure(container) {
  container.append(el('a', { href: '#/household' }, '< household'));
  container.append(header('infrastructure', 'How the household machines and phones talk to each other'));

  const doc = await data.doc('/household/data/infrastructure.md');
  if (!doc) { container.append(emptyNote('household/data/infrastructure.md is missing.')); return; }

  const devs = rows(doc, /^devices/i);
  const links = rows(doc, /^interactions/i);
  const unknown = c => isTemplateText(c) || /to confirm/i.test(c);

  const grid = el('div', { class: 'grid' });
  for (const [name, owner, kind, notes] of devs) {
    const mine = links.filter(r => r[0] === name || r[1] === name);
    const c = card(name);
    c.append(el('p', { class: 'muted' }, `${owner} - ${kind}`));
    if (notes) c.append(el('p', {}, notes));
    for (const [from, to, channel, what, status] of mine) {
      const other = from === name ? to : from;
      c.append(el('p', {},
        chip(unknown(status) ? 'to confirm' : status),
        ' ', other, ' via ', channel, unknown(what) ? '' : ' - ' + what));
    }
    grid.append(c);
  }
  container.append(grid);

  // Sections are flat, so a flow is every deeper heading after `## Flows`,
  // up to the next heading at that level or above. One card per flow.
  const at = doc.sections.findIndex(s => /^flows/i.test(s.heading));
  if (at !== -1) {
    const grid2 = el('div', { class: 'grid' });
    for (let i = at + 1; i < doc.sections.length; i++) {
      const f = doc.sections[i];
      if (f.level <= doc.sections[at].level) break;
      const t = firstTable(f);
      if (!t) continue;
      const c = card(f.heading);
      for (const [step, from, to, what] of t.rows) {
        c.append(el('p', {}, el('strong', {}, step + '. '), from, ' > ', to, ' - ', what));
      }
      grid2.append(c);
    }
    if (grid2.children.length) { container.append(el('h2', {}, 'Flows')); container.append(grid2); }
  }

  const open = links.filter(r => unknown(r[4])).length;
  container.append(el('p', { class: 'muted' },
    `${links.length} interactions listed, ${open} still to confirm. Edit household/data/infrastructure.md.`));
}
