# Phase 03 QA: audit the tier, Charter, schedule, and vendor-basic content

Audits `phase-03-content-tiers-and-basics.md`. Verdict goes in `progress.md` (row "03 QA").
The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 03 (QA) of the Freeholds and Guildhalls feature: audit the content (the tier
ladder, the Charter allowlist, the ledger schedule, the vendor-basic furnishings, and every
content obligation).

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: audit the Phase 03 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "03 Content: tiers, Charter SKU, ledger schedule,
vendor basics", the same-change content obligations, the keystone and power-neutral sweeps,
literal pins, and i18n completeness; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
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
  tests/item_art_consistency.test.ts, tests/furnishing_item_kind.test.ts,
  tests/server/freehold_wire.test.ts (the dark-realm arm)
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
  (renown and a title or border at most, never power): exactly the two manifest ids
  `homesteader_first_furnishing` and `homesteader_first_cottage`, trigger kind `manual`
  on both, no DeedTrigger widening, and NO grantDeed call for either anywhere in this
  diff (08 and 15 own the raise sites; grep grantDeed over the 03 diff is empty); the
  Hearth shelf pages reference only shipped
  furnishing ids; the tables are deep-frozen (mutation throws in strict mode); the
  furnisher spawns only when freeholdsEnabled is true and the item defs merge regardless
  (D85).
- TEST COVERAGE: literal pins written fresh (no `expect(X).toBe(X)`, no count read from
  the table under test); the keystone sweep enumerates every possible week, not one; the
  power-neutral sweep checks a closed field allowlist on every def (a def with an extra
  field fails); the provisioner arm has a can-fail control (a scratch line naming a
  keystone trips it); deeds and reliquary count re-pins are fresh literals; the
  dark-realm arm in tests/server/freehold_wire.test.ts asserts the furnisher entity absent
  with the flag unset and its eight-id stock by literal with '1'; missing negative cases
  (an unknown charter id, an unknown tier id).
- DEAD CODE AND HYGIENE: unused imports and exports, leftover TODOs, the architecture
  import invariant, the word "phase" or "rent" or the banned phrase "real estate"
  (state.md "Non-negotiables", vocabulary fixed; qa-checklist.md "Ownership and classic
  fidelity") in any code, comment, or commit message, em dashes or emojis, a
  hand-edited generated file (wiki content, translation keys), a locale overlay touched,
  a WebP without a provenance row or a provenance row without a WebP,
  source/derivation/rounding and approval artifacts present on every quantity.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, architecture-reviewer,
cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Compare every vendor ID/price/decor cost/footprint/radius to content-manifest.md and
  art-brief.md measurement or signed calibration rows. Exactly eight outputs ship;
  no max-stack field silently becomes a Ledger quantity. Unsupported trial values stay
  disabled behind the documented release gate and have an exact producing artifact.
- Exercise every realm-week rotation state, require produce in every bill and the same
  published bill for different owners. Versioned paid/prepaid bills never recalculate.
- Independently census the NEW Hearth shelf's literal ID, nav/order, catalog, source,
  completion and localization consumers. Existing IDs stay ordered; all eight furnishing
  pages qualify, patterns/trophy records do not, hidden-source discovery stays private.
- Charter no-price pins apply to Charter data; ordinary vendor gold price/sellValue are
  legal only with the approved numeric provenance. No phantom shelf overflow gate.


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

STEP 3 - VALIDATION:
- Run the Phase 03 STEP 3 suite list plus `npx tsc --noEmit`; `npm run wiki:content` and
  `npm run i18n:gen` followed by `git status --porcelain` (a dirty file means a stale
  regen).

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: content-obligations-reviewer, architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
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
- [ ] Every Phase 03 acceptance box is verified by a check that ran, not by inspection.
- [ ] The obligation table shows every column filled for every new item id.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "03 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-content-crafted-and-patterns.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 03 file
  (phase-03-content-tiers-and-basics.md) as the next file to re-run with the findings
  attached.
- Do not push the branch; never merge a PR.
```
