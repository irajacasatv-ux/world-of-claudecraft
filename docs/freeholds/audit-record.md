# Settle-and-polish audit record

This is documentation evidence for an unbuilt feature. It does not certify runtime
behavior, platform acceptance, payment settlement or completed housing artwork.
The packet is SETTLED. Approved rulings, verified anchors, owned implementation
contracts and final review evidence are recorded below.

## Preflight

- Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`.
- Branch: `feature/freeholds`, local only.
- Starting tree: `7d140843d2e6804d3245b1c5c09990ca1da6a407`.
- Initial `git status --short`: clean.
- `gh pr view 3872 --json state,mergedAt,baseRefName,headRefName,url`: OPEN,
  no merge timestamp, base `release/v0.42.0`, head `feature/masterwrought`.
- `git fetch origin --prune`: passed.
- `git merge origin/feature/masterwrought`: Already up to date.
- No nonempty merge occurred and no patch moved. The conditional merge audit and
  patched-dependency reinstall were therefore not triggered.
- Memory scan covered the Freeholds entry, test-pin traps, apply-all-findings and
  fresh review of the review-fix round. Root and local repository guidance applied.

## Verified anchor corrections

Each replacement was searched in the actual tree before the citation changed.
Historical nonexisting examples in the dated state facts are explanatory negatives,
not references to implementation modules.

| Finding | Corrected source contract |
|---|---|
| A1 | The module/barrel/local-guidance exemplar is `src/sim/pvp/index.ts` with `src/sim/pvp/CLAUDE.md`. The cited rift barrel and local guidance do not exist. |
| A2 | Fenbridge geometry is `src/sim/fenbridge_layout.ts`, exporting `FENBRIDGE_LAYOUT`. It is not a directory under content. |
| A3 | `WocMarketService` is exported by `server/woc_market.ts`. Housing-specific market behavior belongs in a planned sibling with the coordinator's required extraction. |
| A4 | `formatNumber`, `formatDateTime` and `formatMoney` are exported through the flat `src/ui/i18n.ts` module. |
| A5 | `FINDER_ACTIVITIES` is in `src/sim/content/dungeon_finder.ts`. |
| A6 | `DUNGEON_FLOOR_Y` is in `src/sim/data.ts`; `authoredLiftAt` is exported by `src/sim/rift/authored.ts`, with `src/sim/dungeon_layout.ts` as a consumer. |
| A7 | `GroundAimReticleView` belongs to `src/ui/hud/action_bar/ground_aim_controller.ts`; the render visual uses `GroundAimVisualState`. |
| A8 | `server/ws_auth.ts` consumes the injected `bankBonusForAccount`; `bankBonusFactsForAccount` is the database-side source wired by the server bootstrap. |
| A9 | `scripts/new_endpoint.mjs` scaffolds `server/freehold.ts`, `tests/server/freehold.test.ts` and the `freehold.invalid_input` leaf for the initial freehold domain. It does not invent the planned route-module basename or `freehold.disabled`. Instructions now preserve the scaffold leaf, explicitly move/register planned files, and append the disabled/error mappings. Later endpoints extend the existing domain manually; the scaffold refuses a duplicate domain. |

## Initial deterministic evidence

Before the settlement edits, the structural lint inspected all 94 Markdown files:
44 implementation/QA pairs, 88 ordered starter prompts with STEP 0 through STEP 7,
93 README links and the complete absolute next-file chain. All passed. The copy
scan found no forbidden dash or emoji in the packet.

After the anchor corrections, the occurrence scanner examined 20,328 backtick/path,
identifier, script and related occurrences across the original 94 files. It reported
zero unresolved lexical candidates. New planned paths and names were classified
separately. Existing exports have an export-evidence classification; other existing
tokens have lexical evidence only. Named-file ownership and scaffold behavior were
also reviewed semantically as listed above. A lexical match is not runtime proof.

The coordinator retains the full occurrence inventory and read-only reports in the
session scratch directory. The final expanded scan and semantic correction review
are recorded below, after all new files and accepted contracts were integrated.

## Completion evidence

All settlement questions are closed. Every recommendation has an answered ruling,
every implementation handoff has an owner, and every confirmed review finding,
including nits, was corrected and independently reread. This is implementation-ready
documentation; the housing feature itself remains unbuilt.

Fernando approved all 46 recommendations on 2026-09-06. The answered ruling sheet
and locked decisions record that approval and three additions: Codex execution for
asset-generating work, a final Codex replacement pass for feature-created placeholder
icons/images, and a final revisit of Terms and legal material for the legal team.
The approved drafts are integrated. External service, counsel and platform
sign-offs remain concrete release gates; approval of the plan is not their signature.

The base was revalidated after the answers: PR 3872 remains OPEN, the fetch passed,
and merging `origin/feature/masterwrought` again returned Already up to date.
No source or patch changed in that synchronization.

The first read-only UX draft review returned CHANGES REQUIRED: two blocking,
sixteen should-fix and four nice-to-have findings. All 22 findings were corrected
in the proposed scratch specification. This draft review does not replace the required fresh whole-packet
review or fresh review of the resulting fix round. Its verified source facts were
recorded in state before dependent instructions changed:

- Offline boot derives ordinary developer commands from `import.meta.env.DEV`.
  An explicit housing-only `ALLOW_DEV_COMMANDS` browser bridge does not exist.
- The screenshot runner emits one image per target variant and capture invocation.
  Every required state needs an explicit uniquely keyed capture variant.
- Ordinary online arrival permits no optional cosmetic-settlement delay after
  structural preparation. Optional resources need readable fallback presentation.
- Camera-director cancellation starts a release blend; it does not instantly clear
  the current camera offset.
- A pad-navigation root attribute does not exempt a visible window panel from
  existing pointer-mode arbitration. The housing companion needs a scoped input
integration contract and composed input tests.

Subsequent preparatory database, persistence and security reviews returned BLOCK
on account lifecycle authority, first-arrival replay semantics, durable calendar
history and finality, peer delivery, ingress admission and private wire projections.
All of those preparatory findings were incorporated before the fresh whole-packet
review. No implementation or database workload was executed.

The first integrated structural scan passed for 124 Markdown files, 56 paired
implementation/QA steps, 112 starter prompts and 135 README links. Two JSON UX
manifests bring the packet to 126 artifacts. The complete audit inventory adds the
15 proposal, deck, appendix and service/legal draft files, for 141 files.
`git diff --check` and the Codex Stop-hook floor also passed on that snapshot.
The independent whole-packet and specialist reviews then found the corrections
tracked below. All were applied and passed the fresh review of the correction round.

The complete reviews, correction maps and answered ruling evidence are retained in
`/tmp/freeholds-settle-audit`. They are audit working evidence, not shipped sources.


## First integrated review and correction round

The first whole-packet COVERAGE review read all 141 files, including all producer
and QA files, all UX keys and screenshot variants, the complete deck script and
all research appendices. Its verdict required corrections. Independent finished
reviews returned BLOCK for four database contracts, FAIL for eleven frontend
findings and CHANGES REQUESTED for one guest-book abuse-control contract. The
shared findings were deduplicated. Every confirmed finding, including nits, is
included in the correction round; none is deferred.

The correction ownership includes account-scoped Hearth cooldown authority,
retention-independent guest-book daily admission, ephemeral public build presence,
a new guild clear capture-to-save bridge, preserved unknown future station/tint
values, canonical dye admission for imported tints, precise garden and trophy copy,
functional staged screenshot registration, deck interaction/accessibility fixes,
and consistent whole-wave review and release-gate wording. These are specification
corrections for the approved behavior, not newly implemented game systems.

The canonical selective gate was attempted with
`GATE_SELECT_BASE=origin/feature/masterwrought node scripts/gate_select.mjs`.
Its first run passed preflight, generated-data, i18n/wiki/SFX, media-manifest and
malware checks, then stopped on the changed deck's Biome findings: two errors,
seven warnings and one informational finding. Test, typecheck and build stages
were not reached in that run. After the deck corrections, the same canonical
command passed all 12 steps: 1,138 Vitest files and 23,084 tests passed, with
25 files and 453 tests skipped by the configured suite; all 38 browser files and
332 browser tests passed. Typecheck, server/bot/environment builds and the client
build passed. This is the repository selective gate for documentation changes,
not a claim that every test in the full repository ran.

The final deck was separately checked after a last compact-heading wording polish:
Biome reported zero diagnostics, and browser checks covered all 13 slides at
desktop, tablet and 320-pixel width, focused Prev/Next keyboard activation,
background navigation, long-slide manual scrolling and smooth navigation. The
final checked deck SHA-256 is
`79cb466899ba7ed0df19738a0203e04ba4fd3bde3a025a1809236500bf16cb59`.
Future housing runtime and PostgreSQL acceptance remain owned implementation work.

## Additional verified source corrections

| Finding | Corrected source contract |
|---|---|
| A10 | `server/auth_routes.ts` exports `routes`; its `loginHandler` is file-local. `GameServer.join` is a method of the exported class, not a standalone export. |
| A11 | The historical `characterUpdateStatement` location is explicitly pinned to revision `9e4d12ebd5`; its current exported owner is `server/character_save_statement.ts`. |
| A12 | The current guild roster owner is `GuildRosterCache` in `server/guild_roster_cache.ts`. Guild lifecycle extends the shared lifecycle module family using separate guild relations. |
| A13 | `myFarmPlots` is current-character data. The approved account aggregate is a NEW bounded producer assigned to 17 and extended by 24; no existing whole-state loader is relabeled as that seam. |
| A14 | Dungeon clear mutation is synchronous. The actual session queue is `pendingDeedRecords`, captured with the ordinary `GameServer.saveCharacter` snapshot. A dedicated existing clear-save transaction is not present; 31 owns the new bridge. |
| A15 | `MATERIAL_GRADES` contains node gathering tiers 1 through 3. Tier-4 farm produce is a separate source; no tier-4 fine node-material row is assumed. |
| A16 | The baseline screenshot runner uses Chromium and a default iPhone user agent for mobile variants. It provides iOS-profile emulation, not Android, Safari execution or physical-device evidence. |
| A17 | 09 owns the NEW public arrival audio method and sampled cue through the existing sound pipeline. The existing `GameAudio.playFeedback` member is private; 19 consumes the public integration. |
| A18 | The historical NPC interest-radius citation resolves to `server/interest_policy.ts`. |
| A19 | API error English leaves belong to `src/ui/i18n.catalog/api_error.ts`, with mappings in `src/ui/api_error_i18n.ts::API_ERROR_KEYS`. Ordinary housing chrome remains a separate catalog surface. |
| A20 | `GameServer.socketClosed` supplies the existing stale-socket guard used by the new ephemeral build-presence cleanup contract. |
| A21 | `src/sim/types.ts` exports `SimConfig`, not `SimOptions`; the Sim constructor consumes that type and `SimContext.devCommands` supplies the context capability. |
| A22 | `server/heavy_self.ts` exports `HEAVY_SELF_CMDS`, `HEAVY_SELF_ARM_MARKED_CMDS` and `HEAVY_SELF_EVENTS`; shortened registry names were corrected. |


## Final settlement and review verdicts

| Answered item | Recorded outcome |
|---|---|
| R01 through R46 | Approved as recommended, verbatim user answer: "approve all recommendations." See the [answered ruling sheet](ruling-sheet.md). |
| D73 | Revisit completed-feature Terms, legality, platform policy, settlement and rights at the end, then produce the concrete legal-team handoff. Earlier release gates remain cumulative. |
| D74 | Every asset-producing implementation and corrective asset pass must use Codex, not Claude, including GLBs, images and icons. |
| D75 | Final Codex artwork replaces every feature-created placeholder icon/image in 44a; the final legal handoff follows in 44b. |

The [locked state](state.md) preserves D1 through D26 and records D1 through D75,
all answered recommendations, source-first corrections and precise engineering
refinements. External counsel, published Terms, service acceptance and calibration
artifacts are named production/release gates. They are not unanswered product
questions, fabricated signatures or completed runtime evidence.

The first independent whole-packet review covered all 141 files and returned
CHANGES REQUIRED with 37 findings. All 37 and every additional finding discovered
while reviewing their fixes are closed. The second independent correction review
returned PASS after actual rereads. Its complete coverage distinguishes deep reads,
verified incremental diffs and equality screening of unchanged material. Exact
first-review baselines were recovered for 131 files by SHA-256 equality; the ten
without matching originals were directly reviewed. No missing baseline was guessed.
Independent correction reports for the 34-file guild lane, 28-file depth lane,
15-file PRD lane and full state read also returned PASS. The focused finished
review of all four database findings and the complete admission refinement returned
PASS, with no blocking, should-fix or nice-to-have item remaining.

Final anchor verification returned PASS with zero remaining defects. The expanded
inventory covered 141 files and 35,112 extracted occurrences; lexical candidates
were classified semantically instead of being mistaken for missing implementation.
The final delta retained all 381 occurrences of its 76 candidate records. All 51
current named-file export claims resolved in their exact files, including 18 new
claims. Postscan whole-source bridge members were separately checked. NEW names
have explicit future owners, file-local members are labeled, and historical or
other-revision references are not presented as current-tree exports.

Final packet checks passed: 124 Markdown files, 56 implementation/QA pairs,
112 ordered starter files, every STEP 0 through STEP 7, exact successor chain,
at most five substantive deliverables, 135 README links, and no forbidden dash
or emoji in the packet. The English manifest exactly matches all 329 UX keys;
all 330 screenshot identities are unique and preserve the original 315 records.
The 15 additions cover empty build state and day/night interiors. Functional
registration stages are 12, 89, 178, 226 and 330 captures; later UI is never
registered before its producer exists. Full local-link, whitespace and scope
checks passed. The Stop-hook floor, `bash .codex/hooks/qa-stop.sh` with empty-object
input, exited zero with no output. The canonical gate result is recorded above.

## Delivered UX and file scope

The [UX specification](ux-spec.md) has twelve sections:

1. Intent, sources and completion bar.
2. Shared tokens, windows, painters and input ownership.
3. The first moment: Eastbrook gate, door and arrival.
4. Build mode: a world companion with deliberate placement.
5. Steward: a welcoming household ledger.
6. Trophy case, public provenance and plinth placement.
7. Visiting: a friend's door and an honest guest role.
8. Freehold Charter: permitted WOC Store purchase.
9. Interior art, light, sound and graphics fairness.
10. Later waves: compatible outlines without speculative controllers.
11. Exact screenshot registry and fixture contract.
12. Wave A screenshot matrix and acceptance trace.

The change contains 141 documentation files: all 126 artifacts indexed by the
[packet README](README.md), plus these 15 proposal, deck, research and handoff files:

- [Housing proposal](../prd/woc/freeholds-and-guildhalls-research.md).
- [Player deck](../prd/woc/freeholds-and-guildhalls-deck.html).
- [Research index](../prd/woc/housing-research/README.md).
- [Content systems research](../prd/woc/housing-research/code-content-systems.md).
- [Guild and custody research](../prd/woc/housing-research/code-crypto-guilds.md).
- [World instancing research](../prd/woc/housing-research/code-world-instancing.md).
- [MMO housing research](../prd/woc/housing-research/web-mmo-housing.md).
- [Upkeep UX research](../prd/woc/housing-research/web-upkeep-ux.md).
- [Web3 land research](../prd/woc/housing-research/web-web3-land.md).
- [Counsel memo draft](../prd/woc/freehold-counsel-memo.md).
- [Terms amendment draft](../prd/woc/freehold-terms-amendment.md).
- [Store listing drafts](../prd/woc/freehold-store-listing-drafts.md).
- [Economy-service contract](../prd/woc/freehold-service-contract.md).
- [Deed-service contract](../prd/woc/freehold-deed-service-contract.md).
- [Territory authority schedule](../prd/woc/freehold-territory-authority-schedule.md).

The branch stays local. No game implementation or generated housing asset is
included, and no legal delivery, external signature, push or PR action is claimed.
The next implementing session starts with [the foundation starter](phase-01-foundation.md):
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-01-foundation.md`.
