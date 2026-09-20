// Home: central plugin menu + cross-plugin "Today" highlights strip.

import * as data from '../data.js';
import { findSection, firstTable, isTemplateText, isPlaceholder } from '../md.js';
import { pixelEmoji } from '../icons.js';
import { el, kpi, header } from '../ui.js';

const ICONS = {
  household: '\u{1F6CB}️', // couch
  food: '\u{1F37D}️',      // plate
  money: '\u{1F4B6}',           // euro notes
  fun: '\u{1F3B2}',             // die
  house: '\u{1F3D7}️',     // construction
  hugo: '\u{1F950}',            // croissant
  isa: '\u{1F338}',             // blossom
};

async function todayTiles() {
  const tiles = [];

  // House delivery countdown
  const plan = await data.doc('/house/data/plan.md');
  let delivery = null;
  if (plan) {
    const facts = findSection(plan, /key facts/i);
    const line = facts && facts.blocks.find(b => b.kind === 'list');
    const item = line && line.items.find(it => /delivery date/i.test(it.text));
    const d = item && data.parseDate(item.text);
    if (d) delivery = d;
  }
  const dd = delivery ? data.daysUntil(delivery) : null;
  if (dd != null && dd >= 0) {
    tiles.push(kpi('New house delivery', dd + ' days', data.fmtDate(delivery), 'accent'));
  }

  // Calendar dates in the next 45 days
  const cal = await data.doc('/calendar/data/calendar.md');
  if (cal) {
    for (const s of cal.sections) {
      for (const b of s.blocks) {
        if (b.kind !== 'list') continue;
        for (const it of b.items) {
          if (isTemplateText(it.text)) continue;
          const d = data.parseDate(it.text);
          const n = data.daysUntil(d);
          if (d && n != null && n >= 0 && n <= 45) {
            const label = it.text.replace(/\s*-?\s*\d{1,2}\/\d{1,2}(\/\d{4})?\s*$/, '');
            tiles.push(kpi(s.heading || 'Calendar', label, `in ${n} days (${data.fmtDate(d)})`));
          }
        }
      }
    }
  }

  // Upcoming bookings
  const book = await data.doc('/calendar/data/bookings.md');
  if (book) {
    const up = findSection(book, /upcoming/i);
    const t = firstTable(up);
    if (t) {
      for (const r of t.rows) {
        if (r.every(c => isPlaceholder(c) || !c.trim())) continue;
        const d = data.parseDate(r[0]);
        const n = data.daysUntil(d);
        if (d && n != null && n >= 0 && n <= 60) {
          tiles.push(kpi('Booking', r[1] || 'reservation', `in ${n} days (${data.fmtDate(d)})`));
        }
      }
    }
  }

  // Bills due in the next 7 days (needs a real numeric Day column)
  const bills = await data.doc('/money/data/recurring-bills.md');
  if (bills) {
    for (const s of bills.sections) {
      const t = firstTable(s);
      if (!t || !t.headers.some(h => /day/i.test(h))) continue;
      const di = t.headers.findIndex(h => /day/i.test(h));
      const ai = t.headers.findIndex(h => /amount/i.test(h));
      for (const r of t.rows) {
        const day = parseInt((r[di] || '').trim(), 10);
        if (!day || day > 31 || /\//.test(r[di] || '') || isPlaceholder(r[di]) || isPlaceholder(r[0])) continue;
        const n = data.daysUntilDayOfMonth(day);
        if (n != null && n <= 7) {
          tiles.push(kpi('Bill due', r[0], `${r[ai] || ''} in ${n} days`.trim(), 'warn'));
        }
      }
    }
  }

  return tiles;
}

export default async function home(container, plugins) {
  container.append(header('kave hub', 'Everything in one place.'));

  const strip = el('div', { class: 'kpis' });
  container.append(strip);

  const menu = el('div', { class: 'menu' });
  for (const p of plugins) {
    menu.append(el('a', { class: 'tile', href: '#/' + p.name },
      el('div', { class: 'icon' }, pixelEmoji(ICONS[p.name] || '\u{1F4C1}', 56)),
      el('div', { class: 'name' }, p.name),
      el('div', { class: 'desc' }, p.description || '')));
  }
  container.append(el('h2', {}, 'Our life'), menu);

  const tiles = await todayTiles();
  if (tiles.length) {
    strip.append(...tiles);
  } else {
    strip.remove();
  }
}
