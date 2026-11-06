import { test, eq } from './run.js';
import * as data from '../js/data.js';
import home from '../js/views/home.js';
import { shelf, chantier } from '../js/views/shelf.js';
import security from '../js/views/security.js';
import settings from '../js/views/settings.js';
import brand from '../js/views/brand.js';
import { renderDoc, ago, resolver } from '../js/doc.js';
import { parse } from '../js/md.js';
import { pageFor } from '../js/routes.js';

// A fake repo: files by path, commit dates by path. Folder listings are
// built from the file paths, as the Contents API answers them.
function repo(files, dates = {}) {
  localStorage.setItem('ak', 't');
  data.resetMemory();
  data.dropCache();
  const reply = (status, body) => ({ status, headers: { get: () => null }, text: async () => body });
  data.setFetch(async url => {
    const u = new URL(url);
    if (u.pathname.endsWith('/commits')) {
      const p = u.searchParams.get('path');
      return dates[p] ? reply(200, JSON.stringify([{ commit: { committer: { date: dates[p] } } }])) : reply(200, '[]');
    }
    const path = decodeURIComponent(u.pathname.replace(/^.*\/contents\//, '')).replace(/^\/+/, '');
    if (Object.prototype.hasOwnProperty.call(files, path)) return reply(200, files[path]);
    const kids = Object.keys(files).filter(f => f.startsWith(path + '/') && !f.slice(path.length + 1).includes('/'));
    if (kids.length) return reply(200, JSON.stringify(kids.map(f => ({ type: 'file', name: f.split('/').pop() }))));
    return reply(404, '');
  });
}
function done() {
  localStorage.removeItem('ak');
  data.resetMemory();
  data.setFetch((...a) => fetch(...a));
}

const now = new Date();
const daysAgo = n => new Date(now.getTime() - n * 86400000).toISOString();

test('a shelf lists the folder (pins first, new files by themselves) and shows the picked file', async () => {
  repo({
    'our-house/data/plan.md': '# The plan\n\n## Key facts\n\n- Rooms: three\n',
    'our-house/data/todo.md': '# To do\n\n- [ ] Measure\n- [x] Ask\n',
    'our-house/data/zz-new.md': '# A brand new file\n',
    'our-house/data/_draft.md': '# Hidden\n',
  }, { 'our-house/data/todo.md': daysAgo(2) });
  const box = document.createElement('div');
  await shelf(box, pageFor('our-house'), 'our-house/data/todo.md');
  const rows = [...box.querySelectorAll('.pane .m3-list-item')];
  eq(rows.map(r => r.querySelector('.m3-body-l').textContent), ['The plan', 'To do', 'A brand new file'], 'pins, then the rest; _ files hidden');
  eq(box.querySelector('.pane .m3-list-item--selected .m3-body-l').textContent, 'To do');
  eq(rows[1].querySelector('.m3-variant').textContent, 'todo.md · 2 days ago');
  eq(box.querySelector('.doc h2').textContent, 'To do');
  eq(box.querySelectorAll('.doc ul.tasks li.done').length, 1);
  eq(!!box.querySelector('.two'), true, 'wide + skinny');
  done();
});

test('a shelf opens its first file when none is picked, and says so when empty', async () => {
  repo({ 'fun/data/board-games.md': '# Board games\n' });
  const box = document.createElement('div');
  await shelf(box, pageFor('fun'), null);
  eq(box.querySelector('.doc h2').textContent, 'Board games');
  repo({});
  const empty = document.createElement('div');
  await shelf(empty, pageFor('fun'), null);
  eq(empty.textContent.includes('No files'), true);
  done();
});

test('chantier groups the files, shows the routines first and pages the log', async () => {
  const log = ['# Delivery log', '', ...Array.from({ length: 10 }, (_, i) => `## 2026-11-0${i} - entry ${i}\n\nText ${i}.\n`)].join('\n');
  repo({
    'chantier/data/log.md': log,
    'calendar/data/roadmap.md': '# calendar roadmap\n',
    'calendar/data/compass-handoff-x-2026-10-25.md': '# Handoff X\n',
    'calendar/data/bookings.md': '# Bookings\n',
    'docs/superpowers/specs/2026-11-05-a.md': '# Design A\n',
    'chantier/data/last-run.json': JSON.stringify({ routine: 'daily-inbound-sweep', status: 'partial', finished_at: now.toISOString(),
      stages: [{ name: 'food:receipt-processing', result: 'nothing-to-do', note: 'secret detail' }, { name: 'finance:bank', result: 'failed' }] }),
  });
  const box = document.createElement('div');
  await chantier(box, pageFor('chantier'), null);
  eq([...box.querySelectorAll('.pane .m3-list-header')].map(h => h.textContent), ['Routines', 'Roadmaps', 'Designs', 'Handoffs', 'How it runs']);
  eq(box.textContent.includes('Bookings'), false, 'handoffs only');
  eq(box.querySelectorAll('.health .dot.bad').length, 2, 'the run and the failed stage');
  eq(box.textContent.includes('secret detail'), false, 'stage notes stay in the file');
  eq(box.querySelector('.doc h2').textContent, 'Delivery log', 'opens on the log');
  eq(box.querySelectorAll('.doc .doc-body > h3').length, 8, 'eight entries, then Show older');
  box.querySelector('.older').click();
  eq(box.querySelector('.doc-older').hidden, false);
  done();
});

test('home counts down to move-in and lists what changed most recently', async () => {
  repo({
    'our-house/data/plan.md': '# Plan\n\n## Key facts\n\n- Move-in date: 30/09/2099 09:00 (Madrid time).\n',
    'food/data/grocery-staples.md': '# Grocery staples\n',
    'fun/data/board-games.md': '# Board games\n',
  }, { 'food/data/grocery-staples.md': now.toISOString(), 'fun/data/board-games.md': daysAgo(30) });
  const box = document.createElement('div');
  await home(box);
  eq(!!box.querySelector('.hero .clock'), true);
  eq(Number(box.querySelector('.clock-num').textContent) > 1000, true);
  eq([...box.querySelectorAll('.day-h')].map(h => h.textContent), ['Today', 'Older']);
  eq(box.querySelector('.m3-grouped .m3-body-l').textContent, 'Grocery staples', 'newest first');
  eq(box.querySelector('.m3-grouped a').getAttribute('href'), '#/food/food/data/grocery-staples.md');
  eq(!!box.querySelector('.one'), true);
  done();
});

test('security: a status hero from the result line, then the three files', async () => {
  repo({
    'chantier/data/security-report.md': '# Security report\n\n**Result: CLEAN**\n\n## Zone 2\n\nAll quiet.\n',
    'chantier/data/security-recommendations.md': '# Recommendations\n\n### 1. Rotate\n\nSoon.\n',
    'chantier/data/data-locations.md': '# Data locations\n',
  });
  const box = document.createElement('div');
  await security(box);
  eq(box.querySelector('.hero .m3-title-m').textContent, 'Last scan: clean');
  eq(box.querySelectorAll('article.doc').length, 3);
  done();
});

test('settings offers the two themes, sync and advanced, in one column', async () => {
  repo({});
  const box = document.createElement('div');
  await settings(box);
  eq([...box.querySelectorAll('.m3-list-header')].map(h => h.textContent), ['Theme', 'Sync', 'Advanced']);
  eq([...box.querySelectorAll('.set-swatch .m3-label-m')].map(b => b.textContent), ['Cobalt', 'Chartreuse']);
  done();
});

test('a file cannot inject markup, and repo links stay on the site', () => {
  const doc = parse('# <img src=x onerror=alert(1)>\n\nSee [the plan](plan.md) and [web](https://example.com).\n\n| a |\n|---|\n| <b>x</b> |\n');
  const box = document.createElement('div');
  box.append(renderDoc(doc, 'our-house/data/todo.md'));
  eq(box.querySelector('img'), null);
  eq(box.querySelector('b'), null);
  eq([...box.querySelectorAll('a')].map(a => a.getAttribute('href')), ['#/our-house/our-house/data/plan.md', 'https://example.com']);
  eq(resolver('chantier/data/log.md')('../../brand/data/look-recap.md').startsWith('https://github.com/'), true, 'unshelved files open on GitHub');
});

test('ago reads like a person', () => {
  const d = n => new Date(now.getTime() - n * 86400000);
  eq(ago(d(0)), 'today'); eq(ago(d(1)), 'yesterday'); eq(ago(d(3)), '3 days ago'); eq(ago(d(14)), '2 weeks ago'); eq(ago(d(90)), '3 months ago');
});

test('brand draws look-recap.md live: three columns, samples, notes', async () => {
  const recap = ['# The kave look', '', 'Intro line.', '',
    '## Plain Material 3', '', 'Taken as Material says.', '', '### Type', '', 'The type scale.', '', 'Sample: type', '',
    '## Changed by kave', '', 'Colours only.', '', '### Two fills only', '', 'Accent and accent fade.', '', 'Sample: fills', '', 'Decided: Isa, 06/11/2026', '',
    '### Unknown sample', '', 'Drawn without a sample.', '', 'Sample: nothing-like-this', '',
    '## Added by kave', '', 'Not in Material.', '', '### Widths', '', '720, or 1120.', '', 'Sample: widths', '',
    '## Out of date', '', 'The spec lags.'].join('\n') + '\n';
  repo({ 'brand/data/look-recap.md': recap });
  const box = document.createElement('div');
  await brand(box);
  eq([...box.querySelectorAll('.r-col > header .m3-title-l')].map(h => h.textContent), ['Plain Material 3', 'Changed by kave', 'Added by kave']);
  eq(box.querySelectorAll('.r-it').length, 4);
  eq(box.textContent.includes('Isa, 06/11/2026'), true);
  eq(box.textContent.includes('Sample:'), false, 'sample lines are drawn, not printed');
  eq(!!box.querySelector('.m3-btn--filled'), true);
  eq(box.querySelector('.r-note').textContent.includes('The spec lags.'), true);
  done();
});

test('brand says so when look-recap.md is missing', async () => {
  repo({});
  const box = document.createElement('div');
  await brand(box);
  eq(box.textContent.includes('look-recap.md not found.'), true);
  done();
});
