# Phase 04 QA: audit the crafted furnishings and the quartermaster patterns

Audits `phase-04-content-crafted-and-patterns.md`. Verdict goes in `progress.md` (row
"04 QA"). The next implementation phase never starts before this file has run.

Current scope reconciliation, 2026-09-07: the active implementation request protects
`evaluateCraftAdmission`, `resolveTrain`, existing station bindings and training/economy
semantics. It supersedes the older whole-directory profession edit prohibition.
[The revalidation record](crafted-content-revalidation-2026-09-07.md) preserves the
prior FAIL verdict and records the protected-function comparison. Current implementation
validation and fresh documentation review passed; this separate paired QA still needs
to run against the reconciled scope.

### Starter Prompt
```
This is Phase 04 (QA) of the Freeholds and Guildhalls feature: audit the content (ten
crafted furnishings, three quartermaster patterns, the channel and economy contracts, and
every content obligation).

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: audit the Phase 04 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "04 Content: crafted furnishings and quartermaster
patterns", the D53 valve, the keystone and power-neutral sweeps, unchanged station gates,
the same-change obligations, and literal pins; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest origin/release/**; release-merge-audit after a
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
- src/sim/professions/crafting.ts and src/sim/professions/training.ts as they stand:
  compare the full evaluateCraftAdmission and resolveTrain declarations with the
  pre-content baseline and prove they are unchanged. Inspect every profession-source
  diff for preserved station, teach-tier, fee and economy semantics. Review the
  existing isFreeholdCraftAvailable seam and its acquisition/training/craft callers;
  availability guards do not authorize changing either protected validator.
The agent returns: the promised-versus-delivered table per deliverable, a table of the
ten recipes (craft, station type, acquisition, bill ids by tier, produce or not, trainer row
or pattern), a table of the three patterns (id, prefix, quality, quartermaster row, Marks
price), the obligation table per new item id, every test added with what it asserts, and
every edit under src/sim/professions/, with protected-function comparison evidence
and acquisition tests proving dark-host refusals preserve knowledge, copies and fees.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every recipe's professionId is one of the ten existing crafts and its
  stationType follows the existing binding: seven crafts use STATION_TYPE_BY_CRAFT,
  while inscription explicitly uses apothecary, jewelcrafting forge and enchanting
  toolworks under the existing legacy recipe contract, never a new station; produce
  appears only in the cooking and alchemy bills; each pattern
  teaches a recipe whose acquisition includes 'drop' and each pattern has exactly one
  quartermaster row; the seven trainer recipes are absent from every drop channel; every
  output is `kind: 'furnishing'` with `r` and decorCost and no stat, buff, aura, or feast
  payload; the apex header count literal is still literally true and the channel suite's
  floor, partition and header-comment literals pin 55 teaching items (54 recipe manuals
  teaching 76 drop recipes plus one enchant teaching item), 43 non-Crucible teaching
  items and seven disjoint recipe families; every recipe's itemLevelBudget and skillReq
  equal the CAL-RECIPES-A workbook literals; evaluateCraftAdmission and resolveTrain
  are unchanged, existing station/training/economy behavior is preserved, and the
  existing freehold availability seam covers acquisition, training and crafting
  without spending on refusal; the market can list every furnishing (R18).
- TEST COVERAGE: the pattern suite drives resolvePatternLearn with the item in a bag
  slot and asserts the recipe known plus exactly one copy consumed; the trainer path is
  driven for at least one furnishing recipe; the channel sweep would fail on a pattern
  with no quartermaster row (mutate in a scratch copy and watch it red); the provisioner
  arm has a can-fail control; the economy suite covers all ten recipes (never vendors above
  input value); pins are fresh literals (never a count read from the table under test);
  missing negatives (a pattern used by a character without the craft refuses 'profession').
- DEAD CODE AND HYGIENE: unused imports and exports, leftover TODOs, the architecture
  import invariant, the word "phase" or "rent" or the banned phrase "real estate"
  (state.md "Non-negotiables", vocabulary fixed; qa-checklist.md "Ownership and classic
  fidelity") in any code, comment, or commit message, em dashes or emojis, a
  hand-edited generated file, a locale overlay touched, an orphaned WebP or provenance
  row, a pattern id inside src/sim/content/reliquary.ts.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Reconcile exactly ten output IDs and three pattern IDs with content-manifest.md;
  patterns are recipes within the ten outputs, never three extra furniture pieces.
  Every quantity/threshold/Marks cost and geometry value has a signed source row.
- Verify manifest-selected forms rather than leaving alternatives to the implementer.
  Wave A jewelcrafting supplies the floor-supported jewel lamp; the Wave B chandelier
  gains authored fixed ceiling anchors in 25. No arbitrary tabletop/ceiling geometry is inferred now.
- Require Marks-only acquisition for Wave A, no delve channel, and no phantom Hearth
  page cap. Final models remain an explicit Wave A close gate owned by 19.


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION:
- Run the Phase 04 STEP 3 suite list plus `npx tsc --noEmit`; `npm run wiki:content` and
  `npm run i18n:gen` followed by `git status --porcelain` (a dirty file means a stale
  regen).

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: content-obligations-reviewer, test-coverage-auditor, qa-checklist.
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
- [ ] Every Phase 04 acceptance box is verified by a check that ran, not by inspection.
- [ ] The recipe and pattern tables show ten crafts covered once each and three patterns
  each with a quartermaster row; the obligation table shows every column filled.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "04 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-05-instance-claim.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 04 file
  (phase-04-content-crafted-and-patterns.md) as the next file to re-run with the findings
  attached.
- Do not push the branch; never merge a PR.
```
