# Freeholds content implementation evidence, 2026-09-07

## Status and scope

**PARTIAL/BLOCKED, local. Full feature acceptance is NOT READY.**

Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
Branch: `feature/freeholds`. Task base: `3fa4965a3c186982aafd44b3ec9b9d9851ace52d`.
The worktree was clean at intake. Fetch and the requested dependency integration
found `origin/feature/masterwrought` already incorporated. The user authorized
incremental local commits after review closure; the checkpoint below records
the completed chunks. No push or PR merge has been made.

The approved tier/Charter/eligibility tables, two manual deed records and rewards,
painted deed crests, localization, guide outputs and empty-safe Hearth consumer
support are implemented. There are no furnishing ItemDefs, furnisher NPC, stock,
spawn, operational weekly bills, or published Hearth pages. This is intentional
source gating, not completion of those requested deliverables.

The [source freeze](content-source-freeze-2026-09-07.md) records exact approval
provenance, missing numeric rows and producer/approver ownership. CAL-LEDGER-A,
CAL-VENDOR-A, CAL-DECOR-A/B and MEASURE-SPACE remain unsigned. A question requesting
a newer approved artifact was sent; no answer has supplied one. Staged icon art
does not supply numeric approval or model measurements.

Final production signatures alone do not block content QA PASS. The immediate
gap is complete reference-derived trial records and their measured geometry
basis. The workbook permits visibly identified trials while production remains
disabled; later owners retain calibration and activation acceptance. See
[the completion checklist](content-completion-checklist-2026-09-07.md).

## Files and behavior

- `src/sim/content/freehold/{tiers.ts,charters.ts,ledger_schedule.ts,index.ts,CLAUDE.md}`:
  deeply frozen approved Inn Room/Cottage targets, shared-reference tier lookup,
  runtime immutable ID set, the price-free Cottage Charter, eighteen exact material
  alternatives and the explicit pending schedule with `schedule: null`.
- `src/sim/content/{deeds.ts,reliquary.ts}`: two manual progression deeds appended
  at the true tail, each 5 Renown. Homesteader grants its title; Householder grants
  the home border. No gameplay raise site exists. Homesteader joins the existing
  Horizons title page. Hearth is declared but has zero published pages.
- `src/ui/{reliquary_view.ts,reliquary_window.ts,deed_border_view.ts,deed_image_ids.ts}`:
  shelf consumers hide unauthored shelves and resolve an empty Hearth deep link
  to Overview; shared DOM/canvas heraldry adds the copper home motif; generated
  crest IDs match the two shipping WebPs.
- Guide/i18n sources and generated outputs: `src/guide/pages/reliquary.ts`,
  `scripts/wiki/build_content.mjs`, `scripts/i18n_glossary.json`, English guide/HUD
  keys, five required non-Latin HUD and deed locale fills, generated guide,
  translation-key union and resolved locale files. Ignored i18n status outputs are
  regenerated locally, not force-added.
- `public/ui/deeds/homesteader_first_{furnishing,cottage}.webp`, `CREDITS.md`,
  [accepted deed art](content-art-2026-09-07/deeds.accepted-art.json),
  [staged furnishing art](content-art-2026-09-07/staged-art.json), size sheets,
  [name review](content-name-review-2026-09-07.md), source/readiness and this evidence.
- New behavior tests: `freehold_content`, `freehold_deed_records`,
  `guide_reliquary_hearth`, `reliquary_hearth_shelf` and
  `reliquary_hearth_window`; existing content, art, i18n, UI, source-firewall and
  profile tests updated with literal pins and negative assertions. The real-window
  positive Hearth test uses explicitly synthetic content, not a shipping page.
- `tests/professions_blob_growth.test.ts`: attributes the exact 44 + 41 = 85 bytes
  added by earning both new deeds in the maximal fixture. The 209474-byte historical
  counterfactual, Field Kit +12 proof and all old content equations remain intact.
  Current fixture is 209571 bytes. Both narrow tracking edges shift by 85, retaining
  width 381; warning threshold remains 229376 with 19805 bytes of headroom.
