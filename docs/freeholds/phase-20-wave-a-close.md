# Phase 20: wave A close (integration matrix, screenshots, the Cottage MVP PR)

Wave A, the Cottage MVP, closes here. The spec is `progress.md` "20 Wave A close"; the
matrix is `qa-checklist.md`; the decisions are `state.md` (D1 through D93; `brainstorm.md`
is the settled research record, not a decision source).
This phase writes no feature code: it runs the whole-feature matrix over the wave A diff,
fixes only what the matrix finds (test-first, reviewed), captures the before and after
screenshots, prepares the service/counsel handoff artifacts and a reviewable PR
description against the recorded base, then STOPS and asks Fernando for the push go
(D87): on the go the sanctioned push opens the wave A PR (D12's one PR per wave is owned
for every wave); otherwise the close ends local, awaiting the push go. It never merges.

## Complete Wave A screenshot matrix

Implementing file 20 and its QA own this complete matrix. Required baseline
sizes are desktop 1600x900, compact 874x402 and tablet 1180x820 from state "UX
screenshot viewports". Every row marked all-baseline gets a separate readable
capture at each size. Rows below group review responsibilities for readability
only. Every named state maps to its own explicit unique section 11 variant and
one image; no composite or last-state-only capture substitutes for an unobserved
arm. File names include target, scene, viewport, theme, preset, motion, input,
distribution, light/media profile and before/after identity. Missing required
after-state is a failure.

| Scenario target | Required visible state and assertion | Viewports | Primary owner |
|---|---|---|---|
| gate-own-choice; gate-friend-empty; gate-lookup-pending; gate-lookup-ready; gate-lookup-stale; gate-lookup-refused | Eastbrook semantic marker, real interact prompt, own/friend choice, no proximity teleport | All baseline | 06/18 |
| arrival-inn | New accepted owner transition with committed fresh first-tier directive, safe reveal, truthful plinth, welcome and no automatic panel | All baseline | 06/09/19 |
| arrival-cottage; arrival-ordinary-return; arrival-visitor | Cottage first-tier view requires fresh committed-winner directive; ordinary-return/visitor scenes have new ordinary welcome only and static camera | All baseline | 06/09/19 |
| interior-inn-day; interior-inn-night; interior-cottage-day; interior-cottage-night | Steady actual Inn/Cottage at pinned named day/night and fixed moon presets, safe static view, readable LOW window/hearth/material distinction; no build UI or fresh arrival replay | All baseline | 09; shared target extended by 11 |
| build-empty | No available furnishing copies, build.empty, no selectable item/ghost/confirm, usable tab/close | All baseline | 11 |
| build-ready; build-placed-selected; build-move-preview; build-remove-review; build-remove-refused | Owned-copy marks, palette/Trophies tab, recognizable ghost, real footprint, live decor/plinth/amenity meters | All baseline | 11 |
| build-blocked | Hatched/crossed footprint plus exact reason, confirm unavailable, full touch strip visible | All baseline | 11 |
| build-decor-full; build-plinth-full; build-amenity-full | Live used/limit and needed/remaining, no invented warning threshold, no false place success | All baseline | 11 |
| build-history-confirmed; build-history-undone; build-history-redone; build-history-stale | A real confirmed move, undo and redo, then stale inverse/refused-history explanation | All baseline | 11 |
| build-pending; build-refused; build-reconnect | Original operation pending then reconnect, last committed world, mutation paused, no duplicate send | All baseline | 11 |
| steward-bags; steward-vault; steward-automatic; steward-vault-unavailable | Actual needed/bags/vault split and all source modes, truthful source-named action | All baseline | 16 |
| steward-prepay-review | Full versioned bill batch and source deductions, covered-through date, confirmation cleanup | All baseline | 16 |
| steward-condition-30; steward-condition-29 | Condition 30 with amenity available, condition 29 with amenity paused and safe home explanation | All baseline | 13/16 |
| steward-inn | No-upkeep state with no payment component | All baseline | 16 |
| steward-pending; steward-refused; steward-reconnect | One in-flight material send, matching refusal, preserved source/week draft | All baseline | 16 |
| charter-ready; charter-reconciled (also website-desktop) | Accurate art/grant/free-room copy, current service quote and review; browser and website desktop capability | All baseline for web; desktop for website shell | 16 |
| charter-pending; charter-cancelled; charter-reconciling; charter-reconciled | Pending/cancelled/reconciled original intent, current receipt, no second purchase invitation | All baseline on allowed web | 15/16 |
| charter-quote-unavailable; charter-quote-expired | Explicit quote unavailable/stale, no zero-price fallback | All baseline on allowed web | 16 |
| charter-denied | No purchase or unapproved management component and accompanying DOM/accessibility/network assertions for every denied distribution | All baseline using injected actual surface verdict | 14/16 |
| trophies-owned; trophies-unearned-known; trophies-hidden | Eligible art, truthful known-source silhouette, hidden-source non-disclosure, no free invented feat | All baseline | 17 |
| trophies-provenance-known; trophies-provenance-unknown; trophies-maker; trophies-possession-inactive; trophies-plinth-preview; trophies-replace-review; trophies-clear-review; trophies-refreshing | Same public deed/page/mark/name/day for owner and visitor; unknown history explicit; selected plinth | All baseline | 17 |
| visit-read-only; visit-owner-away | Guest context, who-is-home, offline-owner permitted entry, Leave, absent owner controls | All baseline | 18 |
| visit-owner-building | Guest sees accepted layout plus decorating line, owner ghost absent by real wire proof | All baseline | 11/18 |
| visit-full; visit-private-refused | Authorized full refusal and privacy-safe unknown/private refusal preserve typed name | All baseline | 18 |
| visit-policy-draft; visit-policy-pending; visit-policy-saved; visit-policy-refused; visit-end-review; visit-end-pending; visit-end-succeeded; visit-revoked | Existing guest safely returned after End visit/revocation; no stale cached admission | All baseline | 18 |
| entry-pending; entry-error; entry-busy; arrival-online-delayed-cosmetics | Pending/failed room load or foreign-realm busy state, retry with no false loss/waitlist | All baseline | 06/07/18 |

