import { describe, expect, it } from 'vitest';
import { runWarlockBalanceProbe } from '../scripts/warlock_balance_probe';

// The five-minute windows pin the INVARIANTS that hold across every
// composition this branch flows through (standalone and the class-overhauls
// integration line, whose talent threading moves absolute DPS and the exact
// starvation onset): the mana pool is genuinely finite (the pool is spent by
// the five-minute mark), starvation never runs away, and each spec stays
// inside a sanity corridor. The old release-v0.33 absolute bands were
// composition-relative and are deliberately retired (owner ruling: the
// starvation floor was the stale half). Corridors re-minted 2026-08-23 with
// the PVE viability round (the fixture kit re-anchor plus the spellDmgPct
// floors); measured seed-42 actuals were 206/179/199. The two-minute anchors
// live in the per-spec tests/warlock_anchor_*.test.ts files since the
// 2026-08-13 split; each file's seed-42 level-20 dummy tripwire is the exact
// first 120 s of the matching window below (the rotation never reads the
// window length), so the two are re-measured together at one configuration.
// Each window's timeout is about ten times its local time, measured 2026-09-29
// at the production idle cull (10.4 s, 6.3 s and 6.9 s).
describe('Affliction full-BiS five-minute inert-boss balance', () => {
  it('spends the mana pool by five minutes inside the sanity corridor', () => {
    const result = runWarlockBalanceProbe('affliction', 42, 300);

    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
    // seed-42 actual 204.47 DPS against the 206 the corridor was minted on; the
    // same relative margins give 174 / 233.
    expect(result.dps).toBeGreaterThanOrEqual(174);
    expect(result.dps).toBeLessThanOrEqual(233);
    // Mana-end corridor widened 0.05 to 0.09 (all three specs) by the 2/4/6,
    // then to 0.12 at the 2026-08-30 legendary band (Heartwood budget growth)
    // lineage retune: the halved haste and Clearcasting rates mean fewer
    // casts fit the five minutes, so more mana survives the window.
    // Re-anchor to the new tier's measured economy when the Phase B Crucible
    // set bonuses land (a new gear wave sets a new level; no old target to
    // restore).
    // 0.096 measured at the 2026-08-30 legendary band (Heartwood's spirit
    // and intellect grew with its ilvl-49 budget, so slightly more pool is
    // left at five minutes); the corridor widens to match.
    // 0.242 measured 2026-09-11 with the stamina baseline model
    // (item_budget.ts): the Deathless Heartwood was authored with its stamina
    // inside its line, so on the caster line the line was filled with Spirit
    // (25 to 43) and the kit's badge jewelry and Soulflame pieces gained
    // Spirit the same way; regen up, no Spell Power moved, so a quarter of the
    // pool survives the window. The corridor widens to 0.30 with the same
    // headroom the 0.12 line carried over its 0.096 measurement; the pool is
    // still finite (starvation still binds below).
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
    // seed-42 actual 0.212 against the 0.242 below; the same relative margins
    // give 0.26 / 0.16.
    expect(result.manaEndPct).toBeLessThan(0.26);
    // And a floor under the measured 0.242, so the larger surviving pool is
    // pinned from both sides rather than left open below.
    expect(result.manaEndPct).toBeGreaterThan(0.16);
    expect(result.starvedPct).toBeLessThan(0.45);
  }, 120_000);
});

describe('Demonology full-BiS five-minute inert-boss balance', () => {
  // Re-anchored for the v0.42.0 Necromancy retune (+20% demonology damage:
  // spec_output_tuning.ts's owner spell bonus 0.10 -> 0.32 plus the baseline
  // pet bonus 0.15 -> 0.42, docs/design/class-balance-v042-results.md).
  // Measured seed-42 actual moved 179 -> 228.92 on this fixture; the corridor
  // moves with it, preserving the SAME relative floor/ceiling margins as the
  // pre-v0.42.0 corridor (150/210 against a measured 179, i.e. about -16%/
  // +17%) rather than just raising the ceiling. This asserts demonology's own
  // corridor only; it overlaps Affliction's (174-233, above), so no cross-spec
  // ordering is claimed or tested here.
  // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
  // seed-42 actual 253.67 against the 228.92 above; the same relative margins
  // give 213 / 298.
  // The 0.12 end pool is a design constant, not a measured band. Measured
  // 2026-09-30 (this file reads no diet flag, so both depths run one probe):
  // end pool actual 0.0059 at both depths; affliction's margin would give 0.0072.
  // That figure is no band: the rotation holds the pool at its Hard Bargain
  // floor (0.30, tryDemonology in scripts/warlock_balance_probe.ts) while health
  // lasts, health runs out at about 260 s, and the pool then drains to whatever
  // is left under the next cast when the window closes: 0.0096 to 0.0186 at
  // seeds 1337, 9001, 777, 43 and 44, 0.018 here before the cull and 0.032 at a
  // 295 s window, each past 0.0072 with no balance change. The rule is this
  // file's finite-pool invariant, the pool spent rather than held at the tap
  // floor, and 0.12 sits between the two: a free Hard Bargain ends at 0.329
  // (dps 242.8, starved 0, inside every other check here) and only this line
  // reds it.
  it('lands the Necromancy-buffed sustained DPS corridor', () => {
    const result = runWarlockBalanceProbe('demonology', 42, 300);

    expect(result.dps).toBeGreaterThanOrEqual(213);
    expect(result.dps).toBeLessThanOrEqual(298);
    expect(result.manaEndPct).toBeLessThan(0.12);
    expect(result.starvedPct).toBeLessThan(0.45);
  }, 90_000);
});

describe('Destruction full-BiS five-minute inert-boss balance', () => {
  // Destruction had no five-minute window before the 2026-08-23 round (a
  // coverage gap the round's probe audit flagged); it gets the same
  // finite-pool and starvation invariants as its siblings.
  //
  // Re-anchored 2026-08-30 at the OSSBrain v0.41.0 base merge. The 0.12 end
  // pool was COPIED from the siblings above and never measured against this
  // rotation: destruction taps at a 30 percent floor (life_tap in
  // tryDestruction, scripts/warlock_balance_probe.ts), so its end-of-fight
  // mana is wherever the five-minute boundary lands in the tap cycle, not a
  // drain signal. Measured 0.180 with starvedPct 0 and 207.2 dps, and the
  // filler's mana cost does not move it at all (a +1 on Gloom Bolt reproduced
  // 0.18037518 to every digit). The invariants that actually bite here are the
  // dps band and starvedPct; the end-pool pin is widened to match the cycle.
  // Re-anchored at the v0.43 integration: the approved Ruinbolt cycle composes
  // with the later stamina/Spirit item-model pass, and seed 42 measures 241.176
  // DPS and 0.237 ending mana in the full-world BiS probe. The pool still spends
  // down; the check remains a finite-economy bound rather than a cycle-phase pin.
  // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
  // seed-42 actual 243.67 DPS and 0.220 ending mana against the 241.176 and
  // 0.237 above; the same relative margins give 172 / 258 and 0.28.
  it('spends the mana pool by five minutes inside the sanity corridor', () => {
    const result = runWarlockBalanceProbe('destruction', 42, 300);

    expect(result.dps).toBeGreaterThanOrEqual(172);
    expect(result.dps).toBeLessThanOrEqual(258);
    expect(result.manaEndPct).toBeLessThan(0.28);
    expect(result.starvedPct).toBeLessThan(0.45);
  }, 90_000);
});
