// Chantier: how the hub is built. The infrastructure section (device cards,
// interactions, flows, routines) comes first, then every other data file of
// the chantier plugin as cards - except roadmap.md (the roadmap skill still
// reads/writes it, the site just doesn't render it), the security files
// (rendered on the security page, see security.js), and data-locations.md
// (also moved to the security page).

import * as data from '../data.js';
import { findSection, firstTable, isTemplateText } from '../md.js';
import { el, card, chip, emptyNote, popup, renderDocCards } from '../ui.js';
import { glyph } from '../glyphs.js';
import { SECURITY_FILES } from './security.js';

// Files that live in chantier/data but never render on this generic loop.
const SKIP_FILES = ['infrastructure.md', 'roadmap.md', 'data-locations.md', ...SECURITY_FILES];

// A device's kind maps to one of the outline glyphs added for this page.
const DEVICE_GLYPH = { pc: 'pc', 'android phone': 'phone' };
function deviceGlyph(name, kind) {
  if (/mini pc|server/i.test(name)) return 'server';
  if (/surface/i.test(name)) return 'tablet';
  return DEVICE_GLYPH[kind.toLowerCase()] || 'generic';
}

function rows(doc, re) {
  const s = doc && findSection(doc, re);
  const t = s && firstTable(s);
  return t ? t.rows : [];
}

async function routinesSection(container) {
  const doc = await data.doc('/chantier/data/routines.md');
  if (!doc) return;
  container.append(el('p', { class: 'tab-section-sub' }, 'Routines'));
  const list = el('div', { class: 'grid' });
  for (const s of doc.sections) {
    if (s.level === 0 || !s.heading) continue;
    const summaryBlock = s.blocks.find(b => b.kind === 'p' && /^Summary:/.test(b.text));
    const summary = summaryBlock ? summaryBlock.text.replace(/^Summary:\s*/, '') : '';
    const rest = s.blocks.filter(b => b !== summaryBlock);
    const d = el('details', {},
      el('summary', {}, s.heading + (summary ? ' - ' + summary : '')));
    const inner = el('div', { class: 'card' });
    for (const b of rest) {
      if (b.kind === 'p') inner.append(el('p', {}, b.text));
    }
    d.append(inner);
    list.append(d);
  }
  container.append(list);
}

async function infrastructure(container) {
  container.append(el('h2', {}, 'Infrastructure'));

  const doc = await data.doc('/chantier/data/infrastructure.md');
  if (!doc) { container.append(emptyNote('chantier/data/infrastructure.md is missing.')); return; }

  const devs = rows(doc, /^devices/i);
  const links = rows(doc, /^interactions/i);
  const unknown = c => isTemplateText(c) || /to confirm/i.test(c);

  const grid = el('div', { class: 'device-grid' });
  for (const [name, owner, kind, notes] of devs) {
    const mine = links.filter(r => r[0] === name || r[1] === name);
    const c = card(name);
    const body = el('div', { class: 'device-card' },
      el('div', { class: 'device-icon' }, glyph(deviceGlyph(name, kind), 28)),
      el('div', {}));
    const text = body.children[1];
    text.append(el('p', { class: 'muted' }, `${owner} - ${kind}`));
    if (notes) text.append(el('p', {}, notes));
    for (const [from, to, channel, what, status] of mine) {
      const other = from === name ? to : from;
      text.append(el('p', {},
        chip(unknown(status) ? 'to confirm' : status),
        ' ', other, ' via ', channel, unknown(what) ? '' : ' - ' + what));
    }
    c.append(body);
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

  await routinesSection(container);
}

// The delivery log is newest first and long. The latest entries show as cards
// on the page; "Older entries" opens a popup with the complete log (not just
// the folded tail) via renderDocCards.
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
    const body = el('div');
    renderDocCards(body, { sections: older }, opts);
    const pop = popup(`Older entries (${older.length})`, body);
    for (const sec of pop.querySelectorAll('.tab-section')) sec.classList.add('no-toc');
    const btn = el('button', { type: 'button', class: 'btn' }, `Older entries (${older.length})`);
    btn.addEventListener('click', () => pop.open());
    container.append(btn);
  }
}

export default async function chantier(container) {
  await infrastructure(container);

  const files = (await data.listDir('chantier/data'))
    .filter(f => f.endsWith('.md') && !SKIP_FILES.includes(f));
  for (const f of files) {
    if (f === 'log.md') { await deliveryLog(container); continue; }
    const doc = await data.doc(`/chantier/data/${f}`);
    if (!doc) continue;
    container.append(el('h2', {}, doc.title || f));
    renderDocCards(container, doc, { skipCode: true });
  }
}
