# Reconciled crafted-content QA validation

Audit date: 2026-09-07, America/Denver. Source candidate: `69ffdab561bbe204045c7e3a4fcb4a60c0222b43`. Final verdict: **PASS, local**. Four current findings found and resolved: three source/test findings and one documentation nit; zero deferred.

## Scope and preflight

The packet worktree is `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch `feature/freeholds`. It was clean at `09329632507b3073a5948588f312842a05280ddf` before this audit. Fetch/prune confirmed PR #3872 merged and the newest release `origin/release/v0.42.0` at `6111e6d206`, already integrated by `7f4fe99619`; the merge returned already up to date. There was no new release merge or patch movement requiring a merge audit or install.

The reviewed content baseline is `49ed3f09333f4f1293edda9a98fe590c5651c20e` (`86eb86bbe2^`). The original producer commits are `86eb86bbe2`, `8bd097d898`, `b3c2452b49`, `3666d89647`; six historical repair commits and the current repair were independently reviewed. The raw baseline-to-HEAD range also includes unrelated release integration. [Context tables](reviews/context.md) reconcile every deliverable, all ten crafts, all three patterns, thirteen item obligations and profession edits. [Added tests](reviews/added-tests.md) inventories their actual assertions.

## Commands and observed outcomes

Commands below ran in the packet worktree. Log receipts retain hashes of the complete raw local output and selected result excerpts; they do not claim that trimmed excerpts contain every executed case.

| Command | Outcome |
| --- | --- |
| `npm run wiki:content` | Exit 0. |
| `npm run i18n:gen` followed by `git status --porcelain` | Exit 0; clean generated tree. |
| `npx tsc --noEmit` | Exit 0 before and after the source repair. |
| Exact twenty-suite invocation below | Exit 0: 20 files, 938 passed, 3 release-tier skips. |
| Exact six-suite repair invocation below | Exit 0: 6 files, 291 passed, no skips. |
| `npx vitest run tests/freehold_content.test.ts tests/furnishing_recipes.test.ts tests/architecture.test.ts tests/recipe_economy.test.ts --maxWorkers=2` after completing HN1 | Exit 0: 4 files, 172 passed, no skips. |
| `npx @biomejs/biome check src/sim/content/recipes.ts` | Exit 0; no fixes required. |
| `npx @biomejs/biome check --write src/sim/content/freehold/index.ts src/sim/data.ts src/sim/freehold/crafted_availability.ts tests/freehold_crafted_availability.test.ts` | Exit 0; only repair files formatted. |
| `node scripts/item_art_audit.mjs --verify-only` | Exit 0; machine checks passed. No asset generation. |
| PG16 invocation below | Exit 0: 3 files, 57 passed, both differential suites armed. |
| `npm run ci:changed` after applying source fixes | Exit 0. This is not the actual last-commit check. |
| First `node scripts/gate_select.mjs` | Exit 1; configuration/timing diagnosis below. |
| Final `node scripts/gate_select.mjs` | Exit 0: all 12 steps green; full suite 4028 files passed, 1 CI sentinel skipped; 60610 passed, 2 expected failures, 28 explained skips. Browser: 47 files, 389 passed. |

```sh
npx vitest run tests/freehold_content.test.ts tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts tests/furnishing_item_kind.test.ts tests/architecture.test.ts tests/guide.test.ts tests/i18n_completeness.test.ts tests/localization_fixes.test.ts --maxWorkers=4

