# Crafted furnishing QA validation

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch `feature/freeholds`. Original range: `49ed3f0933..3666d89647`. The required open-PR dependency `54ce808436` was merged locally in `2e24ba8818`. QA fixes are `ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7`, and `b379ee462d`. No branch was pushed and no PR was merged.

The final shared gate, visual closure and independent whole-fix review passed for the repaired source. Overall QA remains **FAIL** because F01 is unresolved. Counts below describe separate runs and must not be added together because suites overlap. Historical failed runs are retained as evidence of the repairs, not reported as passing checks.

## Shared gate

The database is an isolated local PostgreSQL container named `freeholds-crafted-qa-pg`, bound only to `127.0.0.1:5547`. It was created for this audit so destructive fixture schemas cannot collide with the user's existing server. `pg_isready` passed. No production database is involved.

Exact first attempt:

```sh
TEST_DATABASE_URL=postgres://freeholds_qa:local-qa-only@127.0.0.1:5547/freeholds_qa WOCC_EXPECT_PG=1 GATE_SELECT_BASE=54ce808436 GATE_MAX_WORKERS=6 node scripts/gate_select.mjs
```

Exit 1. Selection chose the full 4,028-file suite because the integrated change is broad. Artifact generation/freshness, manifest trackedness and the malware scan passed. Changed-file Biome stopped on two formatting errors before Vitest; no full-suite pass is claimed from this attempt. `npx biome ci --changed --since=54ce808436 --diagnostic-level=error --max-diagnostics=100` isolated the two files. `npx biome format --write tests/deeds_content.test.ts tests/furnishing_rift_admission.test.ts` exited 0 and changed layout only. These are F21.

The second attempt used the same command at `85f99f6a32`. Exit 1 after 987.41 seconds: 4,023 test files passed and five failed; 60,589 tests passed, five failed, two were expected failures, and 27 were skipped. Generation/freshness, security scanning and changed-file formatting passed first. The five assertions were the old guide-key retirement, old NPC release fingerprint, measured shard coverage, same-ID tooltip control, and obsolete tooltip call signature (F25 through F29). This failed run did not reach the later browser/typecheck/build stages. Full output: `logs/freeholds-crafted-qa-gate-attempt2.txt`.

The third and final source attempt used the same command at `b379ee462d` and **exited 0: all 12 steps green**. It selected all 4,028 unit files. Results: 4,028 files passed; 60,594 tests passed, two expected failures and 27 existing case skips, with no skipped suite (935.59 seconds). Shared Chromium regressions passed all 46 files / 385 tests (11.87 seconds). Typecheck and environment/server/bot builds passed all five tasks; the client build passed. Artifact generation/freshness, SFX conformance, manifest trackedness, changed-file Biome and malware scanning passed (8,643 files scanned, zero high findings after existing priors). The client build's backdrop-filter survival check also passed. Full output: `logs/freeholds-crafted-qa-gate-attempt3.txt`.

## Focused repair and integration checks

