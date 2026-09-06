# Phase 44 QA: audit the wave E close (the packet's final audit)

Audits `phase-44-wave-e-close.md` (the close itself, the teardown, and the PR; the
wave's code was gated by Phases 40 to 43 and their QA files). This is the LAST file of
the packet: its verdict goes in `progress.md` (row "44 QA") if the directory still
exists, else in the PR body under "Close audit" and in memory. It names no next file.

### Starter Prompt
```
This is Phase 44 (QA) of the Freeholds and Guildhalls feature: audit the wave E close
(both matrix records, the screenshots, the deferral list, the teardown commit, the PR
body, CI). This is the final audit of the packet.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that the wave E close recorded complete wave and packet matrices from
checks that ran, that the screenshots and wiki landed, that every deferral is surfaced
in the PR body, that the teardown (if it happened) removed exactly docs/freeholds/ in
its own commit after an explicit yes, that the PR body is complete and clean with every
flag off, and that CI is green; fix what the audit finds; record the final verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in this prompt's history
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds or the stacked wave branch the Phase 44 final response names.
  Verify `git status` is clean; if not, ask the user.
- If docs/freeholds/ was removed, this prompt was pasted from the scratchpad copy or
  from `git show <teardown-commit>~1:docs/freeholds/phase-44-qa.md`; read state.md,
  progress.md, and qa-checklist.md from that same pre-teardown commit with `git show`.
- Sync the base per the pre-teardown state.md "Base and merge-forward" (merge
  origin/feature/masterwrought while PR #3872 is open, else the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, "CI is the gate", "format pass is not a check pass", "PR merge
  needs approval", "no sensitive material in the open repo", "delete worktree after
  merge" (the worktree is removed only after the merge, by Fernando's go, never here).

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- the pre-teardown state.md, qa-checklist.md, and progress.md (row 44 with both matrix
  tables, rows 40 to 43 and their deferrals, every OPEN item), and
  phase-44-wave-e-close.md (what was promised), each from the working tree or from
  `git show <pre-teardown-commit>:docs/freeholds/<file>`
- the close diff: `git log --oneline <phase-start>..HEAD` and the full diff
  (screenshots, wiki regen, matrix fixes, the progress record, the teardown commit)
- the PR: `gh pr view <number> --json body,baseRefName,headRefName,state`, `gh pr checks
  <number>`, the screenshot paths the body references, docs/screenshots/ on disk,
  .env.example on the PR head (every housing flag commented out)
The agent returns: both matrix tables with, per row, whether the recorded evidence
names a command and an exit code; every screenshot the body links and whether it exists
at that path; the PR base versus the recorded base; the CI check list with states;
whether the body carries the complete deferral list (compare against every deferral in
rows 01 to 43 and every OPEN item) and the counsel gates' status; the teardown commit's
file list (anything but docs/freeholds/ is BLOCKING; docs/prd/woc/freehold-service-contract.md
and docs/prd/woc/freehold-deed-service-contract.md must still exist on the head) and
whether the conversation record shows an explicit yes; any "phase", em dash, emoji, forbidden vocabulary, secret,
or service URL in the PR body, the commits, or any pushed file.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row in BOTH tables was verified by a command (re-run any row
  whose record lacks a command or an exit code); the PR base is the recorded base;
  every housing flag and the collectible switch default off on the PR head; the
  teardown commit contains exactly docs/freeholds/ and followed an explicit yes, and both
  docs/prd/woc/ service contract docs survive it; the
  deferral list is complete; issues were filed only for named items; the fix commits
  are scoped.
- TEST COVERAGE: the matrix rows that name suites cite suites that exist and ran on the
  PR head; no suite was skipped by an env gate without a note; every housing pin suite
  from Phases 01 to 43 is in the CI shard selection; the seven-row matrix ran in CI.
- DEAD CODE AND HYGIENE: no "phase" in the PR text or the wave's commits (and, after a
  teardown, nowhere in the tree: `grep -rn "Phase [0-9][0-9]" src/ server/ tests/ docs/`
  returns nothing housing-related), no em dashes or emojis, the vocabulary rule, no
  secret or service URL in any pushed file, the screenshots are the sizes the skill
  prescribes, the wiki is spoiler-safe and store-safe, no stray planning file or
  scratch note outside docs/freeholds/ survived.
Then the dispatch reviewers: qa-checklist over the whole packet diff and
test-coverage-auditor over the wave's pin suites, both for COVERAGE, both to files.

STEP 3 - VALIDATION:
- `gh pr checks <number>` green; `npx tsc --noEmit`; `npm run ci:changed` on the head;
  re-run any matrix row the audit questioned.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). A fix to code re-runs the affected matrix
  rows. Commit fixes separately from the verdict, Conventional Commits with scope and
  body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Review the fix
  commits with a FRESH reviewer. Push the fixes to the open PR only if Fernando's push go
  from Phase 44 covers follow-up commits; otherwise stop and ask. `gh pr checks --watch`
  after any push. A teardown commit that removed more than docs/freeholds/ is reverted
  and redone, never patched.

STEP 5 - ACCEPTANCE:
- [ ] Both matrix tables are backed by commands that ran; the PR body is complete and
  clean with every flag off and the deferral list; CI is green on the final head.
- [ ] The teardown, if it happened, removed exactly docs/freeholds/ after an explicit
  yes, in its own commit.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- If docs/freeholds/ remains: progress.md row "44 QA": verdict (PASS /
  PASS-WITH-FOLLOWUPS / FAIL), counts found and fixed, deferred items; state.md
  "Current phase": PACKET COMPLETE. If it was removed: the same record goes into the PR
  body under "Close audit" (edit the body through `gh pr edit`) and into memory.
- Record in memory: the packet is complete, the five wave PR numbers, the deferral
  list's home, the rulings still owed, and every surprising rule learned; batch any
  tooling improvement to the end of this session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, the PR URL and CI state, counts found and fixed, deferred
items, and the statement that the Freeholds and Guildhalls packet is COMPLETE. There is
no next file: the packet ends here. What remains is Fernando's: the PR review and merge,
the worktree removal after the merge, counsel's sign-off, and the deploy per DEPLOY.md.

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 44 file (from the tree
  or from git history) as the next file to re-run with the findings attached.
- Never push without a go that covers the push; never merge a PR; never remove the
  worktree; never enable a flag.
```
