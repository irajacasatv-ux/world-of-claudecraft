import { describe, expect, it } from 'vitest';
import {
  applyInstanceScanTick,
  createInstanceScanTickStats,
  resetInstanceScanCapture,
} from '../../server/instance_scan_tick_stats';

describe('instance sweep capture statistics', () => {
  it('keeps quiet-tick zeroes visible while retaining captured sweep totals and peak', () => {
    const stats = createInstanceScanTickStats();
    expect(stats).toEqual({
      lastClaimedSlotVisits: 0,
      lastOwnerRosterVisits: 0,
      lastOwnerClaimTests: 0,
      claimedSlotVisitsTotal: 0,
      claimedSlotVisitsMaxPerTick: 0,
      ownerRosterVisitsTotal: 0,
      ownerClaimTestsTotal: 0,
    });
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 7, ownerRosterVisits: 13, ownerClaimTests: 4 },
      true,
    );
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 3, ownerRosterVisits: 2, ownerClaimTests: 9 },
      true,
    );
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 0, ownerRosterVisits: 0, ownerClaimTests: 0 },
      true,
    );
    expect(stats).toEqual({
      lastClaimedSlotVisits: 0,
      lastOwnerRosterVisits: 0,
      lastOwnerClaimTests: 0,
      claimedSlotVisitsTotal: 10,
      claimedSlotVisitsMaxPerTick: 7,
      ownerRosterVisitsTotal: 15,
      ownerClaimTestsTotal: 13,
    });
  });
  it('noncapturing ticks replace every latest field without touching capture totals or peak', () => {
    const stats = createInstanceScanTickStats();
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 5, ownerRosterVisits: 12, ownerClaimTests: 3 },
      true,
    );
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 99, ownerRosterVisits: 101, ownerClaimTests: 8 },
      false,
    );
    expect(stats).toEqual({
      lastClaimedSlotVisits: 99,
      lastOwnerRosterVisits: 101,
      lastOwnerClaimTests: 8,
      claimedSlotVisitsTotal: 5,
      claimedSlotVisitsMaxPerTick: 5,
      ownerRosterVisitsTotal: 12,
      ownerClaimTestsTotal: 3,
    });
  });
  it('a fresh capture resets accumulators, preserves latest, and can raise a later peak', () => {
    const stats = createInstanceScanTickStats();
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 18, ownerRosterVisits: 4, ownerClaimTests: 7 },
      true,
    );
    resetInstanceScanCapture(stats);
    expect(stats).toEqual({
      lastClaimedSlotVisits: 18,
      lastOwnerRosterVisits: 4,
      lastOwnerClaimTests: 7,
      claimedSlotVisitsTotal: 0,
      claimedSlotVisitsMaxPerTick: 0,
      ownerRosterVisitsTotal: 0,
      ownerClaimTestsTotal: 0,
    });
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 2, ownerRosterVisits: 5, ownerClaimTests: 1 },
      true,
    );
    applyInstanceScanTick(
      stats,
      { claimedSlotVisits: 6, ownerRosterVisits: 8, ownerClaimTests: 3 },
      true,
    );
    expect(stats.claimedSlotVisitsMaxPerTick).toBe(6);
    expect(stats.claimedSlotVisitsTotal).toBe(8);
    expect(stats.ownerRosterVisitsTotal).toBe(13);
    expect(stats.ownerClaimTestsTotal).toBe(4);
  });
});
