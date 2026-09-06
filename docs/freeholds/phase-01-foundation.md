# Phase 01: foundation (the facet, the sim module skeleton, the flag, the RL exclusion)

Wave A, the Cottage MVP. The spec is `progress.md` "01 Foundation"; the decisions are
`state.md` and `brainstorm.md` (D1 to D26). This phase builds the architecture every later
phase extends and ships NO player-visible behavior: `myFreehold` stays null on both hosts.

### Starter Prompt
```
This is Phase 01 of the Freeholds and Guildhalls feature: foundation (the IWorldHousing
facet, the src/sim/freehold/ module skeleton, the FREEHOLDS_ENABLED flag, the RL exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four small independent slices).

Goal: land the seams every later housing phase extends (the facet with stub
implementations in both worlds, the SimContext-backed module skeleton, the fail-closed
feature flag with dispatch-time refusal, the RL exclusion pin) with zero player-visible
behavior.

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
  src/sim/rift/index.ts (a subsystem barrel with a local
  CLAUDE.md), the IWorldFarming delegates on Sim (grep `get myFarmPlots` in
  src/sim/sim.ts) and on ClientWorld (grep `farmNowMs` in src/net/online.ts)
- tests/monolith_budget.test.ts (the sim.ts, game.ts, online.ts rows: all at zero slack)
- server/rift_forge_gate.ts and its dispatch site in server/game.ts (grep
  refusedRiftForgeCommand), server/steam/config.ts (steamEnabled), server/farming_commands.ts
  (the dispatch-sibling shape), server/http/CLAUDE.md (the new:endpoint scaffold and the
  append-only ERROR_CODES rule), .env.example flag rows
- headless/CLAUDE.md (the farming cut paragraph), tests/env_protocol.test.ts (the
  NUM_ACTIONS anchor), src/sim/obs.ts ACTIONS
- Root CLAUDE.md "Modularity" and "Invariants"
The agent returns: the exact facet recipe with file paths and pin sites; the Sim and
ClientWorld one-liner shapes; the SimContext append recipe (primitive vs callback) and
the two test pin sites; the extraction candidates in sim.ts, game.ts, and online.ts that
pay for the new lines (self-contained blocks with a clear seam); the flag getter and
dispatch-refusal shapes; the new:endpoint invocation for the freehold domain; the
env_protocol anchor.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (they touch disjoint files except the two shared pin files named below, which the
coordinator edits last):
- Agent FACET: src/world_api/housing.ts, the three src/world_api.ts edits, the
  COMMAND_NAMES appends (freehold_enter, freehold_leave, place_furnishing, move_furnishing,
  remove_furnishing, undo_placement, pay_ledger, set_visit_policy) and COMMAND_FACETS rows,
  the Sim delegates (thin, into src/sim/freehold/), the ClientWorld one-liners and null
  mirrors, a new src/net/freehold_snapshot_wire.ts holding the null mirror declarations
  and an EMPTY strict-decode allowlist in the bank_snapshot_wire.ts shape (Phase 08 fills
  it), tests/helpers/bare_client.ts defaults. The coordinator applies the five
  tests/world_api_parity.test.ts edits after all slices land.
- Agent SIM: src/sim/freehold/{types.ts,state.ts,index.ts,CLAUDE.md}: FreeholdState (owner
  key, tier, layout rows, trophies, condition stamp, ledger fields, visit policy, rev),
  the ctx.freeholds live map primitive plus its buildSimContext binding and the
  sim_context.test.ts fake-host and live-view pins, the src/sim/CLAUDE.md system-table
  row, and the sim.ts extraction that pays for the delegates (a self-contained block the
  Explore summary named), then LOWER the sim.ts ceiling in tests/monolith_budget.test.ts.
- Agent SERVER: server/freehold_config.ts (freeholdsEnabled(env) strict '1', read live),
  `npm run new:endpoint` for the freehold domain to mint freehold.disabled (keep the
  scaffolded route as a GET /api/freehold status stub that answers freehold.disabled
  while dark; it is the registry-only precedent), server/freehold_wire.ts with
  dispatchFreeholdCommand(sim, session, command, msg, pid) refusing every housing command
  at dispatch while dark (the refusedRiftForgeCommand shape; case labels only in
  game.ts, paid for by an extraction and a lowered game.ts ceiling), the .env.example row,
  tests/server/freehold_routes.test.ts and tests/server/freehold_wire.test.ts, the
  surface_inventory.ts row.
- Agent HEADLESS: the headless/CLAUDE.md housing cut paragraph beside the farming cut and
  the ACTIONS exclusion `it` in tests/env_protocol.test.ts (no freehold_* or housing verb
  in ACTIONS; NUM_ACTIONS unchanged), plus the online.ts extraction that pays for the
  ClientWorld lines (a decode block into a src/net/*_wire.ts sibling) and the lowered
  online.ts ceiling.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the module draws no Rng; no wall clock in src/sim/.
- Seam: the facet is added to src/world_api/housing.ts (never the barrel), implemented in
  BOTH Sim and ClientWorld, and the parity pin is updated in the same change.
- Server authority: the stubs decide nothing; the client sends and mirrors.
- i18n: the policy in docs/freeholds/implementation-plan.md; the one English leaf this
  phase adds is apiError.freehold.disabled through the scaffold.
- Token firewall as state.md scopes it: no on-chain word (wallet, token, $WOC, mint,
  holder, marketplace, on-chain, Solana) in src/sim/; the Book of Deeds is game
  content and is not firewall vocabulary.
- The flag defaults OFF and refuses at dispatch; pinned.
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
  append and the sim.ts extraction), privacy-security-review (server/ and src/net/
  touched). Prompt each for COVERAGE not filtering; each writes its report to a file. Do
  not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(world_api): add the IWorldHousing facet with stub implementations in both worlds
- feat(sim): add the freehold module skeleton behind SimContext
- feat(server): add the FREEHOLDS_ENABLED gate and the freehold dispatch sibling
- test(headless): pin the housing exclusion from the RL action space
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] IWorldHousing exists with the member set in progress.md "01 Foundation", present
  with the same kind on Sim and ClientWorld; the parity pin's five edits are in.
- [ ] ctx.freeholds is a live view with its sim_context.test.ts pins; the freehold/ row
  is in src/sim/CLAUDE.md; sim.ts, game.ts, and online.ts ceilings are LOWER than before.
- [ ] Every housing command refuses at dispatch with FREEHOLDS_ENABLED unset (pinned for
  each command); GET /api/freehold answers freehold.disabled while dark.
- [ ] tests/env_protocol.test.ts pins that ACTIONS carries no housing verb.
- [ ] myFreehold is null on both hosts; src/net/freehold_snapshot_wire.ts exists with an
  empty allowlist and is the only decode home; the S3 guard and the API error parity pass.
- [ ] All STEP 3 suites green; three reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 01, notes, deferrals) and
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
