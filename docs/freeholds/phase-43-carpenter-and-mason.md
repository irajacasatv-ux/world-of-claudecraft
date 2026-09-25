# Phase 43: existing-craft coverage and future expansion handoff

The file name keeps its original phase-43-carpenter-and-mason.md slug for link
stability; the scope is the README title above, and D68 (ruling-sheet R42) excludes
Carpenter and Mason from this packet: no new profession is created here.

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 43 of the Freeholds and Guildhalls feature: existing-craft coverage and
future expansion handoff, no new professions (D68).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: close the optional Carpenter/Mason scope by producing a measured future-expansion handoff while this packet ships its full furnishing program through the existing ten professions.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on content obligations, the R8 pattern channels
  (D53, ruling-sheet R27), the station gate composition, the professions tuning packet,
  test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, progress.md row 43, content-manifest.md,
  content-numbers-workbook.md and art-brief.md; the adopted proposal's optional
  Carpenter/Mason paragraph, the prior wave content and measured economy reports.
- The CURRENT existing profession, station, skill-save, recipe/pattern and content
  obligation seams through their directory-local CLAUDE.md guidance. Inventory the
  actual ten-profession furnishing assignment and cite existing paths/symbols/tests.
- Completed contributor/reviewer evidence for furniture access without a profession,
  current training gates and the protected material/keystone envelope.
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (each accepted, or still a named
  unsigned release gate).
The agent returns: the explicit locked exclusion of Carpenter/Mason from this packet
(D68, ruling-sheet R42: no new profession), existing
craft coverage and measured demand/capacity evidence. No skill cap, station family,
recipe count or new balance rate is chosen here. The future handoff is an artifact
of this slice, not an unanswered question or conditional implementation branch.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 3 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Coverage and evidence artifact: create planned docs/prd/woc/freehold-craft-expansion-handoff.md
   recording the locked no-new-professions scope, all current furnishing assignments,
   acquisition alternatives, measured use/economy findings and actual source/test
   anchors. Explicitly preserve profession-free ownership and upgrade access. Existing
   ten professions deliver the complete approved packet; no Carpenter/Mason content
   or skill-save enum is added (D68).
2. Future decision contract: document the evidence, affected station/training/skill-
   save/content/UI/parity/persistence seams and numeric-provenance worksheet a NEW
   separately authorized expansion would need. Reference existing rates only as
   evidence, never propose unapproved caps, twenty recipes or market projections.
   Name Fernando as future product owner and the applicable content, architecture,
   database, persistence and frontend review responsibilities. This future scope
   does not hold this packet open or imply a promised release.
3. Consistency and proof: cross-check the actual content manifest, guide and deck
   against the locked scope; remove any conditional claim that Carpenter/Mason ships
   here from those artifacts and README.md only. state.md's historical D1-D26 text
   (D14 included) stays verbatim: D68 supersedes it without editing it, so state.md
   is byte-identical after this sweep except its ledger rows. Verify all handoff
   links/anchors and current furnishing coverage. Record
   explicit no-implementation diff evidence and reviewer verdicts; leave every skill,
   station, recipe, player key and implementation file untouched.

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
Any Carpenter/Mason implementation, new craft-specific numbers, new station/skill/save/UI schema, or promise to ship a separate expansion.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Verify every handoff path/symbol/test citation against the current tree and run
  git diff --check over its explicit paths. Run the packet link/STEP/next-chain/copy
  lint and the Stop-hook floor. Confirm the scoped diff is docs-only.
- Follow docs/qa-gate.md for the docs-only change, including node scripts/gate_select.mjs
  when selected; record any justified not-applicable runtime checks rather than
  pretending new profession tests ran.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch content-obligations-reviewer, architecture-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  No runtime/database change is authorized by this handoff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] The future craft handoff exists with measured evidence, actual anchors, existing-ten-profession coverage and explicit no-new-professions scope.
- [ ] No skill cap/station/recipe count/rate is invented and no conditional Carpenter/Mason
  shipping promise remains in the packet or adopted proposal/deck (D68); state.md D1-D26
  text, D14 included, is unchanged.
- [ ] Only the planned handoff and packet status documentation change; all link/copy checks, fresh content/architecture/test review and proportional contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 43 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, acceptance-artifact evidence (signed, or
still a named unsigned release gate) and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-43-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
