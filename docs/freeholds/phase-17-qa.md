# Phase 17 QA: audit trophies

Audits `phase-17-trophies.md`. Verdict goes in `progress.md` (row "17 QA"). The next
implementation phase never starts before this file has run.

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
This is Phase 17 (QA) of the Freeholds and Guildhalls feature: audit trophies
(TROPHY_DEFS, the eligibility mapping, the retroactive sync, plinth placement through
placeTrophy and clearPlinth, the trophy case window, the provenance tooltip, the
Trophies tab, the content obligations).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 17 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "17 Trophies", missing tests, dead code,
determinism (zero Rng, read-only access), the never-an-item rule, three-host parity of
the unlock list and the plinth rows, and every content obligation; fix what the audit
finds; record a verdict.

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
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge
  the newest origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the content and pins/content
  gotcha clusters, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("17 Trophies" and the row),
  docs/freeholds/phase-17-trophies.md (what was promised)
- the Phase 17 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 17), including the regenerated wiki content and the
  parity goldens
- the pins the diff claims: tests/freehold_trophies.test.ts,
  tests/trophy_tooltip_view.test.ts, tests/trophy_case_view.test.ts,
  tests/trophy_case_window.test.ts, tests/freehold_content.test.ts (the trophy arm),
  tests/deeds_content.test.ts, tests/snapshots.test.ts (the fhold arm), the parity
  scenario, tests/guide.test.ts, tests/world_api_parity.test.ts,
  tests/command_schema.test.ts, tests/command_facets.test.ts,
  tests/freehold_command_chain_online.test.ts, tests/mobile_window_coverage.test.ts,
  tests/sim_context.test.ts (CALLBACK_KEYS),
  tests/server/freehold_account_sources_db.test.ts,
  tests/server/freehold_account_sources_db.pg.test.ts and
  tests/server/freehold_account_sources.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every TROPHY_DEFS
row with the source it resolves to, the exact insertion points of syncTrophyUnlocks
(join retro, first entry and source-change invalidation), every read it makes and whether any is a write, every test
added with what it asserts, every raw command path by which a trophy id reaches a
plinth and the unlock-list validation it passes, and any TODO, unused import, or path
by which a trophy id could reach an item container.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-17-trophies.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Source-complete trophy catalog. TROPHY_DEFS accounts for every promised deed,
   individual Reliquary relic/item discovery, completed page, slain:* mark, owned
   mount, set, curator rank, title-awarding deed, weapon-skin source and Perfected
   source. Sweep actual source definitions rather than a remembered family list.
   Every qualifying source has a truthful generic family display in Wave A; 23 adds
   bespoke Legend Stand, real weapon/armor/mount forms and silver/gilded finishes.
   No single discovered relic silently requires full-page completion. Add explicit
   source discriminants required by real ownership surfaces, frozen IDs and one
   positive/negative resolution fixture per kind. Trophies remain cosmetic records:
   no ITEMS, price, drop, buff, bag, mail, trade, bank or market path. Homesteader deeds,
   wiki/guide and fingerprint obligations land together; trophy records get no
   Reliquary item page.
2. Shared account sources, eligibility and truthful provenance (premise changed at the
   v0.44.0 sync: the release's account ledger, src/sim/account_ledger.ts, now carries
   most of these sources; re-planned in phase-17-trophies.md item 2, so audit the
   re-planned contract, not this copy, where they differ). trophy_eligibility.ts is pure
   over bounded authoritative account projections, not only the entering character.
   trophies.ts syncs after join retro, on first entry and through batched source-change
   invalidation while already home, with zero per-tick scan and zero Rng. Persist
   immutable provenance: source kind/id, source character when known, original earned
   day when known, and explicit unknown fields when historical data lacks them.
   First-entry date must never masquerade as achievement date. The original earned
   day is a utcDay stamp of when it happened (D84), never a resetDay key and never the
   first-entry day. Retro grants emit
   retro:true only for historical discoveries; new live grants are correctly distinct.
   Produce the exact shared account-source modules and full source/freshness contract
   below. Read/load work is lazy, bounded and admitted through 07; source collection,
   ID/string and encoded-byte bounds preserve unsupported stored data. The sim reads
   the projection through the NEW SimContext primitive ctx.freeholdAccountSources,
   keyed the way D16 keys the live record: get(ownerKey) returns the current bounded
   cross-character projection or an explicit incomplete status and
   invalidate(ownerKey, sourceKind) coalesces a refresh, where ownerKey is the
   host-stamped owner key the sync already holds through meta (the sim never holds
   an account id). The server host binds it to createFreeholdAccountSourceLoader,
   which resolves ownerKey to the account; the offline and headless hosts install a
   local-only binding whose get returns an empty cross-character projection with
   explicit status, and the local character's own ownership surfaces are read from
   meta by the sync itself (D19). The key is appended to CALLBACK_KEYS and the fake
   host in tests/sim_context.test.ts. Loader admission or budget exhaustion never refuses
   GameServer.join, instance entry or a respawn (D83): the session publishes
   regardless and the sync records explicit incomplete status.
   The exhaustive semantic source-to-requirement fixture selects actual catalog
   discriminants, not invented existing enums: deed/title uses trophies.requireDeed/
   requireTitle; illuminated page requirePage; slain mark requireSlain; armor-set
   completion requireSet; recorded acquisition requireItemAcquired; current possession
   requireItemOwned; mount requireMount; curator rank requireRank; personally named
   Perfected source requirePerfected. Every numeric requirement comes from live catalog.
   Do not describe a non-deed predicate with a generic complete-deed sentence.
   Original source date, source character, maker signature and custom item name are
   distinct sanitized facts. Required unknown maker/name/history arms never borrow
   the current character or reconciliation date. Authority supplies timestamp/calendar
   identity; locale formats in the intended realm timezone. Possession-gated displays
   become inactive/static silhouettes when the qualifying copy leaves, preserving
   source history and public provenance. Acquisition unlocks do not accidentally gain
   possession requirements. Item/weapon-skin source ownership remains truthful.
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


SHARED ACCOUNT SOURCE CONTRACT (deliverable 2; proof belongs to deliverable 5): (Premise
changed at the v0.44.0 sync: the release's account ledger, src/sim/account_ledger.ts, now
carries most of these sources; re-planned in phase-17-trophies.md item 2.) 17 owns NEW
server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage and
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

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer,
content-obligations-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run the complete Phase 17 STEP 3 suite list including both source-loader modules,
  its real-PG suite with TEST_DATABASE_URL set and `npx tsc --noEmit`. Verify executed
  PG cases, bounded shared flight counts and stale/partial/unknown source negative controls.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 17 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "17 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-18-visiting.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 17 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