Focused additions are mandatory, with the relevant baseline scene reused:

| Variant | Visible proof and nonvisual check |
|---|---|
| Parchment and highContrast/forced colors | Build blocked, Steward condition/payment and trophy provenance retain readable text/focus/shape through theme repair. |
| Reduced motion | Static arrival or immediate handback; no ghost pulse, animated hatch, auto-orbit, shimmer or flame-dependent state. Same controls and information. |
| LOW iOS and pressured light case | Explicit ios-effective-one and high-preset variants assert live light-profile state. Separate real LOW iOS/WebKit device captures prove engine/readability/input; Chromium UA emulation proves only the profile branch. |
| Keyboard | Real open/tab/grid/confirm/cancel/close sequence, focused control visible, no focus lost after relocalize or authoritative refresh. |
| Gamepad | Actual active-family glyphs and successful palette, move, rotate, nudge, confirm, undo and cancel sequence; no simultaneous combat action. |
| Touch | Real compact/tablet tap-only and drag arbitration, safe areas, target size and input floor; no action hidden under existing HUD or keyboard. |
| Portrait shell | Existing rotation-gate presentation remains correct; no claim of a playable portrait build editor. |
| Audio and mute | Separate event evidence: ordinary feedback only on a newly accepted delivered transition; no cue/directive remint on replay/resume or fresh-client recovery; commit-before-ACK may skip output. Matching placement/payment feedback, mute and spatial teardown still apply. Screenshots cannot prove sound. |
| Multiplayer/authority | Two-client public revision/privacy, full-cap/refusal, offline-owner admission and revocation; restart/receipt integration for paid results. Offline screenshot fixtures cannot prove these. |

Every owning UI file extends the source/mechanic tooltip fixture, focused painter
and invalidation/focus tests, mobile and theme guards, i18n, fairness and script
selection pins appropriate to its diff. File 20 records the screenshot manifest,
input/audio/LOW evidence, content/art finish and outstanding external release
sign-offs as gates. A screenshot is evidence of the recorded state and build,
never proof that all implementation, performance or service gates passed.

