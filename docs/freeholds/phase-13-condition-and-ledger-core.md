# Phase 13: condition and the Steward's Ledger core

Wave A, the Cottage MVP. The spec is `progress.md` "13 Condition and the Steward's Ledger
core"; the decisions are `state.md` D8 (nothing ticks), D10 (text-free events), D18 (the
vault arm) and the ledger rules in `brainstorm.md`. This phase ships the two pure cores
(condition and ledger), the `pay_ledger` command body on both hosts, four-week prepay, the
lockout at 30, the realm-week boundary, and the keystone exclusion sweep. The Steward panel
that shows all of this is Phase 16; the Master Builder's Call is Phase 15.

### Starter Prompt
```
This is Phase 13 of the Freeholds and Guildhalls feature: condition and the Steward's
Ledger core (condition_core.ts, ledger_core.ts, the pay_ledger command, prepay, lockout,
the week boundary, the keystone exclusion pin).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three independent slices over pure leaves).

Goal: make a Cottage wear one condition point per realm day with the away pause and the
return grace, lock its amenities below 30 without ever destroying anything, and let the
owner pay a seeded weekly Steward's Ledger of low-tier materials and produce from bags
then vault (up to four weeks ahead), all derived at read time from stamps and the realm
calendar, identically on every host, with no Rng draw and no per-tick work.

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
- Memory scan: MEMORY.md and entries on the provisioner firewall, "one planner per file",
  the farm watch fee, the monolith ratchet, ALL_DELTA_KEYS conflicts, parity goldens,
  test-pin traps (constant self-comparison, mutation harness must prove tests ran).

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "13 Condition and the
  Steward's Ledger core"), and this file
- src/sim/freehold/ as Phases 01 to 12 left it (types.ts, state.ts, instance.ts,
  layout_core.ts, placement.ts, amenities.ts, index.ts, CLAUDE.md), and the content
  tables src/sim/content/freehold/ledger_schedule.ts and tiers.ts (Phase 03)
- src/sim/sim_context.ts (the resetDay, utcDay and dailyResetRemainingSec primitives,
  lockoutNowMs, countItem, removeItem, reserveVaultConsumption), src/sim/CLAUDE.md
- server/sim_calendar_feed.ts (feedRealmCalendar and its SimCalendarSink shape),
  server/raid_reset.ts (resetDayKey, nextRaidResetMs, nextWeeklyRaidResetMs,
  WEEKLY_RESET_WEEKDAY), and how the OFFLINE client and the headless env feed resetDay
  today (grep resetDay in src/main.ts and headless/env_server.ts)
- src/sim/professions/farm_watch_fee.ts (planWatchFee, eligibleWatchFeeItemIds, the
  published consumption order, the TUNING banner), src/sim/professions/reagent_sources.ts
  (planReagentSourceDraw, countMinusPlanned, tallyPlannedTakes, the explicit gradeIds
  argument), src/sim/professions/material_grades.ts (materialGradeIds),
  src/sim/content/farm_crops.ts (produce ids and their fine_ twins),
  src/sim/professions/farming.ts (the plantCrop payment block: countUnlockedInSlots,
  removeUnlockedFromSlots, the lock-aware plan then the raw-count twin that splits
  'locked' from the shortfall reason), src/sim/professions/farm_persist.ts
  (deriveHiddenSlots: the FNV-1a stateless hash idiom), src/sim/vault_craft_gate.ts (the
  Phase 12 freehold arm)
- src/sim/types.ts (the SimEvent union: farmDenied and deedUnlocked as the text-free
  models; the freeholdDenied variant Phase 05 added and the freeholdGranted { kind }
  variant Phase 08 added), server/freehold_db.ts (Phase 07: the condition_stamp_day,
  ledger_paid_week, and last_seen_day columns; last_seen_day is written at join and
  leave and is the away-pause source)
- server/freehold_wire.ts and src/net/freehold_snapshot_wire.ts (the fhold key emitter
  and strict decoder as Phase 08 left them), server/heavy_self.ts, tests/snapshots.test.ts
  (ALL_DELTA_KEYS, TERSE_TO_IWORLD, the fhold round-trip arm)
- tests/provisioner_firewall.test.ts (PERFECTING_MATERIAL_IDS, GEAR_INTERMEDIATE_WORDS,
  the ledger-schedule arm Phase 03 added), tests/farm_watch_fee.test.ts,
  tests/craft_from_vault.test.ts ("routes every sourcing decision through ONE planner
  per file"), tests/parity/trace.ts and tests/parity/scenarios.ts
- tests/monolith_budget.test.ts (the sim.ts, game.ts, online.ts rows), server/CLAUDE.md
  "Hot paths", root CLAUDE.md "Invariants"
The agent returns: how each host feeds resetDay (and whether the offline client and
headless need a feed added, and where); the planner composition recipe (one
planReagentSourceDraw per ledger line with explicit gradeIds for produce, base grade
before fine_, countMinusPlanned across lines); the lock-aware then raw twin shape; the
fhold key extension points on both sides (emitter fields, the decoder's AssertNever
allowlist); the extraction candidates in sim.ts, game.ts, and online.ts that pay for any
new line; the provisioner firewall arm shape; the parity scenario shape.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CORE: src/sim/freehold/condition_core.ts (pure, no sim_context import:
  conditionAt(conditionStampDay, lastSeenDay, resetDay), the 7-day away pause keyed on
  lastSeenDay (the Phase 07 last_seen_day column, written at join and leave), the 3
  repair-free days on return, the lockout predicate at 30, clamp to 0, never a destroy
  path; day keys only, no ms stamp) and src/sim/freehold/ledger_core.ts (pure: ledgerWeekOf(resetDay) on
  the realm weekly reset, the seeded weekly line order from ledger_schedule.ts by a
  stateless hash of (ownerKey, week) with NO Rng, planLedger legs through
  planReagentSourceDraw per line with explicit gradeIds for produce and
  countMinusPlanned across lines, null on shortfall, prepay accounting over
  ledgerPaidWeek (the Phase 07 ledger_paid_week column; no due timestamp) capped at 4
  weeks ahead,
  and the "repairing from 93 costs the same as from 60" rule); tests
  tests/freehold_condition.test.ts and tests/freehold_ledger.test.ts (rollover across
  resetDay, pause and grace, prepay cap, one planner per file, the keystone exclusion
  sweep of EVERY reachable schedule week, literal pins of the working numbers from
  state.md flagged TUNING for the maintainer).
- Agent COMMAND: src/sim/freehold/ledger.ts (the pay_ledger body: resolve, owner-only,
  the lock-aware plan then the raw twin so the deny splits 'item_locked' (Phase 08's id)
  from 'short',
  bags then vault in ONE batch through removeUnlockedFromSlots and
  reserveVaultConsumption, ledgerPaidWeek advanced and conditionStampDay reset on the
  record, one onInventoryChangedForQuests poke, kind 'ledger' (with weeks) appended to
  the Phase 08 freeholdGranted { kind } variant, and the one reason this phase owns,
  short, appended to the freeholdDenied wire enum (not_owner and item_locked are Phase
  08's, reused as is; locked is the Phase 05 amenity id the ledger never emits), no
  refusal path mutates); the
  Sim delegate for payLedger (thin, already stubbed by Phase 01); the dispatch body in
  server/freehold_wire.ts (shape-only) and the ClientWorld one-liner; the fhold key
  gaining condition, conditionStampDay, ledgerPaidWeek, lastSeenDay, prepaidWeeks (day
  and week keys only: no ms stamp, no due timestamp), and the current
  ledger lines (ids and counts only) with the strict decoder's allowlist and AssertNever
  arm extended; HEAVY_SELF_CMDS and HEAVY_SELF_EVENTS rows; the amenity lock in
  amenities.ts now reading conditionAt (Phase 12 left the predicate a stub).
- Agent CALENDAR: the resetDay feed on the offline client and the headless env if STEP 1
  found it missing (the same SimCalendarSink shape, derived from the host's own clock
  base, never Date.now inside src/sim/), the tests/provisioner_firewall.test.ts ledger
  arm re-run over the seeded order (every week, every line), the determinism case
  (same seed and calendar, same condition and same legs on both hosts, zero Rng draws
  pinned through Rng.setObserver), and a tests/parity scenario `freehold_ledger`
  regenerated in its own commit.
The coordinator edits last: tests/snapshots.test.ts (ALL_DELTA_KEYS is an exact count),
tests/sim_context.test.ts (any new callback), tests/monolith_budget.test.ts (lowered
ceilings). Every agent writes any report longer than a screen to a file and replies with
the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: neither core draws Rng (the seeded order is a stateless hash); no wall
  clock in src/sim/ (ctx.resetDay and ctx.lockoutNowMs() are the clocks); pinned.
- Nothing ticks (D8): condition and the due week derive at read time from stamps; no
  per-tick sweep, no tickCount % N cadence, no per-tick allocation.
- Server authority: the pay outcome is decided in the sim on the server; the client sends
  and mirrors the fhold delta; the Steward panel (Phase 16) mirrors the same planner and
  never predicts.
- Never destroy: condition 0 still opens the door; no path removes a furnishing, trophy,
  or the record; below 30 amenities refuse 'locked' and nothing else changes.
- Keystone exclusion: no ledger line may name wyrmfall_core, sundered_essence,
  makers_ember, a gear intermediate, or the quickening catalyst; base grade before fine_;
  produce joins the ledger with explicit gradeIds; one planner per file.
- Bags then vault through the ONE planReagentSourceDraw; the D18 vault arm stays explicit.
- i18n: the policy in docs/freeholds/implementation-plan.md; every deny and grant is a
  text-free id-carrying SimEvent (D10); no sim_i18n row.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game
  content and is not firewall vocabulary.
- Monolith: sim.ts, game.ts, and online.ts are at ZERO slack; a delegate, case label, or
  mirror line is paid for by an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The Steward panel, any window, toast copy beyond the English keys the events need
  (Phase 16).
- The Master Builder's Call, any Claudium path, any price (Phase 15; the economy service
  owns prices).
- Twelve-week prepay (Phase 25), the Guildhall 2x decay and Hall Fund (Wave C).
- Retuning the stack counts: cite state.md's working values, flag them TUNING, and leave
  the finals to the economy service and Fernando (O3).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_condition.test.ts`;
  `npx vitest run tests/freehold_ledger.test.ts`; `npx vitest run
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/provisioner_firewall.test.ts tests/craft_from_vault.test.ts
  tests/farm_watch_fee.test.ts tests/professions_farming.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/env_protocol.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/freehold_determinism.test.ts tests/localization_fixes.test.ts
  tests/server/freehold_wire.test.ts tests/server/heavy_self.test.ts`; the parity
  goldens with `UPDATE_PARITY=1` in their own commit, then `npx vitest run tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the two cores, the seam, the zero-draw contract) and
  cross-platform-sync (the pay command on both hosts, the fhold fields, the resetDay
  feed on all three hosts), and server-hot-path-reviewer (the fhold payload grows: the
  new fields and the ledger lines ride the heavy-gated self key); the dispatch table
  adds privacy-security-review if the diff touched server/ or src/net/. Prompt each for COVERAGE not filtering; each writes its
  report to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): derive freehold condition from the realm calendar with pause and grace
- feat(sim): plan and pay the Steward's Ledger from bags then vault
- feat(net): carry ledger and condition state on the fhold self key
- test(parity): record the freehold ledger scenario goldens
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] conditionAt loses exactly one point per realm day, pauses after 7 days past
  lastSeenDay, grants 3 repair-free days on return, never goes below 0, and the door opens at 0
  (each arm a literal pin in tests/freehold_condition.test.ts).
- [ ] ledgerWeekOf rolls on the realm weekly reset (a case straddling the boundary), the
  seeded order is identical across two Sims with the same seed and calendar, the
  keystone sweep over every reachable week finds no forbidden id, produce lines carry
  explicit gradeIds with base before fine_, and one planner per file holds.
- [ ] pay_ledger pays from bags then vault in one batch, refuses 'item_locked' and 'short'
  (short is the one reason this phase appends) and a visitor with Phase 08's 'not_owner' without
  mutating, clamps a request past the cap to 4 weeks ahead of ledgerPaidWeek, and
  repairing from 93 costs the same as from 60 (a paired pin).
- [ ] Below 30 the Strongbox and station refuse 'locked' (Phase 12 suites re-run green).
- [ ] The fhold key round-trips the new fields (tests/snapshots.test.ts arm) and the
  chain test passes; resetDay is fed on all three hosts (pinned).
- [ ] Rng.setObserver records zero draws across a pay and a read; no wall clock in
  src/sim/freehold/ (tests/architecture.test.ts).
- [ ] sim.ts, game.ts, and online.ts ceilings are not higher than before.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 13, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 13: new files, SimEvents and reasons
  appended, the fhold fields, HEAVY_SELF rows; record where each host feeds resetDay and
  the O3 draft values as TUNING).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13-qa.md

STOPPING RULES:
- Stop and ask if the offline client or headless cannot supply resetDay without a wall
  clock entering src/sim/ (the feed must stay on the host side of the seam).
- Stop if a ledger line cannot be expressed through planReagentSourceDraw (a second
  planner is a defect, not a workaround).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
