# Phase 44: wave E integration close before final artwork and legal handoff

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

## Proposed durable preservation destinations (proposed, not executed)

implementation-plan.md "PR cadence and final preservation" defers the durable destination
list to this close. The table is the proposal a future, separately approved preservation
change (D71) starts from; it authorizes no move, copy or deletion, and 44 QA checks that
nothing was executed from it. One row per durable source README "Invariants and
preservation" names.

| Durable source (docs/freeholds/) | Proposed destination |
|---|---|
| ux-spec.md | NEW docs/prd/woc/freehold-ux-spec.md, created only if that future preservation is approved |
| ux-key-manifest.json, ux-shot-manifest.json | Move beside the UX destination under docs/prd/woc/ |
| state.md (D1 through D93 and both settlement records) | NEW docs/prd/woc/freehold-decisions.md |
| ruling-sheet.md | NEW docs/prd/woc/freehold-ruling-sheet.md |
| content-manifest.md | NEW docs/prd/woc/freehold-content-manifest.md |
| content-numbers-workbook.md, ledger-calibration-report.md, housing-budget-review.md | NEW docs/prd/woc/freehold-content-numbers.md |
| art-brief.md, final-artwork-audit.md | NEW docs/prd/woc/freehold-art-brief.md |
| audit-record.md | NEW docs/prd/woc/freehold-audit-record.md |
| persistence-rollout-contract.md, lifecycle-policy-binding.md, lifecycle-db-contract.md, upkeep-calendar-db-contract.md | NEW docs/prd/woc/freehold-persistence-contracts.md |
| The six docs/prd/woc handoff drafts and freehold-final-legal-handoff.md | Stay in place |

