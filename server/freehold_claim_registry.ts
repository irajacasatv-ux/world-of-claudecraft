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
// FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS: past it the chunks not yet started,
// one whose checkout it cut and a release whose re-read it refused are
// abandoned and counted (one warn per pass), and their wanted claims are
// missed heartbeats, and every checkout of the pass (re-reads included) is
// bounded by it, so the pass ends by that deadline plus at most one
// transaction wall. The next pass STARTS where an abandoned one stopped (and
// otherwise one chunk later than the last), so a brownout never starves the
// same tail plots.
//
// A DROP IS IDENTITY-CHECKED: the pass drops a claim only while the registry
// still holds the very object it snapshotted, so a login that recorded a newer
// claim for the plot mid-pass keeps it (and the pass books nothing for it).
// A RELEASE RE-CHECKS FIRST: right before its statement goes out it leaves out
// every claim no longer the snapshotted object or now in flight (the login
// read marks its plot across its acquire), so it never renames a row a
// re-login just re-stamped at the same generation; the one ordering that
// check cannot close is detected where the release lands (releaseRaced: the
// claim is dropped at once, counted, and warned once per pass).
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
  type FreeholdClaimReleaseReading,
  freeholdClaimsStillHeldOnClient,
  readFreeholdClaimReleasesOnClient,
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

/** The whole renew pass's deadline. Checked before every transaction starts
 *  (its clock half, the nowMs port). It bounds EVERY checkout of the pass
 *  (renew, release, and both release re-reads): a start past it is refused
 *  before it asks the pool, one in flight when it fires is abandoned, and a cut
 *  checkout sends no SQL, so it can never strand a landed release. It is handed
 *  to each RENEW chunk's transaction as its signal, so a renew statement in
 *  flight at the deadline is cut there, and to a release and its re-reads only
 *  as runFreeholdTransaction's checkoutSignal: a release statement, and a
 *  re-read that already has its client, is never cut by it, only by its own
 *  FREEHOLD_CLAIM_RENEW_BOUNDS wall, since a release cut at COMMIT may have
 *  landed with nothing to say so. So a pass ENDS BY THIS DEADLINE PLUS
 *  AT MOST ONE FREEHOLD_CLAIM_RENEW_BOUNDS.wallMs (the one transaction that had
 *  its client when the deadline fired; nothing starts after it): 25,000 ms,
 *  under the 30 s autosave cadence that starts a pass, so a pass that runs to
 *  its bound has ended before the next trigger, and far under
 *  LEASE_TTL_SECONDS (90 s), so an abandoned tail is renewed first by the next
 *  pass, well inside its TTL. */
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
  /** Renew or release chunks the pass deadline left unstarted, cut (at their
   *  checkout, or a renew statement in flight), or undecided (a release whose
   *  re-read it refused or cut). */
  renewChunksAbandoned: number;
  /** Newer claims a landed release killed: a re-login on this realm re-stamped
   *  the row at the SAME generation just before our release renamed it. Each
   *  is dropped at once (one warn per pass, the count only) and handed to
   *  onLost when the host binds one. */
  releaseRaced: number;
  /** Wanted tests that threw: each claim kept as wanted. */
  wantedThrew: number;
  /** onLost host hooks that threw, each swallowed (the claim stays dropped). */
  onLostThrew: number;
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
    releaseRaced: 0,
    wantedThrew: 0,
    onLostThrew: 0,
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
  /** Called once per claim the pass drops as lost (another holder took it, or
   *  our landed release raced a same-generation re-login), so a host that
   *  binds it can quiesce at once. A throw is swallowed, and counted for one
   *  warn per pass (the count only). Production binds none
   *  (server/freehold_persist_wiring.ts): the claim has left the registry, so
   *  the owner's next write answers `fenced` and the store quiesces it then. */
  onLost?(claim: FreeholdHeldClaim): void;
  nowMs(): number;
  warn(message: string): void;
  /** The pass deadline, a positive finite number of ms (anything else rejects
   *  the pass with a RangeError before it starts);
   *  FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS unless a suite narrows it. */
  readonly passDeadlineMs?: number;
  /** Mints the pass deadline's signal, once per pass:
   *  AbortSignal.timeout(passDeadlineMs) unless a suite hands one it aborts by
   *  hand. */
  readonly deadlineSignal?: () => AbortSignal;
}

/** Per registry: whether a pass is running, and where the next one starts. */
interface RenewerState {
  running: boolean;
  cursor: string | null;
}