- Four inherited import-order repairs only:
  `tests/woc_market_{bond,directed,realm_scope,settlement}_pg_integration.test.ts`.
  The integration-base gate required these; no query or test behavior changed.
- `.github/workflows/ci.yml` and `tests/ci_workflow.test.ts`: retain the new
  referenced screenshot subtree in all five existing sparse test-job checkouts.
  The exact literal cone and computed bidirectional reference equality stay intact.
  No permission, action, command, shard, selection or exit behavior changes.
- `docs/freeholds/{progress.md,state.md}` record the partial inventory, named
  unsigned gates, zero Hearth pages, future owners and carry-forward lessons.

Current literal inventories: 301 deeds, 3535 Renown, 47 titles, 5 borders;
41 Reliquary pages, 466 raw slots, 430 full-completion slots and 401
character-completion slots; 290 painted deed crests with the existing 11 pending.
Historical release-art inventories remain sealed separately from these live pins.

## Coordinator validation

Commands run from the worktree above. Every completed result below has an observed
process exit code. Existing skipped tests are disclosed rather than counted as
passed. Reviewer reports do not substitute for these commands.

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS, exit 0; baseline and current implementation |
| `npx vitest run tests/freehold_content.test.ts tests/furnishing_item_kind.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/market_filters.test.ts tests/architecture.test.ts tests/storage_charters.test.ts tests/server/freehold_wire.test.ts` | PASS, exit 0; 12 files, 666 tests |
| `npm run wiki:content` | PASS, exit 0; generated 286 public deeds and 37 public Reliquary pages |
| `npx vitest run tests/guide.test.ts tests/guide_reliquary_hearth.test.ts` | PASS, exit 0; 2 files, 151 tests |
| `npm run i18n:gen` | PASS, exit 0 |
| `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts` | PASS, exit 0; 2 files, 68 passed, 3 existing skips |
| `npx vitest run tests/deed_icons.test.ts tests/freehold_deed_records.test.ts tests/reliquary_hearth_shelf.test.ts tests/deed_border_accent.test.ts tests/nameplate_heraldry_core.test.ts tests/reliquary_view.test.ts tests/reliquary_window_behavior.test.ts tests/deeds_view.test.ts tests/deed_i18n.test.ts tests/reliquary_cell_art.test.ts --maxWorkers=2` | PASS, exit 0; 10 files, 509 passed, 1 existing skip |
| `npx vitest run tests/deed_icons.test.ts tests/freehold_deed_records.test.ts tests/reliquary_hearth_window.test.ts --maxWorkers=2` | PASS, exit 0; 3 files, 22 tests after review fixes |
| `npx vitest run tests/professions_blob_growth.test.ts` | PASS, exit 0; 11 tests after exact byte attribution |
| `npx vitest run tests/guide_key_coverage.test.ts tests/missing_painted_icons_wave.test.ts tests/nameplate_canvas.test.ts tests/profile_page.test.ts tests/release_art_audit_v036_reliquary_deeds.test.ts` | PASS, exit 0; 5 files, 81 tests after full-suite pin repairs |
| `npx vitest run tests/ci_workflow.test.ts` | PASS, exit 0; 27 tests after retaining the referenced screenshot subtree |
| `git diff --check HEAD` | PASS, exit 0 |
| `npm run ci:changed` | PASS, exit 0 after final evidence retention; the post-checkpoint repeat is recorded separately in task completion |
| New-code vocabulary scan and protected-ID search in `src/sim/content/freehold/` | No matches; search exit 1 is the expected empty result |
| `node scripts/convert_deed_icons_webp.mjs tmp/imagegen/freehold-deeds-2026-09-07/masters` | PASS, exit 0; two crests converted; prior 11 pending unchanged |
| Scoped Biome checks on new files, modified metadata and every fix file | PASS, exit 0; inherited warnings disclosed in logs; new content and metadata clean |
| `node scripts/gate_select.mjs` | PASS, exit 0; all 12 steps green. Full Vitest: 3843 files passed, 34 skipped; 57665 tests passed, 2 expected failures, 541 skipped. Browser: 42 files, 373 tests passed. Typechecks and env/server/bot/client builds passed. |

