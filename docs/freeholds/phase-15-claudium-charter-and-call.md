# Phase 15: Claudium, the Freehold Charter and the Master Builder's Call

Wave A, the Cottage MVP. The spec is `progress.md` "15 Claudium: the Freehold Charter and
the Master Builder's Call"; the decisions are `brainstorm.md` D1 (the Charter is a
once-per-account grant the economy service records, mirrored into `account_freeholds`,
healed by the store-open reconcile, riding `POST /api/claudium/spend` with a game-side
SKU allowlist and a new spend kind `freehold`; the storage pending-row machinery is NOT
reused) and `state.md` D16 (the row with a rev compare-and-swap). This phase ships the
spend kind on the server, the two grants through the sim, the telemetry source, the flag
gating, and `docs/prd/woc/freehold-service-contract.md` (a durable PRD-side artifact,
never torn down with the packet) for the economy service (O1). It ships
NO client surface (Phase 16) and tests against a fake service.

### Starter Prompt
```
This is Phase 15 of the Freeholds and Guildhalls feature: Claudium, the Freehold Charter
and the Master Builder's Call (spend kind freehold, the Charter grant into the account
row, the repair grant, the telemetry source, flag gating, the service contract doc).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices behind existing seams).

Goal: let the economy service sell exactly two things for housing, the Freehold Charter
(once per account, tier cottage) and the Master Builder's Call (repeatable, repair to
full), through the existing Claudium spend route with a new kind, and land each grant in
the account row and the live sim exactly once, while the game forwards a price
fingerprint and computes no price, peg, burn, or split.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the bank-storage packet and PR #3670 (the
  storage purchase flow, the FOR KEY SHARE locked wait, the pg twin), the storage SKUs
  service half (PR #32), the woc marketplace dev deploy being MAINNET, Postgres gotchas,
  server/tests gotchas, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "15 Claudium: the Freehold
  Charter and the Master Builder's Call"), and this file
- server/claudium.ts (parseSpendKind, the kind === 'storage' branch in handleClaudiumApi,
  the /api/claudium/store filter line that uses isKnownStorageSkuId, the store-open
  reconcile that mirrors owned skins only after the service says owned,
  configureClaudiumRuntime and the ClaudiumGameHooks shape with grantWeaponSkins and
  storagePurchase, the "computes NO peg/price/balance" header), server/claudium_proxy.ts
  (the two hand-typed kind unions on ClaudiumStoreItem and ClaudiumSpendInput, the
  claudiumStore response filter, claudiumSpendDetailed, callServiceDetailed and
  neverReached), server/claudium_spend_wire.ts (parseClaudiumSpendWireResult)
- server/storage_purchases.ts (executeStoragePurchase: the locked order, the dry run
  before money moves, DEFINITIVE_REFUSAL_REASONS, the refusal vocabulary; read it to
  know what NOT to reuse), server/live_character_resolver.ts (resolveLiveCharacterFrom),
  server/main.ts (the configureClaudiumRuntime call and storagePurchaseHost closure; the
  legacy /api/claudium ladder that also calls handleClaudiumApi, the dual-edit rule)
- server/db.ts (grantAccountWeaponSkins and loadAccountCosmetics: the upsert idiom),
  server/freehold_db.ts as Phase 07 left it (FREEHOLD_SCHEMA, freeholdForAccount,
  upsertFreehold with the rev compare-and-swap, the pg twin), server/ws_auth.ts (the
  fresh-join account facts read where freeholdForAccount is called)
- src/sim/content/freehold/charters.ts (Phase 03: FREEHOLD_CHARTERS,
  isKnownFreeholdCharterId, no price, no copy), src/sim/content/storage_charters.ts (the
  twin), src/sim/bank.ts (bankGrantStorageSlots and StorageGrantResult: the dryRun
  contract and the appliedStorageKeys exactly-once argument), src/sim/freehold/state.ts
  and types.ts (the record: tier, condition stamp, the applied purchase keys field to
  add), src/sim/freehold/condition_core.ts (Phase 13: the repair-to-full arm)
- server/economy_telemetry.ts (COPPER_FLOW_SOURCES and SOURCE_BY_COMMAND),
  server/freehold_config.ts (freeholdsEnabled), server/http/error_codes.ts (append-only)
- tests/server/storage_gates.test.ts (the kind === 'storage' branch through both
  dispatch arms, the tampered owned:true row), tests/server/claudium.test.ts (store
  filtering, the mirror-only-after-authoritative-own rule, limiter order),
  tests/storage_charters.test.ts (the grant suite through sim.ctx),
  tests/server/helpers/ (fakeCtx, FakeRes, makeReq, FakeDb), tests/server/freehold_db.test.ts
  and its pg twin (Phase 07), tests/server/freehold_routes.test.ts (Phase 01)
- server/CLAUDE.md ("Hot paths", the dual-edit rule), server/http/CLAUDE.md
The agent returns: the exact edit list for a new spend kind (parseSpendKind, both proxy
unions, the store filter, the branch site); the runtime hook shape to add
(freeholdGrant beside grantWeaponSkins, and a live-apply hook beside storagePurchase);
the reconcile path that heals a lost Charter mirror; the rev CAS call shape; the
StorageGrantResult union to mirror; the telemetry rows to add; the fake-service harness
shape used by storage_gates.test.ts; the extraction that pays for any server/game.ts
line (none expected: the purchase path is REST, not WS).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except server/main.ts and the error-code snapshot, which the coordinator
edits last):
- Agent SERVER: parseSpendKind admits 'freehold'; both claudium_proxy.ts unions and the
  store filter gain the kind with isKnownFreeholdCharterId and the Master Builder's Call
  id (`freehold_master_builders_call`, a content constant in charters.ts, never a price);
  the kind === 'freehold' branch in handleClaudiumApi beside the storage branch: unknown
  SKU refused as unknown_item, the expectedCostClaudium fingerprint forwarded verbatim,
  the flag dark refuses with a typed body and the store filter drops both SKUs while
  dark, the missing runtime hook fails closed as unavailable; the store-open reconcile
  mirrors an owned Charter into the account row through the new freeholdGrant hook (the
  grantWeaponSkins twin, ONLY after the service reports owned); the live-apply host
  closure in a new server/freehold_purchases.ts (the storagePurchaseHost shape, small:
  resolve the live owner session through resolveLiveCharacterFrom, dry-run the sim
  grant, spend, apply on a definitive grant, persist through upsertFreehold, refuse
  no_live_character for the Call, never a pending row); COPPER_FLOW_SOURCES gains
  'freehold' with SOURCE_BY_COMMAND rows for every housing command that can move copper;
  tests/server/freehold_gates.test.ts (both dispatch arms identical, unknown SKU
  refused, price drift refused by the fake service, replay of the same idempotency key
  grants once, flag dark refuses and hides the SKUs, the tampered owned:true store row
  never reaches the mirror).
- Agent SIM: src/sim/freehold/grant.ts with freeholdGrantCharter(ctx, ownerKey,
  charterId, purchaseKey, { dryRun }) (tier inn_room to cottage in place, trophies and
  layout carried over per D2, refuses already_granted on a second Charter and
  unknown_sku on a foreign id) and freeholdGrantRepair(ctx, ownerKey, purchaseKey,
  { dryRun }) (condition to 100 through condition_core, stamp reset), both returning a
  StorageGrantResult-shaped union, the purchase key stored in the record's
  appliedPurchaseKeys (the appliedStorageKeys exactly-once argument), reachable only
  through ctx (never on COMMAND_NAMES, never on IWorld), pinned; the normalizeFreehold
  arm for the new field (bounded, deduped, never destroys); the sim grant suite driven
  through sim.ctx (the tests/storage_charters.test.ts model: dry run mutates nothing,
  apply once, replay refused, determinism, zero Rng).
- Agent DOCS+DB: docs/prd/woc/freehold-service-contract.md (a durable PRD-side artifact,
  never torn down with the packet; the handoff to the economy service,
  O1: the two SKU ids under spend kind freehold, that the Charter is once-per-account
  and the service records owned, that the Call is repeatable with no owned row, the
  fingerprint rule (the game forwards expectedCostClaudium and the service refuses
  price_changed), the settlement policy line as ruling 3 states it (fiat and SOL
  proceeds convert to $WOC and a published share burns; counsel and the service gate the
  mechanism; the working burn share is 25 percent per ruling 8), the illustrative $20
  Cottage price as a working number the service owns, and the kind_mismatch obligation
  on the service side); the freehold_db.ts arms the grants need (tier upsert with rev
  CAS, the applied keys column or JSONB field, an index only if a predicate needs one)
  with the fake-pool and pg-armed twin cases; the .env.example row unchanged (the flag
  exists since Phase 01).
The coordinator edits last: server/main.ts (the configureClaudiumRuntime call gains the
two hooks; the legacy ladder stays a call, never inline logic), the error-code snapshot
in tests/server/http/error_codes.test.ts if a code was appended, and
tests/server/main_retention_wiring.test.ts if a table changed. Every agent writes any
report longer than a screen to a file and replies with the path plus a short summary.
Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (this phase ships
  dark and states it in freehold-service-contract.md); (2) the fail-closed flag defaulting off:
  freeholdsEnabled refuses the branch and hides both SKUs from the store while dark,
  pinned; (3) the per-distribution surface map (Phase 14) stays the client gate and the
  server treats a spend identically from every build.
- The economy service owns prices and token math: the game forwards expectedCostClaudium
  as a fingerprint and never computes a peg, a burn, a split, or a price; no price
  literal in src/sim/content/freehold/charters.ts (a negative property pin).
- Exactly-once: the purchase key is stored in the same record the entitlement lives in;
  a replay grants once; the rev compare-and-swap refuses a stale write, never merges.
- Server authority and the storage-slot pattern: a purchased effect arrives as a
  server-applied grant after the service confirms; the grant functions are never on
  COMMAND_NAMES or IWorld.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game content
  and is not firewall vocabulary; the on-chain words live in
  docs/prd/woc/freehold-service-contract.md and server/ only.
- Persistence gate: additive idempotent DDL only, JSONB back-compat for older rows, an
  exportAccountData row already present (Phase 07), keep-forever stated.
- i18n: the policy in docs/freeholds/implementation-plan.md; refusal reasons are stable
  tokens the client localizes (the storage vocabulary), any new apiError leaf English
  only through the scaffold.
- Hot paths: no per-request DB read outside the existing spend route, no new unbounded
  table, no per-tick work.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any client purchase surface, store row, button, or toast (Phase 16).
- The storage pending-row, recovery coordinator, ladder hold, or applied-effect queue
  machinery (D1 says do not reuse it).
- Gold-priced housing anything (land is money-only, ruling 5).
- The Lodge upgrade SKU (Phase 21), the second freehold SKU (Phase 42), any deed mint
  (Wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_gates.test.ts`;
  `npx vitest run tests/freehold_grant.test.ts` (the sim grant suite); `npx vitest run
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/server/storage_purchases.test.ts tests/storage_charters.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_routes.test.ts
  tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts
  tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts
  tests/localization_fixes.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/freehold_content.test.ts`; then the pg-armed twin
  with `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook` after
  `npm run db:up`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  privacy-security-review (the spend branch, the fingerprint, the reconcile trust
  boundary, the flag), migration-safety (the record field and any DDL), and
  database-performance-reviewer (the upsert, the CAS, any index). Prompt each for
  COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): grant the Freehold Charter and the Master Builder's Call exactly once
