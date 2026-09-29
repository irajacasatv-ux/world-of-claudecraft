# Part 5, test cost: the classes-a cluster

Twenty class-mechanic suites, heaviest CI seconds first (608.97 s of CI test time in run
36501749917, `data/ci_perfile_ms.tsv`). Branch `worktree-agent-af3d1537263653154`, based on
`a2bd94a83e`; the suites were split across four forked worktrees and their commits
cherry-picked here, so every SHA below is the one on this branch.

## What drives the cost (measured here, it corrects the baseline's Sim probe)

The baseline puts a fresh seed on the empty test world at 60 to 137 ms. That is the
constructor only. The FIRST TICK of a fresh seed costs another 300 to 625 ms on any world,
empty included: a CPU profile (`node --import tsx --cpu-prof`, four fresh seeds on
`EMPTY_TEST_WORLD`) puts it all under `sim.tick` > `updatePlayerMovement` >
`supportHeightAt` > `gridFor` > `staticWorldColliders(seed)`, the seed's static collider
grid with its decorations, whose terrain sampling (`terrainHeight`, `calmSkirtWidth`)
dominates. The grid is cached per (world content object, seed) in `src/sim/colliders.ts`,
so the seed is warm for the rest of the file (0.4 ms first tick), but every extra seed pays
again, and a file that mixes the full world with a scoped one, or builds a world literal
per Sim, pays twice. So in files that built a Sim per case on a fresh seed, the empty world
alone barely helped (the Dirge suite went from about 15 s to 12.8 s); one seed per file was
the real lever, and the empty world cut the per-tick cost (2.7 ms to 0.12 ms).

## Per file

Local times: medians of three `npx vitest run <file> --maxWorkers=1` runs, before and after
back to back. The host ran at load 19 to 85 throughout (four forks plus other agents), so
the before figures read well above the quiet baseline (`data/local_perfile_ms.tsv`); the
ratio is the reliable part. Import time moved only with load: the one import change is
affliction's locale slice. Every mutant ran through the scratchpad runner after its commit,
each batch with a must-pass control that passed.

