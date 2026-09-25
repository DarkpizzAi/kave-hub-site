// The Calendar slot: Compass itself, framed as a landscape tablet like Spoon.
// Compass lives in its own repo and keeps its own token inside its own
// origin (the same github.io origin as this site, so Settings here can hand
// it the token, the person and the palette: see embedded.js).

import { el } from '../ui.js';

const COMPASS_URL = 'https://darkpizzai.github.io/kave-calendar-app/';

export default async function calendar(container) {
  container.classList.add('tablet-page');
  const frame = el('iframe', { title: 'Compass', src: COMPASS_URL });
  container.append(el('div', { class: 'tablet' },
    el('span', { class: 'cam' }),
    el('div', { class: 'screen' }, frame),
    el('span', { class: 'home-btn' })));
}
