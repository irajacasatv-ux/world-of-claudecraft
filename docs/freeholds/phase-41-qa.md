# Phase 41 QA: audit the dye station and layout sharing

Audits `phase-41-dye-station-and-layout-sharing.md`. Verdict goes in `progress.md` (row
"41 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 41 (QA) of the Freeholds and Guildhalls feature: audit the dye station,
dye slots, and layout save, load, and share.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 41 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "41 Dye station and layout sharing", missing
tests, dead code, determinism, three-host parity, the frozen station gates, the
marketplace separation, and the render budget; fix what the audit finds; record a
verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the source-scan fallback entry.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("41" and its row),
  docs/freeholds/phase-41-dye-station-and-layout-sharing.md (what was promised)
- the Phase 41 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 41)
- the pins the diff claims: tests/freehold_dye.test.ts, tests/freehold_layout_share.test.ts,
  tests/freehold_layouts.test.ts, tests/freehold_layout_core.test.ts,
  tests/world_api_parity.test.ts, tests/command_schema.test.ts,
  tests/professions_crafting_hub.test.ts, tests/apex_pattern_channels.test.ts,
  tests/renderer_compile_gate.test.ts, the tests/server/ suites the diff added
The agent returns: the promised-versus-delivered table per deliverable, every
stationType value the diff touched (any change to an existing recipe's gate is
BLOCKING), every import in the codec and its consumers, the list of new symbols and
where each is consumed, every test added with what it asserts, and any TODO, unused
import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the dye command consumes exactly one item, is undoable, and is refused
  below condition 30 and for a visitor; the load allowlist drops an unknown dye without
  dropping the row; the codec is pure, versioned, and byte-stable on both hosts; an
  apply validates against the owner's real inventory in the sim on the server and never
  places a missing piece; save names are screened; the dye station composes into the
  existing gate without a new StationType; material variants are cached and prewarmed;
  extractions are move-not-rewrite.
- TEST COVERAGE: literal dye ids and slot counts written fresh; a same-seed twin run of
  encode and apply with a work-happened anchor; per-dimension negatives (tampered code,
  over-cap code, wrong tier, missing piece, unknown dye, a visitor's dye); the
  no-marketplace-import pin has a can-fail control; the chain test covers the four
  commands; the five parity edits are in.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall, the word "phase" in any code, comment, or commit
  message, em dashes or emojis, generated files hand-edited, RENDER_PURE_CORES and
  UI_PURE_CORES registrations, the mobile sheet decisions.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, frontend-seam-reviewer, cross-platform-sync,
render-performance-reviewer, content-obligations-reviewer, privacy-security-review,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 41 STEP 3 suite list plus `npx tsc --noEmit`, `npm run perf:tour`, and
  the pg-armed twin with TEST_DATABASE_URL set.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 41 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "41 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-42-second-freehold-sku.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 41 file as the next file
  to re-run with the findings attached.
- A changed stationType on an existing recipe or a marketplace import in the codec is a
  FAIL, never a fix this QA makes on its own.
- Do not push the branch; never merge a PR.
```
