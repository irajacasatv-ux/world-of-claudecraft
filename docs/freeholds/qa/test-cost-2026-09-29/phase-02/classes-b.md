# Part 5 test cost: the classes-b cluster

Twenty-two class-mechanic suites, heaviest CI seconds first. Branch `test-cost/classes-b`, cut
from `feature/freeholds` at `a2bd94a83e`.

## What the cost was

Almost every suite built a full-world `Sim` per case, often on a fresh seed per case, to fight
a dummy it spawned itself. Two costs stacked:

- The ambient overworld: about 22 ms of construction per warm full-world Sim and 2.7 ms per
  tick, against about 1 ms and 0.12 ms on `EMPTY_TEST_WORLD` (`tests/sim_shared.ts`).
- The per-seed collider grid. `gridFor` in `src/sim/colliders.ts` caches the static collider
  grid per (ACTIVE world content, seed), not per `cfg.world`, so every distinct seed a file
  touches pays one build of about half a second, on the empty world too (there it is paid
  lazily, at the first tick or ground placement: a probe measured 75 ms of constructor plus
  520 to 640 ms over the first 200 ticks for a fresh seed, 25 ms for a warm one). A full-world
  Sim and an empty-world Sim on the same seed share one grid.

So the remedy, file by file, was the empty test world plus one seed per file wherever the
extra seeds bought nothing. A case whose single unforced roll depends on the built-in
world's construction draws keeps the built-in world (never a re-pinned value, never a
re-hunted seed).

## Per file

Local figures: `npx vitest run <file> --maxWorkers=1`, three runs each, medians of the
Duration line's `tests` figure, before and after measured back to back on a shared, loaded
host (load average 17 to 60). CI ms: the two PR runs of the baseline
(`data/ci_perfile_ms.tsv`, runs 36493201427 and 36501749917).

| File | CI ms (two PR runs) | Verdict | Change | Local tests s before / after | Mutants killed / total (source mutated) |
|---|---|---|---|---|---|
| `ice_block` | 15,231 / 13,612 | SLIM | empty world (one seed already) | 5.08 / 1.54 | 1/1 (`combat/damage.ts` stasis immunity) |
| `combat_auto_attack` | 13,768 / 13,682 | SLIM | empty world; four cases whose one unforced table roll must connect keep the built-in world (`makeSim(..., 'full')`) | 4.99 / 2.27 | 2/2 (`combat/auto_attack.ts` Auto Shot coefficient, empty-world case; Overpower window, full-world case) |
| `owned_class_approved_followups` | 11,293 / 15,808 | SLIM | seven seeds to one, empty world | 10.90 / 1.18 | 2/2 (`combat/hunter_packlord.ts` bad-luck cap; beast count) |
| `dot_final_tick` | 13,433 / 13,284 | MERGE | already scoped; 38 cases to 23, one per distinct (ability, duration, interval): the harness builds each aura itself, so same-schedule ranks differed only in the per-tick value | 7.02 / 4.75 | 1/1 (`combat/auras.ts` final periodic tick; all 23 surviving cases fail) |
| `healer_rez_parity` | 13,358 / 12,821 | SLIM | five seeds to one, empty world; imports the `en` and `zh_CN` locale slices, not the barrel | 6.04 / 0.83 | 1/1 (`combat/casting_lifecycle.ts` out-of-combat gate) |
| `v042_healer_custom_scaling` | 13,159 / 12,727 | SLIM | seven seeds to one, empty world | 4.92 / 1.25 | 2/2 (`combat/druid_engines.ts` replant hotHealPct; `combat/paladin_talents.ts` Sunmender factor) |
| `target_dots_refresh` | 16,013 / 9,870 | SLIM | empty world; spawns its own hostile mob instead of borrowing the nearest ambient one | 8.35 / 1.11 | 1/2 (`ui/hud/target_dots/target_dots_view.ts` frozen row: killed. `combat/effect_dispatch.ts` dot `remaining` on re-cast: survived, and survives the pre-change file too, so the corruption refresh does not read that line; not a lost guard) |
| `rogue_dps_balance` | 8,336 / 15,800 | KEEP bands, MOVE TO NIGHTLY the replay depth | the determinism replay re-ran all nine band runs; every PR now replays Combat alone after the nine, the nightly (`WOC_NIGHTLY_SWEEP`) replays all three; path added to the reader pin in `tests/ci_shard_plan.test.ts` | 6.06 / 4.23 | 3/3 plus one expected pass (`spec_output_tuning.ts` Knifework bonus moves a band; a cross-run leak in `scripts/rogue_dps_probe.ts` fails the PR replay; a Subtlety-only leak passes the PR tier and fails the nightly form, the documented trade) |
| `shaman_lifecycle` | 12,186 / 11,911 | SLIM | six seeds to one, empty world | 3.93 / 0.75 | 1/1 (`progression/talents.ts` Thundercall clear on spec change) |
| `v042_rogue_stealth` | 14,989 / 9,072 | SLIM | eight seeds to one, empty world (no ticks at all) | 5.41 / 0.20 | 1/1 (`combat/rogue_engines.ts` stealth gate on the Gloam detonation) |
| `lifesap_adversarial` | 10,839 / 13,048 | SLIM | druid windows on the empty world; the warrior rage case keeps the built-in world its seed was hunted on | 8.78 / 2.94 | 1/1 (`combat/auras.ts` sap rounding, druid empty-world case) |
| `feral_druid_v043_pass` | 12,087 / 11,654 | SLIM | empty world; the exact seeded rate count and the in-combat Claw that must connect keep the built-in world (`rig(spec, 'full')`) | 7.25 / 1.47 | 2/2 (`combat/feral_reach.ts` live reach, empty-world case; `combat/druid_natures_boon.ts` roll, full-world rate pin) |
| `vanguard_set_bonus_b` | 10,227 / 13,093 | SLIM | empty world (one seed already) | 7.46 / 1.08 | 1/1 (`combat/shaman_spiritmend.ts` Brineward subject) |
| `druid_wildfang_kit` | 12,061 / 11,113 | SLIM | empty world (one seed already) | 4.77 / 1.17 | 2/2 (`combat/druid_engines.ts` Pin target; Loping Stride cooldown) |
| `healing_power_readers` | 8,120 / 14,740 | SLIM | seven seeds to one, empty world (which also lacks the hub yard the AoE case had to drop) | 4.96 / 0.79 | 1/1 (`combat/effect_dispatch.ts` AoE heal rider reads spellPower) |
| `cat_form_energy` | 9,851 / 12,262 | SLIM | two seeds to one, empty world | 6.19 / 0.99 | 1/1 (`combat/auras.ts` parked energy regen) |
| `shaman_warspirit` | 7,746 / 14,226 | SLIM | eight seeds to one, empty world | 5.20 / 0.76 | 1/1 (`combat/shaman_warspirit.ts` echo count) |
| `druid_engines` | 7,569 / 14,277 | SLIM | three seeds to one, empty world | 4.78 / 0.93 | 1/1 (`combat/druid_engines.ts` Old Blood clear) |
| `shaman_unleash_weapon` | 10,515 / 10,558 | SLIM | six seeds to one, empty world | 4.15 / 0.77 | 1/1 (`combat/shaman_unleash_weapon.ts` Thunder grant) |
| `warlock_pets` | 10,840 / 10,051 | SLIM | eleven seeds of a wolf-camp world to one seed of the empty world; the imp case spawns its own wild wolf | 6.34 / 1.12 | 3/3 (`pet/pet_commands.ts` grouped auto-taunt; `content/warlock_pets.ts` Felbolt school, spawned-wolf case; rank scale, one-seed sweep) |
| `glacial_spike` | 9,916 / 10,239 | SLIM | empty world; the Icicle case's seed 12 still lands every cast on the empty stream, so it was kept, not re-hunted | 4.41 / 1.32 | 1/1 (`combat/frost_mage.ts` Icicle cap, killed by the seed-12 case) |
| `spec_masteries` | 9,338 / 7,647 | SLIM | seven seeds to one, empty world (no ticks) | 4.89 / 0.22 | 1/1 (`combat/hunter_shared.ts` owner petDmgPct) |