| Exact command | Outcome | Log basename under `logs/` |
| --- | --- | --- |
| `npx vitest run tests/furnishing_market_catalog.test.ts tests/furnishing_rift_admission.test.ts tests/freehold_crafted_availability.test.ts --maxWorkers=3` | Exit 0; 3 files, 48 tests passed | `freeholds-crafted-qa-market-rift.txt` |
| `npx vitest run tests/guide.test.ts tests/guide_provisioning.test.ts --maxWorkers=3` | Exit 0; 2 files, 152 tests passed | `freeholds-crafted-qa-guide-after.txt` |
| `npx vitest run tests/recipe_pattern_tooltip_view.test.ts tests/bags_view.test.ts tests/bags_window.test.ts --maxWorkers=3` | Exit 0; 3 files, 185 tests passed | `freeholds-crafted-qa-pattern-tooltip-final.txt` |
| `npx vitest run tests/server/freehold_wire.test.ts --maxWorkers=3` | Exit 0; 1 file, 86 tests passed | `freeholds-crafted-qa-freehold-wire-final.txt` |
| `npx vitest run tests/ci_workflow.test.ts tests/guide.test.ts tests/guide_provisioning.test.ts tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/monolith_budget.test.ts --maxWorkers=4` | Exit 0; 6 files, 269 tests passed, 3 existing tests skipped | `freeholds-crafted-qa-precommit-final.txt` |
| `npx tsc --noEmit` | Exit 0 after the source repairs | `freeholds-crafted-qa-tsc-final.txt` |
| `npx vitest run tests/furnishing_recipes.test.ts tests/ci_workflow.test.ts tests/deeds_content.test.ts tests/furnishing_rift_admission.test.ts --maxWorkers=4` | Exit 0; 4 files, 107 tests passed; repairs committed in `47655ffb54` | `freeholds-crafted-qa-final-test-repairs.txt` |
| `npx vitest run tests/bags_window_use_routing.test.ts tests/bags_window.test.ts tests/bags_view.test.ts tests/recipe_pattern_tooltip_view.test.ts tests/architecture.test.ts --maxWorkers=4` | Exit 0; 5 files, 328 tests passed | `freeholds-crafted-qa-touch-final.txt` |
| `npx vitest run tests/pr_shot_targets.test.ts --maxWorkers=3` | Exit 0; 1 file, 44 tests passed | `freeholds-crafted-qa-capture-final-tests.txt` |
| `npx tsc --noEmit` | Exit 0 after the touch refusal repair | `freeholds-crafted-qa-tsc-touch.txt` |
| `npx vitest run tests/guide_key_coverage.test.ts tests/guide_provisioning.test.ts tests/crafted_item_tooltip_coverage.test.ts tests/freehold_npc_spawn.test.ts tests/furnishing_tooltip_view.test.ts tests/item_compare.test.ts tests/item_compare_view.test.ts tests/css_corpus.test.ts tests/css_value_validity.test.ts tests/mobile_window_coverage.test.ts tests/error_toast_log.test.ts --maxWorkers=4` | Exit 0; 11 files, 134 tests passed | `freeholds-crafted-qa-gate-repairs-focused.txt` |
| `npx vitest run --config vitest.browser.config.ts tests/browser/error_toast_layer.browser.test.ts tests/browser/heroic_mobile_loot.browser.test.ts` | Exit 0; 2 files, 5 tests passed; new overlap assertion first failed on old CSS | `freeholds-crafted-qa-toast-layer-after.txt` |
| `npx vitest run tests/ci_shard_partition.test.ts tests/ci_shard_weight_carry.test.ts tests/ci_shard_weight_parse.test.ts tests/ci_shard_weight_harvest_guard.test.ts --maxWorkers=4` | Exit 0; 4 files, 78 tests passed | `freeholds-crafted-qa-weight-owner-tests.txt` |
| `npx tsc --noEmit` | Exit 0 after the final UI and timing repairs | `freeholds-crafted-qa-tsc-latest.txt` |
| `pnpm install --frozen-lockfile` | Exit 0 after integration changed the Three.js patch | Integration receipt in `reviews/merge-audit.md` |
| `node scripts/assets/eastbrook_grand_armoury/remint_polish_provenance.mjs` | Exit 0; recomputed metadata source seals after integration, generated no image/model | `freeholds-crafted-qa-polish-remint.txt` |

The original content-focused run passed 22 files / 744 tests. The following broader integration run passed 18 files / 1,020 tests and failed one assertion in `tests/server/freehold_wire.test.ts`: the incoming Rift switch now defaults open. F17 corrects that expectation while retaining the explicit-off and environment-read assertions. The owning rerun above passed all 86 tests.

```sh
npx vitest run tests/furnishing_persistence.test.ts tests/character_state_backcompat.test.ts tests/professions_blob_roundtrip.test.ts tests/professions_blob_growth.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/snapshots.test.ts tests/env_protocol.test.ts tests/bandwidth.test.ts tests/freehold_snapshot_wire.test.ts tests/freehold_command_chain_online.test.ts tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts tests/server/freehold_wire.test.ts tests/server/freehold_routes.test.ts --maxWorkers=4
```

The guide regression first failed three assertions, then passed after generator/page/M16 repairs. An intermediate nine-file repair run failed only generated-file freshness because the generated file had not yet been staged; staging the intentional generator output and running the owning guide checks resolved it. The pattern presentation regression first failed 12 assertions and then passed all 185 tests after its source repair. See the corresponding before/after logs.

## Mutation controls

`mutations.json` records exact argv and exits for both challenges. Removing the clockwork manual's sole quartermaster row makes `tests/apex_pattern_channels.test.ts` fail at the required channel assertion. Replacing a weapon-rack reagent with `vale_wheat` makes `tests/provisioner_firewall.test.ts` fail at the admitted-craft assertion. Both sequences are baseline 0, mutant 1, restored 0, and live bytes remain unchanged. The scratch setup's initial missing `.browserslistrc` failure is excluded from accepted mutation evidence.

## CI timing measurements and independent NPC baseline

