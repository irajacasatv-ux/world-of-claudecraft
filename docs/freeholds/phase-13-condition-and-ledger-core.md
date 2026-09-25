# Phase 13: condition and the Steward's Ledger core

Wave A, the Cottage MVP. The spec is `progress.md` "13 Condition and the Steward's Ledger
core"; the decisions are `state.md` D8 (nothing ticks), D10 (text-free events), D18 (the
vault arm), D84 (calendar clocks) and the ledger rules in `state.md` "Content numbers"
and D35. This phase ships the two pure cores
(condition and ledger), the `pay_ledger` command body on both hosts, four-week prepay, the
lockout at 30, the realm-week boundary, and the keystone exclusion sweep. The Steward panel
that shows all of this is Phase 16; the Master Builder's Call is Phase 15.

### Starter Prompt
```
This is Phase 13 of the Freeholds and Guildhalls feature: condition and the Steward's
Ledger core (condition_core.ts, ledger_core.ts, the pay_ledger command, prepay, lockout,
the week boundary, the keystone exclusion pin).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three independent slices over pure leaves).

Goal: make a Cottage wear one condition point per realm day with the away pause and the
return grace, lock its amenities below 30 without ever destroying anything, and let the
owner pay a seeded weekly Steward's Ledger of low-tier materials and produce from bags
then vault (up to four weeks ahead), all derived at read time from stamps and the realm
calendar, identically on every host, with no Rng draw and no per-tick work.

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
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- Memory scan: MEMORY.md and entries on the provisioner firewall, "one planner per file",
  the farm watch fee, the monolith ratchet, ALL_DELTA_KEYS conflicts, parity goldens,
  test-pin traps (constant self-comparison, mutation harness must prove tests ran).

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "13 Condition and the
  Steward's Ledger core"), and this file
- src/sim/freehold/ as Phases 01 to 12 left it (types.ts, state.ts, instance.ts,
  layout_core.ts, placement.ts, amenities.ts, index.ts, CLAUDE.md), and the content
  tables src/sim/content/freehold/ledger_schedule.ts and tiers.ts (Phase 03)
- src/sim/sim_context.ts (the resetDay, utcDay and dailyResetRemainingSec primitives,
  lockoutNowMs, countItem, removeItem, reserveVaultConsumption), src/sim/CLAUDE.md
- server/sim_calendar_feed.ts (feedRealmCalendar(sim, nowMs, zone) and its
  SimCalendarSink shape: pure in the instant and zone), server/raid_reset.ts
  (resetDayKey(ms, zone): the 03:00 realm-local day key that feeds ctx.resetDay,
  nextRaidResetMs, nextWeeklyRaidResetMs, WEEKLY_RESET_WEEKDAY = 2), server/realm.ts
  (REALM_RESET_TIME_ZONE, server-only), src/sim/professions/masterwrought_materials.ts
  (emberWeekAnchorOf, emberWeeksBetween, emberWeekAnchorPlusWeeks and
  resetDayToDayNumber: the pure Tuesday week anchor over a resetDay key, '' in gives
  '' out), and how the OFFLINE client and the headless env feed resetDay today (grep
  feedSimCalendar in src/main.ts: the import and the frame-loop call into
  src/game/utc_day.ts::feedSimCalendar(sim), which reads Date.now() itself; confirm
  headless/ has no calendar feed at all)
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
  variant Phase 08 added), server/freehold_db.ts and the 07b account lifecycle
  producer server/freehold_lifecycle_db.ts/server/freehold_lifecycle.ts; plots consume
  committed account protection history, never a plot last_seen_day authority
- server/freehold_wire.ts and src/net/freehold_snapshot_wire.ts (the fhold key emitter
  and strict decoder as Phase 08a left them), server/heavy_self.ts, tests/snapshots.test.ts
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
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

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
- Explicit bags-only, vault-only or automatic bags-then-vault mode through the ONE
  planReagentSourceDraw; preview/deduction agree and the D18 vault arm stays explicit.
- i18n: the policy in docs/freeholds/implementation-plan.md; every deny and grant is a
  text-free id-carrying SimEvent (D10); no sim_i18n row.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game
  content and is not firewall vocabulary.
- Monolith: sim.ts, game.ts, and online.ts are at ZERO slack; a delegate, case label, or
  mirror line is paid for by an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Live shared-calendar persistence, private service ingress and host installation are
  produced by phase-13a-authoritative-upkeep-calendar.md; keep their ready gate closed.
- The Steward panel, any window, toast copy beyond the English keys the events need
  (Phase 16).
- The Master Builder's Call, any Claudium path, any price (Phase 15; the economy service
  owns prices).
- Twelve-week prepay (Phase 25a), the Guildhall 2x decay and Hall Fund (Wave C).
- Unapproved stack-count activation: exact reference-derived calibration is a tracked
  worksheet deliverable; Fernando/service acceptance is a release gate, never a guessed bill.

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_condition.test.ts`;
  `npx vitest run tests/freehold_ledger.test.ts`; `npx vitest run
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/provisioner_firewall.test.ts tests/craft_from_vault.test.ts
  tests/farm_watch_fee.test.ts tests/professions_farming.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/env_protocol.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/freehold_determinism.test.ts tests/localization_fixes.test.ts
  tests/server/freehold_wire.test.ts tests/server/heavy_self.test.ts
  tests/server/freehold_db.test.ts`; then the PG-armed twins `npx vitest run
  tests/server/freehold_ledger.pg.test.ts tests/server/freehold_mutation.pg.test.ts`
  with `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook` after
  `npm run db:up` (record that they ran, not skipped); the parity
  goldens with `UPDATE_PARITY=1` in their own commit, then `npx vitest run tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md,
  the full roster above: architecture-reviewer (the two cores, the seam, the zero-draw
  contract, the realm_week.ts extraction), cross-platform-sync (the pay command on both
  hosts, the fhold fields, the resetDay feed on all three hosts),
  server-hot-path-reviewer (the fhold payload grows: the new allowlisted fields and
  ledger lines ride the heavy-gated self key), privacy-security-review (server/ and
  src/net/ are touched: the pay command, the wire fields), database-performance-reviewer
  (before storage decisions and on the finished diff: freehold_ledgers, its index and
  the pay_ledger participant), migration-safety (the freehold_ledgers DDL and the
  JSONB back-compat of the record fields), test-coverage-auditor (every pin above) and
  qa-checklist (the whole diff). Prompt each for COVERAGE not filtering; each writes
  its report to a file. Do not commit until ALL findings, including nits, are resolved
  and the fixes have fresh review.

- Required reviewers for the complete settled diff: architecture-reviewer,
  cross-platform-sync, server-hot-path-reviewer, privacy-security-review,
  migration-safety, database-performance-reviewer, test-coverage-auditor and
  qa-checklist (the same eight as the required list above).
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): derive freehold condition from the realm calendar with pause and grace
- feat(sim): plan and pay the Steward's Ledger from bags then vault
- feat(server): persist paid Ledger bills in freehold_ledgers through commitFreeholdMutation
- feat(net): carry ledger and condition state on the fhold self key
- test(parity): record the freehold ledger scenario goldens
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] conditionAt loses exactly one point per realm day, pauses after the preserved 7-day absence transition, grants 3 repair-free days on return
  from 07b committed account history and unions overlapping authority suspension intervals;
  finalized historical facts authorize durable effects, condition never goes below 0,
  and the door opens at 0 (each arm a literal pin in tests/freehold_condition.test.ts,
  driven with resetDay-keyed fixtures: the condition_core input type contains no
  epoch-ms arithmetic and its Ms fields are display-only, per D84; a fixture whose
  finalizedThroughDay excludes the current window holds that day's wear and bill
  classification pending).
- [ ] ledgerWeekOf rolls on the realm weekly reset (a case straddling the boundary asserts
  ledgerWeekOf(resetDay) === emberWeekAnchorOf(resetDay) on both sides of a Tuesday, and
  masterwrought_materials.ts re-exports the extracted src/sim/realm_week.ts leaf with its
  existing tests byte-unchanged), the
  published realm-week/version schedule is identical for different owners and hosts, the
  keystone sweep over every reachable week finds no forbidden id, produce lines carry
  explicit gradeIds with base before fine_, and one planner per file holds.
- [ ] pay_ledger obeys bags-only/vault-only/automatic source mode atomically, refuses 'item_locked' and 'short'
  (short is the one reason this phase appends) and a visitor with Phase 08's 'not_owner' without
  mutating, accepts at most LEDGER_PREPAY_MAX_WEEKS = 4 future weeks and refuses the fifth
  without changing any record, and
  repairing from 93 costs the same as from 60 (a paired pin).
- [ ] Below 30 the Strongbox and station refuse 'locked' (Phase 12 suites re-run green).
- [ ] The fhold key round-trips the new fields (tests/snapshots.test.ts arm) and the
  chain test passes under identical injected host fixtures; 13a owns live host feed proof.
- [ ] tests/server/freehold_ledger.pg.test.ts ran PG-armed (N tests ran, 0 skipped) with the
  refusal-after-bags-half, stale-CAS and contract proof-list arms, and the composed
  restart fixture (daily plus Tuesday boundary while down: one classification, at most
  one credit) is green; freehold_ledgers persists paid bills keep-forever with its
  growth metric registered.
- [ ] Rng.setObserver records zero draws across a pay and a read; no wall clock in
  src/sim/freehold/ (tests/architecture.test.ts).
- [ ] sim.ts, game.ts, and online.ts ceilings are not higher than before.
- [ ] All STEP 3 suites green; the reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 13, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 13: new files, correlation fields, calendar/credit persistence, SimEvents and reasons
  appended, the fhold fields, HEAVY_SELF rows, the freehold_ledgers table, the
  src/sim/realm_week.ts leaf and ledgerWeekOf, LEDGER_PREPAY_MAX_WEEKS; record where each
  host feeds resetDay and the approved calibration artifact versions and
  owner-attributed TUNING targets).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13-qa.md

STOPPING RULES:
- Stop and ask if the offline client or headless cannot supply resetDay without a wall
  clock entering src/sim/ (the feed must stay on the host side of the seam).
- Stop if a ledger line cannot be expressed through planReagentSourceDraw (a second
  planner is a defect, not a workaround).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
