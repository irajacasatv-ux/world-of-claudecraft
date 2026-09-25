# Phase 23: the Legend Stand and the remaining trophy families

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "23
Legend Stand and the remaining trophy families"; the decisions are `state.md` Locked
decisions (D19: trophies are furnishing-shaped records, never items). This phase
ships the Legend Stand (a named Perfected legendary with the player's name and the
crafter signature `ItemInstancePayload.signer` on the plaque; Maker's Bond is the boundTo
trade lock, not the signature; the item stays in the owner's possession and the stand
reads the instance), the Harvestmaster golden sheaf, the four regional first-harvest
markers, the grandmaster workshop banners, the bronze, silver, and gilded finishes by
normal, heroic, and rift S-rank, every ready family Phase 17's MVP set left out, their
art, and the dull trophy finish extension of the condition-readable hearth already delivered in wave A. It is a content phase with a
sim eligibility half and a render half.

## Settled delivery and acceptance contract


Use the account-wide authoritative source union and event-driven refresh from 17.
Each source already eligible there stays displayable; new forms never revoke unlocks.
Actual item display projects the authorized model/skin and public fields without moving,
consuming, locking or binding the copy. Legend Stand identifies the exact owned copy;
loss of possession darkens its display without changing the item or historical proof.
Project only known original character/date/difficulty; unknown historical day or clear
difficulty uses the explicit unknown key and cannot manufacture a silver/gilded finish.
Rift S-rank requires its actual recorded stamp. Spoiler policy applies to every unseen
source. Every promised source has a literal manifest row and positive/negative fixture.
Owner and guest see the same public provenance; internal account IDs and private item
fields never cross the descriptor. Finish identity survives shed bloom and reduced
lights via material value, emblem and silhouette; hearth-condition feedback already
exists in wave A and is extended, not delayed here.

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

1. Bespoke models replacing every wave A generic trophy display.
2. Legend Stand and actual-item weapon/armor displays.
3. Cosmetic mounts, title banners and farming/profession displays.
4. Truthful source/difficulty/date projection and final finish art.
5. Account-wide live/retro sync and custody/visual evidence.

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

## Trophy key and live-versus-history contract

All housing trophy chrome uses the canonical plural hudChrome.housing.trophies.*
namespace from ux-spec.md; do not add a parallel singular trophy namespace. Historical
account-source reconciliation uses retro: true and remains quiet. A newly earned live
source uses retro: false and retains the approved live unlock notification. Repeated
joins, rehydration, form upgrades of an already eligible trophy and source-cache refresh
cannot turn historical eligibility into a new live earn or replay a toast.

Paired fixtures independently drive historical already-earned source, a fresh live
unlock, duplicate live delivery, second join and generic-to-bespoke form replacement.
Assert exact retro booleans, original source IDs, one unlock mutation and the approved
notification/no-notification result. Check online/offline/headless projection parity,
the exact rendered plural i18n key set, and absence of singular namespace fallback.

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
This is Phase 23 of the Freeholds and Guildhalls feature: the Legend Stand and the
remaining trophy families (the Legend Stand, the Harvestmaster sheaf, the first-harvest
markers, the grandmaster banners, the three finishes, the remaining ready families, art).

Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over the Phase 17 seams).

Goal: complete the trophy catalogue so every earned deed, page, mark, mount, set, and
Perfected legendary the game already records maps to a plinth trophy with the right
finish, retroactively and deterministically, with no trophy ever an item, and draw the
cosmetic wear a house shows below condition 30.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Gotcha scan (Codex carries no Claude memory): docs/freeholds/state.md "Gotchas (read
  before the matching phase)" entries on the monolith ratchet, parity goldens and
  META_EXCLUDE, test-pin traps, the content cluster (deeds count re-pins), the
  image-to-glb gotchas, the render scheduler rules.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "23 Legend Stand and the
  remaining trophy families"), and this file
- src/sim/content/freehold/trophies.ts (TROPHY_DEFS and the MVP family set),
  src/sim/freehold/trophy_eligibility.ts and trophies.ts (syncTrophyUnlocks, the retro
  block call site), src/sim/freehold/layout_core.ts (plinth slot rules),
  src/sim/freehold/types.ts (the trophy record on FreeholdState), src/sim/freehold/CLAUDE.md
