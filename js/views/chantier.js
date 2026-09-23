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

// Same lookup as deviceGlyph, for a flow step's free-text From/To entity
// (a device name, or something else like "Google Drive" or "The repo").
function stepGlyph(name) {
  if (/mini pc|server/i.test(name)) return 'server';
  if (/surface/i.test(name)) return 'tablet';
  if (/phone/i.test(name)) return 'phone';
  if (/gaming pc/i.test(name)) return 'pc';
  return 'generic';
}

function rows(doc, re) {
  const s = doc && findSection(doc, re);
  const t = s && firstTable(s);
  return t ? t.rows : [];
}

// One node per distinct From/To entity in step order, icon plus name, with
// an arrow and the step's "what happens" caption between consecutive nodes.
function flowDiagram(stepRows) {
  const nodes = [];
  for (const [, from, to] of stepRows) {
    if (!nodes.length || nodes[nodes.length - 1] !== from) nodes.push(from);
    nodes.push(to);
  }
  // collapse immediate repeats (a step whose To is the next step's From)
  const path = nodes.filter((n, i) => i === 0 || n !== nodes[i - 1]);
  const wrap = el('div', { class: 'flow-diagram' });
  path.forEach((name, i) => {
    wrap.append(el('div', { class: 'flow-node' },
      el('div', { class: 'flow-icon' }, glyph(stepGlyph(name), 26)),
      el('div', { class: 'flow-name' }, name)));
    if (i < path.length - 1) {
      const step = stepRows[i];
      wrap.append(el('div', { class: 'flow-arrow' },
        glyph('arrow', 18),
        step ? el('div', { class: 'flow-caption' }, step[3]) : null));
    }
  });
  return wrap;
}

// Name + one-line summary always visible; a "readme" button reveals the
// full text as it stands in the repo right now (never baked/stale - fetched
// at render time exactly like everything else on this page).
function routineRow(heading, summary, rest) {
  const body = el('div', { class: 'card' });
  for (const b of rest) if (b.kind === 'p') body.append(el('p', {}, b.text));
  const details = el('details', { class: 'routine-readme' },
    el('summary', {}, 'readme'), body);
  return el('div', { class: 'routine' },
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
    c.append(routineRow(s.heading, summary, rest));
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
  // up to the next heading at that level or above. One card per flow, drawn
  // as an icon-and-arrow diagram rather than a numbered step list. Routines
  // renders in this same "Flows" group whether or not the data has flows of
  // its own - it's still about how the household's machinery works.
  const flowCards = [];
  const at = doc.sections.findIndex(s => /^flows/i.test(s.heading));
  if (at !== -1) {
    for (let i = at + 1; i < doc.sections.length; i++) {
      const f = doc.sections[i];
      if (f.level <= doc.sections[at].level) break;
      const t = firstTable(f);
      if (!t) continue;
      flowCards.push(card(f.heading, flowDiagram(t.rows)));
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
