// Our house: plants, the new-flat project, then interior design ideas.
// Setup (hardware and infrastructure) moved to the infrastructure page's
// device cards; `hardware.md`/`home-setup.md` stay as plain data files.
// Calendar, bookings and trips live in views/calendar.js.

import * as data from '../data.js';
import { el, card, chip, renderBlocks } from '../ui.js';
import { findSection, firstList, firstTable } from '../md.js';
import { glyph } from '../glyphs.js';
import ourHouseProject from './our-house-project.js';

// No real photos or drawings yet, so every plant gets the same generic
// house glyph in a dashed card (the household look's "idea" placeholder
// style) - real ones would replace it once they exist.
function plantCard(name, where, count) {
  const c = card(name);
  c.classList.add('no-toc');
  c.querySelector('.card').classList.add('idea');
  const icon = el('div', { class: 'plant-icon' }, glyph('our-house', 40));
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
  const grid = el('div', { class: 'plant-grid' });
  for (const [name, where, count] of t.rows) grid.append(plantCard(name, where, count));
  container.append(grid);
}

function stylesCard(doc) {
  const s = doc && findSection(doc, /^styles$/i);
  const list = s && firstList(s);
  if (!list || !list.items.length) return null;
  const c = card('Styles');
  c.classList.add('no-toc');
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
  c.classList.add('no-toc');
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
  await ourHouseProject(container);
  await interiorSection(container);
}
