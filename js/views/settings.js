// Settings, modelled on Spoon's Settings tab: theme, sync, then an Advanced
// disclosure with the user, the GitHub token and the update check.

import * as data from '../data.js';
import { card, el } from '../ui.js';
import { PALETTES, WHO, getPalette, setPalette, getWho, setWho } from '../prefs.js';
import { applyToEmbeddedApps, forgetInEmbeddedApps } from '../embedded.js';
import { status, describeStatus } from '../status.js';
import { checkForUpdate } from '../guard.js';
import { glyph } from '../glyphs.js';

const CONFIRM_MS = 1500;   // keep equal to --confirm-ms in the tokens
const ADV_KEY = 'hubweb:adv';

function flash(btn, text) {
  const was = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = was; }, CONFIRM_MS);
}

function row(label, hint, control) {
  return el('div', { class: 'set-row' },
    el('div', { class: 'grow' }, label, hint ? el('div', { class: 'tab-section-sub' }, hint) : null),
    control);
}

function themeSection() {
  const pills = el('div', { class: 'pills' });
  const buttons = PALETTES.map(p => {
    const b = el('button', { type: 'button', class: 'pill' + (p === getPalette() ? ' on' : '') },
      p.charAt(0).toUpperCase() + p.slice(1));
    b.addEventListener('click', () => {
      setPalette(p);
      buttons.forEach((x, i) => x.classList.toggle('on', PALETTES[i] === p));
    });
    return b;
  });
  pills.append(...buttons);
  return card('Theme', row('Accent colour', 'Light and dark follow your system.', pills));
}

function syncSection() {
  const lines = el('div', { class: 'grow' });
  function paint() {
    lines.innerHTML = '';
    for (const [kind, text] of describeStatus(status)) {
      lines.append(el('div', { class: kind === 'muted' ? 'tab-section-sub' : 'sl ' + kind }, text));
    }
  }
  paint();
  const btn = el('button', { type: 'button', class: 'btn' }, 'Sync now');
  btn.addEventListener('click', () => {
    data.dropCache();
    status.limited = false;
    // status.syncedAt is stamped by route() once the refresh it triggers has
    // actually finished rendering, not here - otherwise "synced" would be a
    // lie for however long the refresh takes.
    window.addEventListener('hub:refreshed', () => { paint(); flash(btn, 'Synced'); }, { once: true });
    window.dispatchEvent(new Event('hub:refresh'));
  });
  return card('Sync', el('div', { class: 'set-row' }, lines, btn));
}

function advancedSection() {
  let open = false;
  try { open = sessionStorage.getItem(ADV_KEY) === '1'; } catch (e) { /* storage blocked */ }

  const toggle = el('button', { type: 'button', class: 'adv-toggle', 'aria-expanded': String(open) },
    glyph('chevron', 16), 'Advanced settings');
  const body = el('div', {});
  body.hidden = !open;
  toggle.addEventListener('click', () => {
    open = !open;
    body.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    try { sessionStorage.setItem(ADV_KEY, open ? '1' : '0'); } catch (e) { /* storage blocked */ }
  });

  // User: names come from the private repo at runtime; the route key is the fallback.
  const select = el('select', {}, ...WHO.map(w => el('option', { value: w }, w)));
  if (getWho()) select.value = getWho();
  select.addEventListener('change', () => setWho(select.value));
  WHO.forEach(async (w, i) => {
    const admin = await data.doc(`/${w}/data/admin.md`);
    if (admin && admin.title) select.options[i].textContent = admin.title;
  });

  const forget = el('button', { type: 'button', class: 'btn' }, 'Forget token');
  forget.addEventListener('click', () => {
    data.clearToken();
    forgetInEmbeddedApps();
    window.dispatchEvent(new Event('hub:forget'));
  });

  const note = el('div', { class: 'tab-section-sub' }, 'Not checked yet');
  const update = el('button', { type: 'button', class: 'btn' }, 'Check for updates');
  update.addEventListener('click', async () => {
    update.disabled = true;
    note.textContent = 'Checking...';
    try {
      const r = await checkForUpdate();
      note.textContent = r.changed ? 'Updating...' : 'Version ' + r.version + ', up to date';
    } catch (e) {
      note.textContent = 'Check failed. Try again.';
    }
    update.disabled = false;
  });

  const apply = el('button', { type: 'button', class: 'btn' }, 'Apply settings to all embedded apps');
  const applyRow = row('Embedded apps', 'Send your user, theme and token to the apps inside the hub.', apply);
  apply.addEventListener('click', () => {
    const done = applyToEmbeddedApps({ token: data.getToken(), who: getWho() || '', palette: getPalette() });
    applyRow.querySelector('.tab-section-sub').textContent = done.every(d => d.ok)
      ? 'Applied to ' + done.map(d => d.name).join(', ') + '.'
      : 'Could not write every app. Try again.';
  });

  body.append(
    row('User', 'Who you are. Shared with Spoon.', select),
    applyRow,
    row('GitHub token', 'Never shown. Forgetting it returns you to the gate.', forget),
    el('div', { class: 'set-row' }, el('div', { class: 'grow' }, 'Update', note), update));

  return card('Advanced', toggle, body);
}

export default async function settings(container) {
  container.append(themeSection(), syncSection(), advancedSection());
}
