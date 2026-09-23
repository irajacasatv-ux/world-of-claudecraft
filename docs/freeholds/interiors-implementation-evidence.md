# Freehold interiors implementation evidence

Implementation branch: `feature/freeholds`, worktree `wocc-freeholds`.
Review and screenshot baseline: `654071354172b3e252cfc03a1e85efde2daddaa6`.
The baseline includes the completed release merge and its audit fixes.

Status: implementation complete and ready within the requested scope. All 12 shared-gate stages passed with Postgres enabled.
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

## The 2026-09-23 re-shoot (after the v0.44.0 sync and the gate move)

All 18 images, all 18 sidecars, both producer manifests and the performance record
were re-shot on 2026-09-23, and the receipt was regenerated over them. Every capture,
performance and seal statement above this section describes the superseded 2026-09-08
set and is kept as history.

Why the set was owed: the `release/v0.44.0` sync moved the gate prompt's tabs onto the
library `.ui-tab` primitive (and a later-layer rule that overrode its selected look was
removed), the gate moved from `(-14,-92)` to `(-38.65,-103.75)`, and the capture harness
was reworked around both.

What was re-shot, and against which trees:

- One chain ran all three legs, starting at `ba8460e32f` with a clean tree: the nine
  after frames (this worktree, served by its own Vite on 5173), then the GPU performance
  tour, then the nine before frames (the release baseline checkout
  `codex-freeholds06-before` at `654071354172b3e252cfc03a1e85efde2daddaa6`, served on
  5174, driven by this worktree's harness). One commit landed during the before leg,
  `0147a7b9da`, which changes only `tests/freehold_interior_route.test.ts`; no sealed
  input moved.
- The receipt ran at `0147a7b9da` with a clean tree. It seals 53 source inputs and 11
  harness files. The baseline checkout's application paths match its commit exactly; its
  status still lists the harness copies the 2026-09-08 capture left there, which are
  recorded in the receipt and were not used by this run.

What the receipt holds every frame to (`scripts/freehold_capture_receipt.mjs`, with a
refusal row per condition in `tests/freehold_capture_contract.test.ts`): the declared
viewport; the low preset with the device default applied and the low renderer tier; the
classic theme; the SwiftShader backend; no GPU notice and a resolved notice path; the
prompt inside the viewport; no transient HUD (error text, banners, tooltip, loot rolls,
floating combat text, vignette, popups, toasts); at least three quiet overlay-settle
passes; and the follow camera's input yaw within 0.1 rad of the player's facing. Gate
frames also stand within the 0.7 yd route tolerance of the stance and face the gate to
within 0.12 rad. After gate frames also show the prompt with every control at least
40 px and uncovered at its centre, every text entry at 16 px on the touch variants, focus
on the selected tab, the arch reported drawn by the gate probe, and a recorded stance
settle before the press. Room frames also stand on the room's arrival point with facing
0 and camera yaw exactly 0. Before frames must show no prompt, on the overworld, with no
stance settle.

Measured, from the committed records:

- After gate frames: 0.04, 0.06 and 0.14 yd from the stance (compact, desktop, tablet);
  camera yaw 0.031, 0.021 and 0.038 rad off the facing; focus on `gate-own-tab`; five
  controls, all on top; the arch drawn.
- After room frames: the Inn Room at `(119200,-1254)` and the Cottage at `(119800,-1254)`
  on every variant, facing 0 and camera yaw 0.
- Before frames: all nine stand 0.06 to 0.59 yd from the stance, camera yaw 0.024 to
  0.043 rad off the facing, no prompt, no transient HUD, three settle passes each.
- Diagnostics: after, 28 local API HTTP 502 responses; before, 130 (102 inherited
  preload messages and 28 local API HTTP 502 responses). Neither run has a target failure
  or page exception. These offline records do not certify live backend availability.
- Performance (`bench_freehold_interiors`, real GPU, headed, low preset; the desktop
  profile at 1600 by 900 and the mobile profile at 844 by 390): `errors` and
  `budgetFailures` are empty on both. Each room sample spans about 1.2 s:

  | Profile | Inn rendered frames / draw calls | Cottage rendered frames / draw calls |
  |---|---:|---:|
  | Desktop | 146 / 33 | 146 / 28 |
  | Mobile | 147 / 33 | 146 / 28 |

  From the island (no gate view yet) to the gate view's reveal, 16,761.5 ms on desktop
  and 16,782.5 ms on mobile, the reveal-watchdog, soft-deadline, attach-watchdog,
  gate-timeout, submit-stop, live-program and touch-unproven counters did not move. The
  live-program, attach-watchdog and gate-timeout counters also did not move from each
  gate confirmation through its room sample, nor from the inn sample's end to the
  Cottage entry.
- Visual review: all 18 images were read by eye. The arch stands at the new site in all
  three after gate frames, beside the prompt, and the same stance in the before frames
  shows the empty lawn between the two cottages. The prompt is legible, with the library
  tab look and the selected tab outlined. The Inn Room shows its bed and hearth and the
  Cottage its hearth, from the arrival point facing north. No overlay covers any frame.

Harness defects the re-shoot exposed, each fixed and pinned before the final chain: a
tutorial card or GPU notice dismissed after the prompt opened took the prompt's focus
(both now settle at the stance before the press); the chase camera could open a frame
swung round in front of the player (the stance hold now settles it in place on paired
turn keys, and refuses to under Mouse Camera, mouselook or attack-move); a leave could
carry the player past the gate's reach before the reopening press (the reopen now walks
back into reach); and the Cottage switch raced its own keystrokes under load (it now
waits for the sim record's tier). Earlier performance tours failed that last way; the
final tour passed on its first attempt, at a one-minute load average of 6.38 when it
finished.

Limits: the SwiftShader frames are evidence of what the frames show, not of GPU
preparation cost; the gate probe and the census state their own known limits in their
headers; the performance tour runs only the low preset.

The re-shoot's commands, in chain order (the before leg against the baseline's Vite on
5174; `SHOTS_DIR` under the gitignored `tmp/`):

```sh
DIFF_FILE=<diff> SHOTS_DIR=tmp/fh_capture/after NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
PERF_SCENARIO=bench_freehold_interiors PERF_GPU=1 PERF_PRESET=low PERF_OUT=tmp/fh_capture/performance.json node scripts/perf_tour.mjs
PR_SHOTS_FREEHOLD_BASELINE=1 GAME_URL=http://127.0.0.1:5174 DIFF_FILE=<diff> SHOTS_DIR=tmp/fh_capture/before NAV_TIMEOUT_MS=180000 ENTRY_SELECTOR_TIMEOUT_MS=180000 node scripts/pr_screenshots.mjs
node scripts/freehold_capture_receipt.mjs --before tmp/fh_capture/before --after tmp/fh_capture/after --performance tmp/fh_capture/performance.json --output docs/screenshots/freehold-interiors-2026-09-08 --baseline-root <codex-freeholds06-before> --baseline-url http://127.0.0.1:5174
npx vitest run tests/freehold_capture_contract.test.ts tests/freehold_interior_route.test.ts tests/pr_shot_targets.test.ts --maxWorkers=2
