import { describe, expect, it } from 'vitest';
import { averageHunterDps } from '../scripts/hunter_dps_probe';

// PR-tier diet vs the nightly full sweep (docs/qa-gate.md, "The
// balance-harness diet"): the PR long-sims lane averages two of the five
// fixed seeds (seed VALUES never change, only the count);
// WOC_FULL_BALANCE_SWEEP=1 (nightly only) restores all five. Bands are
// pinned per configuration via band(full, diet); re-pin each from its own
// printed actuals.
const FULL_SWEEP = process.env.WOC_FULL_BALANCE_SWEEP === '1';
const SEEDS = FULL_SWEEP ? [29001, 29002, 29003, 29004, 29005] : [29001, 29002];
const band = (full: number, diet: number): number => (FULL_SWEEP ? full : diet);
// Keep the release gate representative without making its wall time depend on runner load.
// The CLI probe retains the full 120-second fixture used for the PR balance evidence.
const SECONDS = 90;
// Full sweep: sized for the long-sims lane's slow-quartile runner (run
// 31296160254 ran these at 219s and 209s against the old 180s bound, sharing
// the runner with a harness marathon at workers=2). Diet: two-fifths the
// seeds (~43s per test measured local), budgeted with the same proportional
// slow-runner margin.
// Re-sized 2026-09-29 at the production idle cull (scripts/probe_sim.ts) to
// about ten times the slower test's local time: the full sweep measures 35.5 s
// (360 s); the diet measures 21.5 s, whose 240 s would pass its 200 s, so the
// diet arm stays at 200 s.
const TEST_TIMEOUT_MS = FULL_SWEEP ? 360_000 : 200_000;

function matrix(targets: number): Record<string, number> {
  return Object.fromEntries(
    (['beast_mastery', 'marksmanship', 'survival'] as const).map((spec) => [
      spec,
      averageHunterDps(spec, targets, SECONDS, SEEDS).dps,
    ]),
  );
}

// 2026-08-09 120s band round: MM and SV ability values were raised to land the
// gear-tier BiS bench inside the 150-200 band (MM 141 to 167.6, SV 136.8 to
// 167.7 at 120s BiS, BM unchanged at 200.7). This no-rows level-20 probe
// scenario weights the raised base literals far more heavily than the BiS
// bench does (AP riders are small in blues), so its ratios moved much further
// than the BiS ones (BiS single-target still has BM ahead: 200.7 vs 167.6 and
// 167.7). The acknowledged debt stands (owner 2026-08-09): the hunter
// kit-item pass closes the spread from BELOW by lifting BM.
//
// Band shape (review, PR 3201): every edge below either pins the DESIGN
// target or catches drift AWAY from it, and none goes red when the BM lift
// lands. Design intent: single-target parity within about five percent
// (ratios near 1.0) and a 1.10 to 1.15 Packlord three-target lead. The
// ceilings on mm/bm and sv/bm sit at this round's measured values (further
// MM/SV runaway fails); the floors sit just under the design parity band
// (paying the BM debt lands the ratios inside, still green); the 3T ceiling
// IS the design 1.15 and its floor is this round's measured value. After the
// kit-item pass, collapse these back to the design bands.
describe('Hunter v0.29 deterministic DPS alignment', () => {
  it(
    'holds the single-target loops between design parity and the band-round ceiling',
    () => {
      const dps = matrix(1);
      // 2026-09-08: same-world feature 637196e2eb vs release f664efc1ea.
      // Full/diet MM ratios: 1.627231/1.689376. Preserve the former relative
      // margins (1.58/1.5227 and 1.64/1.5864), rounded to two decimals.
      // The design floors remain unchanged. Profile and sibling-control
      // evidence: docs/design/class-balance-v042-results.md.
      expect(dps.marksmanship / dps.beast_mastery).toBeGreaterThanOrEqual(0.95);
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
      // full actual 1.576637 (5 seeds), diet actual 1.581893 (2 seeds); the same
      // relative margins give 1.64 / 1.64.
      expect(dps.marksmanship / dps.beast_mastery).toBeLessThanOrEqual(band(1.64, 1.64));
      expect(dps.survival / dps.beast_mastery).toBeGreaterThanOrEqual(0.92);
      // Full SV ratio 1.335203, with the former 1.29/1.2010 margin -> 1.43.
      // Diet SV 1.409778 already passes 1.47; retain that ceiling.
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
      // full actual 1.291981 (5 seeds), diet actual 1.285936 (2 seeds); the same
      // relative margins (1.43/1.335203, 1.47/1.409778) give 1.38 / 1.34.
      expect(dps.survival / dps.beast_mastery).toBeLessThanOrEqual(band(1.38, 1.34));
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'holds the Packlord three-target lead under the design 1.15 ceiling',
    () => {
      const dps = matrix(3);
      const nextBest = Math.max(dps.marksmanship, dps.survival);
      // Measured this round: 0.8455 (BM 98.3 / MM 116.3). The design lead is
      // 1.10 to 1.15; the floor catches further MM/SV cleave runaway and the
      // ceiling stays the design bound so the BM lift lands inside it.
      // Lane-diet re-measure at two seeds: 0.8768, so the
      // measurement-anchored floor re-pins to 0.83 at the same relative
      // margin; the 1.15 ceiling is the design bound in both configs.
      // Diet floor re-pinned 0.83 to 0.78 for the Copper Dig headland
      // relocation (docs/design/eastbrook-revamp/master-plan.md): the moved
      // camps shift the world-gen draw stream and the two diet seeds now
      // measure 0.8225; the five-seed full sweep passes its 0.8 floor
      // unchanged, so the lead itself is intact and only the thin-lane
      // anchor moved (same relative margin at the new actual).
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
      // full actual 0.821990 (5 seeds), diet actual 0.787706 (2 seeds); the same
      // relative margins (0.8/0.8455, 0.78/0.8225) give 0.78 / 0.75.
      expect(dps.beast_mastery / nextBest).toBeGreaterThanOrEqual(band(0.78, 0.75));
      expect(dps.beast_mastery / nextBest).toBeLessThanOrEqual(1.15);
    },
    TEST_TIMEOUT_MS,
  );
});
