# Phase 39: wave D close (integration matrix, screenshots, the Wards and Charters PR)

Wave D, Wards and Charters. The spec is `progress.md` "39 Wave D close"; the matrix is
`qa-checklist.md`; the PR rules are `implementation-plan.md` "PR cadence" and `state.md`
"Push policy". This is the final QA variant: it runs the whole-feature matrix over the
wave D diff (Phases 34 to 38), captures screenshots, runs the wiki pass, and opens the
wave D PR only after Fernando's push go. Both deed flags stay off. It ships no new
behavior.

### Starter Prompt
```
This is Phase 39 of the Freeholds and Guildhalls feature: wave D close (the integration
matrix over Phases 34 to 38, screenshots, the wiki pass, the Wards and Charters PR).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: prove wave D whole (every row of docs/freeholds/qa-checklist.md verified by a check
that ran, with the money and store-policy row given the deed surfaces' full attention),
commit the before/after screenshots, and open the wave D PR off the base branch with
FREEHOLDS_ENABLED and FREEHOLD_DEEDS_ENABLED defaulting off, then watch CI to green.

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
  sensitive-material sweep, the marketplace review verdict.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the counsel gate, both deed flags, the transfer rule),
  docs/freeholds/qa-checklist.md (every row), docs/freeholds/progress.md (rows 34 to 38
  and their QA rows, every deferral, the Phase 33 close record as the shape), this file
- the wave diff: `git log --oneline <wave-d-start>..HEAD` and `git diff <wave-d-start>..HEAD
  --stat --name-only`, with <wave-d-start> the tip recorded at the Phase 33 close
- .github/PULL_REQUEST_TEMPLATE.md, .claude/skills/pr-screenshots/SKILL.md,
  scripts/pr_shot_targets.mjs (the ward, guest book, ward panel, and mint card targets),
  docs/qa-gate.md (the reviewer table), docs/prd/woc/freehold-deed-service-contract.md
The agent returns: the matrix row list with the exact command per row (the money and
store-policy row's "earn" scan and token-string pins live in
tests/freehold_store_gates.test.ts), the wave diff surface list mapped to the reviewer table
(any src/sim/ path under a deed commit is a finding), the screenshot target ids (the
ward square, an exterior per tier, the ward panel with favor and Endeavors, the guest
book, the mint card on web and its absence on a native emulation; desktop, compact,
tablet), the PR body skeleton, and every open deferral and the OPEN counsel gate to
state in the PR.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files:
- Agent MATRIX: run every row of docs/freeholds/qa-checklist.md over the wave diff, one
  command at a time, reading exit codes; for the money and store-policy row also run
  the seven-row matrix, the source pins, and the tests/freehold_store_gates.test.ts
  "earn" and token-string pins, and grep the native, Steam, and Epic bundle paths for deed, wallet, mint, and marketplace strings; record the
  result table (row, command, result, evidence path) to a file; a row that cannot run
  is FAIL, never "looks done".
- Agent SHOTS: capture before/after screenshots through the pr-screenshots skill
  (desktop and the compact and tablet mobile targets, landscape, lowest graphics preset
  seeded before page.goto, never finding elements by English text), commit them under
  docs/screenshots/ with explicit paths, and return the markdown block for the PR body.
- Agent WIKI: `npm run wiki:content`, `npx vitest run tests/guide.test.ts`, the guide
  prose keys for wards, favor, Endeavors, Showcases, and guest books (the guide never
  mentions deeds, wallets, or the marketplace: spoiler-safe and store-safe), `npm run
  i18n:gen`.
Then the coordinator spawns qa-checklist over the whole wave diff plus every reviewer the
matrix names for the surfaces present (the docs/freeholds/implementation-plan.md dispatch
table; privacy-security-review is mandatory for this wave), for COVERAGE, to files.
Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- FREEHOLDS_ENABLED and FREEHOLD_DEEDS_ENABLED default off and refuse every housing and
  deed route and command while dark; allowSerializedCollectibles defaults off; the
  seven-row matrix with the deed column is green; no wallet, $WOC, on-chain deed, mint,
  or marketplace string in any App Store, Google Play, Steam, or Epic path; no "earn"
  language; the economy service owns every price and split; the counsel gate is stated
  OPEN in the PR body.
- Never sell power; keystone exclusion; zero farm beds; nothing destroyed, nothing
  repossessed.
- The PR text contains the word "phase" nowhere, no em dashes, no emojis; vocabulary
  fixed; the sensitive-material sweep runs before any push (no secret, key, or service
  URL in any committed file).
- Push policy: the push happens only after Fernando's explicit go; origin only, never a
  fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Any new behavior or content; a fix found by the matrix is applied as its own commit
  with a re-run of the affected rows, and anything larger is recorded as a deferral.
- Enabling any flag anywhere; Keep, Citadel, dyes, the second SKU (wave E).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- The matrix IS the validation: every row of docs/freeholds/qa-checklist.md, plus
  `npx tsc --noEmit`, `npm run ci:changed` after the LAST commit (read the exit code),
  and `node scripts/gate_select.mjs` only for a change CI cannot see.
- Reviewers: qa-checklist plus every reviewer the matrix names (the dispatch table),
  all for COVERAGE not filtering, all to files. No push while a BLOCKING finding stands.

STEP 4 - COMMIT CADENCE:
2 to 4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(screenshots): add the ward, guest book, and Charter surface captures
- docs(wiki): regenerate the guide for wards, favor, Endeavors, and guest books
- fix(<scope>): <one commit per matrix finding, if any>
- docs(freeholds): record the wave D matrix results
Then `npm run ci:changed`; read the exit code. Then STOP and ask Fernando for the push
go (state.md "Push policy"). On the go: `git push origin <branch>`, open the PR off the
base branch recorded in state.md following .github/PULL_REQUEST_TEMPLATE.md (summary
stating both deed flags default off and the counsel gate is OPEN, related issues, type
of change, how it was tested with the matrix table, the screenshots block, the
checklist), then `gh pr checks --watch`.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row has a recorded result from a command that ran; no row
  is FAIL; the money and store-policy row's evidence includes the seven-row matrix, the
  source pins, the freehold_store_gates pins, and the bundle-path grep.
- [ ] Screenshots (desktop, compact, tablet) are committed under docs/screenshots/ and
  referenced from the PR body, including the native absence of the mint card.
- [ ] The wiki is fresh (tests/guide.test.ts green), spoiler-safe, and store-safe.
- [ ] The PR is open off the recorded base, body complete per the template, no "phase"
  in the PR text, both deed flags off by default, the counsel gate stated OPEN, CI green
  (`gh pr checks --watch`).
- [ ] qa-checklist and every dispatched reviewer report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 39 with the matrix table, the PR number and
  URL, deferrals carried into wave E) and docs/freeholds/state.md ("Current phase", the
  wave E start tip, the PR number, any stacked-branch choice for wave E; the Phase 40
  and Phase 43 rulings listed as owed by Fernando before those phases start).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL, the matrix summary, review verdicts,
deferred items, the two rulings owed for wave E, and the FULL PATH of the next file to
run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-39-qa.md

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment.
- Stop at "pushed, green, ready for review"; never merge a PR; never enqueue it.
- A red matrix row that needs more than a one-commit fix stops the close: record it and
  name the owning phase file to re-run.
- Do not push the branch without the go; never merge a PR.
```
