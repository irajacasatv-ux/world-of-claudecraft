# Phase 01: foundation (the facet, the sim module skeleton, the flag, the RL exclusion)

Wave A, the Cottage MVP. The spec is `progress.md` "01 Foundation"; the decisions are
`state.md` (D1 to D93) and `brainstorm.md` context. This phase builds the architecture every later
phase extends and ships NO player-visible behavior: `myFreehold` stays null on both hosts.

### Starter Prompt
```
This is Phase 01 of the Freeholds and Guildhalls feature: foundation (the IWorldHousing
facet, the src/sim/freehold/ module skeleton, the FREEHOLDS_ENABLED flag, the RL exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four small independent slices).

Goal: land the seams every later housing phase extends (the facet with stub
implementations in both worlds, the SimContext-backed module skeleton, the fail-closed
feature flag with dispatch-time refusal, the freeholdsEnabled boot config on the SimConfig
seam, the RL exclusion pin) with zero player-visible behavior.

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
- Memory scan: MEMORY.md and entries on world_api parity pins, the monolith ratchet,
  sim_context callback pins, the S3 i18n guard, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "01 Foundation"), and this file
- src/world_api/CLAUDE.md, src/world_api.ts (the FACET MAP comment, the extends chain,
  COMMAND_NAMES, COMMAND_FACETS, the WorldFacet union), src/world_api/farming.ts (the
  newest facet, the model), tests/world_api_parity.test.ts (the five edit sites:
  IWORLD_MEMBERS, the count pins, the FACET_* arrays with AssertNever, FACET_MEMBER_ARRAYS
  and the facet count, the union-size pins)
- src/sim/CLAUDE.md, src/sim/sim_context.ts (SimContextPrimitives, SimContextCallbacks,
  createSimContext), tests/sim_context.test.ts (CALLBACK_KEYS and the fake host),
  src/sim/pvp/index.ts and src/sim/pvp/CLAUDE.md (the existing subsystem
  barrel and its public-API rule, including the documented cycle-avoidance exception),
  the IWorldFarming delegates on Sim (grep `get myFarmPlots` in src/sim/sim.ts) and on ClientWorld (grep `farmNowMs` in src/net/online.ts)
- tests/monolith_budget.test.ts (the sim.ts, game.ts, online.ts rows: all at zero slack)
- server/rift_forge_gate.ts and its dispatch site in server/game.ts (grep
  refusedRiftForgeCommand: a PRE-SWITCH predicate that refuses before the
  heavySelfMarkOnReceipt mark with commandOutcome false and a metrics counter),
  server/steam/config.ts (steamEnabled), server/farming_commands.ts (the IN-SWITCH
  dispatch-sibling shape that returns the accept-return value), server/http/CLAUDE.md (the
  new:endpoint scaffold and the append-only ERROR_CODES rule), .env.example flag rows
- src/sim/types.ts SimConfig (devCommands, riftPortals, compulsoryTutorial: the optional
  boot fields that default off), server/sim_boot_config.ts buildRealmSimConfig (the server
  boot mapping), the offline constructor in src/main.ts (grep `devCommands:
  import.meta.env.DEV`) and the headless constructor in headless/env_server.ts (grep
  `new Sim(`)
- headless/CLAUDE.md (the farming cut paragraph), tests/env_protocol.test.ts (the
  NUM_ACTIONS anchor), src/sim/obs.ts ACTIONS
- Root CLAUDE.md "Modularity" and "Invariants"
The agent returns: the exact facet recipe with file paths and pin sites; the Sim and
ClientWorld one-liner shapes; the SimContext append recipe (primitive vs callback) and
the two test pin sites; the extraction candidates in sim.ts, game.ts, and online.ts that
pay for the new lines (self-contained blocks with a clear seam); the flag getter, the
pre-switch refusal predicate and the in-switch delegate shapes; the SimConfig field
append and the three constructor sites for freeholdsEnabled; the new:endpoint invocation
for the freehold domain; the env_protocol anchor.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:

Deliverables (at most five):
1. The complete housing facet, command registry and null mirrors on both hosts.
2. The SimContext-backed subsystem and its live-view/extraction pins.
3. The authenticated status scaffold, both error catalogs, the freeholdsEnabled boot
   config and dark command dispatch.
4. The unchanged RL action-space exclusion and decisive parity/negative tests.

The facet reserves opaque public plot identity separately from internal ownership. No
account or guild ownership key is a future public descriptor field. Add redo_placement
beside the other placement commands and redoPlacement on both worlds now, with a dark
stub and all command/facet/member/RL pins; Phase 08 implements the journal. Field bounds,
durable revision and operation identity are owned by 07/07a before any mutation ships.
Add the exact C03 build-presence stub and metadata guard contract below in this same
facet/registry output; 08 implements authority and 08a the public boolean.
No source census or monolith ceiling is a timeless literal: remeasure at the synced
implementation head and record a changed fact in state.md before editing consumers.

THE PHASE 01 FACET MEMBER LIST (the reference every parity pin and QA audits against;
recorded in progress.md "01 Foundation" as the same list):
- data members, null on both hosts until their producer lights them: `myFreehold`
  (D20; 05 lights it) and `freeholdLayout` (09 consumes it, 08a lights it through the
  descriptor);
- the clock-base method `housingNowMs()` on the farmNowMs shape (the sim clock offline,
  Date.now() online; 13 and 16 consume it, no subtraction of another clock);
- dark no-op methods, one per registered command: `freeholdEnter`, `freeholdLeave`,
  `placeFurnishing`, `moveFurnishing`, `removeFurnishing`, `undoPlacement`,
  `redoPlacement`, `payLedger`, `setVisitPolicy` and `setFreeholdBuildPresence` (C03).
Later phases APPEND members with their own five parity-pin edits and never rename these:
12 appends `buildStation` and `myAmenities`, 17 appends `placeTrophy` and
`clearPlinth`, 18 appends `freeholdVisitors`, 21 appends `contributeUpgrade` and
`finishUpgrade`, 30a appends `guildHallBoards`, 34 appends `myWard` and `moveWard`, 42
appends `myFreeholds`, and every other later member is named the same way in its own
phase file with the parity pin updated in that same change. No file adds a member
silently.

MIXED-RELEASE TOLERANCE (verified behavior, recorded here because 01 adds the wire
commands): a NEW client sending a housing command to an OLD server lands in the
server/game.ts `default` arm as a protocol anomaly (a lane draw, no kick), so a client
never sends a housing command unless a housing surface is visible; an OLD client
receiving a housing event drops it at the HUD event switch, and its strict bank-style
decoder rejects an unknown self-key OBJECT, never the whole frame. 05 and 08a restate
the rule for the events they add.

Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (they touch disjoint files except the two shared pin files named below, which the
coordinator edits last):
- Agent FACET: src/world_api/housing.ts, the three src/world_api.ts edits, the
  COMMAND_NAMES appends (freehold_enter, freehold_leave, place_furnishing, move_furnishing,
  remove_furnishing, undo_placement, redo_placement, pay_ledger, set_visit_policy, set_freehold_build_presence) and COMMAND_FACETS rows,
  the Sim delegates (thin, into src/sim/freehold/), the ClientWorld one-liners and null
  mirrors, a new src/net/freehold_snapshot_wire.ts holding the null mirror declarations
  and an EMPTY strict-decode allowlist in the bank_snapshot_wire.ts shape (Phase 08a fills
  it), tests/helpers/bare_client.ts defaults. The coordinator applies the five
  tests/world_api_parity.test.ts edits after all slices land.
- Agent SIM: src/sim/freehold/{types.ts,state.ts,index.ts,CLAUDE.md}: FreeholdState (owner
  key, tier, layout rows, trophies, condition stamp, ledger fields, visit policy, rev),
  the ctx.freeholds live map primitive plus its buildSimContext binding and the
  sim_context.test.ts fake-host and live-view pins, the src/sim/CLAUDE.md system-table
  row, the `freeholdsEnabled?: boolean` field appended to SimConfig in src/sim/types.ts
  beside devCommands (D85: optional, default false so deterministic tests, parity traces
  and the RL env opt in explicitly; exposed as a read-only ctx primitive), with
  headless/env_server.ts passing `freeholdsEnabled: true` and src/main.ts passing
  `freeholdsEnabled: world === undefined` (D3: the offline and headless hosts stay
  live; the offline flag is gated like its two sibling live-world flags so the STOCK
  offline world is lit while custom editor play-test maps and the editor viewport boot
  dark, locked as state.md Gotchas (a)) and server/sim_boot_config.ts mapping it from
  freeholdsEnabled(process.env) so a dark realm boots a Sim whose later content spawns
  (03: the furnisher and its stock; 06: the gate prompt and the Hearth Key grant) are
  skipped while item, dungeon and layout DATA still merge; and the sim.ts extraction that
  pays for the delegates (a self-contained block the Explore summary named), then LOWER
  the sim.ts ceiling in tests/monolith_budget.test.ts.
- Agent SERVER: server/freehold_config.ts (freeholdsEnabled(env) strict '1', read live),
  `npm run new:endpoint -- --domain freehold --method GET --path /api/freehold`
  creates server/freehold.ts, tests/server/freehold.test.ts, and the append-only
  freehold.invalid_input code, English leaf, API_ERROR_KEYS row, parity rows, and
  registry registration. Move the generated files to server/freehold_routes.ts and
  tests/server/freehold_routes.test.ts; update the registry import to
  ../freehold_routes and the generated test import to ../../server/freehold_routes.
  Keep freehold.invalid_input and every generated catalog/parity row. Separately append
  freehold.disabled to ERROR_CODES in server/http/error_codes.ts, API_ERROR_KEYS in
  src/ui/api_error_i18n.ts, the freehold block in src/ui/i18n.catalog/api_error.ts,
  EXPECTED_CODES in tests/server/http/error_codes.test.ts, and KNOWN_CODES in
  tests/api_error_code_parity.test.ts. Adapt the GET /api/freehold status stub to answer
  freehold.disabled while dark; it is the registry-only precedent. Add
  server/freehold_wire.ts with BOTH dispatch halves: a PRE-SWITCH
  refusedFreeholdCommand(cmd, env) predicate (the refusedRiftForgeCommand shape: refuses
  every housing command while dark BEFORE the heavySelfMarkOnReceipt mark, answers
  commandOutcome false with no notice, and bumps a metrics counter) plus the IN-SWITCH
  dispatchFreeholdCommand(sim, session, command, msg, pid) delegate for lit arms (the
  dispatchFarmingCommand accept-return shape; 05 lights the first arms); case labels only
  in game.ts, paid for by an extraction and a lowered game.ts ceiling; the .env.example
  row (commented out, the RIFT_FORGE_ENABLED shape) and the DEPLOY.md "Operational
  notes" row beside the RIFT_FORGE_ENABLED bullet: `FREEHOLDS_ENABLED` defaults off, is
  read live as the strict '1', and production never enables it before the release gates
  in docs/freeholds/state.md "Tracked release and handoff gates" are signed (27-qa and
  39-qa read this row); tests/server/freehold_routes.test.ts and
  tests/server/freehold_wire.test.ts (the latter also pins the buildRealmSimConfig
  mapping of FREEHOLDS_ENABLED to SimConfig.freeholdsEnabled for the values '1', unset,
  '0' and 'true', plus a
  source-text arm that each non-server constructor passes its own literal:
  `freeholdsEnabled: true` in headless/env_server.ts and
  `freeholdsEnabled: world === undefined` in src/main.ts, one `new Sim(` site each); the
  surface_inventory.ts row.
- Agent HEADLESS: the headless/CLAUDE.md housing cut paragraph beside the farming cut and
  the ACTIONS exclusion `it` in tests/env_protocol.test.ts (no freehold_* or housing verb
  in ACTIONS; NUM_ACTIONS unchanged), plus the online.ts extraction that pays for the
  ClientWorld lines (a decode block into a src/net/*_wire.ts sibling) and the lowered
  online.ts ceiling.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

EPHEMERAL BUILD-PRESENCE CONTRACT (C03; D20 names remain unchanged):
NEW facet setFreeholdBuildPresence(active: boolean) and command
set_freehold_build_presence carry active, acknowledged opaque plotId,
acceptedTransitionId and monotonic buildPresenceSeq. The host supplies authenticated
session and current claim generation; payload identities only reject stale delivery.
01 owns the stub/registry, 08 implements NEW
src/sim/freehold/build_presence.ts::setFreeholdBuildPresence and 08a publishes only
freeholdState.isDecorating. UI 11 sends start/stop through the real command; 18 reads the
public boolean. Public false is initialized explicitly, including empty first snapshots.

Capture the actual receiving socket binding before queues and validate it again at
dispatch, extending the housing ingress seam with trusted host metadata. No client
field supplies that authority. buildPresenceSeq is scoped to that binding; reconnect
starts a fresh inactive window while preserving acceptedTransitionId history. An old
socket or queued old-generation frame cannot set or clear the new window. Test reload
and reconnect with a reset client counter after a previously larger sequence.

Current edit authority and the accepted plot/entry must match before start. Track only
bounded current authorized sessions privately and aggregate true while any edits.
Close/leave/disconnect/permission or claim revocation clears that session immediately.
A late close cannot clear a newer entry; stale start or sequence replay cannot revive
one. Reconnect starts inactive and 11 may explicitly reenter after fresh authority.
Presence does not save SQL/JSON, consume a receipt, bump durable layout history, or
include ghost, camera, selected copy, bags/vault, undo history or actor/account IDs.
Presence-only changes invalidate the public descriptor's ephemeral revision/signature
without mutating durable_rev; unchanged state creates no repeated payload allocation.

This 01 pair proves only the declared facet, dark/null stub, payload schema and
command/facet/dispatch/RL pins on both worlds; no real presence behavior ships here.
08 owns NEW tests/freehold_build_presence.test.ts and 08a owns the actual command-chain/
wire evidence. Those later pairs prove two owner sessions, guest refusal, disconnect/revocation, stale entry/sequence,
reconnect inactive, independent-session clears and exact owner/visitor public key sets.
A visitor observes the same committed furniture while an owner edits; no ghost leaks.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the module draws no Rng; no wall clock in src/sim/.
- Seam: the facet is added to src/world_api/housing.ts (never the barrel), implemented in
  BOTH Sim and ClientWorld, and the parity pin is updated in the same change.
- Server authority: the stubs decide nothing; the client sends and mirrors.
- i18n: the policy in docs/freeholds/implementation-plan.md; preserve the scaffolded
  apiError.freehold.invalid_input leaf and append apiError.freehold.disabled by hand
  with its error-catalog, API_ERROR_KEYS, and both append-only parity rows.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game
  content and is not firewall vocabulary.
- The flag defaults OFF and refuses at dispatch; pinned. Dark also means the sim boot
  config is false on that realm (D85), so no housing gate, furnisher stock or Hearth Key
  reaches a player; the offline and headless hosts stay live (D3).
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any furnishing content, item kind change, instance, layout, render, or UI work.
- Any real behavior behind the facet members (they return null or no-op).
- Any DDL.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/architecture.test.ts tests/env_protocol.test.ts
  tests/localization_fixes.test.ts tests/api_error_code_parity.test.ts
  tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts
  tests/server/new_endpoint.test.ts tests/server/freehold_routes.test.ts
  tests/server/freehold_wire.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  cross-platform-sync (the facet and stubs), architecture-reviewer (the SimContext
  append, the SimConfig field and the sim.ts extraction), privacy-security-review
  (server/ and src/net/ touched), server-hot-path-reviewer (the pre-switch predicate on
  every command receipt and the status route), test-coverage-auditor (every pin), then
  qa-checklist (the completion gate). Prompt each for COVERAGE not filtering; each writes
  its report to a file. Do not commit until all findings, including nits, are resolved
  and freshly reviewed.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: cross-platform-sync, architecture-reviewer, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
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
The four commits below are ONE ATOMIC UNIT and only the tip is expected green.
The split is by surface for reviewability, not for bisectability: the facet
commit imports src/sim/freehold/types.ts and appends the ten COMMAND_NAMES
tokens before the sim module and the game.ts case labels exist, so `tsc` and the
parity and command-schema suites are red at the first two commits by
construction. Do not bisect inside this range, and do not reorder the commits to
chase a green intermediate: the vocabulary, the module and the dispatch labels
have to land together to typecheck at all.

4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(world_api): add the IWorldHousing facet with stub implementations in both worlds
- feat(sim): add the freehold module skeleton behind SimContext
- feat(server): add the FREEHOLDS_ENABLED gate and the freehold dispatch sibling (the
  .env.example and DEPLOY.md rows ride this commit)
- test(headless): pin the housing exclusion from the RL action space
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] IWorldHousing exists with exactly the member list in STEP 2 ("THE PHASE 01 FACET
  MEMBER LIST", the same list recorded in progress.md "01 Foundation"), present with the
  same kind on Sim and ClientWorld; FACET_HOUSING in tests/world_api_parity.test.ts equals
  that list and the pin's five edits are in.
- [ ] ctx.freeholds is a live view with its sim_context.test.ts pins; the freehold/ row
  is in src/sim/CLAUDE.md; sim.ts, game.ts, and online.ts ceilings are LOWER than before.
- [ ] Every housing command refuses at dispatch with FREEHOLDS_ENABLED unset (pinned for
  each command: commandOutcome false and NO heavy-self dirty mark, through the pre-switch
  predicate); GET /api/freehold answers freehold.disabled while dark; .env.example
  carries the commented FREEHOLDS_ENABLED row and DEPLOY.md "Operational notes" documents
  it as default off and never enabled in production before the signed release gates. The
  generated
  module/test were moved to the chosen _routes paths with both imports repaired;
  freehold.invalid_input and freehold.disabled retain all five catalog/mapping/pin rows.
- [ ] tests/env_protocol.test.ts pins that ACTIONS carries no housing verb.
- [ ] SimConfig.freeholdsEnabled exists (D85): tests/server/freehold_wire.test.ts pins the
  buildRealmSimConfig mapping for '1', unset, '0' and 'true' and the source-text arm
  proves headless/env_server.ts passes `true` and src/main.ts passes
  `world === undefined` (state.md Gotchas (a): the stock offline world is lit, editor
  play-test maps stay dark); the field is read only through its ctx primitive, pinned
  positively (the read-through) AND negatively (a src/sim source scan holding
  `cfg.freeholdsEnabled` to exactly the ctor default and the ctx getter) in
  tests/sim_context.test.ts.
- [ ] myFreehold is null on both hosts; src/net/freehold_snapshot_wire.ts exists with an
  empty allowlist and is the only decode home; the S3 guard and the API error parity pass.
- [ ] All STEP 3 suites green; all required reviewers confirm all findings resolved and the fresh fix review passed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 01, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 01: new files, IWorld members,
  commands, the error code, the flag; any locked decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-01-qa.md

STOPPING RULES:
- Stop and ask if paying for a delegate line requires an extraction that changes
  behavior (the extraction must be move-not-rewrite).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
