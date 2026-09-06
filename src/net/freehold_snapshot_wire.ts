// Strict decode for the owner-only housing self snapshot keys, plus the one
// application function ClientWorld calls per snapshot. THE ONLY DECODE HOME
// FOR HOUSING SELF KEYS: online.ts gets one import and one call beside
// applyBankSelfWire, and every later producer (the descriptor, 05; the layout
// and transition id, 08a) admits its key HERE, never inline in applySnapshot.
// Kept ClientWorld-free (the bank_snapshot_wire.ts shape) so malformed or
// version-skewed frames can be judged without growing online.ts or partially
// replacing a good mirror.
//
// The allowlist is EMPTY on purpose: no housing key crosses the wire yet, so
// every mirror stays at its null default. The strict-decode rule still holds
// from the start: an unknown self-key OBJECT is ignored (later, rejected with
// the mirror retained), never a reason to reject the whole frame, so a server
// that starts publishing a housing key ahead of this client leaves the rest
// of the snapshot intact.
//
// applyWithDecoders is the walk itself, exported ONLY as the test seam: with
// the production allowlist empty nothing can reach the loop through
// applyFreeholdSelfWire, so the suite drives the walk with a fake admitted
// key to hold the omission and allowlist rules still. Production code calls
// applyFreeholdSelfWire and never the seam.

import type { FreeholdLayoutView, FreeholdView } from '../sim/freehold/types';

/** Compile-time exhaustiveness arm (the bank_snapshot_wire.ts idiom). */
type AssertNever<T extends never> = T;

/** The housing mirrors ClientWorld keeps; the concrete ClientWorld satisfies
 *  this structurally. All three are null until a producer publishes them. */
export interface FreeholdSelfMirrors {
  myFreehold: FreeholdView | null;
  freeholdLayout: FreeholdLayoutView | null;
  /** The last accepted freehold transition id, echoed on the build-presence
   *  frame. A ClientWorld-only mirror today: it is no IWorldHousing member
   *  and the Sim keeps no counterpart. The moment a consumer reads it, it
   *  lands on IWorldHousing and on BOTH hosts in the same change, with the
   *  parity pin moved alongside. */
  freeholdTransitionId: string | null;
}

/** One strict decoder per admitted wire key: judges the raw self value and
 *  writes the matching mirror on `target` only when the value is valid
 *  (malformed RETAINS the last good mirror, the bank idiom); never throws. */
export type FreeholdSelfDecoder = (target: FreeholdSelfMirrors, value: unknown) => void;

// The decoder table and the allowlist are bound both ways: a key listed
// without a decoder fails the `satisfies` on the list, and a decoder added
// without listing its key fails the exhaustiveness arm. Both are empty until
// the first producer lands, and a fill adds its entry to each in one change.
const FREEHOLD_SELF_DECODERS = {} as const satisfies Readonly<Record<string, FreeholdSelfDecoder>>;

/** The admitted housing self keys. EMPTY: nothing housing-shaped is decoded
 *  from a self frame yet, so applyFreeholdSelfWire leaves every mirror as it
 *  found it whatever the frame carries. */
export const FREEHOLD_SELF_KEYS =
  [] as const satisfies readonly (keyof typeof FREEHOLD_SELF_DECODERS)[];
type _EveryDecoderAdmitted = AssertNever<
  Exclude<keyof typeof FREEHOLD_SELF_DECODERS, (typeof FREEHOLD_SELF_KEYS)[number]>
>;

// Widened once so the walk below type-checks over the empty tuple; the
// bindings above are what keep the two in step, not these views.
const ADMITTED_KEYS: readonly string[] = FREEHOLD_SELF_KEYS;
const DECODER_BY_KEY: Readonly<Record<string, FreeholdSelfDecoder | undefined>> =
  FREEHOLD_SELF_DECODERS;

/** Apply the admitted housing self keys from one snapshot self record. Every
 *  housing key is delta-omitted: an omitted key means UNCHANGED, never "no
 *  freehold", so omission must not wipe a mirror, and only a value the key's
 *  strict decoder accepts may replace one. A key the allowlist does not admit
 *  is left alone, whatever shape it carries. */
export function applyFreeholdSelfWire(
  target: FreeholdSelfMirrors,
  self: Readonly<Record<string, unknown>>,
): void {
  applyWithDecoders(target, self, ADMITTED_KEYS, DECODER_BY_KEY);
}

/** The decode walk, parameterised on the admitted key list and the decoder
 *  table (THE TEST SEAM, see the header). For each admitted key an omitted
 *  value (undefined) is skipped as UNCHANGED, and any present value, null
 *  included, is handed to that key's decoder to judge; a key outside `keys`
 *  is never looked at, whatever the frame carries under it, and an admitted
 *  key with no decoder is skipped rather than thrown on. */
export function applyWithDecoders(
  target: FreeholdSelfMirrors,
  self: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  decoders: Readonly<Record<string, FreeholdSelfDecoder | undefined>>,
): void {
  for (const key of keys) {
    const value = self[key];
    if (value === undefined) continue;
    decoders[key]?.(target, value);
  }
}
