import { test, eq } from './run.js';
import { card } from '../js/ui.js';
import { attachToc, detachToc, tocEntries, shouldShowToc, tailSpace, sideCard, figuresCard, topicsCard, linksCard, currentIndex } from '../js/frame.js';

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
  // no "On this page" (or any) label above the rows
  eq(f.side.querySelector('.toc .side-label'), null);
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

test('tocEntries skips sections inside a collapsed details block', () => {
  const root = document.createElement('div');
  const folded = document.createElement('details');
  folded.append(card('Hidden one'));
  root.append(card('Shown'), folded);
  eq(tocEntries(root).map(e => e.title), ['Shown']);
});

test('tocEntries skips a section flagged no-toc', () => {
  const root = document.createElement('div');
  const skip = card('Skip me');
  skip.classList.add('no-toc');
  root.append(card('Shown'), skip);
  eq(tocEntries(root).map(e => e.title), ['Shown']);
});

test('attachToc adds a pill element behind the rows', () => {
  const f = tocFixture(['One', 'Two']);
  attachToc(f.sheet, f.side, { innerHeight: 500 });
  eq(f.side.querySelectorAll('.toc-pill').length, 1);
  f.done();
});

test('currentIndex always snaps to exactly one section, never a point between two', () => {
  // three section tops at 0, 100, 200
  eq(currentIndex([0, 100, 200], 150), 1);
  // before the first section: index 0
  eq(currentIndex([0, 100, 200], -10), 0);
  // past the last section: stays on it
  eq(currentIndex([0, 100, 200], 500), 2);
  // exactly on a section's top counts as "not yet passed" (strict <)
  eq(currentIndex([0, 100, 200], 100), 0);
  eq(currentIndex([0, 100, 200], 101), 1);
});

test('a contents row carries its full title so a shortened row can still be read', () => {
  const long = 'A very long section title that will not fit on one line of the sidebar';
  const f = tocFixture([long, 'Short']);
  attachToc(f.sheet, f.side, { innerHeight: 500 });
  const rows = [...f.side.querySelectorAll('.toc-row')];
  eq(rows[0].title, long);
  eq(rows[0].textContent, long);
  f.done();
});
