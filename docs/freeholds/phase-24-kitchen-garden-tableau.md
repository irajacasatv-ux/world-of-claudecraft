# Phase 24: Kitchen Garden tableau

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "24
Kitchen Garden tableau"; the decisions are `state.md` (the Kitchen Garden plants nothing:
zero beds) and `brainstorm.md`. This phase ships `garden_view.ts` (a pure projection over
the account owner's bounded farm-source aggregate through unchanged growth/status functions), the Harvest
Journal board prop, the farmer NPC as the Steward's flavor (no vendor, no service), and
the render tableau at the Cottage and Lodge garden anchors. It adds no bed, no crop, and
no farming rule; the farming calendar model stays pinned exactly as it is.

## Settled delivery and acceptance contract

Follow docs/freeholds/ux-spec.md as the visual and interaction source. Reuse the actual
shared window and PainterHost families, theme tokens, content-signature dirty model,
focus restoration and nontrapping build companion. Every player string is an English
hudChrome.housing.* key (item/entity/guide source domains keep their canonical keys);
tooltips follow docs/design/tooltip-writing.md. Capture desktop, compact and tablet
targets from the shared housing helper with stable IDs at LOW, including empty,
loading, refused, locked, visitor, reconnect and success states relevant here. Required
after-shots fail if missing. Use shape/text as well as color for actionable state;
40x40 touch controls respect safe areas, keyboard/gamepad order and reduced motion.
Three authored emitters is a ceiling subject to the existing light sink/global budget,
including iOS two and pressure one; unchanged ghost, blocked reason and occupancy
information must remain legible through ambient grade, materials and silhouettes.

## Deliverables (at most five):

1. Bounded shared account-owner farm source with explicit freshness.
2. Single safe public owner-garden projection with private fields excluded.
3. Current-character owner-only Harvest Journal board and flavor NPC.
4. Final measured garden tableau and prop art.
5. Zero-bed, source-authority, privacy, fairness and interaction evidence, with the
   registered garden screenshot target and regenerated key/shot manifests (D92).

## Account-owner garden source and freshness contract

D52/R26 uses all eligible characters of the home's owning account. The exported src/world_api/farming.ts::IWorldFarming interface and its myFarmPlots
member, together with src/sim/professions/farm_projection.ts, describe
current-character PlayerMeta.farmPlots/save projections; neither is an account-owner
aggregate. The verified source fact is recorded in state.md. Never read the visitor's
myFarmPlots or choose an arbitrary primary character.

Reuse the NEW 17-owned shared account-source boundary:
server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage and
server/freehold_account_sources.ts::createFreeholdAccountSourceLoader. This file adds
fixed versioned static farmPlots and farming-proficiency extraction to that projection,
including the existing legacy skill fallback semantics. Keep hidden survival/yield data
server-side only where the existing projectFarmPlots status derivation needs it. Do not
call listCharactersAllRealms or SELECT whole character state. Keyset pages by character
id, scoped to the account; measure the candidate (account_id, id) access index, exact
rows/bytes/query limits and multi-realm character cardinality in MEASURE-BOUNDS. The
existing per-realm character cap is not an account-global cap. No SQL runs per growth
step, render frame, descriptor snapshot, visitor or farm bed.

Aggregate with internal (sourceCharacterId, bedId) identity so two owner alts with the
same bed ID remain distinct. A currently authoritative, generation-fenced local Sim
source supplies that character's farm map and farming skill and replaces its ENTIRE
saved slice, including an empty map after harvest. Foreign/nonlocal sources remain
saved snapshots. Compute stage/status with the unchanged projectFarmPlots,
farmGrowthStage and host farm-clock contract; time-derived stage changes do not make
a saved source live and never imply remote unflushed plant/harvest/skill changes are
known. No farm rule, slot, crop, water/harvest action or extra bed is introduced.

Use 17's bounded keyed single-flight cache, shared admission, cancellation, freshness
and refresh/invalidation owner so trophy and garden readers join the same page flight.
On a relevant successful local plant/harvest/dev farm change, farming-proficiency change,
committed changed-source save/create/delete, or session load/leave/takeover, install an
available committed source slice with a generation fence or invalidate its account/source
epoch. Coalesce to one dirty account refresh; an unrelated position/gear autosave does
not invalidate the garden. A late page cannot resurrect harvested, deleted or replaced
source data. Cross-process commits use 17's bounded refresh/invalidation mechanism;
without live source transport they remain honestly saved. This file adds no poller,
per-visitor listener, full-account reload per save or second account-source cache.

The descriptor explicitly picks opaque visualId, bedId, cropId, stage, status and
live/saved/unavailable freshness, sorted by the stable source-qualified internal key.
Opaque visualId must not encode a character/account ID. Exclude raw source identities,
observation timestamps (the source page's read and fence stamps), the crop's own
plantedAtMs/readyAtMs, skill, private timers, hidden slots and survivalRoll/yieldSeed
from both owner and guest wire. Because public rows carry stage without any timestamp,
growth between descriptor emits follows one time-driven rule on both hosts: the
existing 1 Hz farm tick sweep (updateFarming in src/sim/professions/farming.ts, the
sweep that already calls notifyFarmReady) re-runs projectGardenTableau over each live
claimed plot's available source and re-emits the garden block only when the projected
rows' signature changes at a stage or status boundary; never per tick, never per frame,
never a poller, with zero SQL and no extra source query. The offline host renders from
the same pure projection on the same sweep, so both hosts advance a sprout at the same
boundary. Public rows are the same owner-derived tableau for all
viewers. Empty is valid only after a complete successful source read proves no plots;
incomplete/over-budget/failed source is explicitly unavailable or incomplete, never
false empty, first-character-only or a visitor's replacement garden. Use ux-spec's
keyed loading/empty/saved/unavailable states and screenshot these at LOW.

The owner action opens the CURRENT CHARACTER's existing private Harvest Journal;
account aggregation grants no ability to open another alt's journal. Guests have no
journal action and only inspect the public owner tableau. Offline/headless adapters
use their actual available owned-character sources without pretending to load online
account data; an unavailable account source is explicit and never another player's.

Paired QA proves two owner alts with conflicting crops in the same bed IDs, concurrent
sessions, unrelated visitor farms, owner offline, remote saved snapshots, skill-derived
ready/withered status, successful empty after harvest, reconnect/takeover, stale page
completion after delete/harvest, missing and over-budget pages, and exact public key sets.
Assert no SQL during growth/render/snapshot and bounded shared flight/query counts with
concurrent trophy/garden viewers. Run disposable-Postgres static projection/keyset/index
fixtures, including multi-realm accounts, plus before/final database-performance,
persistence and privacy-security review. Captured original stored rows remain untouched.

## Exact garden string and source-state acceptance

Use the canonical ux-spec.md garden mapping below. These are approved future English
hudChrome.housing.garden.* sources, not a claim that an unbuilt runtime tooltip ships
now. Implement the matching source predicate and rendered tooltip together, following
docs/design/tooltip-writing.md. No separate synonym keys or timer-bearing fallback.

| Key | Exact English |
| --- | --- |
| hudChrome.housing.garden.title | Kitchen Garden |
| hudChrome.housing.garden.loading | Loading the garden... |
| hudChrome.housing.garden.empty | No garden beds are recorded. |
| hudChrome.housing.garden.live | Current garden |
| hudChrome.housing.garden.saved | Saved garden |
| hudChrome.housing.garden.mixed | Some beds use saved records. |
| hudChrome.housing.garden.incomplete | Some garden beds could not be loaded. |
| hudChrome.housing.garden.unavailable | The garden is unavailable right now. |
| hudChrome.housing.garden.openJournal | Open {journal} |
| hudChrome.housing.garden.liveTooltip | These beds use their owner's current garden records. |
| hudChrome.housing.garden.savedTooltip | These beds use saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.mixedTooltip | Some beds use current records and others use saved records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.savedStatus | {status} (saved) |
| hudChrome.housing.garden.savedReadyTooltip | This bed appears ready from saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.journalTooltip | Open your current character's {journal}. |
| hudChrome.housing.garden.growing | Growing |
| hudChrome.housing.garden.board | Harvest Journal board |

Resolve {journal} through existing hudChrome.harvestJournal.title. Resolve ready and
withered status through existing hudChrome.harvestJournal.ready and
hudChrome.harvestJournal.withered. Growing uses hudChrome.housing.garden.growing;
never use hudChrome.harvestJournal.growing because that source contains a private timer.
No timestamp, hidden farm data or raw source identifier enters a placeholder. The
board's templateId `harvest_journal_board` resolves its display name through the
feast_title templateId map to hudChrome.housing.garden.board, never a raw English name
on the wire. The board row is new in this phase, so append it to ux-spec section 10 and
regenerate ux-key-manifest.json in the same change (D92); the other rows are already
section 10 rows.

Apply aggregate source-state precedence from the shared loader result: before any
result use loading; whole-source failure uses unavailable; any incomplete coverage
uses incomplete while retaining only honest known rows; complete zero rows uses empty;
complete nonempty all-live/all-saved/mixed coverage uses live/saved/mixed respectively.
An empty local replacement after harvest does not erase another owner's-character slice,
and an unavailable page can never produce confirmed complete-empty. All viewers see
the same owner-derived source state; only the current character owner gets openJournal
with journalTooltip and the existing private Journal action.

Each saved row ALWAYS wraps its localized status in savedStatus, including accessible
text and a saved-ready glow. A saved ready row also uses savedReadyTooltip; the ready
appearance cannot imply that remote unflushed changes are current. Live, saved and mixed
aggregate labels use their matching explanatory tooltips. Incomplete/unavailable state
does not expand Journal authority or introduce any harvest control. Existing current-character
Journal admission is independent of the public aggregate status; privacy rules still apply.

Decisive rendered fixtures cover initial loading, complete empty, wholly live, wholly
saved, mixed live/saved, partial/incomplete and failed/unavailable sources. Independently
pin a saved ready row's visual label, tooltip and accessible name, timer-free growing,
localized {journal}/{status} values and the owner-current-character versus guest action.
Assert the exact public descriptor key set, no private sentinel in DOM/accessibility or
placeholders, and no empty fallback on missing pages. Capture these states in the later
wave B acceptance evidence at desktop, compact and tablet sizes at LOW. The canonical UX
manifest owns target identities, so this phase registers them rather than inventing an
alias: append the NEW `housing-garden` target (the scenes
garden-{live,saved,mixed,incomplete,unavailable,empty,loading}-{owner,guest} x
desktop/compact/tablet, 42 variants, the 408 milestone) to ux-spec section 11
(housingReviewTargets) and regenerate
ux-shot-manifest.json in the same change (D92); the seven wave A targets are unchanged,
and 27 captures only registered keys.

## Required Codex asset execution

Every step in this file that creates or replaces a GLB, icon, image, texture, reference
sheet, room/interior or trophy/furnishing art must be executed by Codex, not Claude.
Use the repository image-to-GLB and image-generation workflows, approved art-brief.md,
measured model manifests, export/optimization/fingerprint/prewarm and in-game proof.
The paired QA verifies the asset-generating step used Codex and all final-art evidence.
If a QA fix creates or replaces an asset, that fix step also runs in Codex, not Claude.
Final wave acceptance still requires complete shipping art. The final Codex placeholder
icon/image sweep in 44a verifies and replaces any feature-created remnants; it does
not excuse an earlier incomplete paid product or relax an earlier final-art gate.
This packet is documentation only; no shipping asset is generated by this audit.

### Starter Prompt
```
This is Phase 24 of the Freeholds and Guildhalls feature: the Kitchen Garden tableau
(the garden projection over the account owner's authoritative or saved farm sources, the Harvest Journal board, the
farmer NPC, the render tableau at the garden anchor).

Harness: Codex, not Claude (D74): all asset generation must be done by Codex. Follow the
root CLAUDE.md "Working style by model capability" block for effort and fan-out; this
prompt names no model.
ULTRACODE: not needed for this phase (three small slices over known seams).

Goal: show the account owner's farm beds inside the freehold with truthful source freshness
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
- Gotchas scan (Codex has no memory step): state.md "Gotchas (read before the matching
  phase)" entries on the monolith ratchet, the farming calendar model (bed counts are a
  pacing budget), the hidden-slot wire leak pin, the render scheduler rules, test-pin
  traps, the offline clock-base contract.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "24 Kitchen Garden
  tableau"), and this file
- src/sim/professions/farm_projection.ts (PlotState, FarmPlotView, farmPlotStatus,
  projectFarmPlots, farmGrowthStage, EMPTY_FARM_PLOT_VIEWS), src/sim/content/farm_patches.ts
  (FARM_PATCHES, FARM_BED_IDS: the bed roster this phase must NOT grow),
  src/sim/professions/farming.ts (FARMING_GAIN_SCHEDULE, the header),
  tests/helpers/farming_calendar_model.ts, src/ui/hud/professions/harvest_journal_view.ts
  and harvest_journal_window.ts (the Harvest Journal core and painter over myFarmPlots)
  and the src/ui/hud.ts openHarvestJournal open path (src/sim/professions/harvest_yields.ts
  is the unrelated corpse-harvest yield ledger)
- src/world_api/farming.ts (IWorldFarming: myFarmPlots, farmNowMs, the clock-base
  contract), src/world_api/housing.ts, src/net/online.ts (the fplot mirror),
  server/farming_commands.ts (appendFarmPlotsWire), tests/snapshots.test.ts (the fplot
  hidden-slot leak pin and ALL_DELTA_KEYS)
- src/sim/freehold/ (types.ts, instance.ts, amenities.ts for the interactable spawn
  recipe, the descriptor emitter, CLAUDE.md), src/sim/content/freehold/layouts.ts (the
  Cottage and Lodge garden anchor keys, D23), src/sim/content/freehold/dungeons.ts (the
  npcs list on a DungeonDef),
  src/sim/entity.ts (createGroundObject, createNpc, respawnTimer = Infinity),
  src/sim/types.ts (NpcDef: the required `questIds: string[]` the new def sets to `[]`,
  and the optional `farmer`, vendorItems, banker, market, cardMaster and dynamic fields
  it must omit),
  src/sim/professions/farmer_npcs.ts (isFarmerNpcEntity, nearFarmerNpc), src/sim/data.ts
  (the NPCS merge)
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
and schedule pins that must stay byte-identical; the 17-owned account source loader,
its bounded static farm/skill extraction and generation invalidation; the account aggregate
and exact safe public fields/freshness from the settled contract above; the interactable spawn recipe from amenities.ts
and the NPC spawn shape; the crop kit meshes and the fairness rule; the interact funnel
shape; the extraction candidates that pay for any coordinator line.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/world_api_parity.test.ts
if a member changes, tests/snapshots.test.ts, tests/monolith_budget.test.ts, goldens):
- Agent SOURCE: extend the exact 17-owned loader and fixed projection above with
  normalized farm maps and farming proficiency, whole-character authoritative overlays,
  shared bounded invalidation and explicit freshness. Own source/DB/PG/query-count tests;
  preserve stored payloads and farming rules. No second cache or independent query loop.
- Agent SIM: src/sim/freehold/garden_view.ts (a pure leaf, no sim_context import:
  NEW projectGardenTableau consumes the normalized source-qualified account rows and
  host farm clock, returning only the allowlisted public fields/freshness above with
  stable compound-source order and a frozen EMPTY only for complete successful emptiness);
  the owner-derived public garden block rides the descriptor for everyone, so both
  hosts use the same pure projection over their explicit available source; the Harvest Journal
  board as a `kind: 'object'` interactable spawned on claim at the garden anchor
  (templateId `harvest_journal_board`, lootable false, respawnTimer Infinity, appended to
  the claim's objectIds so free tears it down); the farmer NPC as a DungeonNpcSpawn on
  the Cottage and Lodge defs whose NpcDef is NEW (templateId `freehold_farmer`, in NEW
  src/sim/content/freehold/npcs.ts merged into NPCS by src/sim/data.ts beside the zone
  tables): greeting and the required `questIds: []` only, with NO `farmer` flag (a
  farmer-flagged def would open the husk-to-compost trade and its gossip row at home)
  and none of the optional vendorItems, banker, market, cardMaster or dynamic fields,
  so no vendor row and no gossip service; the zero-bed pin
  (garden_view imports farm_projection only, never farm_patches; FARM_BED_IDS and
  FARMING_GAIN_SCHEDULE literals unchanged in their suites); tests/freehold_garden_view.test.ts,
  including the negative farmer pin (NPCS.freehold_farmer.farmer is undefined,
  isFarmerNpcEntity(npc) is false and convertHusks refuses 'no_farmer' inside the plot
  with the NPC spawned) and the idle stage-boundary case (a claim idles across a stage
  boundary with no farm command and the projected stage advances on both hosts with zero
  SQL and no extra query).
- Agent RENDER: src/render/freehold/garden_tableau.ts (a FarmPatchVisuals-shaped
  painter over the garden rows keyed by a content signature, crop meshes from the farm
  patch kit, ready glow and withered warning drawn at EVERY tier per the farm_patches.ts
  FAIRNESS note, attachSceneGroupGated with program anchors, torn down on leave) with
  its pure core in RENDER_PURE_CORES; the board and farmer props through the registry
  with prewarm homes; the interact funnel row opening the existing Harvest Journal
  only for the owner and current character; guests inspect the read-only owner tableau (measured with the sim's own distance); the
  tests/renderer_compile_gate.test.ts arm; `npm run perf:tour`.
- Agent CONTENT: the garden anchors on the Cottage and Lodge layouts (decor keys with
  measured r for the board and the beds' tableau footprint), the src/ui/world_entity_i18n.ts
  row for the farmer NPC (English name: Farmer), the board's feast_title templateId map
  row to hudChrome.housing.garden.board pinned both directions, the
  hudChrome.housing.garden.* English keys (the table above, appended to ux-spec section 10
  with ux-key-manifest.json regenerated), the `housing-garden` section 11 target with
  ux-shot-manifest.json regenerated, `npm run wiki:content` plus a spoiler-safe guide.*
  key ("your beds, shown at home; nothing grows here").
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
- Never sell power: the tableau is display; the farmer NPC sells nothing, grants
  nothing and carries no `farmer` flag (no husk trade, no farmer gossip at home); no
  buff, no gathering number, no shortcut.
- Render: the painter is a scheduler client; the fairness rule (ready and withered
  states at every tier); the point-light budget unchanged.
- Content obligations in the SAME change: world-entity names, the title map pin, wiki
  regen plus guide keys; no item, so no WebP, deed, or Reliquary obligation unless a
  Homesteader deed is added (then append at the END of deeds.ts and re-pin).
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; a
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
  tests/pr_shot_targets.test.ts tests/localization_fixes.test.ts`; `npm run wiki:content`
  then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run perf:tour`; parity goldens regenerated in
  their own commit if the descriptor emit changed.
- Required reviewers: architecture-reviewer, render-performance-reviewer, content-obligations-reviewer, frontend-seam-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, database-performance-reviewer, migration-safety, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Run the extended 17 account-source loader suites and disposable PostgreSQL twins
with TEST_DATABASE_URL armed, plus the exact source/freshness/query-count evidence above.
Shared pre-merge bar: node scripts/gate_select.mjs (or deeper npm run gate); record
the exact exit. ci:changed is additional evidence, never its substitute.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): project the owner's farm plots into the Kitchen Garden tableau
- feat(render): draw the Kitchen Garden tableau and the Harvest Journal board
- feat(content): add the farmer NPC and the garden anchors to the Cottage and Lodge
- test(sim): pin the zero-bed rule against the farming calendar model
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_garden_view.test.ts proves the tableau rows equal the complete approved account-owner source
  one to one (none added or dropped), preserve same-bed alts through source-qualified
  identity, expose only safe public fields/freshness, and use EMPTY only for proven
  complete emptiness; missing/incomplete sources are unavailable; an idle claim crossing a
  stage boundary with no farm command advances the projected stage on both hosts with zero
  SQL and no extra query. garden_view imports no content table.
- [ ] tests/professions_farming.test.ts and tests/professions_zone_rollout.test.ts are
  unchanged (git diff shows no edit) and green; FARM_BED_IDS literal count unchanged.
- [ ] The owner board opens the current character's existing Harvest Journal on both hosts; a guest
  sees only the owner tableau and cannot open private journal controls; the farmer NpcDef
  has no `farmer` flag, no vendor row and no service: NPCS.freehold_farmer.farmer is
  undefined, isFarmerNpcEntity is false and convertHusks refuses 'no_farmer' inside the
  plot (the negative pin).
- [ ] The tableau renders growth, ready, and withered states at LOW and at the top
  preset (the fairness pin); `npm run perf:tour` shows no live-program event;
  ux-key-manifest.json carries the board row and ux-shot-manifest.json the
  `housing-garden` garden-{live,saved,mixed,incomplete,unavailable,empty,loading}-{owner,guest}
  variants in this phase's commits (D92).
- [ ] All STEP 3 suites green; the reviewers confirm ALL findings, including nits, are resolved and freshly reviewed; the ceilings did not
  rise.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 24, notes, named unsigned release gates) and
  docs/freeholds/state.md (the per-phase ledger row 24: new files, descriptor fields,
  the entity template ids, i18n keys; the owner-versus-descriptor projection decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-24-qa.md

STOPPING RULES:
- Stop and ask if the tableau would need a bed, a crop, a knob, or a schedule value to
  change (the calendar model is a protected asset; the answer is no).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