| File | CI ms | Verdict | Change | Tests s before / after | Import s before / after | Mutants killed (mutated source) |
|---|---|---|---|---|---|---|
| necromancy | 55,311 | SLIM | `EMPTY_TEST_WORLD` for every Sim but the reap-in-unison case (its seed-43 harvest procs ride the full world's stream; idle culling moved it too, so it keeps the full world); the empty-world Sims share seed 42 (was 42, 43, 44) | 62.46 / 7.78 (two steps: 62.46 to 9.17, then 9.46 to 7.78) | 6.73 / 6.35 | 6/7: `combat/necromancy.ts` fragment out-of-combat cap, Soul Lance pierce mult and target count (twice), Ossuary detonate heal; `pet/pet_commands.ts` restore gate. Survivor: Death Echo consume radius 6 to 8, which also survives on the unmodified suite (radius 60 too): a gap, not a loss |
| destruction_warlock | 45,549 | SLIM | `EMPTY_TEST_WORLD` (one seed already) | 18.97 / 2.01 | 2.03 / 4.97 | 4/4: `combat/destruction.ts` Pyre Aura radius, Ruin out-of-combat cap, Ruinous Brand copy pct, Desolation cast mult |
| v042_priest_dirge_refresh | 47,717 | SLIM | one seed (was 25) plus `EMPTY_TEST_WORLD` | 28.18 / 1.49 | 5.17 / 5.34 | 2/2: `dirge_refresh.ts` fan-out order; `effect_dispatch.ts` real-cast refresh call removed |
| paladin_support_abilities | 40,557 | SLIM | `paladinSim()`: `EMPTY_TEST_WORLD` and seed 102 for all 24 Sims (was 23 full-world seeds) | 19.93 / 0.94 | 4.17 / 3.68 | 4/4: `combat/damage.ts` death-path Devotion strip; `effect_dispatch.ts` Hammer of Grace self-heal, Solar Invocation splash centre; `combat/paladin_support.ts` source check |
| priest_vespers | 37,935 | SLIM | `EMPTY_TEST_WORLD` (seed 2803 kept) | 23.16 / 1.37 | 5.22 / 3.16 | 2/2: `vespers.ts` Effigy echo rate, Gloomtithe stack cap |
| v042_offense_packets | 38,992 | SLIM | 13 empty-world seeds become one (202), each pair still in rng lockstep; the Ruinous Brand (606) and Scouring Mercy (1402) cases keep the full world and their seeds, both went red on the empty world | 20.84 / 3.25 | 5.27 / 5.96 | 5/5: `spec_output_tuning.ts` elemental, demonology, survival and Pyre pet bonus; `combat/destruction.ts` Brand copy pct |
| v042_coldsight_read | 39,944 | SLIM | 33 full-world seeds become one on `EMPTY_TEST_WORLD`; no case reads an rng outcome | 24.53 / 0.94 | 3.45 / 4.84 | 2/2: `hunter_coldsight_read.ts` Long Draw mult, Read duration |
| hunter_talents | 35,112 | SLIM | 16 per-case seeds become one (2920) on `EMPTY_TEST_WORLD` | 18.58 / 1.22 | 5.47 / 3.75 | 2/2: `hunter_shared.ts` Predator's Pace, Fang Chorus clap count |
| paladin_core_abilities | 35,346 | SLIM | `paladinSim()`: `EMPTY_TEST_WORLD` and seed 37 for all 22 Sims (was 19 seeds) | 17.87 / 1.22 | 5.30 / 5.73 | 3/3: `paladin_devotion.ts` block Devotion ICD; Mercy Lance Ascension crit; Zealwing Devotion mult |
| v042_ability_resolution | 28,732 | SLIM | one seed (was 24) plus `EMPTY_TEST_WORLD`; the one real cast strikes a camp-level wolf it spawns (minLevel, dies to the strike as the old camp wolf did; the expected cost is formula-derived and unchanged) | 18.00 / 0.88 | 5.29 / 4.01 | 2/2: `ability_resolution.ts` Measured Fury discount, cost-tax ceil to round |
| affliction | 27,361 | SLIM | already on `EMPTY_TEST_WORLD`; about twenty seeds become seed 42 (every pin holds); imports the `en` locale slice instead of the generated barrel | 13.76 / 3.18 | 3.51 / 2.88 | 4/5: `combat/affliction.ts` Possession Sentence mult, splash mult, Fate Thread per-stack bonus, enemy-action ICD 1 to 2. Survivor: ICD 1 to 0.5, in a case this change did not touch (seed 42 before and after): its lower bound is unpinned |
| trinkets | 24,313 | SLIM | `EMPTY_TEST_WORLD`; the determinism case moves to the file's seed 11; Gambler's Die rolls one wearer repeatedly (cooldown cleared) instead of a Sim per seed, dropping its 60 s timeout | 13.78 / 0.99 | 4.95 / 3.03 | 4/4: `trinkets.ts` Snake Eyes refund, die never rolls Snake Eyes, Paired Talons bleed; `sim.ts` `addItem` drawing rng for a bagged trinket |
| paladin_devotion_balance | 23,482 | SLIM (blocking case), KEEP (three rotations) | the blocking case (stubbed rng) runs on `EMPTY_TEST_WORLD`, seed 53; its 29.65 s pin holds. The rotation pins ride the full world's stream: culling failed all three | 24.72 / 17.94 (the case: 2,420 to 91 ms) | 4.51 / 3.06 | 2/2: `paladin_devotion.ts` block ICD, block grant |
| shaman_thundercall | 16,590 | SLIM | production idle culling (the empty world moved an Arc Overload proc); three roll-free arms reuse a seed the file builds (9 seeds to 5) | 12.49 / 4.63 | 5.12 / 3.69 | 5/5: `combat/shaman_thundercall.ts` Faultwake and Earthen Jolt per-charge bonus, charge cap; `casting_lifecycle.ts` Faultwake default target, refused cast eating charges |
| v042_coldsight_integration | 20,808 | SLIM | the per-call world literal (a cache miss per Sim) and 16 seeds become one seed on the shared `EMPTY_TEST_WORLD` | 7.53 / 1.09 | 2.43 / 2.22 | 3/3: `casting_lifecycle.ts` pulse count, reserve at cast accept; `hunter_coldsight_read.ts` Long Draw mult |
| wand_swing_between_queued_casts | 19,652 | SLIM | `EMPTY_TEST_WORLD` (seeds kept) | 10.84 / 1.27 | 5.35 / 4.66 | 2/2: `casting_lifecycle.ts` queue-fired swing call, swing-timer pre-decay |
| v042_doctrine_rescue | 18,606 | SLIM | one seed (was 20) plus `EMPTY_TEST_WORLD` | 14.08 / 1.18 | 2.76 / 5.70 | 2/2: `doctrine_rescue.ts` max recipients; `effect_dispatch.ts` rescue call |
| shaman_spiritmend | 22,396 | SLIM | production idle culling; five roll-free cases move to the default seed (8 seeds to 3) | 11.42 / 4.00 | 4.42 / 5.17 | 5/5: `combat/shaman_spiritmend.ts` unleash guard, tick drain, chain consume, pool cap; `content/classes.ts` Tidecall charges |
| warlock_class_talents | 16,158 | SLIM | `EMPTY_TEST_WORLD` (one seed already) | 10.16 / 1.44 | 5.69 / 5.12 | 2/3: `combat/warlock_talents.ts` Leaden Hex root duration, Shadow Credit threshold. Survivor: Forbidden Reflection lock 60 to 0, which also survives on the unmodified suite: a gap, not a loss |
| chronomancy_balance_targets | 14,404 | MOVE TO NIGHTLY (one case) | the min-over-seeds DPS-gap floor runs seed 2 on PR (the rotations the describe block already ran, so no extra rotation) and seeds 1 and 3 under `WOC_NIGHTLY_SWEEP === '1'`; path added to the reader list in `tests/ci_shard_plan.test.ts`; nightly arm green | 5.54 / 3.16 | 5.13 / 4.76 | 2/2 valid: `content/classes.ts` level-20 rank damage of Aether Surge and Frostbolt, killed by seed 2 alone (a base-damage mutant was invalid: the rank overrides it) |

Totals (same loaded host, before and after back to back): 376.8 s of test time before,
60.0 s after, about 317 s saved; the quiet baseline sum for these files is 258.4 s. All
twenty files together on the final tree: 500 of 500 green twice (`--maxWorkers=4`),
`ci_shard_plan.test.ts` 76 of 76, `tsc --noEmit` clean, biome clean on every changed file.

## Owed

- Shard-weight rows for all twenty files need re-harvesting
  (`scripts/ci_shard_weights.generated.json` was out of bounds here).
- paladin_devotion_balance: the three rotation pins are tripwires on the full world's rng
  stream (the file records about ten re-pins). Moving them to the empty world or pinning
  only the 35 to 65 s band would save about 15 s locally; that is a re-pin, so it needs a
  maintainer ruling.
- v042_offense_packets: `noCrit()` zeroes `critChance`, but spells roll `ctx.spellCrit`, so
  the SP-delta cases ride the seed (seed 1001 fails them). Stubbing `spellCrit` in those
  pins would free them from the seed. The Scouring Mercy case's comment calls an rng crit
  "guaranteed".
- Coverage gaps found by survivors (pre-existing, same result on the unmodified suites):
  Death Echo consume radius (necromancy), Forbidden Reflection lock length
  (warlock_class_talents), the enemy-action ICD's lower bound (affliction).
- trinkets: the determinism case's trinket is a Spirit one that never touches melee, so it
  guards less than its title says.
- chronomancy_balance_targets: seed 2 carries the loosest Cryo margin of the three, so a
  Cryo-only loss is caught later on PR than on the nightly (stated in the file).
- Single-seed files where some case needs a shot to land or a spell not to crit
  (hunter_talents, v042_offense_packets, the paladin files) carry that luck on the one seed,
  as their per-case seeds did; sweeps in the forks showed most seeds pass every case.

## Product-side lever (not touched)

`gridFor` / `staticWorldColliders(seed)` in `src/sim/colliders.ts` costs 300 to 625 ms per
fresh (world content object, seed). Keying the cache on only the content that feeds the
static colliders (so the full world and a scoped world with the same props share one grid),
building decoration cells lazily per region, or letting a test world opt out of static
decorations would cut this across every suite that builds more than one seed, well beyond
this cluster.
