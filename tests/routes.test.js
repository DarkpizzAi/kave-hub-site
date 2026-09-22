import { test, eq } from './run.js';
import { introLine } from '../js/frame.js';
import { PAGES, SECTIONS, redirectFor, keyFor, introFor } from '../js/routes.js';

test('pages come in the agreed order and sections', () => {
  eq(PAGES.filter(p => p.section === 'pages').map(p => p.label),
    ['home page', 'our house', 'finance', 'hugo', 'fun', 'brand', 'chantier', 'security', 'settings']);
  eq(PAGES.filter(p => p.section === 'apps').map(p => p.label), ['spoon', 'calendar']);
  eq(SECTIONS, ['pages', 'apps']);
});

test('every key is unique and every href matches its key', () => {
  const keys = PAGES.map(p => p.key);
  eq(new Set(keys).size, keys.length);
  for (const p of PAGES) eq(p.href, p.key === 'home' ? '#/' : '#/' + p.key, p.key);
});

test('old routes redirect to the new ones', () => {
  eq(redirectFor('#/household'), '#/our-house');
  eq(redirectFor('#/house'), '#/our-house');
  eq(redirectFor('#/money'), '#/finance');
  eq(redirectFor('#/design'), '#/brand');
  eq(redirectFor('#/food'), '#/spoon');
  eq(redirectFor('#/isa'), '#/');
  eq(redirectFor('#/infrastructure'), '#/chantier');
  eq(redirectFor('#/household/infrastructure'), '#/chantier');
});

test('new routes and the home page do not redirect', () => {
  for (const h of ['', '#/', '#/calendar', '#/our-house', '#/finance', '#/hugo', '#/fun',
    '#/brand', '#/chantier', '#/security', '#/settings', '#/spoon']) eq(redirectFor(h), null, h);
});

test('keyFor reads the first segment and defaults to home', () => {
  eq(keyFor(''), 'home');
  eq(keyFor('#/'), 'home');
  eq(keyFor('#/finance/anything'), 'finance');
});

test('intros: none for home page, settings and spoon, none mention the new flat, no long dashes', () => {
  eq(introFor('home'), null);
  eq(introFor('settings'), null);
  eq(introFor('spoon'), null);
  eq(introFor('calendar'), null);
  for (const p of PAGES) {
    if (!p.intro) continue;
    eq(/new flat/i.test(p.intro), false, p.key);
    eq(/[\u2013\u2014]/.test(p.intro), false, p.key);
  }
  eq(introFor('our-house').length > 0, true);
  eq(introFor('security').includes('masked'), true);
});

test('introLine builds a paragraph for a page with an intro and nothing otherwise', () => {
  const p = introLine('finance');
  eq(p.tagName.toLowerCase(), 'p');
  eq(p.className, 'page-intro');
  eq(p.textContent, 'Shared budget and bills.');
  eq(introLine('home'), null);
  eq(introLine('spoon'), null);
  eq(introLine('calendar'), null);
});
