// The only screens without a token, on Material 3: the hub mark, the title,
// a token field and the accent button. No intro text (Isa, 06/11/2026). A
// wrong token just clears the field. The tab title stays "-".

import * as data from './data.js';
import { el, icon } from './ui.js';
import { WHO, PALETTES } from './prefs.js';

function card(...children) {
  return el('div', { class: 'gate' },
    el('span', { class: 'gate-mark' }, icon('hub')), el('div', { class: 'm3-headline-s' }, 'Kave hub'), ...children);
}

export function showGate(root, onOk) {
  root.innerHTML = '';
  const input = el('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'GitHub token',
    'data-1p-ignore': '', 'data-lpignore': 'true' });
  const button = el('button', { type: 'button', class: 'm3-btn m3-btn--filled gate-go', 'aria-label': 'Connect' }, icon('arrow_forward'));

  async function submit() {
    const candidate = input.value.trim();
    input.value = '';
    if (!candidate) return;
    if (await data.verifyToken(candidate)) { data.setToken(candidate); onOk(); } else input.focus();
  }
  button.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  root.append(card(el('div', { class: 'gate-field' }, input, button)));
  input.focus();
}

// After the token: who, then which theme. One tap each; nothing is stored here.
export function showSetup(root, onDone) {
  const picked = {};
  const screen = (controls) => { root.innerHTML = ''; root.append(card(el('div', { class: 'gate-choices' }, ...controls))); };
  const chip = (text, onClick) => { const b = el('button', { type: 'button', class: 'm3-chip setup-choice' }, text); b.addEventListener('click', onClick); return b; };
  const askTheme = () => { screen(PALETTES.map(p => chip(p[0].toUpperCase() + p.slice(1), () => onDone({ who: picked.who, palette: p })))); root.querySelector('.setup-choice').focus(); };
  screen(WHO.map(w => chip(w[0].toUpperCase() + w.slice(1), () => { picked.who = w; askTheme(); })));
  root.querySelector('.setup-choice').focus();
}
