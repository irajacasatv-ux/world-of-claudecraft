import { describe, expect, it } from 'vitest';
import {
  runWarlockBalanceProbe,
  WARLOCK_HEROIC_NYTHRAXIS_SCENARIO,
} from '../scripts/warlock_balance_probe';
import { bandAt } from './helpers/balance_diet';

// The 200 heroic anchor (owner directive, 2026-08-23 PVE viability round):
// each warlock spec converges on about 200 DPS at 120 seconds against the
// heroic Nythraxis profile (level-22 target wearing the real Nythraxis armor
// curve) in the re-anchored best real kit, the fix for live heroic parse tops
// of 169/133/131 while combat and fire topped 217 to 222. This supersedes the
// 2026-08-06 sub-200 ruling, which was minted on a zero-armor level-20 dummy
// and a fixture kit that forfeited both caster set bonuses and most hit
// rating. The level-20 dummy stays pinned below as the historical drift
// tripwire; demonology runs the hottest there because its undead neither miss
// a level-20 target nor meet any armor on the zero-armor shell. Both
// statistics are the probe harness's own four-seed mean, the same number the
// tuning study and the balance reports quote (a single seed wobbles a few
// points around it). One spec per file since the 2026-08-13 split, so the
// anchors spread across CI shards instead of sharing one file's wall clock.
// The PR long-sims lane runs a two-seed diet of these anchors and the nightly
// full sweep (WOC_FULL_BALANCE_SWEEP=1) all four seeds (docs/qa-gate.md, "The
// balance-harness diet"; seed VALUES never change, only the count). Each band
// is pinned per configuration via band(full, diet): the diet band keeps its full
// band's relative width around the two-seed mean measured 2026-09-27; re-pin
// each from its own printed actuals.
const FULL_SWEEP = process.env.WOC_FULL_BALANCE_SWEEP === '1';
const band = bandAt(FULL_SWEEP);
const ANCHOR_SEEDS = FULL_SWEEP ? ([42, 1337, 9001, 777] as const) : ([42, 1337] as const);

describe('demonology 200 DPS anchors at 120 seconds', () => {
  it('lands on the 200 DPS heroic Nythraxis anchor with a healthy economy', () => {
    const rows = ANCHOR_SEEDS.map((seed) =>
      runWarlockBalanceProbe('demonology', seed, 120, WARLOCK_HEROIC_NYTHRAXIS_SCENARIO),
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
    // Re-anchored for the 2026-08-30 legendary band: the frozen kit wields
    // Deathless Heartwood, now budget-true at ilvl 49 (65 stats + 25 Spell
    // Power), measured 187.3 on the gate run; the band keeps its width.
    // Re-anchored for the v0.42.0 Necromancy retune (+20% demonology damage:
    // spec_output_tuning.ts's owner spell bonus 0.10 -> 0.32 plus the
    // baseline pet bonus 0.15 -> 0.42, docs/design/class-balance-v042-results.md).
    // Measured 228.25 on this frozen kit; about plus or minus 5% around
    // that, same as every prior re-anchor here.
    // Re-anchored at the release/v0.43.0 merge into feature/world-quests: the
    // branch's hedge_knight camp move (src/sim/content/evergarden.ts,
    // c43178a68c) places its spawns from the shared Rng at Sim construction, so
    // it forks the stream for every later draw, exactly as it does for the
    // parity goldens. No warlock number changed: with that one line reverted on
    // this tip the old band passes. Measured 213.84 over the four seeds; the
    // band keeps its plus or minus 5% width.
    // Diet: 214.52 over seeds 42 and 1337, against a four-seed mean of 218.10
    // measured the same day (2026-09-27); the diet band is the full band scaled
    // by that ratio and rounded outward (older figures above predate it).
    expect(mean('dps')).toBeGreaterThanOrEqual(band(203, 199));
    expect(mean('dps')).toBeLessThanOrEqual(band(225, 222));
    expect(mean('starvedPct')).toBeLessThan(0.1);
  }, 240_000);

  it('holds the level-20 dummy drift tripwire', () => {
    const rows = ANCHOR_SEEDS.map((seed) => runWarlockBalanceProbe('demonology', seed, 120));
    const mean = (key: 'dps' | 'starvedPct') =>
      rows.reduce((sum, row) => sum + row[key], 0) / rows.length;

    // 228.3 measured at the 2026-08-23 re-anchor (see the header note on why
    // the zero-armor dummy flatters undead); about plus or minus 5%, so the
    // tripwire trips on a real collapse or runaway, not on engine drift.
    // Post-retune measurement 210.7 (see the heroic anchor note above).
    // Re-anchored for the v0.42.0 Necromancy retune (+20% demonology damage,
    // see the heroic anchor note above): measured 267.8625 on this frozen
    // kit (the zero-armor level-20 dummy still flatters undead, same as
    // every prior re-anchor here). Both floor and ceiling move by about
    // plus or minus 5% around the new measurement.
    // The Drakelands camps/props move changes the shared random stream.
    // Both post-buff bands pass unchanged on the merged world.
    // Diet: 268.25 over seeds 42 and 1337, against a four-seed mean of 267.00
    // measured the same day (2026-09-27); the diet band is the full band scaled
    // by that ratio and rounded outward (older figures above predate it).
    expect(mean('dps')).toBeGreaterThanOrEqual(band(254, 255));
    expect(mean('dps')).toBeLessThanOrEqual(band(281, 283));
    expect(mean('starvedPct')).toBeLessThan(0.1);
  }, 240_000);
});
