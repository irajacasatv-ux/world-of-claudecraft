// THIS PROCESS'S HELD PLOT CLAIMS, and the renewer that keeps them alive (07a
// deliverable 1; docs/freeholds/mutation-touch-set-manifest.md P4 to P6).
//
// The registry is the one place a process remembers which claims it holds and
// at which generation: the login read records a claim it acquired, the first
// insert of a new plot records generation 1, a write reads its fence from here,
// and a write or renewal that finds the claim gone drops it. A plot this
// process does not hold here is never written: the fenced write answers
// `fenced` rather than guessing.
//
// THE RENEWER is the `renewFreeholdClaims` member of the periodic save flush,
// beside heartbeatCharacterLeases on the same 30 s autosave cadence. It renews
// every claim the host still WANTS and releases the rest, in sorted chunks of
// at most FREEHOLD_CLAIM_RENEW_CHUNK ids, each ONE statement in its own short
// transaction: no transaction ever holds the rows of two statements, so the
// renewer can never cycle against a multi-plot writer, and one blocked row
// fails only its own chunk. A completed renewal that did not return a wanted
// plot means another holder took it (the claim leaves the registry and the
// store's next write is fenced); a THROWN chunk is a missed heartbeat, counted
// and retried at the next pass, never a loss (LEASE_TTL_SECONDS covers two).
//
// ONE PASS AT A TIME, ONE CLIENT AT A TIME. The flush starts a pass unawaited
// every 30 s, and in a brownout one pass at 5,000 claims (20 chunks, each up to
// a checkout wait plus its 5 s wall) could outlive several triggers. So a pass
// is single-flight per registry (a trigger while one runs is skipped and
// counted), its chunks run in sequence, and the whole pass carries
// FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS: past it the chunks not yet started are
// abandoned and counted, and their wanted claims are missed heartbeats. The
// next pass STARTS where an abandoned one stopped (and otherwise one chunk
// later than the last), so a brownout never starves the same tail plots.
//
// THE SYNCHRONOUS PART, before the first await, is one copy of the claims held
// (all() returns a fresh array), one sort, one wanted test per claim and the
// pending sweep: O(claims held), bounded by the live owners this process
// serves, never by realm age or by the claims table (the database half is one
// statement per FREEHOLD_CLAIM_RENEW_CHUNK ids). It bills no profiler bucket
// of its own on that bound: measured at 5,000 claims with the realm's own
// predicate shape, it is a median 1.4 ms per pass (2.1 ms cold, 1.0 ms with
// the checkout itself taken out), beside a 138 ms pass on a 201,000-row table
// (docs/freeholds/qa/mutation-2026-09-30/workload-evidence.md).
//
// The "wanted" predicate is the host's (server/freehold_persist_wiring.ts):
// the store holds the owner with a session or owed work, the sim holds its
// live record, a mutation or recovery pass is in flight for the plot, or the
// claim is younger than the login budget (a handshake between its first ask
// and its join bind). A predicate that THROWS counts the claim as wanted (kept
// and renewed, the safe side), counted, with one fixed warn per pass. No player
// data reaches a log line here: counts only.
import {
  freeholdClaimsStillHeldOnClient,
  releaseAllFreeholdClaimRows,
  releaseFreeholdClaimRows,
  renewFreeholdClaimRows,
} from './freehold_claim_db';
import { type FreeholdTxPool, runFreeholdTransaction } from './freehold_tx';

/** Ids per renew or release statement. A bound on one statement's lock set and
 *  on how much one blocked row can delay, not a capacity: every wanted claim is
 *  renewed every pass, in as many chunks as it takes. */
export const FREEHOLD_CLAIM_RENEW_CHUNK = 256;

/** The renewer's and release's bounds: tiny statements on the autosave path. */
export const FREEHOLD_CLAIM_RENEW_BOUNDS = Object.freeze({
  operation: 'freehold claim renew',
  statementMs: 2_000,
  lockMs: 1_000,
  idleMs: 2_000,
  wallMs: 5_000,
});

