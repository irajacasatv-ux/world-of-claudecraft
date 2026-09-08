# Crafted content: current scope reconciliation and revalidation

Status: **implementation validation PASS**, 2026-09-07. The current shared gate
passed all twelve steps and the required content, coverage and documentation-fix
reviews passed. This is not a new paired QA PASS, production approval or owner
calibration signature. The final post-commit check must also exit 0; its receipt is
`tmp/freeholds-crafted-revalidation-2026-09-07/post-commit-ci.json`, with the actual
commit and outcome reported in the final task handoff.

## Authority and retained history

The current user implementation request explicitly preserves existing station
bindings, `evaluateCraftAdmission` and `resolveTrain`. It permits the existing
content to be completed through its acquisition seams. Those explicit protected
boundaries supersede the older QA instruction that no path under
`src/sim/professions/` may change. The living QA now checks every such diff against
the precise protected boundaries, the existing `isFreeholdCraftAvailable` seam and
the full acquisition/training/craft tests, including refusal conservation. No test
or gameplay rule is weakened by this documentation reconciliation.

F01 is prospectively resolved as an instruction-scope reconciliation under the
current request. This is neither a new owner signature nor a retrospective waiver
inferred from a passing test. The earlier paired QA correctly recorded **FAIL**
under its then-current whole-directory restriction. Its original
[findings](crafted-qa-2026-09-07/findings.md),
[validation](crafted-qa-2026-09-07/validation.md) and
[whole-fix review](crafted-qa-2026-09-07/reviews/qa-checklist-final.md) remain
historical evidence, including their F01 disposition. They are not rewritten as PASS.

The requested four content commits already exist: `86eb86bbe2`, `8bd097d898`,
`b3c2452b49`, `3666d89647`. Ten recipes/outputs, three 16-Mark patterns, final
thirteen icons/provenance and Hearth/name/wiki obligations are retained. This
resumption neither duplicates those commits nor regenerates accepted assets.

## Protected-boundary comparison

The coordinator extracted each complete named function declaration with the
TypeScript syntax parser and compared `86eb86bbe2^` against `7f4fe99619`.
Both declaration texts are byte-identical. The retained result is
[protected-functions.json](crafted-revalidation-2026-09-07/protected-functions.json); the comparison results are:

| Source | Declaration | Identical | SHA-256 of declaration text |
|---|---|---|---|
| `src/sim/professions/crafting.ts` | `evaluateCraftAdmission` | yes | `02084dd3b64fc40fc1f15bf18226964176f232ebd763829ca9402728772870c3` |
| `src/sim/professions/training.ts` | `resolveTrain` | yes | `ca7437959bbc99f2f155217bc25f8a8b0f9ffb5b420808ae83728567fc90bbd3` |

This comparison establishes declaration preservation. The acquisition, pattern,
trainer, station and economy suites establish behavior through the surrounding
callers; the declaration comparison alone is not a complete behavior proof.

## Release synchronization and current checks

PR #3872 is MERGED at `6111e6d206`. The latest fetched release was
`origin/release/v0.42.0`, integrated locally by `7f4fe99619`. No `patches/` path
changed. The obsolete dependency block was removed from state; historical OPEN
observations remain attached to their original dated snapshots. The current
[release-merge review](crafted-revalidation-2026-09-07/release-merge-audit.md) found no semantic regression; its regeneration and test follow-ups are included in the current shared gate.

Current `tests/reliquary_content.test.ts` pins full completion at 462 and character
completion at 433. The older 448/419 measurements remain original implementation
history. The exact Hearth page inventory remains `hearth_basics`, then
`hearth_first_crafts`; incoming catalog additions must not be removed to restore
an old total. The 55 teaching-item, 43 non-Crucible, 76 recipe and seven-family
channel contract is unchanged.

The coordinator supplied the following executions; the named test logs were also
inspected during this documentation update:

