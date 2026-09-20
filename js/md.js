// Markdown subset parser producing a document model (not raw HTML).
// Handles: headings, pipe tables, bullet/checkbox/numbered lists, fenced code
// blocks (kept opaque, never parsed as content), paragraphs. HTML comments
// are dropped before parsing.

export function parse(text) {
  const src = text.replace(/<!--[\s\S]*?-->/g, '');
  const lines = src.split(/\r?\n/);
  const doc = { title: '', sections: [] };
  let section = { level: 0, heading: '', blocks: [] };
  doc.sections.push(section);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      section.blocks.push({ kind: 'code', text: buf.join('\n') });
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const heading = h[2].trim();
      if (level === 1 && !doc.title) { doc.title = heading; i++; continue; }
      section = { level, heading, blocks: [] };
      doc.sections.push(section);
      i++;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const raw = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { raw.push(lines[i]); i++; }
      const cellsOf = r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      let headers = [], rows = [];
      if (raw.length >= 2 && /^[\s|:\-]+$/.test(raw[1])) {
        headers = cellsOf(raw[0]);
        rows = raw.slice(2).map(cellsOf);
      } else {
        rows = raw.map(cellsOf);
      }
      section.blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    const isBullet = /^\s*[-*]\s+/.test(line);
    const isNumbered = /^\s*\d+[.)]\s+/.test(line);
    if (isBullet || isNumbered) {
      const items = [];
      const ordered = isNumbered;
      const re = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
      while (i < lines.length) {
        const m = lines[i].match(re);
        if (!m) break;
        let itemText = m[1];
        let checked = null;
        const cb = itemText.match(/^\[( |x|X)\]\s*(.*)$/);
        if (cb) { checked = cb[1].toLowerCase() === 'x'; itemText = cb[2]; }
        let date = null;
        const dm = itemText.match(/^(\d{4}-\d{2}-\d{2})\s+added:\s*(.*)$/);
        if (dm) { date = dm[1]; itemText = dm[2]; }
        items.push({ text: itemText, checked, date });
        i++;
      }
      section.blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    if (line.trim() === '') { i++; continue; }

    const buf = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{1,6}\s|```|\s*\||\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    section.blocks.push({ kind: 'p', text: buf.join(' ') });
  }
  doc.sections = doc.sections.filter(s => s.heading || s.blocks.length);
  return doc;
}

// A value that is still a template placeholder: "[1500]", "[DD/MM]", "[...]",
// "a completer" variants, or empty.
export function isPlaceholder(s) {
  const t = (s || '').trim();
  if (!t) return true;
  if (/^\[[^\]]*\]$/.test(t)) return true;
  if (/^à\s+compléter$/i.test(t)) return true;
  if (t === '...') return true;
  return false;
}

// A whole line/row that carries no real content once placeholders are removed,
// e.g. "[Name] - [DD/MM]" or "| [DD/MM] | [Restaurant] | ... |".
export function isTemplateText(s) {
  const t = (s || '').trim();
  if (!t) return true;
  const stripped = t.replace(/\[[^\]]*\]\([^)]*\)/g, 'x')
                    .replace(/\[[^\]]*\]/g, '')
                    .replace(/[\s\-:,;.()~|]/g, '');
  return stripped === '';
}

export function isTemplateRow(cells) {
  return cells.every(c => isPlaceholder(c) || (c || '').trim() === '');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}

// Inline markdown to HTML: bold, inline code, links, then leftover [bracket]
// groups become muted placeholder chips. resolveLink(href) may rewrite a href
// (e.g. recipe .md paths to hub routes); returning null drops the link.
export function inline(text, resolveLink) {
  let out = escapeHtml(text || '');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const url = resolveLink ? resolveLink(href) : href;
    if (url == null || !/^(https?:|mailto:|#|\.|\/)/i.test(url)) return label;
    const ext = /^https?:/i.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  out = out.replace(/\[([^\]<>]*)\]/g, (m, inner) =>
    `<span class="ph">${inner || '...'}</span>`);
  return out;
}

// Query helpers
export function findSection(doc, re) {
  return doc.sections.find(s => re.test(s.heading)) || null;
}
export function findSections(doc, re) {
  return doc.sections.filter(s => re.test(s.heading));
}
export function firstTable(section) {
  if (!section) return null;
  return section.blocks.find(b => b.kind === 'table') || null;
}
export function firstList(section) {
  if (!section) return null;
  return section.blocks.find(b => b.kind === 'list') || null;
}
