# Phase 19 QA: audit the art batch

Audits `phase-19-art-batch.md`. Verdict goes in `progress.md` (row "19 QA"). The wave
close never starts before this file has run.

### Starter Prompt
```
This is Phase 19 (QA) of the Freeholds and Guildhalls feature: audit the art batch (the
furnishing, trophy, and dressing GLBs, their fingerprint pins, the registry fill, the
prewarm homes, the asset budget delta, the perf tour, the LOW-preset phone series).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 19 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "19 Art batch", missing pins, dead stand-ins,
the fingerprint contract, the scheduler-client rule, the light budget, the budget and
performance evidence, and the provenance obligations; fix what the audit finds; record
a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Base and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved; a lockfile change
  moves every source fingerprint, so re-run the asset pins FIRST and re-export with
  --no-preview if they red).
- Memory scan: MEMORY.md, the test-pin traps catalog, the authored-art normalization
  pin trap, renderer.ts edits owing the Eastbrook re-mint, the measurement-record rule,
  the iOS UA locking the material tier, "review the review-fix round", "apply ALL
  findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("19 Art batch" and the row,
  including the recorded budget delta and the phone series),
  docs/freeholds/phase-19-art-batch.md (what was promised),
  .claude/skills/image-to-glb/SKILL.md (the contract to audit against)
- the Phase 19 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 19), including public/models/props/, the media
  manifest, CREDITS.md, the provenance records, and docs/screenshots/
- the pins the diff claims: tests/freehold_basics_asset.test.ts,
  tests/freehold_crafted_asset.test.ts, tests/freehold_trophies_asset.test.ts,
  tests/freehold_dressing_asset.test.ts, tests/render_glb_replacement_assets.test.ts,
  tests/defer_launcher_preloads.test.ts, tests/renderer_compile_gate.test.ts
The agent returns: the promised-versus-delivered table per family (every model key
owed, the GLB it resolves to, the stand-in it replaced), every pin with the literals it
asserts, the locked budget per family beside the shipped numbers, where each family's
prewarm home is registered, whether renderer.ts changed, the budget delta and phone
series as recorded, and any family deferred for a missing reference.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; no stand-in
  remains for a shipped id (run the registry sweep); every GLB is texture-free with
  COLOR_0, meshopt, floor-seated and centered, +Z front, within its locked budget; the
  live fingerprint equals the stamped one for every asset and the pinned file list is
  complete (factory, entry, exporter, spec, build_assets.mjs, the shared atlas, the
  lockfile); every family loads through registerDeferredPreload and attaches through
  the gated path (no eager registerPreload, no bare scene add); the point-light count
  at LOW is at most three; dressing seats on the interior floor constant plus the
  authored lift, never terrainHeight; renderer.ts is untouched; each family's
  silhouette holds from four angles against its reference (spot-check the previews).
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (no
  constant self-comparison; sha256 and bytes written as fresh literals per asset; the
  fingerprint compared against a LIVE recomputation, never against a stored copy of
  itself; the registry sweep enumerates the content keys, not a hand list; the prewarm
  sweep sees every new material); orphaned tests; missing negative cases (a planted
  texture, a stray animation, an off-floor bound).
- DEAD CODE AND HYGIENE: leftover stand-in geometry for a shipped key, an unregistered
  or duplicate exporter, a factory calling Math.random, intake artifacts committed
  outside tmp/, a missing CREDITS.md row or provenance record, the budget delta or the
  phone series recorded as a summary instead of a series, `node scripts/asset_budget.mjs`
  claimed as passing while the aggregate is red, the word "phase" in any code, comment,
  or commit message, em dashes or emojis, the freehold render CLAUDE.md updated.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (render-performance-reviewer, frontend-seam-reviewer if presentation
code moved, test-coverage-auditor), and finally qa-checklist (the completion gate),
all for COVERAGE, all to files.

STEP 3 - VALIDATION:
- Run the Phase 19 STEP 3 suite list plus `npx tsc --noEmit`; re-run
  `npm run perf:tour` on the Cottage route and confirm zero live-program events;
  `npx gltf-transform validate` on every shipped GLB; `node scripts/asset_budget.mjs
  --json` and compare the delta with the recorded one.

STEP 4 - FIX:
- Apply ALL BLOCKING and SHOULD-FIX items (and the nits unless a nit contradicts a
  locked decision, in which case record it). A fix that touches a fingerprinted file
  re-exports the affected family with --no-preview, regenerates the manifest, and
  re-pins in the SAME fix commit. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT
  paths, never `git add -A`, the word "phase" nowhere. Then review the fix commits with
  a FRESH reviewer (fixes are unreviewed code until someone reads them).
  `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 19 acceptance box is verified by a check that ran, not by inspection.
- [ ] No BLOCKING or SHOULD-FIX item remains open; deferred nits and any family waiting
  on a reference (O5) are listed with a reason.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "19 QA": verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found and
  fixed, deferred items. state.md: anything the fixes changed in the ledger row; O5
  per-family status.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, deferred items, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-20-wave-a-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 19 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
