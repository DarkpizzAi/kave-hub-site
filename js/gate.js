// The only screen without a token: the KAVE wordmark, one masked pill field
// and a round arrow button. No labels, no placeholder, no error text. A wrong
// token just clears the field. The tab title stays "-".

import * as data from './data.js';
import { glyph } from './glyphs.js';

export function showGate(root, onOk) {
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'gate';

  const mark = document.createElement('span');
  mark.className = 'gate-mark';
  mark.textContent = 'KAVE';

  const field = document.createElement('div');
  field.className = 'gate-field';

  const input = document.createElement('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Access');
  input.setAttribute('data-1p-ignore', '');
  input.setAttribute('data-lpignore', 'true');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gate-go';
  button.setAttribute('aria-label', 'Connect');
  button.append(glyph('arrow', 20));

  async function submit() {
    const candidate = input.value.trim();
    input.value = '';
    if (!candidate) return;
    if (await data.verifyToken(candidate)) {
      data.setToken(candidate);
      onOk();
    } else {
      input.focus();
    }
  }

  button.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  field.append(input, button);
  box.append(mark, field);
  root.append(box);
  input.focus();
}
