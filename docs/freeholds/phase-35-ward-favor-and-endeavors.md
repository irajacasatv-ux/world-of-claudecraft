# Phase 35: ward favor and Endeavors

Wave D, Wards and Charters. The spec is `progress.md` "35 Ward favor and Endeavors"; the
decisions are `state.md` and `brainstorm.md` (D8 nothing ticks, D10 text-free events, the
Phase 34 ward descriptor). This phase ships the ward favor bar (raises every member's
decor budget on a published cadence) and monthly ward Endeavors (shared goals with
cosmetic rewards only).

### Starter Prompt
```
This is Phase 35 of the Freeholds and Guildhalls feature: ward favor and Endeavors (the
favor bar that raises decor budgets, monthly shared Endeavors with cosmetic rewards).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: add a ward-wide favor value and monthly Endeavors that reward decor points and
cosmetic props only, derived at read time from persisted counters and the realm
calendar, with no rng, no purchase input, and no per-tick work.

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
- Memory scan: MEMORY.md and entries on the realm calendar feed, the escrow-delta idiom,
  never-sell-power sweeps, sim_context callback pins, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "35 Ward favor and
  Endeavors"), and this file
- src/sim/freehold/wards.ts, ward_core.ts (the Phase 34 descriptor and its style slot),
  layout_core.ts (the decor budget check), ledger.ts and condition_core.ts (the events a
  paid ledger emits), visiting.ts (the visit event), src/sim/sim_context.ts (utcDay,
  resetDay, the calendar primitives), server/sim_calendar_feed.ts and server/raid_reset.ts
  (resetDayKey, nextWeeklyRaidResetMs; whether any month key exists)
- server/freehold_db.ts (freehold_wards, account_freeholds rev CAS), server/guild_bank_state.ts
  (the escrow-delta merge to copy for concurrent contributors), server/freehold_wire.ts
- src/ui/hud/housing/ (the steward panel family, the Phase 34 ward panel if one landed),
  src/ui/i18n.catalog/hud_chrome.ts (housing namespace)
- tests/freehold_content.test.ts (the power-neutral sweep), tests/freehold_wards.test.ts,
  tests/sim_context.test.ts, tests/parity/trace.ts
The agent returns: the exact events favor can be credited from (ledger paid on time, a
visit received, an Endeavor step); the calendar primitive to derive a month boundary
from (or the one primitive to append and feed); the ward row fields to add; the
escrow-delta shape for concurrent Endeavor progress; the panel family to extend; the
extraction candidates that pay for new lines. Settle in STEP 1 and record in state.md
before implementing: the favor contribution table and decay (working: four ranks, plus
10 decor points per rank, monthly decay toward a floor; Fernando owns the finals), the
month boundary definition, and the first Endeavor set with its cosmetic rewards.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: src/sim/freehold/ward_favor_core.ts (a pure ranker: counters and the month
  key in, favor and rank out; no purchase input by construction), src/sim/freehold/realm_month_core.ts
  (the month boundary from resetDay, or the appended calendar primitive with its
  sim_context.test.ts pins), src/sim/content/freehold/endeavors.ts (goal id, metric key,
  target, reward prop id; append-only), src/sim/freehold/endeavors.ts (progress credited
  from the existing events through one observer, completion at read time, the reward
  recorded in every member's trophy record with retro: false), the decor-budget bonus
  read by layout_core.ts from the ward rank, the text-free events wardFavorChanged,
  endeavorProgress, endeavorComplete, tests/freehold_ward_favor.test.ts.
- Agent SERVER: favor counters and Endeavor progress persisted on the ward row through
  the escrow-delta merge idiom (many concurrent contributors, never a whole-row write
  from one session), the wardState descriptor gaining favor and endeavor fields
  (serialize-once), the freehold_wards columns (ADD COLUMN IF NOT EXISTS), the account
  export untouched unless a per-account counter lands (then a row), tests/server/.
- Agent CLIENT: the ward panel (steward panel family: a favor bar, the Endeavor list
  with progress and reward silhouettes), the mobile sheet decision, hudChrome.housing.*
  keys, formatNumber for every count, pr_shot_targets entries, the decode arm in
  src/net/ward_wire.ts for the new fields.
The coordinator edits last: tests/sim_context.test.ts if a primitive was appended,
tests/snapshots.test.ts if a key changed, tests/monolith_budget.test.ts, parity goldens
in their own commit. Every agent writes any report longer than a screen to a file and
replies with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Never sell power: rewards are decor points and cosmetic props only; no reward carries
  a stat, a recipe, a drop table, or a gathering effect; nothing purchasable raises
  favor (no Claudium or $WOC path reaches the favor core), both pinned by the sweep.
- Determinism and nothing ticks: favor and completion derive at read time from counters
  and the calendar; no Rng; no wall clock; no per-tick sweep.
- Server authority; text-free id-carrying events (D10); the i18n policy in
  docs/freeholds/implementation-plan.md.
- Nothing destroyed: a favor decay never removes a placed furnishing that exceeded the
  budget; the budget check applies to NEW placements only.
- Token firewall; vocabulary fixed; "phase" in no code, comment, commit, or PR text;
  monolith ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Showcase votes and guest books (Phase 36); holder flair (Phase 38); any Endeavor that
  rewards a title, a mount, or an item with power.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_ward_favor.test.ts
  tests/freehold_wards.test.ts tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts` plus the
  tests/server/ suites the SERVER slice added and the pg-armed twin; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`;
  parity goldens if regenerated.
- Spawn review agents per docs/freeholds/implementation-plan.md: architecture-reviewer,
  cross-platform-sync, plus privacy-security-review (server/), migration-safety
  (columns), and frontend-seam-reviewer (src/ui/). Prompt each for COVERAGE not
  filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): derive ward favor and monthly Endeavors from persisted counters
- feat(server): merge favor and Endeavor progress with the escrow-delta idiom
- feat(ui): add the ward panel with the favor bar and the Endeavor list
- test(sim): pin the cosmetic-only rewards and the no-purchase favor input
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Favor rises from the settled events only, decays at the month boundary, and raises
  every member's decor budget by the pinned step; a same-seed twin run agrees.
- [ ] An Endeavor completes at read time when its counter reaches the target; two
  concurrent contributors merge without loss; the reward lands in every member's trophy
  record once.
- [ ] The power-neutral sweep covers every Endeavor reward and the favor core has no
  purchase input (both pinned with fresh literals and a can-fail control).
- [ ] The ward panel shows favor and Endeavors on desktop and as a mobile sheet;
  screenshots committed.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 35, notes, deferrals) and
  docs/freeholds/state.md (ledger row 35; the favor table, month boundary, and Endeavor
  set decisions; the content numbers table gains the rank bonus).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-35-qa.md

STOPPING RULES:
- Stop and ask if a month boundary cannot be derived without a wall clock in src/sim/
  (the fix is a fed calendar primitive, never Date).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
