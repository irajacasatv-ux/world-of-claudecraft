# Phase 09: render (the furnishing view, the interior light rig, the placement ghost)

Wave A, the Cottage MVP. The spec is `progress.md` "09 Render: furnishing view, light
rig, ghost"; the decisions are `brainstorm.md` D4 (a descriptor both hosts regenerate)
and D13 (art gets stand-ins) and `state.md` "Seams and names" (Client). This phase ships
`src/render/freehold/furnishings.ts` (a `FarmPatchVisuals`-shaped per-viewer view synced
from `IWorldHousing.freeholdLayout` through the compile gate), `furnishing_layout_core.ts`
in `RENDER_PURE_CORES`, a stand-in kit behind one model registry the art phase later
fills, the interior light rig under the point-light budget, and the placement ghost
visual driven by a renderer setter. A placed furnishing is visible on both hosts; nothing
in the UI drives the ghost until Phase 11. This is a client phase: the client gate in
`implementation-plan.md` applies and screenshots go through the `pr-screenshots` skill.

### Starter Prompt
```
This is Phase 09 of the Freeholds and Guildhalls feature: render (the furnishing view,
the stand-in kit, the interior light rig, the placement ghost).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices, one shared registry pin).

Goal: draw the descriptor: every placed furnishing renders from
IWorldHousing.freeholdLayout on both hosts through a scheduler-client view with a
stand-in per furnishing family, the Cottage and Inn Room get a lit hearth within the
point-light budget, and a rotation-aware placement ghost exists for Phase 11 to drive,
all with zero live-program events on an offline tour.

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
- Memory scan: MEMORY.md and entries on the Eastbrook re-mint (ANY byte in renderer.ts
  moves the fingerprint leaf: four literals, one script), screenshots at the lowest
  graphics preset, the iOS UA material-tier trap for mobile shots, the monolith ratchet,
  test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "09 Render: furnishing view,
  light rig, ghost"), and this file
- src/render/CLAUDE.md ("Module-first: pure core + thin painter", "World-entry prewarm",
  "GPU work: every new producer is a client of the scheduler", "Performance discipline"),
  docs/design/graphics-settings-fairness.md
- src/render/farm_patches.ts (FarmPatchVisuals: the throttled sync() keyed by a content
  signature, FarmPlotSource as the narrow input seam, FARM_PROGRAM_ANCHORS_NAME and
  FARM_PROGRAM_ANCHORS_LABEL, the FarmCompileGate type, the FAIRNESS note),
  src/render/farm_patches_core.ts, src/render/gated_scene_attach.ts
  (attachSceneGroupGated, GATED_ATTACH_WATCHDOG_MS), src/render/background_gpu_queue.ts
  (GPU_WORK_PRIORITY), src/render/entity_gate_stand_in_core.ts (ENTITY_GATE_STAND_INS),
  src/render/point_light_budget.ts (reconcileViewPointLights, applyPointLightBudget,
  countDrawnPointLights, pointLightPadCount), src/render/dungeon.ts
  (DungeonInteriors.buildInterior, the DungeonInteriorVariant union, the gated attach),
  src/render/dawnhold_dressing.ts and the Phase 06 dressing module under
  src/render/freehold/, src/render/renderer.ts (the proximity build loop around
  builtInteriors, retireInteriorGroup, setGroundAimReticle, where FarmPatchVisuals is
  constructed and synced per frame), src/render/ground_aim_reticle_visual.ts and
  ground_aim_reticle_core.ts (GroundAimReticleView: point, radius, dimmed, blocked),
  src/render/placed_assets.ts (ONLY the loader-cached template and clone idiom and
  TARGET_HEIGHT normalisation; it is NOT a scheduler client and its terrain seating is
  wrong indoors: do not copy its attach), the loader under src/render/assets/ (loadGltf)
- src/sim/content/freehold/layouts.ts (COTTAGE_LAYOUT, INN_ROOM_LAYOUT per D23) and
  src/sim/dungeon_layout.ts (the helpers: authoredLiftAt, DUNGEON_FLOOR_Y),
  src/sim/freehold/layout_core.ts (cell and yaw math to reuse for the
  seat), src/sim/content/freehold/furnishings.ts (the model key and family per def),
  src/world_api/housing.ts (freeholdLayout, myFreehold), src/game/ui_effects_profile.ts
- tests/architecture.test.ts (RENDER_PURE_CORES and the on-disk sweep),
  tests/renderer_compile_gate.test.ts (the buildInterior gating pin),
  tests/ability_material_prewarm_sweep.test.ts, tests/defer_launcher_preloads.test.ts,
  tests/entity_gate_stand_in.test.ts, tests/point_light_budget.test.ts,
  tests/farm_patches_core.test.ts, tests/farm_patches_adapter.test.ts,
  tests/eastbrook_polish_capture_contract.test.ts and
  tests/eastbrook_polish_artifact_integrity.test.ts (the four renderer.ts fingerprint
  literals), scripts/assets/eastbrook_grand_armoury/remint_polish_provenance.mjs,
  scripts/perf_tour.mjs, scripts/pr_shot_targets.mjs, tests/monolith_budget.test.ts
  (renderer.ts at zero slack)
- Root CLAUDE.md "Modularity", "Invariants", and the graphics-neutral rule
The agent returns: the FarmPatchVisuals recipe reduced to its steps (source seam,
signature, gated attach with a label kind, program anchors, teardown); the compile-gate
and prewarm obligations for a group with new materials; the point-light budget entry
points and the LOW count; the reticle setter shape to copy for the ghost; the floor
seating constant and lift function; the renderer.ts extraction that pays for the two
new lines (construct, sync) and the Eastbrook re-mint procedure; the perf tour
invocation that walks the Cottage.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/architecture.test.ts RENDER_PURE_CORES, tests/monolith_budget.test.ts, the four
Eastbrook literals after the re-mint):
- Agent CORE: src/render/freehold/furnishing_layout_core.ts (pure, Three-free:
  furnishingSignature(rows) as the sync key, seatFurnishing(row, layout, def) as the
  interior floor constant plus the authored lift plus the def's lift, yaw in radians,
  a diff planner returning add, move, and remove sets between two row lists), the
  RENDER_PURE_CORES registration, tests/furnishing_layout_core.test.ts (signature
  stability and change, seat math per room lift, yaw wrap, the diff planner's three sets
  with negatives).
- Agent VIEW: src/render/freehold/furnishing_models.ts (ONE registry from furnishing
  model key to a builder: the stand-in kit as a small procedural set keyed by furnishing
  FAMILY, and a GLB path slot Phase 19 fills; templates loader-cached once, cloned per
  placement), src/render/freehold/furnishings.ts (FurnishingVisuals on the FarmPatchVisuals
  recipe: a FurnishingSource { freeholdLayout, cfg.seed }, throttled sync() keyed by the
  signature, every group through attachSceneGroupGated with a freehold-furnishing label
  kind, hidden program anchors so its programs never leave the retained FIFO, clones
  seated by the core, torn down when the layout goes null, an ENTITY_GATE_STAND_INS row
  for anything held back), the two renderer.ts lines (construct beside FarmPatchVisuals,
  sync per frame) paid by an extraction with a lowered renderer.ts ceiling, the
  tests/renderer_compile_gate.test.ts arm, tests/furnishing_visuals.test.ts (the adapter
  suite on the farm_patches_adapter model: sync elides when the signature is unchanged,
  add/move/remove reach the scene through the gate, teardown disposes nothing shared).
- Agent LIGHT+GHOST: src/render/freehold/interior_light_rig.ts (the hearth point light
  plus at most two more, reconciled through point_light_budget.ts so LOW draws three at
  most; never adds or removes a directional, hemi, spot, or rect light after boot;
  attached with the interior dressing, retired with it), src/render/freehold/furnishing_ghost_visual.ts
  (a rotation-aware footprint over the ground_aim_reticle idiom: valid and blocked
  states, draws at EVERY graphics tier, driven by renderer.setFurnishingGhost(view |
  null) beside setGroundAimReticle; its pure state in a furnishing_ghost_core.ts
  registered in RENDER_PURE_CORES), tests/interior_light_rig.test.ts (the LOW count,
  budget reconciliation, no boot-light mutation), tests/furnishing_ghost_core.test.ts
  and tests/furnishing_ghost_visual.test.ts (blocked paints refusal at every tier;
  identical input elides work).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The renderer reads IWorld and never mutates it; the view is a pure function of the
  descriptor, so both hosts draw the same house from the same rows.
- Every GPU producer is a client of the scheduler: no bare scene.add of a group carrying
  new materials after boot; the view attaches through attachSceneGroupGated and keeps
  program anchors; point lights ride point_light_budget.ts; no new queue or lane.
- Graphics settings are gameplay-neutral: the ghost, its blocked state, and the plot
  bounds draw at every tier and never read the FPS governor.
- Per-frame discipline: sync elides all work when the signature is unchanged; no
  per-frame allocation on the unchanged path.
- Pure core plus thin painter: decision logic in registered *_core.ts modules; the
  painters hold Three only.
- i18n: the policy in docs/freeholds/implementation-plan.md; render adds no string.
- Monolith ratchet: src/render/renderer.ts sits at ZERO slack; the two lines are paid
  for by an extraction, then LOWER the ceiling; any byte in renderer.ts owes the
  Eastbrook re-mint in its own commit.
- The dependency set stays tiny: no new packages.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Runtime colliders (Phase 10); build mode input, the strip, the palette, and anything
  that CALLS setFurnishingGhost (Phase 11).
- The real furnishing and trophy GLBs (Phase 19): stand-ins only, behind the registry.
- Trophy props on plinths (Phase 17), the Kitchen Garden tableau (Phase 24), dye slots
  (Phase 41), the feast hall dressing.
- Any change to the interior shell built in Phase 06 beyond attaching the light rig.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/furnishing_layout_core.test.ts
  tests/furnishing_visuals.test.ts tests/interior_light_rig.test.ts
  tests/furnishing_ghost_core.test.ts tests/furnishing_ghost_visual.test.ts
  tests/architecture.test.ts tests/renderer_compile_gate.test.ts
  tests/ability_material_prewarm_sweep.test.ts tests/defer_launcher_preloads.test.ts
  tests/entity_gate_stand_in.test.ts tests/point_light_budget.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/monolith_budget.test.ts tests/eastbrook_polish_capture_contract.test.ts
  tests/eastbrook_polish_artifact_integrity.test.ts`.
