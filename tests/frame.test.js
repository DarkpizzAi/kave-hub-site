import { test, eq } from './run.js';
import { card } from '../js/ui.js';
import { attachToc, detachToc, tocEntries, shouldShowToc, tailSpace, sideCard, figuresCard, topicsCard, linksCard } from '../js/frame.js';

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

function tocFixture(cards) {
  const sheet = document.createElement('div');
  for (const t of cards) sheet.append(card(t));
  const tall = document.createElement('div');
  tall.style.height = '3000px';
  sheet.append(tall);
  const side = document.createElement('aside');
  document.body.append(sheet, side);
  return { sheet, side, done() { detachToc(); sheet.remove(); side.remove(); } };
}

test('attachToc adds one contents card, stays single on repeat, and detachToc removes it', () => {
  const f = tocFixture(['One', 'Two']);
  eq(attachToc(f.sheet, f.side, { innerHeight: 500 }), true);
  eq(f.side.querySelectorAll('.toc').length, 1);
  eq(f.side.querySelectorAll('.toc-row').length, 2);
  attachToc(f.sheet, f.side, { innerHeight: 500 });
  eq(f.side.querySelectorAll('.toc').length, 1);
  detachToc();
  eq(f.side.querySelectorAll('.toc').length, 0);
  f.done();
});

test('attachToc adds nothing for a sheet with one section', () => {
  const f = tocFixture(['One']);
  eq(attachToc(f.sheet, f.side, { innerHeight: 500 }), false);
  eq(f.side.querySelectorAll('.toc').length, 0);
  f.done();
});

test('tailSpace is what the last section needs to reach the top, never negative', () => {
  // viewport 600, content 2000, last section starts at 1900, 16px scroll padding:
  // max scroll is 1400, the last title needs 1884, so 484 more
  eq(tailSpace(600, 2000, 1900, 16), 484);
  // last section already long enough to scroll to the top
  eq(tailSpace(600, 2000, 1300, 16), 0);
});
