# Phase 07: persistence (the account_freeholds row, load at join, the rev-fenced save path)

Wave A, the Cottage MVP. The spec is `progress.md` "07 Persistence"; the decisions are
`state.md` D5 and D16 (account state in its own row, a Sim-owned live map keyed by owner
key, a rev compare-and-swap upsert) and `brainstorm.md` D5. This phase ships the durable
home of every later phase's state: the `account_freeholds` table, the fresh-join read
into `joinMeta`, `loadFreehold` / `serializeFreehold` / `evictFreehold` with
`normalizeFreehold`, the per-owner serial writer on the server, the account export and
delete obligations, the `/dev freehold <tier>` grant (D24, through the one tier setter
Phase 15 reuses), and the pin that offline and headless hosts persist nothing (a fresh
Sim starts every entry with the default Inn Room record). A house survives a server
restart and a relog online; nothing player-visible changes yet.

### Starter Prompt
```
This is Phase 07 of the Freeholds and Guildhalls feature: persistence (the
account_freeholds row, the fresh-join read, normalize and serialize, the rev-fenced save
path, export and delete, the dev grant, the offline default pin).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three independent slices with two shared pin files).

Goal: give the freehold record a durable account-level home on the server (one row per
account, rev-fenced, exported and cascade-deleted), loaded once at join into the
Sim-owned live map and written back on the existing save cadence, so a house survives
restart and relog online; offline and headless hosts persist nothing and start every
entry with the default Inn Room record, pinned; the /dev freehold <tier> grant sets the
tier through one setter on both dev paths and is refused without ALLOW_DEV_COMMANDS=1.

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
- Memory scan: MEMORY.md and entries on Postgres and the schema module pattern, the
  retention sweep wiring pin, the monolith ratchet, test-pin traps (prove tests RAN, strip
  comments before a source pin), the shared-worktree commit care.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "07 Persistence"), and this file
- server/db.ts (SCHEMA, the hand-ordered ensureSchema domain list after SCHEMA with its
  FK comments, bankBonusFactsForAccount, exportAccountData), server/seeker_entitlement_db.ts
  (SEEKER_ENTITLEMENT_SCHEMA with its keep-forever DDL comment), server/woc_market_db.ts
  (WOC_MARKET_SCHEMA, a JSONB CHECK example), server/schema_notices.ts
- server/ws_auth.ts (createWsAuth: the fresh-join arm that awaits bankBonusForAccount and
  loadAccountCosmetics and stamps joinMeta; the resume arm that keeps in-memory values),
  server/bank_entitlements.ts (the account facts registry), server/game.ts (join and
  planJoin, characterSaveQueues, enqueueCharacterWrite, flushPeriodicSaves, saveAll, the
  leave path and final-session teardown), server/serial_writer.ts (createKeyedSerialWriter),
  server/periodic_save_flush.ts (runPeriodicSaveFlush: each write exactly once)
- server/guild_bank_state.ts (loadGuildBanksIntoSim, mergeGuildBankRow,
  GUILD_BANK_MERGED_MAX_BYTES: the boot-load and escrow shape, to CONTRAST with D16's rev
  compare-and-swap, never to copy the escrow merge), src/sim/guild_bank.ts (loadGuildBank,
  serializeGuildBank, evictGuildBank: the D16 load/serialize/evict idiom)
- src/sim/professions/farm_persist.ts (serializeFarmPlots, normalizeFarmPlots, the
  FARM_MAX_GROW_MS tamper ceiling, the clock-base banner: absolute deadlines in the host's
  own lockoutNowMs base, a save is loaded only by the same kind of host that wrote it),
  src/sim/professions/farm_load_report.ts (the dev-channel dropped-row warn),
  src/sim/character_state.ts (the optional-field zero-default-omission comments)
- src/sim/freehold/{types.ts,state.ts,instance.ts,index.ts,CLAUDE.md} as Phases 01 to 06
  left them (FreeholdState, ctx.freeholds, the meta.freeholdOwnerKey stamp, the claim
  rehydrate path), src/sim/sim.ts addPlayer options (bankBonus and applyBankBonusStamp in
  src/sim/bank.ts: the ONE writer of a host-stamped field), src/sim/sim_context.ts
- server/account_export_state.ts (projectAccountExportState), server/character_delete_db.ts
  (the delete refusal shape; a freehold row is ACCOUNT-keyed and untouched by character
  delete), server/retention_sweep.ts (createRetentionSweep), tests/server/main_retention_wiring.test.ts,
  server/CLAUDE.md ("Hot paths": nothing per tick queries Postgres; every growing table
  registers a prune or states keep-forever)
- src/main.ts (the offline `new Sim({...})` entry: a fresh Sim on every entry, nothing
  persisted; the pinned rule in tests/professions_farming_state.test.ts says every
  serializeCharacter caller lives in server/), headless/env_server.ts (the env constructs
  its own Sim the same way), headless/CLAUDE.md (the housing cut)
- src/sim/dev_commands.ts (handleDevChat: the /dev verb dispatch behind the Sim's
  devCommands flag), src/sim/dev_kit.ts, src/sim/sim.ts (devCommands from cfg; the
  '/dev bot' arm as the gated-verb model), server/sim_boot_config.ts (devCommands:
  ALLOW_DEV_COMMANDS === '1' into the realm Sim, so the server dev path shares the ONE
  gate), tests/dev_commands.test.ts (the devSim fixture and the refusal shape without the
  flag), src/sim/content/freehold/tiers.ts (FREEHOLD_TIERS: what the tier setter
  re-derives), src/sim/freehold/hearth_key.ts (the Phase 06 cooldown logic that now reads
  and writes hearth_key_ready_ms on the record)
- tests/server/storage_purchase_db.test.ts and tests/server/storage_purchase_db.pg.test.ts
  (the fake-pool suite plus the pg-armed twin in a PRIVATE schema, describe.skip unless
  TEST_DATABASE_URL), tests/guild_bank_db.test.ts, tests/guild_bank_persistence.test.ts,
  tests/guild_bank_pg_integration.test.ts, tests/professions_farming_state.test.ts (round
  trip, one-corrupt-dimension-per-arm, the real-Sim round trip, the cross-clock pin)
- tests/monolith_budget.test.ts (sim.ts, game.ts, online.ts, db.ts rows), tests/sim_context.test.ts
- Root CLAUDE.md "Invariants" and "Modularity"; docs/freeholds/implementation-plan.md
  "Cross-cutting gates" (the persistence gate)
The agent returns: the DDL text to write (every column from progress.md, the JSONB
CHECKs, the keep-forever comment, the ledger_paid_week index) and the exact ensureSchema
insertion point; the fresh-join read recipe (one round trip beside bankBonusFactsForAccount,
the joinMeta field, the addPlayer option, the stamp writer); the serial-writer shape and
the three save moments (autosave cadence, leave, shutdown) with the eviction point when
the account's last character leaves; the export projection row; the delete-cascade proof;
the normalizeFreehold arm list (tier allowlist, furnishing id allowlist, plinth id
allowlist, cell bounds, condition clamped 0 to 100, condition_stamp_day, last_seen_day,
and ledger_paid_week as non-negative realm-calendar integers with a future value
re-anchored to today, prepaid_weeks clamped 0 to 4, hearth_key_ready_ms as an absolute ms
in the host clock base with a far-future value clamped to the 60-minute literal,
visit_policy allowlist, never destroys); the dev-command dispatch arm and the one
devCommands gate both hosts share; the offline default recipe (where a fresh Sim's
addPlayer mints the Inn Room record with no raw row, on the offline and the headless
construction sites); the extraction candidates in sim.ts, game.ts, and db.ts that pay
for the new lines.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last:
tests/sim_context.test.ts if a primitive is added, tests/monolith_budget.test.ts):
- Agent DB: server/freehold_db.ts (FREEHOLD_SCHEMA with account_freeholds exactly as
  progress.md lists it: tier, layout JSONB, trophies JSONB, condition, condition_stamp_day,
  ledger_paid_week, prepaid_weeks, last_seen_day, hearth_key_ready_ms, visit_policy, rev,
  updated_at; the keep-forever DDL comment; CREATE INDEX IF NOT EXISTS on
  ledger_paid_week; FreeholdRow; freeholdForAccount(pool, accountId); upsertFreehold(pool,
  row, expectedRev) as ONE statement whose WHERE carries the rev compare-and-swap and
  whose result reports refused-stale, never merges), the one ensureSchema line in
  server/db.ts placed after SCHEMA with the FK comment, the exportAccountData row (the
  projection strips nothing hidden today but goes through one named projector so a later
  hidden field has a home), tests/server/freehold_db.test.ts (fake pool: DDL text pins for
  the columns, the CHECKs, the index, the keep-forever comment; the CAS refusal; the
  export row) and tests/server/freehold_db.pg.test.ts (private schema, drop in beforeAll
  and afterAll: round trip, the stale-rev refusal against real Postgres, ON DELETE CASCADE
  proven by deleting the account).
- Agent SIM: src/sim/freehold/state.ts (loadFreehold(ctx, ownerKey, raw) as the ONE
  write-in path through normalizeFreehold; serializeFreehold(ctx, ownerKey) as a deep
  clone, null when unloaded; evictFreehold; the Inn Room default for a pre-feature
  account: tier 0, empty layout, three empty plinths, condition 100), the PersistedFreehold
  shape in src/sim/freehold/types.ts (optional fields, zero-default omission,
  condition_stamp_day, last_seen_day, and ledger_paid_week as realm-calendar integers,
  hearth_key_ready_ms as an absolute ms in the host clock base), setFreeholdTier(ctx,
  ownerKey, tier) as the ONE tier writer (re-derives budget, plinths, and slots from
  FREEHOLD_TIERS, never touches the layout; the dev grant here and Phase 15's Charter
  grant both call it), the /dev freehold <tier> arm in src/sim/dev_commands.ts
  handleDevChat (offline and the server dev path share the Sim's devCommands flag fed
  from ALLOW_DEV_COMMANDS=1; refused without it), the addPlayer option that carries the raw row and
  calls loadFreehold once per owner key (a second character of the same account online
  finds the record already loaded and must NOT reload it), the dev-channel dropped-row
  warn on the farm_load_report shape, the sim.ts extraction that pays for the option
  line and the lowered sim.ts ceiling, tests/freehold_state.test.ts (pure round trip;
  one-corrupt-dimension-per-arm: bad tier, unknown furnishing id, unknown plinth id, a
  cell outside every room, condition above 100 and below 0, a negative or future
  condition_stamp_day, last_seen_day, or ledger_paid_week, prepaid_weeks above 4, a
  non-finite or far-future hearth_key_ready_ms, an unknown visit_policy; each arm drops
  or clamps its own field and never the whole house; the
  pre-feature account loads the Inn Room default; the cross-clock pin; the real-Sim
  round trip through addPlayer; same seed same state), and
  tests/freehold_offline_default.test.ts (D16: a Sim constructed the way src/main.ts
  constructs the offline world, and the headless env's Sim, each start with the default
  Inn Room record under the entity:<pid> owner key with no raw row; and no file under
  src/game/, src/main.ts, src/net/, or headless/ that names the freehold also touches
  localStorage, sessionStorage, or indexedDB, scanned with comments stripped and failing
  closed on an unreadable file), and tests/freehold_dev_grant.test.ts (setFreeholdTier
  re-derives the tier record and keeps the layout; /dev freehold cottage succeeds on a
  devCommands Sim and is refused on a Sim without the flag; an unknown tier refuses; the
  server path shares the gate through server/sim_boot_config.ts).
- Agent SERVER-SAVE: server/freehold_persist.ts (a createKeyedSerialWriter<string> keyed
  by owner key; saveFreehold(host, ownerKey, reason) that serializes through the sim,
  stamps last_seen_day from the realm day at join and at leave (the away-pause source
  Phase 13 reads), bumps rev, calls upsertFreehold with the rev it loaded, and on a stale
  refusal warns
  once on the dev channel and reloads the row into the live map rather than retrying
  blind; hooks: the autosave cadence inside runPeriodicSaveFlush (exactly once per flush,
  only for dirty owners), the leave path, saveAll on SIGINT/SIGTERM; evictFreehold when
  the account's last character leaves), the fresh-join read beside bankBonusForAccount in
  server/ws_auth.ts threaded through joinMeta into addPlayer, the game.ts extraction that
  pays for the join and save lines with a lowered game.ts ceiling,
  tests/server/freehold_persist.test.ts (a fake host: dirty-only writes, the three
  moments, the stale-rev warn-and-reload, eviction only after the last character,
  last_seen_day stamped at join and at leave, nothing per tick touches the pool).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: no wall clock in src/sim/; day and week stamps are realm-calendar
  integers (ctx.resetDay) and hearth_key_ready_ms is an absolute ms in the host's own
  ctx.lockoutNowMs() base following the facet's housingNowMs() clock-base contract; the
  load path draws no Rng and re-anchors, never re-rolls.
- D5 and D16: the freehold is ACCOUNT state in its own row, never in the character blob;
  the live record is keyed by owner key so two characters of one account share it; the
  server row is the truth and the live map is a cache; a stale write is refused, never
  merged; offline and headless hosts persist NOTHING and start every entry with the
  default Inn Room record (pinned).
- Never destroys: normalizeFreehold drops or clamps the offending FIELD; a pre-feature or
  malformed row loads the Inn Room default rather than nothing; no path removes a
  furnishing or trophy except the owner's own command (Phase 08).
- The persistence gate (docs/freeholds/implementation-plan.md "Cross-cutting gates"):
  additive idempotent inline DDL only, JSONB back-compat for every older row, an index
  for every new predicate, a keep-forever DDL comment (this table never grows per
  event), the exportAccountData row, the fake-pool round trip plus the pg-armed twin.
- Server hot path: nothing per tick queries Postgres; the join read is ONE round trip;
  saves ride the existing cadence through the serial writer.
- Server authority and the token firewall as state.md scopes it: no on-chain vocabulary
  in src/sim/ (wallet, token, $WOC, mint, holder, marketplace, on-chain, Solana, the
  on-chain Freehold Charter deed); the Book of Deeds (deed ids, deedsEarned) is game
  content and not firewall vocabulary; the row carries no on-chain field and no price;
  the flag stays default off and untouched.
- i18n: the policy in docs/freeholds/implementation-plan.md; this phase adds no player
  string (the rev warning is dev-channel English).
- Monolith ratchet: src/sim/sim.ts, server/game.ts, and src/net/online.ts sit at ZERO
  slack; every option, join, or save line added is paid for by an extraction, then LOWER
  the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Placement validation, the layout rows' semantics, the freeholdState descriptor, and the
  fhold self key (Phase 08): this phase stores the layout JSONB opaquely and validates
  only ids and bounds.
- Condition derivation and ledger math (Phase 13): this phase stores condition,
  condition_stamp_day, ledger_paid_week, prepaid_weeks, and last_seen_day as columns and
  clamps them; the Hearth Key's Phase 06 cooldown logic simply reads and writes
  hearth_key_ready_ms on the record now, with no other Hearth Key change.
- Any Charter or tier grant beyond the dev command (Phase 15 reuses setFreeholdTier).
- The Charter grant and any Claudium path (Phase 15); visit_policy semantics (Phase 18):
  stored, defaulted to friends, not read.
- Any REST route, any retention prune (the table is keep-forever), any change to the
  character save transaction.
- Any offline or headless persistence (D16: none exists and none is added; a fresh Sim
  starts with the default record).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_db.test.ts
  tests/server/freehold_persist.test.ts tests/freehold_state.test.ts
  tests/freehold_offline_default.test.ts tests/freehold_dev_grant.test.ts
  tests/dev_commands.test.ts tests/server/main_retention_wiring.test.ts
  tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts
  tests/api_error_code_parity.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/localization_fixes.test.ts
  tests/dungeon_instance_disconnect_reset.test.ts tests/professions_farming_state.test.ts
  tests/env_protocol.test.ts`; then `npm run db:up` and
  `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook npx vitest run
  tests/server/freehold_db.pg.test.ts`; a same-seed determinism case lives in
  tests/freehold_state.test.ts.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  migration-safety (the DDL, the JSONB shape, the load path), database-performance-reviewer
  (the join read, the CAS upsert, the index, the save cadence), privacy-security-review
  (server/ and the export row, the dev-command gate), server-hot-path-reviewer (the
  per-session join read and the per-flush save path), and architecture-reviewer for the
  src/sim/ slice (the addPlayer option, the tier setter, the dev arm, and the sim.ts
  extraction). Prompt each for COVERAGE not filtering;
  each writes its report to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(server): add the account_freeholds table with rev-fenced reads and writes
