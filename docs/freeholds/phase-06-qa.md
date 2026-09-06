# Phase 06 QA: audit the interiors, the gate, and the Hearth Key

Audits `phase-06-interiors-gate-and-hearth-key.md`. Verdict goes in `progress.md` (row
"06 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 06 (QA) of the Freeholds and Guildhalls feature: audit the interiors (the
two layouts, derived colliders, render variants and dressing), the Eastbrook Freehold
Gate, the Hearth Key, and the refusal toasts.

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 06 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "06 Interiors, the Eastbrook gate, the Hearth Key",
missing tests, dead code, determinism of the derived colliders, three-host parity of both
enter paths, the jailed check, the scheduler contract for the dressing, i18n completeness,
and the committed screenshots; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, renderer.ts edits owing the
  Eastbrook re-mint, screenshots at the lowest graphics preset, "review the review-fix
  round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("06 Interiors, the Eastbrook gate,
  the Hearth Key" and the row), docs/freeholds/phase-06-interiors-gate-and-hearth-key.md
  (what was promised)
- the Phase 06 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 06), including the screenshot commit, mapping.json,
  and the regenerated wiki content
- the pins the diff claims: tests/freehold_layouts.test.ts,
  tests/freehold_gate_and_key.test.ts, tests/housing_view.test.ts,
  tests/renderer_compile_gate.test.ts, tests/entity_display_name.test.ts,
  tests/item_icons.test.ts, tests/monolith_budget.test.ts (sim.ts, world.ts, renderer.ts,
  hud.ts rows), tests/server/freehold_wire.test.ts (the jailed arm)
- src/sim/instances/dungeons.ts and src/render/renderer.ts as they stand (diff both
  against the phase start; classify every changed line)
The agent returns: the promised-versus-delivered table per deliverable, the six touch
points per interior each marked present, the gate and key control flow with every gate in
order, the dressing module's attach path and prewarm home, the extractions with their
moved bodies, every test added with what it asserts, the screenshot paths, and any TODO,
unused import, or decor key with no render prop and no stand-in.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: both layouts derive the same collider set on two calls and on both hosts
  (the sim's derivation and the client's read the same table); every anchor and the entry
  sit inside a room; plinth anchors equal the tier table; the gate is tier-routed (a
  cottage-tier record enters index 16, an inn-room record index 15); the key enters from
  any zone, consumes nothing, and refuses dead, combat, and cooldown with no teleport;
  the item def lives in src/sim/content/freehold/items.ts and the use arm in
  src/sim/freehold/hearth_key.ts (D23); the cooldown stamp is hearth_key_ready_ms on the
  live record in the host clock base, compared through ctx.lockoutNowMs() only, and the
  cooldown equals the state.md working value (60 minutes); the key is granted once per
  character and re-granted
  when absent; leaving lands at the gate; a jailed session's use_item on the key is
  refused on the server and freehold_enter stays in JAILED_BLOCKED_COMMANDS; the dressing
  attaches only through the gated loop with every material prewarmed; no light was added;
  the extractions are move-not-rewrite; no "manage on the website" or purchase copy
  appears in the gate path; the one deny-line selector is freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts over hudChrome.housing.denied.* (D26), no second one.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (a position literal for the
  gate landing, the cooldown written fresh as the state.md working value, a reason token
  per refusal); the
  determinism test compares two independent derivations, never one against itself; the
  online arm drives the real dispatch for the walk-in and for use_item; the jailed pin
  toggles the session flag and asserts no teleport; the perf tour result is recorded with
  zero live-program events; missing negatives (a non-owner walking into the gate with no
  record gets no_freehold; use_item with a non-key item ignores the freehold arm; a key
  use inside the freehold is a no-op or a defined refusal).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant (no render import in src/sim/, no sim mutation from src/render/), the
  word "phase" or "rent" or the banned two-word land phrase from ruling 9 in any code,
  comment, or commit message, em
  dashes or emojis, a hand-edited generated file, a locale overlay touched, "earn" in any
  hudChrome.housing.* value, an orphaned WebP or provenance row, the src/render/freehold/
  CLAUDE.md present and accurate, the placeholder interior from Phase 05 fully removed,
  screenshots present for desktop, compact, and tablet and captured at the lowest preset.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, render-performance-reviewer,
content-obligations-reviewer, frontend-seam-reviewer, cross-platform-sync,
privacy-security-review, test-coverage-auditor), and finally qa-checklist (the completion
gate), all for COVERAGE,
all to files.

STEP 3 - VALIDATION:
- Run the Phase 06 STEP 3 suite list plus `npx tsc --noEmit`; `npm run i18n:gen` and
  `npm run wiki:content` followed by `git status --porcelain` (a dirty file means a stale
  regen); `npm run perf:tour` through both interiors once more.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere; a fix that changes a visual re-captures
  the screenshots. Then review the fix commits with a FRESH reviewer (fixes are
  unreviewed code until someone reads them). `npm run ci:changed` after the last commit;
  read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 06 acceptance box is verified by a check that ran, not by inspection.
- [ ] Both enter paths work offline and online in a test that ran; the jailed arm is pinned.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "06 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07-persistence.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 06 file
  (phase-06-interiors-gate-and-hearth-key.md) as the next file to re-run with the
  findings attached.
- Do not push the branch; never merge a PR.
```