/** The whole renew pass's deadline. Under the 30 s autosave cadence that starts
 *  a pass, so a pass that runs to it has ended before the next trigger, and far
 *  under LEASE_TTL_SECONDS (90 s), so an abandoned tail is renewed first by the
 *  next pass, well inside its TTL. Checked before every chunk, and also handed
 *  to each chunk's transaction, so a checkout or statement still in flight at
 *  the deadline is cut there rather than at its own 5 s wall. */
export const FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS = 20_000;

export interface FreeholdHeldClaim {
  readonly plotId: string;
  readonly accountId: number;
  /** Exact bigint text. */
  readonly generation: string;
  readonly acquiredAtMs: number;
}

/** A write to this plot ended without a proved answer: the token it stamped,
 *  and the owner it was for, so a renew pass can retire a token nothing will
 *  ever ask about again (an ambiguous FIRST insert records no claim). */
export interface FreeholdPendingWrite {
  readonly plotId: string;
  readonly accountId: number;
  readonly writeToken: string;
  readonly notedAtMs: number;
}

export interface FreeholdClaimCounters {
  acquired: number;
  takeovers: number;
  busy: number;
  renewed: number;
  missedHeartbeats: number;
  lost: number;
  released: number;
  fencedWrites: number;
  selfAdopted: number;
  /** Renew passes that ran (a skipped trigger is not one). */
  renewPasses: number;
  /** Their summed wall time, from the renewer's nowMs port. */
  renewPassMsTotal: number;
  /** Triggers that found a pass still running and did nothing. */
  renewPassesSkipped: number;
  /** Renew or release chunks the pass deadline left unstarted. */
  renewChunksAbandoned: number;
  /** Wanted tests that threw: each claim kept as wanted. */
  wantedThrew: number;
  /** Pending tokens on unclaimed plots retired because nothing wants the owner. */
  pendingSwept: number;
  /** Claimed login reads that ran, and their summed wall time. */
  loginReads: number;
  loginReadMsTotal: number;
}

export interface FreeholdClaimRegistry {
  record(claim: FreeholdHeldClaim): void;
  forPlot(plotId: string): FreeholdHeldClaim | undefined;
  /** The claim this process holds for the account's plot, if any. */
  forAccount(accountId: number): FreeholdHeldClaim | undefined;
  drop(plotId: string): void;
  /** A write to this plot ended without a proved answer: the token it stamped. */
  notePending(pending: FreeholdPendingWrite): void;
  pendingToken(plotId: string): string | null;
  clearPending(plotId: string): void;
  /** The pending writes on plots this process holds NO claim for: only an
   *  ambiguous first insert leaves one (drop clears a claimed plot's). */
  unclaimedPending(): FreeholdPendingWrite[];
  /** A mutation or recovery pass is working on this plot: wanted while held. */
  holdInFlight(plotId: string): () => void;
  inFlight(plotId: string): boolean;
  /** A fresh array: the caller may sort or filter it in place. */
  all(): FreeholdHeldClaim[];
  /** How many claims this process holds, without copying them. */
  count(): number;
  readonly counters: FreeholdClaimCounters;
}

export function createFreeholdClaimCounters(): FreeholdClaimCounters {
  return {
    acquired: 0,
    takeovers: 0,
    busy: 0,
    renewed: 0,
    missedHeartbeats: 0,
    lost: 0,
    released: 0,
    fencedWrites: 0,
    selfAdopted: 0,
    renewPasses: 0,
    renewPassMsTotal: 0,
    renewPassesSkipped: 0,
    renewChunksAbandoned: 0,
    wantedThrew: 0,
    pendingSwept: 0,
    loginReads: 0,
    loginReadMsTotal: 0,
  };
}