- src/sim/content/deeds.ts (prog_legendmaker, prog_farming_100, col_golden_harvest,
  prog_field_to_feast, col_deepest_cast, the four regional first-harvest deeds, every
  prog_grandmaster_<craft> deed of the ten-craft roster (engineering, alchemy, cooking,
  leatherworking, tailoring, enchanting, weaponcrafting, armorcrafting, jewelcrafting,
  inscription), dgn_rift and dgn_rift_s_rank, the dungeonClears triggers for normal
  and heroic clears, every boss and world-boss deed; DEED_ORDER), src/sim/deeds.ts
  (deedsEarned as the per-character utcDay stamp of each deed day, deedStats),
  src/sim/reliquary.ts (accountReliquaryOwnership,
  illuminatedPages, the Harvestmaster page id), src/sim/content/reliquary.ts
- The rift S-rank record (grep the S-rank mark or stamp under src/sim/rift/), the
  `slain:*` marks, mount possession, the live `RELIQUARY_SET_MEMBERS` armor sets (the
  set ids), the complete promised family inventory: every row of content-manifest.md
  "Specialized trophy model inventory for 23" whose owner column names 23 (the guild
  first-clear and project rows belong to 31 and 32a/40), with mounts derived from MOUNTS and MOUNT_KEYS under the availability
  filter rather than any fixed mount count, the realm-rare marks, the live
  `RELIQUARY_SET_MEMBERS` sets (derive, never a literal) and the profession specimens
- Warfare Season 2 (v0.44.0 re-sync): the Vanguard Gallery page's items are
  class-locked, so the page sits outside completion (`excludeFromCompletion:
  'personal'`, docs/design/reliquary.md), and the VANGUARD_ITEM_SETS
  (src/sim/content/vanguard_item_sets.ts, spread into ITEM_SETS) are class-locked. Whether class-locked sets and personal pages (Vanguard, plus the
  existing Riftbound and Forgebreaker pages) are trophy sources is a RULING OWED at the
  phase 17 re-plan; this file follows that ruling, never its own
- The Perfected legendary: src/sim/types.ts (the `perfected` stamp, the promotion, the
  player-chosen name field, the crafter signature `ItemInstancePayload.signer`),
  src/sim/professions/perfecting.ts (read only: the diff touches nothing under
  src/sim/professions/), the copy identity the sim uses across bags, bank, vault, and
  equipment (item_copy_ref.ts: itemCopyPin hashes the WHOLE instance payload and so
  changes on a lock toggle, an enchant or a rift forge, which is why the Legend Stand
  keeps its own stable reference in Agent ELIGIBILITY; the bank and vault containers)
- src/render/freehold/ (the trophy props and stand-in kit, the prewarm homes, the
  registry), src/render/point_light_budget.ts, src/render/CLAUDE.md ("GPU work"),
  src/ui/hud/housing/trophy_tooltip_view.ts and the trophy case tab, src/ui/i18n.catalog/
  hud_chrome.ts (hudChrome.housing.trophies.*), src/ui/world_entity_i18n.ts
- server/freehold_wire.ts (the descriptor emitter), src/net/freehold_snapshot_wire.ts
  (the strict decode), tests/snapshots.test.ts (ALL_DELTA_KEYS), tests/parity/trace.ts
- tests/freehold_trophies.test.ts, tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/trophy_tooltip_view.test.ts,
  tests/renderer_compile_gate.test.ts, tests/monolith_budget.test.ts
