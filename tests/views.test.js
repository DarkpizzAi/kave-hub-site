import { test, eq } from './run.js';
import * as data from '../js/data.js';
import finance from '../js/views/finance.js';
import ourHouse from '../js/views/our-house.js';
import chantier from '../js/views/chantier.js';
import home from '../js/views/home.js';

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

function withFiles(files) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async url => {
    for (const [needle, text] of Object.entries(files)) {
      if (url.includes(needle)) return { status: 200, headers: { get: () => null }, text: async () => text };
    }
    return { status: 404, headers: { get: () => null }, text: async () => '' };
  });
}

test('finance shows the safe-to-spend figure and a bill from real files', async () => {
  const budget = ['# Budget', '', '## Monthly targets',
    '| Line | EUR |', '|---|---|', '| Income | 3000 |', '| Savings | 500 |', '| Rent | 1200 |'].join('\n') + '\n';
  const bills = ['# Recurring bills', '', '## Bills',
    '| Name | Day | Amount | Notes |', '|---|---|---|---|', '| Internet | 5 | 40 | fibre |'].join('\n') + '\n';
  withFiles({ 'finance/data/budget.md': budget, 'finance/data/recurring-bills.md': bills });
  const box = document.createElement('div');
  await finance(box);
  eq(box.textContent.includes('Safe to spend'), true);
  eq(box.textContent.includes('Internet'), true);
  done();
});

test('our house shows a plant and a home-setup section from real files', async () => {
  const plants = ['# Plants', '', '## Ficus', 'Water weekly.'].join('\n') + '\n';
  const setup = ['# Home setup', '', '## Router', 'Lives in the hallway.'].join('\n') + '\n';
  withFiles({ 'our-house/data/plants.md': plants, 'our-house/data/home-setup.md': setup });
  const box = document.createElement('div');
  await ourHouse(box);
  eq(box.textContent.includes('Ficus'), true);
  eq(box.textContent.includes('Router'), true);
  done();
});

test('chantier renders and says infrastructure is missing when it is', async () => {
  allMissing();
  const box = document.createElement('div');
  await chantier(box);
  eq(box.textContent.includes('infrastructure.md is missing'), true);
  done();
});

function withPlan(keyFactsLine) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  const md = ['# House plan', '', '## Key facts', '- Delivery date: 27/09/2027 (under construction).',
    keyFactsLine].join('\n') + '\n';
  data.setFetch(async url => (url.includes('our-house/data/plan.md')
    ? { status: 200, headers: { get: () => null }, text: async () => md }
    : { status: 404, headers: { get: () => null }, text: async () => '' }));
}

test('home shows the four clock units and the date when the plan has a move-in line', async () => {
  withPlan('- Move-in date: 30/09/2027 09:00 (Madrid time).');
  const box = document.createElement('div');
  await home(box);
  eq(box.querySelectorAll('.clock-num').length, 4);
  eq(box.querySelector('.clock-when'), null);
  eq(box.querySelector('.tab-section-title').textContent, 'until we move in');
  eq(/^\d+$/.test(box.querySelector('.clock-num').textContent), true);
  eq(/^\d\d$/.test(box.querySelectorAll('.clock-num')[3].textContent), true);
  eq(box.querySelector('.clock').hidden, false);
  eq(box.querySelector('.clock-done').hidden, true);
  done();
});

test('home says so when the plan has no move-in line', async () => {
  withPlan('');
  const box = document.createElement('div');
  await home(box);
  eq(box.querySelectorAll('.clock-num').length, 0);
  eq(box.textContent.includes('No move-in date set yet'), true);
  done();
});

test('home switches to the finished state once the date has passed', async () => {
  withPlan('- Move-in date: 01/01/2020 09:00');
  const box = document.createElement('div');
  await home(box);
  eq(box.querySelector('.clock').hidden, true);
  eq(box.querySelector('.clock-done').hidden, false);
  eq(box.querySelector('.clock-done').textContent, "We're in.");
  done();
});
