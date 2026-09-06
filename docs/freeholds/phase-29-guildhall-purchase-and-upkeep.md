# Phase 29: Guildhall purchase and upkeep

Wave C, Guildhalls. The spec is `progress.md` "29 Guildhall purchase and upkeep" (coarser
than wave A: settle unknowns in STEP 1 and record them in `state.md` before
implementing); the decisions are `state.md` and `brainstorm.md` (D1: the Charter rides the
spend route; ruling 3: the service settles). This phase ships the pooled Claudium purchase
(roughly 3x the freehold figure, service-priced) from the Hall Fund with officer approval,
2x decay for a Guildhall, the Steward's Ledger paid from the Hall Fund, member donations
(materials, gold, Claudium) with a weekly per-member cap, and a contribution log with
retention. It is a money phase (the three gates apply) and a persistence phase.

### Starter Prompt
```
This is Phase 29 of the Freeholds and Guildhalls feature: Guildhall purchase and upkeep
(the pooled Claudium purchase with officer approval, 2x decay, the ledger paid from the
Hall Fund, member donations with a weekly cap, the contribution log with retention).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over the Phase 13, 15, and 28 seams).

Goal: let a guild buy its Meeting Hall from the pooled Hall Fund exactly once, keep it
up through a ledger the fund pays with materials any member may donate under a weekly
cap, and keep an auditable, retained contribution log, with the economy service owning
every price.

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
- If state.md "Push policy" records a stacked wave C branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the storage-charter exactly-once model, the
  Postgres cluster of the gotcha catalog (retention, growth budgets), the server and
  tests cluster, test-pin traps, the monolith ratchet.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the Phase 28 decisions), docs/freeholds/progress.md (only
  "29 Guildhall purchase and upkeep"), docs/prd/woc/freehold-service-contract.md, this file
- src/sim/freehold/ (hall_fund.ts, permissions.ts, ledger_core.ts, ledger.ts,
  condition_core.ts, grant.ts, state.ts, CLAUDE.md), src/sim/content/freehold/charters.ts,
  tiers.ts (the 2x decay flag), ledger_schedule.ts, src/sim/professions/reagent_sources.ts
  (planReagentSourceDraw: the one planner), src/sim/professions/farm_watch_fee.ts (the
  published-order model), src/sim/item_copy_ref.ts
- server/claudium.ts (the kind === 'freehold' branch, the store filter),
  server/claudium_proxy.ts, server/storage_purchases.ts (the exactly-once and
  DEFINITIVE_REFUSAL_REASONS shapes), server/freehold_wire.ts, server/freehold_db.ts,
  server/retention_sweep.ts (createRetentionSweep, the tables array in server/main.ts),
  server/play_session_retention_db.ts (the prune primitive exemplar),
  server/bank_ledger_growth_budget.ts (the bounded per-account append log),
  server/economy_telemetry.ts, server/db.ts (exportAccountData), .env.example
- server/raid_reset.ts (nextWeeklyRaidResetMs, WEEKLY_RESET_WEEKDAY) and
  server/sim_calendar_feed.ts (resetDay: the week boundary the cap resets on)
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts, src/net/freehold_snapshot_wire.ts, src/ui/hud/housing/
  steward_panel_view.ts, the WOC Store window module tests/woc_store_window_contract.test.ts
  pins, src/ui/charter_card_view.ts, src/game/distribution_surfaces.ts
- tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/freehold_ledger.test.ts,
  tests/freehold_condition.test.ts, tests/freehold_hall_fund.test.ts,
  tests/provisioner_firewall.test.ts, tests/monolith_budget.test.ts
The agent returns, and the session records in state.md BEFORE implementing: how the
pooled purchase settles at the economy service (a Claudium donation is an individual
spend the service records per member and the game credits to the fund; the purchase
then redeems fund credit against the service-priced SKU, or the service exposes a pooled
balance: an O1 contract item; build against the Phase 15 fake-service harness either
way and never compute a price); the officer-approval shape (the spend route checks the
session's rank; the store surface shows the row to officers only); the contributions
table shape (`guild_hall_contributions`: guild id, account id, kind, item id, amount,
created_at; an index on guild id and created_at; a retention window env key with a
positive default; the prune primitive) and its export row; the weekly cap as a multiple
of one ledger (the state.md rule, TUNING) keyed on the realm week; the extraction
candidates for every coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts,
docs/prd/woc/freehold-service-contract.md, the parity goldens):
- Agent SIM: condition_core.ts takes the decay rate from the tier (2 per realm day for a
  Guildhall, 1 for a freehold; the pause and grace rules unchanged); ledger.ts pays a
  Guildhall's ledger from the Hall Fund's material slots through the one planner (the
  fund as the carried pool, no vault), officer rank required; hall_fund.ts gains the
  `hall_fund_donate` command (materials from bags through the item_copy_ref tri-state,
  gold from meta.copper; a Claudium credit only ever arrives as a server grant), the
  weekly per-member cap keyed on the realm week (settled in STEP 1 as a multiple of one
  ledger, the state.md rule) with a text-free `donation_capped` refusal appended to
  freeholdDeniedLineKey in src/ui/hud/housing/housing_view.ts (D26), a bounded in-record
  contribution ledger; text-free freeholdGranted and
  freeholdDenied reasons; tests/freehold_hall_fund.test.ts, tests/freehold_ledger.test.ts,
  and tests/freehold_condition.test.ts extended.
- Agent SERVER-MONEY: the `guildhall_charter_meeting_hall` SKU in charters.ts (no price,
  no copy) and the `hall_fund_donation_claudium` SKU (repeatable) under spend kind
  freehold; grant.ts gains `freeholdGrantGuildhall(ctx, guildKey, skuId, purchaseKey,
  { dryRun })` (exactly-once through the purchase key on the guild record) and
  `hallFundGrantClaudium(ctx, guildKey, amount, purchaseKey)`; the spend branch checks
  the session's rank for the purchase, dry-runs before the spend, applies after a
  definitive result, refuses while dark and drops both SKUs from the store filter; a
  `freehold` telemetry source row for the new commands; tests/server/freehold_gates.test.ts
  extended (both dispatch arms).
- Agent SERVER-DB: `guild_hall_contributions` in server/freehold_db.ts (additive DDL,
  the index, a prune primitive `pruneHallFundContributionsBatch` in the owning module)
  registered in the retention tables array in server/main.ts after listen, the env key
  in .env.example, the exportAccountData row for a donor's own entries, the write inside
  the donation path; tests/server/freehold_db.test.ts and
  tests/server/main_retention_wiring.test.ts extended, the pg-armed twin.
- Agent UI: the Guildhall row in the WOC Store window for officers only where
  freeholdPurchaseEnabled, the Steward panel for a Guildhall (fund have and need, pay
  from the fund, the donation form with the cap readout, the contribution ledger),
  hudChrome.housing.hall.* keys, the mobile sheet decision, screenshots.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (OPEN); (2) the
  fail-closed flag defaulting off refuses both SKUs at the spend branch and hides them
  in the store filter, pinned; (3) the per-distribution surface map pinned by tests keeps
  the purchase and donation surfaces off every native, Steam, and Epic build. The
  economy service owns prices and token math: the game forwards expectedCostClaudium as
  a fingerprint and never computes a peg, a burn, a split, or the 3x.
- Exactly-once: the purchase key on the guild record; a replay grants once; a second
  purchase refuses; a donation credit is applied once per purchase key.
- Server authority: rank from the session stamp; the cap and the week from the realm
  calendar; nothing trusted from the payload.
- Persistence: additive idempotent DDL, an index for the prune predicate, a retention
  registration for the growing table, an export row, fake pool plus pg-armed twin.
- Determinism: no Rng; the week is ctx.resetDay; no wall clock in src/sim/.
- Never a Perfecting keystone, gear intermediate, or catalyst in the Guildhall ledger
  (the same schedule table, swept); never destroy: condition 0 still opens the hall.
- Store policy: no "earn" language; no timed loss; nothing repossessed.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack.
- Working numbers (roughly 3x, the weekly cap, the retention window) are state.md
  values; the economy service and Fernando own the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Hall amenities and boards (Phase 30); guild deeds (Phase 31); Great Hall, Bastion, and
  build projects (Phase 32); any gold rail for the purchase.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_hall_fund.test.ts tests/freehold_ledger.test.ts
  tests/freehold_condition.test.ts tests/freehold_guildhall.test.ts
  tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/provisioner_firewall.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/server/freehold_gates.test.ts tests/server/freehold_db.test.ts
  tests/server/freehold_wire.test.ts tests/server/main_retention_wiring.test.ts
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/woc_store_window_contract.test.ts tests/distribution_surfaces.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts`; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; the pg-armed twin
  after `npm run db:up`; screenshots for the store row and the Guildhall Steward panel.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  privacy-security-review (the spend branch, rank checks, the log), database-performance-reviewer
  (the contributions table, the prune, the index), plus migration-safety (DDL) and
  server-hot-path-reviewer (the growing table and the donation path) because the diff
  touches those surfaces. Prompt each for COVERAGE not filtering; each writes its report
  to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add Hall Fund donations with the weekly cap and the Guildhall ledger draw
