# Freeholds and Guildhalls: whole-feature integration matrix

Run this matrix at 20, 27, 33, 39 and 44 over each full wave, including every suffixed pair;
44 also runs the complete-program matrix. The settlement audit validates the unbuilt
packet's contracts, links, anchors and review findings; it does not run or claim future
feature behavior. Record each actual command, exit code, executed/skipped status and
artifact path in progress. A required check that could not run is not a pass.

## Evidence floor

- Run the implementation's scoped suites and node scripts/gate_select.mjs before calling
  implementation ready; npm run gate is the deeper option. ci:changed/CI/Stop/reviewer
  output never replaces shared tests, typecheck, builds, i18n or security checks.
- Use the canonical root/directory QA contract, .claude/hooks/qa-stop.sh through the
  active runtime's Stop adapter, and git diff --check on exact owned paths. The Stop floor
  checks uncommitted additions including untracked text for forbidden punctuation/emoji,
  .only, debugger and sim random/wall clocks. Passing it is not a runtime test result.
- Every claimed behavior has a decisive assertion, literal expected value and failure
  control. Real-PG requirements set TEST_DATABASE_URL in a disposable private schema and
  verify passing tests actually ran; local gate does not set that variable automatically.
- Every required specialist from implementation-plan finishes. Apply ALL findings,
  including nits, and have a fresh reviewer read the entire fix round. Before settlement
  completion run a fresh whole-packet COVERAGE review and a second fresh fix-round review.

## Shared runtime matrix

