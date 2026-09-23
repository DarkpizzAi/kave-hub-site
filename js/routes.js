// The site's pages: one explicit list, in menu order, so the menu never depends
// on the private repo's plugin manifest. Labels render lowercase through CSS.
// An intro is the one line under a page's first card; none for home page,
// settings, spoon and calendar (the two apps are tablet frames, not sheets).

export const SECTIONS = ['pages', 'apps'];

export const PAGES = [
  { key: 'home', label: 'home page', href: '#/', section: 'pages', glyph: 'home' },
  { key: 'our-house', label: 'our house', href: '#/our-house', section: 'pages', glyph: 'our-house',
    intro: 'Where we live: plants, the move, and interior design ideas.' },
  { key: 'finance', label: 'finance', href: '#/finance', section: 'pages', glyph: 'finance',
    intro: 'Shared budget and bills.' },
  { key: 'hugo', label: 'hugo', href: '#/hugo', section: 'pages', glyph: 'hugo',
    intro: "Hugo's stuff, tbc." },
  { key: 'fun', label: 'fun', href: '#/fun', section: 'pages', glyph: 'fun',
    intro: 'Video games and board games.' },
  { key: 'brand', label: 'brand', href: '#/brand', section: 'pages', glyph: 'brand',
    intro: 'Our fonts and colours, so every app looks like one family.' },
  { key: 'chantier', label: 'chantier', href: '#/chantier', section: 'pages', glyph: 'chantier',
    intro: 'How we build this hub: infrastructure, local layout, and the delivery log.' },
  { key: 'security', label: 'security', href: '#/security', section: 'pages', glyph: 'security',
    intro: 'The weekly security scan and the ranked recommendations. Everything here is masked.' },
  { key: 'settings', label: 'settings', href: '#/settings', section: 'pages', glyph: 'settings' },
  { key: 'spoon', label: 'spoon', href: '#/spoon', section: 'apps', glyph: 'spoon' },
  // Compass will take this slot; a blank tablet says so until it lands.
  { key: 'calendar', label: 'calendar', href: '#/calendar', section: 'apps', glyph: 'calendar' },
];

// First segment of an old address -> where it lives now. '' means the home page.
const MOVED = {
  household: 'our-house',
  house: 'our-house',
  money: 'finance',
  design: 'brand',
  food: 'spoon',
  isa: '',
  infrastructure: 'chantier',
};

function segments(hash) {
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function redirectFor(hash) {
  const parts = segments(hash);
  if (!parts.length) return null;
  if (parts[0] === 'household' && parts[1] === 'infrastructure') return '#/chantier';
  if (!Object.prototype.hasOwnProperty.call(MOVED, parts[0])) return null;
  const to = MOVED[parts[0]];
  if (to === '' || parts[0] === 'infrastructure') return to === '' ? '#/' : '#/' + to;
  return '#/' + [to, ...parts.slice(1)].join('/');
}

export function keyFor(hash) {
  const parts = segments(hash);
  return parts.length ? parts[0] : 'home';
}

export function introFor(key) {
  const p = PAGES.find(x => x.key === key);
  return p && p.intro ? p.intro : null;
}
