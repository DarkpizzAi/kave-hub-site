import { test, eq } from './run.js';
import { card } from '../js/ui.js';
import { tocEntries, shouldShowToc, sideCard, figuresCard, topicsCard, linksCard } from '../js/frame.js';

test('tocEntries lists titled sections in order and skips untitled ones', () => {
  const root = document.createElement('div');
  root.append(card('One'), card('Two'), card(''));
  eq(tocEntries(root).map(e => e.title), ['One', 'Two']);
});

test('shouldShowToc needs two entries and more than two screens', () => {
  eq(shouldShowToc(1, 5000, 900), false);
  eq(shouldShowToc(2, 1800, 900), false);
  eq(shouldShowToc(2, 1801, 900), true);
  eq(shouldShowToc(0, 9999, 900), false);
});

test('sideCard has a label and its children', () => {
  const c = sideCard('Label', document.createElement('i'));
  eq(c.className, 'side-card');
  eq(c.querySelector('.side-label').textContent, 'Label');
  eq(c.querySelectorAll('i').length, 1);
});

test('figuresCard makes one tile per item', () => {
  const c = figuresCard('Key figures', [{ value: 4, caption: 'Open' }, { value: 2, caption: 'Due soon' }]);
  eq(c.querySelectorAll('.fig').length, 2);
  eq(c.querySelector('.fig-value').textContent, '4');
  eq(c.querySelector('.fig-caption').textContent, 'Open');
});

test('topicsCard makes a row with a dot per item', () => {
  const c = topicsCard('Open topics', [{ title: 'First', note: 'Soon' }]);
  eq(c.querySelectorAll('.topic').length, 1);
  eq(c.querySelector('.topic-title').textContent, 'First');
  eq(c.querySelector('.topic-note').textContent, 'Soon');
});

test('linksCard makes external links that do not leak the referrer or opener', () => {
  const c = linksCard('Links', [{ label: 'One', href: 'https://example.com/' }]);
  const a = c.querySelector('a');
  eq(a.getAttribute('href'), 'https://example.com/');
  eq(a.getAttribute('rel'), 'noopener noreferrer');
  eq(a.getAttribute('target'), '_blank');
});
