// Chantier: how the hub is built. The infrastructure section (device cards,
// interactions, flows, routines) comes first, then every other data file of
// the chantier plugin as cards - except roadmap.md (the roadmap skill still
// reads/writes it, the site just doesn't render it), routines.md (rendered
// specially inside infrastructure(), see below), the security files
// (rendered on the security page, see security.js), and data-locations.md
// (also moved to the security page).

import * as data from '../data.js';
import { findSection, firstTable, inline } from '../md.js';
import { el, card, emptyNote, popup, renderDocCards } from '../ui.js';
import { glyph } from '../glyphs.js';
import { SECURITY_FILES } from './security.js';

// Files that live in chantier/data but never render on this generic loop.
const SKIP_FILES = ['infrastructure.md', 'roadmap.md', 'data-locations.md', 'routines.md',
  'routine-metrics.jsonl', ...SECURITY_FILES];

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

// A page-unique, human-typed word into a URL-safe id. Used both for a
// routine card's own anchor and for the "receipts routine" cross-links in
// the flow table above it, so they always agree without hand-syncing.
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function routineAnchor(heading) { return 'routine-' + slug(heading); }

// Step | Device(s) | What happens - the device(s) column combines the step's
// From and To into one string. "What happens" is run through inline() so a
// markdown link (e.g. to the Drive folder, or to a routine card below) can
// appear in it; any link that comes out gets the household's standard pill
// treatment (the same look as a status chip) instead of underlined text.
function flowTable(stepRows) {
  const t = el('table');
  t.append(el('thead', {}, el('tr', {},
    el('th', {}, 'Step'), el('th', {}, 'Device(s)'), el('th', {}, 'What happens'))));
  const tb = el('tbody');
  for (const [step, from, to, what] of stepRows) {
    const whatCell = el('td', { html: inline(what) });
    whatCell.querySelectorAll('a').forEach(a => a.classList.add('chip', 'accent'));
    tb.append(el('tr', {}, el('td', {}, step), el('td', {}, from + ' -> ' + to), whatCell));
  }
  t.append(tb);
  return t;
}

// A routine's corner icon: paper for anything about receipts, the existing
// shield glyph for security, a gauge for session start ("spinning up"), a
// brain for session end (what gets remembered).
function routineGlyphKey(heading) {
  if (/receipt|inbound/i.test(heading)) return 'paper';
  if (/security/i.test(heading)) return 'security';
  if (/session-start|start/i.test(heading)) return 'gauge';
  if (/session-end|memory|end/i.test(heading)) return 'brain';
  return 'generic';
}

function slugSummary(s) {
  const summaryBlock = s.blocks.find(b => b.kind === 'p' && /^Summary:/.test(b.text));
  return {
    summary: summaryBlock ? summaryBlock.text.replace(/^Summary:\s*/, '') : '',
    rest: s.blocks.filter(b => b !== summaryBlock),
  };
}

// One block within a routine card: name + icon on one row, the summary
// sentence, then readme and performance disclosures (a sideways arrow that
// points down once open, never a pill). Both read live from the repo -
// readme is this routine's own full text, performance is its logged runs.
function routineBlock(heading, summary, rest, metricsByRoutine) {
  const key = slug(heading);
  const readmeBody = el('div', { class: 'routine-body' });
  for (const b of rest) if (b.kind === 'p') readmeBody.append(el('p', {}, b.text));
  const readme = disclosure('readme', readmeBody);
  const perf = performanceDisclosure(key, metricsByRoutine);
  return el('div', { class: 'routine-block', id: routineAnchor(heading) },
    el('div', { class: 'routine-head' },
      el('div', { class: 'routine-name' }, heading),
      el('div', { class: 'routine-icon' }, glyph(routineGlyphKey(heading), 20))),
    summary ? el('div', { class: 'tab-section-sub' }, summary) : null,
    readme, perf);
}

