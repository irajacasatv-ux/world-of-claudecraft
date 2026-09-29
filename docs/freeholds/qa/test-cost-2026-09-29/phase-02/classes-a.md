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
dominates. `gridFor` caches the grid per seed, keyed on the module's ACTIVE world content
(`getActiveWorldContent()`), never on `cfg.world` (`src/sim/sim.ts` states that colliders
never read it), so the full world and every scoped world share one grid per seed. The seed
is warm for the rest of the file (0.4 ms first tick), but every extra seed pays again. So in
files that built a Sim per case on a fresh seed, the empty world alone barely helped (the
Dirge suite went from about 15 s to 12.8 s); one seed per file was the real lever, and the
empty world cut the per-tick cost (2.7 ms to 0.12 ms). (The first version of this record
said the cache keyed on the world object, so a mixed or per-Sim world literal paid twice;
that was wrong, and the fix round below corrects it.)

## Per file

Local times: medians of three `npx vitest run <file> --maxWorkers=1` runs, before and after
back to back. The host ran at load 19 to 85 throughout (four forks plus other agents), so
the before figures read well above the quiet baseline (`data/local_perfile_ms.tsv`); the
ratio is the reliable part. Import time moved only with load: the one import change is
affliction's locale slice. Every mutant ran through the scratchpad runner after its commit,
each batch with a must-pass control that passed. The fix round at the end changed eight of
these files again; its table supersedes their rows here.

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
| v042_coldsight_integration | 20,808 | SLIM | 16 seeds become one seed on `EMPTY_TEST_WORLD` (the saving is the one seed: the per-call world literal it replaced never missed the grid cache) | 7.53 / 1.09 | 2.43 / 2.22 | 3/3: `casting_lifecycle.ts` pulse count, reserve at cast accept; `hunter_coldsight_read.ts` Long Draw mult |
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
- v042_offense_packets, the Scouring Mercy heal case: its bounds (`2 * 130` to `2 * 155`)
  rest on a false premise. A heal crit is 1.5x, not 2x, and the gear's Healing Power adds
  about 27, so a crit spans about 236 to 273; the full world's seed 1402 happened to draw
  260. The fix round pins the roll (0.9, reading 269) so the case no longer rides luck, but
  re-deriving the bounds is a re-pin and needs a maintainer ruling.
- Coverage gaps found by survivors (pre-existing, same result on the unmodified suites):
  Death Echo consume radius (necromancy), Forbidden Reflection lock length
  (warlock_class_talents), the enemy-action ICD's lower bound (affliction).
- trinkets: the determinism case's trinket is a Spirit one that never touches melee, so it
  guards less than its title says.
- chronomancy_balance_targets: seed 2 carries the loosest Cryo margin of the three, so on PR
  a Cryo-only loss trips only once its margin falls from about 50 to 12 percent (stated in
  the file since the fix round; an accepted trade).

## Product-side lever (not touched)

`gridFor` / `staticWorldColliders(seed)` in `src/sim/colliders.ts` costs 300 to 625 ms per
fresh seed (the cache already keys on the active world content, so scoped worlds share it).
Building decoration cells lazily per region, or letting a test Sim opt out of static
decorations, would cut this across every suite that builds more than one seed, well beyond
this cluster.

## Fix round (review findings, branch `test-cost/classes-a-fix` off `35e89ced9a`)

A review found cases that still rode a seed's draws after the cuts above, and two false
cost-model notes. Every fix pins the roll a case asserts on instead of hunting a seed; no
expected value changed. Each pinned file was swept on seeds 1, 2, 7 and 11 (plus one of its
old seeds) with all cases green; the unpinned paladin_core and hunter_talents failed two
cases each on seed 7. Times: medians of three `--maxWorkers=1` runs on a quieter host,
before and after back to back.

