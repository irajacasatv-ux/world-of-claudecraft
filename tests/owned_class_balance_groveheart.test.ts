import { describe, expect, it } from 'vitest';
import {
  OWNED_CLASS_PBE_TALENTS,
  type OwnedHealerBalanceResult,
  runOwnedHealerProbe,
} from '../scripts/owned_class_balance_probe';

// Part of the owned-class level 20 balance family (docs/qa-gate.md, "The
// long-sims lanes"). This file reads no diet flag: its probes run the same
// configuration at PR time and nightly.

// The three-ally Groveheart run at the contract seed, run once per file: the
// heal-over-time case reads its healing profile and the contract case its hps,
// so the file pays one three-ally Groveheart probe, not one per case at two seeds.
let groupRun: OwnedHealerBalanceResult | undefined;
const groveheartGroup = (): OwnedHealerBalanceResult =>
  (groupRun ??= runOwnedHealerProbe('groveheart', 3, 29_914));
// The one-ally Groveheart run at the contract seed on the fixture's own talents, paid once:
// the contract case reads its hps and the capstone case its engine trace (its row 20 is one
// of the three capstones).
let singleRun: OwnedHealerBalanceResult | undefined;
const groveheartSingle = (): OwnedHealerBalanceResult =>
  (singleRun ??= runOwnedHealerProbe('groveheart', 1, 29_914));

// The three level-20 capstones (the druid row 20 in src/sim/content/choice_rows_classic.ts),
// by their literal row ids, so a harness that swapped or dropped a row reads as a mismatch.
const CAPSTONE_ROWS = {
  naturesEcho: 'dru_r20_improved_hurricane',
  wildApex: 'dru_r20_berserk',
  quickening: 'dru_r20_tranquility',
} as const;

