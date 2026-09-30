import { describe, expect, it } from 'vitest';
import {
  bestDruidBuilds,
  combineDruidSeedRuns,
  DRUID_CAPSTONES,
  DRUID_PROBE_PROFILES,
  DRUID_PROBE_SECONDS,
  DRUID_PROBE_SEEDS,
  type DruidBalanceResult,
  type DruidBruinTankResult,
  type DruidProbeProfile,
  runDruidBalanceSeed,
  runDruidBruinTankProbe,
  runDruidLiveMobProbe,
} from '../scripts/druid_balance_probe';
import { equipReferenceEpicKitForDev } from '../src/sim/dev/bis_gear';
import { Sim } from '../src/sim/sim';
import { bandAt } from './helpers/balance_diet';

// The fixture loadout the live-mob and Bruin probes equip (scripts/
// druid_balance_probe.ts runDruidLiveMobProbe / bruinFixture:
// equipReferenceEpicKitForDev over a level-20 druid, balance and feral both).
// The bands below are conditioned on EXACTLY this loadout (the
// identity-pin-plus-band precedent of tests/rogue_dps_balance.test.ts), so a
// picker or catalog change that swaps a piece reds HERE with a gear message,
// never in a band with a damage message.
// RE-DERIVED 2026-09-08 after the v0.42.0 release merge (release integration
// dca7476) landed on the historical harness: a virtual replay of the
// pre-merge catalog at commit f73615a511 reproduces the old pin exactly
// (moongrove 3429/214/3430/5, wildfang 4911/205/5755.24/12, bruin
// 2589/148/8461.88/4, tank 229/147/0.358/214.5/896.61), confirming those
// anchors belong to the older tree, not this one. Against that confirmed
// baseline the merged catalog's reference picker changed exactly two slots:
// helmet heroic_nighttalon_crown -> heroic_bramblehide_crown and feet
// ashenbark_treads -> heroic_bramblehide_treads (Bramblehide is not
// spec-restricted at the equip gate). The other nine slots are unchanged.
// RE-DERIVED 2026-09-10 with the stamina baseline model (src/sim/item_budget.ts):
// the reference picker now scores only the class LINE plus stamina (a caster
// piece totals a third more than a physical one of the same tier, so a raw
// five-stat sum would have dressed every class in healer gear), which means the
// balance and feral fixtures no longer share one loadout. The balance druid
// wears caster leather (crucible caster chest and waist, Grovespring, the
// Thornpeak cowl, caster rings) instead of the Ashveil physical set and a
// Strength ring it wore by accident of the old sum; the feral and Bruin
// fixtures keep Ashveil and swap their two caster jewelry slots for Ignivar's
// Ember Choker and the Seal of the Forgewall. Both are pinned on their own.
const BALANCE_LOADOUT = {
  mainhand: 'wand_of_quenched_sparks',
  helmet: 'heroic_thornpeak_moonhide_cowl',
  neck: 'heartspring_amulet',
  shoulder: 'grovespring_shoulder',
  chest: 'crucible_caster_leather_chest',
  waist: 'crucible_caster_leather_waist',
  legs: 'grovespring_legs',
  gloves: 'grovespring_gloves',
  feet: 'heroic_bramblehide_treads',
  ring1: 'circle_of_cinders',
  ring2: 'loop_of_quiet_springs',
  // The trinket slot (PR 4173): the reference epic kit fills it with the
  // Varkhul caster trinket; the live-mob bands below held at the same seed.
  trinket: 'heart_of_the_crucible',
} as const;
const FERAL_LOADOUT = {
  mainhand: 'wand_of_quenched_sparks',
  helmet: 'heroic_bramblehide_crown',
  neck: 'ignivars_ember_choker',
  shoulder: 'ashveil_shoulder',
  chest: 'ashveil_chest',
  waist: 'cinderbark_cinch',
  legs: 'ashveil_legs',
  gloves: 'ashveil_gloves',
  feet: 'heroic_bramblehide_treads',
  ring1: 'band_of_marked_strikes',
  ring2: 'seal_of_the_forgewall',
  // The trinket slot (PR 4173): the reference epic kit's physical pick.
  trinket: 'forgefathers_temper',
} as const;

