# Phase 33: wave C close (integration matrix, screenshots, the Guildhalls PR)

Wave C, Guildhalls. The spec is `progress.md` "33 Wave C close"; the matrix is
`qa-checklist.md`; the PR rules are `implementation-plan.md` "PR cadence" and `state.md`
"Push policy". This is the final QA variant: it runs the whole-feature matrix over the
wave C diff (Phases 28 to 32), captures screenshots, runs the wiki pass, and opens the
wave C PR only after Fernando's push go. It ships no new behavior.

### Starter Prompt
```
This is Phase 33 of the Freeholds and Guildhalls feature: wave C close (the integration
matrix over Phases 28 to 32, screenshots, the wiki pass, the Guildhalls PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: prove wave C whole (every row of docs/freeholds/qa-checklist.md verified by a check
that ran), commit the before/after screenshots, and open the wave C PR off the base
branch with FREEHOLDS_ENABLED defaulting off, then watch CI to green.

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
- Memory scan: MEMORY.md and entries on screenshots at lowest graphics, capture rigs and
  English text, CI is the gate, never push to a fork, PR merge needs approval, the
  sensitive-material sweep.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md (every row), docs/freeholds/progress.md
  (rows 28 to 32 and their QA rows, every deferral), this file, the Phase 20 and 27 close
  records in progress.md (the matrix table shape and the PR body they used)
- the wave diff: `git log --oneline <wave-c-start>..HEAD` and `git diff <wave-c-start>..HEAD
  --stat`, with <wave-c-start> the tip recorded at the Phase 27 close
- .github/PULL_REQUEST_TEMPLATE.md, .claude/skills/pr-screenshots/SKILL.md,
  scripts/pr_shot_targets.mjs (the housing targets Phases 28 to 32 added), docs/qa-gate.md
  (the reviewer table), the wiki build step (`npm run wiki:content`) and tests/guide.test.ts
The agent returns: the matrix row list with the exact command per row (the money and
store-policy row's "earn" scan and token-string pins live in
tests/freehold_store_gates.test.ts), the wave diff surface list mapped to the reviewer
table, the screenshot target ids for the hall interiors, the boards, the
project bar, the Materials Vault chest, and the first-kill plinths (desktop and mobile),
the PR body skeleton from the template, and every open deferral to list in the PR.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files:
- Agent MATRIX: run every row of docs/freeholds/qa-checklist.md over the wave diff, one
  command at a time, reading exit codes; record the result table (row, command, result,
  evidence path) to a file; a row that cannot run is FAIL, never "looks done".
- Agent SHOTS: capture before/after screenshots through the pr-screenshots skill (desktop
  and the compact and tablet mobile targets, landscape, lowest graphics preset seeded
  before page.goto, never finding elements by English text), commit them under
  docs/screenshots/ with explicit paths, and return the markdown block for the PR body.
- Agent WIKI: `npm run wiki:content`, `npx vitest run tests/guide.test.ts`, the guide
  prose keys for the three tiers and the hall amenities, `npm run i18n:gen`, and the
  spoiler check on the generated pages.
Then the coordinator spawns qa-checklist over the whole wave diff plus every reviewer the
matrix names for the surfaces present (the docs/freeholds/implementation-plan.md dispatch
table), for COVERAGE, to files. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- FREEHOLDS_ENABLED defaults off and refuses every housing route and command while dark;
  no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in a housing path reachable on the
  App Store, Google Play, Steam, or Epic; no "earn" language; the seven-row matrix green;
  the economy service owns every price.
- Never sell power; keystone exclusion; zero farm beds; nothing destroyed.
- The PR text contains the word "phase" nowhere, no em dashes, no emojis; vocabulary
  fixed; the sensitive-material sweep runs before any push.
- Push policy: the push happens only after Fernando's explicit go; origin only, never a
  fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Any new behavior or content; a fix found by the matrix is applied as its own commit
  with a re-run of the affected rows, and anything larger is recorded as a deferral.
- Wards, favor, showcases, or deeds (wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The matrix IS the validation: every row of docs/freeholds/qa-checklist.md, plus
  `npx tsc --noEmit`, `npm run ci:changed` after the LAST commit (read the exit code),
  and `node scripts/gate_select.mjs` only for a change CI cannot see.
- Reviewers: qa-checklist plus every reviewer the matrix names (the dispatch table), all
  for COVERAGE not filtering, all to files. No push while a BLOCKING finding stands.

STEP 4 - COMMIT CADENCE:
2 to 4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(screenshots): add the Guildhall before and after captures
- docs(wiki): regenerate the guide for the Guildhall tiers and amenities
- fix(<scope>): <one commit per matrix finding, if any>
- docs(freeholds): record the wave C matrix results
Then `npm run ci:changed`; read the exit code. Then STOP and ask Fernando for the push
go (state.md "Push policy"). On the go: `git push origin <branch>`, open the PR off the
base branch recorded in state.md following .github/PULL_REQUEST_TEMPLATE.md (summary,
related issues, type of change, how it was tested with the matrix table, the screenshots
block, the checklist), then `gh pr checks --watch`.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row has a recorded result from a command that ran; no row
  is FAIL.
- [ ] Screenshots (desktop, compact, tablet) are committed under docs/screenshots/ and
  referenced from the PR body.
- [ ] The wiki is fresh (tests/guide.test.ts green) and spoiler-safe.
- [ ] The PR is open off the recorded base, body complete per the template, no "phase"
  in the PR text, FREEHOLDS_ENABLED off by default, CI green (`gh pr checks --watch`).
- [ ] qa-checklist and every dispatched reviewer report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 33 with the matrix table, the PR number and
  URL, deferrals carried into wave D) and docs/freeholds/state.md ("Current phase", the
  wave D start tip, the PR number, any stacked-branch choice for wave D).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL, the matrix summary, review verdicts,
deferred items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-33-qa.md

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment.
- Stop at "pushed, green, ready for review"; never merge a PR; never enqueue it.
- A red matrix row that needs more than a one-commit fix stops the close: record it and
  name the owning phase file to re-run.
- Do not push the branch without the go; never merge a PR.
```
