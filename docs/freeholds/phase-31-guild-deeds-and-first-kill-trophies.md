# Phase 31: guild-level deeds and first-kill trophies

Wave C, Guildhalls. The spec is `progress.md` "31 Guild-level deeds and first-kill
trophies"; the decisions are `state.md` and `brainstorm.md` (D16, D19, and the guild owner
kind from Phase 28). This phase ships the first guild-scoped deed record the game has ever
had (today every deed is per character), first-kill banners and raid statues earned from a
guild's first clears, and the hall trophy plinths that display them.

### Starter Prompt
```
This is Phase 31 of the Freeholds and Guildhalls feature: guild-level deeds and
first-kill trophies (the guild_deeds record, first-clear banners and statues, the hall
plinths).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: give a guild its own deed record (sim state plus a keep-forever table), credit a
guild's first clear of each raid boss exactly once, and hang the earned banner or statue
on the Guildhall's plinths through the existing trophy sync, with no rng and no text.

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
- Memory scan: MEMORY.md and entries on deeds content pins, the guild-bank escrow idiom,
  parity goldens and eventDigest, migration safety, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "31 Guild-level deeds and
  first-kill trophies"), and this file
- src/sim/deeds.ts (grantDeed, evaluateDeedsFor, the dungeonClears credit site and the
  deedUnlocked emit), src/sim/content/deeds.ts (DeedDef, the append-only DEED_ORDER),
  src/sim/deeds_completion.ts, src/sim/instances/dungeons.ts (clearedBy on InstanceSlot)
- src/sim/guild_bank.ts (the ctx.guildBanks live map with loadGuildBank, serializeGuildBank,
  evictGuildBank; stampGuildMembership; GUILD_BANK_EDIT_RANKS; the GuildBankOpDelta escrow
  replay), src/sim/sim_context.ts (guildBanks, deedDirtyPids, deedRuntime), tests/sim_context.test.ts
- src/sim/freehold/ as built so far: types.ts (the guild owner kind from Phase 28),
  trophy_eligibility.ts and trophies.ts (Phases 17 and 23: syncTrophyUnlocks, the plinth
  slots, the finish rule), src/sim/content/freehold/trophies.ts and tiers.ts (plinth counts
  for meeting_hall)
- server/social_db.ts (SOCIAL_SCHEMA: guilds, guild_members, guild_events, guild_banks),
  server/guild_bank_state.ts (boot load and the escrow-delta merge), server/db.ts
  (ensureSchema order, exportAccountData), the deedUnlocked observer in server/game.ts
  detectActivity (grep character_deeds), server/characters.ts (the deeds strip read)
- tests/deeds_content.test.ts, tests/social_system.test.ts (the guild-delete guards),
  tests/parity/trace.ts (META_EXCLUDE), tests/monolith_budget.test.ts
The agent returns: the ONE site where a raid or dungeon final-boss clear credits
deedStats.dungeonClears (the guild observer joins there); the guild live-map idiom to copy
verbatim; the table shape and its ensureSchema slot after SOCIAL_SCHEMA; whether
character_deeds server-clock rows allow an honest retro seed (else the record starts at
deploy); the plinth count per hall tier; the trophy record shape from Phases 17 and 23;
the extraction candidates in sim.ts and game.ts that pay for the new delegate and call.
Settle the retro-seed question and the per-difficulty finish mapping in STEP 1 and record
both in state.md before implementing.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: src/sim/freehold/guild_deeds.ts (GuildDeedState { earned: Map<deedId,
  { day, byCharacterId }>, rev }; ctx.guildDeeds: Map<guildId, GuildDeedState> with
  loadGuildDeeds, serializeGuildDeeds, evictGuildDeeds; onGuildClearForDeeds(ctx, meta,
  bossKey, difficulty) called from the one clear-credit site; the text-free pid-scoped
  guildDeedUnlocked { guildId, deedId } event, plus a guild-wide notice event to every
  member online), src/sim/content/freehold/guild_deeds.ts (GuildDeedDef rows
  guild_first_<boss>_<difficulty>, append-only order), the guild arm in
  trophy_eligibility.ts (guild deed id to banner or statue prop id with the finish by
  difficulty) and in syncTrophyUnlocks for the hall record, the SimContext primitive and
  its tests/sim_context.test.ts pins, the sim.ts delegate paid by an extraction and a
  LOWERED ceiling, tests/freehold_guild_deeds.test.ts (exactly-once, two guilds, no rng,
  same seed same state).
- Agent SERVER: server/guild_deeds_db.ts (GUILD_DEEDS_SCHEMA: guild_deeds keyed
  (guild_id, deed_id), guild_id REFERENCES guilds(id) ON DELETE CASCADE, earned_by
  REFERENCES characters(id) ON DELETE SET NULL, earned_day, earned_at, a keep-forever DDL
  comment, insert ON CONFLICT DO NOTHING as the first-kill rail), a sibling
  server/guild_deeds_observer.ts mirroring guildDeedUnlocked into the table from
  detectActivity (one call in game.ts, paid by an extraction and a lowered ceiling),
  boot-load beside the guild banks, the ensureSchema slot, the exportAccountData rows the
  Explore summary settled, tests/server/guild_deeds_db.test.ts plus its pg-armed twin.
- Agent CONTENT: banner and statue trophy props in src/sim/content/freehold/trophies.ts
  (one banner family with a per-boss emblem variant, one statue per raid boss, finishes
  per difficulty), stand-in models or GLBs through the image-to-glb skill, world-entity
  names in src/ui/world_entity_i18n.ts, a Homesteader deed for hanging a first-kill
  banner, wiki regen and guide keys, the deeds_content and reliquary_content re-pins.
The coordinator edits last: tests/sim_context.test.ts CALLBACK_KEYS and the fake host,
tests/monolith_budget.test.ts, parity goldens if the clear path now emits (their own
commit with UPDATE_PARITY=1). Every agent writes any report longer than a screen to a
file and replies with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the guild record draws no Rng; first-kill order is the tick order of the
  clear; no wall clock in src/sim/ (earned_day is ctx.resetDay).
- One sim, three hosts: offline and headless hold an empty guild deeds map and never
  crash on a clear; the RL exclusion pin stays green.
- Server authority: the credit is decided in the sim; the client mirrors the event.
- Persistence gates: additive idempotent DDL, keep-forever stated at the DDL, the
  exportAccountData rows, cascade on guild delete (tests/social_system.test.ts guards).
- Never sell power, trophies are earned and never sold, nothing destroyed.
- Token firewall at the state.md scope (on-chain vocabulary only: wallet, token, $WOC,
  mint, holder, marketplace, on-chain, Solana); Book of Deeds ids are game content, so
  guild_deeds.ts and its deed ids sit inside the allowed set. The i18n policy in
  docs/freeholds/implementation-plan.md (text-free events resolved to hudChrome.housing.*
  keys); vocabulary fixed; "phase" in no code, comment, commit, or PR text; sim.ts and
  game.ts ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Tiers above Meeting Hall and build projects (Phase 32); Showcase votes (Phase 36).
- Fabricated retro first kills: if STEP 1 finds no trustworthy per-boss history, the
  record starts at deploy and the doc says so.
- Any change to character deed semantics, renown, or titles.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_guild_deeds.test.ts
  tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/localization_fixes.test.ts
  tests/server/guild_deeds_db.test.ts tests/server/main_retention_wiring.test.ts
  tests/social_system.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; the pg-armed twin with TEST_DATABASE_URL set after `npm run db:up`;
  the parity goldens if regenerated.
- Spawn review agents per docs/freeholds/implementation-plan.md: architecture-reviewer,
  content-obligations-reviewer, migration-safety, plus privacy-security-review because
  server/ is touched. Prompt each for COVERAGE not filtering; each writes its report to
  a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add guild-level deeds behind SimContext with first-clear credit
- feat(server): persist guild deeds in a keep-forever table and mirror unlocks
- feat(content): add first-kill banner and raid statue trophies for the hall plinths
- test(sim): pin first-kill exactly-once and the hall trophy sync
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] guild_deeds DDL is additive, idempotent, keep-forever at the DDL; migration-safety
  reports no BLOCKING.
- [ ] A guild party's raid clear credits the guild deed exactly once (two clears, one
  row; a second guild credits its own), pinned with literal ids and a same-seed twin run.
- [ ] Every earned guild deed hangs its banner or statue on the hall plinths through
  syncTrophyUnlocks with the difficulty finish; costs no decor points; never tradable.
- [ ] Offline and headless: empty map, no crash, env_protocol pin unchanged.
- [ ] Every new trophy prop id has committed art or a registered stand-in (D13);
  content-obligations-reviewer reports no BLOCKING.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 31, notes, deferrals) and
  docs/freeholds/state.md (ledger row 31: new files, SimEvents, the table, the primitive;
  the retro-seed and finish decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-31-qa.md

STOPPING RULES:
- Stop and ask if the only honest first-kill credit site would change character deed
  behavior (the observer must read, never re-grant).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
