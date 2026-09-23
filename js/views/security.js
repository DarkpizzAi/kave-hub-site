// Security: the weekly scan first, then the ranked recommendations. Both files
// are masked at the source (no name, number or value is ever written in them),
// and both live in the chantier plugin's data folder.

import * as data from '../data.js';
import { card, emptyNote, renderBlocks, renderDocCards } from '../ui.js';

export const SECURITY_FILES = ['security-report.md', 'security-recommendations.md'];

export default async function security(container) {
  for (const f of SECURITY_FILES) {
    const doc = await data.doc('/chantier/data/' + f);
    if (!doc) { container.append(emptyNote('chantier/data/' + f + ' is missing.')); continue; }

    // The lines under the title (for the scan, the result) get a card of their own.
    const intro = doc.sections.find(s => s.level === 0);
    if (intro && intro.blocks.length) {
      const c = card(doc.title || f);
      renderBlocks(c, intro.blocks, { skipCode: true });
      container.append(c);
    }
    const before = container.children.length;
    renderDocCards(container, doc, { skipCode: true, skipIntro: true });
    // The numbered recommendation headings are legitimate subtitles but too
    // many and too repetitive a set to want in the sidebar.
    if (f === 'security-recommendations.md') {
      for (let i = before; i < container.children.length; i++) {
        const sec = container.children[i];
        if (/^\d+\./.test(sec.querySelector('.tab-section-title')?.textContent || '')) {
          sec.classList.add('no-toc');
        }
      }
    }
  }

  // data-locations.md: the two-zone rule and the register, after the scan
  // and recommendations.
  const locDoc = await data.doc('/chantier/data/data-locations.md');
  if (locDoc) renderDocCards(container, locDoc, { skipCode: true });
}
