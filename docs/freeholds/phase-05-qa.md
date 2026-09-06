# Phase 05 QA: audit the owner-keyed instance claim

Audits `phase-05-instance-claim.md`. Verdict goes in `progress.md` (row "05 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 05 (QA) of the Freeholds and Guildhalls feature: audit the instance claim
(the two DungeonDef records, claimKey, the freeholdOwnerKey stamp, owner-keyed enter and
leave on both hosts, the lit dispatch).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 05 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "05 Instance claim", D15, D16 and D81, missing tests,
dead code, determinism, three-host parity, server authority of the stamp, and the S3 guard;
fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, parity goldens, "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (D15, D16, D81), docs/freeholds/progress.md ("05 Instance claim" and
  the row), docs/freeholds/phase-05-instance-claim.md (what was promised)
- the Phase 05 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 05), with the goldens commit read separately
- the pins the diff claims: tests/freehold_instance.test.ts,
  tests/freehold_instance_online.test.ts (including the freehold_enter jailed pin),
  tests/freehold_offline_default.test.ts, tests/freehold_dev_grant.test.ts,
  tests/freehold_dev_authorization.test.ts, tests/freehold_dev_bootstrap.test.ts,
  tests/parity/scenarios.ts (freehold_claim), tests/parity/trace.ts (META_EXCLUDE),
  tests/server/freehold_wire.test.ts, tests/monolith_budget.test.ts (sim.ts, game.ts and
  main.ts rows), tests/sim_context.test.ts
- src/sim/instances/dungeons.ts as it stands (the party-key path must read exactly as
  before for a party-keyed def: diff the enterDungeon body against the phase start)
The agent returns: the promised-versus-delivered table per deliverable, the enterDungeon
diff with every changed line classified as owner-branch or party-path, the stamp's writer
and every reader, the extractions with their moved bodies, every test added with what it
asserts, and any TODO, unused import, or reason token declared but never emitted (with the
phase that owns it).

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the party-key path is byte-identical for every existing def; the owner key
  never derives from a client payload (grep the dispatch arm and the join site); two
  sessions of one account resolve the same key and one slot; a party member of a
  different account resolves a different key; the offline fallback is `entity:<pid>` and
  domain-tagged; freeInstance tears the slot down with the live record untouched; the
  reasons dead and combat refuse with no teleport and no slot claimed; a full pool refuses
  with reason `busy` and never reaches enterDungeon's English ctx.error arm; addPlayer
  seeds the tier-0 record for a new owner key on both hosts and never overwrites an
  existing one (D81); setFreeholdTier is the only tier writer and `/dev freehold` refuses
  without both offline permissions (or without ALLOW_DEV_COMMANDS=1 on the server); the
  loopback bridge answers only inside configureServer under the exact contract; the
  extractions are move-not-rewrite; the dark flag still refuses at dispatch for every
  housing command; resetDungeonInstances and the Dungeon Finder ignore both defs.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the slot index and partyKey
  literal, never a self-comparison); the reap test advances INSTANCE_EMPTY_TIMEOUT and
  asserts the slot freed, then re-enters and asserts a fresh claim; the online test drives
  real GameServer.join for two characters of one account; the determinism case asserts a
  work-happened anchor before toEqual; the zero-draw pin uses Rng.setObserver; the jailed
  pin toggles the session flag; the busy case fills all 24 slots by literal and asserts
  the reason token with no `log` event and an unchanged position; the offline-default
  case constructs a bare Sim and asserts entry without any setup call; the dev grant
  suite has every permission combination and the bridge suites cover every listed arm;
  missing negatives (a claimKey-less def still party-keyed, an unknown tier on the
  record refuses, a forged Host on the bridge refuses).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, a golden regenerated inside a code commit (must be its own commit), the
  META_EXCLUDE justification present, the src/sim/CLAUDE.md row updated, the placeholder
  interior recorded in state.md for the Phase 06 swap.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, server-hot-path-reviewer,
content-obligations-reviewer, privacy-security-review, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Distinguish process-local slot reuse from global authority: the wave PR carries 07a's
  durable fence (D12), so this phase adds no second production gate and its online arm
  proves entry through the real dispatch. Same-account characters share a claim;
  different accounts cannot forge owner identity. Full pool emits reason `busy` with no
  text and mutates neither location nor ownership, never a waitlist or loss.
- Verify confirmed-arrival identity and safe facing/position survive the handoff while
  replay/resume does not manufacture a new arrival. No viewer event exposes an internal
  account/guild key. Later visitor counting excludes all owner-account sessions.

STEP 3 - VALIDATION:
- Run the Phase 05 STEP 3 suite list plus `npx tsc --noEmit` and the whole tests/parity/
  suite without UPDATE_PARITY (goldens must already match).

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer, cross-platform-sync, server-hot-path-reviewer, content-obligations-reviewer, privacy-security-review, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - FIX:
- Apply ALL findings, including nits. Resolve a conflict with a locked decision
  explicitly before PASS; a recorded conflict is not a deferred fix. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere; a fix that moves a sampled field or an
  emit regenerates goldens in its own commit. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 05 acceptance box is verified by a check that ran, not by inspection.
- [ ] The enterDungeon diff shows no party-path change.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "05 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the
  ledger row (the default-record seed and the dev grant fixture are 05 rows per D81).
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-06-interiors-gate-and-hearth-key.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 05 file
  (phase-05-instance-claim.md) as the next file to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
