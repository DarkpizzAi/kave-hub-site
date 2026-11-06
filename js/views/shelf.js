// A shelf: the picked file wide (696), the folder's files skinny (400) on the
// right. The list is the folder itself, so a new md file shows up here by
// itself. Chantier is the same, in groups, with the routines' health on top.

import { el, emptyNote, header, listItem } from '../ui.js';
import { renderDoc, metaRow, ago } from '../doc.js';
import { hrefFor } from '../routes.js';
import { folderFiles, chantierGroups, describe } from '../shelf.js';
import { healthCard } from './health.js';

function fileRow(page, f, picked) {
  const name = f.path.split('/').pop();
  return listItem({
    title: f.title,
    sub: [f.sub || name, f.changed ? ago(f.changed) : ''].filter(Boolean).join(' · '),
    href: hrefFor(page.key, f.path), selected: picked && picked.path === f.path,
  });
}

function draw(container, page, groups, pickedPath, paneTop) {
  const all = groups.flatMap(g => g.files);
  if (!all.length) { container.append(emptyNote('No files in this folder yet.')); return; }
  const picked = all.find(f => f.path === pickedPath) || all[0];

  const doc = el('article', { class: 'doc' }, metaRow(picked.path, picked.changed),
    renderDoc(picked.doc, picked.path, { limit: /chantier\/data\/log\.md$/.test(picked.path) ? 8 : 0 }));
  const pane = el('aside', { class: 'pane', 'aria-label': 'Files' });
  if (paneTop) pane.append(...paneTop);
  for (const g of groups) {
    if (!g.files.length) continue;
    pane.append(header(g.title));
    for (const f of g.files) pane.append(fileRow(page, f, picked));
  }
  if (!page.groups) pane.append(el('div', { class: 'pane-foot m3-body-s' }, 'Every md file in this folder. A new one shows up here by itself.'));
  container.append(el('div', { class: 'two' }, doc, pane));
}

export async function shelf(container, page, pickedPath) {
  const files = await describe(await folderFiles(page.folder, { pin: page.pin }));
  draw(container, page, [{ title: page.folder, files }], pickedPath);
}

export async function chantier(container, page, pickedPath) {
  const groups = await chantierGroups();
  const described = await Promise.all(groups.map(async g => ({ title: g.title, files: await describe(g.files) })));
  const health = await healthCard();
  draw(container, { ...page, groups: true }, described, pickedPath || 'chantier/data/log.md', health ? [header('Routines'), health] : null);
}
