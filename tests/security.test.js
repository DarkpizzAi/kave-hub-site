import { test, eq } from './run.js';
import * as data from '../js/data.js';
import security from '../js/views/security.js';
import chantier from '../js/views/chantier.js';

const ok = body => ({ status: 200, headers: { get: () => null }, text: async () => body });
const missing = () => ({ status: 404, headers: { get: () => null }, text: async () => '' });

const REPORT = ['# Security report', '', 'Generated today.', '', '**Result: CLEAN**', '',
  '## Zone 2 scan', '', 'All quiet.'].join('\n');
const RECS = ['# Security recommendations', '', 'Ranked.', '', '## Where things stand', '', 'Fine.',
  '', '### 1. Apply the history rewrite (high)', '', 'One force-push.'].join('\n');

function serve(routes) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async url => {
    for (const [part, reply] of routes) if (url.includes(part)) return reply();
    return missing();
  });
}
function done() {
  localStorage.removeItem('ak');
  data.resetMemory();
  data.setFetch((...a) => fetch(...a));
}

test('security shows the scan first, then the recommendations, as cards', async () => {
  serve([
    ['chantier/data/security-report.md', () => ok(REPORT)],
    ['chantier/data/security-recommendations.md', () => ok(RECS)],
  ]);
  const box = document.createElement('div');
  await security(box);
  const titles = [...box.querySelectorAll('.tab-section-title')].map(t => t.textContent);
  eq(titles, ['Security report', 'Zone 2 scan', 'Security recommendations', 'Where things stand',
    '1. Apply the history rewrite (high)']);
  eq(box.textContent.includes('Result: CLEAN'), true);
  eq(box.textContent.indexOf('All quiet.') < box.textContent.indexOf('One force-push.'), true);
  done();
});

test('security says which file is missing when a report is not there', async () => {
  serve([['chantier/data/security-report.md', () => ok(REPORT)]]);
  const box = document.createElement('div');
  await security(box);
  eq(box.textContent.includes('security-recommendations.md is missing'), true);
  eq(box.textContent.includes('security-report.md is missing'), false);
  done();
});

test('chantier no longer prints the two security files', async () => {
  serve([
    ['contents/chantier/data?ref', () => ok(JSON.stringify([
      { type: 'file', name: 'log.md' },
      { type: 'file', name: 'security-report.md' },
      { type: 'file', name: 'security-recommendations.md' },
    ]))],
    ['chantier/data/log.md', () => ok('# Delivery log\n\n## Entry one\n\nShipped a thing.')],
    ['chantier/data/security-report.md', () => ok(REPORT)],
    ['chantier/data/security-recommendations.md', () => ok(RECS)],
  ]);
  const box = document.createElement('div');
  await chantier(box);
  eq(box.textContent.includes('Shipped a thing.'), true);
  eq(box.textContent.includes('All quiet.'), false);
  eq(box.textContent.includes('One force-push.'), false);
  done();
});
