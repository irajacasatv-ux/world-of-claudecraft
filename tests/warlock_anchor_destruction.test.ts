import { describe, expect, it } from 'vitest';
import {
  runWarlockBalanceProbe,
  WARLOCK_HEROIC_NYTHRAXIS_SCENARIO,
} from '../scripts/warlock_balance_probe';
import { bandAt } from './helpers/balance_diet';

// September 8 approved tuning: a faster Gloom Bolt generator and a faster,
// guaranteed-critical Ruinbolt. Retain the historical full-world fixtures,
// four seeds, duration and economy guard; center the damage corridors on the
// measured new means. The isolated before/after matrix is recorded separately
// in docs/design/warlock-ruinbolt-feedback/README.md.
// The PR long-sims lane runs a two-seed diet of these anchors and the nightly
// full sweep (WOC_FULL_BALANCE_SWEEP=1) all four seeds (docs/qa-gate.md, "The
// balance-harness diet"; seed VALUES never change, only the count). Each band
// is pinned per configuration via band(full, diet): the diet band keeps its full
// band's relative width around the two-seed mean measured 2026-09-27; re-pin
// each from its own printed actuals.
const FULL_SWEEP = process.env.WOC_FULL_BALANCE_SWEEP === '1';
const band = bandAt(FULL_SWEEP);
const ANCHOR_SEEDS = FULL_SWEEP ? ([42, 1337, 9001, 777] as const) : ([42, 1337] as const);

describe('destruction Ruinbolt feedback anchors at 120 seconds', () => {
  it('lands on the approved Ruinbolt heroic anchor with a healthy economy', () => {
    const rows = ANCHOR_SEEDS.map((seed) =>
      runWarlockBalanceProbe('destruction', seed, 120, WARLOCK_HEROIC_NYTHRAXIS_SCENARIO),
    );
    const mean = (key: 'dps' | 'starvedPct') =>
      rows.reduce((sum, row) => sum + row[key], 0) / rows.length;

    // Re-anchored for the 2/4/6 lineage retune: the frozen kit stacks both
    // old caster families, so it pays the halved lineage ladder now (about a
    // 12 to 15 percent drop from the 2026-08-23 anchors, the measured size of
    // the deliberate nerf). The historical 200 DPS figure was the OLD tier's
    // owner target, not a ceiling to restore: the Crucible wave introduces a
    // new power level, so when the Phase B set bonuses land
    // (docs/prd/ignivar-set-bonus-final.md), re-anchor these to whatever the
    // new-tier kit actually measures, above 200 included.
    // Re-anchored for the 2026-08-30 legendary band (Heartwood in the frozen
    // kit; measured 190.9 on the gate run).
    // Re-anchored for the v0.42.0 Ruination retune (+10% destruction damage:
    // spec_output_tuning.ts's +0.11 offensive spell bonus plus the explicit
    // Pyre Aura pet-damage fix, docs/design/class-balance-v042-results.md).
    // Measured 203.75208333333336 on this frozen kit before the Ruinbolt-cycle
    // change. With the approved faster guaranteed-critical cycle, the same
    // release fixture measures 236.21875; keep about plus or minus 5% around
    // that, the same relative corridor as every prior re-anchor here.
    // Diet: 241.90 over seeds 42 and 1337.
    expect(mean('dps')).toBeGreaterThanOrEqual(band(224, 224));
    expect(mean('dps')).toBeLessThanOrEqual(band(249, 250));
    expect(mean('starvedPct')).toBeLessThan(0.1);
  }, 240_000);

  it('holds the level-20 dummy drift tripwire', () => {
    const rows = ANCHOR_SEEDS.map((seed) => runWarlockBalanceProbe('destruction', seed, 120));
    const mean = (key: 'dps' | 'starvedPct') =>
      rows.reduce((sum, row) => sum + row[key], 0) / rows.length;

    // 209.8 measured at the 2026-08-23 re-anchor; about plus or minus 5%, so
    // the tripwire trips on a real collapse or runaway, not on engine drift.
    // Post-retune measurement 190.5 (see the heroic anchor note above).
    // Re-anchored 2026-08-30 at the OSSBrain v0.41.0 base merge: the new gear
    // lifts the level-20 dummy to 207.2, so the old 206 ceiling was measuring
    // the gear, not drift. Ceiling moves to measurement plus 5% (218); the
    // floor stays where it was, since it still guards a real collapse.
    // Re-anchored for the v0.42.0 Ruination retune (+10% destruction damage,
    // see the heroic anchor note above): measured 227.5625 on this frozen
    // kit. Both floor and ceiling move by about plus or minus 5% around the
    // new measurement. The approved Ruinbolt-cycle change then measures
    // 252.82708333333335 on the same release fixture; preserve that same
    // relative corridor (this pin has no separate collapse-guard rationale
    // for its floor, unlike the OSSBrain re-anchor above).
    // Diet: 251.50 over seeds 42 and 1337.
    expect(mean('dps')).toBeGreaterThanOrEqual(band(240, 238));
    expect(mean('dps')).toBeLessThanOrEqual(band(266, 265));
    expect(mean('starvedPct')).toBeLessThan(0.1);
  }, 240_000);
});
