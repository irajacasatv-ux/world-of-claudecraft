# Part 5, test cost and test value: the measurement record

The per-file series behind Part 5 of the Freeholds work (the ledger:
`docs/freeholds/qa/persistence-2026-09-08/findings.md`, PART 5). Every table in `data/` is
the raw series, not a summary; the tools that produced them sit in `tools/`.

## The baseline (before any Part 5 change, tip `faa7a48eba`)

| Surface | Source | Figure |
|---|---|---|
| PR shard job walls | CI 36493201427 (at `e57856af25`) | 12.37 to 29.82 min; the 29.82 held a 12.37 min stalled checkout, the 24.02 a 5.48 min one |
| PR shard job walls | CI 36501749917 (at `faa7a48eba`) | 12.68 to 20.50 min, every checkout healthy (1.43 to 1.87 min) |
| Summed shard TEST steps | the two runs | 114.17 and 117.29 min (mean 115.73) |
| Long-sims lanes, test step | the two runs | A 7.85 and 12.08 min, B 10.75 and 6.67 min |
| Browser job | the two runs | 3.52 and 3.97 min (its test step 1.92 and 1.98) |
| Nightly | 36480351546 (at `0313c4272d`) | 3 h 28 min; the unsharded test step 201.15 min at 2 workers |
| Local full suite | this record, 8 workers, Postgres armed, lane files in | 949.19 s; 5,074 files, 73,987 tests; import 2,143.79 s, tests 4,985.75 s |

The targets Fernando accepted (ruling (a)): the slowest PR shard job wall at or under 16.8 min
(30 percent under 24.0), the summed shard test steps at or under 86.8 min (25 percent under
the 115.73 mean), the nightly under 150 min.

Runner variance is large and has to be read into every CI comparison: the same shard with the
same files took 10.13 min in one run and 17.32 in the other (shard 2), so one run's wall is
not evidence of a cut. The per-file CI series (`data/ci_perfile_ms.tsv`) sums to within 0.05
percent of the shard summaries' `tests` totals (run 36501749917: 10,814 s by file against
10,819 s summed from the job summaries), so it is the complete series.

## Where the time goes

Worker time in one full-mode PR run (both runs, from `data/ci_vitest_summaries.tsv`): the
eight shards spend about 8.6k s in test bodies, 4.2k s importing, 0.6k s transforming; the
two lanes 2.1k s in test bodies. Each shard runs two workers on a four-vCPU runner (a measured
decision in `scripts/ci_shard_test.mjs`; three and four workers were tried and failed
timeouts), so a shard's test step is about half its worker time plus imbalance.

1. Test bodies, by file (`data/ci_perfile_ms.tsv`). 20 files over 60 s (2,308 s, mostly the
   lane), 67 files at 20 to 60 s (2,255 s), 103 at 10 to 20 s (1,416 s), 226 at 5 to 10 s
   (1,533 s), 808 at 2 to 5 s (2,499 s), and 3,833 under 2 s (666 s).
2. The Sim itself (`data/sim_cost_probe*.json`, `tools/sim_cost_probe.test.ts.txt`). 1,163
   test files construct a `Sim`. A full-world Sim costs 530 to 610 ms for a seed the file has
   not built yet, about 22 ms for a seed it has; the surface-NPC bootstrap builds the collider
   grids for that seed (about 85 percent of the constructor in a CPU profile). The empty test
   world (`EMPTY_TEST_WORLD` in `tests/sim_shared.ts`) costs 60 to 140 ms per fresh seed and
   about 1 ms after. A full-world tick costs 2.5 to 2.9 ms, 0.37 ms with the idle culling
   production runs (`idleMobTickRadius`), 0.12 ms on the empty world.
3. Imports (`data/local_import_modules.tsv`, self time summed over every importing file).
   The 22 locale slices of `src/ui/i18n.resolved.generated/` cost 486 s of the 2,144 s local
   import total, 466 s of it the 21 non-English slices, the barrel and the dev pseudo-locale,
   loaded by 761 files through the locale re-export in `src/ui/i18n.ts` (production
   tree-shakes that re-export away; vitest evaluates it). Next: `src/sim/sim.ts` 64 s over
   1,721 files, `src/sim/data.ts` 55 s over 3,004, `src/sim/world_quest_daily_generation.ts`
   48 s over 1,737 (its catalogs are built at module load), `thornhollow_field.generated.ts`
   31 s over 2,558.
4. Work at collect time, invisible to the shard weights (they read test-body time only):
   `tests/fire_short_fight_tuning.test.ts` 42.4 s, `tests/chronomancy_heal_parity.test.ts`
   13.5 s and `tests/gather_node_placement.test.ts` 11.6 s of collect locally
   (`data/local_perfile_ms.tsv`, `collect_ms`).
5. The parity family, 393 s in CI: every scenario is recorded twice by the gate (the
   determinism pair) and a third time by the coverage suites.
6. Checkout (`data/ci_job_walls.tsv`). The sparse test jobs fetch in under a second and then
   spend 80 to 93 s inside `git checkout` pulling the cone's blobs lazily (20,450 files); both
   stalls of run 36493201427 (5.4 and 12.3 min) sat in that phase. The full-tree jobs fetch the
   whole 2.72 GB tree at depth 1 in 57 to 67 s.
7. The nightly (`data/ci_perfile_ms.tsv`, nightly column): 18,930 s of test bodies at two
   workers in one job. The full balance sweep is about 8,000 s of it, the eight-seed druid
   probe alone 3,054 s.

## The screenshot corpus (`data/screenshots_by_dir.tsv`, `data/screenshot_refs.tsv`)

2,417 tracked files, 1.41 GB, the largest single part of the 2.72 GB tree. A file-level scan
(`tools/screenshot_refscan.mjs`: every tracked text file indexed once for `screenshots/<path>`
spans and for file names equal to a screenshot's basename) sorts them as: named by path 1,077
files (674.9 MB); named by bare basename only 327 (146.3 MB); only their directory named 536
(354.2 MB); named nowhere 477 (236.2 MB). Most of the unnamed directories arrived with the
release/v0.45.0 merge, after Part 3's pruning. Phase 4 judges them under ruling (c).

## Notes on method

- Local runs: `tools/cost_reporter.mjs` as a second vitest reporter with
  `--experimental.importDurations.limit=3000`, `WOC_LANE_SUITES=1`, Postgres armed through
  `TEST_DATABASE_URL` only, on a quiet host (no other vitest process). Test names in
  `data/local_tests_over_250ms.tsv` are normalized to ASCII (a few source names carry dashes
  and arrows the repository's copy rule keeps out of committed text).
- CI series: each job log's per-file reporter line, parsed with
  `scripts/lib/ci_shard_weight_parse.mjs` (the harvest's own parser).