| Command | Current outcome | Evidence |
|---|---|---|
| `npx tsc --noEmit` | PASS, exit 0 | Coordinator execution receipt |
| `npx vitest run tests/freehold_content.test.ts tests/furnishing_pattern_items.test.ts tests/apex_pattern_channels.test.ts tests/apex_pattern_items.test.ts tests/farm_pattern_items.test.ts tests/recipe_pattern_items.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/professions_crafting_hub.test.ts tests/train_view.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/market_filters.test.ts tests/furnishing_item_kind.test.ts tests/architecture.test.ts` | PASS, 17 files / 721 tests | `tmp/freeholds-crafted-revalidation-2026-09-07/freeholds-content-scoped-tests.log` |
| `npm run wiki:content`, then `npx vitest run tests/guide.test.ts` | PASS, 149 tests; generator left no generated-source diff | `tmp/freeholds-crafted-revalidation-2026-09-07/freeholds-guide-tests.log`, coordinator generator receipt |
| `npm run i18n:gen`, then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts` | PASS, 68 tests; three expected release-tier skips; generator left no generated-source diff | `tmp/freeholds-crafted-revalidation-2026-09-07/freeholds-i18n-gen.log`, `tmp/freeholds-crafted-revalidation-2026-09-07/freeholds-i18n-tests.log` |
| `node scripts/gate_select.mjs` | PASS, exit 0, all 12 steps; 3994 unit files / 60090 passed tests, 2 expected failures, 35 skipped files / 547 skipped tests; 47 browser files / 389 passed tests | `tmp/freeholds-crafted-revalidation-2026-09-07/gate.log` and `gate-result.json` |
| Fresh required finishing reviews | Content and coverage PASS; QA found only this documentation reconciliation and pending execution evidence | [Content](crafted-revalidation-2026-09-07/content-review.md), [coverage](crafted-revalidation-2026-09-07/coverage-review.md), [QA](crafted-revalidation-2026-09-07/qa-review.md) |
| Fresh entire-fix review | PASS for documentation repairs: one stale-handoff finding resolved, zero open defects/nits; final execution receipt reviewed separately | [Whole-fix review](crafted-revalidation-2026-09-07/final-fix-review.md) |
| Fresh final closeout review | PASS / READY FOR COMMIT, zero open findings/nits; actual post-commit check remains required | [Final whole-repair review](crafted-revalidation-2026-09-07/closeout-review.md) |
| `npm run ci:changed` after the last authorized commit | Required final replay; outcome recorded with the actual commit in the task handoff and local receipt | `tmp/freeholds-crafted-revalidation-2026-09-07/post-commit-ci.json` |

The shared gate selected full mode against `origin/release/v0.42.0`; a scoped
PASS does not substitute for the shared gate, which independently exited 0. This run has neither
`TEST_DATABASE_URL` nor `WOCC_PG_DIFFERENTIAL` armed. It does not replace the
historical PostgreSQL evidence for the unchanged stored-data paths; no new database
shape or call-site work occurs in this resumption. The three scoped localization
skips are release-tier copied-English checks, not skipped furnishing behavior.
No PostgreSQL, physical-device or production-activation proof is inferred. The shared
browser suite includes the retained mobile/frame regressions. Its two refreshed
intentional-gathering screenshots were archived under the local evidence directory
and restored to their clean pre-run tracked bytes; no new visual asset ships in
this resumption. The final commit check is not pre-certified by this record.

## Unchanged approval boundaries and next task

The signed development calibration remains
`freehold-crafted-development-calibration-v1`, SHA-256
`c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`, with its
[existing acceptance](crafted-content-trial-2026-09-07/acceptance.md).
`productionApproved` remains false. Production numeric signatures, final crafted
GLBs, remeasured room/arrival/navigation and hardware LOW evidence retain their
later owners and activation gates. No push, PR merge or production enable is
authorized by this reconciliation.

After current implementation verification is complete, run the paired QA:
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-qa.md`.
Do not advance to implementation 05 before that QA is complete.
