# Phase 21: the Lodge tier and the upgrade build project

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "21 Lodge
tier and the upgrade build project"; the decisions are `state.md` Locked decisions and the approved artifact manifests (all locked D decisions; D2 makes the Lodge an in-place tier upgrade of the one record). This phase ships
the second freehold tier (2 rooms, decor budget 120, 8 plinths, 2 amenity slots, its
layout and interior), the upgrade build project (a Claudium fee SKU plus a materials bill
contributed over time), layout carry-over on completion, and the second amenity slot. It
is a money phase (the three gates apply) and a persistence phase (the record grows a
column).

## Settled delivery and acceptance contract


Complete when the full bill and confirmed fee exist, whichever arrives last. A full
material contribution may wait safely for the fee. Preflight fitting copies and overflow
before a new fee/material mutation; preview overflow, keep fitting copy IDs and provenance,
and refuse bags_full if safe bag return cannot fit. Completed effects, inventory,
fund/fee receipt and upgrade revision commit atomically. Test both payment orders,
duplicate/reordered confirmations, last-contribution versus fee races, full bags,
restart and already-completed attempts with no lost or duplicated copy.

The three money gates apply to every SKU, handler and purchase view in this file:
(1) written counsel acceptance before production enable or housing-bearing store
submission; (2) FREEHOLDS_ENABLED defaults off and refuses both dispatch arms and
removes catalog rows while dark; (3) the seven-distribution capability map permits
purchase only on browser web and website-distributed desktop. Seeker is use-only.
Published Terms and accepted economy-service contract/catalog are additional release
gates. Website management is an independent approved capability, default off on denied
storefronts. Native, Steam and Epic receive no purchase submodel, hidden DOM, fetched
catalog, handler, accessibility text or on-chain marketing. Purchase copy promises
cosmetic, convenience and access only, never earn, income or yield. The economy
service owns every price and all token math; expectedCostClaudium is only a forwarded
quote fingerprint. Illustrative USD, 3x and other working targets never compute cost.
Use the single 07a durable operation/receipt rail extended by 15: bind account, opaque
plot/guild target, operation and quote version; persist intent before spend; retry
ambiguity with the same key; apply effect and receipt atomically. No DB client or lock
spans service IO, and live key arrays are not permanent replay authority.

Before implementation decisions and again on the finished diff, dispatch
database-performance-reviewer, paired with migration-safety and privacy-security-review.
Reuse 07a's global plot ownership fence and commitFreeholdMutation seam: character FIFO before
the required shared-resource serialization, no held DB client while queueing,
07a actual touch-set ordering preserved,
lease/revision/fund/receipt refusal aborting every resource and housing write. No stale
CAS reload may erase an acknowledged transfer. Bound rows, strings, descriptor bytes,
query results and queue admission from the measured docs/freeholds/content-manifest.md; preserve
unsupported stored rows safely. One running save plus one pending dirty generation,
shared background admission and workload deadlines apply to every producer. Record the
query/index inventory (scope, predicate, order, limit, expected rows, index), reverse
FK/export/delete access, retention and largest legal fixtures. Disposable Postgres
proof must cover crash/interleave, competing realms, lease/CAS refusal, cancellation,
queue pressure, query counts and seeded plans; fake-pool assertions alone are insufficient.

Every gameplay quantity comes from state.md Content numbers or the approved docs/freeholds/content-manifest.md
and docs/freeholds/content-numbers-workbook.md. This file produces its owned exact-ID, quantity,
derivation/rounding, reference and approval rows before runtime enable. Fernando owns
gameplay calibration; the economy service owns prices/currency allowance. Measurements
come from approved room/model bounds. Missing measurements or signatures are concrete
artifact/release gates, never permission to invent a balance literal or reopen a choice.
All material inputs remain obtainable or tradable without requiring a profession;
Perfecting keystones, gear intermediates and quickening catalysts remain excluded.

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

1. Lodge tier, measured layout and final content/art obligations.
2. Approved upgrade bill and versioned service fee contract.
3. Atomic upgrade/contribution/completion and exact-copy carry-over.
4. Durable receipt/persistence and public progress projection.
5. Steward preview/progress UX and custody/parity evidence.

