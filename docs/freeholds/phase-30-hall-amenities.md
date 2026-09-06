# Phase 30: hall amenities

Wave C, Guildhalls. The spec is `progress.md` "30 Hall amenities" (coarser than wave A:
settle unknowns in STEP 1 and record them in `state.md` before implementing); the
decisions are `state.md` (D6, D7, D18) and `brainstorm.md`. This phase ships the guild
bank chest (guild bank access at the hall), the feast hall long table (the shipped feast
object; Well Fed is the only buff), hall-shared stations (a new predicate over members
present in the hall, never the private party predicate), and four boards that are
read-only mirrors of existing guild data: the muster board, the calendar board, the
pledge-board mirror, and the war table.

### Starter Prompt
```
This is Phase 30 of the Freeholds and Guildhalls feature: hall amenities (the guild bank
chest, the feast hall long table, hall-shared stations, the muster board, the calendar
board, the pledge-board mirror, the war table).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 12 and 28 seams).

Goal: make the Meeting Hall useful: guild bank access at a chest, a feast night at the
long table, crafting stations every member present in the hall may use, and boards that
open the guild's existing roster, calendar, pledges, and standings, with no new data
path, no new buff, and no number changed.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, the UI cluster of the
  gotcha catalog (window families, mobile sheets, the drive registry), the render
  scheduler rules, test-pin traps, the vault craft gate arm (D18).

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the Phase 28 and 29 decisions), docs/freeholds/progress.md
  (only "30 Hall amenities"), and this file
- src/sim/freehold/amenities.ts (the Strongbox arm beside nearBanker, the station
  amenity slot, the D18 vault arm), permissions.ts, instance.ts (the claim's enteredBy
  roster and objectIds), the MEETING_HALL_LAYOUT anchors reserved in Phase 28 in
  src/sim/content/freehold/layouts.ts (D23), src/sim/bank.ts (nearBanker, bankerIds), src/sim/guild_bank.ts (guildBankInfoFor and
  its nearBanker use), src/sim/professions/stations.ts (isAtStation, inRangeStationTypes,
  isAtAnyStation), src/sim/professions/mobile_station.ts (partySharedStationSatisfies
  and the private partySharedStationFor it wraps), src/sim/professions/crafting.ts (the
  station arms in evaluateCraftAdmission), src/sim/vault_craft_gate.ts,
  src/sim/professions/feast.ts (placeFeastAction, the room-roster registration,
  FARM_FEAST_ITEM_ID) and feast_placement.ts
- server/guild_roster.ts (guildRosterCached: the muster board source), server/social.ts
  and server/social_db.ts (guild_events and GuildEventRow: the calendar board source;
  guild_pledges and the pledge ladder: the pledge-board source; the guild standings or
  leaderboard read: the war table source), src/ui/calendar_view.ts and calendar_window.ts,
  src/ui/guild_leaderboard_view.ts, the guild roster and pledge windows (grep the guild
  window family under src/ui/), src/ui/guild_bank_window.ts
- src/game/nearby_interaction.ts (the interact funnel), src/ui/hud/professions/
  feast_title.ts and tests/entity_display_name.test.ts (the templateId title map),
  src/ui/world_entity_i18n.ts, src/ui/i18n.catalog/hud_chrome.ts, src/render/freehold/
  (the registry and prewarm homes), src/render/CLAUDE.md ("GPU work")
- tests/freehold_strongbox.test.ts and tests/freehold_station.test.ts (the Phase 12
  suites), tests/professions_crafting_hub.test.ts,
  tests/mobile_station_party.test.ts, tests/mobile_station_walk.test.ts,
  tests/craft_from_vault.test.ts, tests/professions_feast.test.ts,
  tests/feast_object_lifecycle.test.ts, tests/monolith_budget.test.ts,
  tests/renderer_compile_gate.test.ts, tests/hud_update_drive.test.ts
The agent returns, and the session records in state.md BEFORE implementing: whether the
guild bank chest opens the guild bank only (the personal bank stays closed there:
recommend yes, pinned); whether the D18 vault arm extends to a hall your guild owns
(recommend yes for members, negative-tested for a non-member); the hall-shared predicate
shape (over the hall's built station list and the claim roster filtered to members,
never a call into partySharedStationFor; the HUD row set from the same predicate through
the inRangeStationTypes list); the existing window each board opens and its open path;
the entity template ids and title map rows; the extraction candidates for every
coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/world_api_parity.test.ts
if a member changes, tests/snapshots.test.ts, tests/monolith_budget.test.ts, the parity
goldens):
- Agent SIM: amenities.ts gains the guild bank chest (a `kind: 'object'` interactable
  spawned on the hall claim at its anchor; `freeholdGuildChestSatisfies` beside the
  Strongbox arm so guild bank ops pass for a member standing at it and are refused for
  a non-member, away from it, and below condition 30), the feast hall table anchor (the
  shipped placeFeastAction targets the table; the feast joins the claim's objectIds so
  free tears it down; Well Fed is the only buff), `hallSharedStationSatisfies(ctx,
  hall, pid, pos, type)` composed as a new arm of the crafting gate and into the station
  list handed to inRangeStationTypes, never calling the private party predicate;
  isAtAnyStation and resolveTrain untouched (training refused at the hall); the D18 arm
  per the STEP 1 decision; the board interactables as objects on the claim;
  tests/freehold_strongbox.test.ts and tests/freehold_station.test.ts (the Phase 12
  suites) extended.
- Agent CLIENT: the interact funnel rows opening the EXISTING guild bank, calendar,
  roster, pledge, and standings windows from the board and chest entities (measured
  with the sim's own distance), the templateId title map rows pinned both directions,
  hudChrome.housing.hall.* keys for labels and tooltips, hud_update_drive rows if a
  painter polls, the chest, table, and board props through the registry with prewarm
  homes (stand-ins listed as O5 deferrals), the tests/renderer_compile_gate.test.ts arm,
  screenshots (desktop, compact, tablet).
- Agent CONTENT: the anchors on MEETING_HALL_LAYOUT with measured r, world-entity names
  for the chest, table, and boards, `npm run wiki:content` plus a spoiler-safe guide.*
  key, a Homesteader-family deed row appended at the END of deeds.ts only if the
  contract requires one (record the decision).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Never sell power: no amenity adds throughput; the feast's Well Fed is the only buff;
  recipes and their stationType gates unchanged; training still requires the town
  station; no gathering, drop, or progression number changes.
- The hall-shared predicate is new and over members present in the hall; it never
  reuses the private party predicate; the HUD's in-range set comes from the same
  predicate the gate uses.
- Boards are read-only mirrors: no new REST read, table, or write path; each opens an
  existing window over existing guild data.
- D6 and D7 hold for the guild: the chest is guild bank access (no new container, no
  dupe surface); amenities lock below condition 30.
- Determinism: no Rng; no wall clock in src/sim/; the feast keeps its own contract.
- Server authority: membership from the session stamp; the sim decides every gate.
- Render: every prop is a scheduler client with a prewarm home; the point-light budget
  unchanged.
- Content obligations in the SAME change: world-entity names, the title map pin, wiki
  regen plus guide keys; no item, so no WebP or Reliquary obligation.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guild deeds, first-kill banners, raid statues, hall trophy plinths (Phase 31);
  visiting vendors, the Materials Vault chest, build projects (Phase 32); any change to
  the guild bank, calendar, pledge, or roster data or their windows.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_strongbox.test.ts tests/freehold_station.test.ts
  tests/freehold_guildhall.test.ts
  tests/freehold_determinism.test.ts tests/professions_crafting_hub.test.ts
  tests/mobile_station_party.test.ts tests/mobile_station_walk.test.ts
  tests/craft_from_vault.test.ts tests/professions_feast.test.ts
  tests/feast_object_lifecycle.test.ts tests/world_api_parity.test.ts
  tests/snapshots.test.ts tests/freehold_command_chain_online.test.ts
  tests/entity_display_name.test.ts tests/renderer_compile_gate.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/localization_fixes.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run perf:tour` through the hall;
  `node scripts/pr_screenshots.mjs` for the hall targets.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the predicate, the chest arm, the feast anchor),
  frontend-seam-reviewer (the funnel, labels, mobile), plus render-performance-reviewer
  (the props) and cross-platform-sync if a facet member or event changed. Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the guild bank chest, the feast hall table, and hall-shared stations
