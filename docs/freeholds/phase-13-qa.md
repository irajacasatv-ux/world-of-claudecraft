# Phase 13 QA: audit condition and the Steward's Ledger core

Audits `phase-13-condition-and-ledger-core.md`. Verdict goes in `progress.md` (row "13
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 13 (QA) of the Freeholds and Guildhalls feature: audit condition and the
Steward's Ledger core (the two pure cores, the pay_ledger command, prepay, the lockout,
the week boundary, the keystone exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 13 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "13 Condition and the Steward's Ledger core",
missing tests, dead code, determinism (zero Rng draws, no wall clock), three-host parity
of the pay outcome and the fhold fields, the never-destroy rule, and the keystone
exclusion; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the provisioner firewall and "one planner per file" entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("13 Condition and the Steward's
  Ledger core" and the row), docs/freeholds/phase-13-condition-and-ledger-core.md (what
  was promised)
- the Phase 13 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 13)
- the pins the diff claims: tests/freehold_condition.test.ts,
  tests/freehold_ledger.test.ts, tests/freehold_determinism.test.ts,
  tests/provisioner_firewall.test.ts (the ledger arm), tests/snapshots.test.ts (the
  fhold arm), tests/freehold_command_chain_online.test.ts, the parity scenario
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, how each host
feeds resetDay, and any TODO, unused import, or arm that mutates on a refusal path.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; conditionAt is a
  pure function of (conditionStampDay, lastSeenDay, resetDay) with the pause and grace
  arms in the
  right order; the week boundary is the realm weekly reset, not a UTC week; the seeded
  order is a stateless hash (no Rng, no Date); planLedger composes planReagentSourceDraw
  per line with explicit gradeIds for produce and countMinusPlanned across lines; the
  pay body plans lock-aware first then raw for the 'item_locked' twin, spends in one batch,
  bags then vault, and no refusal path mutates; "from 93 costs the same as from 60"
  holds; the amenity lock reads conditionAt; the fhold fields are emitted and decoded
  with the same allowlist; the offline and online pay outcomes are identical.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; literal working numbers written fresh and flagged TUNING;
  the keystone sweep iterates every reachable week and asserts absence by literal id;
  a determinism case with a work-happened anchor before the equality; Rng.setObserver
  pinned at zero); orphaned tests; missing negative cases (the ninth prepaid week,
  paying with a vault row a visitor could not reach, a resetDay that goes backwards).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a second planner or a
  hand-copied grade order, the architecture import invariant, tickCount % N or a
  per-tick allocation, the word "phase" in any code, comment, or commit message, em
  dashes or emojis, generated files hand-edited, the freehold CLAUDE.md updated.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, server-hot-path-reviewer,
privacy-security-review if server/ or src/net/ moved, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 13 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 13 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "13 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-14-distribution-surface-map.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 13 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
