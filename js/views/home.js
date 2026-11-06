// Home: the move-in countdown (from the "Move-in date" line under Key facts
// in our-house/data/plan.md), then what changed most recently on any shelf,
// so the page is never stale. One column.

import * as data from '../data.js';
import { findSection } from '../md.js';
import { el, icon, emptyNote, listItem } from '../ui.js';
import { parseMoveIn, madridToUtc, remaining } from '../countdown.js';
import { hrefFor, pageFor } from '../routes.js';
import { allShelfFiles, pool } from '../shelf.js';

export async function moveInParts() {
  const plan = await data.doc('/our-house/data/plan.md');
  const facts = plan && findSection(plan, /key facts/i);
  for (const b of facts ? facts.blocks : []) {
    if (b.kind !== 'list') continue;
    const it = b.items.find(x => /move-in date/i.test(x.text));
    const parts = it && parseMoveIn(it.text);
    if (parts) return parts;
  }
  return null;
}

async function countdown() {
  const parts = await moveInParts();
  if (!parts) return emptyNote('No move-in date yet: add a "Move-in date" line under Key facts in our-house/data/plan.md.');
  const target = madridToUtc(parts);
  const units = ['days', 'hours', 'minutes'];
  const nums = units.map(() => el('span', { class: 'clock-num' }, '0'));
  const clock = el('div', { class: 'clock', role: 'timer', 'aria-label': 'Time until move-in' },
    ...units.map((u, i) => el('div', { class: 'clock-unit' }, nums[i], el('span', { class: 'm3-label-l' }, u))));
  const hero = el('div', { class: 'hero' },
    el('span', { class: 'hero-kick' }, icon('key', 'acc'), el('span', { class: 'm3-title-m' }, 'Move-in')),
    clock, el('span', { class: 'm3-body-m' }, 'From the Move-in date in our-house/data/plan.md'));
  const draw = () => {
    const r = remaining(Date.now(), target);
    [r.days, r.hours, r.minutes].forEach((v, i) => { nums[i].textContent = String(v); });
    if (r.done) { clock.replaceWith(el('div', { class: 'm3-headline-m acc' }, "We're in.")); return true; }
    return false;
  };
  draw();
  const timer = setInterval(() => { if (!hero.isConnected && hero.dataset.seen) { clearInterval(timer); return; } if (hero.isConnected) hero.dataset.seen = '1'; if (draw()) clearInterval(timer); }, 30000);
  return hero;
}

// Today, Yesterday, Earlier this week, Older.
export function dayGroup(date, now = new Date()) {
  const day = d => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const n = Math.round((day(now) - day(date)) / 86400000);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return 'Earlier this week';
  return 'Older';
}

function timeOf(date, group) {
  if (group === 'Today' || group === 'Yesterday') return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (group === 'Earlier this week') return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

async function recent(n = 10) {
  const files = await allShelfFiles();
  const dated = (await pool(files, 6, async f => ({ ...f, changed: await data.lastChange(f.path) }))).filter(f => f.changed);
  dated.sort((a, b) => b.changed - a.changed);
  const top = await pool(dated.slice(0, n), 6, async f => {
    const doc = await data.doc('/' + f.path);
    return { ...f, title: (doc && doc.title) || f.path.split('/').pop() };
  });
  const box = el('div', {}, el('div', { class: 'm3-list-header m3-title-s' }, 'Recently changed'));
  if (!top.length) { box.append(emptyNote('No changes found.')); return box; }
  let group = null, list = null;
  for (const f of top) {
    const g = dayGroup(f.changed);
    if (g !== group) { group = g; list = el('div', { class: 'm3-grouped' }); box.append(el('div', { class: 'day-h m3-label-l' }, g), list); }
    const page = pageFor(f.key);
    list.append(listItem({ lead: page.icon, title: f.title, sub: f.page + ' · ' + f.path.split('/').pop(), trail: timeOf(f.changed, g), href: hrefFor(f.key, f.path) }));
  }
  return box;
}

export default async function home(container) {
  const [hero, list] = await Promise.all([countdown(), recent()]);
  container.append(el('div', { class: 'one' }, hero, list));
}
