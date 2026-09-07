# Furnishing item kind visual evidence

The World Market type filter gains Furnishings. The synthetic furnishing tooltip
shows its footprint, decor cost, floor placement, and escaped maker attribution.
Every image linked below was visually inspected after capture.

| View | Before | After |
| --- | --- | --- |
| Desktop filter | [Before](before-filter-desktop.png) | [After](after-filter-desktop.png) |
| Mobile landscape filter | [Before](before-filter-mobile-landscape.png) | [After](after-filter-mobile-landscape.png) |
| Mobile portrait layout probe | [Before](before-filter-mobile-portrait-probe.png) | [After](after-filter-mobile-portrait-probe.png) |
| Actual portrait orientation guard | [Before](before-portrait-orientation-guard.png) | [After](after-portrait-orientation-guard.png) |

[After: synthetic furnishing tooltip and procedural crate icon](after-tooltip-desktop.png).
The desktop tooltip was opened by native mouse hover over the real market row.

## Sources and setup

- Before: `16f2aeed2be022343291e18ede12cd042cae1fc6`, the integrated release base
  before this implementation, archived at `/tmp/freeholds-02-visual-base` and
  served at `http://localhost:5188`.
- After: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, with
  that same HEAD plus the furnishing changes, served at `http://localhost:5187`.
  Both sources use the same existing public assets.
- Browser: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, headless
  SwiftShader. Every page seeds `woc_settings.graphicsPreset = 1` before navigation.
  The standard software-GPU notice is dismissed for the capture session.
- Viewports: desktop 1600 by 900; mobile landscape 844 by 390; mobile portrait
  390 by 844 CSS pixels. Mobile uses an iPhone user-agent, touch emulation, and
  device scale factor 2. Filters are clipped to the market window. The tooltip
  retains the viewport so both the tooltip and its listing icon remain visible.

The ignored `tmp/freeholds-02-capture.mjs` derives from `scripts/pr_screenshots.mjs`
and reuses `scripts/enter_offline_game.mjs`, `scripts/pr_shot_targets.mjs`, and the
shared browser resolver. It selects `market-type-filter-list`, resolves an actual
Merchant entity through `NPCS`, moves the offline player to it, opens the real HUD
market window, and hides the Bags companion using the existing target convention.
The target's older hardcoded coordinates did not reach this base's Merchant.

The harness waits for both entry and relocation loading curtains, dismisses the
standard entry overlays, requires a visible market and expanded item-type menu,
and hit-tests the type trigger. It asserts Furnishings is absent before and
present after, and scrolls the menu to its final option. Missing screenshot clips
throw; later runs also require every planned capture. Visual inspection remains
the acceptance check because DOM presence alone does not prove visible pixels.

Portrait play has an unchanged `#rotate-device` guard. The orientation-guard shots
show the actual player experience. For the separately labeled portrait layout
probes, only that guard's display is suppressed in browser memory. They establish
the filter's narrow layout, not supported portrait gameplay. The narrow market
window and truncated unrelated labels are present in both source versions.

The tooltip fixture exists only in browser memory: `probe_furnishing_screenshot`,
name `Screenshot Test Furnishing`, rare quality, footprint 2 by 3 cells, decor
cost 7, floor surface, signer `<Maker & Co>`. It is inserted into the loaded
`ITEMS` modules and offline market book, including Vite's timestamped module URLs.
No shipped item id or artwork is added. The additional bag probe below injects a
copy only into the offline browser inventory. The real Furnishings
filter is clicked before hovering the listing. Assertions verify exactly four
placement/maker rows, `&lt;Maker &amp; Co&gt;` in HTML, no interpreted signer element,
and a decoded 96 by 96 procedural crate icon with no authored image URL.

## Commands and accepted outputs

Commands ran from the after worktree with both local Vite servers already active:

```sh
git diff -- src/sim/market_query.ts src/ui/market_view.ts > /tmp/freeholds-02-visual.diff
GAME_URL=http://localhost:5188 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-before-final EXPECT_FURNISHING=0 node tmp/freeholds-02-capture.mjs > /tmp/freeholds-02-before-final.log 2>&1
GAME_URL=http://localhost:5188 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-before-portrait EXPECT_FURNISHING=0 SHOT_VARIANT=mobile-portrait node tmp/freeholds-02-capture.mjs > /tmp/freeholds-02-before-portrait.log 2>&1
GAME_URL=http://localhost:5187 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-after-desktop EXPECT_FURNISHING=1 CAPTURE_TOOLTIP=1 SHOT_VARIANT=desktop node tmp/freeholds-02-capture.mjs > /tmp/freeholds-02-after-desktop.log 2>&1
GAME_URL=http://localhost:5187 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-after-evidence EXPECT_FURNISHING=1 CAPTURE_TOOLTIP=1 node tmp/freeholds-02-capture.mjs > /tmp/freeholds-02-after-evidence.log 2>&1
```

- `before-final`: exited 1 because the portrait orientation guard blocked the
  target. Its visually valid desktop and landscape filter images are retained.
- `before-portrait`: exited 0 after adding the explicitly labeled guard suppression.
  Its portrait filter probe and original orientation guard are retained.
- `after-desktop`: exited 0. Its native-hover tooltip is retained. The matching
  hover recipe is available locally in `tmp/freeholds-02-desktop-hover-capture.mjs`.
- `after-evidence`: exited 0. Its three filter images and orientation guard are
  retained. Experimental direct-composer tooltip images from this run were
  discarded after visual inspection; they are not evidence of touch tooltip use.
- Both ignored capture scripts pass `node --check`. The screenshot evidence was
  counted and decoded, and every linked image was inspected individually.

