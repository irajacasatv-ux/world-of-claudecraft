# Crafted furnishings QA: gate-integrity review

Verdict: CLEAN WITH FOLLOW-UP. No current selection, generator-freshness, or lint-integrity regression found in the scoped changes. Pin-test results: this reviewer ran no tests, as instructed by the parent. The supplied pre-fix `ci_workflow` log is red with 2 failures and 25 passes; a final parent-owned result is still required.

## Scope and method

Reviewed the original Phase 04 range `49ed3f0933..3666d89647` and the current staged candidate in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, using `.claude/agents/gate-integrity-reviewer.md` criteria and the shared `docs/qa-gate.md` contract. The ordinary unstaged query is empty; staged CI paths and the explicitly supplied commit range make this review in scope. Planning context came from `/tmp/freeholds-crafted-qa-explore.md`, not direct planning-document reads.

The original Phase 04 gate/config change is one formatter override for eight exact JSON paths. The integrated workflow changes are additive screenshot paths in five sparse checkouts, with the matching literal in `tests/ci_workflow.test.ts`. The incoming dependency also updates historical shard weights and adds a refusing harvest guard; these are imported state, not locally authored Phase 04 selection logic.

## Findings, highest severity first

### [WARNING, repaired] Missing crafted screenshot cone would omit required evidence in sparse CI jobs

References: `.github/workflows/ci.yml:639`, `:867`, `:977`, `:1277`, `:1385`; `tests/ci_workflow.test.ts:333` and `:552`.

The pre-fix receipt `/tmp/freeholds-crafted-qa-ci-cone-before.log` proves the screenshot-reference set contained `freehold-crafted-content-2026-09-07` while the cone did not. The concrete adverse case was the Phase 04 commit itself: its accepted-art metadata points at the runtime screenshot manifest, but sparse test jobs would omit that directory. The guard failed visibly rather than silently skipping a test.

Current source repairs all five relevant jobs (`pr-gate`, both long-sim lanes, `release-gate`, `release-i18n`) exactly once and updates the literal. It retains existing Freehold/furnishing paths and incoming guild-history/target-dot paths. The expected five-block count, per-job exact block match, synthetic sixth-block controls, full-tree-job exclusion, tracked-index corpus, unexpected-missing-file refusal, and final two-way set equality are all intact. No test is removed or declassified.

The supplied pre-fix log also reports an unrelated duplicate workflow-classification expectation. The current classification section matches incoming and no duplicate-row repair is represented as a pipeline exemption. Final `ci_workflow` execution remains required.

### [INFO] Do not describe all eight formatter exclusions as CI-enforced immutable byte seals

References: `biome.json:129`; `tests/freehold_crafted_art.test.ts:109`; `tests/furnishing_recipes.test.ts:77`; `docs/freeholds/crafted-content-trial-2026-09-07/calibration.json:830`.

All eight files currently parse as JSON. Only formatting is disabled, with exact filenames and no glob; the override changes neither `files.includes` nor `linter.enabled`, tests, or generators. Its impact is limited and it does not weaken semantic validation. The immutability rationale nevertheless has three distinct levels:

| Exact excluded filename | Current integrity evidence |
| --- | --- |
| `staged-art-v2.json` | Whole-file SHA and byte length pinned in `freehold_crafted_art`; source reads enforce the pin. |
| `staged-art.json` | Whole-file SHA and byte length pinned in the same suite via `supersedes`. |
| `calibration.json` | Whole-file literal SHA pinned in `furnishing_recipes`, plus the checked-in `.sha256` record. |
| `geometry-measurements.json` | Hash and byte length are sealed in the pinned calibration document; current tests do not traverse `sealedEvidence` to rehash this file. Current bytes match that recorded seal. |
| `geometry-proposal.json` | Same recorded calibration seal, currently matching; not rehashed through `sealedEvidence` by the current suite. |
| `economy-measurements.json` | Same recorded calibration seal, currently matching; not rehashed through `sealedEvidence` by the current suite. |
| `items.accepted-art.json` | Schema, identities, source seal, shipping hashes and review-sheet relationships are tested, but no whole-file SHA pin was found. |
| `naming-originality.json` | Historical review evidence; no whole-file SHA pin or test reader was found. |

