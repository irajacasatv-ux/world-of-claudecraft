# Crafted furnishings implementation validation

Development implementation passes. Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch `feature/freeholds`, baseline `49ed3f09333f4f1293edda9a98fe590c5651c20e`. The accepted development calibration remains bound to `acceptance.md` and the original calibration SHA256. Production activation, final GLBs, placement, room/navigation and hardware LOW approval remain separate unsigned gates.

## Shared contribution gate

```sh
GATE_SELECT_BASE=49ed3f09333f4f1293edda9a98fe590c5651c20e node scripts/gate_select.mjs
```

Exit 0, all 12 steps green. The planner selected the full suite. Unit run: 3,860 files passed, 34 existing conditional files skipped; 57,858 tests passed, 2 expected failures, 541 conditional skips. Browser run: 43 files and 376 tests passed. Generated i18n/wiki/media/SFX freshness, SFX conformance, malware gate, typechecks and environment/server/bot/client builds all passed. Log: `/tmp/freeholds-crafted-gate-final.log`. No required changed-surface suite was waived. No PostgreSQL execution was required: bounded serializer growth was measured without SQL, schema or query changes.

The first full run exposed 39 failures across 21 suites. Every failure was repaired and independently re-reviewed before the successful run. These were explicit catalog inventories, fixture opt-in, source-boundary/refresh pins, page-name fills and byte attribution; no assertion was replaced with a permissive floor and no historical art or size baseline was discarded.

## Requested and focused validation

```sh
npx vitest run tests/freehold_content.test.ts tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts tests/furnishing_item_kind.test.ts tests/architecture.test.ts tests/furnishing_recipes.test.ts tests/furnishing_crafting.test.ts tests/freehold_crafted_availability.test.ts tests/freehold_crafted_presentation.test.ts tests/heroic_vendor.test.ts tests/professions_training.test.ts tests/monolith_budget.test.ts tests/guide.test.ts tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/train_window_hud.test.ts
```

The initial expanded scoped run passed all 28 files: 1,089 tests passed and three existing release-only localization tests were skipped on this development branch. Subsequent fixes are included in the successful full gate above.

- `npx tsc --noEmit`: exit 0, including the final standalone check in `/tmp/freeholds-crafted-types-final.log`.
- `npm run wiki:content` and `npm run i18n:gen`: exit 0; guide and localization suites passed, then shared freshness passed. Generated files were staged for the repository's index-based freshness checks without making an early commit.
- `UPDATE_SHIPPED_ITEMS=1 npx vitest run tests/shipped_item_ids.test.ts`: exit 0; golden diff inspected as exactly thirteen additions and zero deletions.
- `node scripts/item_art_audit.mjs --verify-only`: exit 0. Current measured receipt is `../crafted-content-art-2026-09-07/catalog-verification.json`; dated visual verdicts remain sealed.
- `npx vitest run tests/professions_blob_growth.test.ts`: eleven tests passed. Real serializer fixed points are 19,161 professions bytes and 211,458 complete-character bytes. Exact additions are 324 knowledge, 355 discoveries and 576 Reliquary bytes. Removing this cohort reproduces the prior 210,203-byte character. The 20,480-byte professions ceiling and 229,376-byte server warning are unchanged; the warning is not a save cap.
- Same-seed ordinary and Jack command replay compares complete events, serialized state and subsequent real RNG draws; exact draw counts and dark-host zero-draw refusals pass.
- Actual ClientWorld hello/reconnect and HUD refresh tests pass in both capability-change directions with unchanged bags, vault, position and recipe knowledge; they require one repaint and no repeated repaint.
- Dark recipe-cache append/remove regressions preserve the catalog's supported length-change contract and stable array identity between changes.
- Explicit changed/untracked Biome check over 137 paths: exit 0. Existing warnings are unchanged; eight exact formatter-only exceptions preserve hash-linked evidence bytes without disabling lint.
- `git diff --check`: exit 0. Added-code scans found no forbidden new vocabulary or forbidden workflow term. Protected-material scan of `src/sim/content/freehold/` returned no matches; decisive firewall tests cover every forbidden craft and positive consumable-craft controls.

## Art and runtime acceptance

All thirteen final painted icons pass admission tests for literal IDs, source lineage, byte hashes, opaque 128px WebP metadata and seven review-sheet hashes. Source v2 is sealed at SHA256 `c9e46f0c5752513c11a0245800c02df872c57292a033eeabc4d940a5fc86875f`; the earlier source record remains unchanged. Total shipping size is 33,156 bytes.

The final runtime manifest is `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/manifest.json`, SHA256 `09ab384da4112f60b75cf8ebff986451dad6fda709fef158dda160713c653832`, 143,845 bytes. All 42 retained image hashes were verified; no page errors or unloaded images were reported. Independent visual review inspected every retained capture: sixteen desktop game captures, twenty-two mobile captures, two guide catalog captures and two guide catalog-prose captures.

Actual Quartermaster purchases consume 48 Marks for three patterns on both desktop and touch. Bags/bank show all thirteen icons; tooltip and unsent mail previews show long pattern names; trainer sample captures cover affordable, skill-locked and insufficient-copper states. Six Hearth locales render their actual translated content. Furnishings and patterns cannot occupy equipment or action slots. Portrait gameplay displays the existing orientation curtain; portrait guide content remains readable.

This is software-rendered browser emulation, not physical-device or hardware LOW profiling. Ten outputs were directly granted only for presentation inspection; real recipe acquisition/crafting is covered by simulation tests. Earlier capture attempts and the obscured mobile set were rejected. The corrected harness uses the actual Options locale switch, normal scrolling/window focus, the canonical performance-notice dismissal helper, and a hidden-notices assertion. Reproduction scripts and configuration are retained beside the manifest. No mail was sent.

## Review and completion boundary

Content obligations, coverage, QA checklist, authority, sim architecture, cross-platform parity, frontend, database performance and persistence reviews completed. All findings, including nits, were fixed; a distinct reviewer inspected the complete fix round twice, including every full-suite failure. Reports are retained under `reviews/implementation-*.md`.

Current-build flag disabling preserves items, recipe knowledge and collection progress. An older binary lacking these catalogs can discard unknown discovery/Reliquary progress while preserving dormant item copies and recipe strings; lossless old-binary rollback is not claimed.

Four user-authorized scoped commits package the reviewed contribution. The post-commit `npm run ci:changed` check exited 0, checked 1,967 files and applied no fixes; existing warnings remain. The final documentation receipt is folded into the fourth commit, and the same check is repeated after that final commit. Commit IDs are reported by the coordinator. No push or merge was performed. The separate paired QA packet remains the next handoff.

The browser gate rewrote five pre-existing intentional-gathering screenshots. Their previously clean tracked bytes were restored after verification; generated copies remain under `tmp/freehold-gate-unrelated-captures/`. They are excluded from this contribution.