- feat(server): add the freehold Claudium spend kind behind the flag
- feat(server): mirror the Charter into the account row and book freehold telemetry
- docs(prd): write the freehold service contract for the two housing SKUs
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A Charter spend through the fake service lands tier cottage in account_freeholds
  and in the live record when the owner is online, once; a replayed key grants once; a
  second Charter refuses already_granted; the store-open reconcile heals a deleted
  mirror ONLY after the service reports owned (the tampered row case).
- [ ] A Master Builder's Call spend repairs to 100 through the sim after a definitive
  grant, refuses no_live_character when the owner is offline, stores the key, and a
  replay repairs nothing twice.
- [ ] Unknown SKU, price drift (the fake service answers price_changed), and the dark
  flag refuse through BOTH dispatch arms identically; the store filter hides both SKUs
  while dark.
- [ ] tests/server/claudium.test.ts and tests/server/storage_gates.test.ts pass
  UNCHANGED; the pg-armed twin passes.
- [ ] docs/prd/woc/freehold-service-contract.md exists with the two SKUs, the kind, the
  fingerprint rule, the settlement policy line, and is marked as the O1 handoff.
- [ ] No price literal in src/sim/content/freehold/; no on-chain word (the state.md
  firewall scope) in src/sim/ (tests/architecture.test.ts); the grant functions are absent from COMMAND_NAMES and
  IWORLD_MEMBERS (pinned).
- [ ] All STEP 3 suites green; the three reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 15, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 15: the spend kind, the two SKU ids,
  the hook names, the telemetry source, the record field, any code; O1 marked "contract
  written, service rows pending").
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-15-qa.md

STOPPING RULES:
- Stop and ask if exactly-once cannot be guaranteed without the storage pending-row
  machinery (D1 forbids reusing it; a new durable receipt table is a maintainer call).
- Stop if any path would compute a price, peg, burn, or split in the game.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