| Area | Required evidence | Commands or owning proof |
|---|---|---|
| Facet/hosts/RL | Same IWorld member kinds and command/event behavior in both worlds; headless housing verbs remain excluded. | npx vitest run tests/world_api_parity.test.ts tests/env_protocol.test.ts tests/command_schema.test.ts tests/command_facets.test.ts |
| Pure deterministic placement | Shared bounded geometry/plan, exact-copy placement/session undo/redo, no condition gate or refusal mutation, safe occupied paths. | tests/architecture.test.ts, tests/freehold_layout_core.test.ts, tests/freehold_placement.test.ts, tests/freehold_placement_history.test.ts and tests/freehold_determinism.test.ts owned 08. |
| Server authority | Placement, pay, repair, entry and visits commit under current server authority; client visual preview cannot commit custody or entitlement. | The actual command-frame chain and server refusal/control cases in 08a/12/13/15/18, including forged payload fields; tests/server/freehold_amenities_online.test.ts (owned 12, the spied-pool zero-SQL counter). |
| Wire and consumers | Real raw frame chain, public/private separation, opaque plot IDs, first empty/revision 0 delivery, equal-layout identity change, absent/null/resume/stale-generation semantics; no repeated shared serialization. | tests/freehold_command_chain_online.test.ts, tests/freehold_snapshot_wire.test.ts, tests/snapshots.test.ts and tests/bandwidth.test.ts owned 08a. Fresh ALL_DELTA_KEYS/count/TERSE_TO_IWORLD/source-scrape pins. |
| Persistent ownership | Stable account/plot/public identity, versioned bounds, preserved unsupported/oversized owned data, coalesced admission and cancellation, export/delete/retention/query plans. | tests/server/freehold_db.test.ts, tests/server/freehold_db.pg.test.ts, tests/server/freehold_hearth_db.test.ts, tests/server/freehold_hearth_db.pg.test.ts, tests/server/freehold_persist.test.ts, tests/freehold_state.test.ts and tests/server/main_retention_wiring.test.ts owned 07; fake plus real PG; the D88 per-row-class deletion outcomes. |
| Atomic custody/fences | One global authoritative claim, legacy touch-set lock order and nonce pre-lock, every resource/effect/receipt half or none, discoverable original-key recovery, no client across service IO. | tests/server/freehold_mutation.test.ts, tests/server/freehold_mutation.pg.test.ts and tests/server/freehold_claim.pg.test.ts owned 07a; real competing-process/crash/interleave proof including the ambiguous-COMMIT locked verify, the claim renewer past LEASE_TTL_SECONDS, and character/account deletion while an operation is open, refused with the code character.freehold_operation_open (D88). |
| Account-wide arrival marker | One bounded private account-scoped source preserves first-tier UX across plots and transfers; known-tier bounds, empty legacy default, atomic mark before ACK, unique/FK waits and account-only deletion; no guest/reconnect/replay eligibility; historical firstTierAtAdmission never derives freshArrivalPresentation. New arrivals may welcome, while only the tier winner grants first-tier view; snapshot/resume/replay projection has no fresh directive. | 07b/07c/07a/08a/09 DB, persistence and security review plus real PG/offline/arrival tests; Sim mirror and plot saves are not a second authority; commit-before-ACK loss may skip optional presentation. |
| Developer fixtures | Exact flag and real loopback socket/Host bridge; strict same-origin boolean; failure/cancel preserves ordinary Inn; both permissions; no production/preview endpoint; server dev-save behavior unchanged. The default tier-0 Inn Room record and the D24 dev grant fixture are 05 outputs that 07 persists without changing their identity (D81). A dark realm boots the Sim with freeholdsEnabled false: no gate prompt, furnisher stock or Hearth Key reaches a player, while the offline host stays live (D85). | tests/freehold_dev_authorization.test.ts, tests/freehold_dev_bootstrap.test.ts (NEW in 05), tests/freehold_dev_grant.test.ts, tests/freehold_offline_default.test.ts (both NEW in 05 per D81, extended in 07 with the persistence arm), tests/vite_dev_watch.test.ts, tests/dockerignore_context.test.ts and actual flag-off/on/build/preview browser fixtures owned 05/07; the flag-unset server test owned 01/03/06 (D85). |
| Condition and Ledger | Realm-week shared produce-inclusive approved schedule; source mode agrees with affordance/confirmation/deduction; immutable prepay, prior absence/grace, suspension and boundary 30; no debt catch-up or loss. Every day-rollover fact keys on the realm day resetDay and the Tuesday week anchor (ledgerWeekOf), epoch-ms fields are display-only (D84). | 13's exact calendar/ledger/PG suites (tests/server/freehold_ledger.pg.test.ts owned 13, PG-armed), service upkeepSuspensions contract and 20 calibration evidence; 25a extends the twelve-week boundary through the thirteenth refusal behind the signed CAL-LEDGER-A and the 13a calendar-authority acceptance. |
| Money and platform | All three cumulative gates and service-only price math; full denied submodels/handlers/catalog/DOM/error/aria absence as a runtime contract, with purchase code and English keys dormant in every bundle (D86); exactly two HudFeatures rows, housing use gated by the server entitlement through the facet (D91); native server entitlement independent of optional chain; opaque verified service authorization. | tests/distribution_surfaces.test.ts and tests/freehold_store_gates.test.ts owned 14, tests/client_shell.test.ts and 15/21/29/32/37/38/40/42 real service/PG recovery proof, paired QA and handoff-ready artifacts whose acceptance status is recorded as an unsigned release gate unless a signature artifact is on file. |
| Content and protected inputs | Exact approved output/acquisition inventory, Hearth full consumer contract without phantom cap, no power or protected keystone/intermediate/catalyst input; zero new farm beds and unchanged craft/station/training rules; the dye picker is the home apothecary station amenity, no new amenity kind, slot or station GLB (D90). | tests/freehold_content.test.ts owned 03, tests/provisioner_firewall.test.ts, tests/professions_farming.test.ts, tests/professions_zone_rollout.test.ts and each content phase's pinned channel/recipe suites. |
| Ownership and classic fidelity | Condition zero preserves entry and decoration; no upkeep-driven repossession or removal. Approved owner operations retain exact custody. Vocabulary follows research.md section 12 ruling 9 (the phrase real estate never ships), tier budgets/plinths/visitor caps match state, existing feast behavior is unchanged. | tests/freehold_condition.test.ts owned 13, tests/freehold_content.test.ts owned 03 and the actual custody tests; rg -n "real estate" src/ server/ public/ yields no shipped product match, while docs may state the naming rule. |
| Content obligations | Every shipped ID has final art/provenance, names/originality, deeds/Reliquary/source discovery, wiki and required M16 fills; patterns/trophy records do not receive furnishing pages. | tests/item_icons.test.ts, tests/item_art_consistency.test.ts, tests/deeds_content.test.ts, tests/reliquary_content.test.ts and tests/guide.test.ts; content reviewer and final art manifest. |
| Trophies and visits | Account-wide source-complete truthful provenance and unknown/history/spoiler arms; generic-to-final timing; offline-owner visits, fresh ACL/revocation, all owner sessions excluded from guest count, read-only guests. Friend admission is the named owner character's outgoing friend list, a block row on either side refuses, and the friendAdd/friendRemove/blockAdd mutation hook busts the projection and rechecks ejection (D76); guild-owned plots admit current members and take only guild, public or private policies (D77). | 17/18/23/26 actual account/PG/two-client tests and screenshot states; guest ghost/history/material/identity privacy checks. |
| Guilds and wards | Rank and own-member plinth custody, guild-at-clear proof, service-owned pooled ledger, atomic caps; bounded unique ward allocation/admitted occupants; permanent Favor and deduplicated awards. Recording capacity never refuses join, dungeon entry or respawn and records an auditable clear-not-captured gap instead (D83); disband is the tombstone disposition behind the beginGuildBankDelete guard at both deleting call sites, with the captured public-name snapshot beside the nullable earned_by FK (D79); the Hall Fund end-of-life refund and the officer withdraw-to-guild-bank verb (D78); the first-kill projection rides 30a's bounded sibling read with no facet member (D82). | 28 through 35 plus 28a/30a/32a exact PG race/plan/replay and live authority tests; no stale cached authorization or graphics culling of admitted occupants. |
| Social, sale and sharing | Realm-season vote identity, transactional capped reactions/retention, current privacy; exact furnished-sale/custody manifests, per-asset authority; buyer capacity at a tier-0 index 0 or a free index under 42's cap, the literal freehold.deed.buyer_capacity refusal, the seller's fresh tier-0 record and Favor awards travelling with the stable plot ID (D80); the D88 per-row-class deletion policy and open-operation deletion refusal; bounded share codec and existing-copy application, independent second plots/shared Hearth. | 36/37/38/41a/42 real concurrency/recovery/custody/privacy tests and territory/authority acceptance recorded as an unsigned release gate unless a signature artifact is on file. |
| i18n and tooltips | Every visible sink uses exact English housing or existing shared namespace; numbers/dates use formatter with realm calendar; tooltip live mechanic/source; no casual locale/generated edit; hudChrome.housing.* as pinned by ux-spec and the key manifest is the only key family, title case on window/tab/button keys and sentence case elsewhere, and every UI phase regenerates the manifests with its own keys (D92). | npm run i18n:gen; tests/i18n_completeness.test.ts, tests/localization_fixes.test.ts, tests/api_error_code_parity.test.ts and tooltip review. |
| Render and physics fairness | Same colliders at all presets, exact claim/generation teardown, initialized model registry; scheduler/prewarm and global live light budget, LOW iOS/pressure fallback; no loss of actionable ghost/bounds/reason/identity. | 10's rift/collider two-host suites, tests/renderer_compile_gate.test.ts, tests/point_light_budget.test.ts, tests/monolith_budget.test.ts; npm run perf:tour and npm run asset:budget when applicable. |
| First moment, input and sound | Safe structural reveal, zero extra ordinary online cosmetic wait, prepared readable optional-art fallback; first-tier versus return/visitor camera table, immediate input with safe director blend, sampled/mute-respecting cue deduplication. | tests/freehold_arrival.test.ts owned 09, tests/teleport_camera.test.ts, tests/camera_director_core.test.ts, SFX manifest/check and actual audio/composed-input evidence; screenshots alone cannot prove audio. |
| UI and screenshots | Actual shared family/tokens, companion arbitration, object selection, keyboard/focus, tap-only/pad and safe areas; all transient states have unique one-capture/one-image variants, exact art-only diff selection. | 09/11/16/17/18 registry/helper entries and ux-spec expanded manifest; node scripts/pr_screenshots.mjs; node scripts/mobile_input_zoom_check.mjs; real composed pad/touch tests and LOW device evidence. |

