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
// The "wanted" predicate is the host's (server/freehold_persist_wiring.ts):
// the store holds the owner with a session or owed work, the sim holds its
// live record, a mutation or recovery pass is in flight for the plot, or the
// claim is younger than the login budget (a handshake between its first ask
// and its join bind). No player data reaches a log line here: counts only.
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

export interface FreeholdHeldClaim {
  readonly plotId: string;
  readonly accountId: number;
  /** Exact bigint text. */
  readonly generation: string;
  readonly acquiredAtMs: number;
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
}

export interface FreeholdClaimRegistry {
  record(claim: FreeholdHeldClaim): void;
  forPlot(plotId: string): FreeholdHeldClaim | undefined;
  /** The claim this process holds for the account's plot, if any. */
  forAccount(accountId: number): FreeholdHeldClaim | undefined;
  drop(plotId: string): void;
  /** A write to this plot ended without a proved answer: the token it stamped. */
  notePending(plotId: string, writeToken: string): void;
  pendingToken(plotId: string): string | null;
  clearPending(plotId: string): void;
  /** A mutation or recovery pass is working on this plot: wanted while held. */
  holdInFlight(plotId: string): () => void;
  inFlight(plotId: string): boolean;
  all(): readonly FreeholdHeldClaim[];
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
  };
}

export function createFreeholdClaimRegistry(): FreeholdClaimRegistry {
  const byPlot = new Map<string, FreeholdHeldClaim>();
  const byAccount = new Map<number, string>();
  const pending = new Map<string, string>();
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
    notePending(plotId, writeToken) {
      pending.set(plotId, writeToken);
    },
    pendingToken(plotId) {
      return pending.get(plotId) ?? null;
    },
    clearPending(plotId) {
      pending.delete(plotId);
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

/**
 * One pass of `renewFreeholdClaims`. Never rejects: a thrown chunk is counted
 * and its claims are kept for the next pass.
 */
export async function renewFreeholdClaims(deps: FreeholdClaimRenewerDeps): Promise<void> {
  const nowMs = deps.nowMs();
  const held = [...deps.registry.all()].sort((a, b) =>
    a.plotId < b.plotId ? -1 : a.plotId > b.plotId ? 1 : 0,
  );
  const wanted = held.filter((claim) => deps.wanted(claim, nowMs));
  const wantedIds = new Set(wanted.map((claim) => claim.plotId));
  const unwanted = held.filter((claim) => !wantedIds.has(claim.plotId));
  const { counters } = deps.registry;
  for (const chunk of chunks(wanted, FREEHOLD_CLAIM_RENEW_CHUNK)) {
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
  for (const chunk of chunks(unwanted, FREEHOLD_CLAIM_RENEW_CHUNK)) {
    let released: Set<string>;
    try {
      released = await runFreeholdTransaction(deps.pool, FREEHOLD_CLAIM_RENEW_BOUNDS, (tx) =>
        releaseFreeholdClaimRows(
          tx,
          deps.holder,
          chunk.map((claim) => claim.plotId),
        ),
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
      stillHeld = await runFreeholdTransaction(deps.pool, FREEHOLD_CLAIM_RENEW_BOUNDS, (tx) =>
        freeholdClaimsStillHeldOnClient(
          tx,
          deps.holder,
          notReleased.map((claim) => claim.plotId),
        ),
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
