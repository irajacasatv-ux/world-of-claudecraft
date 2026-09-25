# Freehold interiors implementation evidence

Implementation branch: `feature/freeholds`, worktree `wocc-freeholds`.
Review and screenshot baseline: `654071354172b3e252cfc03a1e85efde2daddaa6`.
The baseline includes the completed release merge and its audit fixes.

Status (2026-09-08): implementation complete and ready within the requested scope. All 12 shared-gate stages passed with Postgres enabled on that day's tree; later gates are recorded in [the persistence ledger](qa/persistence-2026-09-08/findings.md).
This receipt does not sign the separate follow-on QA packet or later delivery gates.

The capture set, the performance record and the seals were RE-SHOT on 2026-09-23, after
the `release/v0.44.0` sync and the gate move; the current record is the last section,
"The 2026-09-23 re-shoot". Capture and performance statements before it are history.

## Delivered behavior

- Inn Room and Cottage use measured shared layout data, derived wall and decor colliders,
  reserved anchors and literal safe entry, facing, exit and quay return poses.
- The physical Eastbrook Freehold Gate opens only through explicit interaction. Confirmation
  checks current authority and proximity. Nearby movement alone opens nothing and enters nothing.
- The permanent Hearth Key is regranted when inventory space permits. Possession grants no
  ownership. The isolated host clock maintains one 60-minute cooldown per account; physical
  gate admission remains independent of that cooldown. Real realm dispatch and dark-realm
  refusal paths are covered without claiming future durable account authority.
- Both interiors use prepared shared materials and the existing gated scene attachment path.
  Opaque authored wall faces participate in the existing camera cutaway policy. Rooms add no
  lights, Strongbox props or station props.
- The gate prompt uses shared focus, tab and themed control behavior, 40-pixel controls and
  keyed feedback. Pending silent-delivery recovery requires an explicit close, reopen and retry.
  The composed friend lookup adapter invalidates stale capabilities and replies; production
  lookup and visiting remain unavailable.
- Confirmed online entry identity reaches the entity mirror. Owner-room occupancy scanning,
  telemetry, private instance presence and the O(1) record gauge use focused modules.
- The Hearth Key has accepted Codex-generated WebP art and provenance. The live English
  catalog and five required non-Latin catalogs are filled; generated catalogs and wiki data
  follow their canonical producers. The reproducible UX manifest contains 557 keys and
  742 shots, including 339 Wave A shots.

## GPU evidence

(The 2026-09-08 run, superseded by the 2026-09-23 re-shoot at the end of this record.)

Command:

```sh
PERF_SCENARIO=bench_freehold_interiors PERF_GPU=1 PERF_PRESET=low PERF_OUT=tmp/freeholds06-perf-final.json npm run perf:tour
```

The final run, generated `2026-09-08T19:20:04.444Z`, exited 0 after the final shared-focus correction, control styling and measured exit-label correction.
Desktop and mobile `errors` and `budgetFailures` are empty. The route walks the real ferry
and gate path, confirms the real prompt, and grants Cottage through the real loopback chat
command. It uses no simulation setters.

| Profile | Inn rendered frames / draw calls | Cottage rendered frames / draw calls |
|---|---:|---:|
| Desktop | 145 / 33 | 146 / 28 |
| Mobile | 146 / 33 | 144 / 28 |

Every gate-confirmation-through-sample window has zero new live-program,
attach-watchdog and gate-timeout events. Prior-world cumulative program events are retained,
not zeroed or hidden. Every room sample has authoritative facing 0, camera yaw 0 and the
correct safe entry pose. Renderer source is 12,844 lines, below the committed baseline's
12,850 lines. The Eastbrook source seals were reminted without changing historical pixels
or the frozen historical town-source identity.

## Review and regression evidence