### Starter Prompt
```
This is Phase 44 of the Freeholds and Guildhalls feature: wave E integration close before final artwork and legal handoff.

Harness: Claude Code (the active harness; this close is review-only, and D74 requires
Codex only for asset-creating steps). Follow the root CLAUDE.md working-style block for
effort and fan-out; this prompt names no model.

Goal: prove the implemented wave and whole feature, record the complete reviewable
evidence, prepare the wave E PR package and open the wave E PR only after Fernando's
push go (D87), then continue through 44a artwork and 44b legal handoff without
declaring the packet complete. Never merge.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on screenshots at lowest graphics, capture rigs and
  English text, CI is the gate, never push to a fork, PR merge needs approval, the
  sensitive-material sweep, tooling improvements at session end.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74); this review-only close runs in the active harness and hands
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
- state.md, progress.md, qa-checklist.md, ux-spec.md and every completed implementation/
  QA record, including all suffixed producers and the accepted content/art manifests.
- The exact wave-E and whole-feature diff/commit inventories using recorded start tips;
  current tests, screenshot registry, generated-content obligations and release gates.
- docs/qa-gate.md, the canonical PR template and the full existing service/counsel/
  Terms/listing/deed/territory package. The six artifacts remain cumulative release gates.
- New phase-44a-final-codex-artwork.md and phase-44b-final-legal-handoff.md with their QA:
  these mandatory successors are not optional follow-ups.
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
The agent returns: the exact matrix commands and evidence, all actual triggered reviewers, complete
asset/runtime/source inventory, legal/service gate status and both next-stage inputs.
No declaration of packet COMPLETE, cleanup offer, deletion or final release readiness
belongs here. Missing implementation acceptance must be fixed before this close passes.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.
Database review is required BEFORE implementation decisions and again on the finished
diff, including changes to callers, persisted JSON, caches or workload even when SQL
text stays unchanged. Reuse 07a's global plot fence and reviewed actual legacy
touch-set, including caller-owned saves, character prelocks/nonces, bank-ledger
classification, guild replay and storage/custody effects. Preserve character FIFO
entry and the proved new-participant suffix, never a replacement generic lock order.
Never enter a queue holding a DB client or hold locks
across service IO. Bound admitted work, acquisition/query/transaction deadlines,
projection keys, rows and bytes; background producers use shared admission and
cancellation. Retain one running plus one pending dirty generation, not unbounded
FIFO writes. Supply a query/index inventory (scope, predicates, order, limit, expected
cardinality and supporting index), reverse-FK export/delete access and retention for
every growing shape. Disposable-PG concurrency, plans, query counts and maximum legal
payload evidence are acceptance, not satisfied by fake-pool tests.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Integration matrix: run every applicable qa-checklist row over the wave and whole
   feature, recording exact command, exit code and evidence once per needed check; the
   pg-armed twins run after `npm run db:up` with TEST_DATABASE_URL set to the URL
   state.md's "Validation matrix" server/ row gives, and each such row records "pg twins
   executed: N tests ran, 0 skipped". Include 07a/07b/07c/08a/13a and other suffixes; all
   custody/lifecycle/calendar/finality/
   recovery/rollout and money/D9 boundaries remain covered. Reuse deterministic
   evidence where unchanged and rerun any invalidated scope.
2. Visual and content proof: verify every ux-spec target and final-art source in the
   registered desktop/compact/tablet and LOW contexts, including all input modes,
   focus/reduced motion, denied-store absence and actionable visibility. Regenerate
   wiki/i18n/media through owning generators and verify freshness. Earlier waves
   require final art; 44a's inventory is a residual safety check, not permission to
   ship a placeholder or postpone an earlier acceptance.
3. Fresh whole-feature review: dispatch actual domain reviewers and qa-checklist
   over evidence and diff for complete COVERAGE. Apply every finding including nits;
   a new reviewer examines the fix round and affected checks pass. Reviewers do not
   duplicate the shared deterministic gate.
4. Reviewable release evidence: record the complete PR body and linked
   screenshots/matrix/gate inventory (screenshots committed under docs/screenshots/ and
   referenced from the PR body; lowest graphics preset seeded before page.goto, never
   locating an element by English text), with every paid flag still fail-closed and
   each external artifact handoff-ready, its acceptance status recorded as an unsigned
   release gate unless a signature artifact is on file. The push and the wave E PR
   happen only on Fernando's push go (STEP 4, D87); no release/deploy or storefront
   submission occurs here. Preserve pending recovery identities through any quiesced
   rollout; an unsigned legal/service gate is not an unmade product decision.
5. Mandatory continuation handoff: update 44/44 QA status as integration passed,
   final artwork/legal handoff pending. Supply the complete feature-created asset
   inventory to 44a and implemented-surface/legal evidence index to 44b. Keep every
   packet/durable UX/decision/content/service/legal file, and copy this file's "Proposed
   durable preservation destinations" table (one row per README durable source, each with
   a docs/prd/woc destination or "stays in place") into the row 44 record, marked
   proposed and not executed. No cleanup, directory removal, terminal packet claim or
   skip over either paired QA is authorized; the table is input to a future separately
   approved preservation change with incoming-link proof (D71), never an action here.

INVARIANTS THIS PHASE MUST KEEP:
Every player-visible string, including error, aria, tooltip and empty-state text,
uses an English hudChrome.housing.* key and the formatters from src/ui/i18n.ts.
Tooltips follow docs/design/tooltip-writing.md. Reuse docs/freeholds/ux-spec.md and the
shared family/painter/window lifecycle, focus return, keyboard/gamepad, touch safe-area,
reduced-motion and graphics-fairness contracts; do not fork the theme. New paths,
symbols, wire fields, tables and tests under housing/freehold are PLANNED unless an
earlier completed ledger row owns them. Re-find every existing anchor in the tree.
No power sale, keystone/gear-intermediate/quickening-catalyst bill, new farm bed,
repossession or calendar destruction. Sim stays deterministic and token-free; all
server player events are keyed data. Coordinators compose siblings and never grow
past their pinned ceilings. Fresh tests use literal expectations and negative controls.
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


Out of scope:
New mechanics, feature/deploy enablement, external legal messages, final packet
completion, cleanup/deletion or skipping 44a/44b.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run the recorded whole-feature matrix and node scripts/gate_select.mjs, using
  exact scoped tests, typecheck, builds, i18n/security and browser checks the gate owns.
- Run npm run wiki:content; npx vitest run tests/guide.test.ts; npm run i18n:gen;
  node scripts/pr_screenshots.mjs for the registered actual housing targets. Record
  any physical-device/performance evidence separately, never infer it from screenshots.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.
Then STOP and ask Fernando for the push go (state.md "Push policy", D87; D12 owns one PR
per wave for every wave), showing the matrix table, the screenshot paths and the PR body
draft. On the go: `git push origin <branch>` (origin only), open the wave E PR off the
base branch recorded in state.md following .github/PULL_REQUEST_TEMPLATE.md, then
`gh pr checks --watch`; on a red or stalled check run the ci-triage skill, fix, push
again and watch again. Stop at "pushed, green, ready for review"; without the go, stop
at "matrix green, awaiting push go". In both end states 44 QA, then 44a and 44b follow
(the D74/D75 ordering is unchanged); their commits reach an open wave E PR only under a
go that covers follow-up pushes, and the PR never claims 44a/44b as done.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Every wave/whole-feature matrix requirement has real evidence and the shared contribution gate passes; no skipped runtime proof is presented as a pass.
- [ ] UX/content/art/source and current authority/calendar/custody/money/D9 obligations pass actual-surface review and a fresh review of all fixes.
- [ ] Release evidence accurately records flags and every external artifact as
  handoff-ready with its acceptance status recorded as an unsigned release gate unless a
  signature artifact is on file; no feature release or legal approval is claimed. Either
  the wave E PR is open off the recorded base with CI green (push go given), or the
  branch is local at "matrix green, awaiting push go" with the PR body drafted.
- [ ] All packet and durable contracts remain present; 44 QA links to 44a, then 44a QA
  to 44b, then 44b QA terminal. Neither final successor is optional. The proposed
  preservation destination table exists in the row 44 record and nothing was executed
  from it.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 44 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence, gate status, the
PR number or local tip and any stacked-branch choice (D12). Record facts learned; do not
reopen the locked product rulings or mark a release gate accepted without its signed
artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status ("pushed, green, ready for review", or "matrix green, awaiting push go" if
the go has not come), the PR URL when one exists, touched files, exact validation
commands and outcomes, reviewer verdicts, tracked release gates and the FULL PATH of the
next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Stop at "matrix green, awaiting push go" until Fernando
sanctions the push; never push on your own judgment or to a fork; never merge or
enqueue a PR.
```
