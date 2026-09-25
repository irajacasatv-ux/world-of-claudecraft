# Phase 27: wave B close (the integration matrix, screenshots, the wave B PR)

Wave B, the Lodge tier and the rest of the first wave, closes here. The spec is
`progress.md` "27 Wave B close"; the matrix is `qa-checklist.md`; the decisions are
`state.md` (D1 through D93, and the wave B branching choice recorded at the wave A close
under D87); `brainstorm.md` is the settled research record, not a decision source.
This phase writes no feature code: it runs the whole-feature matrix over the wave B diff,
fixes only what the matrix finds (test-first, reviewed), captures the before and after
screenshots, and opens the wave B PR (or pushes the stacked branch) once Fernando
sanctions the push. It stops at "pushed, green, ready for review" or, without the push
go, at "matrix green, awaiting push go", and never merges.

## Deliverables (at most five):

1. Whole-wave B integration matrix including 25a and its QA.
2. Before/after desktop, compact and tablet screenshots.
3. Fresh wiki and signed-artifact release readiness record.
4. Scoped reviewed matrix fixes and fresh verification of their complete fix round.
5. Reviewable PR package with separately authorized push and green current-head CI.

## Complete wave evidence

The close includes every suffixed implementation and QA pair in its wave: 25a in B,
28a, 30a and 32a in C. All content manifests and approved numeric provenance rows must be
complete; no shipped stand-in or missing reference model is a permissible deferral.
Counsel memo, published Terms, accepted service contract/catalog and distribution
approval are tracked signed-artifact release gates, never unresolved product questions.
Missing sign-off keeps production and affected store submission disabled; report the
exact artifact/owner rather than claiming approval. All priced routes/handlers obey
the three money gates (counsel, fail-closed FREEHOLDS_ENABLED, distribution map) and
service-authoritative pricing. Seeker is use-only; website-management is independently
approved and default off on denied storefronts; purchase submodels/catalog/handlers/
DOM/accessibility text are absent on denied builds. No on-chain marketing there.

The whole-feature matrix includes atomic resource/housing saves, durable receipt
recovery, current guild/visitor authority, offline-owner visits, exact account trophy
provenance, typed parent/child placement, outfit/item forms, no new farm beds, final
art at LOW, state 30/29 amenity boundary, prepay 12/13, source modes and immutable bills.
Wave C additionally proves guild pooled absolute balance/cap schedule, own-member
plinth departure, guild-at-clear proof, War table lockouts/first kills, immediate
project completion and service-specific chest/station/vault gates, and that guild-clear
capture capacity never refuses GameServer.join, enterDungeon or a respawn: exhaustion
records the bounded clear-not-captured gap with an operator alert (D83). Capture each
relevant empty/loading/error/locked/visitor/pending/reconnect state on desktop,
compact and tablet through ux-spec.md's real-state helper. A missing AFTER capture
fails. Required PG twins run ARMED; absent runtime evidence fails the close.

Dispatch the whole-wave actual-surface roster: architecture-reviewer,
cross-platform-sync, privacy-security-review, migration-safety,
database-performance-reviewer, server-hot-path-reviewer, content-obligations-reviewer,
render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor and
qa-checklist. Confirm database reviews before decisions and on each finished DB diff;
consume recorded deterministic evidence rather than duplicating the full gate. Apply
ALL findings including nits, then have a second fresh reviewer verify every fix.
Run node scripts/gate_select.mjs or deeper npm run gate as the shared pre-merge bar;
ci:changed and remote CI are additional checks. Report exact commands/exits/paths.

## Shared authority and persistence dependency

This file extends the single producer from 07a, not a second account or guild payment
system: NEW server/freehold_mutation.ts::commitFreeholdMutation and
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation own
durable intent, applied identities, global claim fencing and atomic effects. Phase 15
adds service quote/receipt fields to those rows; later files consume them. No separate
guild/account receipt journal, ordinary-arrival receipt, writer queue or recovery loop.
Extend 07a's reviewed actual touch-set manifest with this file's exact participants.
Preserve explicit character pre-lock before nonce fencing, bank-ledger classification
before guild replay, and the actual market/mail, storage advisory/receipt, custody,
FK/unique/deferred-trigger ordering of every carried legacy effect. Never substitute
a generic accounts/characters/guilds/receipts lock hierarchy. No client is held while
joining serialization; no lock/client spans service IO. Reuse admitted cancellation-
aware work and retain original operation identity across crash/timeout/eligibility change.

