# Phase 09 QA: audit the furnishing view, light rig, and ghost

Audits `phase-09-render-furnishings.md`. Verdict goes in `progress.md` (row "09 QA").
The next implementation phase never starts before this file has run.

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
This is Phase 09 (QA) of the Freeholds and Guildhalls feature: audit render (the
furnishing view, the stand-in kit, the interior light rig, the placement ghost).

Harness: Codex. Asset generation in this implementation (the sampled housing_arrival
cue and any generated image) must use Codex, not Claude (D74); code and review work
follows the active harness. Follow AGENTS.md and root/directory CLAUDE.md repository
contracts; use the active Codex model and the existing image/model/SFX pipelines,
provenance and quality gates. Claude-specific memory, Workflow and agent-runtime
instructions do not apply under Codex (AGENTS.md): use the equivalent Codex read-only
reader and reviewer roles wherever this prompt says Explore or review agent.

Goal: audit the Phase 09 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "09 Render: furnishing view, light rig, ghost",
missing tests, dead code, the scheduler-client rule, the point-light budget, tier
fairness, the pure-core registrations, the tour evidence, the screenshots, and the
renderer.ts ratchet and re-mint; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Gotchas scan (Codex has no Claude memory, AGENTS.md): read state.md "Gotchas" for
  the test-pin traps, the Eastbrook re-mint rule, the measurement-record rule (commit
  the series, not a summary), "review the review-fix round" and "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("09 Render: furnishing view,
  light rig, ghost" and the row, including the tour evidence and screenshot paths),
  docs/freeholds/phase-09-render-furnishings.md (what was promised)
- the Phase 09 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 09)
- the pins the diff claims: tests/furnishing_layout_core.test.ts,
  tests/furnishing_visuals.test.ts, tests/freehold_light_grade.test.ts (and the
  byte-identical existing tests/interior_light_rig.test.ts), tests/camera_director_core.test.ts
  (the 'hearthView' arm), tests/pr_shot_targets.test.ts,
  tests/furnishing_ghost_core.test.ts, tests/furnishing_ghost_visual.test.ts,
  tests/renderer_compile_gate.test.ts, tests/architecture.test.ts (RENDER_PURE_CORES),
  tests/entity_gate_stand_in.test.ts, tests/monolith_budget.test.ts, the two Eastbrook
  fingerprint suites
- the tour output recorded in progress.md and the committed screenshots under
  docs/screenshots/
