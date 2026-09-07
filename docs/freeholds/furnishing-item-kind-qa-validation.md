# Furnishing item kind paired QA validation

QA verdict: **PASS**, 40 findings found and 40 resolved. All findings have independently
reviewed repairs and evidence at `d38663539433cbcd30642ea47d7663c5c52c59c0`.
The [fresh complete-fix review](reviews/furnishing-item-kind/qa/fresh-complete-fix-review.md)
returns source PASS for all 110 changed files and all four repair commits, with
zero open source/test findings. The [ledger](reviews/furnishing-item-kind/qa/findings-ledger.md)
records Q01-Q40. The shared gate completed with actual exit 0 and all 12 steps
green. Standalone i18n generation and clean generated-file status also passed.
The fresh reviewer independently reread the final verdict documentation and
returned PASS; the final completion checklist also returned PASS. There are zero
deferred review findings. `npm run ci:changed` after verdict commit `c881543258`
completed with actual exit 0 and a clean status. After committing this evidence
addendum, the coordinator will rerun the command against the true last commit
and report that exit without another repository edit.

The four repair commits are `ce0e25ec8593605d8f609074c4854fec56a811b2`,
`ff738f61a10822d807e44d26538bc1e1c01f7819`,
`a82e71f4cd86f74eded5909224fad5cc0108a8c6` and
`d38663539433cbcd30642ea47d7663c5c52c59c0`. An operating-system restart
interrupted earlier work after the second repair. The
[restart evidence index](reviews/furnishing-item-kind/qa/restart-evidence-index.md)
distinguishes historical proof from the completed replacement runs. Earlier
26-finding and 30-finding summaries and the revoked first source PASS are
historical checkpoints, superseded by the current 40-finding review.

The audit reviewed the furnishing implementation at
`16f2aeed2be022343291e18ede12cd042cae1fc6..c47e2cb24519be7df37e8664b9d2d61756e2ce4a`,
then integrated the required open dependency branch through
`041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`. The dependency merge took
`origin/feature/masterwrought` at `d3dcdaa4af`; PR #3872 was still open. The
[merge review](reviews/furnishing-item-kind/qa/merge-review.md) records the resolved
wire-test regression and retained storage/source-journal composition. Patches and
dependency files did not move, so a reinstall was not required.

The complete [review roster and original reports](reviews/furnishing-item-kind/qa/README.md)
are durable. The initial kind census is supplemented by a property/instance
census covering loaded power, uniqueness, Perfecting, presentation, custody and
host adapters. The [final census](reviews/furnishing-item-kind/qa/consumer-census-resumed-final.md)
classifies all 353 broader kind sites: 92 touched, 261 untouched by design and
zero MISSED. The literal requested scan retains all 1,569 matching rows.
Findings include runtime defects, missing regression controls and
documentation/commit-message nits.

## Scope and repaired behavior

Furnishings retain their saved copy identity and custody metadata while staying
outside equipment, consumable, enchant, set and Perfecting power. Shared UI
projections use authored furnishing names and rarity, preserve maker/lock facts,
and suppress forged progression fields. The complete tooltip retains the approved
placement values and describes the live party-trade deadline without an impossible
equip instruction. Real host and input tests cover shared refusals and their
eligible controls; restart tests preserve signer and recipe provenance through
every promised custody format.

D25 remains the mount eligibility rule for the Exchange. Ordinary bags remain
All-only, market filtering explicitly admits furnishing, and the rank stays
immediately after tool without changing existing relative order. No shipping
furnishing id, icon, model, texture or sound was produced in this audit.

The four approved housing keys and two furnishing labels retain their exact
English. The generic `hudChrome.itemTooltip.partyTradeWindowCustody` key describes
existing copy custody and adds no housing measurement or cost. Its contributor
exception requires the exact key and generated pending status together. No locale
overlay changed in the furnishing implementation range above or the audit repair
range `041fd790ce..d386635394`. The earlier foundation's five non-Latin overlay
additions remain on the stacked branch and are outside these furnishing ranges.

## Final source and resumed validation

The [exact resumed commands and outcomes](reviews/furnishing-item-kind/qa/resumed-validation-commands.md)
are retained with complete command logs. These current results supersede lost runs;
overlapping test counts must not be added together.