07 owns capability-aware save/export/deactivation/restore preservation; 07b owns
account lifecycle and immutable protection history. Unsupported/oversized/unknown
source rows remain original and read-only with a bounded diagnostic/reference; do not
reset them to empty history, a free Inn or fresh grace. Character delete preserves
account records; soft deactivation/restore, authorized hard deletion and export remain
distinct. Follow the minimum-capable-release/rollout artifact; old binaries merely
leaving normalized rows untouched do not prove compatible save or lifecycle behavior.
Rollback quiesces new mutations while preserving accepted recovery identities.

Paired QA must cover the actual legacy transaction participants, lease/CAS/nonce
failure, pending/replayed operations, concurrent accounts/alts/realms, partial failure,
oversized/unknown version preservation and minimum-capable rollout/rollback fixtures.
Database, persistence and security reviewers inspect these exact before/final diffs.

## Existing lifecycle, upkeep history and finality contract

Consume 07b's single lifecycle owner and 13/13a's single upkeep-calendar owner.
NEW server/freehold_lifecycle_db.ts::loadFreeholdLifecycleProtectionPage provides the
committed immutable protection source, and createFreeholdLifecycleCoordinator captures
authenticated observation time before queueing. Derive a return before presence
advances; stale observations, fenced sessions and replay cannot mint grace. The
lifecycle-policy-binding artifact (accepted, or still a named unsigned release gate)
names lifecyclePolicyId, sourceCalendarId and resetPolicyId; serving realm, browser zone
or guessed UTC cannot rebind history.
13a owns server/freehold_db.ts::applyFreeholdUpkeepCalendar/loadFreeholdUpkeepCalendar
and server/freehold_upkeep_ingress.ts::createFreeholdUpkeepIngress. No duplicate guild
or account calendar ingress, source-history array on plots, polling job or receipt store.

Every plot/checkpoint/immutable bill and prepaid credit retains original calendarId,
schemaVersion, resetPolicyId and committed lifecycle/authority/finalized-prefix identity.
Union overlapping lifecycle absence/grace and service suspension ranges exactly;
never add independent totals or use only latest grace for a dormant plot. Historical
condition/checkpoint changes, bill classification and credit consumption/carry require
irrevocably finalized source facts. Covered but mutable tails support read-only preview
only. Missing history, unknown binding or time beyond coverage is explicit not-ready,
never zero outage. A future-credit purchase uses an accepted published schedule without
requiring future time to be finalized; its later consumption requires final history.

Recheck lifecycle and compatible calendar-head FOR SHARE guards inside 07a's reviewed
composition hook through commit. The calendar-only writer takes FOR UPDATE and never
account/plot/receipt locks; loaders release reads before writer queues. Retain exact
indexed history/prefix facts with bounded probes across multi-year absence/open outage,
not per-day/week loops, lifetime loads or foreign-plot rewrites. Keep source history
until lossless dependency-aware rebase proves dormant plots/credits/recovery safe.
Current-generation revision/digest/watermark install and exact current/superseded/
conflict/pending ACK semantics belong only to 13a. An older response cannot replace a
newer projection or claim readiness. Owner/public builders allowlist safe fields and
reject operator-evidence, secret and private-diagnostic sentinels even on owner wire.

Paired QA verifies repeated absence/return cycles, overlapping protection, original
calendar across realm/zone change, open multi-year suspension, missing versus empty
coverage, unfinalized history refusal, future-credit purchase, credit carry, stale
process install and restart/rollout. UI may show a keyed pending state while existing
entry/build/undo remain available; durable payment retains original operation recovery.

## Literal D9 and original-operation money authority

The game server and Sim remain ignorant of physical distribution. The future economy
service owns eligibility verification and opaque authorization bound to account,
purpose/SKU, policy, quote and operation, with issuer/verifier conformance in the
service artifact (accepted, or still a named unsigned release gate). A first-party web
checkout session alone is insufficient.
Client channel labels, Origin, UA, arbitrary JSON, linked Steam/Epic accounts and the
game-service secret never prove eligibility; do not add a trusted channel field to the
game server. The client capability map controls presentation, not purchase authority.
Unknown eligibility refuses NEW spend. Already accepted payments recover under their
original operation after session/authorization expiry or eligibility change.