Local test time over the cluster: 131.9 s before, 31.7 s after (100.2 s saved, 76 percent).
Import time did not move beyond the host's noise (69.5 s summed before, 73.7 s after, the
after runs taken under heavier load; two re-checks at a quieter moment put `ice_block` and
`v042_healer_custom_scaling` back at 2.3 s of import each).

## Mutation checks

Runner: the scratchpad `mutate.mjs` (each file checked equal to HEAD before every mutant,
restore verified, a mutant counts only when vitest printed its Tests line). Three must-pass
controls (a comment appended to `combat/auras.ts`, `combat/druid_engines.ts` and
`content/warlock_pets.ts`) passed. 32 fail-expected mutants: 31 killed by the slimmed files,
one survived (the `target_dots_refresh` dispatch line above, which the pre-change file does
not kill either). One pass-expected mutant (the Subtlety-only replay leak on the PR tier)
passed, as designed. Every changed file ran green at least four times (three timed runs plus
one run of all 23 changed files together: 424 of 424).

## Owed

- The shard weights (`scripts/ci_shard_weights.generated.json`, not touched here) still carry
  the pre-change rows for all 22 files. At the local 76 percent cut the cluster's 261 s of CI
  test time per run would fall to roughly 63 s; a post-change harvest is what confirms it.
- `tests/ci_shard_plan.test.ts` now names `tests/rogue_dps_balance.test.ts` in the nightly
  reader pin; another cluster adding a reader edits the same line (merge as a sorted union).
- Nondeterminism confined to the Assassination or Subtlety probe rotation is now caught only
  by the nightly replay (the stated trade; the PR replay still catches probe, sim and
  cross-run leaks).
- Product-side levers seen, not touched: (1) the static collider grid is built per seed
  (`gridFor` in `src/sim/colliders.ts`, about half a second) even for a Sim on the empty test
  world, so every suite that hops seeds pays it per seed; a grid whose footprints are
  seed-independent with ground heights resolved lazily would cut that for every such suite.
  (2) `owned_class_approved_followups` still spends about 6 s importing; it pulls
  `src/ui/ability_description`, which imports `src/ui/i18n` and so the locale re-export the
  README ranks first among import costs (not measured per module here).
