import { describe, expect, it } from 'vitest';
import { averageOwnedHealerProbe } from '../scripts/owned_class_balance_probe';
import { balanceSeeds, bandAt } from './helpers/balance_diet';

// PR-tier diet vs the nightly full sweep: the family contract lives in
// tests/helpers/balance_diet.ts (docs/qa-gate.md, "The balance-harness
// diet"). The flag read stays in THIS file because the diet-flag registry pin
// (tests/ci_shard_plan.test.ts) source-scrapes test files for the literal.
const FULL_SWEEP = process.env.WOC_FULL_BALANCE_SWEEP === '1';
const BALANCE_SEEDS = balanceSeeds(FULL_SWEEP);
const band = bandAt(FULL_SWEEP);

describe('owned-class level 20 balance harness (healer contract)', () => {
  it(
    'keeps each healer build inside its seed-averaged role and mana contract',
    () => {
      // No single-target Spiritmend run here: its one assertion (hps above zero)
      // is held per run, one and three allies, by every spec's first case in
      // tests/owned_class_balance_healer_probes.test.ts, which rides the same lane.
      const spiritmendGroup = averageOwnedHealerProbe('spiritmend', 3, BALANCE_SEEDS);
      const doctrineSingle = averageOwnedHealerProbe('doctrine', 1, BALANCE_SEEDS);
      const doctrineGroup = averageOwnedHealerProbe('doctrine', 3, BALANCE_SEEDS);
      const benisonSingle = averageOwnedHealerProbe('benison', 1, BALANCE_SEEDS);
      const benisonGroup = averageOwnedHealerProbe('benison', 3, BALANCE_SEEDS);

      // Lane-diet re-measure (full actuals at 5 seeds / diet at 2): the healer
      // probes were nearly seed-stable, so most same-relative-margin re-pins
      // landed back on the full values at the diet's granularity: benison
      // recovery 4.75 in both, benisonGroup/spiritmendGroup hps ratio 1.0874 /
      // 1.0837 (floor stayed 0.8), benison resourceEnd 924.0+982.2 / 924.0+986.5
      // (floors stayed 250), spiritmendGroup resourceEnd 2234.2 / 2249.5 (floor
      // stayed 1_200), doctrineSingle hps+dps 155.31 / 154.48 (floor stayed 140),
      // doctrineGroup resourceEnd 719.6 / 727.5 (floor stayed 150). The one
      // mover: doctrineGroup hps+dps+absorbed/60 measured 168.06 full / 182.28
      // diet, so the diet floor was 130. Re-anchored for the Drakelands site
      // swap's shared-stream fork: the two diet seeds then measured 117.81
      // while the FULL five-seed lane passed unchanged at its 120 floor, so
      // the diet floor moved to 110. The proxy's drift below the full lane
      // was a diet-quality signal, not a balance change: FLAGGED for the
      // class owner (the third such re-anchor; the nightly full sweep stays
      // the arbiter). The idle-cull re-measure below re-pins every floor at
      // its own depth from those recorded actuals' relative margins.
      expect(benisonGroup.emergencyRecoverySeconds).toBeLessThan(
        spiritmendGroup.emergencyRecoverySeconds,
      );
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 1.0911 (5 seeds), diet actual 1.0900 (2 seeds); the same relative margins
      // give 0.803 / 0.805.
      expect(benisonGroup.hps).toBeGreaterThanOrEqual(spiritmendGroup.hps * band(0.803, 0.805));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 1109.2 (5 seeds), diet actual 1045.5 (2 seeds); the same relative margins
      // give 301 / 283.
      expect(benisonSingle.resourceEnd).toBeGreaterThanOrEqual(band(301, 283));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 1325.4 (5 seeds), diet actual 1302.5 (2 seeds); the same relative margins
      // give 338 / 331.
      expect(benisonGroup.resourceEnd).toBeGreaterThanOrEqual(band(338, 331));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 2349.0 (5 seeds), diet actual 2310.5 (2 seeds); the same relative margins
      // give 1_262 / 1_233.
      expect(spiritmendGroup.resourceEnd).toBeGreaterThanOrEqual(band(1_262, 1_233));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 163.90 (5 seeds), diet actual 163.67 (2 seeds); the same relative margins
      // give 148 / 149.
      expect(doctrineSingle.hps + doctrineSingle.dps).toBeGreaterThanOrEqual(band(148, 149));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 169.86 (5 seeds), diet actual 169.64 (2 seeds); the same relative margins
      // give 122 / 159 (the diet's is the site-swap re-anchor's 110 over 117.81, and the
      // culled diet proxy now sits on the full lane).
      expect(
        doctrineGroup.hps + doctrineGroup.dps + doctrineGroup.absorbedDamage / 60,
      ).toBeGreaterThanOrEqual(band(122, 159));
      // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): full
      // actual 1087.4 (5 seeds), diet actual 957.0 (2 seeds); the same relative margins
      // give 227 / 198.
      expect(doctrineGroup.resourceEnd).toBeGreaterThanOrEqual(band(227, 198));
      // Same owned-class matrix growth as the DPS metric test in
      // owned_class_balance_dps_metrics, same long-sims lane contention
      // doubling; the diet runs two of the five seeds. With the production
      // idle cull the case measured 27.1 s diet / 48.3 s full local at one
      // worker (2026-09-29): about ten times that gives 510 s full, and the
      // diet keeps its 240 s (never raised).
    },
    FULL_SWEEP ? 510_000 : 240_000,
  );
});
