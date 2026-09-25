# Phase 11 QA: audit build mode UI

Audits `phase-11-build-mode-ui.md`. Verdict goes in `progress.md` (row "11 QA"). The
next implementation phase never starts before this file has run.

## Exact screenshot integration contract

06 registers nine functional gate/landing variants through
scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets. 09 introduces the planned
scripts/lib/pr_shot_housing.mjs common helper, constructor and visual selector with
twelve additional day/night interior variants. 11 extends that same
scripts/lib/pr_shot_housing.mjs build target; 16/17/18 append their own functional
descriptors as their UI lands. Never register a later nonfunctional UI target. No new screenshot runner or multi-image capture API is introduced.
The registry has one optional-clip result and one image per uniquely keyed variant.

Registration is cumulative by actual producer: file 06 registers nine functional
gate and safe-landing variants; file 09 adds twelve day/night interiors (21 total); file 11 extends the registry to 98; file 16
reaches 187; file 17 reaches 235; file 18 reaches 339. File 20 verifies the complete
wave A set (339 of the 742-variant program inventory in ux-spec section 11; 21 to 42
register their own milestones and each wave close verifies its union). Earlier files
require only their registered working subset,
never nonfunctional future UI. These are derived inventory counts, not new gameplay
or tuning values.

```js
import { housingReviewTargets, isHousingVisualPath } from './lib/pr_shot_housing.mjs';

// In TARGETS:
...housingReviewTargets({
  beforeLoad: lowGraphicsSeed,
  dismissOverlays: dismissEntryOverlays,
}),
```

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

const housingDesktop = housingViews.filter((view) => view.key === 'desktop');
const housingDeniedSurfaces = [
  'ios-app-store', 'google-play', 'steam', 'epic', 'seeker', 'unknown',
];
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

```js
{
  key: 'housing-build-mode',
  label: 'Housing palette, placement, camera and capacity',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/build_mode_',
    'src/ui/hud/housing/furnishing_palette_',
    'src/ui/hud/housing/capacity_meter_view.ts',
    'src/ui/hud/housing/build_input_core.ts',
    'src/game/build_mode_wiring.ts',
    'src/game/freehold_build_camera.ts',
    'src/sim/freehold/layout_core.ts',
    'src/sim/freehold/placement.ts',
  ],
  variants: [
    ...housingVariants([
      ...housingInteriorScenes,
      'build-empty', 'build-ready', 'build-blocked', 'build-decor-full', 'build-plinth-full',
      'build-amenity-full', 'build-placed-selected', 'build-move-preview',
      'build-remove-review', 'build-remove-refused', 'build-history-confirmed',
      'build-history-undone', 'build-history-redone', 'build-history-stale',
      'build-pending', 'build-refused', 'build-reconnect',
    ]),
    ...housingVariants(['build-blocked'], { theme: 'parchment' }),
    ...housingVariants(['build-blocked'], { theme: 'highContrast' }),
    ...housingVariants(['build-blocked'], { forcedColors: 'active' }),
    ...housingVariants(['build-blocked'], { motion: 'reduce' }),
    ...housingVariants(['build-ready'], { graphics: 'high' }),
    ...housingVariants(['build-blocked'], { light: 'ios-effective-one' }),
    ...housingVariants(['build-keyboard-focused'], { input: 'keyboard' }),
    ...housingVariants(['build-pad-placement'], { input: 'gamepad' }),
    ...housingVariants(['build-touch-controls'], { input: 'touch',
      views: housingViews.filter((view) => view.mobile) }),
  ],
  capture: captureHousingBuild,
},
```

Every captureHousing* stages exactly variant.scene through its real UI/authority
fixture, asserts the matching state and returns one optional-clip result. Interior
scenes use 09's full-viewport {}; UI scenes return { clip: '#ui' }. Missing required
after-state throws. The registered working subset must include every exact
target/variant and identity dimension for its producers; 20 verifies the full union.
No callback side shot or sequence-to-last-state substitute.

11 replaces the 09 interior-only descriptor with this extended descriptor,
never appending a duplicate target key. Preserve 09's working room fixture and
delegate its interior scene IDs before entering the build-only capture path:

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

