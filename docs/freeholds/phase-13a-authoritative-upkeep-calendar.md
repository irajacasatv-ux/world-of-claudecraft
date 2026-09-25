# Phase 13a: authoritative upkeep calendar

Wave A. Completes 13's pure contract with durable shared history, private authority
ingress, monotonic host publication and explicit rollout proof. Live upkeep remains
closed until the named producer and release artifacts are accepted. The successor is 14.

### Starter Prompt
```
This is Phase 13a of Freeholds and Guildhalls: authoritative upkeep calendar.
Harness: Claude Code. Follow root CLAUDE.md "Working style by model capability";
this prompt names no model. Use its effort and bounded parallel review requirements.
Goal: preserve exact historical protection and credits while installing only finalized,
committed, current-generation authority through a bounded private delivery path.

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
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the provisioner firewall, "one planner per file",
  the farm watch fee, the monolith ratchet, ALL_DELTA_KEYS conflicts, parity goldens,
  test-pin traps (constant self-comparison, mutation harness must prove tests ran).

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one reader for state.md, progress.md, the 13/07a/07b/07c contracts, ux-spec.md,
docs/prd/woc/freehold-service-contract.md and this file. A source reader verifies all
NEW producers from their preceding pairs and reads the actual calendar, lifecycle,
wire, HTTP/body/auth/rate/admission/deadline, deploy/user-data.sh, account export and
ensureSchema seams. Return actual symbol ownership, rollout limits, full touch set,
calendars/protection preservation, public-route deny and both dispatch paths. Read the
root and directory CLAUDE guidance before source work. No source meaning is inferred
from a planned export or external acceptance document.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last. NEW names are planned
producer outputs, never assertions that current source already exports them.

Deliverables (at most five):
1. Durable shared authority and bounded historical projection. Extend
   server/freehold_db.ts::FREEHOLD_SCHEMA; NEW applyFreeholdUpkeepCalendar,
   loadFreeholdUpkeepCalendar and server-only FreeholdUpkeepAuthoritySuspension own
   calendar head, source history and normalized exact prefix summaries. The server-only
   record carries suspensionId/authorityVersion/calendarId/scope/reasonCode/startMs/
   endMs/revisionId/operatorEvidenceRef. 13's FreeholdUpkeepSuspension is a separate
   allowlisted safe interval; private evidence does not enter src/sim or player wire.
   Finalized coverage is irrevocable. Preserve the explicit 13 finality rule through
   every historical dependency of durable condition/bill/credit evaluation/consumption;
   mutable covered tail authorizes no such effect. Future credit purchase does not need
   future finality. Keep coverageStartMs <= finalizedThroughMs <= coveredThroughMs;
   watermarks/revisions never regress. Closing an open interval cannot rewrite finalized
   history. Invalid backfill/conflicting prefix requires separately reviewed bounded
   repair, never ordinary apply. Same-revision fingerprint identity, predecessor checks,
   schema/reset policy and original calendar/checkpoint/credit identity are durable.
   Indexed cumulative union/protection and wholly-protected-period facts permit bounded
   predecessor/endpoint/credit-rank queries without all-history or absent-day/week loops.
   Combine immutable 07b lifecycle coverage with service coverage as a union; independent
   subtraction must not double-credit overlap. No force-saving foreign claimed plots.
   Keep shared history with measured growth until every dormant plot, credit, replay and
   mixed-release dependency is losslessly rebased. No TTL/newest-N clipping, head deletion
   or reuse while referenced. Include 13's literal pre-upkeep/unknown-shape fixture rules.
2. Private bounded authority ingress. NEW server/freehold_upkeep_ingress.ts exports
   createFreeholdUpkeepIngress, configureFreeholdUpkeepIngressRuntime,
   handleFreeholdUpkeepIngress, routes and FreeholdUpkeepIngressBudget for
   POST /internal/freeholds/upkeep-calendar. Existing
   server/http/middleware/require_internal_secret.ts::requireInternalSecretFailClosed
   consumes the NEW dedicated header/env pair FREEHOLD_UPKEEP_SECRET_HEADER=
   'x-woc-freehold-upkeep-secret' and FREEHOLD_UPKEEP_SECRET_ENV=
   'FREEHOLD_UPKEEP_SERVICE_SECRET'. Unset/wrong secret refuses before body work;
   no fallback/echo/log or inferred dual-key rotation. This authenticates calendar
   ingress only, never checkout, geography or running distribution.
   AFTER secret validation and BEFORE body read, JSON parse or digest, the factory's
   measured pre-body rate/concurrency admission takes an immediate permit or refuses;
   no waiter queue. Fixed configured producer identity, not arbitrary attacker keys,
   bounds admission state. Reuse server/ratelimit.ts::rateLimitNow and
   windowedRateLimitOutcome conventions; no global DB limiter work at this step.
   FreeholdUpkeepIngressBudget names maxInFlightBodies/maxRequestsPerWindow/windowMs,
   supplied by the measured acceptance artifact, not invented numbers. Hold the permit
   through response/error/abort and release once, so duplicate/digest/raw-body work is
   included. Then withBody()/DEFAULT_JSON_BODY_MAX_BYTES bound each body; strict shape
   and measured record/field/result bounds precede the separate shared DB
   BackgroundDbGate.tryAcquire permit. No new pool, independent DB gate or queue.
   server/freehold_db.ts::FreeholdUpkeepDbBudget names acquireTimeoutMs,
   lockTimeoutMs/statementTimeoutMs/idleTransactionTimeoutMs/transactionWallTimeoutMs;
   small-workload measured values, not the heavy-save allowance. The factory owns abort,
   acquisition deadline and eventual late-client release; existing
   server/db_transaction_deadline.ts::createDbTransactionDeadline/backendCancelViaPool
   owns checked-out transaction wall/cancel with local lock/statement/idle backstops.
   Register the leaf plus thin legacy dispatch; both use the same guard/handler/catalog.
   Do not reopen public /internal/*: existing deploy/user-data.sh denies that prefix.
   The game operator and economy-service deployment owner jointly produce the private,
   authenticated encrypted per-generation delivery acceptance in
   docs/freeholds/upkeep-calendar-db-contract.md and
   docs/prd/woc/freehold-service-contract.md. Name private/loopback routing, authenticated
   recipient identity, generation registration/expiry, key configuration, bounded
   retry/ACK/reconciliation and public-deny regression evidence. A signed acceptance
   document is not proof that runtime responses carry cryptographic signatures.
3. Monotonic host publication and exact acknowledgments. Extend existing
   server/sim_calendar_feed.ts::SimCalendarSink/feedRealmCalendar (today it writes the
   four scalars utcDay, resetDay, eventLeadDay and dailyResetRemainingSec from one
   instant and zone) to also install a readonly committed projection using
   server/raid_reset.ts and server/realm.ts::REALM_RESET_TIME_ZONE policy. Per D84 this
   file produces every day-keyed fact 13 consumes with resetDayKey(ms,
   REALM_RESET_TIME_ZONE), the same function that feeds ctx.resetDay, rounded to whole
   realm days: the start twins (startDay, coverageStartDay) are the first day wholly
   covered (the containing window only at an exact 03:00 boundary, else the next); the
   through twins (endDay, finalizedThroughDay, coveredThroughDay) are the last day
   wholly finalized/covered (the previous window unless the watermark is exactly a
   boundary); a mid-day watermark leaves its day pending; epoch-ms fields
   stay display-only. Existing src/game/utc_day.ts::feedSimCalendar(sim) takes only the
   sim and reads Date.now() itself once per second, writing the same four fields; the
   offline calendar projection is therefore a NEW explicit input installed beside it
   as a src/game/ sibling (never a fixture inside src/main.ts), built from the
   clock-free resetDayOf(at)/nextResetMsOf(at) primitives. headless/ has no calendar
   feed today: add the missing deterministic headless caller fixture that calls
   feedRealmCalendar(sim, fixedNowMs, zone) with an injected instant and zone, never
   Date.now, so all three hosts feed the same four fields while the D11 pin keeps
   housing excluded from the RL env. Hosts
   receive safe projection only, no IO/history walk/per-owner allocation in callbacks.
   Installation is one guarded atomic swap bound to actual processGeneration,
   calendarId, authorityVersion, committed digest and lifecycle revision. An async
   completion from an old generation, lower revision or regressing watermark is
   discarded; same revision with a different digest is a conflict. A load of v1 that
   finishes after v2 never replaces v2, even if v1 was a legitimate duplicate. Only a
   consistent committed projection satisfying current lifecycle/head guards installs.
   ACK semantics are exact: current duplicate matching current durable digest installs
   or verifies that head and replies current with requestedRevision/requestedDigest,
   installedRevision/installedDigest and actual processGeneration. A historical duplicate
   matching its retained immutable digest replies superseded ONLY after a verified newer
   current head is installed, naming both identities. It never installs the old payload
   or claims the requested historical revision is current. Same revision/different
   digest, unknown historical identity, gap or unknown schema refuses with no installation
   ACK. If required load/finality/recovery is incomplete, reply pending/refusal without
   claiming installed authority. A new accepted head uses the same current ACK only
   after commit and guarded installation. Recheck installed identity at ACK construction;
   a concurrent newer install is explicitly superseded, not a false old acknowledgment.
   The service sends to every live generation, including idle rolling peers; duplicate
   DB commit still requires recipient install/verify. Bootstrap reaches ready only after
   current committed coverage loads. Mutation/claim revision/finality guards supplement
   delivery; they do not replace it. Beyond coverage/finality hold affected effects,
   never infer service health from silence. No polling, per-tick SQL, new pool or LISTEN.
   Calendar writer uses head FOR UPDATE and only history/summary rows, never account/
   plot/receipt locks; 07a consumers use compatible FOR SHARE source heads through commit.
   Multiple source IDs sort only in the reviewed new-participant suffix. Loaders release
   shared snapshots before other queues; recovery/maintenance cannot invert head-to-plot
   order. Apply guards inspect finalized dependencies again under those same locks.
4. Migration, account lifecycle and rollout preservation. Consume 07b's
   server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/advanceFreeholdLifecycleOnClient/
   loadFreeholdLifecycleProtectionPage and server/freehold_lifecycle.ts::
   createFreeholdLifecycleCoordinator, whose captureAdmissionObservation,
   flushPresenceObservations and releaseSession use captured observedAtMs before queues.
   Its installCommittedLifecycleProjection refuses stale generation/revision. Consume
   server/freehold_lifecycle_admission.ts::prepareFreeholdLifecycleAdmission/
   commitFreeholdLifecycleAdmission/cancelFreeholdLifecycleAdmission for accepted
   gameplay entry, not authentication login or latest-only/plot-local grace.
   Original binding uses 07b's server/freehold_lifecycle_binding.ts::
   resolveFreeholdLifecycleBinding and docs/freeholds/lifecycle-policy-binding.md; 13a never
   guesses a timezone/source calendar. Literal old 07 rows with unbound_no_history remain
   no-upkeep until accepted prospective binding commits. Ambiguous populated or unknown/
   future checkpoint/credit state stays original/read-only, not an inferred reset/fresh
   house. Oversized recovery keeps original row plus bounded diagnostic/reference, not
   a supposedly bounded second blob forced to contain the original. Repeated migration,
   boot and every periodic/leave/shutdown/caller-owned save preserve these facts.
   Character deletion preserves account lifecycle/arrival records. Soft deactivation,
   restoration, hard deletion, export and anti-replay retention are distinct operations
   supplied by 07b/07c/07a. 13a extends existing server/db.ts::exportAccountData through
   explicit housing/lifecycle/checkpoint/credit projections, excluding operator evidence,
   secrets and private diagnostics. Sale materializes condition at its transfer boundary,
   preserves source calendar/immutable credit identity, and applies buyer lifecycle only
   prospectively; seller history remains, buyer grace is not copied. Unsupported stored
   tier IDs are preserved separately from accepted writer vocabulary. 07c's arrival mark
   represents committed first-entry eligibility, not visual completion; ordinary visit
   replay never mints another directive/receipt. Name a minimum capable release/compatible
   rollout before enable: old release code is not assumed to understand new normalized
   state or housing presence/export. Rollback quiesces new effects while preserving
   original pending recovery identity; it does not promise old-binary housing semantics.
5. Integrated evidence and release artifact. Produce
   docs/freeholds/upkeep-calendar-db-contract.md with actual SQL/index/EXPLAIN and scoped
   acquisition/query/lock/wall/body/digest/duplicate/concurrency/bytes/growth measurements,
   immutable-prefix and retained-history proof, safe projection schemas, private delivery
   acceptance and named minimum capable rollout. Add NEW
   tests/server/freehold_upkeep_ingress.test.ts and
   tests/server/freehold_upkeep_calendar_db.test.ts and
   tests/server/freehold_upkeep_calendar_db.pg.test.ts; extend calendar/reset host tests,
   freehold_condition/freehold_ledger and actual self/public wire tests. Pin finality
   tail correction between load/commit; future prepay without future finality; v1 load,
   v2 install, v1 resume; old-generation completion; all current/superseded/conflicting
   ACK arms and exact digest/generation; wrong secret before permit/body, overload before
   parse/digest, permit release on abort/error, duplicate storms and peak shared pool.
   Distinct evidence/secret/private-diagnostic sentinels never reach self/public wire.
   PG proof covers shared readers/calendar-only writer, actual touch-set/queue order,
   cancellation/late checkout/commit ambiguity; literal legacy/populated/repeat boot,
   periodic/leave/shutdown/failure round trips; two-character/plot/realm lifecycle races;
   dormant multiple-cycle union, DST, long open outage and immutable credit carry. The
   projection-builder test pins the D84 conversion at the boundary: a suspension whose
   start instant sits between realm-local midnight and 03:00 lands in the previous
   realm day's window and, being mid-window, rounds its startDay to the next wholly
   covered day; a DST transition day yields one key on both sides of the shift; a
   mid-day finalizedThroughMs yields the previous day's key and the same instant at
   exactly 03:00 yields that window's key (the projection-builder arms of
   tests/server/freehold_upkeep_calendar_db.test.ts). One
   composed fixture pins that a daily and a Tuesday realm-week boundary both pass
   while the process is down and that the first evaluation on boot classifies the
   elapsed bill and wear exactly once and consumes at most one credit.
   DDL remains additive/idempotent under the existing ensureSchema advisory lock after
   parent tables and before final growth-budget fragment. Service acceptance supplies
   exact finality/identity/coverage/delivery facts before enable; no new rate, cap,
   timezone or outage policy is invented. All findings/nits and fresh fix review are
   implementation obligations; this prepared packet is not an executed runtime verdict.

INVARIANTS THIS PHASE MUST KEEP:
- Finalized historical authority, original identity/credits and protection union are
  durable requirements; uncovered/unfinalized history is not no outage. Future credit
  purchase needs no finalized future time. 13 supplies the unchanged arithmetic.
- Sim is deterministic and text-free. No private evidence in any sim/player projection.
- No per-tick SQL, historical day loop, new pool/poll/LISTEN or unbounded queue.
- Existing public /internal/* denial and 07a legacy touch-set order remain intact.
- Unknown/oversized stored data stays original/read-only with bounded diagnostics.
- Follow state.md numeric provenance, monolith ceilings and English housing key policy.

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and on the finished
diff, paired with persistence/security. Each review covers every finding and nit;
a fresh reviewer reads fixes. Inspect parent evidence; do not duplicate shared gates.
- Run `npx tsc --noEmit` and `npx vitest run
  tests/server/freehold_upkeep_ingress.test.ts
  tests/server/freehold_upkeep_calendar_db.test.ts
  tests/server/freehold_upkeep_calendar_db.pg.test.ts tests/sim_calendar_feed.test.ts
  tests/utc_day.test.ts tests/raid_reset.test.ts tests/freehold_condition.test.ts
  tests/freehold_ledger.test.ts tests/server/freehold_wire.test.ts tests/snapshots.test.ts`;
  run the host/command parity and legacy save/export suites selected by the source census.
  Disposable PostgreSQL runs the real
  lock/migration/transaction/EXPLAIN tests, not mocks presented as database proof.
- Both dispatch arms, real self/public encoders, actual save/export/deactivation and
  public-route deny tests must exercise the composed path. Future deployment acceptance
  names private recipients/generations; local test success alone is not deployment proof.
- Run the shared contribution gate required by docs/qa-gate.md, including
  node scripts/gate_select.mjs when required. Missing environment proof stays a named
  release gate, not silently PASS. Apply ALL findings including nits and review fixes.

STEP 4 - COMMIT CADENCE:
Use scoped Conventional Commits with a body and explicit owned paths. Separate coherent
calendar persistence, ingress/host wiring and decisive proof when reviewable. Never
`git add -A`; the word "phase" appears nowhere in a commit message. No push or PR.
Run `npm run ci:changed` after the last commit as the Stop-hook floor; record exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every STEP 2 deliverable has decisive proof and a fresh fix review; no skipped arm
  or external unsigned producer artifact is silently called complete.
- [ ] Durable-finality/future-credit distinction, exact monotonic ACKs, safe encoders,
  pre-body admission, private generation routing and public denial are all exercised.
- [ ] The D84 day-key conversion pins (a midnight-to-03:00 start lands in the previous
  realm day's window and rounds forward; one key across a DST shift; the mid-day and
  exact-boundary watermark arms of the whole-day rounding rule), the composed
  daily-plus-Tuesday restart fixture and the injected-instant headless fixture ran
  green.
- [ ] Shared history/lifecycle union, legacy unbound/unknown preservation, actual
  transaction/queue order and minimum capable rollout have the named acceptance artifact.
- [ ] ALL reviewer findings, including nits, are resolved consistently with locked
  rulings, and the fixes have fresh review. All invoked checks and release gates
  have truthful outcomes; an unsigned external artifact remains its named release gate.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md/state.md/implementation-plan.md with 13a producer names, safe-versus-
server-only schemas, delivered artifact identity, measured budgets, capability minimum,
review evidence and next-file chain. Record lessons and actual invalidated source facts.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, exact validation/review outcomes and the FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13a-qa.md

STOPPING RULES:
- No guessed numeric limit, calendar identity/timezone or unsupported data reset.
- No live enable before accepted authority/deployment/rollout and database proof.
- No unreviewed alternative to existing lock order or raised monolith ceiling.
- Never push, open or merge a PR.
```
