# Phase 24: the Kitchen Garden tableau

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "24
Kitchen Garden tableau"; the decisions are `state.md` (the Kitchen Garden plants nothing:
zero beds) and `brainstorm.md`. This phase ships `garden_view.ts` (a pure projection over
the owner's real `myFarmPlots` through `farmGrowthStage` and `status`), the Harvest
Journal board prop, the farmer NPC as the Steward's flavor (no vendor, no service), and
the render tableau at the Cottage and Lodge garden anchors. It adds no bed, no crop, and
no farming rule; the farming calendar model stays pinned exactly as it is.

### Starter Prompt
```
This is Phase 24 of the Freeholds and Guildhalls feature: the Kitchen Garden tableau
(the garden projection over the owner's real farm plots, the Harvest Journal board, the
farmer NPC, the render tableau at the garden anchor).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three small slices over known seams).

Goal: show the owner's real farm beds growing inside the freehold as a living tableau
(growth stage, ready glow, withered warning, the Harvest Journal on a board, a farmer
NPC for flavor) while adding zero beds and touching no farming number.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, the farming calendar model
  (bed counts are a pacing budget), the hidden-slot wire leak pin, the render scheduler
  rules, test-pin traps, the offline clock-base contract.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "24 Kitchen Garden
  tableau"), and this file
- src/sim/professions/farm_projection.ts (PlotState, FarmPlotView, farmPlotStatus,
  projectFarmPlots, farmGrowthStage, EMPTY_FARM_PLOT_VIEWS), src/sim/content/farm_patches.ts
  (FARM_PATCHES, FARM_BED_IDS: the bed roster this phase must NOT grow),
  src/sim/professions/farming.ts (FARMING_GAIN_SCHEDULE, the header),
  tests/helpers/farming_calendar_model.ts, src/sim/professions/harvest_yields.ts (the
  Harvest Journal source) and the HUD surface that shows it (grep harvest journal under
  src/ui/hud/professions/)
- src/world_api/farming.ts (IWorldFarming: myFarmPlots, farmNowMs, the clock-base
  contract), src/world_api/housing.ts, src/net/online.ts (the fplot mirror),
  server/farming_commands.ts (appendFarmPlotsWire), tests/snapshots.test.ts (the fplot
  hidden-slot leak pin and ALL_DELTA_KEYS)
- src/sim/freehold/ (types.ts, instance.ts, amenities.ts for the interactable spawn
  recipe, the descriptor emitter, CLAUDE.md), src/sim/content/freehold/layouts.ts (the
  Cottage and Lodge garden anchor keys, D23), src/sim/content/freehold/dungeons.ts (the
  npcs list on a DungeonDef),
  src/sim/entity.ts (createGroundObject, createNpc, respawnTimer = Infinity)
- src/render/farm_patches.ts (FarmPatchVisuals, the crop kit, the FAIRNESS note),
  src/render/farm_patches_core.ts (the sanctioned farmGrowthStage import),
  src/render/freehold/ (the dressing and furnishing painter), src/render/CLAUDE.md
  ("GPU work"), tests/farm_patches_core.test.ts, tests/farm_patches_adapter.test.ts
- src/game/nearby_interaction.ts and src/game/farm_bed_interact.ts (the interact
  funnel), src/ui/hud/professions/feast_title.ts and tests/entity_display_name.test.ts
  (the templateId title map pinned both directions), src/ui/world_entity_i18n.ts,
  src/ui/i18n.catalog/hud_chrome.ts
- tests/professions_farming.test.ts, tests/professions_zone_rollout.test.ts,
  tests/professions_farming_state.test.ts, tests/farm_ready.test.ts,
  tests/monolith_budget.test.ts, tests/renderer_compile_gate.test.ts
The agent returns: the projection functions and their exact signatures; the bed roster
and schedule pins that must stay byte-identical; whether the owner's plots already
reach the client (fplot) so the owner's tableau can project client-side, and what a
visitor would need (a garden block on the descriptor with explicit picks: bed id, crop
id, stage, status, never a hidden slot); the interactable spawn recipe from amenities.ts
and the NPC spawn shape; the crop kit meshes and the fairness rule; the interact funnel
shape; the extraction candidates that pay for any coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/world_api_parity.test.ts
if a member changes, tests/snapshots.test.ts, tests/monolith_budget.test.ts, goldens):
- Agent SIM: src/sim/freehold/garden_view.ts (a pure leaf, no sim_context import:
  `projectGardenTableau(plots: readonly FarmPlotView[], nowMs)` returning rows of bed
  id, crop id, stage via farmGrowthStage, and status, sorted by bed id, a frozen EMPTY
  singleton, explicit field picks); settle in STEP 1 whether the owner's client projects
  from its own myFarmPlots and only visitors need the descriptor garden block, or the
  block rides the descriptor for everyone (recommend the block for everyone so both
  hosts regenerate one tableau; record the choice in state.md); the Harvest Journal
  board as a `kind: 'object'` interactable spawned on claim at the garden anchor
  (templateId `harvest_journal_board`, lootable false, respawnTimer Infinity, appended to
  the claim's objectIds so free tears it down); the farmer NPC as a DungeonNpcSpawn on
  the Cottage and Lodge defs with no vendor row and no service; the zero-bed pin
  (garden_view imports farm_projection only, never farm_patches; FARM_BED_IDS and
  FARMING_GAIN_SCHEDULE literals unchanged in their suites); tests/freehold_garden_view.test.ts.
- Agent RENDER: src/render/freehold/garden_tableau.ts (a FarmPatchVisuals-shaped
  painter over the garden rows keyed by a content signature, crop meshes from the farm
  patch kit, ready glow and withered warning drawn at EVERY tier per the farm_patches.ts
  FAIRNESS note, attachSceneGroupGated with program anchors, torn down on leave) with
  its pure core in RENDER_PURE_CORES; the board and farmer props through the registry
  with prewarm homes; the interact funnel row opening the existing Harvest Journal
  surface from the board (measured with the sim's own distance); the
  tests/renderer_compile_gate.test.ts arm; `npm run perf:tour`.
- Agent CONTENT: the garden anchors on the Cottage and Lodge layouts (decor keys with
  measured r for the board and the beds' tableau footprint), src/ui/world_entity_i18n.ts
  rows for the farmer NPC and the board, the templateId title map row pinned both
  directions, hudChrome.housing.garden.* English keys, `npm run wiki:content` plus a
  spoiler-safe guide.* key ("your beds, shown at home; nothing grows here").
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Zero new farm beds: FARM_PATCHES, FARM_BED_IDS, and FARMING_GAIN_SCHEDULE are
  byte-identical; tests/professions_farming.test.ts and
  tests/professions_zone_rollout.test.ts unchanged and green; nothing in the house
  plants, waters, or harvests.
- Determinism: the projection draws no Rng; the wall clock enters only as nowMs through
  the facet's clock-base contract (housingNowMs and farmNowMs never subtract another
  clock).
- Hidden outcomes never cross the wire: survivalRoll and yieldSeed never appear in the
  garden rows (the fplot leak pin's exact key-set style, extended).
- Server authority and one sim: both hosts render one tableau from one projection.
- Never sell power: the tableau is display; the farmer NPC sells nothing and grants
  nothing; no buff, no gathering number, no shortcut.
- Render: the painter is a scheduler client; the fairness rule (ready and withered
  states at every tier); the point-light budget unchanged.
- Content obligations in the SAME change: world-entity names, the title map pin, wiki
  regen plus guide keys; no item, so no WebP, deed, or Reliquary obligation unless a
  Homesteader deed is added (then append at the END of deeds.ts and re-pin).
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any change to farming rules, crops, seeds, knobs, the watch fee, or feasts.
- Produce props and garden markers as furnishings (Phase 22 shipped them); the
  Harvestmaster sheaf and first-harvest markers (Phase 23); guild feast halls (Phase 30).
- A vendor, a service, or gossip that changes state on the farmer NPC.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_garden_view.test.ts tests/freehold_determinism.test.ts
  tests/professions_farming.test.ts tests/professions_zone_rollout.test.ts
  tests/professions_farming_state.test.ts tests/farm_ready.test.ts
  tests/farm_patches_core.test.ts tests/farm_patches_adapter.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/entity_display_name.test.ts
  tests/renderer_compile_gate.test.ts tests/dungeons.test.ts
  tests/localization_fixes.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run perf:tour`; parity goldens regenerated in
  their own commit if the descriptor emit changed.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (garden_view purity, the spawn recipe, determinism),
  render-performance-reviewer (the tableau painter, the props, the prewarm homes), plus
  cross-platform-sync if the descriptor gained the garden block (the dispatch table
  row). Prompt each for COVERAGE not filtering; each writes its report to a file. Do
  not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): project the owner's farm plots into the Kitchen Garden tableau
- feat(render): draw the Kitchen Garden tableau and the Harvest Journal board
- feat(content): add the farmer NPC and the garden anchors to the Cottage and Lodge
- test(sim): pin the zero-bed rule against the farming calendar model
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_garden_view.test.ts proves the tableau rows equal the owner's plots
  one to one (none added, none dropped), carry no hidden slot, sort by bed id, and are
  the frozen EMPTY singleton for no plots; garden_view imports no content table.
- [ ] tests/professions_farming.test.ts and tests/professions_zone_rollout.test.ts are
  unchanged (git diff shows no edit) and green; FARM_BED_IDS literal count unchanged.
- [ ] The board opens the existing Harvest Journal surface from inside the freehold on
  both hosts; the farmer NPC has no vendor row and no service (pinned).
- [ ] The tableau renders growth, ready, and withered states at LOW and at the top
  preset (the fairness pin); `npm run perf:tour` shows no live-program event.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 24, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 24: new files, descriptor fields,
  the entity template ids, i18n keys; the owner-versus-descriptor projection decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-24-qa.md

STOPPING RULES:
- Stop and ask if the tableau would need a bed, a crop, a knob, or a schedule value to
  change (the calendar model is a protected asset; the answer is no).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
