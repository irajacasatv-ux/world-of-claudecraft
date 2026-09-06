# Phase 44a QA: audit final Codex artwork and placeholder-image sweep

Audits `phase-44a-final-codex-artwork.md`. Record the verdict in `progress.md` row "44a QA".
The next implementation starts only after this audit passes.

### Starter Prompt
```
This is Phase 44a QA of the Freeholds and Guildhalls feature.
Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; Claude-specific memory, Workflow and
agent-runtime instructions do not apply under Codex (AGENTS.md).
Goal: verify every promised deliverable, adversarial failure case and settled ruling
against the real implementation diff; fix all findings and review the fix round.

STEP 0 - PRE-FLIGHT:
Work in the state.md worktree/branch. Verify git status is clean; ask if it is dirty.
Sync per state.md "Worktree, base, and merge-forward"; after a non-empty merge run the
release-merge-audit skill and install frozen dependencies if patches/ moved. Read
state.md "Gotchas" for test-pin traps, "apply ALL findings" and "review the review-fix
round" (Codex has no Claude memory, AGENTS.md).

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use Codex's built-in image generation tool (an external
prerequisite of the Codex harness, not a repository skill: STOP and record the named
gate if it is unavailable) following docs/design/eastbrook-vale-rebuild/imagegen-prompts.md
with an imagegen-provenance.md row, and the woc-image-to-glb workflow, with their
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent over state.md, progress.md row 44a, ux-spec.md, the implementation
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
- Match the complete feature diff/content tables to the final-artwork inventory;
  search placeholder constants, runtime fallback branches and unregistered assets.
  No hidden or rarely used icon/image escapes because a hero screenshot looked final.
- Confirm Codex authored every new visual through Codex's built-in image generation
  tool (an external prerequisite; its absence is a recorded named gate, never a
  Claude-side substitute) and the woc-image-to-glb workflow. Inspect actual shipped
  bytes, generated registration, provenance, CREDITS, affected-family fingerprints and
  meaningful can-fail art tests.
- The D86 evidence handed to 44b shows denied-surface runtime absence (no DOM node,
  handler, request, fetched catalog, error copy or accessible text) and states
  explicitly that the purchase code and English keys ship dormant in every bundle
  under the runtime capability.
- Distinguish intentional spoiler silhouettes/final procedural/SVG from placeholders
  using explicit approval. Reject gallery-only proof: every replacement has real
  desktop/compact/tablet/LOW context, displayed-size legibility and fairness checks.
- No earlier final-art gate was postponed to this sweep. The residual inventory is
  fully closed, a fresh reviewer read all fixes, and the next file is 44b legal handoff.
Audit strict decode, malformed/max-size preservation, current authorization, keyed
player strings, focus return and all input modes where UI exists, deterministic
three-host parity, no monolith growth, and test-pin freshness where applicable.
Dispatch content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
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
in progress.md row "44a QA" and state.md's ledger. Preserve signed-artifact status.

STEP 7 - FINAL RESPONSE FORMAT:
Report verdict, findings and fixes, exact checks, gate status and FULL PATH of next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44b-final-legal-handoff.md

STOPPING RULES:
A FAIL verdict reruns the owning implementation with the findings attached. Do not
push the branch or open/merge a PR in this audit.
```