## Shared authority and persistence dependency

This file extends the single producer from 07a, not a second account or guild payment
system: NEW server/freehold_mutation.ts::commitFreeholdMutation and
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation own
durable intent, applied identities, global claim fencing and atomic effects. Phase 15
adds service quote/receipt fields to those rows; later files consume them. No separate
guild/account receipt journal, ordinary-arrival receipt, writer queue or recovery loop.
Extend 07a's reviewed actual touch-set manifest with this file's exact participants.
Preserve explicit character pre-lock before nonce fencing, bank-ledger classification
before guild replay, and the actual market/mail, storage advisory/receipt, custody,
FK/unique/deferred-trigger ordering of every carried legacy effect. Never substitute
a generic accounts/characters/guilds/receipts lock hierarchy. No client is held while
joining serialization; no lock/client spans service IO. Reuse admitted cancellation-
aware work and retain original operation identity across crash/timeout/eligibility change.

07 owns capability-aware save/export/deactivation/restore preservation; 07b owns
account lifecycle and immutable protection history. Unsupported/oversized/unknown
source rows remain original and read-only with a bounded diagnostic/reference; do not
reset them to empty history, a free Inn or fresh grace. Character delete preserves
account records; soft deactivation/restore, authorized hard deletion and export remain
distinct. Follow the minimum-capable-release/rollout artifact; old binaries merely
leaving normalized rows untouched do not prove compatible save or lifecycle behavior.
Rollback quiesces new mutations while preserving accepted recovery identities.

Paired QA must cover the actual legacy transaction participants, lease/CAS/nonce
failure, pending/replayed operations, concurrent accounts/alts/realms, partial failure,
oversized/unknown version preservation and minimum-capable rollout/rollback fixtures.
Database, persistence and security reviewers inspect these exact before/final diffs.

## Existing lifecycle, upkeep history and finality contract

Consume 07b's single lifecycle owner and 13/13a's single upkeep-calendar owner.
NEW server/freehold_lifecycle_db.ts::loadFreeholdLifecycleProtectionPage provides the
committed immutable protection source, and createFreeholdLifecycleCoordinator captures
authenticated observation time before queueing. Derive a return before presence
advances; stale observations, fenced sessions and replay cannot mint grace. The
lifecycle-policy-binding artifact (accepted or still a named release gate) names
lifecyclePolicyId, sourceCalendarId and resetPolicyId; serving realm, browser zone or
guessed UTC cannot rebind history.
13a owns server/freehold_db.ts::applyFreeholdUpkeepCalendar/loadFreeholdUpkeepCalendar
and server/freehold_upkeep_ingress.ts::createFreeholdUpkeepIngress. No duplicate guild
or account calendar ingress, source-history array on plots, polling job or receipt store.

Every plot/checkpoint/immutable bill and prepaid credit retains original calendarId,
schemaVersion, resetPolicyId and committed lifecycle/authority/finalized-prefix identity.
Union overlapping lifecycle absence/grace and service suspension ranges exactly;
never add independent totals or use only latest grace for a dormant plot. Historical
condition/checkpoint changes, bill classification and credit consumption/carry require
irrevocably finalized source facts. Covered but mutable tails support read-only preview
only. Missing history, unknown binding or time beyond coverage is explicit not-ready,
never zero outage. A future-credit purchase uses an accepted published schedule without
requiring future time to be finalized; its later consumption requires final history.

Recheck lifecycle and compatible calendar-head FOR SHARE guards inside 07a's reviewed
composition hook through commit. The calendar-only writer takes FOR UPDATE and never
account/plot/receipt locks; loaders release reads before writer queues. Retain exact
indexed history/prefix facts with bounded probes across multi-year absence/open outage,
not per-day/week loops, lifetime loads or foreign-plot rewrites. Keep source history
until lossless dependency-aware rebase proves dormant plots/credits/recovery safe.
Current-generation revision/digest/watermark install and exact current/superseded/
conflict/pending ACK semantics belong only to 13a. An older response cannot replace a
newer projection or claim readiness. Owner/public builders allowlist safe fields and
reject operator-evidence, secret and private-diagnostic sentinels even on owner wire.