## Diagnostics and limits

Both source versions logged 502 responses from local `/api/site-presence` and
`/api/project-stats` proxies because no API service was running. Both also logged
`character visual unavailable, skipping view` / `character asset not preloaded`
for existing character models. Desktop examples were
`models/weapons/brasscrown_walking_staff.glb` and
`models/creatures/training_dummy.glb`; mobile relocation also reported creature
and skeleton models outside the starter preload. These affect the low-preset
world background, not the demonstrated filter labels or furnishing crate icon.
No page-error events were recorded in the retained-source runs.

These are offline presentation captures in emulated Chromium. They do not verify
online transactions, physical-device WebKit behavior, mobile long-press tooltips,
or shipped furnishing availability. Earlier full-world/loading-curtain images
were rejected and remain outside this evidence directory.

## Additional bag and keyboard probes

The final frontend review requested direct browser evidence for normal bags,
context actions, keyboard selection, and forced-colors focus. These probes keep
the original screenshots above and use the same after source, desktop viewport,
lowest graphics preset, and in-memory furnishing definition.

| Probe | Evidence |
| --- | --- |
| Native B opens normal bags; furnishing crate is visible under All | [All](after-bag-all-desktop.png) |
| Clicking Materials hides the furnishing without changing inventory | [Materials](after-bag-materials-excludes-desktop.png) |
| Native right-click offers only the `lock` action, labeled Lock Item | [Context menu](after-bag-lock-menu-desktop.png) |
| Native market keyboard navigation focuses Furnishings | [Keyboard focus](after-market-keyboard-focus-desktop.png) |
| Forced-colors market dropdown retains readable Furnishings and focus | [Market forced colors](after-market-forced-colors-focus-desktop.png) |

The bag assertion checks the exact existing chips: All, Weapons, Armor,
Consumables, Materials, Tools, Quest, and Mounts. There is no Furnishings chip.
The visible fixture cell is identified by its live item id and accessible name,
and its procedural icon is decoded. Materials selection removes that cell from
the rendered grid while the underlying inventory stays byte-for-byte unchanged.
The context menu is opened by native right-click and contains exactly one row,
`data-act="lock"`, with the existing label `Lock Item`. Market, bank, and vendor
modes are closed during these normal-bag checks.

The market probe anchors focus on its dialog root, then uses native Tab through
Close, Browse, Sell, Collect, Search, and Type. ArrowDown, End, and ArrowUp focus
Furnishings. Native Enter commits it: the recreated trigger says Furnishings,
`aria-expanded` is false, and the offline world's query has
`itemType: 'furnishing'`. The normal focused option has a visible 3px solid outline.

Forced colors uses the repository's real CDP `Emulation.setEmulatedMedia` recipe
with `{name: 'forced-colors', value: 'active'}`. Assertions require the matching
media query, focused element identity, `:focus-visible`, a positive solid outline,
visible viewport bounds, and hit-test reachability. The Furnishings option has a
2px solid outline in this mode. This verifies the named controls and focus rings,
not overall HUD contrast: the existing panel transparency and faint empty-state
copy remain visible in the forced-colors image.

Normal bags have an existing keyboard limit: their root and category buttons do
not provide full native Tab traversal. `BagsWindow` deliberately has no focus
trap, and `Input.onKeyDown` consumes Tab for target-nearest outside INPUT/TEXTAREA.
The market's full traversal result must not be generalized to standalone bags.

[Forced-colors bag focus](after-bag-forced-colors-focus-desktop.png) is a narrower
probe: the harness anchors the existing search input, then native Shift+Tab reaches
the preceding Mounts chip. All remains the active category and the furnishing
crate remains visible. The chip has a visible 2px solid outline, with white text
on black. This proves that one focus transition and its appearance, not full bag
keyboard navigation. The pointer is moved away before capture so no hover tooltip
covers the focused chip.

The additional runner is `tmp/freeholds-02-extra-capture.mjs`, using the same
capture pipeline and the ignored `tmp/freeholds-02-extra-probes.mjs` helper:

```sh
GAME_URL=http://localhost:5187 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-extra-final EXPECT_FURNISHING=1 SHOT_VARIANT=desktop CAPTURE_EXTRAS=1 node tmp/freeholds-02-extra-capture.mjs > /tmp/freeholds-02-extra-final.log 2>&1
GAME_URL=http://localhost:5187 DIFF_FILE=/tmp/freeholds-02-visual.diff SHOTS_DIR=/tmp/freeholds-02-bag-focus EXPECT_FURNISHING=1 SHOT_VARIANT=desktop CAPTURE_EXTRAS=1 EXTRA_FOCUS_ONLY=1 node tmp/freeholds-02-extra-capture.mjs > /tmp/freeholds-02-bag-focus.log 2>&1
node --check tmp/freeholds-02-extra-capture.mjs
node --check tmp/freeholds-02-extra-probes.mjs
```

Both capture runs exited 0 and enforced their planned capture counts. Five new
images are retained from `extra-final`; its bag-focus image was discarded because
an incidental hover tooltip covered the focused control. The isolated `bag-focus`
rerun supplies the inspected replacement. Both syntax checks passed. Earlier
attempts corrected the harness's assumed `Lock` caption to the existing `Lock Item`
caption and exposed the documented standalone-bag Tab limit; neither was hidden
by accepting a substitute screenshot.

[Recorded browser assertions](browser-probe-results.json) preserve the observed
chip roster, live item accessible name, lock-only menu, native key traversal,
committed query, focus state, and computed outlines. These additional runs logged
the same local API 502s and existing character-preload diagnostics described above,
with no page-error events. No production or test files changed for these probes.