The required architecture, cross-platform, render performance, content obligations, frontend,
security, server hot path, test coverage and QA checklist reviews were dispatched. Gate
integrity review covered the additional workflow and architecture-guard changes. Fresh
review covered the entire fix round, including real delayed-load shutdown and boot
cancellation regressions. Source findings and nits are resolved. All 18 images passed visual QA, and fresh review
verified the retained artifact/source digests and index matches, plus the real performance counters.
All 18 refreshed images passed independent direct visual review, and retained PNG bytes
match the reviewed producer files. The final capture refresh passed all 50 capture,
raw-integrity, route and CI-cone checks.
The retained record fingerprints 42 source inputs and four identical baseline harness files.
An earlier version of this line said 31, which no count in the record supports.

THREE OF THOSE FINGERPRINTS WERE RE-MINTED at the 2026-09-10 sync, and the digest
verification above is therefore true of the record as it stands rather than of the
one that was reviewed. The `release/v0.43.0` merge changed `src/styles/components.css`,
`src/styles/hud.mobile.css` and `scripts/pr_shot_targets.mjs` and left `acceptance.json`
pinned to the branch parent's digests, which left `tests/freehold_capture_contract.test.ts`
RED on the merged tree. The captures were NOT re-shot, and the evidence for that judgement
is recorded rather than asserted: every selector the two stylesheets changed is scoped to
`.corpse-harvest-btn`, `#harvest-preference-window`, `.harvest-preference-*` or `.soc-*`,
none of which appears in a freehold gate prompt or interior view, and the script change is
one ADDITIVE capture target (`guild-roster-expand`) that alters no existing route. A release
that touches a selector these captures can actually reach owes a re-shoot, not a re-hash.

The final renderer lifecycle batch passed 35 tests. Friend-state composition passed 176
tests, and the final themed-control batch passed 45 tests with TypeScript and Biome clean.
The final monolith and Eastbrook seal checks passed 52 tests. The exit-label batch passed
48 tests. The final 24-file batch, including all 22 requested suites, passed 941 tests with
four opt-in generic HUD tour cases skipped. The required Freehold GPU tour ran separately
and passed. The first shared gate exposed stale extraction, registry and catalog pins, plus
a real parked-dialog focus-ownership defect. Those fixes passed their focused checks and fresh
source review. The final shared gate then passed all 4,204 test files and all subsequent browser, typecheck and build stages.

## Final focused corrections

The real gate controller now uses `focusedWithin` for repaint and retry ownership, while its
painter uses `FOCUS_KEY_ATTR`. A nested parked-dialog regression failed before the fix and
passed afterward. The complete UI correction batch passed 156 tests and typechecking.
Exact root, close, focus, localization and command inventories follow the new module seams.
Arena and Ignivar checks exercise the extracted resolver and live builder, with 10 tests passing.

The canonical item-art audit measured 1,305 icons and 1,323 live definitions. Its 711,586-byte
catalog has SHA-256 `ea36cd4c751f14984ca4ee07ac821862e05352179b6152f5f3c72385950b80cb`;
shipping-art SHA-256 is `2f5175bf9a90d93425e0873a5ef62c7e5842916d00ebe977748112bdb4aab073`.
The dated approval universe remains unchanged; the Hearth Key owner is independently identified.
The two audit suites passed 17 tests.

The maximal-character round trip measures 213,332 compact JSON bytes. Removing only the
single Hearth Key discovery reproduces 213,319 bytes, independently isolating 13 bytes in
both the whole state and `deedStats`. Historical room and furnishing baselines, the 381-byte
tracking band and the 229,376-byte warning threshold remain unchanged. Database performance
and persistence reviews found no defect. Existing rollback behavior retains unknown inventory
IDs and drops discovery IDs absent from the older catalog. The fixture and heavy-state policy
batch passed 21 tests; no new database shape or cadence was introduced.

A late software-rendering performance notice exposed a capture timing race. The capture-only
helper now waits for the actual boot notice, performance notice or matching prior dismissal,
then clicks or taps the real Dismiss control. Ten regressions passed, including a delayed notice
that failed against the previous preflight-only loop. Each sidecar records `noticeResolution`
alongside the actual adapter and current notice visibility. No game warning, timer or GPU
identity was altered.