Paired QA verifies repeated absence/return cycles, overlapping protection, original
calendar across realm/zone change, open multi-year suspension, missing versus empty
coverage, unfinalized history refusal, future-credit purchase, credit carry, stale
process install and restart/rollout. UI may show a keyed pending state while existing
entry/build/undo remain available; durable payment retains original operation recovery.

## Literal D9 and original-operation money authority

The game server and Sim remain ignorant of physical distribution. The future economy
service owns eligibility verification and opaque authorization bound to account,
purpose/SKU, policy, quote and operation, with issuer/verifier conformance in the
service artifact (accepted or still a named release gate). A first-party web checkout
session alone is insufficient.
Client channel labels, Origin, UA, arbitrary JSON, linked Steam/Epic accounts and the
game-service secret never prove eligibility; do not add a trusted channel field to the
game server. The client capability map controls presentation, not purchase authority.
Unknown eligibility refuses NEW spend. Already accepted payments recover under their
original operation after session/authorization expiry or eligibility change.

Use the service response protocol specified in 15: authenticated bounded decoding,
complete original operation/fingerprint/target/effect validation and terminal-state
classification. A malformed/nonterminal reply is neither a grant nor proof of no
debit. Written signed acceptance is not runtime cryptographic verification. The 07
developer fixture cannot mint a paid receipt or satisfy online service authorization.
Keep all three money gates: counsel before enable/store submission, default-off
FREEHOLDS_ENABLED on both dispatch arms/catalog, and the seven-distribution surface map.
Published Terms, accepted service catalog/contract and issuer/verifier evidence remain
release gates; the final legal-team handoff in 44b does not postpone these earlier gates.
The economy service owns every price and all token math; expectedCostClaudium is only
the forwarded literal quote fingerprint. Test false client claims, unknown eligibility,
malformed/ambiguous replies and successful original-operation recovery on both arms.

## Arrival consumer dependency

Use the 07c account-wide normalized arrival-tier owner, not a plot-local seen set.
NEW server/freehold_arrival_db.ts::markFreeholdArrivalTierOnClient is the conflict-safe
insert inside 07a's accepted-owner-entry; only its committed insert winner gets fresh
first-tier eligibility. 08a's private result separates historical firstTierAtAdmission
from nullable freshArrivalPresentation carrying acceptedTransitionId, playWelcomeCue
and firstTierViewEligible. Confirmed dungeonEntrySeq and destination plot match before
the camera/audio consumer acts. Each new accepted arrival may welcome; snapshots,
resume and replay carry null and never restart sound/camera. Commit-before-ACK may
skip presentation, so do not claim exactly-once visible delivery. Visitors create no
account tier mark; no permanent receipt is added for routine arrivals. A new tier,
Fenbridge entry or second account session reuses this same authority and safe handback.
Pair tests cover two accounts, same-account alts/concurrent realms, returning tier,
guest, rejected entry, commit-before-ACK and reconnect. Asset/view execution is Codex.

## Canonical upgrade projection

The existing myFreehold.upgrade projection carries approved project progress and the
committed 07a operation reference; no sibling myUpgradeProject facet is introduced.
The strict fhold decoder and existing housing facet expose the same optional upgrade
shape on online, offline and headless adapters. Extend literal world_api parity keys
and both-world fixtures; assert unchanged facet membership, pre-project absence,
partial bill, fee-first, bill-first and completed revision projection with no receipt
or private source leakage. Owner progress uses this one world projection on every host.

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
This is Phase 21 of the Freeholds and Guildhalls feature: the Lodge tier and the upgrade
build project (the tier record and layout, the fee SKU plus the materials bill, the
contribute command with a progress record, layout carry-over, the second amenity slot).

Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four independent slices over known seams).

