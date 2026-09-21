// Our house, new-place project: delivery countdown, to-do progress, plan totals, and item lists
// (equipment / wishes / design) with priority and status badges.

import * as data from '../data.js';
import { findSection, isTemplateText, inline } from '../md.js';
import { el, card, chip, tableFromBlock, listFromBlock, emptyNote } from '../ui.js';

// Parse "### Item" blocks with "- Field: value" lists and optional
// Candidates/Pieces tables. Fenced templates are opaque code blocks so they
// never show up here.
function parseItems(doc) {
  const items = [];
  for (const s of doc.sections) {
    if (s.level !== 3) continue;
    const item = { name: s.heading, fields: {}, tables: [] };
    for (const b of s.blocks) {
      if (b.kind === 'list') {
        for (const it of b.items) {
          const m = it.text.match(/^(\w[\w /]*):\s*(.*)$/);
          if (m) item.fields[m[1].toLowerCase()] = m[2];
        }
      } else if (b.kind === 'table') {
        item.tables.push(b);
      } else if (b.kind === 'p' && /^(candidates|pieces):/i.test(b.text)) {
        item.tableKind = b.text.split(':')[0].toLowerCase();
      }
    }
    items.push(item);
  }
  return items;
}

function itemCard(item) {
  const c = card(item.name);
  const meta = el('div');
  const pr = (item.fields['priority'] || '').trim();
  const st = (item.fields['status'] || '').trim();
  if (pr) meta.append(el('span', { class: 'badge ' + pr }, pr), ' ');
  if (st) meta.append(el('span', { class: 'badge ' + st }, st), ' ');
  if (item.fields['budget']) meta.append(chip('budget ' + item.fields['budget'] + ' EUR'));
  if (item.fields['chosen'] && !/empty/i.test(item.fields['chosen'])) {
    meta.append(' ', chip('chosen: ' + item.fields['chosen'], 'accent'));
  }
  c.append(meta);
  for (const t of item.tables) c.append(tableFromBlock(t));
  return c;
}

async function itemsSection(container, title, path) {
  const doc = await data.doc(path);
  if (!doc) return;
  container.append(el('h2', {}, title));
  const items = parseItems(doc);
  if (!items.length) {
    container.append(emptyNote('No items yet. Add them in ' + path.replace(/^\//, '') + '.'));
    return;
  }
  for (const it of items) container.append(itemCard(it));
}

export default async function ourHouseProject(container) {

  // Countdown
  const plan = await data.doc('/our-house/data/plan.md');
  let delivery = null;
  if (plan) {
    const facts = findSection(plan, /key facts/i);
    for (const b of (facts ? facts.blocks : [])) {
      if (b.kind !== 'list') continue;
      const it = b.items.find(x => /delivery date/i.test(x.text));
      const d = it && data.parseDate(it.text);
      if (d) delivery = d;
    }
  }
  const days = delivery ? data.daysUntil(delivery) : null;
  if (days != null) {
    const cd = card('Delivery countdown');
    cd.append(el('div', { class: 'count' },
      el('span', { class: 'big' }, String(Math.max(days, 0))),
      el('span', { class: 'unit' }, days >= 0 ? 'days until delivery (' + data.fmtDate(delivery) + ')' : 'delivered!')));
    container.append(cd);
  }

  // To-do with progress per phase
  const todo = await data.doc('/our-house/data/todo.md');
  if (todo) {
    container.append(el('h2', {}, 'To-do'));
    for (const s of todo.sections) {
      if (!s.heading) continue;
      const lists = s.blocks.filter(b => b.kind === 'list');
      const all = lists.flatMap(l => l.items).filter(it => !isTemplateText(it.text));
      const done = all.filter(it => it.checked).length;
      const c = card(s.heading);
      if (all.length) c.querySelector('.tab-section-title').append(' ', chip(`${done}/${all.length} done`, done === all.length ? 'ok' : ''));
      if (!all.length) c.append(emptyNote('No tasks yet.'));
      else for (const l of lists) c.append(listFromBlock(l));
      container.append(c);
    }
  }

  // Plan (finance view)
  if (plan) {
    container.append(el('h2', {}, 'Plan (finance view)'));
    for (const s of plan.sections) {
      if (!s.heading || /tone rules/i.test(s.heading)) continue;
      const c = card(s.heading);
      for (const b of s.blocks) {
        if (b.kind === 'table') c.append(tableFromBlock(b));
        else if (b.kind === 'list') c.append(listFromBlock(b));
        else if (b.kind === 'p') c.append(el('p', { class: 'sub', html: inline(b.text) }));
      }
      container.append(c);
    }
  }

  await itemsSection(container, 'Equipment', '/our-house/data/equipment.md');
  await itemsSection(container, 'Wishes', '/our-house/data/wishes.md');
  await itemsSection(container, 'Interior design', '/our-house/data/interior-design.md');
}
