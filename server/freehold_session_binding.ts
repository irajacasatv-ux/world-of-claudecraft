// The join and leave BINDING between a client session and the durable housing
// store: the one place that decides when a session takes a reference on an
// account's store entry and when it gives it back. Extracted out of the
// coordinator because both halves are ordering rules with long reasons attached,
// and neither of them is coordinator state: they take the store, the sim context
// and an account id, and nothing else.
//
// THE ONE INVARIANT: every retain is paired with exactly one release on EVERY
// exit, including a throw. A leaked reference pins the entry for the life of the
// process, so `maybeRemove` returns early forever, the orphan sweep resets its
// count on every pass, and the account's parsed record is never collected. That
// pairing is what `bindFreeholdOnJoin` and `releaseFreeholdBinding` exist to
// make mechanical rather than a rule a reader has to remember at four call
// sites.

import type { SimContext } from '../src/sim/sim_context';
import type { FreeholdPersistStore } from './freehold_persist';
import { installLoadedFreehold, type LoadedFreehold } from './freehold_persist';
import { freeholdOwnerKeyForAccount } from './freehold_wire';

/** The store surface this binding needs. Narrower than FreeholdPersistStore on
 *  purpose: a binding that could `save` or `idle` would be a second coordinator. */
export interface FreeholdBindingStore {
  retain: FreeholdPersistStore['retain'];
  flushAndRelease: FreeholdPersistStore['flushAndRelease'];
}

/**
 * Install the account's durable answer and take the join's reference, in that
 * order and synchronously.
 *
 * THE ORDER IS THE POINT. The durable record goes in through the ONE load path
 * BEFORE addPlayer's seed: `loadFreehold` and `ensureFreeholdRecord` are both
 * load-once, so a load after the seed is a silent no-op that discards the
 * owner's real plot. The retain is synchronous so a same-account character swap,
 * where the previous session's leave is fire-and-forget, cannot drop the entry
 * under the new session between the two.
 *
 * Returns the owner key so the caller computes it ONCE. `freeholdOwnerKeyForAccount`
 * throws on a non-positive account id, and a caller that recomputed it during
 * teardown would put that throw above its own lease release.
 */
export function bindFreeholdOnJoin(
  store: FreeholdBindingStore,
  ctx: SimContext,
  accountId: number,
  loaded: LoadedFreehold | undefined,
): string {
  const ownerKey = freeholdOwnerKeyForAccount(accountId);
  installLoadedFreehold(ctx, accountId, loaded);
  store.retain(ownerKey, accountId);
  return ownerKey;
}

/**
 * Give the reference back, fire and forget, for a join that will never produce a
 * session to leave.
 *
 * Fire and forget because the caller is already unwinding: the flush half writes
 * whatever the entry owes and the release half is what actually matters here,
 * and awaiting it would make a failing join wait out a durable write. A rejection
 * is swallowed for the same reason, and cannot hide a lost save: the entry stays
 * in the store until it settles and the shutdown drain still waits for it.
 */
export function releaseFreeholdBinding(store: FreeholdBindingStore, ownerKey: string): void {
  void store.flushAndRelease(ownerKey).catch(() => undefined);
}

/**
 * The LEAVE-path half: flush this account's plot and give the reference back,
 * awaited.
 *
 * It must run while the sim record is still live. `removePlayer` evicts the
 * record once the last session sharing the owner key leaves, and
 * `serializeFreehold` then answers null, so a flush placed after it writes
 * nothing at all, silently. It must also run before the character lease is
 * released, for the same reason the lease sits below the character flush: once
 * the lease drops, another process may load the same account's plot and write
 * it.
 */
export async function flushFreeholdBinding(
  store: FreeholdBindingStore,
  ownerKey: string,
): Promise<void> {
  await store.flushAndRelease(ownerKey);
}
