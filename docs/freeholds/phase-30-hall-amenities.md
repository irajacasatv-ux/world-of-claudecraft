# Phase 30: guild chest, feast table and shared stations

Wave C. This implementation file and its paired QA own only the deliverables
below. The locked decisions, content numbers, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md are authoritative. Every
acceptance row applies to the paired QA; nothing is built by this planning packet.

## Deliverables (at most five):

1. Guild-bank-only chest with service-specific authorization and condition/proximity gates.
2. Existing feast object at the authored long table with unchanged Well Fed behavior.
3. Hall-member station predicate and crafting from each member's own Materials Vault.
4. Final amenity art/anchors and shared HUD interaction/permission evidence.

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
accepted lifecycle-policy-binding artifact names lifecyclePolicyId, sourceCalendarId
and resetPolicyId; serving realm, browser zone or guessed UTC cannot rebind history.
Every day-rolled-over fact uses the realm day resetDay the server produces through
resetDayKey(ms, REALM_RESET_TIME_ZONE) and the Tuesday anchor emberWeekAnchorOf;
epoch-ms fields are display-only (D84).
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

## Exact screenshot integration contract

This file appends its own functional descriptor to the shared housing target family
09 introduced and 11/16/17/18 extended (scripts/lib/pr_shot_housing.mjs; housingVariants,
housingVisualWhen, housingViews and the supplied beforeLoad exactly as ux-spec.md
section 11 defines them). No new screenshot runner or multi-image capture API is
introduced; the registry has one image per uniquely keyed variant. This file adds the
38 variants below (ten scenes at three views, plus reduced motion and keyboard at three
views and touch at the two mobile views) and regenerates ux-shot-manifest.json in the
same change with every cited count updated (D92); the wave C close (33) verifies the
union. Guest scenes stage a non-member admitted under the public visit policy (D77).
These are derived inventory counts, not gameplay or tuning values.

```js
{
  key: 'housing-hall-amenities',
  label: 'Guild chest, long table and hall stations',
  when: [
    ...housingVisualWhen,
    'src/sim/freehold/amenities.ts',
    'src/sim/freehold/permissions.ts',
    'src/sim/professions/stations.ts',
    'src/ui/bank_window.ts',
    'src/ui/guild_bank_window.ts',
  ],
  variants: [
    ...housingVariants([
      'hall-chest-leader', 'hall-chest-officer', 'hall-chest-member',
      'hall-chest-guest', 'hall-chest-locked', 'hall-station-member',
      'hall-station-guest', 'hall-station-locked', 'hall-feast-table',
      'hall-feast-active',
    ]),
    ...housingVariants(['hall-chest-member'], { motion: 'reduce' }),
    ...housingVariants(['hall-chest-officer'], { input: 'keyboard' }),
    ...housingVariants(['hall-station-member'], { input: 'touch',
      views: housingViews.filter((view) => view.mobile) }),
  ],
  capture: captureHousingHallAmenities,
},
```

Every captureHousing* stages exactly variant.scene through its real UI/authority
fixture, asserts the matching state and returns one optional-clip result. Missing
required after-state throws. hall-chest-locked and hall-station-locked stage condition
29; hall-chest-member asserts that only the Guild tab of the bank window exists. No
callback side shot or sequence-to-last-state substitute.

