# Phase 07b: account lifecycle and protection history

Wave A. The settled decisions in state.md, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md govern this work. The artifacts
and tests named below are NEW unless the context inventory labels them EXISTING.
No housing implementation is claimed complete by this planning file.

### Starter Prompt
```
This is Phase 07b of the Freeholds and Guildhalls feature: account lifecycle and protection history.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
This prompt names no model. Keep independent implementation owners disjoint; the parent
integrates shared callers and pins after their reports return.

Goal: Preserve one durable account lifecycle across every plot, realm and session without losing return protection or inventing calendar identity.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Sync per state.md "Worktree, base, and merge-forward": git fetch origin --prune;
  use the newest
  origin/release/**. Run release-merge-audit after any
  non-empty merge and pnpm install --frozen-lockfile when patches/ moved.
- Memory scan: MEMORY.md, freeholds entry, test-pin traps, apply ALL findings, and
  review the review-fix round. Record changed seam/ceiling/base facts in state.md before
  editing dependent code. Read each changed directory's CLAUDE.md.

STEP 1 - LOAD CONTEXT (through agents, never planning docs or coordinators directly):
- One Explore agent reads this file, its paired QA, state.md, the matching progress row,
  implementation-plan.md review table, ux-spec.md and the three content/art artifacts.
- It reads the following existing seams and prior outputs, returning exact exports,
  readers/writers, pin sites, known failure behavior and a promised-versus-tree table:
  - EXISTING server/db.ts::ensureSchema/exportAccountData and touchLogin;
    server/account.ts::handleAccountDeactivate and server/character_delete_db.ts;
    server/periodic_save_flush.ts::PeriodicSaveWrites/runPeriodicSaveFlush,
    the exported GameServer class in server/game.ts and its join/leave/saveAll members,
    server/main.ts shutdown wiring,
    server/linkdead.ts::planJoin and the async server/ws_auth.ts authentication shell.
    Verify actual symbols from state facts; auth/analytics are not gameplay presence
    (D36 as refined: authentication login is not the presence source).
  - EXISTING server/character_save_statement.ts::runFencedCharacterSave,
    server/character_save_transaction.ts::beginCharacterSaveTx, server/serial_writer.ts,
    server/background_db_gate.ts, server/raid_reset.ts and server/realm.ts.
  - PRIOR 07 plot load/preservation and 07a transaction/claim/operation foundation.
    Read current source-supported reset policy and the accepted binding artifact; never
    use the serving realm or auth last_login as an implicit account policy assignment.
- Reports go to the session scratchpad; replies carry a path and short summary.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
1. NEW server/freehold_lifecycle_db.ts owns FREEHOLD_LIFECYCLE_SCHEMA and
   loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage. Use one account-keyed
   account_freehold_lifecycle head with account FK, schema_version, binding_state,
   lifecycle_policy_id/source_calendar_id/reset_policy_id, revision, nullable captured
   last_presence_at_ms, return_generation and exact checkpoint/finality references.
   Keep immutable account_freehold_lifecycle_history under the SAME owner, keyed by
   account and transition generation, with source identity, prior absence/return/grace
   coverage and canonical transition fingerprint. A bounded head is not lifetime history.
   Retain every dependent protection interval/checkpoint, including dormant second plots;
   periodic presence-only advancement updates the head without inventing return records.
   Account-leading keys and bounded history pages have actual predicate/index/EXPLAIN
   evidence. Default history retention is keep-forever with growth metrics; lossless
   compaction needs proof covering all dormant plots, credits, pending operations and
   supported replay. No lifetime JSON array, newest-N clipping or foreign-plot rewrite.
2. NEW src/sim/freehold/lifecycle_core.ts::advanceFreeholdLifecycle is a pure planner;
   server/freehold_lifecycle_db.ts::advanceFreeholdLifecycleOnClient is the only durable
   writer through 07a. Define FreeholdLifecycleObservation in state.ts with authenticated
   account/session generation, observedAtMs captured before queueing and original source
   binding. Lock/read the current account head, derive approved prior absence/return
   transition BEFORE advancing presence, then commit head+immutable history+revision
   atomically. Stale/equal observations, superseded/fenced sessions and repeated admission
   cannot move presence backwards or mint grace. Character FIFO alone is insufficient
   for alt/cross-realm accounts. Absence, return and grace day boundaries are realm-day
   facts in the resetDay vocabulary (D84): the accepted binding's reset_policy_id
   resolves to the D84 realm reset zone, the server passes that resolved zone, identical
   across realm processes, to resetDayKey (never the bare REALM_RESET_TIME_ZONE constant
   of whichever process served the session), the sim reads resetDay, and an absent
   binding holds the effect not-ready instead of falling back to the process constant;
   observedAtMs and last_presence_at_ms are capture stamps, display-only for calendar
   purposes. Unknown source policy/finality holds the affected effect unavailable; never
   substitute commit time, a new UTC day or the serving realm.
3. NEW server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator exposes
   captureAdmissionObservation, flushPresenceObservations and releaseSession. It owns
   authenticated GameServer.join acceptance observations and the bounded per-account
   periodic/leave/shutdown flush connected to PeriodicSaveWrites/runPeriodicSaveFlush,
   GameServer.leave/saveAll and main shutdown. Capture observations before queued work.
   The admission module is part of this same output, not a separate deliverable: NEW
   server/freehold_lifecycle_admission.ts::prepareFreeholdLifecycleAdmission,
   commitFreeholdLifecycleAdmission and cancelFreeholdLifecycleAdmission bridge the
   asynchronous ws_auth shell to a bounded, generation/lease-bound admission reservation
   extracted from the existing planJoin/GameServer.join seam. A rejected/resumed join
   cannot become a new return. Revalidate current active-account/session/fence authority;
   commit the captured admission transition before publishing the admitted session or
   presence consequences, and cancel/drain stale reservations without leaked slots.
   A commit followed by delivery/process failure is an accepted historical observation,
   not permission to restart return grace on retry. Do not insert async DB work into
   the synchronous join body or assume it is already an async transaction boundary.
   Reserve an explicit typed admission participant extension for 31's later NEW
   createGuildClearAdmission owner, without implementing that later subsystem here:
   this phase's seam takes an opaque injected participant token and proves it with a
   bounded fake participant; 07b neither owns nor imports any 31 artifact (the reserved
   31 behavior is listed under LATER GUILD CLEAR ADMISSION EXTENSION below). Housing
   capacity never gates gameplay (D83): the join-time reservation hook publishes the
   session regardless of participant capacity; a participant whose extension cannot
   fit records a bounded, auditable clear-not-captured gap with an operator alert and
   publishes no partial extension, and no realm-cap or RAID_MAX shortcut proves any
   envelope. Integration uses the same generation/lease-bound lifecycle reservation,
   with no second admission queue or database wait inside synchronous join. Resume
   reuses its surviving generation; takeover is a fenced transfer/replacement, and
   leave releases only unused capacity after callbacks can no longer credit that
   generation. Periodic observations coalesce to one running plus one latest dirty
   generation; failure/cancellation preserves pending captured work, release does not
   replace it with shutdown time. Match real admitted session/fence identity, drain only
   within reviewed shutdown deadlines, and quiesce/reload on stale account CAS. No use of
   touchLogin last_login (D36 as refined), best-effort character analytics or housing
   per-tick SQL.
4. NEW FUTURE docs/freeholds/lifecycle-policy-binding.md records the accepted account
   assignment policy, lifecyclePolicyId/sourceCalendarId/resetPolicyId, authority/version,
   capable release, rollout/rollback and tested legacy interpretation before activation.
   NEW server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding consumes
   that accepted injected registry; absent/unknown assignment returns not-ready. Initial
   07 rows are explicitly unbound_no_history with no upkeep-derived stamps/credits.
   Bind truly empty pre-upkeep rows prospectively and atomically; ambiguous populated or
   future rows remain preserved read-only, never inferred from serving realm. Account
   history and plots retain original identities across realm movement/transfer. Publish
   committed lifecycle revisions to active local/foreign plot generations through a
   named server/freehold_lifecycle.ts::installCommittedLifecycleProjection hook; install only current-generation,
   internally consistent nonregressing revisions or guard-refresh before any dependent
   effect. No stale async load or historical duplicate can reinstall an older head.
5. NEW tests/server/freehold_lifecycle_db.test.ts and freehold_lifecycle_db.pg.test.ts,
   tests/server/freehold_lifecycle.test.ts, tests/freehold_lifecycle_core.test.ts and
   tests/server/freehold_lifecycle_rollout.test.ts prove the complete authority contract.
   Produce NEW FUTURE docs/freeholds/lifecycle-db-contract.md: concrete schema/queries,
   all callers/locks/FKs/deletion/maintenance, measured bounds and actual PG plans,
   lifecycle binding compatibility, captured-observation schedules, source/prefix union
   reference fixtures and redacted load/growth/deadline metrics. Cover two characters,
   second plots, simultaneous realms (two processes configured with different
   REALM_RESET_TZ produce one day key for one account), delayed writes, repeated boot,
   failure, stale CAS,
   multiple unloaded absence/return cycles, DST/reset identity, mixed versions and
   restoration. Every retained interval survives; no duplicated grace or lost protection.

INVARIANTS AND CLOSED HANDOFFS:
- Preserve all prior owned/protection/replay state. Unsupported future fields/versions
  stay unchanged and read-only; absent pre-feature state alone gets an empty default.
- Keep body/query/row/byte/admission/transaction bounds tied to measured approved artifacts,
  not invented literals. Hydrate before queues; queues hold no DB client. Use the actual
  07a legacy touch-set composition, including FK/unique/deferred effects and maintenance;
  never introduce a universal replacement lock order or a new pool/listener.
- Final activation requires the named capable-release/binding artifacts. An old binary
  leaving new tables untouched does not implement housing presence, export or recovery.
  Rollback quiesces mutation and preserves original recovery identities; no destructive
  downgrade, old-shape rewrite or deletion can erase protection/custody.
- 13/13a consume committed account lifecycle history/checkpoints; they never own another
  account grace source. All plots consume one transition without restarting it. Their
  evaluator must take the exact UNION of account absence/grace and service suspensions,
  not subtract two overlapping totals. Head summaries alone cannot prove that union.
  The downstream algorithm/DB artifact proves bounded indexed or resumable admitted
  interval work with a preserved cursor and explicit not-ready until complete; no
  elapsed-day/week loop, unbounded action scan, guessed empty history or partial charge.
- Covered but mutable facts cannot authorize a durable condition/bill/credit checkpoint.
  Require irrevocable finalized facts through every historical dependency at commit;
  future prepay purchase does not require finalizing future periods. Missing coverage
  preserves current condition and blocks affected evaluation instead of assuming charge.
- Soft account deactivation retains head/history and recovery; restoration reuses them.
  Character deletion preserves them. True account deletion follows 07a's D88 policy:
  head and history rows are not operation rows, so account_freehold_lifecycle and
  account_freehold_lifecycle_history cascade with the account, while D88's open-operation
  guard (07a's CharacterFreeholdOperationOpen class) still refuses the deletion while a
  housing operation is open; anti-replay identity lives in 07a's tombstones, not here.
  Export includes safe private lifecycle/protection facts via
  real table loaders, excluding operator evidence/secrets. Sale never copies seller grace:
  materialize condition at the accepted transfer boundary under existing source history,
  retain immutable credits/calendar identity and use buyer lifecycle only prospectively.
  Historical seller protection needed by the materialized boundary remains attributable.
- Pure sim behavior uses SimContext, no wall clock or host imports, no new Rng draw.
  IWorld is the renderer/UI seam; BOTH worlds and all facet/command/event pins change
  together. No internal account or guild ownership key crosses a public descriptor.
- Module-first siblings own logic. A coordinator edit is paid by a behavior-preserving
  extraction and a remeasured/lowered ceiling; never raise a ceiling without permission.
- Every player string resolves through an English hudChrome.housing.* key; use the
  tooltip-writing skill for every tooltip. Shared API/kind keys retain their own catalog.
  Regenerate artifacts; never hand-edit generated files or locale overlays.
- The state token firewall applies to on-chain vocabulary, with the Book of Deeds
  gameplay exception. Housing never sells power or destroys a home for condition.
- Never add a balance literal absent from state or a source/approved calibration row.
  A pending external acceptance has a concrete artifact, owner and closed release gate;
  it is not an unresolved implementation choice. Feature flags default off.


LATER GUILD CLEAR ADMISSION EXTENSION (31 implementation, 07b seam proof now):
- Reserved for 31, not built here: 31 creates src/sim/freehold/guild_clear_contract.ts
  with GuildClearCharacterAdmissionToken and the prepareGuildClearCharacterAdmission,
  commitGuildClearCharacterAdmission and cancelGuildClearCharacterAdmission calls that
  compose through 07b's prepare/commit/cancel lifecycle API (NEW in this phase; 31
  later calls it). When 31 lands, a fresh-character reservation extends every live
  unconsumed Nythraxis source before publication, including administrator admission;
  prepared unpublished character generations participate when a new Nythraxis source
  life reserves, so either interleaving retains its full envelope. Under D83 that
  extension never refuses GameServer.join, enterDungeon or a respawn: exhaustion records
  the clear-not-captured gap and the session still publishes. Captured clear candidates
  retain their own capacity until a known committed outcome is handed to bounded
  recovery. 31 supplies the concrete source-life accounting and activation proofs; 07b
  proves the typed extension lifecycle with a bounded fake participant now.

LATER GUILD LIFECYCLE EXTENSION (owned by 28a, same 07b family):
- Reserve explicit typed lifecycle scope. 07b admits account writes; 28a adds the guild
  branch through the same planner/coordinator/load/page/advance/binding/install owners.
  Separate guild_freehold_lifecycle/head and guild_freehold_lifecycle_history use real
  guild FKs and static guild SQL, never guild IDs in account rows or summed account grace.
- Every ordinary current member's admitted gameplay qualifies independently of donations.
  28a binds captured observations to server-controlled membership incarnation and proves
  transition-before-removal/new-binding publication through the actual membership
  mutation boundary. Offline membership creates no presence; rank changes restart no
  grace. Noncoalescible admission/return/membership boundaries are never collapsed into
  the latest periodic timestamp. Unknown historical eligibility remains protected and
  unavailable pending recovery, never invented or dropped.
- Guild parent/membership/head/history/hall/calendar/cleanup participants extend the
  actual 07a touch-set manifest. Use bounded dirty-guild/character-key batches without
  roster scans or member account-history fan-out. Observer deletion preserves guild
  protection; restrictive dependency-aware disband/materialization preserves pending
  hall/credit/operation facts. 29/13a consume exact history and union with outages.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- npx tsc --noEmit; npx vitest run tests/freehold_lifecycle_core.test.ts
  tests/server/freehold_lifecycle_db.test.ts tests/server/freehold_lifecycle.test.ts
  tests/server/freehold_lifecycle_rollout.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts.
- With TEST_DATABASE_URL set for a disposable private schema, npx vitest run
  tests/server/freehold_lifecycle_db.pg.test.ts. Prove tests executed, not skipped.
- Run actual periodic-save, join/leave/saveAll/shutdown, account export/deactivation,
  character deletion and legacy save suites named by the source census; pin literal
  stored rows and observation times, not expectations derived from production output.
- Race v1 load, v2 committed install, v1 completion and session generation replacement;
  assert unchanged newer state. Race account/plot/claim/deletion callers with real PG,
  capture wait/query/row/byte counts and timeout/cancel/late-client cleanup.
- Invoke database-performance-reviewer before database/workload decisions and on the
  finished diff whenever this file touches SQL, storage shapes, queues, locks or growth.
- Required COVERAGE reviewers: database-performance-reviewer, migration-safety, privacy-security-review, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, test-coverage-auditor, qa-checklist.
  Each reports all findings to a file. The parent applies ALL findings including nits,
  then a FRESH reviewer reads the fixes. No unreviewed fix is accepted.
- Run node scripts/gate_select.mjs before completion; npm run gate is the deeper option.
  Record exact commands, exit codes, exercised/omitted suites and material risks.

STEP 4 - COMMIT CADENCE:
- Commit coherent dependency-first chunks with Conventional Commits scope and a body,
  explicit paths, never git add -A, no coauthor trailer and no word "phase" in a message.
  Separate extraction/parity provenance if applicable. Run npm run ci:changed after
  the last commit and read its exit code. Do not push or open/merge a PR.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] One account head/history writer and captured-observation coordinator are wired at
  every named host seam; prior transition commits before advancing/publishing presence.
- [ ] Delayed/duplicate/alt/foreign-realm observations cannot erase history or restart grace;
  unloaded plots retain exact multiple-cycle protection and overlap-union reference proof.
- [ ] Accepted source binding, unbound old fixtures, irrevocable facts, monotonic install,
  exports/deactivation/restore/delete and capability-floor rollback all have decisive tests.
- [ ] Required specialists accepted concrete lock/query/retention/workload artifacts before
  coding and on the finished diff; every mandatory PG assertion actually executed.
- [ ] All scoped checks and the shared contribution gate passed, every required review
  returned, and the independent fix review found no remaining finding.

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md row 07b and state.md's implementation ledger with exact files,
  exported symbols, schema/wire/command keys, measured bounds, artifacts and evidence.
  Keep planning "settled" distinct from implementation "built". Record no anonymous
  deferral; carry every named unsigned release gate when applicable.
- Record useful traps in the freeholds memory entry within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
End with status, files, commands/outcomes, review verdicts, release evidence still required,
and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07b-qa.md

STOPPING RULES:
- Preserve unrelated user work. Stop for an unapproved destructive schema change or a
  required raised monolith ceiling; explain the exact constraint and concrete evidence.
- If a required artifact or runtime proof fails, record FAIL and repair it; do not claim
  approval, invent numbers or silently waive checks. Never push or open/merge a PR.
```
