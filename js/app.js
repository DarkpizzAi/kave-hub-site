// Boot, shell layout and router. The plugin list comes from the marketplace
// manifest in the private repo at runtime; a plugin without a dedicated view
// falls back to the generic renderer.

import * as data from './data.js';
import { el, emptyNote } from './ui.js';
import { showGate } from './gate.js';

const registry = {};   // name -> (container, restOfPath) => Promise; filled by imports below
const root = document.getElementById('root');

let plugins = null;
let seq = 0;

async function getPlugins() {
  if (plugins) return plugins;
  const manifest = await data.json('/.claude-plugin/marketplace.json');
  plugins = ((manifest && manifest.plugins) || []).filter(p => p.name !== 'hub');
  return plugins;
}

function buildShell() {
  root.innerHTML = '';
  const shell = el('div', { class: 'shell' });
  const nav = el('aside', { id: 'nav' });
  const main = el('div', { class: 'main' });
  const top = el('header', { id: 'top' });
  const view = el('main', { id: 'view' });
  main.append(top, view);
  shell.append(nav, main);
  root.append(shell);
  document.title = 'Hub';
}

function renderNav(list, active, sub) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = '';
  nav.append(el('a', { class: 'brand', href: '#/' }, 'Kave hub'));
  const items = [{ name: '', label: 'Home', href: '#/' }];
  for (const p of list) {
    items.push({ name: p.name, label: p.name, href: '#/' + p.name });
    if (p.name === 'household') {
      items.push({ name: 'household/infrastructure', label: 'infrastructure', href: '#/household/infrastructure' });
    }
  }
  for (const it of items) {
    const on = it.name === (sub ? active + '/' + sub : active);
    nav.append(el('a', { class: 'plug' + (on ? ' active' : ''), href: it.href }, it.label));
  }
}

function renderTop(title, note) {
  const top = document.getElementById('top');
  if (!top) return;
  top.innerHTML = '';
  top.append(el('span', { class: 'top-title' }, title));
  const right = el('span', { class: 'top-right' });
  if (note) right.append(el('span', { class: 'muted' }, note));
  const forget = el('button', { type: 'button' }, 'Forget token');
  forget.addEventListener('click', () => { data.clearToken(); start(); });
  right.append(forget);
  top.append(right);
}

async function route() {
  const mySeq = ++seq;
  const view = document.getElementById('view');
  if (!view) return;
  const box = el('div', { class: 'view-fade' });

  const list = await getPlugins();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

  try {
    if (!parts.length) {
      const home = registry.__home;
      if (home) await home(box, list);
    } else {
      const name = parts[0];
      const fn = registry[name];
      const plug = list.find(p => p.name === name);
      if (fn) await fn(box, parts.slice(1));
      else if (plug && registry.__generic) await registry.__generic(box, name, plug.description);
      else box.append(emptyNote('Page not found. '), el('a', { href: '#/' }, 'Back home'));
    }
  } catch (e) {
    box.append(emptyNote('Something went wrong rendering this page: ' + e.message));
  }

  if (mySeq !== seq) return;
  if (document.getElementById('view') !== view) return;
  renderNav(list, parts[0] || '', parts[0] === 'household' ? parts[1] : '');
  renderTop(parts.join('/') || 'home');
  view.innerHTML = '';
  view.append(box);
  view.scrollTo(0, 0);
}

window.addEventListener('data:limit', () => renderTop(location.hash.replace(/^#\/?/, '') || 'home', 'Rate limited, try again later'));
window.addEventListener('data:auth', () => { data.clearToken(); start(); });
window.addEventListener('hashchange', () => { if (document.getElementById('view')) route(); });

function start() {
  plugins = null;
  if (!data.getToken()) {
    document.title = '-';
    showGate(root, start);
    return;
  }
  buildShell();
  route();
}

export { registry };
import('./views/index.js').then(m => { m.register(); start(); });
