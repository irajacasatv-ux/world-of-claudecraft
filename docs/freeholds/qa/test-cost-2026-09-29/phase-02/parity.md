# Parity cluster: the golden-trace gate (`tests/parity/`)

Part 5 test cost, one cluster: the seven gate shards `parity_a..g.test.ts`, the four coverage
shards `coverage_a..d.test.ts` and `harness.test.ts`. Every PR pays all of them (`tests/parity/`
is the `CI_GUARD_PREFIXES` floor in `scripts/lib/ci_shard_plan.mjs`): 390.7 s of CI test time per
full-mode run at the baseline (mean of runs 36493201427 and 36501749917,
`../data/ci_perfile_ms.tsv`).

Commits as landed on `feature/freeholds` (measured against `a2bd94a83e`):

1. `cfd3227e73` test(parity): run the coverage checks on the gate's own recording
2. `7c0b34bb36` test(parity): build the harness samplers on the recorded scenarios' seeds
3. `21df2ca3c0` test(parity): guard the recordings the coverage cases share
4. `6494bde45a` docs(freeholds): record the parity cluster's test cost cut
5. `5b08a5f09a` fix(parity): declare the coverage timeout through a same-file const (the
   coordinator's fix, see below)

The review fix round is recorded at the end.

## What changed and why

**MERGE, the coverage suite onto the gate's recording.** The gate recorded every scenario twice
(the determinism pair, then the first recording against the golden) and the coverage suite
recorded it a third time only to assert that it fires its subsystem. `run_scenarios.ts` now runs,
per scenario, the gate case and then that scenario's coverage cases, which read the gate's FIRST
recording through `recording_cache.ts`; a recording is held only until its last reader has run.

- The 77 case bodies moved verbatim into `coverage_cases_a..d.ts`: each suite body diffed
  byte-identical against its old file (13, 26, 14 and 24 cases). Only the headers, the imports and
  the `describe` wrapper changed.
- All 161 full test names are unchanged (JSON reports before and after, same set).
- `UPDATE_PARITY=1` minting is unchanged, and the coverage cases still run when minting: the
  recording is held before the mint branch.
- The eleven `*.test.ts` files keep their names, because the shard-weight table has rows for
  them and `tests/ci_shard_partition.test.ts` fails on a row whose file is gone. Each file is now
  a one-line `runParityShard(n)`; `tests/duplicate_test_blocks.test.ts` lists the four coverage
  files as delegators.
- `SHARD_BOUNDS` is re-derived for eleven shards as a min-max contiguous split under a measured
  cost model: twice each scenario's warm recording, plus about 0.9 to 1.3 s of collider bootstrap
  per distinct seed in a shard. The fiesta pair, the shaman/druid/priest trio and both
  multi-scenario coverage cases stay whole.
- Guards, because one recording now serves several cases: the event list, notes and frames of a
  held recording are frozen. A case fails if it is async, reads a scenario it did not declare,
  passes a modified `Scenario` object, or records anything outside the cache (counted in
  `record.ts`). A shard bound that splits a multi-scenario case fails at import.

**KEEP, the determinism pair on every PR (the MOVE TO NIGHTLY lever, rejected on evidence).** See
the tier table below.

**SLIM, `harness.test.ts`.** The sampler cases built Sims on seeds 5, 7 and 9 (three collider
bootstraps) and the draw-order cases recorded `solo_warrior` three times. The samplers now use the
two recorded scenarios' seeds (1001, 1002) and the discrimination case reuses the determinism
case's first recording. No assertion changed; none depends on the seed.

## Per file

CI ms is the baseline (run 36493201427 / run 36501749917). Local is the vitest `tests` figure,
`npx vitest run <file> --maxWorkers=1`, median of three runs, before and after run back to back
on the same host (every run is a row of `data/parity_local_runs.tsv`); the before side is the
`a2bd94a83e` files. A shard file's slice changed with the re-derived bounds, so a per-file delta
compares a different set of scenarios; the family total is the like-for-like figure. The Mutants
column names the mutants each file killed (the Mutants section names their sources).

| File | CI ms | Verdict | Change | Local tests s, before to after | Mutants killed | Owed |
|---|---|---|---|---|---|---|
| `parity_a.test.ts` | 22,975 / 14,204 | MERGE | shard 0: scenarios 0 to 6, gate plus coverage | 9.29 to 7.01 | L1, armor DR | weight row |
| `parity_b.test.ts` | 24,912 / 29,513 | MERGE | shard 1: 7 to 12 | 17.72 to 8.85 | L1, recipe (both arms), G4, G5 | weight row |
| `parity_c.test.ts` | 23,581 / 27,610 | MERGE | shard 2: 13 to 16 | 16.41 to 9.70 | L1 | weight row |
| `parity_d.test.ts` | 45,881 / 40,242 | MERGE | shard 3: 17 to 23 | 19.18 to 8.65 | L1, armor DR, G6, G7 | weight row |
| `parity_e.test.ts` | 20,901 / 31,140 | MERGE | shard 4: 24 to 39 | 17.47 to 8.55 | L1, armor DR | weight row |
| `parity_f.test.ts` | 45,680 / 41,911 | MERGE | shard 5: 40 (`nythraxis_full_pull` alone) | 21.38 to 13.12 | L1, armor DR | weight row |
| `parity_g.test.ts` | 31,112 / 37,043 | MERGE | shard 6: 41 to 49 | 19.61 to 9.55 | L1, armor DR, G1 | weight row |
| `coverage_a.test.ts` | 40,323 / 39,148 | MERGE | third recording gone; now shard 7: 50 to 56 | 14.76 to 10.36 | L1 | weight row |
| `coverage_b.test.ts` | 38,353 / 38,924 | MERGE | now shard 8: 57 to 59 (the class-engine trio) | 16.50 to 18.25 | L1 | weight row |
| `coverage_c.test.ts` | 28,498 / 53,972 | MERGE | now shard 9: 60 to 71 | 20.73 to 11.15 | L1, L2, G2 | weight row |
| `coverage_d.test.ts` | 37,922 / 47,274 | MERGE | now shard 10: 72 to 83 | 23.46 to 7.87 | L1, armor DR | weight row |
| `harness.test.ts` | 12,540 / 7,760 | SLIM | shared seeds, one warrior recording reused | 4.34 to 2.39 | H1 to H4, 4/4 | weight row |
| **Family** | **372,678 / 408,741** | | | **200.85 to 115.45 (-85.4 s, -42.5 percent)** | | |

Import time moved from 24.98 s to 22.39 s (sum of the medians). A single run after the guard
commit measured 112.17 s, so the guards cost nothing measurable. At the baseline's CI-to-local
ratio (390.7 s against 200.85 s) the family should land near 225 s of CI test time per run, about
166 s less; the next green full-mode harvest is the measurement that counts.

Every parity case after the change is green in all three runs, in the extra run after the guard
commit and in a whole-directory run (`npx vitest run tests/parity`: 187 passed, 1 skipped, the
env-gated rename proof). The cluster did turn one suite outside it red:
`tests/suite_duration_budget.test.ts`, because the merged runner passed each coverage case's
timeout as `c.timeout`, which the declared-timeout ratchet cannot size. `5b08a5f09a` fixed it by
passing the same-file `COVERAGE_TIMEOUT_MS` at the one registration (a case asking for another
allowance now throws).

## The determinism pair stays on every PR

Cost first. In one warm process on a loaded host (`data/parity_pair_probe.tsv`), the 84 first
recordings took 114.3 s and the 84 second recordings 62.2 s. The second recording skips the
per-seed collider bootstrap, so the pair is about a third of the merged gate. The heaviest
second recordings: `nythraxis_full_pull` 11.8 s, `druid_engines` 10.5 s, `professions_gather`
4.3 s, `drowned_litany` 3.7 s, `fiesta_powerups` 3.2 s.

What the pair catches that the golden comparison does not: state that leaks from one Sim into
the next Sim in the same process. Three tiers were run against the whole family, with the tier
applied as a second edit to `run_scenarios.ts` by the mutation runner:

| Mutant (src edit) | What it models | Golden only | Pair on a named subset | Full pair (kept) |
|---|---|---|---|---|
| L1: `sim.ts`, a Sim whose `riftCollisionToken` (the module counter in `rift_regions.ts`) is above 1 shifts `nextId` | a counter every Sim reads | killed, 73 of 84 gate cases; the 11 survivors are exactly the first scenario of each file (the one-scenario shard survives whole) | not run (the subset tier contains the golden-only tier) | killed, 84 of 84 |
| L2: `professions/fishing.ts`, the catch table reversed in place after its roll | shared content one scenario writes and reads | survives (161 passed) | survives (pair on solo_warrior, rift_boss_floor, rift_clear_rewards, dungeon_instances, freehold_claim) | killed, `professions_fishing_session` |
| L0: `rift_regions.ts`, every Sim gets rift token 1 | the real per-Sim token regression | not run | not run | survives the gate; killed by `tests/rift_sim.test.ts` ("two same-seed Sims keep isolated rift collision") |

The golden comparison catches a leak only when a LATER scenario in the same file reads what an
earlier one wrote. A leak confined to one scenario's own subsystem leaves the recording compared
with the golden untouched, and only that scenario's second recording sees it. A subset
representative covers only the subsystems it drives, and the next leak can be written anywhere,
so no subset keeps this class caught on PR. Verdict: KEEP. The pair stays for every scenario, and
nothing reads `WOC_NIGHTLY_SWEEP` here.

L0 is a boundary, not a gap: two same-seed recordings register identical rift floors, so the
gate cannot see a shared token, and the dedicated suite pins it.

## Mutants

All ran through the scratch runner (each target file verified equal to HEAD before each mutant,
restored after, and a Tests line required); every outcome is a row of `data/parity_mutants.tsv`:

- **Family, source behavior (6/6 killed).**
  - Armor DR drift (`types.ts` `armorReduction`, 400 to 500): 11 gate cases in 6 files.
  - `arena_1v1` recipe without its lethal blow (`scenarios.ts`): the gate case AND the coverage
    case "arena_1v1: a match resolves (arenaEnd)" fail on the shared recording. With
    `-t 'coverage: each scenario'` the coverage case alone still fails, through the
    record-it-yourself path.
  - L1 under both tiers, and L2 under the full pair.
- **Tier evidence (expected survivors).** L2 golden-only and L2 subset pass, which is the point;
  L0 passes the gate and is killed by `tests/rift_sim.test.ts`.
- **Runner guards (6/6 killed).** G1: the hit-rating case with an undeclared scenario throws. G2:
  a bound at 70 fails `coverage_c.test.ts` at import with the split-case message (the runner files
  it DID-NOT-RUN because a collection failure prints no Tests line; the JSON report shows the
  suite failed). G4: a case reversing the held event list hits a TypeError. G5: an async case
  throws. G6: a case importing `record` from `./record` fails the recording count. G7: a case
  passing `{ ...scenario }` throws.
- **Harness (4/4 killed).**
  - H1: the meta sampler keeps excluded keys, failing "excludes every session / presentation /
    derived field".
  - H2: the entity sampler returns the live entity, failing both `sampleEntity` cases.
  - H3: the draw digest never folds, failing "differs across scenarios", which reads the reused
    recording.
  - H4: the observer never counts, failing "is deterministic for the same scenario".
- **Controls (3/3 passed).** Comment edits in `fishing.ts`, `coverage_cases_a.ts` and `trace.ts`.

## Owed

- The shard-weight rows for all twelve files describe the old work. The four coverage files now
  run different, lighter slices, and every shard's slice moved. They need a supersede
  (`node scripts/ci_shard_weights_harvest.mjs --carry-local --supersede --reason ...`) or the next
  green full-mode harvest. The weights file is out of this cluster's reach.

## Product-side levers seen, not touched

- The per-seed collider bootstrap dominates first recordings. The 84 scenarios use 54 distinct
  seeds, and each one's first Sim in a file pays about 0.9 to 1.3 s here (the surface-NPC
  safe-position search builds the seed's collider grids, about 85 percent of the constructor). A
  cheaper bootstrap in `src/sim` would cut the whole family. The test-side alternative,
  consolidating scenario seeds, moves goldens and needs a deliberate re-mint.
- The heaviest drives tick the full world without production's idle culling (the five second
  recordings above). Culling in their `build()` would shrink them, but it changes far-mob
  behavior in the trace, so it is a re-mint and a maintainer decision, not a slim.

