// Freehold record lifecycle behind the SimContext seam: the ONE load path, the
// persistence snapshot and the sanctioned evict over the live ctx.freeholds map
// (owner key -> FreeholdState, D16), on the guild_bank.ts loadGuildBank /
// serializeGuildBank / evictGuildBank idiom. Pure shape-in and shape-out: the
// server owns every row read and write (07) and this module never sees SQL,
// draws no rng and reads no clock.

import type { SimContext } from '../sim_context';
import type { FreeholdLayoutView, FreeholdPlotId, FreeholdState, FreeholdView } from './types';

/** Every account's default record: the free tier-0 Inn Room with nothing
 *  placed, full condition, unstamped day counters, no prepaid weeks, closed to
 *  visitors, not decorating, at revision 0. 05 hands one to every account that
 *  owns no plot yet; 07 persists it without changing its identity. */
export function defaultFreeholdState(ownerKey: string, plotId: FreeholdPlotId): FreeholdState {
  return {
    ownerKey,
    plotId,
    tier: 'inn_room',
    layout: [],
    trophies: [],
    condition: 100,
    conditionStampDay: 0,
    ledgerPaidThroughDay: 0,
    ledgerPrepaidWeeks: 0,
    visitPolicy: 'closed',
    isDecorating: false,
    rev: 0,
  };
}

// Value copy of a record, so a loaded record never aliases the caller's object
// and a serialized snapshot never aliases the live one (the cloneInvSlot rule
// of the guild bank, applied to the two row arrays).
function cloneFreeholdState(state: FreeholdState): FreeholdState {
  return {
    ...state,
    layout: state.layout.map((row) => ({ ...row })),
    trophies: state.trophies.map((trophy) => ({ ...trophy })),
  };
}

/** The caller's own freehold as the PUBLIC descriptor: opaque plot identity,
 *  tier and visit policy, never the owner key. Null until 05 lights the claim
 *  and gives this a record to project. It is a real module function rather
 *  than a `return null` on the Sim so that lighting it is an edit HERE, not a
 *  growing getter body inside the zero-slack sim.ts coordinator. */
export function myFreeholdView(ctx: SimContext, pid: number): FreeholdView | null {
  void ctx;
  void pid;
  return null;
}

/** The furnishing layout of the freehold the caller stands in, one row per
 *  placement. Null until 08a publishes it; same delegate rationale as above. */
export function freeholdLayoutView(ctx: SimContext, pid: number): FreeholdLayoutView | null {
  void ctx;
  void pid;
  return null;
}

/** Install an owner's record through the ONE load path. LOAD-ONCE like
 *  loadGuildBank: an owner whose record is already live is skipped, because
 *  overwriting it would drop placements not yet flushed by 07; to reload,
 *  evict first. An empty owner key is ignored so a malformed row can never
 *  create a keyless record. The live record is a value copy of `state` whose
 *  ownerKey is the map key, so the two can never disagree. */
export function loadFreehold(ctx: SimContext, ownerKey: string, state: FreeholdState): void {
  if (ownerKey === '') return;
  if (ctx.freeholds.has(ownerKey)) return;
  const live = cloneFreeholdState(state);
  live.ownerKey = ownerKey;
  ctx.freeholds.set(ownerKey, live);
}

/** Snapshot an owner's record for persistence, as a value copy. Null means the
 *  owner has NO live record: the persistence caller must skip the write, never
 *  persist a default over a real row. 07 decides which of the remaining fields
 *  reach the row.
 *
 *  `isDecorating` is EPHEMERAL BUILD PRESENCE (C03) and is neutralized to false
 *  HERE rather than left to the caller: presence is a live, per-session fact
 *  that must never save to SQL or JSON, and a snapshot taken while an owner is
 *  mid-edit would otherwise carry a true through whatever 07 writes and reload
 *  a decorating flag nobody is holding. Making the boundary mechanical means a
 *  later persistence caller cannot forget it, and the public boolean 08a
 *  publishes is always explicitly false on a freshly loaded record. */
export function serializeFreehold(ctx: SimContext, ownerKey: string): FreeholdState | null {
  const state = ctx.freeholds.get(ownerKey);
  if (!state) return null;
  const snapshot = cloneFreeholdState(state);
  snapshot.isDecorating = false;
  return snapshot;
}

/** The SANCTIONED evict: drop an owner's record from the live map, the first
 *  half of the evict-then-load reload path and the account-lifecycle path 07b
 *  owns. Callers never hold a record reference across an evict. */
export function evictFreehold(ctx: SimContext, ownerKey: string): void {
  ctx.freeholds.delete(ownerKey);
}
