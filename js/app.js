// Boot, shell layout and router. The plugin list comes from the marketplace
// manifest in the private repo at runtime; a plugin without a dedicated view
// falls back to the generic renderer.

import * as data from './data.js';
import { el, emptyNote } from './ui.js';
import { showGate, showSetup } from './gate.js';
import { applyPalette, getWho, setWho, setPalette } from './prefs.js';
import { applyToEmbeddedApps } from './embedded.js';
import { buildTiles, currentKey, mountSwitcher } from './switcher.js';
import { attachToc, detachToc, introLine } from './frame.js';
import { redirectFor } from './routes.js';
import { recover } from './guard.js';
import { status } from './status.js';

applyPalette();

const registry = {};   // name -> (container, restOfPath) => Promise; filled by imports below
const root = document.getElementById('root');

let plugins = null;
let seq = 0;
let switcher = null;

async function getPlugins() {
  if (plugins) return plugins;
  const manifest = await data.json('/.claude-plugin/marketplace.json');
  plugins = ((manifest && manifest.plugins) || []).filter(p => p.name !== 'hub');
  return plugins;
}

function buildShell() {
  root.innerHTML = '';
  const bar = el('header', { class: 'bar' }, el('a', { class: 'wordmark', href: '#/' }, 'KAVE'));
  const view = el('main', { id: 'view' });
  root.append(bar, view);
  document.title = 'Hub';
  switcher = mountSwitcher(bar);
}

// The centred column with its reserved sidebar. Food does not use it.
function buildPage() {
  const sheet = el('div', { class: 'sheet view-fade' });
  const side = el('aside', { class: 'side' });
  const page = el('div', { class: 'page' }, el('div', { class: 'col' }, sheet), side);
  return { page, sheet, side };
}

// Splits the sheet's flat child list into one visual "card" (.sheet-group)
// per h2 group heading, so the page background shows through as a gap
// between titled groups instead of one continuous surface. Content before
// the first h2 (e.g. the intro line) joins the first group. A page with no
// h2 at all becomes a single group, unchanged from today's look.
function groupSheet(sheet) {
  const kids = [...sheet.children];
  if (!kids.length) return;
  let group = el('div', { class: 'sheet-group' });
  let groupHasH2 = false;
  const groups = [group];
  for (const node of kids) {
    if (node.tagName === 'H2') {
      // The first h2 doesn't split anything - it just starts counting; any
      // pre-heading content (e.g. the page intro line) stays in this same
      // first group instead of becoming its own orphan box.
      if (groupHasH2) {
        group = el('div', { class: 'sheet-group' });
        groups.push(group);
      }
      groupHasH2 = true;
    }
    group.append(node);
  }
  sheet.append(...groups);
}

async function route() {
  const mySeq = ++seq;
  const moved = redirectFor(location.hash);
  if (moved) { location.replace(moved); return; }
  status.limited = false;
  let failed = false;
  const view = document.getElementById('view');
  if (!view) return;

  const list = await getPlugins();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const isTablet = parts[0] === 'spoon' || parts[0] === 'calendar';   // apps drawn as a tablet, not a sheet
  const frame = isTablet ? null : buildPage();
  const box = isTablet ? el('div', { class: 'view-fade' }) : frame.sheet;
  const intro = isTablet ? null : introLine(currentKey(location.hash));
  if (intro) box.append(intro);

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
      else {
        // A stale module can hide a route that should exist: refresh and reload once.
        // A hash that names nothing just shows the note. Stale renders never spend the attempt.
        if ((plug || name === 'settings') && mySeq === seq && await recover()) return;
        box.append(emptyNote('Page not found. '), el('a', { href: '#/' }, 'Back home'));
      }
    }
  } catch (e) {
    failed = true;
    box.append(emptyNote('Something went wrong rendering this page: ' + e.message));
  }

  if (mySeq !== seq) return;
  if (document.getElementById('view') !== view) return;
  switcher.setTiles(buildTiles(), currentKey(location.hash));
  detachToc();
  if (frame) groupSheet(frame.sheet);
  view.innerHTML = '';
  view.append(isTablet ? box : frame.page);
  if (frame) attachToc(frame.sheet, frame.side);
  if (!failed && !status.limited) status.syncedAt = Date.now();
  window.dispatchEvent(new Event('hub:refreshed'));
}

window.addEventListener('data:limit', () => { status.limited = true; });
window.addEventListener('data:auth', () => { data.clearToken(); start(); });
window.addEventListener('hub:forget', () => start());
window.addEventListener('hub:refresh', () => { plugins = null; if (document.getElementById('view')) route(); });
window.addEventListener('hashchange', () => { if (document.getElementById('view')) route(); });

function start() {
  plugins = null;
  if (!data.getToken()) {
    document.title = '-';
    showGate(root, start);
    return;
  }
  if (!getWho()) {
    // First time on this browser: who, then theme, then the same to Spoon.
    document.title = '-';
    showSetup(root, ({ who, palette }) => {
      setWho(who);
      setPalette(palette);
      applyToEmbeddedApps({ token: data.getToken(), who, palette });
      start();
    });
    return;
  }
  buildShell();
  route();
}

export { registry };
import('./views/index.js')
  .then(m => { m.register(); start(); })
  .catch(async e => { console.error(e); if (!(await recover())) root.textContent = ''; });
