import { test, eq } from './run.js';
import * as data from '../js/data.js';
import { describeStatus, ago } from '../js/status.js';

test('dropCache removes cached responses but keeps the token', () => {
  const before = localStorage.getItem('ak');
  localStorage.setItem('ak', 'kept');
  sessionStorage.setItem('hubweb:c:probe', '{}');
  data.dropCache();
  eq(sessionStorage.getItem('hubweb:c:probe'), null);
  eq(localStorage.getItem('ak'), 'kept');
  if (before === null) localStorage.removeItem('ak'); else localStorage.setItem('ak', before);
});

test('dropCache leaves keys that are not this cache alone', () => {
  sessionStorage.setItem('hubweb:adv', '1');
  data.dropCache();
  eq(sessionStorage.getItem('hubweb:adv'), '1');
  sessionStorage.removeItem('hubweb:adv');
});

test('ago words', () => {
  const now = 10 * 60 * 60 * 1000;
  eq(ago(now - 20 * 1000, now), 'just now');
  eq(ago(now - 60 * 1000, now), '1 minute ago');
  eq(ago(now - 5 * 60 * 1000, now), '5 minutes ago');
  eq(ago(now - 60 * 60 * 1000, now), '1 hour ago');
  eq(ago(now - 3 * 60 * 60 * 1000, now), '3 hours ago');
});

test('describeStatus connected with a last synced time', () => {
  const now = 1000000;
  eq(describeStatus({ limited: false, syncedAt: now - 5 * 60 * 1000 }, now),
    [['ok', 'Connected'], ['muted', 'Last synced 5 minutes ago']]);
});

test('describeStatus never synced', () => {
  eq(describeStatus({ limited: false, syncedAt: null }, 5),
    [['ok', 'Connected'], ['muted', 'Not synced yet']]);
});

test('describeStatus rate limited', () => {
  eq(describeStatus({ limited: true, syncedAt: null }, 5)[0],
    ['warn', 'GitHub is busy, try again later']);
});