File 11's build-empty fixture is a legitimate owned home with no available furnishing
copies in the furnishing tab. Assert build.empty, an empty selectable grid, no ghost,
inactive placement/confirm and working close/tab controls. It grants no fake item and
does not substitute a search with no matches for an empty inventory. Every new scene
runs all desktop/compact/tablet baseline views. Guest observation stays the existing
visit-owner-building identity registered by 18; 11 carries the two-client behavioral
acceptance and cites that later capture, never a duplicate screenshot scene.

### Fixture dependency owned by Phase 07

The runner already calls enterOfflineGame from scripts/enter_offline_game.mjs
for ordinary non-landing variants. captureHousing* uses the resulting real
window.__game Sim/HUD and does not enter a second time. An actual online
scenario needs an explicit existing-runner-compatible setup adapter that joins
the local test server before its one capture. Presentation fixtures and real
multiplayer/authority evidence are labeled separately. Real UI controls are
used after fixture state is authorized; no fake DOM or post-capture correction.

The ordinary offline constructor currently gets devCommands from
import.meta.env.DEV; server ALLOW_DEV_COMMANDS has no browser bridge. File 07
owns this NEW housing-only explicit dev/loopback bridge, realizing existing
D3/D24 intent while leaving ordinary devCommands unchanged:

| NEW owner/module | Exact engineering responsibility |
|---|---|
| scripts/lib/freehold_dev_authorization.mjs and its .d.mts | freeholdDevAuthorizationPlugin({ enabled }) and directly tested request predicate reuse existing diagnosticsReadAllowed socket/Host guard. |
| vite.config.ts composition | Pass enabled: process.env.ALLOW_DEV_COMMANDS === '1'; use configureServer only with apply: 'serve', preserving the literal defineConfig object AST pin. No preview/production route. |
| src/game/freehold_dev_bootstrap.ts | Injected/testable resolveOfflineFreeholdDevGrant before constructing the offline Sim. |
| SimConfig, Sim and SimContext seams | readonly nonpersisted freeholdDevGrantEnabled, default false. |
| src/sim/freehold/dev_grant.ts | Require both ctx.devCommands and ctx.freeholdDevGrantEnabled before the planned setFreeholdTier call. |
| src/sim/dev_commands.ts and server/sim_boot_config.ts | Thin housing command delegation; server supplies its housing permission from the same explicit flag without changing general-dev policy. |

The dev-only endpoint is exactly GET /__freehold/dev-authorization. It returns
only the strict affirmative JSON {"freeholdDevGrantEnabled":true}, with no-store,
when explicitly enabled and diagnosticsReadAllowed accepts both real socket
remote address and Host. Wrong method refuses, unrelated path passes through,
and disabled/missing/malformed/nonloopback cases cannot return an affirmative.
It reads no account, tier, purchase, receipt or arbitrary environment data.
Existing .dockerignore import admission and Docker-context tests cover the NEW
Vite helper, and tests/vite_dev_watch.test.ts retains its literal config-shape pin.

The browser requires import.meta.env.DEV and an HTTP(S) loopback document origin,
fetches same-origin without credentials, caching or redirects, and accepts only
the exact affirmative shape. Failure, refusal, missing endpoint, HTML fallback,
malformed/redirected response or entry-lifecycle cancellation resolves false.
Permission refusal never prevents ordinary free Inn initialization. There is no
new timeout literal; cancellation follows entry lifecycle. Consume permission
only for that offline Sim construction, never in localStorage, a query flag,
UA, window.__game override, user setting or receipt. This browser permission
and the browser-created offline fixture tier never enter online persistence.
D24 separately authorizes the server's `/dev freehold` path through the ordinary
state setter; preserve that path's existing save contract rather than inventing
an ephemeral server tier. Neither developer path creates a paid service receipt.
Authorization stays outside setFreeholdTier because legitimate service grants
also use that setter through their independent authoritative path.