The agent returns: the wave A generic-display manifest versus the complete promised families (the bespoke
form upgrades this file ships without withholding previously eligible trophies) with the literal deed, page, mark, mount, and set ids per
family; the Perfected legendary's instance fields (stamp, promotion, chosen name,
signer) and the one read that finds a copy in the owner's possession, plus the only
recorded day near it (the owning character's prog_legendmaker deedsEarned entry); how normal,
heroic, and rift S-rank clears are recorded (the field per tier); the trophy record and
descriptor row shapes and where a plaque block and a finish would be appended; the
render registry and prewarm recipe; the deeds and reliquary count pins to re-pin.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (tests/world_api_parity.test.ts
if a member changes, tests/snapshots.test.ts, tests/deeds_content.test.ts and
tests/reliquary_content.test.ts counts, tests/monolith_budget.test.ts, the parity goldens):
- Agent ELIGIBILITY (sim): trophy_eligibility.ts extended with one pure mapping per new
  family (deed id, illuminated page, mark, mount, set, and the Perfected legendary to
  trophy ids), `finishFor(sourceTier)` mapping normal to bronze, heroic to silver, rift
  S-rank to gilded; `legendStandCandidates(accountSources)` (an item in the owner's possession
  with the `perfected` stamp, the legendary promotion, and a chosen name); the Legend
  Stand trophy record stores a stable copy reference, the owning character id plus the
  copy's itemId, `instance.name`, `instance.signer`, `perfected` and
  `rolled.quality === 'legendary'` (never itemCopyPin), resolved through 17's account
  source loader in the fixed order bags, bank, vault, equipment, and matching ANY copy in
  the owner's possession that carries those fields (the stand stays lit while at least
  one matches and darkens when none does, so two identical promoted copies resolve the
  same way on both hosts), so a lock toggle or an enchant on
  the displayed copy keeps the stand lit while vendoring, trading or mailing it darkens
  the stand; the descriptor projects the plaque at emit time by explicit field picks
  (chosen name, base item name, signer, and the source day: the owning character's
  prog_legendmaker deed day, a utcDay stamp per D84, only when deedsEarned recorded it
  AND that character's deedStats counter legendariesForged equals 1, because the deed
  day is the day of the first promotion and is this copy's own day only when it is the
  sole promotion on that character; any larger counter or no recorded day projects the
  explicit hudChrome.housing.trophies.dateUnknown key; no promotion day exists on the
  instance and none is synthesized), never the instance; provenance for
  every family reads the immutable captured public character name and day written at
  grant, never a live character lookup, the same snapshot shape 31's guild-sourced
  families reuse under D79; an item that leaves the owner's possession
  darkens the stand (an empty plaque) and removes nothing; syncTrophyUnlocks covers the
  new families with `retro: true` only for historical reconciliation and
  `retro: false` for a newly earned live source, draws no Rng, and binds only to source
  activation or credit capture (D83: it never refuses GameServer.join, enterDungeon or a
  respawn; an exhausted capture records a bounded, auditable not-captured gap and the
  reward path is unchanged); tests/freehold_trophies.test.ts.
- Agent CONTENT: the new TROPHY_DEFS rows in src/sim/content/freehold/trophies.ts
  (trophy id, source kind and id, prop model key, finish; ids are frozen once persisted;
  trophy ids disjoint from every item id, pinned), the NEW hudChrome.housing.trophies.*
  keys with this exact English (D92, sentence case; the plaque reuses the existing
  trophies.namedItem, trophies.maker, trophies.makerUnknown, trophies.nameUnknown,
  trophies.achievedOn, trophies.dateUnknown and trophies.inactive rows):
  hudChrome.housing.trophies.finish "Finish: {finish}",
  hudChrome.housing.trophies.finishBronze "Bronze",
  hudChrome.housing.trophies.finishSilver "Silver",
  hudChrome.housing.trophies.finishGilded "Gilded",
  hudChrome.housing.trophies.finishSource "Silver needs the heroic clear; gilded needs
  an S-rank rift clear.", hudChrome.housing.trophies.dulled "Finishes look dull while
  your home's condition is below 30.", hudChrome.housing.trophies.formStatue
  "{source} statue", hudChrome.housing.trophies.formHead "{source} mounted head",
  hudChrome.housing.trophies.formBanner "{title} banner",
  hudChrome.housing.trophies.formPaddock "{mount} paddock",
  hudChrome.housing.trophies.formItemStand "{item} armor display",
  hudChrome.housing.trophies.formWeaponRack "{item} weapon rack",
  hudChrome.housing.trophies.formSpecimenCabinet "Specimen cabinet",
  hudChrome.housing.trophies.formHarvestSheaf "Harvest sheaf",
  hudChrome.housing.trophies.formHarvestMarker "{region} first-harvest marker",
  hudChrome.housing.trophies.formAnglersDisplay "Angler's display",
  hudChrome.housing.trophies.formRiftObelisk "Rift obelisk",
  hudChrome.housing.trophies.formLegendStand "Legend Stand",
  hudChrome.housing.trophies.formRankDisplay "{collection} rank display";
  world-entity names where a prop is named,
  `npm run wiki:content` plus spoiler-safe guide.* keys (families named, sources not),
  any Homesteader deed row appended at the END of deeds.ts, the deeds and reliquary
  count re-pins.
