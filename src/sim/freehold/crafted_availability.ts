// Catalog identities stay stable on every host; acquiring new crafted decor
// requires the host's existing housing opt-in.
import { FREEHOLD_CRAFTED_FURNISHING_IDS } from '../content/freehold';

const CRAFTED_ITEM_IDS: ReadonlySet<string> = new Set(
  FREEHOLD_CRAFTED_FURNISHING_IDS.flatMap((id) => [id, `pattern_${id}`]),
);

export function isFreeholdCraftAvailable(enabled: boolean, itemId: string): boolean {
  return enabled || !CRAFTED_ITEM_IDS.has(itemId);
}
