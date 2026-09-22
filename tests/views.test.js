import { test, eq } from './run.js';
import * as data from '../js/data.js';
import finance from '../js/views/finance.js';
import ourHouse from '../js/views/our-house.js';
import chantier from '../js/views/chantier.js';
import home from '../js/views/home.js';
import calendar from '../js/views/calendar.js';
import brand from '../js/views/brand.js';

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
  eq(box.textContent.includes('Compass (finance app): coming soon'), true);
  done();
});

test('brand renders household-look.md live, themes included', async () => {
  const look = ['# The household look', '', 'One look, everywhere.', '', '## Type',
    'Rubik, eight steps.', '', '## Colour', 'Shared neutrals, then themes.',
    '| Theme | |', '|---|---|', '| Cobalt | the default |', '| Amber | |', '| Chartreuse | |'].join('\n') + '\n';
  withFiles({ 'brand/data/household-look.md': look });
  const box = document.createElement('div');
  await brand(box);
  eq(box.textContent.includes('Cobalt, Amber, Chartreuse'), true);
  eq(box.textContent.includes('Rubik, eight steps'), true);
  eq(box.textContent.includes('Shared neutrals, then themes'), true);
  done();
});

test('our house shows plant cards and a home-setup section from real files', async () => {
  const plants = ['# Plants', '', '| Plant | Where | Count |', '|---|---|---|',
    '| Cactus | Indoor | 2 |', '| Olive tree | Outside | 1 |'].join('\n') + '\n';
  const setup = ['# Home setup', '', '## Router', 'Lives in the hallway.'].join('\n') + '\n';
  withFiles({ 'our-house/data/plants.md': plants, 'our-house/data/home-setup.md': setup });
  const box = document.createElement('div');
  await ourHouse(box);
  eq(box.textContent.includes('Cactus'), true);
  eq(box.textContent.includes('Olive tree'), true);
  eq(box.textContent.includes('Router'), true);
  done();
});

test('our house new-flat section links to the move-in budget and lists to-dos', async () => {
  const plan = ['# House plan', '', '## Key facts', '- Delivery date: 27/09/2027.',
    '- Move-in date: 30/09/2027 09:00 (Madrid time).', '', '## Envelope', '- Overall envelope: 20000 EUR'].join('\n') + '\n';
  const todo = ['# Our house to-do', '', '## Before', '- [ ] 2026-01-01 added: make the budget',
    '', '## Upon move-in', '- [ ] 2026-01-01 added: hire an inspector'].join('\n') + '\n';
  withFiles({ 'our-house/data/plan.md': plan, 'our-house/data/todo.md': todo });
  const box = document.createElement('div');
  await ourHouse(box);
  eq(box.textContent.includes('until we move in'), true);
  eq(box.textContent.includes('Move-in budget'), true);
  eq(box.textContent.includes('make the budget'), true);
  eq(box.textContent.includes('hire an inspector'), true);
  eq(box.textContent.includes('Compass (finance app): coming soon'), true);
  eq(box.textContent.includes('20000 EUR'), true);
  done();
});

test('our house interior design shows styles and colour swatches', async () => {
  const interior = ['# Interior design ideas', '', '## Styles', '- Mid-century', '- Art pop',
    '', '## Palettes', '', '### Blue, orange, cream and yellow', '- #2f5d8a', '- #e8792f'].join('\n') + '\n';
  withFiles({ 'our-house/data/interior-design.md': interior });
  const box = document.createElement('div');
  await ourHouse(box);
  eq(box.textContent.includes('Mid-century'), true);
  eq(box.textContent.includes('Art pop'), true);
  eq(box.textContent.includes('mood board coming soon'), true);
  eq(box.textContent.includes('Blue, orange, cream and yellow'), true);
  eq(box.querySelectorAll('.palette-swatch').length, 2);
  done();
});

test('calendar is a blank tablet saying Compass is coming', async () => {
  const box = document.createElement('div');
  await calendar(box);
  eq(box.classList.contains('tablet-page'), true);
  eq(box.querySelector('.tablet') !== null, true);
  eq(box.querySelector('iframe'), null);
  eq(box.textContent.includes('Compass app coming soon'), true);
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
  eq(box.querySelector('.tab-section-title').textContent, 'Countdown until we move in');
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
