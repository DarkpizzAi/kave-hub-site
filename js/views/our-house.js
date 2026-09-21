// Our house: the place we live in (plants, home setup, hardware), then the
// new-place project. Calendar, bookings and trips live in views/calendar.js.

import * as data from '../data.js';
import { el, card, renderBlocks } from '../ui.js';
import ourHouseProject from './our-house-project.js';

export default async function ourHouse(container) {
  const plants = await data.doc('/our-house/data/plants.md');
  if (plants) {
    container.append(el('h2', {}, 'Plants'));
    const c = card('Care');
    for (const s of plants.sections) {
      if (s.heading) c.append(el('h3', {}, s.heading));
      renderBlocks(c, s.blocks);
    }
    container.append(c);
  }

  container.append(el('h2', {}, 'Home'));
  for (const f of ['home-setup.md', 'hardware.md']) {
    const d = await data.doc('/our-house/data/' + f);
    if (!d) continue;
    const c = card(d.title || f);
    const det = el('details', {}, el('summary', {}, 'Show'));
    for (const s of d.sections) {
      if (s.heading) det.append(el('h3', {}, s.heading));
      renderBlocks(det, s.blocks);
    }
    c.append(det);
    container.append(c);
  }

  await ourHouseProject(container);
}
