# Phase 25: build mode v2 (surface snapping, redo, twelve-week prepay, the Fenbridge gate)

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "25
Build mode v2"; the decisions are `state.md` and `brainstorm.md` (D4: the layout is a
descriptor both hosts regenerate). This phase ships wall and table-top surface snapping
(`surface: 'wall' | 'table'` on furnishing defs, the layout core's surface rules,
parenting), redo, the capacity meter, advanced mode (free rotation), twelve-week prepay,
and the Fenbridge Freehold Gate. Every new validation arm is negative-tested and both
hosts regenerate the same layout from the same descriptor.

### Starter Prompt
```
This is Phase 25 of the Freeholds and Guildhalls feature: build mode v2 (wall and
table-top surface snapping with parenting, redo, the capacity meter, advanced mode,
twelve-week prepay, the Fenbridge Freehold Gate).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over the Phase 08, 11, and 13 seams).

Goal: let an owner hang pieces on walls and set pieces on table tops with the sim
validating every surface rule on both hosts, redo an undone step, see the decor and
plinth capacity, rotate freely in advanced mode, prepay up to twelve weeks of the
Steward's Ledger, and enter from a second gate in Fenbridge.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the monolith ratchet, world_api parity pins,
  the coordinator extraction drive registry (hud_update_drive pins by name), mobile
  orientation (landscape only), the window shell coordinate model, screenshots at
  lowest graphics, capture rigs never find by English text, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "25 Build mode v2"), and
  this file
- src/sim/freehold/layout_core.ts (the cell grid, snapToCell, yawStep, clampToRoom,
  overlap by r, decor accounting, plinth rules, validatePlacement, the undo stack) and
  src/sim/freehold/placement.ts (the four commands); src/sim/rift/authored.ts
  (authoredWallSegments for wall lines, roomAt); src/sim/dungeon_layout.ts
  (DUNGEON_WALL_HW); src/sim/types.ts (FurnishingItemDef.furnishing: footprint, r,
  decorCost, surface, plinth); src/sim/content/freehold/furnishings.ts (every def, to
  decide which gain a wall or table surface and which host a table top)
- src/sim/freehold/ledger_core.ts and ledger.ts (the prepay cap literal and the
  four-week pins), src/sim/freehold/condition_core.ts
- The Phase 06 gate: the Eastbrook Freehold Gate interactable (grep freehold_enter under
  src/sim/ and src/game/), the DungeonDef doorPos and leaveOffset, how "the gate used" is
  remembered for leave, src/sim/content/fenbridge (the Fenbridge hub layout and a quay
  or square position for a second gate), tests/professions_station_placement.test.ts
  (the camp-safety bar shape for a placed position)
- src/ui/hud/housing/ (build_mode_controller.ts, build_mode_view.ts,
  build_mode_painter.ts, furnishing_palette_view.ts, furnishing_palette_window.ts,
  steward_panel_view.ts, steward_panel_window.ts, index.ts, CLAUDE.md), src/ui/hud/
  action_bar/ground_aim_controller.ts, src/game/keybinds.ts (BIND_ACTIONS),
  src/game/input.ts (dispatchEdge), src/game/gamepad.ts (GamepadCallbacks),
  src/game/mobile_controls.ts (pointer ownership), src/ui/hud/CLAUDE.md, src/styles/
  hud.mobile.css (the sheet base list and safe-area rules), scripts/pr_shot_targets.mjs
- src/render/freehold/furnishing_ghost_visual.ts,
  src/render/freehold/furnishing_layout_core.ts (seat math, Phase 09's name),
  src/render/freehold/furnishings.ts
- server/freehold_wire.ts (the descriptor emitter and command dispatch),
  src/net/freehold_snapshot_wire.ts (the strict decode with its AssertNever arm),
  src/world_api/housing.ts, src/world_api.ts (COMMAND_NAMES, COMMAND_FACETS),
  tests/world_api_parity.test.ts, tests/freehold_command_chain_online.test.ts
- tests/freehold_layout_core.test.ts, tests/freehold_determinism.test.ts,
  tests/freehold_ledger.test.ts, tests/keybinds.test.ts, tests/gamepad_bindings.test.ts,
  tests/mobile_window_coverage.test.ts, tests/hud_update_drive.test.ts,
  tests/monolith_budget.test.ts, tests/snapshots.test.ts
- docs/design/ground-targeting-input.md, docs/design/graphics-settings-fairness.md
The agent returns: the layout row shape and where surface, parentId, and a free yaw
would be appended; whether Phase 08 pinned the 15-degree snap as a sim REFUSAL or as a
client projection only (this decides the advanced-mode arm: settle it and record in
state.md); the wall-segment source for snapping and how a wall normal yields the yaw;
which defs host a table top and the measured top height each needs (a `topHeight`
field beside r, the Phase 03 measured-radius precedent); the undo stack shape for a
redo inverse; the prepay cap literal and its pins; the gate recipe and how leave
remembers the gate; the strip, palette, keybind, pad, and touch shapes to extend; the
ghost and seat math to extend; the extraction candidates for any coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/command_schema.test.ts,
tests/freehold_command_chain_online.test.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, the parity goldens):
- Agent LAYOUT (sim): layout_core.ts surface rules (a `wall` piece snaps to the nearest
  wall segment with the yaw of the wall normal and a wall-local offset; a `table` piece
  parents to a placed floor piece that hosts a top, at most `hostsTable` children,
  seated at the host's topHeight; a host with children refuses removal `host_occupied`
  and moves its children with it; a `floor` piece never parents), the finite-and-wrapped
  free-yaw arm behind a `free` payload flag or the client-only snap (per the STEP 1
  decision), `redo` as the inverse of the last undo on the bounded stack, capacity
  accounting exposed as a pure read (decor used and total, plinths used and total,
  surfaces used); placement.ts gains `redo_placement` and the surface and parent fields
  on place and move; every new arm returns a text-free reason id (appended to
  freeholdDeniedLineKey in src/ui/hud/housing/housing_view.ts, D26) and mutates nothing on
  refusal; the descriptor rows carry surface, parentId, and yaw; tests/freehold_layout_core.test.ts
  and tests/freehold_determinism.test.ts extended.
- Agent LEDGER-GATE (sim and content): the prepay cap raised to twelve weeks
  (LEDGER_PREPAY_MAX_WEEKS literal; the thirteenth refused; tests/freehold_ledger.test.ts
  re-pinned by fresh literals), `surface` and `topHeight` fields on the defs that earn
  them (paintings and maps to wall; lamps and small props to table; tables and shelves
  host), the Fenbridge Freehold Gate as a second gate interactable at a camp-safe
  Fenbridge position with a placement test in the station-placement style, `freehold_enter`
  carrying the gate id and leave returning to the gate used (a session-only field in
  META_EXCLUDE), the world-entity name and any wiki key.
- Agent UI: build_mode_view.ts (redo availability, the surface indicator, the advanced
  toggle, the capacity meter as a pure core `capacity_meter_view.ts`), build_mode_painter.ts
  (redo and advanced controls in the strip, the meter in the palette header),
  BIND_ACTIONS `redoPlacement` and `toggleAdvancedBuild` with dispatchEdge cases and
  main.ts wiring, pad bumpers stepping fine yaw in advanced mode, the touch strip gaining
  redo and advanced at 40x40 with safe-area insets, hudChrome.housing.build.* keys,
  hud_update_drive rows for any polled painter, pr_shot_targets.mjs entries, screenshots
  (desktop, compact, tablet) through the pr-screenshots skill.
- Agent RENDER: furnishing_ghost_visual.ts snapping the ghost to the wall normal and the
  table top with the blocked state at every tier,
  src/render/freehold/furnishing_layout_core.ts seat math for
  wall height and the host's topHeight (registered in RENDER_PURE_CORES, tested),
  furnishings.ts parenting the child transform to the host.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: no Rng in placement; both hosts regenerate the same geometry and
  colliders from the same descriptor, surfaces and parents included (pinned byte-equal).
- Server authority: the client projects a preview and predicts nothing; the sim
  validates every surface, parent, capacity, and yaw rule on every host; the payload
  field chain test covers the new fields.
- Never destroy: a host with children refuses removal; undo and redo never drop a piece;
  the thirteenth prepay week refuses with nothing consumed.
- Graphics fairness: the ghost, the snap target, the blocked state, and the capacity
  meter draw at every tier (docs/design/graphics-settings-fairness.md).
- Mobile: landscape only; 40x40 targets; safe-area insets on the strip; the palette is
  not a window for the aim-release rule; a mobile-sheet decision for any new window id.
- Content: a surface or topHeight field is data on existing defs (no new item, no art
  obligation); the power-neutral sweep still passes; ids unchanged.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- Working values (twelve weeks, the 15-degree step) are state.md numbers; Fernando owns
  the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Ceiling surfaces, dyes, layout save, load, or share (Phase 41); wards or exteriors
  (Phase 34); any new furnishing (Phase 22 shipped the roster).
- Any change to the ledger schedule, condition rules, or the Master Builder's Call.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_layout_core.test.ts tests/freehold_determinism.test.ts
  tests/freehold_ledger.test.ts tests/freehold_content.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_wire.test.ts
  tests/keybinds.test.ts tests/gamepad_bindings.test.ts tests/build_mode_view.test.ts
  tests/capacity_meter_view.test.ts tests/furnishing_layout_core.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/renderer_compile_gate.test.ts tests/localization_fixes.test.ts
  tests/dungeons.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs` for the build mode
  targets; `node scripts/mobile_input_zoom_check.mjs` against `npm run dev`; parity
  goldens regenerated in their own commit if the descriptor emit changed.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the layout core arms, determinism), frontend-seam-reviewer (the
  views, painters, strip, mobile, fairness), plus cross-platform-sync (the new command
  and descriptor fields) and content-obligations-reviewer (the def fields) because the
  diff touches those surfaces (the dispatch table rows). Prompt each for
  COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add wall and table-top surface rules, parenting, and redo to the layout core
