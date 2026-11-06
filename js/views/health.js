// The routines' health, from chantier/data/last-run.json (written by the
// daily sweep): the last run, then a dot per stage. Stage names and results
// only; the notes stay in the file.

import * as data from '../data.js';
import { el } from '../ui.js';

const RESULT = { ok: '', done: '', 'nothing-to-do': 'idle', skipped: 'idle', failed: 'bad', error: 'bad', partial: 'bad' };
const label = s => s.replace(/^[\w-]+:/, '').replace(/-/g, ' ');

export function when(iso, now = new Date()) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const same = d.toDateString() === now.toDateString();
  return same ? hm : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' ' + hm;
}

export async function healthCard() {
  const run = await data.json('/chantier/data/last-run.json');
  if (!run || !run.routine) return null;
  const row = (cls, text, trail) => el('div', { class: 'health-r' },
    el('span', { class: 'dot ' + (cls || '') }), el('span', { class: 'm3-body-m' }, text), el('span', { class: 'm3-spacer' }),
    el('span', { class: 'm3-label-m m3-variant' }, trail || ''));
  const box = el('div', { class: 'health' },
    row(RESULT[run.status] ?? '', label(run.routine) + (run.status ? ', ' + run.status : ''), when(run.finished_at || run.started_at)));
  for (const s of run.stages || []) box.append(row(RESULT[s.result] ?? '', label(s.name || ''), (s.result || '').replace(/-/g, ' ')));
  return box;
}
