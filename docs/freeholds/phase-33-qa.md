# Phase 33 QA: audit the wave C close

Audits `phase-33-wave-c-close.md` including the whole wave's actual behavior, source changes and decisive evidence.
Earlier implementation/QA results inform this integration audit; they do not exclude
feature code from its coverage. Verdict goes in `progress.md` (row "33 QA").
Wave D never starts before this file has run.

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
This is Phase 33 (QA) of the Freeholds and Guildhalls feature: audit the wave C close
(the matrix record, the screenshots, the PR body, and CI when a push go was given).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that the wave C close recorded a complete matrix from checks that ran, that
the screenshots and wiki landed, that the PR body is complete and clean, and that CI is
green when a PR exists (otherwise that the local gate is green at the recorded tip); fix
what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, "CI is the gate", "format pass is not a check pass", "PR merge
  needs approval", the test-pin traps catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md, docs/freeholds/progress.md
  (row 33 with the matrix table, rows 28 to 32 including 28a/30a/32a and their tracked artifact/release gates),
  docs/freeholds/phase-33-wave-c-close.md (what was promised)
- the close diff: `git log --oneline <phase-start>..HEAD` and the full diff (screenshots,
  wiki regen, matrix fixes, the progress record)
- the PR, when state.md records a push go and a PR number: `gh pr view <number> --json
  body,baseRefName,headRefName,state` and `gh pr checks <number>`; otherwise the PR/CI
  items read N/A (awaiting authorization) and the drafted body plus the recorded local
  gate evidence stand in; the screenshot paths the body references, docs/screenshots/ on
  disk
The agent returns: the matrix table with, per row, whether the recorded evidence names a
command and an exit code; every screenshot the body links and whether it exists at that
path; the PR base versus the base state.md records; the CI check list with states (or
the local gate exit code at the recorded tip); any "phase", em dash, emoji, or forbidden
vocabulary in the PR body or the commits; every named unsigned gate listed versus every
named unsigned gate in rows 28 to 32.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row was verified by a command (re-run any row whose record
  lacks a command or an exit code); the PR base is the recorded base; the head is the
  packet branch; FREEHOLDS_ENABLED still defaults off on the PR head; the fix commits
  are scoped to their matrix finding.
- TEST COVERAGE: the matrix rows that name suites cite suites that exist and ran on the
  head (compare the CI job list when a PR exists, else the local gate's selection); no
  suite was skipped by an env gate without a note
  (the pg-armed twins); the wave's new pin suites are in the CI shard selection.
- DEAD CODE AND HYGIENE: no "phase" in the PR text or the wave's commits, no em dashes
  or emojis, the vocabulary rule, no secret or .env material in any pushed file (the
  sensitive-material sweep), the screenshots are the sizes the skill prescribes, the wiki
  regen is fresh, progress.md and state.md are consistent with the PR.
Then the dispatch reviewers over the whole wave diff, the full wave C roster:
architecture-reviewer, cross-platform-sync, privacy-security-review, migration-safety,
database-performance-reviewer, server-hot-path-reviewer, content-obligations-reviewer,
render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor (the wave's
pin suites and the fix commits) and qa-checklist, all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- `gh pr checks <number>` green when a PR exists (otherwise the recorded local gate at
  the recorded tip); `npx tsc --noEmit`; `npm run ci:changed` on the head; re-run any
  matrix row the audit questioned.

STEP 4 - FIX:
- Apply ALL findings including nits, resolving any claimed conflict against the
  approved decision rather than leaving an unreviewed exception. A fix to code re-runs the affected matrix
  rows. Commit fixes separately from the verdict, Conventional Commits with scope and
  body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Review the fix
  commits with a FRESH reviewer. Push the fixes to the open PR only if Fernando's push go
  from Phase 33 covers follow-up commits; otherwise stop and ask. `gh pr checks --watch`
  after any push.

STEP 5 - ACCEPTANCE:
ALL findings, including nits and uncertain findings resolved against source evidence,
must be applied and the complete fix round read by a fresh reviewer before PASS.
External signatures remain concrete release-gated artifacts, never deferred review findings.
- [ ] Every matrix row is backed by a command that ran; the PR body is complete and
  clean; CI is green on the final head when a PR exists; if state.md records no push go,
  the PR/CI criteria read N/A (awaiting authorization), the local gate is verified at the
  recorded tip and the row is recorded PASS, awaiting publication.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "33 QA": verdict (PASS, PASS awaiting publication, or FAIL), counts
  found and fixed, separately tracked external artifact/release gates carried into wave
  D. state.md: "Current phase" points at Phase 34.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, the PR URL and CI state when a PR exists (else "awaiting
authorization"), counts found and fixed, separately tracked external artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-34-wards.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 33 file as the next file
  to re-run with the findings attached.
- Never push without a go that covers the push; never merge a PR.
```
