import { test, eq } from './run.js';
import { PAGES, APPS, parseHash, redirectFor, hrefFor, shelfOf, pageFor } from '../js/routes.js';

test('six pages on the rail, four behind the scenes, three apps', () => {
  eq(PAGES.filter(p => p.place === 'rail').map(p => p.key), ['home', 'our-house', 'finance', 'hugo', 'food', 'fun']);
  eq(PAGES.filter(p => p.place === 'more').map(p => p.key), ['brand', 'chantier', 'security', 'settings']);
  eq(APPS.map(a => a.label), ['Ladle', 'Compass', 'Stash']);
});

test('only the two layouts: one column, or a shelf (wide + skinny); Brand is the wide recap', () => {
  for (const p of PAGES) eq(['one', 'shelf', 'wide'].includes(p.layout), true, p.key);
});

test('a hash gives the page and the file', () => {
  eq(parseHash(''), { key: 'home', file: null });
  eq(parseHash('#/our-house/our-house/data/plan.md'), { key: 'our-house', file: 'our-house/data/plan.md' });
  eq(hrefFor('food', 'food/data/a b.md'), '#/food/food/data/a%20b.md');
  eq(parseHash(hrefFor('food', 'food/data/a b.md')).file, 'food/data/a b.md');
});

test('old addresses still land', () => {
  eq(redirectFor('#/household'), '#/our-house');
  eq(redirectFor('#/design'), '#/brand');
  eq(redirectFor('#/spoon'), '#/');
  eq(redirectFor('#/our-house'), null);
});

test('a repo path finds the shelf that shows it', () => {
  eq(shelfOf('our-house/data/plan.md'), 'our-house');
  eq(shelfOf('chantier/data/log.md'), 'chantier');
  eq(shelfOf('calendar/data/roadmap.md'), 'chantier');
  eq(shelfOf('docs/superpowers/specs/2026-11-05-x.md'), 'chantier');
  eq(shelfOf('food/data/recipes/pasta.md'), null, 'a subfolder is not on the shelf');
  eq(pageFor('nope'), null);
});
