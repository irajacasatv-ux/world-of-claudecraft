# Phase 22 QA: audit the furnishings across all crafts and the pattern channels

Audits `phase-22-furnishings-all-crafts.md`. Verdict goes in `progress.md` (row "22 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 22 (QA) of the Freeholds and Guildhalls feature: audit the furnishings
across all ten crafts and the R8 pattern channels (defs, recipes, patterns, art, every
content obligation, the market chip at volume).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 22 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "22 Furnishings across all ten crafts and the R8
pattern channels", missing tests, dead content, the channel doctrine, the keystone and
power-neutral sweeps, and every same-change obligation; fix what the audit finds;
record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the content cluster of the gotcha
  catalog, the authored-art pin trap, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("22 Furnishings across all ten
  crafts and the R8 pattern channels" and the row),
  docs/freeholds/phase-22-furnishings-all-crafts.md (what was promised)
- the Phase 22 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 22), including public/ui/items/mapping.json and the
  model registry
- the pins the diff claims: tests/freehold_content.test.ts,
  tests/apex_pattern_channels.test.ts, tests/recipe_pattern_items.test.ts,
  tests/provisioner_firewall.test.ts, tests/market_filters.test.ts,
  tests/item_icons.test.ts, tests/item_art_consistency.test.ts,
  tests/deeds_content.test.ts, tests/reliquary_content.test.ts, the fingerprint suite
The agent returns: the promised-versus-delivered table per deliverable (count of defs
per craft, recipes per craft, patterns per channel); every new item id with its icon,
provenance row, model or stand-in, deed, page, wiki entry, and name fill; every test
added with what it asserts; any def with a field outside the FurnishingItemDef shape;
any recipe input that is a keystone, an intermediate, the catalyst, or produce on a
non-consumable craft.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; two furnishings
  per craft on that craft's existing trainer or pattern; every pattern on exactly one
  luck channel plus the Marks row; the raid rollGroup and rift draw order unchanged for
  existing rows; no pattern takes a Reliquary page; the Farming-line props follow the
  decision state.md records; the market chip returns every furnishing id; every
  registered model resolves through the registry the renderer reads.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the roster is a fresh
  literal list, not derived from the table; the channel sweep would fail on a fourth
  channel or a missing Marks row; the power-neutral sweep checks every def field, not a
  sampled one; the keystone sweep spells the ids); orphaned tests; a negative control
  per sweep (a synthetic offending def fails it).
- DEAD CODE AND HYGIENE: an id in the roster with no def, a def with no icon, an icon
  with no def, a provenance row with a stale owner, a stand-in not listed as a deferral,
  the word "phase" in any code, comment, or commit message, em dashes or emojis,
  generated files hand-edited, a locale overlay edited, the wiki regen stale.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, render-performance-reviewer,
test-coverage-auditor), and finally qa-checklist (the completion gate), all for
COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 22 STEP 3 suite list plus `npx tsc --noEmit`, `npm run wiki:content`
  followed by `npx vitest run tests/guide.test.ts`, and `npm run asset:budget`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 22 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "22 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-23-legend-stand-and-trophy-families.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 22 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