Use the service response protocol specified in 15: authenticated bounded decoding,
complete original operation/fingerprint/target/effect validation and terminal-state
classification. A malformed/nonterminal reply is neither a grant nor proof of no
debit. Written signed acceptance is not runtime cryptographic verification. The 07
developer fixture cannot mint a paid receipt or satisfy online service authorization.
Keep all three money gates: counsel before enable/store submission, default-off
FREEHOLDS_ENABLED on both dispatch arms/catalog, and the seven-distribution surface map.
Published Terms, accepted service catalog/contract and issuer/verifier evidence remain
release gates; the final legal-team handoff in 44b does not postpone these earlier gates.
The economy service owns every price and all token math; expectedCostClaudium is only
the forwarded literal quote fingerprint. Test false client claims, unknown eligibility,
malformed/ambiguous replies and successful original-operation recovery on both arms.

## Arrival consumer dependency

Use the 07c account-wide normalized arrival-tier owner, not a plot-local seen set.
NEW server/freehold_arrival_db.ts::markFreeholdArrivalTierOnClient is the conflict-safe
insert inside 07a's accepted-owner-entry; only its committed insert winner gets fresh
first-tier eligibility. 08a's private result separates historical firstTierAtAdmission
from nullable freshArrivalPresentation carrying acceptedTransitionId, playWelcomeCue
and firstTierViewEligible. Confirmed dungeonEntrySeq and destination plot match before
the camera/audio consumer acts. Each new accepted arrival may welcome; snapshots,
resume and replay carry null and never restart sound/camera. Commit-before-ACK may
skip presentation, so do not claim exactly-once visible delivery. Visitors create no
account tier mark; no permanent receipt is added for routine arrivals. A new tier,
Fenbridge entry or second account session reuses this same authority and safe handback.
Pair tests cover two accounts, same-account alts/concurrent realms, returning tier,
guest, rejected entry, commit-before-ACK and reconnect. Asset/view execution is Codex.

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
This is Phase 27 of the Freeholds and Guildhalls feature: the wave B close (the
whole-feature integration matrix over the Lodge, the full furnishing catalogue, the
trophy families, the garden, build mode v2, and open-house visiting; screenshots; the
wave B PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (the matrix is a checklist run, not a build).

Goal: prove wave B end to end on every host and every store build by running every row
of docs/freeholds/qa-checklist.md over the wave B diff, fix what the matrix finds,
capture screenshots, and open the wave B PR (FREEHOLDS_ENABLED defaulting off) only
after Fernando's push go, then watch CI to green. Never merge.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the PR base is then wave A's head branch, and the merge-forward
  rule is unchanged.
- Memory scan: MEMORY.md and entries on "CI is the gate", "never push to fork", "PR merge
  needs approval", "no sensitive material in the open repo" (sweep EVERY push), screenshots
  at lowest graphics, capture rigs never find by English text, "format pass != check
  pass", "commits need bodies", the release-merge checkpoint entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (Push policy and the wave B branching choice, the ledgers 21
  to 26, tracked signed-artifact release gates), docs/freeholds/progress.md (rows 21 to 26 with their QA verdicts
  and tracked artifact/release gates, the wave A matrix table under row 20, and "27 Wave B close"),
  docs/freeholds/qa-checklist.md (every row), this file
- .github/PULL_REQUEST_TEMPLATE.md; .claude/skills/pr-screenshots/SKILL.md;
  scripts/pr_shot_targets.mjs (the targets Phases 25 and 26 added);
  docs/prd/woc/freehold-service-contract.md (the upgrade SKU row); .claude/skills/ci-triage/SKILL.md
- The wave diff: `git log --oneline <wave-a-head>..HEAD` and its `--stat`, where
  <wave-a-head> is the local tip state.md recorded at the 20 QA PASS, or the wave A PR
  head when a wave A PR exists (D87); every test file the wave added; the
  docs/screenshots/ directory
- The matrix row anchors named in phase-20-wave-a-close.md STEP 1 plus the wave B suites:
  tests/freehold_upgrade.test.ts, tests/freehold_trophies.test.ts,
  tests/freehold_garden_view.test.ts, tests/freehold_visiting.test.ts,
  tests/freehold_layout_core.test.ts, tests/apex_pattern_channels.test.ts,
  tests/recipe_pattern_items.test.ts, tests/server/freehold_routes.test.ts;
  .githooks/pre-push (the copy-rule scan of a diff)
