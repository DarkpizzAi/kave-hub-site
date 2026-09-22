// Money: 1) monthly targets with savings first and a live "safe to spend"
// figure, 2) recurring bills with due-in chips.

import * as data from '../data.js';
import { findSection, firstTable, isPlaceholder, inline } from '../md.js';
import { pixelEmoji, billEmoji } from '../icons.js';
import { el, card, header, kpi, tableFromBlock, emptyNote } from '../ui.js';

// Months from the current month through the deadline month (MM/YYYY), min 1.
function monthsLeft(deadline) {
  const m = (deadline || '').match(/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const now = new Date();
  const n = (+m[2] - now.getFullYear()) * 12 + (+m[1] - now.getMonth() - 1) + 1;
  return Math.max(n, 1);
}

function targetsSection(container, budget) {
  container.append(el('h2', {}, '1. Monthly targets'));
  if (!budget) { container.append(emptyNote('budget.md not found.')); return; }

  const goalT = firstTable(findSection(budget, /goal/i));
  const t = firstTable(findSection(budget, /monthly targets/i));
  if (!t) { container.append(emptyNote()); return; }

  const val = r => parseFloat((r[1] || '').replace(/[^\d.]/g, '')) || 0;

  // Goal table drives the savings target so it recalculates as months pass.
  let goal = null, saved = null, windfall = null, months = null;
  if (goalT) {
    for (const r of goalT.rows) {
      if (/savings goal/i.test(r[0])) goal = val(r);
      else if (/saved so far/i.test(r[0])) saved = val(r);
      else if (/windfall/i.test(r[0])) windfall = val(r);
      else if (/deadline/i.test(r[0])) months = monthsLeft(r[1]);
    }
  }
  const haveGoal = goal != null && saved != null && months != null;
  // The windfall counts in the plan: it is coming back, when it lands it
  // just moves from "pending" to "saved".
  const target = haveGoal ? Math.max((goal - saved - (windfall || 0)) / months, 0) : null;

  // Rows: savings first (computed value replaces "auto"), income excluded
  // from the recurring sum.
  const savingsRow = t.rows.find(r => /savings|épargne/i.test(r[0]));
  const incomeRow = t.rows.find(r => /income/i.test(r[0]));
  const rest = t.rows.filter(r => r !== savingsRow && r !== incomeRow);
  const savings = target != null ? target : (savingsRow ? val(savingsRow) : 0);
  const committed = rest.reduce((a, r) => a + (isPlaceholder(r[1]) ? 0 : val(r)), 0);

  // Income: committed figure from budget.md.
  let income = incomeRow && !isPlaceholder(incomeRow[1]) ? val(incomeRow) : null;
  let incomeNote = 'committed typical figure';

  const strip = el('div', { class: 'kpis' });
  if (income != null) {
    strip.append(kpi('Safe to spend / month', data.fmtEur(income - savings - committed),
      'after the savings target and recurring targets', 'hero'));
  }
  if (income != null) strip.append(kpi('Typical income', data.fmtEur(income), incomeNote, 'pos'));
  strip.append(kpi('Savings target', data.fmtEur(savings),
    typeof windfall === 'number' && windfall > 0 ? `per month, the ${data.fmtEur(windfall)} counted (when it lands)` : 'per month', 'focus'));
  strip.append(kpi('Recurring targets', data.fmtEur(committed), 'rent, groceries, subscriptions...'));
  container.append(strip);

  // Goal progress: saved (solid) + windfall on its way (striped)
  if (haveGoal && goal > 0) {
    const c = card('Goal progress');
    const pctSaved = Math.min(saved / goal * 100, 100);
    const pctPending = Math.min((windfall || 0) / goal * 100, 100 - pctSaved);
    c.append(el('div', { class: 'track' },
      segment('seg saved', pctSaved, 'saved'),
      segment('seg pending', pctPending, 'windfall on its way')));
    c.append(el('p', { class: 'sub' },
      `${data.fmtEur(saved)} saved + ${data.fmtEur(windfall || 0)} on its way = ` +
      `${data.fmtEur(saved + (windfall || 0))} of ${data.fmtEur(goal)} ` +
      `(${Math.round((saved + (windfall || 0)) / goal * 100)}%), ${months} months to go`));
    container.append(c);
  }

  const shownRows = [];
  if (savingsRow) {
    const r = [...savingsRow];
    if (target != null) r[1] = String(Math.round(target));
    shownRows.push(r);
  }
  if (incomeRow) shownRows.push(incomeRow);
  shownRows.push(...rest);
  const det = el('details', {}, el('summary', {}, 'Targets detail (EUR)'));
  det.append(tableFromBlock({ headers: t.headers, rows: [] }, { rows: shownRows.length ? shownRows : t.rows }));
  const c2 = card(null);
  c2.append(det);
  container.append(c2);
}

function billsSection(container, bills) {
  container.append(el('h2', {}, '2. Recurring bills'));
  if (!bills) { container.append(emptyNote('recurring-bills.md not found.')); return; }
  const t = firstTable(bills.sections.find(s => firstTable(s)));
  if (!t) { container.append(emptyNote()); return; }

  const di = t.headers.findIndex(h => /day/i.test(h));
  const ai = t.headers.findIndex(h => /amount/i.test(h));
  const ni = t.headers.findIndex(h => /notes/i.test(h));
  const dueIn = v => {
    const day = parseInt(v, 10);
    return (day && day <= 31 && !/\//.test(v || '')) ? data.daysUntilDayOfMonth(day) : 999;
  };

  const grid = el('div', { class: 'bills' });
  let total = 0, real = 0;
  for (const r of [...t.rows].sort((a, b) => dueIn(a[di]) - dueIn(b[di]))) {
    const name = r[0] || '';
    const amountRaw = r[ai] || '';
    const ghost = isPlaceholder(amountRaw) || isPlaceholder(name);
    const v = parseFloat(amountRaw.replace(/[^\d.]/g, ''));
    const due = dueIn(r[di]);
    const b = el('div', { class: 'bill' + (due <= 7 ? ' due' : '') + (ghost ? ' ghost' : '') });
    b.append(el('div', { class: 'bname' },
      pixelEmoji(billEmoji(name), 26),
      el('span', { html: inline(name) })));
    b.append(el('div', { class: 'bval' }, ghost || !v ? '?' : data.fmtEur(v)));
    const bits = [];
    if (due !== 999) bits.push(due === 0 ? 'due today' : `due in ${due} d (day ${parseInt(r[di], 10)})`);
    else if (/\//.test(r[di] || '') && !isPlaceholder(r[di])) bits.push(r[di]);
    else if (/monthly/i.test(r[di] || '')) bits.push('monthly');
    if (ni >= 0 && r[ni] && !isPlaceholder(r[ni])) bits.push(r[ni]);
    if (ghost) bits.push('to fill in');
    b.append(el('div', { class: 'bnote' }, bits.join(' - ')));
    grid.append(b);
    const monthly = /monthly/i.test(r[di] || '') || (parseInt(r[di], 10) && !/\//.test(r[di]));
    if (!ghost && v && monthly) { total += v; real++; }
  }
  container.append(grid);
  if (real) {
    container.append(el('div', { class: 'kpis' },
      kpi('Monthly bills', data.fmtEur(total), real + ' known monthly bills')));
  }
}

function segment(cls, pct, title) {
  const d = el('div', { class: cls, title });
  d.style.width = pct + '%';
  return d;
}

export default async function finance(container) {
  container.append(header('finance', 'Joint finances: budget and bills'));
  container.append(el('p', { class: 'tab-section-sub' }, 'Compass (finance app): coming soon.'));
  const [budget, bills] = await Promise.all([
    data.doc('/finance/data/budget.md'),
    data.doc('/finance/data/recurring-bills.md'),
  ]);
  targetsSection(container, budget);
  billsSection(container, bills);
}
