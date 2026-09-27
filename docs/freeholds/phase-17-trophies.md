# Phase 17: trophies

**Premise moved at the 2026-09-26 release sync (G3, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** titles now come from deed rewards AND developer-badge rungs ('dev:' ids, revocable, not in-game); the re-plan owes a ruling on excluding them from trophy sources (recommended).

Wave A, the Cottage MVP. The spec is `progress.md` "17 Trophies"; the decision is
`state.md` D19 (trophies are furnishing-shaped records, never items: `trophy_eligibility.ts`
maps deed ids, illuminated Reliquary pages, `slain:*` marks, owned mounts, and the
`perfected` stamp to trophy prop ids; `syncTrophyUnlocks(ctx, meta)` reads an authoritative account projection after join
retro, first entry and source-change invalidation, preserves original provenance and
marks only historical additions as `retro: true`; trophies occupy plinth slots, cost no decor points, and are never tradable). This
phase ships complete source eligibility with generic family displays, account retro/live grants,
record-only plinth placement, honest provenance and the Trophies tab. Bespoke Legend
Stand, Harvestmaster sheaf and advanced display forms arrive in Phase 23.

## Exact screenshot integration contract

06 registers nine functional gate/landing variants through
scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets. 09 introduces the planned
scripts/lib/pr_shot_housing.mjs common helper, constructor and visual selector with
twelve additional day/night interior variants. 11 extends that same
scripts/lib/pr_shot_housing.mjs build target; 16/17/18 append their own functional
descriptors as their UI lands. Never register a later nonfunctional UI target. No new screenshot runner or multi-image capture API is introduced.
The registry has one optional-clip result and one image per uniquely keyed variant.

Registration is cumulative by actual producer: file 06 registers nine functional
gate and safe-landing variants; file 09 adds twelve day/night interiors (21 total); file 11 extends the registry to 98; file 16
reaches 187; file 17 reaches 235; file 18 reaches 339. File 20 verifies the complete
wave A set (339 of the 742-variant program inventory in ux-spec section 11; 21 to 42
register their own milestones and each wave close verifies its union). Earlier files
require only their registered working subset,
never nonfunctional future UI. These are derived inventory counts, not new gameplay
or tuning values.

The common housingVariants, housingVisualWhen and supplied beforeLoad are
owned initially by 09 and extended by 11 exactly as ux-spec.md section 11 defines them.
Append only this file's implemented target; validate the registered cumulative subset
of 235 working variants. Later UI targets register only when their producer lands:

```js
{
  key: 'housing-trophies',
  label: 'Trophy ownership, silhouettes, provenance and plinths',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/trophy_',
    'src/ui/hud/housing/furnishing_palette_',
    'src/sim/freehold/trophies.ts',
    'src/sim/freehold/trophy_eligibility.ts',
    'src/sim/content/freehold/trophies.ts',
  ],
  variants: [
    ...housingVariants([
      'trophies-owned', 'trophies-unearned-known', 'trophies-hidden',
      'trophies-provenance-known', 'trophies-provenance-unknown',
      'trophies-maker', 'trophies-possession-inactive',
      'trophies-plinth-preview', 'trophies-replace-review',
      'trophies-clear-review', 'trophies-refreshing',
    ]),
    ...housingVariants(['trophies-provenance-known'], { theme: 'parchment' }),
    ...housingVariants(['trophies-provenance-known'], { theme: 'highContrast' }),
    ...housingVariants(['trophies-provenance-known'], { forcedColors: 'active' }),
    ...housingVariants(['trophies-provenance-known'], { motion: 'reduce' }),
    ...housingVariants(['trophies-grid-focused'], { input: 'keyboard' }),
  ],
  capture: captureHousingTrophies,
},
```

Every captureHousing* stages exactly variant.scene through its real UI/authority
fixture, asserts the matching state and returns one optional-clip result. Interior
scenes use 09's full-viewport {}; UI scenes return { clip: '#ui' }. Missing required
after-state throws. The registered working subset must include every exact
target/variant and identity dimension for its producers; 20 verifies the full union.
No callback side shot or sequence-to-last-state substitute.

### Starter Prompt
```
This is Phase 17 of the Freeholds and Guildhalls feature: trophies (TROPHY_DEFS,
trophy_eligibility.ts, syncTrophyUnlocks, plinth placement, the provenance tooltip, the
Trophies tab, the Inn Room's three plinths).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices: content, sim, presentation).

Goal: grant every existing deed, illuminated page, realm-rare mark, mount, armor set,
and curator rank its trophy retroactively on first entry, at no cost and with no Rng,
let the owner set trophies on plinths that cost no decor budget, show where each one
came from, and keep trophies out of every item, trade, and market path.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

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
- Memory scan: MEMORY.md and entries on the Reliquary packet and the Reliquary tracker,
  the achievements system design, the content and pins/content gotcha clusters, parity
  goldens, the monolith ratchet, test-pin traps.

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "17 Trophies"), and this
  file; docs/design/deeds.md and docs/design/reliquary.md (the obligations)
- src/sim/deeds.ts (grantDeed, evaluateDeedsFor, markVisited, the 'slain:<templateId>'
  mark comment and the named overworld terrors list), src/sim/content/deeds.ts (DEEDS,
  DEED_ORDER, the Homesteader rows Phase 03 opened, prog_legendmaker, prog_farming_100,
  the raid and dungeon clear deeds, the armor-set collection deeds, the curator rank
  deeds), src/sim/deeds_completion.ts
- src/sim/reliquary.ts (accountReliquaryOwnership and ReliquaryOwnershipSurfaces:
  itemsDiscovered, marks, ownedMounts, deedsEarned; pageCompletion; illuminatedPages;
  CURATOR_RANK_DEFS and curatorRankFromOwned; the sync* precedents that draw no rng),
  src/sim/content/reliquary.ts (RELIQUARY_PAGES and the shelf ids), src/sim/mounts.ts
  (ownedMounts), src/sim/types.ts (the perfected stamp on item instances,
  ItemInstancePayload.signer as the crafter signature on a signed copy, the
  deedUnlocked and reliquaryUnlock SimEvent variants as the id-only models);
  craftedBy is the signer-derived tool-slot stamp in src/sim/professions/tools.ts, not
  an instance field, and Maker's Bond is the boundTo trade lock, not the signature
- server/db.ts account_weapon_cosmetics (account_id, skin_ids, loadout: the weapon-skin
  account row), server/account_cosmetics_db.ts (the per-account weaponSkinIds merge,
  AccountCosmetics, loaded at join in server/ws_auth.ts) and
  server/claudium.ts noteWeaponSkinGrants (the skin grant path)
- src/world_api.ts (COMMAND_NAMES, COMMAND_FACETS, the IWorldHousing facet as 01 to 11
  left it), tests/world_api_parity.test.ts, tests/command_schema.test.ts,
  tests/command_facets.test.ts, src/sim/sim_context.ts and tests/sim_context.test.ts
  (CALLBACK_KEYS and the fake host), src/ui/reliquary_window.ts and its view/cell-art/
  labels/i18n siblings (the navigation family the trophy case reuses)
- server/db.ts (listCharactersAllRealms is a full-state source to avoid), the existing
  account/character keyset and concurrent-index seams, shared admission/cache budgets,
  source-change/save/create/delete/session hooks and their literal pins
- the join retro in src/sim/deeds_restore.ts `runBookOfDeedsJoinRetro` (seedItemDiscovery,
  retroFallbackGrants, evaluateDeedsFor with retro true, seedAccountLedgerSelf), called
  from Sim.addPlayer, and the first-entry hook in src/sim/freehold/instance.ts (Phase 05)
- src/sim/freehold/ as Phases 01 to 16 left it (types.ts: the trophies field on the
  record from Phase 07; layout_core.ts: the plinth slot rules from Phase 08;
  placement.ts; state.ts: normalizeFreehold), src/sim/content/freehold/ (tiers.ts: the
  plinth counts 3 and 4; furnishings.ts)
- src/render/freehold/ (Phase 09: the furnishing model registry and the stand-in kit),
  src/ui/hud/housing/ (Phase 11: furnishing_palette_view.ts and window;
  furnishing_tooltip_view.ts from Phase 02), src/ui/hud/professions/recipe_pattern_tooltip_view.ts
  (the tooltip core precedent), the tooltip composer in src/ui/hud.ts that Phase 02 wired
- server/freehold_wire.ts and src/net/freehold_snapshot_wire.ts (where trophies ride:
  the fhold key for the owner's unlock list, the freeholdState descriptor for placed
  plinth rows so a visitor sees them), server/heavy_self.ts, tests/snapshots.test.ts
- tests/deeds_content.test.ts (the counts it pins), tests/reliquary_content.test.ts,
  tests/parity/trace.ts and scenarios.ts, tests/monolith_budget.test.ts
- src/ui/i18n.catalog/hud_chrome.ts (the housing namespace), src/ui/world_entity_i18n.ts
  (the deed and page name lookups the tooltip reuses), scripts/wiki/build_content.mjs
  (what the wiki regen reads), root CLAUDE.md "New game content" bullet The agent returns:
  the exact ownership reads for each source kind and the character bundle
  (accountReliquaryOwnership) and the bounded account projection needed for all alts; the
  join retro insertion point and the first-entry hook; the plinth slot rules and how a
  plinth row differs from a furnishing row in the layout; the fhold and descriptor
  extension points; the tooltip core recipe and where the composer dispatches; the deeds
  count pins that will move and the Homesteader ids to append; the wiki regen and guide
  key obligations for a trophies table; the extraction that pays for any sim.ts, game.ts,
  or online.ts line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Source-complete trophy catalog. TROPHY_DEFS accounts for every promised deed,
   individual Reliquary relic/item discovery, completed page, slain:* mark, owned mount,
   set, curator rank, title-awarding deed, weapon-skin source and Perfected source. Sweep
   actual source definitions rather than a remembered family list. Warfare Season 2
   (v0.44.0 re-sync): the Vanguard Gallery page's items are class-locked, so the page sits
   outside completion (`excludeFromCompletion: 'personal'`, docs/design/reliquary.md), and
   the VANGUARD_ITEM_SETS (src/sim/content/vanguard_item_sets.ts, spread into ITEM_SETS)
   are class-locked. Whether class-locked sets (a requireSet source) and personal pages (a
   requirePage source: Vanguard, plus the existing Riftbound and Forgebreaker pages) are
   trophy sources is a RULING OWED at this file's re-plan. Every qualifying source has a
   truthful generic family display in Wave A; 23 adds bespoke Legend Stand, real
   weapon/armor/mount forms and silver/gilded finishes. No single discovered relic
   silently requires full-page completion. Add explicit source discriminants required by
   real ownership surfaces, frozen IDs and one positive/negative resolution fixture per
   kind. Trophies remain cosmetic records: no ITEMS, price, drop, buff, bag, mail, trade,
   bank or market path. Homesteader deeds, wiki/guide and fingerprint obligations land
   together; trophy records get no Reliquary item page.
2. Shared account sources, eligibility and truthful provenance. PREMISE CHANGED at the
   release/v0.44.0 sync (2026-09-22), NOT YET RE-PLANNED. The release shipped an account
   ledger that already carries most of the sources this item plans to load:
   `meta.accountLedger` (`src/sim/account_ledger.ts`) holds deed, relic, mark and mount
   earners with character id, name, class and day; `loadAccountLedger` reads it eagerly on
   every fresh join (`server/ws_auth.ts`); `account_relic_finds` stores an unknown day as
   NULL; and `AccountLedgerService` fans a new earn out to the account's live siblings.
   Building `ctx.freeholdAccountSources` as written would stand a second projection beside
   it with a different load policy and keying. Owed before this phase starts: re-plan
   these sources onto the ledger and scope a new loader to only what the ledger lacks:
   Perfected copies and current possession across the account's characters. The rest
   already arrives: weapon skins with `AccountCosmetics.weaponSkinIds` at join
   (server/account_cosmetics_db.ts, loaded in server/ws_auth.ts); titles (deed rewards)
   and Curator rank derive from `meta.accountLedger` and `accountReliquaryOwnership`
   (src/sim/reliquary.ts). Set membership derives from them ONLY for a set whose every
   member is a catalogued relic (`isCataloguedRelicItem`); at the v0.44.0 re-sync many are
   not (the generated heroic variants, and several authored sets whole), so those sets
   still need the possession source. trophy_eligibility.ts is pure over bounded
   authoritative account projections, not only the entering character. trophies.ts syncs
   after join retro, on first entry and through batched source-change invalidation while
   already home, with zero per-tick scan and zero Rng. Persist immutable provenance:
   source kind/id, source character when known, original earned day when known, and
   explicit unknown fields when historical data lacks them. First-entry date must never
   masquerade as achievement date. The original earned day is a utcDay stamp of when it
   happened (D84), never a resetDay key and never the first-entry day. Retro grants emit
   retro:true only for historical discoveries; new live grants are correctly distinct.
   Produce the exact shared account-source modules and full source/freshness contract
   below. Read/load work is lazy, bounded and admitted through 07; source collection,
   ID/string and encoded-byte bounds preserve unsupported stored data. The sim reads the
   projection through the NEW SimContext primitive ctx.freeholdAccountSources, keyed the
   way D16 keys the live record: get(ownerKey) returns the current bounded cross-character
   projection or an explicit incomplete status and invalidate(ownerKey, sourceKind)
   coalesces a refresh, where ownerKey is the host-stamped owner key the sync already
   holds through meta (the sim never holds an account id). The server host binds it to
   createFreeholdAccountSourceLoader, which resolves ownerKey to the account; the offline
   and headless hosts install a local-only binding whose get returns an empty
   cross-character projection with explicit status, and the local character's own
   ownership surfaces are read from meta by the sync itself (D19). The key is appended to
   CALLBACK_KEYS and the fake host in tests/sim_context.test.ts. Loader admission or
   budget exhaustion never refuses GameServer.join, instance entry or a respawn (D83): the
   session publishes regardless and the sync records explicit incomplete status. The
   exhaustive semantic source-to-requirement fixture selects actual catalog discriminants,
   not invented existing enums: deed/title uses trophies.requireDeed/ requireTitle;
   illuminated page requirePage; slain mark requireSlain; armor-set completion requireSet;
   recorded acquisition requireItemAcquired; current possession requireItemOwned; mount
   requireMount; curator rank requireRank; personally named Perfected source
   requirePerfected. Every numeric requirement comes from live catalog. Do not describe a
   non-deed predicate with a generic complete-deed sentence. Original source date, source
   character, maker signature and custom item name are distinct sanitized facts. Required
   unknown maker/name/history arms never borrow the current character or reconciliation
   date. Authority supplies timestamp/calendar identity; locale formats in the intended
   realm timezone. Possession-gated displays become inactive/static silhouettes when the
   qualifying copy leaves, preserving source history and public provenance. Acquisition
   unlocks do not accidentally gain possession requirements. Item/weapon-skin source
   ownership remains truthful.
3. Record-only plinth placement and public projection. Plinths accept one qualified
   trophy record and cost no decor points; Inn Room has three and Cottage four from
   state.md, with previous placements carried over. Placement rides two NEW
   IWorldHousing members beside the D20 five (no D20 name changes):
   placeTrophy(plinthKey, trophyId), which places or replaces the plinth's current
   record, and clearPlinth(plinthKey); their wire commands place_trophy and
   clear_plinth join COMMAND_NAMES with COMMAND_FACETS rows 'IWorldHousing', both Sim
   and ClientWorld implement them, and the pinned member list in
   tests/world_api_parity.test.ts moves in the same change. The server validates the
   trophy id against the account's unlock list: a raw command carrying an unearned,
   unknown or other-account trophy id refuses trophy_unavailable (NEW key
   hudChrome.housing.denied.trophyUnavailable = "That trophy is not available to
   display.") and changes no layout row; a full plinth set refuses no_plinth
   (denied.plinthFull); provenance fields are written server-side from the unlock
   record only and any client-supplied provenance is ignored. The authoritative
   journal handles place/remove/undo/redo without consuming or minting items. Owner
   private unlock projection and public placed provenance use 08a's opaque plot
   identity and strict decoder; guests see the same public known/unknown source
   facts, never account IDs, private ownership inventory or spoiler-hidden source
   names. Hidden unearned content
   follows live Deeds/Reliquary spoiler policy, not a universal revealing silhouette.
4. Trophy case and tooltip. NEW src/ui/hud/housing/trophy_case_view.ts (pure,
   UI_PURE_CORES) and trophy_case_window.ts (painter, UI_DOM_MODULES) ship the
   standalone trophy case ux-spec section 6 lays out: window id trophy-case-window
   (a NEW housing window id with an explicit mobile-sheet pin in
   src/styles/hud.mobile.css, pinned by tests/mobile_window_coverage.test.ts),
   FocusManager registration as an ordinary standalone window, shelf tabs and search
   (trophies.title as the window title in title case per D92, trophies.search,
   trophies.noResults) reusing reliquary_view, reliquary_cell_art, reliquary_labels
   and reliquary_i18n for shelf navigation, collection art, silhouettes, source hints
   and scroll/focus preservation. It opens from the palette Trophies tab's open-case
   action and from a plinth interact; TrophyCaseWindow.openForPlinth(plinthKey) is the
   shared record-only chooser entry that 11's Replace trophy/Clear plinth affordance
   shell (shipped disabled in 11) calls once this file lands, over the pure
   trophy_case_view.ts::eligibleTrophyChooser model (one symbol shared by the standalone
   window and the palette Trophies tab), and it stages the selected record on that
   exact plinth through placeTrophy. The captures split by
   surface: trophies-owned, -unearned-known, -hidden, -refreshing and -grid-focused
   stage the trophy case window; -plinth-preview, -replace-review and -clear-review
   stage the palette Trophies tab and plinth reviews; -provenance-known,
   -provenance-unknown, -maker and -possession-inactive stage the placed-object
   tooltip. furnishing_palette_view/window reuse the bags marks and
   Trophies tab with the case's eligibility and selected record (never a second
   catalog), with Reliquary's owned-art/silhouette, roving grid, source accessibility
   and preserved scroll/focus patterns. trophy_tooltip_view.ts resolves all public
   source names through existing localization and hudChrome.housing.trophies.* keys:
   deed and day, page/relic, mark, mount/title, maker, known source character and unknown
   history. Follow docs/design/tooltip-writing.md with live values; tooltip and focus/
   touch inspection reveal identical facts. Empty/unearned/hidden/loading/error,
   owned, selected, full-plinth and visitor states use ux-spec.md. Generic props must
   receive final family assets in 19 before Wave A closes, never indefinite stand-ins.
   hudChrome.housing.trophies.* is the single chosen English namespace; never add a
   parallel singular trophy.* namespace. This file regenerates ux-key-manifest.json
   and ux-shot-manifest.json in its own change with every cited count updated (D92).
   trophies.unknownSource means unknown original history, never intentionally hidden
   content. trophies.hidden/hiddenAria own hidden
   source output and every spoiler-protected sink. Hidden source protection covers
   captions, source/requirement tips, aria/alt,
   image data and search indexes, not just visible headings. trophies.refreshing
   preserves known rows without inventing new eligibility. trophies.collectionHelp
   remains associated with the grid's assistive description across locale/input changes.
   selectedCopyNoMarks is a complete branch, never empty mark punctuation. Replace/
   Clear reviews preserve record identity and plinth focus, keep pending selection
   locked and never turn a trophy record into an inventory item. Owner and guest see
   the same active/inactive and known/unknown public facts.
   Mark requirements use the exact plural trophies.* English keys from ux-spec.md:
   requireSlain = "Defeat {creature} to display this trophy.";
   requireMasterwork = "Craft a Masterwork item to display this trophy.";
   requireMasterworkCraft = "Craft a Masterwork item with {craft} to display this trophy.";
   requireGatherEvent = "Find {find} through {profession} to display this trophy.";
   requireGoldenHarvest = "Gather a golden harvest from a farm bed to display this trophy.";
   requirePerfectSpecimen = "Harvest a perfect specimen from a fallen creature to display this trophy.".
   Select by actual catalog membership/source discriminants, never display-name substrings.
   For slain marks, validate ownEntry(MOBS, id), then resolve the creature through
   src/ui/entity_i18n.ts::tEntity({ kind: 'mob', id, field: 'name' }). The public source
   label may still use reliquaryRelicDisplayName; never pass its localized Slain prefix
   as the creature. Missing/unrecognized identity selects trophies.unknownSource,
   never a stripped/humanized ID or generic Complete-mark fallback.
   masterwork:first uses requireMasterwork; catalogued per-craft Masterwork uses
   requireMasterworkCraft with the ordinary localized craft name. Pristine vein,
   ancient heartwood and moonlit bloom use requireGatherEvent with localized find and
   Mining/Logging/Herbalism selectors. Golden harvest and perfect specimen use their
   dedicated predicate keys. Tests cover every catalogued mark arm, injected localized
   nouns and the unknown-source fallback. Pin these concrete rendered keyed fixtures:
   slain:mogger => "Defeat Mogger to display this trophy.";
   masterwork:first => "Craft a Masterwork item to display this trophy.";
   masterwork:weaponcrafting => "Craft a Masterwork item with Weaponcrafting to display this trophy.";
   gather_event:pristine_vein => "Find Pristine Vein through Mining to display this trophy.";
   gather_event:golden_harvest => "Gather a golden harvest from a farm bed to display this trophy.";
   gather_event:perfect_specimen => "Harvest a perfect specimen from a fallen creature to display this trophy.".
   These are keyed render results, not additional unkeyed player copy.
5. Trophy proof and captures. Pin an alternate account character's existing source,
   immediate new source while inside, relog idempotence, every source kind, honest unknown
   date, hidden spoiler, provenance privacy, three/four-plinth limits, no-item routes, the
   raw-command forgery arm (unearned, unknown and other-account trophy ids) and the
   account weapon-skin fixture. The trophies-provenance-known capture stages a deed source
   (deed rows and any relic/mark/mount ledger row with a non-null `found_at` carry a known
   day: server/account_ledger_db.ts, `AccountEarner.day` in src/sim/account_ledger.ts;
   replayed historical finds are NULL, unknown); trophies-provenance-unknown stages a
   historical source with no known day (a replayed find), never a faked date. Re-run
   strict wire/parity/content/guide/ownership pins and bounded PG account hydration
   evidence. Add the exact housing-trophies helper entry below with desktop/compact/tablet
   owned/unearned/unknown/public provenance and placement captures. Dispatch architecture,
   content, cross-platform, frontend, render, privacy, migration, server-hot-path and
   before/final database reviewers.


SHARED ACCOUNT SOURCE CONTRACT (deliverable 2; proof belongs to deliverable 5): 17 owns
NEW server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage and
server/freehold_account_sources.ts::createFreeholdAccountSourceLoader. The DB module owns
fixed, versioned, statically selected source projections and account-scoped character-ID
keyset pages. Select only the exact trophy source fields admitted by the source manifest;
24 extends that same projection with normalized farm state and source farming proficiency.
Weapon-skin ownership is an account row, not a character field: the loader reads
account_weapon_cosmetics.skin_ids (server/db.ts) through the existing per-account
weaponSkinIds merge in server/account_cosmetics_db.ts (loaded at join in
server/ws_auth.ts), the skin grant path (server/claudium.ts noteWeaponSkinGrants) is its
invalidation hook, and src/sim/reliquary.ts resolves weapon_skin relics through
opts.weaponSkins, never a PlayerMeta field. No caller-supplied JSON paths,
whole-character-state SELECT or listCharactersAllRealms scan is permitted. The per-realm
character limit is not a limit for the account across all realms. Measure the candidate
(account_id, id) access index against actual query plans, and use the concurrent-index
seam if required.

Record page rows/bytes, aggregate collection/string/encoded-byte limits, admission and
connection deadlines, cache entries/bytes and refresh bounds in the approved
content-numbers-workbook.md MEASURE-BOUNDS row before activation. Values come from the
complete source catalog and seeded multi-realm cardinality evidence, never an invented
character cap. Exhausted budget returns explicit incomplete/unavailable status; it
must preserve existing known unlocks/provenance and cannot grant, revoke possession or
infer empty merely because later pages were not read. Unknown/future source data stays
preserved under 07's capability contract; this read boundary never normalizes it away.

The loader owns one bounded account/source-generation keyed single-flight cache and
shared admitted page flight for trophy and garden consumers. No visitor, tooltip,
render frame or descriptor snapshot starts an independent scan. Use a bounded refresh
on demand and coalesced invalidation of relevant source generations for cross-process
saved data; capture the accepted refresh interval and maximum age in MEASURE-BOUNDS.
No new farm poller or per-viewer subscription is introduced in 24. Persisted nonlocal
sources remain explicitly saved, never asserted to include remote unflushed changes.

A currently authoritative generation-fenced local Sim source replaces the ENTIRE
saved slice for that character, including empty collections after a loss/harvest.
Do not merge stale saved rows back into a live slice. Join/leave/takeover, successful
relevant source changes, and committed changed-source save/create/delete either install
an available source slice with its generation or invalidate its account/source epoch.
Deed, discovery, page, mark, mount, inventory/possession, maker and perfected predicates
receive their existing successful-source invalidations; 24 adds farm/proficiency ones.
An unrelated position/gear autosave does not invalidate a garden slice. Coalesce one
dirty account refresh, cancel abandoned generation work, and reject stale page completions
after source replacement, removal or session takeover. A failed refresh retains known
facts and explicit refresh status. Source character IDs stay internal; only the existing
sanitized public provenance allowlist crosses 08a's owner/visitor wire.

Confirmed source deletion removes its current slice. A character absent from a
complete authoritative account enumeration is no current source; failed or incomplete
enumeration is not deletion. In an existing supported character, absent farmPlots
means no planted beds, matching normalizeFarmPlots. Unsupported/malformed/oversized
fields remain unavailable, not silently empty. 24 uses the exact whole-field
gatheringProficiency ?? professions fallback from Sim.addPlayer, not a per-entry
merge that changes farming proficiency. Never reconstruct current farms from trophies
or archived housing provenance. No durable garden-source table, farm schema or write-
back of normalized character data is added. Add literal missing-field, confirmed-delete,
failed-enumeration and current/legacy proficiency fixtures to the proof below.

NEW tests/server/freehold_account_sources_db.test.ts and
NEW tests/server/freehold_account_sources_db.pg.test.ts prove static projection,
parameterized keyset ordering, multiple realms, measured index/query/row/byte bounds,
empty completion and explicit incomplete/unknown/error arms with TEST_DATABASE_URL set
for the real-PG suite. NEW tests/server/freehold_account_sources.test.ts proves shared
concurrent trophy/garden flights, cache entry/byte eviction, admission pressure, relevant
versus unrelated invalidation, delayed delete/replace/takeover results, cancellation,
whole-slice empty replacement and saved/live freshness. Extend freehold_trophies tests
for alternate sources, live grants, an owned skin on no character unlocking its
weapon-skin trophy (and no character change revoking it), failed partial refresh
preserving provenance and possession state, and exact owner/guest private-field
sentinels. Read-only projection
never mutates source farm/deed/Reliquary/character state. Before/final database,
persistence, security and hot-path reviews inspect these exact modules and evidence.

INVARIANTS THIS PHASE MUST KEEP:
- Trophies are never items: no ITEMS entry, no bag slot, no trade, mail, market, bank,
  or Exchange path; never sold; pinned.
- Determinism: eligibility and the sync draw no Rng; no wall clock; retro/live grants are
  idempotent across relogs/alts and source-change notifications; unknown history stays unknown.
- Read only: the trophy module never writes a deed, a reliquary field, or an item
  instance (the architecture test pins reliquary write ownership).
- Never sell power: a trophy has no stat, buff, drop, or gathering effect; plinths cost
  no decor points and give nothing back.
- Server authority: unlocks and plinth placement are decided in the sim on the server;
  the client mirrors the fhold list and the descriptor rows; a raw place_trophy with
  an unearned, unknown or other-account trophy id refuses and mutates nothing.
- Housing capacity never gates gameplay (D83): no loader admission, budget or sync arm
  refuses GameServer.join, instance entry or a respawn; exhaustion is explicit
  incomplete status.
- Content obligations in the SAME change: Homesteader deed rows (cosmetic only, pinned
  by tests/deeds_content.test.ts), no Reliquary page with the ruling stated, wiki regen
  and guide keys, world-entity names only where a trophy becomes a named entity (none
  expected: trophies are descriptor rows), no new item id so no WebP obligation.
- i18n: the policy in docs/freeholds/implementation-plan.md; the event is id-only (D10);
  provenance text comes from existing deed and page name keys plus hudChrome.housing.trophies.*.
- Monolith: sim.ts, game.ts, online.ts, and hud.ts are at or near their ceilings; pay
  every line with an extraction and lower the ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The Legend Stand, the Harvestmaster sheaf, the first-harvest markers, the grandmaster
  banners, finishes by difficulty, and bespoke display forms (Phase 23); their generic source eligibility ships here.
- Final generic trophy GLBs are required in Phase 19 before Wave A release; later
  bespoke forms ship with Phase 23. Guild first-kill sources require Phase 31 proof.
- Any new deed trigger kind or reliquary page (trophies read what exists).

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer,
content-obligations-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run `npx vitest run tests/server/freehold_account_sources_db.test.ts
  tests/server/freehold_account_sources.test.ts`; with TEST_DATABASE_URL set, run
  `npx vitest run tests/server/freehold_account_sources_db.pg.test.ts` and verify the
  real-PG tests executed. Then run: `npx tsc --noEmit`; `npx vitest run tests/freehold_trophies.test.ts`;
  `npx vitest run tests/trophy_tooltip_view.test.ts`; `npx vitest run
  tests/trophy_case_view.test.ts tests/trophy_case_window.test.ts` (NEW, this file);
  `npx vitest run tests/command_schema.test.ts tests/command_facets.test.ts
  tests/pr_shot_targets.test.ts`; `npx vitest run
  tests/freehold_content.test.ts tests/deeds_content.test.ts
  tests/reliquary_content.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/market_filters.test.ts
  tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/localization_fixes.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; the parity goldens with `UPDATE_PARITY=1` in their
  own commit, then `npx vitest run tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  architecture-reviewer (the sync hook order, zero Rng, read-only access),
  content-obligations-reviewer (TROPHY_DEFS, the deed rows, the wiki, the no-page
  ruling), cross-platform-sync (placeTrophy/clearPlinth in both worlds, the two
  commands, the parity pin), frontend-seam-reviewer (the tooltip core, the trophy case
  window, the tab, the stand-in props).
  Prompt each for COVERAGE not filtering; each writes its report to a file. Do not
  commit until ALL findings, including nits, are resolved and the fixes have fresh review.

- Required reviewers for the complete settled diff: architecture-reviewer, content-obligations-reviewer, cross-platform-sync,
  frontend-seam-reviewer, render-performance-reviewer, privacy-security-review,
  migration-safety, server-hot-path-reviewer and database-performance-reviewer.
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(content): add the freehold trophy records and the Homesteader trophy deeds
- feat(sim): grant trophies retroactively and place records on plinths through the
  housing facet
- feat(ui): show the trophy case, trophy provenance and the Trophies tab
- test(parity): record the freehold trophies scenario goldens
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] A character with an earned deed, an illuminated page, a slain:* mark, an owned
  mount, a full armor set, a curator rank, and a perfected item enters the Inn Room and
  receives one freeholdTrophyUnlocked per trophy with retro true; a relog and the
  account's second character receive none again (idempotent, pinned).
- [ ] Shared account-source modules, bounded PG/cache/admission evidence and every
  freshness/failure/unknown/cancellation branch above are proved; 24 has one named
  source-extension seam with no duplicate scan, cache or poller.
- [ ] Rng.setObserver records zero draws across the sync; no reliquary or deed write
  from src/sim/freehold/ (tests/architecture.test.ts).
- [ ] A trophy goes on a plinth and only a plinth, costs no budget, and a fourth trophy
  in the Inn Room refuses 'no_plinth'; the Cottage's four plinths keep the three.
- [ ] placeTrophy and clearPlinth exist on IWorldHousing in both worlds with
  place_trophy and clear_plinth in COMMAND_NAMES and COMMAND_FACETS and the parity pin
  updated; a raw online command with an unearned, unknown or other-account trophy id
  refuses trophy_unavailable and changes no layout row, and provenance is written
  server-side from the unlock record only (tests/freehold_trophies.test.ts and
  tests/freehold_command_chain_online.test.ts).
- [ ] The trophy case opens from the palette Trophies tab and from a plinth interact
  under trophy-case-window with its mobile pin, reuses the Reliquary navigation
  modules, and the palette Trophies tab shares its selected record;
  TrophyCaseWindow.openForPlinth stages the record on that exact plinth (pinned in
  tests/trophy_case_view.test.ts and tests/trophy_case_window.test.ts).
- [ ] An owned weapon skin on no character unlocks its weapon-skin trophy from the
  account row, and no character change revokes it (pinned).
- [ ] A visitor's descriptor carries the owner's plinth rows (pinned through the chain
  test); the fhold list round-trips (tests/snapshots.test.ts).
- [ ] No TROPHY_DEFS id is an ITEMS key; no trophy reaches bags, trade, mail, market,
  bank, or the Exchange (one negative pin per path).
- [ ] tests/deeds_content.test.ts re-pinned with fresh literals; the wiki regen is fresh
  (tests/guide.test.ts); the provenance tooltip renders every source kind.
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 17, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 17: the content table, the sim
  modules, the event, the IWorld members placeTrophy and clearPlinth with the
  place_trophy and clear_plinth commands, the ctx.freeholdAccountSources primitive,
  the window id trophy-case-window, the fhold and descriptor fields, the deed ids, the
  i18n keys including denied.trophyUnavailable, the regenerated ux-key-manifest.json
  and ux-shot-manifest.json counts; the Reliquary no-page ruling under locked
  decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-17-qa.md

STOPPING RULES:
- Stop and ask if any source kind cannot be read without writing a reliquary or deed
  field, or without a draw.
- Stop if a trophy would need to become an item to reach a plinth (D19 forbids it).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
