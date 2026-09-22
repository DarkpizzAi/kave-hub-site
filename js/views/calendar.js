// Calendar: emptied on 2026-09-22 and moved to apps. Compass takes over this
// slot once it lands; until then it's a blank tablet like Spoon's, saying so.

import { el } from '../ui.js';

export default async function calendar(container) {
  container.classList.add('tablet-page');
  container.append(el('div', { class: 'tablet' },
    el('span', { class: 'cam' }),
    el('div', { class: 'screen blank-screen' }, el('p', {}, 'Compass app coming soon')),
    el('span', { class: 'home-btn' })));
}
