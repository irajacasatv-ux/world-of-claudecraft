# Phase 12 QA: audit the Strongbox and station amenities

Audits `phase-12-strongbox-and-station.md`. Verdict goes in `progress.md` (row "12
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 12 (QA) of the Freeholds and Guildhalls feature: audit the Strongbox and
station amenities (bank access at home, the station amenity slot, the vault craft gate
arm, the amenity lock rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 12 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "12 Strongbox and station amenities", missing
tests, dead code, the never-sell-power rule, the one-gate and one-planner rules, the
explicit vault arm and its negatives, the amenity lock, determinism of the spawns,
three-host parity, and the monolith ratchet; fix what the audit finds; record a
verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the guard-exemptions-must-be-positive
  entry, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("12 Strongbox and station
  amenities" and the row), docs/freeholds/phase-12-strongbox-and-station.md (what was
  promised)
- the Phase 12 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 12); `git diff <phase-start>..HEAD --
  tests/professions_crafting_hub.test.ts src/sim/professions/training.ts
  src/sim/content/professions.ts` expected EMPTY
- the pins the diff claims: tests/freehold_strongbox.test.ts,
  tests/freehold_station.test.ts, tests/vault_craft_gate.test.ts, tests/vault_wire.test.ts,
  tests/bank_wire.test.ts, tests/craft_from_vault.test.ts, tests/world_api_parity.test.ts,
  tests/command_schema.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/entity_display_name.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every new symbol
and where each is consumed, the exact composition sites for the Strongbox gate and the
station list (and every caller that reads a station list WITHOUT the freehold rows),
the vault arm as written with its position among the existing arms, every test added
with what it asserts, and any TODO, unused import, second reach rule, or second
sourcing planner.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; banker
  proximity is still ONE reach rule (grep for a second BANKER_RANGE comparison); the
  Strongbox entity is visible to every viewer in the claim and satisfies the gate only
  for a viewer whose OWN owner key claims the plot, within range, with amenities
  unlocked; the built station persists as the `station` field inside the layout JSONB
  with a normalize allowlist arm in state.ts; build_station emits freeholdGranted
  { kind: 'station' } on the Phase 08 variant; the station joins exactly the craft admission
  and the in-range read and never isAtAnyStation or resolveTrain; recipes and
  STATION_TYPE_BY_CRAFT untouched; reagent sourcing at home goes through
  planReagentSourceDraw (no second walk); the vault arm sits after the membership arms
  and before the geometry backstop, is a POSITIVE predicate (owner key match AND built
  station AND unlocked), costs one claim lookup, and every negative (visitor, no
  station, locked) stays refused; the amenity lock reads the stored condition through
  one predicate both amenities share; the spawns draw no Rng, keep respawnTimer
  Infinity, and ride inst.objectIds; no amenity changes a combat, progression,
  gathering, or drop number (read every new constant); the extractions are
  move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression
  (per-arm negatives each proving the OTHER arms still pass; the visitor case uses a
  SECOND account's owner key inside the same claim, not an out-of-range owner; the
  below-30 case sits at 29 and a control at 30; the bags-then-vault pin asserts the
  vault decrement AND the bag decrement in order; the crafting-hub pin is proven
  unchanged by diff, not by rerun alone; the respawn sweep pin advances ticks past one
  second); orphaned tests; missing negative cases (build_station with an unknown type
  string, a second build_station, the owner's alt on the same account using the
  Strongbox, the guild bank at the Strongbox, a dead owner, a tampered `station` value
  inside the layout JSONB dropping only that field, a visitor who sees the Strongbox
  entity in their snapshot yet is refused at it).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, a reason id emitted nowhere, an English literal in any emit (the S3
  guard), an entity name outside world_entity_i18n.ts, the word "phase" in any code,
  comment, or commit message, em dashes or emojis, generated files hand-edited,
  src/sim/freehold/CLAUDE.md and the vault gate header updated, the monolith ceilings
  lowered and not raised.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, cross-platform-sync, privacy-security-review,
migration-safety for the persisted `station` field, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 12 STEP 3 suite list plus `npx tsc --noEmit`; run tests/parity clean
  and confirm any golden commit stands alone.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 12 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "12 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13-condition-and-ledger-core.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 12 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
