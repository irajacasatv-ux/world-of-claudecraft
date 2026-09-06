# Phase 41a QA: audit bounded layout saves and public sharing

Audits `phase-41a-layout-save-and-sharing.md`. Record the verdict in `progress.md` row "41a QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 41a QA of the Freeholds and Guildhalls feature.
Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 41a, ux-spec.md, the implementation
file, referenced signed artifacts, the complete scoped diff and all claimed tests.
Return to a scratch report: promised/delivered table, each new symbol's actual consumer,
each test's assertion and failure control, changed anchors, unused code and gate evidence.

STEP 2 - AUDIT:
Deliverables (at most five):
1. Complete promised/delivered and adversarial correctness report.
2. Decisive test, runtime-evidence and hygiene coverage report.
3. Applied fixes, fresh fix review and recorded final gate verdict.

Fan out three read-only coverage auditors: correctness, test coverage, and hygiene.
Each reports every issue, including uncertain issues and nits, with severity/confidence
and evidence to a file. Audit these specific requirements:
- Public codec strips every private save label/account/plot/item-copy/price field;
  malformed and over-limit compressed/decoded/nested inputs fail before allocation.
- Five saves per stable plot have measured byte/row/label bounds; unsupported stored
  versions are preserved safely. Export/delete follow 07a's per-row-class ON DELETE
  policy (D88) and an open apply/import operation blocks deletion with the mapped
  refusal class; the save/import rate limit is the NEW layout_import MsgLane member
  in server/msg_lanes.ts (per session; the closed union and its pinning suite extend)
  plus the per-account bounded LRU budget in 26's idiom: one frame beyond either
  budget, on one session and spread over two sessions of one account, is refused with
  a keyed reason before decode, behind the MSG_BYTE_BURST frame bound, never a REST
  rate_limit middleware.
- Apply matches already placed/bag/authorized-bank exact copies; no duplicate copy
  requirement for an existing placement, no implicit vault/guild authorization, no
  furniture/dye creation. Shortfall or unsafe displacement leaves all state intact.
- Imported tint changes reuse 41's src/sim/freehold/dye.ts::planFurnishingDye and
  authoritative atomic material transaction: exact owned dye copies, chosen source,
  station/proximity, condition 30+, current cost rules and explicit color/material
  preview. Unchanged tint consumes nothing; changed tint cannot be ignored or free.
  Test absent dye, absent station, remote station, condition 29, unauthorized channel,
  duplicate dye-copy allocation,
  stale preview/source and failure midway through a batch with no partial effects.
- Unsupported incoming share version/tint refuses before application. Valid future
  owned saved tint/schema remains original/read-only through load/save/export and
  recovery, distinct from malformed known-schema repair.
- Real-PG bank/edit/revision/current-ACL/dye-copy races and crash proof exercise
  atomic all-or-none custody and material consumption; private labels remain absent
  from public share preview/code, while approved public colors remain present.
- Check every facet/command/snapshot/chain pin and ux-spec saved/import/shortfall/stale
  input/focus states, with maximum legal layout and decoded-byte evidence. The NEW
  layouts.*/denied.layoutCode keys and the housing-layouts target (eight layouts-*
  scenes) named in 41a deliverable 4 exist in ux-spec.md and both regenerated manifests
  with updated counts (D92).
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
for the actual surfaces, including persistence/DB review of JSON or caller changes.
Database performance must have reviewed decisions and the finished diff; fake pools
do not prove locks, query plans or concurrency.

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
Run every implementation STEP 3 command and required disposable-PG evidence. Record
exact commands, exit codes and evidence paths; an env-skipped suite is not runtime
proof. Run node scripts/gate_select.mjs before completion.

STEP 4 - FIX:
Apply ALL findings including nits. Re-run affected checks. A fresh reviewer reads the
fix commits before completion. Commit fixes separately using scoped Conventional
Commits with bodies and EXPLICIT paths, no coauthor trailer, no word "phase".
Run npm run ci:changed after the last commit and read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance has a decisive recorded check and evidence.
- [ ] All findings are applied; contradictions with a locked ruling are resolved in
  the report without silently changing that ruling. No unresolved implementation gap.
- [ ] The fresh fix review passes and the shared contribution gate passes.

STEP 6 - DOC UPDATES + MEMORY:
Record PASS or FAIL, findings/fixes, actual commands, evidence and tracked release gates
in progress.md row "41a QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-42-second-freehold-sku.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Do not
push the branch or open/merge a PR in this audit.
```