- server/freehold_config.ts, .env.example, src/game/distribution_surfaces.ts,
  src/ui/i18n.catalog/hud_chrome.ts (the housing namespace, for the "earn" scan)
The agent returns: the matrix as a table of row, resolved command, and the test files
that exist on disk (naming any row whose suite does not exist under the checklist's
name); the screenshot targets with ids and mobile variants (the wave B producers'
registrations: file 25's housing-build-advanced, 26's open-house variants on
housing-visiting, 21's steward-upgrade-* and 23's trophies-* scenes, each with the
variant count ux-spec section 11 records for its producer; the regenerated
ux-shot-manifest.json is the source, never a count typed here); the PR base branch and
merge-base SHA per the branching choice; every named unsigned gate from rows 21 to 26;
the service-contract handoff delta (the upgrade SKU) and counsel/Terms/store-signoff
state; the flag default and its pin.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator owns progress.md, state.md, and the PR body and edits them last:
- Agent MATRIX: run every qa-checklist.md row's command ONE ROW AT A TIME (one vitest
  file per invocation, bounded workers), including `npm run perf:tour` through the
  Cottage and the Lodge with plinths and the garden filled, `npm run asset:budget`, the
  pg-armed persistence twins after `npm run db:up` with TEST_DATABASE_URL set to the URL
  state.md's "Validation matrix" server/ row gives (recording "pg twins executed: N tests ran,
  0 skipped"), the
  copy-rule scan from .githooks/pre-push over the wave diff (dashes and emojis only),
  tests/freehold_store_gates.test.ts (the "earn" scan and the token-string pins), and
  the classic-fidelity grep from the qa-checklist.md row
  (the banned two-word land phrase over src/, server/, and public/ ONLY, never
  docs/freeholds or docs/prd whose naming rules spell it, which must return nothing,
  plus the PR body read by hand); record each row as PASS or FAIL with the output path;
  for a FAIL write the failing
  assertion and the owning phase (by progress.md row) without fixing anything.
- Agent SCREENSHOTS: the pr-screenshots skill, before (the wave A head) and after (HEAD),
  desktop plus the compact and tablet landscape mobile boxes, seeding the lowest graphics
  preset and graphicsDefaultApplied before page.goto, never locating an element by
  English text: the Lodge interior, the upgrade progress on the Steward panel, a wall
  piece and a table-top piece with the ghost snapped, the capacity meter, the Legend
  Stand plaque tooltip, the Kitchen Garden tableau, the Fenbridge gate, the visit prompt
  with an open house listed. Commit under docs/screenshots/<slug>/ and return the
  relative paths for the PR body.
- Agent WIKI-AND-DOCS: `npm run wiki:content` then `npx vitest run tests/guide.test.ts`;
  confirm every new guide.* key is spoiler-safe; confirm freehold-service-contract.md carries the
  upgrade SKU (handoff-ready; acceptance status recorded as an unsigned release gate unless
  a signature artifact is on file); draft the PR body from .github/PULL_REQUEST_TEMPLATE.md
  with: the wave B scope in the proposal's section 14 item 3 words (and item 2 when the PR
  also carries wave A because no wave A PR exists), the flag default off, the
  surface summary unchanged, the tracked counsel/Terms/store-signoff artifact status, the screenshot links,
  the tracked artifact/release gates list (excluding unshipped development stand-ins from completion claims), and the word "phase" nowhere.
