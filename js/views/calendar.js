// Calendar: key dates, bookings, trips. Split out of household.js on
// 19/09/2026 when the planner moved to its own plugin to feed Compass.

import * as data from '../data.js';
import { findSection, firstTable } from '../md.js';
import { el, card, header, tableFromBlock, listFromBlock, renderBlocks, emptyNote } from '../ui.js';

export default async function calendar(container) {
  container.append(header('calendar', 'Key dates, bookings, trips and trip budgets'));

  const cal = await data.doc('/calendar/data/calendar.md');
  if (cal) {
    container.append(el('h2', {}, 'Key dates'));
    const c = card('Recurring');
    for (const s of cal.sections) {
      if (!s.heading) continue;
      c.append(el('h3', {}, s.heading));
      for (const b of s.blocks) {
        if (b.kind === 'list') c.append(listFromBlock(b));
      }
    }
    container.append(c);
  }

  const book = await data.doc('/calendar/data/bookings.md');
  if (book) {
    container.append(el('h2', {}, 'Bookings'));
    const up = findSection(book, /upcoming/i);
    const past = findSection(book, /past/i);
    const c = card('Upcoming');
    const t = firstTable(up);
    if (t) c.append(tableFromBlock(t));
    else c.append(emptyNote('No upcoming bookings.'));
    if (past && past.blocks.length) {
      const det = el('details', {}, el('summary', {}, 'Past bookings'));
      renderBlocks(det, past.blocks);
      c.append(det);
    }
    container.append(c);
  }

  const trips = await data.doc('/calendar/data/trips-history.md');
  if (trips) {
    container.append(el('h2', {}, 'Trips'));
    for (const s of trips.sections) {
      if (!s.heading) continue;
      const c = card(s.heading);
      if (!s.blocks.length) c.append(emptyNote());
      else renderBlocks(c, s.blocks);
      container.append(c);
    }
  }
}
