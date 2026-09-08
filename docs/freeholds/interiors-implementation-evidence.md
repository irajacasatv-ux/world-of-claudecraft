# Freehold interiors implementation evidence

Implementation branch: `feature/freeholds`, worktree `wocc-freeholds`.
Review and screenshot baseline: `654071354172b3e252cfc03a1e85efde2daddaa6`.
The baseline includes the completed release merge and its audit fixes.

Status: implementation complete and ready within the requested scope. All 12 shared-gate stages passed with Postgres enabled.
This receipt does not sign the separate follow-on QA packet or later delivery gates.

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
The retained record fingerprints 31 source inputs and four identical baseline harness files.

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