- feat(server): grant the Guildhall through the pooled Hall Fund spend
- feat(server): log Hall Fund contributions with retention
- feat(ui): show the Guildhall row and the fund ledger to officers
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/server/freehold_gates.test.ts proves on both dispatch arms: a member is
  refused the purchase, an officer's purchase grants once, a replayed key grants once, a
  second purchase refuses, price drift refuses, the flag dark refuses and hides the SKUs.
- [ ] tests/freehold_hall_fund.test.ts proves the cap per member per realm week by fresh
  literals, the rollover across resetDay, material and gold donations, a Claudium credit
  only through the grant, and the Guildhall ledger paid from the fund by an officer and
  refused for a member; tests/freehold_condition.test.ts pins 2 per day for a Guildhall.
- [ ] tests/server/main_retention_wiring.test.ts registers the prune exactly once after
  listen with the window from config; tests/server/freehold_db.test.ts pins the DDL and
  the prune primitive (fake pool and pg twin); the export row is in.
- [ ] docs/prd/woc/freehold-service-contract.md carries the two SKUs and the settlement question (O1).
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise; state.md records the STEP 1 decisions.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 29, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 29: commands, SKUs, the table, the
  env key, i18n keys; the settlement and cap decisions as locked).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-29-qa.md

STOPPING RULES:
- Stop and ask if the pooled purchase cannot settle without the game computing a price,
  a burn, or a split (that math belongs to the economy service; record it under O1).
- Stop if the contribution log cannot be bounded and retained (a growing table without
  a retention story is a defect).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
