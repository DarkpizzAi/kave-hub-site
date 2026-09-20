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

test('buildTiles puts home first, infrastructure after household, settings last', () => {
  const t = buildTiles([{ name: 'food' }, { name: 'household' }, { name: 'calendar' }]);
  eq(t.map(x => x.key), ['home', 'food', 'household', 'infrastructure', 'calendar', 'settings']);
  eq(t[0].href, '#/');
  eq(t[3].href, '#/household/infrastructure');
  eq(t[5].href, '#/settings');
});

test('a plugin the icon map does not know still gets a tile', () => {
  const t = buildTiles([{ name: 'brand-new-plugin' }]);
  eq(t.some(x => x.key === 'brand-new-plugin'), true);
});

test('currentKey reads the hash', () => {
  eq(currentKey(''), 'home');
  eq(currentKey('#/'), 'home');
  eq(currentKey('#/calendar'), 'calendar');
  eq(currentKey('#/household'), 'household');
  eq(currentKey('#/household/infrastructure'), 'infrastructure');
  eq(currentKey('#/settings'), 'settings');
});

test('the mounted switcher opens, marks the current tile and closes on Escape', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles([{ name: 'food' }, { name: 'calendar' }]), 'calendar');
  const chip = bar.querySelector('#chip');
  const menu = bar.querySelector('.switcher');
  eq(chip.textContent.includes('calendar'), true);
  eq(menu.hidden, true);
  chip.click();
  eq(menu.hidden, false);
  eq(chip.getAttribute('aria-expanded'), 'true');
  eq(menu.querySelector('.app-tile.cur').textContent.includes('calendar'), true);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  eq(menu.hidden, true);
  eq(chip.getAttribute('aria-expanded'), 'false');
  bar.remove();
});

test('a click outside closes the switcher', () => {
  const bar = document.createElement('header');
  document.body.append(bar);
  const sw = mountSwitcher(bar);
  sw.setTiles(buildTiles([]), 'home');
  const chip = bar.querySelector('#chip');
  chip.click();
  document.body.click();
  eq(bar.querySelector('.switcher').hidden, true);
  bar.remove();
});