// MEASURED 2026-09-08 on the merged release catalog (integration dca7476) at
// the fixed seeds. This is a full-world probe (shared RNG plus live mobs), so
// a release world change can move sampling on its own; not every delta below
// is a tuning change. It is also not gear alone: an old-gear-only virtual
// restriction against the historical catalog did NOT reproduce the old
// numbers. The merge does carry documented feral tuning in the same
// integration (src/sim/content/spec_baselines.ts stats.apPct +0.1;
// src/sim/spec_output_tuning.ts physical offensive +0.15). Bands stay at
// BAND=0.08 either side of the new measurement; payoff counts are small
// integers and stay pinned exactly (a moved count is a rotation change).
// RE-MEASURED 2026-09-10 on the stamina baseline model at the same seeds. The
// gear moved first (the loadout pins above), and the bands follow it: moongrove
// in caster leather instead of the Ashveil physical set (damage 3655 to 5956,
// payoffs 5 to 7), wildfang and bruin with physical jewelry instead of caster
// jewelry (5896 to 6378 and 2803 to 3082, payoffs 10 to 12 and 3 to 4). The
// Bruin tank probe below did not leave its bands (snap threat 990.99 to
// 1003.86) and keeps its 2026-09-08 anchors.
// RE-MEASURED 2026-09-20 for the wildfang arm only, at the v0.43 feral pass:
// Nature's Boon (src/sim/combat/druid_natures_boon.ts) draws one rng per
// LANDED feral melee auto-attack, so every feral trace after the first landed
// swing re-rolls. Not a rotation or tuning change: with that one draw
// commented out this seed reproduces the 2026-09-10 row exactly (6378/286/
// 7473.827/12), and across seeds 42421 to 42425 the same rotation lands 6316
// to 6801 with the draw and 5299 to 6928 without it, so seed 42420 simply
// re-rolled onto a low trace (8 payoffs, 4921). Moongrove is Balance (the
// draw is feral-gated) and Bruin stayed inside its bands, so both keep their
// 2026-09-10 anchors.
// RE-MEASURED 2026-09-24 for the wildfang arm only, at the release/v0.44.0
// base merge into integration/world-quests-v0440 (65d4218ba1 + 7054645a6b):
// the same seed on the merged world (the branch's quartermasters, taskmaster
// and world-quest content beside the release's Boon draw) re-rolls the feral
// trace onto a higher one (damage 4921 to 5315, incoming 159 to 201, threat
// 5766.952 to 6228.5225), still 8 payoffs, so the rotation did not change.
// Measured identically on the integration tip and on the faction ladder
// branch (PR 4169). Moongrove (5982/225/5983/7) and Bruin (3060/139/
// 10541.4575/4) stayed inside their bands and keep their anchors.
// Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
// actual at seed 42420 (the same at both depths; these probes have no diet)
// moongrove 5945/228/5946/7, wildfang 7165/176/8395.7975/12, bruin
// 3265/112/10421.87375/4; the same relative margins (BAND either side, payoffs
// exact) give the anchors below. The cull moves idle rolls onto per-mob lanes, so
// every trace after construction re-rolls: the unculled parent read moongrove
// 5982/225/5983/7, wildfang 5537/201/6488.5955/8 and bruin 2946/132/9996.6275/4
// at this seed, and under the cull seeds 42421 to 42425 land wildfang 5749 to
// 7096 (10 to 12 payoffs), so the wildfang jump is the Boon trace re-rolling onto
// a 12-payoff row (as at 2026-09-10), not a rotation change.
const LIVE_MOB_MEASURED = {
  moongrove: { damage: 5945, incomingDamage: 228, threat: 5946, payoffs: 7 },
  wildfang: { damage: 7165, incomingDamage: 176, threat: 8395.7975, payoffs: 12 },
  bruin: { damage: 3265, incomingDamage: 112, threat: 10421.87375, payoffs: 4 },
} as const;
// Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
// actual at seed 42920 (both depths) wolf 239, bear 153 (35.98 percent less),
// 214.5 threat per 100 damage (unchanged: a flat multiplier product), snap threat
// 1012.44 (unchanged by the cull; the unculled parent already read 1012.44, inside
// the old 990.99 band); the same relative margins give the anchors below and the
// mitigation band in the Bruin case.
const BRUIN_TANK_MEASURED = {
  wolfIncomingDamage: 239,
  bruinIncomingDamage: 153,
  bruinMitigationPct: 0.3598,
  bruinThreatFrom100Damage: 214.5,
  marrowbreakSnapThreat: 1012.44,
} as const;
const BAND = 0.08;

