// Linkdead grace: a dropped socket does not log the character out. The
// session is held in-world ("linkdead") for LINKDEAD_GRACE_MS so an
// accidental disconnect (network blip, page reload, flaky mobile radio) can
// resume seamlessly, and the character stays online for friends, the open
// play-session analytics row, and the concurrent-player counts. Forced
// disconnects (moderation, takeover, anti-bot, account lock) never enter
// grace; they tear down through GameServer.leave() directly. This module is
// the pure decision core so the join rules are unit-testable without a
// GameServer.
//
// This is also the reconnect policy for a dropped dungeon run (issue #1351):
// keeping the linkdead player's entity live and in place is what stops a
// claimed instance's empty-timeout reaper (updateInstances,
// src/sim/instances/dungeons.ts) from ever seeing it as empty during the
// grace window. See that file's updateInstances comment for the full chain.

export const LINKDEAD_GRACE_MS = 5 * 60 * 1000;

export interface LinkdeadSessionView {
  accountId: number;
  linkdead: boolean;
  // True once GameServer.leave() has begun tearing the session down. leave()
  // sets it synchronously, then awaits the character save before removing the
  // sim entity and releasing the character load lease; a session in that
  // window must never be resumed (the reconnect would get a zombie whose
  // lease release the nonce fence cannot see, since the resume arm never
  // re-acquires).
  left: boolean;
  // True once this session's guild bank escrow was ROLLED BACK: its live state
  // was abandoned and it can never persist again
  // (server/guild_bank_escrow_refusal.ts handleGuildBankEscrowRefusal).
  // RESUMING it would hand the player a session
  // that plays normally and saves NOTHING, forever, with no error and no
  // signal: silent unbounded data loss, which is far worse than the reconnect
  // refusal below. The refused client retries into the fresh-join arm and
  // loads from its durable row, which is exactly what the rollback intends.
  escrowQuarantined: boolean;
}

export type JoinPlan =
  | { action: 'resume' }
  | { action: 'reject'; error: string }
  | { action: 'join' };

// Decide what a join request means given the account's existing sessions.
// - The account id must be a real one (a positive safe integer) before any
//   other rule runs: the fresh-join arm stamps the freehold owner key from it
//   (server/freehold_wire.ts freeholdOwnerKeyForAccount), and a malformed id
//   must refuse through join's `{ error }` contract rather than throw, so the
//   caller's character-lease release (server/ws_auth.ts, the `'error' in
//   result` arm) and the linkdead-sibling logout ordering in GameServer.join
//   both stay intact. The refusal string is the existing auth one, so the
//   client matcher already localizes it.
// - The same character is already in the world: resume it when it is linkdead
//   and owned by the requesting account (an accidental-disconnect reconnect);
//   otherwise reject, so the explicit takeover flow stays the only way to
//   displace a session whose socket is still alive.
// - A different character: the account's linkdead sessions never block the
//   login (the caller displaces them, switching the account over to the new
//   character immediately instead of at the end of the grace window); only
//   sessions with a live socket count against the per-account cap.
export function planJoin(opts: {
  accountId: number;
  isGm: boolean;
  sameCharacter: LinkdeadSessionView | null;
  liveOtherSessions: number;
  maxPerAccount: number;
}): JoinPlan {
  if (!Number.isSafeInteger(opts.accountId) || opts.accountId <= 0) {
    return { action: 'reject', error: 'not authenticated' };
  }
  if (opts.sameCharacter) {
    if (
      opts.sameCharacter.linkdead &&
      !opts.sameCharacter.left &&
      !opts.sameCharacter.escrowQuarantined &&
      opts.sameCharacter.accountId === opts.accountId
    ) {
      return { action: 'resume' };
    }
    // Mid-teardown (left), escrow-quarantined, and live-socket sessions all
    // reject with the transient conflict error; the client's reconnect policy
    // retries it, and the retry lands on a clean fresh join once the teardown
    // finishes.
    return { action: 'reject', error: 'character already in world' };
  }
  if (!opts.isGm && opts.liveOtherSessions >= opts.maxPerAccount) {
    return {
      action: 'reject',
      error: 'too many characters on this account are already in the world',
    };
  }
  return { action: 'join' };
}
