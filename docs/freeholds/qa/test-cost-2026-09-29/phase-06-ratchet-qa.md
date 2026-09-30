# Part 5, phase 6 (the total-CI-time ratchet and the admission rule): QA

Verdict: PASS (the last two fresh reads came back without a should-fix; their INFO notes are
applied).

## What landed

- **The ratchet** (`f9d5040c71`, pinned in `7b9af20663`), in the `tests/monolith_budget.test.ts`
  mold and beside the lane rule it extends (`scripts/lib/ci_shard_plan.mjs`): `poolWeights` sums
  the weight table in CI time (`ciTimeWeight`, so a carried row counts at its CI scale) into the
  shard pool and the lane; `ratchetProblems` reports a pool over its ceiling, and a ceiling more
  than `RATCHET_SLACK` (20 percent) above its pool as stale, naming the value to lower it to.
  `SHARD_POOL_CEILING_MS` (7,743,000) and `LANE_POOL_CEILING_MS` (366,000) are the harvest of run
  36610517548 plus `RATCHET_HEADROOM` (10 percent; two green full-mode runs of one tree summed
  their per-file time 2.6 percent apart, so a re-harvest alone does not trip it). With the
  ceiling at the harvest plus 10 percent, a pool that falls about 8 percent below its harvest
  reads stale, so a real cut must lower the ceiling in the same change. The values are pinned as
  literals in `tests/suite_lane_threshold.test.ts`, an always-run guard, which judges the
  committed table on every PR, so whatever grows a pool fails where it lands: a harvest, a
  carried row for a new file, a superseded row.