Goal: let a Cottage owner upgrade in place to a Lodge by paying a Claudium fee once and
contributing a bill of gather-tier-3 node fine materials and separately sourced tier-4 crop produce over time, with the
Cottage layout carried over, the upgrade applied exactly once, and no keystone, gear
intermediate, or catalyst anywhere in the bill.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Gotcha scan (Codex carries no Claude memory): docs/freeholds/state.md "Gotchas (read
  before the matching phase)" entries on the monolith ratchet, world_api parity pins,
  test-pin traps (literal pins, never self-comparison), the provisioner firewall, the
  storage-charter exactly-once model, Postgres additive DDL.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "21 Lodge tier and the
  upgrade build project"), docs/prd/woc/freehold-service-contract.md, and this file
- src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts, ledger_schedule.ts,
  layouts.ts (INN_ROOM_LAYOUT and COTTAGE_LAYOUT with their lift functions, D23);
  src/sim/dungeon_layout.ts (DAWNHOLD_LAYOUT,
  layoutColliders, DUNGEON_WALL_HW); src/sim/rift/authored.ts (AuthoredRoom, roomAt,
  inAnyRoom, authoredColliders); the six Cottage touch points (the interior union in
  src/sim/types.ts, the groundHeight arm in src/sim/world.ts, STATIC_INTERIOR_COLLIDERS
  in src/sim/colliders.ts, the variant in src/render/dungeon.ts, the dressing under
  src/render/freehold/, the DungeonDef)
- src/sim/freehold/ (types.ts, state.ts, instance.ts, layout_core.ts, placement.ts,
  grant.ts, ledger.ts, condition_core.ts, index.ts, CLAUDE.md) and src/sim/sim_context.ts
- src/sim/professions/reagent_sources.ts (planReagentSourceDraw, countMinusPlanned),
  src/sim/professions/material_grades.ts (materialGradeIds), src/sim/material_ids.ts,
  src/sim/content/farm_crops.ts (tier-4 produce IDs and fineProduceItemId rows, separate from node material grades), the gather-tier-3 node fine
  material ids in src/sim/content/items.ts (overflow returns to verified bag capacity)
- server/claudium.ts (the kind === 'freehold' branch and the store filter),
  server/claudium_proxy.ts, server/freehold_wire.ts, server/freehold_db.ts
  (FREEHOLD_SCHEMA, freeholdForAccount, upsertFreehold), server/heavy_self.ts,
  server/economy_telemetry.ts
- src/world_api/housing.ts, src/world_api.ts (COMMAND_NAMES, COMMAND_FACETS),
  tests/world_api_parity.test.ts (the five edit sites), src/net/online.ts (the housing
  one-liners), src/net/freehold_snapshot_wire.ts, tests/helpers/bare_client.ts
- tests/freehold_content.test.ts, tests/freehold_layout_core.test.ts,
  tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/provisioner_firewall.test.ts (PERFECTING_MATERIAL_IDS, GEAR_INTERMEDIATE_WORDS),
  tests/monolith_budget.test.ts, tests/parity/trace.ts (META_EXCLUDE)
- src/sim/content/deeds.ts (the Homesteader rows), src/ui/i18n.catalog/hud_chrome.ts
  (hudChrome.housing.*), src/ui/hud/housing/steward_panel_view.ts and
  steward_panel_window.ts, tests/steward_panel_view.test.ts,
  tests/steward_panel_window.test.ts, scripts/lib/pr_shot_housing.mjs (the
  housing-steward-store target and its scene list), docs/freeholds/ux-spec.md section 5
  (the Steward upgrade subsection) and section 11 (the registry)
