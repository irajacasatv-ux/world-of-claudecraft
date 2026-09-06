# Phase 40: Keep and Citadel tiers, prestige deeds

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 40 of the Freeholds and Guildhalls feature: Keep and Citadel tiers with existing prestige.

Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; this prompt names no model.

Goal: complete the personal and guild tier ladders using the same existing prestige alternatives for both top tiers, safe upgrades and final courtyard/tower art.

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
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Gotchas scan (Codex has no memory step): state.md "Gotchas (read before the matching
  phase)" entries on content obligations, interior layouts and colliders, point-light
  budgets, the provisioner firewall, test-pin traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the ruling, the content numbers table), docs/freeholds/progress.md
  (only "40 Keep and Citadel tiers, prestige deeds"), and this file
- src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts, trophies.ts (the ladder
  through Phase 32; free indices), src/sim/content/freehold/layouts.ts (the Manor and
  Bastion layouts, D23) and src/sim/dungeon_layout.ts (DAWNHOLD_STAIR_LIFT and authoredLiftAt consumer
  model), src/sim/rift/authored.ts (authoredLiftAt, AuthoredRoom, AuthoredLedge), src/sim/colliders.ts (STATIC_INTERIOR_COLLIDERS),
  src/sim/world.ts (groundHeight interior arms), src/render/dungeon.ts (the variant
  union; whether an open-sky room exists in any kit), src/render/point_light_budget.ts
- src/sim/freehold/build_project.ts (Phase 32), the Phase 21 upgrade gate module,
  src/sim/deeds.ts (deedsEarned), src/sim/reliquary.ts (curatorRankFromOwned,
  CURATOR_RANK_DEFS), src/sim/content/deeds.ts (prog_legendmaker, the raid clear deeds),
  server/claudium.ts (the freehold spend arm), src/sim/freehold/ward_core.ts (exterior
  shells per tier from Phase 34)
- src/render/freehold/ (the dressing modules), tests/freehold_content.test.ts,
  tests/freehold_build_project.test.ts, tests/provisioner_firewall.test.ts
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (signed, or still open release gates).
- Required durable artifacts: docs/freeholds/content-manifest.md,
  docs/freeholds/content-numbers-workbook.md, docs/freeholds/art-brief.md and
  docs/freeholds/ux-spec.md; docs/prd/woc/freehold-service-contract.md,
  docs/prd/woc/freehold-counsel-memo.md, docs/prd/woc/freehold-terms-amendment.md,
  docs/prd/woc/freehold-store-listing-drafts.md,
  docs/prd/woc/freehold-deed-service-contract.md and
  docs/prd/woc/freehold-territory-authority-schedule.md.
The agent returns: the tier/geometry, project, guild-clear and sticky account-deed seams. Personal
Keep and Citadel both require an account-earned union containing ANY of:
prog_legendmaker, col_reliquary_rank_5, dgn_nythraxis, dgn_ignivar, dgn_varkhul.
Read sticky earned deeds, not current item possession/Curator score. Guild Fortress
and guild Citadel both require their OWN recorded Phase 31 guild-at-clear source:
nythraxis_scourge_of_thornpeak / nythraxis_boss_arena;
ignivar_herald_of_the_last_flame / ignivar_raid_arena; or
varkhul_forgefather_of_the_last_flame / ignivar_inner_crucible, normal or heroic.
An officer's personal deed is not guild history. Tier progression and material/fee
projects still apply, with no new escalating prestige grind or later demotion.
Guild twins reuse the approved personal geometry with guild dressing. The content
manifest produces the four exact bills and source/rounding approval before activation.
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
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Content/layout family: four tier/SKU rows, KEEP_LAYOUT/CITADEL_LAYOUT and guild
   dressed twins, DungeonDefs, courtyard/tower lifts, colliders/groundHeight and ward
   shell rows. Preserve state targets: Keep/Fortress 4 rooms plus courtyard, 300 decor,
   22 plinths, 4 amenities; Citadels 5 plus courtyard/tower, 420 decor, 32 plinths,
   6 amenities; the tiers.ts visitor-cap column that 26's visitorCapFor(tier) reads
   carries Keep 20 and Citadel 24 (state.md Content numbers, fresh literal pins).
   Bills use approved fine materials plus produce, no protected inputs. Exact
   quantities/source derivation enter the CAL-UPGRADE workbook artifact and the service
   SKUs enter the CAL-SERVICE catalog (its signature is a release gate); all inputs
   remain obtainable/tradable without requiring a profession. Content author owns
   Homesteader/project trophy/source/wiki/name obligations; Homesteader rows append at
   the END of src/sim/content/deeds.ts and tests/deeds_content.test.ts re-pins
   DEED_ORDER.length by re-measuring, never by reordering.
