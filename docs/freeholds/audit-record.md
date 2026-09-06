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

Disclosure: the proposal (docs/prd/woc/freeholds-and-guildhalls-research.md), the deck and
the six housing-research appendices were edited in place on 2026-09-06 to propagate D27 to
D75 and the 2026-09-06 review round (D76 to D92). The text adopted on 2026-09-05 is revision
383fd7da83 (also the FernandoX7/add-real-estate head). Proposal sections 7, 8, 9, 10, 13 and
14 were replaced; section 3 carries two marked sentence edits (D5/D16 and D37); the nine
rulings in section 12 are unchanged and the addendum was corrected per D29. Appendix text
rewritten after capture stands beside the restored original under a "Superseded 2026-09-06
by D<n>" marker. The proposal status block and housing-research/README.md carry the same
note. The section-by-section decision map is recorded below under "Adopted proposal and
in-place propagation".

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
| D76 through D93 | Recorded on 2026-09-06 from the independent review's decision gaps (state.md "Settlement round 2", ruling sheet R47-R64): visitor friend admission, guild-plot visiting policy, Hall Fund end-of-life, keep-forever guild history and tombstone disband, furnished-plot transfer admission, the 05 default Inn Room record, the war table client seam, housing capacity never gating gameplay, calendar clocks, dark realm behavior, the purchase-submodel absence contract, the wave A and E publication arms, deletion policy for operation rows, upgrade contribution source mode, dye station identity, distribution capabilities and the one key family; D93 (R64) is the fix round's coordinator ruling that the second home upgrades through the primary's build projects at ceil(1.5x) with no second-home upgrade refusal. Applied throughout the packet as recommended dispositions; each awaits Fernando's word. |