/** What ONE pass warns once, at its end, on every exit (counts only). */
interface PassTally {
  /** Newer claims this pass's landed releases killed (its releaseRaced). */
  raced: number;
  /** onLost calls that threw, each swallowed. */
  lostHookThrew: number;
}

const renewers = new WeakMap<FreeholdClaimRegistry, RenewerState>();

// A throwing log sink must not turn a pass into a rejection.
function warnSafely(deps: FreeholdClaimRenewerDeps, message: string): void {
  try {
    deps.warn(message);
  } catch {}
}

function passDeadlineOf(deps: FreeholdClaimRenewerDeps): number {
  const ms = deps.passDeadlineMs ?? FREEHOLD_CLAIM_RENEW_PASS_DEADLINE_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new RangeError(
      'freehold claim renew pass deadline must be a positive finite number of ms',
    );
  }
  return ms;
}

/**
 * One pass of `renewFreeholdClaims`. Never rejects on a database or host
 * fault: a thrown chunk is counted and its claims are kept for the next pass.
 * A passDeadlineMs that is not a positive finite number is a programming error
 * and rejects with a RangeError before anything runs. SINGLE-FLIGHT per
 * registry: a call while a pass runs returns at once, counted, so the renewer
 * never holds more than one pool client.
 */
export async function renewFreeholdClaims(deps: FreeholdClaimRenewerDeps): Promise<void> {
  const deadlineMs = passDeadlineOf(deps);
  let state = renewers.get(deps.registry);
  if (!state) {
    state = { running: false, cursor: null };
    renewers.set(deps.registry, state);
  }
  if (state.running) {
    deps.registry.counters.renewPassesSkipped++;
    return;
  }
  const { counters } = deps.registry;
  // Read BEFORE the flag is taken: a clock port that throws here rejects this
  // call with nothing claimed, never a flag left set that skips every later
  // pass while the claims lapse.
  const startMs = deps.nowMs();
  state.running = true;
  const tally: PassTally = { raced: 0, lostHookThrew: 0 };
  try {
    await renewPass(deps, state, startMs, deadlineMs, tally);
  } finally {
    // Once per pass, from here so that EVERY exit says it (a deadline stop
    // anywhere, or a clock port that throws mid-pass): production binds no
    // onLost, so the race line is the only voice a raced drop has. Said while
    // the flag is still held, so a log sink that calls back in is skipped.
    if (tally.raced > 0) {
      warnSafely(
        deps,
        `freehold claim releases raced a same-holder re-login: ${tally.raced}; those claims are dropped and their plots stop writing`,
      );
    }
    if (tally.lostHookThrew > 0) {
      warnSafely(
        deps,
        `freehold claim onLost hook threw: ${tally.lostHookThrew}; those claims are dropped and booked all the same`,
      );
    }
    counters.onLostThrew += tally.lostHookThrew;
    state.running = false;
    counters.renewPasses++;
    // A clock that throws HERE must not replace the pass's own outcome: the
    // pass is counted, its duration is not.
    let endMs: number | null = null;
    try {
      endMs = deps.nowMs();
    } catch {}
    if (endMs !== null) counters.renewPassMsTotal += Math.max(0, endMs - startMs);
  }
}