// PR-tier diet vs the nightly full sweep (docs/qa-gate.md, "The balance-harness
// diet"): the PR long-sims lane runs the capstone matrix at the first fixed seed
// only, and WOC_FULL_BALANCE_SWEEP=1 (nightly only) runs all eight, the matrix
// the case below defines. The matrix bands are pinned per configuration via
// band(full, diet): the eight-seed bands keep the one-seed bands' relative width
// around their own measurement (2026-09-27: moongrove_1t 155.82 at one seed and
// 149.27 at eight, wildfang 198.89 and 191.86; 2026-09-29 at the production idle
// cull: 150.80 and 148.32, 198.22 and 194.57); re-pin each from its own actuals.
// The seed cases run only the two band-carrying profiles (moongrove_1t and
// wildfang, every capstone each), at one seed on the diet and all eight nightly.
// moongrove_3t and groveheart carry no band. Until 2026-09-29 the nightly ran them
// at all eight seeds for one pin, "the best capstone's seed average reads above
// zero": more seeds only weakened it (the average drops a zero seed), and it never
// saw a zero confined to one or two capstone rows. Owner ruling (Fernando,
// 2026-09-29, "One seed, every row"): the nightly runs them at ONE seed,
// NIGHTLY_ROW_SEED, and asserts EVERY capstone row above zero, 6 probes instead of
// 48, so a dead row under any single capstone now reds. At PR time an all-rows zero
// stays visible only through the PBE talent rows the sibling suites run, at their
// own seeds and windows: Moongrove three-target under dru_r20_improved_hurricane
// (owned_class_balance_dps_metrics, damage on every target) and Groveheart under
// dru_r20_berserk (owned_class_balance_healer_probes and _groveheart); a zero under
// the other capstone rows alone is nightly-only, in the one-seed case below. The
// capstone engines themselves are pinned in tests/druid_engines.test.ts and
// tests/natures_fury.test.ts, and on the Groveheart probe, where this matrix's hps cannot
// tell them apart, by tests/owned_class_balance_groveheart.test.ts. Each
// cell is its own fresh Sim, so the kept cells, and the bands on them, read exactly
// what they read in the whole matrix.
const FULL_SWEEP = process.env.WOC_FULL_BALANCE_SWEEP === '1';
const band = bandAt(FULL_SWEEP);
const MATRIX_SEEDS: readonly number[] = FULL_SWEEP ? DRUID_PROBE_SEEDS : [DRUID_PROBE_SEEDS[0]];
const MATRIX_PROFILES: readonly DruidProbeProfile[] = ['moongrove_1t', 'wildfang'];
// The nightly-only profiles and their one seed. NIGHTLY_ROW_SEED is the first
// fixed seed (4242), the one the diet already runs: a ranged Moongrove row reads 0
// at a seed whose anchor terrain breaks line of sight (the harness's zero-drop
// note), so an every-row pin needs a seed whose anchor is known clear, and 4242's
// is re-proven on every PR by the banded moongrove_1t cells at the same anchor.
const NIGHTLY_ROW_PROFILES: readonly DruidProbeProfile[] = ['moongrove_3t', 'groveheart'];
const NIGHTLY_ROW_SEED = DRUID_PROBE_SEEDS[0];
// Each seed case appends its seed and its run here; the band case combines the runs
// (in seed order).
const ranSeeds: number[] = [];
const seedRuns: DruidBalanceResult[][] = [];
const within = (measured: number) =>
  [measured * (1 - BAND), measured * (1 + BAND)] as [number, number];
