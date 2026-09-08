# Phase 24 QA: audit the Kitchen Garden tableau

Audits `phase-24-kitchen-garden-tableau.md`. Verdict goes in `progress.md` (row "24
QA"). The next implementation phase never starts before this file has run.

## Settled delivery and acceptance contract

Follow docs/freeholds/ux-spec.md as the visual and interaction source. Reuse the actual
shared window and PainterHost families, theme tokens, content-signature dirty model,
focus restoration and nontrapping build companion. Every player string is an English
hudChrome.housing.* key (item/entity/guide source domains keep their canonical keys);
tooltips follow docs/design/tooltip-writing.md. Capture desktop, compact and tablet
targets from the shared housing helper with stable IDs at LOW, including empty,
loading, refused, locked, visitor, reconnect and success states relevant here. Required
after-shots fail if missing. Use shape/text as well as color for actionable state;
40x40 touch controls respect safe areas, keyboard/gamepad order and reduced motion.
Three authored emitters is a ceiling subject to the existing light sink/global budget,
including iOS two and pressure one; unchanged ghost, blocked reason and occupancy
information must remain legible through ambient grade, materials and silhouettes.

## Deliverables (at most five):

1. Bounded shared account-owner farm source with explicit freshness.
2. Single safe public owner-garden projection with private fields excluded.
3. Current-character owner-only Harvest Journal board and flavor NPC.
4. Final measured garden tableau and prop art.
5. Zero-bed, source-authority, privacy, fairness and interaction evidence, with the
   registered garden screenshot target and regenerated key/shot manifests (D92).

## Account-owner garden source and freshness contract

D52/R26 uses all eligible characters of the home's owning account. The exported src/world_api/farming.ts::IWorldFarming interface and its myFarmPlots
member, together with src/sim/professions/farm_projection.ts, describe
current-character PlayerMeta.farmPlots/save projections; neither is an account-owner
aggregate. The verified source fact is recorded in state.md. Never read the visitor's
myFarmPlots or choose an arbitrary primary character.

Reuse the NEW 17-owned shared account-source boundary:
server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage and
server/freehold_account_sources.ts::createFreeholdAccountSourceLoader. This file adds
fixed versioned static farmPlots and farming-proficiency extraction to that projection,
including the existing legacy skill fallback semantics. Keep hidden survival/yield data
server-side only where the existing projectFarmPlots status derivation needs it. Do not
call listCharactersAllRealms or SELECT whole character state. Keyset pages by character
id, scoped to the account; measure the candidate (account_id, id) access index, exact
rows/bytes/query limits and multi-realm character cardinality in MEASURE-BOUNDS. The
existing per-realm character cap is not an account-global cap. No SQL runs per growth
step, render frame, descriptor snapshot, visitor or farm bed.

Aggregate with internal (sourceCharacterId, bedId) identity so two owner alts with the
same bed ID remain distinct. A currently authoritative, generation-fenced local Sim
source supplies that character's farm map and farming skill and replaces its ENTIRE
saved slice, including an empty map after harvest. Foreign/nonlocal sources remain
saved snapshots. Compute stage/status with the unchanged projectFarmPlots,
farmGrowthStage and host farm-clock contract; time-derived stage changes do not make
a saved source live and never imply remote unflushed plant/harvest/skill changes are
known. No farm rule, slot, crop, water/harvest action or extra bed is introduced.

Use 17's bounded keyed single-flight cache, shared admission, cancellation, freshness
and refresh/invalidation owner so trophy and garden readers join the same page flight.
On a relevant successful local plant/harvest/dev farm change, farming-proficiency change,
committed changed-source save/create/delete, or session load/leave/takeover, install an
available committed source slice with a generation fence or invalidate its account/source
epoch. Coalesce to one dirty account refresh; an unrelated position/gear autosave does
not invalidate the garden. A late page cannot resurrect harvested, deleted or replaced
source data. Cross-process commits use 17's bounded refresh/invalidation mechanism;
without live source transport they remain honestly saved. This file adds no poller,
per-visitor listener, full-account reload per save or second account-source cache.

The descriptor explicitly picks opaque visualId, bedId, cropId, stage, status and
live/saved/unavailable freshness, sorted by the stable source-qualified internal key.
Opaque visualId must not encode a character/account ID. Exclude raw source identities,
observation timestamps (the source page's read and fence stamps), the crop's own
plantedAtMs/readyAtMs, skill, private timers, hidden slots and survivalRoll/yieldSeed
from both owner and guest wire. Because public rows carry stage without any timestamp,
growth between descriptor emits follows one time-driven rule on both hosts: the
existing 1 Hz farm tick sweep (updateFarming in src/sim/professions/farming.ts, the
sweep that already calls notifyFarmReady) re-runs projectGardenTableau over each live
claimed plot's available source and re-emits the garden block only when the projected
rows' signature changes at a stage or status boundary; never per tick, never per frame,
never a poller, with zero SQL and no extra source query. The offline host renders from
the same pure projection on the same sweep, so both hosts advance a sprout at the same
boundary. Public rows are the same owner-derived tableau for all
viewers. Empty is valid only after a complete successful source read proves no plots;
incomplete/over-budget/failed source is explicitly unavailable or incomplete, never
false empty, first-character-only or a visitor's replacement garden. Use ux-spec's
keyed loading/empty/saved/unavailable states and screenshot these at LOW.

The owner action opens the CURRENT CHARACTER's existing private Harvest Journal;
account aggregation grants no ability to open another alt's journal. Guests have no
journal action and only inspect the public owner tableau. Offline/headless adapters
use their actual available owned-character sources without pretending to load online
account data; an unavailable account source is explicit and never another player's.

Paired QA proves two owner alts with conflicting crops in the same bed IDs, concurrent
sessions, unrelated visitor farms, owner offline, remote saved snapshots, skill-derived
ready/withered status, successful empty after harvest, reconnect/takeover, stale page
completion after delete/harvest, missing and over-budget pages, and exact public key sets.
Assert no SQL during growth/render/snapshot and bounded shared flight/query counts with
concurrent trophy/garden viewers. Run disposable-Postgres static projection/keyset/index
fixtures, including multi-realm accounts, plus before/final database-performance,
persistence and privacy-security review. Captured original stored rows remain untouched.

## Exact garden string and source-state acceptance

Use the canonical ux-spec.md garden mapping below. These are approved future English
hudChrome.housing.garden.* sources, not a claim that an unbuilt runtime tooltip ships
now. Implement the matching source predicate and rendered tooltip together, following
docs/design/tooltip-writing.md. No separate synonym keys or timer-bearing fallback.

| Key | Exact English |
| --- | --- |
| hudChrome.housing.garden.title | Kitchen Garden |
| hudChrome.housing.garden.loading | Loading the garden... |
| hudChrome.housing.garden.empty | No garden beds are recorded. |
| hudChrome.housing.garden.live | Current garden |
| hudChrome.housing.garden.saved | Saved garden |
| hudChrome.housing.garden.mixed | Some beds use saved records. |
| hudChrome.housing.garden.incomplete | Some garden beds could not be loaded. |
| hudChrome.housing.garden.unavailable | The garden is unavailable right now. |
| hudChrome.housing.garden.openJournal | Open {journal} |
| hudChrome.housing.garden.liveTooltip | These beds use their owner's current garden records. |
| hudChrome.housing.garden.savedTooltip | These beds use saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.mixedTooltip | Some beds use current records and others use saved records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.savedStatus | {status} (saved) |
| hudChrome.housing.garden.savedReadyTooltip | This bed appears ready from saved garden records. Changes made elsewhere may not appear yet. |
| hudChrome.housing.garden.journalTooltip | Open your current character's {journal}. |
| hudChrome.housing.garden.growing | Growing |
| hudChrome.housing.garden.board | Harvest Journal board |

Resolve {journal} through existing hudChrome.harvestJournal.title. Resolve ready and
withered status through existing hudChrome.harvestJournal.ready and
hudChrome.harvestJournal.withered. Growing uses hudChrome.housing.garden.growing;
never use hudChrome.harvestJournal.growing because that source contains a private timer.
No timestamp, hidden farm data or raw source identifier enters a placeholder. The
board's templateId `harvest_journal_board` resolves its display name through the
feast_title templateId map to hudChrome.housing.garden.board, never a raw English name
on the wire. The board row is new in this phase, so append it to ux-spec section 10 and
regenerate ux-key-manifest.json in the same change (D92); the other rows are already
section 10 rows.

Apply aggregate source-state precedence from the shared loader result: before any
result use loading; whole-source failure uses unavailable; any incomplete coverage
uses incomplete while retaining only honest known rows; complete zero rows uses empty;
complete nonempty all-live/all-saved/mixed coverage uses live/saved/mixed respectively.
An empty local replacement after harvest does not erase another owner's-character slice,
and an unavailable page can never produce confirmed complete-empty. All viewers see
the same owner-derived source state; only the current character owner gets openJournal
with journalTooltip and the existing private Journal action.

Each saved row ALWAYS wraps its localized status in savedStatus, including accessible
text and a saved-ready glow. A saved ready row also uses savedReadyTooltip; the ready
appearance cannot imply that remote unflushed changes are current. Live, saved and mixed
aggregate labels use their matching explanatory tooltips. Incomplete/unavailable state
does not expand Journal authority or introduce any harvest control. Existing current-character
Journal admission is independent of the public aggregate status; privacy rules still apply.

Decisive rendered fixtures cover initial loading, complete empty, wholly live, wholly
saved, mixed live/saved, partial/incomplete and failed/unavailable sources. Independently
pin a saved ready row's visual label, tooltip and accessible name, timer-free growing,
localized {journal}/{status} values and the owner-current-character versus guest action.
Assert the exact public descriptor key set, no private sentinel in DOM/accessibility or
placeholders, and no empty fallback on missing pages. Capture these states in the later
wave B acceptance evidence at desktop, compact and tablet sizes at LOW. The canonical UX
manifest owns target identities, so this phase registers them rather than inventing an
alias: append the NEW `housing-garden` target (the scenes
garden-{live,saved,mixed,incomplete,unavailable,empty,loading}-{owner,guest} x
desktop/compact/tablet, 42 variants, the 408 milestone) to ux-spec section 11
(housingReviewTargets) and regenerate
ux-shot-manifest.json in the same change (D92); the seven wave A targets are unchanged,
and 27 captures only registered keys.

## Required Codex asset execution

Every step in this file that creates or replaces a GLB, icon, image, texture, reference
sheet, room/interior or trophy/furnishing art must be executed by Codex, not Claude.
Use the repository image-to-GLB and image-generation workflows, approved art-brief.md,
measured model manifests, export/optimization/fingerprint/prewarm and in-game proof.
The paired QA verifies the asset-generating step used Codex and all final-art evidence.
If a QA fix creates or replaces an asset, that fix step also runs in Codex, not Claude.
Final wave acceptance still requires complete shipping art. The final Codex placeholder
icon/image sweep in 44a verifies and replaces any feature-created remnants; it does
not excuse an earlier incomplete paid product or relax an earlier final-art gate.
This packet is documentation only; no shipping asset is generated by this audit.

### Starter Prompt
```
This is Phase 24 (QA) of the Freeholds and Guildhalls feature: audit the Kitchen Garden
tableau (the garden projection, the Harvest Journal board, the farmer NPC, the render
tableau, the zero-bed rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 24 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "24 Kitchen Garden tableau", missing tests,
dead code, determinism, three-host parity, the hidden-slot leak rule, the zero-bed
rule against the farming calendar model, and render fairness; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the farming calendar model entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("24 Kitchen Garden tableau" and
  the row), docs/freeholds/phase-24-kitchen-garden-tableau.md (what was promised)
- the Phase 24 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 24)
- the pins the diff claims: tests/freehold_garden_view.test.ts,
  tests/professions_farming.test.ts, tests/professions_zone_rollout.test.ts,
  tests/snapshots.test.ts, tests/entity_display_name.test.ts,
  tests/renderer_compile_gate.test.ts, tests/pr_shot_targets.test.ts,
  tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the import
graph of garden_view.ts, every field the garden rows carry (against the PlotState hidden
slots), whether any farming file changed, and any TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the tableau rows
  equal the account-owner source aggregate with separate live/saved/unavailable freshness;
  whole-character local overrides including empty replace saved data; the projection follows
  the clock-base contract (no Date.now subtraction from an authority stamp); a visitor
  sees the account owner's safe garden per D52, never their own farm substitute; only the
  owner board opens the current character's existing Harvest Journal; guests cannot open either private owner controls or a
  misleading visitor Journal under an owner heading; the farmer NpcDef carries no `farmer`
  flag, vendor, gossip service, or state write (isFarmerNpcEntity false, convertHusks
  refuses 'no_farmer' inside the plot); the stage shown between descriptor emits advances
  on the 1 Hz farm sweep on both hosts with zero SQL; the board's name resolves through the
  templateId map to hudChrome.housing.garden.board; the board and NPC are torn down on
  free; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the zero-bed pin compares
  FARM_BED_IDS and FARMING_GAIN_SCHEDULE against fresh literals, not against themselves;
  the hidden-slot pin asserts the exact key set of a garden row; the one-to-one pin has
  a control that fails on an added or dropped row; the fairness pin exercises LOW and
  the top preset; the farmer negative pin asserts NPCS.freehold_farmer.farmer undefined
  and a 'no_farmer' refusal with the NPC spawned; the idle stage-boundary case asserts
  the advanced stage with a zero-query control); orphaned tests; a determinism case with
  a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, garden_view importing farm_patches or any content table, the word
  "phase" in any code, comment, or commit message, em dashes or emojis, generated files
  hand-edited, a prop attached outside the scheduler, the local CLAUDE.md row accurate,
  ux-key-manifest.json and ux-shot-manifest.json regenerated in the phase's commits (the
  board row; the `housing-garden` variants) rather than hand-edited.
- Required reviewers: architecture-reviewer, render-performance-reviewer, content-obligations-reviewer, frontend-seam-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, database-performance-reviewer, migration-safety, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 24 STEP 3 suite list plus `npx tsc --noEmit` and `npm run perf:tour`.

STEP 4 - FIX:
- Apply ALL findings including nits, resolving any claimed conflict against the
  approved decision rather than leaving an unreviewed exception. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
ALL findings, including nits and uncertain findings resolved against source evidence,
must be applied and the complete fix round read by a fresh reviewer before PASS.
External signatures remain concrete release-gated artifacts, never deferred review findings.
- [ ] Every Phase 24 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "24 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-25-build-mode-v2.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 24 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
