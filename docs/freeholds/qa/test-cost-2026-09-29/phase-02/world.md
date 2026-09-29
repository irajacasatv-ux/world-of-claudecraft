# Part 5, the world cluster: per-file verdicts

Scope: the 27 files of the "world" cluster (every suite that builds or ticks the whole
overworld around one player, plus the streaming and route suites beside them), heaviest CI
first. Baseline tip `a2bd94a83e` (feature/freeholds). Landed on feature/freeholds as
`13acee9c92` to `1df1006d47`; the fixes after review are under "Review fix round".

## Method

- CI ms: the mean of the two PR runs in `../data/ci_perfile_ms.tsv` (36493201427 and
  36501749917), rounded to the second.
- Local tests s: `npx vitest run <file> --maxWorkers=1`, three runs each, the `tests` figure of
  the Duration line, median; baseline and change measured back to back on the same file (the
  baseline swapped in from `a2bd94a83e`, then the committed version). The host was shared
  with other agents (load average 16 to 90 during the runs), so compare a row's two numbers,
  not rows with each other. Every measured run was green.
- Mutants: the scratchpad runner (each mutated file checked equal to HEAD before the mutant,
  restored and re-checked after, a mutant counts only when the vitest Tests line printed).
  `-t` filters (regexes) pin a kill to the changed cases where a file also holds cases the
  change did not touch. Five must-pass controls (a comment edit in the mutated source), all
  green.

## The remedies

Pins edited with them: `tests/world_population_shards.test.ts` (the rounds text) and
`tests/ci_shard_plan.test.ts` (the nightly reader list).

1. Production idle culling. `tests/helpers/production_idle_cull.ts` exports
   `PRODUCTION_IDLE_CULL` (`idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS`), the radius the
   live server (`server/sim_boot_config.ts`) and the offline client
   (`src/game/offline_world_config.ts`, pinned by `tests/offline_world_config.test.ts`) boot
   with. An idle, ownerless, aura-free mob farther than it from every player skips its idle
   AI; mobs in combat, owned mobs, open-world corpses (respawns) and everything near a player
   still update, and NPCs are never culled. No asserted value moved in any suite it entered.
2. One seed per file where the extra seeds bought nothing (`world_quests`,
   `world_quest_match3`): no case compares two seeds, save and restore pairs share one, and
   the match-three boards and variants come from the reset day. Collider grids are keyed by
   the active world content and the seed (`src/sim/colliders.ts` gridCaches), so the scoped
   worlds in `world_quests` that pass `cfg.world` never write a grid the full worlds read.
3. MOVE TO NIGHTLY with a PR representative (`emerald_deck_escape`, `lake_shores`), both now
   in the `WOC_NIGHTLY_SWEEP` reader pin in `tests/ci_shard_plan.test.ts`; the nightly tests
   job sets the flag (pinned by `tests/nightly_workflow.test.ts`) and runs the whole suite.
4. A shared fixture built once (`water_streaming`: the main-thread reference bake) and the
   faked clock for sleeps whose length proves nothing (`freehold_interior_route`).

## Per-file record

