# Phase 19: the art batch (furnishing and trophy models)

Wave A, the Cottage MVP. The spec is `progress.md` "19 Art batch"; the decision is
`brainstorm.md` D13 (art is the long pole and gets stand-ins; furnishing and trophy GLBs
land in this dedicated phase through the `image-to-glb` skill, replacing the Phase 09
stand-in kit through the one model registry). This phase ships a GLB for every wave A
furnishing (about eighteen), the MVP trophy props, and the Cottage and Inn Room dressing,
each with its fingerprint pin and prewarm home, then measures the asset budget, the perf
tour, and the LOW-preset phone inside the Cottage. The references are O5 (Fernando owns
them); no reference, no asset.

### Starter Prompt
```
This is Phase 19 of the Freeholds and Guildhalls feature: the art batch (furnishing and
trophy GLBs through the image-to-glb pipeline, the model registry fill, fingerprint
pins, prewarm homes, the asset budget, the perf tour, the LOW-preset phone check).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: add the keyword `ultracode` to this session; the phase is batch-heavy (about
thirty assets across four families, each a full pipeline run with its own pin).

Goal: replace every stand-in with a shipped, texture-free, deterministic GLB produced
the way the banker chest and the Eastbrook kit were produced, pinned by sha256 and
source fingerprint, loaded through a prewarm home so the Cottage draws nothing for the
first time after the curtain, within the byte and triangle budgets locked before
building, with the phone holding frame rate at LOW inside the Cottage.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/ (a lockfile change also moves every source fingerprint: see the gotcha below).
- Confirm the O5 references exist (Fernando's furniture references, the trophy family
  references, the Cottage and Inn Room dressing references) with rights and provenance;
  if any family has none, STOP for that family and record it (never invent a reference).
- Memory scan: MEMORY.md and entries on the image-to-glb pipeline (PR #2356), the
  authored-art normalization pin trap, renderer.ts edits owing the Eastbrook re-mint,
  the iOS UA locking the material tier, screenshots at the lowest graphics preset,
  the measurement-record rule, the asset pipeline skill, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "19 Art batch"), and this
  file
- .claude/skills/image-to-glb/SKILL.md (the operating procedure, the nine steps, the
  fingerprint contract), docs/image-to-glb-asset-workflow.md (the runbook),
  scripts/assets/CLAUDE.md (the pipeline rules), docs/design/eastbrook-vale-rebuild/imagegen-prompts.md
  and imagegen-provenance.md (the provenance record shape), CREDITS.md (the row shape)
- the batch exporter model scripts/assets/farm_props/ (export_farm_props.mjs,
  export_entry.js, model.js, source_fingerprint.mjs: one family, many props, one
  export) and the single-asset model scripts/assets/eastbrook_mailbox/
  (export_eastbrook_mailbox.mjs), scripts/assets/eastbrook_town/shared.js (the helpers
  to reuse), scripts/assets/specs/ (a spec with keepExtras true),
  scripts/assets/build_assets.mjs, scripts/build_media_manifest.mjs,
  scripts/asset_budget.mjs (and its pre-existing aggregate red),
  scripts/asset_pipeline/pipeline.mjs (the preview command)
- tests/farm_props_asset.test.ts (the batch pin: bytes, sha256, triangles, primitives,
  materials, COLOR_0, zero textures, meshopt, bounds, live fingerprint equality per
  prop), tests/eastbrook_mailbox_asset.test.ts, tests/render_glb_replacement_assets.test.ts,
  tests/defer_launcher_preloads.test.ts (the two sanctioned eager registrants),
  tests/ability_material_prewarm_sweep.test.ts, tests/renderer_compile_gate.test.ts
- src/render/freehold/ as Phase 09 and Phase 17 left it (furnishings.ts, the model
  registry keyed by furnishing and trophy model key, the stand-in kit, the interior
  dressing module, furnishing_ghost_visual.ts), src/render/assets/preload.ts
  (registerDeferredPreload), src/render/gated_scene_attach.ts, src/render/point_light_budget.ts,
  src/render/entity_gate_stand_in_core.ts (ENTITY_GATE_STAND_INS), src/render/farm_patches.ts
  (the surfaceMat conversion and the deferred preload at construction), src/render/CLAUDE.md
  ("GPU work: every new producer is a client of the scheduler")
- src/sim/content/freehold/furnishings.ts, furnishing_recipes.ts, trophies.ts (every
  model key that needs a GLB, with its footprint and measured r),
  src/sim/content/freehold/layouts.ts (D23: INN_ROOM_LAYOUT and COTTAGE_LAYOUT decor keys
  from Phase 06)
- scripts/perf_tour.mjs and scripts/perf_tour_entry_options.mjs, scripts/pr_screenshots.mjs
  and scripts/pr_shot_targets.mjs (the compact device box), .claude/skills/pr-screenshots/SKILL.md
- tests/monolith_budget.test.ts (renderer.ts must not be touched here)
The agent returns: the complete list of model keys owed a GLB (furnishings, trophies,
dressing) with the stand-in each currently resolves to; the batch exporter recipe
(one family directory, one export, one spec, one fingerprint list, one pin test) versus
the single-asset recipe, and which fits each family; the fingerprint file list and the
consequence of a lockfile change; the budget exemplars as of 2026-09-05 (banker chest
2,048 tri, 4 materials, 44 KB; noticeboard 1,184 tri, 2 materials, 25 KB; mailbox 1,640
tri, 2 materials, 33 KB), re-read from the pin suites
tests/render_glb_replacement_assets.test.ts and tests/eastbrook_mailbox_asset.test.ts
before locking a family budget (reference points, not targets); the registry fill shape and the
prewarm home recipe; the perf tour entry option for a Cottage route; the phone capture
recipe (Android emulation, LOW preset seeded before goto, ids never English text).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Batch-heavy: use a Workflow if the harness offers one, otherwise a parallel Agent
fan-out of four family slices, each given ONLY the Explore summary, its references,
and its own family directory (disjoint by construction), with the coordinator owning
every shared file:
- Agent VENDOR: scripts/assets/freehold_basics/ for the Phase 03 vendor furnishings
  (bed, table, two chairs, rug, lantern, chest prop, bookshelf): the batch exporter
  recipe, budgets locked first, the sculpt spec per prop through the img2threejs strict
  gates, a purpose-built factory per prop merged into 2 to 4 material buckets with
  vertex colors, floor-seated at Y=0, centered, +Z front, stable mesh names,
  Socket_* nodes, the spec with keepExtras true, the export into public/models/props/,
  raw and shipped validation from four angles against the reference at the 0.70
  per-critical-feature threshold, and tests/freehold_basics_asset.test.ts pinning every
  prop (bytes, sha256, triangles, primitives, materials, COLOR_0, zero textures,
  meshopt, bounds, live fingerprint).
- Agent CRAFTED: scripts/assets/freehold_crafted/ for the Phase 04 ten crafted
  furnishings, the same recipe and pin (tests/freehold_crafted_asset.test.ts).
- Agent TROPHIES: scripts/assets/freehold_trophies/ for the Phase 17 MVP trophy props by
  family (bust, mounted head, paddock marker, armor stand, plaque), the same recipe and
  pin (tests/freehold_trophies_asset.test.ts); a family prop is shared by its members
  through the registry, never one GLB per deed.
- Agent DRESSING: scripts/assets/freehold_dressing/ for the Cottage and Inn Room static
  decor keys in the Phase 06 layouts (the hearth, the door, the strongbox and station
  anchors, the plinth), the same recipe and pin (tests/freehold_dressing_asset.test.ts),
  seated on the interior floor constant plus the authored lift, never terrainHeight.
The coordinator, after every family lands: fill the src/render/freehold/ model
registry so every shipped key resolves to its GLB and no stand-in remains for a shipped
id (a pin sweeps the content keys against the registry); give every family a prewarm
home through registerDeferredPreload beside the furnishing view's construction (never
an eager registerPreload, never a bare scene add); convert materials through surfaceMat
at both tiers; refresh the media manifest with `node scripts/build_media_manifest.mjs
generate`; append one CREDITS.md row per asset with its provenance; run
`node scripts/asset_budget.mjs --json` and record the exact byte and triangle delta
(the aggregate stays red on pre-existing overages: report the delta, never claim it
passed); run `npm run perf:tour` with the Cottage route and record zero live-program
events; capture the LOW-preset phone check inside the Cottage with the mobile rig
(Android emulation, the low preset and graphicsDefaultApplied seeded before goto,
compact and tablet boxes, elements by id) and record the frame numbers in progress.md
as a per-step series, not a summary. Every agent writes any report longer than a screen
to a file and replies with the path plus a short summary. Never `mode: "plan"` on
teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Every new GPU producer is a client of the scheduler: a prewarm home or a gate for
  every material a live frame can draw for the first time after the curtain; no bare
  scene add; no light added or removed after boot (the Phase 09 rig stays within three
  point lights at LOW through point_light_budget.ts).
- The fingerprint contract: every asset stamps a sha256 source fingerprint over its
  pinned file list; tests recompute it live; any edit to a fingerprinted file (the
  factory, entry, exporter, spec, build_assets.mjs, the shared atlas, pnpm-lock.yaml)
  re-exports every affected family with --no-preview and re-pins; byte sizes stay
  stable across a fingerprint-only re-export.
- Determinism: the export is reproducible byte for byte; no Math.random in a factory
  (seeded noise only through the shared helpers).
- Content obligations: a CREDITS.md row and a provenance record per asset; AI-generated
  references record their full lineage; no new item id (so no WebP obligation here).
- Graphics tiers stay gameplay-neutral: the placement ghost and the blocked state draw
  at every tier; a LOW-preset phone shows every placed furnishing.
- Rendering reads and never mutates the world; sim-side placement and collision stay in
  the authored records (Phase 03's measured r), never renderer constants.
- Do not touch src/render/renderer.ts (any byte moves the Eastbrook fingerprint leaf and
  owes a four-family re-mint); the registry fill lives in src/render/freehold/.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any new furnishing, trophy, or content record (the batch covers the keys Phases 03,
  04, 06, and 17 shipped; new pieces are Phase 22 and Phase 23).
- Rigged, deforming, or animated assets (the pipeline is for static stylized objects).
- Texture-bearing GLBs (vertex colors only; the shared atlas adds grain at runtime).
- The Legend Stand, sheaf, markers, banners, and finishes (Phase 23), the Lodge
  interior (Phase 21).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; per family `npx vitest run tests/freehold_basics_asset.test.ts`,
  `npx vitest run tests/freehold_crafted_asset.test.ts`, `npx vitest run
  tests/freehold_trophies_asset.test.ts`, `npx vitest run tests/freehold_dressing_asset.test.ts`;
  then `npx vitest run tests/render_glb_replacement_assets.test.ts
  tests/farm_props_asset.test.ts tests/eastbrook_mailbox_asset.test.ts
  tests/eastbrook_town_assets.test.ts tests/defer_launcher_preloads.test.ts
  tests/ability_material_prewarm_sweep.test.ts tests/renderer_compile_gate.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts
  tests/furnishing_layout_core.test.ts`; `npx gltf-transform validate` on every shipped
  GLB; `node scripts/asset_budget.mjs --json` (record the delta); `npm run perf:tour`
  (the Cottage route, zero live-program events); the phone capture through
  `node scripts/pr_screenshots.mjs` on the compact and tablet targets at LOW.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  render-performance-reviewer (prewarm homes, residency, the light budget, the tour
  evidence, the phone series); the dispatch table adds frontend-seam-reviewer if
  presentation code under src/render/ changed beyond the registry fill. Prompt each for
  COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message (one
commit per family keeps a re-mint reviewable):
- feat(assets): ship the vendor furnishing models with fingerprint pins
- feat(assets): ship the crafted furnishing models with fingerprint pins
- feat(assets): ship the trophy family props with fingerprint pins
- feat(assets): ship the Cottage and Inn Room dressing with fingerprint pins
- feat(render): resolve every freehold model key to its shipped GLB with a prewarm home
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every model key in furnishings.ts, trophies.ts, and the two layouts in
  src/sim/content/freehold/layouts.ts resolves to a
  shipped GLB under public/models/props/; the registry sweep finds no stand-in for a
  shipped id.
- [ ] Every asset has a pin test with bytes, sha256, triangles, primitives, materials,
  COLOR_0, zero textures and animations and skins, meshopt, floor-seated centered
  bounds, and live fingerprint equality; every family sits inside its locked budget.
- [ ] `npx gltf-transform validate` is clean on every shipped GLB; the media manifest is
  regenerated; one CREDITS.md row and one provenance record per asset.
- [ ] Every family has a prewarm home; `npm run perf:tour` through the Cottage records
  zero live-program events; the point-light count at LOW is at most three.
- [ ] The asset budget delta is recorded exactly in progress.md (bytes and triangles per
  family) with the pre-existing aggregate red stated as pre-existing.
- [ ] The LOW-preset phone series inside the Cottage is recorded per step in
  progress.md, captured with Android emulation and the low preset seeded before goto;
  the compact and tablet screenshots are committed under docs/screenshots/.
- [ ] renderer.ts is untouched (diff shows no change); the monolith ceilings are
  unchanged or lower.
- [ ] All STEP 3 suites green; render-performance-reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 19, the budget delta table, the phone
  series, the screenshot paths, any family deferred for a missing reference) and
  docs/freeholds/state.md (the per-phase ledger row 19: the family directories, the
  pin tests, the registry fill, the prewarm homes; O5 marked per family as landed or
  waiting on a reference).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-19-qa.md

STOPPING RULES:
- Stop for a family whose references are missing or lack rights and provenance; ship
  the other families in full and record the gap (never invent a reference, never ship
  a scaffold as the asset).
- Stop if an asset cannot meet the 0.70 per-critical-feature threshold from four angles
  within budget; a global average never excuses a failed identity feature.
- Stop if a fingerprinted shared file must change in a way that would re-mint families
  outside this packet (the Eastbrook kit); that re-mint is a maintainer decision.
- Do not push the branch; never merge a PR.
```