## Commands and delivery gates

The following commands completed successfully:

```sh
npm run i18n:gen
npm run wiki:content
npx tsc --noEmit
node scripts/item_art_audit.mjs --verify-only
npx vitest run tests/item_art_audit_builder.test.ts tests/masterwrought_art_completion.test.ts
npx vitest run tests/professions_blob_growth.test.ts tests/heavy_self_arm_marks.test.ts tests/server/heavy_self.test.ts --maxWorkers=1
```

The requested suite batch passed 941 tests, with four opt-in generic HUD tour tests skipped:

```sh
npx vitest run tests/freehold_layouts.test.ts tests/freehold_gate_and_key.test.ts tests/housing_view.test.ts tests/freehold_instance.test.ts tests/dungeons.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/entity_display_name.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/mobile_station_party.test.ts tests/server/freehold_wire.test.ts tests/command_schema.test.ts tests/env_protocol.test.ts tests/map_marker_semantics.test.ts tests/map_semantic_accessibility_core.test.ts tests/minimap_markers.test.ts tests/freehold_dev_grant.test.ts tests/hud_perf_budget.test.ts tests/freehold_exit_label_core.test.ts --maxWorkers=2
```

Final artifact and shared-gate outcomes:

- The 18-image capture contract, raw-record integrity, route and CI cone checks passed
  50 tests across three suites. The retained evidence is
  [the capture acceptance record](../screenshots/freehold-interiors-2026-09-08/acceptance.json).
- The timing harvest passed three actual runs for each of 162 previously unmeasured files,
  producing 4,187 total rows while preserving existing measurements. The capture-notice
  regression measured 5, 4 and 5 milliseconds, with a 5-millisecond median.
- Postgres-armed `node scripts/gate_select.mjs` exited 0: all 12 stages passed. The full
  suite passed 4,204 files and 63,137 tests, with two expected failures and 28 skips
  (888.52 seconds). Browser regressions passed 50 files and 401 tests (15.20 seconds).
  Typechecking and environment, server, bot and client builds passed. Localization, wiki,
  SFX/media generation and freshness checks passed. The security gate scanned 9,030 files
  and passed with zero high findings after recorded priors.
- Delivery uses the five requested scoped commits, followed by `npm run ci:changed`
  after the actual last commit. The final delivery response records the resulting commit
  identities and post-commit exit code; this receipt does not anticipate that result.

Later work retains durable account Hearth storage and atomic admission, descriptors,
lighting and arrival presentation, Strongbox and station props, visiting, and final GLBs.
The 24/300-owner-pool and physical entry broadcast gates remain named unsigned checks.
The next packet is [the interiors QA runbook](phase-06-qa.md).

Exact capture and final gate commands:

```sh
DIFF_FILE=/tmp/freeholds06-shots.diff SHOTS_DIR=/tmp/freeholds06-after-shots-final node scripts/pr_screenshots.mjs
PR_SHOTS_FREEHOLD_BASELINE=1 GAME_URL=http://127.0.0.1:5174 DIFF_FILE=/tmp/freeholds06-shots.diff SHOTS_DIR=/tmp/freeholds06-before-shots-final node scripts/pr_screenshots.mjs
npx vitest run tests/freehold_capture_contract.test.ts tests/ci_workflow.test.ts tests/freehold_interior_route.test.ts --maxWorkers=1
node /tmp/freeholds06-run-pg-command.mjs node scripts/gate_select.mjs
```

The baseline command ran in the separate baseline checkout. The local gate wrapper verified
Postgres and supplied `TEST_DATABASE_URL` and `WOCC_EXPECT_PG=1` without logging credentials.
The raw screenshot records retain 123 baseline console diagnostics (102 inherited preload
messages and 21 local API HTTP 502 responses), and 23 after diagnostics, all local API HTTP
502 responses. Neither run contains a target failure or page exception. These offline capture
records do not certify live backend availability.
(Correction, 2026-09-23: the acceptance record sealed on 2026-09-08 counted 131 baseline
diagnostics, 102 preload messages and 29 HTTP 502 responses, and 28 after diagnostics; the
counts in this paragraph do not match it.)

