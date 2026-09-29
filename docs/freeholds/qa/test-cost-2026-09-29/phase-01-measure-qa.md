# Part 5, phase 1 (measure): QA

Verdict: PASS. The record in `README.md` and `data/` is complete and reconciles with its
sources; Phase 2 may start.

## Checks run

1. CI series complete. `data/ci_perfile_ms.tsv` summed per run against the job summaries'
   `tests` totals in `data/ci_vitest_summaries.tsv`: run 36493201427, 10,541.0 s by file
   against 10,547.3 s (0.06 percent); run 36501749917, 10,814.2 s against 10,819.4 s (0.05
   percent). The nightly column first summed 1.4 percent short: its two failed files print
   with a different mark (a chevron, not a check) that the harvest parser, built for green
   runs, does not read.
   Their durations (164,337 and 151,018 ms) were added from the log by hand; the column now
   sums to 18,930.0 s against the summary's 18,884.68 s.
2. Local series complete. `data/local_perfile_ms.tsv`: 5,074 rows, 74,017 tests, collect
   2,143.77 s and duration 4,985.76 s against the run's own `import 2143.79s, tests
   4985.75s`.
3. The Sim probe reproduces. Two probes a run apart: a full-world constructor with a fresh
   seed 530 to 722 ms, with a seed already built in the file about 22 ms; the empty test
   world 60 to 137 ms fresh, about 1 ms warm. A CPU profile of the constructor (esbuild
   bundle, `node --cpu-prof`) puts about 85 percent of it under the surface-NPC bootstrap's
   safe-position search, which builds the seed's collider grids.
4. Calibration of the cheapest remedy on a real suite. `tests/vehicles.test.ts` (65.7 s in
   CI) under production's idle culling (`idleMobTickRadius: PLAYER_INTEREST_DROP_RADIUS`,
   which the server and the offline client both set): 18.84 and 18.67 s of test time before,
   2.62 and 2.58 s after, all 9 cases green. Not committed; Phase 2 decides it with a
   mutation check.

## What the record cannot show

- CI does not print per-file import time, so imports are ranked from the local run (CI
  shards import about twice as slowly: 4.2k s against 2.1k s for the same files).
- The shard weights and the lane rule read test-body time only; the three suites with heavy
  collect-time work (README, item 4) are invisible to both.
- One run per surface, under runner variance of up to 1.7x per shard; every cut is judged
  per file and confirmed by the post-change harvest, never by one job's wall.

## Phase 2 plan (heaviest first)

173 files outside the lane weigh 10 s or more in CI (3,909 s of the shard pool's about
8,700 s), plus the 17 lane files. Each gets one verdict (KEEP, SLIM, MERGE, MOVE TO NIGHTLY,
DELETE); every DELETE or MERGE carries a mutation proof that another suite still fails, and
every SLIM a mutation check that the slimmed file still fails. The remedies, cheapest first:
production idle culling for tests that tick the whole world around one player; a scoped
world (`EMPTY_TEST_WORLD` and kin in `tests/sim_shared.ts`) where the system under test does
not switch itself off on a custom world; one seed per file where many seeds buy nothing; a
cheap PR-tier representative with the sweep moved to the nightly; merging duplicate
recordings (the parity family records every scenario three times).