- Root CLAUDE.md "Modularity" and "Invariants"
The agent returns: the tier record shape and the frozen ids; the exact Cottage edits at
each of the six interior touch points as the template for the Lodge; the Phase 15 grant
function signature, the spend branch shape, and the store filter allowlist call; the
layout_core validators the carry-over can reuse; the bill-eligible id list (gather-tier-3 node fine material IDs, separately sourced tier-4 produce/fineProduceItemId rows) and the excluded ids; the
account_freeholds stable-plot column list, the normalize arm, and the rev upsert; the extraction
candidates in sim.ts, game.ts, and online.ts that pay for the new lines; the Steward
panel rows a progress record would extend and the steward-* scene list the upgrade
scenes append to.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files (they touch disjoint files except the shared pin files the coordinator edits last:
tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts,
src/world_api.ts, the parity goldens):
- Agent CONTENT-LAYOUT: the `lodge` row in src/sim/content/freehold/tiers.ts (rooms 2,
  decor budget 120, plinths 8, amenity slots 2, upkeep flag; deep-frozen; the id is a
  frozen save key), `freehold_lodge` DungeonDef appended at the verified next free index in dungeons.ts (record the index in the implementation ledger) (spawns [],
  guideVisible false, absent from FINDER_ACTIVITIES, claimKey 'owner'), LODGE_LAYOUT
  beside COTTAGE_LAYOUT in src/sim/content/freehold/layouts.ts (D23) with rooms, doors, decor with measured r, eight plinth anchors,
  two amenity anchors, the hearth anchor, its lift function, and the six touch points;
  the Lodge's first room reuses COTTAGE_LAYOUT's cell grid, door position, plinth anchor
  ids 1 to 4 and amenity anchor 1 verbatim and the second room adds plinths 5 to 8 and
  amenity anchor 2, so carry-over is identity-preserving (the same-manifest-rule preview
  premise D80 states for transfers; tests/freehold_layout_core.test.ts pins the Cottage
  anchors as a verbatim subset of the Lodge anchors);
  the render variant and dressing under src/render/freehold/ built through
  attachSceneGroupGated; the "first Lodge" Homesteader deed row appended at the END of
  src/sim/content/deeds.ts; `npm run wiki:content` plus any guide.* key; the layout
  derivation test and the tests/renderer_compile_gate.test.ts arm.
- Agent SIM: src/sim/content/freehold/upgrade_projects.ts (UPGRADE_PROJECTS: id
  `upgrade_lodge`, fromTier cottage, toTier lodge, feeSkuId `freehold_upgrade_lodge`,
  bill legs of gather-tier-3 node fine materials and separately sourced tier-4 crop produce with explicit gradeIds;
  integer item-unit counts per leg from this file's approved numeric provenance worksheet
  (D33 and D89: stackSize never enters a bill); deep-frozen, no price, no copy) and the SKU row in
  charters.ts (tier-upgrade kind, no price) so the Phase 15 allowlist covers it;
  src/sim/freehold/upgrade.ts: the `contribute_upgrade` command (owner only, never
  condition-locked per D22, one batch, with an explicit source-mode argument per D37 and
  D89: `bags` consumes the named bag slot through the item_copy_ref tri-state and never
  touches the vault; `vault` plans the leg through planReagentSourceDraw against the
  owner's vault, authorized only inside the owner's own claim under D18/D47, and any other
  instance band refuses through the existing vault_craft_gate arm with nothing deducted;
  no automatic fallback between modes, and affordability, confirmation and the atomic
  deduction use the same mode; a progress record on FreeholdState
  `upgrade: { projectId, contributed, feePurchaseKey }`), completion after either confirmed final leg when the full bill and fee receipt are present (the tier flips through the
  src/sim/freehold/state.ts setter D24 names, plinths and amenity slots widen, the
  descriptor re-emits), `layout_core.carryOverLayout(rows, from, to)` (pure:
  keep every row that still validates in the new rooms, list the rest; every placed
  furnishing and plinth trophy that validates stays at its identical cell or anchor), the
  overflow returned to bags or the completing leg refused `bags_full` with nothing
  mutated (locked bags-only overflow policy; no mail custody subsystem); the re-attempt
  path (D89): when the confirmed fee is the last leg and bags cannot take the overflow,
  the refusal keeps the fee receipt under its original 07a operation identity and the
  project pending, and completion re-runs the overflow preflight without a second fee,
  both by 07a recovery at the owner's next accepted entry and on demand through the
  `complete` arm of the same `contribute_upgrade` command (no slot, no count, no
  materials); text-free freeholdDenied reasons (`upgrade_no_project`,
  `upgrade_fee_due`; `bags_full` and `not_owner` pre-exist from Phase 08, so only the
  two upgrade reasons and their denied.* rows are new here) and freeholdGranted
  `upgrade_complete`,
  the new reasons appended to freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts over hudChrome.housing.denied.* (D26, never a second
  selector); the facet members `contributeUpgrade(slot, count, source)` (source is
  `'bags' | 'vault'`) and `finishUpgrade()` (the `complete` arm of the same wire
  command), and the progress read exclusively through existing `myFreehold.upgrade`,
  the Sim delegate paid
  by an extraction; the `lodge` arm on the Phase 05 `/dev freehold` command (D24, D81);
  tests/freehold_upgrade.test.ts.