describe('owned-class level 20 balance harness (Groveheart)', () => {
  it('counts Groveheart heal-over-time ticks in the effective-healing profile', () => {
    const groveheart = groveheartGroup();

    expect(groveheart.healingBySource.Wildbloom).toBeGreaterThan(0);
    expect(groveheart.hps).toBeGreaterThan(0);
    // One three-ally probe: 15.4 s in the PR lane, 19.2 s on the release/v0.45.0 and main
    // nightlies and 20.9 s (over the 20 s default) on a busier feature/freeholds nightly,
    // so it carries a declared budget like its sibling below. With the production idle
    // cull it measured 3.2 to 3.6 s local at one worker (2026-09-29): the 60 s floor.
  }, 60_000);

  it('holds the Groveheart interim healer contract on both profiles', () => {
    // Single target: inside the peer envelope at the shared seed.
    const singlePeers = (['spiritmend', 'doctrine', 'benison'] as const).map(
      (spec) => runOwnedHealerProbe(spec, 1, 29_914).hps,
    );
    const single = groveheartSingle().hps;
    expect(single).toBeGreaterThanOrEqual(Math.min(...singlePeers));
    expect(single).toBeLessThanOrEqual(Math.max(...singlePeers) * 1.15);

    // Group profile: INTERIM floor, not the envelope. The v0.31 healer
    // retunes lifted every peer's three-ally throughput while Groveheart
    // still carries its v0.29 values, and under the heavier pressure the
    // garden never plants (pure triage). Closing that gap is the flagged
    // PBE values pass for the druid stack; this floor only guards against
    // regressions below the measured interim state.
    const groupPeers = (['spiritmend', 'doctrine', 'benison'] as const).map(
      (spec) => runOwnedHealerProbe(spec, 3, 29_914).hps,
    );
    const group = groveheartGroup().hps;
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): actual
    // 0.5997 at both depths (one seed, 29_914; the unculled parent measured 0.8794 over the
    // 0.45 floor); the same relative margin gives 0.307.
    expect(group).toBeGreaterThanOrEqual(Math.min(...groupPeers) * 0.307);
    expect(group).toBeLessThanOrEqual(Math.max(...groupPeers) * 1.15);

    // Absolute floors so the whole band cannot sink together unnoticed: the
    // agility-loadout regression measured 65.0 and 26.2 here.
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts): actuals
    // 100.97 single / 85.23 group at both depths (one seed; the unculled parent measured
    // 100.97 / 92.98 over the 80 / 40 floors); the same relative margins give 80 / 37.
    expect(single).toBeGreaterThanOrEqual(80);
    expect(group).toBeGreaterThanOrEqual(37);
    // 180 s since 2026-09-29 (was 300 s): 15.0 to 17.1 s local at one worker with the
    // production idle cull, about ten times that rounded up to a whole 30 s.
  }, 180_000);

  // The hps of every Groveheart profile reads the same under all three capstones, so the
  // capstones are told apart by their documented mechanics at the cast instead (the trace:
  // scripts/groveheart_engine_trace.ts). Measured 2026-09-30: the three-ally pressure wipes
  // the party before the garden reaches five Verdance (all three allies dead by about 32 s
  // here and 40 s at the druid matrix's seed 4242, Verdance peaking at 3 of 5), so
  // Overbloom, the only spend Nature's Echo and Wild Apex act on, never fires; Quickening's
  // mana lands (three stages) but never binds while an ally lives (1,389 mana left at the
  // 4242 wipe), so the matrix reads 63.26 hps under each row. The one-ally run below fires
  // Overbloom (two casts under Nature's Echo, one under each other row) on a topped-off
  // ally, so every harvest overheals whole and it reads 100.97 hps under each row. The
  // expected values come from the tooltips, never from a run: Overbloom heals 60 percent of
  // what the harvested effects had left, Wild Apex makes it 25 percent stronger, Nature's
  // Echo refills the spent bank with 1 already gained, and Quickening restores 2 percent of
  // maximum mana per Verdance gained (capped at the pool, after the cast's cost).
  it('tells the three capstones apart by their documented mechanics', () => {
    expect(OWNED_CLASS_PBE_TALENTS.groveheart?.rows[20]).toBe(CAPSTONE_ROWS.wildApex);
    for (const [capstone, row] of Object.entries(CAPSTONE_ROWS)) {
      const run =
        row === CAPSTONE_ROWS.wildApex
          ? groveheartSingle()
          : runOwnedHealerProbe('groveheart', 1, 29_914, 'working-tree', { 20: row });
      expect(run.talents.rows[20], capstone).toBe(row);
      const trace = run.groveheartEngine;
      if (!trace) throw new Error(`${capstone}: the Groveheart run carries no engine trace`);

      // Both capstone paths are reached under every row, so no check below reads an empty
      // list: an instant Wildbloom that banked Verdance, and an Overbloom that harvested.
      expect(
        trace.sowings.filter((sowing) => sowing.verdanceAfter > sowing.verdanceBefore).length,
        `${capstone}: Wildblooms that banked Verdance`,
      ).toBeGreaterThan(0);
      expect(
        trace.overblooms.filter((overbloom) => Object.keys(overbloom.harvestLeft).length > 0)
          .length,
        `${capstone}: Overblooms that harvested`,
      ).toBeGreaterThan(0);

      // Quickening: 2 percent of maximum mana per Verdance stage gained; nothing otherwise.
      const perStage = capstone === 'quickening' ? Math.round(run.resource.max * 0.02) : 0;
      for (const sowing of trace.sowings) {
        const gained = sowing.verdanceAfter - sowing.verdanceBefore;
        expect(sowing.manaAfter, `${capstone}: mana after a Wildbloom`).toBe(
          Math.min(run.resource.max, sowing.manaBefore - sowing.cost + gained * perStage),
        );
      }
      const apex = capstone === 'wildApex' ? 1.25 : 1;
      for (const overbloom of trace.overblooms) {
        // Wild Apex: each harvested ally is asked for 60 percent of what its effects had
        // left, 25 percent more under the row.
        expect(Object.keys(overbloom.healRequested).sort(), capstone).toEqual(
          Object.keys(overbloom.harvestLeft).sort(),
        );
        for (const [allyId, left] of Object.entries(overbloom.harvestLeft)) {
          expect(overbloom.healRequested[Number(allyId)], `${capstone}: Overbloom heal`).toBe(
            Math.round(left * 0.6 * apex),
          );
        }
        // Nature's Echo: the spent bank starts refilling with 1 already gained; the other
        // rows start it from empty.
        expect(overbloom.verdanceAfter, `${capstone}: Verdance after Overbloom`).toBe(
          capstone === 'naturesEcho' ? 1 : 0,
        );
      }
    }
    // 60 s, about ten times its local time at one worker: 2.3 s after the contract case
    // (two one-ally probes; the Wild Apex row reads that case's run), 5.8 s run alone.
  }, 60_000);
});