- **The lane's own band** (`bf4ce76659`, `541becaa24`). The third harvest (run 36648684156) read
  the lane at 418,492 ms against 307,115 and 332,450 at the two before, with no lane file changed:
  every lane row 23 to 74 percent slower than at the harvest before (one half alone 102,982 to 203,705 ms across the three),
  one runner's speed moving the whole small pool. The single band would have failed that harvest
  as growth. The lane now has `LANE_RATCHET_HEADROOM` 0.5 (the 1.36 times spread and the shard
  pool's 10 percent) and `LANE_RATCHET_SLACK` 0.8 (a stale point 1.2 times the set point, so only
  a cut of about 17 percent forces it down), and `LANE_POOL_CEILING_MS` 461,000 (the fastest
  reading times 1.5, 10 percent over the slowest). This is a raise of the pinned lane ceiling from
  366,000 (26 percent), made as a calibration fix to a ratchet this same branch introduced, from
  measured evidence, and flagged to the maintainer as a decision to confirm; its price, stated in
  the constant's comment, is that a lane growing up to about 50 percent on a fast-runner harvest
  still passes. Taking lane rows as the median of several runs would let the lane share the shard
  band again. The shard ceiling came down to 5,431,000 in the same commit (pool 4,937,172 ms).
  Superseded 2026-09-30: runner calibration let the lane share the shard band (see "The
  calibrated re-base" below).
- **The admission rule** (`tests/CLAUDE.md`, "Test cost"; `docs/qa-gate.md`): a new test file's
  leading comment says what it uniquely guards and what it costs, on `Guards:` and `Cost:` lines.
  The same suite checks it on every `.test.ts` the weight table has not measured (no row, or a
  carried one), which is the table's own population (`scripts/lib/ci_shard_walk.mjs`), and on
  every other file a bare vitest run collects outside the table (a `.test.mjs`, a `.spec.ts`, a
  test outside `tests/`), except the legacy `.test.mjs` suites pinned by name. A new file's
  stated cost counts into the ratchet in CI time (scaled like a carried row, never below the
  measured-median fallback), and outside the lane a stated cost over the lane threshold in CI
  time fails at once.
- **The stated cost is a field, not prose** (the final form, `cccb0a1c7b` to `c1ad6405e3`, after
  free-text parsing lost to a new phrasing in each of four review rounds): the `Cost:` line holds
  one time and nothing else, on a line that is all comment, and is the only `cost:` in the header
  or on the first code line. It opens its paragraph or closes a Guards statement's paragraph, and a
  blank comment line or a Guards statement follows it; when only lines that say nothing follow it,
  the first code line it abuts may carry no comment. A fraction reads only in seconds and to two
  places, and the figure is rounded. The header is scanned token by token for where its comments
  open and close, on every JavaScript line terminator. Anything that breaks the rule is refused
  (the file fails), never read low. The boundary is structural and stated above `COST_FIELD`:
  prose inside the Guards text or another paragraph is for the reviewer, and the first harvest
  replaces the field with a measured row, which the lane rule and the ratchet then judge. A
  `Guards:` line needs real content (twelve characters or more, no `Cost:` on it; `ea7892d4ec`).
- **The walkers agree with what vitest collects** (`c02dd7fdad`, `5129d62038`, `057674b357`,
  `38bd3f4f8d`, `aa52b4c654`, `efe3a5d0a8`, `e98292ea38`): discovery lists every collected
  browser-named file (only `.browser.test.ts` is excluded, as in `vite.config.ts`); a directory
  under `tests/` that a walker skips but vitest collects fails a guard; every test-named file
  outside `tests/` fails a guard, and so does a symlinked directory outside `tests/` that reaches
  one (followed as vitest's glob does, each real directory once), with `.wt` and `.worktrees`
  walked when nested because vite excludes them only at the root; and a test file under `tests/`
  that neither config collects (a `.browser.test.ts` outside `tests/browser/`, a test-named file in
  `tests/browser/` without that suffix, or a symlink to a directory or a test-named file) fails a
  guard.

## Mutants

Through the restore-verifying runner, a must-pass control first each round:

| Mutant | Killed by |
|---|---|
| the shard ceiling under its pool | the live pool case |
| the lane ceiling stale (500,000 against a 332,450 pool) | the live pool case |
| a carried row summed unscaled | the synthetic pool case |
| the stale check removed | the synthetic pool case |
| the ceiling raised in the library, the slack loosened | the literal pins |
| a new file's stated cost ignored by the pools | the stated-cost pool case |
| the markers read from anywhere in the file | the synthetic admission case |
| a carried row treated as measured | the synthetic admission case |
| a table row removed (an unmeasured file with no statement) | the live admission case |
| an empty or terse `Guards:` line accepted | the synthetic admission case (the terse mutant survived the first round; `ea7892d4ec` added the case) |
| a legacy `.test.mjs` dropped from the pinned list | the outside-table admission case |
| `1,200 ms` read as 200, no median floor, no per-file threshold | the synthetic admission and pool cases |
| a lazy number anywhere on the line read | the synthetic admission case |
| a dotted `ms` figure read, a fraction left unscaled, a fraction to three places read | the synthetic admission case |
| a second time on the line ignored, in ms or s only, or on a second Cost line | the synthetic admission case |
| the field allowed prose, a non-Guards label, or any label below it | the synthetic admission case |
| block tracking off, a block that never opens, no reopen on `*/ /*`, code after a close read as comment | the synthetic admission case |
| a code line's comment part dropped, lines split on `\n` only | the synthetic admission case |
| the code-line comment ignored, a code-line `cost:` ignored, the paragraph check dropped | the synthetic admission case |
| `cost:` counted at line start only, no open check, no Guards paragraph above, no rounding | the synthetic admission case |
| a code line behind bare breaks unchecked, or always checked; any Guards line accepted above or below; a content-free line not a break | the synthetic admission case |
| discovery dropping any browser-named suffix | the discovery pins |
| the druid row at 900 ms | `tests/ci_shard_partition.test.ts`'s whale case |
| the lane judged with the shard slack or headroom, the shard with the lane slack | the synthetic pool case |
| the shard ceiling left at 6,504,000, the lane ceiling under its pool | the live pool case |

Two survivors are recorded as equivalent today: dropping the outside-table newcomers from the
ratchet's input (no newcomer exists; the pin on `RATCHET_UNMEASURED_INPUT` bites when the first
one lands), and restoring the outside-tests guard's browser skip (no browser-named file lives
outside `tests/`). Each walker guard was instead proven on planted files: a
`src/zz_probe.browser.test.mjs`, a `tests/zzprobe/zz_probe.browser.test.ts`, a
`tests/browser/zz_probe.test.ts`, a directory symlink under `tests/` (a symlinked fixture file
stayed green), a nested `src/x/.wt/old/tests/a.test.ts`, and outside `tests/` a two-hop directory
link, a link to a browser-only directory and a plain link each turned their guard red, while a
link cycle ended and a link named `node_modules` was skipped; the tree was clean after each.

## Reviews

Fresh gate-integrity readers read every fix round; each round's should-fix findings were
applied and read fresh again.

- `f9d5040c71`: the values were not pinned, a new file's stated cost did not count, a statement
  could be empty, and files outside the table were not asked. Fixed in `7b9af20663` and
  `ea7892d4ec`.
- `7b9af20663`: a new file outside the table did not count into the ratchet, a stated cost had no
  floor and no lane bound, `1,200 ms` read as 200, and a nested directory a walker skips but
  vitest collects was invisible. Fixed in `a39e92b45d`.
