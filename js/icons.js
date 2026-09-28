// Retro pixel icons: an emoji drawn on a tiny canvas, upscaled without
// smoothing for a pixelised look. No image assets, works offline.

export function pixelEmoji(emoji, size = 48, grid = 16) {
  const small = document.createElement('canvas');
  small.width = grid; small.height = grid;
  const sctx = small.getContext('2d');
  sctx.font = (grid - 2) + 'px "Segoe UI Emoji", "Apple Color Emoji", serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText(emoji, grid / 2, grid / 2 + 1);
  const out = document.createElement('canvas');
  out.width = size; out.height = size;
  out.style.width = out.style.height = size + 'px';
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(small, 0, 0, size, size);
  out.className = 'pix';
  return out;
}

const strip = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function match(pairs, name) {
  const n = strip(name);
  for (const [kw, e] of pairs) if (n.includes(kw)) return e;
  return null;
}

// Order matters: first match wins ("azul duel" before "azul").
const GAMES = [
  ['azul duel', '\u{1F536}'], ['azul', '\u{1F537}'],
  ['libertalia', '\u{1F3F4}\u{200D}\u{2620}\u{FE0F}'],
  ['king of tokyo', '\u{1F996}'],
  ['splendor', '\u{1F48E}'],
  ['dixit', '\u{1F407}'],
  ['oriflamme', '\u{1F451}'],
  ['arnak', '\u{1F5FF}'],
  ['catan', '\u{1F411}'],
  ['7 wonders', '\u{1F3DB}\u{FE0F}'],
  ['harmonies', '\u{1F99C}'],
  ['love letter', '\u{1F48C}'],
  ['burrito', '\u{1F32F}'],
  ['6 qui prend', '\u{1F42E}'],
  ['codex', '\u{1F344}'],
  ['gang of 4', '\u{1F004}'],
  ['cubirds', '\u{1F426}'],
  ['jungle speed', '\u{1FAB5}'],
  ['crack list', '\u{1F4DD}'],
  ['everdell', '\u{1F333}'], ['ark nova', '\u{1F981}'], ['brass', '\u{1F3ED}'],
  ['dune', '\u{1F3DC}\u{FE0F}'], ['furnace', '\u{1F525}'], ['druids', '\u{1F9D9}'],
];
export function gameEmoji(name) {
  return match(GAMES, name) || '\u{1F3B2}';
}

const BILLS = [
  ['rent', '\u{1F3E0}'], ['loyer', '\u{1F3E0}'], ['bizum', '\u{1F3E0}'],
  ['kindle', '\u{1F4DA}'],
  ['uber', '\u{1F6F5}'],
  ['irpf', '\u{1F9FE}'], ['tax', '\u{1F9FE}'], ['impot', '\u{1F9FE}'],
  ['internet', '\u{1F4F6}'], ['wifi', '\u{1F4F6}'],
  ['electric', '\u{26A1}'], ['eau', '\u{1F4A7}'], ['water', '\u{1F4A7}'],
  ['stream', '\u{1F4FA}'], ['netflix', '\u{1F4FA}'],
];
export function billEmoji(name) {
  return match(BILLS, name) || '\u{1F4B6}';
}
