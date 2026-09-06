# Phase 26: open-house visiting

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "26
Open-house visiting"; the decisions are `state.md` and `brainstorm.md` (D8: visitors are
the live claim roster, never a persisted log). This phase extends Phase 18's friends-only
visiting with the `guild` and `public` policies, visitor caps by tier (8, 12, 16, 20, and
24), the door knock and the "who is home" line, the visit prompt listing open houses of friends and
guildmates, and rate limits on public entry. Every predicate is stamped on the server at
dispatch and never trusted from the client.

### Starter Prompt
```
This is Phase 26 of the Freeholds and Guildhalls feature: open-house visiting (the guild
and public policies, caps by tier, the door knock and who-is-home line, the visit
prompt, rate limits on public entry).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 18 seams).

Goal: let an owner open the door to guildmates or to everyone, capped by tier, with a
knock the owner hears, a prompt that lists the open houses a player may enter, and a
public-entry rate limit, with every relation decided on the server.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the monolith ratchet, the server and tests
  cluster of the gotcha catalog (hot paths, cached reads, surface inventory), test-pin
  traps, "guard exemptions must be POSITIVE", the offline IWorld aliasing entry.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "26 Open-house visiting"),
  and this file
- src/sim/freehold/visiting.ts (the friends and private policies, the cap literal, the
  read-only visitor rule, freeholdVisitors), src/sim/freehold/instance.ts (the
  owner-keyed claim, enteredBy as the live roster), src/sim/content/freehold/tiers.ts
  (where a per-tier visitor cap column would sit), src/sim/freehold/types.ts (the visit
  policy union, append-only), src/sim/guild_bank.ts (stampGuildMembership, GUILD_RANKS,
  the session-only PlayerMeta.guildMembership stamp), src/world_api/social_graph.ts
- server/freehold_wire.ts (the Phase 18 friend predicate stamped at dispatch),
  server/social.ts and server/social_db.ts (the friendships table, FriendEntry, the
  guild_members table), server/guild_roster.ts (guildRosterCached), server/msg_lanes.ts
  (classifyMsgLane, consumeLaneToken) and server/ratelimit.ts (a per-account policy
  shape), server/cached_read.ts (createCachedRead) and server/discord_status_cache.ts
  (the bounded keyed LRU shape), server/freehold_routes.ts and server/http/CLAUDE.md
  (the new:endpoint scaffold), server/heavy_self.ts, tests/server/http/surface_inventory.ts
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts (the housing one-liners and the event mirrors),
  src/net/freehold_snapshot_wire.ts, tests/helpers/bare_client.ts
- src/ui/hud/housing/ (the Phase 18 visit prompt on the gate, the cap refusal toast,
  hudChrome.housing.visit.* in src/ui/i18n.catalog/hud_chrome.ts), src/ui/hud/professions/
  farming_plant_sheet_window.ts (the cold window family), src/styles/hud.mobile.css
- tests/freehold_visiting.test.ts, tests/server/freehold_wire.test.ts,
  tests/server/freehold_routes.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/server/http/surface_inventory.test.ts, tests/api_error_code_parity.test.ts,
  tests/monolith_budget.test.ts, tests/snapshots.test.ts
- server/CLAUDE.md "Hot paths"
The agent returns: the policy union and the cap literal with their pins; the friend
predicate's exact server stamping shape to copy for the guild predicate (the roster or
the session guild stamp, and which is cheaper and bust-safe); the lane and policy shape
for a public-entry rate limit; whether the open-house list should be a registry-only
REST read behind a keyed cache opened on demand or a self key (settle in STEP 1,
recommend the REST read: it is opened, never polled; record in state.md); the knock
event shape (pid-scoped to the owner, carrying the visitor name as a value); the
extraction candidates for any coordinator line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/command_schema.test.ts,
tests/server/http/surface_inventory.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, the parity goldens):
- Agent SIM: visiting.ts gains `guild` and `public` on the policy union (append-only),
  `visitorCapFor(tier)` from a per-tier column in tiers.ts (working values 8, 12, 16, 20,
  and 24 from Cottage to Citadel per state.md, TUNING, pinned by fresh literals; the economy service and Fernando
  own the finals), the relation matrix (owner, friend, guildmate, stranger) against the
  four policies with text-free freeholdDenied reasons (`not_friend`, `not_guildmate`,
  `private`, `visitors_full`; appended to freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts, D26), the `knock_freehold` command (a visitor at the gate emits
  a pid-scoped `freeholdKnock` to the owner when online and the policy admits, carrying
  the visitor's name as a value, never text), the who-is-home line already on
  freeholdVisitors extended with the policy; the guild relation read from the
  server-stamped predicate the dispatch passes, offline no-op for guild and public
  (private and friends only); tests/freehold_visiting.test.ts extended.
- Agent SERVER: server/freehold_wire.ts stamps the guildmate predicate at dispatch beside
  the friend predicate (from the session guild stamp or guildRosterCached, never from the
  payload), applies the public-entry rate limit and the knock rate limit (per-account
  lane tokens with their own policies; the state.md literal is one knock per plot per
  10 seconds, TUNING; both dispatch arms share one bucket each), the `knock_freehold` case with the label
  only in game.ts (paid by an extraction), the open-houses read as a registry-only
  RouteDef in server/freehold_routes.ts through `npm run new:endpoint` (GET, activeGuard,
  rateLimit, a bounded keyed cache per account with a short TTL, bust on any policy
  change; a private house is never listed; a friends-only house is listed only to
  friends; refuses freehold.disabled while dark), the surface inventory row, the
  freehold.* error codes; tests/server/freehold_wire.test.ts and
  tests/server/freehold_routes.test.ts extended.
- Agent UI: the visit prompt in src/ui/hud/housing/ (visit_prompt_view.ts pure core and
  visit_prompt_window.ts painter in the cold window family) listing open houses with
  owner name, tier, policy, and occupancy, a knock button, the who-is-home line, the
  policy picker on the Steward panel gaining guild and public, hudChrome.housing.visit.*
  keys, the mobile sheet decision, hud_update_drive rows, pr_shot_targets.mjs entries,
  screenshots (desktop, compact, tablet).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Server authority: the friend, guildmate, and public relations are stamped on the
  server at dispatch and never read from the payload; visitors stay read-only (every
  placement, pay, upgrade, and amenity command refuses `not_owner`).
- D8: visitors are the live roster (enteredBy); no persisted visitor log; the
  open-house read is opened on demand behind a bounded cache, never polled per tick,
  and never queries Postgres from the tick.
- Determinism: no Rng; caps are content; the knock is an event, not state.
- One sim, three hosts: guild and public are offline no-ops (pinned); the RL exclusion
  pin stays green.
- Privacy: a private house is invisible in every list; a knock reveals only a name the
  owner could already see; block and ignore lists are honored by the existing event
  predicates.
- Store policy: no purchase surface here; no "earn" language; nothing timed or lost.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10);
  apiError.freehold.* leaves through the scaffold.
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts are at ZERO slack; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- Working values (the caps 8, 12, 16, 20, and 24; one knock per plot per 10 seconds)
  are state.md numbers; Fernando owns the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guest books, reactions, the Showcase vote (Phase 36); wards as the entry point
  (Phase 34); guildhall entry rules (Phase 28).
- Any persisted visit history or analytics table.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_visiting.test.ts tests/freehold_content.test.ts
  tests/freehold_determinism.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_wire.test.ts
  tests/server/freehold_routes.test.ts tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/new_endpoint.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/visit_prompt_view.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs` for the visit
  prompt targets; parity goldens regenerated in their own commit if an emit changed.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  privacy-security-review (the predicates, the list read, the rate limit),
  server-hot-path-reviewer (the cache, the lane, the event fan-out), plus
  cross-platform-sync (the facet, events, offline no-op) and frontend-seam-reviewer (the
  prompt) because the diff touches those surfaces (the dispatch table rows). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the guild and public visit policies, tier caps, and the door knock