Account Hearth uses 07/07a's one account participant, including cross-alt/process/
destination PG races and export/deactivation/restore/transfer exclusions. Cached plot
mirrors never authorize or reset cooldown. Physical/refused/already-home entry spends
none. Build presence uses 01/08/08a's set_freehold_build_presence command and public
isDecorating only; two-client cleanup/reconnect/stale/permission/private-field proof is
required. All findings including nits close with fresh fix review; no deferred-nit PASS.
Progress rows carry named unsigned release gates; the packet defines no deferral record.

Capture acceptance is staged: 09 proves 12 real day/night room variants; 11 proves 89, 16
proves 178, 17 proves 226, 18 proves 330 and 20 verifies the wave A 330. Later producers
extend the registry to 733 (21 348, 23 357, 24 399, 25 437, 26 455, 30 493, 30a 511, 31
517, 34 535, 35 553, 36 595, 38 639, 40 654, 41 672, 41a 696, 42 733), each wave close
verifying its union. All scenes have an exact fixture and asserted state; no early target
pretends that later UI exists. The key inventory is 557 English keys, each with one owning
phase in ux-key-manifest.json. Baseline mobile evidence is Chromium with iOS-profile
emulation; Android requires an explicit profile variant and neither proves a physical
device.

## Wave and artifact acceptance

