export interface InstanceScanTickStats {
  lastClaimedSlotVisits: number;
  lastOwnerRosterVisits: number;
  lastOwnerClaimTests: number;
  claimedSlotVisitsTotal: number;
  claimedSlotVisitsMaxPerTick: number;
  ownerRosterVisitsTotal: number;
  ownerClaimTestsTotal: number;
}

export function createInstanceScanTickStats(): InstanceScanTickStats {
  return {
    lastClaimedSlotVisits: 0,
    lastOwnerRosterVisits: 0,
    lastOwnerClaimTests: 0,
    claimedSlotVisitsTotal: 0,
    claimedSlotVisitsMaxPerTick: 0,
    ownerRosterVisitsTotal: 0,
    ownerClaimTestsTotal: 0,
  };
}

export function resetInstanceScanCapture(stats: InstanceScanTickStats): void {
  stats.claimedSlotVisitsTotal = 0;
  stats.claimedSlotVisitsMaxPerTick = 0;
  stats.ownerRosterVisitsTotal = 0;
  stats.ownerClaimTestsTotal = 0;
}

/** Latest values include zero on non-sweep ticks; capture totals retain each sweep. */
export function applyInstanceScanTick(
  stats: InstanceScanTickStats,
  scan: { claimedSlotVisits: number; ownerRosterVisits: number; ownerClaimTests: number },
  capturing: boolean,
): void {
  stats.lastClaimedSlotVisits = scan.claimedSlotVisits;
  stats.lastOwnerRosterVisits = scan.ownerRosterVisits;
  stats.lastOwnerClaimTests = scan.ownerClaimTests;
  if (!capturing) return;
  stats.claimedSlotVisitsTotal += scan.claimedSlotVisits;
  stats.claimedSlotVisitsMaxPerTick = Math.max(
    stats.claimedSlotVisitsMaxPerTick,
    scan.claimedSlotVisits,
  );
  stats.ownerRosterVisitsTotal += scan.ownerRosterVisits;
  stats.ownerClaimTestsTotal += scan.ownerClaimTests;
}