## The 2026-09-23 re-shoot (after the v0.44.0 sync and the gate move)

All 18 images, all 18 sidecars, both producer manifests and the performance record
were re-shot on 2026-09-23, and the receipt was regenerated over them. Every capture,
performance and seal statement above this section describes the superseded 2026-09-08
set and is kept as history.

Why the set was owed: the `release/v0.44.0` sync moved the gate prompt's tabs onto the
library `.ui-tab` primitive (and a later-layer rule that overrode its selected look was
removed), the gate moved from `(-14,-92)` to `(-38.65,-103.75)`, and the capture harness
was reworked around both.

The set was shot twice. The first re-shoot ran at `ba8460e32f` and was committed in
`aadff20b9f`. Three rounds of fresh review then changed sealed inputs: the grass ring
and its exclusion test, the arch probe, the camera settle, the census, the capture target
and the seal list itself. So the set was shot again, and that is the record now committed
(`8618300332`); the first set is superseded.

What the final set was shot against:

- One chain ran all three legs, starting at `1c536218af` with a clean tree: the nine
  after frames (this worktree, served by its own Vite on 5173), then the GPU performance
  tour, then the nine before frames (the release baseline checkout
  `codex-freeholds06-before` at `654071354172b3e252cfc03a1e85efde2daddaa6`, served on
  5174, driven by this worktree's harness).
- One commit landed during the after leg, `01518e8eaf`. It changes two test files and one
  comment in `scripts/freehold_capture_receipt.mjs`, which no producer loads.
- The receipt ran at `01518e8eaf` with a clean tree. It seals 67 source inputs, 17 of
  them harness files (the harness's whole local import closure, derived and pinned by the
  capture contract). The baseline checkout's application paths match its commit exactly;
  its status still lists the harness copies the 2026-09-08 capture left there, which the
  receipt records and this run did not use.

What the receipt holds every frame to (`scripts/freehold_capture_receipt.mjs`, with a
refusal row per condition in `tests/freehold_capture_contract.test.ts`):

- **Every frame:** the declared viewport; the low preset with the device default applied
  and the low renderer tier; the classic theme; the SwiftShader backend; no GPU notice and
  a resolved notice path; the prompt inside the viewport; no transient HUD (error text,
  banners, tooltip, loot rolls, floating combat text, vignette, popups, toasts, and the
  arrival overlays); at least three quiet overlay-settle passes; and the follow camera's
  input yaw within 0.1 rad of the player's facing.
- **Every gate frame and every before frame:** stands within the 0.7 yd route tolerance
  of the stance, squared on -z (facing within 0.12 rad of pi). The stance is 4 yd west and
  1 yd north of the arch, so the gate itself sits well off the facing.
- **After gate frames:** show the prompt with every control at least 40 px and uncovered
  at its centre, and every text entry at 16 px on the touch variants. Focus is on the
  selected tab. The gate probe must find the arch's own mesh at all three sample points,
  with nothing in front and no DOM paint over them. The frame also carries a recorded
  stance settle from before the press.
- **Room frames:** stand on the room's arrival point, facing 0, with camera yaw exactly 0.
- **Before frames:** show no prompt and carry no stance settle.

Measured, from the committed records:

- **After gate frames** (compact, desktop, tablet):
  - Distance from the stance: 0.42, 0.6999 and 0.46 yd. Desktop is inside the 0.7 yd
    tolerance by a ten-thousandth.
  - Camera yaw off the facing: 0.043, 0.027 and 0.021 rad.
  - Focus on `gate-own-tab`, five controls all on top, and the arch met at every
    probe point.
- **After room frames:** the Inn Room at `(119200,-1254)` and the Cottage at
  `(119800,-1254)` on every variant, facing 0 and camera yaw 0.
- **Before frames:** all nine stand 0.02 to 0.58 yd from the stance, turned 0.07 to 0.09
  rad off pi, with camera yaw 0.014 to 0.041 rad off the facing. None shows a prompt or
  transient HUD, and each ran three settle passes.
- **Diagnostics:**
  - After: 28, all local API HTTP 502 responses.
  - Before: 130, which is 102 inherited preload messages and 28 local API HTTP 502
    responses.
  - Neither run has a target failure or a page exception. These offline records do not
    certify live backend availability.
- **Performance** (`bench_freehold_interiors`, real GPU, headed, low preset; the desktop
  profile at 1600 by 900 and the mobile profile at 844 by 390): `errors` and
  `budgetFailures` are empty on both. Each room sample spans about 1.2 s:

  | Profile | Inn rendered frames / draw calls | Cottage rendered frames / draw calls |
  |---|---:|---:|
  | Desktop | 145 / 33 | 146 / 28 |
  | Mobile | 146 / 33 | 146 / 28 |

  - **Island to gate reveal:** 17,023.9 ms on desktop and 16,626.1 ms on mobile.
    - Enforced, and did not move: the live-program, attach-watchdog, gate-timeout and
      reveal-watchdog counters, and touch-unproven.
    - Recorded but not enforced, and also still: the reveal soft-deadline and submit-stop
      counters.
    - touch-unproven already stood at 1 before this window on both profiles, so the
      check proves only that no new one fired.
  - **Later windows:** the live-program, attach-watchdog and gate-timeout counters also
    did not move from the reveal to the inn entry, from each gate confirmation through its
    room sample, or from the inn sample's end to the Cottage entry.
- **Visual review:** all 18 images were read by eye.
  - The arch stands at the new site in all three after gate frames, beside the prompt.
    The same stance in the before frames shows the empty lawn between the two cottages.
  - The prompt is legible, with the library tab look and the selected tab outlined.
  - The Inn Room shows its bed and hearth and the Cottage its hearth, from the arrival
    point facing north. The desktop Cottage frame's chat shows the new "step back out
    into town" leave line.
  - No overlay covers any frame.

Harness defects the re-shoots exposed, each fixed and pinned before the final chain:

- A tutorial card or GPU notice dismissed after the prompt opened took the prompt's
  focus. Both now settle at the stance before the press.
- The chase camera could open a frame swung round in front of the player. The stance
  hold now settles it in place on the paired turn keys, and refuses to unless A and D each
  drive only their turn and Mouse Camera, mouselook and attack-move are off.
- A leave could carry the player past the gate's reach before the reopening press. The
  reopen now walks back into reach.
- The Cottage switch raced its own keystrokes under load. It now waits for the sim
  record's tier; earlier performance tours had failed that way.
- The final tour passed without its retry. That comes from the chain's own log, which is
  not committed.

Limits:

- The SwiftShader frames are evidence of what the frames show, not of GPU preparation
  cost.
- The gate probe and the census state their own known limits in their headers.
- The performance tour runs only the low preset.

The final set's commands, in chain order. The before leg runs against the baseline's Vite
on 5174, and `SHOTS_DIR` is under the gitignored `tmp/`.

```sh
DIFF_FILE=<diff> SHOTS_DIR=tmp/fh_capture/after NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
PERF_SCENARIO=bench_freehold_interiors PERF_GPU=1 PERF_PRESET=low PERF_OUT=tmp/fh_capture/performance.json node scripts/perf_tour.mjs
PR_SHOTS_FREEHOLD_BASELINE=1 GAME_URL=http://127.0.0.1:5174 DIFF_FILE=<diff> SHOTS_DIR=tmp/fh_capture/before NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
node scripts/freehold_capture_receipt.mjs --before tmp/fh_capture/before --after tmp/fh_capture/after --performance tmp/fh_capture/performance.json --output docs/screenshots/freehold-interiors-2026-09-08 --baseline-root <codex-freeholds06-before> --baseline-url http://127.0.0.1:5174
npx vitest run tests/freehold_capture_contract.test.ts --maxWorkers=2
```

The after-leg server ran with `ALLOW_DEV_COMMANDS=1` on loopback, for the Cottage grant
only (a local dev server; never production).

## The 2026-09-25 re-shoot (after the re-sync of `release/v0.44.0` at `ed69f62ef7`)

All 18 images, their sidecars, both producer manifests and the performance record were
shot again on 2026-09-25, and the receipt was regenerated over them. The 2026-09-23 set
above is superseded and kept as history.

Why a re-shoot and not a re-hash: merge `484cb61a46` changed eight of the 67 sealed
inputs (`renderer.ts`, `nameplate_painter.ts`, `action_bar_controller.ts`,
`pr_shot_targets.mjs`, and `base.css`, `components.css`, `hud.mobile.css`, `tokens.css`),
and a per-input reading found none that could move a frame at the harness defaults (the
hill ring builds nothing without a standing hill, the PvP nameplate tag needs a raised
flag, the new rules style windows no frame shows, the pet socket token reaches only a pet
bar a warrior lacks, the rest are cursors, spectator guards and new capture targets). A
probe of the after leg at `0590197d8d` (into the gitignored `tmp/`, not committed)
REFUTED that reading: the player unit frame's corner move toggle, present in every
sealed after frame, is gone. The release's frame presets work (`bca0c1eb07`) stopped
building it in `src/ui/movable_frame.ts`, an UNSEALED input. So the seal cannot be
trusted to say when a frame moves, and a re-hash judgement needs a probe compared
against the sealed frames. The re-hash commit that briefly held the eight digests was
withdrawn before anything cited it.

What the set was shot against: one chain at `1910fd578c` with a clean tree (the fixes
of the re-sync audit and its fresh reads included, `src/sim/instances/dungeons.ts`
among them): the nine after frames from this worktree's loopback Vite on 5173
(`ALLOW_DEV_COMMANDS=1` on that local dev server only, for the Cottage grant), then the
GPU performance tour, then the nine before frames from the frozen baseline checkout
(`654071354172b3e252cfc03a1e85efde2daddaa6`) on 5174, driven by this worktree's harness.
The receipt ran at `1910fd578c` with a clean tree and seals the same 67 inputs, 17 of
them harness files; `tests/freehold_capture_contract.test.ts` passed 102 of 102.

Measured, from the committed records:

- **After gate frames** (compact, desktop, tablet): 0.41, 0.16 and 0.44 yd from the
  stance, facing 0.07 to 0.09 rad off pi, camera input yaw 0.024, 0.032 and 0.039 rad
  off the facing; the prompt, focus on the selected tab and the arch met by the probe.
- **After room frames:** the Inn Room at `(119200,-1254)` and the Cottage at
  `(119800,-1254)` on every variant, facing 0, camera yaw exactly 0.
- **Before frames:** 0.04 to 0.43 yd from the stance, turned 0.07 to 0.09 rad off pi,
  camera yaw 0.022 to 0.059 rad off the facing, no prompt, three settle passes each.
- **Diagnostics:** after 29, before 130; no target failure and no page exception.
- **Performance** (`bench_freehold_interiors`, real GPU, headed, low preset): `errors`
  and `budgetFailures` empty on both profiles.

  | Profile | Inn rendered frames / draw calls | Cottage rendered frames / draw calls |
  |---|---:|---:|
  | Desktop | 146 / 33 | 146 / 28 |
  | Mobile | 145 / 33 | 146 / 28 |

  Island to gate reveal: 16,594.5 ms on desktop and 16,794.2 ms on mobile, with the
  live-program, attach-watchdog, gate-timeout and reveal-watchdog counters still at 0
  and touch-unproven at the 1 it held before the window.
- **Visual review:** all 18 images were read by eye. The arch stands at its site beside a
  legible prompt in the three after gate frames, with the selected tab outlined; the unit
  frame no longer carries the corner move toggle. The Inn Room shows its bed and hearth
  and the Cottage its hearth, from the arrival point facing north; the desktop Cottage
  chat shows the town leave line. The before frames show the empty lawn between the two
  cottages. No overlay covers any frame.
