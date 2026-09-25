# Phase 41: Dye station

The file name predates the 41/41a split: layout save and sharing belong to
phase-41a-layout-save-and-sharing.md, and this file owns dyes only.
This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 41 of the Freeholds and Guildhalls feature: dye station and furnishing tinting.

Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; this prompt names no model.

Goal: add eight approved cosmetic dyes through existing alchemy and station gates, with exact-copy application and scheduler-safe material variants. Layout save/share is owned by 41a.

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
- Gotchas scan (Codex has no memory step): state.md "Gotchas (read before the matching
  phase)" entries on world_api parity pins, the station gate composition, the R8
  pattern channels, material variants and the scheduler, frozen save keys, test-pin
  traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "41 Dye station"), and this
  file
- src/sim/freehold/amenities.ts (the Phase 12 station amenity slot and the D7
  composition), layout_core.ts and placement.ts (the layout row shape, validation, the
  undo stack), state.ts (the persisted record and its load-side allowlists),
  src/sim/content/freehold/furnishings.ts (FurnishingItemDef; where a dyeSlots field
  lands), src/sim/content/professions.ts (STATION_TYPE_BY_CRAFT, the apothecary type),
  src/sim/professions/crafting.ts (evaluateCraftAdmission), src/sim/professions/pattern_items.ts,
  src/sim/content/farm_patterns.ts (the pattern table shape), tests/apex_pattern_channels.test.ts
- src/world_api/housing.ts (the current housing facet), src/world_api.ts (COMMAND_NAMES,
  COMMAND_FACETS), server/freehold_wire.ts, server/freehold_db.ts (account_freeholds
  columns); server/clean_metadata_text.ts and the message-lane limits are 41a's anchors,
  not this phase's
- src/render/freehold/furnishings.ts and furnishing_layout_core.ts (material handling,
  prewarm homes), src/render/CLAUDE.md "GPU work"
- src/ui/hud/housing/ (build mode, the palette), src/ui/i18n.catalog/hud_chrome.ts,
  tests/freehold_layouts.test.ts (Phase 06), tests/freehold_layout_core.test.ts (Phase 08),
  tests/freehold_determinism.test.ts, tests/world_api_parity.test.ts
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (signed, or still open release gates).
The agent returns: the dye row/load allowlist, existing apothecary station/proximity gate,
exact-copy item custody/undo seam, recipe content obligations and material prewarm
recipe. State retains eight dyes and zero-to-two tint channels. content-manifest.md's
dye roster, art-brief.md's dye board and the CAL-DYES workbook artifact (UNSIGNED until
approved) provide every exact dye ID, English key, approved material color/source,
recipe/quantity/skill/channel row and source derivation. No guessed RGB or skill/rate.
Dye application uses the home station amenity of type apothecary (D90) at condition 30
or above and correct proximity; ordinary place/move/remove/undo remains unlocked at
every condition.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.
Database review is required BEFORE implementation decisions and again on the finished
diff, including changes to callers, persisted JSON, caches or workload even when SQL
text stays unchanged. Reuse 07a's global plot fence and reviewed actual legacy
touch-set, including caller-owned saves, character prelocks/nonces, bank-ledger
classification, guild replay and storage/custody effects. Preserve character FIFO
entry and the proved new-participant suffix, never a replacement generic lock order.
Never enter a queue holding a DB client or hold locks
across service IO. Bound admitted work, acquisition/query/transaction deadlines,
projection keys, rows and bytes; background producers use shared admission and
cancellation. Retain one running plus one pending dirty generation, not unbounded
FIFO writes. Supply a query/index inventory (scope, predicates, order, limit, expected
cardinality and supporting index), reverse-FK export/delete access and retention for
every growing shape. Disposable-PG concurrency, plans, query counts and maximum legal
payload evidence are acceptance, not satisfied by fake-pool tests.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 4 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Station and tint descriptor: FurnishingItemDef gains the approved zero-to-two
   channels. NEW src/sim/freehold/dye.ts::planFurnishingDye is the pure, shared
   authoritative admission/cost planner for dye_furnishing and 41a imported tint
   changes. It validates current owner, exact placed copy/channel, exact owned dye
   copies from the explicitly chosen authorized source, station/proximity, condition
   30 or above and approved recipe/material rules. 07a commits its complete planned
   inventory/tint/revision effects atomically; a preview never grants authority.
   Unchanged tint consumes nothing; batch imports cannot reuse a dye copy twice.
   The dye picker is enabled by the home station amenity of type apothecary (D90): no
   new amenity kind, no extra slot, no station GLB; it reads the same station/proximity/
   condition gate the apothecary crafting station uses, without training bypass, and
   tests/freehold_dye.test.ts pins the gate on that exact amenity (a forge, kitchens,
   tannery, loom or toolworks amenity does not enable it; no amenity refuses).
   Unsupported future valid owned tint/schema data retains its complete original
   storage and typed read-only recovery. Never drop a tint, rewrite the original or
   replace owned data with defaults because this binary cannot decode it. Separate
   malformed known-schema repair under 07's load-side contract (src/sim/freehold/state.ts
   normalizeFreehold/loadFreehold: absent legacy data, safely repaired known scalar,
   unsupported version, malformed owned content and oversize are distinct results, and
   unknown/newer/oversized owned rows stay read-only in their original durable
   location); save/export and later supported recovery preserve the original future
   record. Placement journal
   inverse restores exact consumed copy/tint only with current revision/custody
   preconditions; stale undo refuses atomically without material gain.
