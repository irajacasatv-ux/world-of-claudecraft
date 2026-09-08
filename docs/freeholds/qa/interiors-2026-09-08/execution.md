# Executed QA evidence

Final PASS ledger. Commands were run by the coordinator in
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds` on
`feature/freeholds`, unless a capture command names a separate baseline worktree.
Reviewer inspection is recorded separately. Test counts below overlap between
runs and must not be added as a count of unique tests.

## Preflight

| Command | Recorded result |
| --- | --- |
| `git status --short` | Clean before work. |
| `git fetch origin --prune` | Exit 0. |
| `gh pr view 3872 --json state,mergedAt,mergeCommit,baseRefName` | MERGED into `release/v0.42.0`, merge `6111e6d206`. |
| `git merge --no-edit origin/release/v0.42.0` | Exit 0, already up to date at release tip `57a2ced3bd`; no merge or dependency delta. |

## Initial checks before fixes

`npx tsc --noEmit`, `npm run i18n:gen`, `npm run wiki:content` and
`node docs/freeholds/generate-ux-manifests.mjs` each exited 0. UX generation was
byte-identical at 557 keys and 742 planned variants. `git status --porcelain`
after generation was empty. `npm run ci:changed` exited 0, with 584 files,
742 warnings, 16 informational diagnostics and no errors.

The following command exited 0: 11 files and 397 tests passed.
[Retained output](logs/initial-tests.log.txt).

```sh
npx vitest run tests/freehold_layouts.test.ts tests/freehold_gate_and_key.test.ts tests/housing_view.test.ts tests/renderer_compile_gate.test.ts tests/entity_display_name.test.ts tests/map_marker_semantics.test.ts tests/map_semantic_accessibility_core.test.ts tests/minimap_markers.test.ts tests/item_icons.test.ts tests/monolith_budget.test.ts tests/server/freehold_wire.test.ts --maxWorkers=4
```

The following command exited 0: 14 files and 586 tests passed, with three skips.
The skips are the `localization_fixes` release-only cases gated by
`I18N_RELEASE_TIER=1`. This is not a release-localization pass.
[Retained output](logs/scoped-tests.log.txt).

```sh
npx vitest run tests/freehold_instance.test.ts tests/dungeons.test.ts tests/architecture.test.ts tests/sim_context.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/item_art_consistency.test.ts tests/mobile_station_party.test.ts tests/command_schema.test.ts tests/env_protocol.test.ts tests/freehold_dev_grant.test.ts tests/i18n_completeness.test.ts tests/localization_fixes.test.ts tests/guide.test.ts --maxWorkers=4
```

The initial hardware GPU tour below exited 0 on unchanged `67281f8ed4`.
Desktop Inn/Cottage drew 145/145 frames and mobile drew 146/146. Each
arrival-through-sample live-program, attach-watchdog and gate-timeout delta was
zero; errors and budget-failure arrays were empty. Earlier cumulative events
were preserved. This run predates the fixes and does not satisfy final capture
acceptance. The local Vite process had `ALLOW_DEV_COMMANDS=1` for the real chat
fixture.

```sh
GAME_URL=http://127.0.0.1:5186 PERF_SCENARIO=bench_freehold_interiors PERF_GPU=1 PERF_PRESET=low PERF_OUT=/tmp/freeholds-06-qa-perf.json npm run perf:tour
```

Local PostgreSQL readiness succeeded using a loopback connection on port 5433
and `SELECT 1`. The coordinator selected only the database URL from the main
checkout environment, without sourcing it or displaying secrets. This proves
readiness, not a PG acceptance suite or durable account-authority race proof.

## Decisive red regressions and corrected attempts

| Area | Executed reproduction | Result and retained output |
| --- | --- | --- |
| Occupied arrival and refusal order | `npx vitest run tests/freehold_arrival.test.ts tests/freehold_gate_and_key.test.ts --maxWorkers=2` | Exit 1, nine expected failures and 50 passes; [red](logs/sim-red.log.txt). After fixes, exit 0, 64 passed; [green](logs/sim-green.log.txt). |
| Renderer dependency/disposal lifecycle | `npx vitest run tests/renderer_zone_dependency_lifecycle.test.ts --maxWorkers=2` | Exit 1, three expected failures and six passes; [red](logs/render-red.log.txt). |
| Capture route, selection and perf | `npx vitest run tests/freehold_interior_route.test.ts tests/pr_shot_targets.test.ts tests/perf_tour_entry.test.ts --maxWorkers=2` | Exit 1, 22 expected failures and 70 passes; [red](logs/capture-red.log.txt). |
| Server jail feedback and heavy projection | `npx vitest run tests/server/freehold_wire.test.ts --maxWorkers=4` | Exit 1, seven expected failures and 108 passes; [red](logs/server-red.log.txt). |
| Browser gate input | `npx vitest run --config vitest.browser.config.ts tests/browser/freehold_gate_input.browser.test.ts` | Exit 1, 14 failures and three passes before repair; [red](logs/ui-browser-red.log.txt). |
| Shared native-control key guard | `npx vitest run tests/panel_key_guard.test.ts --maxWorkers=4` | Exit 1, one expected failure and five passes; [red](logs/ui-guard-red.log.txt). |

Two filenames retained from iteration are misleading and are not credited as
passes: [sim-expanded-green](logs/sim-expanded-green.log.txt) contains one failed
stale jailed-feedback expectation and 94 passes; the corrected online suite is
included in the 180-test run below. [fix-typecheck-final](logs/fix-typecheck-final.log.txt)
contains the `inspect_window` HTMLElement/WebviewTag type error caused by a
browser fixture's global augmentation. The corrected fixture was followed by
`npx tsc --noEmit`, exit 0; [successful output](logs/typecheck-no-global.log.txt).

## Focused closure runs

The following server, command and finalizer command exited 0: seven files and
178 tests passed. [Retained output](logs/server-finalizer-green.log.txt).

```sh
npx vitest run tests/server/freehold_wire.test.ts tests/server/heavy_self.test.ts tests/heavy_self_arm_marks.test.ts tests/moderation_game.test.ts tests/command_schema.test.ts tests/monolith_budget.test.ts tests/zone_prewarm_finalize.test.ts --maxWorkers=4
```

The following capture, online and renderer command exited 0: seven files and
180 tests passed. [Retained output](logs/capture-render-green.log.txt).

```sh
npx vitest run tests/freehold_interior_route.test.ts tests/pr_shot_targets.test.ts tests/perf_tour_entry.test.ts tests/freehold_instance_online.test.ts tests/prewarm_resume.test.ts tests/zone_prewarm_finalize.test.ts tests/renderer_lifecycle.test.ts --maxWorkers=4
```

The focused gate browser command before fresh-review repairs exited 0: one file and 28 tests passed.
It executes real keyboard, pad and trusted touch paths, IME, focus return and
presentation interactions. [Retained output](logs/ui-browser-final.log.txt).

```sh
npx vitest run --config vitest.browser.config.ts tests/browser/freehold_gate_input.browser.test.ts
```

The initial persistence command below exited 0: one file and six tests passed.
[Retained output](logs/key-persistence-green.log.txt). The later bank regression
command below provides the stronger current proof.

```sh
npx vitest run tests/freehold_key_persistence.test.ts --maxWorkers=2
```

The renderer/content command below exited 0: 15 files and 214 tests passed,
with three release-only localization skips: server DICT copied-English, admin
DICT copied-English, and the S3 localized-emitter assertion across all 21 locales.
The feature branch intentionally uses PR tier; these `RELEASE_TIER` guards in
`tests/localization_fixes.test.ts` are not a release-localization pass.
[Retained output](logs/render-content-final.log.txt).

```sh
npx vitest run tests/renderer_zone_dependency_lifecycle.test.ts tests/zone_character_dependencies.test.ts tests/zone_character_dependency_wait.test.ts tests/prewarm_instance_lifecycle.test.ts tests/freehold_interior_dressing.test.ts tests/zone_prewarm_groups.test.ts tests/zone_prewarm_finalize.test.ts tests/prewarm_resume.test.ts tests/renderer_lifecycle.test.ts tests/monolith_budget.test.ts tests/freehold_dungeon_defs.test.ts tests/localization_fixes.test.ts tests/i18n_completeness.test.ts tests/item_art_consistency.test.ts tests/system_text_i18n.test.ts --maxWorkers=4
```

Deliberate filtered parity recording and verification each exited 0: two tests
passed and 88 were excluded by the name filter. Only the expected
`freehold_claim` trace was regenerated. The second character now lands one yard
forward; matching state and narrative event digests changed, while RNG draw count
and digest did not. This is not a full parity-suite pass.
[Record](logs/parity-remint.log.txt), [verify](logs/parity-remint-green.log.txt).

```sh
UPDATE_PARITY=1 npx vitest run tests/parity/parity_g.test.ts -t freehold_claim --maxWorkers=2
npx vitest run tests/parity/parity_g.test.ts -t freehold_claim --maxWorkers=2
```

Superseded auxiliary logs are retained for traceability, not credited as the
final acceptance matrix because their exact command flags were not transcribed:
[action-slot iteration](logs/actionbar-green.log.txt),
[early renderer iteration](logs/render-green.log.txt),
[early UI unit iteration](logs/ui-unit-green.log.txt) and
[filtered receipt development](logs/receipt-final-test.log.txt). Their summaries
show respectively 65, 33, 33 and three passing tests; the receipt run excluded
three tests by its name filter. Required current coverage must come from the
fully transcribed runs or final shared gate, not these filenames alone.

Canonical fix-time generation ran through `npm run i18n:gen`,
`npm run wiki:content` and `node docs/freeholds/generate-ux-manifests.mjs`.
The [i18n](logs/fix-i18n.log.txt), [wiki](logs/fix-wiki.log.txt) and
[UX](logs/fix-ux.log.txt) outputs are retained. UX remains byte-identical.
Renderer byte changes were followed by the owning
`node scripts/assets/eastbrook_grand_armoury/remint_polish_provenance.mjs`
tool; [output](logs/eastbrook-remint.log.txt). Generated evidence and its literal
pins were refreshed together, rather than hand-editing generated data.

## First fresh-review repairs

FFR01 bank-held key regression and repair: exit 0, three files and 177 tests
passed. [Retained output](logs/bank-key-green.log.txt).

```sh
npx vitest run tests/freehold_key_persistence.test.ts tests/freehold_gate_and_key.test.ts tests/server/freehold_wire.test.ts --maxWorkers=4
```

FFR02 duplicate result/status repair and refreshed presentation captures: exit 0,
28 browser tests passed; [retained output](logs/friend-result-green.log.txt).
The resulting 20 presentation fixtures replace the
images with duplicate text. The subsequent IME regression also passed, as recorded below.

```sh
VITE_FREEHOLD_PRESENTATION_CAPTURE=1 npx vitest run --config vitest.browser.config.ts tests/browser/freehold_gate_input.browser.test.ts
```

The companion housing, prompt and focus run exited 0: three files and 87 passed.
[Retained output](logs/friend-result-unit.log.txt).

```sh
npx vitest run tests/housing_view.test.ts tests/freehold_gate_prompt.test.ts tests/focus_restore.test.ts --maxWorkers=4
```

`npx tsc --noEmit` after these runtime repairs exited 0.
[Retained output](logs/final-runtime-typecheck.log.txt).

The additional IME-focused command exited 0: one file and 23 tests passed.
[Retained output](logs/ime-green.log.txt).

```sh
npx vitest run tests/freehold_gate_prompt.test.ts --maxWorkers=2
```

These bank and result repairs are committed in
`8e9f11d4eefe8d2a77551ab9022b83dc1fabcc49`. The fresh reviewer accepted both
repairs; the final independent report accepts the entire fix round and evidence.

## Final hardware GPU measurement

The final `bench_freehold_interiors` tour exited 0, with raw evidence generated
at `2026-09-08T21:37:37.430Z` and retained by the coordinator at
`/tmp/freeholds-06-final-perf.json`. [Console output](logs/final-perf.log.txt).
The coordinator collected exit 0 from the following exact command; redirection
retains the complete console output. The durable raw and normalized records are linked in the canonical capture
receipt section below.

```sh
GAME_URL=http://127.0.0.1:5186 PERF_SCENARIO=bench_freehold_interiors PERF_GPU=1 PERF_PRESET=low PERF_OUT=/tmp/freeholds-06-final-perf.json npm run perf:tour > /tmp/freeholds-06-final-perf.log 2>&1
```

All four measured interior/viewport windows drew 146 frames. Inn/Cottage draw
calls were 33/28; requested preset was low, effective preset was 1 and effective
material tier was low. Each required raw arrival-through-sample live-program,
attach-watchdog and gate-timeout delta was zero. Both viewport `errors` and
`budgetFailures` arrays were empty. Two ignored HTTP 502 console errors per
viewport remain in the raw evidence. This is not a clean-backend or physical-phone
claim; the raw counters and earlier cumulative events are preserved.

## Canonical functional capture receipt

The baseline producer used the exact command below. The coordinator collected
exit 0; the producer log itself does not emit a process exit code. It records
all nine baseline outputs, now retained byte-for-byte in the canonical receipt.
[Retained baseline output](logs/before-shots.log.txt). The baseline application
remained at `654071354172b3e252cfc03a1e85efde2daddaa6` without application changes.

```sh
PR_SHOTS_FREEHOLD_BASELINE=1 GAME_URL=http://127.0.0.1:5187 DIFF_FILE=/tmp/freeholds-06-shots.diff SHOTS_DIR=/tmp/freeholds-06-before-shots node scripts/pr_screenshots.mjs
```

The final after-capture command exited 0 and produced all nine after images.
[Retained output](logs/after-shots-final.log.txt).

```sh
GAME_URL=http://127.0.0.1:5186 DIFF_FILE=/tmp/freeholds-06-shots.diff SHOTS_DIR=/tmp/freeholds-06-after-shots-final node scripts/pr_screenshots.mjs > /tmp/freeholds-06-after-shots-final.log 2>&1
```

The parent personally inspected all nine after images. The fresh independent
reviewer inspected all eighteen before/after images. The canonical directory
contains exactly nine registry variants, eighteen PNGs and eighteen sidecars,
three raw/normalized producer pairs, and the receipt: 43 artifacts total.
The before side is the actual absent-surface release quay, not a fabricated
historical prompt or room.

The receipt command exited 0 and sealed eighteen matched captures plus three
unmodified producer records. [Retained output](logs/final-receipt.log.txt).

```sh
node scripts/freehold_capture_receipt.mjs --before /tmp/freeholds-06-before-shots --after /tmp/freeholds-06-after-shots-final --performance /tmp/freeholds-06-final-perf.json --output docs/screenshots/freehold-interiors-2026-09-08 --baseline-root /Users/fernando/orca/workspaces/world-of-claudecraft/codex-freeholds06-before --baseline-url http://127.0.0.1:5187 > /tmp/freeholds-06-final-receipt.log 2>&1
```

The [canonical receipt](../../../screenshots/freehold-interiors-2026-09-08/acceptance.json)
binds 42 source inputs and observes current head
`8e9f11d4eefe8d2a77551ab9022b83dc1fabcc49` and baseline runtime
`654071354172b3e252cfc03a1e85efde2daddaa6`. These are **receipt-time** Git/source
checks after the producers completed, not a claim that the producers themselves
recorded Git state at capture time. Current and baseline dirty paths are retained.
The baseline application is unchanged; its current capture harness is separately
identified in the receipt.

Raw producer buffers are retained byte-for-byte beside normalized JSON:
[before](../../../screenshots/freehold-interiors-2026-09-08/before-manifest.raw.json),
[after](../../../screenshots/freehold-interiors-2026-09-08/after-manifest.raw.json),
and [performance](../../../screenshots/freehold-interiors-2026-09-08/performance.raw.json).
The normalized [performance record](../../../screenshots/freehold-interiors-2026-09-08/performance.json)
retains the measured counters and diagnostics described above.

The baseline contains 131 reviewed diagnostics: 29 HTTP 502 responses and 102
inherited character-preload messages. The after set contains 28 diagnostics, all
HTTP 502 responses. None remains unclassified. These diagnostics are retained
under the functional-shell capture scope; this is not an absence-of-errors or
backend-availability claim. No warning overlay was hidden to manufacture a clean
image.

The complete capture-contract command exited 0: one file and six tests passed,
with no name-filter exclusions. [Retained output](logs/capture-contract-final.log.txt).
It checks matched image/sidecar identities, raw/normalized consistency, source
seals and negative receipt cases.

```sh
npx vitest run tests/freehold_capture_contract.test.ts --maxWorkers=2 > /tmp/freeholds-06-capture-contract-final.log 2>&1
```

## Supplemental presentation evidence

The [presentation README](../../../screenshots/freeholds-06-presentation/README.md)
records the fixture scope. All 20 PNG headers are observed at 333 by 720 pixels,
despite a requested 390 by 844 because of browser-runner iframe scaling. They
prove the displayed narrow layout and named composed states only. Canonical
compact captures at 874 by 402 remain the actual viewport and touch-target
proof. This is an evidence limit within TC02, not another defect or a
physical-device claim. Injected visiting results do not prove production online
authority.

## Historical evidence checkpoint before the final runs

At this checkpoint, final canonical freshness, the PostgreSQL/browser shared
gate and the fresh reviewer's final verdict were still outstanding. All three
subsequently completed successfully, as recorded in the final results below.
Only the separate verdict commit and its subsequent actual-last-commit
`npm run ci:changed` remain prospective when this ledger is written.

The earliest key-capture attempt exited 1, as recorded by the coordinator.
Its [retained log](logs/key-capture-attempt-1.log.txt) reports a missing personal-bank
Hearth Key hover selector during a desktop bank-paint wait race. The log records
an uncaught error but does not print the exit code or exact launcher; no missing
launcher flags are reconstructed here. This was a capture timing failure,
superseded by the successful settled run, not a new production defect.

The actual-key command below exited 1 on its second attempt: the full desktop route produced four accepted captures,
but compact mode could not reach the Hearth Key bag item after 120 Tab presses.
[Retained attempt output](logs/key-capture-attempt-2.log.txt). The producer retained
`/tmp/freeholds-06-key-shots-final/compact-failure.png` and its evidence. The revised compact producer now uses explicit automated DOM focus to invoke
the shipping bag tooltip. It makes no genuine keyboard-only or touch-only tooltip
navigation claim. Actual touch opening, held drag, deposit, withdrawal and key
use remain real inputs. This failed attempt is superseded by the passing settled
run below; it remains a capture attempt, not an additional production defect or accepted compact
evidence.

```sh
GAME_URL=http://127.0.0.1:5186 KEY_SHOTS_DIR=/tmp/freeholds-06-key-shots-final node scripts/freehold_key_capture.mjs > /tmp/freeholds-06-key-capture-final.log 2>&1
```

The metadata-corrected third key attempt reran both variants with the command
below and exited 1. Despite the `accepted` directory/log name, this is failed
attempt evidence. Desktop completed the full route; compact bag tooltip and
held-touch action placement passed, then bank deposit timed out with the key
still carried. [Retained output](logs/key-capture-attempt-3.log.txt). The screenshot
shows the mobile bank/Bags split layout. No production runtime defect is claimed.
The key script is outside the canonical receipt's source-input set, so this
attempt does not alter that receipt.

```sh
GAME_URL=http://127.0.0.1:5186 KEY_SHOTS_DIR=/tmp/freeholds-06-key-shots-accepted node scripts/freehold_key_capture.mjs > /tmp/freeholds-06-key-capture-accepted.log 2>&1
```

## Capture environment hygiene correction

Fresh reviewer finding FFR03 identified the new `KEY_SHOTS_DIR` override missing
from `turbo.json` `globalPassThroughEnv`. The coordinator added the single entry
alongside the existing screenshot-directory convention. This resolves a Biome
hygiene warning; no direct-Node cache bug was demonstrated, and neither runtime
nor capture-producer hashes changed.

The following inspection exited 0, checking four files with no Biome findings or
writes. The ordinary npm configuration warnings remain in the retained log.
[Retained output](logs/capture-code-clean.log.txt).

```sh
npx biome check scripts/freehold_capture_receipt.mjs scripts/freehold_key_capture.mjs tests/freehold_capture_contract.test.ts turbo.json > /tmp/freeholds-06-capture-code-clean.log 2>&1
```

The gate task-cache regression command exited 0: one file and 14 tests passed.
[Retained output](logs/capture-env-green.log.txt).

```sh
npx vitest run tests/gate_task_cache.test.ts --maxWorkers=2 > /tmp/freeholds-06-capture-env-green.log 2>&1
```

The canonical capture/receipt and presentation work is committed separately in
`713f18e41f53272de26e33fd1bfcfa65d51cb09b`. The corrected shared gate and final independent verdict both pass, as recorded below.

## Settled touch-bank capture attempt

After inspecting the shipping guards and mobile split layout, the coordinator
added bounded observations that require the bank hit target to be stable and
unobscured before a true touch deposit or withdrawal. The fresh reviewer accepted
this capture helper. It does not mutate runtime state, and no new production
finding was added. The following producer run exited 0, with a distinct output directory and log.
Both variants completed the route. [Retained output](logs/key-capture-settled.log.txt).
This closes CO01 within the 36-finding source/evidence round after the
GI02/GI03/GI04 follow-ups; the complete corrected gate and final independent review pass.

```sh
GAME_URL=http://127.0.0.1:5186 KEY_SHOTS_DIR=/tmp/freeholds-06-key-shots-settled node scripts/freehold_key_capture.mjs > /tmp/freeholds-06-key-capture-settled.log 2>&1
```

The accepted [key evidence](../../../screenshots/freeholds-06-key/evidence.json)
and [scope README](../../../screenshots/freeholds-06-key/README.md) are committed
in `1e322d90c29abac3c355653a1fc1872abead82d9`, together with the producer and
FFR03 environment declaration. Both variants have `passed: true`. Eight images
show bag tooltip, action assignment, bank tooltip and actual key use: desktop
1600 by 900 pixels at DPR 1; compact 1748 by 804 pixels from an 874 by 402 CSS
viewport at DPR 2. Source and image hashes and dimensions were checked by the
coordinator. The parent inspected all final compact images, and the fresh reviewer has
completed inspection of all eight final key images. Together with the canonical
and presentation sets, independent visual review covers all 46 PNGs.

Both routes observe one permanent key after activation and one positive account
travel deadline. Drag assignment leaves entry state unchanged; deposit and
withdrawal use the supported personal-bank UI. Desktop retains five console
HTTP 502 diagnostics and compact three; both page-error arrays are empty. No
console diagnostic is erased or relabeled as absent. The screenshot/report
producer bytes are retained; failed-attempt logs remain in this packet.

Compact tooltips explicitly use automated DOM focus to invoke the shipping
focus handler in the emulated touch layout. The evidence does not establish
keyboard-only or touch-only tooltip navigation, a phone software keyboard,
physical-device behavior, online entitlement or cross-realm cooldown. Actual
touch opening, held drag, bank deposit/withdrawal and key activation remain real
inputs. No runtime defect was added to the finding count for the capture retries.

## First selected shared-gate attempt

The coordinator started the canonical gate with `WOCC_EXPECT_PG=1` and a verified
loopback PostgreSQL test URL on port 5433 supplied only as `TEST_DATABASE_URL`.
`DATABASE_URL` was explicitly excluded. The connection string was neither sourced
into the shell from an environment file nor printed.

The reproducible repository command is:

```sh
WOCC_EXPECT_PG=1 node scripts/gate_select.mjs
```

Provide `TEST_DATABASE_URL` through the local process environment for the intended
disposable test database before that command. The session used the temporary
operational wrapper `node /tmp/freeholds-06-run-selected-gate.mjs`, with output
redirected to `/tmp/freeholds-06-selected-gate.log`, solely to supply the verified
credential and environment isolation. That temporary path is not a repository
prerequisite or reusable entry point. The first attempt exposed GI02 in `tests/ci_workflow.test.ts`, a real sparse-cone
reference failure. The coordinator gracefully cancelled Vitest after identifying
and fixing it, then collected wrapper exit 130. This is not a completed full
suite or passing shared gate. [Retained interrupted output](logs/selected-gate-attempt-1.log.txt).

## CI evidence-cone correction and gate restart

GI02 adds `docs/screenshots/freeholds-06-key/` and
`docs/screenshots/freeholds-06-presentation/` to all five sparse CI checkout jobs
and updates their common literal pin. The source-derived reference corpus,
index discovery, self-exclusion, bidirectional set equality and adversarial
controls are unchanged. The coordinator staged the draft QA references before
the check so the intended committed reference corpus participated.

The following command exited 0: one file and 27 tests passed.
[Retained output](logs/sparse-cone-green.log.txt).

```sh
npx vitest run tests/ci_workflow.test.ts --maxWorkers=2 > /tmp/freeholds-06-sparse-cone-green.log 2>&1
```

Independent gate-integrity follow-up verified: computed visibility PASS;
full-suite widening PASS; unchanged partitions and all-five-cone pinning PASS;
exit propagation PASS; retry review not applicable because retry logic is
unchanged; no new cap, skip or substitution PASS. No guard was weakened. GI02 is
committed in `c3dd49f191de3009ddbb043e49a9ba7e2f46abb8`. At that checkpoint
(2026-09-08), the ledger had 34 implemented and independently reviewed findings.
GI03 was discovered subsequently. Independent inspection has completed all 46
final PNGs.

The coordinator restarted the same canonical full gate, with the same isolated
verified PostgreSQL environment described above, on this frozen source/artifact
head. Its operational invocation is
`node /tmp/freeholds-06-run-selected-gate.mjs > /tmp/freeholds-06-selected-gate-final.log 2>&1`.
Use the canonical `node scripts/gate_select.mjs` entry point for reproduction;
the temporary wrapper only supplies the safe local test-database environment.
This second run completed with exit 1, exposing only GI03 in
`tests/loopback_guard.test.ts` and GI04 in `tests/release_v039_icon_art.test.ts`.
The coordinator let it finish to surface every full-suite failure. It is not a
passing gate; the complete result is recorded below, followed by the third run. The separately authorized verdict documentation is packaged after the completed gate.

## Loopback importer inventory correction

The second full gate found GI03: the exact importer inventory in
`tests/loopback_guard.test.ts` omitted `scripts/freehold_key_capture.mjs`.
The producer already calls `assertLoopbackUrl` before browser creation and does
not open a PostgreSQL connection. The correction adds one entry to
`URL_GUARDED_SCRIPTS`; it does not weaken the exhaustive importer guard or change
the runtime/producer.

The coordinator collected targeted red exit 1, with one failing and 36 passing
cases, followed by green exit 0 with all 38 cases passing, including the new
per-script assertion. The retained [red](logs/loopback-red.log.txt) and
[green](logs/loopback-green.log.txt) outputs identify the suite and results.
Both targeted invocations were collected with the following exact commands. The
coordinator also reports the one-file Biome inspection and `git diff --check`
passing. The documentation worker reran no check.

```sh
npx vitest run tests/loopback_guard.test.ts --maxWorkers=2 > /tmp/freeholds-06-loopback-red.log 2>&1
npx vitest run tests/loopback_guard.test.ts --maxWorkers=2 > /tmp/freeholds-06-loopback-green.log 2>&1
```

GI03 is independently closed and committed in
`524942c6b43ce8444a4fd491e5ea4ddde4a007bd`.

## Live hotbar-art inventory correction

GI04 is the stale current-production painted hotbar census after FE04 makes the
Hearth Key eligible for action slots. `tests/release_v039_icon_art.test.ts` now
pins the live count at 98, updates its comment and explicitly includes the key.
The historical 81/81 acceptance record, artwork and seals are unchanged. The fix
is committed in `957a93b05b418ac5baf7c164679b7bd72017b3c6` and independently
closed. GI03 is likewise independently closed at `524942c6b4`.

The red command exited 1, with one failure and four passes.
[Retained output](logs/release-icon-red.log.txt).

```sh
npx vitest run tests/release_v039_icon_art.test.ts --maxWorkers=2 > /tmp/freeholds-06-release-icon-red.log 2>&1
```

The following corrected command exited 0 with **two files and 13 cases passed**.
`tests/action_bar.test.ts` does not exist, so its inclusion in the filter provides
no action-bar coverage. This mistaken filter is explicitly excluded from that
claim. [Retained output](logs/release-icon-green.log.txt).

```sh
npx vitest run tests/release_v039_icon_art.test.ts tests/item_art_consistency.test.ts tests/action_bar.test.ts --maxWorkers=2 > /tmp/freeholds-06-release-icon-green.log 2>&1
```

The actual companion controller suite then exited 0 with one file and 65 cases
passed. [Retained output](logs/actionbar-final.log.txt).

```sh
npx vitest run tests/action_bar_controller.test.ts --maxWorkers=2 > /tmp/freeholds-06-actionbar-final.log 2>&1
```

No additional finding is counted for the corrected command filter.

## Completed second gate and final gate invocation

The second full gate exited 1 at the full Vitest stage. It completed 4,210 files:
4,208 passed and two failed. Its 63,255 cases consist of 63,224 passes, two
failures, two expected failures and 27 skips, in 832.70 seconds. **The only two
failures were GI03 and GI04.** [Retained full attempt output](logs/selected-gate-attempt-2.log.txt).
The `-final` operational filename is not a passing verdict. Later gate stages
were not reached, so no complete build/browser/shared-gate acceptance is claimed
from this attempt.

All 36 source/evidence findings were fixed with focused evidence. The coordinator started a third
complete gate on frozen source/artifact head
`957a93b05b418ac5baf7c164679b7bd72017b3c6`, using the same isolated, verified
PostgreSQL wrapper and canonical `node scripts/gate_select.mjs` command. Its
operational invocation is:

```sh
node /tmp/freeholds-06-run-selected-gate.mjs > /tmp/freeholds-06-selected-gate-accepted.log 2>&1
```

The temporary wrapper remains a credential-isolation detail, not a reproduction
prerequisite. The `accepted` log filename is also **not** a verdict. The third
run completed with coordinator-collected exit 0 and all twelve steps green. The
complete result is recorded below.

## Reported skip and expected-failure attribution

Both the completed second full-suite output and the final passing third run
report **27 skipped cases** and **two expected failures**. The fresh reviewer reconstructed the skip sources and enabling
conditions below, and the counts sum to 27. This is source/condition attribution
matching the reported aggregates, **not per-case runtime skip output**.

| Source condition or existing exclusion | Cases | Scope |
| --- | --- | --- |
| `I18N_RELEASE_TIER` | 10 | Deed 1; Reliquary 1; `i18n_t_behavior` 1; `i18n_status_registry` 1; `localization_coverage` 3; `localization_fixes` 3. The feature branch uses PR tier, so release-tier localization is not claimed. |
| `MEDIAWIKI_SEED_RELEASE_TIER` | 1 | Conditional release seed verification. |
| `RESET_REHEARSAL_INPUT` | 1 | Conditional reset rehearsal requiring its supplied input. |
| `WOCC_PG_DIFFERENTIAL` | 5 | `client_perf_summary_sql` 2 and `deeds_board_sql` 3. Optional differential proof is not claimed. Ordinary PostgreSQL and CI-presence checks remain armed. |
| `HUD_PERF_BUDGET_TOUR` | 4 | Optional supplied HUD performance-tour evidence. |
| `PERF_GATE_WALLCLOCK` | 2 | Optional wall-clock performance checks. |
| `RENAME_PROOF` / default-HEAD golden identity | 1 | Rename experiment not active when default-HEAD goldens are identical. |
| Superseded Armoury temporary-stage checks | 2 | The final pipeline checks remain enabled. |
| Explicit `custom_map_parity` biome-painted reshape exclusion | 1 | Existing skipped reshape case. |
| Total | 27 | Matches the completed second-run and final third-run aggregates. |

All files containing these conditions are unchanged from the fix-round base
`67281f8ed4`. No required Freehold acceptance check is omitted by this list, and
no optional differential or release-only bar is credited as passed. The ordinary
PostgreSQL/CI-presence path is armed by the isolated wrapper described above;
this distinction does not claim the later 07/07a account-authority proof.

The two expected failures are the existing Vale Coast and Frost Terraces
discontinuity pins in `terrain_window_seams`, also unchanged from the fix-round
base. They are distinct from the two genuine GI03/GI04 failures in the second
attempt. The fresh final review includes this attribution and its evidence limit.

## Final shared-gate completion record

**PASS, actual exit 0 collected by the coordinator.** The third complete run used
frozen source/artifact head `957a93b05b418ac5baf7c164679b7bd72017b3c6` and the
verified PostgreSQL environment described above. Its operational invocation is
shown in the preceding section; the reproducible repository entry point is
`WOCC_EXPECT_PG=1 node scripts/gate_select.mjs` with the separately supplied
loopback `TEST_DATABASE_URL`. The planner compared `origin/release/v0.42.0`,
observed 1,681 changed paths and correctly widened to all 4,210 discovered test
files with eight Vitest workers. The [complete raw log](logs/selected-gate-final.log.txt)
ends `PASS: all 12 steps green (vitest workers: 8)`.

| Step | Executed surface | Observed result |
| --- | --- | --- |
| 1 | i18n, wiki and SFX producer group | Three successful tasks, three cache hits. |
| 2 | i18n generated-artifact freshness | Passed. |
| 3 | SFX manifest regeneration | Passed. |
| 4 | Media manifest regeneration | Passed. |
| 5 | Manifest trackedness | Passed. |
| 6 | Manifest freshness | Passed. |
| 7 | `npm run security:gate` | PASS: 9,043 files, 457 flags, zero high flags after priors. |
| 8 | `npm run ci:changed` | Exit 0: 604 files, 775 warnings, 16 infos, no errors. This is the check after the final source fix, before the verdict commit. |
| 9 | `vitest run --maxWorkers=8` | 4,210 files passed; 63,227 tests passed, two expected failures and 27 skips, total 63,256; 903.89 seconds. |
| 10 | `npm run test:browser` | 51 files and 429 tests passed, no reported skip; 14.37 seconds. |
| 11 | Turbo typecheck and environment/server/bot builds | Five successful tasks, one dependency cache hit; main TypeScript, admin Svelte and bot TypeScript checks completed. |
| 12 | Turbo client bundle | Three successful tasks, two dependency cache hits; bundle executed in 4.39 seconds. |

Ordinary integration PostgreSQL and the CI-presence sentinel were armed. The log
reports PostgreSQL 160014 and the real 2,048-row escrow prefix fixture with its
observed timings. The optional differential and release-tier exclusions are
bounded above; this is not future production Freehold account-authority proof.

The successful log retains npm, experimental, browser shader-extension,
dynamic-import and bundle-size diagnostics. It also records a nonfatal Svelte
config-discovery error for the unchanged older archive at
`docs/screenshots/freehold-crafted-content-2026-09-07/runtime/vite.config.mjs`.
The actual admin check reports `svelte-check found 0 errors and 0 warnings` and
exits successfully. No diagnostic-free build or console claim is made.

The browser suite refreshed five unrelated cosmetics/gathering PNGs. The
coordinator first established those paths were clean before the gate, preserved
the generated bytes under `/tmp/freeholds-06-incidental-browser-output`, and
restored only their known pre-gate HEAD bytes. They are excluded from the verdict
change. The fresh reviewer verified the preservation and absence of a screenshot
tree diff; no runtime, script, test or configuration change followed this gate.

The [fresh independent final review](reviews/fresh-fix-review.md) records PASS
for `67281f8ed40f0e20c9c9a438e38177e49b0c50ab..957a93b05b418ac5baf7c164679b7bd72017b3c6`,
all 36 source/evidence findings, all 46 final PNGs, provenance and complete gate evidence.
Historical initial judgments and both nonpassing gate attempts remain intact.
Final documentation review then identified DOC01: the old checkpoint above still
described completed evidence as pending. Its corrected historical wording closes
that nit without a source or test change. Progress row `06 QA` and the state
ledger/Gotchas record the final scoped PASS: 37 found and 37 fixed.

The coordinator will make the separate verdict/documentation commit, then run
`npm run ci:changed` after that actual last commit. That subsequent check has not
yet run and is not claimed here. Its actual outcome belongs in the final task
handoff. No push, merge or production activation is performed or claimed.
