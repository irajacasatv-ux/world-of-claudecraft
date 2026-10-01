// THE REMOTE HEARTH TRIP ON A LIT REALM (07a; the touch-set manifest's section
// 4). The sim's useHearthKey asks its admission seam AFTER every local check
// (dead, combat, record, entry context, already home, the local clock); online
// this module answers it, and the durable account cooldown decides:
//
//   'admit'   only through a one-shot TICKET this module minted from a PROVED
//             commit of the cooldown advance, set immediately before its own
//             re-dispatch and cleared in that call's finally;
//   'pending' a trip has started (or is running) for the account from this
//             pid: the use is silent now and the server re-dispatches it once
//             the advance commits or refuses;
//   'deny'    the sim emits `busy`.
//
// The trip commits ONE character save carrying the housing hook (the account
// Hearth participant, plus the plot claim re-proved under its lock when this
// realm holds one), on the character FIFO, through commitFreeholdMutation. The
// hook's own outcome decides, never the save's boolean. Admission is per
// ACCOUNT (one pending trip per account per process, whichever character
// asked; a use from ANOTHER pid of that account while it runs is denied, since
// only the trip's own session is re-dispatched), a session with no lease nonce
// never starts one (its save would carry no nonce fence), every refusal is
// metered per account for its whole window (a relog does not reset it), and
// nothing here can be
// reached by a client frame: the ticket exists only inside one synchronous
// server-side re-dispatch, and the re-dispatch is not player input (no lane
// token, no detector observation), so it replays the frame path's prechecks
// itself (hearthKeyUseRefusal).
//
// Counts only reach a log or a metric: never an account id, an owner key, a
// plot id, a token or a holder.
import type { FreeholdKeyAdmission } from '../src/sim/freehold/hearth_key';
import type { FreeholdClaimFence } from './freehold_claim_db';
import type { FreeholdMutationOutcome, FreeholdMutationRequest } from './freehold_mutation';

/** The refusal memo's window: the player-waiting admission bound
 *  (FREEHOLD_PERSIST_LOAD_PERMIT_WAIT_MS), reused rather than guessed. */
export const FREEHOLD_HEARTH_TRIP_MEMO_MS = 5_000;

export interface FreeholdHearthTripSession {
  readonly pid: number;
  readonly characterId: number;
  readonly accountId: number;
  readonly leaseNonce: string | undefined;
  readonly left?: boolean;
  readonly escrowQuarantined?: boolean;
}

export interface FreeholdHearthTripCounters {
  started: number;
  advanced: number;
  cooldown: number;
  corrupt: number;
  unsupported: number;
  refused: number;
  failed: number;
  /** The save never reached the hook (a fence miss, a quarantine, the vault
   *  guard, the no-state arm, a guild-book refusal): nothing was attempted. */
  notRun: number;
  unresolved: number;
  /** A committed advance whose re-dispatch the sim then refused (R-2). */
  refusedAfterCommit: number;
  /** Denied before any queue or database work (no loaded entry, no claim). */
  refusedPreQueue: number;
  /** Denied by the per-account refusal memo. */
  metered: number;
  /** The session left, or changed, before the outcome was applied. */
  abandoned: number;
  /** Every trip's wall time from its start to its outcome, summed (ms, through
   *  the host clock): divided by `started` it is the mean trip latency. */
  tripMsTotal: number;
}

export interface FreeholdHearthTripHost {
  /** The live session for a pid, or undefined. */
  sessionForPid(pid: number): FreeholdHearthTripSession | undefined;
  /** The plot store's view of the owner (null: no entry). */
  authority(ownerKey: string): {
    readonly loaded: boolean;
    readonly blocked: boolean;
    readonly plotId: string;
    readonly durableRev: string | null;
  } | null;
  /** The claim this process holds for the account's plot, if any. */
  claimFor(accountId: number): FreeholdClaimFence | undefined;
  /** commitFreeholdMutation over one save of this session. Never rejects. */
  commit(
    session: FreeholdHearthTripSession,
    request: FreeholdMutationRequest,
    waitSignal: AbortSignal,
  ): Promise<FreeholdMutationOutcome>;
  /** The server prechecks plus sim.useItem(HEARTH_KEY_ITEM_ID, pid). */
  redispatch(session: FreeholdHearthTripSession): void;
  /** mergeFreeholdKeyReadyAt: forward only, a durable value may deny, never admit. */
  mergeReadyAt(ownerKey: string, readyAtMs: number): void;
  /** Whether any live player still holds the owner key (the sim roster the
   *  last-leave clock eviction reads): a merge for an owner with none would
   *  install a clock nothing ever evicts. */
  ownerOnline(ownerKey: string): boolean;
  /** The owner key's account id, or null when it is not an online account key. */
  accountOf(ownerKey: string): number | null;
  readonly cooldownMs: number;
  nowMs(): number;
  warn(message: string): void;
}