- `npm run perf:tour` walking into the Cottage offline (the /dev freehold cottage grant
  under ALLOW_DEV_COMMANDS=1 with a few stand-ins placed): zero live-program events in
  perfStats().gpuPrep; record the tour output path in progress.md.
- The client gate: `node scripts/pr_screenshots.mjs` before and after (desktop plus the
  compact and tablet mobile boxes, lowest graphics preset seeded, Android emulation for
  the mobile shots) through the pr-screenshots skill; commit under docs/screenshots/ and
  note the paths for the wave PR body.
- If renderer.ts changed: run the Eastbrook re-mint script and update the four pinned
  literals in their own commit.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  render-performance-reviewer (the gated attach, program anchors, light budget, the
  tour evidence) and frontend-seam-reviewer (pure-core registration, tier fairness, the
  painter split). Prompt each for COVERAGE not filtering; each writes its report to a
  file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(render): add the furnishing layout core and the furnishing view behind the compile gate
- feat(render): add the freehold interior light rig under the point-light budget
- feat(render): add the furnishing placement ghost visual and its renderer setter
- chore(render): re-mint the Eastbrook polish provenance after the renderer change
- docs(screenshots): capture the Cottage furnishing view on desktop and mobile
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] FurnishingVisuals syncs from IWorldHousing.freeholdLayout on both hosts, attaches
  every group through attachSceneGroupGated with program anchors, and tears down on
  leave (tests/furnishing_visuals.test.ts plus the compile-gate arm).
