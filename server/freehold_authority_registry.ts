// THE PROCESS-WIDE HANDLE on the realm's housing AUTHORITY counters (07a): the
// global plot claims this process holds and what happened to them, and the
// remote Hearth trips. The server/freehold_persist_registry.ts shape: the
// coordinator registers the two live sources, and the metrics scrape reads them
// here rather than through GameServer, answering zeros when none is registered
// (a test host, or a realm before its first construction). Counts only: no
// account id, owner key, plot id, token or holder can reach a scrape from here.
import type { FreeholdClaimCounters, FreeholdClaimRegistry } from './freehold_claim_registry';
import type { FreeholdHearthTripCounters } from './freehold_hearth_trip';

export interface FreeholdAuthorityStats {
  /** Claims this process holds right now. */
  readonly claimsHeld: number;
  readonly claims: Readonly<FreeholdClaimCounters>;
  readonly trips: Readonly<FreeholdHearthTripCounters>;
}

const ZERO_CLAIMS: FreeholdClaimCounters = {
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
  pendingSwept: 0,
  loginReads: 0,
  loginReadMsTotal: 0,
};

const ZERO_TRIPS: FreeholdHearthTripCounters = {
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
  droppedAfterCommit: 0,
  refusedPreQueue: 0,
  metered: 0,
  abandoned: 0,
  tripMsTotal: 0,
};

let claims: FreeholdClaimRegistry | null = null;
let trips: { readonly counters: FreeholdHearthTripCounters } | null = null;

/** Passing nulls unregisters, which is what a test teardown does. */
export function registerFreeholdAuthority(
  source: {
    readonly claims: FreeholdClaimRegistry;
    readonly trips: { readonly counters: FreeholdHearthTripCounters };
  } | null,
): void {
  claims = source?.claims ?? null;
  trips = source?.trips ?? null;
}

/** The LIVE registry, for the one caller that must act on it rather than read
 *  it: the shutdown release (server/main.ts), so a release at exit leaves the
 *  registry and books claim_released like any other. Undefined when none is
 *  registered. */
export function heldClaims(): FreeholdClaimRegistry | undefined {
  return claims ?? undefined;
}

/** One scrape: COPIES, so a caller can never reach the live counters. */
export function freeholdAuthorityStats(): FreeholdAuthorityStats {
  return {
    claimsHeld: claims ? claims.count() : 0,
    claims: { ...(claims?.counters ?? ZERO_CLAIMS) },
    trips: { ...(trips?.counters ?? ZERO_TRIPS) },
  };
}