// The Bruin tank probe at its banded seed, run once per file: the band case reads
// it, and the determinism case re-runs the same seed against it (a determinism
// check reuses its first run instead of paying two at a seed nothing else builds).
let bruinFirstRun: DruidBruinTankResult | undefined;
const bruinTankRun = (): DruidBruinTankResult =>
  (bruinFirstRun ??= runDruidBruinTankProbe(42_920, 'test-head'));

function fixtureEquipment(
  seed: number,
  spec: 'balance' | 'feral',
  rows: Record<number, string>,
): Record<string, string> {
  const sim = new Sim({ seed, playerClass: 'druid', autoEquip: true });
  sim.setPlayerLevel(20);
  if (!sim.applyTalents({ spec, rows })) throw new Error(`failed to apply ${spec}`);
  equipReferenceEpicKitForDev(sim.ctx, sim.player.id);
  const meta = sim.meta(sim.player.id);
  if (!meta) throw new Error('fixture druid has no PlayerMeta');
  return { ...(meta.equipment as Record<string, string>) };
}

describe('Druid v0.29 balance and live-mob harness', () => {
  it('defines the PDF-required 123-second, eight-seed, all-capstone matrix', () => {
    expect(DRUID_PROBE_SECONDS).toBe(123);
    expect(DRUID_PROBE_SEEDS).toEqual([4242, 777, 1313, 99, 2024, 555, 31337, 8080]);
    expect(Object.keys(DRUID_CAPSTONES)).toEqual(['naturesFury', 'wildApex', 'quickening']);
    expect(DRUID_PROBE_PROFILES).toEqual([
      'moongrove_1t',
      'moongrove_3t',
      'wildfang',
      'groveheart',
    ]);
    expect(MATRIX_SEEDS).toEqual(FULL_SWEEP ? [...DRUID_PROBE_SEEDS] : [DRUID_PROBE_SEEDS[0]]);
    expect(MATRIX_PROFILES).toEqual(['moongrove_1t', 'wildfang']);
    expect(NIGHTLY_ROW_PROFILES).toEqual(['moongrove_3t', 'groveheart']);
    expect(NIGHTLY_ROW_SEED).toBe(4242);
    // Every profile rides exactly one of the two arms.
    expect([...MATRIX_PROFILES, ...NIGHTLY_ROW_PROFILES].sort()).toEqual(
      [...DRUID_PROBE_PROFILES].sort(),
    );
  });

  it('combines per-seed runs by the zero-drop average, cell by cell', () => {
    const cell = (value: number, capstone: 'naturesFury' | 'wildApex' = 'naturesFury') =>
      ({ profile: 'moongrove_1t', capstone, metric: 'dps', value }) as DruidBalanceResult;
    // A stalled seed (exactly 0) is dropped from the average, as in the matrix itself.
    expect(combineDruidSeedRuns([[cell(100)], [cell(0)], [cell(140)]])).toEqual([cell(120)]);
    // Every seed stalled: the raw mean stays visible.
    expect(combineDruidSeedRuns([[cell(0)], [cell(0)]])).toEqual([cell(0)]);
    expect(combineDruidSeedRuns([])).toEqual([]);
    expect(() => combineDruidSeedRuns([[cell(1)], [cell(1, 'wildApex')]])).toThrow(
      'seed runs disagree at cell 0',
    );
    const otherProfile = { ...cell(1), profile: 'wildfang' } as DruidBalanceResult;
    expect(() => combineDruidSeedRuns([[cell(1)], [otherProfile]])).toThrow(
      'seed runs disagree at cell 0',
    );
    const otherMetric = { ...cell(1), metric: 'hps' } as DruidBalanceResult;
    expect(() => combineDruidSeedRuns([[cell(1)], [otherMetric]])).toThrow(
      'seed runs disagree at cell 0',
    );
    // A run missing a cell, or carrying one more than the first, is refused, never
    // silently trimmed.
    expect(() => combineDruidSeedRuns([[cell(1)], []])).toThrow('seed runs differ in length');
    expect(() => combineDruidSeedRuns([[cell(1)], [cell(1), cell(2)]])).toThrow(
      'seed runs differ in length',
    );
  });

  // One case per seed, so no single case carries the whole sweep: the nightly's eight
  // seeds together overran one 2,400 s case under the nightly's contention (run
  // 36444280897, 2026-09-28). Each seed's 12 profile x capstone combos over a 123 s
  // window take about 90 to 125 s solo (the eight measured 994 s together on
  // 2026-09-27); in the long-sims lane (workers=2) two heavy suites share the runner,
  // roughly doubling wall time (run 31288946173 failed one against a 150 s bound). The
  // unculled nightly bound was per seed, 900 s, under 3x the more than 300 s a seed
  // averaged in that nightly. A probe runs synchronously, so a bound fails an over-long
  // case when it finishes rather than cutting it short: 8 x 270 = 2,160 s is the most a
  // passing sweep's seed cases may take, not a cap on their wall time, which the nightly
  // job's 300-minute limit (shared with the rest of that job) bounds.
  // Re-sized 2026-09-29 for the production idle cull (scripts/probe_sim.ts), about ten
  // times the local case time rounded up to 30 s: the diet's seed case measured 25 s
  // locally, one worker (270 s). Since the one-seed ruling the same day every seed case
  // runs the same six banded combos at both depths (the nightly-only profiles moved to
  // their own one-seed case below), so both depths share that bound: a full seed case
  // measured 16 to 23 s.
  it.each(MATRIX_SEEDS.map((seed, index) => [seed, index + 1]))(
    'runs the matrix at seed %i (run %i)',
    (seed) => {
      ranSeeds.push(seed);
      seedRuns.push(runDruidBalanceSeed(seed, DRUID_PROBE_SECONDS, MATRIX_PROFILES));
    },
    270_000,
  );

  it('lands every banded profile and capstone, and the best builds inside their bands', () => {
    expect(seedRuns, 'every seed case ran').toHaveLength(MATRIX_SEEDS.length);
    expect(ranSeeds, 'each case received its own seed, in order').toEqual([...MATRIX_SEEDS]);
    // ...and ran it: every seed gives its own run. The probe's output depends on its
    // seed (see the one-seed and eight-seed figures above), so two seeds giving
    // identical runs of six results would mean a seed never reached the probe.
    expect(new Set(seedRuns.map((run) => JSON.stringify(run))).size).toBe(MATRIX_SEEDS.length);
    const results = combineDruidSeedRuns(seedRuns);
    // Literal, not derived from MATRIX_PROFILES: a profile the matrix silently
    // dropped must read as a short count here. The same six cells at both depths.
    expect(results).toHaveLength(6);
    expect(new Set(results.map((result) => result.profile))).toEqual(
      new Set(['moongrove_1t', 'wildfang']),
    );
    expect(new Set(results.map((result) => result.capstone))).toEqual(
      new Set(['naturesFury', 'wildApex', 'quickening']),
    );

    const best = bestDruidBuilds(results);
    const moongrove = best.find((result) => result.profile === 'moongrove_1t');
    const wildfang = best.find((result) => result.profile === 'wildfang');
    // This probe runs a fixed level-20 loadout, a low-SP proxy for Balance (spell
    // power ~105). Balance is re-seated onto spell-power coefficients calibrated
    // so its real searched best-in-slot (spell power ~150) lands at the ~200 DPS
    // Nythraxis anchor; on this proxy it reads ~160. Wildfang (agility melee) is
    // not under-geared here, so the arms are not directly comparable on the proxy
    // (real BiS parity is the montecarlo's job). These bands guard the proxy only.
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
    // moongrove_1t full actual 148.32 (8 seeds), diet actual 150.80 (1 seed);
    // wildfang full actual 194.57 (8 seeds), diet actual 198.22 (1 seed). The
    // 2026-09-27 margins (floor and ceiling over 149.27 / 155.82 and 191.86 /
    // 198.89, which the unculled parent still read exactly) give moongrove
    // 133.2 / 135.5 and 176.8 / 179, wildfang 161.3 / 164.5 and 200.7 / 204.3,
    // each rounded inward to one decimal. The argmax winners moved with the
    // re-roll (diet wildfang is now Nature's Fury, full is still Quickening).
    expect(moongrove?.value).toBeGreaterThanOrEqual(band(133.2, 135.5));
    expect(moongrove?.value).toBeLessThanOrEqual(band(176.8, 179));
    expect(wildfang?.value).toBeGreaterThanOrEqual(band(161.3, 164.5));
    expect(wildfang?.value).toBeLessThanOrEqual(band(200.7, 204.3));
  });

  // Nightly-only, the owner's one-seed ruling above: moongrove_3t and groveheart at
  // NIGHTLY_ROW_SEED, EVERY capstone row above zero (the old pin read only the best
  // row's seed average). runIf keeps it off the diet behind the file's one flag read;
  // the PR arm never runs, so it keeps the 20 s default; the nightly arm is about ten
  // times its 16.5 s local case time, rounded up to 30 s. Measured 2026-09-29 at the
  // production idle cull, Nature's Fury / Wild Apex / Quickening: moongrove_3t
  // 156.39 / 161.56 / 152.11 dps, groveheart 63.26 / 63.26 / 63.26 hps. The groveheart
  // rows match by construction, not by accident: the three-ally pressure wipes the party
  // (about 40 s) before Verdance reaches 5, so Overbloom, the only spend Nature's Echo
  // and Wild Apex act on, never fires, and Quickening's mana never binds while an ally
  // lives. The Groveheart suite tells the three apart by their mechanics.
  it.runIf(FULL_SWEEP)(
    'lands every moongrove_3t and groveheart capstone row above zero at one seed',
    () => {
      const rows = runDruidBalanceSeed(NIGHTLY_ROW_SEED, DRUID_PROBE_SECONDS, NIGHTLY_ROW_PROFILES);
      // Literal cell list, capstone-major as the harness builds it: a row the
      // harness silently dropped reads as a mismatch here, never as a pass.
      expect(rows.map((row) => `${row.profile}/${row.capstone}/${row.metric}`)).toEqual([
        'moongrove_3t/naturesFury/dps',
        'groveheart/naturesFury/hps',
        'moongrove_3t/wildApex/dps',
        'groveheart/wildApex/hps',
        'moongrove_3t/quickening/dps',
        'groveheart/quickening/hps',
      ]);
      for (const row of rows) {
        expect(row.value, `${row.profile} under ${row.capstone}`).toBeGreaterThan(0);
      }
    },
    FULL_SWEEP ? 180_000 : 20_000,
  );

  it('the live-mob and Bruin fixtures wear the pinned reference loadout', () => {
    // Identity first: every band below is conditioned on this gear, and the
    // three probes do NOT build the fixture the same way, so each
    // construction is pinned on its own rather than assuming one covers all
    // (mirrors scripts/druid_balance_probe.ts exactly):
    // runDruidLiveMobProbe builds moongrove on balance (row14
    // dru_r14_moonfury) and wildfang/bruin on feral (row14
    // dru_r14_savage_fury), both with row20 dru_r20_improved_hurricane; the
    // Bruin tank probe (bruinFixture) builds feral with no talent rows.
    const balanceLive = fixtureEquipment(42_420, 'balance', {
      14: 'dru_r14_moonfury',
      20: 'dru_r20_improved_hurricane',
    });
    expect(balanceLive, 'balance live loadout').toEqual(BALANCE_LOADOUT);
    const feralLive = fixtureEquipment(42_420, 'feral', {
      14: 'dru_r14_savage_fury',
      20: 'dru_r20_improved_hurricane',
    });
    expect(feralLive, 'feral live loadout').toEqual(FERAL_LOADOUT);
    const tank = fixtureEquipment(42_920, 'feral', {});
    expect(tank, 'Bruin tank loadout').toEqual(FERAL_LOADOUT);
  });

  it.each(['moongrove', 'wildfang', 'bruin'] as const)(
    'executes the %s rotation against an attacking live mob inside its measured band',
    (arm) => {
      // Anchors re-measured 2026-09-29 for the production idle cull (the
      // LIVE_MOB_MEASURED record above: same BAND, payoffs exact).
      const result = runDruidLiveMobProbe(arm, 42_420);
      const measured = LIVE_MOB_MEASURED[arm];
      const [dmgLo, dmgHi] = within(measured.damage);
      expect(result.damage, `${arm} damage`).toBeGreaterThanOrEqual(dmgLo);
      expect(result.damage, `${arm} damage`).toBeLessThanOrEqual(dmgHi);
      const [inLo, inHi] = within(measured.incomingDamage);
      expect(result.incomingDamage, `${arm} incoming`).toBeGreaterThanOrEqual(inLo);
      expect(result.incomingDamage, `${arm} incoming`).toBeLessThanOrEqual(inHi);
      const [thLo, thHi] = within(measured.threat);
      expect(result.threat, `${arm} threat`).toBeGreaterThanOrEqual(thLo);
      expect(result.threat, `${arm} threat`).toBeLessThanOrEqual(thHi);
      expect(result.payoffs, `${arm} payoffs`).toBe(measured.payoffs);
    },
    30_000,
  );

  it('records Bruin mitigation, threat, taunt uptime, and exit behavior', () => {
    const result = bruinTankRun();
    expect(result.head).toBe('test-head');
    expect(result.bruinIncomingDamage).toBeLessThan(result.wolfIncomingDamage);
    // The two incoming figures and the mitigation they imply are banded on
    // the 2026-09-08 measurement (wolf 220, bear 143, 35 percent less):
    // the drift the audit read (bear +12 percent) reds on the bear figure.
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
    // actual wolf 239, bear 153, mitigation 0.3598 at seed 42920 (both depths);
    // the same relative margins (BAND on the figures, 0.3 / 0.42 over 0.35 on
    // the mitigation, rounded inward) give the anchors above and 0.309 / 0.431.
    const [wolfLo, wolfHi] = within(BRUIN_TANK_MEASURED.wolfIncomingDamage);
    expect(result.wolfIncomingDamage).toBeGreaterThanOrEqual(wolfLo);
    expect(result.wolfIncomingDamage).toBeLessThanOrEqual(wolfHi);
    const [bearLo, bearHi] = within(BRUIN_TANK_MEASURED.bruinIncomingDamage);
    expect(result.bruinIncomingDamage).toBeGreaterThanOrEqual(bearLo);
    expect(result.bruinIncomingDamage).toBeLessThanOrEqual(bearHi);
    expect(result.bruinMitigationPct).toBeGreaterThanOrEqual(0.309);
    expect(result.bruinMitigationPct).toBeLessThanOrEqual(0.431);
    // Bear form multiplies all threat by 1.3 (threat.ts) on top of the feral
    // tank talent bonus; a 100-damage hit must clear the bare 100 by half,
    // and the measured figure is pinned exactly (a flat multiplier product).
    expect(result.bruinThreatFrom100Damage).toBeGreaterThanOrEqual(150);
    expect(result.bruinThreatFrom100Damage).toBeCloseTo(
      BRUIN_TANK_MEASURED.bruinThreatFrom100Damage,
      6,
    );
    // A full-bank Marrowbreak is the snap-threat button: several swings' worth
    // of threat in one press, banded on the measurement.
    // Re-measured 2026-09-29 for the production idle cull (scripts/probe_sim.ts):
    // actual 1012.44 at seed 42920 (both depths); BAND either side gives the
    // re-anchored band (about 931.4 / 1093.4).
    expect(result.marrowbreakSnapThreat).toBeGreaterThanOrEqual(
      result.bruinThreatFrom100Damage * 4,
    );
    const [snapLo, snapHi] = within(BRUIN_TANK_MEASURED.marrowbreakSnapThreat);
    expect(result.marrowbreakSnapThreat).toBeGreaterThanOrEqual(snapLo);
    expect(result.marrowbreakSnapThreat).toBeLessThanOrEqual(snapHi);
    expect(result.growlForcedUptimeSeconds).toBeGreaterThanOrEqual(3);
    expect(result.growlForcedUptimeSeconds).toBeLessThanOrEqual(3.1);
    expect(result.secondsToLoseThreatAfterLeaving).toBeGreaterThan(0);
    expect(result.secondsToLoseThreatAfterLeaving).toBeLessThanOrEqual(60);
  }, 60_000);

  it('keeps the Bruin tank probe deterministic at the same fixed seed', () => {
    const first = bruinTankRun();
    expect(runDruidBruinTankProbe(42_920, 'test-head')).toEqual(first);
  }, 60_000);
});