- feat(content): add the Meeting Hall board anchors and entity names
- feat(ui): open the roster, calendar, pledge, and standings boards from the hall
- test(sim): pin hall-shared stations against the party predicate
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_strongbox.test.ts (the chest and the feast table) and
  tests/freehold_station.test.ts (the hall-shared predicate) prove: guild bank ops pass
  for a member at the
  chest and are refused away from it, for a non-member, and below condition 30; the
  personal bank stays closed there; a member present in the hall satisfies a built
  station's type and a party member outside the hall does not; the private party
  predicate is never called (structural or spy pin); training is refused at the hall;
  a feast at the long table grants Well Fed only and is torn down on free.
- [ ] tests/professions_crafting_hub.test.ts, tests/mobile_station_party.test.ts, and
  tests/craft_from_vault.test.ts are unchanged and green; the D18 decision is pinned
  with its negative case.
- [ ] Each board opens its existing window on both hosts from the interact funnel; the
  title map is pinned both directions; no new REST read or table exists.
- [ ] Props render with prewarm homes; `npm run perf:tour` shows no live-program event;
  screenshots committed.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise; state.md records the STEP 1 decisions.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 30, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 30: entity template ids, the
  predicate, i18n keys; the chest, D18, and board decisions as locked).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-30-qa.md

STOPPING RULES:
- Stop and ask if a board would need a new data path (a REST read, a table, or a write)
  to show anything; the boards mirror what exists.
- Stop if the hall-shared predicate cannot be built without calling the private party
  predicate or changing a recipe's stationType gate.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
