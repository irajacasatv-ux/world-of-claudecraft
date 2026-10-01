# Phase 07a QA: audit transactional mutations and global claim fencing

Audits [phase-07a-transactional-mutation-boundary.md](phase-07a-transactional-mutation-boundary.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 07a QA of the Freeholds and Guildhalls feature: transactional mutations and global claim fencing.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, apply ALL findings including nits,
and have a second fresh reviewer verify the fix round before recording a verdict.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the the
  newest release/**; release-merge-audit after non-empty merge and frozen install if
  patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-07a-transactional-mutation-boundary.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Draw the actual queue/admission/client and table-lock order for ordinary and compound
    saves, including parent FK/trigger effects. Verify pre-lock+nonce fencing, preserve
    legacy bank-ledger-before-guild-bank order and prohibit legacy acquisition after the
    housing suffix. Test opposing operations, not a string-only SQL assertion.
  - Race two realm claims, expire/reclaim, then send a delayed old mutation. Assert one
    authority, no state change on stale fence and bounded retries/cancellation. Hold a
    claim with a live session and no plot mutation for longer than LEASE_TTL_SECONDS
    under real PG: assert the second process is refused busy and the generation is
    unchanged; stop renewFreeholdClaims and assert reclaim advances the generation and
    fences the first process's late write.
  - Fault every transaction boundary: character debit before plot write, plot write
    before receipt, duplicate receipt, COMMIT failure and the distinct ambiguous COMMIT
    (destroy the client after COMMIT is sent, the
    tests/server/character_delete_verify.pg.test.ts shape): landed proves no second
    apply, not-landed exactly one later apply, and the verify read is the locked form
    named in 07a, never a plain SELECT (AS BUILT, a ruling: the wait is `FOR SHARE`, not
    `FOR KEY SHARE`, which a non-key UPDATE does not block; see the manifest's P9 and
    the pg suite's case proving the KEY SHARE form does not wait). Reload from PG and prove each
    exact copy is in exactly one legitimate custody location, never zero or two.
  - Recover intent after restart/service ambiguity with the same operation ID; replay
    after live-cache compaction refuses. No DB client spans external IO. Applied compact
    receipts are durable authority and retained/compacted only under accepted horizon.
  - Verify ACK/public descriptor follows commit and cancellation does not clear dirty
    work. Inspect real maximum payload, query/index plans, queue/pool metrics, exports,
    the D88 per-row-class deletion outcomes (delete an accounts row owning an applied
    tombstone and an open intent and assert each declared outcome; delete a character
    or account while an intent is open and assert the CharacterFreeholdOperationOpen
    refusal with the literal character.freehold_operation_open code and status on the
    character DELETE arm and on the account-side 55006 consumer, then exactly one
    custody location), lease takeover during an open
    operation, and the receipts growth gauge on freehold_operation_receipts; no
    whole-table boot scan.
  - Interleave a housing mutation with a dirty character autosave, a storage purchase
    start and apply, and a guild-bank replay, each carrying a pending legacy side effect;
    assert every half commits or none and the legacy participants' relative order is
    unchanged. With the arms above, every one of the service contract's seven PG-proof
    rows (autosave, storage start/apply, guild replay, deletion, lease takeover, pending
    legacy side effects, ambiguous COMMIT) has a named arm in this inventory.
- Required domain COVERAGE review: database-performance-reviewer, migration-safety, privacy-security-review, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

<!-- core-d9-authority:start -->
D9 AND DEVELOPER AUTHORITY BOUNDARY:
- Preserve literal game-server ignorance of distribution as well as Sim neutrality.
  The future economy service owns eligibility verification and opaque authorization
  bound to account, purpose/SKU, policy, quote and operation. Its signed issuer/verifier
  conformance artifact gates new spend; no complete trusted issuer is shipped today.
  A first-party web checkout session alone does not prove the physical distribution.
- The game consumes a verified ordinary effect through the narrow host boundary and
  correlates it to the durable operation. Client channel labels, Origin, UA, arbitrary
  JSON, linked Steam/Epic accounts or the game-service secret do not prove eligibility.
  Do not add a trusted distribution field to the game server to rescue an unverified
  purchase. Unknown eligibility refuses NEW spend; already accepted payments retain
  recovery under their original operation identity, with no DB client across service IO.
- The 05 local developer permission and fixture (D81) cannot satisfy service
  authorization, mint a paid receipt, cross into online authority or replace a durable
  transfer proof.
  Phase 15 extends these operation rows and consumes the signed service authorization
  contract; it does not fork receipt/recovery machinery or weaken D9.
<!-- core-d9-authority:end -->


ACCOUNT AUTHORITY COMPOSITION EXTENSIONS:
- 07b adds the account lifecycle head/history participant and captured observation CAS;
  07c adds normalized account+tier insert at accepted owner entry. Hydrate before queues,
  capture before queueing and preserve actual account/character/legacy/FK/unique/deferred
  ordering. Never fit these into a guessed universal suffix order. Their full manifests
  must include ordinary load/entry, periodic/leave/shutdown, export/delete/maintenance.
- 13/13a later add compatible calendar-head FOR SHARE revision+irrevocable-facts guard;
  its calendar-only writer takes FOR UPDATE and never account/plot/receipt locks. Known
  coverage with mutable historical dependencies cannot commit durable condition/credit
  effects. Missing history/finality holds the affected effect pending without losing state.
- Lifecycle/account and plot CAS are independent revision checks; lower revisions cannot
  overwrite newer accepted state. Concurrent readers, waiting writer, legacy saves,
  cross-realm alts, FK/unique waits, cancellation and late acquisition require real PG.
- Sale/transfer materializes condition under original protection/calendar at its boundary,
  retains immutable credits/source identity and applies buyer lifecycle prospectively.
  It neither copies seller grace/arrival marks nor clears either account history.

ACCOUNT HEARTH TRANSACTION PARTICIPANT:
Consume 07's account_freehold_hearth through
server/freehold_hearth_db.ts::advanceFreeholdHearthOnClient. Add its account PK/FK,
row lock and authoritative epoch read to the exact new-participant touch-set map;
preserve every existing legacy lock/effect order. Accepted remote-key entry and the
account ready_at_ms/revision update commit together or neither. Two alts/processes
racing different destinations share one account participant, so only one eligible
entry advances the cooldown. Refused, already-home and physical-gate attempts leave
it untouched. No cached plot/UI stamp authorizes, and transfer never rewrites it.
Publish its private mirror only after commit and reject older mirror revisions.
Real-PG cross-process races, injected failure between effects, stale cache, backward
clock and commit-before-ACK replay prove no bypass or double advancement. Character
save snapshots and lifecycle rollback cannot reintroduce a transferable cooldown.

STEP 3 - VALIDATION:
- npx tsc --noEmit; npx vitest run tests/server/freehold_mutation.test.ts
  tests/server/freehold_persist.test.ts tests/server/freehold_db.test.ts
  tests/freehold_state.test.ts tests/architecture.test.ts tests/monolith_budget.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts (the D88 guard's
  code and English row).
- npm run db:up; with TEST_DATABASE_URL set for the disposable development DB,
  npx vitest run tests/server/freehold_mutation.pg.test.ts
  tests/server/freehold_claim.pg.test.ts. The PG summary must show executed passing tests.
  Run every actual legacy character/bank/guild-bank/market/mail save suite named by the
  reviewer-owned touch-set census. Record transaction/query/lock wait counts and plans;
  race two admitted processes and prove both invariant and bounded cancellation behavior.
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
- Record progress.md 07a QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07b-account-lifecycle.md

STOPPING RULES:
- FAIL names phase-07a-transactional-mutation-boundary.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
