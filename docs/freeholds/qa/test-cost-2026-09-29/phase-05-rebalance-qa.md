# Part 5, phase 5 (harvest, rebalance, bounds, the nightly): QA

Verdict: PASS (every bar met on green full-mode CI: the summed shard test step 78.03 min and the
slowest shard job 13.85 min at run 36648684156; the nightly under 2.5 h; the trial reverted on its
own bar; every harvest and bound change read fresh).

## The CI runs on the branch tip

| Run | Tip | Mode | Result | Summed shard test steps | Slowest shard job wall | Lanes (test step) |
|---|---|---|---|---|---|---|
| 36583005398 | `07d6b4dad4` (the pause) | full | green | 95.90 min | 15.95 | A 9.17, B 9.73 min |
| 36607633402 | `5afc5f1ab7` | full | red: shard 2 (the greeting-decline floors, below); browser cancelled by a 7.7 minute checkout stall | 94.02 min | 21.10 (an 8.2 minute checkout stall; healthiest-worst 16.12) | A 2.17, B 2.12 min |
| 36610517548 | `fb6f9127f8` | full | green, the harvest source | 98.95 min | 18.03 (a 4.98 minute checkout stall; healthiest-worst 15.65) | A 2.32, B 1.13 min |
| 36635499592 | `f0b175c0c8` (after the second slimming round) | full | green, the second harvest source | 87.78 min | 14.55 (no stall; the whole run 14.8 min) | A 1.70, B 1.55 min |
| 36648684156 | `481a87079f` (after the third slimming round) | full | green, the third harvest source | 78.03 min | 13.85 (no stall; the whole run 14.1 min) | A 2.17, B 2.13 min |

The baseline of ruling (a) was a mean of 115.73 min summed and 24.0 min slowest shard job. The
shard pool's test content barely moved across the first three runs (the lane and the imports are
where the cuts before the slimming rounds landed), so their 94.0 to 99.0 spread is runner
variance; the last two runs follow the second and third slimming rounds.

CI found one real regression the local checks missed: retiring 85 capture scripts took
`tests/greeting_decline.test.ts`'s scanned decline lines with them, so its non-vacuous floors
(more than 44 lines, more than 18 statements) read 36 and 17. Re-measured and re-set in
`fb6f9127f8` (mutants at the measured counts killed). The earlier search for suites that walk
`scripts/` matched only `readdirSync`-style patterns; this one walks through the shared
`sourceFilesUnder` helper.

## The harvest

`node scripts/ci_shard_weights_harvest.mjs 36610517548` (`2a9db2c299`): 5,058 rows, the nine
carried rows replaced, none carried after. By pool, in CI time:

| Pool | Before (the committed table) | After |
|---|---|---|
| shard | 9,745,423 ms | 7,038,584 ms |
| lane | 2,905,969 ms | 332,450 ms (88.6 percent less) |

The table's heavy tail moved with the cull, so three pins anchored on the unculled lane moved
with it (in `tests/ci_shard_partition.test.ts`: the whale over 120 s, five rows over 60 s; in
`tests/suite_lane_threshold.test.ts`: three lane rows over the lane threshold). Each now anchors
on the harvested table (the druid probe over 10 s and a hundred times the median fallback, the
argmax over 30 s, 20 rows over 20 s, 20 rows over a quarter of the threshold and a row for every
lane file); a mutant setting the druid row to 900 ms is killed.

## Shards and lane halves

The shards are packed by the balanced sequencer from the table, so the harvest is the
rebalance: run 36610517548's shard test steps spread 9.78 to 13.60 min on the stale table.

The lane halves stay as they are. Modelled as the lane runs them (one vitest leg per half at two
workers, largest file by bytes first) over run 36607633402's in-lane weights, the current halves
wall 106.8 and 102.9 s; an exhaustive search over every split finds 103.9 and 103.8 s at best,
five moves for three seconds. Measured, the halves took 118.2 and 115.1 s of vitest wall.

Every lane file now weighs under the 90 s lane rule in CI (the heaviest, 66.4 s, the Eastbrook
integration file in run 36607633402, and 36.7 s, nythraxis_matrix, in run 36610517548). The family stays lane-owned as a unit
(the diet-flag registry needs it), and two lane jobs now spend more on checkout and setup (about
2 min each) than on tests; merging them into one job would change required check names, which
`docs/merge-queue.md` makes a maintainer decision. Recorded, not done.

## Bounds

- Lanes: 36 to 29 (`d97a1956db`, then `b006bd3532`). The ruled formula gives 4.88 x 1.60 x 1.37
  = 10.7 (worst healthy lane wall 4.88, run 36607633402 lane B; run 36610517548 lane A's 7.70
  held a 4.92 minute checkout stall and is excluded). Asked with the stall evidence (6 of 22
  test-job checkouts across the two runs took 3.8 to 8.2 minutes, and a stall that completes and
  then runs the tests past the bound is killed in the test step, which the stall-rerun reactor
  does not rerun), Fernando ruled a stall floor: the worst observed stall plus setup plus a
  slow-runner test step, times 1.37. On the 8.2 minute stall that gave 17; the same afternoon a
  lane A checkout stalled 14.8 minutes and was killed at 17 in its test step (run 36622924538) and
  a shard checkout stalled 16.45 (run 36615627398), so the ruled arithmetic on 16.45 gives
  (16.45 + 0.5 + 3.68) x 1.37 = 28.3, so 29, which also holds the one sanctioned flake retry.
