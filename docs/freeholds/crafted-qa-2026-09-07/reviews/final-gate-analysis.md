# Final-gate analysis: shard weights and dark NPC fingerprint

Read-only investigation of the two assigned gate failures at HEAD `85f99f6a32` and comparisons against original `49ed3f0933`, incoming dependency `54ce808436`, and merge `2e24ba8818`. Repository source remained unchanged by this auditor. While the gate ran, only code/history/log reads and deterministic weight arithmetic were performed. After explicit coordinator authorization, the bounded independent NPC constructor probes below ran from temporary source archives. No weight generator or Vitest suite was executed by this auditor.

## Findings and principled repair

### 1. Medium, high confidence: integrated test inventory outgrew the imported measured-weight table

Actual gate failure at `tests/ci_shard_partition.test.ts:282` is **0.9304412864622289 < 0.94**. This is the measured-table coverage check, not missing or duplicate partition members and not load imbalance.

Independent revision enumeration using the shared walk's path rules:

| Revision | Walked suites | Measured suites | Missing | Coverage |
|---|---:|---:|---:|---:|
| Original 49ed3f0933 | 3,870 | 3,651 | 219 | 94.341085% |
| Incoming 54ce808436 | 3,950 | 3,732 | 218 | 94.481013% |
| Merge 2e24ba8818 | 4,009 | 3,732 | 277 | 93.090546% |
| Gate HEAD 85f99f6a32 | 4,011 | 3,732 | 279 | 93.044129% |

`git show` JSON comparison proves the merged weight table equals incoming 54ce808436's table exactly. The merge combined 59 additional suites; the two new guide/market suites brought the total difference to 61. The original table's ten entries absent from incoming are retired unrelated files, not missing feature measurements, so restoring the old table would be incorrect.

A bounded read-only calculation through the actual `walkShardTestFiles`, `partitionForCi`, `weightForTestFile`, and `assertPartitionCompleteness` gives `{ok:true}`, eight nonempty packs of 500–502 suites, and measured worst/median ratio **1.0**. The defect is precise: insufficient measured inventory.

**Repair:** keep the 94% assertion, partition strategy, balance bar, and fallback policy unchanged. Measure the currently missing population with actual green run evidence and pass those measurements through the owning `--carry-local` generator. The coordinator chose all 279 missing files rather than only the mathematical minimum 39; this preserves complete provenance for the backlog and avoids arbitrary threshold selection.

Prepared read-only manifests:

- `/tmp/freeholds-crafted-qa-unmeasured-all.json`: exact current 279 paths, enumerated through the actual shared walker and measured-weight map.
- `/tmp/freeholds-crafted-qa-unmeasured-measurement-argv.json`: `executable: npx`, argv array `['vitest','run', ...279Paths, '--reporter=default','--maxWorkers=4']`, repeat 3, and three log paths. Use a structured spawn argv, not shell interpolation.
- `/tmp/freeholds-crafted-qa-unmeasured-task-suites.json`: the 61 task/integration-only new paths, retained for diagnosis; the coordinator's agreed measurement set is all 279.

Efficient measurement protocol, equivalent in meaning to the supported serial `--carry-local-missing` mode:

1. Finish the failing source/test repairs first. Run the complete 279-file argv three times, sequentially, recording each process exit and full default-reporter log. The supported serial mode at `scripts/ci_shard_weights_harvest.mjs:155` instead cold-starts each individual file three times; batching preserves the per-file reporter duration source while avoiding837 cold npx starts.
2. Require each whole run to exit0. Parse each log separately with `parseWeightLines` from `scripts/lib/ci_shard_weight_parse.mjs:29`. For each inventory path, require a positive integer entry in every run. Do not merge the three logs through one parser accumulator, because that keeps MAX and loses the actual three-run sample list. Do not invent missing/zero durations.
3. The parser intentionally maps a fully skipped suite to `SKIPPED_FILE_WEIGHT_MS = 100` (`scripts/lib/ci_shard_weight_parse.mjs:17`, `:44`). If this occurs, distinguish the existing sanctioned skipped-suite weight from an elapsed measurement and check that the skip is expected; do not describe it as a measured 100 ms run or silently accept newly skipped behavioral coverage.
4. Construct one token per file: `tests/path.test.ts=<run1>,<run2>,<run3>`. Invoke the existing generator with argv `['scripts/ci_shard_weights_harvest.mjs','--carry-local','--reason','Freehold release integration and crafted-content QA: three local suite runs pending the next full CI harvest', ...tokens]` using the Node executable. The owner computes medians, preserves harvested rows, writes dated per-run provenance, and rejects `carriedDefects` before writing (`scripts/ci_shard_weights_harvest.mjs:60` through `:85`).
5. Parent verifies owning partition/carry/parser tests and final shared gate. If the inventory changes meanwhile, re-enumerate it before claiming full measured coverage. Existing current 279 positive measurements would bring the present 4,011-suite population to100%.

### 2. Medium, high confidence: the pre-furnisher golden was not reconciled with incoming world changes

