// Stale-module recovery. GitHub Pages sends max-age=600, so after a deploy a
// browser can keep running old modules for ten minutes. This re-fetches the
// site's own files with the cache bypassed (which refreshes the HTTP cache)
// and reloads once. Keep FILES in step with the modules: a test checks that
// every entry exists, and a reviewer must add new modules here.

export const FILES = [
  'index.html', 'tokens.css', 'css/hub.css',
  'js/app.js', 'js/data.js', 'js/md.js', 'js/ui.js', 'js/icons.js', 'js/gate.js',
  'js/glyphs.js', 'js/prefs.js', 'js/status.js', 'js/guard.js', 'js/switcher.js', 'js/frame.js',
  'js/routes.js', 'js/countdown.js',
  'js/views/index.js', 'js/views/food.js', 'js/views/home.js', 'js/views/our-house.js',
  'js/views/our-house-project.js', 'js/views/calendar.js', 'js/views/generic.js',
  'js/views/finance.js', 'js/views/fun.js', 'js/views/person.js', 'js/views/chantier.js', 'js/views/security.js',
  'js/views/settings.js',
];

const RECOVERED = 'hubweb:recovered';
const SEEN = 'hubweb:seen';

function url(file) {
  return new URL('../' + file, import.meta.url).href;
}

export async function refreshFiles(fetchImpl = (...a) => fetch(...a)) {
  const out = [];
  for (const f of FILES) {
    const r = await fetchImpl(url(f), { cache: 'reload' });
    if (!r.ok) throw new Error('could not refresh ' + f);
    out.push(await r.text());
  }
  return out;
}

export async function versionOf(texts) {
  const bytes = new TextEncoder().encode(texts.join('\n'));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 7);
}

// True only when it started a reload. One attempt per browser session, so a
// genuinely broken deploy cannot loop.
export async function recover(reload = () => location.reload(), fetchImpl) {
  try {
    if (sessionStorage.getItem(RECOVERED)) return false;
  } catch (e) { return false; }
  try { await refreshFiles(fetchImpl); } catch (e) { return false; }
  try { sessionStorage.setItem(RECOVERED, '1'); } catch (e) { return false; }
  reload();
  return true;
}

// Manual "check for updates". The first check sets a baseline; a later check
// that finds a different version reloads onto the fresh files.
export async function checkForUpdate({ fetchImpl, reload = () => location.reload() } = {}) {
  const version = await versionOf(await refreshFiles(fetchImpl));
  let seen = null;
  try { seen = localStorage.getItem(SEEN); } catch (e) { /* storage blocked */ }
  try { localStorage.setItem(SEEN, version); } catch (e) { /* storage blocked */ }
  const changed = seen !== null && seen !== version;
  if (changed) reload();
  return { changed, version };
}