- [ ] Every furnishing def in src/sim/content/freehold/furnishings.ts resolves to a
  stand-in through furnishing_models.ts (a sweep test over the content table).
- [ ] The light rig draws at most three point lights at LOW and mutates no boot light
  (pinned); the ghost paints valid and blocked at every tier (pinned).
- [ ] furnishing_layout_core.ts and furnishing_ghost_core.ts are in RENDER_PURE_CORES and
  Three-free (tests/architecture.test.ts).
- [ ] `npm run perf:tour` through the Cottage reports zero live-program events; the
  output is recorded in progress.md.
- [ ] Screenshots committed under docs/screenshots/ (desktop, compact, tablet) and their
  paths recorded for the wave PR body.
- [ ] All STEP 3 suites green; both reviewers report no BLOCKING; the renderer.ts
  ceiling is LOWER than before and the Eastbrook literals are re-minted.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 09, the tour evidence path, the
  screenshot paths, deferrals) and docs/freeholds/state.md (the per-phase ledger row 09:
  new files, the renderer setter name, the label kind, the registry name Phase 19 fills).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-09-qa.md

STOPPING RULES:
- Stop and ask if the view cannot attach through the existing gate without a new lane or
  queue, or if the hearth needs a light kind the budget does not manage.
- Stop and ask if the offline tour shows a live-program event the gate cannot absorb.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
