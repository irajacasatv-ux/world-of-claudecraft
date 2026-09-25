# Phase 07b QA: audit account lifecycle and protection history

Audits [phase-07b-account-lifecycle.md](phase-07b-account-lifecycle.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 07b QA of the Freeholds and Guildhalls feature: account lifecycle and protection history.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, apply ALL findings including nits,
and have a second fresh reviewer verify the fix round before recording a verdict.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the
  the newest release/**;
  release-merge-audit after non-empty merge and frozen install if patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-07b-account-lifecycle.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Compare all five outputs to actual modules/callers and both source/schema artifacts.
    Enumerate every account presence reader/writer; auth last_login and analytics cannot
    substitute. Pin capture-before-queue, transition-before-presence and delayed writes.
  - Race two characters, two plots and two realms; stale session/fence/CAS, old-generation
    hydration, periodic/leave/shutdown failure and replacement must preserve newer state.
    Same observed fact cannot mint another return generation or grace interval.
  - Start with literal unbound_no_history 07 rows, bound old/future/malformed/oversized
    and restored rows. Verify prospective empty binding, explicit refusal of ambiguous
    history, preservation of originals, accepted policy identity and no implicit
    serving-realm/UTC conversion; absence/return/grace day boundaries use the resetDay
    vocabulary from the zone the accepted binding resolves (one day key for one account
    across two processes with different REALM_RESET_TZ, never the serving process
    constant) and epoch-ms stamps are display-only (D84).
  - Keep a plot unloaded through several absence/return cycles; compare exact protection
    union with a small independent reference, including overlap with service suspension,
    DST, gaps, provisional/finalized corrections and preserved immutable credits.
  - Verify safe explicit table exports, soft deactivation/restoration, character deletion,
    true account deletion (head and history rows cascade with the account; an open
    housing operation refuses it with 07a's CharacterFreeholdOperationOpen class, D88),
    sale boundary and buyer-prospective lifecycle.
    Prove legacy release capability limits and rollback quiescence, not just untouched
    new tables.
  - Execute real PG locks/plans at measured sizes; no reversed legacy/FK/maintenance edge,
    per-tick SQL, client-held queue wait, unbounded history load or destructive pruning.
- Required domain COVERAGE review: database-performance-reviewer, migration-safety, privacy-security-review, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.


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

LATER GUILD CLEAR ADMISSION EXTENSION (31 implementation, 07b seam proof now):
- Verify a typed participant hook on 07b's NEW prepare/commit/cancel admission
  reservation with a bounded fake: all-or-none pre-publication extension, cancellation,
  stale generation, surviving resume, takeover and authoritative leave. The
  initial opaque injected token needs no future 31 import. Once 31 is implemented,
  GuildClearCharacterAdmissionToken is owned by the lifecycle reservation; matching
  prepareGuildClearCharacterAdmission/commitGuildClearCharacterAdmission/
  cancelGuildClearCharacterAdmission calls settle before authenticated publication.
  Interleave a prepared unpublished character with new Nythraxis source reservation
  in both orders; both envelopes must include that generation. Capacity exhaustion
  publishes the session and records the auditable clear-not-captured gap with an
  operator alert (D83); a failed extension publishes no partial capacity and creates
  no secondary waiter queue.
- 31 later installs createGuildClearAdmission to cover every live unconsumed Nythraxis
  life for every admitted authenticated character, including administrator admission;
  it never refuses join, dungeon entry or revival (D83). Neither RAID_MAX nor
  MAX_PLAYERS_PER_REALM is a hard room-envelope proof. Leave
  releases only unused participant capacity; captured candidates remain independently
  retained until known committed outcome handoff. The 31 producer owns exact byte/slot,
  source-life, activation/respawn and real save integration tests; do not require its
  future runtime implementation to close this 07b seam test.

STEP 3 - VALIDATION:
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
- Run every scoped command listed in the implementation file and node scripts/gate_select.mjs.
  A skipped PG suite is not a pass. Assert work happened, use literal expected outcomes,
  include controls that pass when a rejected precondition is removed, and never derive
  expected values from the production object under test.

STEP 4 - FIX:
- Apply ALL findings including nits; document a conflict with a locked decision and its
  ruling rather than silently dropping it. Rerun affected checks and a FRESH reviewer
  reads every fix, including evidence or screenshot changes. Commit fixes separately
  with scoped Conventional Commits and a body, explicit paths, never git add -A, no
  coauthor trailer and no word "phase" in messages. npm run ci:changed after last commit.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance row has concrete passing evidence.
- [ ] All findings were resolved, and a fresh reviewer verified the entire fix round.
- [ ] Shared gate and mandatory scoped runtime/visual proof passed with exact outcomes.

STEP 6 - DOC UPDATES + MEMORY:
- Record progress.md 07b QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07c-arrival-eligibility.md

STOPPING RULES:
- FAIL names phase-07b-account-lifecycle.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
