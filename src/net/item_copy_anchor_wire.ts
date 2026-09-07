import type { NamedSlotTarget } from '../sim/item_copy_ref';

// The two wire fields a per-copy selection's ANCHOR rides on (`ord`/`n`), or
// nothing at all when the caller named no anchor. Spread into the frame so an
// unanchored command is byte-identical to what it always sent, which is what
// keeps the golden traces still and an older server working unchanged; the
// server re-derives the anchor against its own bags and refuses a mismatch
// (src/sim/item_copy_anchor.ts).
export function anchorFields(target: NamedSlotTarget): { ord?: number; n?: number } {
  return target.anchor ? { ord: target.anchor.ordinal, n: target.anchor.count } : {};
}