- feat(content): add the Fenbridge Freehold Gate and twelve-week prepay
- feat(ui): add the build mode v2 controls, advanced rotation, and the capacity meter
- feat(render): snap the placement ghost to walls and table tops
- test(sim): negative-test every new placement arm on both hosts
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_layout_core.test.ts has a negative case for every new arm (wall
  off a wall line, a table piece without a host, a host at capacity, removing an
  occupied host, a floor piece as a parent, a non-finite yaw, redo with nothing undone)
  and proves no refusal mutates.
- [ ] tests/freehold_determinism.test.ts proves the same descriptor (surfaces, parents,
  free yaw) regenerates byte-identical layouts and colliders on both hosts.
- [ ] tests/freehold_ledger.test.ts pins twelve weeks accepted and thirteen refused by
  fresh literals; the Steward panel offers twelve.
- [ ] The Fenbridge gate enters offline and online, and leave returns to the gate used;
  the placement test holds the camp-safety bar.
- [ ] Wall and table placement, redo, advanced rotation, and the meter work with mouse,
  pad, and touch; screenshots (desktop, compact, tablet) are committed; the ghost shows
  the snap target and the blocked state at LOW.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 25, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 25: new command, facet members,
  descriptor fields, keybinds, i18n keys, the prepay literal; the advanced-mode decision
  and the surface field decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-25-qa.md

STOPPING RULES:
- Stop and ask if a surface rule would require the client to decide a placement the sim
  cannot re-validate (the sim owns every rule).
- Stop if the Fenbridge position cannot meet the camp-safety bar without moving an
  existing prop or node.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