- feat(sim): load, normalize, serialize, and evict the freehold record by owner key
- feat(server): persist the freehold through a per-owner serial writer at join, autosave, leave, and shutdown
- feat(sim): add the /dev freehold tier grant through the one tier setter
- test(sim): pin the default Inn Room record on a fresh offline and headless Sim
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] FREEHOLD_SCHEMA carries every column in progress.md "07 Persistence" with the JSONB
  CHECKs, the keep-forever comment, and the ledger_paid_week index; applied by
  ensureSchema after SCHEMA; the DDL text is pinned by literal in
  tests/server/freehold_db.test.ts.
- [ ] /dev freehold cottage sets the tier through setFreeholdTier on a devCommands Sim
  and on the server dev path under ALLOW_DEV_COMMANDS=1, and is refused without the flag
  (pinned); last_seen_day is written at join and at leave (pinned).
- [ ] freeholdForAccount runs once at fresh join beside bankBonusFactsForAccount and lands
  in the live map through loadFreehold; a resume reloads nothing; a second character of
  the same account shares the loaded record (pinned).
- [ ] upsertFreehold refuses a stale rev (fake pool AND real Postgres); the server warns
  on the dev channel and reloads; no merge path exists.
- [ ] normalizeFreehold has one negative case per arm and never drops the house; a
  pre-feature account loads the Inn Room default; the cross-clock pin passes.
- [ ] exportAccountData includes the row; deleting the account cascades the row (pg twin);
  tests/server/main_retention_wiring.test.ts is unchanged and keep-forever is stated in
  the DDL.
- [ ] A house survives a server restart and a relog online (the pg round trip plus the
  join read); a fresh offline Sim and the headless env start with the default Inn Room
  record and no offline or headless code path writes storage for it (pinned in
  tests/freehold_offline_default.test.ts).
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; sim.ts and game.ts
  ceilings are LOWER than before.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 07, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 07: new files, the table, the
  addPlayer option name, the tier setter name, the dev command, the offline default
  pin).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07-qa.md

STOPPING RULES:
- Stop and ask if the DDL would need anything non-additive (a column type change, a
  dropped constraint) or if the row cannot be keyed by account_id alone.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
