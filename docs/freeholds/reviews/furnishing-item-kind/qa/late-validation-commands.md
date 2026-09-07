# Exact late validation commands

This checkpoint predates the final Q38-Q40 repairs and complete source seal.
It is scoped execution evidence, not a final QA verdict.

All commands run from /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds. Counts are per command and overlap.

```sh
npx vitest run tests/furnishing_worn_presentation.test.ts tests/furnishing_enchant_picker.test.ts tests/furnishing_discovery.test.ts tests/furnishing_asset_identity.test.ts tests/furnishing_exchange_identity.test.ts tests/furnishing_market_identity.test.ts tests/furnishing_rift_admission.test.ts tests/furnishing_auto_equip.test.ts tests/furnishing_feast_admission.test.ts --maxWorkers=4
```
Exit 0; 9 files, 64 passed. Log: [late-final-tests.log](logs/late-final-tests.log.txt).

```sh
npx vitest run tests/furnishing_item_kind.test.ts tests/furnishing_tooltip_view.test.ts tests/market_filters.test.ts tests/item_name_color.test.ts tests/recipe_pattern_items.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts --maxWorkers=4
```
Exit 0; 11 files, 477 passed. Log: [required-scoped-late-final.log](logs/required-scoped-late-final.log.txt).

```sh
npx vitest run tests/weapon_icons.test.ts tests/held_weapon_models.test.ts tests/item_icons.test.ts tests/deeds.test.ts tests/reliquary_state.test.ts tests/woc_market_view.test.ts tests/woc_market_rules.test.ts tests/woc_market_stepup.test.ts tests/market.test.ts tests/market_view.test.ts tests/market_sale_log.test.ts tests/masterwrought_cap_view.test.ts tests/item_set_tooltip_view.test.ts --maxWorkers=4
```
Exit 0; 11 existing matched files, 611 passed. Log: [late-neighbors.log](logs/late-neighbors.log.txt). The requested tests/woc_market_stepup.test.ts and tests/item_set_tooltip_view.test.ts paths do not exist and did not execute; the real step-up suites are covered by the next command, and set tooltip behavior is in furnishing_worn_presentation.

```sh
npx vitest run tests/furnishing_event_identity.test.ts tests/sim_i18n_name_collisions.test.ts tests/server/woc_market_stepup.test.ts tests/server/woc_market_stepup_flow.test.ts --maxWorkers=3
```
Exit 0; 4 files, 38 passed. Log: [late-event-auth-green.log](logs/late-event-auth-green.log.txt).

```sh
npx vitest run tests/furnishing_rift_admission.test.ts tests/furnishing_auto_equip.test.ts tests/furnishing_feast_admission.test.ts tests/rift_progression.test.ts tests/rift_forge_gate.test.ts tests/auto_equip_gate.test.ts tests/professions_feast.test.ts --maxWorkers=3
```
Exit 0; 7 files, 102 passed. Log: [late-power-green.log](logs/late-power-green.log.txt).

```sh
DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa TEST_DATABASE_URL=postgres://freeholds_qa:local_qa_only@127.0.0.1:55432/freeholds_qa WOCC_PG_DIFFERENTIAL=1 npx vitest run tests/server/client_perf_summary_sql.test.ts tests/server/deeds_board_sql.test.ts --maxWorkers=1
```
Exit 0; 2 files, 11 passed with no skips. Log: [pg-differential-serial-green.log](logs/pg-differential-serial-green.log.txt). The preceding maxWorkers=2 attempt failed from concurrent schema/fixture locks; the initial full run lacked matching DATABASE_URL and failed authentication. Neither failure is counted as passing.

```sh
npx tsc --noEmit
```
Exit 0. Log: [tsc-late-repaired.log](logs/tsc-late-repaired.log.txt).

```sh
npm run i18n:gen
git status --porcelain
```
Generator exit 0; no generated artifact appears in status-after-late-i18n.txt. Log: [i18n-late-final.log](logs/i18n-late-final.log.txt).
