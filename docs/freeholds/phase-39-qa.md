# Phase 39 QA: audit the wave D close

Audits `phase-39-wave-d-close.md` (the close itself, not the wave's code, which Phases 34
to 38 and their QA files already gated). Verdict goes in `progress.md` (row "39 QA").
Wave E never starts before this file has run.

### Starter Prompt
```
This is Phase 39 (QA) of the Freeholds and Guildhalls feature: audit the wave D close
(the matrix record, the screenshots, the PR body, CI, the deed flags and the counsel
gate).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that the wave D close recorded a complete matrix from checks that ran, that
the screenshots and wiki landed, that the PR body is complete, clean, and states both
deed flags off and the counsel gate OPEN, and that CI is green; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, "CI is the gate", "format pass is not a check pass", "PR merge
  needs approval", "no sensitive material in the open repo", the test-pin traps catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/qa-checklist.md, docs/freeholds/progress.md
  (row 39 with the matrix table, rows 34 to 38 and their deferrals),
  docs/freeholds/phase-39-wave-d-close.md (what was promised)
- the close diff: `git log --oneline <phase-start>..HEAD` and the full diff (screenshots,
  wiki regen, matrix fixes, the progress record)
- the PR: `gh pr view <number> --json body,baseRefName,headRefName,state`, `gh pr checks
  <number>`, the screenshot paths the body references, docs/screenshots/ on disk,
  .env.example on the PR head (both deed flags commented out)
The agent returns: the matrix table with, per row, whether the recorded evidence names a
command and an exit code; every screenshot the body links and whether it exists at that
path; the PR base versus the base state.md records; the CI check list with states; any
"phase", em dash, emoji, forbidden vocabulary, secret, or service URL in the PR body,
the commits, or any pushed file; whether the body states both deed flags off and the
counsel gate OPEN; every deferral listed versus every deferral in rows 34 to 38.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row was verified by a command (re-run any row whose record
  lacks a command or an exit code); the money and store-policy row's evidence includes
  the seven-row matrix with the deed column, the source pins, the
  freehold_store_gates pins, and the bundle-path grep; the PR base is the recorded base; FREEHOLDS_ENABLED,
  FREEHOLD_DEEDS_ENABLED, and allowSerializedCollectibles still default off on the PR
  head; no src/sim/ path is touched by a deed commit; the fix commits are scoped.
- TEST COVERAGE: the matrix rows that name suites cite suites that exist and ran on the
  PR head; no suite was skipped by an env gate without a note; the wave's new pin suites
  are in the CI shard selection; the seven-row matrix runs in CI, not only locally.
- DEAD CODE AND HYGIENE: no "phase" in the PR text or the wave's commits, no em dashes
  or emojis, the vocabulary rule, no secret, key, or service URL in any pushed file, the
  screenshots are the sizes the skill prescribes and include the native absence, the
  wiki is spoiler-safe and store-safe, progress.md and state.md are consistent with the
  PR and list the two rulings owed for wave E.
Then the dispatch reviewers: qa-checklist over the whole wave diff,
privacy-security-review over the deed and market commits, and test-coverage-auditor over
the wave's pin suites, all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- `gh pr checks <number>` green; `npx tsc --noEmit`; `npm run ci:changed` on the head;
  re-run any matrix row the audit questioned.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). A fix to code re-runs the affected matrix
  rows. Commit fixes separately from the verdict, Conventional Commits with scope and
  body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Review the fix
  commits with a FRESH reviewer. Push the fixes to the open PR only if Fernando's push go
  from Phase 39 covers follow-up commits; otherwise stop and ask. `gh pr checks --watch`
  after any push.

STEP 5 - ACCEPTANCE:
- [ ] Every matrix row is backed by a command that ran; the PR body is complete, clean,
  and states the flags and the counsel gate; CI is green on the final head.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "39 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items carried into wave E. state.md: "Current phase" points at Phase
  40 and repeats that its prestige-deed ruling must be recorded before it starts.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, the PR URL and CI state, counts found and fixed, deferred
items, the rulings owed, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-40-keep-and-citadel-tiers.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 39 file as the next file
  to re-run with the findings attached.
- Never push without a go that covers the push; never merge a PR.
```
