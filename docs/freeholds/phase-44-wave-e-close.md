# Phase 44: wave E close (the final matrix, the packet teardown offer, the PR)

Wave E, depth, the last phase of the packet. The spec is `progress.md` "44 Wave E
close"; the matrix is `qa-checklist.md` (run over the wave E diff AND once more over the
whole feature at packet completion); the PR rules are `implementation-plan.md` "PR
cadence" and `state.md` "Push policy"; the teardown rule is `brainstorm.md` D12. This is
the final QA variant: it runs the matrix, captures screenshots, runs the wiki pass,
surfaces every deferred follow-up, offers the packet teardown, and opens the wave E PR
only after Fernando's push go. It ships no new behavior.

### Starter Prompt
```
This is Phase 44 of the Freeholds and Guildhalls feature: wave E close (the final
integration matrix over Phases 40 to 43 and over the whole feature, screenshots, the
wiki pass, the packet teardown offer, the wave E PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: prove wave E and the whole feature (every row of docs/freeholds/qa-checklist.md
verified by a check that ran, twice: the wave diff and the packet diff), commit the
screenshots, surface every deferral, offer the teardown of docs/freeholds/ exactly
once, and open the wave E PR off the base branch with every housing flag defaulting
off, then watch CI to green.

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
  sensitive-material sweep, tooling improvements at session end.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (every OPEN item and gate, every ruling), docs/freeholds/qa-checklist.md
  (every row), docs/freeholds/progress.md (EVERY row 01 to 43 and every QA row: every
  deferral, every verdict, the Phase 20, 27, 33, and 39 close records), brainstorm.md
  (O1 to O7), this file
- the wave diff: `git log --oneline <wave-e-start>..HEAD` and `git diff <wave-e-start>..HEAD
  --stat --name-only`, with <wave-e-start> the tip recorded at the Phase 39 close; the
  packet diff: `git diff <packet-base>..HEAD --stat --name-only` with <packet-base> the
  base state.md records
- .github/PULL_REQUEST_TEMPLATE.md, .claude/skills/pr-screenshots/SKILL.md,
  scripts/pr_shot_targets.mjs (the Keep, Citadel, courtyard, tower, dye picker, layout
  tab, second-plot, and professions targets), docs/qa-gate.md, .claude/skills/file-issue/SKILL.md
The agent returns: the matrix row list with the exact command per row; the wave and
packet diff surface lists mapped to the reviewer table; the screenshot target ids
(desktop, compact, tablet); the PR body skeleton; the COMPLETE deferral list (every
progress.md deferral, every OPEN item in state.md and brainstorm.md, every ruling still
owed), each with its source row, as the input to the teardown offer.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files:
- Agent MATRIX: run every row of docs/freeholds/qa-checklist.md over the WAVE diff and
  again over the PACKET diff, one command at a time, reading exit codes; record both
  result tables (row, command, result, evidence path) to a file; a row that cannot run
  is FAIL, never "looks done".
- Agent SHOTS: capture before/after screenshots through the pr-screenshots skill
  (desktop and the compact and tablet mobile targets, landscape, lowest graphics preset
  seeded before page.goto, never finding elements by English text), commit them under
  docs/screenshots/ with explicit paths, and return the markdown block for the PR body.
- Agent WIKI: `npm run wiki:content`, `npx vitest run tests/guide.test.ts`, the guide
  prose keys for the top tiers, dyes, layout sharing, the second freehold, and (if
  built) Carpenter and Mason; spoiler-safe and store-safe; `npm run i18n:gen`.
Then the coordinator spawns qa-checklist over the whole PACKET diff plus every reviewer
the matrix names for the surfaces present (the docs/freeholds/implementation-plan.md
dispatch table), for COVERAGE, to files. Never `mode: "plan"` on teammates.

THE TEARDOWN OFFER (after the matrix is green, before the push go):
- Surface every deferred follow-up FIRST: write the complete deferral list (source row,
  the item, the owner) into the PR body draft under "Deferred follow-ups" and print it
  in the conversation; offer to file each as a GitHub issue through the file-issue
  skill, and file only the ones Fernando names.
- Then ask Fernando EXPLICITLY, in one question: "Remove docs/freeholds/ now?" Do not
  infer consent from a push go or from silence.
- On an explicit yes: copy docs/freeholds/phase-44-qa.md to the session scratchpad and
  print that path (the QA session pastes from there; the file also stays in git
  history), then run `git rm -r docs/freeholds/` and commit it ALONE, titled exactly
  `docs: remove freeholds planning scaffolding`, with a body that names the packet, the
  five wave PRs, where the deferral list lives (the PR body), and the two durable
  artifacts that stay: docs/prd/woc/freehold-service-contract.md and
  docs/prd/woc/freehold-deed-service-contract.md. Nothing else goes in that commit and
  nothing else is removed; docs/prd/ is never touched.
- On no, or no answer: leave the directory in place, record the offer and its outcome
  in progress.md row 44, and continue.

INVARIANTS THIS PHASE MUST KEEP:
- FREEHOLDS_ENABLED and FREEHOLD_DEEDS_ENABLED default off; allowSerializedCollectibles
  defaults off; every housing and deed route and command refuses while dark; the
  seven-row matrix is green; no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string in any
  App Store, Google Play, Steam, or Epic path; no "earn" language; the economy service
  owns every price; the counsel gates are stated in the PR body with their status.
- Never sell power; keystone exclusion; zero farm beds; nothing destroyed, nothing
  repossessed; the vocabulary rule; the word "phase" nowhere in the PR text or commits;
  no em dashes, no emojis; the sensitive-material sweep before any push.
- The teardown removes docs/freeholds/ and nothing else, only on an explicit yes, in
  its own commit; docs/prd/woc/freehold-service-contract.md and
  docs/prd/woc/freehold-deed-service-contract.md stay in place as durable artifacts.
- Push policy: the push happens only after Fernando's explicit go; origin only, never a
  fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Any new behavior or content; a fix found by the matrix is applied as its own commit
  with a re-run of the affected rows, and anything larger is a deferral.
- Enabling any flag anywhere; a deploy (DEPLOY.md is a separate, deliberate step);
  filing issues Fernando did not name.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The matrix IS the validation, run twice (wave and packet), plus `npx tsc --noEmit`,
  `npm run ci:changed` after the LAST commit (read the exit code), and
  `node scripts/gate_select.mjs` only for a change CI cannot see.
- Reviewers: qa-checklist over the packet diff plus every reviewer the matrix names,
  all for COVERAGE not filtering, all to files. No push while a BLOCKING finding stands.

STEP 4 - COMMIT CADENCE:
3 to 5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(screenshots): add the depth-wave and whole-feature captures
- docs(wiki): regenerate the guide for the top tiers, dyes, and layout sharing
- fix(<scope>): <one commit per matrix finding, if any>
- docs(freeholds): record the wave E and whole-feature matrix results
- docs: remove freeholds planning scaffolding (ONLY on the explicit teardown yes)
Then `npm run ci:changed`; read the exit code. Then STOP and ask Fernando for the push
go (state.md "Push policy"). On the go: `git push origin <branch>`, open the PR off the
base branch recorded in state.md following .github/PULL_REQUEST_TEMPLATE.md (summary
stating every flag off and the counsel gates' status, related issues, type of change,
how it was tested with both matrix tables, the screenshots block, the deferred
follow-ups, the checklist), then `gh pr checks --watch`.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row has a recorded result from a command that ran, for the
  wave diff and for the packet diff; no row is FAIL.
- [ ] Screenshots (desktop, compact, tablet) are committed under docs/screenshots/ and
  referenced from the PR body.
- [ ] The wiki is fresh (tests/guide.test.ts green), spoiler-safe, and store-safe.
- [ ] The deferral list is complete (every progress.md deferral and every OPEN item
  appears) and lives in the PR body; issues were filed only for the items Fernando named.
- [ ] The teardown question was asked explicitly and its outcome recorded; if yes, the
  removal commit contains docs/freeholds/ and nothing else, both service contract docs
  under docs/prd/woc/ still exist, and the QA prompt copy's path was printed.
- [ ] The PR is open off the recorded base, body complete per the template, no "phase"
  in the PR text, every flag off by default, CI green (`gh pr checks --watch`).
- [ ] qa-checklist and every dispatched reviewer report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- If the packet directory remains: update docs/freeholds/progress.md (row 44 with both
  matrix tables, the PR number and URL, the teardown outcome) and docs/freeholds/state.md
  ("Current phase": packet complete, awaiting the Phase 44 QA). If it was removed: the
  same record goes into the PR body and the final response.
- Record in memory: the packet outcome, the five PR numbers, the deferral list's home,
  and every surprising rule learned; batch any tooling improvement to the end.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL, both matrix summaries, review verdicts,
the deferral list, the teardown outcome, the scratchpad path of the QA prompt copy if
the teardown happened, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44-qa.md
(if the teardown happened, the same prompt at the printed scratchpad path, or via
`git show <teardown-commit>~1:docs/freeholds/phase-44-qa.md`).

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment.
- Never remove docs/freeholds/ without the explicit yes to the teardown question; never
  remove anything else with it.
- Stop at "pushed, green, ready for review"; never merge a PR; never enqueue it.
- A red matrix row that needs more than a one-commit fix stops the close: record it and
  name the owning phase file to re-run.
- Do not push the branch without the go; never merge a PR.
```
