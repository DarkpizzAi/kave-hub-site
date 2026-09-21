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
    renderDocCards(container, doc, { skipCode: true, skipIntro: true });
  }
}
