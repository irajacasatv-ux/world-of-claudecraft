# Phase 07 QA: audit bounded persistence and stable plot identity

Audits [phase-07-persistence.md](phase-07-persistence.md). The implementation's exact five-or-fewer deliverables,
state.md decisions and ux-spec.md are the acceptance contract.

### Starter Prompt
```
This is Phase 07 QA of the Freeholds and Guildhalls feature: bounded persistence and stable plot identity.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block and its effort/fan-out rules.

Goal: verify every promised behavior and artifact, apply ALL findings including nits,
and have a second fresh reviewer verify the fix round before recording a verdict.

STEP 0 - PRE-FLIGHT:
- Work in /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds on
  feature/freeholds. Verify git status is clean; otherwise ask the user.
- Follow state.md "Worktree, base, and merge-forward": fetch origin --prune; merge the
  current feature/masterwrought while PR #3872 is open, otherwise newest release/**;
  release-merge-audit after non-empty merge and frozen install if patches/ moved.
- Read root/directory CLAUDE.md. Memory scan: MEMORY.md, freeholds entry, test-pin traps,
  apply ALL findings, review the review-fix round. Preserve unrelated work.

STEP 1 - LOAD CONTEXT (agents only for planning docs and coordinators):
- An Explore agent reads phase-07-persistence.md, state.md, ux-spec.md, the content/art manifests,
  matching progress row and all actual implementation commits including the complete
  diff, tests and artifacts. It reports to a scratch file: promise/evidence matrix,
  new symbols and real consumers, mutation/authority paths, literal pins and missing arms.

STEP 2 - AUDIT:
- Spawn independent CORRECTNESS, TEST COVERAGE, and DEAD CODE/HYGIENE readers. Every
  report goes to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT and no
  filtering of nits or uncertain issues. Apply this exact coverage inventory:
  - Independently inspect schema-version and identity migration from an absent row,
    legacy row, future-schema row and malformed/oversized owned layout. No destructive
    normalization, default replacement or silent item/trophy loss is allowed.
  - Test actual query/index plans, maximum legal bytes, reverse FK behavior, per-account
    bounded loading and no speculative ledger-week index. No test is only a DDL string.
  - Inspect the per-row-class ON DELETE outcomes (D88): plot and Hearth rows cascade with
    the account, an open housing operation refuses the deletion with 07a's
    CharacterFreeholdOperationOpen class and character.freehold_operation_open code,
    and 07a's tombstones keep their nonidentifying identity. Day-keyed columns carry the
    resetDay vocabulary from the binding-resolved reset zone, never the serving process
    constant, with epoch-ms companions display-only (D84).
  - Delay/cancel DB writes while producing edits; verify one running+one pending dirty
    generation, latest state survives, no queue waits hold clients, and all lifecycle
    paths reuse the same writer/admission. A stale durable CAS never drops an acked effect.
  - Verify 07b account lifecycle delegation, no plot-local presence/grace writer, last-owner leave
    while a claim is referenced, pending write failure and shutdown flush. Ordinary FIFO
    is not enough; exercise coalescing. Prove offline/headless no-storage and dev gates.
  - Re-verify the injected bankBonusForAccount binding on the merged tree at phase start
    (the release closure widens its return to include characterCount) and cite that
    tree, not the planning one-liner. Record all exported symbols/real consumers and
    the mandatory future 07a dependency explicitly.
- Required domain COVERAGE review: migration-safety, database-performance-reviewer,
  privacy-security-review, server-hot-path-reviewer, architecture-reviewer,
  cross-platform-sync, frontend-seam-reviewer (the src/game bootstrap and the
  src/main.ts firewall extraction), test-coverage-auditor, qa-checklist.
  Database performance runs before new DB decisions and on the finished diff. Parent
  runs deterministic gates once; reviewers inspect their evidence.

<!-- core-dev-bridge-qa:start -->
BRIDGE CORRECTNESS AND FIX-ROUND COVERAGE:
- Verify the separate permission is named freeholdDevGrantEnabled and defaults false.
  The server predicate uses existing diagnosticsReadAllowed on real socket and Host.
  Account first-tier marks are produced by 07c; 07b owns lifecycle history. Neither
  appears in plot serialization or is inferred from an unknown/future row. Verify 07
  creates no second default record or tier writer: 05's Inn Room record, setFreeholdTier
  and the D24 fixture are reused (D81) and only persisted.
- Reproduce the source gap first: ordinary offline DEV supplies general devCommands
  without ALLOW_DEV_COMMANDS. Verify the PRIOR 05 separate readonly nonpersisted housing
  permission (D81), its default false and live/fake SimContext pins, never a silent
  change to generic devCommands. Only both permissions allow the real chat route/sole
  tier setter; this phase adds only the persisted save behind that setter.
- Inspect the PRIOR 05 scripts/lib/freehold_dev_authorization.mjs and
  scripts/lib/freehold_dev_authorization.d.mts,
  src/game/freehold_dev_bootstrap.ts and src/sim/freehold/dev_grant.ts plus every actual
  Vite/bootstrap/Sim/context/server delegation. The endpoint is exact GET
  /__freehold/dev-authorization and configureServer-only apply:'serve'. Preserve
  defineConfig({ ... }) AST shape; reject preview/production exposure with flag 1.
- Exercise unset/0/other versus exact flag 1; real non-loopback socket with forged
  loopback Host/Origin; loopback socket with absent/malformed/external/wildcard Host;
  wrong method and unrelated path. Affirmative body has the one exact true boolean,
  JSON type and no-store. No arbitrary environment/account/purchase/receipt disclosure.
- Browser refuses before fetch when not DEV, not HTTP(S) or not a loopback document.
  Exercise absent/HTML/extra-field/malformed/redirect/refusal/failure/cancelled replies;
  all yield false and keep ordinary Inn startup. Late replies cannot authorize another
  entry. The server dev path retains the ordinary setter/save contract under its separate
  exact server flag; no volatile server-tier overlay or paid receipt is introduced.
  No credentials/cache/redirect, public VITE_* bridge, query/storage/UA/window
  override, user setting or made-up timeout is allowed.
- Run the real flag-off browser: Inn succeeds and /dev freehold cottage refuses. Run
  ALLOW_DEV_COMMANDS=1 npm run dev -- --host 127.0.0.1: begin in Inn and execute the real
  chat command, then read ordinary state to prove Cottage. Fixtures call assertLoopbackUrl
  first, never directly inject tier or a receipt. Developer offline state cannot become
  online persisted ownership; permission never reaches save/export/public wire.
- The PRIOR 05 tests/freehold_dev_authorization.test.ts,
  tests/freehold_dev_bootstrap.test.ts, tests/freehold_dev_grant.test.ts and
  tests/freehold_offline_default.test.ts (each extended here with its persistence arm),
  tests/vite_dev_watch.test.ts, tests/dockerignore_context.test.ts and SimContext pins
  must execute. Inspect the PRIOR 05 .dockerignore helper/declaration admission and the
  coordinator extraction/ceiling changes. Add frontend-seam-reviewer for the bootstrap
  and browser behavior; security must review the real socket/Host boundary.
<!-- core-dev-bridge-qa:end -->


CORE STORAGE CAPABILITY AND LIFECYCLE CONTRACT:
- NEW FUTURE docs/freeholds/persistence-rollout-contract.md is part of deliverable 4: name
  minimum capable release, pre-07 (old release), future and populated fixtures, source
  binding, export and soft-deactivate/restore/hard-delete behavior, rollout and rollback
  quiescence. The old release lacks housing behavior and replaces characters.state
  wholesale; normalized table preservation alone cannot establish mixed-release
  correctness. Do not enable housing on an incapable writer/exporter or promise it
  continues lifecycle semantics.
- Unknown future data remains unchanged/read-only. Account/tier writer CHECKs restrict
  new writes without filtering away unsupported stored identifiers. Add schema fragments
  under ensureSchema advisory serialization after FK parents and before final growth
  guard; preserve repeated-boot/additive compatibility and concurrent-index requirements.
- 07b is the sole account lifecycle/history authority; 07c is sole first-tier eligibility
  authority. 07a supplies both transaction composition. The browser-only dev bridge does
  not grant online account binding, import fixture state or mint receipts.

- Verify literal unbound_no_history 07 rows, future/malformed/oversized owned fixtures,
  original-row preservation with bounded diagnostic references, exports and
  soft-deactivation restore.
  Inspect rollout capability floor and actual wholesale legacy character-save behavior.

ACCOUNT HEARTH AUTHORITY (C01, within existing schema/lifecycle outputs):
07 owns NEW server/freehold_hearth_db.ts with FREEHOLD_HEARTH_SCHEMA,
loadFreeholdHearth and advanceFreeholdHearthOnClient. The one account_freehold_hearth
row uses account_id as PK/FK, ready_at_ms and a monotonic revision. Initial absent
legacy state is ready with revision zero; lazy first-use row initialization uses an
account-keyed conflict-safe insert inside the admitted transaction, never a GET write; unsupported future data is preserved under
07's read-only recovery contract. Read one authoritative database epoch timestamp after
locking the account participant; clock regression cannot make an unready key eligible,
and accepted updates never decrease ready_at_ms or revision. Offline/headless use
isolated injected host-clock state and the same state.md duration, never online SQL.

Only 07a's accepted remote Hearth entry may check and advance this participant in the
same transaction as accepted entry effects. The cached private
fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision are committed UI mirrors,
excluded from serializeFreehold, plot autosave and transfer manifests. A cached value
never authorizes. Refused, already-home and physical-gate entry do not advance it.
Transfer copies or clears neither account's cooldown; every alt and later destination
uses the same account row. Character deletion preserves it; account export, soft
deactivation, restoration and true account deletion each have explicit tested handling.

Use bounded indexed account lookup and admitted single-flight mirror loads, actual
PK/FK wait inventory, keep-forever account row ownership and capability-aware rollout.
NEW tests/server/freehold_hearth_db.test.ts and freehold_hearth_db.pg.test.ts prove
same-account cross-alt/process/destination races, absent/unsupported load, rollback,
clock regression, stale UI revision, commit-before-ACK and lifecycle/export behavior.
This 07 pair proves the schema, load, account helper and lifecycle primitives now;
07a owns the subsequent accepted-entry composition and complete entry races.
Real-PG tests execute with TEST_DATABASE_URL; query/byte/lock evidence and before/final
DB, persistence and security review are required. No extra receipt per routine entry
or plot-keyed cooldown store is introduced.

The existing constructor type is src/sim/types.ts::SimConfig, consumed by Sim;
SimContext owns the context permission field. Verify the housing-only permission's
configuration/context pins under those exact symbols and ordinary devCommands intact.

STEP 3 - VALIDATION:
- npx tsc --noEmit; npx vitest run tests/server/freehold_db.test.ts
  tests/server/freehold_hearth_db.test.ts
  tests/server/freehold_persist.test.ts tests/freehold_state.test.ts
  tests/freehold_offline_default.test.ts tests/freehold_dev_grant.test.ts
  tests/dev_commands.test.ts tests/professions_farming_state.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts
  tests/server/main_retention_wiring.test.ts.
- npm run db:up; with TEST_DATABASE_URL set to the disposable development database,
  npx vitest run tests/server/freehold_db.pg.test.ts
  tests/server/freehold_hearth_db.pg.test.ts. Use a private schema, assert
  tests ran, and clean it after. Record real plans for account/public plot/CAS queries,
  bounded row/byte/query counts, delayed-DB coalescing and cancellation evidence.
- Run every scoped command listed in the implementation file and node scripts/gate_select.mjs.
  A skipped PG suite is not a pass. Assert work happened, use literal expected outcomes,
  include controls that pass when a rejected precondition is removed, and never derive
  expected values from the production object under test.

<!-- core-dev-bridge-qa-validation:start -->
- Run npx vitest run tests/freehold_dev_authorization.test.ts
  tests/freehold_dev_bootstrap.test.ts tests/freehold_dev_grant.test.ts
  tests/freehold_offline_default.test.ts tests/vite_dev_watch.test.ts
  tests/dockerignore_context.test.ts tests/sim_context.test.ts, plus the actual flag-off,
  flag-on, preview and production browser/endpoint fixtures from the implementation.
  Record executed modes/outcomes; a static endpoint-name scan is not runtime proof.
<!-- core-dev-bridge-qa-validation:end -->

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
- Record progress.md 07 QA verdict PASS or FAIL, all found/fixed counts, commands,
  evidence and remaining external release gates. Update state ledger for changed facts.
- Preserve useful freeholds/test-pin memory within the authorized scope.

STEP 7 - FINAL RESPONSE FORMAT:
Return verdict, counts, files, commands/outcomes and reviewer verdicts, then the FULL PATH:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07a-transactional-mutation-boundary.md

STOPPING RULES:
- FAIL names phase-07-persistence.md as the next rerun with findings attached. Never waive a required
  check or silently invent a balance value. No push, opened PR or PR merge.
```
