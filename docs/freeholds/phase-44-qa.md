# Phase 44 QA: audit wave E integration close before final artwork and legal handoff

Audits `phase-44-wave-e-close.md`. Record the verdict in `progress.md` row "44 QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 44 QA of the Freeholds and Guildhalls feature.
Harness: Claude Code (the active harness; this audit is review-only, and D74 requires
Codex only for asset-creating steps). Follow the root CLAUDE.md working-style block for
effort and fan-out.
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Scan memory
for test-pin traps, "apply ALL findings" and "review the review-fix round".

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74); this review-only audit runs in the active harness and hands
any asset-creating matrix fix to a Codex session. Use Codex's built-in image generation
tool (an external prerequisite: STOP if it is unavailable) following
docs/design/eastbrook-vale-rebuild/imagegen-prompts.md with rows in
imagegen-provenance.md and CREDITS.md, and the image-to-GLB workflow in
.agents/skills/woc-image-to-glb/SKILL.md, with their provenance, runtime registration,
fingerprint and in-context checks. This planning audit creates no game assets. Final
art is required here; 44a is a residual sweep, not permission to leave a placeholder
for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 44, ux-spec.md, the implementation
file, referenced signed artifacts, the complete scoped diff and all claimed tests; when
state.md records a push go and a PR number, `gh pr view <number> --json
body,baseRefName,headRefName,state` and `gh pr checks <number>`, otherwise the PR/CI
items read N/A (awaiting authorization) and the drafted body plus the recorded local
gate evidence stand in.
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
- Verify all implemented suffixes and full feature evidence, including exact 07b/07c
  account authority, 13a finality/history, 07a recovery/touch-set and D9 service boundary.
- Check complete ux-spec screenshot/input/fairness and final-art proof; 44a cannot
  excuse missing earlier art. The legal refresh in 44b never waives earlier gates.
- The release draft distinguishes integration success from final artwork/legal
  handoff and external sign-off; every external artifact is recorded as handoff-ready
  with an unsigned release gate unless a signature artifact is on file. No directory or
  durable contract was removed; the proposed preservation destination table exists in
  the row 44 record and nothing was executed from it.
- Assert the literal next chain 44 QA, then 44a, then 44a QA, then 44b, then 44b QA.
  This audit cannot terminate the packet or treat final successors as optional.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
for the actual surfaces, including persistence/DB review of JSON or caller changes.
Database performance must have reviewed decisions and the finished diff; fake pools
do not prove locks, query plans or concurrency.

STEP 3 - VALIDATION:
Run every implementation STEP 3 command and required disposable-PG evidence. Record
exact commands, exit codes and evidence paths; an env-skipped suite is not runtime
proof (the pg-armed twins record "N tests ran, 0 skipped"). Run
node scripts/gate_select.mjs before completion; when a PR exists, confirm
`gh pr checks <number>` is green at the current head.

STEP 4 - FIX:
Apply ALL findings including nits. Re-run affected checks. A fresh reviewer reads the
fix commits before completion. Commit fixes separately using scoped Conventional
Commits with bodies and EXPLICIT paths, no coauthor trailer, no word "phase".
Run npm run ci:changed after the last commit and read the exit code. Push the fixes to
an open wave E PR only if Fernando's Phase 44 go covers follow-up commits; otherwise
stop and ask. `gh pr checks --watch` after any push.

STEP 5 - ACCEPTANCE:
- [ ] Every implementation acceptance has a decisive recorded check and evidence.
- [ ] When state.md records a push go, CI is green at the current PR head; otherwise the
  PR/CI criteria read N/A (awaiting authorization), the local gate is verified at the
  recorded tip and the row is recorded PASS, awaiting publication.
- [ ] All findings are applied; contradictions with a locked ruling are resolved in
  the report without silently changing that ruling. No unresolved implementation gap.
- [ ] The fresh fix review passes and the shared contribution gate passes.

STEP 6 - DOC UPDATES + MEMORY:
Record PASS, PASS awaiting publication, or FAIL, findings/fixes, actual commands,
evidence and tracked release gates in progress.md row "44 QA" and state.md's ledger.
Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44a-final-codex-artwork.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Never push
without a go that covers the push; never merge a PR.
```