| File | CI s | Verdict | Change | Local tests s before, after | Mutants killed/total (source mutated) | Owed |
|---|---|---|---|---|---|---|
| vehicles | 66 | SLIM | cull | 30.29, 3.46 | 2/2 (`src/sim/vehicles.ts`: retry lockout to zero, victory credit removed) | |
| transport_ferry | 57 | SLIM | cull on the sailing Sims | 41.51, 8.91 | 2/2 (`src/sim/transport_ferry.ts`: deck carry removed, save position not the destination pier) | |
| world_population_invariant_c | 52 | SLIM | cull in `runEscortRounds` (shared helper) | 25.09, 3.20 | see the family note | |
| water_streaming | 44 | SLIM | reference bake memoized once per file | 15.77, 12.25 | 1/1 (`src/render/zone_build_worker.ts`: worker slope bake transposed) | |
| cannon_endless_session | 43 | SLIM | cull; the silent early return on a failed seat is now an assertion | 27.14, 2.92 | 2/2 (`src/sim/vehicles.ts`: endless fall locks out, endless ladder row dropped) | |
| world_population_invariant_b | 41 | SLIM | as _c | 23.72, 2.96 | family note | |
| transport_deck | 38 | SLIM | cull | 17.51, 3.92 | 1/1 (deck carry removed) | |
| world_quests | 38 | SLIM | one seed (about 30 fresh seeds before) | 17.56, 2.27 | 2/4 (`src/sim/world_quests.ts`: kill credit for any template, for a mob outside the area); survived: the area-entry level gate and the claim skip; each also survives on the base test file (`a2bd94a83e`), so no coverage was lost | |
| wickharbor_harbor | 38 | SLIM | cull | 32.19, 4.23 | 1/2 (`src/sim/harbor_structures.ts`: harbor rails off the grid); survived: `MAX_STEP_HEIGHT` 0.9 to 0.3, which also survives on the base test file (`a2bd94a83e`), so no coverage was lost (the routes climb the decks through groundHeight, `src/sim/gale_harbor.ts`) | |
| emerald_deck_escape | 37 | MOVE TO NIGHTLY | wedge sweep 1.5 yd per PR, 0.75 yd under the flag | 15.45, 6.04 | on the sweep: `src/sim/pathfind.ts` climb limit 1.5 to 0.3 killed at PR and nightly depth; a walled pocket added in `src/sim/harbor_structures.ts` on the beach, off the PR grid: 2.6 yd inside killed at PR depth, 1.0 yd inside (body-sized) passes at PR depth and is killed at nightly depth, so the PR sweep is a smoke check and the local-wedge class is nightly; walkway bed removed in `src/sim/world.ts` killed by 3 point cases; the rim ease undone killed by 1 point case; neither terrain mutant is caught by the sweep at either depth | |
| terrain_streaming | 31 | KEEP | none | 14.6 (baseline run) | | each case builds real chunks under its own mocks and pool arm; no shared fixture without merging module registries |
| hill | 31 | KEEP | none | 14.4 (baseline run) | | already a scoped world; the ticks are the contest and accrual windows it asserts |
| world_quest_glider | 27 | SLIM | cull (scoped and restored worlds) | 14.94, 2.39 | 2/4 (`src/sim/mob/locomotion.ts`: mobs aggro a gliding player, killed on the populated world; `src/sim/world_quest_glider.ts`: practice flag never set, killed on the restored world); survived: the practice landing and practice save arms; each also survives on the base test file (`a2bd94a83e`), so no coverage was lost | |
| lake_shores | 27 | MOVE TO NIGHTLY | seed 20061 per PR, 42 and 20061 under the flag | 9.65, 5.54 | 2/2 (`src/sim/world.ts` lake shore grading off: killed on 20061 at PR depth and on 42 at nightly depth) | |
| world_population_invariant_a | 26 | SLIM | as _c | 23.41, 4.05 | family note | |
| world_population_invariant_d | 24 | SLIM | as _c | 11.70, 1.88 | family note | |
| wickharbor_wharf | 24 | SLIM | cull | 12.14, 2.47 | 1/2 (wharf colliders off the grid); survived: the step-height mutant, which also survives on the base | |
| wyrmwatch_harbor | 20 | SLIM | cull | 14.83, 2.48 | 1/2 (`src/sim/wyrmwatch_harbor.ts`: rails removed); survived: the step-height mutant, which also survives on the base | |
| freehold_gate_clearance | 17 | SLIM | cull on the playerless running realm | 10.60, 5.31 | 1/1 (`src/sim/sim.ts`: NPCs drift a millimetre a tick) | |
| world_quest_ambush | 17 | SLIM | cull | 6.63, 2.07 | 1/1 (`src/sim/world_quest_ambush.ts`: reopens inside the cooldown) | |
| wyrmwatch_harbor_house | 17 | SLIM | cull | 10.02, 2.26 | 1/1 (house walls removed) | |
| freehold_interior_route | 16 | SLIM | three settle sleeps (1.2, 1.2, 0.7 s) on the file's faked clock | 8.46, 5.48 | 2/2 (`scripts/freehold_interior_route.mjs`: end boundary read before the callback, command never submitted) | |
| eastbrook_ferry_berth | 13 | SLIM | cull | 9.91, 2.56 | 1/1 (`src/sim/transport_ship.ts`: hull rails dropped) | |
| unstuck | 13 | KEEP | none | 4.9 (baseline run) | | scoped world, about 0.1 s a case |
| dawnhold_grounds | 12 | SLIM | cull | 7.70, 2.21 | 1/2 (`src/sim/dawnhold_layout.ts`: lift to zero, killed by the wall-walk climb); survived on the crossing case, which also survives on the base test file (`a2bd94a83e`), so no coverage was lost | |
| world_quest_match3 | 11 | SLIM | one seed (seven before) | 4.92, 1.11 | 1/1 (`src/sim/world_quests.ts`: a dead player may reset the board) | |
| transport_ferry_online | 11 | KEEP | none | 3.5 (baseline run) | | its GameServer already boots with the production cull; the only online ferry guard |

