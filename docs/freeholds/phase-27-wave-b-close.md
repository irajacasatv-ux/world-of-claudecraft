# Phase 27: wave B close (the integration matrix, screenshots, the wave B PR)

Wave B, the Lodge tier and the rest of the first wave, closes here. The spec is
`progress.md` "27 Wave B close"; the matrix is `qa-checklist.md`; the decisions are
`state.md` (the wave B branching choice recorded at the wave A close) and `brainstorm.md`.
This phase writes no feature code: it runs the whole-feature matrix over the wave B diff,
fixes only what the matrix finds (test-first, reviewed), captures the before and after
screenshots, and opens the wave B PR (or pushes the stacked branch) once Fernando
sanctions the push. It stops at "pushed, green, ready for review" and never merges.

### Starter Prompt
```
This is Phase 27 of the Freeholds and Guildhalls feature: the wave B close (the
whole-feature integration matrix over the Lodge, the full furnishing catalogue, the
trophy families, the garden, build mode v2, and open-house visiting; screenshots; the
wave B PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (the matrix is a checklist run, not a build).

Goal: prove wave B end to end on every host and every store build by running every row
of docs/freeholds/qa-checklist.md over the wave B diff, fix what the matrix finds,
capture screenshots, and open the wave B PR (FREEHOLDS_ENABLED defaulting off) only
after Fernando's push go, then watch CI to green. Never merge.

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
  of feature/freeholds; the PR base is then wave A's head branch, and the merge-forward
  rule is unchanged.
- Memory scan: MEMORY.md and entries on "CI is the gate", "never push to fork", "PR merge
  needs approval", "no sensitive material in the open repo" (sweep EVERY push), screenshots
  at lowest graphics, capture rigs never find by English text, "format pass != check
  pass", "commits need bodies", the release-merge checkpoint entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (Push policy and the wave B branching choice, the ledgers 21
  to 26, OPEN items), docs/freeholds/progress.md (rows 21 to 26 with their QA verdicts
  and deferred items, the wave A matrix table under row 20, and "27 Wave B close"),
  docs/freeholds/qa-checklist.md (every row), this file
- .github/PULL_REQUEST_TEMPLATE.md; .claude/skills/pr-screenshots/SKILL.md;
  scripts/pr_shot_targets.mjs (the targets Phases 25 and 26 added);
  docs/prd/woc/freehold-service-contract.md (the upgrade SKU row); .claude/skills/ci-triage/SKILL.md
- The wave diff: `git log --oneline <wave-a-head>..HEAD` and its `--stat`, where
  <wave-a-head> is the commit the wave A PR was opened from (state.md records it); every
  test file the wave added; the docs/screenshots/ directory
- The matrix row anchors named in phase-20-wave-a-close.md STEP 1 plus the wave B suites:
  tests/freehold_upgrade.test.ts, tests/freehold_trophies.test.ts,
  tests/freehold_garden_view.test.ts, tests/freehold_visiting.test.ts,
  tests/freehold_layout_core.test.ts, tests/apex_pattern_channels.test.ts,
  tests/recipe_pattern_items.test.ts, tests/server/freehold_routes.test.ts;
  .githooks/pre-push (the copy-rule scan of a diff)
- server/freehold_config.ts, .env.example, src/game/distribution_surfaces.ts,
  src/ui/i18n.catalog/hud_chrome.ts (the housing namespace, for the "earn" scan)
The agent returns: the matrix as a table of row, resolved command, and the test files
that exist on disk (naming any row whose suite does not exist under the checklist's
name); the screenshot targets with ids and mobile variants; the PR base branch and
merge-base SHA per the branching choice; every deferred item from rows 21 to 26; the O1
handoff delta (the upgrade SKU) and the O2 state; the flag default and its pin.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator owns progress.md, state.md, and the PR body and edits them last:
- Agent MATRIX: run every qa-checklist.md row's command ONE ROW AT A TIME (one vitest
  file per invocation, bounded workers), including `npm run perf:tour` through the
  Cottage and the Lodge with plinths and the garden filled, `npm run asset:budget`, the
  pg-armed persistence twin after `npm run db:up` with TEST_DATABASE_URL set, the
  copy-rule scan from .githooks/pre-push over the wave diff (dashes and emojis only),
  tests/freehold_store_gates.test.ts (the "earn" scan and the token-string pins), and
  the classic-fidelity grep from the qa-checklist.md row
  (the banned two-word land phrase over src/, server/, and public/ ONLY, never
  docs/freeholds or docs/prd whose naming rules spell it, which must return nothing,
  plus the PR body read by hand); record each row as PASS or FAIL with the output path;
  for a FAIL write the failing
  assertion and the owning phase (by progress.md row) without fixing anything.
- Agent SCREENSHOTS: the pr-screenshots skill, before (the wave A head) and after (HEAD),
  desktop plus the compact and tablet landscape mobile boxes, seeding the lowest graphics
  preset and graphicsDefaultApplied before page.goto, never locating an element by
  English text: the Lodge interior, the upgrade progress on the Steward panel, a wall
  piece and a table-top piece with the ghost snapped, the capacity meter, the Legend
  Stand plaque tooltip, the Kitchen Garden tableau, the Fenbridge gate, the visit prompt
  with an open house listed. Commit under docs/screenshots/<slug>/ and return the
  relative paths for the PR body.
- Agent WIKI-AND-DOCS: `npm run wiki:content` then `npx vitest run tests/guide.test.ts`;
  confirm every new guide.* key is spoiler-safe; confirm freehold-service-contract.md carries the
  upgrade SKU (O1); draft the PR body from .github/PULL_REQUEST_TEMPLATE.md with: the
  wave B scope in the proposal's section 14 item 2 words, the flag default off, the
  surface summary unchanged, the O2 counsel checklist still OPEN, the screenshot links,
  the deferred items list (including any stand-in ids), and the word "phase" nowhere.
Then the coordinator: for every FAIL row, fix test-first in isolation (the
extract-and-test skill), spawn the reviewer the dispatch table names for the touched
surface, re-run the row, and record the fix commit. Every agent writes any report longer
than a screen to a file and replies with the path plus a short summary. Never
`mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- No feature work: only matrix fixes, screenshots, docs, and the PR.
- The three money gates: (1) counsel sign-off is OPEN in the PR body, never claimed;
  (2) FREEHOLDS_ENABLED defaults off and every housing route and command (the upgrade
  SKU, the open-houses read included) refuses while dark, re-verified by the matrix;
  (3) the seven-distribution surface map passes and the upgrade purchase surface is off
  every native, Steam, and Epic build. The economy service owns every price and all
  token math.
