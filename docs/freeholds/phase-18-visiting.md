# Phase 18: visiting

Wave A, the Cottage MVP. The spec is `progress.md` "18 Visiting"; the decisions are
`state.md` D8 (visitors are the live claim roster on `InstanceSlot.enteredBy`, never a
persisted log), D15 (guests enter under the owner's key exactly as a party member joins a
claim), and `brainstorm.md` D10 (text-free events). This phase ships the `friends`
(default) and `private` policies, the `set_visit_policy` command, visitor entry through
the gate by owner name with the friend fact stamped by the server, the cap of 8, read-only
visitors, the who-is-home line, and the offline no-op. Open-house policies, caps by tier,
and the door knock are Phase 26.

### Starter Prompt
```
This is Phase 18 of the Freeholds and Guildhalls feature: visiting (the friends and
private policies, set_visit_policy, visitor entry by owner name, the server-stamped
friend predicate, cap 8, read-only visitors, who-is-home, the offline no-op).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices on existing seams).

Goal: let a friend walk into your Cottage through the Eastbrook gate, see your
furnishings and trophies, and touch nothing, with the friendship fact decided by the
server from its own social snapshot, at most eight visitors inside at once, and an
owner-set policy that persists on the record, while the offline host does nothing.

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
- Memory scan: MEMORY.md and entries on the server/tests gotcha cluster, the offline
  IWorld live-array aliasing trap, parity goldens and META_EXCLUDE, the monolith
  ratchet, ALL_DELTA_KEYS conflicts, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "18 Visiting"), and this
  file
- src/sim/freehold/instance.ts (Phase 05: freeholdKeyFor, the owner-keyed enterDungeon
  path, the freeholdDenied reasons already appended: no_freehold, locked, cooldown,
  visitors_full, not_friend, dead, combat), src/sim/freehold/placement.ts and
  amenities.ts and ledger.ts (the owner-only gate each command already carries),
  src/sim/freehold/state.ts and types.ts (the visit_policy field from Phase 07),
  src/sim/instances/dungeons.ts (enterDungeon, instanceClaimContains, updateInstances,
  the enteredBy set: how it accumulates and when it clears), src/sim/sim.ts InstanceSlot
  (enteredBy, clearedBy), src/sim/instances/instance_slot.ts
- the session-only stamp precedent: stampGuildMembership and PlayerMeta.guildMembership
  (grep in src/sim/ and server/game.ts), applyBankBonusStamp in src/sim/bank.ts, the
  META_EXCLUDE set in tests/parity/trace.ts
- server/game.ts sendSocialSnapshot (where snap.friends is read and
  session.socialTrackedIds is captured: note it mixes friends AND guildmates, so a
  friends-only fact needs its own capture), server/social.ts (SocialSnapshot,
  FriendEntry, the snapshot(charId) method on the social service), the block list on
  the session (session.blockedIds and the ignore predicate in routeEvents),
  server/freehold_wire.ts (dispatchFreeholdCommand: where a visitor enter and
  set_visit_policy arrive), server/heavy_self.ts (HEAVY_SELF_EVENTS),
  JAILED_BLOCKED_COMMANDS in server/game.ts (freehold_enter already listed by Phase 05),
  the command lane in dispatchMessage (classifyMsgLane: the rate limit a visit attempt
  inherits)
- server/game.ts routeEvents and server/event_frame.ts (pid-scoped delivery;
  EVENT_RADIUS for pid-less events), src/net/online.ts (the freehold event mirrors
  Phase 08 added), src/net/freehold_snapshot_wire.ts, src/world_api/housing.ts
  (freeholdVisitors, setVisitPolicy), tests/snapshots.test.ts
- src/ui/hud/housing/ (Phase 11 and 16: the housing_view.ts selectors, the barrel), the
  gate interact from Phase 06 (grep freehold_enter in src/game/ and src/ui/), the
  prompt_dialog.ts recipe (src/ui/prompt_dialog.ts) and a name-entry prompt precedent
  (grep the mail compose or the friend-add prompt), src/ui/i18n.catalog/hud_chrome.ts
- tests/feast_online.test.ts (two sessions, wire frames), tests/dungeon_instance_disconnect_reset.test.ts
  (GameServer.join with server/db mocked), tests/freehold_command_chain_online.test.ts,
  tests/dungeons.test.ts (the slim world), tests/monolith_budget.test.ts
- server/CLAUDE.md "Hot paths", root CLAUDE.md "Invariants"
The agent returns: the stamp recipe for a session-only friend set on PlayerMeta (the
guild stamp shape: a Sim setter, a fence, the META_EXCLUDE row) and where
sendSocialSnapshot can feed it; how "present inside the claim" is computed from
enteredBy plus instanceClaimContains (enteredBy alone accumulates); how an owner is
resolved by name on the server without trusting the client (the live session map);
the pid-scoped event delivery for arrivals; the HEAVY_SELF gating of fhold; the
prompt dialog recipe; the extraction candidates that pay for any sim.ts, game.ts, or
online.ts line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: src/sim/freehold/visiting.ts (the policy union 'friends' | 'private' on the
  record, default friends; setVisitPolicy(ctx, policy, pid) owner-only, persisted through
  the record's rev; visitorAdmission(ctx, ownerKey, visitorPid): the owner is never a
  visitor, private refuses not_friend, friends requires the visitor's session-stamped
  friend set to contain the owner's character (a missing stamp refuses, never admits),
  the cap of 8 counted as members of the claim's enteredBy that still satisfy
  instanceClaimContains excluding the owner, refusing visitors_full; the enter path in
  instance.ts calls it before the claim); the session-only PlayerMeta.freeholdFriendKeys
  stamp with a Sim setter (the guild stamp shape) and its META_EXCLUDE row; read-only
  enforcement: every placement, pay, build_station, strongbox, and set_visit_policy
  command refuses not_owner for a visitor (Phase 08's gate, now pinned per command with
  a visitor session); freeholdVisitors on the Sim (names of players inside the viewer's
  current claim, the owner first); text-free freeholdVisitorArrived and
  freeholdVisitorLeft { pid, name } events to the owner (names are values, never keys);
  the offline no-op: the offline host stamps no friend set, so a visit resolves no owner,
  and the policy command still updates the live record for the session (offline persists
  nothing per D16; a fresh offline Sim starts at the friends default, pinned); the
  determinism case.
- Agent SERVER: the friend set captured in sendSocialSnapshot from snap.friends ONLY
  (never socialTrackedIds, which includes guildmates) and stamped through the Sim
  setter, re-stamped on every social snapshot, cleared on leave; the visitor enter arm
  in dispatchFreeholdCommand resolving the owner by name through the live session map
  (a name that is not online or owns no freehold refuses no_freehold with ONE merged
  frame, the existence-oracle rule, so a visitor cannot probe who owns a house), the
  block list winning over friendship (a visitor on the owner's block list, or an owner
  on the visitor's, refuses not_friend, never a distinct reason), set_visit_policy
  shape-only; HEAVY_SELF_EVENTS rows for the two visitor events if fhold carries the
  visitor names; the online two-session test (owner and friend on a StubWebSocket pair
  through GameServer.join, the friend enters, a stranger is refused, the ninth visitor
  is refused, the visitor's place_furnishing is refused not_owner, the owner sees the
  arrival event) modeled on tests/feast_online.test.ts and
  tests/dungeon_instance_disconnect_reset.test.ts; no new table, no persisted log.
- Agent UI: src/ui/hud/housing/visit_prompt_view.ts and visit_prompt_window.ts on the
  prompt_dialog.ts recipe (enter my own Cottage, or a friend's by name; the name field
  16px; the policy toggle for the owner as a friends or private switch), opened from the
  gate interact; the visitor cap and not_friend refusals through
  freeholdDeniedLineKey; the who-is-home line from freeholdVisitors in the Steward
  panel (a read-only row, Phase 16's core gains one input); hudChrome.housing.visit.*
  English keys; the mobile sheet decision and 40x40 targets; tests for the two cores.
The coordinator edits last: tests/snapshots.test.ts (any fhold field, ALL_DELTA_KEYS),
tests/sim_context.test.ts (the setter if it is a callback), tests/parity/trace.ts
(META_EXCLUDE) and the goldens commit, tests/monolith_budget.test.ts (lowered
ceilings). Every agent writes any report longer than a screen to a file and replies
with the path plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Server authority: the friend fact is stamped by the server from its own social
  snapshot and never trusted from the client; admission, the cap, and every read-only
  refusal are decided in the sim on the server.
- Nothing ticks and nothing persists a visit (D8): the roster is the live claim; no
  visitor log table; the policy is the only persisted field.
- Determinism: no Rng, no wall clock; the same stamps and roster give the same
  admission on both hosts; the offline host is a no-op by construction.
- Privacy: a visitor learns nothing about accounts (names only, and only inside the
  claim); an unknown or offline name and a name that owns no freehold answer the same
  frame; the block list wins over friendship without a distinct reason; a session-only
  stamp is in META_EXCLUDE with a justification.
- Never destroy, never sell power: visiting changes no number and no record beyond the
  policy field.
- Hot paths: the friend set is captured where the social snapshot already runs (no new
  DB read per visit), the enter path is rate-limited by the command lane, events are
  pid-scoped, no per-tick roster work.
- i18n: the policy in docs/freeholds/implementation-plan.md; every deny and arrival is a
  text-free id-carrying SimEvent (D10); names cross as values.
- Monolith: sim.ts, game.ts, and online.ts are at ZERO slack; a delegate, case label, or
  mirror line is paid for by an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The guild and public policies, caps by tier, the door knock, the open-house listing,
  and public-entry rate limits (Phase 26).
- Guest books, reactions, showcases (Wave D).
- A persisted "who visited" log or any new table.
- Any change to the friends system itself.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_visiting.test.ts`;
  `npx vitest run tests/freehold_visiting_online.test.ts`; `npx vitest run
  tests/visit_prompt_view.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/bandwidth.test.ts tests/env_protocol.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/dungeons.test.ts tests/dungeon_instance_disconnect_reset.test.ts
  tests/server/freehold_wire.test.ts tests/server/heavy_self.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/localization_fixes.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; the parity goldens with `UPDATE_PARITY=1` in their
  own commit if a scenario changed, then `npx vitest run tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  privacy-security-review (the friend stamp trust boundary, the existence oracle, the
  block list, names on the wire), cross-platform-sync (the policy command and the
  visitor reads on both hosts, the offline no-op), server-hot-path-reviewer (the
  capture site, the event fan-out, the lane). Prompt each for COVERAGE not filtering;
  each writes its report to a file. Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): admit friends to a freehold under the owner's policy and cap
