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

test('chantier shows the latest ten log entries inline, and a button opens a popup with the rest', async () => {
  serveLog(12);
  const box = document.createElement('div');
  await chantier(box);
  const shown = titles([...box.querySelectorAll('.tab-section-title')]);
  eq(shown.includes('Entry 1'), true);
  eq(shown.includes('Entry 10'), true);
  eq(shown.includes('Entry 11'), false);
  eq(box.querySelector('details.older'), null);
  const btns = [...box.querySelectorAll('button')].filter(b => b.textContent === 'Older entries (2)');
  eq(btns.length, 1);
  btns[0].click();
  const pop = document.querySelector('.popup-backdrop');
  eq(pop.hidden, false);
  eq(titles(pop.querySelectorAll('.tab-section-title')), ['Entry 11', 'Entry 12']);
  pop.close();
  done();
});

test('no delivery-log entry, recent or archived, opts into the sidebar', async () => {
  serveLog(12);
  const box = document.createElement('div');
  await chantier(box);
  const recentSections = [...box.querySelectorAll('.tab-section')]
    .filter(s => titles([s.querySelector('.tab-section-title')].filter(Boolean)).some(t => /^Entry \d+$/.test(t)));
  eq(recentSections.length > 0, true);
  eq(recentSections.every(s => s.classList.contains('no-toc')), true);
  done();
});

test('chantier adds no older-entries button when the log has ten entries or fewer', async () => {
  serveLog(8);
  const box = document.createElement('div');
  await chantier(box);
  eq([...box.querySelectorAll('button')].some(b => /Older entries/.test(b.textContent)), false);
  eq(box.textContent.includes('Body 8.'), true);
  done();
});

test('chantier no longer reserves a spot for the infrastructure monitor', async () => {
  serveLog(3);
  const box = document.createElement('div');
  await chantier(box);
  const titles = [...box.querySelectorAll('.tab-section-title')].map(t => t.textContent);
  eq(titles.includes('Infrastructure monitor'), false);
  eq(box.textContent.includes('Not built yet'), false);
  done();
});

function serveInfra(devicesTable, routinesBody) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async url => {
    if (url.includes('contents/chantier/data?ref')) {
      return ok(JSON.stringify([{ type: 'file', name: 'log.md' }, { type: 'file', name: 'roadmap.md' },
        { type: 'file', name: 'data-locations.md' }]));
    }
    if (url.includes('chantier/data/infrastructure.md')) return ok(devicesTable);
    if (url.includes('chantier/data/routines.md')) return ok(routinesBody);
    if (url.includes('chantier/data/log.md')) return ok(logWith(1));
    return missing();
  });
}

const INFRA = ['# Infrastructure', '', '## Devices', '| Device | Owner | Kind | Notes |', '|--|--|--|--|',
  "| Hugo's Pixel 7a | Hugo | Android phone |  |",
  "| Isa's Surface | Isa | PC |  |",
  "| The house mini PC | Household | PC |  |",
  "| Hugo's gaming PC | Hugo | PC |  |",
  '', '## Interactions', '| From | To | Channel | What moves | Status |', '|--|--|--|--|--|'].join('\n');

const ROUTINES = ['# Routines', '', '### Daily sweep', 'Summary: Runs every morning.', '',
  'The full detail goes here.'].join('\n');

test('chantier renders one device card per row, icon plus small plain name, no subtitle styling, and drops roadmap.md and data-locations.md', async () => {
  serveInfra(INFRA, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  // No card title (no .tab-section-title) - the name is plain text under the icon.
  eq(box.querySelectorAll('.device-grid .tab-section-title').length, 0);
  const names = titles(box.querySelectorAll('.device-grid .device-name'));
  eq(names, ["Hugo's Pixel 7a", "Isa's Surface", 'The house mini PC', "Hugo's gaming PC"]);
  eq(box.querySelectorAll('.device-grid .glyph').length, 4);
  // Device cards aren't sidebar-worthy "pages" on their own.
  eq([...box.querySelectorAll('.device-grid .tab-section')].every(s => s.classList.contains('no-toc')), true);
  const allTitles = [...box.querySelectorAll('h2')].map(h => h.textContent);
  eq(allTitles.includes('Roadmap'), false);
  eq(allTitles.includes('Data locations: the two-zone rule, and the register'), false);
  done();
});

test('chantier renders a routines subsection, one row per routine with name, summary, and a "readme" disclosure for the full text', async () => {
  serveInfra(INFRA, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  // "Routines" itself is a real subtitle (sidebar-worthy); the routine names
  // inside it are not, and never appear as their own .tab-section entries.
  const routinesTitle = [...box.querySelectorAll('.tab-section-title')].find(t => t.textContent === 'Routines');
  eq(!!routinesTitle, true);
  const row = box.querySelector('.routine-card');
  eq(row.querySelector('.routine-name').textContent, 'Daily sweep');
  eq(row.querySelector('.tab-section-sub').textContent, 'Runs every morning.');
  const d = row.querySelector('details.routine-readme');
  eq(d.querySelector('summary').textContent, 'readme');
  eq(d.textContent.includes('The full detail goes here.'), true);
  done();
});

test('chantier still renders the routines subsection when the infrastructure data has no Flows section', async () => {
  const noFlows = ['# Infrastructure', '', '## Devices', '| Device | Owner | Kind | Notes |', '|--|--|--|--|',
    "| Hugo's Pixel 7a | Hugo | Android phone |  |"].join('\n');
  serveInfra(noFlows, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  eq(box.textContent.includes('Daily sweep'), true);
  done();
});

test('a flow renders as a plain Step / Device(s) / What happens table', async () => {
  const withFlow = [INFRA, '', '## Flows', '', '### Receipts to prices',
    '| Step | From | To | What happens |', '|--|--|--|--|',
    "| 1 | Hugo's Pixel 7a | Google Drive | A photo is added |"].join('\n');
  serveInfra(withFlow, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  const headers = [...box.querySelectorAll('table thead th')].map(h => h.textContent);
  eq(headers, ['Step', 'Device(s)', 'What happens']);
  const cells = [...box.querySelectorAll('table tbody tr')[0].children].map(c => c.textContent);
  eq(cells, ['1', "Hugo's Pixel 7a -> Google Drive", 'A photo is added']);
  done();
});
