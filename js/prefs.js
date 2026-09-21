// Per-app preferences. Palette is a per-app choice and is not shared with
// Spoon: the keys are this site's own, prefixed hubweb:.

const PALETTE_KEY = 'hubweb:palette';
const WHO_KEY = 'hubweb:who';

export const PALETTES = ['cobalt', 'amber', 'chartreuse'];
// Route keys of the two person pages. Structural only; names come from the private repo.
export const WHO = ['hugo', 'isa'];

function read(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
}

export function getPalette() {
  const p = read(PALETTE_KEY);
  return PALETTES.includes(p) ? p : 'cobalt';
}

export function applyPalette(root = document.documentElement) {
  const p = getPalette();
  if (p === 'cobalt') delete root.dataset.palette;
  else root.dataset.palette = p;
}

export function setPalette(p) {
  if (!PALETTES.includes(p)) return false;
  write(PALETTE_KEY, p);
  applyPalette();
  return true;
}

export function getWho() {
  const w = read(WHO_KEY);
  return WHO.includes(w) ? w : null;
}

export function setWho(w) {
  if (!WHO.includes(w)) return false;
  write(WHO_KEY, w);
  return true;
}