The agent returns: the promised-versus-delivered table per deliverable, every new module
and where the renderer consumes it, every test added with what it asserts, whether the
tour evidence shows zero live-program events for a walk that actually entered the
Cottage with furnishings placed, the screenshot set (desktop, compact, tablet, before and
after), and any TODO, unused import, or Three import inside a *_core.ts.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every group with
  new materials attaches through attachSceneGroupGated (grep for a bare scene.add or
  group.add of a freshly built material after boot); program anchors exist and are
  hidden; the sync elides on an unchanged signature and allocates nothing on that path;
  the seat uses the interior floor constant plus the authored lift, never terrainHeight;
  the light rig never adds or removes a directional, hemi, spot, or rect light and draws
  at most three point lights at LOW; the ghost draws valid and blocked at every tier and
  reads no FPS governor; every furnishing def resolves through the one registry; the
  renderer.ts extraction is move-not-rewrite; the Eastbrook literals match a fresh
  re-mint run.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression
  (the compile-gate arm scans the real source with comments stripped; the elision test
  counts gate calls before and after an identical sync; the LOW light count is a
  literal; the tier-fairness test drives the LOW preset and asserts the blocked paint;
  the registry sweep iterates the real content table); orphaned tests; missing negative
  cases (a row whose model key is unknown falls to a stand-in rather than nothing; a
  layout that goes null tears everything down; a moved row keeps its clone).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a *_core.ts or
  *_view.ts on disk that RENDER_PURE_CORES does not list, the word "phase" in any code,
  comment, or commit message, em dashes or emojis, generated files hand-edited, a
  src/render/freehold/ local note where the directory earns one, the renderer.ts
  ceiling lowered and not raised, no new package.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (render-performance-reviewer, frontend-seam-reviewer,
cross-platform-sync, content-obligations-reviewer, gate-integrity-reviewer,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Start a new visual consumer at empty/revision 0; switch two equal-row plots with distinct
  origin/claim IDs; resolve an old prepared GLB after leave. Verify initialized registry,
  relocation/teardown, no late attach and unchanged hot path allocation/serialization.
- Three authored emitters is a ceiling inside the global budget. Force LOW iOS two
  lights and pressure one light; entry/door/floor/plinth identity and actionable ghost
  footprint, non-color blocked hatch/reason and budgets remain equally readable.
- Verify condition 100/30/29/0 and realm-day/night without a sim wall clock or render-side
  ownership/condition mutation. Every numeric grade/path is inherited or measured in
  state/workbook, not locally guessed. Generic trophy builder preparation grants nothing.
- Exercise confirmed arrival facing before input, keyboard-turn reset, any-input skip,
  reduced-motion static view and duplicate resume/late generation. Exactly one keyed
  welcome and sampled cue plays; mute/interfaceSfx are respected and no private audio
  method or oscillator bypasses the catalog/manifest/gain/speed conformance pipeline.
- Require the Inn/Cottage first-moment and LOW screenshots plus real audio evidence;
  one happy shell shot cannot prove skip, error, reduced motion or audible cue behavior.

<!-- core-ux-arrival-qa:start -->
ARRIVAL AND CAPTURE FIX-ROUND COVERAGE:
- Verify the approved table explicitly: first Inn/first Cottage safe automatic view,
  ordinary own returns/visitors static, reconnect/replay no new view/cue, refusal only.
  Reduced motion/unsafe path starts no directive. Any movement/look/confirm/cancel
  resumes ordinary input immediately while DIRECTOR_RELEASE_TIME blends the offset
  safely; test that actual behavior rather than assuming instant pose restoration.
- Accepted operation/transition plus destination identity deduplicates welcome across
  retries/resume, while repeated distinct returns still play once each. First-tier
  completion cannot replay after reconnect; unknown/missing audio preserves keyed text.
  Use arrival.welcome versus arrival.visitor truthfully; no visitor owner celebration.
- Delay optional art online and prove zero extra cosmetic settle wait with structural
  safety and readable prepared representations. Offline wait retains its existing bound.
- Require tests/freehold_arrival.test.ts, tests/camera_director_core.test.ts and
  tests/teleport_camera.test.ts plus real composed input, sampled cue and mute evidence.
- Reconcile each screenshot against one exact target/variant identity. No multiple-image
  side callback or invented fixture setup. Exercise isHousingVisualPath selection through
  09's shared owner for art-only/renderer/model/core/style changes and exact manifest
  prefixes. Cottage capture uses 07's real flag/loopback bridge and command, not a setter.
<!-- core-ux-arrival-qa:end -->

ACCOUNT ARRIVAL AND PRIVATE PROJECTION CONTRACT:
- 07c owns normalized account+tier committed first-tier eligibility through 07a; 07b
  owns account lifecycle/history. Neither source is a plot-save array or renderer state.
- Preserve acceptedTransitionId, destination public plot ID and confirmed dungeonEntrySeq.
  Keep historical firstTierAtAdmission separate from nullable freshArrivalPresentation.
  Its FreeholdArrivalPresentation carries acceptedTransitionId, playWelcomeCue: true
  and firstTierViewEligible. A NEW owner/visitor acceptance may carry ordinary welcome;
  only an owner winning the committed tier insert may set firstTierViewEligible true.
  Snapshot/resume/replay always set freshArrivalPresentation null. Reconnect/replayed historical positive acceptance, including
  on a new client, emits no new directive or welcome cue. Distinct accepted ordinary
  returns may issue their ordinary cue once. Cosmetic callbacks never mint authority.
- Commit-before-ACK is at-most-once eligibility: a crash may skip the optional view.
  No visible-completion guarantee or permanent routine-entry receipt is introduced.
- Allowlist both self/private and public encoders: no full mark set, account keys, operator
  evidence, service secret or recovery diagnostics. Test distinctive evidence sentinels
  through actual frame encoders and decoders, not merely a type-level omission.
- Install committed lifecycle/calendar projections only for the current generation and
  consistent nonregressing revision/finality/coverage. v1 load after v2 install and stale
  historical duplicate cannot regress state or ACK false installation. Calendar 13a
  distinguishes requested revision from explicit newer installed revision/digest.
- Required database-performance-reviewer before design and on the finished diff,
  migration-safety and privacy-security-review cover source scope, bounds/defaults,
  actual mark commit, encoder privacy and new-client replay. Authority owns calendar
  meaning; locale formatting never changes original source identity or billing facts.

- Give a fresh client a historical positive first-tier acceptance and assert no new
  camera/welcome. Crash after mark commit before ACK may skip the optional view without
  deleting ownership or regranting eligibility; render completion cannot write a mark.


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

CAPTURE AND SAMPLED-AUDIO OWNERSHIP:
Baseline compact/tablet evidence is Chromium running the default iPhone user-agent/iOS
profile from pr_screenshots.mjs. An Android claim requires an explicit variant.userAgent
and a recorded Android profile assertion; emulation is not Safari or physical hardware.
09 owns sampled housing_arrival, its provenance/manifest and the public
GameAudio.playHousingArrival method. 19 only consumes and verifies that finished output.
Verify mute/interfaceSfx and actual recorded cue audio independently of screenshots.

STEP 3 - VALIDATION:
- Also dispatch gate-integrity-reviewer for the shared screenshot selector/classifyDiff
  changes and required-capture failure behavior, using the actual scoped diff evidence.
- Run the Phase 09 STEP 3 suite list plus `npx tsc --noEmit`; re-run `npm run perf:tour`
  through the Cottage yourself and compare with the recorded evidence; re-run the
  Eastbrook re-mint script and confirm it prints the pinned literals.

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

STEP 4 - FIX:
- Apply ALL findings, including nits. Resolve a conflict with a locked decision
  explicitly before PASS; a recorded conflict is not a deferred fix. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. A fix that touches renderer.ts owes a
  fresh re-mint commit. Then review the fix commits with a FRESH reviewer (fixes are
  unreviewed code until someone reads them). `npm run ci:changed` after the last commit;
  read the exit code.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 09 acceptance box is verified by a check that ran, not by inspection.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "09 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-10-furnishing-colliders.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 09 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
