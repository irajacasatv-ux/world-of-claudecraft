# Phase 05: the owner-keyed instance claim

Wave A, the Cottage MVP. The spec is `progress.md` "05 Instance claim"; the decisions are
`state.md` D15 (the freehold rides the dungeon slot pool, owner-keyed: two `DungeonDef`
records at index 15 and 16, `claimKey`, the `freeholdOwnerKey` stamp, `META_EXCLUDE`) and
D16 (live state is the Sim-owned `ctx.freeholds` map keyed by owner key) and D81 (05 creates
every account's in-memory tier-0 Inn Room record and the D24 development grant fixture; 07
persists the record without changing its identity). This phase makes `freehold_enter` and
`freehold_leave` real on both hosts with a placeholder interior; the gate, the Hearth Key,
and the real layouts are Phase 06, and they depend on this phase, not on 07.

### Starter Prompt
```
This is Phase 05 of the Freeholds and Guildhalls feature: the instance claim (two
DungeonDef records on the dungeon slot pool, DungeonDef.claimKey, the freeholdOwnerKey
stamp, owner-keyed enter and leave on both hosts).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over one seam change).

Goal: claim a freehold instance by OWNER key (account online, entity offline) instead of
party key, so two characters of one account share one live house and a relog rebinds, with
occupancy and reaping riding updateInstances unchanged, text-free refusals, the dispatch
lit on the server behind the flag, every account's default tier-0 Inn Room record created
in memory at join, and the D24 development grant fixture (D81) that 06's perf tour and
Cottage captures use.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the monolith ratchet (sim.ts and game.ts at zero
  slack), parity goldens and META_EXCLUDE, the S3 i18n guard (dungeon enter lines),
  sim_context callback pins, the jailed command set, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (D15, D16, D81, D85, the gotchas), docs/freeholds/progress.md
  (only "05 Instance claim"), and this file
- src/sim/types.ts (DungeonDef and the interior union, INSTANCE_EMPTY_TIMEOUT, the
  SimEvent union and the farmDenied model with its append-only reason enum),
  src/sim/sim.ts (the InstanceSlot interface, the ctor slot pre-allocation and door
  spawn, addPlayer's options and the applyBankBonusStamp call, removePlayer, the
  freeholdEnter and freeholdLeave stub delegates from Phase 01), src/sim/bank.ts
  (applyBankBonusStamp, the one host-stamp writer), src/sim/professions/feast.ts
  (feastOwnerKey), src/sim/freehold/{types.ts,state.ts,index.ts,CLAUDE.md} (Phase 01),
  src/sim/sim_context.ts (instances, enterDungeon, leaveDungeon, instanceKeyFor)
- src/sim/instances/dungeons.ts (instanceKeyFor, enterDungeon and its options,
  claimInstance, freeInstance, leaveDungeon, detachFromDungeon, updateInstances,
  updateDoorTriggers, resetDungeonInstances, instanceAt, instanceClaimContains),
  src/sim/instances/instance_slot.ts, src/sim/data.ts (instanceOrigin, instanceOriginX,
  DUNGEON_OVERFLOW_X_BASE, dungeonAt, the DUNGEONS merge and DUNGEON_LIST,
  INSTANCE_SLOT_COUNT, instanceSlotForZ), src/sim/content/dungeon_finder.ts
  (FINDER_ACTIVITIES), the dungeon def tables
  (DUNGEON_DEFS, TEMPLE_DUNGEON_DEFS, WILDHEART_DUNGEON_DEFS; the Dawnhold record as the
  walk-in model), src/sim/vault_craft_gate.ts (header only), src/sim/colliders.ts
  (isInstancedRegion, instanceLocal by x band), src/sim/world.ts (the groundHeight
  dungeon branch)
- server/game.ts (join and planJoin, the addPlayer call, the dispatch preamble:
  JAILED_BLOCKED_COMMANDS, refusedRiftForgeCommand, heavySelfMarkOnReceipt, the
  freehold case labels from Phase 01), server/ws_auth.ts (fresh-join joinMeta assembly
  beside the injected bankBonusForAccount callback), server/main.ts (the
  bankBonusForAccount binding: on the packet base it is a one-liner around
  computeBankBonus(await bankBonusFactsForAccount(id)); the QA's release-merge audit
  at 553a5672ed found the release did NOT widen it (no characterCount closure exists
  on that tip), so the freeholdForAccount twin copies the one-liner shape; re-verify
  at 07's start after its own merge-forward),
  server/db.ts (bankBonusFactsForAccount export), server/bank_entitlements.ts
  (computeBankBonus export), server/freehold_wire.ts (Phase 01), server/heavy_self.ts
  (HEAVY_SELF_CMDS and the vault_buy_upgrade rationale), server/farming_commands.ts (the
  accept-return shape), server/linkdead.ts, server/CLAUDE.md "Hot paths"
- src/net/online.ts (the freeholdEnter and freeholdLeave one-liners; the dungeonEntrySeq
  camera read), src/ui/system_text_i18n.ts localizeSystemText (extracted from hud.ts by
  the release's aura-tracks work; its DUNGEON_LIST loop matches every
  DungeonDef.enterText and leaveText by exact bytes and resolves dungeonText from
  src/ui/entity_display_core.ts), the entities.dungeons.<id>.enterText/leaveText catalog
  rows (the dungeons block of src/ui/i18n.catalog/merge.ts; src/ui/sim_i18n.ts carries
  NO dungeon rows, so add nothing there), tests/localization_fixes.test.ts
- tests/dungeons.test.ts (the slim-world recipe and the teleport helper),
  tests/dungeon_instance_disconnect_reset.test.ts (the online relog model),
  tests/parity/trace.ts (META_EXCLUDE), tests/parity/scenarios.ts (dungeon_instances),
  tests/parity/record.ts (Scenario), tests/sim_context.test.ts,
  tests/monolith_budget.test.ts, tests/server/freehold_wire.test.ts,
  tests/command_schema.test.ts, tests/guide.test.ts, the behavioral jailed pin in
  tests/moderation_game.test.ts (JAILED_BLOCKED_COMMANDS itself is a private const in
  server/game.ts that no test names; this phase adds the freehold_enter pin to
  tests/freehold_instance_online.test.ts)
- src/sim/CLAUDE.md, the local CLAUDE.md under src/sim/instances/ if present
- docs/freeholds/implementation-plan.md "Developer fixtures" (the exact dev-only loopback
  bridge contract this phase now delivers under D81), vite.config.ts (configureServer and
  the existing defineConfig shape), src/main.ts (the offline Sim constructor and its
  bootstrap), the existing /dev chat command router in src/sim/ (grep `devCommands`),
  scripts/enter_offline_game.mjs (the fixture entry the captures reuse),
  scripts/lib/loopback_guard.mjs (assertLoopbackUrl) and
  .claude/skills/pr-screenshots/SKILL.md
The agent returns: the exact enterDungeon control flow and where a `claimKey === 'owner'`
branch resolves its key; the append-only export of claimInstance and freeInstance; the
addPlayer option and the one-writer stamp recipe; the joinMeta path from the account id;
the record fields for index 15 and 16 (overflow band math, entry inside the placeholder
interior's floor, overworldDoor false, guideVisible false, suggestedPlayers 1) and which
existing interior string is a walkable placeholder; the entities.dungeons catalog rows to
add for the two new dungeon ids (the localizeSystemText loop covers them once the rows
exist); the parity scenario and META_EXCLUDE recipe; the extraction candidates in sim.ts
and game.ts that pay for the new lines; how resetDungeonInstances and FINDER_ACTIVITIES
must ignore the new defs; where the default tier-0 record is seeded at addPlayer and the
setFreeholdTier setter shape; the /dev chat router arm and the loopback bridge sites.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. The two owner-claim DungeonDefs and all content/finder/reset/parity exclusions.
2. Host-stamped owner resolution, every account's default tier-0 Inn Room record, the D24
   dev grant fixture and deterministic claim/leave/reap behavior.
3. Thin flag-gated server dispatch, jailed refusal and same-account session sharing.
4. The authoritative arrival identity/pose and decisive offline/online parity tests.

A slot is a runtime cache, not durable ownership. 07 gives every plot stable public
identity; 07a fences one active authoritative plot claim across realms. The wave PR
includes 07a (D12: one PR per wave), so no production build carries this claim without
07a's fence and this phase adds no second gate; online entry works through the real
dispatch in its tests. The server cannot turn a full runtime pool or foreign-realm fence
into a new ownership queue or loss: emit the append-only reason `busy` through
freeholdDenied, leaving state and location unchanged.
All sessions stamped to the owner account resolve the same primary plot and are excluded
from the later visitor count. Different account stamps cannot request an internal owner
key through client payloads. The offline entity key is stable within its Sim only.
Every owner key holds a record (D2, D81): addPlayer seeds the in-memory tier-0 Inn Room
record for a key ctx.freeholds does not yet hold, on both hosts, so a fresh offline Sim
enters its Inn Room with no seeding step and the online path holds the same record until
07 loads and persists it under the same identity. `no_freehold` therefore fires only for
a key whose record was evicted or never created (a dark realm), never for a fresh player.
The D24 fixture lands here too: setFreeholdTier in src/sim/freehold/state.ts is the ONE
tier writer and `/dev freehold <tier>` sets the record's tier through it, refused without
authorization (pinned); it is what 06's perf tour and Cottage captures use.

Reuse the existing confirmed dungeonEntrySeq arrival identity and an authored safe
position/facing with entry. 07 assigns the public plot ID that 08a adds to the descriptor.
06 and 09 consume it for gate handoff and camera/audio;
resume of the same arrival must not replay the welcome. The event must not expose raw
account/guild keys. Preserve the verified bankBonusForAccount callback path in STEP 1.

Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: src/sim/types.ts `DungeonDef.claimKey?: 'party' | 'owner'` (append-only,
  default party), src/sim/content/freehold/dungeons.ts with `freehold_inn_room` (index 15)
  and `freehold_cottage` (index 16): `claimKey: 'owner'`, `spawns: []`, `npcs` empty until
  Phase 24 adds the farmer NPC (do not pin it empty), no objects, `overworldDoor: false`,
  `guideVisible: false`, `suggestedPlayers: 1`, the placeholder interior STEP 1 named
  (recorded in state.md as the Phase 06 swap), doorPos at the planned Eastbrook quay gate
  spot, enterText and leaveText with their entities.dungeons.<id> catalog rows added in
  the same change so localizeSystemText resolves them (these dungeon log lines are the
  existing English emit D10 tolerates, so Phase 08's no-matcher-row invariant is not a
  contradiction); merged into DUNGEONS by src/sim/data.ts; absent from
  FINDER_ACTIVITIES
  (pinned); `npm run wiki:content` for the dungeon list freshness.
- Agent SIM: src/sim/freehold/instance.ts: `freeholdKeyFor(ctx, pid)` (meta.freeholdOwnerKey,
  else `entity:<pid>`), `freeholdDefForTier(tier)` (inn_room to index 15, cottage to 16),
  `enterFreehold(ctx, pid)` (dead and combat gates emit `freeholdDenied` with reasons
  `dead` and `combat`; no live record for the key emits `no_freehold`; a full slot pool
  for the def, and later 07a's foreign-realm fence, emit `busy` from the owner-key branch
  BEFORE enterDungeon's English ctx.error arms can run, with nothing moved and nothing
  claimed; the owner-key branch ignores party membership, so the raid-party arm never
  applies and no `party` reason exists; otherwise the owner-key claim through
  enterDungeon, rehydrating the live record from ctx.freeholds),
  `leaveFreehold(ctx, pid)` (leaveDungeon to the def's doorPos), and a pure
  `freeholdDescriptorFor(ctx, ownerKey)` read Phase 08 will emit; the owner-key branch in
  src/sim/instances/dungeons.ts enterDungeon (claimKey 'owner' resolves through the
  freehold module; resetDungeonInstances skips owner-keyed defs); the `freeholdDenied`
  SimEvent variant (`{ type, pid, reason }`, reasons in the append-only order no_freehold,
  locked, cooldown, visitors_full, not_friend, dead, combat, busy; the enum is append-only
  and later phases append their own ids at the END, never in the middle: Phase 06 appends
  instanced and match (the Hearth Key context refusals), Phase 08 appends not_owner,
  bags_full, and item_locked (the lock-aware item-copy twin, a different meaning from
  locked), Phase 13 appends short; of this phase's ids, locked is the
  amenity lockout below condition 30 and fires only from the amenities in Phase 12 (D22:
  entry, placement, and the ledger never lock on condition), cooldown in
  Phase 06, visitors_full and not_friend in Phase 18); the addPlayer option
  `freeholdOwnerKey` with its one-writer stamp in src/sim/freehold/state.ts and the
  offline fallback; the default-record seed in state.ts (`ensureFreeholdRecord(ctx,
  ownerKey)` creating the tier-0 `inn_room` record from the 03 tier table: empty layout,
  three empty plinths, tier-0 ledger and condition defaults, rev 0; called from addPlayer
  on both hosts; D81) and `setFreeholdTier(ctx, ownerKey, tier)` as the one tier writer;
  the `/dev freehold <tier>` chat arm on the existing dev command router, authorized only
  by devCommands AND, offline, the separate nonpersisted freeholdDevGrantEnabled
  permission the DEV FIXTURE slice supplies (the server path needs ALLOW_DEV_COMMANDS=1
  alone and keeps its ordinary setter behavior; 07 adds the save); the Sim delegate
  bodies (still one-liners); the sim.ts extraction that pays for the new lines and the
  LOWERED ceiling; tests/freehold_instance.test.ts (slim world: a fresh offline Sim
  enters its Inn Room with no seeding step, claim by owner key across two characters of
  one owner, party membership ignored, a party member with a different owner key gets its
  own claim, reap after INSTANCE_EMPTY_TIMEOUT, relog rebinds, dead and combat refused
  with nothing moved, all 24 slots of index 15 claimed and the 25th owner refused with
  reason `busy`, no `log` or error text and no position change, the same-seed
  determinism case); NEW tests/freehold_offline_default.test.ts (the default record exists
  for the entity key on a fresh Sim, a failed dev authorization still enters the Inn
  Room, nothing persists); NEW tests/freehold_dev_grant.test.ts (both permissions
  independently false and true, the real chat delegation, setFreeholdTier the sole tier
  writer, refusal without authorization pinned); META_EXCLUDE row with justification;
  the `freehold_claim` parity scenario in tests/parity/scenarios.ts (it opts in with
  `freeholdsEnabled: true`, D85).
- Agent SERVER: the join stamp (`account:<id>` from the account id already in join, built
  by a helper in server/freehold_wire.ts so game.ts gains one call, paid for by an
  extraction and a LOWERED game.ts ceiling); the lit dispatch arms in
  dispatchFreeholdCommand for freehold_enter and freehold_leave (dark refusal unchanged;
  the accept-return shape); `freehold_enter` added to JAILED_BLOCKED_COMMANDS (pinned in
  tests/freehold_instance_online.test.ts, the moderation_game.test.ts shape); the
  HEAVY_SELF_CMDS decision recorded (enter and leave move no heavy-gated self field
  until Phase 08a's `fhold` self key; add rows there); the server `/dev freehold <tier>`
  path under ALLOW_DEV_COMMANDS=1 (the ordinary dev command gate, refused otherwise,
  pinned);
  tests/server/freehold_wire.test.ts extended; tests/freehold_instance_online.test.ts on
  the disconnect-reset model (two sessions of one account share a claim; relog after
  linkdead grace rebinds; a jailed session cannot enter; a fresh account's first join
  holds the default record and enters).
- Agent DEV FIXTURE (D81; the exact contract is implementation-plan.md "Developer
  fixtures"): the dev-only loopback bridge GET /__freehold/dev-authorization (NEW
  scripts/lib/freehold_dev_authorization.mjs plus its .d.mts declaration, exporting
  freeholdDevAuthorizationPlugin({ enabled }) and a directly tested request predicate)
  inside vite.config.ts configureServer only (exact flag ALLOW_DEV_COMMANDS === '1',
  real socket plus Host
  diagnosticsReadAllowed, strict affirmative boolean, no-store, no preview or production
  endpoint, defineConfig({ ... }) and the Docker import admission preserved); the offline
  bootstrap in a src/game/ sibling module (NEW src/game/freehold_dev_bootstrap.ts
  exporting the injected, testable resolveOfflineFreeholdDevGrant) that src/main.ts
  calls once (DEV HTTP(S) loopback only, same-origin, no credentials, no cache, no
  redirect, strict payload, entry cancellation, false on any failure while ordinary Inn
  entry continues) and that sets the nonpersisted freeholdDevGrantEnabled permission (a
  readonly SimConfig/Sim/SimContext field, default false, with live context and
  fake-host pins; NEW src/sim/freehold/dev_grant.ts requires BOTH ctx.devCommands and
  this permission before calling setFreeholdTier, src/sim/dev_commands.ts contributes
  only thin delegation, and server/sim_boot_config.ts sets the permission from the same
  ALLOW_DEV_COMMANDS === '1' read); no public VITE_* switch, query or storage override,
  direct tier injection or fake receipt; browser fixture state never
  becomes online ownership; NEW tests/freehold_dev_authorization.test.ts and
  tests/freehold_dev_bootstrap.test.ts (ALLOW_DEV_COMMANDS exactly '1' versus
  unset/0/other strings, real
  socket and forged Host/Origin, absent/malformed/external/wildcard Host, wrong
  method/path, JSON shape and extra fields, no-store, redirect/HTML/error/refusal/
  cancellation, unsupported origin/protocol) and the tests/vite_dev_watch.test.ts and
  tests/dockerignore_context.test.ts extensions; any src/main.ts line paid for by a
  sibling extraction and a LOWERED main.ts ceiling.
The coordinator runs last: tests/sim_context.test.ts pins if a callback was appended, and
the parity goldens regenerated with `UPDATE_PARITY=1` in their OWN commit.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the claim draws no Rng (spawns are empty, so claimInstance draws nothing;
  pin the draw count at zero); no wall clock; the parity scenario proves same seed, same
  claim on both hosts.
- One sim, three hosts: the owner key is a host-stamped fact (account online, entity
  offline) and the module never reads an account id; the RL env still excludes housing.
- Server authority: the stamp comes from the session's account at join, never from the
  client; enter and leave are decided in the sim.
- Text-free events (D10): freeholdDenied carries a reason id (never a `log` line, not
  even for the full pool); the enter and leave lines reuse the dungeon log path, the one
  existing English emit D10 tolerates, and their entities.dungeons catalog rows land in
  the same change (the S3 guard); no other housing text is English.
- Nothing persists on the slot: the live record in ctx.freeholds is the truth Phase 07
  will persist; the slot is a cache rebuilt on every claim. The default record and the
  dev grant are in-memory facts here (D81): no SQL, no JSON, no receipt.
- Mixed-release tolerance: an OLD client drops freeholdDenied at its HUD event switch and
  a NEW client never sends freehold_enter without a visible surface (06 adds the first);
  the new dispatch arms tolerate an old client that never sends them.
- The flag: every housing command still refuses at dispatch while dark, pinned.
- The monolith note: sim.ts, game.ts, and online.ts are at ZERO slack; each new delegate,
  stamp line, or case is paid for by an extraction and a lowered ceiling.
- i18n: the contributor policy in docs/freeholds/implementation-plan.md.
- Token firewall (the state.md scope): no on-chain word (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana) in src/sim/; deed ids and deedsEarned are Book of Deeds
  game content, not firewall vocabulary.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The real interiors, the Eastbrook gate entity, the walk-in trigger, and the Hearth Key
  (Phase 06); the deny toast in the HUD (Phase 06).
- The account_freeholds row, any DDL and persisting the default record (Phase 07); the
  freeholdState event and the `fhold` self key (Phase 08a); visiting (Phase 18).
- Furnishing spawn, colliders, render, and UI.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_instance.test.ts
  tests/freehold_instance_online.test.ts tests/freehold_offline_default.test.ts
  tests/freehold_dev_grant.test.ts tests/freehold_dev_authorization.test.ts
  tests/freehold_dev_bootstrap.test.ts tests/vite_dev_watch.test.ts
  tests/dockerignore_context.test.ts tests/moderation_game.test.ts tests/dungeons.test.ts
  tests/dungeon_instance_disconnect_reset.test.ts tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts
  tests/localization_fixes.test.ts tests/env_protocol.test.ts
  tests/server/freehold_wire.test.ts tests/server/http/surface_inventory.test.ts`; the
  parity suite under tests/parity/ (red until regenerated, then green in its own commit);
  `npm run wiki:content` then `npx vitest run tests/guide.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the enterDungeon branch, the stamp writer, the extractions),
  cross-platform-sync (the event, the enter path on both hosts, the parity scenario),
  server-hot-path-reviewer (updateInstances with the remeasured slot allocation from the actual DUNGEON_LIST, the join stamp); the
  dispatch table adds content-obligations-reviewer (two src/sim/content/ records),
  privacy-security-review (the join stamp, the jailed set, the loopback bridge and the
  dev grant authorization), test-coverage-auditor (every pin), then qa-checklist (the
  completion gate). Prompt each for COVERAGE not filtering; each writes its report to a
  file. Do not commit until all findings, including nits, are resolved and freshly reviewed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer, cross-platform-sync, server-hot-path-reviewer, content-obligations-reviewer, privacy-security-review, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Inn Room and Cottage instance records with an owner claim key
- feat(sim): claim freehold instances by owner key on the dungeon slot pool
- feat(sim): seed the default Inn Room record and add the dev tier grant fixture
- feat(server): stamp the freehold owner key at join and light enter and leave dispatch
- test(parity): regenerate goldens for the freehold claim scenario
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/dungeons.test.ts is unchanged and green; tests/freehold_instance.test.ts and
  tests/freehold_instance_online.test.ts are green; goldens were regenerated in their own
  commit and the parity suite is green.
- [ ] Two characters of one account share one live claim (pinned); a party member with a
  different owner key does not (pinned); a relog rebinds after INSTANCE_EMPTY_TIMEOUT has
  not elapsed and reclaims after it has.
- [ ] A fresh offline Sim enters its Inn Room with no seeding step and a fresh account's
  first online join holds the default tier-0 record (both pinned; D81); with all 24 slots
  of the def claimed the 25th owner receives freeholdDenied `busy` with no text and no
  position change (pinned).
- [ ] `/dev freehold <tier>` sets the tier only through setFreeholdTier and is refused
  without authorization on both hosts (pinned in tests/freehold_dev_grant.test.ts); the
  loopback bridge and bootstrap pass every arm in tests/freehold_dev_authorization.test.ts
  and tests/freehold_dev_bootstrap.test.ts; a real flag-off browser starts in the Inn Room
  and refuses the Cottage, a flag-on loopback browser starts in the Inn Room and the
  actual command grants the Cottage.
- [ ] freehold_enter is in JAILED_BLOCKED_COMMANDS (pinned); both defs are absent from
  FINDER_ACTIVITIES and skipped by resetDungeonInstances (pinned).
- [ ] freeholdOwnerKey is in META_EXCLUDE with a justification; the S3 guard passes with
  the entities.dungeons rows for both new ids present.
- [ ] sim.ts and game.ts ceilings are LOWER than before; online.ts unchanged; main.ts is
  LOWER or unchanged.
- [ ] All STEP 3 suites green; architecture-reviewer and cross-platform-sync confirm ALL findings, including nits, are resolved and freshly reviewed (the other reviewers likewise).

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 05, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 05: new files, the SimEvent and its
  reason ids including busy, the two dungeon ids, the placeholder interior to swap in
  Phase 06, the HEAVY_SELF_CMDS decision, the default-record seed and the dev grant
  fixture as 05 outputs per D81; the `freehold/` row in src/sim/CLAUDE.md updated for
  instance.ts).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-05-qa.md

STOPPING RULES:
- Stop and ask if the owner-key branch cannot be added to enterDungeon without changing
  the party-key path for an existing dungeon (tests/dungeons.test.ts must stay untouched).
- Stop if paying for a delegate, stamp, or case line requires an extraction that changes
  behavior (move-not-rewrite), or if a monolith ceiling would have to be RAISED.
- Do not push the branch; never merge a PR.
```
