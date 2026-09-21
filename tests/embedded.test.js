import { test, eq } from './run.js';
import { mergeSettings, clearTokenIn, applyToEmbeddedApps, forgetInEmbeddedApps } from '../js/embedded.js';

const KEY = 'foodapp.settings';

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
  return { querySelectorAll: () => [frame('https://h.github.io/kave-food-app/', 'spoon'), frame('https://h.github.io/other/', 'other')] };
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

test('applyToEmbeddedApps writes spoon settings and reloads only spoon frame', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify({ theme: 'system', palette: 'cobalt', who: '', token: '' }) });
  const reloaded = [];
  const res = applyToEmbeddedApps({ token: 'T', who: 'isa', palette: 'amber' }, { storage: st, doc: fakeDoc(reloaded) });
  eq(res, [{ name: 'spoon', ok: true }]);
  eq(JSON.parse(st.dump(KEY)), { theme: 'system', palette: 'amber', who: 'isa', token: 'T' });
  eq(reloaded, ['spoon']);
});

test('applyToEmbeddedApps reports a storage failure instead of throwing', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('blocked'); } };
  const res = applyToEmbeddedApps({ token: 'T', who: 'isa', palette: 'amber' }, { storage: st, doc: fakeDoc([]) });
  eq(res, [{ name: 'spoon', ok: false }]);
});

test('forgetInEmbeddedApps blanks the token in spoon and reloads its frame', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify({ token: 'secret', who: 'isa', palette: 'amber' }) });
  const reloaded = [];
  forgetInEmbeddedApps({ storage: st, doc: fakeDoc(reloaded) });
  eq(JSON.parse(st.dump(KEY)), { token: '', who: 'isa', palette: 'amber' });
  eq(reloaded, ['spoon']);
});