Changed-file totals (23 files): 391.1 s of local test time before, 90.0 s after, 301.2 s
(77 percent) less.

### The world population invariant family

The escort sweep (`runEscortRounds`, dealt across `_a` to `_d`) now ticks under the cull. The
question was whether the cull blinds the count: a culled mob is idle, alive and still
counted; the leak the rule was written for rides the corpse respawn path (dead open-world mobs
are never culled); wave mobs spawn committed (`chase`, in combat) and the escortee is moved
by the escort driver, not the mob loop. Checked by the same mutants with and without the cull,
on all four shard files (7 escorts):

| Mutant (`src/sim/escort.ts`) | Unculled | Culled |
|---|---|---|
| control (comment) | pass | pass |
| wave leaks: `summonedAdd`, `runScoped` and the end-of-run drop all removed | killed, 7 of 7 cases | killed, 7 of 7 cases |
| the failed walker is never dropped | killed, 7 of 7 | killed, 7 of 7 |
| wave respawns in place (`summonedAdd` and `runScoped` removed, drop kept) | survived | survived (the end-of-run drop reclaims it: defense in depth, same both ways) |

Two rounds stay on every PR. The cull took the family from 83.9 s to 12.1 s locally; a second
round in the same world is the only arm that sees a leak that needs a prior run, and at under
a second a round it is worth its cost. The shard partition is unchanged; the whole-text pin
in `tests/world_population_shards.test.ts` carries the new `runEscortRounds` text.

## Review fix round

- The sweep asserted only that some round ran, so a second round that skipped passed
  silently. `runEscortRounds` now counts the rounds it checked and expects 2 (all 7 escorts
  run both). Mutants on the shard files: a helper edit that skips round 2 killed 7 of 7; the
  escortee never respawning (`src/sim/escort.ts` respawn delay times 1000) killed 7 of 7,
  and the same mutant passes under the pre-fix helper (`35e89ced9a`), the gap this closes.
- The walkway sweep's comment now calls the PR spacing a smoke check (the pocket mutants in
  the emerald row) and the lake header no longer says both seeds run on every PR.
- The survivors marked "also survives on the base" were run against the `a2bd94a83e` test
  files: every one survives there too.
- Controls green: a comment edit in `src/sim/escort.ts`, `src/sim/harbor_structures.ts` and
  `src/sim/vehicles.ts`.

## Owed and levers not taken

- The four escort shard files were split for wall time only; at about 12 s together they fit
  one file under the lane threshold. Merging them saves three imports and three seed builds
  (a few seconds of CI) but retires the partition machinery and needs the shard weight rows
  re-harvested: a separate, deliberate change.
- The post-change harvest re-measures every row above; the per-file CI figures here are the
  baseline only.
- `PRODUCTION_IDLE_CULL` follows the constant the server and client read, and both are pinned:
  tests/idle_mob_tick_radius.test.ts holds the server's booted Sim and the built offline config
  to it (the server case also pins the radius to the literal 100).
- Product side (not touched): the render streaming suites pay `vi.resetModules()` plus a
  re-import of `src/sim/data` per case because `src/render/water` and `src/render/terrain`
  load the sim data graph at module scope; a lighter zone-lookup module would cut every such
  case. A Sim on a seed the process has not built pays about half a second of collider
  bootstrap even for a scoped world that never walks it.
