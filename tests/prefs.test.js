import { test, eq } from './run.js';
import { PALETTES, getPalette, setPalette, applyPalette, getWho, setWho } from '../js/prefs.js';

function clean() {
  localStorage.removeItem('hubweb:palette');
  localStorage.removeItem('hubweb:who');
  delete document.documentElement.dataset.palette;
}

test('palette defaults to cobalt and sets no attribute', () => {
  clean();
  eq(getPalette(), 'cobalt');
  applyPalette();
  eq(document.documentElement.dataset.palette, undefined);
});

test('setPalette stores a valid palette and applies it', () => {
  clean();
  eq(setPalette('amber'), true);
  eq(getPalette(), 'amber');
  eq(document.documentElement.dataset.palette, 'amber');
  clean();
});

test('setPalette back to cobalt removes the attribute', () => {
  clean();
  setPalette('chartreuse');
  setPalette('cobalt');
  eq(document.documentElement.dataset.palette, undefined);
  clean();
});

test('an invalid palette is refused and nothing changes', () => {
  clean();
  eq(setPalette('nonsense'), false);
  eq(getPalette(), 'cobalt');
  clean();
});

test('a corrupt stored palette reads as cobalt', () => {
  clean();
  localStorage.setItem('hubweb:palette', 'nonsense');
  eq(getPalette(), 'cobalt');
  clean();
});

test('who is null until set, then a valid route key', () => {
  clean();
  eq(getWho(), null);
  eq(setWho('isa'), true);
  eq(getWho(), 'isa');
  eq(setWho('someone'), false);
  eq(getWho(), 'isa');
  clean();
});

test('the three palettes are the household set', () => {
  eq(PALETTES, ['cobalt', 'amber', 'chartreuse']);
});