npx vitest run tests/freehold_crafted_availability.test.ts tests/corpse_harvest_sim.test.ts tests/furnishing_recipes.test.ts tests/furnishing_pattern_items.test.ts tests/freehold_content.test.ts tests/architecture.test.ts --maxWorkers=2
```

The three initial scoped skips are the existing `it.runIf(RELEASE_TIER)` cases in `tests/localization_fixes.test.ts`: server copied-English H3b, admin copied-English H3b, and all-21-locale `s3_localized` emit recognition. This feature branch does not arm release-tier coverage. No furnishing acceptance case was skipped in the repair invocation.

## Shared gate and PostgreSQL

The first shared attempt used eight workers, an isolated PostgreSQL 17 instance through `TEST_DATABASE_URL`, and `WOCC_PG_DIFFERENTIAL=1` without the differential suites' separate `DATABASE_URL`. It returned 4 failed, 4024 passed and 1 skipped files; tests were 2 failed, 60607 passed, 2 expected failures and 28 skipped. Failures were one 20-second corpse-harvest timeout, two SQL differential suite setup authentication failures on the default local connection, and the market integration suite's explicit PostgreSQL 16 version requirement receiving 17. No threshold or source assertion was weakened. The timeout suite passed in the six-suite repair invocation.

A separate disposable PostgreSQL 16 cluster was initialized on loopback port 53300, database `freeholds_qa`, user `qa`. The server reports 160015. The earlier audit-owned PG17 cluster was stopped. This changes only the local test harness; it is not a product dependency/engine migration or a background service enablement.

```sh
TEST_DATABASE_URL=postgresql://qa@127.0.0.1:53300/freeholds_qa DATABASE_URL=postgresql://qa@127.0.0.1:53300/freeholds_qa WOCC_PG_DIFFERENTIAL=1 npx vitest run tests/server/client_perf_summary_sql.test.ts tests/server/deeds_board_sql.test.ts tests/woc_market_delivery_pg_integration.test.ts --maxWorkers=1

