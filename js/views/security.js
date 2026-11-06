// Security: one column. A status hero from the weekly scan's result line,
// then the scan, the ranked recommendations and the two-zone register, each
// as written (all three files are masked at the source).

import * as data from '../data.js';
import { el, icon, emptyNote } from '../ui.js';
import { renderDoc, metaRow, ago } from '../doc.js';

export const SECURITY_FILES = ['chantier/data/security-report.md', 'chantier/data/security-recommendations.md', 'chantier/data/data-locations.md'];

export function resultOf(doc) {
  const text = doc.sections.flatMap(s => s.blocks).filter(b => b.kind === 'p').map(b => b.text).join(' ');
  const m = text.match(/Result:\s*\**\s*([\w ]+?)\s*\**(?:[.,]|$|\s{2})/i) || text.match(/Result:\s*\**([A-Z]+)/);
  return m ? m[1].trim() : null;
}

export default async function security(container) {
  const col = el('div', { class: 'one' });
  const docs = await Promise.all(SECURITY_FILES.map(async p => ({ path: p, doc: await data.doc('/' + p), changed: await data.lastChange(p) })));
  const report = docs[0];
  if (report.doc) {
    const result = resultOf(report.doc);
    const clean = result && /clean|pass|ok/i.test(result);
    col.append(el('div', { class: 'hero status-hero' }, icon(clean ? 'verified_user' : 'gpp_maybe', 'acc'),
      el('div', {}, el('div', { class: 'm3-title-m' }, result ? 'Last scan: ' + result.toLowerCase() : 'Last scan'),
        el('div', { class: 'm3-body-m' }, report.changed ? 'Written ' + ago(report.changed) + ', from security-report.md' : 'From security-report.md'))));
  }
  for (const d of docs) {
    if (!d.doc) { col.append(emptyNote(d.path + ' is missing.')); continue; }
    col.append(el('article', { class: 'doc' }, metaRow(d.path, d.changed), renderDoc(d.doc, d.path)));
  }
  container.append(col);
}
