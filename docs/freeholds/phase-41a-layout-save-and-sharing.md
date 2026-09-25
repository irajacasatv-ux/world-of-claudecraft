# Phase 41a: bounded layout saves and public sharing

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 41a of the Freeholds and Guildhalls feature: bounded layout saves and public sharing.

Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: let an owner save five layouts and share a public decoration plan, applying it only with actual existing item copies through an atomic preview/commit flow.

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
- Memory scan: MEMORY.md and entries on world_api parity pins, the station gate
  composition, the R8 pattern channels, material variants and the scheduler, frozen
  save keys, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "41a Layout saves and public sharing"), and this file
- src/sim/freehold/amenities.ts (the Phase 12 station amenity slot and the D7
  composition), layout_core.ts and placement.ts (the layout row shape, validation, the
  undo stack), state.ts (the persisted record and its load-side allowlists),
  src/sim/content/freehold/furnishings.ts (FurnishingItemDef; where a dyeSlots field
  lands), src/sim/content/professions.ts (STATION_TYPE_BY_CRAFT, the apothecary type),
  src/sim/professions/crafting.ts (evaluateCraftAdmission), src/sim/professions/pattern_items.ts,
  src/sim/content/farm_patterns.ts (the pattern table shape), tests/apex_pattern_channels.test.ts
- src/world_api/housing.ts (the current housing facet), src/world_api.ts (COMMAND_NAMES,
  COMMAND_FACETS), server/freehold_wire.ts, server/freehold_db.ts (account_freeholds
  columns), server/clean_metadata_text.ts, server/msg_lanes.ts (classifyMsgLane,
  consumeLaneToken: the WebSocket command lane seam), server/msg_rate_limit.ts
  (MSG_BYTE_BURST, the pre-parse frame byte bound), server/character_delete_db.ts (the
  storage-guard refusal shape D88 maps)
- src/render/freehold/furnishings.ts and furnishing_layout_core.ts (material handling,
  prewarm homes), src/render/CLAUDE.md "GPU work"
- src/ui/hud/housing/ (build mode, the palette), src/ui/i18n.catalog/hud_chrome.ts,
  tests/freehold_layouts.test.ts (Phase 06), tests/freehold_layout_core.test.ts (Phase 08),
  tests/freehold_determinism.test.ts, tests/world_api_parity.test.ts
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
The agent returns: the current exact-copy placement/custody seam, after-41 dye descriptor,
bounded persisted-row/byte measurements, save-name screening and cold-window family.
State retains five saves per plot. The approved largest legal layout determines
encoded/decoded row/string/byte limits including nesting and parent graph, enforced
before allocation/mutation. Use a per-plot layout_saves JSONB field bounded by that
manifest and additive schema, not an unbounded share service. Save labels are private
screened metadata; public codes carry version/tier/public layout only, no private label,
account/plot identity, item-copy ID, price, social list or service field.
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
1. Public codec: NEW src/sim/freehold/layout_share_core.ts
   (encodeLayoutShare/decodeLayoutShare) is pure,
   versioned and byte-stable across hosts. Serialize only approved furnishing/tint/
   anchor/transform plan rows and tier/layout version, never private labels or exact
   item-copy identity. Reject unknown version, malformed base64url, excessive bytes,
   rows, nested depth, invalid parent graph or geometry before allocating/applying.
   Reuse layout_core validation and approved measured bounds; no marketplace import.
2. Bounded saved layouts: five per stable plot ID in layout_saves JSONB owned by NEW
   server/freehold_layout_saves_db.ts, additive
   DDL and versioned normalizer, row/byte limits derived from the legal largest
   snapshot. Save labels are private and cleanMetadataText-screened with approved
   field length; never render a raw label or include one in share output. save_layout
   and apply_layout_share are WS facet commands, so their rate limit has two
   mechanisms, both MEASURE-BOUNDS workbook rows (never literals here): (a) a NEW
   layout_import MsgLane member in server/msg_lanes.ts (classifyMsgLane maps
   save_layout and apply_layout_share to it, consumeLaneToken gains its bucket, and the
   closed MsgLane union plus the suite that pins it extend) refuses the frame beyond
   the per-session budget with a keyed reason before decode; (b) a per-account import
   budget in a bounded LRU map keyed by accountId, in the idiom phase-26 uses for its
   knock and public-entry limits (the maxEntries shape of
   server/discord_status_cache.ts), consulted before decode, so two sessions or alts
   of one account share one budget. Both sit after the MSG_BYTE_BURST pre-parse frame
   bound in server/msg_rate_limit.ts and before the codec's own decoded
   byte/row/depth limit; no REST route or rate_limit middleware is added. Use rev
   CAS/fenced writer and include export/delete: layout_saves lives
   inside the plot row and follows 07a's per-row-class ON DELETE policy (D88); an open
   apply/import operation blocks character or account deletion with the mapped refusal
   class in character_delete_db.ts, and the deletion race joins the real-PG list.
   Unsupported or oversized existing storage is preserved with typed recovery, not
   reset to empty.