- `a39e92b45d`: `25 000 ms` and `2 min 30 s` read low, the unmeasured input was not named, and
  discovery dropped any `.browser.test.*` name while vitest excludes only `.browser.test.ts`.
  Fixed in `e513654429` and `c02dd7fdad`.
- `c02dd7fdad` and `e513654429`: the outside-tests guard still skipped browser-named paths, and a
  dotted `ms` figure read low. Fixed in `5129d62038` and `bedb2c2937`.
- `5129d62038` and `bedb2c2937`: the stranded check looked one way only, and a line naming two
  times read its first. Fixed in `057674b357` and `6731baca55`.
- `057674b357` and `6731baca55`: a second time in another unit (`2 min`) read low. Fixed in
  `e4106d7337`, with symlinks narrowed in `38bd3f4f8d`.
- `e4106d7337`: a wrapped or hyphenated second time, a time in words, and a lowercase second
  marker read low. Free-text parsing was then replaced by the strict field (`cccb0a1c7b`), and a
  symlinked directory outside `tests/` was covered (`aa52b4c654`).
- `cccb0a1c7b`: an unstarred line inside a block ended the scan early. Fixed in `e9829d7f80`,
  with the symlink walk made to follow links as vitest does (`efe3a5d0a8`).
- `e9829d7f80`: `*/ /*` reopening a block, and nested `.wt` links skipped. Fixed in `633306b24a`
  (a token-level scan) and `e98292ea38`.
- `633306b24a`: a comment closing on a code line was dropped whole. Fixed in `f86acf249f`.
- `f86acf249f`: a trailing comment on the first code line read. Fixed in `f67bd68d24`.
- `f67bd68d24`: the line above the field, and a mid-line `cost:`, could qualify it. Fixed in
  `5a1fafda04`, where the structural boundary was written down.
- `5a1fafda04`: a JSDoc closing on its own line let a code-line comment through. Fixed in
  `f0b175c0c8`.
- `f0b175c0c8`: an empty Guards line below switched the code-line check off. Fixed in
  `02bc9855a9`.
- `02bc9855a9`: PASS, with four INFO notes, all applied in `46efad8db5`.
- `46efad8db5`: PASS, with two INFO notes (a case-sensitive Guards marker check, a command split
  across lines in the docs), applied in `c1ad6405e3` (its mutant killed).
- `bf4ce76659` (the lane band): PASS. The reader recomputed the three lane pools from the committed
  table history and confirmed no lane file or helper changed between the harvests; INFO notes (the
  comment misstated the lane slack's ratio, a doc named one slack, a long line (rewrapped in the
  record's last fix round), and the looser lane
  protection to state) applied in `541becaa24`.

Recorded, not changed: English prose that qualifies the cost from inside the Guards text or
another paragraph (for example "cold at 8 workers it is 2 min" as a Guards continuation) is not
parsed; that is the stated boundary, a reviewer reads it, and the harvest replaces the field with
the measured row on the file's first CI run.

## The calibrated re-base (2026-09-30)

Verdict: PASS (the last fresh gate-integrity read came back without a should-fix; its INFO notes
that change behavior or pins are applied).

The maintainer delegated the decision; the evidence decided it.

- **The evidence.** Five full-mode runs of nearly one tree (36724442671, 36726951063,
  36730711359, 36735089417, 36737663127; the first two had one failing shard from a since-fixed
  test, the last a browser-job setup failure) printed the calibration line in every test job. The
  50 job medians ran 100.8 to 202.4 ms, median 177.75. With each job scaled by that median over
  its own line, the shard pool's spread across the runs fell from 1.249 raw to 1.069 and the
  lane's from 1.384 to 1.064, the heaviest run 4.6 percent over the five-run median in both:
  calibration removes the runner's share of the noise, so the lane no longer needs its own band.
- **The anchor** (`4005ec8cd9`). `CALIBRATION_REFERENCE_MS` 178 (the median, rounded) and
  `CALIBRATION_REFERENCE_ANCHORED` true. A calibrated weight is CI time on a median runner, the
  unit `LANE_THRESHOLD_MS` and `CARRIED_LOCAL_TO_CI_RATIO` were set in, so both keep their
  values; their meaning holds to within the fleet's mean-versus-median skew (the calibrated pools
  averaged about 7 percent over the raw ones), which tightens the lane line and loosens the carry
  conversion inside its margin.
- **The harvest** (`4005ec8cd9`). Run 36735089417 (fully green): all ten jobs calibrated
  (factors 0.9022 to 1.1237, four CPU models), none raw, no outlier fallback, 5,060 rows. Its
  pools are 5,350,684 ms (shard) and 421,627 ms (lane); no shard-pool row is over 54 s.
