# Phase 43 QA: audit Carpenter and Mason (or verify the skip)

Audits `phase-43-carpenter-and-mason.md`. Verdict goes in `progress.md` (row "43 QA").
The next implementation phase never starts before this file has run. If Phase 43 was
skipped by ruling, this QA verifies the skip record and passes through.

### Starter Prompt
```
This is Phase 43 (QA) of the Freeholds and Guildhalls feature: audit Carpenter and
Mason, or verify that the phase was skipped by ruling.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: if Phase 43 was skipped, verify the ruling record and that nothing else changed;
otherwise audit the Phase 43 diff for correctness against every deliverable and
acceptance criterion in docs/freeholds/progress.md "43 Carpenter and Mason", missing
tests, dead code, the never-sell-power rule, the frozen ring and station gates, and the
content obligations; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- THE SKIP CHECK: read docs/freeholds/progress.md row 43. If it says "skipped by
  ruling": verify state.md records the ruling with its date, verify the ruling commit
  touches only docs/freeholds/ (`git diff <phase-start>..HEAD --name-only`), record
  "PASS (skipped by ruling)" in row 43 QA, skip STEPS 1 to 5, do STEP 6 and STEP 7, and
  end. Otherwise continue.
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the professions tuning packet rulings.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the ruling and the settled decisions), docs/freeholds/progress.md
  ("43" and its row), docs/freeholds/phase-43-carpenter-and-mason.md (what was promised)
- the Phase 43 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 43)
- the pins the diff claims: tests/professions_off_wheel.test.ts,
  tests/professions_crafting_hub.test.ts, tests/professions_zone_rollout.test.ts,
  tests/apex_pattern_channels.test.ts, tests/recipe_pattern_items.test.ts,
  tests/provisioner_firewall.test.ts, tests/deeds_content.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every recipe
the diff added with its output kind and stationType (a non-furnishing output or a
changed gate on a shipped recipe is BLOCKING), whether CRAFT_RING's literal pin changed,
the list of new symbols and where each is consumed, every test added with what it
asserts, and any TODO, unused import, or stub.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: both crafts are admitted off the ring without pole, adjacency, or
  specialization; the skill keys are frozen and normalize on load; training resolves
  only at the new stations; every recipe outputs a furnishing and every bill is
  keystone-free; every pattern has a deterministic faucet; no shipped craft, recipe, or
  station changed behavior; the station placements pass the camp-safety and rollout
  pins; extractions are move-not-rewrite.
- TEST COVERAGE: the furnishing-only sweep is POSITIVE with a can-fail control; the
  ring pin is asserted unchanged by literal; a same-seed twin run with a work-happened
  anchor; per-dimension negatives (specialization refused, training away from the
  station refused, a gear output in a fixture reddens the sweep); the channels sweep
  covers the new patterns; no constant self-comparison.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, art provenance rows present, the wiki fresh.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (content-obligations-reviewer, architecture-reviewer,
frontend-seam-reviewer, test-coverage-auditor), and finally qa-checklist (the
completion gate), all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 43 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision or the recorded ruling, in which case record it). Re-run the
  validation matrix. Commit fixes separately from the verdict, Conventional Commits with
  scope and body, EXPLICIT paths, never `git add -A`, the word "phase" nowhere. Then
  review the fix commits with a FRESH reviewer (fixes are unreviewed code until someone
  reads them). `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 43 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "43 QA": verdict (PASS / PASS (skipped by ruling) /
  PASS-WITH-FOLLOWUPS / FAIL), counts found and fixed, deferred items. state.md:
  anything the fixes changed in the ledger row; "Current phase" points at Phase 44.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44-wave-e-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 43 file as the next file
  to re-run with the findings attached.
- A non-furnishing output or a changed shipped gate is a FAIL, never a fix this QA makes
  on its own.
- Do not push the branch; never merge a PR.
```
