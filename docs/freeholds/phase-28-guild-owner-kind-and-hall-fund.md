# Phase 28: the guild owner kind, the Meeting Hall, the Hall Fund

Wave C, Guildhalls. The spec is `progress.md` "28 The guild owner kind, the Meeting Hall,
the Hall Fund" (coarser than wave A: settle unknowns in STEP 1 and record them in
`state.md` before implementing); the decisions are `state.md` (D15, D16: one record
type keyed by owner key) and `brainstorm.md` (ruling 1: one system, two owner kinds).
This phase ships owner kind `guild` on the same record type (`guildhall:guild:<id>`),
the `meeting_hall` tier and layout, rank permissions (leader and officer edit, members
view), and the Hall Fund escrow (materials plus a Claudium balance with a member-readable
ledger) persisted beside `guild_banks` with the escrow-delta merge idiom. It is a
persistence phase.

### Starter Prompt
```
This is Phase 28 of the Freeholds and Guildhalls feature: the guild owner kind, the
Meeting Hall, and the Hall Fund (the guildhall record and claim key, rank permissions,
the Meeting Hall tier and layout, the Hall Fund escrow and its persistence).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 05, 07, and 12 seams).

Goal: make a guild an owner of the one freehold record type, keyed on the guild id,
claimed by any member and edited only by leaders and officers, with a Meeting Hall tier
and a Hall Fund escrow that members can read and the server persists safely beside the
guild bank.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, the Postgres cluster of the
  gotcha catalog, world_api parity pins, sim_context callback pins, test-pin traps, the
  guild bank escrow-delta entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "28 The guild owner kind,
  the Meeting Hall, the Hall Fund"), and this file
- src/sim/freehold/ (types.ts, state.ts, instance.ts, placement.ts, ledger.ts,
  amenities.ts, visiting.ts, index.ts, CLAUDE.md), src/sim/content/freehold/tiers.ts,
  dungeons.ts, and layouts.ts (COTTAGE_LAYOUT and LODGE_LAYOUT, D23)
- src/sim/guild_bank.ts (GuildBankState, loadGuildBank, serializeGuildBank,
  evictGuildBank, stampGuildMembership, GUILD_RANKS, GuildRank, GUILD_BANK_EDIT_RANKS,
  requireOfficerBook, the GuildBankOpDelta log), src/sim/sim_context.ts (ctx.guildBanks
  and the passthrough getter), tests/sim_context.test.ts, src/world_api/social_graph.ts
- server/guild_bank_state.ts (loadGuildBanksIntoSim, mergeGuildBankRow,
  collectGuildBankDeltas, GUILD_BANK_MERGED_MAX_BYTES), server/guild_bank_lazy_loader.ts,
  server/social_db.ts (the guilds, guild_members, and guild bank tables), server/freehold_db.ts
  (FREEHOLD_SCHEMA, account_freeholds), server/db.ts (ensureSchema order, exportAccountData),
  server/freehold_wire.ts, server/ws_auth.ts (the fresh-join account facts read)
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts, src/net/freehold_snapshot_wire.ts, tests/snapshots.test.ts
  (ALL_DELTA_KEYS), tests/parity/trace.ts
- tests/freehold_instance.test.ts (the Phase 05 suite under its real name),
  tests/server/freehold_db.test.ts, tests/guild_bank*.test.ts, tests/monolith_budget.test.ts
The agent returns, and the session records in state.md BEFORE implementing: whether the
guild record lives in a sibling table `guild_freeholds` (guild_id PK REFERENCES
guilds(id) ON DELETE CASCADE, the same columns) or account_freeholds generalises (choose
the sibling: additive, no rename); whether the member's mirror rides the existing fhold
key with an owner kind or a second self key `ghall` (choose the second key: an account
may own both); the Hall Fund shape (`HallFundState`: material slots as InvSlot rows, a
Claudium balance mirrored from service-recorded donations, a bounded member-readable
ledger) and its ctx primitive `ctx.hallFunds` beside ctx.guildBanks; how the guild id
reaches the claim key from the session-only guildMembership stamp; the escrow-delta
merge shape to copy for the fund; the export obligation for donor rows; the extraction
candidates for every coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/sim_context.test.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, the parity goldens):
- Agent SIM: `ownerKind: 'account' | 'guild'` on FreeholdState, `freeholdKeyFor` gaining
  the guild arm (`guildhall:guild:<id>` from meta.guildMembership, refused `no_guild`
  without a stamp), the `guildhall_meeting_hall` DungeonDef at index 18 with claimKey
  'owner', src/sim/freehold/permissions.ts (`canEditGuildhall(meta)` over the
  GUILD_BANK_EDIT_RANKS family: leader and officer edit, every member views; every
  placement, pay, upgrade, and amenity command refuses `not_officer` on a guild record;
  both reasons appended to freeholdDeniedLineKey in src/ui/hud/housing/housing_view.ts,
  D26), src/sim/freehold/hall_fund.ts (HallFundState, loadHallFund, serializeHallFund,
  evictHallFund, hallFundInfoFor readable by every member, every mutation recorded as an
  absolute delta for the server's escrow replay; no donation command yet), the
  ctx.hallFunds primitive with its sim_context.test.ts fake-host and live-view pins, the
  freehold/ CLAUDE.md rows; tests/freehold_guildhall.test.ts and
  tests/freehold_hall_fund.test.ts.
- Agent CONTENT-LAYOUT: the `meeting_hall` row in tiers.ts (rooms 1, decor budget 60,
  plinths 4, amenity slots 1, the 2x decay flag for Phase 29; deep-frozen),
  MEETING_HALL_LAYOUT in src/sim/content/freehold/layouts.ts (D23) with the six interior
  touch points and the render variant under src/render/freehold/, the feast-hall table and board anchors reserved as decor keys
  for Phase 30, the world-entity name, `npm run wiki:content` plus a guide.* key, a
  Homesteader-family deed row appended at the END of deeds.ts only if the contract
  requires one (record the decision).
- Agent SERVER: server/freehold_db.ts gains `guild_freeholds` (additive, idempotent,
  keep-forever comment, the rev upsert) and `guild_hall_funds (guild_id PK, data JSONB
  CHECK object, updated_at)` merged with the guild-bank escrow-delta idiom
  (session-owned unflushed deltas, size-bounded, written inside the character save
  transaction), a lazy load at first member claim beside the guild bank loader, the
  `ghall` self key emitted for members inside the hall (strict decode sibling), the
  guild id resolved from the session for every guildhall command, exportAccountData rows
  for donor-linked ledger entries, tests/server/freehold_db.test.ts extended with the
  fake pool and the pg-armed twin (round trip, guild delete cascade, a pre-feature guild
  loads null, a stale rev refused).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- One system: no second module; the guild record is the same FreeholdState with an
  owner kind; guests enter under the guild key as party members join a claim (D15).
- Determinism: no Rng; no wall clock in src/sim/; the guild id enters as a host stamp.
- Server authority: rank and membership come from the server-stamped guildMembership,
  never the payload; a shared book is never persisted whole by one session (deltas only).
- Persistence: additive idempotent DDL, JSONB back-compat, an index for every new
  predicate, keep-forever stated for the two tables, export rows for account-linked
  data, a save/load round trip with the fake pool and the pg-armed twin.
- Token firewall: the Hall Fund's Claudium balance is a number the server mirrors after
  the economy service confirms a donation; the sim never prices, burns, or splits;
  no on-chain vocabulary in src/sim/ (wallet, token, $WOC, mint, holder, marketplace,
  on-chain, Solana, the on-chain Freehold Charter deed), the state.md scope; the Book of
  Deeds is game content, never firewall vocabulary.
- Never sell power; nothing destroyed; the hall's door always opens for members.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Purchase, donations, the donation cap, 2x decay, the contribution log (Phase 29); the
  guild bank chest, feast hall, boards, hall-shared stations (Phase 30); guild deeds
  (Phase 31); Great Hall and above (Phase 32).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_guildhall.test.ts tests/freehold_hall_fund.test.ts
  tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/env_protocol.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_wire.test.ts
  tests/server/main_retention_wiring.test.ts tests/deeds_content.test.ts
  tests/renderer_compile_gate.test.ts tests/dungeons.test.ts
  tests/localization_fixes.test.ts` plus the guild bank suites unchanged; `npm run
  wiki:content` then `npx vitest run tests/guide.test.ts`; the pg-armed twin after
  `npm run db:up`; goldens regenerated in their own commit if an emit changed.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  migration-safety (the two tables, the merge idiom), privacy-security-review (rank and
  membership stamping, server/ and src/net/), architecture-reviewer (the owner kind,
  permissions, the ctx primitive), plus cross-platform-sync (the facet and the second
  self key) and database-performance-reviewer (new tables and the lazy load) because the
  diff touches those surfaces. Prompt each for COVERAGE not filtering; each writes its
  report to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the guild owner kind, rank permissions, and the Hall Fund escrow
