import { describe, expect, it } from 'vitest';
import {
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

describe('owned-class level 20 balance harness (Groveheart)', () => {
  it('counts Groveheart heal-over-time ticks in the effective-healing profile', () => {
    const groveheart = groveheartGroup();

    expect(groveheart.healingBySource.Wildbloom).toBeGreaterThan(0);
    expect(groveheart.hps).toBeGreaterThan(0);
    // One three-ally probe: 15.4 s in the PR lane, 19.2 s on the release/v0.45.0 and main
    // nightlies and 20.9 s (over the 20 s default) on a busier feature/freeholds nightly,
    // so it carries a declared budget like its sibling below.
  }, 60_000);

  it('holds the Groveheart interim healer contract on both profiles', () => {
    // Single target: inside the peer envelope at the shared seed.
    const singlePeers = (['spiritmend', 'doctrine', 'benison'] as const).map(
      (spec) => runOwnedHealerProbe(spec, 1, 29_914).hps,
    );
    const single = runOwnedHealerProbe('groveheart', 1, 29_914).hps;
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
  }, 300_000);
});
