// Home page: a live countdown to move-in day. The moment comes from the
// "Move-in date" line under Key facts in our-house/data/plan.md, so the public
// site holds no date of its own. No intro line and no page buttons.

import * as data from '../data.js';
import { findSection } from '../md.js';
import { el, card, emptyNote } from '../ui.js';
import { parseMoveIn, madridToUtc, remaining, formatMoveIn } from '../countdown.js';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];
const pad = n => String(n).padStart(2, '0');

async function moveIn() {
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

export default async function home(container) {
  const parts = await moveIn();
  if (!parts) {
    container.append(emptyNote('No move-in date set yet. Add a "Move-in date" line under Key facts in our-house/data/plan.md.'));
    return;
  }
  const target = madridToUtc(parts);

  const nums = UNITS.map(() => el('div', { class: 'clock-num' }, '0'));
  const row = el('div', { class: 'clock', role: 'timer', 'aria-label': 'Time until move-in' });
  UNITS.forEach((u, i) => {
    if (i) row.append(el('span', { class: 'clock-sep', 'aria-hidden': 'true' }, ':'));
    row.append(el('div', { class: 'clock-unit' }, nums[i], el('div', { class: 'clock-label' }, u)));
  });
  const done = el('p', { class: 'clock-done', hidden: '' }, "We're in.");
  const c = card('until we move in');
  c.append(row, done, el('p', { class: 'clock-when' }, formatMoveIn(parts)));
  container.append(c);

  function draw() {
    const r = remaining(Date.now(), target);
    const values = [String(r.days), pad(r.hours), pad(r.minutes), pad(r.seconds)];
    nums.forEach((n, i) => { if (n.textContent !== values[i]) n.textContent = values[i]; });
    row.hidden = r.done;
    done.hidden = !r.done;
    return r.done;
  }
  draw();

  // Tick once a second until the page is swapped out or the moment arrives.
  // The container is detached while the route builds it, so it gets a few
  // ticks to be attached before an unattached page is taken as abandoned.
  let seen = false;
  let misses = 0;
  const timer = setInterval(() => {
    if (container.isConnected) seen = true;
    else if (seen || ++misses > 5) { clearInterval(timer); return; }
    if (draw()) clearInterval(timer);
  }, 1000);
}
