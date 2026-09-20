// Fun: board game picker rendered as cards. The better your rating, the
// nicer the card (4 stars gets an accent border, 5 stars gets the gold
// treatment). Plus the wishlist and resources.

import * as data from '../data.js';
import { findSection, firstTable, inline } from '../md.js';
import { pixelEmoji, gameEmoji } from '../icons.js';
import { el, card, header, chip, emptyNote, selectBox } from '../ui.js';

function range(s) {
  const m = (s || '').match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [+m[1], +m[2]];
  const one = (s || '').match(/(\d+)/);
  if (one) return [+one[1], +one[1]];
  return [null, null];
}

function stars(s) {
  return ((s || '').match(/⭐/g) || []).length;
}

function gameCard(g) {
  const c = el('div', { class: 'game s' + g.stars });
  c.append(el('h3', {}, pixelEmoji(gameEmoji(g.name), 36), g.name));
  if (g.stars) c.append(el('div', { class: 'stars' }, '⭐'.repeat(g.stars)));
  const meta = el('div', { class: 'gmeta' });
  if (g.playersTxt) meta.append(chip(g.playersTxt + ' players'));
  if (g.durTxt) meta.append(chip(g.durTxt));
  if (g.complexity) meta.append(chip('complexity ' + '★'.repeat(g.complexity)));
  if (g.bgg && g.bgg !== '-') meta.append(chip('BGG ' + g.bgg));
  c.append(meta);
  return c;
}

export default async function fun(container) {
  container.append(header('fun', 'Board games'));

  const bg = await data.doc('/fun/data/board-games.md');
  if (!bg) { container.append(emptyNote()); return; }

  const coll = findSection(bg, /collection/i);
  const t = firstTable(coll);
  if (t) {
    const idx = re => t.headers.findIndex(h => re.test(h));
    const iName = idx(/jeu|game/i), iPl = idx(/joueur|player/i), iDur = idx(/dur/i),
      iCx = idx(/complex/i), iNote = idx(/ma note/i), iBgg = idx(/bgg/i);
    const games = t.rows.map(r => {
      const [pmin, pmax] = range(r[iPl]);
      const [dmin, dmax] = range(r[iDur]);
      return {
        name: r[iName], playersTxt: r[iPl], durTxt: r[iDur],
        pmin, pmax, dmin, dmax,
        complexity: stars(r[iCx]), stars: stars(r[iNote]), bgg: r[iBgg],
      };
    }).sort((a, b) => b.stars - a.stars);

    const state = { players: '', dur: '' };
    const grid = el('div', { class: 'games' });
    const count = el('span', { class: 'sub' });

    function apply() {
      grid.innerHTML = '';
      const p = state.players ? +state.players : null;
      const shown = games.filter(g => {
        if (p && (g.pmin == null || p < g.pmin || p > g.pmax)) return false;
        if (state.dur === 'short' && !(g.dmax != null && g.dmax <= 30)) return false;
        if (state.dur === 'mid' && !(g.dmin != null && g.dmin <= 60 && g.dmax >= 30)) return false;
        if (state.dur === 'long' && !(g.dmax != null && g.dmax >= 60)) return false;
        return true;
      });
      for (const g of shown) grid.append(gameCard(g));
      count.textContent = `${shown.length} of ${games.length} games`;
      if (!shown.length) grid.append(emptyNote('No game matches.'));
    }

    const controls = el('div', { class: 'controls' },
      selectBox('Players', [{ value: '', label: 'Any' },
        ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: String(n), label: String(n) }))],
        v => { state.players = v; apply(); }),
      selectBox('Time', [
        { value: '', label: 'Any' },
        { value: 'short', label: '30 min or less' },
        { value: 'mid', label: '30-60 min' },
        { value: 'long', label: '60 min and more' },
      ], v => { state.dur = v; apply(); }),
      count);

    container.append(el('h2', {}, 'Tonight we play'), controls, grid);
    apply();
  }

  for (const re of [/envies|wishlist/i, /ressources|resources/i]) {
    const s = findSection(bg, re);
    if (!s) continue;
    const c = card(s.heading);
    for (const b of s.blocks) {
      if (b.kind === 'list') {
        const ul = el('ul', { class: 'plain' });
        for (const it of b.items) ul.append(el('li', { html: inline(it.text) }));
        c.append(ul);
      }
    }
    container.append(c);
  }
}
