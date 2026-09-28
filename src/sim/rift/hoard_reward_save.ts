// Persist the collection half of a direct vault grant in the same character
// blob as its inventory. The live grant still emits events and syncs account
// deeds after commit; a crash before autosave must not lose the find itself.

import type { CharacterState } from '../character_state';
import { ITEMS } from '../data';
import { restoreDeedStats, serializeDeedStats } from '../deeds';
import { creditDef, creditedParentId, creditsViaTier } from '../item_credit_chain';
import {
  noteRelicItemFind,
  noteRelicObtain,
  restoreReliquaryState,
  serializeReliquaryState,
} from '../reliquary';
import type { ItemDef } from '../types';

export function projectHoardRewardCollections(
  state: CharacterState,
  items: readonly Readonly<{ itemId: string; count: number }>[],
): void {
  if (items.length === 0) return;
  const deedStats = restoreDeedStats(state.deedStats);
  const reliquary = restoreReliquaryState(state.reliquary);
  const meta = { deedStats, reliquary, delveClears: state.delveClears ?? {} };

  for (const item of items) {
    let id: string | undefined = item.itemId;
    let viaTier = false;
    // The same capped walk and quality rule as the real markItemDiscovered hub,
    // through the step both share (item_credit_chain.ts), so a furnishing stops
    // here too. Its event/deed side effects run on the live Sim.
    for (let depth = 0; id !== undefined && depth < 3; depth++) {
      const def: ItemDef | undefined = creditDef(ITEMS, id);
      if (!def) break;
      if (!deedStats.itemsDiscovered.has(id)) {
        deedStats.itemsDiscovered.add(id);
        noteRelicItemFind(meta, id);
      }
      const quality = def.quality;
      if (!viaTier && (quality === 'rare' || quality === 'epic' || quality === 'legendary')) {
        deedStats.visited.add(`quality:${quality}`);
      }
      viaTier = creditsViaTier(def);
      id = creditedParentId(def);
    }
    noteRelicObtain(meta, item.itemId, item.count);
  }

  const savedStats = serializeDeedStats(deedStats);
  if (savedStats) state.deedStats = savedStats;
  const savedReliquary = serializeReliquaryState(reliquary);
  if (savedReliquary) state.reliquary = savedReliquary;
}