Thus a future edit to one of the three measurement records alone could evade the recorded-seal comparison, and edits to unasserted prose in the final two records need not fail tests. This is a coverage/rationale limitation, not a newly introduced test-selection hole; formatting was never a semantic-integrity mechanism. State the exemption rationale precisely. If byte immutability is intended for every listed file, add direct or transitive byte-seal coverage through the owning evidence test; otherwise document the two historical/semantic-only exceptions and do not claim stronger enforcement.

### [INFO, inherited nit] Screenshot-corpus vacuity comments and floors lag the current tree

References: `tests/ci_workflow.test.ts:482` and `:539`.

Read-only index enumeration finds 306 screenshot subtrees and 9402 reference-corpus paths. The existing floors remain 245 and 6000, with older measurement comments. They are unchanged by Phase 04 and the two-way referenced/cone equality remains decisive for this fix, so this is not a blocker or a detected escape. A future scope that updates this guard should refresh its floor/measurement rationale to keep its documented near-current premise honest.

No additional uncertain findings or nits were established.

## Generator, test and imported-harvest integrity

A diff from `49ed3f0933` to the current candidate is empty for `test_visibility.mjs`, `gate_select_plan.mjs`, `ci_test_select.mjs`, `ci_shard_plan.mjs`, `ci_leg_runner.mjs`, `teardown_rpc_flake.mjs`, `gate_steps.mjs`, `gate_select.mjs`, and `ci_shard_test.mjs`. The classifier remains computed from source; broad/unprovable changes still widen; CI pipeline/self-workflow edits still force full. There is no altered subprocess status handling, retry scope, test-cache hit, or hidden selective substitution.

The i18n and committed-manifest freshness steps still regenerate, verify trackedness where required, and propagate `git diff --exit-code` failures over their unchanged full sets (`scripts/lib/gate_steps.mjs:110`, `:133`, `:139`). The authored `guide.test.ts` adjustment narrows a prose claim to equipment while adding the exact furnishing-trainer assertion; it does not replace guide generation/freshness checks. Original item-art audit changes raise exact counts for the thirteen new identities and update a separately measured verify-only receipt, rather than admitting missing art. Original monolith ceilings decrease.

The incoming weight harvest rejects empty or suspiciously short logs before writing the table and reports parsed counts (`scripts/ci_shard_weights_harvest.mjs:310`; `scripts/lib/ci_shard_weight_harvest_guard.mjs:20`). The optional raw-log fallback fetch changes harvesting, not the test-run verdict. Shard membership stays structurally separate from weights; unmeasured tests receive the existing median/heuristic fallback (`scripts/ci_shard_partition.mjs:142`) rather than being omitted. No locally changed harvest behavior was found beyond incoming.

## Six required check dispositions

1. Visibility classification: PASS by source review. Computed classification unchanged; no floor test declassified.
2. Widen-to-full triggers: PASS by source review. All planner/pipeline triggers unchanged; screenshot additions only increase available evidence.
3. Partition completeness: PASS by source review; execution pending parent. No partition logic changed. Exact five-cone coupling and adversarial sixth-block controls are retained. Parent must supply the final `ci_workflow` pin result.
4. Exit-code propagation: PASS by source review. Gate/test runners unchanged; no masked status or swallowed failure introduced.
5. Known-flake retry: N-A for the authored scope; PASS preservation. Retry policy/signature/budget unchanged.
6. Silent caps/skips: PASS by source review. No new selection cap or skip path; formatter exceptions are explicit exact-file config, and imported harvest refusals/log fallback remain visible.

No repository edits, tests, generation, or remote actions were performed by this reviewer. Evidence inspection and report writing under `/tmp` only. The final parent-owned gate is still the contribution bar.
