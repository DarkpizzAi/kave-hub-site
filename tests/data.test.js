import { test, eq } from './run.js';
import * as data from '../js/data.js';

function fakeFetch(handler) {
  const calls = [];
  data.setFetch(async (url, opts) => {
    calls.push({ url, headers: opts.headers });
    return handler(url, opts, calls.length);
  });
  return calls;
}
const res = (status, body = '', etag = null) => ({
  status,
  headers: { get: k => (k.toLowerCase() === 'etag' ? etag : null) },
  text: async () => body,
});
function fresh() {
  localStorage.removeItem('ak');
  const keys = Object.keys(sessionStorage).filter(k => k.startsWith('hubweb:c:'));
  keys.forEach(k => sessionStorage.removeItem(k));
  data.resetMemory();
}

test('apiUrl strips the leading slash and keeps dot folders', () => {
  eq(data.apiUrl('/.claude-plugin/marketplace.json'),
    'https://api.github.com/repos/DarkpizzAi/kave-hub/contents/.claude-plugin/marketplace.json?ref=main');
});

test('apiUrl encodes each path segment', () => {
  eq(data.apiUrl('food/data/a b.md').includes('a%20b.md'), true);
});

test('no token means null and no request', async () => {
  fresh();
  const calls = fakeFetch(() => res(200, 'x'));
  eq(await data.text('/a.md'), null);
  eq(calls.length, 0);
});

test('200 returns the body and sends token and raw accept', async () => {
  fresh(); data.setToken('t0k');
  const calls = fakeFetch(() => res(200, '# hi', '"e1"'));
  eq(await data.text('/a.md'), '# hi');
  eq(calls[0].headers.Authorization, 'Bearer t0k');
  eq(calls[0].headers.Accept, 'application/vnd.github.raw+json');
});

test('second read in one load is served from memory', async () => {
  fresh(); data.setToken('t0k');
  const calls = fakeFetch(() => res(200, 'body', '"e1"'));
  await data.text('/a.md');
  await data.text('/a.md');
  eq(calls.length, 1);
});

test('after a reload a 304 reuses the stored body', async () => {
  fresh(); data.setToken('t0k');
  let calls = fakeFetch(() => res(200, 'body', '"e1"'));
  await data.text('/a.md');
  data.resetMemory();
  calls = fakeFetch((u, o) => (o.headers['If-None-Match'] === '"e1"' ? res(304) : res(200, 'WRONG')));
  eq(await data.text('/a.md'), 'body');
  eq(calls[0].headers['If-None-Match'], '"e1"');
});

test('404 is a quiet null with no event', async () => {
  fresh(); data.setToken('t0k');
  let fired = 0;
  const on = () => fired++;
  window.addEventListener('data:auth', on);
  window.addEventListener('data:limit', on);
  fakeFetch(() => res(404));
  eq(await data.text('/missing.md'), null);
  window.removeEventListener('data:auth', on);
  window.removeEventListener('data:limit', on);
  eq(fired, 0);
});

test('401 returns null and fires data:auth', async () => {
  fresh(); data.setToken('bad');
  let fired = 0;
  const on = () => fired++;
  window.addEventListener('data:auth', on);
  fakeFetch(() => res(401));
  eq(await data.text('/a.md'), null);
  window.removeEventListener('data:auth', on);
  eq(fired, 1);
});

test('403 returns null and fires data:limit', async () => {
  fresh(); data.setToken('t0k');
  let fired = 0;
  const on = () => fired++;
  window.addEventListener('data:limit', on);
  fakeFetch(() => res(403));
  eq(await data.text('/a.md'), null);
  window.removeEventListener('data:limit', on);
  eq(fired, 1);
});

test('json parses and returns null on bad json', async () => {
  fresh(); data.setToken('t0k');
  fakeFetch(u => (u.includes('good') ? res(200, '{"a":1}') : res(200, '{oops')));
  eq(await data.json('/good.json'), { a: 1 });
  eq(await data.json('/bad.json'), null);
});

test('listDir returns file names only', async () => {
  fresh(); data.setToken('t0k');
  fakeFetch(() => res(200, JSON.stringify([
    { name: 'a.md', type: 'file' }, { name: 'sub', type: 'dir' }, { name: 'b.md', type: 'file' }])));
  eq(await data.listDir('household/data'), ['a.md', 'b.md']);
});

test('verifyToken is true on 200 and false on 401', async () => {
  fresh();
  fakeFetch(() => res(200, '{}'));
  eq(await data.verifyToken('good'), true);
  fakeFetch(() => res(401));
  eq(await data.verifyToken('bad'), false);
});

test('verifyToken does not store the token by itself', async () => {
  fresh();
  fakeFetch(() => res(200, '{}'));
  await data.verifyToken('good');
  eq(data.getToken(), '');
});

test('clearToken empties token and caches', async () => {
  fresh(); data.setToken('t0k');
  fakeFetch(() => res(200, 'body', '"e1"'));
  await data.text('/a.md');
  data.clearToken();
  eq(data.getToken(), '');
  eq(Object.keys(sessionStorage).filter(k => k.startsWith('hubweb:c:')).length, 0);
});

test('clearToken leaves other apps storage alone', async () => {
  fresh();
  localStorage.setItem('other.key', '1');
  sessionStorage.setItem('other.key', '2');
  data.setToken('t0k');
  fakeFetch(() => res(200, 'body', '"e1"'));
  await data.text('/a.md');
  data.clearToken();
  eq(localStorage.getItem('other.key'), '1');
  eq(sessionStorage.getItem('other.key'), '2');
  localStorage.removeItem('other.key');
  sessionStorage.removeItem('other.key');
});

test('parseDate reads ISO and day-first dates', () => {
  eq(data.parseDate('2026-09-20').getMonth(), 8);
  eq(data.parseDate('20/09/2026').getFullYear(), 2026);
});
