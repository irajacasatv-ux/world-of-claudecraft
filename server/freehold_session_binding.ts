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
import { installLoadedFreehold } from './freehold_install';
import type { FreeholdPersistStore, LoadedFreehold } from './freehold_persist';
import { freeholdOwnerKeyForAccount } from './freehold_wire';

/** The store surface this binding needs. Narrower than FreeholdPersistStore on
 *  purpose: a binding that could `save` or `idle` would be a second coordinator. */
export interface FreeholdBindingStore {
  answerForInstall: FreeholdPersistStore['answerForInstall'];
  retain: FreeholdPersistStore['retain'];
  flushAndRelease: FreeholdPersistStore['flushAndRelease'];
}

/**
 * Validate the account's durable answer against the store, install it and take
 * the join's reference, in that order and synchronously.
 *
 * THE ORDER IS THE POINT. The answer the handshake carries was read before an
 * await, and another session of the account can edit, leave and be evicted in
 * it (the twelfth path), so the store decides what to install NOW, from its
 * entry, capture included (ruling (b)). The durable record then goes in through
 * the ONE load path BEFORE addPlayer's seed: `loadFreehold` and
 * `ensureFreeholdRecord` are both load-once, so a load after the seed is a silent
 * no-op that discards the owner's real plot. All of it is synchronous, so no
 * sibling's removePlayer lands between the decision and the install, and a
 * same-account character swap, where the previous session's leave is
 * fire-and-forget, cannot drop the entry under the new session before the retain.
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
  installLoadedFreehold(ctx, accountId, store.answerForInstall(ownerKey, accountId, loaded));
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
 *
 * NEVER REJECTS. It runs inside the leave's `finally`, above a lease release and
 * a removePlayer that must happen regardless, and every caller of leave() fires
 * it with no catch. The swallow lives here rather than at the call site because
 * the release half is this module's invariant, not the coordinator's, and a
 * caller that forgot the catch would strand the entry and the seeded record for
 * the life of the process. Nothing is lost: a failed flush leaves the entry
 * dirty in the store and the shutdown drain still waits for it.
 */
export async function flushFreeholdBinding(
  store: FreeholdBindingStore,
  ownerKey: string,
): Promise<void> {
  await store
    .flushAndRelease(ownerKey)
    .catch((err) => console.error('freehold leave flush failed:', err));
}
