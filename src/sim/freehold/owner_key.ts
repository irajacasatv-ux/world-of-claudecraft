// The freehold OWNER KEY: the one identity the record map and the owner claim
// on the dungeon slot pool are keyed on (D15). Online the host stamps
// `account:<id>` onto PlayerMeta at addPlayer (applyFreeholdOwnerStamp in
// state.ts is the one writer); offline nothing is stamped and the key falls
// back to `entity:<pid>` AT READ TIME (the feastOwnerKey shape), so two
// characters of one account share one record and one claim while an offline
// character stands alone. The key never reaches the wire.
//
// A LEAF by design: type-only imports, no live state, no rng, no clock.
// instances/dungeons.ts resolves an owner claim's key from HERE rather than
// from instance.ts, so the dungeon module's import graph never pulls in this
// directory's runtime modules and their content imports.

import type { SimContext } from '../sim_context';

/** The structural slice of PlayerMeta the key reads: never the whole meta,
 *  the applyBankBonusStamp least-privilege shape. */
export interface FreeholdOwnerStampSlice {
  entityId: number;
  freeholdOwnerKey?: string;
}

/** The owner key of one player's meta: the host stamp when present, else the
 *  entity fallback. */
export function freeholdOwnerKeyOfMeta(meta: FreeholdOwnerStampSlice): string {
  return meta.freeholdOwnerKey ?? `entity:${meta.entityId}`;
}

/** The owner key for a pid through the live roster; a pid with no meta still
 *  resolves to its entity fallback so a caller never gets an empty key. */
export function freeholdKeyFor(ctx: SimContext, pid: number): string {
  const meta = ctx.players.get(pid);
  return meta ? freeholdOwnerKeyOfMeta(meta) : `entity:${pid}`;
}
