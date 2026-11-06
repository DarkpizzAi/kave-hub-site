// DOM helpers, drawn with the Material 3 kit's classes.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    // through the style object: a style *attribute* is inline style, which
    // the CSP (style-src without 'unsafe-inline') silently refuses
    else if (k === 'style') node.style.cssText = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c);
  }
  return node;
}

export const icon = (name, cls = '') => el('span', { class: ('m3-icon ' + cls).trim(), 'aria-hidden': 'true' }, name);

export function emptyNote(msg) {
  return el('div', { class: 'empty m3-body-m' }, msg || 'Nothing here yet.');
}

// A Material list item: optional leading icon (in a tonal square), a headline,
// a supporting line, an optional trailing node. href makes it a link.
export function listItem({ lead, title, sub, trail, href, selected, cls }) {
  const tag = href ? 'a' : 'div';
  const node = el(tag, { class: ['m3-list-item', selected ? 'm3-list-item--selected' : '', cls || ''].join(' ').trim(), href });
  if (lead) node.append(el('span', { class: 'm3-list-item__lead m3-list-item__lead--square lead-k' }, icon(lead)));
  node.append(el('div', { class: 'm3-list-item__text' },
    el('div', { class: 'm3-body-l' }, title),
    sub ? el('div', { class: 'm3-body-m m3-variant' }, sub) : null));
  if (trail) node.append(typeof trail === 'string' ? el('span', { class: 'm3-list-item__trail m3-label-m' }, trail) : trail);
  return node;
}

export const header = (text) => el('div', { class: 'm3-list-header m3-title-s' }, text);
