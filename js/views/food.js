// The Food tab: Spoon itself, framed as a landscape tablet and centred on the
// page. Spoon lives in its own repo and keeps its own token inside its own
// origin. The iframe is wider than the screen so its scrollbar is clipped.

import { el } from '../ui.js';

const SPOON_URL = 'https://darkpizzai.github.io/kave-food-app/';

export default async function food(container) {
  container.classList.add('food');
  const frame = el('iframe', { title: 'Spoon', src: SPOON_URL });
  container.append(el('div', { class: 'tablet' },
    el('span', { class: 'cam' }),
    el('div', { class: 'screen' }, frame),
    el('span', { class: 'home-btn' })));
}
