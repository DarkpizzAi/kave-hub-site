// What a shelf holds: a folder's md files (or Chantier's groups), each with
// its title (the file's first heading) and when it last changed (git). All of
// it is read live from the private repo; nothing is listed by hand.

import * as data from './data.js';
import { PAGES, CHANTIER } from './routes.js';

const isShelfFile = name => /\.md$/i.test(name) && !name.startsWith('_') && !/^readme\.md$/i.test(name);

export function order(names, pin = [], newestFirst = false) {
  const pinned = pin.filter(n => names.includes(n));
  const rest = names.filter(n => !pinned.includes(n)).sort();
  if (newestFirst) rest.reverse(); // dated names (2026-11-05-...) sort newest first
  return [...pinned, ...rest];
}

// [{ path, sub? }] for a page's folder.
export async function folderFiles(folder, { pin = [], match = null, newestFirst = false } = {}) {
  const names = (await data.listDir(folder)).filter(isShelfFile).filter(n => !match || match.test(n));
  return order(names, pin, newestFirst).map(n => ({ path: folder + '/' + n }));
}

// [{ title, files: [{ path, sub? }] }] for Chantier.
export async function chantierGroups() {
  return Promise.all(CHANTIER.map(async g => ({
    title: g.title,
    files: g.files || await folderFiles(g.folder, { match: g.match, newestFirst: g.newestFirst }),
  })));
}

// At most `n` at a time, so a shelf does not fire sixty requests at once.
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

const fileName = path => path.split('/').pop();

// Each file with its title and last change. A file that cannot be read is dropped.
export async function describe(files) {
  const out = await pool(files, 6, async f => {
    const [doc, changed] = await Promise.all([data.doc('/' + f.path), data.lastChange(f.path)]);
    if (!doc) return null;
    return { ...f, title: doc.title || fileName(f.path), changed, doc };
  });
  return out.filter(Boolean);
}

// Every file any shelf shows, newest change first (the home page's "Recently changed").
export async function allShelfFiles() {
  const lists = await Promise.all(PAGES.filter(p => p.folder).map(async p =>
    (await folderFiles(p.folder, { pin: p.pin })).map(f => ({ ...f, key: p.key, page: p.label }))));
  const groups = await chantierGroups();
  const chantier = groups.flatMap(g => g.files.map(f => ({ ...f, key: 'chantier', page: 'Chantier' })));
  const seen = new Set();
  return [...lists.flat(), ...chantier].filter(f => !seen.has(f.path) && seen.add(f.path));
}
