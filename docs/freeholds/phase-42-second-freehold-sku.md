# Phase 42: the second freehold SKU

Wave E, depth. The spec is `progress.md` "42 Second freehold SKU"; the decisions are
`state.md` and `brainstorm.md` (D1 the Charter purchase shape, D5 account state, D9 the
surface map, D16 the owner-keyed map). This is a money phase: it ships a second freehold
per account keyed `account:<id>:2`, bought as a second Charter SKU the economy service
prices, with a progressive upkeep schedule (the ArcheAge lesson: the second plot's ledger
costs more, published, never a timed loss).

### Starter Prompt
```
This is Phase 42 of the Freeholds and Guildhalls feature: the second freehold SKU (a
second plot per account keyed account:<id>:2, its Charter SKU, and the progressive
upkeep schedule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: let an account own a second freehold through the existing Charter grant path,
exactly once, with its own ward slot, ledger, condition, and visit policy, and a
published progressive upkeep multiplier, without a second implementation of anything the
first plot already has.

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
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on the storage-charter purchase flow, exactly-once
  grants, migration safety and guarded constraint changes, world_api parity pins, the
  distribution matrix, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "42 Second freehold SKU"),
  and this file
- src/sim/content/freehold/charters.ts (FREEHOLD_CHARTERS, isKnownFreeholdCharterId),
  ledger_schedule.ts and src/sim/freehold/ledger_core.ts (the bill planner), condition_core.ts,
  state.ts (ctx.freeholds keyed by owner key; loadFreehold, serializeFreehold,
  evictFreehold), grant.ts (the Phase 15 Charter grant with its purchase key),
  instance.ts (the owner key at claim), visiting.ts, wards.ts (the plot assignment), the
  Hearth Key module from Phase 06
- src/world_api/housing.ts (myFreehold and every member that assumes one plot),
  src/net/online.ts (the fhold mirror), src/net/freehold_snapshot_wire.ts,
  server/freehold_wire.ts (emitFreeholdSelfKeys), server/freehold_db.ts (account_freeholds
  keyed by account_id; the rev CAS upsert), server/db.ts (exportAccountData),
  server/claudium.ts (the freehold spend arm and the store filter), server/ws_auth.ts
  (freeholdForAccount at fresh join)
- src/game/distribution_surfaces.ts, src/ui/hud/housing/ (the steward panel and the
  store surfaces from Phase 16), tests/freehold_grant.test.ts, tests/freehold_ledger.test.ts,
  tests/server/freehold_db.test.ts, tests/world_api_parity.test.ts
The agent returns: every place that assumes one plot per account (facet, mirror, self
key, the join read, the ward assignment, the Hearth Key, the steward panel); the key
change the table needs (a plot_index column with the primary key widened through the
guarded DO block idiom, never a bare DROP, versus a sibling table); the grant path and
how a distinct purchase key makes the second SKU exactly-once; the extraction
candidates. Settle in STEP 1 and record in state.md before implementing: the facet
shape (the packet default: myFreeholds as an array with the primary first and
myFreehold kept as the primary alias so no existing consumer changes), the persisted
key shape, the upkeep multiplier for the second plot (working: 1.5x stacks, TUNING,
Fernando owns the finals), and the Hearth Key destination rule (the packet default:
the primary, with a choice in the steward panel).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: the second owner key account:<id>:2 through the existing map (no second
  map), the plotIndex on the record, the ledger multiplier applied in ledger_core.ts
  from a content table row (never a literal in logic), independent condition, prepay,
  and visit policy per plot, the second Charter SKU freehold_charter_second in
  charters.ts (no price, no copy; granted only when the first is owned, a dry-run
  refusal otherwise), the facet change per the settled shape with Sim delegates, the
  Hearth Key destination rule, tests/freehold_second_plot.test.ts (exactly-once,
  independent ledgers, the multiplier by literal, same-seed twin run).
- Agent SERVER+NET: the key change in server/freehold_db.ts (additive, idempotent, the
  guarded constraint idiom; the rev CAS per row), the join read returning both rows, the
  self key carrying both plots (the strict decode extended; ALL_DELTA_KEYS untouched if
  the key's shape widens in place, else the new key pinned), the spend arm accepting the
  second SKU with a distinct purchase key and the store filter showing it only when the
  first Charter is owned, the exportAccountData rows, tests/server/ plus the pg twin.
- Agent UI: the steward panel switching between plots, the store surface for the second
  SKU on the distributions the Phase 14 matrix allows and nowhere else (the matrix
  extended by one row per distribution for the second SKU), the mobile sheet decision,
  hudChrome.housing.* keys, pr_shot_targets entries.
The coordinator edits last: tests/world_api_parity.test.ts (five edits),
tests/snapshots.test.ts, tests/distribution_surfaces.test.ts, tests/monolith_budget.test.ts,
parity goldens in their own commit. Every agent writes any report longer than a screen
to a file and replies with the path plus a short summary. Never `mode: "plan"` on
teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before enable, including the store copy
  for the second SKU; (2) FREEHOLDS_ENABLED default off, refusing the grant while dark,
  pinned; (3) the per-distribution surface map pinned with the second SKU row (no
  purchase surface on App Store, Google Play, Steam, or Epic). The economy service owns
  prices and token math; the game forwards expectedCostClaudium as a fingerprint.
- Exactly-once: a replayed purchase key grants nothing twice; the second SKU without the
  first is refused before any spend.
- Never sell power: the second plot adds decor space only; nothing repossessed, nothing
  destroyed, no timed loss (the multiplier raises the bill, never a penalty).
- Determinism; server authority; the token firewall; persistence gates (additive DDL,
  the guarded constraint idiom, export rows, cascade); the i18n policy in
  docs/freeholds/implementation-plan.md; vocabulary fixed; "phase" in no code, comment,
  commit, or PR text; monolith ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- A third plot or any plot count above two; a second Guildhall; Carpenter and Mason
  (Phase 43); any price or multiplier final (Fernando and the service own them).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_second_plot.test.ts
  tests/freehold_grant.test.ts tests/freehold_ledger.test.ts tests/freehold_condition.test.ts
  tests/freehold_wards.test.ts tests/freehold_determinism.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/freehold_command_chain_online.test.ts tests/distribution_surfaces.test.ts
  tests/freehold_store_gates.test.ts tests/client_shell.test.ts tests/server/freehold_db.test.ts
  tests/server/storage_gates.test.ts tests/server/http/surface_inventory.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts` plus the
  tests/server/ suites added and the pg-armed twin with TEST_DATABASE_URL set; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`;
  parity goldens if regenerated.
- Spawn review agents per docs/freeholds/implementation-plan.md: privacy-security-review,
  architecture-reviewer, plus migration-safety (the key change), cross-platform-sync
  (facet and wire), and frontend-seam-reviewer (src/ui/). Prompt each for COVERAGE not
  filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): support a second freehold per account with a progressive ledger multiplier
- feat(server): persist two plots per account and grant the second Charter exactly once
- feat(ui): switch the steward panel between plots and gate the second SKU by distribution
- test(sim): pin the second Charter rail, independent ledgers, and the multiplier
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The second Charter grants exactly once (a replayed key and a third attempt grant
  nothing), refuses without the first, and refuses while FREEHOLDS_ENABLED is dark
  (pinned per case).
- [ ] The second plot has its own ward slot, ledger, condition, prepay, and visit
  policy; its bill is the first plot's times the pinned multiplier; a same-seed twin run
  agrees; nothing on the first plot changes.
- [ ] The key change is additive and idempotent, applies twice cleanly (pg twin), and
  every existing row loads as plot 1; the export includes both rows; delete cascades.
- [ ] The surface matrix carries the second SKU row per distribution; no purchase
  surface on App Store, Google Play, Steam, or Epic; the panel switches plots on desktop
  and as a mobile sheet; screenshots committed.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 42, notes, deferrals) and
  docs/freeholds/state.md (ledger row 42: facet members, wire keys, the SKU, columns,
  i18n keys; the facet, key, multiplier, and Hearth Key decisions; the OPEN counsel gate
  extended to the second SKU's store copy).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-42-qa.md

STOPPING RULES:
- Stop and ask if widening the primary key needs anything but the guarded DO block
  idiom (a destructive DDL step is a maintainer decision).
- Stop if any consumer of myFreehold would have to change behavior for a one-plot
  account; the alias must keep them byte-identical.
- Do not push the branch; never merge a PR.
```
