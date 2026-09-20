// Person view (one route per person): important open topics first, then the admin and
// money context collapsed at the bottom.

import * as data from '../data.js';
import { inline, findSection, isTemplateText } from '../md.js';
import { pixelEmoji } from '../icons.js';
import { el, card, header, renderBlocks } from '../ui.js';

function importantSection(container, admin) {
  const imp = admin && findSection(admin, /important/i);
  if (!imp) return;
  const open = [];
  for (const b of imp.blocks) {
    if (b.kind !== 'list') continue;
    for (const it of b.items) {
      if (it.checked === false && !isTemplateText(it.text)) open.push(it);
    }
  }
  if (!open.length) return;
  container.append(el('h2', {}, 'Important'));
  const grid = el('div', { class: 'impgrid' });
  for (const it of open) {
    grid.append(el('div', { class: 'imp' },
      pixelEmoji('\u{1F4CC}', 26),
      el('span', { html: inline(it.text) })));
  }
  container.append(grid);
}

export default function person(who) {
  return async function render(container) {
    const admin = await data.doc(`/${who}/data/admin.md`);
    container.append(header((admin && admin.title) || who.charAt(0).toUpperCase() + who.slice(1), 'Personal admin'));

    importantSection(container, admin);

    container.append(el('h2', {}, 'Details'));
    if (admin) {
      const c = card('Admin');
      const det = el('details', {}, el('summary', {}, 'Documents, tasks and log'));
      for (const s of admin.sections) {
        if (s.level === 0 || /important/i.test(s.heading)) continue;
        det.append(el('h3', {}, s.heading));
        renderBlocks(det, s.blocks, { skipCode: true });
      }
      c.append(det);
      container.append(c);
    }

    const pm = await data.doc(`/${who}/data/personal-money.md`);
    if (pm) {
      const c = card(pm.title || 'Personal money');
      const det = el('details', {}, el('summary', {}, 'Goals, rules and context'));
      for (const s of pm.sections) {
        if (s.heading) det.append(el('h3', {}, s.heading));
        renderBlocks(det, s.blocks, { skipCode: true });
      }
      c.append(det);
      container.append(c);
    }
  };
}
