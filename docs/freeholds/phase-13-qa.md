# Phase 13 QA: audit condition and the Steward's Ledger core

Audits `phase-13-condition-and-ledger-core.md`. Verdict goes in `progress.md` (row "13
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 13 (QA) of the Freeholds and Guildhalls feature: audit condition and the
Steward's Ledger core (the two pure cores, the pay_ledger command, prepay, the lockout,
the week boundary, the keystone exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 13 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "13 Condition and the Steward's Ledger core",
missing tests, dead code, determinism (zero Rng draws, no wall clock), three-host parity
of the pay outcome and the fhold fields, the never-destroy rule, and the keystone
exclusion; fix what the audit finds; record a verdict.

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
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the provisioner firewall and "one planner per file" entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("13 Condition and the Steward's
  Ledger core" and the row), docs/freeholds/phase-13-condition-and-ledger-core.md (what
  was promised)
- the Phase 13 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 13)
- the pins the diff claims: tests/freehold_condition.test.ts,
  tests/freehold_ledger.test.ts, tests/freehold_determinism.test.ts,
  tests/provisioner_firewall.test.ts (the ledger arm), tests/snapshots.test.ts (the
  fhold arm), tests/freehold_command_chain_online.test.ts,
  tests/server/freehold_ledger.pg.test.ts (PG-armed: the pay_ledger participant), the
  parity scenario
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, how each host
feeds resetDay, and any TODO, unused import, or arm that mutates on a refusal path.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-13-condition-and-ledger-core.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Pure condition and protection state. condition_core.ts derives condition from saved
   value/checkpoints and injected authoritative facts without clock, Rng or per-tick
   sweep. At 30 amenities work; below 30 they pause. Entry, furnishing/build and undo
   still work at 0; nothing is repossessed. The existing seven-day absence pause and
   three-day return grace consume ONE committed account lifecycle authority from 07b:
   server/freehold_lifecycle_db.ts::loadFreeholdLifecycle,
   advanceFreeholdLifecycleOnClient and loadFreeholdLifecycleProtectionPage, produced
   through server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator. Never
   derive grace from a plot's last_seen_day or latest return alone. Retain exact immutable
   transition/protection history for a dormant second plot across repeated returns;
   checkpoints consume its committed source revision. Union overlapping account
   absence/grace and service suspensions before excluding protected time, never add
   independent totals and double-credit overlap. Alts/claims/secondary plots do not
   restart grace; a buyer uses its own lifecycle prospectively without copied grace.
   NEW src/sim/freehold/state.ts::FreeholdUpkeepSuspension is an allowlisted safe
   projection of calendarId, startDay/endDay (realm-day keys, D84), startMs/endMs
   (display-only) and reasonCode only; no operatorEvidenceRef,
   revision diagnostics or secret. FreeholdUpkeepCalendarState and
   FreeholdUpkeepCheckpoint preserve stable calendarId, schemaVersion/resetPolicyId,
   committed authority/lifecycle revisions, coverageStartMs/coveredThroughMs and
   finalizedThroughMs plus exact bounded cumulative coverage facts. Raw server records
   and operator evidence are owned by 13a, never imported into src/sim or player wire.
   Original calendar identity stays on checkpoints and immutable credits through realm
   claims/reset-policy change; no guessed timezone, fixed 24h division or partial-day
   rounding. Per D84 the sim consumes day-keyed protection facts in the resetDay
   vocabulary: every suspension, coverage and finality fact the cores compare carries a
   realm-day key twin (startDay/endDay beside startMs/endMs; coverageStartDay,
   finalizedThroughDay and coveredThroughDay beside the three watermarks) produced
   host-side by 13a with resetDayKey(ms, REALM_RESET_TIME_ZONE), the same function
   that feeds ctx.resetDay, under one whole-day rounding rule per twin: the start
   twins (startDay, coverageStartDay) are the FIRST realm day wholly protected/covered
   (the window containing the instant only when it is exactly a 03:00 boundary,
   otherwise the next window); the through twins (endDay, finalizedThroughDay,
   coveredThroughDay) are the LAST realm day wholly protected/finalized/covered (the
   previous window unless the watermark is exactly a 03:00 boundary); the day
   containing a mid-day watermark is pending for the cores, never finalized or
   covered. condition_core and ledger_core compare only day keys and the epoch-ms
   fields are display-only, so no epoch arithmetic enters src/sim/.
   Unsupported/missing shapes and unbound_no_history never become empty
   outage history, fresh grace, a fresh Inn or permission to evaluate upkeep.
   Finality is explicit: every historical dependency of durable condition evaluation,
   checkpointing, bill classification and credit consumption/carry must be irrevocably
   finalized. coverageStartMs <= finalizedThroughMs <= coveredThroughMs; finalized
   facts and installed watermarks never regress. A mutable covered tail cannot authorize
   those effects; hold only the affected effect pending. Buying future credits does not
   require finalizing future time. Finality never changes the existing outage arithmetic:
   partial active week keeps the fixed voluntary bill, wholly protected billing period
   carries its original credit forward, no prorating, back bills or catch-up wear.