- No wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in any housing path reachable on
  App Store, Google Play, Steam, or Epic; no "earn" language in hudChrome.housing.*.
- Never sell power; never destroy; zero new farm beds (the farming calendar rows); the
  keystone exclusion over every ledger, furnishing, and upgrade bill.
- i18n: the policy in docs/freeholds/implementation-plan.md; no locale overlay edited.
- Monolith ceilings not raised; a matrix fix pays with an extraction.
- The word "phase" appears in no code, comment, commit, or PR text; screenshots at the
  lowest preset.
- Pushes go to origin only, never a fork; the PR is never merged by this session.

Out of scope (do NOT do in this phase):
- Any wave C item: the guild owner kind, the Hall Fund, guildhall purchase, hall
  amenities, guild deeds, the Great Hall and Manor tiers (Phases 28 to 32).
- Enabling FREEHOLDS_ENABLED anywhere; any deploy; any economy-service change.
- Raising a monolith ceiling or re-baselining any i18n artifact.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The whole qa-checklist.md matrix (STEP 2, Agent MATRIX) with every row PASS, then
  `npx tsc --noEmit` and `npm run ci:changed` after the last commit (read the exit code).
- Spawn per docs/freeholds/implementation-plan.md over the WHOLE wave diff: qa-checklist
  (the completion gate) plus every reviewer the matrix names: render-performance-reviewer,
  content-obligations-reviewer, cross-platform-sync, privacy-security-review,
  migration-safety (the upgrade column), server-hot-path-reviewer (the open-houses read),
  frontend-seam-reviewer (build mode v2 and the prompt). Prompt each for
  COVERAGE not filtering; each writes its report to a file. No PR while a BLOCKING
  finding stands.

STEP 4 - COMMIT CADENCE, THEN PUSH AND PR:
2 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- fix(<scope>): one commit per matrix finding, test-first, reviewed
- docs(screenshots): add the Lodge, build mode v2, garden, and visiting captures
- docs(freeholds): record the wave B integration matrix results
Then `npm run ci:changed` after the LAST commit; read the exit code.
Then STOP and ask Fernando for the push go (state.md "Push policy"), showing the matrix
table, the screenshot paths, and the PR body draft; ask in the same message whether
wave C continues on the same branch after this PR merges or on a stacked branch, and
record the answer in state.md. On the go: `git push -u origin <branch>` (origin only),
then `gh pr create --base <base branch per the branching choice> --title
"feat(freeholds): the Lodge tier, the full furnishing catalogue, and open houses"
--body-file <the drafted body>`, then `gh pr checks --watch`. On a red or stalled check
run the ci-triage skill, fix, push again, and watch again. Stop at "pushed, green, ready
for review".

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row is recorded PASS in progress.md under "27 Wave B close"
  with the command that proved it; no row is marked by inspection.
- [ ] qa-checklist reports PASS; every dispatched reviewer reports no BLOCKING.
- [ ] Before and after screenshots (desktop, compact, tablet) are committed under
  docs/screenshots/ and linked from the PR body.
- [ ] freehold-service-contract.md carries the upgrade SKU (O1); the O2 counsel checklist is in
  the PR body as OPEN.
- [ ] The PR is open off the base the branching choice names, follows the template,
  contains no "phase", and `gh pr checks` is fully green; FREEHOLDS_ENABLED is unset by
  default.
- [ ] state.md records the wave C branching choice and the PR number.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 27: status, the matrix table, deferred items
  carried into wave C) and docs/freeholds/state.md (the PR number, the wave C branching
  choice, the "Current phase" line, any locked decision).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, the matrix table, files touched, review verdicts, the PR URL and
CI state, deferred items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-27-qa.md

STOPPING RULES:
- Stop before any push: the push happens only after Fernando's explicit go in this
  session; never push to a fork; never merge a PR.
- Stop if a matrix row fails for a design reason (a locked decision would have to
  change): record it in progress.md and name the owning phase file as the file to re-run.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
```