- Agent SERVER: src/sim/freehold/grant.ts `freeholdGrantUpgradeFee(ctx, ownerKey, skuId,
  purchaseKey, { dryRun })` (server-only, never on COMMAND_NAMES, the immutable 07a operation reference projected
  on the record; that projection is not the durable replay authority), the SKU dispatch inside the Phase 15 kind === 'freehold'
  branch (dry run before the spend, apply after a definitive result, flag dark refuses,
  the store filter drops the SKU while dark), the `contribute_upgrade` case in
  server/freehold_wire.ts with the label only in game.ts (paid by an extraction),
  HEAVY_SELF_CMDS row, the `upgrade JSONB` column on account_freeholds through
  `ADD COLUMN IF NOT EXISTS` with a jsonb_typeof CHECK, normalize and serialize arms
  (a pre-column row loads with no project), the export row, the fhold key carrying the
  progress with the strict decode extended (closed allowlist with AssertNever), the
  docs/prd/woc/freehold-service-contract.md row for the new SKU (handoff-ready;
  acceptance status recorded as an unsigned release gate unless a signature artifact is
  on file); tests/server/freehold_gates.test.ts and
  tests/server/freehold_db.test.ts extended, the pg-armed twin.
- Agent STEWARD-UX: the upgrade section of the existing Steward window
  (steward_panel_view.ts pure core plus its painter and steward_panel_window.ts, the
  same PlantSheetWindow family, never a new window): the bill preview per leg through
  steward.haveNeed, the fee status, the source-mode radios reusing steward.bagsOnly and
  steward.vaultOnly (the existing steward-vault-unavailable state when the vault arm is
  not authorized here), the Contribute and Finish Upgrade actions, the overflow preview,
  completion and every denied line through freeholdDeniedLineKey; NEW keys with this
  exact English (D92: title case for the tab and buttons, sentence case for status,
  description and aria): hudChrome.housing.steward.upgradeTab "Upgrade",
  hudChrome.housing.steward.upgradeTitle "Upgrade to Lodge",
  hudChrome.housing.steward.upgradeIntro "Contribute the materials below and pay the
  upgrade fee once, in either order. Nothing is spent until you confirm.",
  hudChrome.housing.steward.upgradeNoProject "No upgrade is in progress.",
  hudChrome.housing.steward.upgradeFeePaid "Upgrade fee paid.",
  hudChrome.housing.steward.upgradeFeeDue "Upgrade fee not yet paid.",
  hudChrome.housing.steward.upgradeReady "Everything is in. Finish the upgrade when
  your bags have room for anything that will not fit.",
  hudChrome.housing.steward.upgradeOverflow "Placed items that will return to your
  bags: {count}", hudChrome.housing.steward.upgradeContribute "Contribute",
  hudChrome.housing.steward.upgradeFinish "Finish Upgrade",
  hudChrome.housing.steward.upgradeRowAria "Upgrade material {item}: {have} of {need}
  contributed", hudChrome.housing.granted.upgradeComplete "Your home is now a Lodge.",
  hudChrome.housing.denied.upgradeNoProject "There is no upgrade to finish.",
  hudChrome.housing.denied.upgradeFeeDue "Pay the upgrade fee before finishing the
  upgrade."; pending reuses common.pending and full bags reuse denied.bagsFull; the
  shot scenes steward-upgrade-preview, steward-upgrade-partial, steward-upgrade-fee-due,
  steward-upgrade-ready, steward-upgrade-bags-full and steward-upgrade-complete appended
  to the housing-steward-store target's scene list in scripts/lib/pr_shot_housing.mjs
  and ux-spec section 11 (desktop, compact and tablet at LOW through the target's real
  capture; required after-shots); tests/steward_panel_view.test.ts and
  tests/steward_panel_window.test.ts extended.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the upgrade draws no Rng; no wall clock in src/sim/; carry-over is a
  pure function of the two layouts and the rows.