The [locked state](state.md) preserves D1 through D26 and records D1 through D93 (D76
through D92 from the 2026-09-06 independent review and D93 from the fix round's
coordinator ruling, applied as recommended dispositions and awaiting Fernando's word), all
answered recommendations, source-first corrections and precise engineering refinements.
External counsel, published Terms, service acceptance and calibration artifacts are named
production/release gates. They are not unanswered product questions, fabricated signatures
or completed runtime evidence.

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

Final packet checks passed: 124 Markdown files, 56 implementation/QA pairs, 112 ordered
starter files, every STEP 0 through STEP 7, exact successor chain, at most five
substantive deliverables, 135 README links, and no forbidden dash or emoji in the packet.
The English manifest exactly matches all 329 UX keys; all 330 screenshot identities are
unique and preserve the original 315 records. The 15 additions cover empty build state and
day/night interiors. Functional registration stages are 12, 89, 178, 226 and 330 captures;
later UI is never registered before its producer exists. Those are the settlement-time
counts; the 2026-09-06 repair round regenerated both manifests with an owning phase per
row (557 keys and 733 variants, wave A staying at 330), recorded in the review section
below. Full local-link, whitespace and scope checks passed. The Stop-hook floor, `bash
.codex/hooks/qa-stop.sh` with empty-object input, exited zero with no output. The
canonical gate result is recorded above.

## Adopted proposal and in-place propagation

The proposal, deck and research appendices at HEAD are the settled propagation of the
text adopted on 2026-09-05 at revision 383fd7da83, edited in place on 2026-09-06. The
sections changed and the decision behind each:

| Proposal section or artifact | Change | Decision |
|---|---|---|
| Status block and summary "Reg risk" row | Adoption line rewritten to the packet requirements; "Reg risk" replaced by "Release authority" (counsel and service acceptance, no legal classification claimed). | D28, D31, D33 |
| Section 1 store-safe and upkeep bullets | Use separated from checkout; purchases web and website-desktop only, Seeker use-only; prepay four weeks then twelve with an approved web repair purchase. | D21, D28, D29 |
| Section 3 (mandatory) | Two marked sentence edits only: farm persistence offers clock and validation precedents; Ledger payment has explicit bags-only, vault-only and automatic modes while home crafting keeps the one planner. | D5/D16/D61, D37 |
| Section 6.4 trophies | Account-wide eligibility, generic display first with bespoke forms in 23, possession-inactive copies, known/unknown provenance, spoiler rules, guild first-kill capture in 31. | D48, D55 |
| Section 6.7 upkeep | Values restated as WOC working targets with attributions removed; suspension, absence, integer units, source modes, Hall Fund allowance. | D31 to D37, D54 |
| Section 7 flywheel | Table replaced; holder flair row folded into the deed surface; argument paragraphs removed. | D27, D29, D31, D64 |
| Section 8 store-safe (mandatory) | Title, distribution table and rules replaced by the capability matrix and release gates. | D28, D29, D30, D65 |
| Section 9 on-chain deeds | Optional deed contract, furnished-sale transfer, no rent, territory gates. | D64, D65 |
| Section 10 experience | Arrival, Steward, build mode, trophy case and visiting text aligned to ux-spec; layout sharing moved to 41a. | D40 to D46 |
| Section 12 rulings | The nine rulings are byte-identical; only the addendum paragraph was corrected. | D29 |
| Section 13 MVP | Storage-charter flow, furnishing count, entitlement flow and the ledger price question replaced. | D1, D29, D31, D38, D50 |
| Section 14 roadmap | Phases 0 to 4 replaced by waves A to E plus 44a and 44b. | D68, D73, D74, D75 |
| Player deck | Every removed or narrowed promise carries its decision (trophies D48, placement D43/D44, channels D53, garden D52, Strongbox D47, prestige D63, prepay D32/D37, Call D29/D34, absence D35/D36, plinths D55, Hall Fund D54, projects D56, wards D57/D51, Endeavors D58, Showcase D59, guest books D60, checkout D27/D29/D31, deeds D64/D65, busy retry D50, offline Inn D16/D28/D45). | as listed |
| Six research appendices | Body bullets rewritten after capture stand beside the restored original under a "Superseded 2026-09-06 by D<n>" marker; the section 12 rulings and the mandatory sections remain checkable against 383fd7da83. | D1, D62 and the decisions each marker names |

The 2026-09-06 review (P3 F1) found this propagation undisclosed; the disclosure above
and the matching note in the proposal status block and housing-research/README.md close
it. A reader who needs the adopted 2026-09-05 wording reads revision 383fd7da83.

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

## Independent review and repair round (2026-09-06)

A fresh independent review read the whole packet at 1527f1c1ca (feature/freeholds, clean
tree) after the settlement commit: twenty read-only lanes (anchors A1/A2/A3, deck DK,
legal and platform L1, product coverage P1, structure P2, proposal rewrite P3, server
lanes S1a/S1b/S2/S3/S4a/S4b/S5, UX lanes U1/U2a/U2b/U3 and the wave-close lane W1) over
the 124 packet artifacts (the two JSON manifests included), the proposal, the deck, the
housing-research README and its six appendices, and the six handoff drafts, each opening
the cited repository sources and the release branch for drift. Ten adversarial verifiers
(V1 to V10) re-opened every cited line and either confirmed, downgraded, widened or
refuted each finding; the consolidated verdict table is the review's MASTER record.

After adversarial verification the review carried 7 blocking, 139 should-fix and 167
nice-to-have findings (9 refuted, 4 informational), each kept at the verifier's severity
and corrected line numbers. The blocking findings were the wave A and E publication arms,
the visitor friend-admission fact, the Hall Fund end-of-life disposition, the keep-forever
guild history against hard delete, the war table client seam, the default Inn Room record
that only 07 created (D81), and the buyer-capacity precondition of the deed contract.
Every decision gap the review exposed is recorded as D76 through D93 (state.md "Settlement
round 2", ruling sheet R47-R64) with its recommended disposition applied throughout the
packet and its word column awaiting Fernando's word; the fix round's own coordinator
ruling D93 (R64) settles the second home's upgrade path at ceil(1.5x) with no second-home
upgrade refusal; no D1-D75 or R01-R46 row was reopened.

The repair round applied every confirmed finding, including nits: wave one corrected the
56 implementation/QA pairs, the art brief, the six drafts, the proposal, the deck and the
appendices; wave two corrected the shared controlling documents (state, ruling sheet,
README, progress, plan, checklist, audit record, content manifest, workbook, brainstorm),
the UX specification and the two regenerated manifests, with cross-file requests exchanged
in writing so that every deliverable list, reviewer roster, test list and cited count
agrees with the file that owns it. The fix round is documentation only: no implementation,
asset, database workload, push, PR or external delivery occurred. The round is complete
and awaits the fresh review of the fix round required by implementation-plan.md and this
record before any further status is claimed.

The next implementing session starts with [the foundation starter](phase-01-foundation.md):
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-01-foundation.md`.
