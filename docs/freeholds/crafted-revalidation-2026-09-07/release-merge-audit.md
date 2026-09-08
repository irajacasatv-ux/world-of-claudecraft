# Freeholds release merge audit

Verdict: **CLEAN WITH FOLLOW-UP**. Read-only inspection found no merge-induced regression in the reviewed production paths. Canonical regeneration and execution checks remain with the parent; this report does not claim those checks passed.

## Merge identity and scope

- Audited merge: `7f4fe9961994cdb84f8077d276e9f4050f644cf6`.
- First parent, pre-merge `feature/freeholds`: `4ab837d475299eda117dd1186238cb9e75f46ca2`.
- Second parent, `origin/release/v0.42.0`: `6111e6d2066d77505d27b8fba8a9aaaa9da01982`.
- Common base: `54ce808436ce53a562175a21311dd45c7f409a9f`.
- First-parent history changed 1,265 files from the common base; the incoming release changed 60. These are historical scope counts for this merge, not maintained inventory claims.
- Exactly 34 paths overlap: `src/render/characters/manifest.ts`, `src/ui/hud.ts`, `src/ui/i18n.catalog/hud_chrome.ts`, `src/ui/i18n.catalog/translation_keys.generated.ts`, the five changed non-Latin locale overlays, the 23 changed resolved locale slices plus `pending.ts`, and `tests/hud_update_drive.test.ts`.
- Git tree-object comparison found no changes to branch-only files relative to the first parent, no changes to release-only files relative to the second parent, and no unexpected paths outside the two arms' combined changes.

## Verified preservation

**HUD composition.** Comparing `src/ui/hud.ts` against both parents shows that freehold furnishing tooltips still dispatch through `furnishingItemTooltip`; recipe-pattern tooltip and trainer availability still receive `freeholdsEnabled`; the quartermaster still uses `buildHeroicVendorViewForWorld`; and open crafting refresh still uses `craftingWindowRefreshSig`, including the cached vault-stock read during rendering. The release's `frameRowLabelKey` callback and spec-change-gated `interfaceUnlock.relocalize()` remain connected to `MovableFrame` and the shared interface registry. These changes affect separate production paths. No older upstream variant replaced the branch-owned helpers.

**HUD drive registry.** `tests/hud_update_drive.test.ts` retains the branch's `craftingWindowRefreshSig` invalidation proof and the release's `this.interfaceUnlock.relocalize` row, gated by spec change plus unlocked state. The merged expected split is 48 window, 88 chrome, 17 none; these are a current merge assertion, not an independently executed result. No branch row was removed in the second-parent comparison.

**Character manifest.** The first-parent furnishing guard in `itemModelKey` remains intact: furnishing records cannot inherit a held model through `heroicOf`. The release adds `authoredAtlas`, `AUTHORED_HELD_MODELS`, authored URL detection, and atlas flags without changing that guard. The authored-surface consumers and tests are release-only paths and are byte-identical to the release parent. `tests/furnishing_asset_identity.test.ts` exercises real manifest resolution with a furnishing carrying an injected weapon ancestry and an eligible weapon control, so this preservation has a decisive existing regression check.

**Canonical English and locale state.** `hud_chrome.ts` retains the housing tooltip fields, furnishing trade-custody text, and Hearth navigation key from the branch. It also retains the release's mechanic-name reconciliation, removal of the obsolete doom-meter row, and new frost proc label. The five overlay changes and generated translation-key union changes exactly match the release arm's added/deleted lines.

A read-only JSON inspection flattened every changed generated locale slice from all four trees, calculated each leaf's expected three-way result, and compared that expectation with the merged slice. All 23 slices have zero conflicting leaf edits and zero incorrect merged leaves. The merged slices each contain 13,354 leaves. A separate per-locale set comparison of `pending.ts` found zero discrepancies between the merged lists and the two arms' combined additions/removals. This establishes preservation of committed data; it is not a substitute for regenerating from the canonical source catalog.

## Findings and limits

- Verified regressions: none.
- Confirmed omitted branch or release changes: none.
- No server, persistence, wire, or simulation files were changed by this incoming release relative to the first parent. Their existing feature changes survive unchanged; they were not re-audited as a new implementation here.
- Planning-document freshness is owned by the separate context audit and is not assessed in this report.
- Worktree status was clean on entry. At the final status read, `docs/freeholds/state.md` was modified by concurrent parent work; this audit did not modify it or any repository file.
- No tests, builds, generators, commits, staging, or remote mutations were run. The only written artifact is this report.

## Recommended parent checks

1. Run `npm run i18n:gen` and inspect freshness of the merged generated files. A second run must leave generated output unchanged. This is the remaining canonical-source proof that leaf comparison alone cannot provide.
2. Include `tests/hud_update_drive.test.ts`, `tests/interface_unlock_core.test.ts`, `tests/movable_frame.test.ts`, and `tests/proc_overlay_view.test.ts` in the parent-owned validation. Include `tests/browser/gathering_goal_frame.browser.test.ts` in the real-browser run to exercise the imported frame integration.
3. Include `tests/furnishing_asset_identity.test.ts`, `tests/authored_surfaces.test.ts`, `tests/tinted_material.test.ts`, and `tests/visual_manifest.test.ts` for the manifest/material boundary; include `tests/freehold_crafted_presentation.test.ts`, `tests/crafting_view.test.ts`, and `tests/recipe_pattern_tooltip_view.test.ts` for the retained freehold HUD helpers.
4. Complete the canonical `node scripts/gate_select.mjs` contribution gate, or the deeper `npm run gate`, and assess any failures against the correct parent before attributing them to this merge.

No remediation is recommended before those checks: there is no confirmed merge defect to fix.