- Calendar (D84): every has-the-day-rolled-over fact the upgrade touches (the first
  ledger week the completed tier quotes, prepay coverage) reads the realm day resetDay
  through 13a's calendar; the progress record's completion stamp is a utcDay of when it
  happened; epoch-ms fields are display-only.
- Ledger and credits across the upgrade (D35, restated by 25a): the weekly schedule is
  a realm-week table independent of tier (03; workbook E forbids inventing a middle-tier
  curve), so completion changes no ledger quantity, and the current immutable bill and
  every prepaid credit keep their identity and price.
- One sim, three hosts: offline the Lodge exists only through `/dev freehold lodge`,
  which EXTENDS the Phase 05 `/dev freehold` command with a `lodge` arm (D24, D81), under
  ALLOW_DEV_COMMANDS=1 and in tests (D3); the RL exclusion pin stays green.
- Server authority: the fee lands only as a server-applied grant after the economy
  service confirms; the client predicts nothing and mirrors the progress record.
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (tracked signed-counsel release gate); (2) the fail-closed flag defaulting off refuses the SKU at the spend branch
  and drops it from the store filter, pinned; (3) the per-distribution surface map
  pinned by tests keeps the upgrade purchase surface off every native, Steam, and Epic
  build. The economy service owns prices and token math: the game forwards
  expectedCostClaudium as a fingerprint and never computes a peg, a burn, or a split.
- Token firewall (the state.md scope): no on-chain vocabulary in src/sim/ (wallet, token,
  $WOC, mint, holder, marketplace, on-chain, Solana, the on-chain Freehold Charter deed);
  the Book of Deeds is game content, never firewall vocabulary.
- Never a Perfecting keystone (wyrmfall_core, sundered_essence, makers_ember), a gear
  intermediate, or the quickening catalyst in the bill; recipes and their stationType
  gates unchanged; zero new farm beds.
- Never destroy: carry-over returns or refuses, never drops a furnishing or trophy; the
  owner's actually eligible Inn Room trophy displays carry into the Lodge as they did into the Cottage.
- Persistence: additive idempotent DDL only, JSONB back-compat for every older row, a
  save/load round trip (fake pool plus the pg-armed twin), keep-forever stays stated.
