// Outline glyphs from Tabler Icons (MIT licence, https://tabler.io/icons),
// inlined as path data so the CSP needs no icon font and no external request.
// 24 by 24 grid, 2px stroke. Built with createElementNS, never innerHTML.

const USER = ['M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0', 'M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2'];

const GLYPHS = {
  home: ['M5 12l-2 0l9 -9l9 9l-2 0', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7', 'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6'],
  spoon: ['M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3'],
  'our-house': ['M2 9a10 10 0 1 0 20 0', 'M12 19a10 10 0 0 1 10 -10', 'M2 9a10 10 0 0 1 10 10', 'M12 4a9.7 9.7 0 0 1 2.99 7.5', 'M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5'],
  calendar: ['M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z', 'M16 3v4', 'M8 3v4', 'M4 11h16', 'M11 15h1', 'M12 15v3'],
  finance: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1', 'M12 7v10'],
  fun: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M9 9l.01 0', 'M15 9l.01 0', 'M8 13a4 4 0 1 0 8 0h-8'],
  hugo: USER,
  chantier: ['M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4', 'M14.5 5.5l4 4', 'M12 8l-5 -5l-4 4l5 5', 'M7 8l-1.5 1.5', 'M16 12l5 5l-4 4l-5 -5', 'M16 17l-1.5 1.5'],
  brand: ['M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25', 'M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'],
  security: ['M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3'],
  settings: ['M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z', 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'],
  generic: ['M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z', 'M14 7l6 0', 'M17 4l0 6'],
  chevron: ['M6 9l6 6l6 -6'],
  arrow: ['M5 12l14 0', 'M13 18l6 -6', 'M13 6l6 6'],

  // Plants: generic line-art stand-ins, not real illustrations of the
  // specific varieties (see the "Plants" section note in our-house.js).
  cactus: ['M7 21h10', 'M10 21v-11a2 2 0 0 1 4 0v11', 'M10 14h-2a2 2 0 0 1 -2 -2v-3', 'M14 11h2a2 2 0 0 0 2 -2v-2'],
  dracaena: ['M8 21h8', 'M12 21v-10', 'M12 11v-8', 'M12 11l-4 -6', 'M12 11l4 -6', 'M12 11l-2 -7', 'M12 11l2 -7'],
  alocasia: ['M8 21h8', 'M12 21v-8', 'M12 13c-4 -1 -6 -5 -3 -8c2 -2 4 0 3 3c-1 -3 1 -5 3 -3c3 3 1 7 -3 8z'],
  pothos: ['M6 8h12', 'M8 8c0 4 -2 6 -1 10', 'M16 8c0 3 2 5 1 9', 'M7.5 12c1 -1 2 -1 2 0c0 1 -1 1 -2 0', 'M15.5 15c1 -1 2 -1 2 0c0 1 -1 1 -2 0'],
  pachira: ['M12 21v-7', 'M12 14v-6', 'M12 14l-3 -5', 'M12 14l3 -5', 'M12 14l-1.5 -6', 'M12 14l1.5 -6'],
  'olive-tree': ['M8 21h8', 'M12 21v-6', 'M12 15m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0'],
  'lemon-tree': ['M8 21h8', 'M12 21v-6', 'M12 15m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0', 'M15 12m-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0'],
};

const NS = 'http://www.w3.org/2000/svg';

export function hasGlyph(key) {
  return Object.prototype.hasOwnProperty.call(GLYPHS, key);
}

export function glyph(key, size = 24) {
  const paths = hasGlyph(key) ? GLYPHS[key] : GLYPHS.generic;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'glyph');
  for (const d of paths) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}
