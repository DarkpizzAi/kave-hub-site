import { test, eq } from './run.js';
import { inline } from '../js/md.js';

test('an https link becomes an anchor', () => {
  eq(inline('[x](https://example.com)'),
    '<a href="https://example.com" target="_blank" rel="noopener">x</a>');
});

test('a javascript: link becomes plain text', () => {
  eq(inline('[x](javascript:alert)'), 'x');
});

test('a javascript: link with parentheses never becomes an anchor', () => {
  eq(inline('[x](javascript:alert(1))').includes('<a'), false);
});

test('an angle bracket in text is escaped', () => {
  eq(inline('a < b'), 'a &lt; b');
});
