# Phase 17 QA: audit trophies

Audits `phase-17-trophies.md`. Verdict goes in `progress.md` (row "17 QA"). The next
implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 17 (QA) of the Freeholds and Guildhalls feature: audit trophies
(TROPHY_DEFS, the eligibility mapping, the retroactive sync, plinth placement, the
provenance tooltip, the Trophies tab, the content obligations).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 17 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "17 Trophies", missing tests, dead code,
determinism (zero Rng, read-only access), the never-an-item rule, three-host parity of
the unlock list and the plinth rows, and every content obligation; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the content and pins/content
  gotcha clusters, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("17 Trophies" and the row),
  docs/freeholds/phase-17-trophies.md (what was promised)
- the Phase 17 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 17), including the regenerated wiki content and the
  parity goldens
- the pins the diff claims: tests/freehold_trophies.test.ts,
  tests/trophy_tooltip_view.test.ts, tests/freehold_content.test.ts (the trophy arm),
  tests/deeds_content.test.ts, tests/snapshots.test.ts (the fhold arm), the parity
  scenario, tests/guide.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every TROPHY_DEFS
row with the source it resolves to, the exact insertion points of syncTrophyUnlocks
(join and first entry), every read it makes and whether any is a write, every test
added with what it asserts, and any TODO, unused import, or path by which a trophy id
could reach an item container.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every source
  kind maps through the real ownership reads (characterReliquaryOwnership, the perfected
  stamp, the curator rank), not a copied list; the sync runs AFTER the join retro block
  so newly retro-granted deeds count; idempotent across relog and the account's second
  character; plinth rows hold one trophy, only a trophy, cost no budget, and the three
  Inn Room plinths carry over; a visitor's descriptor carries the owner's plinth rows;
  offline and online unlock sets are identical for the same save; the Homesteader rows
  are cosmetic only and appended at the end; no Reliquary page and the ruling stated.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; one positive and one negative per source kind; the
  idempotence case asserts the second sync emits nothing AND changes nothing; zero Rng
  through Rng.setObserver with a work-happened anchor; the never-an-item sweep names
  each container path; deeds counts written fresh); orphaned tests; missing negative
  cases (a deed earned by an alt that is not the entering character, a page complete but
  not illuminated, a mount reins in bags but not learned).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, a write to a
  reliquary or deed field from src/sim/freehold/, a trophy in ITEMS, a stat or buff
  field on a trophy record, hand-edited generated wiki or i18n artifacts, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, the freehold
  and housing CLAUDE.md files updated.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, content-obligations-reviewer,
frontend-seam-reviewer, cross-platform-sync if the wire moved, test-coverage-auditor),
and finally qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 17 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 17 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "17 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-18-visiting.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 17 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
