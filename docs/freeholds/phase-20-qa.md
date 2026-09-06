# Phase 20 QA: audit the wave A close

Audits `phase-20-wave-a-close.md`: the close itself (matrix results recorded, PR body
complete, CI green, no "phase" leak), not the wave's feature code (each phase's own QA
already did that). Verdict goes in `progress.md` (row "20 QA"). Wave B never starts
before this file has run and `state.md` records the branching choice.

### Starter Prompt
```
This is Phase 20 (QA) of the Freeholds and Guildhalls feature: audit the wave A close
(the matrix results, the screenshots, the PR body, CI).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that every matrix row was proved by a check that ran, that the PR is
complete and template-conformant with the flag defaulting off, that CI is green, that
no "phase", wallet, token, on-chain deed, or marketplace word leaked into a native-reachable
housing path or the PR text, and that the O1 and O2 handoffs are recorded; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved). A non-empty merge
  after the PR was opened means the PR head moved: note it for the CI re-check below.
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", "CI is the gate", "PR merge needs approval", "never push to fork".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("20 Wave A close" and its matrix
  table), docs/freeholds/qa-checklist.md, docs/freeholds/phase-20-wave-a-close.md (what
  was promised)
- the close diff: `git log --oneline <phase-start>..HEAD`, every fix commit and its
  reviewer report, docs/screenshots/<slug>/, docs/prd/woc/freehold-service-contract.md
- the PR: `gh pr view <number> --json title,body,baseRefName,headRefName,url,mergeable`
  and `gh pr checks <number>`; .github/PULL_REQUEST_TEMPLATE.md
- the matrix outputs the MATRIX agent wrote (the paths recorded in progress.md)
The agent returns: a row-by-row table of matrix claim versus recorded proof (command,
output path, assertion count); the PR body against the template section by section;
every screenshot link resolved to a committed file; the CI check list with states at
the current head; every occurrence of "phase", the banned two-word land phrase from
ruling 9, "wallet", "$WOC", "deed", "mint", "marketplace", or "earn" in the PR title
and body and in the hudChrome.housing.* values; the flag default row and its pin.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every matrix row was proved by a command that ran (its output exists and
  shows the assertion count), never by inspection; each fix commit is scoped to one
  finding and was reviewed by the reviewer the dispatch table names; the PR base is the
  branch state.md names and the merge-base is current (no silent drift since the push);
  the store-policy row's proof covers all seven distributions; the flag is unset in every
  committed config and .env.example keeps it commented out.
- TEST COVERAGE: for every matrix row the suite the checklist names exists under that
  name or progress.md records the real name; no row's suite was skipped by an env guard
  (the pg twin ran ARMED, with its describe not skipped); every fix commit added or
  updated a DECISIVE test that fails on regression; the copy-rule scan and the "earn"
  scan were run over the whole wave diff, not the last commit.
- DEAD CODE AND HYGIENE: no leftover screenshot rig, TODO, debug flag, or stray
  `.only(`; the PR title and body carry no "phase"; every commit carries a body;
  docs/freeholds/ holds no PR-body draft junk; freehold-service-contract.md names exactly the SKUs
  in src/sim/content/freehold/charters.ts; docs/screenshots/ holds only referenced files.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces the
close diff touched (test-coverage-auditor over the fix commits, privacy-security-review
over the PR text and the store-policy row, plus whichever domain reviewer a fix commit's
surface names), and finally qa-checklist (the completion gate), all for COVERAGE, all
to files.

STEP 3 - VALIDATION:
- Re-run every matrix row the audit doubted, one vitest file at a time, plus
  `npx tsc --noEmit`; confirm `gh pr checks <number>` is fully green at the CURRENT head.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code. A fix that must reach the open PR is pushed
  only if Fernando's Phase 20 go covered follow-up pushes on the same PR; otherwise
  commit locally, stop, and ask. After any push, `gh pr checks --watch` to green.

STEP 5 - ACCEPTANCE:
- [ ] Every matrix row in progress.md points at a proof that ran, not an inspection.
- [ ] The PR body is complete per the template, carries no "phase" or forbidden word,
  every screenshot link resolves, O1 and O2 are recorded, the flag default off is stated.
- [ ] CI is green at the current head; no BLOCKING or SHOULD-FIX item remains open;
  deferred nits are listed with a reason; the fix commits were reviewed.
- [ ] state.md records the wave B branching choice and the PR number.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "20 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: the PR head SHA the verdict covers; anything the fixes
  changed in a ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, the PR URL and CI
state, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-21-lodge-tier-and-upgrade.md
State in the same line that wave B starts only on the branch state.md records for it:
if the choice is "after the PR merges", the next session waits for the maintainer's
merge and syncs per STEP 0 first.

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name phase-20-wave-a-close.md as the
  next file to re-run with the findings attached.
- Do not push the branch without a go; never merge a PR.
```