The missing-weight inventory has all 279 paths in `unmeasured-all.json`. `missing-weight-measurements.json` records the exact structured `npx vitest run <279 paths> --reporter=default --maxWorkers=4` argv, each run's exit and parsed duration map, and the owning `node scripts/ci_shard_weights_harvest.mjs --carry-local --reason ... <path=run1,run2,run3 tokens>` argv. The reproducible driver is `measurement-reproduction.mjs.txt` (executed from `/tmp/freeholds-crafted-qa-measure-missing.mjs` with the same isolated PostgreSQL environment as the full gate).

All three batches exited 0: 279 files / 3,964 tests passed each, no skipped suites; durations 81.96, 82.60 and 82.62 seconds. The owning generator exited 0. It added 279 measured rows, preserving every prior weight and carried provenance entry and the 3,545 harvested-file count. The final 4,011 walked suites all have weights; the unchanged 94% coverage floor and partition/balance guards pass. These overlapping measurement runs are not additional unique test coverage.

The independent NPC probe runs archived real `Sim` code from original `49ed3f0933`, incoming `54ce808436` and merge `2e24ba8818`. All three probes exited 0. `npc-baseline-measurements.json`, `npc-probe.ts.txt` and `reviews/final-gate-analysis.md` retain the exact fields, source revisions and upstream cause. The original reproduces the old literal; incoming and merge agree on the new full fingerprint and RNG. The corrected test pins that independently established incoming baseline.

## Visual and asset evidence

Original same-change art evidence remains 13 shipping WebPs, 18 Codex image calls, five documented corrections, and 42 runtime captures. The QA generated no asset. New before/after browser screenshots verify the presentation repairs. The accepted bundles under `../../screenshots/freehold-crafted-content-2026-09-07/qa/` are `guide-before` (6), earlier `guide-after` (6), `manual-before` (5), intermediate `refusal-layer-before` (1), and final `combined-after` (11). Final capture source hashes match `5f4821bec7`; the subsequent timing-only commit does not change those files. The final combined run exited 0 with no target or page exception; all manual variants record English after the Japanese guide. Actual disabled mobile Use sends no command, retains one manual and visibly explains refusal above Bags. Enabled desktop/mobile controls consume one copy and learn once before their separately restored tooltip fixtures.

The independent report is `reviews/frontend-final.md`; the capture owner's reproduction and curation report is `reviews/presentation-browser-evidence.md`. Logs preserve 65 ambient console entries in the final run: 29 missing-local-backend HTTP 502 responses and 36 character-preload warnings. These are not described as a console-clean or general 3D-loading pass. Firefox/WebKit, physical-device safe areas and hardware LOW performance are outside this capture claim.

## Final status

`npm run wiki:content` and `npm run i18n:gen` both exited 0 after the final gate. An explicit generated-source diff check exited 0. `git status --porcelain` initially also showed two reference PNGs rewritten by the shared browser tests at their hardcoded capture paths: `docs/screenshots/intentional-gathering-pr1/corpse-choice-mobile-portrait.png` and `docs/screenshots/intentional-gathering-pr2/source-picker-1280x720.png`. Their write times match the shared browser run and their owning tests call `page.screenshot` at those paths. These test byproducts were copied to `/tmp/freeholds-crafted-qa-browser-byproducts` and restored to their pre-run checked-in versions. The subsequent status contains only this audit's untracked evidence directories; no generated source is stale.

`GATE_SELECT_BASE=54ce808436 npm run ci:changed` exited 0 after the last source-fix commit (`b379ee462d`); its output is `logs/freeholds-crafted-qa-ci-before-verdict.txt`. The coordinator repeats that exact command after the separate verdict/evidence commit and records the observed final commit and exit in the final task response and memory receipt. That post-verdict replay is not substituted by the earlier gate's Biome step.

The two dedicated Orca Vite terminals were closed with `ptyKilled: true`, and neither port 5192 nor 5193 remains listening. All capture browsers were closed. The isolated `freeholds-crafted-qa-pg` container was verified against its created ID and removed with exit 0 after all PostgreSQL tests finished; the user's existing database was untouched. Cleanup receipts are retained.

The fresh independent assignment reviewed all 80 repair-file deltas in `2e24ba8818..b379ee462d`, all 28 applied repairs, the final capture inventory, actual measurement provenance and final gate evidence. This is distinct from the reviewer's earlier bounded database review. F01 prevents packet PASS and advancement to the next implementation step. The final report is `reviews/qa-checklist-final.md`.
