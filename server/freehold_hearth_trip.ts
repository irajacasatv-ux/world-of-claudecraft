// THE REMOTE HEARTH TRIP ON A LIT REALM (07a; the touch-set manifest's section
// 4). The sim's useHearthKey asks its admission seam AFTER every local check
// (dead, combat, record, entry context, already home, the local clock); online
// this module answers it, and the durable account cooldown decides:
//
//   'admit'   only through a one-shot TICKET this module minted from a PROVED
//             commit of the cooldown advance, set immediately before its own
//             re-dispatch and cleared in that call's finally;
//   'pending' a trip has started (or is running) for the account: the use is
//             silent now and the server re-dispatches it once the advance
//             commits or refuses;
//   'deny'    the sim emits `busy`.
//
// The trip commits ONE character save carrying the housing hook (the account
// Hearth participant, plus the plot claim re-proved under its lock when this
// realm holds one), on the character FIFO, through commitFreeholdMutation. The
// hook's own outcome decides, never the save's boolean. Admission is per
// ACCOUNT (one pending trip per account per process, whichever character
// asked), every refusal is metered per account, and nothing here can be
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
  /** The account's last session left: evict its memo (a relog re-asks). */
  onAccountLeft(accountId: number): void;
  /** Whether a trip is in flight for the account (the claim stays wanted). */
  inFlight(accountId: number): boolean;
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
  };
  const pending = new Map<number, number>();
  const memo = new Map<number, number>();
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
      if (pending.get(accountId) === trip) pending.delete(accountId);
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
      memo.set(accountId, host.nowMs() + FREEHOLD_HEARTH_TRIP_MEMO_MS);
    }
    const live = host.sessionForPid(session.pid);
    if (!sameSession(session, live)) {
      // Gone or changed: no re-dispatch and no merge into a record that may no
      // longer be this session's (the login merge reinstalls the durable clock).
      counters.abandoned++;
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
      if (pending.has(accountId)) return 'pending';
      const until = memo.get(accountId);
      if (until !== undefined) {
        if (host.nowMs() < until) {
          counters.metered++;
          return 'deny';
        }
        memo.delete(accountId);
      }
      // BEFORE any queue: a held, quiesced or unloaded entry, or a durable row
      // this process holds no claim for, never spends the shared cooldown.
      const authority = host.authority(ownerKey);
      const claim = host.claimFor(accountId);
      if (
        !authority ||
        !authority.loaded ||
        authority.blocked ||
        (authority.durableRev !== null && (!claim || claim.plotId !== authority.plotId))
      ) {
        counters.refusedPreQueue++;
        return 'deny';
      }
      const trip = ++nextTrip;
      pending.set(accountId, trip);
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
    onAccountLeft(accountId) {
      memo.delete(accountId);
    },
    inFlight(accountId) {
      return pending.has(accountId);
    },
    counters,
  };
}
