# Phase 18 QA: audit visiting

Audits `phase-18-visiting.md`. Verdict goes in `progress.md` (row "18 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 18 (QA) of the Freeholds and Guildhalls feature: audit visiting (the
friends and private policies, set_visit_policy, the server-stamped friend predicate,
the cap of 8, read-only visitors, who-is-home, the offline no-op).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 18 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "18 Visiting", missing tests, dead code, the
friend-stamp trust boundary, the existence-oracle frame, the presence-based cap, the
per-command read-only refusals, three-host parity, and the no-persisted-log rule; fix
what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the server/tests gotcha cluster,
  the offline IWorld live-array aliasing trap, "review the review-fix round", "apply ALL
  findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("18 Visiting" and the row),
  docs/freeholds/phase-18-visiting.md (what was promised)
- the Phase 18 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 18)
- the pins the diff claims: tests/freehold_visiting.test.ts,
  tests/freehold_visiting_online.test.ts, tests/visit_prompt_view.test.ts,
  tests/snapshots.test.ts (the fhold arm), tests/parity/trace.ts (the META_EXCLUDE row),
  tests/server/freehold_wire.test.ts, tests/server/heavy_self.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, where the friend set is captured (and whether it
reads snap.friends only or the mixed socialTrackedIds), how presence is counted, the
exact frames answered for an unknown name, an offline owner, and a name that owns no
freehold, every test added with what it asserts, and any TODO, unused import, or new
table or per-tick roster walk.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the friend set
  comes from the server's social snapshot friends list ONLY (a guildmate who is not a
  friend is refused), is re-stamped on every snapshot and cleared on leave, and a
  missing stamp refuses rather than admits; the block list wins in both directions
  with the same not_friend reason; the cap counts presence (enteredBy filtered by
  instanceClaimContains, owner excluded) so a departed visitor frees a slot; the three
  probe cases answer ONE identical frame; every owner-only command refuses not_owner
  for a visitor and mutates nothing; freeholdVisitors matches on both hosts; the
  offline host has no visitor path, the policy updates the live record only, and a
  fresh offline Sim starts at the friends default (D16: offline persists nothing); no
  table, no log, no tick sweep was added.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; the two-session online test drives real GameServer.join
  sessions and asserts the visitor's raw frames; the ninth-visitor case actually admits
  eight first; the read-only sweep names each command by literal and asserts state
  equality after the refusal; the META_EXCLUDE row carries a justification); orphaned
  tests; missing negative cases (a friend removed after the stamp but before the next
  snapshot, the owner relogging while a visitor is inside, a visitor inside when the
  owner switches to private).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, an account id or a
  whole friend list on the wire, a distinct refusal reason that leaks a block or an
  ownership fact, tickCount % N, a persisted visitor field, the word "phase" in any
  code, comment, or commit message, em dashes or emojis, the freehold and housing
  CLAUDE.md files updated, the prompt window's mobile decision present.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (privacy-security-review, cross-platform-sync,
server-hot-path-reviewer, frontend-seam-reviewer for the prompt window,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 18 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 18 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "18 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-19-art-batch.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 18 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