2. Published Ledger schedule and source planner. ledger_core.ts keys the schedule by
   realm week and schedule version only, independent of owner. The realm week is
   ledgerWeekOf(resetDay), which reuses the existing Tuesday anchor emberWeekAnchorOf
   (D84): this phase extracts that pure leaf (emberWeekAnchorOf, emberWeeksBetween,
   emberWeekAnchorPlusWeeks, resetDayToDayNumber) from
   src/sim/professions/masterwrought_materials.ts into NEW src/sim/realm_week.ts,
   re-exported from its old module so every existing caller and test is
   byte-unchanged, and ledgerWeekOf is that helper under the housing name, pinned equal
   to emberWeekAnchorOf on both sides of a Tuesday and consistent with
   WEEKLY_RESET_WEEKDAY = 2 in tests/freehold_ledger.test.ts. No second week
   derivation exists. Every bill has produce
   plus approved rotating nonproduce families within state.md's three-to-five-line
   target. The content/provenance worksheet supplies exact eligible item IDs,
   reference-derived quantities and rounding before enable; none is guessed. Compose
   one planReagentSourceDraw per line with explicit gradeIds, base before fine_,
   countMinusPlanned across lines and lock-aware/raw diagnosis. Bags-only, vault-only
   and automatic bags-then-vault sourcing drive the same preview and deduction. No
   keystone, gear intermediate, quickening catalyst or inaccessible/nontradable input.
3. Atomic material payment and immutable prepay. The pay_ledger command body is NEW
   src/sim/freehold/ledger.ts (the thin SimContext consumer of ledger_core.ts, the
   state.md module list's ledger.ts). pay_ledger validates source mode,
   owner/plot authority, published schedule, finalized historical dependencies and full
   batch before mutation. 07a's commitFreeholdMutation pairs character bags/vault and
   plot condition/immutable paid-bill credits behind the global plot fence; the
   immutable paid-bill credits persist in NEW freehold_ledgers (server/freehold_db.ts,
   an additive idempotent FREEHOLD_SCHEMA extension, keep-forever with a growth
   metric, the state.md seams row). Refused
   revision/lease/lock/shortfall changes neither side. At most four future weeks now:
   NEW src/sim/freehold/ledger_core.ts::LEDGER_PREPAY_MAX_WEEKS is 4 here (state.md
   Content numbers: 4 weeks initially and 12 from 25a, which raises this constant);
   refuse the fifth unchanged. Future purchase may bind a valid published schedule
   without finalized future elapsed periods; later actual credit consumption requires
   finalized elapsed dependencies. Credits retain source calendar/rate/material/receipt
   attribution across retuning/suspension. Material repair from 93 costs the same bill
   as from 60. 15's Call satisfies the current unpaid bill and repairs to 100 without
   consuming or creating future credits; already-paid current bill is repair-only.
   Preserve 07a's actual relative locks and reviewed composition hook: fenced character
   pre-lock/nonce, bank-ledger classification before guild replay and storage/custody
   tail, not an invented receipts-last hierarchy. 13a supplies compatible calendar-head
   read participants and immutable projection authority before live upkeep can enable.
4. Command and owner wire projection. The private fhold allowlist contains only the
   owner-needed condition/bill/source/prepay/suspension/grace/calendar facts. Explicit
   builders never serialize FreeholdUpkeepCalendarState or a DB record wholesale;
   the public visitor projection keeps 08a's separate allowlist. No evidence, secret or
   private diagnostic in self/public encoders or events. Outcomes carry operationId,
   plotId and operation kind consistently through text-free events, strict allowlists,
   HEAVY_SELF and ClientWorld so 16 ignores unrelated/late replies. The pure command
   adapter accepts an injected typed calendar/lifecycle projection; absent, unsupported,
   unbound, uncovered or unfinalized required historical facts are not-ready, not zero
   outage. 13 can prove the core with deterministic fixtures, but its live authority gate
   stays closed until 13a supplies reviewed storage, host feeds and accepted producer
   artifacts. No service polling or wall clock is added to the core for this dependency.
5. Decisive pure and atomic proof. Pin boundary math and no Rng, first visit versus
   absence, account-alt/dormant multi-cycle protection union, fixed partial-week bill,
   whole-week credit carry and no catch-up. Compare full-history reference to bounded
   projections, including DST and overlapping protection. Pin every source mode,
   lock/shortfall, mandatory produce for every reachable schedule, four credits/fifth
   refusal, original rate/calendar attribution and unfinalized-tail refusal. Future
   credit purchase succeeds with valid current facts even when future time is not final.
   Test actual self/public encoders with distinctive operator-evidence/secret/private
   diagnostic sentinels; none reaches wire/event/copy. Preserve original unknown/future
   state read-only. Atomic 07a fixtures prove no bags/vault/plot divergence on refusal or
   failure, and NEW tests/server/freehold_ledger.pg.test.ts (owned here, armed with
   TEST_DATABASE_URL) drives pay_ledger through commitFreeholdMutation on disposable
   PostgreSQL: refusal after the bags half, a stale CAS, and the service contract's
   "Transaction composition and workload evidence" proof list (races with autosave,
   storage start/apply, guild replay, account/character deletion and lease takeover,
   pending legacy side effects and ambiguous commits). One composed fixture pins that
   a daily and a Tuesday realm-week boundary both pass while the process is down and
   that the first evaluation on boot classifies the elapsed bill and wear exactly once
   and consumes at most one credit. 13a owns live ingress/calendar PG/host/rollout
   proof and the explicit docs/freeholds/upkeep-calendar-db-contract.md artifact before
   activation. The planned
   calibration and four-week acceptance stay with 03/13/20; no balance limit is guessed.

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run the Phase 13 STEP 3 suite list plus `npx tsc --noEmit`, including the PG-armed
  twins with TEST_DATABASE_URL set after `npm run db:up` (record that they ran, not
  skipped).

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 13 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "13 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13a-authoritative-upkeep-calendar.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 13 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
