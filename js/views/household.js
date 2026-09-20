// Household: plants, home setup, hardware.
// Calendar, bookings and trips moved to views/calendar.js on 19/09/2026,
// when the planner became its own plugin to feed Compass.

import * as data from '../data.js';
import { el, card, header, renderBlocks } from '../ui.js';

export default async function household(container) {
  container.append(header('household', 'Home setup, hardware, plants and the greenhouse'));

  const plants = await data.doc('/household/data/plants.md');
  if (plants) {
    container.append(el('h2', {}, 'Plants'));
    const c = card('Care');
    for (const s of plants.sections) {
      if (s.heading) c.append(el('h3', {}, s.heading));
      renderBlocks(c, s.blocks);
    }
    container.append(c);
  }

  container.append(el('p', {}, el('a', { href: '#/household/infrastructure' }, 'Infrastructure: who talks to whom >')));

  container.append(el('h2', {}, 'Home'));
  for (const f of ['home-setup.md', 'hardware.md']) {
    const d = await data.doc('/household/data/' + f);
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
}