## Review fix round (branch `test-cost/parity-fix`, on `35e89ced9a`)

1. `bacd23b5e8` test(parity): deep-freeze what the coverage cases share and refuse a tick. The
   freeze was one level deep. Events, notes and frames are now frozen all the way down (a Map or
   Set is walked but stays writable). The final Sim's entity and player records are frozen one
   level (a field write throws; a write inside a nested object such as `pos` is not refused, the
   cheap cut). Ticking the held Sim throws. The modified-`Scenario` guard now checks identity
   against `SCENARIOS` on a filtered run's miss as well as on a hit. `record()`'s doc comment is
   back on its function.
2. `f6e878e101` test(parity): pin that the shard files call every shard index once.
   `harness.test.ts` collects each shard file's literal `runParityShard(n)`, comments stripped,
   and requires exactly `0..PARITY_SHARD_COUNT-1`; a non-literal argument fails. The parity notes
   anchor the file count to `SHARD_BOUNDS` instead of a literal.
3. `6831c844f5` docs(parity): point the non-vacuity comments at the coverage case module
   (`scenarios.ts`, `trace.ts`, `tests/professions_farming.test.ts`).

Mutants (same runner, rows appended to `data/parity_mutants.tsv`, batch `fix`): 8 of 8 killed,
control passed. The coverage-case mutants:

- F1: a case writes an event field. It fails with a TypeError on a read-only property.
- F2: a case ticks the held Sim. It fails with the tick refusal.
- F3: a case writes `player.hp`. It fails with a TypeError.
- F4: a case pushes into a nested note array. It fails with "object is not extensible".
- F5: `record({ ...scenario })` under `-t 'coverage: each scenario'`, the miss path. It fails with
  the modified-scenario refusal.

The shard-index pin (`harness.test.ts`):

- F6: `coverage_d.test.ts` calls `runParityShard(9)`. The pin fails.
- F7: the same, with `// runParityShard(10);` left behind as a comment. The pin still fails,
  but that alone does not prove the comment strip (the live duplicate fails it either way);
  the control run does, since harness.test.ts's own comment spells `runParityShard(n)`, which
  an unstripped scan would read as a non-literal call and fail on.
- F8: `runParityShard(5 + 5)`. It fails as a non-literal argument.

After the round, `npx vitest run tests/parity tests/professions_farming.test.ts` is green (367
passed, 1 skipped), and so is a coverage-only filtered run (77 passed).

Memory (`npm run test:memory`, peak/end retained MiB after a forced GC per case). A held
recording keeps a full Sim alive until its last reader. The largest held sets are the rift reward
quartet (4 Sims, `coverage_c.test.ts`) and the hit-rating pair (2, `parity_g.test.ts`):

| File | Held at most | Peak/end MiB | Budget |
|---|---|---|---|
| `coverage_c.test.ts` | 4 | 238/176 | ceiling 1024 |
| `parity_g.test.ts` | 2 | 197/166 | 240 (row measured 199) |
| `coverage_d.test.ts` | 1 | 200/188 | ceiling 1024 |
| `parity_e.test.ts` | 1 | 196/181 | ceiling 1024 |
| the other seven shard files | 1 | 173 to 189 | ceiling 1024 |
| `harness.test.ts` | 0 | 157/157 | ceiling 1024 |

Nothing is over budget. The quartet costs about 60 MiB over its file's end state, so no earlier
release was needed. The peaks before the fix round were within 4 MiB of these figures.

The fix-round commits above were integrated on feature/freeholds under the SHAs cited
(the worktree branch held them as cbfb78f4c3, a450c596d0, 81d1a60831 and 3847d950ea).