The exact requested suite first exposed two failing cosmetic-inventory tests:
the unique-title count and border ID/slug expectations needed their new literals.
They were repaired and the entire requested command rerun. The first shared gate
stopped on four inherited Biome import-order errors. Its next run passed generators,
freshness, trackedness, malware scan and Biome, then ran all 3876 test files and
found six failures: five stale live-catalog/heading/geometry pins and the byte
attribution above. That run ended with 3836 files passed, 6 failed, 34 skipped;
57656 tests passed, 6 failed, 2 expected failures and 541 skipped. All six failing
files now pass their focused reruns. The next full run included the new positive
window suite and passed every content test, but found the new referenced screenshot
subtree missing from CI's exact sparse-checkout cone. It ended with 3842 files and
57664 tests passed, one CI parity failure, 34 skipped files, 2 expected failures
and 541 skipped tests. The five existing includes and their literal pin now match;
all 27 CI workflow tests pass. The fresh canonical gate after that repair exited 0,
with all 12 steps green. It used `origin/release/v0.42.0` as integration base and
the full 3877-file fallback with eight workers. No test-selection override was used.

Final gate evidence is `/tmp/freehold-gate-complete.log`. Artifact generation,
freshness/trackedness, SFX checks, malware scan and changed-file Biome passed.
Malware scan recorded 8316 files, 441 flags and zero high after catalog priors.
Full Vitest recorded 57665 passed, 2 expected failures and 541 skipped tests across
3843 passed/34 skipped files. Browser regression ran 42 files and passed all 373
tests. The typecheck/env/server/bot group completed all five tasks, and client
build completed all three tasks. Existing skips are neither new skips nor counted
as passed. No requested scoped suite was skipped.

A `guide.*` key with a real consumer but no currently authored data is explicitly
listed as live off-sweep, with its real synthetic render test identified. This
does not retire the Hearth heading or claim that a real Hearth page exists.

The coordinator runs `npm run ci:changed` after the final local checkpoint commit
and reports its observed exit code in task completion. The earlier current-diff
run remains separately identified above. No PostgreSQL runtime or SFX behavior
changed; the database reviewer requires no additional disposable PostgreSQL
experiment for the exact test-only size repair.

The browser gate rewrote four unrelated tracked screenshots through
`tests/browser/intentional_gathering.browser.test.ts`. Their generated bytes are
preserved under ignored `tmp/freehold-gate-generated-screenshots`; only those
command-owned outputs were restored to their unchanged index bytes. They are not
part of this task's diff. The original Documents checkout remains clean.

The attempt `npx biome format --write docs/screenshots/freehold-content-2026-09-07`
exited 1 because Biome intentionally ignores screenshot trees and processed zero
files. Screenshot JSON is emitted with two-space indentation, parsed during
retention, and independently verified against all retained PNG hashes/dimensions;
that excluded formatter invocation is not presented as a passing check.

## Visual evidence

Current desktop and mobile landscape captures show both crests, the Homesteader
title, Householder picker and shared previews, Horizons titles and the three
authored Overview shelves. Additional captures show real keyboard selection,
forced colors, the worn player portrait and world nameplate, and empty Hearth
deep-link fallback. These are local offline fixture grants by the harness, not
evidence of gameplay earning paths.

The fresh 390x844 mobile portrait capture shows the existing landscape-only
orientation guard. It is evidence of that supported policy, not an accepted
portrait gameplay layout. An earlier desktop-to-mobile transition produced cropped
captures; they are retained locally as failed evidence and excluded from the
accepted set. The initial combined capture also stopped on a mobile navigation
context loss; the corrected fresh mobile capture completed independently.