- pr-gate: 49 stays (ruling (b)). The formula on this branch's worst healthy full-mode shard wall
  (16.12, run 36607633402 shard 7) gives 16.12 x 1.60 x 1.37 = 35.3.
- release-gate: unchanged at 36. It runs only on `release/**` pushes, whose shards carry the lane
  files in-shard, so no run on this branch measures it; its re-derivation belongs to the first
  release push after this lands.

## The nightly

Sharded two ways per ref in `b0f14aa71e` (the verdict counts both halves; a night where one half
never finished reads as unproven, with a missing-half case and six mutants). Nightly 36607799389
at `5afc5f1ab7`, dispatched at the branch: 60 min end to end against 3 h 28 min on 36480351546,
under the 2.5 h target. Half 1: 54.47 min of tests plus 2.63 of memory budgets; half 2: 33.63 min
of tests after an 11.08 minute checkout stall. The halves are uneven because the partition uses
the PR-tier weights, which understate the lane files at nightly depth; at an hour, not worth a
nightly weight table. Half 2 was red on the greeting-decline floors only (fixed after that
commit); every re-banded full-depth band passed. The skill icon history arm (`git clone
--revision`, git 2.49 or newer) ran on the runner for the first time and passed (19 of 19).

## Checkout options

No option changed. The time in a sparse test job's checkout sits in one lazy blob fetch between
`git checkout` and the first "Updating files" line: 84 s healthy (run 36607633402 shard 7), 8.2
minutes stalled (shard 8), and the full-tree browser job stalled the same way (7.7 minutes), so no
alternative option is shown better by measured evidence. The tree itself fell from 2.72 GB to
2.49 GB with phase 4.

## The three-worker trial

Ruled 2026-09-29 ("Trial 3 workers, then slim"): the shard legs at three workers (the lanes at
two), kept only if two full-mode runs were green with no timeout and the summed shard test step
fell at least 5 percent.

| Run | Shards | Summed shard test steps | Notes |
|---|---|---|---|
| 36615627398 | 2 red | 81.43 min | shard 1: the new admission suite took `.pathname` off a file URL (the Windows path guard, fixed in `7b9af20663`); shard 2: the SFX Studio suites shared one worker's Studio root, so a draft one left blocked the other's export (a latent leak the new packing exposed, fixed test-first in `8f445b9422`) |
| 36619850946 | green | 90.80 min | lint and browser killed inside checkout by stalls |
| 36622924538 | 1 red | 85.58 min | shard 8: `tests/item_art_audit_builder.test.ts`'s `--verify-only` subprocess passed its 30 s timeout under the contention |

Against two workers (94.02 and 98.95 min), three workers summed about 11 percent less shard test
step, but per-file time inflated 28 to 49 percent (test bodies 8,800 to 10,300 s of worker time
against 6,885) and the third run timed out a subprocess: the bar failed and the trial was
reverted in `b006bd3532` (the pin again forbids the knob anywhere). The slimming round the ruling
paired with it runs next (its own record).

## The second slimming round and the second harvest

The slimming round ruled with the trial judged the 285 files of the 5 to 20 s CI tier none had
judged before (five clusters, records in `round-two/`): 238 changed, 47 kept, about 877 s of local
test time saved at one worker (1,426 s to 549 s over the changed files). Run 36635499592 at the
integrated tip was green in full mode: the summed shard test step 87.78 min (against 94.02 and
98.95 at two workers before), the slowest shard job 14.55 min, and vitest's own split, summed over
the eight shards, test bodies 112.1 to 98.6 worker-minutes while import held at 56.6 to 57.9.

Its harvest (`1d9af4a53b`) re-measured every row: the shard pool fell 16.0 percent (7,038,584 to
5,912,504 ms), which the ratchet reported as a stale ceiling, so `SHARD_POOL_CEILING_MS` came down
to 6,504,000 in the same commit (both ceiling mutants killed); the lane pool fell 7.6 percent to
307,115 ms, inside its slack, and kept its ceiling.

87.78 min is 24.2 percent under the 115.73 baseline, short of the ruled 25 percent (86.8 min). A
third round over the next tier (515 files at 2 to 5 s of CI time that still built a full-world
Sim, 27.3 CI minutes) followed; its record is `round-three/`.

## The third slimming round and the third harvest

Run 36648684156 at the integrated tip was green in full mode: the summed shard test step 78.03
min, 32.6 percent under the baseline (the ruled bar is 25 percent), and the slowest shard job
13.85 min, 42 percent under the 24.0 min baseline (the ruled bar is 30 percent), both on the
second harvest's table, whose packing spread the shards 6.27 to 11.58 min.

Its harvest (`bf4ce76659`) cut the shard pool another 16.5 percent (5,912,504 to 4,937,172 ms), so
`SHARD_POOL_CEILING_MS` came down to 5,431,000 in the same commit. The same harvest read the lane
at 418,492 ms against 307,115 and 332,450 at the two before, with no lane file changed: every lane
row 23 to 74 percent slower than at the harvest before, the lane jobs 2.17 and 2.13 min against 1.70 and 1.55, one runner's
speed moving the whole small pool. The lane got its own band sized on that measured spread
(`LANE_RATCHET_HEADROOM` 0.5, `LANE_RATCHET_SLACK` 0.8, a ceiling of 461,000: the fastest reading
times 1.5, 10 percent over the slowest); `phase-06-ratchet-qa.md` has the reasoning and its
review.

