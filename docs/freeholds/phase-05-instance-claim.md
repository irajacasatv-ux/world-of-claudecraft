# Phase 05: the owner-keyed instance claim

Wave A, the Cottage MVP. The spec is `progress.md` "05 Instance claim"; the decisions are
`state.md` D15 (the freehold rides the dungeon slot pool, owner-keyed: two `DungeonDef`
records at index 15 and 16, `claimKey`, the `freeholdOwnerKey` stamp, `META_EXCLUDE`) and
D16 (live state is the Sim-owned `ctx.freeholds` map keyed by owner key). This phase makes
`freehold_enter` and `freehold_leave` real on both hosts with a placeholder interior; the
gate, the Hearth Key, and the real layouts are Phase 06.

### Starter Prompt
```
This is Phase 05 of the Freeholds and Guildhalls feature: the instance claim (two
DungeonDef records on the dungeon slot pool, DungeonDef.claimKey, the freeholdOwnerKey
stamp, owner-keyed enter and leave on both hosts).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over one seam change).

Goal: claim a freehold instance by OWNER key (account online, entity offline) instead of
party key, so two characters of one account share one live house and a relog rebinds, with
occupancy and reaping riding updateInstances unchanged, text-free refusals, and the
dispatch lit on the server behind the flag.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet (sim.ts and game.ts at zero
  slack), parity goldens and META_EXCLUDE, the S3 i18n guard (dungeon enter lines),
  sim_context callback pins, the jailed command set, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (D15, D16, the gotchas), docs/freeholds/progress.md (only
  "05 Instance claim"), and this file
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
  INSTANCE_SLOT_COUNT, instanceSlotForZ, FINDER_ACTIVITIES), the dungeon def tables
  (DUNGEON_DEFS, TEMPLE_DUNGEON_DEFS, WILDHEART_DUNGEON_DEFS; the Dawnhold record as the
  walk-in model), src/sim/vault_craft_gate.ts (header only), src/sim/colliders.ts
  (isInstancedRegion, instanceLocal by x band), src/sim/world.ts (the groundHeight
  dungeon branch)
- server/game.ts (join and planJoin, the addPlayer call and joinMeta, the dispatch
  preamble: JAILED_BLOCKED_COMMANDS, refusedRiftForgeCommand, heavySelfMarkOnReceipt,
  the freehold case labels from Phase 01), server/ws_auth.ts (joinMeta assembly beside
  bankBonusFactsForAccount), server/freehold_wire.ts (Phase 01), server/heavy_self.ts
  (HEAVY_SELF_CMDS and the vault_buy_upgrade rationale), server/farming_commands.ts (the
  accept-return shape), server/linkdead.ts, server/CLAUDE.md "Hot paths"
- src/net/online.ts (the freeholdEnter and freeholdLeave one-liners; the dungeonEntrySeq
  camera read), src/ui/sim_i18n.ts (how existing dungeon enterText and leaveText lines are
  matched: RULE or EXACT), tests/localization_fixes.test.ts
- tests/dungeons.test.ts (the slim-world recipe and the teleport helper),
  tests/dungeon_instance_disconnect_reset.test.ts (the online relog model),
  tests/parity/trace.ts (META_EXCLUDE), tests/parity/scenarios.ts (dungeon_instances),
  tests/parity/record.ts (Scenario), tests/sim_context.test.ts,
  tests/monolith_budget.test.ts, tests/server/freehold_wire.test.ts,
  tests/command_schema.test.ts, tests/guide.test.ts, the jailed-set pin (grep
  JAILED_BLOCKED_COMMANDS under tests/)
- src/sim/CLAUDE.md, the local CLAUDE.md under src/sim/instances/ if present
The agent returns: the exact enterDungeon control flow and where a `claimKey === 'owner'`
branch resolves its key; the append-only export of claimInstance and freeInstance; the
addPlayer option and the one-writer stamp recipe; the joinMeta path from the account id;
the record fields for index 15 and 16 (overflow band math, entry inside the placeholder
interior's floor, overworldDoor false, guideVisible false, suggestedPlayers 1) and which
existing interior string is a walkable placeholder; the matcher rule that covers the enter
and leave lines (or the EXACT rows to add); the parity scenario and META_EXCLUDE recipe;
the extraction candidates in sim.ts and game.ts that pay for the new lines; how
resetDungeonInstances and FINDER_ACTIVITIES must ignore the new defs.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent CONTENT: src/sim/types.ts `DungeonDef.claimKey?: 'party' | 'owner'` (append-only,
  default party), src/sim/content/freehold/dungeons.ts with `freehold_inn_room` (index 15)
  and `freehold_cottage` (index 16): `claimKey: 'owner'`, `spawns: []`, `npcs` empty until
  Phase 24 adds the farmer NPC (do not pin it empty), no objects, `overworldDoor: false`,
  `guideVisible: false`, `suggestedPlayers: 1`, the placeholder interior STEP 1 named
  (recorded in state.md as the Phase 06 swap), doorPos at the planned Eastbrook quay gate
  spot, enterText and leaveText covered by the matcher in the same change (these dungeon
  log lines are the existing English emit D10 tolerates, so Phase 08's no-matcher-row
  invariant is not a contradiction); merged into DUNGEONS by src/sim/data.ts; absent from
  FINDER_ACTIVITIES
  (pinned); `npm run wiki:content` for the dungeon list freshness.
- Agent SIM: src/sim/freehold/instance.ts: `freeholdKeyFor(ctx, pid)` (meta.freeholdOwnerKey,
  else `entity:<pid>`), `freeholdDefForTier(tier)` (inn_room to index 15, cottage to 16),
  `enterFreehold(ctx, pid)` (dead and combat gates emit `freeholdDenied` with reasons
  `dead` and `combat`; no live record for the key emits `no_freehold`; otherwise the
  owner-key claim through enterDungeon, rehydrating the live record from ctx.freeholds),
  `leaveFreehold(ctx, pid)` (leaveDungeon to the def's doorPos), and a pure
  `freeholdDescriptorFor(ctx, ownerKey)` read Phase 08 will emit; the owner-key branch in
  src/sim/instances/dungeons.ts enterDungeon (claimKey 'owner' resolves through the
  freehold module; resetDungeonInstances skips owner-keyed defs); the `freeholdDenied`
  SimEvent variant (`{ type, pid, reason }`, reasons in the append-only order no_freehold,
  locked, cooldown, visitors_full, not_friend, dead, combat; the enum is append-only and
  later phases append their own ids at the END, never in the middle: Phase 08 appends
  not_owner, bags_full, and item_locked (the lock-aware item-copy twin, a different
  meaning from locked), Phase 13 appends short; of this phase's ids, locked is the
  amenity lockout below condition 30 and fires only from the amenities in Phase 12 (D22:
  entry, placement, and the ledger never lock on condition), cooldown in
  Phase 06, visitors_full and not_friend in Phase 18); the addPlayer option
  `freeholdOwnerKey` with its one-writer stamp in src/sim/freehold/state.ts and the
  offline fallback; the Sim delegate bodies (still one-liners); the sim.ts extraction that
  pays for the new lines and the LOWERED ceiling; tests/freehold_instance.test.ts (slim
  world: claim by owner key across two characters of one owner, party membership ignored,
  a party member with a different owner key gets its own claim, reap after
  INSTANCE_EMPTY_TIMEOUT, relog rebinds, dead and combat refused with nothing moved, the
  same-seed determinism case); META_EXCLUDE row with justification; the `freehold_claim`
  parity scenario in tests/parity/scenarios.ts.
- Agent SERVER: the join stamp (`account:<id>` from the account id already in join, built
  by a helper in server/freehold_wire.ts so game.ts gains one call, paid for by an
  extraction and a LOWERED game.ts ceiling); the lit dispatch arms in
  dispatchFreeholdCommand for freehold_enter and freehold_leave (dark refusal unchanged;
  the accept-return shape); `freehold_enter` added to JAILED_BLOCKED_COMMANDS (pinned);
  the HEAVY_SELF_CMDS decision recorded (enter and leave move no heavy-gated self field
  until Phase 08's `fhold`; add rows there); tests/server/freehold_wire.test.ts extended;
  tests/freehold_instance_online.test.ts on the disconnect-reset model (two sessions of
  one account share a claim; relog after linkdead grace rebinds; a jailed session cannot
  enter).
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
- Text-free events (D10): freeholdDenied carries a reason id; the enter and leave lines
  reuse the dungeon log path, the one existing English emit D10 tolerates, and are
  matcher-covered in the same change (the S3 guard); no other housing text is English.
- Nothing persists on the slot: the live record in ctx.freeholds is the truth Phase 07
  will persist; the slot is a cache rebuilt on every claim.
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
- The account_freeholds row and any DDL (Phase 07); the freeholdState event and the
  `fhold` self key (Phase 08); visiting (Phase 18).
- Furnishing spawn, colliders, render, and UI.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_instance.test.ts
  tests/freehold_instance_online.test.ts tests/dungeons.test.ts
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
  server-hot-path-reviewer (updateInstances with 48 more slots, the join stamp); the
  dispatch table adds content-obligations-reviewer (two src/sim/content/ records) and
  privacy-security-review (the join stamp and the jailed set). Prompt each for COVERAGE
  not filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Inn Room and Cottage instance records with an owner claim key
- feat(sim): claim freehold instances by owner key on the dungeon slot pool
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
- [ ] freehold_enter is in JAILED_BLOCKED_COMMANDS (pinned); both defs are absent from
  FINDER_ACTIVITIES and skipped by resetDungeonInstances (pinned).
- [ ] freeholdOwnerKey is in META_EXCLUDE with a justification; the S3 guard passes with
  the enter and leave lines covered.
- [ ] sim.ts and game.ts ceilings are LOWER than before; online.ts unchanged.
- [ ] All STEP 3 suites green; architecture-reviewer and cross-platform-sync report no
  BLOCKING (the other reviewers likewise).

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 05, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 05: new files, the SimEvent, the two
  dungeon ids, the placeholder interior to swap in Phase 06, the HEAVY_SELF_CMDS decision;
  the `freehold/` row in src/sim/CLAUDE.md updated for instance.ts).
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