| Close | Required scope and handoffs |
|---|---|
| 20 | All 25 Wave A pairs including 07a/07b/07c/08a/13a. Exact desktop 1600x900, compact 874x402 and tablet 1180x820 baseline sizes from state, all UX target variants and per-input/theme/motion/LOW/denied cases; final art, sampled audio, two-client authority and real PG. Initial service/counsel/Terms/listing gates recorded handoff-ready with unsigned release-gate status unless a signature artifact is on file; the lifecycle/rollout artifacts (persistence-rollout-contract.md, lifecycle-policy-binding.md, lifecycle-db-contract.md, upkeep-calendar-db-contract.md) named as unsigned gates with the mixed-release and rollback statement; the four-week calibration report at ledger-calibration-report.md and the every-second-release budget review at housing-budget-review.md. |
| 27 | All Wave B pairs including 25a; final expanded furnishings/trophy art, shared typed surfaces, immutable prepay/Fenbridge and current-authority visiting. |
| 33 | All Wave C pairs including 28a/30a/32a; guild authority/Fund/custody, recorded first kills, boards, projects/direct vault and handoff-ready fee/bill/art artifacts whose acceptance status is recorded as an unsigned release gate unless a signature artifact is on file. |
| 39 | All Wave D pairs; bounded ward/social PG proof, deed/territory/irreversible-authority artifacts handoff-ready with unsigned release-gate status unless a signature artifact is on file, exact sale custody and native-independent entitlement. |
| 44 | Wave E integration through 44 QA including 41a; complete-program runtime matrix; 44a/44b remain mandatory afterward; no new professions, existing-craft handoff, every durable UX/decision/content/numeric/art/audit/external source preserved. No automatic cleanup or publication. |
| 44a | Codex inventory and replacement of every feature-created placeholder icon/image, existing provenance pipeline, all affected UX/LOW screenshots and zero unexplained residuals. |
| 44b | Completed-feature Terms/legal/service/platform/territory revisit; concrete legal-team bundle/cover note, truthful delivered/accepted tracking, final chain/preservation audit and paired QA. Earlier release gates remain mandatory. |

Every close (20, 27, 33, 39, 44) STOPS and asks for the push go and ends at "pushed,
green, ready for review" or "matrix green, awaiting push go" (D87); its QA records PASS,
awaiting publication, when no go is recorded. Use README's six exact external handoff
paths. Legal, Terms, territory and service signature/publication fields remain unsigned
until their actual owners accept them; that does not reopen a product question or imply
approval. New balance inputs require
an exact signed workbook row before runtime activation. Deliberate omissions must match
state, proposal/deck and every dependent implementation/QA.

## Packet-only settlement checks

Validate the actual complete file set, including all twelve suffix pairs, ux-spec and
the JSON key/shot manifests. No scratch-only file counts as an applied deliverable. README
links and every pair must resolve, all STEP 0..7 appear once in every starter prompt, every
STEP 7 follows the exact ordered chain, and every implementation has at most five genuine
outputs. Recheck paths and exported symbols against the synced tree, distinguishing
explicit NEW names. Reconcile all decisions/rulings, source promises, numeric/artifacts,
reviewer triggers, money gates and screenshot/key inventories across every file.

The parent performs fresh whole-packet COVERAGE review, applies every finding including
nits, and obtains a second fresh fix-round review before the final lint/anchor/copy/Stop
checks and local scoped commit. A preparatory scratch review is not either final review.
Record exact commands/outcomes and any unavailable required evidence without inventing
runtime passes. Keep the branch local, preserve all durable contracts, and report the
full next implementation path to phase-01-foundation.md after this audit finishes.
