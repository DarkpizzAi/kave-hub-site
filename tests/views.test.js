import { test, eq } from './run.js';
import * as data from '../js/data.js';
import finance from '../js/views/finance.js';
import ourHouse from '../js/views/our-house.js';
import chantier from '../js/views/chantier.js';

function allMissing() {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async () => ({ status: 404, headers: { get: () => null }, text: async () => '' }));
}
function done() {
  localStorage.removeItem('ak');
  data.resetMemory();
  data.setFetch((...a) => fetch(...a));
}

test('finance renders without its files', async () => {
  allMissing();
  const box = document.createElement('div');
  await finance(box, []);
  eq(box instanceof HTMLElement, true);
  done();
});

test('our house renders without its files', async () => {
  allMissing();
  const box = document.createElement('div');
  await ourHouse(box);
  eq(box instanceof HTMLElement, true);
  done();
});

test('chantier renders and says infrastructure is missing when it is', async () => {
  allMissing();
  const box = document.createElement('div');
  await chantier(box);
  eq(box.textContent.includes('infrastructure.md is missing'), true);
  done();
});
