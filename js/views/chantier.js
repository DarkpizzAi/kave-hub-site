// Chantier: how the hub is built. The infrastructure section (how the five
// devices talk to each other and to GitHub and Drive) comes first, then every
// other data file of the chantier plugin as cards.

import * as data from '../data.js';
import { findSection, firstTable, isTemplateText } from '../md.js';
import { el, card, chip, emptyNote, renderDocCards } from '../ui.js';
import { SECURITY_FILES } from './security.js';

function rows(doc, re) {
  const s = doc && findSection(doc, re);
  const t = s && firstTable(s);
  return t ? t.rows : [];
}

async function infrastructure(container) {
  container.append(el('h2', {}, 'Infrastructure'));

  const doc = await data.doc('/chantier/data/infrastructure.md');
  if (!doc) { container.append(emptyNote('chantier/data/infrastructure.md is missing.')); return; }

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
    `${links.length} interactions listed, ${open} still to confirm. Edit chantier/data/infrastructure.md.`));
}

// The delivery log is newest first and long. The latest entries show as cards;
// the rest fold into a closed details block so the page and its sidebar stay short.
const RECENT_LOG_ENTRIES = 10;

async function deliveryLog(container) {
  const doc = await data.doc('/chantier/data/log.md');
  if (!doc) return;
  container.append(el('h2', {}, doc.title || 'Delivery log'));
  const intro = doc.sections.filter(s => s.level === 0);
  const entries = doc.sections.filter(s => s.level !== 0);
  const opts = { skipCode: true };
  renderDocCards(container, { sections: [...intro, ...entries.slice(0, RECENT_LOG_ENTRIES)] }, opts);
  const older = entries.slice(RECENT_LOG_ENTRIES);
  if (older.length) {
    const fold = el('details', { class: 'older' }, el('summary', {}, `Older entries (${older.length})`));
    renderDocCards(fold, { sections: older }, opts);
    container.append(fold);
  }
}

export default async function chantier(container) {
  await infrastructure(container);

  const files = (await data.listDir('chantier/data'))
    .filter(f => f.endsWith('.md') && f !== 'infrastructure.md' && !SECURITY_FILES.includes(f));
  for (const f of files) {
    if (f === 'log.md') { await deliveryLog(container); continue; }
    const doc = await data.doc(`/chantier/data/${f}`);
    if (!doc) continue;
    container.append(el('h2', {}, doc.title || f));
    renderDocCards(container, doc, { skipCode: true });
  }
}
