import { test, eq } from './run.js';
import { card, header } from '../js/ui.js';

test('card renders a titled section with the white card inside', () => {
  const c = card('Care');
  eq(c.tagName.toLowerCase(), 'section');
  eq(c.className, 'tab-section');
  eq(c.querySelector('.tab-section-title').textContent, 'Care');
  eq(c.querySelector('.card') !== null, true);
});

test('append on a card lands inside the white card', () => {
  const c = card('Care');
  const p = document.createElement('p');
  c.append(p);
  eq(p.parentElement.className, 'card');
});

test('appendChild on a card lands inside the white card', () => {
  const c = card('Care');
  const p = document.createElement('p');
  c.appendChild(p);
  eq(p.parentElement.className, 'card');
});

test('children passed to card() land inside the white card', () => {
  const p = document.createElement('p');
  const c = card('Care', p);
  eq(p.parentElement.className, 'card');
});

test('a card with no title has no title row and no id', () => {
  const c = card('');
  eq(c.querySelector('.tab-section-head'), null);
  eq(c.id, '');
});

test('two cards with the same title get different ids', () => {
  const a = card('Same');
  const b = card('Same');
  eq(a.id !== b.id, true);
  eq(a.id.length > 0, true);
});

test('header renders nothing', () => {
  const h = header('Title', 'Sub');
  eq(h.childNodes.length, 0);
});

test('querySelector h3 on a card finds the title (house view shim)', () => {
  const c = card('Care');
  eq(c.querySelector('h3').textContent, 'Care');
});