interface Ticket {
  readonly ownerKey: string;
  readonly pid: number;
  readonly verdict: 'admit' | 'deny';
  consumed: boolean;
}

export function createFreeholdHearthTrips(host: FreeholdHearthTripHost): {
  admission(ownerKey: string, pid: number): FreeholdKeyAdmission;
  /** A session left: prune the EXPIRED refusals. An unexpired one stays, so a
   *  relog inside its window is still metered. */
  onSessionLeft(): void;
  /** Whether a trip is in flight for the account (the claim stays wanted). */
  inFlight(accountId: number): boolean;
  /** The refusal memo's live entry count (a test and gauge read). */
  refusalMemoSize(): number;
  readonly counters: FreeholdHearthTripCounters;
} {
  const counters: FreeholdHearthTripCounters = {
    started: 0,
    advanced: 0,
    cooldown: 0,
    corrupt: 0,
    unsupported: 0,
    refused: 0,
    failed: 0,
    notRun: 0,
    unresolved: 0,
    refusedAfterCommit: 0,
    refusedPreQueue: 0,
    metered: 0,
    abandoned: 0,
    tripMsTotal: 0,
  };
  // One entry per account with a trip in flight: the trip's identity and the
  // pid it re-dispatches. Bounded by the trip's save, never by a leave: the
  // save's WAITS (the character FIFO, the market writer, the background permit)
  // take the trip's wait signal (FREEHOLD_HEARTH_TRIP_MEMO_MS), its transaction
  // its own wall deadline and the verify FREEHOLD_VERIFY_BOUNDS, so the commit
  // always settles and run()'s finally always clears its entry.
  const pending = new Map<number, { readonly trip: number; readonly pid: number }>();
  // Account id to the end of its refusal window. Bounded by the accounts with
  // a refusal in the last window plus the expired entries since the last
  // prune (every session leave and every new refusal prune).
  const memo = new Map<number, number>();
  const pruneMemo = () => {
    const now = host.nowMs();
    for (const [accountId, until] of memo) if (now >= until) memo.delete(accountId);
  };
  let ticket: Ticket | null = null;
  let nextTrip = 0;

  const sameSession = (a: FreeholdHearthTripSession, b: FreeholdHearthTripSession | undefined) =>
    b !== undefined &&
    b.characterId === a.characterId &&
    b.leaseNonce === a.leaseNonce &&
    b.left !== true &&
    b.escrowQuarantined !== true;

  /** The ONE ticket setter, and its ONE call site is below. */
  function redispatchWithTicket(
    ownerKey: string,
    session: FreeholdHearthTripSession,
    verdict: 'admit' | 'deny',
  ): boolean {
    const minted: Ticket = { ownerKey, pid: session.pid, verdict, consumed: false };
    ticket = minted;
    try {
      host.redispatch(session);
    } finally {
      ticket = null;
    }
    return minted.consumed;
  }

  async function run(
    ownerKey: string,
    accountId: number,
    session: FreeholdHearthTripSession,
    claim: FreeholdClaimFence | undefined,
    trip: number,
  ): Promise<void> {
    const startedAtMs = host.nowMs();
    let outcome: FreeholdMutationOutcome;
    try {
      outcome = await host.commit(
        session,
        {
          accountIds: [accountId],
          claimProofs: claim ? [claim] : [],
          plots: [],
          operations: [],
          hearth: { accountId, cooldownMs: host.cooldownMs },
        },
        AbortSignal.timeout(FREEHOLD_HEARTH_TRIP_MEMO_MS),
      );
    } catch (error) {
      outcome = { kind: 'failed', error };
    } finally {
      // Compare-and-delete: only THIS trip may clear the account's flag.
      if (pending.get(accountId)?.trip === trip) pending.delete(accountId);
      counters.tripMsTotal += Math.max(0, host.nowMs() - startedAtMs);
    }
    let verdict: 'admit' | 'deny' = 'deny';
    let readyAtMs: number | null = null;
    if (outcome.kind === 'committed' && outcome.hearth) {
      counters.advanced++;
      verdict = 'admit';
      readyAtMs = Number(outcome.hearth.readyAtMs);
    } else if (outcome.kind === 'refused' && outcome.refusal.kind === 'hearth') {
      const result = outcome.refusal.result;
      if (result.kind === 'cooldown') {
        // NEVER admit on a cooldown: the database judged it at its own clock,
        // and the sim re-checks on the realm's, so admitting would let the gap
        // between the two buy a trip the durable clock refused.
        counters.cooldown++;
        readyAtMs = Number(result.readyAtMs);
      } else if (result.kind === 'corrupt') {
        counters.corrupt++;
        host.warn('freehold hearth trip refused: the stored ready time is past any cooldown');
      } else {
        counters.unsupported++;
        host.warn('freehold hearth trip refused: the account clock is unsupported');
      }
    } else if (outcome.kind === 'refused') {
      counters.refused++;
    } else if (outcome.kind === 'unresolved') {
      counters.unresolved++;
    } else if (outcome.kind === 'not_run') {
      counters.notRun++;
    } else {
      counters.failed++;
    }
    if (
      verdict !== 'admit' &&
      !(
        outcome.kind === 'refused' &&
        outcome.refusal.kind === 'hearth' &&
        outcome.refusal.result.kind === 'cooldown'
      )
    ) {
      pruneMemo();
      memo.set(accountId, host.nowMs() + FREEHOLD_HEARTH_TRIP_MEMO_MS);
    }
    const live = host.sessionForPid(session.pid);
    if (!sameSession(session, live)) {
      // Gone or changed: no re-dispatch. The clock is the ACCOUNT's, so a
      // durable value still merges while any session of the owner is live (a
      // sibling must not keep a stale clock), and never once none is: the last
      // leave evicted it, and the login merge reinstalls it.
      counters.abandoned++;
      if (readyAtMs !== null && host.ownerOnline(ownerKey)) host.mergeReadyAt(ownerKey, readyAtMs);
      return;
    }
    if (verdict === 'deny' && readyAtMs !== null) host.mergeReadyAt(ownerKey, readyAtMs);
    try {
      const consumed = redispatchWithTicket(ownerKey, session, verdict);
      if (verdict === 'admit' && !consumed) {
        counters.refusedAfterCommit++;
        host.warn('freehold hearth trip committed but the sim refused its re-dispatch');
      }
    } finally {
      if (verdict === 'admit' && readyAtMs !== null) host.mergeReadyAt(ownerKey, readyAtMs);
    }
  }

  return {
    admission(ownerKey, pid) {
      if (ticket !== null && ticket.ownerKey === ownerKey && ticket.pid === pid) {
        ticket.consumed = true;
        return ticket.verdict;
      }
      const accountId = host.accountOf(ownerKey);
      const session = host.sessionForPid(pid);
      if (accountId === null || !session || session.accountId !== accountId) return 'deny';
      if (session.left === true || session.escrowQuarantined === true) return 'deny';
      // Single flight: the trip's own pid waits silently for its re-dispatch;
      // any other pid of the account is never re-dispatched, so it hears busy.
      const inFlight = pending.get(accountId);
      if (inFlight !== undefined) return inFlight.pid === pid ? 'pending' : 'deny';
      const until = memo.get(accountId);
      if (until !== undefined) {
        if (host.nowMs() < until) {
          counters.metered++;
          return 'deny';
        }
        memo.delete(accountId);
      }
      // BEFORE any queue: a held, quiesced or unloaded entry, a durable row
      // this process holds no claim for, or a session with no lease nonce (its
      // save would carry no nonce fence; every handshake mints one) never
      // spends the shared cooldown.
      const authority = host.authority(ownerKey);
      const claim = host.claimFor(accountId);
      if (
        session.leaseNonce === undefined ||
        !authority ||
        !authority.loaded ||
        authority.blocked ||
        (authority.durableRev !== null && (!claim || claim.plotId !== authority.plotId))
      ) {
        counters.refusedPreQueue++;
        return 'deny';
      }
      const trip = ++nextTrip;
      pending.set(accountId, { trip, pid });
      counters.started++;
      void run(
        ownerKey,
        accountId,
        session,
        authority.durableRev !== null ? claim : undefined,
        trip,
      );
      return 'pending';
    },
    onSessionLeft() {
      pruneMemo();
    },
    inFlight(accountId) {
      return pending.has(accountId);
    },
    refusalMemoSize() {
      return memo.size;
    },
    counters,
  };
}
