// Our house: plants, setup (hardware and infrastructure), the new-flat
// project, then interior design ideas. Calendar, bookings and trips live in
// views/calendar.js.

import * as data from '../data.js';
import { el, card, chip, renderBlocks } from '../ui.js';
import { findSection, firstList, firstTable } from '../md.js';
import { glyph } from '../glyphs.js';
import ourHouseProject from './our-house-project.js';

function subsectionCard(doc, re, title) {
  const s = doc && findSection(doc, re);
  if (!s) return null;
  const c = card(title || s.heading);
  renderBlocks(c, s.blocks);
  return c;
}

// No real photos or drawings yet, so every plant gets a generic line-art
// icon in a dashed card (the household look's "idea" placeholder style) -
// per the plan, real ones would sort first and only the rest would look
// like this. Species map to the closest shape, not a botanically exact one.
const PLANT_ICON = {
  cactus: 'cactus',
  'dragon plant': 'dracaena',
  alocasia: 'alocasia',
  pothos: 'pothos',
  pachira: 'pachira',
  'olive tree': 'olive-tree',
  'lemon tree': 'lemon-tree',
};

function plantCard(name, where, count) {
  const key = name.toLowerCase().replace(/\s*\(.*\)/, '');
  const c = card(name);
  c.querySelector('.card').classList.add('idea');
  const icon = el('div', { class: 'plant-icon' }, glyph(PLANT_ICON[key] || 'generic', 40));
  const meta = el('p', { class: 'tab-section-sub' }, where);
  if (count && count !== '1') meta.append(' ', chip('x' + count));
  const inner = el('div', { class: 'plant-card' }, icon, el('div', {}, meta));
  c.append(inner);
  return c;
}

async function plantsSection(container) {
  const doc = await data.doc('/our-house/data/plants.md');
  if (!doc) return;
  const t = firstTable(doc.sections[0]);
  if (!t || !t.rows.length) return;
  container.append(el('h2', {}, 'Plants'));
  container.append(el('p', { class: 'tab-section-sub' },
    'No real photos or drawings yet, so every plant shows a generic icon - real ones would replace it here.'));
  const grid = el('div', { class: 'grid' });
  for (const [name, where, count] of t.rows) grid.append(plantCard(name, where, count));
  container.append(grid);
}

function namedSubsections(doc, title) {
  if (!doc) return null;
  const c = card(title);
  for (const s of doc.sections) {
    if (!s.heading) continue;
    c.append(el('h3', {}, s.heading));
    renderBlocks(c, s.blocks);
  }
  return c;
}

// Hub-and-spoke: the mini PC / server in the middle, one gaming PC, the
// personal Surface and both phones around it. Fixed topology, not markdown-
// driven - the household look treats a diagram like a chart: hand-built
// inline SVG, no library.
function deviceFlowDiagram() {
  const svg = `<svg viewBox="0 0 260 170" width="100%" height="170" role="img"
    aria-label="The mini PC or server connects to one gaming PC, the personal Surface, and two phones">
    <g style="stroke:var(--rule-strong);stroke-width:1.5">
      <line x1="130" y1="80" x2="40" y2="30"/>
      <line x1="130" y1="80" x2="220" y2="30"/>
      <line x1="130" y1="80" x2="40" y2="130"/>
      <line x1="130" y1="80" x2="220" y2="130"/>
    </g>
    <circle cx="130" cy="80" r="24" style="fill:var(--accent)"/>
    <text x="130" y="84" text-anchor="middle" style="fill:var(--accent-text);font-size:10px;font-weight:600">Mini PC</text>
    <g style="fill:var(--panel);stroke:var(--rule-strong);stroke-width:1.5">
      <circle cx="40" cy="30" r="17"/>
      <circle cx="220" cy="30" r="17"/>
      <circle cx="40" cy="130" r="17"/>
      <circle cx="220" cy="130" r="17"/>
    </g>
    <g style="fill:var(--text);font-size:9px;text-anchor:middle">
      <text x="40" y="12">Gaming PC</text>
      <text x="220" y="12">Surface</text>
      <text x="40" y="156">Phone</text>
      <text x="220" y="156">Phone</text>
    </g>
  </svg>`;
  const c = card('How the devices talk');
  c.append(el('div', { html: svg }));
  return c;
}

async function setupSection(container) {
  container.append(el('h2', {}, 'Setup'));
  container.append(deviceFlowDiagram());
  const hardware = namedSubsections(await data.doc('/our-house/data/hardware.md'), 'Hardware');
  if (hardware) container.append(hardware);
  const setup = namedSubsections(await data.doc('/our-house/data/home-setup.md'), 'Home setup');
  if (setup) container.append(setup);
}

function stylesCard(doc) {
  const s = doc && findSection(doc, /^styles$/i);
  const list = s && firstList(s);
  if (!list || !list.items.length) return null;
  const c = card('Styles');
  const grid = el('div', { class: 'style-grid' });
  for (const it of list.items) {
    grid.append(el('div', { class: 'style-card' },
      el('div', { class: 'style-name' }, it.text),
      el('div', { class: 'style-soon' }, 'mood board coming soon')));
  }
  c.append(grid);
  return c;
}

function palettesCard(doc) {
  // Palettes are the h3s under "## Palettes"; each h3's list is a set of
  // CSS colours (hex or names) rendered as swatch dots.
  const palettes = doc ? doc.sections.filter(s => s.level === 3) : [];
  if (!palettes.length) return null;
  const c = card('Colour palettes');
  for (const p of palettes) {
    const list = firstList(p);
    if (!list || !list.items.length) continue;
    const row = el('div', { class: 'palette-row' });
    for (const it of list.items) {
      const sw = el('span', { class: 'palette-swatch' });
      sw.style.background = it.text.trim();
      row.append(sw);
    }
    c.append(el('div', { class: 'palette' }, el('p', { class: 'tab-section-sub' }, p.heading), row));
  }
  return c;
}

async function interiorSection(container) {
  const doc = await data.doc('/our-house/data/interior-design.md');
  if (!doc) return;
  const styles = stylesCard(doc);
  const palettes = palettesCard(doc);
  if (!styles && !palettes) return;
  container.append(el('h2', {}, 'Interior design'));
  if (styles) container.append(styles);
  if (palettes) container.append(palettes);
}

export default async function ourHouse(container) {
  await plantsSection(container);
  await setupSection(container);
  await ourHouseProject(container);
  await interiorSection(container);
}
