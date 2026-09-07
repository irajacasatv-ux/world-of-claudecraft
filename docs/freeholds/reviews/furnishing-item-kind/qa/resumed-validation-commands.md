# Resumed validation commands

Working directory: /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds. Counts overlap across runs.

```sh
DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=1 npx vitest run tests/server/client_perf_summary_sql.test.ts tests/server/deeds_board_sql.test.ts --maxWorkers=1
```

Exit 0, 2 files and 11 tests, no skips. Log: pg-differential-final.log. Serial execution avoids the previously recorded shared-schema fixture deadlock.

```sh
npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts tests/bank.test.ts tests/craft_from_vault.test.ts tests/professions_feast.test.ts tests/localization_fixes.test.ts --maxWorkers=4
```

Exit 0, 15 files, 764 passed and 3 existing release-only localization skips. Log: required-resumed.log.

```sh
npx vitest run tests/furnishing_feast_parity.test.ts tests/furnishing_feast_admission.test.ts tests/furnishing_tooltip_view.test.ts tests/item_instance_tooltip.test.ts --maxWorkers=3
```

Exit 0, 4 files and 88 tests. Log: feast-parity-final.log.

```sh
npx vitest run tests/furnishing_regalia.test.ts tests/furnishing_dev_picker.test.ts tests/furnishing_tool_effect_tooltip.test.ts tests/legendary_regalia.test.ts --maxWorkers=3
```

Exit 0, 4 files and 40 tests. Log: presentation-resumed.log.

```sh
npx tsc --noEmit
npx biome check src/ui/item_instance_tooltip.ts
```

Both exit 0. Logs: tsc-final-resumed.log and comment-biome.log. These precede the final tool/commerce test additions and do not substitute for the final shared gate.

The final shared gate runs through run-final-gate.mjs, which records exact argv, explicit environment, source commit/tree, times and actual exit code in gate-final-resumed-result.json. Its optional differential arm is disabled only because the two suites above execute separately and serially; TEST_DATABASE_URL remains enabled for the other real PostgreSQL suites.

```sh
npx vitest run tests/furnishing_tool_parity.test.ts tests/furnishing_commerce_parity.test.ts tests/furnishing_feast_parity.test.ts --maxWorkers=3
npx tsc --noEmit
npx biome check tests/furnishing_tool_parity.test.ts tests/furnishing_commerce_parity.test.ts tests/furnishing_feast_parity.test.ts src/ui/item_instance_tooltip.ts
```

All exit 0. Routes: 3 files and 24 tests. Logs: routes-final.log, tsc-routes-final.log and routes-biome-final.log. Committed as d38663539433cbcd30642ea47d7663c5c52c59c0. Earlier routes-first.log failed fixture expectations for material-source buckets, gatherNodeType, a rejected harvest preference, and an IWorld-only harness type; it is not passing evidence.

```sh
npx vitest run tests/eastbrook_polish_capture_contract.test.ts tests/eastbrook_polish_artifact_integrity.test.ts --maxWorkers=2
node scripts/assets/eastbrook_grand_armoury/remint_polish_provenance.mjs
node tmp/freeholds-02-audit/check-provenance-delta.mjs
npx vitest run tests/eastbrook_polish_capture_contract.test.ts tests/eastbrook_polish_artifact_integrity.test.ts --maxWorkers=2
npx biome check tests/eastbrook_polish_capture_contract.test.ts tests/eastbrook_polish_artifact_integrity.test.ts
```

First suite run exited 1 with one renderer-leaf mismatch and 29 passing tests. The owning remint exited 0, emitted three hash values, and swept 50 provenance blocks. Four literal pin sites were updated because the composite appears in both tests; the frozen capture-source fingerprint was not changed. Recursive delta verification exited 0 with only renderer/composite fields changed. Final suites exited 0, 2 files and 30 tests; Biome exited 0. Logs: eastbrook-provenance-check.log, eastbrook-remint.log, eastbrook-delta-check.log, eastbrook-provenance-green.log and eastbrook-biome.log. Committed separately as a82e71f4cd86f74eded5909224fad5cc0108a8c6, including reviewed current-mint comments. No asset or old screenshot was generated or changed.

