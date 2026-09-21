import { test, eq } from './run.js';
import * as data from '../js/data.js';
import chantier from '../js/views/chantier.js';

const ok = body => ({ status: 200, headers: { get: () => null }, text: async () => body });
const missing = () => ({ status: 404, headers: { get: () => null }, text: async () => '' });

// newest first, like the real log
function logWith(n) {
  const out = ['# Delivery log', '', 'What shipped.'];
  for (let i = 1; i <= n; i++) out.push('', '## Entry ' + i, '', 'Body ' + i + '.');
  return out.join('\n');
}

function serveLog(n) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async url => {
    if (url.includes('contents/chantier/data?ref')) return ok(JSON.stringify([{ type: 'file', name: 'log.md' }]));
    if (url.includes('chantier/data/log.md')) return ok(logWith(n));
    return missing();
  });
}
function done() {
  localStorage.removeItem('ak');
  data.resetMemory();
  data.setFetch((...a) => fetch(...a));
}

const titles = nodes => [...nodes].map(t => t.textContent);

test('chantier shows the latest ten log entries and folds the older ones away', async () => {
  serveLog(12);
  const box = document.createElement('div');
  await chantier(box);
  const shown = titles([...box.querySelectorAll('.tab-section-title')].filter(t => !t.closest('details')));
  eq(shown.includes('Entry 1'), true);
  eq(shown.includes('Entry 10'), true);
  eq(shown.includes('Entry 11'), false);
  const older = box.querySelector('details.older');
  eq(older.querySelector('summary').textContent, 'Older entries (2)');
  eq(titles(older.querySelectorAll('.tab-section-title')), ['Entry 11', 'Entry 12']);
  done();
});

test('chantier adds no fold when the log has ten entries or fewer', async () => {
  serveLog(8);
  const box = document.createElement('div');
  await chantier(box);
  eq(box.querySelector('details.older'), null);
  eq(box.textContent.includes('Body 8.'), true);
  done();
});

test('chantier reserves a dashed spot for the infrastructure monitor', async () => {
  serveLog(3);
  const box = document.createElement('div');
  await chantier(box);
  const titles = [...box.querySelectorAll('.tab-section-title')].map(t => t.textContent);
  eq(titles.includes('Infrastructure monitor'), true);
  eq(box.querySelector('.card.idea').textContent.includes('Not built yet'), true);
  done();
});