2. Eight-dye content family: the CAL-DYES palette rows own exact IDs/colors and
   English hudChrome.housing keys, ordinary cosmetic item/recipe/pattern rows,
   trainer-taught
   deterministic faucet and any approved rare channel plus Marks. Preserve existing
   craft/recipe/skill gates, no profession addition or guessed rates. Final item art,
   naming/IP provenance, positive power-neutral checks, wiki and source obligations
   ship together; dyes and recipe patterns receive no Reliquary page.
3. Material and picker presentation: cache/prewarm per-prop/tint variants with the
   render scheduler, never per-frame material allocation; register any pure core.
   Variant residency is bounded and released through the room-leave lifecycle (the
   ux-spec section 9 rule: visiting several homes must not ratchet materials), with
   perf:tour evidence that entering and leaving tinted homes keeps the material count
   flat. Build palette dye picker uses ux-spec bags-family affordances and the exact
   keyed station-required/out-of-range/condition/shortfall/no-channel/loading/error
   rows below (D92; refusals through the D26 freeholdDeniedLineKey selector), focus
   return and full touch/keyboard/gamepad parity. Register the NEW `housing-dyes`
   section 11 target (scenes dyes-picker, dyes-station-locked, dyes-station-unlocked
   and dyes-shortfall x desktop/compact/tablet, plus dyes-picker at the high preset and
   with reduced motion: 18 variants, the 681 milestone), append the rows
   to ux-spec section 10 and regenerate ux-shot-manifest.json and ux-key-manifest.json
   in the same change.
4. Wire, persistence and proof: route dye_furnishing through the existing dispatch
   seam, both-world facet/member and command/snapshot pins, strict decoder and bounded
   load/save shape. Atomic inventory/tint/revision persistence uses Phase 07's fence
   and character-first transfer seam. Unit and disposable-PG duplicate/stale/undo/
   crash cases prove exact custody and no free dye; direct and imported dyeing use
   the same planner and transaction rules. Distinct known-malformed and valid future
   tint/schema fixtures plus absent legacy tint fields exercise load, attempted
   mutation, save, export and supported
   recovery; unsupported owned records remain byte-preserved/read-only. Reject
   excessive fresh inputs before allocation without destroying persisted originals.

Exact English keys this phase ships (D92; the picker title, apply and review rows are
shipped here, no earlier phase produces them; the condition refusal reuses
denied.condition and the error state reuses denied.unavailable; {threshold} is the
condition 30 boundary through formatNumber):

| Key | Exact English |
| --- | --- |
| hudChrome.housing.dyes.title | Dye Station |
| hudChrome.housing.dyes.apply | Apply Dye |
| hudChrome.housing.dyes.review | Review Dye Use |
| hudChrome.housing.dyes.loading | Loading dyes... |
| hudChrome.housing.dyes.channelPrimary | Primary |
| hudChrome.housing.dyes.channelAccent | Accent |
| hudChrome.housing.dyes.noDye | No dye |
| hudChrome.housing.dyes.unchanged | No change. Nothing is used. |
| hudChrome.housing.dyes.swatchAria | {dye}: {count} in bags |
| hudChrome.housing.dyes.reviewLine | Use {count} {dye} on {furnishing}. |
| hudChrome.housing.dyes.pending | Applying dye... |
| hudChrome.housing.dyes.stationTooltip | Dyes are applied at this home's apothecary station while the home is at {threshold} condition or higher. Placing, moving and removing furnishings never need it. |
| hudChrome.housing.denied.dyeStation | Dyeing needs an apothecary station in this home. |
| hudChrome.housing.denied.dyeRange | Stand closer to the apothecary station to dye. |
| hudChrome.housing.denied.dyeShortfall | You do not have enough {dye}. |
| hudChrome.housing.denied.dyeChannel | This furnishing cannot be dyed. |

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
Layout save/load/share (41a), wall/ceiling surface dye, new professions, any layout marketplace.

ACCOUNT AUTHORITY, CALENDAR AND RECOVERY ACCEPTANCE:
Consume 07b's single account lifecycle authority: NEW
server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage/
advanceFreeholdLifecycleOnClient, coordinated by
server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator and the accepted
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding policy registry.
Capture authenticated observations before queues; committed monotonic transitions,
not authentication login or a plot-local last-seen field, authorize account grace.
Immutable multi-return history or lossless prefix facts cover dormant/foreign plots;
union overlapping lifecycle protection and service suspensions exactly, never sum
independent credits, force-write foreign plots or restart grace on an alt/plot switch.