The [portable runtime manifest](../screenshots/freehold-content-2026-09-07/runtime-manifest.json)
retains 20 byte-identical PNGs with SHA-256, byte size, dimensions, fixture and
command records. The coordinator and fresh reviewer inspected the generated guide,
desktop/mobile landscape, orientation guard, forced colors, keyboard selection,
player/target headers and world nameplates. Guide source images are loaded at 28px;
both new reward rows and Homesteader on Horizons titles are present.

Canonical before/after commands:

```sh
GAME_URL=http://127.0.0.1:5180 SHOTS_DIR=tmp/freehold-before DIFF_FILE=tmp/freehold-visual.diff NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
GAME_URL=http://127.0.0.1:5179 SHOTS_DIR=tmp/freehold-after DIFF_FILE=tmp/freehold-visual.diff NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
```

The before run exited 0 with all 17 planned captures. The current run exited 1
with 16 captures: desktop Inspect setup reported `no sim` before a world loaded.
A bounded retry of that same canonical target exited 0 with all three Inspect
variants. Its temporary runner
filters only `inspect-border-cartouche` and raises the world boot deadline from
60 to 180 seconds; capture setup/assertions and exit handling are unchanged. The
original failure is retained, not relabeled as a passing run. Exact retry command:

```sh
GAME_URL=http://127.0.0.1:5179 SHOTS_DIR=tmp/freehold-after-retry DIFF_FILE=tmp/freehold-visual.diff NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node tmp/freehold-pr-inspect-retry.mjs
```

The [comparison manifest](../screenshots/freehold-content-2026-09-07/comparison-manifest.json)
retains all 36 original PNGs from the three runs and proves matching coverage of
all 17 variants. Their note arrays retain 142 baseline console notes, 135 current
console notes plus the one setup failure, and 25 retry console notes. The missed
desktop Inspect frame is now present and legible. Both temporary Vite servers were
stopped after capture; no preview process is needed to inspect retained evidence.
Each retained canonical JSON manifest adds one final LF byte to the original;
the comparison record preserves both original and retained SHA-256 identities
and proves the parsed JSON/note arrays are unchanged. All PNGs are byte-identical.

Before-state preview uses an archive of task base HEAD in ignored temporary
storage with shared public assets; no branch or user checkout was changed.
Canonical tours preserve their console notes: offline API 502s, one stale Vite
optimization/cache error in the baseline and asset-preload warnings for background
NPC/creature preview fixtures. Relevant captured controls remain inspectable.
The before/after Overview changes from 429 to 430 total relics and 86 to 87
Horizons slots, retaining the same three authored shelf cards and no empty Hearth.
No real Hearth furnishing page or vendor screenshot can be accepted while their
source gates remain unsigned.

## Review closure

All six required COVERAGE reviewers returned: content obligations, simulation
architecture, cross-platform parity, frontend seams, literal test coverage and QA.
The additional instruction/art safety review passed. The database performance
review ran before the size-pin decision and again on the finished diff, passing
the exact attribution without changing runtime limits.

Repairable findings addressed: portable art sheet path, schedule-null wording,
stale shelf-count comment, real positive Hearth window coverage, literal eight-line
home geometry, exact art source/prompt identities, and the full-gate stale pins.
Numeric approval and absent-content acceptance remain external blockers.

The fresh reviewer also covered the canonical gate-integrity criteria for the
CI evidence include; exact corpus equality and all five test-job includes remain
enforced. The instruction/CI safety reviewer independently passed that finished
six-line change, with no findings or nits.

Fresh whole-fix COVERAGE review is **PASS for the implemented scope**, with no open
finding or nit. It independently verified all prior repairs, the completed shared
gate, exact source/art identities, all 56 retained PNGs, the 17 matched comparison
variants and both original/retained manifest identities. Its verdict explicitly
keeps full feature acceptance NOT READY.