export function createFreeholdClaimRegistry(): FreeholdClaimRegistry {
  const byPlot = new Map<string, FreeholdHeldClaim>();
  const byAccount = new Map<number, string>();
  const pending = new Map<string, FreeholdPendingWrite>();
  const inFlight = new Map<string, number>();
  const counters = createFreeholdClaimCounters();
  return {
    record(claim) {
      const previous = byAccount.get(claim.accountId);
      if (previous !== undefined && previous !== claim.plotId) byPlot.delete(previous);
      byPlot.set(claim.plotId, claim);
      byAccount.set(claim.accountId, claim.plotId);
    },
    forPlot(plotId) {
      return byPlot.get(plotId);
    },
    forAccount(accountId) {
      const plotId = byAccount.get(accountId);
      return plotId === undefined ? undefined : byPlot.get(plotId);
    },
    drop(plotId) {
      const claim = byPlot.get(plotId);
      byPlot.delete(plotId);
      pending.delete(plotId);
      if (claim && byAccount.get(claim.accountId) === plotId) byAccount.delete(claim.accountId);
    },
    notePending(write) {
      pending.set(write.plotId, write);
    },
    pendingToken(plotId) {
      return pending.get(plotId)?.writeToken ?? null;
    },
    clearPending(plotId) {
      pending.delete(plotId);
    },
    unclaimedPending() {
      const out: FreeholdPendingWrite[] = [];
      for (const write of pending.values()) if (!byPlot.has(write.plotId)) out.push(write);
      return out;
    },
    holdInFlight(plotId) {
      inFlight.set(plotId, (inFlight.get(plotId) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const left = (inFlight.get(plotId) ?? 1) - 1;
        if (left <= 0) inFlight.delete(plotId);
        else inFlight.set(plotId, left);
      };
    },
    inFlight(plotId) {
      return (inFlight.get(plotId) ?? 0) > 0;
    },
    all() {
      return [...byPlot.values()];
    },
    count() {
      return byPlot.size;
    },
    counters,
  };
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const byPlotId = (a: { plotId: string }, b: { plotId: string }): number =>
  a.plotId < b.plotId ? -1 : a.plotId > b.plotId ? 1 : 0;

/** The chunks in pass order: starting at the chunk that holds `cursor` (the
 *  first id at or after it), wrapping round. Each chunk stays ascending inside
 *  itself, and the statements lock in ascending order anyway (ORDER BY in the
 *  subselect), so the rotation changes which chunk goes first, never a lock
 *  order. */
function rotated<T extends { plotId: string }>(sorted: T[][], cursor: string | null): T[][] {
  if (cursor === null || sorted.length < 2) return sorted;
  const at = sorted.findIndex((chunk) => chunk[chunk.length - 1].plotId >= cursor);
  if (at <= 0) return sorted;
  return [...sorted.slice(at), ...sorted.slice(0, at)];
}

export interface FreeholdClaimRenewerDeps {
  readonly registry: FreeholdClaimRegistry;
  readonly pool: FreeholdTxPool;
  readonly holder: string;
  readonly ttlSeconds: number;
  /** Whether the host still needs this claim. */
  wanted(claim: FreeholdHeldClaim, nowMs: number): boolean;
  /** Called once per claim another holder took, so the host quiesces it. */
  onLost?(claim: FreeholdHeldClaim): void;
  nowMs(): number;
  warn(message: string): void;
}

/** Per registry: whether a pass is running, and where the next one starts. */
interface RenewerState {
  running: boolean;
  cursor: string | null;
}

const renewers = new WeakMap<FreeholdClaimRegistry, RenewerState>();

/**
 * One pass of `renewFreeholdClaims`. Never rejects: a thrown chunk is counted
 * and its claims are kept for the next pass. SINGLE-FLIGHT per registry: a
 * call while a pass runs returns at once, counted, so the renewer never holds
 * more than one pool client.
 */
export async function renewFreeholdClaims(deps: FreeholdClaimRenewerDeps): Promise<void> {
  let state = renewers.get(deps.registry);
  if (!state) {
    state = { running: false, cursor: null };
    renewers.set(deps.registry, state);
  }
  if (state.running) {
    deps.registry.counters.renewPassesSkipped++;
    return;
  }
  state.running = true;
  const { counters } = deps.registry;
  const startMs = deps.nowMs();
  try {
    await renewPass(deps, state, startMs);
  } finally {
    state.running = false;
    counters.renewPasses++;
    counters.renewPassMsTotal += Math.max(0, deps.nowMs() - startMs);
  }
}

async function renewPass(
  deps: FreeholdClaimRenewerDeps,
  state: RenewerState,
  nowMs: number,
): Promise<void> {
  const { counters } = deps.registry;
  let threw = 0;
  const wantedNow = (claim: FreeholdHeldClaim): boolean => {
    try {
      return deps.wanted(claim, nowMs);
    } catch {
      threw++;
      return true;
    }
  };
  const held = deps.registry.all().sort(byPlotId);
  const wanted: FreeholdHeldClaim[] = [];
  const unwanted: FreeholdHeldClaim[] = [];
  for (const claim of held) (wantedNow(claim) ? wanted : unwanted).push(claim);
  // A pending token on a plot with no claim (an ambiguous first insert) is
  // asked about only by that owner's next insert retry, which the store makes
  // only while it still holds the owner, and that is exactly when the wanted
  // test keeps it. Nothing else will ever clear one. A throwing test keeps it.
  for (const write of deps.registry.unclaimedPending()) {
    const asClaim = {
      plotId: write.plotId,
      accountId: write.accountId,
      generation: '1',
      acquiredAtMs: write.notedAtMs,
    };
    if (wantedNow(asClaim)) continue;
    deps.registry.clearPending(write.plotId);
    counters.pendingSwept++;
  }
  if (threw > 0) {
    counters.wantedThrew += threw;
    deps.warn('freehold claim wanted check threw; those claims are kept and renewed');
  }
  const deadline = AbortSignal.timeout(FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS);
  const expired = () =>
    deadline.aborted || deps.nowMs() - nowMs >= FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
  const renewChunks = rotated(chunks(wanted, FREEHOLD_CLAIM_RENEW_CHUNK), state.cursor);
  // The next pass starts one chunk later, unless this one stops early.
  state.cursor = renewChunks.length > 1 ? renewChunks[1][0].plotId : null;
  for (const [index, chunk] of renewChunks.entries()) {
    if (expired()) {
      const left = renewChunks.slice(index);
      counters.renewChunksAbandoned += left.length;
      for (const rest of left) counters.missedHeartbeats += rest.length;
      state.cursor = chunk[0].plotId;
      deps.warn(
        `freehold claim renew pass hit its ${FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS} ms deadline; ${left.length} chunks wait for the next pass`,
      );
      // Renewing outranks releasing: an unreleased claim expires on its own.
      counters.renewChunksAbandoned += Math.ceil(unwanted.length / FREEHOLD_CLAIM_RENEW_CHUNK);
      return;
    }
    let renewed: Set<string>;
    let stillHeld: Set<string>;
    try {
      ({ renewed, stillHeld } = await runFreeholdTransaction(
        deps.pool,
        FREEHOLD_CLAIM_RENEW_BOUNDS,
        async (tx) => {
          const ids = chunk.map((claim) => claim.plotId);
          // SKIP LOCKED: a row a trip or a write holds right now is passed
          // over rather than waited for, so one contended plot cannot fail its
          // whole chunk or hold its neighbours' locks while it waits.
          const done = await renewFreeholdClaimRows(tx, deps.holder, ids, deps.ttlSeconds);
          const skipped = ids.filter((plotId) => !done.has(plotId));
          return {
            renewed: done,
            stillHeld: await freeholdClaimsStillHeldOnClient(tx, deps.holder, skipped),
          };
        },
        { signal: deadline },
      ));
    } catch {
      counters.missedHeartbeats += chunk.length;
      continue;
    }
    let lost = 0;
    for (const claim of chunk) {
      if (renewed.has(claim.plotId)) {
        counters.renewed++;
        continue;
      }
      // Passed over by SKIP LOCKED and still ours: one missed heartbeat, kept.
      if (stillHeld.has(claim.plotId)) {
        counters.missedHeartbeats++;
        continue;
      }
      lost++;
      counters.lost++;
      deps.registry.drop(claim.plotId);
      deps.onLost?.(claim);
    }
    if (lost > 0) {
      deps.warn(`freehold claims lost to another holder: ${lost}; their plots stop writing`);
    }
  }
  const releaseChunks = chunks(unwanted, FREEHOLD_CLAIM_RENEW_CHUNK);
  for (const [index, chunk] of releaseChunks.entries()) {
    if (expired()) {
      // Kept: still unwanted at the next pass, which releases them then.
      counters.renewChunksAbandoned += releaseChunks.length - index;
      return;
    }
    let released: Set<string>;
    try {
      released = await runFreeholdTransaction(
        deps.pool,
        FREEHOLD_CLAIM_RENEW_BOUNDS,
        (tx) =>
          releaseFreeholdClaimRows(
            tx,
            deps.holder,
            chunk.map((claim) => claim.plotId),
          ),
        { signal: deadline },
      );
    } catch {
      // Kept: still unwanted at the next pass, so the release is retried then,
      // and a claim nobody renews expires on its own after the TTL anyway.
      continue;
    }
    for (const claim of chunk) {
      // ONLY what the statement released. A row SKIP LOCKED passed over is
      // still live under this holder, so it stays in the registry and the next
      // pass releases it; an already-expired row (not returned either) is no
      // longer anyone's live claim and simply leaves.
      if (released.has(claim.plotId)) {
        counters.released++;
        deps.registry.drop(claim.plotId);
      }
    }
    // The ids the statement did not return: a lock-free read keeps those still
    // live under this holder and drops the rest.
    const notReleased = chunk.filter((claim) => !released.has(claim.plotId));
    if (notReleased.length === 0) continue;
    let stillHeld: Set<string>;
    try {
      stillHeld = await runFreeholdTransaction(
        deps.pool,
        FREEHOLD_CLAIM_RENEW_BOUNDS,
        (tx) =>
          freeholdClaimsStillHeldOnClient(
            tx,
            deps.holder,
            notReleased.map((claim) => claim.plotId),
          ),
        { signal: deadline },
      );
    } catch {
      continue;
    }
    for (const claim of notReleased) {
      if (!stillHeld.has(claim.plotId)) deps.registry.drop(claim.plotId);
    }
  }
}

/**
 * The shutdown release (manifest P6): every live claim of this holder, AFTER the
 * housing drain and BEFORE the character leases drop, so a replacement process
 * can take the plots at once instead of waiting out the TTL. Never rejects; a
 * crash or a failure here leaves the claims to expire on their own.
 */
/** The shutdown release's own bound, connect wait included: a release that
 *  cannot run inside it is abandoned and its claims expire after the TTL, the
 *  same as a crash, so it can never hold the shutdown's lease release back. */
export const FREEHOLD_CLAIM_RELEASE_ALL_DEADLINE_MS = 2_000;

export async function releaseAllFreeholdClaims(deps: {
  readonly pool: FreeholdTxPool;
  readonly holder: string;
  readonly registry?: FreeholdClaimRegistry;
  readonly warn?: (message: string) => void;
}): Promise<number> {
  const deadline = AbortSignal.timeout(FREEHOLD_CLAIM_RELEASE_ALL_DEADLINE_MS);
  try {
    const released = await runFreeholdTransaction(
      deps.pool,
      {
        ...FREEHOLD_CLAIM_RENEW_BOUNDS,
        operation: 'freehold claim release all',
        wallMs: FREEHOLD_CLAIM_RELEASE_ALL_DEADLINE_MS,
      },
      (tx) => releaseAllFreeholdClaimRows(tx, deps.holder),
      { signal: deadline },
    );
    if (deps.registry) {
      for (const claim of deps.registry.all()) deps.registry.drop(claim.plotId);
      deps.registry.counters.released += released;
    }
    return released;
  } catch {
    (deps.warn ?? console.warn)(
      'freehold claims were not released at shutdown; they expire after the lease TTL',
    );
    return 0;
  }
}