### Starter Prompt
```
This is Phase 30 of Freeholds and Guildhalls: guild chest, feast table and shared stations.
Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md working-style capability block;
this prompt names no model. Parallelize bounded owners, integrate and verify centrally.

Goal: implement exactly the settled deliverables and acceptance below with no guessed
decision, unsupported number, unresolved finding or unreviewed fix.

STEP 0 - PRE-FLIGHT:
- Use the packet worktree and wave C branch recorded in state.md. Run git status
  --short; if dirty, stop and ask before edits. Preserve unrelated work.
- git fetch origin --prune, then sync per state.md "Worktree, base, and merge-forward":
  merge the newest origin/release/**. Run release-merge-audit after a nonempty
  merge and pnpm install --frozen-lockfile if patches/ moved. Never use main.
- Read root and applicable local CLAUDE.md in full. In place of a Claude memory scan
  (Codex has no MEMORY.md) read state.md "Gotchas (read before the matching phase)":
  the test-pin traps, the apply-ALL-findings rule and the review-the-review-fix-round
  rule recorded there.

STEP 1 - LOAD CONTEXT THROUGH AGENTS:
Have a reader summarize this file, its QA, state.md locked decisions and content numbers,
progress.md row 30, implementation-plan.md reviewer matrix, qa-checklist.md, ux-spec.md,
content-manifest.md, content-numbers-workbook.md and art-brief.md. Do not read planning
coordinators directly. The reader verifies current source anchors below and returns a
promised-versus-live table, exact prior module contracts and proposed own-file changes.
Record any changed tree fact in state.md before editing dependent feature files.

Earlier planned modules: src/sim/freehold/amenities.ts, permissions.ts and instance.ts,
src/sim/content/freehold/layouts.ts (MEETING_HALL_LAYOUT), src/render/freehold/ and
src/ui/hud/housing/. Existing sources: src/sim/bank.ts, src/sim/guild_bank.ts,
src/sim/professions/stations.ts, mobile_station.ts and crafting.ts,
src/sim/vault_craft_gate.ts, src/sim/professions/feast.ts and feast_placement.ts,
src/game/nearby_interaction.ts, src/ui/guild_bank_window.ts,
src/ui/hud/professions/feast_title.ts and tests/entity_display_name.test.ts.
NEW planned helper freeholdGuildChestSatisfies and hallSharedStationSatisfies extend
the existing feature module, never the coordinator or private party predicate.

Before implementation decisions, dispatch database-performance-reviewer with the query,
stored-shape and workload proposal when those surfaces apply; pair persistence/security.
Reuse the named settled rules. Missing measurements/signatures are owned artifact gates,
never a request to let an implementer choose a new balance value.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - EXECUTE WITH EXPLICIT OWNERSHIP:
- SIM owner: spawn guild chest and long-table amenity objects into the hall claim's
  objectIds so leaving/freeing the claim tears them down. Chest authorizes guild bank
  operations only for current members at the measured chest, condition 30 or above.
  Do not widen nearBanker into personal bank/direct Materials Vault access, and do not
  create a new storage container. A rank's existing guild bank permissions remain in
  force; geometry is not authorization. Recheck membership at every operation.
  Guild members are always admitted; a non-member enters only as a guest under the
  public visit policy (set by the leader or an officer; guild, public and private are
  the only values for the guild owner kind, friends is refused) and stays subject to
  D51 ejection (D77). A guest is refused at the chest and the stations with the keyed
  reasons below. The direct Materials Vault chest is a Manor unlock per D47; no hall
  tier adds a personal-vault chest. NEW keys this file adds with exact English
  (ux-spec carries the rows; ux-key-manifest.json regenerates in this change with
  every cited count updated, D92): guild.chestMembersOnly = "Only guild members can
  use the guild chest."; guild.stationMembersOnly = "Only guild members can use the
  hall's stations."; guild.amenitiesPaused = "Hall amenities are paused until the
  hall's condition is restored.".
- STATION owner: implement hallSharedStationSatisfies over the actual built station,
  current member, claim roster and proximity. It composes into crafting admission and
  the HUD inRangeStationTypes result from the same predicate; never call the private
  partySharedStationFor. The hall station reaches the HUD in-range set through the
  station-list channel: 12's freeholdStationsFor is extended to admitted hall members
  via the claim roster (the stations argument of inRangeStationTypes), never the mst
  mobile-station scalar. A member at a permitted hall station may draw from their own
  personal Materials Vault through D18 and the existing source planner. No shared fund,
  another member's vault or direct vault chest is implied. Nonmember, remote party
  member, wrong type, missing station and condition below 30 refuse. Training and
  resolveTrain/isAtAnyStation retain their town gates and all recipe rules.
- FEAST/CLIENT owner: interacting with the long table issues the existing place_feast
  command for the interacting member (their own party feast item from bags; existing
  one-active-per-owner and expiry rules), spawning at the member's position through
  feastPlacementHeight; place_feast carries no item id and never places an apex
  feast, so the three apex role feasts are used from bags through the ordinary `use`
  command while the member stands at the table (no table arm is added) and share
  placeFeastAction. Existing Well Fed only; no table-proximity
  gate, anchor snap, automatic aura, housing-specific power or new duration/yield/buff
  number. The chest interact opens the shared bank window (src/ui/bank_window.ts) with
  only the Guild tab present: the personal and vault panes are absent, not disabled,
  and no personal or vault command is sendable from that opener (pinned by
  NEW tests/guild_chest_opener.test.ts, produced here); the client gate mirrors
  freeholdGuildChestSatisfies (12's Strongbox opener composes the inverse).
  The station interact opens the existing crafting flow. Every interact uses measured
  sim distance through the shared press funnel. Final models, measured anchors,
  entity/title-map keys, originality, wiki and scheduler prewarm land together.
- Coordinator verifies the rank matrix, raw online command admission, held-item/fund
  isolation, shared IWorld parity and claim teardown. Four boards are owned by 30a;
  project vendors and direct Materials Vault chest are owned by 32a.

INVARIANTS AND CLOSED ACCEPTANCE CONTRACT:
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

Every new logic block is a small module behind existing SimContext/IWorld/PainterHost/
renderer seams. Render/UI consume IWorld only; both Sim and ClientWorld implement the
facet and headless keeps the housing exclusion/no-op contract. No DOM/Three in sim,
no wall clock or Math.random there; host calendar inputs preserve clock domains.
Re-find monolith ceilings rather than quoting stale slack; never raise one, pay thin
delegates with safe extraction and lower the ceiling. Every changed content record
carries its same-change obligations and naming originality. No generated artifact or
locale overlay is hand-edited; canonical M16 exception remains applicable. No em dash,
en dash, emoji or forbidden purchase vocabulary. No shipped stand-in counts as final art.

STEP 3 - VALIDATION AND REVIEW:
- npx tsc --noEmit, then the focused suites below (new names are planned tests owned by
  this file or its recorded predecessor; run each with bounded workers and read exits):
npx vitest run tests/freehold_strongbox.test.ts tests/freehold_station.test.ts
tests/freehold_guildhall.test.ts tests/professions_crafting_hub.test.ts
tests/mobile_station_party.test.ts tests/mobile_station_walk.test.ts
tests/craft_from_vault.test.ts tests/professions_feast.test.ts
tests/feast_object_lifecycle.test.ts tests/world_api_parity.test.ts
tests/freehold_command_chain_online.test.ts tests/entity_display_name.test.ts
tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
tests/mobile_window_coverage.test.ts tests/architecture.test.ts
tests/sim_context.test.ts tests/monolith_budget.test.ts tests/localization_fixes.test.ts
tests/guild_chest_opener.test.ts tests/pr_shot_targets.test.ts
- npm run i18n:gen, then npx vitest run tests/i18n_completeness.test.ts;
  npm run wiki:content, then npx vitest run tests/guide.test.ts for content changes.
- Run the disposable-Postgres twins ARMED with TEST_DATABASE_URL after npm run db:up
  for persisted changes. Capture the query/lock/recovery/bound evidence above.
- Run npm run asset:budget, npm run perf:tour and node scripts/pr_screenshots.mjs for
  the owned visual targets; node scripts/mobile_input_zoom_check.mjs against npm run dev.
  Re-pin parity goldens in their own reviewed commit only when sampled behavior changes.
- Required reviewers: architecture-reviewer, cross-platform-sync, privacy-security-review, migration-safety, database-performance-reviewer, server-hot-path-reviewer, content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
  Each reports COVERAGE to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT.
  Database review repeats on the finished diff. Apply ALL findings including nits;
  a fresh reviewer reads all fixes. The actual diff may trigger additional reviewers.
- Run node scripts/gate_select.mjs (or deeper npm run gate) as the shared pre-merge bar
  after integration; npm run ci:changed after the last commit is additional evidence,
  never a substitute. Record exact command, exit and proof path for every acceptance.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
Only when implementation commits are authorized: Conventional Commits with scope and
body, explicit owned paths, never git add -A, no coauthor trailer, and the word "phase"
nowhere in messages. Separate behavior/content, generated fingerprints and verification
as coherent reviewed commits. Never push, open or merge a PR from this file.

STEP 5 - ACCEPTANCE:
- [ ] Guild chest admits the correct member/rank at condition 30 and refuses 29,
  foreign/currently revoked membership, distance and private-bank/vault attempts; from
  the chest opener the personal and vault panes are absent from the DOM and no personal
  or vault command is sendable (pinned in tests/guild_chest_opener.test.ts, NEW,
  produced by 30).
- [ ] Hall station admission and HUD type set match for member presence, station type
  and condition through the station-list channel (freeholdStationsFor), never the mst
  scalar; existing town training, private party station and recipe semantics
  are unchanged. A spy/structural test proves private party predicate independence.
- [ ] Crafting draws only the acting member's own authorized personal vault/bags;
  other vaults/fund remain untouched, with decisive concurrent/atomic-save negatives.
- [ ] Feast object lifecycle grants exactly existing Well Fed through both arms (the
  table's place_feast party feast and an apex role feast used through the ordinary
  `use` command, unchanged, while the member stands at the table), no automatic new
  aura, no table-proximity gate or anchor snap, and tears down on claim free. Final
  props, title map, names/wiki and prewarm pass.
- [ ] Desktop/compact/tablet leader/officer/member/guest/locked screenshots through the
  housing-hall-amenities registry entry above (38 variants, manifest regenerated; guest
  is a non-member admitted under the public policy per D77), LOW perf, all required
  tests, shared gate and fresh review of every fix pass.

STEP 6 - DOC UPDATES AND MEMORY:
Record row 30, exact files/symbols/tests/command outcomes, approved artifact rows and
review evidence in progress.md/state.md; keep built status honest. Preserve all prior
decisions and next links. Record surprising repository rules in the authorized memory.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, files, exact checks/results, review and fresh-fix verdicts, any unmet
release artifact gate, and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-30-qa.md

STOPPING RULES:
- A missing required proof or artifact keeps this contribution incomplete; do not
  invent a value, fake a source, discard custody or weaken an acceptance row.
- Never raise a monolith ceiling, mutate a foreign owner or bypass current authority.
- Keep the branch local; never push, open or merge a PR.
```
