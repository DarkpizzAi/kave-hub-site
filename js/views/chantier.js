// Chantier: how the hub is built. The infrastructure section (device cards,
// interactions, flows, routines) comes first, then every other data file of
// the chantier plugin as cards - except roadmap.md (the roadmap skill still
// reads/writes it, the site just doesn't render it), routines.md (rendered
// specially inside infrastructure(), see below), the security files
// (rendered on the security page, see security.js), and data-locations.md
// (also moved to the security page).

import * as data from '../data.js';
import { findSection, firstTable } from '../md.js';
import { el, card, emptyNote, popup, renderDocCards } from '../ui.js';
import { glyph } from '../glyphs.js';
import { SECURITY_FILES } from './security.js';

// Files that live in chantier/data but never render on this generic loop.
const SKIP_FILES = ['infrastructure.md', 'roadmap.md', 'data-locations.md', 'routines.md', ...SECURITY_FILES];

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

// Step | Device(s) | What happens - the device(s) column combines the step's
// From and To into one string.
function flowTable(stepRows) {
  const t = el('table');
  t.append(el('thead', {}, el('tr', {},
    el('th', {}, 'Step'), el('th', {}, 'Device(s)'), el('th', {}, 'What happens'))));
  const tb = el('tbody');
  for (const [step, from, to, what] of stepRows) {
    tb.append(el('tr', {},
      el('td', {}, step), el('td', {}, from + ' -> ' + to), el('td', {}, what)));
  }
  t.append(tb);
  return t;
}

// One black card per routine: name, one-line summary, and a "readme"
// disclosure (sideways arrow that points down when open) revealing the full
// text as it stands in the repo right now (never baked/stale - fetched at
// render time exactly like everything else on this page).
function routineCard(heading, summary, rest) {
  const body = el('div', { class: 'routine-body' });
  for (const b of rest) if (b.kind === 'p') body.append(el('p', {}, b.text));
  const details = el('details', { class: 'routine-readme' },
    el('summary', {}, el('span', { class: 'routine-arrow' }, glyph('chevron', 14)), 'readme'), body);
  return el('div', { class: 'routine-card' },
    el('div', { class: 'routine-name' }, heading),
    summary ? el('div', { class: 'tab-section-sub' }, summary) : null,
    details);
}

function routinesCard(container, doc) {
  const c = card('Routines');
  for (const s of doc.sections) {
    if (s.level === 0 || !s.heading) continue;
    const summaryBlock = s.blocks.find(b => b.kind === 'p' && /^Summary:/.test(b.text));
    const summary = summaryBlock ? summaryBlock.text.replace(/^Summary:\s*/, '') : '';
    const rest = s.blocks.filter(b => b !== summaryBlock);
    c.append(routineCard(s.heading, summary, rest));
  }
  container.append(c);
}

async function infrastructure(container) {
  container.append(el('h2', {}, 'Infrastructure'));

  const doc = await data.doc('/chantier/data/infrastructure.md');
  if (!doc) { container.append(emptyNote('chantier/data/infrastructure.md is missing.')); return; }

  const devs = rows(doc, /^devices/i);

  const grid = el('div', { class: 'device-grid' });
  for (const [name, , kind] of devs) {
    // No title passed to card(): the name is plain small text under the
    // icon, not the bold subtitle-styled heading row card() would give it.
    const c = card();
    c.classList.add('no-toc');
    c.append(el('div', { class: 'device-card' },
      el('div', { class: 'device-icon' }, glyph(deviceGlyph(name, kind), 28)),
      el('div', { class: 'device-name' }, name)));
    grid.append(c);
  }
  container.append(grid);

  // Sections are flat, so a flow is every deeper heading after `## Flows`,
  // up to the next heading at that level or above. One card per flow, a
  // step/device(s)/what-happens table. Routines renders in this same "Flows"
  // group whether or not the data has flows of
  // its own - it's still about how the household's machinery works.
  const flowCards = [];
  const at = doc.sections.findIndex(s => /^flows/i.test(s.heading));
  if (at !== -1) {
    for (let i = at + 1; i < doc.sections.length; i++) {
      const f = doc.sections[i];
      if (f.level <= doc.sections[at].level) break;
      const t = firstTable(f);
      if (!t) continue;
      flowCards.push(card(f.heading, flowTable(t.rows)));
    }
  }
  const routinesDoc = await data.doc('/chantier/data/routines.md');
  if (flowCards.length || routinesDoc) {
    container.append(el('h2', {}, 'Flows'));
    for (const c of flowCards) container.append(c);
    if (routinesDoc) routinesCard(container, routinesDoc);
  }
}

// The delivery log is newest first and long. The latest entries show as cards
// on the page; "Older entries" opens a popup with the complete log (not just
// the folded tail) via renderDocCards. No log entry, recent or archived, is
// a sidebar-worthy "page" on its own, so all of them opt out of the TOC.
const RECENT_LOG_ENTRIES = 10;

async function deliveryLog(container) {
  const doc = await data.doc('/chantier/data/log.md');
  if (!doc) return;
  container.append(el('h2', {}, doc.title || 'Delivery log'));
  const intro = doc.sections.filter(s => s.level === 0);
  const entries = doc.sections.filter(s => s.level !== 0);
  const opts = { skipCode: true };
  const before = container.children.length;
  renderDocCards(container, { sections: [...intro, ...entries.slice(0, RECENT_LOG_ENTRIES)] }, opts);
  for (let i = before; i < container.children.length; i++) container.children[i].classList.add('no-toc');

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
