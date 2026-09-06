# Phase 11: build mode UI (placement on mouse, pad, and touch; the palette; the strip)

Wave A, the Cottage MVP. The spec is `progress.md` "11 Build mode UI"; the decisions
are `brainstorm.md` D4 and D10 and the reuse map (the `GroundAimController` placement
stack, the bags grid family, the `ActionBarPainter` family) and `state.md` "Seams and
names" (Client). This phase ships `src/ui/hud/housing/` (barrel plus `CLAUDE.md`): a
`GroundAimController`-shaped build mode controller parameterised for placement, the
build mode view core and strip painter, the furnishing palette over the bags family,
the three keybinds, the pad hooks, touch pointer ownership, the English keys, the
mobile decisions, and screenshots. After it a furnishing can be placed, rotated,
nudged, removed, and undone with mouse, pad, and touch, with the ghost showing blocked
cells and nothing predicted client-side. This is a client phase: the client gate in
`implementation-plan.md` applies and screenshots go through the `pr-screenshots` skill.

### Starter Prompt
```
This is Phase 11 of the Freeholds and Guildhalls feature: build mode UI (the placement
controller, the view core and strip, the furnishing palette, keybinds, pad, touch,
i18n, mobile, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over disjoint files).

Goal: give the owner a build mode on every input device: a controller that reuses the
ground-aim placement stack with the furnishing as its subject and layout_core as its
projection, a strip and a palette built from existing families, keybinds and pad and
touch hooks through the existing seams, every string an English t() key, and a mobile
decision for every new surface, with the sim deciding every outcome.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the hud_update_drive registry (it pins Hud.update
  calls BY NAME; a new *_painter.ts needs a HOT_PAINTERS entry), the window shell
  coordinate model, mobile orientation (landscape only in game), screenshots at the
  lowest graphics preset, capture rigs never finding elements by English text, the
  monolith ratchet, the S3 i18n guard, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "11 Build mode UI"), and
  this file
- src/ui/CLAUDE.md, src/ui/hud/CLAUDE.md ("Shape", "Tap mode is shared, never per menu",
  "Preservation contract"), src/styles/CLAUDE.md, src/game/CLAUDE.md (the keybind
  recipe), DESIGN.md, docs/design/ground-targeting-input.md,
  docs/design/graphics-settings-fairness.md
- src/ui/hud/action_bar/ground_aim.ts (the pure state), ground_aim_controller.ts
  (GroundAimController and its deps bag: player, resolveAbility, seedTargetPoint,
  fallbackPoint, castAt, clearReticle, projectPlacement; begin, cancel, updatePoint,
  nudge, reticle, commitAt), action_bar_view.ts and action_bar_painter.ts (the
  extra-bar exemplar), src/ui/hud.ts (the ground-aim delegates isGroundAimActive,
  cancelGroundAim, updateGroundAimPoint, nudgeGroundAimPoint, groundAimReticle,
  commitGroundAimAt; castPositionAbility; the presentationBag; the bank and bags docking
  through body.bank-open; the slow band in Hud.update), src/ui/bags_view.ts,
  bags_window.ts, bag_filter.ts (the grid family and chips), src/ui/bag_corner_mark_view.ts
  and item_instance_glyph_mark.ts (the item-cell mark family), src/ui/hud/professions/
  {farming_plant_sheet_view.ts,farming_plant_sheet_window.ts,farming_view.ts,index.ts}
  (a domain directory, a cold event-driven window, the deny-line key selector),
  src/ui/hud/tap_menu_core.ts, tap_menu.ts, strip_gesture_controller.ts,
  src/ui/i18n.catalog/hud_chrome.ts (the bank and farming namespaces, and the
  hudChrome.housing.denied.* rows already present), src/ui/hud/housing/housing_view.ts
  (freeholdDeniedLineKey: the ONE deny-line selector per D26, already mapping the enter
  reasons; this phase appends the placement reason rows to it)
- src/game/keybinds.ts (BIND_ACTIONS), src/game/input.ts (InputCallbacks.onUiKey and
  dispatchEdge), src/game/gamepad.ts (GamepadCallbacks: isGroundAimActive,
  onGroundAimStick, onGroundAimCommit, onGroundAimSnap, cancelGroundAim, and the poll
  loop's confirm, cancel, d-pad routing while aiming), src/game/gamepad_bindings.ts,
  src/game/pad_ground_aim_wiring.ts (padGroundAimCallbacks, createGroundAimReticleSync:
  the composition glue shape), src/game/pad_ground_aim.ts, src/game/mobile_controls.ts
  (onGroundAimMove, onGroundAimTap, pointer ownership as groundAim, the
  mobile-window-open release), src/main.ts (the new Input(...) site, handlePick, the
  onUiKey prelude that cancels aim, the MobileControls construction,
  renderer.setGroundAimReticle)
- src/render/freehold/furnishing_ghost_visual.ts and renderer.setFurnishingGhost (Phase
  09), src/sim/freehold/layout_core.ts (snapToCell, validatePlacement, yawStep),
  src/world_api/housing.ts (placeFurnishing, moveFurnishing, removeFurnishing,
  undoPlacement, freeholdLayout, myFreehold)
- src/styles/hud.mobile.css (the mobile sheet base selector list), src/styles/components.css
  (a ten-dash banner section), scripts/pr_shot_targets.mjs (the target entry shape and
  the compact and tablet device boxes), scripts/pr_screenshots.mjs,
  scripts/mobile_input_zoom_check.mjs
- tests/ground_aim.test.ts, tests/ground_aim_hud.test.ts,
  tests/ground_aim_lifecycle_wiring.test.ts, tests/pad_ground_aim.test.ts,
  tests/keybinds.test.ts, tests/gamepad_bindings.test.ts, tests/hud_update_drive.test.ts,
  tests/hud_perf_budget.test.ts (HOT_PAINTERS), tests/mobile_window_coverage.test.ts
  (MOBILE_WINDOW_EXCEPTIONS), tests/mobile_window_transform.test.ts,
  tests/mobile_window_layout.test.ts, tests/language_fanout_registry.test.ts,
  tests/architecture.test.ts (UI_PURE_CORES, UI_DOM_MODULES), tests/monolith_budget.test.ts
  (hud.ts and main.ts at zero slack)
- Root CLAUDE.md "Modularity", "Invariants", and the i18n rule
The agent returns: the controller deps to parameterise and the two flags the reticle
already paints (dimmed, blocked); the strip-from-a-bar-descriptor recipe; the bags grid
filter seam; the keybind recipe's four touch points; the pad hooks to generalise and the
gamepad_bindings rows; the touch ownership contract and the aim-release rule; the
hud_update_drive and HOT_PAINTERS obligations; the mobile-sheet decision inputs; the
shot-target entry shape; the hud.ts and main.ts extractions that pay for the new
delegate and wiring lines.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/architecture.test.ts UI_PURE_CORES and UI_DOM_MODULES, tests/hud_update_drive.test.ts,
tests/hud_perf_budget.test.ts, tests/monolith_budget.test.ts):
- Agent CORE: src/ui/hud/housing/build_mode_view.ts (pure: mode state, the selected
  furnishing slot, yaw, undo availability, the strip rows; it IMPORTS
  freeholdDeniedLineKey from src/ui/hud/housing/housing_view.ts, the ONE selector per
  D26, and defines no second selector), the placement reason rows (not_owner, bags_full,
  and every layout_core reason id from Phase 08) APPENDED to housing_view.ts's
  freeholdDeniedLineKey over the one hudChrome.housing.denied.* namespace,
  furnishing_palette_view.ts (the bags family filtered to kind === 'furnishing'), the
  UI_PURE_CORES rows, tests/build_mode_view.test.ts, tests/housing_view.test.ts
  extended (every Phase 08 reason id maps, swept against the real enum both ways), and
  tests/furnishing_palette_view.test.ts (a non-furnishing slot is excluded; undo
  availability follows the stack).
- Agent CONTROLLER+PAINTERS: build_mode_controller.ts (a GroundAimController-shaped
  controller: subject = the selected furnishing, projectPlacement = layout_core.snapToCell
  plus validatePlacement so the ghost shows the SNAPPED cell and its blocked state,
  castAt = world.placeFurnishing or moveFurnishing, nudge, yaw through yawStep, cancel;
  it decides nothing: every outcome is the sim's event), build_mode_painter.ts (the
  strip on the ActionBarPainter family: rotate left, rotate right, confirm, remove,
  undo, cancel; 40x40 targets; safe-area insets when edge-anchored),
  furnishing_palette_window.ts (a docked companion on the bags docking idiom, NOT a
  window for the mobile aim-release rule), index.ts and CLAUDE.md, the UI_DOM_MODULES
  rows, the Hud composition as thin delegates (paid by an extraction, lowered hud.ts
  ceiling), the hud_update_drive row and HOT_PAINTERS entry for the painter,
  tests/build_mode_controller.test.ts (begin, project, commit sends the payload once per
  activation, deny re-arms, cancel clears the ghost) and tests/build_mode_painter.test.ts.
- Agent INPUT: toggleBuildMode, rotateFurnishingLeft, rotateFurnishingRight in
  BIND_ACTIONS (edge), the onUiKey union and dispatchEdge cases, src/game/build_mode_wiring.ts
  (the composition glue on the pad_ground_aim_wiring model: one call from main.ts; pad
  hooks through the EXISTING GamepadCallbacks placement members generalised to
  "placement active": bumpers yaw, d-pad nudges by cell; touch through MobileControls
  pointer ownership: drag moves the ghost, tap confirms), tests/keybinds.test.ts
  defaults, tests/gamepad_bindings.test.ts, tests/build_mode_wiring.test.ts (the
  lifecycle pin on the ground_aim_lifecycle_wiring model: any other UI key cancels,
  Escape cancels, a window open releases the pointer without cancelling build mode).
- Agent STYLES+I18N+SHOTS: hudChrome.housing.build.* English keys and the new
  hudChrome.housing.denied.* rows for the placement reasons in
  src/ui/i18n.catalog/hud_chrome.ts (M16 non-Latin fills where a value is wordy), the
  .build-mode-* and .furnishing-palette-* rules under one banner section in
  src/styles/components.css using DESIGN.md tokens, the hud.mobile.css decision (the
  palette joins the mobile sheet base list OR earns a reasoned MOBILE_WINDOW_EXCEPTIONS
  entry as a docked companion; the strip's safe-area insets), `npm run i18n:gen`,
  scripts/pr_shot_targets.mjs entries (desktop, compact, tablet; recipes drive
  window.__game and find elements by id, never by English text), the before and after
  captures through the pr-screenshots skill committed under docs/screenshots/.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Server authority: nothing is predicted client-side; the ghost is a read of the pure
  core and the sim's descriptor moves the layout; a send happens once per activation and
  the deny event re-arms.
- i18n: the policy in docs/freeholds/implementation-plan.md; every player string is an
  English t() key under hudChrome.housing.*; deny lines resolve from reason ids through
  the ONE selector in housing_view.ts over hudChrome.housing.denied.* (D26); never a
  second selector or namespace.
- The client gate (docs/freeholds/implementation-plan.md "Cross-cutting gates"): touch
  targets 40x40 minimum, inputs 16px, landscape mobile, safe-area insets on
  edge-anchored strips, a mobile-sheet decision for every new window id, no hover-only
  essential information, the ghost and blocked state at every graphics tier, before and
  after screenshots on desktop and mobile through pr-screenshots.
- Pure core plus thin painter; family reuse before bespoke (GroundAimController,
  ActionBarPainter, the bags grid); tap mode shared, never per menu; every polled or
  per-frame painter registered in hud_update_drive and HOT_PAINTERS.
- Monolith ratchet: src/ui/hud.ts and src/main.ts sit at ZERO slack; every delegate or
  wiring line is paid for by an extraction, then LOWER the ceiling; main.ts is a
  firewall (one call into the wiring sibling).
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The Strongbox and station interactables and their press funnel (Phase 12); the
  Steward panel (Phase 16); the trophy case (Phase 17).
- Wall and table-top snapping, redo, the capacity meter, advanced mode (Phase 25);
  gamepad polish beyond bumpers, d-pad, confirm, and cancel (the MVP out list).
- The palette drawing from the vault or the Strongbox (bags only in wave A).
- Any new SimEvent, command, or render producer.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/build_mode_view.test.ts
  tests/build_mode_controller.test.ts tests/build_mode_painter.test.ts
  tests/furnishing_palette_view.test.ts tests/build_mode_wiring.test.ts
  tests/keybinds.test.ts tests/gamepad_bindings.test.ts tests/ground_aim_hud.test.ts
  tests/ground_aim_lifecycle_wiring.test.ts tests/pad_ground_aim.test.ts
  tests/architecture.test.ts tests/hud_update_drive.test.ts tests/hud_perf_budget.test.ts
  tests/mobile_window_coverage.test.ts tests/mobile_window_transform.test.ts
  tests/mobile_window_layout.test.ts tests/language_fanout_registry.test.ts
  tests/renderer_compile_gate.test.ts tests/monolith_budget.test.ts`; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`.
- With `npm run dev` running: `node scripts/pr_screenshots.mjs` (desktop, compact,
  tablet; lowest graphics preset seeded; Android emulation for the mobile boxes) and
  `node scripts/mobile_input_zoom_check.mjs`; commit the shots under docs/screenshots/
  and note the paths for the wave PR body.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  frontend-seam-reviewer (pure cores, painter split, write elision, tier fairness, the
  styles contract, i18n sink classification, family reuse). Prompt it for COVERAGE not
  filtering; it writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(ui): add the build mode view core, controller, strip painter, and furnishing palette
- feat(game): wire build mode keybinds, pad placement hooks, and touch pointer ownership
- feat(styles): style the build strip and palette with the mobile sheet and safe-area rules
- docs(screenshots): capture build mode before and after on desktop, compact, and tablet
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A furnishing can be placed, rotated, nudged, removed, and undone with mouse
  (tests/build_mode_controller.test.ts plus the wiring pin), pad (the generalised
  placement hooks pinned in tests/build_mode_wiring.test.ts), and touch (drag moves,
  tap confirms, pinned); the ghost shows blocked cells (the controller projects through
  validatePlacement, pinned).
- [ ] Nothing is predicted client-side: the mirror moves only on the descriptor (a pin
  that a refused send leaves freeholdLayout unchanged).
- [ ] Every new string is a hudChrome.housing.build.* or hudChrome.housing.denied.* key;
  every Phase 08 reason id maps through freeholdDeniedLineKey in housing_view.ts (the
  only selector; a grep for a second one finds none); the S3 guard and i18n
  completeness pass.
- [ ] The three keybinds are in BIND_ACTIONS with pinned defaults; the palette has a
  mobile-sheet decision; the strip carries safe-area insets; the zoom check passes.
- [ ] hud_update_drive and HOT_PAINTERS carry the painter; UI_PURE_CORES and
  UI_DOM_MODULES carry the new modules.
- [ ] Screenshots committed (desktop, compact, tablet; before and after) and their paths
  recorded for the wave PR body.
- [ ] All STEP 3 suites green; frontend-seam-reviewer reports no BLOCKING; hud.ts and
  main.ts ceilings are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 11, the screenshot paths, deferrals)
  and docs/freeholds/state.md (the per-phase ledger row 11: new files, the three
  keybinds, the i18n keys, the mobile decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-11-qa.md

STOPPING RULES:
- Stop and ask if the pad hooks cannot be generalised without a second dialect in
  gamepad.ts, or if touch ownership would need a new pointer owner kind.
- Stop and ask if a string cannot be expressed as a key (a composed label) without a
  matcher row.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
