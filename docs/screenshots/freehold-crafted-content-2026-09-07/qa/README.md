# Phase 04 crafted-content visual QA

Final capture: **11 of 11 frames passed, exit 0**, with no target failures or browser page errors. The final phone refusal is visibly above the bag sheet. The capture uses the existing repository runner, a real offline world, real keyboard/touch handlers, and graphics preset 1 seeded before boot.

## Accepted evidence

| Subject | Immutable before | Final after |
| --- | --- | --- |
| Guide paragraph, desktop 1280x900 | [Before](guide-before/01-provisioning-furnishing-guide-desktop-intro.png) | [After](combined-after/01-provisioning-furnishing-guide-desktop-intro.png) |
| Cooking 50 row, desktop | [Before](guide-before/02-provisioning-furnishing-guide-desktop-row.png) | [After](combined-after/02-provisioning-furnishing-guide-desktop-row.png) |
| Guide paragraph, phone 390x844 | [Before](guide-before/03-provisioning-furnishing-guide-mobile-intro.png) | [After](combined-after/03-provisioning-furnishing-guide-mobile-intro.png) |
| Cooking 50 row, phone | [Before](guide-before/04-provisioning-furnishing-guide-mobile-row.png) | [After](combined-after/04-provisioning-furnishing-guide-mobile-row.png) |
| Japanese paragraph, phone | [Before](guide-before/05-provisioning-furnishing-guide-japanese-intro.png) | [After](combined-after/05-provisioning-furnishing-guide-japanese-intro.png) |
| Japanese Cooking 50 row, phone | [Before](guide-before/06-provisioning-furnishing-guide-japanese-row.png) | [After](combined-after/06-provisioning-furnishing-guide-japanese-row.png) |
| Disabled manual, desktop 1600x900 | [Before](manual-before/01-freehold-manual-tooltip-dark-desktop.png) | [After](combined-after/07-freehold-manual-tooltip-dark-desktop.png) |
| Enabled manual, desktop | [Before](manual-before/02-freehold-manual-tooltip-lit-desktop.png) | [After](combined-after/08-freehold-manual-tooltip-lit-desktop.png) |
| Disabled manual, phone 844x390 | [Before](manual-before/03-freehold-manual-tooltip-dark-mobile.png) | [After](combined-after/09-freehold-manual-tooltip-dark-mobile.png) |
| Enabled manual, phone | [Before](manual-before/04-freehold-manual-tooltip-lit-mobile.png) | [After](combined-after/10-freehold-manual-tooltip-lit-mobile.png) |
| Disabled manual, forced colors | [Before](manual-before/05-freehold-manual-tooltip-dark-forced-colors.png) | [After](combined-after/11-freehold-manual-tooltip-dark-forced-colors.png) |

Phone dimensions above are CSS pixels; PNGs use DPR 2. Desktop uses DPR 1. All guide variants report no horizontal overflow; all photographed manual tooltips fit the viewport.

The [intermediate phone refusal](refusal-layer-before/01-freehold-manual-tooltip-dark-mobile.png) preserves the additional defect found after the tooltip/use repair: the toast had correct text and opacity but was covered by Bags. The final phone frame above proves the mobile z96 repair. This intermediate source is distinguished from the immutable before set.

The six earlier [guide-after](guide-after/README.md) frames remain to preserve the independent review's original links. `combined-after` is authoritative for final source and target-order validation. [capture-inventory.json](capture-inventory.json) records all 29 PNGs, dimensions, sizes, and SHA-256 hashes; 23 comprise the final comparison plus intermediate defect proof, and six are the earlier accepted guide duplicate.

## Actual behavior and fixture boundary

The rig grants one `pattern_freehold_clockwork_lamp`, sets Engineering to 50, clears knowledge of `recipe_freehold_clockwork_lamp`, and sets the real Sim host capability for each leg. These are explicit setup grants, not acquisition outcomes. Bags opens through the B binding. Desktop activates the actual row with focus and Enter; phone taps the actual row and its Use menu action. A transparent delegate counts calls to the original `Sim.useItem` without substituting a result.

| Actual use | Calls to Sim.useItem | Copies after use | Recipe known |
| --- | --- | --- | --- |
| Disabled, immutable before | 1 | 1 | No |
| Disabled, final after | 0 | 1 | No |
| Enabled, either source | 1 | 0 | Yes |

The enabled result is recorded before a separate second fixture forgets the recipe and grants another copy for the learning-tooltip photograph. That tooltip is opened through real keyboard focus, including the enabled phone layout; it is not presented as touch-only inspection. The disabled phone photograph is the result of actual tap then Use, showing the localized refusal above the sheet. Its real Use target measures 134x40 CSS pixels; the bag cell measures 42.8125x42.8125. General drag and long-press timing remain unchanged. The initial result samples the toast during its transition; the phone presentation waits for opacity above 0.9, and actual pixels independently establish readability.

