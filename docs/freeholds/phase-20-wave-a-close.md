# Phase 20: wave A close (the integration matrix, screenshots, the MVP PR)

Wave A, the Cottage MVP, closes here. The spec is `progress.md` "20 Wave A close"; the
matrix is `qa-checklist.md`; the decisions are `state.md` and `brainstorm.md` (D1 to D19).
This phase writes no feature code: it runs the whole-feature matrix over the wave A diff,
fixes only what the matrix finds (test-first, reviewed), captures the before and after
screenshots, hands the service contract and the counsel checklist off, and opens the MVP
PR off the base branch once Fernando sanctions the push. It stops at "pushed, green,
ready for review" and never merges.

### Starter Prompt
```
This is Phase 20 of the Freeholds and Guildhalls feature: the wave A close (the
whole-feature integration matrix, the wiki and guide pass, before and after screenshots,
and the Cottage MVP PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (the matrix is a checklist run, not a build).

Goal: prove the Cottage MVP end to end on every host and every store build by running
every row of docs/freeholds/qa-checklist.md over the wave A diff, fix what the matrix
finds, capture screenshots, and open the wave A PR (FREEHOLDS_ENABLED defaulting off)
only after Fernando's push go, then watch CI to green. Never merge.

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
- Memory scan: MEMORY.md and entries on "CI is the gate", "never push to fork", "PR merge
  needs approval", "no sensitive material in the open repo" (sweep EVERY push), screenshots
  at lowest graphics, capture rigs never find by English text, "format pass != check
  pass", "commits need bodies", the release-merge checkpoint entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (Push policy, the per-phase ledgers 01 to 19, OPEN items),
  docs/freeholds/progress.md (every wave A row 01 to 19 with its QA verdict and deferred
  items, and "20 Wave A close"), docs/freeholds/qa-checklist.md (every row), this file
- .github/PULL_REQUEST_TEMPLATE.md; .claude/skills/pr-screenshots/SKILL.md;
  scripts/pr_shot_targets.mjs (the housing targets Phases 11, 16, and 17 added);
  docs/prd/woc/freehold-service-contract.md (Phase 15); .claude/skills/ci-triage/SKILL.md
- The wave diff: `git log --oneline <base>..HEAD` and `git diff <base>..HEAD --stat`
  where <base> is the merge-base with the base branch (origin/feature/masterwrought while
  PR #3872 is open, else the newest origin/release/**); every test file the wave added
  (`git diff <base>..HEAD --name-only -- tests/`); the docs/screenshots/ directory
- The matrix row anchors: tests/world_api_parity.test.ts, tests/env_protocol.test.ts,
  tests/freehold_determinism.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/snapshots.test.ts, tests/bandwidth.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/distribution_surfaces.test.ts,
  tests/freehold_store_gates.test.ts (Phase 14), tests/server/freehold_gates.test.ts
  (Phase 15), tests/client_shell.test.ts, tests/freehold_content.test.ts,
  tests/provisioner_firewall.test.ts, tests/professions_farming.test.ts,
  tests/professions_zone_rollout.test.ts, tests/freehold_condition.test.ts,
  tests/item_icons.test.ts, tests/item_art_consistency.test.ts,
  tests/deeds_content.test.ts, tests/reliquary_content.test.ts, tests/guide.test.ts,
  tests/i18n_completeness.test.ts, tests/localization_fixes.test.ts,
  tests/api_error_code_parity.test.ts, tests/renderer_compile_gate.test.ts,
  tests/monolith_budget.test.ts; .githooks/pre-push (the copy-rule scan of a diff: the
  repo has no copy:scan npm script, so the close runs that scan by hand over the wave diff)
- server/freehold_config.ts (the flag getter), .env.example (the flag row),
  src/game/distribution_surfaces.ts (the seven-row map), src/ui/i18n.catalog/hud_chrome.ts
  (the housing namespace, for the "earn" scan)
The agent returns: the matrix as a table of row, resolved command, and the test files
that exist on disk (naming any row whose suite does not exist under the checklist's
name); the list of screenshot targets with their ids and mobile variants; the PR base
branch and merge-base SHA; every deferred item from rows 01 to 19; the O1 handoff state
and the O2 counsel checklist items; the flag default and where it is pinned.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator owns progress.md, state.md, and the PR body and edits them last:
- Agent MATRIX: run every qa-checklist.md row's command ONE ROW AT A TIME (one vitest
  file per invocation, bounded workers), including `npm run perf:tour` through the
  Cottage, `npm run asset:budget`, the pg-armed persistence twin after `npm run db:up`
  with TEST_DATABASE_URL set, the copy-rule scan from .githooks/pre-push over the wave
  diff (dashes and emojis only), tests/freehold_store_gates.test.ts (the "earn" scan and
  the token-string pins), and the classic-fidelity grep
  from the qa-checklist.md row (the banned two-word land phrase over src/, server/, and
  public/ ONLY, never docs/freeholds or docs/prd whose naming rules spell it, which must
  return nothing, plus the PR body read by hand); record each row as PASS or FAIL
  with the output path; for a FAIL write the failing assertion and the owning phase (by
  progress.md row) without fixing anything.
- Agent SCREENSHOTS: the pr-screenshots skill, before (the base branch) and after (HEAD),
  desktop plus the compact and tablet landscape mobile boxes, seeding the lowest graphics
  preset and graphicsDefaultApplied before page.goto, never locating an element by
  English text: the Eastbrook Freehold Gate, the Inn Room, the Cottage in build mode with
  the ghost in a blocked state, the palette, the Steward panel, the store surfaces (web,
  and a native emulation showing the manage-on-the-website line), the trophy case.
  Commit under docs/screenshots/<slug>/ and return the relative paths for the PR body.
- Agent WIKI-AND-DOCS: `npm run wiki:content` then `npx vitest run tests/guide.test.ts`;
  confirm every housing guide.* key is spoiler-safe; finalize
  docs/prd/woc/freehold-service-contract.md (the two SKUs, spend kind freehold, the fingerprint
  rule, the settlement line) as the O1 handoff; draft the PR body from
  .github/PULL_REQUEST_TEMPLATE.md with: the MVP scope in the proposal's section 13
  words, the flag default off and how to enable it, the seven-distribution surface
  summary, the O2 counsel checklist as an OPEN section, the screenshot links, the deferred
  items list, and the word "phase" nowhere.
Then the coordinator: for every FAIL row, fix test-first in isolation (the
extract-and-test skill), spawn the reviewer the dispatch table names for the touched
surface, re-run the row, and record the fix commit. Every agent writes any report longer
than a screen to a file and replies with the path plus a short summary. Never
`mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- No feature work: only matrix fixes, screenshots, docs, and the PR.
- The three money gates: (1) counsel sign-off is OPEN in the PR body, never claimed;
  (2) FREEHOLDS_ENABLED defaults off and every housing route and command refuses while
  dark, re-verified by the matrix; (3) the seven-distribution surface map passes its
  matrix test. The economy service owns every price and all token math.
