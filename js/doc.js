// A parsed md file (md.js) drawn as a Material 3 document. Text goes through
// md.js's inline(), which escapes everything before it adds its own markup,
// so a file can never inject markup into the page.

import { inline } from './md.js';
import { el } from './ui.js';
import { shelfOf, hrefFor, OWNER_URL } from './routes.js';

const icon = name => el('span', { class: 'm3-icon', 'aria-hidden': 'true' }, name);

// A link in a file: another md file of the repo opens on the site when a
// shelf shows it, on GitHub otherwise; the web stays the web.
export function resolver(basePath) {
  const dir = basePath.replace(/[^/]*$/, '');
  return href => {
    if (/^(https?:|mailto:|#)/i.test(href)) return href;
    const parts = (href.startsWith('/') ? href.slice(1) : dir + href).split('#')[0].split('/');
    const out = [];
    for (const s of parts) { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); }
    const path = out.join('/');
    const key = /\.md$/i.test(path) && shelfOf(path);
    return key ? hrefFor(key, path) : OWNER_URL + path;
  };
}

function list(block, link) {
  const tasks = block.items.some(i => i.checked !== null);
  const box = el(block.ordered ? 'ol' : 'ul', { class: tasks ? 'tasks' : null });
  for (const it of block.items) {
    if (tasks) {
      box.append(el('li', { class: it.checked ? 'done' : null },
        icon(it.checked ? 'check_box' : 'check_box_outline_blank'), el('span', { html: inline(it.text, link) })));
    } else {
      box.append(el('li', { html: inline(it.text, link) }));
    }
  }
  return box;
}

function table(block, link) {
  const t = el('table');
  if (block.headers.length) t.append(el('tr', {}, ...block.headers.map(h => el('th', { html: inline(h, link) }))));
  for (const r of block.rows) t.append(el('tr', {}, ...r.map(c => el('td', { html: inline(c, link) }))));
  return el('div', { class: 'tbl' }, t);
}

export function blockNode(b, link) {
  if (b.kind === 'p') return el('p', { html: inline(b.text, link) });
  if (b.kind === 'list') return list(b, link);
  if (b.kind === 'table') return table(b, link);
  if (b.kind === 'code') return el('pre', {}, b.text);
  return null;
}

// The whole file. limit: show only the first N headed sections, with a
// "Show older" button for the rest (the delivery log, newest first).
export function renderDoc(doc, path, { limit = 0 } = {}) {
  const link = resolver(path);
  const box = el('div', { class: 'doc-body' });
  if (doc.title) box.append(el('h2', { html: inline(doc.title, link) }));
  let headed = 0;
  let hold = null;
  for (const s of doc.sections) {
    if (s.heading) headed++;
    let target = box;
    if (limit && headed > limit) {
      if (!hold) hold = el('div', { class: 'doc-older', hidden: '' });
      target = hold;
    }
    if (s.heading) target.append(el('h' + Math.min(6, s.level + 1), { html: inline(s.heading, link) }));
    for (const b of s.blocks) { const n = blockNode(b, link); if (n) target.append(n); }
  }
  if (hold) {
    const more = el('button', { type: 'button', class: 'm3-btn m3-btn--outlined older' }, 'Show older');
    more.addEventListener('click', () => { hold.hidden = false; more.remove(); });
    box.append(more, hold);
  }
  box.style.cssText = 'display:contents';
  return box;
}

// "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago".
export function ago(date, now = new Date()) {
  if (!date) return '';
  const day = d => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((day(now) - day(date)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 30) { const w = Math.round(days / 7); return w === 1 ? '1 week ago' : w + ' weeks ago'; }
  if (days < 365) { const m = Math.round(days / 30); return m === 1 ? '1 month ago' : m + ' months ago'; }
  const y = Math.round(days / 365);
  return y === 1 ? '1 year ago' : y + ' years ago';
}

// The row above a file: its name, when it changed, and a way to GitHub.
export function metaRow(path, changed) {
  const gh = el('a', { class: 'm3-icon-btn', href: OWNER_URL + path, target: '_blank', rel: 'noopener', 'aria-label': 'Open on GitHub', title: 'Open on GitHub' }, icon('open_in_new'));
  return el('div', { class: 'doc-meta' },
    el('span', { class: 'm3-chip' }, icon('description'), path.split('/').pop()),
    el('span', { class: 'm3-body-m' }, changed ? 'Changed ' + ago(changed) : ''),
    el('span', { class: 'm3-spacer' }), gh);
}
