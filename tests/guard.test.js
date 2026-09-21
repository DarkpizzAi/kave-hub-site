import { test, eq } from './run.js';
import { FILES, refreshFiles, versionOf, recover, checkForUpdate } from '../js/guard.js';

function fakeFetch(calls, bodyFor = f => 'body:' + f) {
  return async (url, opts) => {
    calls.push({ url: String(url), cache: opts && opts.cache });
    const f = String(url).replace(/^.*\/(?=[^/]+$)/, '');
    return { ok: true, status: 200, text: async () => bodyFor(f) };
  };
}
function clean() {
  sessionStorage.removeItem('hubweb:recovered');
  localStorage.removeItem('hubweb:seen');
}

test('FILES lists the entry files and every module of the site', () => {
  for (const f of ['index.html', 'tokens.css', 'css/hub.css', 'js/app.js', 'js/guard.js',
    'js/switcher.js', 'js/frame.js', 'js/glyphs.js', 'js/prefs.js', 'js/status.js',
    'js/ui.js', 'js/data.js', 'js/md.js', 'js/gate.js', 'js/icons.js', 'js/views/index.js',
    'js/views/food.js', 'js/views/settings.js']) {
    eq(FILES.includes(f), true, f);
  }
});

test('every file in FILES exists on the server', async () => {
  for (const f of FILES) {
    const r = await fetch('../' + f, { cache: 'no-store' });
    eq(r.ok, true, f);
  }
});

test('refreshFiles fetches every file with cache reload', async () => {
  const calls = [];
  const texts = await refreshFiles(fakeFetch(calls));
  eq(calls.length, FILES.length);
  eq(calls.every(c => c.cache === 'reload'), true);
  eq(texts.length, FILES.length);
});

test('refreshFiles throws when a file is not ok', async () => {
  let threw = false;
  try { await refreshFiles(async () => ({ ok: false, status: 404, text: async () => '' })); }
  catch (e) { threw = true; }
  eq(threw, true);
});

test('versionOf is 7 hex characters and changes with the content', async () => {
  const a = await versionOf(['a', 'b']);
  const b = await versionOf(['a', 'c']);
  eq(/^[0-9a-f]{7}$/.test(a), true);
  eq(a !== b, true);
});

test('recover reloads once per session and refuses a second time', async () => {
  clean();
  let reloads = 0;
  const calls = [];
  eq(await recover(() => { reloads++; }, fakeFetch(calls)), true);
  eq(reloads, 1);
  eq(await recover(() => { reloads++; }, fakeFetch(calls)), false);
  eq(reloads, 1);
  clean();
});

test('recover does not reload if the refresh fails', async () => {
  clean();
  let reloads = 0;
  const ok = await recover(() => { reloads++; }, async () => { throw new Error('offline'); });
  eq(ok, false);
  eq(reloads, 0);
  eq(sessionStorage.getItem('hubweb:recovered'), null);
  clean();
});

test('checkForUpdate sets the baseline first, then reloads only when the version changes', async () => {
  clean();
  let reloads = 0;
  const reload = () => { reloads++; };
  const calls = [];
  const first = await checkForUpdate({ fetchImpl: fakeFetch(calls), reload });
  eq(first.changed, false);
  const same = await checkForUpdate({ fetchImpl: fakeFetch(calls), reload });
  eq(same.changed, false);
  eq(reloads, 0);
  const changed = await checkForUpdate({ fetchImpl: fakeFetch(calls, f => 'new:' + f), reload });
  eq(changed.changed, true);
  eq(reloads, 1);
  clean();
});