07c's NEW server/freehold_arrival_db.ts::loadFreeholdArrivalTiers/
markFreeholdArrivalTierOnClient owns normalized account+tier marks, separate from
lifecycle and plot saves. Only the committed accepted-owner-entry insert winner
has first-tier eligibility. NEW arrivals may receive a private freshArrivalPresentation
directive; snapshot/resume/replay set it null even with firstTierAtAdmission history.
Commit-before-ACK can skip presentation; no exactly-once visible/audio promise and
no permanent receipt for routine visits. Second plots and transfers do not duplicate,
copy or clear account arrival marks or seller lifecycle history.

13/13a own shared source calendar/history/checkpoint evaluation. Preserve calendarId,
schemaVersion/resetPolicyId and immutable prepaid bill/rate/material/receipt identities
across foreign-realm claims and transfers. No rebinding to serving realm/browser zone.
Historical dependencies of durable condition/bill/credit effects must be irrevocably
finalized and read at consistent committed calendar/lifecycle revisions; unfinalized,
missing or unsupported coverage keeps the affected effect pending. A future-credit
purchase does not require future time to be finalized. Long absences/outages use
bounded indexed prefix probes, never lifetime scans or absent-day/week loops.
Calendar-only exclusive writers and compatible shared mutation readers follow 07a's
actual legacy touch-set proof; no invented reverse lock hierarchy. Current-generation
projection/ACK identity cannot regress after delayed loads or superseded delivery.
Server-only operator evidence, secrets and diagnostics never reach either owner or
visitor wire: explicit allowlist builders and distinctive sentinel tests prove it.

At a sale/ownership transfer, materialize the old owner's condition at the transfer
boundary from finalized original calendar/lifecycle history; preserve source calendar
and immutable credits, retain seller account history, and apply buyer lifecycle only
prospectively without copying grace. Unknown authority holds application for bounded
original-operation recovery/accepted compensation, never a replacement charge or
silent calendar reset. Current local custody/fence guards still apply.
Character deletion, soft deactivation, restoration, true account deletion and export
are separate: deactivation is not an FK cascade; restored history/credits/receipts keep
their meaning. Explicit housing export loaders expose allowed facts only. Unknown or
oversized originals remain durable/read-only with bounded diagnostic/reference, not
empty/new-home defaults or filtered destructive arrival-set rewrites.
07's persistence-rollout-contract.md and 07b's lifecycle-policy-binding.md/
lifecycle-db-contract.md plus 13a's upkeep-calendar-db-contract.md name minimum
capable releases, measured bounds, exact schema/save fixtures and accepted policies.
Enable only a proven capable rollout; unchanged normalized rows do not prove an old
binary implements lifecycle, export or saves. Rollback quiesces NEW effects and
preserves accepted original-operation recovery identities and supported recovery.
Each consuming implementation/QA runs relevant two-character/two-plot/two-realm,
dormant-history, delayed-generation, finality/transfer, deactivation/restore/export
and capable/uncapable-release fixtures through real composition and disposable PG.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run npx tsc --noEmit; npx vitest run tests/freehold_dye.test.ts
  tests/freehold_station.test.ts tests/freehold_layout_core.test.ts
  tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts
  tests/snapshots.test.ts tests/freehold_command_chain_online.test.ts
  tests/professions_crafting_hub.test.ts tests/apex_pattern_channels.test.ts
  tests/recipe_pattern_items.test.ts tests/item_icons.test.ts tests/item_art_consistency.test.ts
  tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts
  tests/provisioner_firewall.test.ts tests/market_filters.test.ts tests/renderer_compile_gate.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts
  tests/pr_shot_targets.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts (tests/freehold_station.test.ts is 12's station amenity
  suite; tests/freehold_dye.test.ts is NEW here).
- Run new server dye-transfer tests and disposable-PG twins with TEST_DATABASE_URL;
  npm run wiki:content; npx vitest run tests/guide.test.ts; npm run i18n:gen;
  npx vitest run tests/i18n_completeness.test.ts; npm run perf:tour;
  node scripts/pr_screenshots.mjs. Regenerate parity goldens only after a behavioral review.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch content-obligations-reviewer, architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Eight exact CAL-DYES palette/recipe/source rows (handoff-ready; acceptance status recorded as an unsigned release gate unless a signature artifact is on file) and zero-to-two tint channels are pinned; no guessed color/rate and no new station/profession or training bypass.
- [ ] Dye requires the home apothecary station amenity (D90, pinned against every other amenity type and against no amenity), proximity and condition 30+, consumes/applies atomically, and stale/duplicate/undo/crash tests preserve exact-copy custody; normal placement stays unlocked.
- [ ] Valid future tint/schema preserves the complete original/read-only record across load/save/export/recovery; known-malformed repair is separately pinned. Strict limits and both-world commands pass; variants prewarm without per-frame material allocation and entering and leaving tinted homes keeps the material count flat.
- [ ] Every dye has final art/source/wiki obligations and deterministic access; desktop/compact/tablet picker/lockout captures and all validation/reviews/gate pass; the dye key rows and the `housing-dyes` scenes (dyes-picker, dyes-station-locked, dyes-station-unlocked, dyes-shortfall) are registered and both manifests regenerated (D92).

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 41 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-41-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