- feat(server): stamp the friend set from the social snapshot and route visitor entry
- feat(ui): add the visit prompt and the who-is-home line
- test(server): prove friends-only visiting across two live sessions
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] With policy friends a stamped friend enters under the owner's key, a stranger and
  a guildmate-only refuse not_friend, a blocked player refuses not_friend, and with
  policy private everyone but the owner refuses not_friend (each a pin).
- [ ] The ninth visitor refuses visitors_full; a visitor who left frees the slot (the
  count uses presence, not the accumulated enteredBy); the owner never counts.
- [ ] Every placement, pay, amenity, and policy command refuses not_owner for a visitor
  without mutating (one pin per command through a visitor session).
- [ ] freeholdVisitors lists the players inside on both hosts; the owner receives
  freeholdVisitorArrived and freeholdVisitorLeft; the fhold arm round-trips.
- [ ] An unknown name, an offline owner, and a name owning no freehold produce the SAME
  frame; no account id or friend list crosses the wire.
- [ ] Offline: no stamp, no visitor path, the policy updates the live record only and a
  fresh Sim starts at the friends default (pinned, D16); the RL ACTIONS pin is unchanged.
- [ ] The two-session online test passes; sim.ts, game.ts, online.ts ceilings are not
  higher than before.
- [ ] All STEP 3 suites green; the three reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 18, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 18: the module, the stamp field and
  its META_EXCLUDE row, the events, the fhold fields, the i18n keys, the prompt window
  id; the cap of 8 recorded as an MVP literal).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-18-qa.md

STOPPING RULES:
- Stop and ask if the friend fact cannot be stamped from the existing social snapshot
  without a new per-visit database read.
- Stop if visitor presence cannot be derived from the live claim without a new tick
  sweep or a persisted log (D8).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
