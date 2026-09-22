// Home page: a live countdown to move-in day. The moment comes from the
// "Move-in date" line under Key facts in our-house/data/plan.md, so the public
// site holds no date of its own. Only the timer shows: no date, no intro line,
// no page buttons. The clock itself lives in countdown-view.js so this page
// and the our-house "new flat" section render the exact same thing.

import { renderMoveInClock } from '../countdown-view.js';

export default async function home(container) {
  await renderMoveInClock(container);
}
