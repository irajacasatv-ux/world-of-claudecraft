# Phase 44a: final Codex artwork and placeholder-image sweep

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 44a of the Freeholds and Guildhalls feature: final Codex artwork and placeholder-image sweep.

Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; this prompt names no model. Claude-specific
memory, Workflow and agent-runtime instructions do not apply under Codex (AGENTS.md):
use the equivalent Codex read-only reader and reviewer roles wherever this prompt says
Explore or review agent.

Goal: inventory every feature-created visual, replace every remaining placeholder icon/image with final Codex artwork through the sanctioned workflow, and prove it in its actual gameplay context before legal handoff.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Gotchas scan (Codex has no Claude memory, AGENTS.md): read state.md "Gotchas" for
  screenshots at the lowest graphics preset, capture rigs never finding elements by
  English text, CI is the gate, never push to a fork, PR merge needs approval and the
  sensitive-material sweep.
- Confirm Codex's built-in image generation tool responds in this harness before any
  raster work; if it does not, STOP and record the external prerequisite as a named
  release gate in progress.md row 44a (D74: never substitute Claude or an unrecorded
  tool).

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use Codex's built-in image generation tool (an external
prerequisite of the Codex harness, not a repository skill: STOP and record the named
gate if it is unavailable) following docs/design/eastbrook-vale-rebuild/imagegen-prompts.md
with an imagegen-provenance.md row, and the woc-image-to-glb workflow, with their
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- state.md D74/D75, art-brief.md, content-manifest.md, content-numbers-workbook.md,
  ux-spec.md and the completed 44 evidence. Read every feature-created visual row and
  actual source/runtime use, including fallback branches and asset registration.
- .agents/skills/woc-image-to-glb/SKILL.md, .claude/skills/image-to-glb/SKILL.md,
  docs/image-to-glb-asset-workflow.md and scripts/assets/CLAUDE.md. Read
  docs/design/item-icon-art-style.md (style id woc-item-icon-v1), the
  docs/design/eastbrook-vale-rebuild/imagegen-prompts.md and imagegen-provenance.md
  record shape, the public/ui/items/mapping.json provenance rows,
  tests/item_icons.test.ts and the img2threejs intake instructions before any new
  raster/reference/GLB work.
- scripts/build_media_manifest.mjs, scripts/pr_shot_targets.mjs, existing relevant
  item/art/parsed-GLB tests, CREDITS.md and local guidance for every changed asset sink.
  Use actual existing icon/art systems, never assume a proposed renderer path exists.
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (each accepted, or still a named
  unsigned release gate).
The agent returns: a complete feature-created asset-to-runtime inventory and remaining placeholder
matrix, exact sanctioned producer/export/registration/test chain and approved visual
references. Deliberately final procedural/SVG artwork is not a placeholder merely
because it is code-based; verify its explicit final-art approval. This sweep supplies
no waiver of earlier final-art acceptance and does not invent dimensions or budgets.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Exhaustive visual inventory: create planned docs/freeholds/final-artwork-audit.md
   mapping each feature-created furnishing/room/gate/trophy/deed/item/recipe/dye/
   amenity/store/ward/Showcase/board/Charter icon or image and visual fallback to its
   public asset, source, actual runtime branch, intended context, provenance and
   final/placeholder verdict. Include empty/loading/locked and hidden-source
   silhouettes. A deliberate spoiler silhouette is final UX, not fake accomplishment
   art. Inventory source scans and live inspection together; no unexamined fallbacks.
2. Final Codex replacement of placeholder images: this entire asset-generating phase
   MUST run in Codex, not Claude. Use Codex's built-in image generation tool for
   raster icons, images and reference sheets (external prerequisite; STOP if
   unavailable) in the woc-item-icon-v1 style, with a public/ui/items/mapping.json
   row, an imagegen-provenance.md row and a CREDITS.md row per image; preserve the
   established icon/UI style and approved art brief.
   Use existing SVG/procedural editing where that is the sanctioned final asset type,
   with an explicit verdict, not a raster rewrite of every icon. Every remaining
   feature-created placeholder receives final accepted artwork. Record prompt/input/
   output lineage, rights/source hash and approval; no generated artifact is falsely
   labelled a shipped asset or another artist's work.
