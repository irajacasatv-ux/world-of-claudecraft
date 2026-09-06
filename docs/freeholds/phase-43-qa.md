# Phase 43 QA: audit existing-craft coverage and future expansion handoff

Audits `phase-43-carpenter-and-mason.md`. Record the verdict in `progress.md` row "43 QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 43 QA of the Freeholds and Guildhalls feature.
Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 43, ux-spec.md, the implementation
file, the referenced acceptance artifacts (signed, or still named unsigned release
gates), the complete scoped diff and all claimed tests.
Return to a scratch report: promised/delivered table, each new symbol's actual consumer,
each test's assertion and failure control, changed anchors, unused code and gate evidence.

STEP 2 - AUDIT:
Deliverables (at most five):
1. Complete promised/delivered and adversarial correctness report.
2. Decisive test, runtime-evidence and hygiene coverage report.
3. Applied fixes, fresh fix review and recorded final gate verdict.

Fan out three read-only coverage auditors: correctness, test coverage, and hygiene.
Each reports every issue, including uncertain issues and nits, with severity/confidence
and evidence to a file. Audit these specific requirements:
- The deliverable is the measured handoff only: no new skill, station, recipe,
  persistence enum, title, UI, wiki content or Carpenter/Mason build is authorized.
- Existing ten-profession coverage is complete and profession-free ownership/upgrade
  remains attainable. No invented skill cap, twenty-recipe requirement or future
  release promise hides in a handoff table.
- Every evidence anchor resolves; a future expansion names its separate authorization,
  numeric provenance and actual review responsibilities. Current packet/deck/guide
  wording consistently records the closed exclusion (D68), not a postponed product
  vote; state.md's D1-D26 text, D14 included, is byte-identical after the sweep.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch content-obligations-reviewer, architecture-reviewer, test-coverage-auditor and qa-checklist
for the actual surfaces. The promised diff is docs-only: record persistence/DB review,
database-performance review and disposable-PG evidence as justified not-applicable,
and require them (with real-PG evidence; fake pools do not prove locks, query plans or
concurrency) only if the actual diff touched JSON, a caller, SQL or a stored shape.

STEP 3 - VALIDATION:
Run every implementation STEP 3 command. Disposable-PG evidence is justified
not-applicable for the docs-only diff and required only if runtime files changed.
Record exact commands, exit codes and evidence paths; an env-skipped suite is not
runtime proof. Run node scripts/gate_select.mjs before completion.

STEP 4 - FIX:
Apply ALL findings including nits. Re-run affected checks. A fresh reviewer reads the
fix commits before completion. Commit fixes separately using scoped Conventional
Commits with bodies and EXPLICIT paths, no coauthor trailer, no word "phase".
Run npm run ci:changed after the last commit and read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance has a decisive recorded check and evidence.
- [ ] All findings are applied; contradictions with a locked ruling are resolved in
  the report without silently changing that ruling. No unresolved implementation gap.
- [ ] The fresh fix review passes and the shared contribution gate passes.

STEP 6 - DOC UPDATES + MEMORY:
Record PASS or FAIL, findings/fixes, actual commands, evidence and tracked release gates
in progress.md row "43 QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44-wave-e-close.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Do not
push the branch or open/merge a PR in this audit.
```
