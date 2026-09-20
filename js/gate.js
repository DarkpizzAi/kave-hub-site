// The only screen without a token: one empty masked field and one button.
// No labels, no placeholder, no error text. A wrong token just clears the field.

import * as data from './data.js';

export function showGate(root, onOk) {
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'gate';

  const input = document.createElement('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Access');
  input.setAttribute('data-1p-ignore', '');
  input.setAttribute('data-lpignore', 'true');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Connect';

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
  box.append(input, button);
  root.append(box);
  input.focus();
}
