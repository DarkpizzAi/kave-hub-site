import { test, eq } from './run.js';
import * as data from '../js/data.js';
import security, { resultOf } from '../js/views/security.js';
import { parse } from '../js/md.js';
import { CHANTIER } from '../js/routes.js';

test('the result line is read in its usual shapes', () => {
  eq(resultOf(parse('# R\n\n**Result: CLEAN**\n')), 'CLEAN');
  eq(resultOf(parse('# R\n\nResult: 2 findings.\n')), '2 findings');
  eq(resultOf(parse('# R\n\nNothing.\n')), null);
});

test('security says which file is missing', async () => {
  localStorage.setItem('ak', 't');
  data.resetMemory(); data.dropCache();
  data.setFetch(async url => (url.includes('security-report.md') && !url.includes('/commits')
    ? { status: 200, headers: { get: () => null }, text: async () => '# Security report\n\n**Result: CLEAN**\n' }
    : { status: url.includes('/commits') ? 200 : 404, headers: { get: () => null }, text: async () => (url.includes('/commits') ? '[]' : '') }));
  const box = document.createElement('div');
  await security(box);
  eq(box.textContent.includes('security-recommendations.md is missing'), true);
  eq(box.textContent.includes('security-report.md is missing'), false);
  localStorage.removeItem('ak'); data.resetMemory(); data.setFetch((...a) => fetch(...a));
});

test('the security files are not on the Chantier shelf', () => {
  const listed = CHANTIER.flatMap(g => (g.files || []).map(f => f.path));
  eq(listed.some(p => /security-/.test(p)), false);
});
