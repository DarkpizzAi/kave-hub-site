import { test, eq } from './run.js';
import { card, header, popup } from '../js/ui.js';

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

test('the card title span is queryable by class', () => {
  const c = card('Care');
  eq(c.querySelector('.tab-section-title').textContent, 'Care');
});

test('popup opens into the document with its title and children, closed by default', () => {
  const p = popup('My title', document.createElement('p'));
  eq(document.body.contains(p), false);
  p.open();
  eq(document.body.contains(p), true);
  eq(p.hidden, false);
  eq(p.querySelector('.popup-title').textContent, 'My title');
  eq(p.querySelectorAll('.popup-body > p').length, 1);
  p.close();
});

test('popup.close removes it from the document', () => {
  const p = popup('T', document.createElement('p'));
  p.open();
  p.close();
  eq(document.body.contains(p), false);
  eq(p.hidden, true);
});

test('the close button closes the popup', () => {
  const p = popup('T', document.createElement('p'));
  p.open();
  p.querySelector('.popup-close').click();
  eq(document.body.contains(p), false);
});

test('clicking the backdrop closes the popup, clicking the panel does not', () => {
  const p = popup('T', document.createElement('p'));
  p.open();
  p.querySelector('.popup-panel').click();
  eq(document.body.contains(p), true);
  p.click();
  eq(document.body.contains(p), false);
});

test('Escape closes the popup', () => {
  const p = popup('T', document.createElement('p'));
  p.open();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  eq(document.body.contains(p), false);
});
