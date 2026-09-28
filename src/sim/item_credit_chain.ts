// The one step every found-item walk takes: the id a found item ALSO credits.
// A heroic variant credits its base (content/heroic_variants.ts) and a relicOf
// tier its piece (content/hoard_loot.ts); a furnishing credits nothing past
// itself, whatever its def names. Three walks share it, so they cannot drift:
// markItemDiscovered (deeds.ts), the Reliquary obtain tally (reliquary.ts) and
// the Buried Hoard grant's save projection (rift/hoard_reward_save.ts), which
// also read each def the same guarded way (creditDef).

import type { ItemDef } from './types';

/** The def the walk reads for `id`: an own entry of `items` only, so a
 *  tampered id like '__proto__' or 'toString' reads nothing rather than an
 *  inherited value. */
export function creditDef(
  items: Readonly<Record<string, ItemDef>>,
  id: string,
): ItemDef | undefined {
  return Object.hasOwn(items, id) ? items[id] : undefined;
}

/** The id a found `def` also credits, or undefined where the walk stops. */
export function creditedParentId(def: ItemDef): string | undefined {
  return def.kind === 'furnishing' ? undefined : (def.heroicOf ?? def.relicOf);
}

/** True when `def` credits its parent as a relicOf TIER: the tier's quality is
 *  its own, so the piece it credits must not mark the tier's quality again. */
export function creditsViaTier(def: ItemDef): boolean {
  return def.heroicOf === undefined && def.relicOf !== undefined;
}