3. Atomic plan application: save_layout/load_layout/apply_layout_share and facet
   methods reuse current custody validation. A preview reserves exact available
   placed, bag and authorized personal-bank copies and shows EVERY shortfall and
   displaced-copy safe destination. Reusing already placed copies does not demand a
   duplicate item; nested children move atomically with parents. No vault is implied
   by a strongbox and no guild bank is read without current authorization. Commit
   checks plot/inventory/bank revisions and current ACL in the shared transaction,
   applies all rows and exact-copy deductions/returns or none. Preserve shared
   colors: every changed tint uses 41's NEW src/sim/freehold/dye.ts::planFurnishingDye
   and the same authoritative material transaction. Preview each tint change, exact
   owned dye copy, chosen authorized source and ALL dye/material shortfalls under
   the existing cost rules. Current station/proximity, condition 30 or above, exact
   furnishing/channel and revision/custody guards apply to the whole batch; unchanged
   tint consumes nothing. No silent tint omission, dye-copy reuse or free color
   application. Commit consumes all required dye/material copies and applies every
   furnishing/tint change atomically through 07a, or changes nothing. It never creates
   furniture, grants dyes or overwrites private labels. Unsupported incoming share
   versions/tints refuse before mutation; unsupported future owned saved records
   remain original/read-only under 07/41, never rewritten as tintless furniture.
   Stale preview or insufficient safe custody returns a keyed reason.
4. Layout tab and proof: NEW src/ui/hud/housing/layouts_view.ts (pure view-core) and
   layouts_painter.ts compose the Steward-family private saved list, preview/shortfalls,
   load/overwrite confirmation and public code copy/paste use ux-spec focus and input
   contracts. English hudChrome.housing keys for all states, screened labels rendered
   safely; share preview never reveals private labels. Existing layouts.* keys (title,
   save, load, share, review, shortfall) and denied.changed (stale preview) are reused;
   NEW keys under hudChrome.housing with exact English (D92), appended to ux-spec.md's
   key tables with the section 11 housing-layouts screenshot target (scenes
   layouts-empty, layouts-saved, layouts-overwrite, layouts-import-review,
   layouts-shortfall, layouts-dye-shortfall, layouts-displaced and layouts-stale x
   desktop/compact/tablet: 24 variants, the 705 milestone), both manifests
   regenerated in this same change with every cited count updated: layouts.empty "You
   have no saved layouts yet."; layouts.nameLabel "Layout name"; layouts.slotsFull "All
   {count} layout slots are in use. Replace one to save."; layouts.overwrite "Replace
   the saved layout {name}?"; layouts.saved "Your layout is saved."; layouts.codeLabel
   "Share code"; layouts.copyCode "Copy Code"; layouts.pasteCode "Paste a share code";
   layouts.importReview "Review this shared layout before applying it.";
   layouts.displaced "{item} will move to {destination}."; layouts.dyeShortfall "You
   need {count} more {dye} for this layout."; layouts.applied "Your layout is
   applied."; and denied.layoutCode "This share code is not valid.". Both-world
   commands and strict wire pins, codec maximum/legal/over-limit tests and real-PG
   save/apply/bank/edit races prove exact custody, atomic rollback and bounded work; a
   lane test drives one frame more than the per-session budget on one session, and one
   frame more than the per-account budget spread over two sessions of one account, and
   observes each refused with a keyed reason before decode. Direct/imported tint
   parity tests cover missing dye, absent station, remote station, condition 29,
   unauthorized channel, unchanged
   tint, competing copy consumption, stale source revisions and failure after one
   planned tint in a batch; no partial furnishing, dye or tint effect survives.
   Add the desktop/compact/tablet layouts-* captures (layouts-empty, layouts-saved,
   layouts-overwrite, layouts-import-review, layouts-shortfall, layouts-dye-shortfall,
   layouts-displaced, layouts-stale)
   and current-input parity, including exact color/material confirmation.

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
Dye content/station (41), layout marketplace/trade, public private labels, item creation, a hosted global share-code database.

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
- Run npx tsc --noEmit; npx vitest run tests/freehold_layout_share.test.ts
  tests/freehold_layout_core.test.ts tests/freehold_layouts.test.ts tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts
  tests/snapshots.test.ts tests/freehold_command_chain_online.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts.
- Add/run tests/server/freehold_layout_saves_db.test.ts and the disposable-PG twin,
  including concurrent bank/custody and bytes/query-plan evidence. Run npm run i18n:gen;
  npx vitest run tests/i18n_completeness.test.ts; npm run wiki:content;
  npx vitest run tests/guide.test.ts; node scripts/pr_screenshots.mjs.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
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
- [ ] Five per-plot bounded saves preserve private screened labels; public codec contains only version/tier/public layout and passes deterministic/unknown/oversized/nested fixtures before allocation.
- [ ] Apply previews exact furnishing and dye copies, chosen sources, every shortfall, color change and displaced destination. Shared 41 dye admission/cost rules and unchanged-tint no-consumption hold; one 07a transaction applies all or none without free color or item/dye creation.
- [ ] Disposable-PG edit/bank/ACL/revision/crash races refuse stale previews without loss/duplication; export/erasure, JSON compatibility and workload/index evidence pass. The NEW layout_import lane refuses the frame beyond the per-session budget and the per-account LRU budget refuses the frame beyond budget across two sessions of one account, both before decode; an open apply/import operation blocks deletion with the mapped refusal class (D88).
- [ ] Full saved/import/shortfall/stale UI screenshots, keyboard/gamepad/touch/focus parity, all tests/reviews and contribution gate pass. The NEW layouts.*/denied.layoutCode keys and the housing-layouts target with its eight layouts-* scenes are in ux-spec.md and both regenerated manifests (D92).

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 41a and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-41a-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
