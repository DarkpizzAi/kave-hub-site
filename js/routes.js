// The site's pages, in menu order. Structure only: the content is the private
// repo's files, read live, so nothing here can go stale (Isa, 06/11/2026).
//
// rail: the six everyday pages on the navigation rail. more: behind the
// scenes, in the menu drawer only. A shelf page lists one folder's md files
// (pinned ones first, then the rest by name) and shows the picked one.

export const OWNER_URL = 'https://github.com/DarkpizzAi/kave-hub/blob/main/';

export const PAGES = [
  { key: 'home', label: 'Home', icon: 'home', place: 'rail', layout: 'one' },
  { key: 'our-house', label: 'Our house', icon: 'cottage', place: 'rail', layout: 'shelf', folder: 'our-house/data', pin: ['plan.md', 'todo.md', 'wishes.md'] },
  { key: 'finance', label: 'Finance', icon: 'account_balance_wallet', place: 'rail', layout: 'shelf', folder: 'finance/data', pin: ['budget.md', 'recurring-bills.md'] },
  { key: 'hugo', label: 'Hugo', icon: 'person', place: 'rail', layout: 'shelf', folder: 'hugo/data', pin: ['admin.md', 'targets.md'] },
  { key: 'food', label: 'Food', icon: 'restaurant', place: 'rail', layout: 'shelf', folder: 'food/data', pin: ['grocery-staples.md', 'kitchen-equipment.md'] },
  { key: 'fun', label: 'Fun', icon: 'casino', place: 'rail', layout: 'shelf', folder: 'fun/data', pin: ['board-games.md', 'video-games.md'] },
  { key: 'brand', label: 'Brand', icon: 'palette', place: 'more', layout: 'wide' },
  { key: 'chantier', label: 'Chantier', icon: 'construction', place: 'more', layout: 'shelf' },
  { key: 'security', label: 'Security', icon: 'shield', place: 'more', layout: 'one' },
  { key: 'settings', label: 'Settings', icon: 'settings', place: 'more', layout: 'one' },
];

export const APPS = [
  { label: 'Ladle', icon: 'soup_kitchen', href: 'https://darkpizzai.github.io/kave-food-app/' },
  { label: 'Compass', icon: 'explore', href: 'https://darkpizzai.github.io/kave-calendar-app/' },
  { label: 'Stash', icon: 'savings', href: 'https://darkpizzai.github.io/kave-finance-app/' },
];

// Chantier: one shelf in groups. A group is a folder (with a filter) or a
// fixed list of files; roadmaps are every plugin's data/roadmap.md.
export const CHANTIER = [
  { title: 'Roadmaps', files: ['calendar', 'food', 'finance', 'hub', 'our-house', 'brand', 'fun', 'hugo', 'chantier']
      .map(p => ({ path: `${p}/data/roadmap.md`, sub: `${p}/data` })) },
  { title: 'Designs', folder: 'docs/superpowers/specs', newestFirst: true },
  { title: 'Handoffs', folder: 'calendar/data', match: /handoff/i, newestFirst: true },
  { title: 'How it runs', files: ['chantier/data/log.md', 'chantier/data/infrastructure.md', 'chantier/data/routines.md',
      'chantier/data/data-locations.md', 'chantier/data/local-layout.md', 'chantier/data/inbound-cutover.md', 'chantier/data/gmail-setup.md']
      .map(path => ({ path })) },
];

// Old addresses -> where they live now ('' is the home page).
const MOVED = { household: 'our-house', house: 'our-house', money: 'finance', design: 'brand',
  infrastructure: 'chantier', spoon: '', calendar: '', stash: '', compass: '', isa: '' };

function segments(hash) {
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function parseHash(hash) {
  const [key = 'home', ...rest] = segments(hash);
  return { key, file: rest.join('/') || null };
}

export function redirectFor(hash) {
  const parts = segments(hash);
  if (!parts.length || !Object.prototype.hasOwnProperty.call(MOVED, parts[0])) return null;
  const to = MOVED[parts[0]];
  return to ? '#/' + [to, ...parts.slice(1)].join('/') : '#/';
}

export const pageFor = key => PAGES.find(p => p.key === key) || null;

// A file's address on the site: its shelf page and its path.
export function hrefFor(key, path) {
  return '#/' + key + '/' + path.split('/').map(encodeURIComponent).join('/');
}

// Which shelf shows a repo path, if any.
export function shelfOf(path) {
  const p = path.replace(/^\/+/, '');
  for (const page of PAGES) {
    if (page.folder && p.startsWith(page.folder + '/') && !p.slice(page.folder.length + 1).includes('/')) return page.key;
  }
  for (const g of CHANTIER) {
    if (g.files && g.files.some(f => f.path === p)) return 'chantier';
    if (g.folder && p.startsWith(g.folder + '/') && (!g.match || g.match.test(p))) return 'chantier';
  }
  return null;
}
