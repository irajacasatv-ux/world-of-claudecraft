# Phase 36: Showcases and guest books

Wave D, Wards and Charters. The spec is `progress.md` "36 Showcases and guest books"; the
decisions are `state.md` and `brainstorm.md` (D5 account state, D8 nothing ticks, D10
text-free events, the Phase 34 ward and the Phase 26 visit policies). This phase ships
the seasonal Showcase vote with a trophy-decor reward and the guest book with reactions
ONLY (a closed reaction enum, no free text, so no moderation surface; bounded per plot,
retention registered).

### Starter Prompt
```
This is Phase 36 of the Freeholds and Guildhalls feature: Showcases and guest books (the
seasonal Showcase vote and its trophy reward; the bounded guest book with reactions
only, a closed enum and no free text).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: add two social surfaces that are server-owned rows behind RouteDefs (a vote per
member per season, a bounded guest book of reactions per plot) with block-list
filtering, retention, and account-export coverage, a closed reaction enum pinned by a
test, and a Showcase winner computed deterministically at season close.

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
- Memory scan: MEMORY.md and entries on the RouteDef scaffold and surface inventory,
  retention registration, cached reads and busts, Postgres gotchas, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "36 Showcases and guest
  books"), and this file
- server/freehold_routes.ts and server/freehold_db.ts (the registry-only table, the
  error family, the tables so far), server/http/CLAUDE.md (new:endpoint, append-only
  ERROR_CODES), server/http/middleware/require_owned.ts, rate_limit.ts, body.ts
- server/social_db.ts (blocks, ignores, friendships), server/social.ts (the block
  predicates)
- server/retention_sweep.ts, server/main.ts (the tables array after listen),
  server/play_session_retention_db.ts (the prune primitive shape), server/cached_read.ts,
  server/bank_ledger_growth_budget.ts (the bounded per-account append log),
  server/db.ts (exportAccountData)
- src/sim/freehold/visiting.ts (the visit policies from Phases 18 and 26), wards.ts (the
  opaque plot id the descriptor carries), trophies.ts (the trophy record and source
  ids), src/sim/sim_context.ts (utcDay)
- src/ui/mailbox_window.ts or the cold-window family src/ui/CLAUDE.md names,
  src/ui/hud/housing/ (the ward panel), tests/server/http/surface_inventory.ts,
  tests/server/main_retention_wiring.test.ts, tests/api_error_code_parity.test.ts
The agent returns: the route recipe with the exact middleware order for an owner-gated
write and a privacy-filtered read of another owner's plot addressed by an opaque plot
id (never an account id); the block-list filter to reuse verbatim; the retention
registration and prune primitive shapes; the bounded-log idiom; the trophy source id
shape; the cold window family to copy; the extraction candidates. Settle in STEP 1 and
record in state.md before implementing: the season definition (the realm's existing
seasonal cadence if one exists, else a 13-week window from a published anchor day, the
state.md working value), the guest book cap per plot (working: 50 entries, oldest
pruned on insert), the closed reaction set (working: a handful of ids such as wave,
cheer, admire; no free text, ever), and the per-author daily rate.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SERVER-DB: server/freehold_social_db.ts (FREEHOLD_SOCIAL_SCHEMA: freehold_showcase_entries
  keyed (season, ward_id, owner_account_id); freehold_showcase_votes keyed (season,
  ward_id, voter_account_id) so one vote per member per season; freehold_guest_book (id,
  plot_owner_account_id, author_account_id, author_character_name, reaction SMALLINT
  with a CHECK against the closed enum, created_at; NO text column) with an index on
  (plot_owner_account_id, created_at); all FKs ON DELETE CASCADE; additive idempotent
  DDL), the insert path that prunes the oldest beyond the cap in the same transaction,
  the prune primitives and their server/main.ts retention rows (votes after N seasons,
  guest-book rows after the configured window), the exportAccountData rows (entries
  authored, votes cast, own plot's book), the cached read per plot with a bust on write,
  tests/server/freehold_social_db.test.ts plus the pg twin.
- Agent SERVER-ROUTES: `npm run new:endpoint` for the routes in server/freehold_routes.ts,
  never keyed by an account id (the Phase 18 existence-oracle rule: no account id and no
  friend list on the wire): GET /api/freehold/plot/:plotId/guest-book, with plotId the
  opaque plot id the Phase 34 ward descriptor carries (or the owner's character name
  resolved server-side), privacy-filtered by the plot's visit policy and the viewer's
  block and ignore lists, where an unknown, a private, and a blocked plot answer one
  identical 404; POST /api/freehold/plot/:plotId/guest-book (activeGuard, rateLimit,
  withBody carrying ONLY a reaction id; an id outside the closed enum refuses with a
  stable code before any insert; the author must be a current visitor allowed by the
  policy or a friend, both resolved server-side); DELETE /api/freehold/guest-book/:id
  (owner only through requireOwned); POST /api/freehold/showcase/enter and /vote (one
  vote per season; the voter must be a ward member; the entry named by plot id); error
  codes freehold.guest_book_* and freehold.showcase_* with English leaves; the surface
  inventory rows; tests/server/freehold_social_routes.test.ts (fakeCtx, FakeDb).
- Agent SIM+CLIENT: src/sim/freehold/showcase_tally_core.ts (a pure deterministic tally
  with a tie-break by earliest entry; the server calls it at season close and grants the
  winner's trophy with source showcase:<season> through the trophy record), the closed
  reaction enum as one exported list the routes, the DDL CHECK, and the window all read
  (pinned by a test with literal ids), the guest book window (the cold window family,
  reactions as icons with t() labels, no hover-only information, no text input anywhere),
  the Showcase entry and vote controls in the ward panel, the mobile sheet decisions,
  hudChrome.housing.* keys, pr_shot_targets entries.
The coordinator edits last: tests/server/http/surface_inventory.ts,
tests/monolith_budget.test.ts, the retention wiring pin. Every agent writes any report
longer than a screen to a file and replies with the path plus a short summary. Never
`mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Reactions only: no free-text field exists on the guest book table, its routes, its
  wire, or its window (the ruling recorded in progress.md "36"); the reaction set is a
  closed enum pinned by a test; there is therefore no moderation surface to build.
