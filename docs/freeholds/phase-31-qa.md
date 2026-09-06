# Phase 31 QA: audit guild-level deeds and first-kill trophies

Audits `phase-31-guild-deeds-and-first-kill-trophies.md`. Verdict goes in `progress.md`
(row "31 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 31 (QA) of the Freeholds and Guildhalls feature: audit guild-level deeds
and first-kill trophies.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 31 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "31 Guild-level deeds and first-kill trophies",
missing tests, dead code, determinism, three-host parity, persistence safety, and the
content obligations; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("31" and its row),
  docs/freeholds/phase-31-guild-deeds-and-first-kill-trophies.md (what was promised)
- the Phase 31 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 31)
- the pins the diff claims: tests/freehold_guild_deeds.test.ts, tests/sim_context.test.ts,
  tests/server/guild_deeds_db.test.ts (and its pg twin), tests/deeds_content.test.ts,
  tests/social_system.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the credit site is the one clear-credit site and it reads deed state
  without re-granting character deeds; exactly-once holds across a relog and across two
  guilds; the guild record uses the load, serialize, evict idiom and never persists whole
  from one session; the DDL is additive and keep-forever; guild delete cascades the rows
  and the social_system guards still hold; the hall plinths show the finish per
  difficulty; offline and headless hold an empty map without a crash; every extraction is
  move-not-rewrite (diff the moved bodies).
- TEST COVERAGE: every claimed pin has a DECISIVE assertion (literal deed ids and prop
  ids written fresh; a same-seed twin run with a work-happened anchor; the second clear
  asserts no second row; a per-dimension negative for a non-guild party's clear); no
  constant self-comparison; parity goldens regenerated in their own commit if an emit
  joined a driven path.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall (on-chain words only; Book of Deeds ids are
  allowed), the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, the freehold/ CLAUDE.md updated for the new module.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, content-obligations-reviewer, migration-safety,
privacy-security-review, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 31 STEP 3 suite list plus `npx tsc --noEmit`, including the pg-armed
  twin with TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 31 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "31 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-32-hall-and-manor-tiers.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 31 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
