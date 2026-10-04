// The Stash tab: the finance app itself, framed like Spoon. Stash lives in its
// own repo and keeps its own token inside its own origin.

import { el } from '../ui.js';

const STASH_URL = 'https://darkpizzai.github.io/kave-finance-app/';

export default async function stash(container) {
  container.classList.add('tablet-page');
  const frame = el('iframe', { title: 'Stash', src: STASH_URL });
  container.append(el('div', { class: 'tablet' },
    el('span', { class: 'cam' }),
    el('div', { class: 'screen' }, frame),
    el('span', { class: 'home-btn' })));
}
