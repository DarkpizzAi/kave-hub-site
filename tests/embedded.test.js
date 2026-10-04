import { test, eq } from './run.js';
import { EMBEDDED, mergeSettings, clearTokenIn, applyToEmbeddedApps, forgetInEmbeddedApps } from '../js/embedded.js';

const KEY = 'foodapp.settings';
const CKEY = 'compass.settings';
const SKEY = 'stash.settings';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, v); },
    dump: k => m.get(k),
  };
}

function fakeDoc(reloaded) {
  const frame = (src, name) => ({ src, contentWindow: { location: { reload() { reloaded.push(name); } } } });
  return { querySelectorAll: () => [frame('https://h.github.io/kave-food-app/', 'spoon'), frame('https://h.github.io/kave-calendar-app/', 'compass'),
    frame('https://h.github.io/kave-finance-app/', 'stash'), frame('https://h.github.io/other/', 'other')] };
}

test('mergeSettings sets token, who and palette and keeps every other field', () => {
  const before = JSON.stringify({ token: 'old', who: '', theme: 'system', palette: 'cobalt', extra: 1 });
  const out = JSON.parse(mergeSettings(before, { token: 'NEW', who: 'isa', palette: 'amber' }));
  eq(out, { token: 'NEW', who: 'isa', theme: 'system', palette: 'amber', extra: 1 });
});

test('mergeSettings starts fresh from missing or broken text', () => {
  for (const bad of [null, '', 'not json', '[1,2]', '"x"']) {
    eq(JSON.parse(mergeSettings(bad, { token: 't', who: 'hugo', palette: 'cobalt' })),
      { token: 't', who: 'hugo', palette: 'cobalt' }, String(bad));
  }
});

test('clearTokenIn blanks only the token', () => {
  const out = JSON.parse(clearTokenIn(JSON.stringify({ token: 'secret', who: 'isa', palette: 'amber' })));
  eq(out, { token: '', who: 'isa', palette: 'amber' });
  eq(JSON.parse(clearTokenIn(null)), { token: '' });
});

test('applyToEmbeddedApps writes spoon and compass settings and reloads only their frames', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify({ theme: 'system', palette: 'cobalt', who: '', token: '' }),
    [CKEY]: JSON.stringify({ token: '', palette: 'cobalt', defaultView: 'monthly' }),
    [SKEY]: JSON.stringify({ token: '', palette: 'cobalt', scope: 'household' }) });
  const reloaded = [];
  const res = applyToEmbeddedApps({ token: 'T', who: 'isa', palette: 'amber' }, { storage: st, doc: fakeDoc(reloaded) });
  eq(res, [{ name: 'spoon', ok: true }, { name: 'compass', ok: true }, { name: 'stash', ok: true }]);
  eq(JSON.parse(st.dump(KEY)), { theme: 'system', palette: 'amber', who: 'isa', token: 'T' });
  // Compass calls the person "me", and keeps its own other settings
  eq(JSON.parse(st.dump(CKEY)), { token: 'T', palette: 'amber', defaultView: 'monthly', me: 'isa' });
  // Stash also calls the person "me", and keeps its own other settings
  eq(JSON.parse(st.dump(SKEY)), { token: 'T', palette: 'amber', scope: 'household', me: 'isa' });
  eq(reloaded, ['spoon', 'compass', 'stash']);
});

test('applyToEmbeddedApps reports a storage failure instead of throwing', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('blocked'); } };
  const res = applyToEmbeddedApps({ token: 'T', who: 'isa', palette: 'amber' }, { storage: st, doc: fakeDoc([]) });
  eq(res, [{ name: 'spoon', ok: false }, { name: 'compass', ok: false }, { name: 'stash', ok: false }]);
});

test('forgetInEmbeddedApps blanks the token in both apps and reloads their frames', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify({ token: 'secret', who: 'isa', palette: 'amber' }),
    [CKEY]: JSON.stringify({ token: 'secret', me: 'isa', palette: 'amber' }),
    [SKEY]: JSON.stringify({ token: 'secret', me: 'isa', palette: 'amber' }) });
  const reloaded = [];
  forgetInEmbeddedApps({ storage: st, doc: fakeDoc(reloaded) });
  eq(JSON.parse(st.dump(KEY)), { token: '', who: 'isa', palette: 'amber' });
  eq(JSON.parse(st.dump(CKEY)), { token: '', me: 'isa', palette: 'amber' });
  eq(JSON.parse(st.dump(SKEY)), { token: '', me: 'isa', palette: 'amber' });
  eq(reloaded, ['spoon', 'compass', 'stash']);
});

test('EMBEDDED lists stash with its storage key, frame address and who field', () => {
  eq(EMBEDDED.find(a => a.name === 'stash'),
    { name: 'stash', key: 'stash.settings', frameMatch: '/kave-finance-app/', who: 'me' });
});

test("index.html's CSP frame-src allows the frame of every embedded app", async () => {
  const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/)[1];
  const frameSrc = csp.split(';').map(d => d.trim()).find(d => d.startsWith('frame-src ')).split(/\s+/).slice(1);
  for (const app of EMBEDDED) eq(frameSrc.includes('https://darkpizzai.github.io' + app.frameMatch), true, app.name);
});