env -u DATABASE_URL -u WOCC_PG_DIFFERENTIAL TEST_DATABASE_URL=postgresql://qa@127.0.0.1:53300/freeholds_qa GATE_SELECT_BASE=origin/release/v0.42.0 GATE_MAX_WORKERS=4 node scripts/gate_select.mjs
```

The first command passed all 57 tests. Its maximum-ledger probe exercised 2,048 rows, 2,095,164 encoded bytes and 13 statements; every statement stayed below the unchanged 3,500 ms bound. The final shared gate keeps `TEST_DATABASE_URL` armed but leaves the opt-in differential flag and `DATABASE_URL` unset so unrelated simulations do not inherit server configuration. The separate green differential run covers those opt-in cases.

The intermediate PG16/four-worker shared attempt on `d5ea0825` was deliberately interrupted with SIGTERM when the architecture specialist found the remaining HN1 recipe-catalog import. It is neither a passing gate nor a product-test failure. After the one-line correction, 172 focused tests passed and the full gate restarted on clean `69ffdab561`.

The final gate passed all 12 steps on `69ffdab561`, exit 0. Unit results: 4,028 files passed and one optional CI sentinel file skipped; 60,610 tests passed, two expected failures and 28 explained skips (60,640 cases total), in 1,496.46 seconds. Chromium browser regressions: 47 files and 389 tests passed. Owning generation/SFX conformance, i18n and manifest freshness, malware scan, changed-file formatting, typechecks, environment/server/bot builds and client build all passed. The security scan covered 8,645 files with zero high flags after priors; formatting reported no errors, with 400 existing warnings and nine infos. No required furnishing case was skipped.

[Skip disclosure](reviews/skip-disclosure.md) accounts for the configured optional cases. The wholly skipped `tests/ci_pg_presence.test.ts` is a CI-only sentinel (`WOCC_EXPECT_PG=1` or `GITHUB_ACTIONS=true`), not an unarmed database integration suite. Twenty-three existing optional/historical cases comprise ten release-tier i18n checks, one release MediaWiki check, four HUD-tour checks, two server wall-clock benchmarks, one staging reset, one rename-only proof, one pre-existing custom-map reshape, two superseded Armoury stage cases and that CI sentinel. The five differential cases are additionally gated in the shared invocation and passed separately on PG16. The actual final shared-gate totals must match execution; no furnishing acceptance case is waived.

## Mutation checks that actually failed

Every challenge ran in an isolated scratch copy with original source bytes restored. The live worktree was unchanged by mutations. Each recorded baseline/mutant/restored exit sequence is **0 / 1 / 0**. Failures were the intended assertions, not setup or import failures.

| Challenge | Exact test invocation and observed failure |
| --- | --- |
| Remove the 16-Mark clockwork-lamp quartermaster offer | `npx vitest run tests/apex_pattern_channels.test.ts --maxWorkers=2 -t 'every recipe teaching pattern appears in EXACTLY'`; fails the actual missing channel row. |
| Put `vale_wheat` in the weapon-rack bill | `npx vitest run tests/provisioner_firewall.test.ts --maxWorkers=2 -t 'covers every bill and admits produce only in cooking and alchemy decor'`; fails the actual produce restriction. |
| Roll back refused manual knowledge to an empty Set | `npx vitest run tests/freehold_crafted_availability.test.ts --maxWorkers=2`; the then-current 17-case suite goes from 17 passing to 3 intended preservation failures and 14 passing, then back to 17 passing. |
| Drop furnishing recipe IDs while sanitizing loaded knowledge | `npx vitest run tests/freehold_crafted_availability.test.ts --maxWorkers=1 -t 'preserves the authored cohort through lit, dark and relit JSON saves'`; the final round-trip test passes, fails on lost authored knowledge, then passes. Seventeen other cases are intentionally filtered for this scratch challenge; the complete 18-case suite ran in the repair invocation and shared gate. |

Machine receipts are retained under [receipts](receipts/). The quartermaster/produce run adapted the existing `../crafted-qa-2026-09-07/mutation-reproduction.py` to the current scratch path and targeted live assertions; knowledge and round-trip mutations are described above with their exact commands and assertion excerpts.

## Protected functions, calibration and content evidence

Independent AST comparisons by context and fresh reviewers find both full declarations identical to the pre-content baseline: `evaluateCraftAdmission`, 8,599 bytes, SHA-256 `02084dd3b64fc40fc1f15bf18226964176f232ebd763829ca9402728772870c3`; `resolveTrain`, 1,040 bytes, SHA-256 `ca7437959bbc99f2f155217bc25f8a8b0f9ffb5b420808ae83728567fc90bbd3`. All fifty accepted development calibration field comparisons match across ten cohort rows; the signed source seal remains `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`. Existing literal content/economy/channel tests ran. Neither development calibration nor this QA grants production approval.

The content reviewer independently checked 99 retained path/byte/hash records, all thirteen icon owners and shipping hashes, all thirteen English names and five authorized M16 fills. It viewed final art and runtime presentation. The frontend reviewer verified four current source hashes against retained interaction captures and viewed the applicable screenshots. No visual source changed in this repair, so matching accepted captures remain valid evidence; the current shared gate supplies browser regression execution. Final GLB/room/navigation and physical LOW certification remain named later owner gates, not deferred review findings. There is no new sampled-audio producer or GPU asset in this cohort; shared SFX conformance is still required and recorded above.

## Reviews, commits and handoff

[Findings](findings.md): three source/test findings repaired in local commits `d5ea0825d1eb3520cf5114003eb585953ddefb90` and `69ffdab561bbe204045c7e3a4fcb4a60c0222b43`. [Fresh review](reviews/fresh-fix.md): PASS for the current repair plus all six historical fix commits, zero new findings or nits. DOC-1 corrects the calibration field-comparison total to 50 in the current evidence documentation, bringing the complete audit to four found and four resolved. [Fresh documentation review](reviews/docs-final.md) verifies the complete final documentation and ledger changes. Required content, coverage and [final completion checklist](reviews/checklist-final.md), plus applicable database, persistence, security, parity and frontend reviews are retained under `reviews/`. Their final evidence supplements distinguish completed checks from the earlier provisional reports.

The verdict and ledger documentation are committed separately. The actual last-commit `npm run ci:changed` is a required subsequent coordinator action; this pre-commit document does not pre-certify it. Its observed exit and final commit are recorded in the final handoff and local memory receipt. No push or PR merge is authorized. Implementation 05 remains unstarted.

## Audit-owned runtime cleanup

The disposable PG16 cluster stopped successfully after the final gate; the earlier PG17 cluster was already stopped. The shared browser suite unconditionally captures `docs/screenshots/intentional-gathering-pr1/corpse-choice-mobile-portrait.png` at `tests/browser/intentional_gathering.browser.test.ts:395`. Its output timestamp fell inside the final browser run and changed that unrelated tracked screenshot from 73,284 to 73,070 bytes. The audit started clean; the emitted image was preserved under the local evidence staging directory and the tracked file restored to its pre-gate HEAD bytes. [Cleanup receipt](receipts/screenshot-cleanup.json) records both hashes. This removes this audit-owned test side effect, not a furnishing visual repair or unrelated user edit. The source tree was clean again before publishing these documentation records.