The local reviewable launch is
`ALLOW_DEV_COMMANDS=1 npm run dev -- --host 127.0.0.1`.
The screenshot helper first uses existing assertLoopbackUrl, invokes the real
`/dev freehold cottage` chat dispatch, and reads ordinary world state for the
result. It cannot set tier directly. Proposed tests/freehold_dev_authorization.test.ts
and tests/freehold_dev_bootstrap.test.ts cover exact flag values, real socket
versus forged Host, absent/external Host, wrong method, strict payload and
redirect refusal, and production/preview absence. Each Sim permission alone is
insufficient. A real flag-off browser enters Inn and refuses Cottage; a real
flag-on loopback dev browser starts in Inn then grants through the actual
command. Generic dev commands remain unchanged and no developer grant becomes
a paid receipt. These are future implementing-file 07 obligations, not test
results from this packet audit.

Stage each owned furnishing using the accepted dev/test inventory fixture, then
open the real HUD and place/move through its controls. Assert actual plot/tier,
layout revision, copy identity, usage, valid/blocked reason, visibility, current
surface and loading state. Wait for the scene's required actionable
representations, icon decoding and stable layout; do not require every optional
online cosmetic to settle contrary to the arrival contract. Stable ids,
data-focus-key and semantic attributes are selectors, not localized text.

Store variants use an explicitly labeled local recorded-response adapter at the
existing service/Store seam. It drives production views and receipt states;
it does not prove a debit, durable receipt or restart recovery. Denied surfaces
map fixture labels to the actual distribution/capability verdict rather than
phone UA, and assert absence of purchase model, handlers, catalog requests,
hidden DOM, aria text and unapproved website management alongside the image.

Each pending/refusal/reconnect image freezes its own real reachable state through
controlled service/event scheduling. It must not race through the intermediate
state and capture the final success. Each unique variant records its asserted
operation identity; it sends no duplicate mutation to reconstruct an image.
True two-client proof separately verifies private ghost non-fanout, occupancy,
offline-owner admission and revocation. Browser screenshots of a controlled
public projection alone do not prove server privacy or admission authority.

Keyboard/pad/touch variants execute actual input transitions before capture.
The pad placement fixture starts with the companion visibly open and proves
scoped arbitration against the composed gamepad path, including ordinary window
override and no combat dispatch. A manually set focus class or pasted glyph
cannot satisfy this. Reduced-motion and forced-colors use actual supported
browser media emulation and assert computed behavior. Real LOW iOS/WebKit
capture and interaction/performance evidence remain separate required device
checks: Chromium with iPhone UA proves an iOS profile branch, not Safari engine
behavior, phone memory pressure or touch performance. A controlled effective-one
light fixture uses the live budget seam and asserts the actual contribution
count; its label does not prove physical device pressure.

No screenshots or real-device, audio, payment or multiplayer evidence are
produced in this packet-only audit. Implementation sessions write the normal
contribution evidence and record any unavailable device/runtime check honestly.


