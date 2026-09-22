// Our house: plants, setup (hardware and infrastructure), the new-flat
// project, then interior design ideas. Calendar, bookings and trips live in
// views/calendar.js.

import * as data from '../data.js';
import { el, card, renderBlocks } from '../ui.js';
import { findSection, firstList } from '../md.js';
import ourHouseProject from './our-house-project.js';

function subsectionCard(doc, re, title) {
  const s = doc && findSection(doc, re);
  if (!s) return null;
  const c = card(title || s.heading);
  renderBlocks(c, s.blocks);
  return c;
}

async function plantsSection(container) {
  const doc = await data.doc('/our-house/data/plants.md');
  if (!doc) return;
  container.append(el('h2', {}, 'Plants'));
  for (const re of [/^conditions$/i, /^care$/i, /^wishlist$/i]) {
    const c = subsectionCard(doc, re);
    if (c) container.append(c);
  }
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

async function setupSection(container) {
  // Infrastructure (the mini PC, its routines) is chantier's, not ours -
  // this is just the flat's own network/accounts/layout notes.
  container.append(el('h2', {}, 'Setup'));
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