- Agent RENDER-ART: the trophy props through the image-to-glb skill registered in the
  furnishing model registry with prewarm homes (final art for every shipped id, generated from docs/freeholds/art-brief.md and its approved reference manifest), the three finish materials as scheduler
  clients with a prewarm home (never a bare scene attach after boot), the cosmetic wear
  below condition 30 (the hearth light goes cold and every trophy finish goes dull, read
  from the condition summary the descriptor already carries, restored at 30 and above,
  drawn at every tier, D22), the plaque as a
  procedural texture or label mesh within the budget, the trophy_tooltip_view.ts core
  extended with the plaque lines and the finish, the trophy case tab rows;
  tests/trophy_tooltip_view.test.ts, tests/renderer_compile_gate.test.ts arm,
  `npm run perf:tour` through the Cottage with plinths filled; the shot scenes
  trophies-finish-silver, trophies-finish-gilded and trophies-dulled-29 appended to the
  housing-trophies target's scene list in scripts/lib/pr_shot_housing.mjs and ux-spec
  section 11 (desktop, compact and tablet at LOW through the target's real capture;
  required after-shots).
- Agent WIRE: the plaque block, the finish and the inactive flag as explicit field picks
  in the server/freehold_wire.ts descriptor emitter, the matching closed-allowlist rows
  in the src/net/freehold_snapshot_wire.ts strict decode (AssertNever on the union), the
  ClientWorld mirror line in src/net/online.ts paid by an extraction, and the old-client
  rule pinned both ways: a client whose decoder predates these fields ignores them,
  shows the bronze finish and hides the plaque; a server without them emits none and
  the new client renders exactly that; tests/freehold_command_chain_online.test.ts
  (plaque, finish and inactive through the real dispatch), tests/snapshots.test.ts
  (ALL_DELTA_KEYS), tests/server/freehold_wire.test.ts and an older-decoder fixture.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: eligibility and the retro grant draw no Rng; no wall clock in src/sim/;
  the plaque projection is a pure function of the instance fields and the recorded deed
  day.
- Calendar (D84): every provenance day is a utcDay stamp of when the source happened
  (deedsEarned); the plaque and achievedOn lines format a server-provided safe
  timestamp; resetDay never enters provenance.
- Provenance snapshots (D79): the captured public character name and day are written at
  grant and read back as a snapshot, never resolved live from the character row; 31's
  guild-sourced families reuse the same shape.
- Capture never gates gameplay (D83): every busy arm in eligibility and capture binds
  only to source activation or credit capture; join, enterDungeon and respawn are never
  refused by trophy capture.
- D19: trophies are furnishing-shaped records, never items; they occupy plinth slots,
  cost no decor points, and are never tradable (pinned); trophies are earned, never sold.
- The trophy module READS deeds and reliquary state only (write ownership stays pinned
  to reliquary.ts by tests/architecture.test.ts).
- The Legend Stand never moves, consumes, or binds the item; the owner keeps it; a
  hidden field never crosses the wire (explicit field picks in the descriptor).
- Server authority: the client mirrors the descriptor; a visitor sees the owner's
  trophies through the same event.
