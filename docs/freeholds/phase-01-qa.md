# Phase 01 QA: audit the foundation

Audits `phase-01-foundation.md`. Verdict goes in `progress.md` (row "01 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 01 (QA) of the Freeholds and Guildhalls feature: audit the foundation (the
facet, the sim module skeleton, the flag, the RL exclusion).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 01 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "01 Foundation", missing tests, dead code,
determinism, three-host parity, i18n completeness, and the fail-closed flag; fix what
the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("01 Foundation" and the row),
  docs/freeholds/phase-01-foundation.md (what was promised)
- the Phase 01 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 01)
- the pins the diff claims: tests/world_api_parity.test.ts, tests/sim_context.test.ts,
  tests/monolith_budget.test.ts, tests/env_protocol.test.ts,
  tests/server/freehold_wire.test.ts, tests/server/freehold_routes.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub that returns a value the facet's type does not promise.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the facet member
  set equals the Phase 01 list ("THE PHASE 01 FACET MEMBER LIST" in the implementation
  file, mirrored in progress.md "01 Foundation") with matching kinds on both prototypes;
  every housing command refuses while dark on BOTH dispatch arms (the WS pre-switch
  predicate in server/freehold_wire.ts, which must refuse before the heavy-self mark, and
  the REST route answering freehold.disabled); SimConfig.freeholdsEnabled maps from the
  env only through server/sim_boot_config.ts and both non-server constructors pass true
  (D85); the ctx.freeholds view is live (mutation through the Sim is visible
  through ctx); the extractions are move-not-rewrite (diff the moved bodies); offline and
  online stubs behave identically (null, no-op); the generated module/test were moved
  to the chosen _routes paths with registry and test imports repaired; both
  freehold.invalid_input and freehold.disabled keep their error catalog, English leaf,
  API_ERROR_KEYS, EXPECTED_CODES, and KNOWN_CODES rows; .env.example carries the commented
  FREEHOLDS_ENABLED row and DEPLOY.md "Operational notes" documents it as default off,
  strict '1', never enabled in production before the signed release gates (the row 27-qa
  and 39-qa later assert).
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; literal counts written fresh; the flag pin toggles the env
  and asserts refusal per command with no heavy-self dirty flag; the boot-mapping pin
  covers '1', unset, '0' and 'true'; the ACTIONS exclusion asserts absence by literal);
  orphaned tests; missing negative cases (flag set to 'true' or '0' still dark).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, the local CLAUDE.md present and accurate.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (cross-platform-sync, architecture-reviewer, privacy-security-review,
server-hot-path-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Verify redoPlacement/redo_placement are present in both stubs, every command/facet pin,
  flag-refusal table and RL exclusion. Opaque public plot identity is distinct from the
  internal owner stamp; no foundation type promises to serialize raw ownership keys.
- Preserve the verified pvp barrel exemplar and the exact scaffold/move/error-catalog
  recipe; count pins are measured at the actual implementation head.

EPHEMERAL BUILD-PRESENCE CONTRACT (C03; D20 names remain unchanged):
NEW facet setFreeholdBuildPresence(active: boolean) and command
set_freehold_build_presence carry active, acknowledged opaque plotId,
acceptedTransitionId and monotonic buildPresenceSeq. The host supplies authenticated
session and current claim generation; payload identities only reject stale delivery.
01 owns the stub/registry, 08 implements NEW
src/sim/freehold/build_presence.ts::setFreeholdBuildPresence and 08a publishes only
freeholdState.isDecorating. UI 11 sends start/stop through the real command; 18 reads the
public boolean. Public false is initialized explicitly, including empty first snapshots.

Capture the actual receiving socket binding before queues and validate it again at
dispatch, extending the housing ingress seam with trusted host metadata. No client
field supplies that authority. buildPresenceSeq is scoped to that binding; reconnect
starts a fresh inactive window while preserving acceptedTransitionId history. An old
socket or queued old-generation frame cannot set or clear the new window. Test reload
and reconnect with a reset client counter after a previously larger sequence.

Current edit authority and the accepted plot/entry must match before start. Track only
bounded current authorized sessions privately and aggregate true while any edits.
Close/leave/disconnect/permission or claim revocation clears that session immediately.
A late close cannot clear a newer entry; stale start or sequence replay cannot revive
one. Reconnect starts inactive and 11 may explicitly reenter after fresh authority.
Presence does not save SQL/JSON, consume a receipt, bump durable layout history, or
include ghost, camera, selected copy, bags/vault, undo history or actor/account IDs.
Presence-only changes invalidate the public descriptor's ephemeral revision/signature
without mutating durable_rev; unchanged state creates no repeated payload allocation.

This 01 pair proves only the declared facet, dark/null stub, payload schema and
command/facet/dispatch/RL pins on both worlds; no real presence behavior ships here.
08 owns NEW tests/freehold_build_presence.test.ts and 08a owns the actual command-chain/
wire evidence. Those later pairs prove two owner sessions, guest refusal, disconnect/revocation, stale entry/sequence,
reconnect inactive, independent-session clears and exact owner/visitor public key sets.
A visitor observes the same committed furniture while an owner edits; no ghost leaks.

STEP 3 - VALIDATION:
- Run the Phase 01 STEP 3 suite list plus `npx tsc --noEmit`.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: cross-platform-sync, architecture-reviewer, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
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
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 01 acceptance box is verified by a check that ran, not by inspection.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "01 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-02-furnishing-item-kind.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 01 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