### Starter Prompt
```
This is Phase 11 (QA) of the Freeholds and Guildhalls feature: audit build mode UI (the
placement controller, the view core and strip, the furnishing palette, keybinds, pad,
touch, i18n, mobile, screenshots).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 11 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "11 Build mode UI", missing tests, dead code,
the no-prediction rule, i18n completeness, the client gate (touch targets, mobile
sheets, safe areas, tier fairness, screenshots), the drive and painter registries, and
the hud.ts and main.ts ratchet; fix what the audit finds; record a verdict.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the hud_update_drive registry
  entry, the capture-rig entry (never find elements by English text), "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("11 Build mode UI" and the row,
  including the screenshot paths), docs/freeholds/phase-11-build-mode-ui.md (what was
  promised)
- the Phase 11 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 11)
- the pins the diff claims: tests/build_mode_view.test.ts,
  tests/build_mode_controller.test.ts, tests/build_mode_painter.test.ts,
  tests/furnishing_palette_view.test.ts, tests/build_mode_wiring.test.ts,
  tests/capacity_meter_view.test.ts, tests/build_input_core.test.ts,
  tests/freehold_build_camera.test.ts, tests/pr_shot_targets.test.ts,
  tests/housing_view.test.ts,
  tests/keybinds.test.ts, tests/gamepad_bindings.test.ts, tests/hud_update_drive.test.ts,
  tests/hud_perf_budget.test.ts, tests/mobile_window_coverage.test.ts,
  tests/architecture.test.ts (UI_PURE_CORES, UI_DOM_MODULES), tests/monolith_budget.test.ts
- the committed screenshots under docs/screenshots/ and the scripts/pr_shot_targets.mjs
  entries that produced them
The agent returns: the promised-versus-delivered table per deliverable, every new module
and where Hud or main.ts consumes it, every test added with what it asserts, every
hudChrome.housing.build.* and hudChrome.housing.denied.* key and every render sink that
uses it, every Phase 08 reason id and its mapped key in housing_view.ts (any unmapped
id; any selector outside housing_view.ts), the screenshot set (desktop, compact, tablet,
before and after), and any TODO, unused import, English literal in a render sink, or
setAttribute of a label.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-11-build-mode-ui.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Build-session controller and camera. NEW src/game/freehold_build_camera.ts owns
   a detached camera bounded by the authored room measurement manifest, the saved
   normal-camera pose and exact return on exit, teleport, disconnect or plot change.
   It never moves the sim player. build_mode_controller.ts owns begin/select/project/
   commit/cancel and the placement-only undo/redo journal supplied by Phase 08.
   Journal capacity derives from maximum legal placement rows, with exact item-copy
   identity, revision preconditions and atomic inverse refusal; incompatible external
   revisions clear it with hudChrome.housing.build.historyChanged. The ghost may project
   locally; committed layout changes only on authority. Invalid geometry uses shape,
   hatch and the shared deny selector, never color alone. Opening a decision window
   releases aim pointers and suspends the controller; closing restores it safely.
   Object selection and exact-copy custody are part of this same session controller.
   Pointer pick/touch tap or the keyboard/pad named placed-object roving list selects
   the same authoritative placement-row identity. Fixed dressing exposes inspection
   and hudChrome.housing.build.fixed, never Move/Return to bags. Move stages an exact-copy
   transform while committed geometry remains; Cancel restores selected-row focus.
   Unsent proposal replacement cancels the old proposal with build.proposalReplaced;
   pending operations disable new selection/mutation with build.selectionPending.
   Return to bags reviews the exact copy and bag-space consequence before one removal;
   refusal preserves the object/focus and success focuses the returned copy or next
   valid filtered row. External removal selects the next valid same-list row, then
   its heading if empty. No late result reopens a closed palette. Trophy plinths offer
   Replace trophy/Clear plinth (build.replaceTrophy, build.clearTrophy) as a disabled
   affordance shell in 11, exactly like the Trophies tab shell; 17 wires both to its
   record-only chooser TrophyCaseWindow.openForPlinth(plinthKey) over the NEW pure
   src/ui/hud/housing/trophy_case_view.ts::eligibleTrophyChooser model shared by its
   trophy case window and the palette Trophies tab (the names 17 owns); clearing
   preserves unlock/provenance and creates no inventory copy. Every
   proposal focuses the named
   placement root so nudge/confirm work without a hidden extra focus transition.
2. World-companion palette and meters. build_mode_view.ts and
   furnishing_palette_view.ts are DOM-free; furnishing_palette_window.ts reuses bags
   slots, original slotIndex, item glyph/grade/bind/maker marks and filters only bag
   furnishings. Add the Trophies tab shell now, populated by Phase 17. NEW
   src/ui/hud/housing/capacity_meter_view.ts (UI_PURE_CORES; tests/capacity_meter_view.test.ts,
   NEW here and rerun by 25) derives the decor, plinth and amenity meters from
   authority: used and limit through build.decor, build.plinths and build.amenities,
   the full state (used equals limit) through build.meterFull, truthful over-capacity
   numbers with only the drawn fill clamped through build.meterOver, and
   build.meterAria as each meter's aria-valuetext; furnishing_palette_window.ts paints
   it. Always show all three from authority; no budget meter waits for advanced
   building. Register the palette as a nontrapping companion with
   data-pad-nav-root, a reasoned mobile exception and preserved filter/selection/scroll.
   Build presence uses the approved housing facet setFreeholdBuildPresence(active:boolean)
   and set_freehold_build_presence command, scaffolded in 01 and authorized by 08's
   NEW src/sim/freehold/build_presence.ts::setFreeholdBuildPresence. 11 sends start when
   entering eligible build mode and stop on close using the acknowledged opaque plotId,
   acceptedTransitionId and monotonic buildPresenceSeq captured for the current authenticated
   socket binding. Those
   wire guards are never credentials or caller-selected authority. The transport derives
   them from the acknowledged entry; the public facet still takes only active:boolean.
   Host checks authenticated session/current edit authority/claim generation, aggregates
   multiple eligible owner sessions privately and clears each on close/leave/disconnect/
   revocation. Stale start cannot restore presence; stale close cannot clear a new entry.
   Reconnect/reload starts inactive with a fresh sequence window while preserving arrival
   history. Ingress captures the receiving socket identity before queues and rejects an
   obsolete binding at dispatch. Tests reset a new socket counter after a prior high
   sequence and prove queued old-socket start/clear cannot affect the new binding.
   08a exposes only freeholdState.isDecorating. No ghost, palette, inventory, history,
   camera, actor or account identity accompanies it. 11 tests the send/clear lifecycle;
   real two-client privacy proof observes existing 18 visit-owner-building, not a second
   screenshot identity. Three-host/two-world parity includes the ephemeral verb/boolean.
   Guests see accepted layout revisions only, never private edit proposals. An unavailable or loading layout disables
   commit without an optimistic placement; no furnishings has a keyed useful empty
   state. All UX states and focus order follow ux-spec.md.
3. Shared input and action strip. build_mode_painter.ts reuses ActionBarPainter;
   build_mode_wiring.ts is one bootstrap call and generalises existing placement pad
   hooks. The planned toggleBuildMode, rotateFurnishingLeft and rotateFurnishingRight
   BindActions register with the pinned defaults 'Shift+KeyB', 'Comma' and 'Period'
   (all unclaimed in BIND_ACTIONS today; every bare letter is taken), and NEW
   undoPlacement and redoPlacement BindActions register with defaults ['Ctrl+KeyZ',
   'Meta+KeyZ'] and ['Ctrl+Shift+KeyZ', 'Meta+Shift+KeyZ'] (two codes each, the seam's
   maximum: makeCombo emits a separate Meta part for Cmd, so Cmd+Z never matches a
   Ctrl-only default), all in a Housing category the options window lists through the
   existing seam with BIND_CATEGORY_LABEL_KEYS and BIND_ACTION_LABEL_KEYS gaining the
   six hudChrome.keybinds.* rows named in this file's key table (no English fallback
   label); tests/keybinds.test.ts pins the five rows, all seven default codes and a
   label key per action and for the category (U1 F5). Nudge follows the approved grid, yaw
   the state.md lattice. Mouse picks and explicitly confirms. Touch drag moves the ghost; an
   unambiguous Confirm/Rotate/Cancel strip commits instead of a drag-release or stray
   tap. Each target is 40x40 minimum with all safe-area insets. Gamepad bumpers rotate,
   d-pad nudges and confirm/cancel use the shared glyph and topmost navigation rules.
   First Escape cancels selected placement, next exits build mode and restores focus;
   another gameplay UI action cancels active placement before opening its surface.
   NEW src/ui/hud/housing/build_input_core.ts classifies ordinary blocking window,
   housing palette focus, housing placement or normal world. The controller and
   build_mode_wiring.ts compose this scoped input arbitration into BOTH the HUD
   window-open projection and gamepad pointer-mode/activeRoot consumers. Existing
   dpad_focus_nav prioritizes .window.panel; data-pad-nav-root alone is not an exception.
   Preserve every unrelated window's shipped behavior. Ordinary modal/confirmation
   always suspends housing input. Palette focus owns navigation/confirm; placement
   with companion visible owns camera-relative ghost movement and bounded-camera
   look, never avatar movement, casts, combat or trigger hotbar actions. While
   placement owns pad input, build_mode_wiring.ts suspends exactly this set (U1 F4):
   GAMEPAD_CYCLE_SET on RB (RB rotates clockwise instead), the LB slot (rotates
   counterclockwise), 'jump' on Y, 'autorun' on L3, the bare d-pad focus navigation
   (the d-pad nudges one cell) and every cross-hotbar trigger action; GAMEPAD_CYCLE_HUD
   stays live only as the return-to-palette action. Housing pad verbs are a fixed
   context overlay inside build_mode_wiring.ts on the ground-aim precedent (the
   confirm, cancel and d-pad routing gamepad.ts already applies while aiming), not new
   remappable GamepadActionIds; glyphs come from the active pad family. The existing
   focus-navigation action returns to the selected palette cell; selection returns
   to placement. Close/reconnect/authority loss/plot change release ownership once.
   The undoPlacement/redoPlacement bindings dispatch only when build_input_core.ts
   classifies the context as housing world; with the search field focused the chord
   is not consumed and native text undo stays intact. Actual composed input tests keep
   the palette visible, exercise ordinary modal override, prove no concurrent combat
   dispatch, and assert that an RB press in placement rotates the ghost, never calls
   toggleCrossHotbarSet and never casts.
   Touch pointers use touch_router ownership: selected piece previews, empty world
   drags camera, UI stays UI and pinch affects camera only. Reverse rotate and nudge
   remain reachable through a tap-only action panel that is one
   strip_gesture_controller instantiation with anchorRole 'toggle' honouring
   settings.touchTapMenus (src/ui/hud/CLAUDE.md "Tap mode is shared, never per menu"),
   never a fourth tap dialect (U1 F14). Collection instructions use build.collectionHelp as the
   grid's assistive description; both-axis linear roving is not a geometric-grid claim.
4. Shared presentation and accessibility. Implement the actual window/theme tokens
   under ux-spec.md's foundation readiness contract: record whether the coordinated
   DESIGN foundation has landed before consuming target-only tokens. No housing-local
   theme fork. housing_view.ts remains the only reason selector; hudChrome.housing.*
   supplies labels, hints, aria, error and status keys. Preserve form drafts and focus
   through relocalize/signature invalidation. Reduced motion skips camera travel and
   decoration motion immediately. Ghost, bounds, blocked reason and all meters remain
   equally actionable at LOW/high and under iOS's reduced light budget. UI_PURE_CORES,
   UI_DOM_MODULES, hud_update_drive, HOT_PAINTERS and mobile/focus pins cover the actual
   modules; new coordinator lines are paid by extraction with lowered ceilings.
5. Build-session proof and capture helper. Add decisive camera ownership/return,
   history stale-revision, once-per-confirm, interrupted-pointer, keyboard and fake-pad
   tests in tests/build_mode_controller.test.ts, tests/build_mode_wiring.test.ts, NEW
   tests/freehold_build_camera.test.ts, NEW tests/build_input_core.test.ts and NEW
   tests/capacity_meter_view.test.ts beside the existing build_mode suites (the
   decisive assertions are listed in phase-11-qa.md TEST COVERAGE); no monetary
   action enters history.
   The 09-created scripts/lib/pr_shot_housing.mjs exports housingReviewTargets; 11 extends
   its functional build target and shared variants below. Pin path selection in
   tests/pr_shot_targets.test.ts, including a case that
   classifyDiff(['src/ui/hud/housing/build_input_core.ts']).specific contains
   housing-build-mode. Capture real HUD/Sim ready, blocked, empty, pending,
   rejection, reconnect and capacity-full states. Guest-observer capture is the existing
   visit-owner-building target owned 18 and verified at 20; 11 owns its behavioral privacy
   contract without requiring future visiting UI. Required after-shots
   throw if the fixture cannot produce the state. Full #ui on touch proves safe areas;
   screenshots do not substitute for two-client authority or audio tests.

   The existing capture(page, variant) API produces one image from one returned
   optional-clip result: 09's interior fixture returns {} for the full viewport; build UI
   returns { clip: '#ui' }. Each pending/refusal/reconnect,
   theme/media/input/distribution/light/viewport case has its own unique variant key.
   Never stage multiple transient states then return the last, use internal side-shot
   writes or skip a required after-state. The exact descriptor/constructor inventory
   below expands to 89 working build-target variants including the 12 inherited interior
   variants (98 total with the nine separate 06 variants). Pin that implemented subset now; 16/17/18 append only their functional
   targets, and 20 pins the complete wave A union (339 of the 742-variant program
   inventory in ux-spec section 11). No future placeholder UI target
   or duplicate build descriptor satisfies this gate.
   09 owns NEW isHousingVisualPath with housingVisualWhen in the shared helper and its
   composition into existing classifyDiff selection. 11 extends that same inventory/tests,
   never a second predicate;
   use the exact housingVisualWhen model/layout/exporter/spec/public item/model/reference
   and shared-style inventory, including public-art-only diffs. Independent pins cover
   renderer-only, placement core, ordinary model, every manifest public art prefix and
   shared style, without a generic unrelated-asset fallback.
   Capture uses the runner's existing enterOfflineGame result, never enters twice.
   Phase 07 must first deliver the exact offline-dev-bridge dependency below. On local
   loopback launch, assertLoopbackUrl then invoke actual /dev freehold cottage and read
   normal world tier; never directly assign tier, set permission in localStorage or
   infer authority from window.__game. Store fixtures use a labeled local recorded
   adapter at the real service/Store seam; they prove presentation only. Real online
   states use an existing-runner-compatible local-server setup adapter. Pending states
   are frozen through controlled event/service scheduling under one operation identity.
   Keyboard/pad/touch variants execute real composed transitions; no pasted glyph or
   focus class. Chromium iPhone UA proves profile routing only; LOW iOS/WebKit engine,
   device memory/input/performance checks remain separate. An effective-one light label
   must assert actual live sink contributions; it alone is not physical pressure proof.

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS. Each of
  these can-fail checks must exist in the named suite with its stated negative control:
  - tests/build_mode_controller.test.ts: exactly one facet send per activation (a
    second commit before the result sends nothing) and re-arm on the deny event (the
    next activation sends again); a refused send leaves freeholdLayout deep-equal
    (control: an accepted descriptor changes it); redo restores the undone row; Escape
    twice first cancels the proposal with build mode still active, then exits and
    returns focus to the trigger element; an external revision bump clears the journal
    and emits historyChanged exactly once (control: a same-revision update keeps the
    journal); an open modal suspends placement and dispatches no cast.
  - tests/build_mode_wiring.test.ts: touch drag-release and a stray tap call commit
    zero times while strip Confirm calls it once; Ctrl/Cmd+Z with the search field
    focused leaves history untouched and in housing world context calls undo once; the
    composed fake pad proves an RB press in placement rotates the ghost, never calls
    toggleCrossHotbarSet and never casts, and the d-pad nudges exactly one cell.
  - tests/freehold_build_camera.test.ts: camera pose equality after exit, teleport,
    disconnect and plot change (control: the pose differs while build mode owns it);
    the sim player position is unchanged throughout.
  - tests/build_input_core.test.ts: each of the four contexts (blocking window, palette
    focus, placement, normal world) with the negative for its neighbour.
  - tests/capacity_meter_view.test.ts: used/limit text per meter, the full state at
    used equals limit, and over-capacity keeping truthful numbers while the drawn fill
    clamps to 1 (control: below the limit no full/over state is set).
  - tests/build_mode_painter.test.ts: the strip measurement helper reports every
    button at or above 40x40 and reds on a 39px fixture; the compact capture's assert
    step measures the real strip through getBoundingClientRect and throws below 40x40.
  - tests/hud_update_drive.test.ts and tests/hud_perf_budget.test.ts: rows for
    build_mode_painter (control: removing the row reds); tests/keybinds.test.ts: the
    five Housing BindActions, all seven default codes (Ctrl and Meta for undo/redo) and
    a hudChrome.keybinds.* label key per action and for the category (control: a row
    without a label key reds); tests/pr_shot_targets.test.ts:
    classifyDiff(['src/ui/hud/housing/build_input_core.ts']).specific contains
    housing-build-mode.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

STEP 3 - VALIDATION:
Required named reviewers for this file: cross-platform-sync, privacy-security-review,
frontend-seam-reviewer, render-performance-reviewer, gate-integrity-reviewer,
test-coverage-auditor, qa-checklist.
- Run the Phase 11 STEP 3 suite list plus `npx tsc --noEmit`, `npm run i18n:gen`, and
  the i18n completeness and S3 guard suites; with `npm run dev` running, re-run
  `node scripts/mobile_input_zoom_check.mjs` and open the compact capture to confirm the
  strip sits inside the safe area in landscape.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. A visual fix re-captures its screenshot.
  Then review the fix commits with a FRESH reviewer (fixes are unreviewed code until
  someone reads them). `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 11 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "11 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-12-strongbox-and-station.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 11 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
