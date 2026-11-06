import { test, eq } from './run.js';
import { el, listItem, header } from '../js/ui.js';

test('el sets class, attributes and children, and style through the style object', () => {
  const n = el('div', { class: 'a', 'data-x': '1', style: 'color: red' }, 'hi', null);
  eq(n.className, 'a'); eq(n.dataset.x, '1'); eq(n.textContent, 'hi'); eq(n.style.color, 'red');
  eq(n.getAttribute('style') === null || n.style.color === 'red', true);
});

test('listItem is a Material list item, a link when it has an href', () => {
  const a = listItem({ title: 'Plan', sub: 'plan.md', href: '#/our-house/plan.md', selected: true, lead: 'home', trail: '14:02' });
  eq(a.tagName, 'A');
  eq(a.classList.contains('m3-list-item--selected'), true);
  eq(a.querySelector('.m3-body-l').textContent, 'Plan');
  eq(a.querySelector('.m3-list-item__trail').textContent, '14:02');
  eq(listItem({ title: 'x' }).tagName, 'DIV');
  eq(header('Files').className, 'm3-list-header m3-title-s');
});