function disclosure(label, body) {
  return el('details', { class: 'routine-readme' },
    el('summary', {}, el('span', { class: 'routine-arrow' }, glyph('chevron', 14)), label), body);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDateTime(iso) {
  const d = iso && new Date(iso);
  if (!d || isNaN(d)) return iso || '?';
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function runRow(rec) {
  const failed = (rec.stages || []).filter(s => s.result !== 'ok').length;
  return el('tr', {},
    el('td', {}, shortDateTime(rec.started_at)),
    el('td', {}, rec.duration_seconds != null ? rec.duration_seconds + 's' : '?'),
    el('td', {}, rec.tokens_used != null ? rec.tokens_used.toLocaleString() : '?'),
    el('td', {}, failed ? el('span', { class: 'chip due' }, failed + ' failed') : el('span', { class: 'chip ok' }, 'ok')));
}

function runsTable(list) {
  const t = el('table');
  t.append(el('thead', {}, el('tr', {},
    el('th', {}, 'Run'), el('th', {}, 'Duration'), el('th', {}, 'Tokens'), el('th', {}, 'Result'))));
  const tb = el('tbody');
  for (const rec of list) tb.append(runRow(rec));
  t.append(tb);
  return t;
}

// The performance disclosure: the latest run's figures, and (once there is
// more than one) a "See all" button opening a popup with every logged run.
// Nothing has run yet as of this writing, so the honest empty state is what
// most people will see for a while - this is the real mechanism, just with
// no data behind it yet, not a placeholder for a mechanism still to build.
function performanceDisclosure(routineKey, metricsByRoutine) {
  const body = el('div', { class: 'routine-body' });
  const list = (metricsByRoutine.get(routineKey) || [])
    .slice().sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''));
  if (!list.length) {
    body.append(el('p', {}, 'No runs logged yet.'));
  } else {
    const latest = list[0];
    const failed = (latest.stages || []).filter(s => s.result !== 'ok').length;
    body.append(el('p', {},
      `Last run ${shortDateTime(latest.started_at)}: `,
      latest.duration_seconds != null ? latest.duration_seconds + 's, ' : '',
      latest.tokens_used != null ? latest.tokens_used.toLocaleString() + ' tokens, ' : '',
      failed ? el('span', { class: 'chip due' }, failed + ' stage(s) failed') : el('span', { class: 'chip ok' }, 'all stages ok')));
    if (list.length > 1) {
      const pop = popup('All runs', runsTable(list));
      for (const sec of pop.querySelectorAll('.tab-section')) sec.classList.add('no-toc');
      const btn = el('button', { type: 'button', class: 'btn' }, 'See all');
      btn.addEventListener('click', () => pop.open());
      body.append(btn);
    }
  }
  return disclosure('performance', body);
}

async function routinesCard(container, doc) {
  const metricsText = await data.text('/chantier/data/routine-metrics.jsonl');
  const metricsByRoutine = new Map();
  for (const line of (metricsText || '').split('\n')) {
    if (!line.trim()) continue;
    let rec;
    try { rec = JSON.parse(line); } catch (e) { continue; }
    if (!rec.routine) continue;
    if (!metricsByRoutine.has(rec.routine)) metricsByRoutine.set(rec.routine, []);
    metricsByRoutine.get(rec.routine).push(rec);
  }

  const sections = doc.sections.filter(s => s.level !== 0 && s.heading);
  const c = card('Routines');
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    // Session-start and session-end share one card: two repeated blocks,
    // not two cards - they're one story (open a session, close a session).
    if (/^session-start/i.test(s.heading) && sections[i + 1] && /^session-end/i.test(sections[i + 1].heading)) {
      const next = sections[i + 1];
      const a = slugSummary(s), b = slugSummary(next);
      c.append(el('div', { class: 'routine-card' },
        routineBlock(s.heading, a.summary, a.rest, metricsByRoutine),
        routineBlock(next.heading, b.summary, b.rest, metricsByRoutine)));
      i++;
      continue;
    }
    const { summary, rest } = slugSummary(s);
    c.append(el('div', { class: 'routine-card' }, routineBlock(s.heading, summary, rest, metricsByRoutine)));
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
  // step/device(s)/what-happens table. Routines renders in this same
  // "Flows" group whether or not the data has flows of its own - it's still
  // about how the household's machinery works.
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
    if (routinesDoc) await routinesCard(container, routinesDoc);
  }
}

// The delivery log is newest first and long. Only the latest two show as
// cards on the page; "See all" opens a popup with the complete log.
const RECENT_LOG_ENTRIES = 2;

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

  if (entries.length > RECENT_LOG_ENTRIES) {
    const body = el('div');
    renderDocCards(body, { sections: [...intro, ...entries] }, opts);
    const pop = popup(doc.title || 'Delivery log', body);
    for (const sec of pop.querySelectorAll('.tab-section')) sec.classList.add('no-toc');
    const btn = el('button', { type: 'button', class: 'btn' }, 'See all');
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
