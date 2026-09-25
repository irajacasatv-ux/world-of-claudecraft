# Phase 39 QA: audit the wave D close

Audits `phase-39-wave-d-close.md` including the whole wave's actual behavior, source changes and decisive evidence.
Earlier implementation/QA results inform this integration audit; they do not exclude
feature code from its coverage. Verdict goes in `progress.md` (row "39 QA").
Wave E never starts before this file has run.

### Starter Prompt
```
This is Phase 39 (QA) of the Freeholds and Guildhalls feature: audit the wave D close
(the matrix record, the screenshots, the PR body, CI, the deed flags and the counsel
gate).

Harness: Claude Code (the active harness; this audit is review-only, and D74 requires
Codex only for asset-creating steps). Follow the root CLAUDE.md "Working style and effort
by model" block for effort and fan-out; this prompt names no model.

Goal: verify that the wave D close recorded a complete matrix from checks that ran, that
the screenshots and wiki landed, that the PR body is complete, clean, and states both
deed flags off and every release gate's signed or unsigned status, and that CI is green
when a PR exists (otherwise that the local gate is green at the recorded tip); fix what
the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, "CI is the gate", "format pass is not a check pass", "PR merge
  needs approval", "no sensitive material in the open repo", the test-pin traps catalog.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74); this review-only audit runs in the active harness and hands
any asset-creating matrix fix to a Codex session. Use Codex's built-in image generation
tool (an external prerequisite: STOP if it is unavailable) following
docs/design/eastbrook-vale-rebuild/imagegen-prompts.md with rows in
imagegen-provenance.md and CREDITS.md, and the image-to-GLB workflow in
.agents/skills/woc-image-to-glb/SKILL.md, with their provenance, runtime registration,
fingerprint and in-context checks. This planning audit creates no game assets. Final
art is required here; 44a is a residual sweep, not permission to leave a placeholder
for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md, docs/freeholds/progress.md
  (row 39 with the matrix table, rows 34 to 38 and their finding dispositions),
  docs/freeholds/phase-39-wave-d-close.md (what was promised)
- the close diff: `git log --oneline <phase-start>..HEAD` and the full diff (screenshots,
  wiki regen, matrix fixes, the progress record)
- the PR, when state.md records a push go and a PR number: `gh pr view <number> --json
  body,baseRefName,headRefName,state` and `gh pr checks <number>`; otherwise the PR/CI
  items read N/A (awaiting authorization) and the drafted body plus the recorded local
  gate evidence stand in; the screenshot paths the body references, docs/screenshots/ on
  disk, .env.example on the head (both deed flags commented out) and the DEPLOY.md
  "Environment keys" rows Phase 01 (FREEHOLDS_ENABLED) and Phase 37 (the deed flags)
  produce, each stating opt-in and unset by default; the host /opt/eastbrook/.env is not
  inspectable from the repo
The agent returns: the matrix table with, per row, whether the recorded evidence names a
command and an exit code; every screenshot the body links and whether it exists at that
path; the PR base versus the base state.md records; the CI check list with states (or
the local gate exit code at the recorded tip); any "phase", em dash, emoji, forbidden
vocabulary, secret, or service URL in the PR body, the commits, or any pushed file;
whether the body states both deed flags off and the "Release gates" table (the six
docs/prd/woc artifacts, the numerical rows and the lifecycle/rollout artifacts, each
with signed or unsigned status); every finding disposition listed versus every finding
disposition in rows 34 to 38.

Deliverables (at most five):
1. Complete close evidence and signed-gate coverage report.
2. Screenshot, contribution-gate and release-documentation verification.
3. Applied fixes and fresh fix-review verdict.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row was verified by a command (re-run any row whose record
  lacks a command or an exit code); the money and store-policy row's evidence includes
  the seven-row matrix with the deed column, the source pins, the
  freehold_store_gates pins, and the scoped on-chain housing surface scan and ordinary
  Book of Deeds control; the PR base is the recorded base; FREEHOLDS_ENABLED,
  FREEHOLD_DEEDS_ENABLED, and NEW allowSerializedCollectibles (38 deliverable 2) still
  default off on the head; no src/sim/ path is touched by a deed commit; the fix commits
  are scoped.
  Scan denied housing purchase/on-chain surfaces at model, rendered copy, DOM,
  error and accessibility boundaries for all denied distributions, including Seeker
  and unknown-capability builds and known holder-flair marketing. Never reject a
  bundle merely for the ordinary
  word deed. Positive native gameplay Book of Deeds render/unlock and ordinary-home
  entitlement controls must pass alongside denied on-chain housing cases.
- TEST COVERAGE: the matrix rows that name suites cite suites that exist and ran on the
  head; no suite was skipped by an env gate without a note (the pg-armed twins); the
  wave's new pin suites are in the CI shard selection; the seven-row matrix runs in CI
  when a PR exists (else in the local gate_select run), not only by hand.
- DEAD CODE AND HYGIENE: no "phase" in the PR text or the wave's commits, no em dashes
  or emojis, the vocabulary rule, no secret, key, or service URL in any pushed file, the
  screenshots are the sizes the skill prescribes and include the native absence, the
  wiki is spoiler-safe and store-safe, progress.md and state.md are consistent with the
  PR and list the locked prestige and future-craft handoff scope.
Then dispatch qa-checklist, test-coverage-auditor, architecture-reviewer,
cross-platform-sync, migration-safety, database-performance-reviewer,
privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer,
render-performance-reviewer and content-obligations-reviewer against actual wave
surfaces and existing evidence, for COVERAGE, to files. DB review covers pre-decision
and finished-diff callers/shapes/queries; do not duplicate the whole shared gate.

PROPOSED SERVICE AUTHORIZATION AND RECOVERY CONTRACT:
Preserve literal D9: the game server receives no distribution/channel label,
country assertion or physical-client attestation. The NEW external economy-service
issuer/verifier and policy module verify an actual eligible checkout session and
current territory under signed policy; the signed acceptance names their exact
external repository/module or interface-artifact identity and conformance proof.
Account auth, Origin, user agent, client JSON, linked stores, a desktop bridge
capability and an outgoing server secret are not physical-distribution proof.
The service binds NEW checkoutAuthorization to account, purpose/kind, SKU, policy
version, accepted quote, operation and full plot/guild/custody fingerprint. The game
consumes only the opaque protected reference and service-verified allow/refusal/effect;
it never issues eligibility from headers, accepts a channel JSON field or logs/exposes
the authorization. Unknown/malformed/unverified eligibility refuses NEW spend.
The adapter authenticates the actual service response and bounds decode before
validating the complete operation/effect/fingerprint. A signed acceptance document
is not proof of runtime cryptographic validation. Malformed or nonterminal results
never grant a local effect or prove that no debit occurred; preserve the original
operation for bounded status discovery and recovery.

NEW source ownership is explicit: 07a's
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation owns
protected authorization binding, fingerprint and durable receipt authority;
server/freehold_mutation.ts::commitFreeholdMutation owns atomic local effects.
Phase 15's NEW server/freehold_purchases.ts is the initial opaque quote/status/
authorization consumer; NEW server/freehold_deed_proxy.ts is the later deed consumer
of that same verified boundary. No game geo or distribution-attestation module is
introduced. These are proposed producers, not existing exports; read prepared
phase-07a-transactional-mutation-boundary.md and its QA before implementation.

Dark flags and unknown/current eligibility refuse new paid actions, not recovery of
an already accepted original operation. Receipt/status discovery, local application
or accepted compensation use its immutable outcome and original protected binding
without a new checkout session or debit. Current local entitlement, ownership, fence
and custody guards still apply. Rejected/expired new quotes need fresh confirmation;
an accepted historical quote is not a fallback new purchase. Both service conformance
and game tests cover forged eligibility inputs, cross-binding reuse, policy/territory/
expiry changes before new spend, and accepted-operation recovery after those changes.

ACCOUNT AUTHORITY, CALENDAR AND RECOVERY ACCEPTANCE:
Consume 07b's single account lifecycle authority: NEW
server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage/
advanceFreeholdLifecycleOnClient, coordinated by
server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator and the accepted
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding policy registry.
Capture authenticated observations before queues; committed monotonic transitions,
not authentication login or a plot-local last-seen field, authorize account grace.
Immutable multi-return history or lossless prefix facts cover dormant/foreign plots;
union overlapping lifecycle protection and service suspensions exactly, never sum
independent credits, force-write foreign plots or restart grace on an alt/plot switch.

07c's NEW server/freehold_arrival_db.ts::loadFreeholdArrivalTiers/
markFreeholdArrivalTierOnClient owns normalized account+tier marks, separate from
lifecycle and plot saves. Only the committed accepted-owner-entry insert winner
has first-tier eligibility. NEW arrivals may receive a private freshArrivalPresentation
directive; snapshot/resume/replay set it null even with firstTierAtAdmission history.
Commit-before-ACK can skip presentation; no exactly-once visible/audio promise and
no permanent receipt for routine visits. Second plots and transfers do not duplicate,
copy or clear account arrival marks or seller lifecycle history.

13/13a own shared source calendar/history/checkpoint evaluation. Preserve calendarId,
schemaVersion/resetPolicyId and immutable prepaid bill/rate/material/receipt identities
across foreign-realm claims and transfers. No rebinding to serving realm/browser zone.
Historical dependencies of durable condition/bill/credit effects must be irrevocably
finalized and read at consistent committed calendar/lifecycle revisions; unfinalized,
missing or unsupported coverage keeps the affected effect pending. A future-credit
purchase does not require future time to be finalized. Long absences/outages use
bounded indexed prefix probes, never lifetime scans or absent-day/week loops.
Calendar-only exclusive writers and compatible shared mutation readers follow 07a's
actual legacy touch-set proof; no invented reverse lock hierarchy. Current-generation
projection/ACK identity cannot regress after delayed loads or superseded delivery.
Server-only operator evidence, secrets and diagnostics never reach either owner or
visitor wire: explicit allowlist builders and distinctive sentinel tests prove it.

At a sale/ownership transfer, materialize the old owner's condition at the transfer
boundary from finalized original calendar/lifecycle history; preserve source calendar
and immutable credits, retain seller account history, and apply buyer lifecycle only
prospectively without copying grace. Unknown authority holds application for bounded
original-operation recovery/accepted compensation, never a replacement charge or
silent calendar reset. Current local custody/fence guards still apply.
Character deletion, soft deactivation, restoration, true account deletion and export
are separate: deactivation is not an FK cascade; restored history/credits/receipts keep
their meaning. Explicit housing export loaders expose allowed facts only. Unknown or
oversized originals remain durable/read-only with bounded diagnostic/reference, not
empty/new-home defaults or filtered destructive arrival-set rewrites.
07's persistence-rollout-contract.md and 07b's lifecycle-policy-binding.md/
lifecycle-db-contract.md plus 13a's upkeep-calendar-db-contract.md name minimum
capable releases, measured bounds, exact schema/save fixtures and accepted policies.
Enable only a proven capable rollout; unchanged normalized rows do not prove an old
binary implements lifecycle, export or saves. Rollback quiesces NEW effects and
preserves accepted original-operation recovery identities and supported recovery.
Each consuming implementation/QA runs relevant two-character/two-plot/two-realm,
dormant-history, delayed-generation, finality/transfer, deactivation/restore/export
and capable/uncapable-release fixtures through real composition and disposable PG.

STEP 3 - VALIDATION:
- `gh pr checks <number>` green when a PR exists (otherwise the recorded local gate at
  the recorded tip); `npx tsc --noEmit`; `npm run ci:changed` on the head;
  node scripts/gate_select.mjs; re-run any matrix row the audit questioned.
- Confirm all three money gates, service-owned price/settlement, complete denied
  storefront submodels and signed-artifact status across every priced wave file.
  Confirm exact ux-spec screenshots and interaction checks include all input modes,
  focus/reduced-motion and LOW/iOS actionable visibility.

STEP 4 - FIX:
- Apply ALL findings including nits; resolve any conflict with a
  locked ruling without silently changing that ruling. A fix to code re-runs the affected matrix
  rows. Commit fixes separately from the verdict, Conventional Commits with scope and
  body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Review the fix
  commits with a FRESH reviewer. Push the fixes to the open PR only if Fernando's push go
  from Phase 39 covers follow-up commits; otherwise stop and ask. `gh pr checks --watch`
  after any push.

STEP 5 - ACCEPTANCE:
- [ ] Every matrix row is backed by a command that ran; the PR body is complete, clean,
  and states the flags and the "Release gates" table with every artifact's status; CI is
  green on the final head when a PR exists; if state.md records no push go, the PR/CI
  criteria read N/A (awaiting authorization), the local gate is verified at the recorded
  tip and the row is recorded PASS, awaiting publication.
- [ ] All findings including nits are applied and the fresh fix review passes.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "39 QA": verdict (PASS, PASS awaiting publication, or FAIL), counts
  found and fixed, resolved findings and tracked external release gates. state.md:
  "Current phase" points at Phase 40 and preserves the locked existing-prestige OR and
  no-new-professions scope.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, the PR URL and CI state when a PR exists (else "awaiting
authorization"), counts found and fixed, resolved findings, tracked release gates, and
the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-40-keep-and-citadel-tiers.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 39 file as the next file
  to re-run with the findings attached.
- Never push without a go that covers the push; never merge a PR.
```