The wave close reviews the complete wave's feature code and interactions against
its actual full-wave diff and evidence. Prior per-file QA informs that integration
review but does not exclude feature behavior when the close's immediate edits are
documentation. Resolve every review finding including nits, then obtain a fresh
review of the entire fix round. Only named external signature artifacts remain
release gates; they are never deferred review findings.

The implementation plan's reviewer matrix applies to every owner: frontend,
accessibility/i18n, test coverage, render performance for materials/lights/scene
attach, parity/sim for feature behavior, and security/persistence/database review
for authority or spending. Parent implementation sessions run the shared gate
once and reviewers inspect its evidence; repeated ad hoc test runs do not replace
the canonical QA contract. This packet settles what they must build and prove.

Exact additional focused scene IDs from the section 11 manifest: build-keyboard-focused, build-pad-placement, build-touch-controls, portrait-rotation-gate, trophies-grid-focused. Each retains its declared input/view/media dimensions and one image per variant.

### Starter Prompt
```
This is Phase 20 of the Freeholds and Guildhalls feature: the wave A close (the
whole-feature integration matrix, the wiki and guide pass, before and after screenshots,
and the Cottage MVP PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (the matrix is a checklist run, not a build).

Goal: prove the Cottage MVP end to end on every host and every store build by running
every row of docs/freeholds/qa-checklist.md over the wave A diff, fix what the matrix
finds, capture screenshots, and prepare the wave A review package with
FREEHOLDS_ENABLED defaulting off; open the wave A PR only after Fernando's push go (D87),
then watch CI to green. Never merge.

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
- Memory scan: MEMORY.md and entries on "CI is the gate", "never push to fork", "PR merge
  needs approval", "no sensitive material in the open repo" (sweep EVERY push), screenshots
  at lowest graphics, capture rigs never find by English text, "format pass != check
  pass", "commits need bodies", the release-merge checkpoint entries.

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (Push policy, the per-phase ledgers 01 to 19, tracked release gates),
  docs/freeholds/progress.md (every wave A row 01 to 19 with its QA verdict and external release gates, and "20 Wave A close"), docs/freeholds/qa-checklist.md (every row), this file
- .github/PULL_REQUEST_TEMPLATE.md; .claude/skills/pr-screenshots/SKILL.md;
  scripts/pr_shot_targets.mjs (the housing targets Phases 11, 16, 17 and 18 added);
  docs/prd/woc/freehold-service-contract.md (Phase 15); .claude/skills/ci-triage/SKILL.md
- The wave diff: `git log --oneline <base>..HEAD` and `git diff <base>..HEAD --stat`
  where <base> is the merge-base with the base branch (origin/feature/masterwrought while
  PR #3872 is open, else the newest origin/release/**); every test file the wave added
  (`git diff <base>..HEAD --name-only -- tests/`); the docs/screenshots/ directory
- The matrix row anchors: tests/world_api_parity.test.ts, tests/env_protocol.test.ts,
  tests/freehold_determinism.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/snapshots.test.ts, tests/bandwidth.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/distribution_surfaces.test.ts,
  tests/freehold_store_gates.test.ts (Phase 14), tests/server/freehold_gates.test.ts
  (Phase 15), tests/client_shell.test.ts, tests/freehold_content.test.ts,
  tests/provisioner_firewall.test.ts, tests/professions_farming.test.ts,
  tests/professions_zone_rollout.test.ts, tests/freehold_condition.test.ts,
  tests/item_icons.test.ts, tests/item_art_consistency.test.ts,
  tests/deeds_content.test.ts, tests/reliquary_content.test.ts, tests/guide.test.ts,
  tests/i18n_completeness.test.ts, tests/localization_fixes.test.ts,
  tests/api_error_code_parity.test.ts, tests/renderer_compile_gate.test.ts,
  tests/monolith_budget.test.ts; .githooks/pre-push (the copy-rule scan of a diff: the
  repo has no copy:scan npm script, so the close runs that scan by hand over the wave diff)
- server/freehold_config.ts (the flag getter), .env.example (the flag row),
  src/game/distribution_surfaces.ts (the seven-row map), src/ui/i18n.catalog/hud_chrome.ts
  (the housing namespace, for the "earn" scan)
The agent returns: the matrix as a table of row, resolved command, and the test files
that exist on disk (naming any row whose suite does not exist under the checklist's
name); the list of screenshot targets with their ids and mobile variants; the PR base
branch and merge-base SHA; every explicit external release gate from rows 01 to 19; the
service contract handoff state and the counsel/Terms release checklist items; the flag
default and where it is pinned.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Complete Wave A readiness matrix. Run qa-checklist.md over the whole reviewed
   wave, all settled D decisions and ux-spec.md; require every preceding implementation
   and QA pair PASS. Include server/offline/headless parity, dark flags (including the
   D85 flag-unset server pin: no gate prompt, furnisher stock or Hearth Key on a dark
   realm), seven surface capabilities, atomic transfer/receipt crash races, bounded DB
   workloads and content provenance. Parent runs deterministic commands once with bounded
   workers and records command/exit/output path; the pg-armed twins run after
   `npm run db:up` with TEST_DATABASE_URL set to the URL state.md's "Validation matrix"
   server/ row gives, and each such row records "pg twins executed: N tests ran, 0 skipped"
   (the local gate sets no TEST_DATABASE_URL itself). The pre-merge bar is
   node scripts/gate_select.mjs (or the deeper npm run gate), plus the Stop-hook floor; ci:changed alone is not the
   contribution gate. Fix each actual failure test-first, dispatch relevant review and
   freshly review every fix. No unreviewed nit or missing artifact becomes a PASS.
2. Exact visual and input matrix. Execute the exact screenshot target/state matrix above
   on desktop 1600x900, compact 874x402 and tablet 1180x820, using the common housing
   helper and real HUD/Sim states. The approved constructor/descriptors expand to the
   wave A set of 330 unique variants (330 of the 733-variant program inventory in
   ux-spec section 11; each later close verifies its own milestone union); one capture
   callback produces one image. A transient sequence
   ending in success never substitutes for pending/refusal/reconnect images. Required after-shots fail on missing state. Capture
   #ui on touch to show safe-area strips, not a crop that hides them. Separate evidence
   proves the sanctioned arrival sound, skip/reduced-motion camera return, actual
   gamepad sequence and true two-client visiting. Confirm all final art IDs, measured
   LOW budgets and identical actionable ghost/blocked/capacity information at every
   tier, including iOS pressure fallback. Screenshots and recordings link to actual
   checked-in evidence; no still image is treated as payment/ACL proof.
3. Production handoffs and four-week measurement artifact. Record the
   service/counsel/Terms/listing artifact package as handoff-ready, with acceptance status
   recorded as an unsigned release gate unless a signature artifact is on file, together
   with the named release gates from state.md, including the lifecycle/rollout gate: 07's
   persistence-rollout-contract.md, 07b's lifecycle-policy-binding.md and
   lifecycle-db-contract.md and 13a's upkeep-calendar-db-contract.md are named unsigned
   gates (accepted, or still a named gate) that wave A is the first close to carry;
   preserve all earlier production/store-submission sign-off gates. Create the NEW root
   TERMS_AND_CONDITIONS_FREEHOLD_DRAFT.md from docs/prd/woc/freehold-terms-amendment.md
   as a redline against TERMS_AND_CONDITIONS.md (the
   TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md precedent, kept beside the live Terms,
   never replacing them), and record the submitted storefront metadata text and its
   digest per distribution in the evidence bundle; the amendment names both artifacts.
   At the packet end,
   phase-44a-final-codex-artwork.md must replace every residual feature-created
   placeholder icon/image with final Codex artwork and emit final-artwork-audit.md.
   Then phase-44b-final-legal-handoff.md revisits the actual built system, Terms, policy,
   territory and listing copies and emits docs/prd/woc/freehold-final-legal-handoff.md
   for the legal team with tracked sign-off. No early gate is postponed to that handoff;
   report external acceptance honestly without OPEN design questions. Produce the
   four-week measured Ledger report artifact at
   docs/freeholds/ledger-calibration-report.md (NEW FUTURE; the path later closes
   extend), defined by the content/calibration manifest: approved schedule IDs and
   versions, ordinary weekly gatherer output methodology, produce/nonproduce bill composition, source-mode demand, material
   availability/tradability, outage exclusions, costs and condition/absence behavior.
   Compare to retained Cottage 10% output target using measured observations, no
   promised market price increase. Owner is Fernando with economy-service acceptance;
   no production enable until literal bills and the report are signed. If the
   observation window has not elapsed, a runnable collection/report artifact and
   scheduled owner handoff are complete, while its production release gate stays
   visibly unaccepted. No invented data or silent approval by elapsed time.
4. Durable budget review and release preparation. Create the every-second-release
   housing budget review artifact at docs/freeholds/housing-budget-review.md (NEW FUTURE)
   with named Fernando/render/performance owners,
   measured LOW device scenarios, per-room assets/bytes/triangles/light allocations,
   admitted-player visibility and decision record. No automatic capacity increase.
   Complete wiki/guide and English-key/copy sweeps. Prepare a template-compliant MVP
   PR body with scoped behavior, all proof, default-off flags, seven surface summary,
   named external release gates and the mixed-release statement: FREEHOLDS_ENABLED
   defaults off; an old client against a new server and a new client against an old
   server both follow 08a's absent/null snapshot-key semantics; housing DDL is additive
   and re-applied under ensureSchema's advisory lock with JSONB back-compat; rollback
   quiesces new housing mutations while preserving accepted recovery identities
   (migration-safety verifies the statement). The push and the wave A PR happen only
   on Fernando's push go (STEP 4, D87); without it the branch stays local.
5. Fresh review and recorded next handoff. Whole-wave qa-checklist and all actual
   architecture, cross-platform, content, render, frontend, privacy, migration,
   database-performance, server-hot-path and test-coverage reviewers inspect evidence.
   Database review
   runs before decisions and on finished diff, including query/index/byte/queue and
   disposable-PG proofs. Apply all findings and obtain a fresh fix-round verdict.
   Record screenshot matrix, calibration/report and release gates, budget review,
   the local tip or PR number, the wave B branching choice and actual next file;
   nothing is marked built by this packet audit.

INVARIANTS THIS PHASE MUST KEEP:
- No feature work: only matrix fixes, screenshots, docs and the local review draft.
- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing use,
  purchase and approved website management, including complete submodel/handler/
  catalog/DOM/accessibility/error absence on denied surfaces. These are cumulative.
- No wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in any housing path reachable on
  App Store, Google Play, Steam, or Epic; no "earn" language in hudChrome.housing.*.
- Nothing purchasable changes a combat, progression, gathering, or drop number; nothing
  is destroyed; condition 0 still opens the door (the matrix rows prove it).
- i18n: the policy in docs/freeholds/implementation-plan.md; no locale overlay edited
  except the five M16 non-Latin fills for a new wordy English value (implementation-plan.md
  "The contributor i18n policy").
- Monolith ceilings not raised: a matrix fix that needs a line in src/sim/sim.ts,
  server/game.ts, or src/net/online.ts (all at ZERO slack) pays with an extraction and
  lowers the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text (docs/freeholds/ is
  the only place it lives); screenshots are captured at the lowest preset.
- Push policy: the push happens only after Fernando's explicit go (D87); origin only,
  never a fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Any wave B item: the Lodge tier, furnishings beyond the MVP set, the R8 pattern
  channels, the Legend Stand, the Kitchen Garden tableau, build mode v2, open-house
  visiting (Phases 21 to 26).
- Enabling FREEHOLDS_ENABLED anywhere; any deploy; any economy-service change.
- Raising a monolith ceiling or re-baselining any i18n artifact.

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer,
content-obligations-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- The whole qa-checklist.md matrix (STEP 2, Agent MATRIX) with every row PASS, then
  `npx tsc --noEmit` and `npm run ci:changed` after the last commit (read the exit code).
- Spawn per docs/freeholds/implementation-plan.md over the WHOLE wave diff: qa-checklist
  (the completion gate) plus every reviewer the matrix names: render-performance-reviewer
  (the render and perf row), content-obligations-reviewer (the content row),
  cross-platform-sync (parity, wire, events), privacy-security-review (server, net, store
  policy), migration-safety (the persistence row), frontend-seam-reviewer (the mobile
  row), architecture-reviewer, database-performance-reviewer and server-hot-path-reviewer
  (the complete transaction/receipt/query/queue and snapshot/cadence evidence) and
  test-coverage-auditor (the wave's pin suites and the fix commits). Prompt each for
  COVERAGE not filtering; each writes its report to a file. No PR while a BLOCKING
  finding stands.

- Required reviewers for the complete settled diff: all canonical whole-wave reviewers including database-performance-reviewer and
  server-hot-path-reviewer.
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE, THEN PUSH AND PR ON THE GO:
2 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- fix(<scope>): one commit per matrix finding, test-first, reviewed
- docs(screenshots): add the Freehold before and after captures
- docs(freeholds): record the wave A integration matrix results
- docs(freeholds): record the Freehold Charter service-contract handoff status
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.
Then STOP and ask Fernando for the push go (state.md "Push policy", D87), showing the
matrix table, the screenshot paths and the PR body draft; ask in the same message whether
wave B continues on the same branch after this PR merges or on a stacked branch (D12: one
PR per wave, each off the base), and record the answer in state.md. On the go:
`git push -u origin feature/freeholds` (origin only), then `gh pr create --base <the
recorded base branch> --title "feat(freeholds): the Cottage MVP" --body-file <the drafted
body>`, then `gh pr checks --watch`; on a red or stalled check run the ci-triage skill,
fix, push again and watch again. Stop at "pushed, green, ready for review". Without the
go, keep the verified branch local with the review-ready description, matrix and
screenshot references, and stop at "matrix green, awaiting push go".

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] Every qa-checklist.md row is recorded PASS in progress.md under "20 Wave A close"
  with the command that proved it; no row is marked by inspection.
- [ ] qa-checklist reports PASS; every dispatched reviewer confirms ALL findings, including nits, are resolved and freshly reviewed.
- [ ] Before and after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and linked from the PR body.
- [ ] docs/prd/woc/freehold-service-contract.md is handoff-ready and named in the PR body
  with its acceptance status recorded as an unsigned release gate unless a signature
  artifact is on file; the counsel/Terms acceptance status and the lifecycle/rollout
  artifacts (persistence-rollout-contract.md, lifecycle-policy-binding.md,
  lifecycle-db-contract.md, upkeep-calendar-db-contract.md) are named the same way as
  release gates; the PR body carries the mixed-release and rollback statement.
- [ ] The PR body names the recorded base, follows the PR template, contains no "phase"
  and links exact passing local gate evidence; FREEHOLDS_ENABLED is unset by default.
  Either the PR is open off the recorded base with `gh pr checks` fully green (push go
  given), or the branch is local at "matrix green, awaiting push go" (no go recorded).
- [ ] state.md records the local tip or the PR number, the wave B branching choice and
  the named release gates, including the two report paths.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 20: status, the matrix table, external release gates
  carried into wave B) and docs/freeholds/state.md (the local tip or PR number, the wave
  B branching choice, the "Current phase" line and any locked decision).
- Record surprising rules learned in memory with the local tip and exact next file.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL when one exists, the matrix table, files
touched, review verdicts, validation evidence, release gates and the FULL PATH of the
next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-20-qa.md

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment; never push to a fork; never merge or enqueue a PR.
- Stop if a matrix row fails for a design reason (a locked decision would have to
  change): record it in progress.md and name the owning phase file as the file to re-run.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
```
