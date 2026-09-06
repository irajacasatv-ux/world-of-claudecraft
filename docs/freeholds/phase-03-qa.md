# Phase 03 QA: audit the tier, Charter, schedule, and vendor-basic content

Audits `phase-03-content-tiers-and-basics.md`. Verdict goes in `progress.md` (row "03 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 03 (QA) of the Freeholds and Guildhalls feature: audit the content (the tier
ladder, the Charter allowlist, the ledger schedule, the vendor-basic furnishings, and every
content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 03 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "03 Content: tiers, Charter SKU, ledger schedule,
vendor basics", the same-change content obligations, the keystone and power-neutral sweeps,
literal pins, and i18n completeness; fix what the audit finds; record a verdict.

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
- docs/freeholds/state.md, docs/freeholds/progress.md ("03 Content: tiers, Charter SKU,
  ledger schedule, vendor basics" and the row), docs/freeholds/phase-03-content-tiers-and-basics.md
  (what was promised)
- the Phase 03 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 03), including public/ui/items/mapping.json and the
  regenerated wiki content
- the pins the diff claims: tests/freehold_content.test.ts,
  tests/provisioner_firewall.test.ts (the ledger arm), tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/item_icons.test.ts,
  tests/item_art_consistency.test.ts, tests/furnishing_item_kind.test.ts
- the root CLAUDE.md "New game content" obligation bullet and src/sim/content/CLAUDE.md
The agent returns: the promised-versus-delivered table per deliverable, the obligation
table per new item id (WebP present, provenance row, English name, M16 fills, Hearth shelf
page, wiki row), the deed rows added with their trigger kinds, every test added with what
it asserts, and any TODO, unused export, or table field no consumer will ever read.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: tier values equal the state.md table; the Charter record has no price and
  no copy; the weekly order is a pure function of the week index (call it twice, equal;
  no Rng import); every schedule id resolves through ITEMS and is `kind: 'junk'` and
  market-listable (R18); base grade precedes fine_ in every line; produce lines use
  explicit grade ids; the vendor row sells only furnishing ids and each resolves; every
  furnishing carries a numeric `r` (positive for a solid piece, 0 for the rug, never
  absent); the Homesteader deeds are cosmetic
  (renown and a title or border at most, never power); the Hearth shelf pages reference
  only shipped furnishing ids; the tables are deep-frozen (mutation throws in strict mode).
- TEST COVERAGE: literal pins written fresh (no `expect(X).toBe(X)`, no count read from
  the table under test); the keystone sweep enumerates every possible week, not one; the
  power-neutral sweep checks a closed field allowlist on every def (a def with an extra
  field fails); the provisioner arm has a can-fail control (a scratch line naming a
  keystone trips it); deeds and reliquary count re-pins are fresh literals; missing
  negative cases (an unknown charter id, an unknown tier id).
- DEAD CODE AND HYGIENE: unused imports and exports, leftover TODOs, the architecture
  import invariant, the word "phase" or "rent" or the banned two-word land phrase from
  ruling 9 in any code, comment, or
  commit message, em dashes or emojis, a hand-edited generated file (wiki content,
  translation keys), a locale overlay touched, a WebP without a provenance row or a
  provenance row without a WebP, the TUNING banner present on the stack counts.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 03 STEP 3 suite list plus `npx tsc --noEmit`; `npm run wiki:content` and
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
- [ ] Every Phase 03 acceptance box is verified by a check that ran, not by inspection.
- [ ] The obligation table shows every column filled for every new item id.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "03 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-content-crafted-and-patterns.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 03 file
  (phase-03-content-tiers-and-basics.md) as the next file to re-run with the findings
  attached.
- Do not push the branch; never merge a PR.
```
