# Shared-gate skip disclosure

Read-only clarification from current test/config sources and the initial completed gate log. No Vitest invocation, test collection or generator was run. The final run's observed summary still owns its actual counts; the table below statically reconciles the initial 28 skipped cases and predicts the same count for the final environment if it remains as documented.

## Wholly skipped suite

The single wholly skipped suite is `tests/ci_pg_presence.test.ts`. Its only case, at line 27, runs when `WOCC_EXPECT_PG=1` or `GITHUB_ACTIONS=true`. Neither sentinel is set by the documented local gate command. This is the CI environment-arming assertion that `TEST_DATABASE_URL` exists, not a PostgreSQL integration suite. Supplying `TEST_DATABASE_URL` directly arms the actual database suites independently of this optional local sentinel.

`tests/parity/rename_state_proof.test.ts` is not wholly skipped. Its opt-in rename-proof block is skipped, but its independent ungated self-check floor starts at line 311 and runs normally.

## Twenty-three existing non-differential skipped cases

| Category | Count | Source and reason |
| --- | --- | --- |
| Release-tier general localization | 3 | `tests/localization_coverage.test.ts:1468`, `:1553`, `:1586`; explicit quest narrative translations, representative quest-specific content, non-Latin Wyrm cleanup. Require `I18N_RELEASE_TIER=1`. |
| Release-tier emit/DICT localization | 3 | `tests/localization_fixes.test.ts:406`, `:409`, `:1737`; server/admin H3b copied-English checks and all-21-locale `s3_localized` recognition. Require `I18N_RELEASE_TIER=1`. |
| Release-tier pending registry/runtime | 2 | `tests/i18n_status_registry.test.ts:124` and `tests/i18n_t_behavior.test.ts:119`; pending set must be empty. Require `I18N_RELEASE_TIER=1`. Their ungated nonvacuity controls still run. |
| Release-tier Deed/Reliquary completeness | 2 | `tests/deed_i18n.test.ts:222` and `tests/reliquary_i18n.test.ts:391`; complete all 18 base locale tables/chunks. Require `I18N_RELEASE_TIER=1`. |
| Release-tier MediaWiki seed freshness | 1 | `tests/mediawiki_seed_freshness.test.ts:133`; requires its separate `MEDIAWIKI_SEED_RELEASE_TIER=1`. Other seed checks run. |
| Artifact-backed HUD performance tour | 4 | `tests/hud_perf_budget.test.ts:3097`; `HUD_PERF_BUDGET_TOUR=1` enables frame count, long frames, DOM elision and FCT-pool checks against a real tour artifact. Other HUD performance arms run. No new GPU producer requires this opt-in tour for the current repair. |
| Server wall-clock performance measurements | 2 | `tests/server/perf_gate.test.ts:367`; `PERF_GATE_WALLCLOCK=1` enables request added-p99 and world-loop tick-p95 timing. Its deterministic operation-budget arms run. |
| Exported staging reset rehearsal | 1 | `tests/mastery_reset_rehearsal.test.ts:367`; requires `RESET_REHEARSAL_INPUT`. Built-in corpus rehearsal cases run. |
| Operator rename-only state proof | 1 | `tests/parity/rename_state_proof.test.ts:230`; requires `RENAME_PROOF=1`. Default base is HEAD, no worktree golden changes and no section are supplied, so only its at-least-one-reminted-golden proof case is registered in the skipped block. Ungated self-checks run. No rename/golden rewrite is part of this repair. |
| Historical custom-map editor reshape expectation | 1 | `tests/custom_map_parity.test.ts:193`; explicit pre-existing skip documents that painted biome recolors rather than reshapes current grid terrain. Other custom-map parity checks run. This is disclosed existing debt outside crafted-content acceptance. |
| Superseded Armoury optimization stages | 2 | `tests/render_glb_replacement_assets.test.ts:635` and `:645`; temporary raw/optimized-stage GLB checks are skipped when the final pipeline is enabled. The actual optimizer spec selects `eastbrook_grand_armoury-final.glb`, so this condition is true. The unconditional final-source/shipped-contract test remains active. |
| CI PG-presence sentinel | 1 | `tests/ci_pg_presence.test.ts:27`, described above. The only wholly skipped file. |

Total: 23 cases. The four optional existence-gated cases in `tests/asset_pipeline.test.ts` do not add skips here: the referenced sword, fox and barrel shipping GLBs all exist in this worktree.

## Five SQL differential cases

- `tests/server/client_perf_summary_sql.test.ts:506`: two cases.
- `tests/server/deeds_board_sql.test.ts:342`: three cases.

The initial attempt set `WOCC_PG_DIFFERENTIAL=1`, so those suites attempted setup. The raw gate log reports two and three skipped cases respectively because their beforeAll setup failed on the incorrect default database connection. They are not five successful initial checks. These two suites account for the initial two failed suites and five of the 28 skipped cases; the other 23 are the static categories above.

The final documented shared command intentionally unsets `WOCC_PG_DIFFERENTIAL` and `DATABASE_URL`, leaving `TEST_DATABASE_URL` armed. Its five differential cases are therefore deliberately skipped by `describe.skipIf(!PG_ON)`. All five already ran successfully in the separate PG16 differential invocation, included in its three-file/57-test passing result. All `TEST_DATABASE_URL` integration suites remain armed in the final full run.

The initial skipped count thus reconciles exactly as **23 existing optional/historical cases + 5 SQL differential cases blocked by failed setup = 28**. For the final documented environment it should instead be **23 existing optional/historical cases + 5 separately-passed opt-in SQL cases = 28**, subject to the final actual summary. No skipped furnishing acceptance suite or furnishing behavior case appears in this reconciliation. The two expected-failure tests are a separate Vitest category and must not be added to skipped counts.
