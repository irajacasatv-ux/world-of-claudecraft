// Freehold record lifecycle behind the SimContext seam: the ONE load path, the
// default-record seed at join, the ONE tier writer, the persistence snapshot
// and the sanctioned evict over the live ctx.freeholds map (owner key ->
// FreeholdState, D16), on the guild_bank.ts loadGuildBank / serializeGuildBank
// / evictGuildBank idiom. THIS IS THE ONLY FILE THAT WRITES ctx.freeholds or a
// record's tier, and the only writer of the host owner stamp on PlayerMeta.
// Pure shape-in and shape-out: the server owns every row read and write (07)
// and this module never sees SQL, draws no rng and reads no clock.
//
// THE FLAG IS HONORED BY THE TWO RECORD INSERTERS, mechanically: loadFreehold
// and ensureFreeholdRecord insert nothing on a dark host (ctx.freeholdsEnabled
// false), so no caller, the join seed today or a persistence loader later, can
// seed a dark realm. That is what lets every other body skip the flag: a dark
// host holds no record, and every enter answers `no_freehold`.

import { freeholdTierById } from '../content/freehold';
import type { SimContext } from '../sim_context';
import { type FreeholdOwnerStampSlice, freeholdOwnerKeyOfMeta } from './owner_key';
import {
  asFreeholdPlotId,
  type FreeholdLayoutView,
  type FreeholdPlotId,
  type FreeholdState,
  type FreeholdTier,
  type FreeholdView,
} from './types';

/** The in-memory stand-in plot identity a FRESHLY SEEDED record carries. A
 *  record installed from a durable row carries the ROW's minted id instead
 *  (freeholdStateFromPersisted, then loadFreehold below), and so does one
 *  installed on the ABSENT arm of a durable load, which carries the id the store
 *  minted for the row it is about to insert (server/freehold_install.ts). So
 *  ONLINE this is what a record answers to only in the window before an install,
 *  or after an eviction that no install follows, which is precisely the reseeded
 *  default the write seal exists to refuse (server/freehold_write_seal.ts).
 *  OFFLINE AND HEADLESS there is no store and no minter, so it is what every
 *  record answers to, always. That divergence is ACCEPTED and recorded in
 *  docs/freeholds/persistence-rollout-contract.md section 8a and in this
 *  directory's CLAUDE.md: a later consumer that keys on plotId owes those hosts
 *  a minter first. A fixed literal:
 *  it never contains the owner key or an account id (the brand in types.ts keeps
 *  a plain string, and so an owner key, from reaching a plot id by assignment;
 *  the constructor itself is a convention, as types.ts says), and it stays
 *  inside the charset server/freehold_wire.ts admits. */
export const PENDING_FREEHOLD_PLOT_ID: FreeholdPlotId = asFreeholdPlotId('plot:unassigned');

/** The ONE writer of the host-stamped owner key on PlayerMeta (the
 *  applyBankBonusStamp shape: a structural slice, never the whole meta).
 *  Called once, from addPlayer through seedFreeholdOnJoin, with the server's
 *  `account:<id>`; an offline host never calls it and the key falls back to
 *  `entity:<pid>` at read time (owner_key.ts). An empty key is ignored, the
 *  way loadFreehold and ensureFreeholdRecord ignore it, so a malformed host
 *  value can never stamp a key that reads as no key. Session-only: never
 *  serialized, never sim-mutated. Off the directory barrel on purpose: the
 *  join hook is its one caller and the direct tests import this file. */
export function applyFreeholdOwnerStamp(meta: { freeholdOwnerKey?: string }, key: string): void {
  if (!key) return;
  meta.freeholdOwnerKey = key;
}

/** Every account's default record: the free tier-0 Inn Room with nothing
 *  placed, full condition, unstamped day counters, no prepaid weeks, closed to
 *  visitors, not decorating, at revision 0. 05 hands one to every account that
 *  owns no plot yet. 07 persists it under a freshly MINTED plot id that the
 *  store holds and the live record never learns, so the row's identity and the
 *  record's differ for that account's first session; see
 *  PENDING_FREEHOLD_PLOT_ID above. */
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
 *  tier and visit policy, never the owner key. Null until the descriptor wire
 *  (08a) publishes the record this projects. It is a real module function rather
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