The disabled desktop/forced-color tooltip replaces the learning promise and Click to use hint with the existing realm-unavailable line. The enabled tooltip remains a learning/skill preview. The guide separates ornamental furnishings from meals and buffs in both English and Japanese.

## Source and reproduction

Before uses an immutable export of merge `2e24ba8818` at `/tmp/freeholds-crafted-qa-before`, served on localhost:5193. The live worktree was never stashed or switched. Final source corresponds to `5f4821bec7`; capture started with the same mobile CSS change uncommitted, and [source-hashes.json](combined-after/source-hashes.json) verifies the registry, use guard, tooltip, and CSS against the committed source.

The final sequence selected both checked-in targets in one browser profile: six guide frames ending in Japanese, then five manual frames. Every manual explicitly resets and logs locale `en`, including forced colors. This closes F24's inherited-locale defect. The actual seed replay leaves `ja_JP` on all five old legs ([before stdout](capture-locale-before.txt), expected exit 1) and resets all five current legs to `en`/preset 1 ([after stdout](capture-locale-after.txt), exit 0). The owning regression suite passes [44 tests](capture-target-tests.txt).

Exact final capture command:

```sh
GAME_URL=http://localhost:5192 DIFF_FILE=/tmp/freeholds-crafted-qa-combined-shot.diff SHOTS_DIR=/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/screenshots/freehold-crafted-content-2026-09-07/qa/combined-after NAV_TIMEOUT_MS=120000 ENTRY_SELECTOR_TIMEOUT_MS=120000 node /tmp/freeholds-crafted-capture/scripts/pr_screenshots.mjs
```

The temporary runner copy uses the unchanged repository helpers, and its registry was byte-identical to the committed registry (SHA-256 in the source receipt). For reproduction from the repository, use `node scripts/pr_screenshots.mjs` with [combined-selection.diff](combined-selection.diff), the chosen Vite URL, and a new output directory. [guide-selection.diff](guide-selection.diff) and [manual-selection.diff](manual-selection.diff) reproduce the separate immutable before runs on 5193. These selection headers intentionally limit the run to the two audited surfaces.

Validation commands: `node --check scripts/pr_shot_targets.mjs`; `npx biome check --write scripts/pr_shot_targets.mjs`; `npx biome check --write tests/pr_shot_targets.test.ts`; `WOC_SKIP_PRETEST=1 npx vitest run tests/pr_shot_targets.test.ts`; and `git diff --check` for those paths. The earlier capture-owner invocation passed 43 tests. The final command `npx vitest run tests/pr_shot_targets.test.ts --maxWorkers=3` passed 44 tests and is archived above; final integration gates and the mobile CSS browser regression are recorded in the coordinator's main QA report.

## Original output and limits

Original manifests are unchanged. Repository ignore rules exclude `*.log`, so each accepted bundle archives the original stdout as readable `capture.txt` with terminal control sequences removed:

| Historical local log | Portable stdout |
| --- | --- |
| `/tmp/freeholds-crafted-qa-guide-shot-before.log` | [guide-before/capture.txt](guide-before/capture.txt) |
| `/tmp/freeholds-crafted-qa-manual-capture-before-complete.log` | [manual-before/capture.txt](manual-before/capture.txt) |
| `/tmp/freeholds-crafted-qa-mobile-probe-quiet.log` | [refusal-layer-before/capture.txt](refusal-layer-before/capture.txt) |
| `/tmp/freeholds-crafted-qa-combined-after-quiet-final.log` | [combined-after/capture.txt](combined-after/capture.txt) |
| `/tmp/freeholds-crafted-qa-guide-shot-after.log` | [guide-after/capture.txt](guide-after/capture.txt) |

All five accepted manifests have zero target failures and zero page errors. The final combined run retains 65 console notes: 29 HTTP 502 messages from the existing local Vite backend proxy and 36 existing model preload warnings. It is not a console-clean run. The immutable manual-before bundle has the same warning categories (13 HTTP 502, 36 model preload notes). These warnings did not hide a failed target.

Earlier timing failures were preserved under `/tmp`: a combined run under the six-worker full gate captured 9/11, missing one world boot and one touch menu. A concurrent one-leg phone probe also missed the menu. Browser work then stopped until the gate quieted. The quiet phone probe exposed the real toast occlusion; after the mobile layer repair, the quiet full 11-frame run passed. No rejected or stale partial frame is included as final evidence. No generated asset or user browser session was used.