| Review | Final disposition and retained report |
|---|---|
| Content obligations | All repairable findings closed by fresh review; real content obligations remain blocked. [Report](content-reviews-2026-09-07/obligations.md) |
| Simulation architecture | PASS for implemented tables and consumers. [Report](content-reviews-2026-09-07/architecture.md) |
| Cross-platform parity | No admitted-scope defect; positive eight-stock acceptance remains unavailable. [Report](content-reviews-2026-09-07/parity.md) |
| Frontend seams | Code/test nits closed and implemented-surface visuals accepted by fresh review. [Initial report](content-reviews-2026-09-07/frontend.md) |
| Test coverage | Positive real-window and exact art/geometry pins repaired and reviewed. [Initial report](content-reviews-2026-09-07/coverage.md) |
| QA checklist | Implemented checks pass; full feature NOT READY because admissible trial records and required content are absent. [Historical report](content-reviews-2026-09-07/qa.md) |
| Instruction/art/CI safety | PASS, including the narrow screenshot-cone addition. [Report](content-reviews-2026-09-07/instruction-safety.md) |
| Database performance | Proposed and finished growth reviews complete; exact 85-byte repair PASS. [Report](content-reviews-2026-09-07/blob-growth.md) |
| Fresh entire fix round and gate integrity | PASS for bounded code, tests and evidence; no open findings or nits. [Final report](content-reviews-2026-09-07/fresh-fix.md) |

Initial reports retain their historical pending fields; this closure and the fresh
report record their resolved outcomes. The completion-checklist clarification
supersedes historical review wording that treated final production signatures or
shipping GLBs as prerequisites for 03 content PASS. It does not change the missing
content verdict or waive the later activation gates. The source/test/script/CI/CREDITS diff hash
remained `ad02acbfb480d299a70a911ba1380a299c2b71da7dec36d9786e0fe73e556b82`
through final gate and review closure. No full feature PASS is inferred.

## Incremental local commits

The user's follow-up authorizes committing completed, reviewed work in relevant
chunks while the missing content inputs remain open. This replaces the earlier
decision to defer every commit until all requested content existed. Each commit
has an accurate scoped Conventional Commit title and body, with explicit paths.

| Commit | Completed scope |
|---|---|
| `1d583786f6` | Import-order repairs required by the integration-base gate |
| `add3b7b2d9` | Approved tier/Charter/eligibility tables, source evidence and firewall tests |
| `93710767dd` | Homesteader rewards, Hearth consumers, generated guide/i18n, deed art, visual evidence, regression pins and matching CI screenshot admission |
| This documentation checkpoint | Retained reviews, validation, progress/state and the remaining acceptance checklist |

The source/test/script/CI/CREDITS diff against the task base still has the exact
reviewed hash recorded above. Generated outputs, provenance and their consumers
stay together. No commit claims an operational bill, furnishing catalog, vendor
or published Hearth page. Continue using reviewed commits for each remaining
deliverable; unsigned activation gates do not prevent independent completed work
from being committed.

## Deferred deliverables and next entry point

Still required after concrete trial inputs and acceptance of their derivation
basis: the versioned Ledger schedule and all-cycle fixtures;
eight furnishing records with approved quality, copper prices, decorCost and
measured geometry; Eastbrook furnisher, stock, dark-realm off/on eight-item proof;
shipping item-icon mapping/provenance and item/entity localization; actual
`hearth_basics` page and its live-source visual acceptance. The concrete producer,
approval and implementation sequence is in
[the completion checklist](content-completion-checklist-2026-09-07.md).

No approval is inferred from staged paintings, generic comparable prices, passing
tests, elapsed time, or prior packet settlement of unrelated tier values.

Continue the incomplete content work before requesting an overall QA PASS.
The paired audit can inspect this committed checkpoint, but full acceptance
requires its missing deliverables. Once those are complete, run
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-03-qa.md`.