- Privacy: blocked and ignored authors never render for the viewer; a reader sees only
  what the plot's visit policy allows; the owner can delete any entry; parameterized SQL
  only; the Phase 18 existence-oracle rule (an unknown, a private, and a blocked plot
  answer one identical 404; no account id and no friend list ever on the wire; routes
  are keyed by an opaque plot id).
- Persistence gates: additive idempotent DDL, an index for every predicate, retention
  registered for both growing tables, exportAccountData rows, cascade on account delete.
- Hot paths: no per-tick DB read; the book read is cached per plot and busted on write;
  the insert bounds the table at the cap (a growing table without a bound is a defect).
- Never sell power: the Showcase reward is a trophy prop; trophies are earned, never
  sold; nothing destroyed (an entry the owner deletes is the owner's choice).
- Determinism where the sim is touched (the tally core draws no Rng); the i18n policy in
  docs/freeholds/implementation-plan.md; token firewall; vocabulary fixed; "phase" in no
  code, comment, commit, or PR text; monolith ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Free text in the guest book or on the exterior (never; the ruling is reactions only);
  a public showcase feed outside the ward; deed or holder surfaces (Phases 37 and 38); a
  persisted "who visited" log beyond the book.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_social_db.test.ts
  tests/server/freehold_social_routes.test.ts tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/main_retention_wiring.test.ts
  tests/api_error_code_parity.test.ts tests/server/new_endpoint.test.ts
  tests/freehold_showcase_tally.test.ts tests/freehold_guest_book_reactions.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts`; the pg-armed
  twin with TEST_DATABASE_URL set after `npm run db:up`; `npm run i18n:gen` then
  `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`.
- Spawn review agents per docs/freeholds/implementation-plan.md: privacy-security-review,
  database-performance-reviewer, plus migration-safety (DDL), server-hot-path-reviewer
  (the per-request reads and the bound), and frontend-seam-reviewer (src/ui/). Prompt
  each for COVERAGE not filtering; each writes its report to a file. Do not commit until
  no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(server): add the bounded guest book and Showcase tables with retention
- feat(server): add the guest book and Showcase routes with the closed reaction enum
- feat(ui): add the guest book window and the Showcase controls to the ward panel
- test(server): pin the reaction enum, block filtering, the vote rail, and the tally tie-break
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] A guest-book post carries only a reaction id; an id outside the closed enum is
  refused with a stable code before any insert; the enum is pinned by literal ids with a
  can-fail control; the post is rate-limited and refused from a non-visitor; a blocked
  author's entry is absent from the victim's read; the owner's delete works and a
  stranger's delete answers 404; no text column, field, or input exists (grep pinned).
- [ ] The book never exceeds the cap (insert 51, read 50, the oldest gone); retention
  rows registered for both tables (wiring pin green); the account export includes the
  rows; delete cascades (pg twin).
- [ ] One vote per member per season is a database rail (a second vote conflicts);
  the tally is deterministic with the tie-break pinned; the winner's trophy carries the
  season source id and appears on the plinth once.
- [ ] Windows render on desktop and as mobile sheets; screenshots committed.
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 36, notes, deferrals) and
  docs/freeholds/state.md (ledger row 36: endpoints, tables, error codes, i18n keys; the
  season, cap, reaction set, and rate decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-36-qa.md

STOPPING RULES:
- Stop and ask if any deliverable would need free text in the guest book; the ruling is
  reactions only and a text field is never added on a session's own judgment.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