2. Prestige predicate: a small read-only core implements the exact personal OR and
   owning-guild source allowlist above. Use account-union materialization/event refresh
   and recorded guild history, no hot-path SQL scan, forged current-membership retro
   credit or bought bypass. Both tiers share the same qualification; prior tier,
   approved project and payment still required. Record sticky qualification; later
   item loss/member departure cannot demote an owned property. Capture capacity never
   gates gameplay (D83): an exhausted or busy guild-clear recording arm never refuses
   GameServer.join, enterDungeon or a respawn; it records the bounded
   clear-not-captured gap with its operator alert, and the personal sticky-deed path is
   unaffected.
3. Final art family: courtyard open sky/daylight, tower/ramps and guild dressing use
   measured geometry, final approved reference/GLB pipeline assets and prewarmed
   scheduler clients. Three authored emitters is a ceiling under live global light
   budget, not a promise of three active LOW lights; iOS/pressure fallbacks retain
   shape, navigation, blocked placement and capacity information. Complete art
   fingerprints, asset/perf budget and desktop/compact/tablet screenshot targets.
4. Atomic upgrade/project settlement: reuse Phase 21 and 32 safe project and Phase 29
   service-owned Hall Fund paths. Preview fitting exact copies and ALL overflow;
   insufficient safe bag custody refuses before any new fee/material mutation.
   Prestige, current owner/officer, approved bill and quote guards precede spend;
   durable intent/receipt and character/housing/fund effects settle atomically.
   Contributions survive unfinished projects. Conditions met means completion, no
   artificial waiting period. Quote expiry/unknown price never falls back to a literal.
5. Steward requirements and proof: show existing accomplishment alternatives and
   account/guild status as keyed read-only requirements, current material bill and
   overflow destination confirmation using the exact English rows below (D92);
   refusals resolve through the D26 freeholdDeniedLineKey selector with the denied rows
   appended there. Reuse ux-spec family, focus/input/error states. Append the rows to
   ux-spec section 10, register the requirement/overflow scenes
   steward-requirements-met, steward-requirements-unmet, steward-guild-clear-unmet,
   steward-overflow-review and steward-overflow-none x desktop/compact/tablet (15
   variants, the 654 milestone) on the `housing-steward-store` section 11 target (the
   Steward window), and regenerate ux-key-manifest.json and ux-shot-manifest.json in
   the same
   change.
   Pin exact source alternatives with each independent positive and all-negative,
   profession-free raid access, guild-at-clear identity, sticky ownership, no paid
   bypass and real-PG cross-record/receipt races. Source/parity/content/gate tests and
   all three money gates apply to all four priced rows.

Exact English keys this phase adds (D92; 21 owns the Lodge upgrade rows it registers,
this phase adds only the prestige and overflow rows below; {destination} resolves
through the existing steward.bags/steward.vault rows):

| Key | Exact English |
| --- | --- |
| hudChrome.housing.steward.upgradeRequirements | Upgrade Requirements |
| hudChrome.housing.steward.prestigeAny | Earn any one of these on this account: |
| hudChrome.housing.steward.prestigeGuildAny | Your guild must have recorded one of these clears: |
| hudChrome.housing.steward.requirementMet | Earned |
| hudChrome.housing.steward.requirementUnmet | Not yet earned |
| hudChrome.housing.steward.requirementRowAria | {requirement}: {status} |
| hudChrome.housing.steward.prestigeTooltip | Once earned, this stays met. Losing an item, a rank or a guild member later never removes an upgrade. |
| hudChrome.housing.steward.overflowReview | {count} placed furnishings will not fit the new layout. They go to {destination}. Nothing is lost. |
| hudChrome.housing.steward.overflowNone | Everything placed fits the new layout. |
| hudChrome.housing.steward.confirmUpgrade | Confirm Upgrade |
| hudChrome.housing.denied.prestige | This tier needs an accomplishment this account has not earned yet. |
| hudChrome.housing.denied.guildClear | Your guild has not recorded a qualifying clear yet. |

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
The three money gates apply to EVERY priced action: (1) signed counsel acceptance,
published Terms and accepted economy-service contract/catalog before production enable
or housing storefront submission; (2) fail-closed live flags, default off, refusing
every NEW priced action while dark; original accepted-operation recovery
remains admitted under the recorded immutable outcome; (3) independent per-distribution use, purchase,
website-management and deed capabilities, pinned for all seven distributions. Charter
and Call checkout is browser web and website-distributed desktop only. Seeker is
use-only with deeds off. App Store, Google Play, Steam and Epic have no purchase or
deed submodel, catalog fetch, handler, hidden DOM, error or accessibility purchase
text. Website management is independently approved and defaults off on denied stores.
No housing copy on native, Steam or Epic names a token, wallet or on-chain deed.
Purchase benefits use cosmetic, convenience and access language, never earn/income/yield.
The economy service owns every price, conversion, fee, royalty, burn and split. The
game forwards opaque IDs and versioned quote fingerprints, never computes token math
or substitutes a stale quote. Durable discoverable intent precedes spend; housing
receipt authority and effects commit through the NEW 07a operation/mutation
producers, consumed by the Phase 15 purchase and Phase 37 deed adapters.
No bounded live key array provides replay authority and no lock spans service IO.
Unknown, expired or changed quotes for NEW spend require a fresh quote and
explicit confirmation; an accepted original operation recovers without a new debit.