- i18n: the policy in docs/freeholds/implementation-plan.md; the tier name, the deed
  text, and every Steward line are English t() keys; the sim emits text-free ids (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; every
  delegate, case label, or mirror line is paid by an extraction and a lowered ceiling.
- Working numbers (2 rooms, 120, 8, 2, the illustrative $25 plus materials) are
  state.md values; the economy service and Fernando own the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any furnishing beyond the MVP set, patterns on the R8 channels (Phase 22), new trophy
  families (Phase 23), the garden (Phase 24), surface snapping (Phase 25), twelve-week
  prepay (Phase 25a), open-house policies (Phase 26).
- Guild tiers, the Great Hall, Manor, or Bastion (Phases 28 to 32).
- A gold rail for the fee; any price, burn share, or settlement math in the game.


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_content.test.ts
  tests/freehold_upgrade.test.ts tests/freehold_layout_core.test.ts
  tests/freehold_determinism.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/provisioner_firewall.test.ts
  tests/recipe_economy.test.ts tests/market_filters.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_gates.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_wire.test.ts
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts
  tests/localization_fixes.test.ts tests/renderer_compile_gate.test.ts
  tests/dungeons.test.ts tests/steward_panel_view.test.ts
  tests/steward_panel_window.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; the pg-armed twin with TEST_DATABASE_URL set after
  `npm run db:up`; parity goldens regenerated with UPDATE_PARITY=1 in their own commit if
  a sampled field or emit changed.
- Required reviewers: content-obligations-reviewer, architecture-reviewer, privacy-security-review, migration-safety, database-performance-reviewer, cross-platform-sync, render-performance-reviewer, frontend-seam-reviewer, server-hot-path-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Lodge tier, its layout, and the upgrade project bill
- feat(sim): add the upgrade contribution command, its source modes, and layout carry-over
- feat(server): grant the Lodge upgrade fee through the freehold spend kind
- feat(ui): add the Steward upgrade section with its keyed states and captures
- test(sim): pin the upgrade bill keystone exclusion and exactly-once completion
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_content.test.ts pins the lodge row by fresh literals (2, 120, 8, 2)
  and the upgrade bill ids; tests/provisioner_firewall.test.ts sweeps the bill and finds
  no keystone, gear intermediate, or catalyst.
- [ ] tests/freehold_upgrade.test.ts proves: a partial contribution records progress and
  mutates nothing else; a full material bill without the fee receipt persists safely and waits for the fee;
  the later confirmed fee completes immediately; replaying the fee purchase key grants once; a second completion
  attempt refuses `upgrade_no_project`; every placed Cottage furnishing that fits is in
  the Lodge layout and the rest are back in bags (or refused `bags_full` with nothing
  mutated); the same seed gives the same Lodge on both hosts; the D89 negatives: a
  `bags` contribution never draws the vault even when bags run short, and a `vault`
  contribution issued outside the owner's own claim refuses with nothing deducted and
  the project unchanged; the re-attempt: a fee confirmed while bags are full mutates
  nothing, keeps the project pending with its fee receipt, and after freeing bags
  `finishUpgrade()` completes exactly once with one receipt after two calls and no
  second fee; a prepaid week and the current immutable bill survive completion
  unchanged (D35) and the first unquoted week after completion quotes the same
  realm-week schedule; the bill pins integer item units and never reads stackSize.
- [ ] tests/freehold_layout_core.test.ts pins COTTAGE_LAYOUT's cell grid, door, plinth
  anchors 1 to 4 and amenity anchor 1 as a verbatim subset of LODGE_LAYOUT by fresh
  literals, and a fully furnished Cottage carries with zero overflow.
- [ ] tests/steward_panel_view.test.ts pins the upgrade section's keyed states (no
  project, partial, fee due, ready, bags full, complete) by the exact English above with
  no singular or invented key; the six steward-upgrade-* scenes exist in the registry
  and their after-shots are on file.
- [ ] tests/server/freehold_gates.test.ts covers the upgrade SKU on both dispatch arms:
  unknown SKU refused, price drift refused, replay grants once, flag dark refuses and
  the store filter hides the SKU; the server-side re-attempt: a fee confirmed against
  full bags stays pending under its 07a operation identity with nothing mutated, and
  the owner's next accepted entry completes exactly once through 07a recovery with one
  receipt and no second fee.
- [ ] tests/server/freehold_db.test.ts round-trips the upgrade column and loads a
  pre-column row with no project (fake pool and the pg-armed twin).
- [ ] The Lodge renders on proximity with its light rig inside the point-light budget;
  tests/renderer_compile_gate.test.ts has the arm; tests/dungeons.test.ts is unchanged.
- [ ] All STEP 3 suites green; every triggered reviewer reports no remaining finding; touched coordinator ceilings never rise and successful extractions lower their pins.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 21, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 21: new files, IWorld members, the
  command and its source modes, the SKU, the column, i18n keys; the tier table's Lodge
  row; the carry-over overflow decision; any locked decision); regenerate
  docs/freeholds/ux-key-manifest.json and ux-shot-manifest.json and update the cited
  counts in state.md "UX verification inventories" (D92).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-21-qa.md

STOPPING RULES:
- Stop and ask if the economy service catalog cannot carry a tier-upgrade SKU under kind
  freehold without a service-side change (record the unmet service-contract acceptance gate; implement and test the accepted draft in the fake-service harness).
- Stop if carry-over would have to drop a furnishing or trophy to complete (never
  destroy is a non-negotiable; the answer is refuse or return, and the refusal must be
  the choice recorded in state.md).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
