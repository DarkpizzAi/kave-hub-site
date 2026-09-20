// Shared DOM widgets. Everything builds real elements; markdown text goes
// through md.inline() for bold/links/placeholder rendering.

import { inline, isTemplateText, isTemplateRow } from './md.js';

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c);
  }
  return node;
}

export function card(title, ...children) {
  const c = el('div', { class: 'card' });
  if (title) c.append(el('h3', {}, title));
  for (const ch of children) if (ch != null) c.append(ch);
  return c;
}

export function kpi(label, value, note, cls) {
  // cls 'hero' or 'focus' styles the whole tile; anything else colours the value.
  const tileCls = (cls === 'hero' || cls === 'focus') ? ' ' + cls : '';
  const valCls = cls && !tileCls ? ' ' + cls : '';
  return el('div', { class: 'kpi' + tileCls },
    el('div', { class: 'lab' }, label),
    el('div', { class: 'val' + valCls },
      value instanceof Node ? value : String(value)),
    note ? el('div', { class: 'note' }, note) : null);
}

export function chip(txt, cls) {
  return el('span', { class: 'chip' + (cls ? ' ' + cls : '') }, txt);
}

export function emptyNote(msg) {
  return el('p', { class: 'empty' }, msg || 'Nothing here yet.');
}

export function tableFromBlock(block, opts = {}) {
  const resolve = opts.resolveLink;
  const rows = opts.rows || block.rows;
  const realRows = rows.filter(r => !isTemplateRow(r));
  const shown = realRows.length ? realRows : rows;
  const t = el('table');
  if (block.headers && block.headers.length) {
    t.append(el('thead', {}, el('tr', {},
      ...block.headers.map(h => el('th', { html: inline(h, resolve) })))));
  }
  const tb = el('tbody');
  for (const r of shown) {
    tb.append(el('tr', {}, ...r.map(c => el('td', { html: inline(c, resolve) }))));
  }
  t.append(tb);
  if (!realRows.length && rows.length) {
    const wrap = el('div');
    wrap.append(t, el('p', { class: 'empty' }, 'Template values only, nothing filled in yet.'));
    return wrap;
  }
  if (!rows.length) return emptyNote();
  return t;
}

export function listFromBlock(block, opts = {}) {
  const resolve = opts.resolveLink;
  const hasChecks = block.items.some(it => it.checked !== null);
  if (hasChecks) {
    const ul = el('ul', { class: 'checks' });
    for (const it of block.items) {
      if (isTemplateText(it.text)) continue;
      ul.append(el('li', { class: it.checked ? 'done' : '' },
        el('span', { class: 'box' }, it.checked ? '[x]' : '[ ]'),
        el('span', { html: (it.date ? `<span class="chip">${it.date}</span> ` : '') + inline(it.text, resolve) })));
    }
    if (!ul.children.length) return emptyNote('No tasks yet.');
    return ul;
  }
  const tag = block.ordered ? 'ol' : 'ul';
  const list = el(tag, { class: 'plain' });
  for (const it of block.items) {
    list.append(el('li', { html: inline(it.text, resolve) }));
  }
  return list;
}

export function renderBlocks(container, blocks, opts = {}) {
  for (const b of blocks) {
    if (b.kind === 'p') container.append(el('p', { class: 'sub', html: inline(b.text, opts.resolveLink) }));
    else if (b.kind === 'table') container.append(tableFromBlock(b, opts));
    else if (b.kind === 'list') container.append(listFromBlock(b, opts));
    else if (b.kind === 'code' && !opts.skipCode) container.append(el('pre', {}, b.text));
  }
}

// One card per section; the intro (level 0) section becomes a lead paragraph.
export function renderDocCards(container, doc, opts = {}) {
  for (const s of doc.sections) {
    if (opts.skipHeadings && opts.skipHeadings.some(re => re.test(s.heading))) continue;
    if (s.level === 0) {
      if (!opts.skipIntro) renderBlocks(container, s.blocks, opts);
      continue;
    }
    const c = card(s.heading);
    if (!s.blocks.length) c.append(emptyNote());
    else renderBlocks(c, s.blocks, opts);
    container.append(c);
  }
}

export function header(title, sub) {
  const h = el('header', {}, el('h1', {}, title));
  if (sub) h.append(el('div', { class: 'sub' }, sub));
  return h;
}

export function selectBox(labelTxt, options, onchange) {
  const sel = el('select', { onchange: e => onchange(e.target.value) },
    ...options.map(o => el('option', { value: o.value }, o.label)));
  return el('label', {}, labelTxt + ' ', sel);
}