- **The table contract** (`ed847a6d3b`, `26346cca83`, `190d699128`). Once anchored,
  `calibrationTableDefects` refuses a raw or partial harvest, a table with no calibration block,
  and a `calibrated` block no harvest writes (a raw map, a warning, no job, a jobs array); the
  anchoring is injectable so both arms are pinned. It is load-bearing: a raw harvest of the same
  run (5,369,243 and 422,975 ms) passes the ratchet against the new ceilings. The harvest's
  change-of-scale note is judged against HEAD's committed table, not the working-tree file (a
  refused harvest left on disk set nothing), and with the reference anchored it sends a partial
  harvest to another run instead of advising a re-base.
- **The re-base** (`b9935a8daa`). `LANE_RATCHET_HEADROOM` and `LANE_RATCHET_SLACK` are gone;
  both pools use `RATCHET_HEADROOM` 0.1 and `RATCHET_SLACK` 0.2. `SHARD_POOL_CEILING_MS` went from
  5,431,000 to 5,886,000 and `LANE_POOL_CEILING_MS` from 461,000 to 464,000, each the calibrated
  pool plus 10 percent. That is a change of unit, not a raise: raw, the same tree's shard pool read
  4,558,572 to 5,693,364 ms across the five runs, and in the new unit the heaviest run (about
  5,621,600) was over the old shard ceiling. Run 36648684156, behind the old ceilings, printed no
  calibration, so its move cannot be split into runner speed and growth. Across the five runs the
  shard ceiling sits 4.7 percent over the heaviest and the lightest 7.2 percent over the stale
  point; the lane's are 10.0 and 2.5 percent, since the harvest drew the heaviest lane of the five.
  A lane read stale right after a re-harvest of an unchanged lane is the signal to revisit the band
  on more runs (the `RATCHET_SLACK` comment says so).

### Mutants

Through the restore-verifying runner, a must-pass control first each batch, all killed:

| Mutant | Killed by |
|---|---|
| the shard ceiling left at 5,431,000, the lane ceiling at 461,000 | the literal pins (both old values sit between the pool and the stale point, so the live case alone passes) |
| the lane band restored, its slack only, its headroom only | the synthetic both-directions case |
| the slack loosened to 0.8 | the literal pins and the synthetic case |
| the reference left provisional, left at 200 | the literal pins, and separately the committed-table pin |
| a raw harvest of the same run, a pre-calibration table, a partial table, a calibrated block with a raw map, committed | the committed-table pin |
| the anchored arm, the partial arm, the edited-block check, the empty-jobs check, the default anchoring | the synthetic table-contract cases (the default also by the committed-table pin) |
| the harvest writing raw rows under a calibrated block | the harvest end-to-end pin |
| the scale note's anchored arms removed, ignoring the anchoring, defaulting provisional | the scale-note case (a removal also by the harvest end-to-end pin) |
| the scale note judged on the working-tree table, preferring it, or on `HEAD~1`; the git call without the checkout root or with stderr inherited; the basis named backwards | the harvest's committed-basis case (the naming also by the partial-harvest case) |
| a warning or a jobs array accepted in a calibrated block | the synthetic table-contract case |

### Reviews

- `4223eb0b5f..b9935a8daa`: PASS, no should-fix. Its INFO notes (the old lane ceiling's source,
  the partial harvest's contradictory scale note, the mean-versus-median skew, the lane's thin
  stale margin, an edited calibrated block, "every harvested row", this record's pointers) were
  applied in `26346cca83` and here; the shard ceiling's move reads as a raise in the diff, so the
  PR that lands it states the reason (`tests/CLAUDE.md`, "Test cost").
- `26346cca83`: one should-fix. A refused raw or partial harvest left on disk read as the prior,
  so the next calibrated harvest was told to re-base thresholds nothing had set. Fixed in
  `190d699128` (the note reads HEAD's table), with its INFO notes (a warning or jobs array in a
  calibrated block, "about 7 percent" in one comment, the carried-row sentence) applied.
- `190d699128`: PASS, no should-fix. The reader walked the anchoring moment, a version bump,
  uncommitted constants, detached and shallow checkouts and a missing file, and found the HEAD
  basis right in each (the index or the merge base would not be). INFO notes applied in
  `658b5229e6`: the note names the table it judged against, and the pin holds the git call's
  root and quiet stderr and restores its stub in a `finally`. Recorded, not changed: when git
  fails the fallback judges against the working-tree table, so a refused raw leftover could still
  draw the re-base advice there (the note now says which table it read); the carried-rows report
  still reads the working-tree table (older than this change); the tripwire does not check the
  entries inside `jobs`.
