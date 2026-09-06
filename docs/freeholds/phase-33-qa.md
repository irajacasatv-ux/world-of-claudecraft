# Phase 33 QA: audit the wave C close

Audits `phase-33-wave-c-close.md` (the close itself, not the wave's code, which Phases 28
to 32 and their QA files already gated). Verdict goes in `progress.md` (row "33 QA").
Wave D never starts before this file has run.

### Starter Prompt
```
This is Phase 33 (QA) of the Freeholds and Guildhalls feature: audit the wave C close
(the matrix record, the screenshots, the PR body, CI).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that the wave C close recorded a complete matrix from checks that ran, that
the screenshots and wiki landed, that the PR body is complete and clean, and that CI is
green; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, "CI is the gate", "format pass is not a check pass", "PR merge
  needs approval", the test-pin traps catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md, docs/freeholds/progress.md
  (row 33 with the matrix table, rows 28 to 32 and their deferrals),
  docs/freeholds/phase-33-wave-c-close.md (what was promised)
- the close diff: `git log --oneline <phase-start>..HEAD` and the full diff (screenshots,
  wiki regen, matrix fixes, the progress record)
- the PR: `gh pr view <number> --json body,baseRefName,headRefName,state`, `gh pr checks
  <number>`, the screenshot paths the body references, docs/screenshots/ on disk
The agent returns: the matrix table with, per row, whether the recorded evidence names a
command and an exit code; every screenshot the body links and whether it exists at that
path; the PR base versus the base state.md records; the CI check list with states; any
"phase", em dash, emoji, or forbidden vocabulary in the PR body or the commits; every
deferral listed versus every deferral in rows 28 to 32.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row was verified by a command (re-run any row whose record
  lacks a command or an exit code); the PR base is the recorded base; the head is the
  packet branch; FREEHOLDS_ENABLED still defaults off on the PR head; the fix commits
  are scoped to their matrix finding.
- TEST COVERAGE: the matrix rows that name suites cite suites that exist and ran on the
  PR head (compare the CI job list); no suite was skipped by an env gate without a note
  (the pg-armed twins); the wave's new pin suites are in the CI shard selection.
- DEAD CODE AND HYGIENE: no "phase" in the PR text or the wave's commits, no em dashes
  or emojis, the vocabulary rule, no secret or .env material in any pushed file (the
  sensitive-material sweep), the screenshots are the sizes the skill prescribes, the wiki
  regen is fresh, progress.md and state.md are consistent with the PR.
Then the dispatch reviewers: qa-checklist over the whole wave diff and
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
  from Phase 33 covers follow-up commits; otherwise stop and ask. `gh pr checks --watch`
  after any push.

STEP 5 - ACCEPTANCE:
- [ ] Every matrix row is backed by a command that ran; the PR body is complete and
  clean; CI is green on the final head.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "33 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items carried into wave D. state.md: "Current phase" points at Phase 34.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, the PR URL and CI state, counts found and fixed, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-34-wards.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 33 file as the next file
  to re-run with the findings attached.
- Never push without a go that covers the push; never merge a PR.
```
