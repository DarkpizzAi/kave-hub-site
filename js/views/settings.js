// Settings, laid out like the apps' Settings: Theme, Sync, Advanced. One column.

import * as data from '../data.js';
import { el, icon, header } from '../ui.js';
import { PALETTES, WHO, getPalette, setPalette, getWho, setWho } from '../prefs.js';
import { applyToEmbeddedApps, forgetInEmbeddedApps } from '../embedded.js';
import { status, describeStatus } from '../status.js';
import { checkForUpdate } from '../guard.js';

const NAMES = { cobalt: 'Cobalt', chartreuse: 'Chartreuse' };

function row(lead, title, sub, trail) {
  const subNode = el('div', { class: 'm3-body-m m3-variant' }, sub);
  const node = el('div', { class: 'm3-list-item' },
    el('span', { class: 'm3-list-item__lead m3-list-item__lead--plain' }, icon(lead)),
    el('div', { class: 'm3-list-item__text' }, el('div', { class: 'm3-body-l' }, title), subNode),
    trail ? el('div', { class: 'set-row-trail' }, trail) : null);
  node.sub = subNode;
  return node;
}

function themeCard() {
  const box = el('div', { class: 'swatches' });
  const draw = () => {
    box.innerHTML = '';
    for (const p of PALETTES) {
      const on = getPalette() === p;
      const b = el('button', { type: 'button', class: `swatch swatch-${p}` + (on ? ' is-on' : ''), 'aria-pressed': String(on) },
        el('i', {}, on ? icon('check') : ''), el('span', { class: 'm3-label-m' }, NAMES[p]));
      b.addEventListener('click', () => { setPalette(p); draw(); });
      box.append(b);
    }
  };
  draw();
  return el('div', { class: 'm3-grouped' }, el('div', { class: 'm3-card set-card' }, box,
    el('div', { class: 'm3-body-m set-note' }, 'Light or dark follows the computer.')));
}

function syncRow() {
  const btn = el('button', { type: 'button', class: 'm3-btn m3-btn--tonal m3-btn--small' }, 'Sync now');
  const r = row('sync', 'Sync', '', btn);
  const paint = () => { r.sub.textContent = describeStatus(status).map(x => x[1]).join(' · '); };
  paint();
  btn.addEventListener('click', () => {
    data.dropCache();
    status.limited = false;
    window.addEventListener('hub:refreshed', paint, { once: true });
    window.dispatchEvent(new Event('hub:refresh'));
  });
  return r;
}

export default async function settings(container) {
  const select = el('select', { 'aria-label': 'User' }, ...WHO.map(w => el('option', { value: w }, w[0].toUpperCase() + w.slice(1))));
  if (getWho()) select.value = getWho();
  select.addEventListener('change', () => setWho(select.value));

  const apply = el('button', { type: 'button', class: 'm3-btn m3-btn--tonal m3-btn--small' }, 'Apply');
  const applyRow = row('apps', 'Apps', 'Send your user, theme and token to Ladle, Compass and Stash.', apply);
  apply.addEventListener('click', () => {
    const done = applyToEmbeddedApps({ token: data.getToken(), who: getWho() || '', palette: getPalette() });
    applyRow.sub.textContent = done.every(d => d.ok) ? 'Applied to ' + done.map(d => d.name).join(', ') + '.' : 'Could not write every app. Try again.';
  });

  const forget = el('button', { type: 'button', class: 'm3-btn m3-btn--tonal m3-btn--small' }, 'Forget');
  forget.addEventListener('click', () => { data.clearToken(); forgetInEmbeddedApps(); window.dispatchEvent(new Event('hub:forget')); });

  const update = el('button', { type: 'button', class: 'm3-btn m3-btn--tonal m3-btn--small' }, 'Check');
  const updateRow = row('system_update', 'Updates', 'Not checked yet', update);
  update.addEventListener('click', async () => {
    update.disabled = true;
    updateRow.sub.textContent = 'Checking...';
    try {
      const r = await checkForUpdate();
      updateRow.sub.textContent = r.changed ? 'Updating...' : 'Version ' + r.version + ', up to date';
    } catch (e) { updateRow.sub.textContent = 'Check failed. Try again.'; }
    update.disabled = false;
  });

  container.append(el('div', { class: 'one' },
    header('Theme'), themeCard(),
    header('Sync'), el('div', { class: 'm3-grouped' }, syncRow(), row('folder_open', 'Reads from', 'kave-hub, branch main')),
    header('Advanced'), el('div', { class: 'm3-grouped' },
      row('person', 'User', 'Who you are on this computer.', select), applyRow,
      row('key', 'GitHub token', 'Read-only, kept in this browser only.', forget), updateRow)));
}
