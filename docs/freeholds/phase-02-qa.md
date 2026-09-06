# Phase 02 QA: audit the furnishing item kind

Audits `phase-02-furnishing-item-kind.md`. Verdict goes in `progress.md` (row "02 QA"). The
next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 02 (QA) of the Freeholds and Guildhalls feature: audit the furnishing item
kind (the narrow def, every kind consumer arm, the tooltip core, the consumer sweep).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 02 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "02 Furnishing item kind", missing tests, dead
code, the silent-OtherItemDef trap, three-host parity of every gate arm, and i18n
completeness; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", guard exemptions must be positive predicates.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("02 Furnishing item kind" and the
  row), docs/freeholds/phase-02-furnishing-item-kind.md (what was promised)
- the Phase 02 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 02)
- the pins the diff claims: tests/furnishing_item_kind.test.ts,
  tests/furnishing_tooltip_view.test.ts, tests/market_filters.test.ts,
  tests/item_name_color.test.ts, tests/architecture.test.ts (UI_PURE_CORES),
  tests/monolith_budget.test.ts (the hud.ts row)
- an independent census: grep `kind === '` and `switch (def.kind)` and `has(def.kind)`
  across src/sim/, src/ui/, and server/ (outside src/sim/content/) and diff it against the
  consumers the phase touched
The agent returns: the promised-versus-delivered table per deliverable, the consumer
census with each site marked touched, untouched-by-design (with the reason), or MISSED,
every test added with what it asserts, and any TODO, unused import, or arm whose result the
type does not promise.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: OtherItemDef's Exclude list names 'furnishing' (build a def with `use` and
  `kind: 'furnishing'` in a scratch file and prove tsc rejects it); both exhaustive records
  carry the arm; every refusal arm refuses WITHOUT mutating (count items before and after);
  the storability arms accept in both directions; Exchange eligibility matches D25
  (eligible per the mount rule, never reopened); `r` is required in the def shape (a def
  without it fails tsc); the tooltip core returns keys and resolved values only; every arm behaves
  identically offline and through ClientWorld where the gate is client-visible.
- TEST COVERAGE: the sweep uses a synthetic def, never a shipped id; every `it` has a
  DECISIVE assertion (a literal reason token or a false result, never a constant
  self-comparison); every refusal arm has a negative case AND a control that the same call
  succeeds for an eligible kind; the market chip test drives the real itemMatchesType;
  tests/item_icons.test.ts still proves no committed WebP is orphaned; missing cases (a
  furnishing on a bar slot, a furnishing in mail, a furnishing in the guild bank).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture import
  invariant (the tooltip core imports no DOM, no Three, no i18n runtime), the word "phase"
  in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited (translation_keys.generated.ts regenerated, never edited), the
  src/ui/hud/housing/CLAUDE.md present and accurate, no locale overlay touched.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (cross-platform-sync, architecture-reviewer, frontend-seam-reviewer,
test-coverage-auditor), and
finally qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 02 STEP 3 suite list plus `npx tsc --noEmit`, and `npm run i18n:gen`
  followed by `git status --porcelain` (a dirty generated file means a stale regen).

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 02 acceptance box is verified by a check that ran, not by inspection.
- [ ] The consumer census shows no MISSED site.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "02 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-03-content-tiers-and-basics.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 02 file
  (phase-02-furnishing-item-kind.md) as the next file to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
