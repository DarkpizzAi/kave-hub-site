import { test, eq } from './run.js';
import { glyph, hasGlyph } from '../js/glyphs.js';

test('glyph returns an svg with the outline attributes', () => {
  const g = glyph('spoon');
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
  eq(glyph('spoon').querySelectorAll('path').length, 1);
  eq(glyph('chantier').querySelectorAll('path').length, 6);
});

test('an unknown key falls back to the generic glyph', () => {
  eq(glyph('nonsense').outerHTML, glyph('generic').outerHTML);
  eq(hasGlyph('nonsense'), false);
  eq(hasGlyph('spoon'), true);
});

test('every section key has a glyph', () => {
  for (const k of ['home', 'spoon', 'our-house', 'calendar', 'finance', 'fun',
    'hugo', 'chantier', 'brand', 'settings', 'chevron', 'arrow']) {
    eq(hasGlyph(k), true, k);
  }
  for (const k of ['household', 'house', 'money', 'design', 'food', 'isa', 'infrastructure']) {
    eq(hasGlyph(k), false, k);
  }
});