The archived `logs/*.log.txt` files have trailing ASCII whitespace and extra empty
EOF lines normalized; command, diagnostic and result content is unchanged. The
[archive disclosure and exact command](reviews/furnishing-item-kind/qa/README.md#reproduction-attachments)
record exit 0 for 48 verified logs, 28 normalized, with original bytes retained
under ignored `tmp/` and per-file SHA-256/non-whitespace equality proof. Historical
raw-log references designate complete command output, not byte-exact whitespace.

| Executed group | Completed outcome | Evidence |
|---|---|---|
| Required eleven furnishing suites plus bank, craft-from-vault, feast and localization neighbors | Exit 0; 15 files, 764 tests passed, 3 existing release-only localization skips | [Required matrix](reviews/furnishing-item-kind/qa/logs/required-resumed.log.txt) |
| Actual ClientWorld, GameServer and offline tool, commerce and feast routes with paired controls | Exit 0; 3 files, 24 tests passed on the final source seal | [Routes](reviews/furnishing-item-kind/qa/logs/routes-final.log.txt) |
| Feast admission and complete tooltip neighbors | Exit 0; 4 files, 88 tests passed | [Feast and tooltip](reviews/furnishing-item-kind/qa/logs/feast-parity-final.log.txt) |
| Legendary regalia, developer picker and standalone tool-effect card | Exit 0; 4 files, 40 tests passed | [Presentation](reviews/furnishing-item-kind/qa/logs/presentation-resumed.log.txt) |
| `npx tsc --noEmit` and explicit four-file Biome command after the final route repairs | Both exit 0 | [Typecheck](reviews/furnishing-item-kind/qa/logs/tsc-routes-final.log.txt), [Biome](reviews/furnishing-item-kind/qa/logs/routes-biome-final.log.txt) |
| Serial PostgreSQL differential suites with matching explicit database URLs | Exit 0; 2 files, 11 tests passed, zero skips | [Differential proof](reviews/furnishing-item-kind/qa/logs/pg-differential-final.log.txt) |
| Owning Eastbrook provenance remint, recursive delta check and capture/integrity suites | Remint and delta check exit 0; final suites exit 0, 2 files and 30 tests passed | [Remint](reviews/furnishing-item-kind/qa/logs/eastbrook-remint.log.txt), [Delta](reviews/furnishing-item-kind/qa/logs/eastbrook-delta-check.log.txt), [Tests](reviews/furnishing-item-kind/qa/logs/eastbrook-provenance-green.log.txt) |
| Comparable late browser captures with native mouse and touch | Both commands exit 0; 2 viewports, 8 surfaces each, zero assertion failures | [Visual record](../screenshots/furnishing-item-kind/qa/README.md) |
| `node scripts/gate_select.mjs` with the explicit environment below | Exit 0; all 12 steps green, 3,868 Vitest files and 58,083 tests passed, 42 browser files and 373 tests passed | [Actual result](reviews/furnishing-item-kind/qa/gate-final-resumed-result.json), [readable excerpts](reviews/furnishing-item-kind/qa/logs/gate-final-resumed-excerpt.log.txt), [full log](reviews/furnishing-item-kind/qa/logs/gate-final-resumed.log.txt) |
| `npm run i18n:gen`, immediately followed by `git status --porcelain` | Generator exit 0; no generated i18n path changed | [Generator](reviews/furnishing-item-kind/qa/logs/i18n-final-resumed.log.txt), [immediate status](reviews/furnishing-item-kind/qa/logs/status-after-final-i18n.txt) |
| `git diff --exit-code -- src/ui/i18n.resolved.generated src/admin/i18n.resolved.generated src/ui/i18n.catalog/translation_keys.generated.ts` and `node tmp/freeholds-02-audit/seal-reviewed-files.mjs` | Both exit 0 after browser-output cleanup; all 110 reviewed file bytes still match d386635394 | [Clean task-only status](reviews/furnishing-item-kind/qa/logs/status-after-gate-artifact-cleanup.txt), [source comparison](reviews/furnishing-item-kind/qa/logs/reviewed-source-seal.log.txt) |

The immediate post-generator status includes five known screenshot outputs
written by `tests/browser/intentional_gathering.browser.test.ts` and
`tests/browser/material_sources.browser.test.ts` during the shared browser gate.
The coordinator verified those writers and restored only those five files to
their clean pre-gate committed state. The second status contains only the
requested QA documentation/evidence. Neither status contains a generated i18n
change; the explicit output-root diff and repeated 110-file comparison both
completed with exit 0. These incidental browser outputs are not new art or
accepted furnishing screenshots.

The renderer admission repair invalidated an owning provenance leaf. The remint
updated only the current renderer and composite fingerprints across 50 provenance
blocks and four literal pin sites. The frozen capture-source fingerprint and old
image pixels are unchanged. The [delta checker](reviews/furnishing-item-kind/qa/attachments/check-provenance-delta.mjs.txt)
proves that bounded change. The initial one-failure/29-pass diagnostic remains
[archived](reviews/furnishing-item-kind/qa/logs/eastbrook-provenance-check.log.txt).
No asset was generated or replaced by this provenance repair.

The [coverage acceptance matrix](reviews/furnishing-item-kind/qa/test-coverage-resumed-final.md)
records 47 delivered claims, their decisive checks and final PASS. The complete
[host review](reviews/furnishing-item-kind/qa/cross-platform-sync-final.md) verifies
all routes, including the additional six tool cases, four commerce routes
and feast commands. Fishing shares the real `use` dispatch already exercised by
the consumer suite; independent valid legacy and tiered helper controls pin its
subsequent tool gates. It has no separate untested transport command.

## Historical scoped validation

Commands ran in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
Completed process exit codes were recorded by the coordinator. The results below
cover the first source repair. The later matrix below covers its named repairs;
neither matrix validates source changes made after that command ran.
Test counts overlap and must not be added together. Historical red runs and
misnamed intermediate logs are not accepted as passing evidence.

| Exact command | Completed outcome | Evidence |
|---|---|---|
| `npx tsc --noEmit` | Exit 0 on the first repair source and tests | [Typecheck](reviews/furnishing-item-kind/qa/logs/tsc-final.log.txt) |
| `npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts --maxWorkers=4` | Exit 0; 11 files, 477 tests passed | [Required scoped matrix](reviews/furnishing-item-kind/qa/logs/required-scoped-final.log.txt) |
| `npx vitest run tests/item_instance_view.test.ts tests/worn_item_cell_view.test.ts tests/bags_window_instance_marker.test.ts tests/bank_window_instance_marker.test.ts tests/guild_bank_window_instance_marker.test.ts tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/architecture.test.ts tests/monolith_budget.test.ts --maxWorkers=4` | Exit 0; 9 files, 412 tests passed | [Final cells and tooltip](reviews/furnishing-item-kind/qa/logs/cell-final.log.txt) |
| `npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_consumer_parity.test.ts --maxWorkers=3` | Exit 0; 2 files, 182 tests passed, including keyboard and cross-hotbar dispatch | [Final consumers](reviews/furnishing-item-kind/qa/logs/consumer-final.log.txt) |
| `npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_consumer_parity.test.ts tests/furnishing_equipment_power.test.ts tests/furnishing_perfecting_collection.test.ts tests/furnishing_persistence.test.ts tests/furnishing_material_source_journal.test.ts --maxWorkers=4` | Exit 0; 6 files, 207 tests passed | [Expanded furnishing matrix](reviews/furnishing-item-kind/qa/logs/furnishing-expanded.log.txt) |
| `npx vitest run tests/item_compare.test.ts tests/furnishing_tooltip_view.test.ts tests/mount_tooltip_view.test.ts --maxWorkers=3` | Exit 0; 3 files, 56 tests passed | [Display neighbors](reviews/furnishing-item-kind/qa/logs/display-green.log.txt) |
| `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/item_icons.test.ts tests/release_i18n_tier_coverage.test.ts tests/bank.test.ts tests/craft_from_vault.test.ts tests/professions_feast.test.ts --maxWorkers=4` | Exit 0; 7 files, 339 tests passed, 3 existing release-only cases skipped | [Localization and storage](reviews/furnishing-item-kind/qa/logs/i18n-storage-neighbors.log.txt) |
| `npx vitest run tests/furnishing_persistence.test.ts tests/furnishing_material_source_journal.test.ts --maxWorkers=2` | Exit 0; 2 files, 13 tests passed | [Custody and journal adapters](reviews/furnishing-item-kind/qa/logs/persistence-green.log.txt) |
| `npx tsc --noEmit -p /tmp/freeholds-02-audit/narrow-def-tsconfig.json` | Expected exit 1: broad `ItemDef` rejects a valid fishing-use shape with TS2322 and missing radius with TS2741 | [Negative compiler probe](reviews/furnishing-item-kind/qa/logs/narrow-def-tsc.log.txt) |
| `npx tsc --noEmit -p /tmp/freeholds-02-audit/narrow-def-valid-tsconfig.json` | Exit 0: independent broad-union furnishing control accepts radius zero and decor cost zero | [Positive compiler probe](reviews/furnishing-item-kind/qa/logs/narrow-def-valid.log.txt) |
| `node /tmp/freeholds-02-audit/check-ux-manifest.mjs` | Exit 0: all 557 unique approved rows reconstruct byte-identically, including all four owner-02 keys and nonnumeric owners | [UX inventory](reviews/furnishing-item-kind/qa/logs/ux-manifest.log.txt) |
| `npm run i18n:gen` | Historical exit 0 for the generic custody leaf; final standalone freshness is recorded above | [Generator](reviews/furnishing-item-kind/qa/logs/qa-i18n-first.log.txt) |
| `GATE_SELECT_BASE=origin/feature/masterwrought npm run ci:changed` | Historical exit 0 before the source fix commit; 146 files inspected | Coordinator record, `ci-precommit-final.log`; completed post-verdict proof follows below |
| `git diff --check` and `git diff --cached --check` | Exit 0 before the source fix commit | Coordinator process records |

The three inactive localization cases are the existing release-tier server/admin
copied-English and pending-catalog assertions. They were not executed and are not
reported as passing. No furnishing acceptance suite was skipped. Release-tier
locale completion remains enforced by its existing dedicated gate.

## Late repair validation

The coordinator reran the required furnishing matrix, the new property-consumer
regressions and their neighbors after the late repairs. The complete
[exact commands and outcomes](reviews/furnishing-item-kind/qa/late-validation-commands.md)
are retained alongside their raw logs. Counts overlap and must not be added.

| Executed group | Completed outcome | Evidence |
|---|---|---|
| Nine new furnishing suites for worn presentation, enchant picker, discovery, asset identity, Exchange, WorldMarket, Rift, auto-equip and feast | Exit 0; 9 files, 64 tests passed | [Late regressions](reviews/furnishing-item-kind/qa/logs/late-final-tests.log.txt) |
| Required furnishing matrix, using the same exact command recorded above | Exit 0; 11 files, 477 tests passed | [Required rerun](reviews/furnishing-item-kind/qa/logs/required-scoped-late-final.log.txt) |
| Existing icon, held-model, discovery, Reliquary, market and cap neighbors | Exit 0; 11 matched files, 611 tests passed | [Neighbors](reviews/furnishing-item-kind/qa/logs/late-neighbors.log.txt) |
| Furnishing event identity, collision handling and real server step-up suites | Exit 0; 4 files, 38 tests passed | [Event and authority checks](reviews/furnishing-item-kind/qa/logs/late-event-auth-green.log.txt) |
| Rift, auto-equip and feast regressions with existing policy/action neighbors | Exit 0; 7 files, 102 tests passed | [Power admission](reviews/furnishing-item-kind/qa/logs/late-power-green.log.txt) |
| `npx tsc --noEmit` | Exit 0 on the completed late repair checkpoint | [Typecheck](reviews/furnishing-item-kind/qa/logs/tsc-late-repaired.log.txt) |
| `npx tsc --noEmit` after regalia integration | Exit 0 at that checkpoint; superseded by the final route typecheck above | [Checkpoint source typecheck](reviews/furnishing-item-kind/qa/logs/tsc-sealed-final.log.txt) |
| Architecture selection after the renderer extraction | Historical output: exit 0, 3 files and 167 tests; exact argv was not retained, so this checkpoint is not final acceptance evidence | [Architecture result](reviews/furnishing-item-kind/qa/logs/seal-architecture-final.log.txt) |
| Explicit Biome check with safe fixes across 39 late code paths | Historical output: exit 0, 6 files safely fixed and 50 warnings reported; exact argv was not retained, so current explicit checks and the final gate supply acceptance evidence | [Biome result](reviews/furnishing-item-kind/qa/logs/late-explicit-biome-fixed.log.txt) |
| `npm run i18n:gen`, followed by `git status --porcelain` | Generator exit 0; no generated file appears in the resulting status | [Generator](reviews/furnishing-item-kind/qa/logs/i18n-late-final.log.txt), [status](reviews/furnishing-item-kind/qa/logs/status-after-late-i18n.txt) |

The neighbor command requested two paths that do not exist:
`tests/woc_market_stepup.test.ts` and `tests/item_set_tooltip_view.test.ts`.
Those paths did not execute. The actual server step-up suites ran in the separate
four-file command, and set-tooltip behavior ran in
`tests/furnishing_worn_presentation.test.ts`. The record retains the original
command and the actual matched-file count without crediting absent files.

The first explicit Biome pass found import-order errors and an unused
`DEV_ITEM_PICKER_LIMIT` import. The coordinator corrected them within Q39's
hygiene work; the finding total remains 40. The
[original diagnostic log](reviews/furnishing-item-kind/qa/logs/late-explicit-biome.log.txt)
and subsequent exit-0 log are both retained. The successful result is not
represented as warning-free. No unsafe suggested fix was applied.

The late [database](reviews/furnishing-item-kind/qa/database-late-finished.md)
review inspects the implemented projections and admission rules. The final
[persistence](reviews/furnishing-item-kind/qa/persistence-final-seal.md) and
[security](reviews/furnishing-item-kind/qa/security-final-seal.md) reviewers both
return PASS at `d386635394`, with zero open findings and unchanged server/simulation
production bytes since `ff738f61a1`. The independent security hashes are archived.
These source conclusions do not replace the executed shared gate.

## PostgreSQL integration

The following command completed with exit 0, 7 suites and 95 passing tests:

```sh
TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=1 npx vitest run tests/material_source_save_cost_pg_integration.test.ts tests/material_source_writer_pg_integration.test.ts tests/material_source_journal_pg_integration.test.ts tests/server/bank_ledger_growth_budget.pg.test.ts tests/server/material_source_connection.test.ts tests/server/character_material_sources_db.test.ts tests/material_source_storage_cost.test.ts --maxWorkers=2
```

[Executed output](reviews/furnishing-item-kind/qa/logs/merge-pg.log.txt) covers writer
compatibility, batched journals, source-save cost, locks, indexes and audit growth.
The database was this task's disposable PostgreSQL 16 resource on port 55432; the
shared database on 5433 was untouched. The URL contains disposable local test
credentials. The [finished database reviewer](reviews/furnishing-item-kind/qa/database-finished.md)
inspected these measurements and the subsequent pure projection/test repairs.
No furnishing SQL, stored field, queue, pool or background producer was added.

## Completed shared gate and historical attempts

The final gate was launched by `node tmp/freeholds-02-audit/run-final-gate.mjs`.
The archived runner executes this exact command/environment against source
`d38663539433cbcd30642ea47d7663c5c52c59c0`, tree
`29d8ef9b5dc37e81592c259ac4ff9d8e1778af6d`:

```sh
DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=0 GATE_SELECT_BASE=origin/feature/masterwrought GATE_MAX_WORKERS=4 node scripts/gate_select.mjs
```

The [actual result](reviews/furnishing-item-kind/qa/gate-final-resumed-result.json)
records exit 0, no termination signal, start `2026-09-07T13:04:35.325Z` and
completion `2026-09-07T13:27:57.885Z`. All 12 steps passed: owning i18n/wiki/SFX
generation, i18n freshness, SFX manifest generation, media manifest generation,
manifest trackedness and freshness, malware scan, changed-file Biome, full Vitest,
browser regressions, typechecks/server/environment/bot builds and client build.
The full Vitest result is 3,868 passed files and one skipped file; 58,083 tests
passed, two were expected failures and 28 were skipped. Browser regressions
passed all 42 files and 373 tests. The separate serial differential command
executes its 11 cases without skips; no skipped assertion is credited as passing.
The exact per-step argv and summaries are preserved in the readable excerpts
and complete archived log above.

The [reviewed source seal](reviews/furnishing-item-kind/qa/reviewed-source-seal.json)
and [completed byte comparison](reviews/furnishing-item-kind/qa/logs/reviewed-source-seal.log.txt)
verify all 110 reviewed file hashes against the committed source.

The first full shared gate completed with exit 1. Its exact command was:

```sh
TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=1 GATE_SELECT_BASE=origin/feature/masterwrought GATE_MAX_WORKERS=4 node scripts/gate_select.mjs
```

Vitest reported 3,850 passed files, 2 failed files and 1 skipped file;
57,984 tests passed, 2 were expected failures and 28 were skipped. The two failed
suites were `tests/server/client_perf_summary_sql.test.ts` and
`tests/server/deeds_board_sql.test.ts`. They read `DATABASE_URL`, which did not
match the disposable `TEST_DATABASE_URL`, and failed authentication for `vitest`.
The [failure excerpt](reviews/furnishing-item-kind/qa/logs/gate-first-failure-excerpt.log.txt)
preserves the errors and full summary. This attempt is not a passing shared gate,
and it does not validate source changes made after its starting snapshot.

A corrected two-worker PostgreSQL rerun still failed because the two suites'
shared-schema fixtures deadlocked. Its misleadingly named
[raw log](reviews/furnishing-item-kind/qa/logs/pg-differential-config-green.log.txt)
is retained as a failure. The coordinator then ran both suites serially with
matching database variables:

```sh
DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=1 npx vitest run tests/server/client_perf_summary_sql.test.ts tests/server/deeds_board_sql.test.ts --maxWorkers=1
```

That command completed with exit 0: 2 files and all 11 tests passed, with no skips.
The [serial result](reviews/furnishing-item-kind/qa/logs/pg-differential-serial-green.log.txt)
supplies historical differential proof; the resumed serial command above repeated
all 11 cases with exit 0. The completed final full gate ran against `d386635394`.
It kept both disposable database URLs explicit and left the optional
global-schema differential flag off, because those suites have their completed
serial proof. No required suite is being waived or represented as passing by
its skip predicate.

The shared gate, all repairs, independent source review, late visuals and final
standalone generator/status proof are complete. The fresh reviewer approved the
pre-verdict documentation, reread its two resolved wording nits and approved the
final verdict substitutions. The finishing checklist also returned PASS, including
250 local links across 52 Markdown files with zero missing targets. The
coordinator ran `npm run ci:changed` after the separate verdict commit; its actual
exit-0 record follows.

## Post-verdict commit check

```sh
GATE_SELECT_BASE=origin/feature/masterwrought npm run ci:changed
```

The first run at `bc598fb91e59d376836b12ffe6adef9da2b0ebd4` completed with
exit 1 for one archived `gate-final-resumed-result.json` command-array formatting
error. The formatter changed only that array's layout, with no JSON value
change. Fresh and checklist reviewers verified the repair before the amendment;
it remains Q37 evidence hygiene. The [failed result](reviews/furnishing-item-kind/qa/ci-verdict-first-result.json)
and [failed output](reviews/furnishing-item-kind/qa/logs/ci-verdict-first.log.txt)
are preserved as failures.

The rerun at `c881543258aac22448fe707813b4d25d0339e23a` completed with
actual exit 0 at `2026-09-07 13:41:20 UTC`: 186 files checked, no errors or
fixes, 211 warnings and seven infos disclosed. The [result](reviews/furnishing-item-kind/qa/ci-verdict-corrected-result.json),
[output](reviews/furnishing-item-kind/qa/logs/ci-verdict-corrected.log.txt) and
[empty status](reviews/furnishing-item-kind/qa/logs/status-after-verdict-corrected.txt)
establish that completed post-commit proof. Fresh and checklist reviewers both
approved this evidence-only addendum with PASS and zero open findings. After
committing it, the coordinator will repeat the same command after
the true last commit and report its actual exit without another repository edit.
The earlier revoked source review remains historical evidence and cannot replace
any of these completion requirements.

## Visual evidence and source identity

The [visual evidence record](../screenshots/furnishing-item-kind/qa/README.md)
preserves the accepted native desktop and mobile-landscape captures. The baseline
is merge `041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`; the first repair frozen source is
`b1d7e9627674845e4be17b4e7a5dd431800261ea`. That source commit's message was
amended to fix Q26, producing `ce0e25ec8593605d8f609074c4854fec56a811b2` without
changing its tree. Both commits resolve to tree
`7ad83845a4cf7f48631bbbf0cf152e07c11e18ab`.

Both initial accepted capture commands completed with exit 0. Each includes desktop and
mobile-landscape native gestures, exact content assertions and unclipped card
bounds. Rejected setup attempts are disclosed in the visual record. The late
Exchange, paperdoll and WorldMarket comparison also completed with exit 0 for
both source versions: 32 accepted PNGs per version cover eight surfaces in two
viewports, each with full and detail images. One notice-raced desktop frame per
version is retained explicitly as rejected; the native dismissal and successful
retry remain in each manifest. The frontend reviewer inspected all paired
surfaces and returned PASS. No generated asset obligation was waived or satisfied
by screenshots.

Named unsigned economy, legal, storefront, numerical, lifecycle, final-art and
runtime activation artifacts remain the release gates recorded in `state.md`.
They are not deferred review findings and this audit does not sign them.
