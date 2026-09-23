// The "time until move-in" clock: built once here so the home page and the
// our-house "new flat" section render the exact same thing, not two things
// that happen to look alike.

import * as data from './data.js';
import { findSection } from './md.js';
import { el, card, emptyNote } from './ui.js';
import { parseMoveIn, madridToUtc, remaining } from './countdown.js';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];
const pad = n => String(n).padStart(2, '0');

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

export async function renderMoveInClock(container) {
  const parts = await moveInParts();
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
  const c = card('Countdown until we move in');
  c.classList.add('no-toc');
  c.append(el('div', { class: 'clock-box' }, row), done);
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