- No wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in any housing path reachable on
  App Store, Google Play, Steam, or Epic; no "earn" language in hudChrome.housing.*.
- Nothing purchasable changes a combat, progression, gathering, or drop number; nothing
  is destroyed; condition 0 still opens the door (the matrix rows prove it).
- i18n: the policy in docs/freeholds/implementation-plan.md; no locale overlay edited.
- Monolith ceilings not raised: a matrix fix that needs a line in src/sim/sim.ts,
  server/game.ts, or src/net/online.ts (all at ZERO slack) pays with an extraction and
  lowers the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text (docs/freeholds/ is
  the only place it lives); screenshots are captured at the lowest preset.
- Pushes go to origin only, never a fork; the PR is never merged by this session.

Out of scope (do NOT do in this phase):
- Any wave B item: the Lodge tier, furnishings beyond the MVP set, the R8 pattern
  channels, the Legend Stand, the Kitchen Garden tableau, build mode v2, open-house
  visiting (Phases 21 to 26).
- Enabling FREEHOLDS_ENABLED anywhere; any deploy; any economy-service change.
- Raising a monolith ceiling or re-baselining any i18n artifact.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The whole qa-checklist.md matrix (STEP 2, Agent MATRIX) with every row PASS, then
  `npx tsc --noEmit` and `npm run ci:changed` after the last commit (read the exit code).
- Spawn per docs/freeholds/implementation-plan.md over the WHOLE wave diff: qa-checklist
  (the completion gate) plus every reviewer the matrix names: render-performance-reviewer
  (the render and perf row), content-obligations-reviewer (the content row),
  cross-platform-sync (parity, wire, events), privacy-security-review (server, net, store
  policy), migration-safety (the persistence row), frontend-seam-reviewer (the mobile
  row). Prompt each for COVERAGE not filtering; each writes its report to a file. No PR
  while a BLOCKING finding stands.

STEP 4 - COMMIT CADENCE, THEN PUSH AND PR:
2 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- fix(<scope>): one commit per matrix finding, test-first, reviewed
- docs(screenshots): add the Freehold before and after captures
- docs(freeholds): record the wave A integration matrix results
- docs(freeholds): finalize the economy-service contract for the Freehold Charter
Then `npm run ci:changed` after the LAST commit; read the exit code.
Then STOP and ask Fernando for the push go (state.md "Push policy"), showing the matrix
table, the screenshot paths, and the PR body draft; ask in the same message whether
wave B continues on feature/freeholds after this PR merges or on a stacked branch off
its head, and record the answer in state.md. On the go: `git push -u origin
feature/freeholds` (origin only), then `gh pr create --base <base branch> --title
"feat(freeholds): the Cottage Freehold MVP" --body-file <the drafted body>`, then
`gh pr checks --watch`. On a red or stalled check run the ci-triage skill, fix, push
again, and watch again. Stop at "pushed, green, ready for review".

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row is recorded PASS in progress.md under "20 Wave A close"
  with the command that proved it; no row is marked by inspection.
- [ ] qa-checklist reports PASS; every dispatched reviewer reports no BLOCKING.
- [ ] Before and after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and linked from the PR body.
- [ ] docs/prd/woc/freehold-service-contract.md is final and named in the PR body as the O1
  handoff; the O2 counsel checklist is in the PR body as OPEN.
- [ ] The PR is open off the base branch, follows the template, contains no "phase",
  and `gh pr checks` is fully green; FREEHOLDS_ENABLED is unset by default.
- [ ] state.md records the wave B branching choice and the PR number.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 20: status, the matrix table, deferred items
  carried into wave B) and docs/freeholds/state.md (the PR number, the wave B branching
  choice, the "Current phase" line, any locked decision).
- Record surprising rules learned in memory for the next session (the PR number and the
  branching choice belong there too).

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, the matrix table, files touched, review verdicts, the PR URL and
CI state, deferred items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-20-qa.md

STOPPING RULES:
- Stop before any push: the push happens only after Fernando's explicit go in this
  session; never push to a fork; never merge a PR.
- Stop if a matrix row fails for a design reason (a locked decision would have to
  change): record it in progress.md and name the owning phase file as the file to re-run.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
```