async function renewPass(
  deps: FreeholdClaimRenewerDeps,
  state: RenewerState,
  nowMs: number,
  deadlineMs: number,
  tally: PassTally,
): Promise<void> {
  const { counters } = deps.registry;
  const warn = (message: string): void => warnSafely(deps, message);
  // A throwing host hook must not reject the pass either (the claim is
  // already dropped and booked); each throw is counted for the pass's one line.
  const reportLost = (claim: FreeholdHeldClaim): void => {
    try {
      deps.onLost?.(claim);
    } catch {
      tally.lostHookThrew++;
    }
  };
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
    warn(`freehold claim wanted check threw: ${threw}; those claims are kept and renewed`);
  }
  const deadline = deps.deadlineSignal?.() ?? AbortSignal.timeout(deadlineMs);
  // Checked before EVERY transaction starts: the signal, and its clock half
  // through the nowMs port. The signal alone bounds the checkouts themselves.
  const expired = () => deadline.aborted || deps.nowMs() - nowMs >= deadlineMs;
  // The pass hit its deadline: these chunks wait for the next pass, or were
  // left undecided (a release whose re-read it refused: none of a thrown
  // one's claims is booked, while a completed one's released ids already
  // are), their claims kept for the next pass either way. One warn, once per
  // pass, since only one arm ever stops a pass.
  const abandon = (left: number): void => {
    counters.renewChunksAbandoned += left;
    warn(
      `freehold claim renew pass hit its ${deadlineMs} ms deadline; ${left} chunks wait for the next pass or were left undecided`,
    );
  };
  // Drops the claim only while the registry still holds the very object this
  // pass snapshotted: a newer claim a login recorded for the plot since stays,
  // and the pass books nothing for it (the newer claim is its recorder's).
  const dropHeld = (claim: FreeholdHeldClaim): boolean => {
    if (deps.registry.forPlot(claim.plotId) !== claim) return false;
    deps.registry.drop(claim.plotId);
    return true;
  };
  const renewChunks = rotated(chunks(wanted, FREEHOLD_CLAIM_RENEW_CHUNK), state.cursor);
  // The next pass starts one chunk later, unless this one stops early.
  state.cursor = renewChunks.length > 1 ? renewChunks[1][0].plotId : null;
  // Stops the pass at this renew chunk (unstarted, or the deadline cut it):
  // the next pass starts here, and renewing outranks releasing (an unreleased
  // claim expires on its own), so the release chunks wait too, counted and
  // warned with the renew chunks.
  const stopRenewsAt = (index: number): void => {
    const left = renewChunks.slice(index);
    for (const rest of left) counters.missedHeartbeats += rest.length;
    state.cursor = left[0][0].plotId;
    abandon(left.length + Math.ceil(unwanted.length / FREEHOLD_CLAIM_RENEW_CHUNK));
  };
  for (const [index, chunk] of renewChunks.entries()) {
    if (expired()) {
      stopRenewsAt(index);
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
      // Cut by the deadline (at its checkout or in flight): abandoned with
      // the rest. Otherwise one missed heartbeat per claim, kept.
      if (expired()) {
        stopRenewsAt(index);
        return;
      }
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
      if (!dropHeld(claim)) continue;
      lost++;
      counters.lost++;
      reportLost(claim);
    }
    if (lost > 0) {
      warn(`freehold claims lost to another holder: ${lost}; their plots stop writing`);
    }
  }
  // What the database says of these release ids, one reading per id. `kept`
  // when the read throws (a lock bound run out included): every one of them
  // stays for the next pass. `deadline` when the deadline refuses its start or
  // cuts its checkout: kept too, and the pass stops. Like a release, a read
  // that has its client is never cut by the deadline (checkoutSignal only): a
  // cut read would keep a claim whose row is no longer ours.
  const releaseReadingsOf = async (
    claims: FreeholdHeldClaim[],
    wait: boolean,
  ): Promise<Map<string, FreeholdClaimReleaseReading> | 'kept' | 'deadline'> => {
    if (expired()) return 'deadline';
    try {
      return await runFreeholdTransaction(
        deps.pool,
        FREEHOLD_CLAIM_RENEW_BOUNDS,
        (tx) =>
          readFreeholdClaimReleasesOnClient(
            tx,
            deps.holder,
            claims.map((claim) => claim.plotId),
            { wait },
          ),
        { checkoutSignal: deadline },
      );
    } catch {
      return expired() ? 'deadline' : 'kept';
    }
  };
  // Our release landed for this claim: the statement returned it, or a read
  // answered `released`. THE RESIDUAL WINDOW: a same-holder re-acquire keeps
  // the generation, and the in-flight re-check below closes every ordering
  // but one, a login acquire that COMMITS before a release statement that was
  // sent first takes the row's lock; the release then renames the row that
  // login re-stamped. That login's newer claim, at the SAME generation as the
  // snapshot, is dead: dropped at once and counted (one warn per pass), and
  // handed to onLost when the host binds one, rather than booked as a
  // spurious "lost to another holder" next pass. A newer claim at a HIGHER
  // generation is a takeover after our release and stays. (If our answer were
  // handled before that login's record(), the next pass would book its claim
  // lost instead; but that login's COMMIT answered before our statement even
  // took its lock, and our answer still waits on our own COMMIT.)
  const bookRelease = (claim: FreeholdHeldClaim): void => {
    if (dropHeld(claim)) {
      counters.released++;
      return;
    }
    const newer = deps.registry.forPlot(claim.plotId);
    if (newer === undefined || newer.generation !== claim.generation) return;
    deps.registry.drop(claim.plotId);
    tally.raced++;
    counters.releaseRaced++;
    reportLost(newer);
  };
  // Held stays for the next pass; our release landed leaves, counted; gone
  // (another holder's, an expired row of ours, no row) leaves uncounted.
  const settle = (
    claims: FreeholdHeldClaim[],
    readings: Map<string, FreeholdClaimReleaseReading>,
  ): void => {
    for (const claim of claims) {
      const reading = readings.get(claim.plotId) ?? 'gone';
      if (reading === 'held') continue;
      if (reading === 'released') bookRelease(claim);
      else dropHeld(claim);
    }
  };
  // Still this pass's to release: the very object snapshotted, and nothing in
  // flight on its plot (a login marks its plot across its acquire, a trip or
  // a recovery pass across its work).
  const releasable = (claim: FreeholdHeldClaim): boolean =>
    deps.registry.forPlot(claim.plotId) === claim && !deps.registry.inFlight(claim.plotId);
  const releaseChunks = chunks(unwanted, FREEHOLD_CLAIM_RENEW_CHUNK);
  for (const [index, chunk] of releaseChunks.entries()) {
    // The deadline gates STARTING a release and its checkout, and is never
    // handed to the transaction: a release cut at COMMIT may have landed with
    // nothing to say so, which would leave a claim in the registry whose row
    // is already released. Abandoned chunks are kept: still unwanted at the
    // next pass, which releases them then.
    if (expired()) {
      abandon(releaseChunks.length - index);
      break;
    }
    const candidates = chunk.filter(releasable);
    if (candidates.length === 0) continue;
    // The claims the statement carried; empty while none went out.
    let sent: FreeholdHeldClaim[] = [];
    let released: Set<string>;
    try {
      released = await runFreeholdTransaction(
        deps.pool,
        FREEHOLD_CLAIM_RENEW_BOUNDS,
        (tx) => {
          // SYNCHRONOUSLY, immediately before the statement goes out: a claim
          // a login replaced or put in flight since the snapshot is left out,
          // so this release never renames a row a re-login just re-stamped.
          // A login that marks its plot after this point races the statement
          // already sent. If the release locks the row first, the acquire
          // waits it out and takes over at the next generation (correct); if
          // the acquire holds the row first, SKIP LOCKED passes it over and
          // the lock-free read below keeps the claim; only an acquire that
          // COMMITS before the release locks the row is renamed by it, which
          // bookRelease detects (releaseRaced, the manifest's R-9).
          sent = candidates.filter(releasable);
          return releaseFreeholdClaimRows(
            tx,
            deps.holder,
            sent.map((claim) => claim.plotId),
          );
        },
        { checkoutSignal: deadline },
      );
    } catch {
      // Nothing went out (the checkout cut, or a failure before the
      // statement): nothing can have landed, so the claims stay.
      if (sent.length === 0) {
        if (!expired()) continue;
        abandon(releaseChunks.length - index);
        break;
      }
      // A THROWN release may still be committing (a stalled COMMIT whose
      // answer was lost), so the read WAITS OUT each row it still locks (FOR
      // SHARE; each wait bounded by the lock bound, the read by its statement
      // bound and wall, server/freehold_claim_db.ts) and decides it in this
      // pass. A read that throws too, or whose own COMMIT ends ambiguous on the
      // same stalled WAL, keeps the whole chunk, and a claim nobody renews
      // expires on its own after the TTL anyway.
      const readings = await releaseReadingsOf(sent, true);
      if (readings === 'deadline') {
        abandon(releaseChunks.length - index);
        break;
      }
      if (readings !== 'kept') settle(sent, readings);
      continue;
    }
    for (const claim of sent) {
      // What the statement released leaves, counted.
      if (released.has(claim.plotId)) bookRelease(claim);
    }
    // The ids the statement did not return, read lock-free (nothing of ours
    // is in flight on them): a row SKIP LOCKED passed over is still live under
    // this holder and stays for the next pass; an expired row of ours or
    // another holder's leaves.
    const notReleased = sent.filter((claim) => !released.has(claim.plotId));
    if (notReleased.length === 0) continue;
    const readings = await releaseReadingsOf(notReleased, false);
    if (readings === 'deadline') {
      abandon(releaseChunks.length - index);
      break;
    }
    if (readings !== 'kept') settle(notReleased, readings);
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