/** Install an owner's record through the ONE load path. A no-op on a dark
 *  host (the flag rule in the header): a persistence loader that runs on a
 *  dark realm inserts nothing. LOAD-ONCE like loadGuildBank: an owner whose
 *  record is already live is skipped, because overwriting it would drop
 *  placements not yet flushed by 07; to reload, evict first. An empty owner
 *  key is ignored so a malformed row can never create a keyless record. The
 *  live record is a value copy of `state` whose ownerKey is the map key, so
 *  the two can never disagree. */
export function loadFreehold(ctx: SimContext, ownerKey: string, state: FreeholdState): void {
  if (!ctx.freeholdsEnabled || ownerKey === '') return;
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

/** The owner's live record, inserting the default tier-0 Inn Room (D2, D81)
 *  when none is loaded yet: every owner holds one, so a fresh offline Sim's
 *  player enters its Inn Room with no seeding step. Null, and nothing
 *  inserted, on a dark host (the flag rule in the header). Load-once like
 *  loadFreehold (an existing record, whatever 07 loaded into it, is returned
 *  untouched) and the empty key is ignored the same way (null, nothing
 *  inserted), so a keyless record can never exist. */
export function ensureFreeholdRecord(ctx: SimContext, ownerKey: string): FreeholdState | null {
  if (!ctx.freeholdsEnabled || ownerKey === '') return null;
  const live = ctx.freeholds.get(ownerKey);
  if (live) return live;
  const seeded = defaultFreeholdState(ownerKey, PENDING_FREEHOLD_PLOT_ID);
  ctx.freeholds.set(ownerKey, seeded);
  return seeded;
}

/** The ONE tier writer (D24): the dev grant today, the Charter grant and the
 *  persisted upgrade later, all through here. False, and nothing written,
 *  when the owner holds no record or the tier is not an authored row of the
 *  content tier table (so `lodge` and later stay refused until their rooms
 *  land). Bumps the record revision; never touches layout or trophies. */
export function setFreeholdTier(ctx: SimContext, ownerKey: string, tier: FreeholdTier): boolean {
  const state = ctx.freeholds.get(ownerKey);
  if (!state || freeholdTierById(tier) === undefined) return false;
  state.tier = tier;
  state.rev += 1;
  return true;
}

/** The addPlayer hook, one call: apply the host stamp when the host passed
 *  one, then seed the owner's default record. The inserter honors the flag,
 *  so a dark host (`freeholdsEnabled` unset) is stamped but seeds nothing,
 *  which is exactly why its every entry answers `no_freehold` without a flag
 *  check of its own. Reads the meta directly rather than the roster, so it is
 *  correct whether or not addPlayer has registered the meta yet. */
export function seedFreeholdOnJoin(
  ctx: SimContext,
  meta: FreeholdOwnerStampSlice,
  hostOwnerKey: string | undefined,
): void {
  if (hostOwnerKey) applyFreeholdOwnerStamp(meta, hostOwnerKey);
  ensureFreeholdRecord(ctx, freeholdOwnerKeyOfMeta(meta));
}

/** The removePlayer hook and the retention half ensureFreeholdRecord owes:
 *  evict the leaver's record ONLY when no other live player shares the owner
 *  key (two characters of one account share one record; the last session
 *  out evicts). Must run while the leaver is still on the roster. The roster
 *  walk is a pure existence check, so its iteration order cannot matter. The
 *  two guards short-circuit a DARK host only (no records at all, or a leaver
 *  whose key holds none): on a lit host every joining player is seeded a
 *  record, so every leave walks the roster once, O(players) per leave (about
 *  16 us at 5000, measured), spread across the server leave's own awaits
 *  rather than landing on one tick. An owner-key to live-session-count index
 *  kept by these same two hooks would make the evict O(1). It was named as work
 *  for the persistence slice; that slice has landed and did not reshape either
 *  hook, so the walk stands and the index is unclaimed work. */
export function releaseFreeholdOnLeave(ctx: SimContext, pid: number): void {
  if (ctx.freeholds.size === 0) return;
  const meta = ctx.players.get(pid);
  if (!meta) return;
  const key = freeholdOwnerKeyOfMeta(meta);
  if (!ctx.freeholds.has(key)) return;
  for (const other of ctx.players.values()) {
    if (other.entityId !== pid && freeholdOwnerKeyOfMeta(other) === key) return;
  }
  evictFreehold(ctx, key);
}
