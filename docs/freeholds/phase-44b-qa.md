# Phase 44b QA: audit final Terms and legal-team handoff against completed implementation

Audits `phase-44b-final-legal-handoff.md`. Record the verdict in `progress.md` row "44b QA".
This is the terminal implementation-packet audit; external release sign-offs remain separate.

### Starter Prompt
```
This is Phase 44b QA of the Freeholds and Guildhalls feature.
Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 44b, ux-spec.md, the implementation
file, referenced signed artifacts, the complete scoped diff and all claimed tests.
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
- Compare final implementation and artwork to every legal/service/player promise,
  not only to the early packet. Verify precise clause/surface/test/artwork mappings.
- Inspect all six revised documents, primary-source dates and inaccessible-source
  artifact gates; the live public/terms.html sections 8, 9, 12, 19 and 22 and
  public/privacy.html sections 2, 6 and 8 are named with their dispositions, and the
  Solana Mobile Publisher Policy is cited at legal.solanamobile.com with its retrieval
  date beside the dApp Store Developer Agreement acceptance artifact. No unreviewed
  legal conclusion, new fee/territory or paid-surface enablement is smuggled into the
  handoff; earlier gates were never postponed.
- Check literal D9, original-operation recovery, source-calendar/credit preservation,
  custody/consumer claims, privacy/deactivation/delete/export, final art licensing, the
  D86 dormant-submodel line item (absence is a runtime contract; purchase code and
  English keys ship dormant in every bundle; review notes say "not rendered or
  reachable") and the support-reconciliation ownership statement with its refund-drill
  evidence.
- The cover message/package and named routing/legal owners are concrete. Delivered
  or accepted requires actual evidence; absent recipient/channel remains a tracked
  delivery gate, not a fabricated contact or claim of legal approval.
- Chain ends here after all fixes are freshly reviewed. No packet/durable source
  was deleted; completion distinguishes implementation from external release gates.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch privacy-security-review, migration-safety, database-performance-reviewer, cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
for the actual surfaces, including persistence/DB review of JSON or caller changes.
Database performance must have reviewed decisions and the finished diff; fake pools
do not prove locks, query plans or concurrency.

STEP 3 - VALIDATION:
Run every implementation STEP 3 command and required disposable-PG evidence. Record
exact commands, exit codes and evidence paths; an env-skipped suite is not runtime
proof. Run node scripts/gate_select.mjs before completion.

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
in progress.md row "44b QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report the final verdict, findings/fixes, exact checks, legal handoff artifact and
delivery/sign-off status. State that the implementation packet ends here only on
PASS; there is no next implementation file. External legal review, signed release
gates, authorized publication and deployment remain separately tracked.

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Push fixes
to an open wave E PR only under a go that covers follow-up pushes; otherwise stop and
ask; never open or merge a PR in this audit.
```
