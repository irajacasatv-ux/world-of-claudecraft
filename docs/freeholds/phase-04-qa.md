# Phase 04 QA: audit the crafted furnishings and the quartermaster patterns

Audits `phase-04-content-crafted-and-patterns.md`. Verdict goes in `progress.md` (row
"04 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 04 (QA) of the Freeholds and Guildhalls feature: audit the content (ten
crafted furnishings, three quartermaster patterns, the channel and economy contracts, and
every content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 04 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "04 Content: crafted furnishings and quartermaster
patterns", the D13 valve, the keystone and power-neutral sweeps, unchanged station gates,
the same-change obligations, and literal pins; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the content pins cluster, "review
  the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("04 Content: crafted furnishings
  and quartermaster patterns" and the row), docs/freeholds/phase-04-content-crafted-and-patterns.md
  (what was promised)
- the Phase 04 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 04), including public/ui/items/mapping.json, the
  quartermaster stock rows, and the regenerated wiki content
- the pins the diff claims: tests/furnishing_pattern_items.test.ts,
  tests/apex_pattern_channels.test.ts, tests/recipe_pattern_items.test.ts,
  tests/recipe_economy.test.ts, tests/provisioner_firewall.test.ts (the furnishing arm),
  tests/freehold_content.test.ts, tests/professions_crafting_hub.test.ts
- src/sim/professions/crafting.ts and src/sim/professions/training.ts as they stand
  (prove neither changed: `git diff <phase-start>..HEAD -- src/sim/professions/`)
The agent returns: the promised-versus-delivered table per deliverable, a table of the
ten recipes (craft, station type, acquisition, bill ids by tier, produce or not, trainer row
or pattern), a table of the three patterns (id, prefix, quality, quartermaster row, Marks
price), the obligation table per new item id, every test added with what it asserts, and
any edit under src/sim/professions/ (which must be none).

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every recipe's professionId is one of the ten existing crafts and its
  stationType is that craft's existing station (the STATION_TYPE_BY_CRAFT map, never a
  new station); produce appears only in the cooking and alchemy bills; each pattern
  teaches a recipe whose acquisition includes 'drop' and each pattern has exactly one
  quartermaster row; the seven trainer recipes are absent from every drop channel; every
  output is `kind: 'furnishing'` with `r` and decorCost and no stat, buff, aura, or feast
  payload; the apex header count literal is still literally true; nothing under
  src/sim/professions/ moved; the market can list every furnishing (R18).
- TEST COVERAGE: the pattern suite drives resolvePatternLearn with the item in a bag
  slot and asserts the recipe known plus exactly one copy consumed; the trainer path is
  driven for at least one furnishing recipe; the channel sweep would fail on a pattern
  with no quartermaster row (mutate in a scratch copy and watch it red); the provisioner
  arm has a can-fail control; the economy suite covers all ten recipes (never vendors above
  input value); pins are fresh literals (never a count read from the table under test);
  missing negatives (a pattern used by a character without the craft refuses 'profession').
- DEAD CODE AND HYGIENE: unused imports and exports, leftover TODOs, the architecture
  import invariant, the word "phase" or "rent" or the banned two-word land phrase from
  ruling 9 in any code, comment, or
  commit message, em dashes or emojis, a hand-edited generated file, a locale overlay
  touched, an orphaned WebP or provenance row, a pattern id inside
  src/sim/content/reliquary.ts.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 04 STEP 3 suite list plus `npx tsc --noEmit`; `npm run wiki:content` and
  `npm run i18n:gen` followed by `git status --porcelain` (a dirty file means a stale
  regen).

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 04 acceptance box is verified by a check that ran, not by inspection.
- [ ] The recipe and pattern tables show ten crafts covered once each and three patterns
  each with a quartermaster row; the obligation table shows every column filled.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "04 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-05-instance-claim.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 04 file
  (phase-04-content-crafted-and-patterns.md) as the next file to re-run with the findings
  attached.
- Do not push the branch; never merge a PR.
```
