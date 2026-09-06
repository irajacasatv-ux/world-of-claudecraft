# Phase 21 QA: audit the Lodge tier and the upgrade build project

Audits `phase-21-lodge-tier-and-upgrade.md`. Verdict goes in `progress.md` (row "21
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 21 (QA) of the Freeholds and Guildhalls feature: audit the Lodge tier and
the upgrade build project (the tier record and layout, the fee SKU and bill, the
contribute command, carry-over, the second amenity slot).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 21 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "21 Lodge tier and the upgrade build project",
missing tests, dead code, determinism, three-host parity, the money gates, persistence
back-compat, the keystone exclusion, and never-destroy; fix what the audit finds;
record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the storage-charter exactly-once entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("21 Lodge tier and the upgrade
  build project" and the row), docs/freeholds/phase-21-lodge-tier-and-upgrade.md (what
  was promised), docs/prd/woc/freehold-service-contract.md
- the Phase 21 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 21)
- the pins the diff claims: tests/freehold_content.test.ts, tests/freehold_upgrade.test.ts,
  tests/freehold_layout_core.test.ts, tests/provisioner_firewall.test.ts,
  tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the bill's
id list against the keystone, intermediate, and catalyst exclusions, the DDL text
added, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the fee grant is
  exactly-once on replay of the same purchase key AND a different key after completion;
  completion requires the fee key and the full bill in either order; carry-over keeps
  every row that validates in the Lodge rooms and returns or refuses the rest without
  mutating on refusal; the three Inn Room plinth trophies survive two upgrades; the
  flag dark refuses the SKU on BOTH dispatch arms and the store filter; the pre-column
  account_freeholds row loads with no project; the Lodge layout's colliders equal its
  rendered walls (authoredColliders from the same tables); the extractions are
  move-not-rewrite (diff the moved bodies).
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (the
  tier row and bill ids are fresh literals, never read back from the table; the keystone
  sweep spells the three ids and the intermediate words; the exactly-once test asserts
  the record after the replay, not just the return value); a negative case per deny
  reason; the determinism case asserts a work-happened anchor before the equality;
  orphaned tests; the pg twin not skipped.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a price or copy field on the SKU or project
  record (negative pin present), the local CLAUDE.md rows for upgrade.ts and
  upgrade_projects.ts present and accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, architecture-reviewer,
privacy-security-review, migration-safety, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 21 STEP 3 suite list plus `npx tsc --noEmit`, the pg-armed twin, and
  `npm run wiki:content` followed by `npx vitest run tests/guide.test.ts`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 21 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "21 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-22-furnishings-all-crafts.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 21 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
