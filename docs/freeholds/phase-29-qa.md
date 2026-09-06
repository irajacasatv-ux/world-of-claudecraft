# Phase 29 QA: audit Guildhall purchase and upkeep

Audits `phase-29-guildhall-purchase-and-upkeep.md`. Verdict goes in `progress.md` (row
"29 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 29 (QA) of the Freeholds and Guildhalls feature: audit Guildhall purchase
and upkeep (the pooled purchase, 2x decay, the fund-paid ledger, donations and the
weekly cap, the contribution log with retention).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 29 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "29 Guildhall purchase and upkeep", missing
tests, dead code, exactly-once purchase, the money gates, server authority over rank
and the cap, persistence and retention, and the keystone exclusion; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave C. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the storage-charter exactly-once entries, the Postgres cluster.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the STEP 1 decisions Phase 29 recorded),
  docs/freeholds/progress.md ("29 Guildhall purchase and upkeep" and the row),
  docs/freeholds/phase-29-guildhall-purchase-and-upkeep.md (what was promised),
  docs/prd/woc/freehold-service-contract.md
- the Phase 29 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 29)
- the pins the diff claims: tests/server/freehold_gates.test.ts,
  tests/freehold_hall_fund.test.ts, tests/freehold_ledger.test.ts,
  tests/freehold_condition.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/provisioner_firewall.test.ts,
  tests/woc_store_window_contract.test.ts, tests/distribution_surfaces.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every place a
price, amount, or split is computed or compared (there should be only the fingerprint
forward), every rank check and its source, the DDL and prune text, the retention
registration, the export row, every test added with what it asserts, and any TODO,
unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the purchase is
  exactly-once across a replayed key, a different key, a crashed session, and a second
  officer; a member cannot purchase or pay from the fund on BOTH dispatch arms; the cap
  resets on the realm week and not on a wall-clock week; the Guildhall ledger draws only
  from the fund's slots through the one planner; 2x decay pauses and graces like 1x; the
  store filter hides both SKUs while dark and the purchase surface is absent on native,
  Steam, and Epic; the contribution log is written once per donation and pruned by the
  registered primitive; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the cap literal is fresh; the
  exactly-once test asserts the record after each replay; the rank tests cover every
  rank per command; the prune test proves the batch bound and the cutoff; the retention
  wiring pin proves exactly-once registration after listen; the pg twin ARMED); orphaned
  tests; a determinism case with a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant and the token firewall, a price or copy field on any SKU record, the
  word "phase" in any code, comment, or commit message, em dashes or emojis, generated
  files hand-edited, an env key without an .env.example row, the STEP 1 decisions
  recorded in state.md, freehold-service-contract.md matching charters.ts.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, database-performance-reviewer,
migration-safety, server-hot-path-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 29 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 29 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "29 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-30-hall-amenities.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 29 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