Then the coordinator: for every FAIL row, fix test-first in isolation (the
extract-and-test skill), spawn the reviewer the dispatch table names for the touched
surface, re-run the row, and record the fix commit. Every agent writes any report longer
than a screen to a file and replies with the path plus a short summary. Never
`mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- No feature work: only matrix fixes, screenshots, docs, and the PR.
- The three money gates: (1) counsel sign-off is a tracked release gate in the PR body, never claimed without evidence;
  (2) FREEHOLDS_ENABLED defaults off and every housing route and command (the upgrade
  SKU, the open-houses read included) refuses while dark, re-verified by the matrix;
  (3) the seven-distribution surface map passes and the upgrade purchase surface is off
  every native, Steam, and Epic build. The economy service owns every price and all
  token math.
- No wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in any housing path reachable on
  App Store, Google Play, Steam, or Epic; no "earn" language in purchase-benefit copy.
- Never sell power; never destroy; zero new farm beds (the farming calendar rows); the
  keystone exclusion over every ledger, furnishing, and upgrade bill.
- i18n: the policy in docs/freeholds/implementation-plan.md; no locale overlay edited
  except the five M16 non-Latin fills for a new wordy English value (implementation-plan.md
  "The contributor i18n policy").
- Monolith ceilings not raised; a matrix fix pays with an extraction.
- The word "phase" appears in no code, comment, commit, or PR text; screenshots at the
  lowest preset.
- Pushes go to origin only, never a fork; the PR is never merged by this session.

Out of scope (do NOT do in this phase):
- Any wave C item: the guild owner kind, the Hall Fund, guildhall purchase, hall
  amenities, guild deeds, the Great Hall and Manor tiers (Phases 28 to 32).
- Enabling FREEHOLDS_ENABLED anywhere; any deploy; any economy-service change.
- Raising a monolith ceiling or re-baselining any i18n artifact.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The whole qa-checklist.md matrix (STEP 2, Agent MATRIX) with every row PASS, then
  `npx tsc --noEmit` and `npm run ci:changed` after the last commit (read the exit code).
- Spawn per docs/freeholds/implementation-plan.md over the WHOLE wave diff: qa-checklist
  (the completion gate) plus every reviewer the matrix names, the full wave B roster:
  architecture-reviewer (the Lodge tier sim logic), cross-platform-sync,
  privacy-security-review, migration-safety (the upgrade column),
  database-performance-reviewer (before decisions and again on the finished diff),
  server-hot-path-reviewer (the open-houses read), render-performance-reviewer,
  content-obligations-reviewer, frontend-seam-reviewer (build mode v2 and the prompt)
  and test-coverage-auditor. Prompt each for COVERAGE not filtering; each writes its
  report to a file. No PR while a BLOCKING finding stands.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE, THEN PUSH AND PR:
2 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- fix(<scope>): one commit per matrix finding, test-first, reviewed
- docs(screenshots): add the Lodge, build mode v2, garden, and visiting captures
- docs(freeholds): record the wave B integration matrix results
Then `npm run ci:changed` after the LAST commit; read the exit code.
Then STOP and ask Fernando for the push go (state.md "Push policy"), showing the matrix
table, the screenshot paths, and the PR body draft; ask in the same message whether
wave C continues on the same branch after this PR merges or on a stacked branch (D12:
one PR per wave, each off the base), and record the answer in state.md. On the go:
`git push -u origin <branch>` (origin only), then `gh pr create --base <base branch per
the branching choice> --title "feat(freeholds): the Lodge tier, the full furnishing
catalogue, and open houses" --body-file <the drafted body>` (when no wave A PR exists
the title and body cover wave A plus wave B: "feat(freeholds): the Cottage MVP and the
Lodge tier"), then `gh pr checks --watch`. On a red or stalled check run the ci-triage
skill, fix, push again, and watch again. Stop at "pushed, green, ready for review";
without the go, stop at "matrix green, awaiting push go".

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row is recorded PASS in progress.md under "27 Wave B close"
  with the command that proved it; no row is marked by inspection.
- [ ] qa-checklist reports PASS; every dispatched reviewer confirms ALL findings, including nits, are resolved and freshly reviewed.
- [ ] Before and after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and linked from the PR body.
- [ ] freehold-service-contract.md carries the upgrade SKU (handoff-ready; acceptance status
  recorded as an unsigned release gate unless a signature artifact is on file); the
  counsel/Terms/store-signoff artifact inventory is in the PR body with the same status
  field per artifact.
- [ ] Either the PR is open off the base the branching choice names with `gh pr checks`
  fully green (push go given), or the branch is local at "matrix green, awaiting push go"
  with the PR body drafted (no go recorded); in both cases the body follows the template
  and contains no "phase", and FREEHOLDS_ENABLED is unset by default.
- [ ] state.md records the wave C branching choice and the PR number (or the local tip
  when no go was recorded).

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 27: status, the matrix table, tracked artifact/release gates
  carried into wave C) and docs/freeholds/state.md (the PR number or local tip, the wave C
  branching choice, the "Current phase" line, any locked decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the matrix table, files touched, review verdicts, the
PR URL and CI state when a PR exists, tracked artifact/release gates, and the FULL PATH
of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-27-qa.md

STOPPING RULES:
- Stop before any push: the push happens only after Fernando's explicit go in this
  session; never push to a fork; never merge a PR.
- Stop if a matrix row fails for a design reason (a locked decision would have to
  change): record it in progress.md and name the owning phase file as the file to re-run.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
```