| File | Finding | Fix | Tests s before / after |
|---|---|---|---|
| shaman_thundercall | the note said idle culling kept the hunted seeds' draws; culled mobs stop drawing, so the stream moved and the roll-riding cases passed on a new one | `rng.next` pinned at 0.9 in `setup` (every bolt lands, no crit or Arc Overload proc, a fixed damage roll); with nothing left on the stream, one seed on `EMPTY_TEST_WORLD` replaces culling and five seeds | 3.77 / 0.80 |
| shaman_spiritmend | same false note; the deposit comparison and exact unleash burst rode heal rolls | same pin (no heal crit, a fixed heal roll), one seed on `EMPTY_TEST_WORLD` replaces culling and three seeds | 2.64 / 0.89 |
| v042_offense_packets | `noCrit()` zeroed `critChance` only, but spells and heals roll `ctx.spellCrit`, so every spell comparison rode seed 202's crit luck; the Scouring Mercy heal's "guaranteed crit" was a full-world draw on seed 1402 | `noCrit(sim)` also pins `ctx.spellCrit` at 0; the heal case pins `ctx.spellCrit` at 1 and `rng.next` at 0.9; the Ruinous Brand origin is hit-capped (`hitBonus = 1`); both full-world exceptions are gone | 2.30 / 0.96 |
| paladin_core_abilities | Hammer of Grace, Vowkeeper Strike (the exact Devotion 12) and both Final Edict cases rode seed 37's hit rolls | `landEveryRoll` (`rng.next` at 0.9, as the support suite does) in those four cases | 0.69 / 0.70 |
| hunter_talents | Predator's Pace, Double Hush, Apex Instinct and both Fang Chorus cases rode `HUNTER_SEED` to land their shots | `landEveryRoll` in those five cases; the seed comment says so | 0.83 / 0.82 |
| v042_ability_resolution | the header said no case draws on the rng; the Measured Fury cast rolls the melee table | that case pins `rng.next` at 0.9 (the strike lands and kills its wolf); header corrected | 0.72 / 0.67 |
| v042_coldsight_integration | the note said the grid cache keyed on the world object, so the per-call world literal missed it | comment only: the cache keys on the active world content; the saving was the one seed | unchanged |
| chronomancy_balance_targets | the PR arm still declared 240 s under a "twelve rotations" comment though it runs none of its own | `timeout: NIGHTLY_SWEEP ? 240_000 : 20_000`; the file's declared sum drops to 180 s, so its `tests/suite_duration_budget.test.ts` ledger row is deleted (the ratchet direction); the comment states that on PR a Cryo-only loss trips only once seed 2's margin falls from about 50 to 12 percent (a Frostbolt loss of about a quarter, against about a sixth on the nightly's seed 1) | unchanged; nightly arm green |

Mutants, one batch after the commits, all through the runner: 15 of 15 killed, and the
control (a comment appended to `combat/heal.ts`, run across all nine touched files) passed
121 of 121. Killed: `combat/heal.ts` heal crit 1.5 to 1.3, `combat/destruction.ts` Brand
copy 0.5 to 0.6 and `spec_output_tuning.ts` Doctrine spell 0.3 to 0.2 (offense_packets);
`paladin_devotion.ts` Zealwing doubling off and `effect_dispatch.ts` Final Edict cue off
(paladin_core); `combat/hunter_shared.ts` Fang Chorus clap on the fourth echo, Apex Focus 40
to 30, Predator's Pace 1.2 to 1.3 (hunter_talents); `combat/ability_resolution.ts` Measured
Fury 0.9 to 0.85; `combat/shaman_thundercall_kit.ts` Arc Overload always procs,
`combat/shaman_thundercall.ts` Earthen Jolt per-charge 0.25 to 0.15 and charge cap 5 to 6;
`combat/shaman_spiritmend.ts` pool cap 0.3 to 0.5, consume multiplier 1.25 to 1.5,
Lifespring deposit bonus 0.2 to 0.
