# Phase 33: wave C close (integration matrix, screenshots, the Guildhalls PR)

Wave C, Guildhalls. The spec is `progress.md` "33 Wave C close"; the matrix is
`qa-checklist.md`; the PR rules are `implementation-plan.md` "PR cadence" and `state.md`
"Push policy". This is the final QA variant: it runs the whole-feature matrix over the
wave C diff (Phases 28 to 32), captures screenshots, runs the wiki pass, and opens the
wave C PR only after Fernando's push go. It ships no new behavior.

## Deliverables (at most five):

1. Whole-wave C integration matrix including 28a/30a/32a and their QA.
2. Before/after desktop, compact and tablet screenshots.
3. Fresh wiki and handoff-ready content/service/legal release artifact inventory
   (acceptance status recorded per artifact).
4. Scoped reviewed matrix fixes and a fresh review of their complete fix round.
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
This is Phase 33 of the Freeholds and Guildhalls feature: wave C close (the integration
matrix over Phases 28 to 32, screenshots, the wiki pass, the Guildhalls PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: prove wave C whole (every row of docs/freeholds/qa-checklist.md verified by a check
that ran), commit the before/after screenshots, and open the wave C PR off the base
branch with FREEHOLDS_ENABLED defaulting off only after Fernando's push go, then watch
CI to green. Never merge.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on screenshots at lowest graphics, capture rigs and
  English text, CI is the gate, never push to a fork, PR merge needs approval, the
  sensitive-material sweep.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md (every row), docs/freeholds/progress.md
  (rows 28 to 32 and their QA rows, every named unsigned gate), this file, the Phase 20
  and 27 close records in progress.md (the matrix table shape and the PR bodies they
  drafted; 20's is a local draft when no wave A PR exists)
- the wave diff: `git log --oneline <wave-c-start>..HEAD` and `git diff <wave-c-start>..HEAD
  --stat`, with <wave-c-start> the tip recorded at the Phase 27 close
- .github/PULL_REQUEST_TEMPLATE.md, .claude/skills/pr-screenshots/SKILL.md,
  scripts/pr_shot_targets.mjs (the housing targets Phases 28 to 32 added), docs/qa-gate.md
  (the reviewer table), the wiki build step (`npm run wiki:content`) and tests/guide.test.ts
The agent returns: the matrix row list with the exact command per row (the money and
store-policy row's "earn" scan and token-string pins live in
tests/freehold_store_gates.test.ts), the wave diff surface list mapped to the reviewer
table, the screenshot target ids for the hall interiors, the boards, the
project bar, the Materials Vault chest, and the first-kill plinths (desktop and mobile;
the wave C producers' registrations: file 30's housing-hall-amenities and 30a/31's
housing-war-table, each with the variant count ux-spec section 11 records for its
producer; the regenerated ux-shot-manifest.json is the source, never a count typed here),
the PR body skeleton from the template, and every tracked artifact/release gate to list in the PR.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files:
- Agent MATRIX: run every row of docs/freeholds/qa-checklist.md over the wave diff, one
  command at a time, reading exit codes, with the pg-armed twins run after `npm run db:up`
  with TEST_DATABASE_URL set to the URL state.md's "Validation matrix" server/ row gives
  and the
  row recording "pg twins executed: N tests ran, 0 skipped"; record the result table
  (row, command, result, evidence path) to a file; a row that cannot run is FAIL, never
  "looks done".
- Agent SHOTS: capture before/after screenshots through the pr-screenshots skill (desktop
  and the compact and tablet mobile targets, landscape, lowest graphics preset seeded
  before page.goto, never finding elements by English text), commit them under
  docs/screenshots/ with explicit paths, and return the markdown block for the PR body.
- Agent WIKI: `npm run wiki:content`, `npx vitest run tests/guide.test.ts`, the guide
  prose keys for the three tiers and the hall amenities, `npm run i18n:gen`, and the
  spoiler check on the generated pages.
Then the coordinator spawns qa-checklist over the whole wave diff plus every reviewer the
matrix names for the surfaces present (the docs/freeholds/implementation-plan.md dispatch
table), for COVERAGE, to files. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- FREEHOLDS_ENABLED defaults off and refuses every housing route and command while dark;
  no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in a housing path reachable on the
  App Store, Google Play, Steam, or Epic; no "earn" language in purchase benefits; the seven-row matrix green;
  the economy service owns every price.
- Never sell power; keystone exclusion; zero farm beds; nothing destroyed.
- The PR text contains the word "phase" nowhere, no em dashes, no emojis; vocabulary
  fixed; the sensitive-material sweep runs before any push.
- Push policy: the push happens only after Fernando's explicit go; origin only, never a
  fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Any new behavior or content; a fix found by the matrix is applied as its own commit
  with a re-run of the affected rows, and anything larger fails the close and returns to its owning file.
- Wards, favor, showcases, or deeds (wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The matrix IS the validation: every row of docs/freeholds/qa-checklist.md, plus
  `npx tsc --noEmit`, `npm run ci:changed` after the LAST commit (read the exit code),
  and `node scripts/gate_select.mjs` (required pre-merge bar).
- Reviewers: qa-checklist plus every reviewer the matrix names, the full wave C roster:
  architecture-reviewer, cross-platform-sync, privacy-security-review, migration-safety,
  database-performance-reviewer (before decisions and again on the finished diff),
  server-hot-path-reviewer, content-obligations-reviewer, render-performance-reviewer,
  frontend-seam-reviewer and test-coverage-auditor, all for COVERAGE not filtering, all
  to files. No push while a BLOCKING finding stands.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
2 to 4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(screenshots): add the Guildhall before and after captures
- docs(wiki): regenerate the guide for the Guildhall tiers and amenities
- fix(<scope>): <one commit per matrix finding, if any>
- docs(freeholds): record the wave C matrix results
Then `npm run ci:changed`; read the exit code. Then STOP and ask Fernando for the push
go (state.md "Push policy"); ask in the same message whether wave D continues on the
same branch after this PR merges or on a stacked branch (D12: one PR per wave, each off
the base), and record the answer in state.md. On the go: `git push origin <branch>`
(origin only), open the PR off the
base branch recorded in state.md following .github/PULL_REQUEST_TEMPLATE.md (summary,
related issues, type of change, how it was tested with the matrix table, the screenshots
block, the checklist), then `gh pr checks --watch`.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row has a recorded result from a command that ran; no row
  is FAIL.
- [ ] Screenshots (desktop, compact, tablet) are committed under docs/screenshots/ and
  referenced from the PR body.
- [ ] The wiki is fresh (tests/guide.test.ts green) and spoiler-safe.
- [ ] Either the PR is open off the recorded base with CI green (`gh pr checks --watch`)
  (push go given), or the branch is local at "matrix green, awaiting push go" with the
  PR body drafted; in both cases the body is complete per the template, no "phase" in
  the PR text, FREEHOLDS_ENABLED off by default.
- [ ] qa-checklist and every dispatched reviewer confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 33 with the matrix table, the PR number and
  URL, named unsigned gates carried into wave D) and docs/freeholds/state.md ("Current
  phase", the wave D start tip, the PR number or local tip, any stacked-branch choice for
  wave D under D12).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL when one exists, the matrix summary, review
verdicts, tracked artifact/release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-33-qa.md

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment.
- Stop at "pushed, green, ready for review"; never merge a PR; never enqueue it.
- A red matrix row that needs more than a one-commit fix stops the close: record it and
  name the owning phase file to re-run.
- Do not push the branch without the go; never merge a PR.
```