3. Sanctioned pipeline integration: use the existing asset-specific conversion and
   output format; every GLB replacement follows woc-image-to-glb and canonical
   reference admission, measured budgets, sculpt/factory/export/optimize/parsed-GLB
   fingerprint pipeline. Register runtime assets and prewarm/scheduler sinks; update
   CREDITS/provenance and actual item/media/icon manifests through owning generators.
   Re-export every affected fingerprint family. No hand-edit of generated files,
   stand-in art, missing loader row or unregistered placeholder fallback remains.
4. In-context proof: capture every changed visual in actual desktop, compact, tablet
   and LOW gameplay contexts required by ux-spec, with source/final matched evidence
   and actual runtime IDs. Inspect legibility at displayed size, material/silhouette,
   contrast, crop/alpha, theme/focus, reduced motion and denied-store absence (D86:
   no DOM node, handler, request, fetched catalog, error copy or accessible text on a
   denied surface, while the purchase code and English keys ship dormant in every
   bundle under the runtime capability, which is expected and stated). Include
   iOS/light-pressure fallback where relevant; never hide ghost/blocked information.
   Gallery renders alone do not satisfy gameplay evidence. Use existing approved
   screenshot sizes and measured asset budgets, no new guessed numeric limits.
5. Residual zero and fresh review: reconcile every inventoried row to final runtime
   bytes/provenance/evidence and a passed focused test; source/runtime scans and live
   checks show no feature-created placeholder icon/image or shipping stand-in.
   Update final-artwork-audit.md and the content/art manifests with final hashes and
   evidence. Run actual-surface review, apply all findings and fresh-review fixes;
   hand the completed visual inventory, the licensing evidence, the placeholder
   replacement record and the D86 evidence (the denied-surface runtime absence proof
   beside the explicit dormant-bundle statement) to 44b (D75).

INVARIANTS THIS PHASE MUST KEEP:
Every player-visible string, including error, aria, tooltip and empty-state text,
uses an English hudChrome.housing.* key and the formatters from src/ui/i18n.ts.
Tooltips follow docs/design/tooltip-writing.md. Reuse docs/freeholds/ux-spec.md and the
shared family/painter/window lifecycle, focus return, keyboard/gamepad, touch safe-area,
reduced-motion and graphics-fairness contracts; do not fork the theme. New paths,
symbols, wire fields, tables and tests under housing/freehold are PLANNED unless an
earlier completed ledger row owns them. Re-find every existing anchor in the tree.
No power sale, keystone/gear-intermediate/quickening-catalyst bill, new farm bed,
repossession or calendar destruction. Sim stays deterministic and token-free; all
server player events are keyed data. Coordinators compose siblings and never grow
past their pinned ceilings. Fresh tests use literal expectations and negative controls.


Out of scope:
New gameplay, balance, private/account data changes, legal messages, placeholder exceptions, skipped earlier art, packet deletion or final release enablement.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run the actual affected item/icon/art/fingerprint/registration suites, including
  tests/item_icons.test.ts and tests/item_art_consistency.test.ts for new item images;
  use each changed GLB's real parsed-asset tests and deterministic export verification.
  Re-find exact suite paths instead of naming a nonexistent generic artwork test.
- Run node scripts/build_media_manifest.mjs generate where runtime media changed;
  npx tsc --noEmit; node scripts/pr_screenshots.mjs for registered changed targets;
  npm run perf:tour for changed GPU producers; report actual asset-budget deltas and
  inherited aggregate overages truthfully. Run npm run gate for the completed asset
  contribution as required by the canonical pipeline.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Additional database changes would require their own pre/final review. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] The exhaustive actual-source/runtime inventory covers every feature-created visual and fallback; all placeholder rows are replaced and no shipping stand-in remains.
- [ ] Asset generation ran in Codex, not Claude; raster/image and GLB work follows the sanctioned workflows with traceable provenance, final output, registration and regenerated manifests/fingerprint pins.
- [ ] Each changed asset is verified in its actual desktop/compact/tablet/LOW context with
  ux-spec input/fairness/denied-store obligations (the D86 runtime-absence proof and
  dormant-bundle statement are recorded for 44b); intentional final SVG/procedural/silhouette
  art has an explicit approval.
- [ ] Focused art/content/registration tests, full required gate, domain reviews and fresh fix review pass; final-artwork-audit.md is complete and 44a QA proceeds to 44b.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 44a and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, acceptance-artifact evidence (signed, or
still a named unsigned release gate) and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44a-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
