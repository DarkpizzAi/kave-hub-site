// Boot, shell and router, on Material 3 (06/11/2026): a navigation rail with
// the menu button at its top (as the apps on wide screens), a menu drawer for
// everything else and the apps, a centred top bar, then the page in one of
// the two layouts. Every page reads the private repo live.

import * as data from './data.js';
import { el, icon, emptyNote } from './ui.js';
import { showGate, showSetup } from './gate.js';
import { applyPalette, getWho, setWho, setPalette } from './prefs.js';
import { applyToEmbeddedApps } from './embedded.js';
import { PAGES, APPS, parseHash, pageFor, redirectFor } from './routes.js';
import { recover } from './guard.js';
import { initTopBar } from './top-bar.js';
import { status } from './status.js';
import home from './views/home.js';
import { shelf, chantier } from './views/shelf.js';
import security from './views/security.js';
import settings from './views/settings.js';
import brand from './views/brand.js';

applyPalette();

const root = document.getElementById('root');
let seq = 0;

const VIEWS = {
  home: (c) => home(c),
  brand: (c) => brand(c),
  chantier: (c, page, file) => chantier(c, page, file),
  security: (c) => security(c),
  settings: (c) => settings(c),
};

function menuButton(cls) {
  const b = el('button', { type: 'button', class: 'm3-icon-btn' + (cls ? ' ' + cls : ''), 'aria-label': 'Menu' }, icon('menu'));
  b.addEventListener('click', openDrawer);
  return b;
}

function rail(active) {
  const nav = el('nav', { class: 'm3-rail site-rail', 'aria-label': 'Pages' });
  const menu = menuButton();
  const items = el('div', { class: 'm3-rail__items' });
  for (const p of PAGES.filter(x => x.place === 'rail')) {
    items.append(el('a', { class: 'm3-rail__item' + (p.key === active ? ' is-active' : ''), href: p.key === 'home' ? '#/' : '#/' + p.key, 'aria-current': p.key === active ? 'page' : null },
      el('span', { class: 'm3-rail__pill' }, icon(p.icon)), el('span', { class: 'm3-label-m' }, p.label)));
  }
  nav.append(menu, items);
  return nav;
}

function closeDrawer() {
  document.querySelectorAll('.m3-scrim, .m3-drawer').forEach(n => n.remove());
}

function openDrawer() {
  closeDrawer();
  const active = parseHash(location.hash).key;
  const item = (p) => el('a', { class: 'm3-drawer__item' + (p.key === active ? ' is-active' : ''), href: p.key === 'home' ? '#/' : '#/' + p.key },
    icon(p.icon), el('span', { class: 'm3-drawer__label' }, p.label));
  const drawer = el('nav', { class: 'm3-drawer', 'aria-label': 'Menu' },
    el('div', { class: 'm3-drawer__head' }, el('span', { class: 'm3-title-l' }, 'Kave hub')),
    el('div', { class: 'm3-drawer__section m3-title-s' }, 'Pages'), ...PAGES.filter(p => p.place === 'rail').map(item),
    el('div', { class: 'm3-drawer__section m3-title-s' }, 'Behind the scenes'), ...PAGES.filter(p => p.place === 'more').map(item),
    el('div', { class: 'm3-drawer__section m3-title-s' }, 'Apps'),
    ...APPS.map(a => el('a', { class: 'm3-drawer__item', href: a.href, target: '_blank', rel: 'noopener' },
      icon(a.icon), el('span', { class: 'm3-drawer__label' }, a.label), icon('open_in_new', 'm3-drawer__trail'))),
    el('div', { class: 'site-drawer-foot m3-body-s' }, 'Reads kave-hub, branch main'));
  const scrim = el('div', { class: 'm3-scrim' });
  scrim.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', e => { if (e.target.closest('a')) closeDrawer(); });
  document.body.append(scrim, drawer);
  drawer.querySelector('a')?.focus();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

async function route() {
  const mySeq = ++seq;
  const moved = redirectFor(location.hash);
  if (moved) { location.replace(moved); return; }
  status.limited = false;
  const { key, file } = parseHash(location.hash);
  const page = pageFor(key);
  const body = el('div', { class: 'site-page' });
  let failed = false;
  try {
    if (!page) {
      if (mySeq === seq && await recover()) return;
      body.append(el('div', { class: 'one' }, emptyNote('Page not found.'), el('a', { href: '#/', class: 'm3-btn m3-btn--text' }, 'Back home')));
    } else if (VIEWS[key]) await VIEWS[key](body, page, file);
    else await shelf(body, page, file);
  } catch (e) {
    failed = true;
    body.append(el('div', { class: 'one' }, emptyNote('Something went wrong drawing this page: ' + e.message)));
  }
  if (mySeq !== seq) return;
  closeDrawer();
  root.innerHTML = '';
  root.append(rail(page ? page.key : ''), el('div', { class: 'site-main' },
    el('header', { class: 'site-bar m3-top-bar', id: 'topBar' }, menuButton('site-menu-btn'), el('h1', {}, page ? (page.key === 'home' ? 'Kave hub' : page.label) : 'Kave hub')), body));
  document.title = page ? (page.key === 'home' ? 'Kave' : page.label + ' · Kave') : 'Kave';
  if (file) window.scrollTo(0, 0);
  initTopBar();
  if (!failed && !status.limited) status.syncedAt = Date.now();
  window.dispatchEvent(new Event('hub:refreshed'));
}

window.addEventListener('data:limit', () => { status.limited = true; });
window.addEventListener('data:auth', () => { data.clearToken(); start(); });
window.addEventListener('hub:forget', () => start());
window.addEventListener('hub:refresh', () => { if (data.getToken()) route(); });
window.addEventListener('hashchange', () => { if (data.getToken() && getWho()) route(); });

function start() {
  closeDrawer();
  if (!data.getToken()) { document.title = '-'; showGate(root, start); return; }
  if (!getWho()) {
    document.title = '-';
    showSetup(root, ({ who, palette }) => {
      setWho(who);
      setPalette(palette);
      applyToEmbeddedApps({ token: data.getToken(), who, palette });
      start();
    });
    return;
  }
  route();
}

start();
