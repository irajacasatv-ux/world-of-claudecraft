# Phase 09: render (the furnishing view, the interior light rig, the placement ghost)

**Premise moved at the 2026-09-26 release sync (G7, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** camera-wall occlusion has a dithered ghost arm beside occluder_fade (name both), and Action Cam (default off) shifts pivot and FOV over director poses: state how 'hearthView' composes with it, and keep it off in capture rigs.

Wave A, the Cottage MVP. The spec is `progress.md` "09 Render: furnishing view, light
rig, ghost"; the decisions are `state.md` D4 (a descriptor both hosts regenerate)
and D13 (art gets stand-ins) and `state.md` "Seams and names" (Client). This phase ships
`src/render/freehold/furnishings.ts` (a `FarmPatchVisuals`-shaped per-viewer view synced
from `IWorldHousing.freeholdLayout` through the compile gate), `furnishing_layout_core.ts`
in `RENDER_PURE_CORES`, a stand-in kit behind one model registry the art phase later
fills, the interior light rig under the point-light budget, and the placement ghost
visual driven by a renderer setter. A placed furnishing is visible on both hosts; nothing
in the UI drives the ghost until Phase 11. This is a client phase: the client gate in
`implementation-plan.md` applies and screenshots go through the `pr-screenshots` skill.

## Exact interior capture producer (09, C04/F03)

This pair introduces scripts/lib/pr_shot_housing.mjs::housingReviewTargets and its
import/spread beside the 06 freeholdReviewTargets in scripts/pr_shot_targets.mjs.
Its twelve day/night interior variants join the nine functional gate/landing variants
from scripts/lib/pr_shot_freeholds.mjs (21 total). 11 extends the registry to 98, 16 reaches 187, 17 reaches 235,
18 reaches 339 and 20 verifies the complete wave A set (339 of the 742-variant program
inventory in ux-spec section 11; each later producer's close verifies its own
milestone). No unavailable build, Steward,
trophy or visiting UI is registered early. Counts derive from the UX manifest.

```js
import { housingReviewTargets, isHousingVisualPath } from './lib/pr_shot_housing.mjs';

// In TARGETS:
...housingReviewTargets({
  beforeLoad: lowGraphicsSeed,
  dismissOverlays: dismissEntryOverlays,
}),
```

Reuse the exact NEW helper-owned constructor and shared art selector from ux-spec.md
section 11. All named fixture helpers below are produced here; existing source commands
and getters remain source anchors. Baseline mobile captures are Chromium with the
runner's default iPhone/iOS profile. 09 implements only the functional interior fixture
arms; later producers extend the same exhaustive scene dispatch instead of registering
inert cases. Future-only helper constants are introduced when their consumer ships.

```js
const housingInteriorScenes = [
  'interior-inn-day', 'interior-inn-night',
  'interior-cottage-day', 'interior-cottage-night',
];
const housingViews = [
  { key: 'desktop', width: 1600, height: 900, mobile: false },
  { key: 'compact', width: 874, height: 402, mobile: true },
  { key: 'tablet', width: 1180, height: 820, mobile: true },
];

function housingVariants(scenes, options = {}) {
  const {
    views = housingViews, theme = 'classic', graphics = 'low',
    motion = 'normal', input = 'pointer', surface = 'web',
    light = 'normal', forcedColors = 'none',
  } = options;
  return scenes.flatMap((scene) => views.map((view) => ({
    key: [scene, view.key, theme, graphics, motion, input, surface, light,
      forcedColors].join('-'),
    scene, view: view.key, theme, graphics, motion, input, surface, light,
    forcedColors,
    ...(view.mobile ? {
      mobile: true, viewport: { width: view.width, height: view.height },
    } : {}),
    async beforeLoad(page) {
      if (!view.mobile) {
        await page.setViewport({ width: view.width, height: view.height });
      }
      await beforeLoad(page);
      await housingSeedVariant(page, {
        scene, view: view.key, theme, graphics, motion, input, surface, light,
        forcedColors,
      });
    },
  })));
}

```

```js
const housingVisualWhen = [
  'src/render/freehold/furnishings.ts',
  'src/render/freehold/furnishing_layout_core.ts',
  'src/render/freehold/furnishing_models.ts',
  'src/render/freehold/furnishing_ghost_visual.ts',
  'src/render/freehold/interior_dressing.ts',
  'src/render/freehold/freehold_light_grade.ts',
  'src/sim/content/freehold/layouts.ts',
  'src/sim/content/freehold/furnishings.ts',
  'scripts/assets/freehold_basics/',
  'scripts/assets/freehold_crafted/',
  'scripts/assets/freehold_dressing/',
  'scripts/assets/freehold_trophies/',
  'scripts/assets/specs/freehold_basics.json',
  'scripts/assets/specs/freehold_crafted.json',
  'scripts/assets/specs/freehold_dressing.json',
  'scripts/assets/specs/freehold_trophies.json',
  'public/models/props/freehold_',
  'public/ui/items/freehold_',
  'public/ui/items/pattern_freehold_',
  'public/ui/items/mapping.json',
  'src/render/assets/manifest.generated.ts',
  'docs/freeholds/art/',
  'src/styles/components.css',
  'src/styles/hud.css',
  'src/styles/hud.mobile.css',
  'scripts/lib/pr_shot_housing.mjs',
];
```

File 09 initially registers exactly the following descriptor instead of the later
build descriptor in ux-spec.md section 11 and phase-11-build-mode-ui.md. It uses the
same constructor, shared when inventory and target key. No other housing target is
registered in 09. File 11 replaces this descriptor's variants/capture with its
extended build definition; it does not append a duplicate target.

```js
{
  key: 'housing-build-mode',
  label: 'Housing interior day and night',
  when: [...housingVisualWhen],
  variants: housingVariants(housingInteriorScenes),
  capture: captureHousingInterior,
},
```

The exact callback uses NEW 09-owned fixture/assertion functions in that shared
helper and the actual runner's optional-clip return contract:

```js
async function captureHousingInterior(page, variant) {
  await prepareHousingInteriorFixture(page, variant);
  await assertHousingInteriorFixture(page, variant);
  return {}; // Full viewport; the runner writes one image after this returns.
}
// In 11's captureHousingBuild, before the build-only fixture path:
if (housingInteriorScenes.includes(variant.scene)) {
  return captureHousingInterior(page, variant);
}
```

prepareHousingInteriorFixture enters the real free Inn or permission-gated offline
Cottage, dismisses ordinary overlays, and settles into the measured static room
view without replaying a fresh camera/cue. It never opens or calls build UI. It sends
existing DEV commands /daynight moon half plus /daynight day or /daynight night
through the actual chat route, src/game/daynight_dev_command.ts::tryDayNightDevCommand.
It invents no clock storage key. assertHousingInteriorFixture checks actual tier,
scene and structural readiness, and checks src/render/day_night_clock.ts exports
dayNightPhaseOverride/currentDayNightPhase against the command's existing named
preset. The actual renderer grade/window/hearth/LOW fallback must match that state.
These existing source presets add no housing balance number. Overrides stay fixed
until the runner writes its image; normal per-variant page teardown clears them,
never cleanup before capture. The four scenes differ in actual layout and pinned
clock state, not just filenames. They show steady room art and remain distinct from
the visiting target's fresh-arrival/cue acceptance scenes.

09 also exports NEW isHousingVisualPath from that helper, derived from the single
housingVisualWhen inventory. The existing classifyDiff visual-path selection consumes
that predicate, alongside the target when-match path; no second path list or generic
all-asset fallback is added. 11 extends the same owner/inventory/tests when build UI
ships. Art-only diffs must select the functioning interior target already in 09.

09 extends tests/pr_shot_targets.test.ts with the exact twelve emitted keys, unique
one-image records and required art-path selection. Real browser proof must assert the
source tier/room/clock and resulting rendered grade before every capture; a relabeled
identical frame, side shot or cleared override before capture fails. A missing required
after-state throws. The paired QA checks this exact source block and executed captures.
This helper/capture evidence belongs to deliverable 5, not an additional output.

### Starter Prompt
```
This is Phase 09 of the Freeholds and Guildhalls feature: render (the furnishing view,
the stand-in kit, the interior light rig, the placement ghost).

Harness: Codex. Asset generation in this implementation (the sampled housing_arrival
cue and any generated image) must use Codex, not Claude (D74); code and review work
follows the active harness. Follow AGENTS.md and root/directory CLAUDE.md repository
contracts; use the active Codex model and the existing image/model/SFX pipelines,
provenance and quality gates. Claude-specific memory, Workflow and agent-runtime
instructions do not apply under Codex (AGENTS.md): use the equivalent Codex read-only
reader and reviewer roles wherever this prompt says Explore or review agent.

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
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- Gotchas scan (Codex has no Claude memory, AGENTS.md): read state.md "Gotchas" for
  the Eastbrook re-mint rule (ANY byte in renderer.ts moves the fingerprint leaf: four
  literals, one script), screenshots at the lowest graphics preset, the iOS UA
  material-tier trap for mobile shots, the monolith ratchet and the test-pin traps.

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
  builtInteriors, the PRIVATE retireInteriorGroup reached through the
  DelveInteriorTracker retire callback, setGroundAimReticle, and every FarmPatchVisuals
  site: the field, the construction, both per-frame drive sites and the
  stageProgramAnchors prewarm hook), src/ui/hud/action_bar/ground_aim_controller.ts
  (GroundAimReticleView: point, radius, school, dimmed, blocked),
  src/render/ground_aim_reticle_visual.ts (GroundAimVisualState: x, z, radius, color,
  dimmed, optional blocked), src/render/ground_aim_reticle_core.ts
  (GroundAimGeometryState and sameGroundAimGeometry),
  src/render/placed_assets.ts (ONLY the loader-cached template and clone idiom and
  TARGET_HEIGHT normalisation; it is NOT a scheduler client and its terrain seating is
  wrong indoors: do not copy its attach), the loader under src/render/assets/ (loadGltf)
- src/sim/content/freehold/layouts.ts (COTTAGE_LAYOUT, INN_ROOM_LAYOUT per D23) and
  src/sim/rift/authored.ts (authoredLiftAt), src/sim/dungeon_layout.ts (the lift
  consumer model), src/sim/data.ts (DUNGEON_FLOOR_Y),
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
seating constant and lift function; the renderer.ts extraction that pays for the at
least five new lines (the field, the construction beside FarmPatchVisuals, both
per-frame drive sites and the stageProgramAnchors prewarm hook) and the Eastbrook
re-mint procedure; the perf tour invocation that walks the Cottage.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. Identity-aware pure layout/diff core and scheduler-client furnishing view.
2. One model registry with prepared family stand-ins and safe future trophy forms.
3. The hearth/room condition and realm-daylight grade within the global light budget.
4. The shape-readable, tier-invariant placement ghost and its pure core/setter.
5. The safe first-arrival camera/sampled feedback composition and its tests/screenshots.

Consume ux-spec.md's first-moment and interior sections plus art-brief.md; every numeric
value comes from state or content-numbers-workbook.md. The art reference and measured
room path are the same in Inn and Cottage. The three authored emitters are a maximum,
never a promised three-light LOW allocation. Use the existing global light sink and
interior grade over boot-owned sun/hemi/environment lights; iOS/pressure reduction keeps
hearth/door/floor/plinth silhouettes legible through ambient/key grade and materials.
Realm-daylight changes the window grade, never floor/bounds/blocked-state visibility.
The hearth remains visibly readable at condition 100,30,29,0 and no warmth cue suggests
repossession. 13 supplies authority condition revisions; no render wall-clock derivation.

Extend this file's VIEW/CORE owners to include plotId/origin/claim epoch in signatures,
explicit uninitialized state and asynchronous prepare generations. A new consumer gets
its initial empty/revision 0 descriptor; swapping between identical row layouts in different
plots relocates/tears down correctly. Late GLB/preparation completion after leave or a
plot change cannot attach old content. Registry initialization completes before the first
sync; fallback and missing asset retain truthful shape/identity. Prepare a generic trophy
builder interface keyed by source/family for 17, with no unlocked trophy fabricated here.

The LIGHT+GHOST owner adds blocked outline, footprint hatch/cross and keyed reason data,
never red color alone. Reduced motion uses a static outline, with identical actionable
bounds/validity/selected item information at every preset. No per-frame allocations occur
when unchanged, and no cosmetic budget elides the ghost or its blocked explanation.
The ghost's footprint is a floor mesh, so it takes its renderOrder from the floor VFX
ladder (`floorVfxRenderOrder` in `src/render/floor_vfx_layer.ts`, from the release's
floor ladder, PR 4113), never a bare integer, and joins the band registry in
`tests/floor_vfx_layer.test.ts`. The ground-aim reticle it copies now sits on the
ladder's reticle band, whose pieces are additive; a normal-blended hatch picks its band
there, deliberately.

Add NEW src/game/freehold_arrival.ts through existing src/game/teleport_camera.ts and
src/render/camera_director_core.ts seams. Add the NEW 'hearthView' member to
CameraDirectiveKind in camera_director_core.ts with its own arm in
tests/camera_director_core.test.ts; the existing 'vista' and 'deathDrift' arms stay
untouched. Reuse confirmed dungeonEntrySeq, align arrival-facing
before input, and borrow the existing director envelope only inside measured room camera
bounds/collision. Any movement, look, confirm or cancel resumes ordinary input immediately and
invokes the existing cancel path; its camera offset blends out over
DIRECTOR_RELEASE_TIME while remaining camera-safe. Reduced motion starts no directive
and uses the static safe arrival, with no camera lock or auto-rotation. Never transplant spawn_cinematic.ts's
outdoor sweep. Preserve movement, keyboard-turn and pending camera-facing reset semantics.
The same generation guard prevents resume/late duplicate welcome or camera replay.
Add the typed public GameAudio.playHousingArrival method to the sampled feedback seam,
not a call to its private play/playFeedback. The NEW housing_arrival cue's prompt is
authored in scripts/sfx/sfx_prompts.mjs, its gain and speed in
scripts/sfx/sfx_gain_map.json and scripts/sfx/sfx_speed_map.json, its provenance as a
CREDITS.md row, then regenerated through npm run sfx:manifest; honor interfaceSfx/mute
and sampled warm door/hearth ambience. Ordinary UI uses existing cues. Phase 09 owns
the hudChrome.housing.interior.* base rows the room needs before 12 (interior.door =
"Home door", interior.hearth = "Hearth", interior.plinth = "Trophy plinth",
interior.emptyPlinth = "An empty plinth for one of your trophies.",
interior.amenityPaused = "This amenity is paused. The owner can restore the home's
condition." and interior.preparing = "Preparing the room..."; 12 appends its Strongbox
and station rows) and the hudChrome.housing.arrival.* keys, delivered via
freehold_event_feedback.ts with
this exact English (D92; ux-spec carries the rows and the manifest regenerates in this
phase): arrival.welcome = "Welcome home, {name}."; arrival.visitor = "Welcome to
{name}'s home."; arrival.ready = "Your home is ready to explore."; arrival.skip (a
button, title case per D92) = "Skip Arrival View".
09 produces the cue file, manifest/provenance rows and public method now; 19 consumes
and verifies their final integration/mix, never postpones this producer.
No procedural audio oscillator or unregistered synthetic effect bypasses the pipeline.

NEW tests/freehold_arrival.test.ts proves one consumption of each delivered fresh
arrival directive. Ordinary owner returns and visitors may welcome without a first-tier
view; only the committed new owner-tier winner grants firstTierViewEligible. Snapshot,
resume and replay carry no fresh directive; commit-before-ACK can skip presentation.
Test skip/reduced motion/disconnect/mute and run the sampled SFX conformance suites.
This pair captures its twelve exact steady room day/night variants now. The later
11/16/17/18 producers register condition/ghost/arrival/visitor UI scenes; 20 verifies
the complete union. 19 replaces stand-ins with final art and reruns available targets,
plus recorded audio evidence. No future UI is registered early.
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/architecture.test.ts RENDER_PURE_CORES, tests/monolith_budget.test.ts, the four
Eastbrook literals after the re-mint):
- Agent CORE: src/render/freehold/furnishing_layout_core.ts (pure, Three-free:
  furnishingSignature(plotId, claimEpoch, origin, rows, publicRevision) as the sync key, seatFurnishing(row, layout, def) as the
  interior floor constant plus the authored lift plus the def's lift, yaw in radians,
  a diff planner returning add, move, and remove sets between two row lists), the
  RENDER_PURE_CORES registration, tests/furnishing_layout_core.test.ts (signature
  stability and change, seat math per room lift, yaw wrap, the diff planner's three sets
  with negatives).
- Agent VIEW: src/render/freehold/furnishing_models.ts (ONE registry from furnishing
  model key to a builder: the stand-in kit as a small procedural set keyed by furnishing
  FAMILY, and a GLB path slot Phase 19 fills; templates loader-cached once, cloned per
  placement), src/render/freehold/furnishings.ts (FurnishingVisuals on the FarmPatchVisuals
  recipe: a FurnishingSource { freeholdLayout, cfg.seed }, sync() keyed by a consumer-local initialized signature; no actionable update is
  delayed by graphics tier, FPS governor or a throttle, every group through attachSceneGroupGated with a freehold-furnishing label
  kind, hidden program anchors so its programs never leave the retained FIFO, clones
  seated by the core, torn down when the layout goes null, an ENTITY_GATE_STAND_INS row
  for anything held back), the at least five renderer.ts lines (the field, the
  construction beside FarmPatchVisuals, both per-frame drive sites and the
  stageProgramAnchors prewarm hook) paid by an extraction with a lowered renderer.ts
  ceiling, the
  tests/renderer_compile_gate.test.ts arm, tests/furnishing_visuals.test.ts (the adapter
  suite on the farm_patches_adapter model: sync elides when the signature is unchanged,
  add/move/remove reach the scene through the gate, teardown disposes nothing shared).
- Agent LIGHT+GHOST: src/render/freehold/freehold_light_grade.ts (a NEW basename
  distinct from the existing src/render/interior_light_rig.ts; the hearth point light
  plus at most two more, reconciled through point_light_budget.ts within the LIVE global sink budget; three authored emitters is only a ceiling,
  iOS LOW may admit two and pressure may leave one; never adds or removes a directional, hemi, spot, or rect light after boot;
  attached with the interior dressing, retired with it), src/render/freehold/furnishing_ghost_visual.ts
  (a rotation-aware footprint over the ground_aim_reticle idiom: valid and blocked
  states, draws at EVERY graphics tier, driven by renderer.setFurnishingGhost(view |
  null) beside setGroundAimReticle; its pure state in a furnishing_ghost_core.ts
  registered in RENDER_PURE_CORES), tests/freehold_light_grade.test.ts (NEW, 09; the
  existing tests/interior_light_rig.test.ts stays byte-identical; LOW including iOS
  two-emitter and pressure one-emitter fallback, budget reconciliation, no boot-light
  mutation), tests/furnishing_ghost_core.test.ts
  and tests/furnishing_ghost_visual.test.ts (blocked paints refusal at every tier;
  identical input elides work).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

<!-- core-ux-arrival:start -->
ARRIVAL PRESENTATION AND CAPTURE REFINEMENTS (approved D41 / R15):
- A newly accepted owner arrival with freshArrivalPresentation.firstTierViewEligible
  may begin the safe, skippable hearth view for the account first Inn/Cottage tier.
  Historical firstTierAtAdmission alone cannot authorize it; delivery failure can skip it. Visible hudChrome.housing.arrival.skip and any movement/look/
  confirm/cancel release it. Ordinary own-home returns and visitor entries are static;
  reconnect/replayed acceptance starts neither a new view nor a new welcome cue.
  Refused entry keeps the safe source position with refusal only, no welcome/directive.
  Unsafe camera paths and reduced motion always use static safe arrival.
- Welcome/cue identity is the ACCEPTED entry operation/transition scoped to destination
  plot, correlated with confirmed dungeonEntrySeq; never current join time or per-frame
  condition. Distinct successful returns get one new cue; duplicate result/resume gets
  none. Owner entries use arrival.welcome, guests arrival.visitor. 07c's normalized account+tier insert grants committed first-tier eligibility.
  08a distinguishes historical firstTierAtAdmission from freshArrivalPresentation: a positive
  history bit on reconnect/replay never starts camera or welcome, even on a new client.
  Commit-before-ACK can skip the optional view; visible completion is not persistence
  authority. No mark-set exposure or permanent routine-entry receipt is introduced.
- Input resumes immediately when cancelled, while the existing director offset safely
  blends over src/render/camera_director_core.ts::DIRECTOR_RELEASE_TIME. Do not call this
  instantaneous camera-pose restoration. Reduced motion never starts the directive.
  Extend tests/camera_director_core.test.ts and tests/teleport_camera.test.ts alongside
  tests/freehold_arrival.test.ts to prove actual composed input/camera behavior.
- Use existing arrival_warmup/arrival_cover plus scheduler structural readiness. Online
  arrivalRevealSettleMaxMs remains zero for cosmetics; offline wait stays at its existing
  bound. Prepared actionable furniture/door/floor identity remains visible while optional
  art loads. Prove delayed cosmetic behavior in the arrival tests here; 18 later registers the
  exact arrival-online-delayed-cosmetics scene from ux-spec. Add no delay or early UI.
- Existing amb_campfire supplies spatial hearth ambience. Typed sampled personal welcome
  honors interfaceSfx/mute and its NEW catalog/manifest/gain/speed authoring. Positional
  door/body sound stays on the existing positional graph. No new AudioContext or housing
  music system; text still appears when muted, clip missing or AudioContext blocked.
- Expect a release line beside the welcome (v0.44.0 re-sync): a room is a World PvP
  sanctuary, so a flagged player arriving home from contested ground hears "This is a
  sanctuary: World PvP is off here." (WORLD_PVP_SANCTUARY_LINE, src/sim/pvp/world_pvp.ts),
  and a player arriving from free-for-all ground hears the free-for-all leave line; on a
  realm whose World PvP switch is off (`ctx.worldPvpDisabled`) neither fires. Neither is
  a housing emit; the arrival flow neither suppresses nor duplicates it
  (phase-18-visiting.md records the rule).
- The screenshot API is one capture/one image. Every baseline/transient/theme/motion/
  input/distribution/light case maps to a unique target+variant identity in ux-spec's
  expanded manifest; do not hide side shots inside a capture callback. 09 owns NEW
  housingVisualWhen and isHousingVisualPath in scripts/lib/pr_shot_housing.mjs
  and the classifyDiff integration;
  11 extends the same shared selector,
  including exact furnishing/model/exporter/spec/public item/pattern/reference prefixes
  and shared styles from art-brief/content-manifest. Independent art-only and renderer/
  model/core/style changes must select their affected targets; generic GLB recognition
  is not assumed. 09 supplies exact visual owner paths and evidence to that manifest now.
- Local Cottage captures depend on 07's explicit housing dev bridge: launch with exact
  ALLOW_DEV_COMMANDS=1 on loopback, assertLoopbackUrl, enter offline once, then execute
  the actual /dev freehold cottage route. No direct tier mutation or fake paid receipt.
<!-- core-ux-arrival:end -->

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
- i18n: the policy in docs/freeholds/implementation-plan.md; render adds no string; the Phase 09 arrival HUD feedback adds the declared
  hudChrome.housing.arrival.* English keys via its existing UI composition seam.
- Monolith ratchet: src/render/renderer.ts sits at ZERO slack; the at least five lines
  are paid for by an extraction, then LOWER the ceiling; any byte in renderer.ts owes the
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


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Also dispatch gate-integrity-reviewer for the shared screenshot selector/classifyDiff
  changes and required-capture failure behavior, using the actual scoped diff evidence.
- Run: `npx tsc --noEmit`; `npx vitest run tests/furnishing_layout_core.test.ts
  tests/furnishing_visuals.test.ts tests/freehold_light_grade.test.ts
  tests/furnishing_ghost_core.test.ts tests/furnishing_ghost_visual.test.ts
  tests/freehold_arrival.test.ts tests/teleport_camera.test.ts
  tests/camera_director_core.test.ts tests/pr_shot_targets.test.ts
  tests/interior_light_rig.test.ts
  tests/architecture.test.ts tests/renderer_compile_gate.test.ts
  tests/ability_material_prewarm_sweep.test.ts tests/defer_launcher_preloads.test.ts
  tests/entity_gate_stand_in.test.ts tests/point_light_budget.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/monolith_budget.test.ts tests/eastbrook_polish_capture_contract.test.ts
  tests/eastbrook_polish_artifact_integrity.test.ts`; tests/interior_light_rig.test.ts
  runs unchanged and proves the new light module collides with nothing.
- Run npm run sfx:manifest and npm run sfx:check, then the existing camera/director and
  SFX conformance suites found by the STEP 1 reader.
- `npm run perf:tour` entering the Cottage offline (the /dev freehold cottage grant
  under ALLOW_DEV_COMMANDS=1 with a few stand-ins placed): zero live-program events in
  perfStats().gpuPrep; record the tour output path in progress.md.
- The client gate: `node scripts/pr_screenshots.mjs` before and after (desktop plus the
  compact and tablet mobile boxes, lowest graphics preset seeded, Chromium with the
  default iPhone/iOS-profile emulation for mobile shots) through the pr-screenshots skill; commit under docs/screenshots/ and
  note the paths for the wave PR body.
- If renderer.ts changed: run the Eastbrook re-mint script and update the four pinned
  literals in their own commit.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  render-performance-reviewer (the gated attach, program anchors, light budget, the
  tour evidence) and frontend-seam-reviewer (pure-core registration, tier fairness, the
  painter split). Prompt each for COVERAGE not filtering; each writes its report to a
  file. Do not commit until all findings, including nits, are resolved and freshly reviewed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: render-performance-reviewer,
  frontend-seam-reviewer, cross-platform-sync, content-obligations-reviewer,
  gate-integrity-reviewer, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

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
- [ ] The three authored emitters obey the global live light budget, including iOS LOW
  two-light and pressure one-light fallback, and add/remove no boot light
  (pinned); the ghost paints valid and blocked at every tier (pinned).
- [ ] furnishing_layout_core.ts and furnishing_ghost_core.ts are in RENDER_PURE_CORES and
  Three-free (tests/architecture.test.ts).
- [ ] `npm run perf:tour` through the Cottage reports zero live-program events; the
  output is recorded in progress.md.
- [ ] Screenshots committed under docs/screenshots/ (desktop, compact, tablet) and their
  paths recorded for the wave PR body.
- [ ] New/empty/revision 0 consumers initialize; equal-row plot changes relocate; late prepared
  assets cannot reattach after leave. Every generic trophy/model key has safe fallback.
- [ ] A delivered fresh arrival directive may produce one sampled/mute-respecting cue
  and keyed welcome, consumed at most once; commit-before-ACK loss may omit both.
  Only the committed account/tier winner's firstTierViewEligible flag permits the
  safe view, aligned before movement and cancelled on input; reduced motion and
  ordinary return/visitor remain static. Snapshot/resume/replay produces no new
  view/cue from historical identity. Camera/SFX tests and audio evidence are recorded.
- [ ] All STEP 3 suites green; all required reviewers confirm all findings resolved and the fresh fix review passed; the renderer.ts
  ceiling is LOWER than before and the Eastbrook literals are re-minted.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 09, the tour evidence path, the
  screenshot paths, named unsigned gates) and docs/freeholds/state.md (the per-phase
  ledger row 09:
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