- feat(server): stamp visitor relations at dispatch and rate-limit public entry
- feat(server): add the open-houses read behind a bounded cached read
- feat(ui): add the visit prompt and the who-is-home line
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_visiting.test.ts covers the full relation-by-policy matrix (four
  relations times four policies) with the reason per refusal, the cap boundary per tier
  by fresh literals, the knock only when admitted and the owner is home, and the guild
  and public offline no-op.
- [ ] tests/server/freehold_wire.test.ts proves a payload claiming friendship or guild
  membership is ignored (the server stamp decides), and the public-entry and knock limits
  refuse the N plus first entry or knock within the window on both dispatch arms.
- [ ] tests/server/freehold_routes.test.ts proves the open-houses read never lists a
  private house, lists a friends-only house to friends only, busts on a policy change,
  and refuses while dark; the surface inventory row and error codes are in.
- [ ] The visit prompt lists open houses, knocks, and enters on mouse, pad, and touch;
  screenshots committed; the mobile sheet decision recorded.
- [ ] All STEP 3 suites green; the reviewers report no BLOCKING; the ceilings did not
  rise.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 26, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 26: new command, events, the
  endpoint, error codes, i18n keys, the cap literals; the REST-versus-self-key decision
  and the guild predicate source).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-26-qa.md

STOPPING RULES:
- Stop and ask if the open-house list cannot be served without a per-tick or
  per-snapshot database read (the hot-path rules forbid it; the answer is a cache or a
  narrower list).
- Stop if a relation would have to be trusted from the client for any path.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