- feat(content): add the Meeting Hall tier and layout
- feat(server): persist guild freeholds and the Hall Fund beside the guild bank
- test(server): round-trip the guild tables against the fake pool and Postgres
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_guildhall.test.ts proves: two members of one guild share one claim
  and party membership is ignored; a non-member is refused `no_guild`; a member views
  and is refused `not_officer` on every edit command; an officer and the leader edit;
  the same seed gives the same hall on both hosts.
- [ ] tests/freehold_hall_fund.test.ts proves load, serialize, and evict are idempotent,
  every mutation is an absolute delta, and the ledger is bounded.
- [ ] tests/server/freehold_db.test.ts pins the two tables' DDL text, round-trips both
  against the fake pool and Postgres, cascades on guild delete, loads null for a
  pre-feature guild, and refuses a stale rev.
- [ ] The Meeting Hall renders on proximity; the ghall key decodes strictly; the RL
  exclusion pin stays green.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise; state.md records the STEP 1 decisions.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 28, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 28: new files, members, the self
  key, tables, i18n keys; the tier table's Meeting Hall row; the STEP 1 decisions as
  locked).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-28-qa.md

STOPPING RULES:
- Stop and ask if the Hall Fund's Claudium balance cannot be modelled as a server mirror
  of service-confirmed donations (a service-side pooled account is an O1 contract item,
  not a game decision).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