```sh
GAME_URL=http://127.0.0.1:5189 QA_EXPECT_FIXED=0 SHOTS_DIR=tmp/freeholds-02-audit/late-ui-before-retry node tmp/freeholds-02-qa-late-ui-capture.mjs
GAME_URL=http://127.0.0.1:5190 QA_EXPECT_FIXED=1 SHOTS_DIR=tmp/freeholds-02-audit/late-ui-after-retry node tmp/freeholds-02-qa-late-ui-capture.mjs
```

Both exit 0, two viewports and eight accepted full/detail pairs per viewport. Sources are frozen ce0e25ec85 (before) and ff738f61a1 (after). Subsequent runtime-source edits are comments only; tests and provenance refreshes do not change these UI pixels. Manifests explicitly preserve rejected notice-raced frames and background diagnostics. Frontend reviewer independently inspected every paired surface and returned PASS.

## Completed final shared gate and freshness

The coordinator invoked `node tmp/freeholds-02-audit/run-final-gate.mjs`, whose
exact child command and explicit environment were:

```sh
DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=0 GATE_SELECT_BASE=origin/feature/masterwrought GATE_MAX_WORKERS=4 node scripts/gate_select.mjs
```

Actual exit 0, all 12 steps green, completed at 2026-09-07T13:27:57.885Z on
source d38663539433cbcd30642ea47d7663c5c52c59c0 and tree
29d8ef9b5dc37e81592c259ac4ff9d8e1778af6d. Vitest: 3,868 files passed and one
skipped; 58,083 tests passed, two expected failures and 28 skipped. Browser:
42 files and 373 tests passed. The separately executed serial differential
suites above passed all 11 cases without skips. All other PostgreSQL suites
retained the enabled test database in the full run.

Evidence: [actual result JSON](gate-final-resumed-result.json),
[full log](logs/gate-final-resumed.log.txt),
[readable exact-step excerpts](logs/gate-final-resumed-excerpt.log.txt).

```sh
npm run i18n:gen
git status --porcelain
git diff --exit-code -- src/ui/i18n.resolved.generated src/admin/i18n.resolved.generated src/ui/i18n.catalog/translation_keys.generated.ts
node tmp/freeholds-02-audit/seal-reviewed-files.mjs
```

Generator and explicit generated-output diff both exited 0. The immediate status
contains no generated i18n changes. It also records five incidental screenshot
outputs written by the existing intentional-gathering/material-source browser
tests. The coordinator verified their writers and restored only those five to
their clean pre-gate committed state. The following status contains only the
requested QA documentation/evidence. The repeated source checker exited 0 and
all 110 reviewed files still match d386635394 exactly.

Evidence: [generator](logs/i18n-final-resumed.log.txt),
[immediate status](logs/status-after-final-i18n.txt),
[status after cleanup](logs/status-after-gate-artifact-cleanup.txt),
[repeated source comparison](logs/reviewed-source-seal.log.txt).

## Completed post-verdict CI and evidence formatting

```sh
GATE_SELECT_BASE=origin/feature/masterwrought npm run ci:changed
```

The first post-commit run at bc598fb91e59d376836b12ffe6adef9da2b0ebd4 exited 1
for a single command-array formatting error in the archived gate-result JSON.
The owning formatter changed only whitespace. Fresh/checklist review verified
that repair before amendment, with no new distinct finding beyond Q37 hygiene.
The rerun at c881543258aac22448fe707813b4d25d0339e23a exited 0: 186 files
checked, no errors/fixes, 211 warnings and seven infos. The following status was
empty. Both [failure](ci-verdict-first-result.json) and [success](ci-verdict-corrected-result.json)
retain actual command, revision, timestamps and exit; complete outputs are linked
in the review index. After this reviewed evidence-only amendment, the coordinator
will rerun the exact command after the true last commit and report the actual
exit without editing repository files again.

```sh
python3 tmp/freeholds-02-audit/normalize-archive-logs.py
npx biome format --write docs/freeholds/reviews/furnishing-item-kind/qa/ci-verdict-first-result.json docs/freeholds/reviews/furnishing-item-kind/qa/ci-verdict-corrected-result.json docs/freeholds/reviews/furnishing-item-kind/qa/log-normalization-result.json
```

Both commands exited 0. The archive proof now covers 48 log files, of which 28
require trailing/EOF whitespace normalization; the two new CI logs are unchanged.
Original bytes remain in the ignored backup and every file retains its exact
non-whitespace hash. Biome formatted three JSON files with no fixes needed.
