import { test, eq } from './run.js';
import { nextIndex, buildTiles, currentKey, mountSwitcher } from '../js/switcher.js';

test('arrow keys move by one and by a row and stop at the edges', () => {
  eq(nextIndex(4, 'ArrowRight', 13), 5);
  eq(nextIndex(4, 'ArrowLeft', 13), 3);
  eq(nextIndex(4, 'ArrowDown', 13), 7);
  eq(nextIndex(4, 'ArrowUp', 13), 1);
  eq(nextIndex(0, 'ArrowLeft', 13), 0);
  eq(nextIndex(1, 'ArrowUp', 13), 1);
  eq(nextIndex(12, 'ArrowRight', 13), 12);
  eq(nextIndex(11, 'ArrowDown', 13), 11);
  eq(nextIndex(4, 'x', 13), 4);
});

test('buildTiles follows the route list, pages then apps', () => {
  const t = buildTiles();
  eq(t.map(x => x.key), ['home', 'our-house', 'finance', 'hugo', 'fun', 'brand',
    'chantier', 'security', 'settings', 'spoon', 'calendar', 'stash']);
  eq(t[0].href, '#/');
  eq(t[9].section, 'apps');
  eq(t[10].section, 'apps');
  eq(t[11].section, 'apps');
  eq([t[9].external, t[0].external], [true, false]);
});

test('an app row opens a new tab and shows the app icon, a page row stays in the site', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles(), 'home');
  const tiles = [...bar.querySelectorAll('.app-tile')];
  const compass = tiles.find(a => a.textContent.includes('compass'));
  eq([compass.getAttribute('target'), compass.getAttribute('rel')], ['_blank', 'noopener']);
  eq(compass.querySelector('img.app-icon').getAttribute('src'), 'https://darkpizzai.github.io/kave-calendar-app/icon-192.png');
  eq(tiles[0].hasAttribute('target'), false);
  bar.remove();
});

test('currentKey reads the hash', () => {
  eq(currentKey(''), 'home');
  eq(currentKey('#/'), 'home');
  eq(currentKey('#/calendar'), 'calendar');
  eq(currentKey('#/our-house'), 'our-house');
  eq(currentKey('#/settings'), 'settings');
});

test('the switcher draws one small label per section', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles(), 'home');
  const labels = [...bar.querySelectorAll('.switcher-label')].map(l => l.textContent);
  eq(labels, ['pages', 'apps']);
  eq(bar.querySelectorAll('.app-tile').length, 12);
  bar.remove();
});

test('the mounted switcher opens, marks the current tile and closes on Escape', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles(), 'finance');
  const chip = bar.querySelector('#chip');
  const menu = bar.querySelector('.switcher');
  eq(chip.textContent.includes('finance'), true);
  eq(menu.hidden, true);
  chip.click();
  eq(menu.hidden, false);
  eq(chip.getAttribute('aria-expanded'), 'true');
  eq(menu.querySelector('.app-tile.cur').textContent.includes('finance'), true);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  eq(menu.hidden, true);
  eq(chip.getAttribute('aria-expanded'), 'false');
  bar.remove();
});

test('a click outside closes the switcher', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles(), 'home');
  const chip = bar.querySelector('#chip');
  chip.click();
  document.body.click();
  eq(bar.querySelector('.switcher').hidden, true);
  bar.remove();
});

test('opening a switcher with no tiles does nothing and does not throw', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  mountSwitcher(bar);
  const chip = bar.querySelector('#chip');
  chip.click();
  eq(bar.querySelector('.switcher').hidden, true);
  eq(chip.getAttribute('aria-expanded'), 'false');
  bar.remove();
});
