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

test('chantier shows only the latest two log entries inline, and "See all" opens a popup with the complete log', async () => {
  serveLog(5);
  const box = document.createElement('div');
  await chantier(box);
  const shown = titles([...box.querySelectorAll('.tab-section-title')]);
  eq(shown.includes('Entry 1'), true);
  eq(shown.includes('Entry 2'), true);
  eq(shown.includes('Entry 3'), false);
  const btns = [...box.querySelectorAll('button')].filter(b => b.textContent === 'See all');
  eq(btns.length, 1);
  btns[0].click();
  const pop = document.querySelector('.popup-backdrop');
  eq(pop.hidden, false);
  // the popup carries the whole log, not just the tail
  eq(titles(pop.querySelectorAll('.tab-section-title')), ['Entry 1', 'Entry 2', 'Entry 3', 'Entry 4', 'Entry 5']);
  pop.close();
  done();
});

test('no delivery-log entry, recent or archived, opts into the sidebar', async () => {
  serveLog(5);
  const box = document.createElement('div');
  await chantier(box);
  const recentSections = [...box.querySelectorAll('.tab-section')]
    .filter(s => titles([s.querySelector('.tab-section-title')].filter(Boolean)).some(t => /^Entry \d+$/.test(t)));
  eq(recentSections.length > 0, true);
  eq(recentSections.every(s => s.classList.contains('no-toc')), true);
  done();
});

test('chantier adds no "See all" button when the log has two entries or fewer', async () => {
  serveLog(2);
  const box = document.createElement('div');
  await chantier(box);
  eq([...box.querySelectorAll('button')].some(b => b.textContent === 'See all'), false);
  eq(box.textContent.includes('Body 2.'), true);
  done();
});

test('chantier no longer reserves a spot for the infrastructure monitor', async () => {
  serveLog(1);
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

test('chantier renders a routine block with name, icon, summary, a "readme" disclosure, and an empty "performance" disclosure', async () => {
  serveInfra(INFRA, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  // "Routines" itself is a real subtitle (sidebar-worthy); the routine names
  // inside it are not, and never appear as their own .tab-section entries.
  const routinesTitle = [...box.querySelectorAll('.tab-section-title')].find(t => t.textContent === 'Routines');
  eq(!!routinesTitle, true);
  const block = box.querySelector('.routine-block');
  eq(block.querySelector('.routine-name').textContent, 'Daily sweep');
  eq(!!block.querySelector('.routine-icon .glyph'), true);
  eq(block.querySelector('.tab-section-sub').textContent, 'Runs every morning.');
  const [readme, perf] = block.querySelectorAll('details.routine-readme');
  eq(readme.querySelector('summary').textContent, 'readme');
  eq(readme.textContent.includes('The full detail goes here.'), true);
  eq(perf.querySelector('summary').textContent, 'performance');
  eq(perf.textContent.includes('No runs logged yet.'), true);
  done();
});

test('session-start and session-end routines share one card as two repeated blocks', async () => {
  const routines = ['# Routines', '', '### Session-start repo sync', 'Summary: Fetches on start.', '',
    'Full start detail.', '', '### Session-end memory push', 'Summary: Pushes on end.', '',
    'Full end detail.'].join('\n');
  serveInfra(INFRA, routines);
  const box = document.createElement('div');
  await chantier(box);
  const cards = [...box.querySelectorAll('.routine-card')];
  const combined = cards.find(c => c.querySelectorAll('.routine-block').length === 2);
  eq(!!combined, true);
  const names = [...combined.querySelectorAll('.routine-name')].map(n => n.textContent);
  eq(names, ['Session-start repo sync', 'Session-end memory push']);
  done();
});

test('a routine with logged runs shows the latest figures and a "See all" popup with every run', async () => {
  const metrics = [
    { routine: 'daily-sweep', started_at: '2026-09-20T05:00:00Z', duration_seconds: 100, tokens_used: 1000, stages: [{ name: 'a', result: 'ok' }] },
    { routine: 'daily-sweep', started_at: '2026-09-22T05:00:00Z', duration_seconds: 120, tokens_used: 2000, stages: [{ name: 'a', result: 'failed' }] },
  ].map(r => JSON.stringify(r)).join('\n');
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.setFetch(async url => {
    if (url.includes('contents/chantier/data?ref')) return ok(JSON.stringify([{ type: 'file', name: 'log.md' }]));
    if (url.includes('chantier/data/infrastructure.md')) return ok(INFRA);
    if (url.includes('chantier/data/routines.md')) return ok(ROUTINES);
    if (url.includes('chantier/data/routine-metrics.jsonl')) return ok(metrics);
    if (url.includes('chantier/data/log.md')) return ok(logWith(1));
    return missing();
  });
  const box = document.createElement('div');
  await chantier(box);
  const perf = box.querySelectorAll('details.routine-readme')[1];
  // shows the more recent (22nd) run's figures, not the older one
  eq(perf.textContent.includes('120s'), true);
  eq(perf.textContent.includes('2,000 tokens'), true);
  eq(perf.textContent.includes('failed'), true);
  const btn = perf.querySelector('button.btn');
  btn.click();
  const pop = document.querySelector('.popup-backdrop');
  eq(pop.querySelectorAll('table tbody tr').length, 2);
  pop.close();
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

test('a flow renders as a plain Step / Device(s) / What happens table, and a markdown link in it becomes a pill', async () => {
  const withFlow = [INFRA, '', '## Flows', '', '### Receipts to prices',
    '| Step | From | To | What happens |', '|--|--|--|--|',
    "| 1 | Hugo's Pixel 7a | Google Drive | A photo is added to the [inbound receipts](https://example.com/folder) folder |"].join('\n');
  serveInfra(withFlow, ROUTINES);
  const box = document.createElement('div');
  await chantier(box);
  const headers = [...box.querySelectorAll('table thead th')].map(h => h.textContent);
  eq(headers, ['Step', 'Device(s)', 'What happens']);
  const cells = [...box.querySelectorAll('table tbody tr')[0].children];
  eq(cells[0].textContent, '1');
  eq(cells[1].textContent, "Hugo's Pixel 7a -> Google Drive");
  const link = cells[2].querySelector('a');
  eq(link.textContent, 'inbound receipts');
  eq(link.classList.contains('chip'), true);
  done();
});
