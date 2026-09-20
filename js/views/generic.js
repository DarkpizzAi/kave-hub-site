// Fallback view: render any plugin's data/*.md files as cards. Keeps the hub
// alive for plugins that do not have a dedicated view yet.

import * as data from '../data.js';
import { el, header, renderDocCards, emptyNote } from '../ui.js';

export default async function generic(container, name, description) {
  container.append(header(name, description || ''));
  const files = await data.listDir(name + '/data');
  const mdFiles = files.filter(f => f.endsWith('.md'));
  if (!mdFiles.length) {
    container.append(emptyNote('No data files in this plugin yet.'));
    return;
  }
  for (const f of mdFiles) {
    const doc = await data.doc(`/${name}/data/${f}`);
    if (!doc) continue;
    container.append(el('h2', {}, doc.title || f));
    renderDocCards(container, doc, { skipCode: true });
  }
}