The test at `tests/freehold_npc_spawn.test.ts:45` retains exactly the original 49ed3f test blob. Its expected full-world fingerprint at `:65` predates the incoming release. The incoming release adds:

- `riftwright_maelis` at `src/sim/content/farshore.ts:309`, admitted by the ordinary NPC constructor in table order. In the independent probe it receives allocator ID 91, moving the last banker 94→95 and later primary/next IDs by 1.
- `realm_builder_monument`, spawned at `src/sim/sim.ts:2585` through `src/sim/realm_builder_monument_spawn.ts:29`. It uses reserved ID 2,000,000,100 (`src/sim/eastbrook_layout.ts:810`) and consumes no allocator or RNG. This adds the second new entity.
- Accepted incoming world geometry/camp changes, including Drakelands Trollmoot camp centers at `src/sim/content/drakelands.ts:837`/`:838`. Those also legitimately affect the full projection hash; removing only the two added entities would not be a principled way to preserve a pre-release hash.

The default dark Freehold path still skips the furnishing NPC before allocating its entity (`src/sim/surface_npc_bootstrap.ts:20`). Comparing incoming 54ce to merge 2e24 shows the constructor's ordinary inline NPC loop replaced by that equivalent dark bootstrap; the incoming monument remains. The new furnishing calm anchor is explicitly omitted from terrain grading.

## Independent NPC baseline measurement

I created separate temporary archives of **src, package.json, and tsconfig.json** from each of 49ed3f0933,54ce808436,2e24ba8818, linked the existing dependency installation, and used esbuild only to bundle the exact same short probe against each archived real `Sim`. All three probe processes exited0. Each constructed `new Sim({seed:1,playerClass:'warrior'})`, projected `{id,templateId,pos,facing,hp}` in actual entity insertion order, hashed that JSON, and read the next RNG value once. This matches the failing test's projection precisely; it is not a recreated simulation.

| Field | Original49ed3f | Incoming54ce808436 | Merge2e24ba8818 |
|---|---|---|---|
| nextId | 1003 | 1004 | 1004 |
| primaryId | 998 | 999 | 999 |
| merchants | [1,33] | [1,33] | [1,33] |
| bankers | [9,22,34,94] | [9,22,34,95] | [9,22,34,95] |
| entityCount | 1019 | 1021 | 1021 |
| positionHash | 297a79e82e0de3213f051b5a5f338a483bc03445f3db02e00af7754d1a9d757e | 722c2cecf11f6e09cdcea8888a7050a9df9c786cc29ee2d771e516b827af00fe | 722c2cecf11f6e09cdcea8888a7050a9df9c786cc29ee2d771e516b827af00fe |
| rngNext | 0.30275995447300375 | 0.30275995447300375 | 0.30275995447300375 |

The original independently reproduces the old literal exactly. The incoming release independently produces the new values before any Freehold feature is applied, and merge 2e24 matches it exactly. The gate HEAD's reported values also match that independently sourced incoming baseline.

**Repair:** re-pin the full expected object from incoming 54ce808436 above and change the comment/title to identify that precise pre-Freehold incoming release baseline. Retain all IDs, complete projection hash, next RNG value, explicit no-furnisher/no-stock assertions, and the independent lit one-furnisher/determinism/geometry cases. This is an independently justified release-baseline reconciliation; do not merely copy the failing actual value, remove fields, or replace the literal with another value generated from the same test execution.

Proof artifacts:

- `/tmp/freeholds-crafted-qa-npc-baseline-measurements.json`: all three full commit IDs, exit statuses, fingerprints, NPC-prefix and reserved-entity projections.
- `/tmp/freeholds-crafted-qa-npc-baseline-location.json`: temporary archive/probe location and refs.
- `/tmp/freeholds-crafted-qa-npc-49ed3f0933.log`
- `/tmp/freeholds-crafted-qa-npc-54ce808436.log`
- `/tmp/freeholds-crafted-qa-npc-2e24ba8818.log`

## Per-claim verdict and remaining work

| Behavior claim | Verdict |
|---|---|
| Complete, disjoint, nonempty eight-shard partition | Covered and independently confirmed by actual pure partition calculation; not the failed arm. |
| Measured weighted balance at or below 1.15 | Covered and independently confirmed 1.0; not the failed arm. |
| At least 94% of current suites carry real attributed weights | Fails correctly; owner must add supported measured data, not weaken assertion. |
| Incoming world constructor fingerprint preserved by merged dark Freeholds | Independently confirmed byte-for-byte projection hash and exact allocator/service/RNG fields across incoming 54ce and merge 2e24. |
| Old dark golden still names the correct release baseline | Fails correctly after stale integration; safe updated expectation established independently above. |

The gate's other three assertion failures are coordinator-owned: crafted-item tooltip composition source pin, furnishing tooltip comparison control, and retired provisioning guide key. They were not reassigned or modified by this reviewer. The full gate exited1 with five failures; repairs, measured-weight generation, owning test reruns, the final gate, visuals, and the outstanding D85 owner decision are not certified complete by this analysis.
