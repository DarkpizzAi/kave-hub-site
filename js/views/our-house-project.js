// Our house, new-place project ("new flat"): the move-in countdown (shared
// with the home page), a link down to the move-in budget, and the to-do list
// split into before delivery and upon move-in.

import * as data from '../data.js';
import { findSection, isTemplateText, inline } from '../md.js';
import { el, card, chip, tableFromBlock, listFromBlock, emptyNote } from '../ui.js';
import { renderMoveInClock } from '../countdown-view.js';

function todoCard(section, extra) {
  const lists = section.blocks.filter(b => b.kind === 'list');
  const all = lists.flatMap(l => l.items).filter(it => !isTemplateText(it.text));
  const done = all.filter(it => it.checked).length;
  const c = card(section.heading);
  if (all.length) c.querySelector('.tab-section-title').append(' ', chip(`${done}/${all.length} done`, done === all.length ? 'ok' : ''));
  if (!all.length) c.append(emptyNote('No tasks yet.'));
  else for (const l of lists) c.append(listFromBlock(l));
  if (extra) c.append(extra);
  return c;
}

export default async function ourHouseProject(container) {
  container.append(el('h2', {}, 'New flat'));

  // Countdown: identical to the home page's, not just similar to it.
  await renderMoveInClock(container);

  const budgetCard = card('Move-in budget');

  const todo = await data.doc('/our-house/data/todo.md');
  if (todo) {
    const before = findSection(todo, /^before$/i);
    const upon = findSection(todo, /upon move-in/i);
    // Compass (the finance app) isn't built yet: a quiet placeholder here
    // reserves its spot rather than a dead link.
    const compassNote = el('p', { class: 'tab-section-sub' }, 'Compass (finance app): coming soon');
    if (before) container.append(todoCard(before, compassNote));
    if (upon) container.append(todoCard(upon));
  }

  const plan = await data.doc('/our-house/data/plan.md');
  if (plan) {
    for (const s of plan.sections) {
      if (!/envelope|totals|budget by room|financing/i.test(s.heading)) continue;
      budgetCard.append(el('h3', {}, s.heading));
      for (const b of s.blocks) {
        if (b.kind === 'table') budgetCard.append(tableFromBlock(b));
        else if (b.kind === 'list') budgetCard.append(listFromBlock(b));
        else if (b.kind === 'p') budgetCard.append(el('p', { class: 'sub', html: inline(b.text) }));
      }
    }
  }
  container.append(budgetCard);
}