Out of scope:
Any behavior beyond these deliverables, any invented balance rate, and any production flag enable.

PROPOSED SERVICE AUTHORIZATION AND RECOVERY CONTRACT:
Preserve literal D9: the game server receives no distribution/channel label,
country assertion or physical-client attestation. The NEW external economy-service
issuer/verifier and policy module verify an actual eligible checkout session and
current territory under signed policy; the signed acceptance names their exact
external repository/module or interface-artifact identity and conformance proof.
Account auth, Origin, user agent, client JSON, linked stores, a desktop bridge
capability and an outgoing server secret are not physical-distribution proof.
The service binds NEW checkoutAuthorization to account, purpose/kind, SKU, policy
version, accepted quote, operation and full plot/guild/custody fingerprint. The game
consumes only the opaque protected reference and service-verified allow/refusal/effect;
it never issues eligibility from headers, accepts a channel JSON field or logs/exposes
the authorization. Unknown/malformed/unverified eligibility refuses NEW spend.
The adapter authenticates the actual service response and bounds decode before
validating the complete operation/effect/fingerprint. A signed acceptance document
is not proof of runtime cryptographic validation. Malformed or nonterminal results
never grant a local effect or prove that no debit occurred; preserve the original
operation for bounded status discovery and recovery.

NEW source ownership is explicit: 07a's
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation owns
protected authorization binding, fingerprint and durable receipt authority;
server/freehold_mutation.ts::commitFreeholdMutation owns atomic local effects.
Phase 15's NEW server/freehold_purchases.ts is the initial opaque quote/status/
authorization consumer; NEW server/freehold_deed_proxy.ts is the later deed consumer
of that same verified boundary. No game geo or distribution-attestation module is
introduced. These are proposed producers, not existing exports; read prepared
phase-07a-transactional-mutation-boundary.md and its QA before implementation.

Dark flags and unknown/current eligibility refuse new paid actions, not recovery of
an already accepted original operation. Receipt/status discovery, local application
or accepted compensation use its immutable outcome and original protected binding
without a new checkout session or debit. Current local entitlement, ownership, fence
and custody guards still apply. Rejected/expired new quotes need fresh confirmation;
an accepted historical quote is not a fallback new purchase. Both service conformance
and game tests cover forged eligibility inputs, cross-binding reuse, policy/territory/
expiry changes before new spend, and accepted-operation recovery after those changes.

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
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_content.test.ts
  tests/freehold_prestige_gate.test.ts tests/freehold_build_project.test.ts
  tests/freehold_upgrade.test.ts tests/provisioner_firewall.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts
  tests/recipe_economy.test.ts tests/market_filters.test.ts tests/freehold_wards.test.ts
  tests/freehold_visiting.test.ts tests/renderer_compile_gate.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/pr_shot_targets.test.ts tests/localization_fixes.test.ts`
  (tests/freehold_visiting.test.ts is 26's suite and carries the visitor-cap pin) plus the
  tests/server/ suites the SERVER slice added; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`;
  `npm run perf:tour`; `npm run asset:budget`; `node scripts/pr_screenshots.mjs`.
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
- [ ] Four tier/geometry families match approved targets and literal pins, guild dressing reuses geometry, and every bill has exact approved source/quantity/rounding rows; tiers.ts carries the Keep 20 and Citadel 24 visitor caps with fresh literal pins and the deeds pin is re-measured by append.
- [ ] Every personal OR alternative independently admits both top tiers; no-credential refuses; owning-guild recorded clears qualify without officer substitution or fabricated retro history; ownership never demotes; capture exhaustion never refuses join, enterDungeon or respawn (D83, pinned).
- [ ] Overflow preview, custody refusal and prestige checks precede spend; real-PG atomic upgrade/Fund/receipt tests preserve exact copies and contributions without stale quote fallback.
- [ ] Final courtyard/tower art, light-budget fallback and desktop/compact/tablet requirement/overflow screenshots satisfy ux-spec and asset/perf gates; the requirement/overflow key rows and the five scenes (steward-requirements-met, steward-requirements-unmet, steward-guild-clear-unmet, steward-overflow-review, steward-overflow-none) are registered and both manifests regenerated (D92).
- [ ] All four priced actions pass money/surface/service rules, all suites/reviews and contribution gate.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 40 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-40-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
