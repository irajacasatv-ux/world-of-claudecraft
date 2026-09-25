# Phase 19 QA: audit the art batch

Audits `phase-19-art-batch.md`. Verdict goes in `progress.md` (row "19 QA"). The wave
close never starts before this file has run.

### Starter Prompt
```
This is Phase 19 (QA) of the Freeholds and Guildhalls feature: audit the art batch (the
furnishing, trophy, and dressing GLBs, their fingerprint pins, the registry fill, the
prewarm homes, the asset budget delta, the perf tour, the LOW-preset phone series).

Harness: Codex, not Claude (D74). Codex MUST execute all asset creation, regeneration
and asset fixes in this file. Follow AGENTS.md and the root/directory CLAUDE.md
repository contracts plus .agents/skills/woc-image-to-glb/SKILL.md; this prompt names
no model. Claude-specific memory, Workflow and agent-runtime instructions do not apply
under Codex (AGENTS.md): use the equivalent Codex read-only reader and reviewer roles
wherever this prompt says Explore or review agent.

Goal: audit the Phase 19 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "19 Art batch", missing pins, dead stand-ins,
the fingerprint contract, the scheduler-client rule, the light budget, the budget and
performance evidence, and the provenance obligations; fix what the audit finds; record
a verdict.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved; a lockfile change
  moves every source fingerprint, so re-run the asset pins FIRST and re-export with
  --no-preview if they red).
- Gotchas scan (Codex has no Claude memory, AGENTS.md): read state.md "Gotchas" for
  the test-pin traps, the authored-art normalization pin trap, renderer.ts edits owing
  the Eastbrook re-mint, the measurement-record rule, the iOS UA locking the material
  tier, "review the review-fix round" and "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("19 Art batch" and the row,
  including the recorded budget delta and the phone series),
  docs/freeholds/phase-19-art-batch.md (what was promised),
  .agents/skills/woc-image-to-glb/SKILL.md and its canonical shared
  .claude/skills/image-to-glb/SKILL.md (the asset contract; execution remains Codex)
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
series as recorded and every missing-reference blocker; no blocker permits an
incomplete final art family to receive PASS.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-19-art-batch.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Codex vendor asset family. Codex creates the shipping art and consumes the content/art reference manifest's
   exact eight vendor IDs and individual reference briefs. scripts/assets/freehold_basics/
   uses the deterministic batch exporter with scoped model factories, strict image-to-glb
   intake, rights/provenance and material/triangle/byte budget artifacts measured before
   export. The roster is bed/table/two chairs/rug/lantern/chest/bookshelf as the accepted
   manifest binds them. No reference or balance budget is invented by an asset worker.
2. Codex crafted asset family. Codex uses scripts/assets/freehold_crafted/ for final
   models for the ten accepted Wave A crafted outputs, including the three pattern
   recipes inside those ten, never three extra outputs. Reconcile ID/model/footprint/
   radius/anchor measurements with 03/04 and collision truth; walkthrough rugs are
   explicit. Maintain the protected Masterwrought and ten-profession content mapping.
3. Codex source-complete trophy family. Codex uses scripts/assets/freehold_trophies/ for
   the final shared Wave A generic display family exactly as content-manifest.md's
   Wave A generic display column lists it: the plaque variants (framed, relief,
   book-and-page, weapon-appearance, title, specimen, rank, named-work), the inscribed
   source medallion on a freestanding plaque, the stand plaque for discovered set
   pieces, the paddock marker on a floor-supported display and the qualified head
   family for every generic display 17 ships; no bust form exists in the manifest and
   none is built (U2a F6, P1 F-11).
   No false feat is granted to fill a new account's case. Bespoke 23 forms have explicit
   later manifest rows; all Wave A IDs resolve now with approved lineage and readable
   known/unknown provenance in the HUD. A generic final family model is an intentional
   completed design, distinct from a temporary placeholder.
4. Codex Inn Room/Cottage dressing. Codex uses scripts/assets/freehold_dressing/ for the
   complete shell-linked hearth/door/strongbox/station/plinth/bed dressing with equal
   material/art quality in both tiers, warm plaster/timber, quiet cool window edge,
   clear arrival/circulation and meaningful display sightlines from ux-spec.md.
   Measure authored grid/room bounds, model bounds/radii and protected door/arrival
   paths into the content manifest before integration. Use the inherited interior
   grade/daylight and sampled arrival cue from 06/09; no unsupported light/camera
   literal. Three authored emitters is only a ceiling: the global sink may admit two
   on iOS or fewer under pressure. LOW still shows all furnishings, ghost, blocked
   reason and bounds; material/ambient/key fallback keeps the room readable.
   Structural collision/arrival safety and prepared actionable representations
   must be ready before reveal. Directional/hemi/spot/rect lighting stays boot-owned;
   point-light allocation/retirement uses 09's scheduled budget/gates and actual global
   sink, preserving LOW fairness. Baseline compact/tablet capture is Chromium with an
   iOS profile, not Android, Safari or physical-device proof. Android claims require an
   explicit userAgent/profile variant. Ordinary online arrival's additional cosmetic settle
   wait stays zero; bounded offline wait does not guarantee all optional art. Late
   optional cosmetics use prepared gate-owned stand-ins until final assets are ready;
   do not confuse runtime preparation fallback with permission to ship placeholder art.
   First confirmed Inn and first Cottage tier get the approved automatic/skippable
   safe hearth view; ordinary return/visitor entry stay static. Movement/look/cancel
   resumes input immediately while existing DIRECTOR_RELEASE_TIME blends camera offset
   out safely; reduced motion starts no directive. Audio/copy dedupe by accepted entry
   identity, never join time: consume a permitted fresh directive at most once.
   Snapshot/resume/replay grants no new cue; commit-before-ACK loss may omit visible
   or audio feedback for an accepted entry.
   Consume 07c/08a's nullable freshArrivalPresentation exactly: acceptedTransitionId,
   playWelcomeCue:true and firstTierViewEligible. Only that fresh directive can welcome;
   only a true firstTierViewEligible grants the tier view. Positive historical
   firstTierAtAdmission on snapshot/resume never grants a new cue/view. A committed
   winning tier mark followed by lost ACK may skip presentation; do not replay it.
   The typed public GameAudio arrival method and sanctioned sample pipeline belong
   to 06/09; this asset work consumes them and adds no private-method audio shortcut.
5. Registry/prewarm and evidence. Codex completes shipping artwork and replaces every
   shipped-ID stand-in via the existing
   src/render/freehold registry, registerDeferredPreload and gated_scene_attach;
   surfaceMat supports both material tiers. Freeze family fingerprint lists, export
   keepExtras/socket and centered floor bounds, optimize/validate raw and shipped GLBs,
   and pin bytes/sha256/triangles/primitives/materials/COLOR_0/zero textures/animations/
   skins/meshopt and live fingerprint. Keep the strict four-angle critical-feature
   threshold owned by the asset skill. Refresh media manifest and per-asset CREDITS/
   provenance; record exact budget delta without claiming pre-existing aggregate red
   passed. Capture Inn/Cottage LOW/high plus actual iOS light-pressure fallback and
   zero live-program tour evidence. Missing reference/rights or failed final art keeps
   this implementation and Wave A release blocked; it is never a completed family
   with an indefinite art deferral. Render and frontend reviews inspect the final
   registry, screenshots and measured bounds; do not duplicate the coordinator tour.
   Record final Codex asset provenance now. 44a's final-artwork-audit.md must recheck
   every housing-created icon/image and residual fallback against the completed feature
   before 44b prepares docs/prd/woc/freehold-final-legal-handoff.md. It is an additional
   completion sweep, never permission to ship an unfinished 19 family.

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

STEP 3 - VALIDATION:
Required named reviewers for this file: frontend-seam-reviewer, render-performance-reviewer,
content-obligations-reviewer,
test-coverage-auditor, qa-checklist.
- Run the Phase 19 STEP 3 suite list plus `npx tsc --noEmit`; re-run
  `npm run perf:tour` on the Cottage route and confirm zero live-program events;
  `npx gltf-transform validate` on every shipped GLB; `node scripts/asset_budget.mjs
  --json` and compare the delta with the recorded one.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. A fix that touches a fingerprinted file
  re-exports the affected family with --no-preview, regenerates the manifest, and
  re-pins in the SAME fix commit. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT
  paths, never `git add -A`, the word "phase" nowhere. Then review the fix commits with
  a FRESH reviewer (fixes are unreviewed code until someone reads them).
  `npm run ci:changed` after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 19 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved consistently with locked rulings and
  freshly reviewed; resolved findings do not block release. Any required family still
  awaiting its reference keeps the named final-art release gate blocked; no shipped
  ID is deferred.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "19 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row; the art manifest per-family status.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-20-wave-a-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 19 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