- Never sell power; the finishes are cosmetic; no purchasable thing changes a number.
- Cosmetic wear is cosmetic (D22): below 30 the hearth light cools and finishes dull;
  nothing a player acts on is hidden (the Steward panel's numbers stay), nothing is
  removed, and the wear reads identically at every graphics tier.
- Content obligations in the SAME change: deeds re-pin, Reliquary untouched for
  trophies (not items), wiki regen plus guide keys, world-entity names, name fills for
  wordy English (M16); no WebP obligation (trophies are not items).
- i18n: the policy in docs/freeholds/implementation-plan.md; the sim emits ids and
  values only (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guild-level deeds, first-kill banners, raid statues (Phase 31); project trophies
  (Phase 32); the Showcase vote reward (Phase 36); dyes on trophies (Phase 41).
- Any furnishing content (Phase 22) or placement rule (Phase 25).


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_trophies.test.ts tests/freehold_content.test.ts
  tests/freehold_determinism.test.ts tests/freehold_condition.test.ts
  tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/trophy_tooltip_view.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_wire.test.ts
  tests/renderer_compile_gate.test.ts
  tests/localization_fixes.test.ts tests/item_icons.test.ts`; `npm run wiki:content`
  then `npx vitest run tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run perf:tour`; parity goldens regenerated with
  UPDATE_PARITY=1 in their own commit if the retro emit changed a driven scenario.
- Required reviewers: architecture-reviewer, content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, cross-platform-sync, privacy-security-review, migration-safety, database-performance-reviewer, server-hot-path-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the Legend Stand and the remaining trophy families
- feat(sim): map Perfected legendaries and clear tiers to plinth trophies
- feat(net): carry the plaque, finish, and inactive picks on the descriptor with the old-client default
- feat(render): add the trophy props, the three finishes, and the cosmetic wear below thirty
- test(sim): pin trophy eligibility for every family and the no-item rule
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_trophies.test.ts pins eligibility for EVERY family by literal source
  id (deed, page, mark, mount, set, legendary) with a negative case per family, and the
  finish per clear tier (normal bronze, heroic silver, rift S-rank gilded): every
  23-owned row of the manifest inventory, every MOUNT_KEYS entry mapped or excluded by
  the availability filter with its exclusion named, all ten prog_grandmaster_<craft>
  deeds, dgn_rift and dgn_rift_s_rank.
- [ ] The Legend Stand: a Perfected, promoted, named item in the owner's possession is a
  candidate; an unnamed or unpromoted item is not; the plaque carries the chosen name,
  the item name, the signer, and the owning character's prog_legendmaker deed day only
  when recorded and that character's legendariesForged counter equals 1, otherwise the
  dateUnknown key (two negative fixtures: a promoted copy with no recorded day, and two
  promotions on one character where both stands show dateUnknown; the single-promotion
  fixture still asserts the deed day); a lock toggle or an enchant on the displayed copy
  keeps the stand lit; two identical promoted copies keep the stand lit while either
  remains and darken it when both leave, identically on both hosts; vendoring, trading
  or mailing the item darkens the stand and removes nothing; the
  item is unchanged after placement; the diff touches nothing under src/sim/professions/.
- [ ] The retro grant is idempotent across two joins, draws no Rng, and a visitor sees
  the owner's trophies; no trophy id is an item id; the never-tradable rule is pinned
  with a placed trophy record present: the market, trade, mail and bank arms are driven
  and none can address the record, placing and removing it calls no addItem, removeItem,
  market, mail or bank primitive (SimContext spies), and a synthetic colliding id fails
  the sweep; join, enterDungeon and respawn succeed with capture exhausted (D83 pin).
- [ ] tests/freehold_command_chain_online.test.ts carries plaque, finish and inactive
  through the real dispatch; tests/snapshots.test.ts pins ALL_DELTA_KEYS; the
  older-decoder fixture proves bronze and a hidden plaque; every new trophies.* key
  above ships with its exact English and ux-spec row, the three trophies-* after-shots
  are on file, and the manifests regenerate with the cited counts updated (D92).
- [ ] Below condition 30 the hearth light is cold and every finish is dull on both hosts;
  at 30 the look restores; nothing is removed (tests/freehold_condition.test.ts drives
  the summary, the render core pins the mapping).
- [ ] The props render on every tier with the finishes prewarmed; `npm run perf:tour`
  shows no live-program event; the point-light budget holds.
- [ ] All STEP 3 suites green; every triggered reviewer reports no remaining finding; the deeds and
  reliquary counts are re-pinned by fresh literals.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 23, notes, final-art manifest)
  and docs/freeholds/state.md (the per-phase ledger row 23: trophy ids, the finish
  union, descriptor fields, the Legend Stand copy reference, i18n keys; any locked
  decision); regenerate docs/freeholds/ux-key-manifest.json and ux-shot-manifest.json and
  update the cited counts in state.md "UX verification inventories" (D92).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-23-qa.md

STOPPING RULES:
- Stop and ask if reading the Perfected legendary would require the trophy module to
  write to, lock, or move the item (the stand reads; the owner keeps the item).
- Stop if a family's source cannot be found in the tree (a deed or mark that does not
  exist): record a failed source-manifest acceptance row and complete the promised
  coverage or obtain an explicit scope amendment; never invent provenance or claim completion.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
