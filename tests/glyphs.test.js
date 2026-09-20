import { test, eq } from './run.js';
import { glyph, hasGlyph } from '../js/glyphs.js';

test('glyph returns an svg with the outline attributes', () => {
  const g = glyph('food');
  eq(g.tagName.toLowerCase(), 'svg');
  eq(g.getAttribute('viewBox'), '0 0 24 24');
  eq(g.getAttribute('stroke'), 'currentColor');
  eq(g.getAttribute('fill'), 'none');
  eq(g.getAttribute('stroke-width'), '2');
});

test('glyph size sets width and height', () => {
  const g = glyph('home', 28);
  eq(g.getAttribute('width'), '28');
  eq(g.getAttribute('height'), '28');
});

test('a known glyph has its paths', () => {
  eq(glyph('food').querySelectorAll('path').length, 1);
  eq(glyph('infrastructure').querySelectorAll('path').length, 13);
});

test('an unknown key falls back to the generic glyph', () => {
  eq(glyph('nonsense').outerHTML, glyph('generic').outerHTML);
  eq(hasGlyph('nonsense'), false);
  eq(hasGlyph('food'), true);
});

test('the two people share one glyph', () => {
  eq(glyph('hugo').outerHTML, glyph('isa').outerHTML);
});

test('every section key has a glyph', () => {
  for (const k of ['home', 'food', 'household', 'calendar', 'money', 'house', 'fun',
    'hugo', 'isa', 'infrastructure', 'chantier', 'design', 'settings', 'chevron', 'arrow']) {
    eq(hasGlyph(k), true, k);
  }
});
