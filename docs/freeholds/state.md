# Freeholds and Guildhalls: cross-phase state

Only what the next session needs. Update at the end of every phase and QA.

## Worktree, base, and merge-forward
- Worktree: `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`
- Branch: `feature/freeholds` (LOCAL; see "Push policy").
- Base at packet creation (2026-09-05): the head of open PR #3872
  (`origin/feature/masterwrought` at `0f53c92ff7`, Masterwrought crafting and Farming,
  itself based on `release/v0.42.0`). The packet tip carries three cherry-picked docs
  commits (the proposal, the deck and index, the feature-plan skill refresh) on top.
- Current sync (2026-09-07): PR #3872 is MERGED at `6111e6d206`. The newest
  fetched release is `origin/release/v0.42.0`; merge `7f4fe99619` integrated it
  locally. No `patches/` path changed. Future starts fetch with prune and merge
  the newest `origin/release/**`, then audit any non-empty merge.
- Push policy: the branch stays local until Fernando says to push. Pushes go to `origin`,
  never a fork. A PR is opened only by a wave close phase (20, 27, 33, 39 and 44: one PR
  per wave under D12, owned for every wave), after the whole-feature matrix, and only
  after the push is sanctioned; each close STOPS and asks for the push go and otherwise
  ends local at "matrix green, awaiting push go" (D87). Every close and its QA end in one
  of two states, "pushed, green, ready for review" or "matrix green, awaiting push go";
  the QA records PASS, awaiting publication, when no go is recorded. Never merge a PR
  from a session.

## Current phase
04 is complete including its reconciled paired QA: **PASS, local**, 2026-09-07.
Four findings were found and resolved: three source/test findings and DOC-1,
a documentation nit. The source/test repairs span `0932963250..69ffdab561`,
in commits `d5ea0825d1` and `69ffdab561` (five files): HN1 restores every
content barrel route, including the recipe catalog; COV-1 strengthens full-state
dark-refusal assertions; and PER-1 verifies the authored furnishing/pattern cohort through lit, dark, and
relit JSON saves. No finding or nit remains deferred. The independent
[fresh entire-fix review](crafted-qa-reconciled-2026-09-07/reviews/fresh-fix.md)
and its supplement returned PASS after inspecting all current changes and the
six historical repair commits. Simulation-architecture review also passed after
its additional HN1 recipe-catalog occurrence was repaired. That occurrence is
included in HN1, not counted as a distinct finding. The final shared gate exited 0 with all twelve steps green. Unit coverage passed 4028 files and 60610 tests; Chromium passed
47 files and 389 tests. The single skipped CI-sentinel file, two expected failures
and 28 explained skipped cases are disclosed in the current validation record.
The separate PostgreSQL 16 run passed 57 tests, including the opt-in SQL cases.
No furnishing acceptance case was skipped.

The active user request preserves `evaluateCraftAdmission`, `resolveTrain`, and
existing station, training, and economy semantics while permitting the existing
availability seam. Both complete declarations remain byte-identical from
`86eb86bbe2^` through `69ffdab561`. This explicit scope closes F01 prospectively;
it is not a numeric signature or a rewritten historical QA verdict. The earlier
29-found/28-repaired FAIL remains preserved in the historical receipt below.

See [current validation](crafted-qa-reconciled-2026-09-07/validation.md) for exact
commands, outcomes, source comparisons, PostgreSQL and mutation evidence, and
[findings](crafted-qa-reconciled-2026-09-07/findings.md) for all four closures.
DOC-1 corrects the validation and copied context wording
to match the retained receipt: ten rows times five Boolean fields equals 50
calibration checks, not 60. The [documentation review](crafted-qa-reconciled-2026-09-07/reviews/docs-final.md)
records that correction; the three-source-finding review chronology and the
two source repair commits remain unchanged.
The actual post-last-commit `npm run ci:changed` remains the coordinator's final
execution step, with commit and outcome recorded in the final handoff and local
receipt. No prior source check pre-certifies that execution.

The four original content commits, accepted development calibration, and final
icons are reused. No asset was generated in this QA. `productionApproved` remains
false; final-model, room/arrival/navigation, hardware LOW, and production numeric
gates retain their existing owners. The branch remains local; 05 is next and has
not started.

### Historical paired 04 QA receipt

The paired 04 QA verdict was **FAIL, local**, on 2026-09-07. Its audit found 29
distinct findings: 28 repairs applied and independently accepted, with F01 open
under the then-current whole-directory prohibition. That historical requirement
conflict and verdict remain recorded in the original findings and review receipts.
The prospective reconciliation above does not claim that historical QA passed.

The original accepted development implementation remains snapshot `3666d89647`,
with commits `86eb86bbe2`, `8bd097d898`, `b3c2452b49` and `3666d89647`. Its exact
accepted calibration SHA-256 is
`c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`.
The signed calibration, original twelve-step gate and 42 runtime captures remain
in `crafted-content-trial-2026-09-07/acceptance.md` and
`crafted-content-trial-2026-09-07/implementation-validation.md`; they are
historical implementation evidence, not substitutes for this paired audit.

Paired QA integrated dependency `54ce808436` through `2e24ba8818` and applied
`ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7` and
`b379ee462d`. Final source verification at `b379ee462d` passed all 12 shared-gate
steps, exit 0: 4,028 unit files and 60,594 tests passed, with two expected failures,
27 existing case skips and no skipped suite; shared Chromium passed 46 files and
385 tests. Typechecks, builds, security, SFX and generated freshness passed.
The explicit wiki/i18n owner commands also exited 0 after the gate, with a clean
generated-source diff. The final combined presentation run captured all 11 frames
and exited 0; independent frontend review accepted the final guide/manual evidence.

The distinct fresh full qa-checklist/whole-fix reviewer inspected all 80 files in
`2e24ba8818..b379ee462d` plus merge evidence, including touch feedback, locale
seeds and the five later gate-repair findings. Its final receipt is
[qa-checklist-final.md](crafted-qa-2026-09-07/reviews/qa-checklist-final.md), distinct
from its earlier database-only review. Exact commands, failed attempts and final
outcomes are in [validation.md](crafted-qa-2026-09-07/validation.md); all 29 findings
are in [findings.md](crafted-qa-2026-09-07/findings.md). F02 through F29 are accepted;
technical approval does not resolve F01 or turn the paired QA verdict into PASS.

`GATE_SELECT_BASE=54ce808436 npm run ci:changed` exited 0 after source commit
`b379ee462d`. Its required replay after the separate verdict/evidence commit is
still the coordinator's final execution step; it has not yet run and is not
claimed here. The branch remains local; no push, PR merge or production activation
occurred. `productionApproved` remains false. Production numeric, final GLB, room,
arrival/navigation and hardware LOW gates retain their existing owners. No asset
was generated in this QA.

### Current next step

Reconciled paired 04 QA passed. Implementation 05 has not started; run:
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-05-instance-claim.md`.

Previous phase 03 (`phase-03-content-tiers-and-basics.md`): COMPLETE INCLUDING QA,
verdict PASS locally on 2026-09-07. All 39 distinct completion-round findings
are resolved; fresh repair and final record reviews pass. The shared gate passed
all twelve steps, with 57726 unit tests and 376 browser tests passing.
Fernando accepted the exact trial in `content-trial-2026-09-07/acceptance.md`.
The twelve-bill version, eight furnishing records, gated `freehold_furnisher`,
actual `hearth_basics`, manual Homesteader rewards, art and localization exist.
Production remains disabled. Final production calibration, shipping models,
room/LOW evidence and the explicitly deferred NPC voice remain named gates.
See `content-final-validation-2026-09-07.md` and the current 03 ledger notes.
Its completion source commits are
`a6bf26fad9`, `9121f0d94f` and `e1be875782`, followed by this final evidence
closeout. The post-source-commit check passed; the task handoff records the
repeated `ci:changed` result after the actual final commit and clean status.
No push or merge has occurred.

Previous phase 02 (`phase-02-furnishing-item-kind.md`): COMPLETE INCLUDING QA, verdict PASS
locally on 2026-09-07. All 40 distinct findings have independently
reviewed repairs and evidence at `d386635394`. The fresh reviewer read all 110
changed files and all four repair commits, with source PASS and zero open
source/test findings. The final shared gate completed with actual exit 0 and all
12 steps green; standalone i18n generation/status and source freshness passed.
Final verdict documentation and the completion checklist were independently
reviewed with PASS. The actual post-commit check at verdict commit `c881543258`
passed with exit 0 and clean status. It will run again after the evidence-only
amendment; see `progress.md` row "02 QA" and
`furnishing-item-kind-qa-validation.md`.
The QA dependency sync merged PR #3872 head `d3dcdaa4af` through merge commit
`041fd790ce`; the PR was still OPEN at that historical checkpoint. The current
merged-release sync above supersedes that dependency status.
Phase 01 remains COMPLETE INCLUDING QA, verdict PASS (`c946091c07..2e247df270`). Its QA
round's own detail is in `progress.md` row "01 QA"; do NOT re-run that audit or re-raise
its judged findings. R01-R46 and D73-D75 are approved;
D76-D93 (settlement round 2, R47-R64) were approved by Fernando on 2026-09-06 with the words
"approve all recommendations R47-R64"; the review-fix round is applied across the packet,
freshly reviewed and committed locally. Implementation 05 and subsequent
work remain unbuilt; the branch stays local.

## Settle audit facts (verified 2026-09-05 and 2026-09-06)
These facts were recorded before dependent implementation instructions changed. They
describe the audited tree and primary evidence, not additional balance rulings.

- Preflight: the worktree was clean at `7d140843d2e6804d3245b1c5c09990ca1da6a407`.
  PR #3872 remains OPEN, with no merge timestamp, targeting `release/v0.42.0` from
  `feature/masterwrought`. `git fetch origin --prune` passed and
  `git merge origin/feature/masterwrought` reported `Already up to date.` The dependency
  block above still applies. No non-empty merge or `patches/` change occurred, so neither
  the release-merge audit nor a dependency reinstall was triggered. Nothing is built.
- Propagation disclosure: the proposal (`docs/prd/woc/freeholds-and-guildhalls-research.md`),
  the deck and the six housing-research appendices at HEAD are the settled propagation of
  the text adopted on 2026-09-05 at revision `383fd7da83` (the `FernandoX7/add-real-estate`
  head), edited in place on 2026-09-06 to carry D27-D93; the adopted text lives in git
  history at that revision and `audit-record.md` carries the section-level disclosure.
- Paid-operation authority: `server/storage_purchase_db.ts` documents and implements
  durable exactly-once authority in `storage_purchase_applied_receipts`, outside the
  character-blob and character-deletion lifecycle. `appliedStorageKeys` only protects
  the live sim apply; an older binary can strip it on save. A housing transaction must
  use the durable-receipt contract as its exemplar, including a fingerprint, refusal of
  consumed-key replay, and atomic durable effect/receipt handling. The bounded blob
  list is not an exactly-once authority or an adequate retention policy.
- Database admission: `createBackgroundDbGate` in `server/background_db_gate.ts`
  exposes `configuredHeadroom`, not reserved interactive capacity. Ungated work shares
  the pool, and `acquire()` has an uncapped FIFO waiter map. A housing producer must
  specify its own bounded pending work and coalescing/admission behavior; citing the
  existing gate alone does not establish bounded memory or a reserved pool partition.
  `createKeyedSerialWriter` in `server/serial_writer.ts` likewise supplies FIFO order
  and pre-start cancellation, without a queue-depth cap or autosave coalescing.
  `runPeriodicSaveFlush` in `server/periodic_save_flush.ts` explicitly does not make
  its separate writes atomic; grouping calls there cannot protect a housing/inventory
  transfer from a crash between commits.
  `beginCharacterSaveTx` in `server/character_save_transaction.ts` owns transaction
  setup and statement, lock, idle and transaction deadlines. It does not own the
  composition of durable effects or establish a safe lock order by itself.
- Save composition facts: the direct save siblings in `server/db.ts` take account
  locks, call `runFencedCharacterUpdate` for the explicit character pre-lock and
  nonce-fenced update, classify/write bank-ledger receipts, then write the applicable
  market/mail effects, sorted guild-bank receipt replay, storage effects and custody
  tail before commit and the deferred growth guard. Preserve each sibling's actual
  touch set and order; do not replace this with a generic "operation receipts last"
  instruction. `server/character_save_statement.ts` documents the separate carried
  InitPlan fence race in `saveCharacterStateOnClient`: that helper still issues a
  plain fenced update without the pre-lock, so it is not a safe shortcut for a new
  housing transaction. Housing's named composition seam must explicitly pre-lock and
  nonce-fence the character update while preserving legacy touch sets. Its acceptance
  artifact must map the precise lock/effect order and prove the refusal/interleaving
  behavior in PostgreSQL; the existing deadline helper does not supply that proof or
  repair the recorded race.
- Existing-anchor corrections verified by the tree sweep: the barrel/local-guidance
  exemplar is `src/sim/pvp/index.ts` with `src/sim/pvp/CLAUDE.md`; the cited rift
  equivalents do not exist. Fenbridge layout and station exports are
  `FENBRIDGE_LAYOUT` and `FENBRIDGE_STATIONS_BY_ID` in `src/sim/fenbridge_layout.ts`,
  not a `src/sim/content/fenbridge/` directory. `WocMarketService` is exported by
  `server/woc_market.ts`, not `server/woc_market_service.ts`. Number/date/money
  formatters come from `src/ui/i18n.ts`, not a `src/ui/i18n/` directory.
  `FINDER_ACTIVITIES` is exported from `src/sim/content/dungeon_finder.ts`;
  `DUNGEON_FLOOR_Y` is exported from `src/sim/data.ts`.
  `authoredLiftAt` is exported from `src/sim/rift/authored.ts`;
  `src/sim/dungeon_layout.ts` imports and calls it, rather than owning its export.
  `GroundAimReticleView` belongs to `src/ui/hud/action_bar/ground_aim_controller.ts`;
  the render visual owns `GroundAimVisualState` and the render core owns
  `GroundAimGeometryState`. The `server/ws_auth.ts` injection is
  `bankBonusForAccount`; `server/main.ts` binds it to `bankBonusFactsForAccount` from
  `server/db.ts`. Preserve that injection distinction when describing housing joins.
- Endpoint scaffold contract: `scripts/new_endpoint.mjs` generates
  `server/<domain>.ts`, `tests/server/<domain>.test.ts` and the authenticated GET
  error `<domain>.invalid_input`. The planned housing command is
  `npm run new:endpoint -- --domain freehold --method GET --path /api/freehold`.
  The chosen `server/freehold_routes.ts` and `tests/server/freehold_routes.test.ts`
  names require explicit moves plus registry/test import updates after generation.
  `freehold.disabled` is a separate append-only error/catalog/API-key/parity addition;
  keep the generated `freehold.invalid_input` entry. The scaffold does not create
  those chosen filenames or a disabled error automatically.
- Monolith audit: no coordinator ceiling changed during base sync. The live
  `tests/monolith_budget.test.ts` pins remain the authority. The packet's named large
  files have no slack except `src/sim/colliders.ts`, which has some existing slack;
  none may grow beyond its pin, and the module-first extraction rule still applies.
- Mount-catalog drift: the old "six mounts" instruction does not cover the current
  catalog. `src/sim/content/mounts.ts` exports `MOUNTS`, its derived `MOUNT_KEYS`,
  `MountKey` and `DEVELOPER_MOUNTS`; the developer list explicitly identifies mounts
  without a player-facing acquisition path. A trophy-family source sweep must use
  the live exported roster, current acquisition/discoverability and owned-state
  contracts, and an explicit developer-mount exclusion/availability rationale. A
  historical literal count neither defines the eligible roster nor establishes that
  every catalog entry is normally obtainable.
- Material-tier facts: `MATERIAL_GRADES` in
  `src/sim/professions/material_grades.ts` contains node-material grade pairs only at
  `gatherTier` 1, 2 and 3; its upper live fine IDs are `fine_thorium_ore`,
  `fine_elderwood_log` and `fine_sunpetal_herb`. There is no tier-4 node fine-grade row.
  `FARM_CROPS` in `src/sim/content/farm_crops.ts` does contain tier-4 produce. Its crop
  tiers, the node-gather tier ladder and `MATERIAL_TIER_BY_ITEM` price bands are
  distinct sources. Future upgrade bills must cite actual exported item/grade records
  and must not invent a tier-4 node material from the proposal's shorthand.
- Offline dev-authorization facts: `src/main.ts` constructs the offline `Sim` with
  `devCommands: import.meta.env.DEV`. The server boot mapping lives in
  `server/sim_boot_config.ts` and reads `process.env.ALLOW_DEV_COMMANDS === '1'`.
  `vite.config.ts` supplies no bridge carrying that server environment flag into the
  offline browser constructor. The online `devCommandsAdvert()` only reveals a HUD
  surface whose commands remain server-gated; it does not authorize the offline Sim.
  D3/D24 therefore cannot cite an already-existing browser flag bridge. A housing-only
  dev-build and loopback authorization bridge would be NEW implementation, or the
  fixture must exercise the actual dev-authorized server. These are implementation
  remedies to specify, not a claim that either is already built or a new product ruling.
- Arrival and camera facts: `arrivalRevealSettleMaxMs` in
  `src/game/arrival_warmup.ts` returns zero for ordinary online cosmetic settling;
  the distinct first-spawn establishing-shot exception is not a housing-entry
  permission to hold a live character behind a cosmetic curtain. In
  `src/render/camera_director_core.ts`, `cancelCameraDirective` starts release state;
  `stepCameraDirector` blends out through `DIRECTOR_RELEASE_TIME`. An immediate
  cancellation request is therefore not an instantaneous snap to zero directive
  weight. Preserve the actual shared envelope when describing interruption.
- Gamepad focus facts: `Hud.isWindowOpen()` in `src/ui/hud.ts` sees the topmost visible
  `.window.panel`; `src/main.ts` passes that result into
  `shouldUseGamepadPointerMode` from `src/game/gamepad_pointer_mode.ts`. The pointer
  arm in `src/game/gamepad.ts` clears pad movement and skips camera/ability dispatch.
  `src/game/dpad_focus_nav.ts` uses `data-pad-nav-root` only for standalone navigation
  fallback after open windows. Adding that attribute to a visible `.window.panel`
  does not exempt it from pointer-mode suspension. A housing build-input contract
  must name its actual window/mode integration instead of claiming the attribute alone
  preserves movement.
- Distribution authority boundary: D9 describes the game's client presentation map.
  Current `server/claudium.ts` and `server/claudium_proxy.ts` authenticate the account
  and send service-owned spend requests; no housing distribution-eligibility contract
  exists in those sources. A local client capability verdict is not authenticated
  service-side purchase eligibility. The new service contract must state where
  trusted distribution eligibility is established without treating a client-supplied
  distribution label as authority or importing distribution policy into the sim.
  This identifies the missing boundary and does not rewrite D9's product surface map.
- Design rollout: `DESIGN.md` is the adopted target; its foundation is not shipped in
  this tree. `src/styles/tokens.css` still declares Cinzel as `--font-display`, and
  `src/ui/theme.ts` still carries classic accent `#ffd100`, border `#6f5a2a`, panel
  `#15151f`, text `#f0ebd8` and muted `#998d6a`. Gold-ramp ornament tokens exist, but
  many adopted ink, theme, motion and radius tokens do not. The adopted Alegreya
  heading target supersedes the proposal's Cinzel heading suggestion; the housing
  packet must distinguish target design requirements from currently resolving tokens
  and must not represent the coordinated global foundation as completed work.
- Interior light facts: the proposal's three authored room emitters cannot promise
  three contributing point lights on every LOW phone. `src/render/gfx.ts` derives
  `GFX.maxPointLights` from the platform/memory profile, including two on iOS, and
  `src/render/renderer.ts` can reduce effective contributors further through the live
  lighting budget while preserving the fixed count with zero-intensity pads. Its
  existing `applyStateLightRig` interior path skips LOW. Housing's LOW grade/fallback
  therefore needs explicit acceptance evidence; visibility of the room and actionable
  ghost/blocked boundaries cannot depend on an ornamental light retaining a slot.
  `src/render/point_light_budget.ts` and the `FireLightSink` registry/adopter remain
  the live light-budget and lifecycle authorities.
- Distribution facts: Apple's current [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
  include an IAP requirement for multiplatform game items under 3.1.3(b) and separate
  NFT/external-purchase rules. A use-only account entitlement and neutral website label
  are therefore not proof of native approval. Google's [blockchain policy](https://support.google.com/googleplay/android-developer/answer/13607354)
  requires relevant declarations/disclosures and restricts promotion of potential
  returns; this packet's ban on the word "earn" is its stricter editorial choice.
  [Steam onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding)
  prohibits blockchain applications issuing or permitting exchanges of cryptocurrency
  or NFTs. These facts require signed surface/flow review, not a guessed approval.
- External verification limits: the current exact Epic blockchain-policy page was not
  retrievable. The available
  [Epic content guidelines](https://cdn2.unrealengine.com/epic-games-store-content-guidelines-f8accc43356e.pdf)
  require the Blockchain Addendum. The Solana Mobile Publisher Policy is at
  https://legal.solanamobile.com/publisher-policy-web (retrieved 2026-09-06; "Last
  Updated: Jul 21, 2026"; the old solanamobile.com URL redirects there). It is part of and
  subject to the Solana Mobile dApp Store Developer Agreement and carries no purchase, NFT
  or territory rule of its own; the Developer Agreement (current signed text) is a named
  acceptance artifact in the counsel memo and territory schedule. The
  [Solana dApp Store introduction](https://docs.solanamobile.com/dapp-store/intro)
  establishes platform capability, not a housing checkout. A KR-only territory rule,
  blanket Epic link prohibition and Seeker housing-purchase approval were not verified.
- Historical number attribution: [EQ2 GU49](https://www.everquest2.com/news/imported-eq2-enus-1916)
  verifies twelve-week housing/guildhall prepayment as a precedent. Primary sources
  did not verify a Conan protective pause after absence, an ArcheAge weekly gathering
  output share of ten/twenty percent, a second-plot 1.5x multiplier, or a GW2 weekly
  member-donation multiple. Existing proposal values require explicit product adoption
  and the named economy acceptance artifact; none becomes a classic-era fact by citation.
- Optional deed capability: [Metaplex Core](https://www.metaplex.com/docs/core)
  publishes the base-asset cost on its Core page (cited by reference as dated context; the
  figure changes and is never copied into the packet or the code), not the full service
  quote.
  Asset-level [Permanent Freeze Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-freeze-delegate)
  and [Permanent Burn Delegate](https://www.metaplex.com/docs/smart-contracts/core/plugins/permanent-burn-delegate)
  are separate authorities configured at creation. Burn is irreversible and can affect
  a frozen asset; collection-wide freeze cannot selectively freeze one plot. Capability
  does not authorize upkeep loss or establish a legal/territory policy.

- Account lifecycle source facts: `server/db.ts::touchLogin` records account
  authentication in `accounts.last_login`; the private `loginHandler` in
  `server/auth_routes.ts`, wired by that module's exported `routes`, and
  admin/federated authentication call it without requiring gameplay entry. Authenticated
  world admission flows through `server/ws_auth.ts::createWsAuth` into
  the `join` member of the exported `GameServer` class in `server/game.ts`;
  `touchCharacterLogin` separately stamps a fresh
  world entry, while resume skips that stamp. `openPlaySession`/`closePlaySession` are
  asynchronous observations. None defines authoritative account gameplay-presence or
  return-protection policy. Linkdead retains the session until expiry/leave.
- Lifecycle host seams: `server/periodic_save_flush.ts::PeriodicSaveWrites`,
  `PERIODIC_SAVE_WRITE_NAMES` and `runPeriodicSaveFlush` issue each existing periodic
  writer once without awaiting it; they are not a transaction or shutdown drain.
  The `leave` member of exported `GameServer` awaits final character saving before lease release; `saveAll`
  settles attempted saves and catches individual failures. The `server/main.ts`
  shutdown closure drains existing writers before leases and pool closure. No housing
  presence writer exists in those seams; a new subsystem needs explicit wiring and
  captured-observation semantics, not a claim that current analytics supply them.
  The `join` member of exported `GameServer` uses `server/linkdead.ts::planJoin` synchronously; the surrounding
  `server/ws_auth.ts` authentication flow is asynchronous. The current join body is
  not an existing awaited database admission transaction.
- Account removal and export facts: `server/account.ts::handleAccountDeactivate` calls
  `server/db.ts::setAccountDeactivated`, which updates `deactivated_at` without deleting
  the account. Its realm-scoped character list/process-local online check does not
  establish an all-realm offline barrier. The separate
  `server/federated_auth_db.ts::deleteUnusedFederatedProvision` hard-deletes only a
  guarded unused provisioning-race loser. `exportAccountData` explicitly selects
  account-linked rows; `server/account_export_state.ts::projectAccountExportState`
  redacts farm-plot fields and spreads other character state. New account-level housing
  tables will not appear in export automatically; deactivation, restoration, character
  deletion, true account deletion and export are distinct lifecycle paths.
- Rollout capability facts: `origin/release/v0.42.0` contains no Freeholds runtime
  implementation. It was verified at `9e4d12ebd5` (the release head when this fact was
  first recorded on 2026-09-06, the merge of PR #3880); at the review-fix round the head
  was `4e168d1ad7`, 87 commits past the merge-base `1fdf0f55a3`, and it keeps advancing,
  so no revision here is the current tip. Its historical
  `server/bank_ledger_save_effects_db.ts` exports `characterUpdateStatement` at both
  release revisions (line 159 in each); it replaces the whole `characters.state` value. This is a historical export anchor, not a current module
  export claim. In this worktree the extracted
  `server/character_save_statement.ts::characterUpdateStatement` still replaces that
  value, rather than merging omitted JSON keys. An older snapshot writer can remove
  fields it does not emit; merely leaving new normalized tables untouched proves
  neither housing lifecycle behavior nor housing export/recovery compatibility.

- Post-answer base check (2026-09-06): PR #3872 remains OPEN with no merge timestamp;
  `git fetch origin --prune` passed and `git merge origin/feature/masterwrought`
  reported already up to date. No source or patches moved, so no non-empty-merge audit
  or frozen-lockfile install was triggered. The existing dependency protocol remains.
- Guild lifecycle source facts: the exported `PgSocialDb` class in
  `server/social_db.ts` has the point-lookup member `guildMembership`; its `guildMembers`
  path uses the exported `GuildRosterCache` class in `server/guild_roster_cache.ts`.
  The prior cached-roster citation is superseded by this verified owner.
  The `SocialTransport` contract in `server/social.ts` declares
  `onGuildMembershipChanged`; committed handling drives the `GameServer` callback's
  local `guildStampSeq` and the Sim `setPlayerGuildMembership` path. The actual
  exported `stampGuildMembership` helper in `src/sim/guild_bank.ts` remains a source anchor.
  Roster cache is a projection,
  not authoritative current membership or guild gameplay presence.

- Kitchen Garden source fact: `myFarmPlots`, a member of the farming world interface
  in `src/world_api/farming.ts`, projects the current character's `PlayerMeta.farmPlots`
  through `src/sim/professions/farm_projection.ts`; `farm_persist.ts` keeps those rows
  in character save state keyed by bed ID. It is not an automatic account-owner view.
  D52's account-owner tableau therefore needs an explicit bounded source aggregation
  keyed internally by sourceCharacterId plus bedId, without new beds or farming writes.
  The existing Harvest Journal action remains current-character; guests receive only
  the approved safe owner projection. The 24 producer's DB/source/cache/freshness proof
  must establish that new read contract before it is treated as implemented.

- Shared account-source facts: `server/db.ts::listCharactersAllRealms` selects the
  full character `state` and all matching rows ordered by realm and ID. It is not a
  bounded, projected loader for repeatedly opened housing surfaces. The existing
  `src/sim/professions/farm_projection.ts::farmPlotStatus` calls `farmPlotSurvived`
  with source-character farming proficiency, crop tier and normalized plot state;
  survival also depends on the private survival roll, compost and watch fields.
  Bed/crop/timestamps alone cannot reproduce the existing ready/withered distinction.
  17 therefore owns the NEW bounded shared account-source loader; 24 extends its
  static farm projection and removes those private inputs from guest wire. No current
  loader export or cross-realm live freshness guarantee is claimed by this fact.

- First fresh review source facts (2026-09-06):
  `src/sim/deeds.ts::onDungeonFinalBossKilledForDeeds` synchronously mutates each
  credited recipient's clear counters and dirty keys. It returns void; it is not a
  database commit callback. The private `detectActivity` member of `GameServer` in
  `server/game.ts` observes deedUnlocked, appends to the session's actual
  `pendingDeedRecords` field and requests ordinary `saveCharacter`. That save captures
  `recordUpTo` alongside its serialized source snapshot and publishes only the captured
  records after success. There is no existing pendingDeedUnlocks field or dedicated
  all-party dungeon-clear save transaction. 31 must produce its explicit clear-candidate
  capture-to-save bridge without changing recipient credit or claiming party atomicity.
- Screenshot source fact: `scripts/pr_screenshots.mjs` uses puppeteer-core with a
  Chrome/Edge/Chromium executable. Mobile variants default to an iPhone user agent and
  iOS graphics profile; `variant.userAgent` can explicitly override that profile.
  Compact/tablet dimensions alone do not make an Android capture, Safari execution or
  physical-device proof. The baseline is Chromium with iOS-profile emulation.
- Sampled audio source fact: `src/game/audio.ts` exports `GameAudio`; its
  `playFeedback` member is private and honors interfaceSfx. 09 owns the NEW public
  `GameAudio.playHousingArrival` method and sampled housing_arrival cue through the
  existing sound manifest/provenance pipeline; 19 integrates and verifies that output.
- Material source fact: `src/sim/professions/material_grades.ts::MATERIAL_GRADES` has
  nine node-material pairs across gather tiers 1, 2 and 3. Its upper node grades are
  fine_thorium_ore, fine_elderwood_log and fine_sunpetal_herb at gather tier 3; no
  node-material gather-tier-4 fine row exists. `src/sim/content/farm_crops.ts::FARM_CROPS`
  separately defines upper produce and fineProduceItemId rows, including tier-4 crops.
  Blueprint node fine inputs and upper produce therefore need their distinct sourced
  IDs; tool tier, crop tier and node material gather tier cannot be interchanged.
  The earlier verified myFarmPlots fact remains: it is current-character only; the
  NEW 17/24 account source boundary produces the approved owner-account projection.

- API catalog source fact: `src/ui/i18n.catalog/api_error.ts::apiErrorStrings` owns
  English apiError.* leaves and `src/ui/api_error_i18n.ts::API_ERROR_KEYS` maps server
  codes to them. `src/ui/i18n.catalog/hud_chrome.ts::hudChromeStrings` owns ordinary
  hudChrome.housing.* copy. 37's required error-catalog updates are not a runtime
  purchase surface and must use the API catalog owner, matching 01 and parity tests.
  The UX spec and its authored key manifest retain only hudChrome.housing.* player
  copy. Required runtime apiError.freehold.* leaves are protocol catalog mirrors
  mapped through API_ERROR_KEYS, with matching approved English, not a parallel
  housing HUD namespace or extra UX-manifest entries.
- Build-presence disconnect source fact: the public `socketClosed` member of
  `GameServer` in `server/game.ts` rejects a stale socket identity before marking
  its session linkdead. `server/ws_auth.ts` wires close/error into that path; a later
  leave happens only when grace expires. 08 must clear ephemeral editing presence
  inside the accepted socketClosed path immediately, preserving that stale-socket
  guard; waiting for leave would falsely display a disconnected editor.

- Capture fixture source fact: `src/game/daynight_dev_command.ts::tryDayNightDevCommand`
  accepts existing DEV day/night and moon-half presets through chat;
  `src/render/day_night_clock.ts::dayNightPhaseOverride` and `currentDayNightPhase`
  expose their renderer clock state. 09 owns twelve functional room day/night variants
  and the shared helper/import; later UI files extend the same target. No new clock
  storage key, balance time or early nonfunctional UI registration is introduced.

- Fresh anchor verification (2026-09-06): `src/sim/types.ts::SimConfig` is the
  exported constructor configuration consumed by `Sim` in `src/sim/sim.ts`;
  `SimOptions` is not that module's export. `src/sim/sim_context.ts::SimContext` owns
  the existing devCommands context field. 07 adds its housing-only permission through
  SimConfig, Sim and SimContext, preserving ordinary developer-command behavior.
  `server/heavy_self.ts` exports `HEAVY_SELF_CMDS`, `HEAVY_SELF_ARM_MARKED_CMDS` and
  `HEAVY_SELF_EVENTS`; the abbreviated ARM_MARKED_CMDS/EVENTS citation was inaccurate.
  08a must use the full exact exported names and update only the actual dirty-field arms.

- Citation typing verification: `server/game.ts` exports the GameServer class; join,
  leave and saveAll are its members, not standalone module exports. `server/social.ts`
  exports SocialTransport with onGuildMembershipChanged; `server/social_db.ts` exports
  PgSocialDb with guildMembership; `src/world_api/farming.ts` exports IWorldFarming
  with myFarmPlots. `tests/snapshots.test.ts` keeps ALL_DELTA_KEYS and TERSE_TO_IWORLD
  as file-local pins, and `tests/vite_dev_watch.test.ts` keeps defineConfigObject as a
  file-local helper. Their verified ownership is distinct from an export claim.

- Guild-clear admission source facts (2026-09-06):
  `src/sim/deeds.ts::FINAL_BOSS_DUNGEONS` is the current qualifying template census.
  The ordinary clear path uses the existing party/raid recipient snapshot bounded
  by `src/sim/social/party.ts::RAID_MAX`. The exported
  `src/sim/encounters/nythraxis.ts::nythraxisRoomMetas` instead collects every
  non-leaving player physically in the boss room, including former raid members;
  `grantNythraxisLockout` forwards that roster through
  `src/sim/deeds.ts::onNythraxisKillForDeeds`. RAID_MAX and suggestedPlayers do not
  bound this room roster. `server/ws_auth.ts` exempts administrators from its realm
  cap and disables the cap for nonpositive MAX_PLAYERS_PER_REALM, so that setting
  is not a hard source-capacity bound.
  `src/sim/instances/dungeons.ts` owns exported enterDungeon/resetDungeonInstances
  and private claimInstance/freeInstance: ordinary claims, Reset All and the
  developer Ignivar-family replacement mutate different claim/aura paths.
  `src/sim/dev_commands.ts::spawnMobsForDev` can publish qualifying bosses outside
  claims; `src/sim/mob/lifecycle.ts::respawnMob` reuses an entity ID for another
  creditable life, while the private updatePendingMobRespawns member of Sim can
  create replacement entities. Entity ID alone is therefore not a clear-life key.
  `server/sim_boot_config.ts::buildRealmSimConfig` already requires injected
  Materials Vault admission, the existing online composition precedent. The
  ordinary GameServer saveCharacter member, with its captured pending prefix,
  remains the actual save seam; no all-party clear transaction exists. Its existing
  no-state/no-entity arm can return true when the captured storage effects and bank
  ledger snapshot are empty, after capturing recordUpTo, without a source-state
  commit. That legacy boolean alone cannot prove NEW GuildClearSaveOutcome.committed,
  release a captured candidate or authorize an unlock. 31 requires its exact typed
  committed source-snapshot/effect outcome, not the old boolean result.

## Locked decisions
Rulings (proposal section 12, adopted 2026-09-05, never reopened): personal first and
one system; account-level ownership; convert fiat and SOL to $WOC and burn a published
share (counsel and the economy service gate the mechanism); daily wear with a weekly
ledger; land money-only with everything inside earnable plus the free Inn Room; on-chain
deed on demand in wave D, web only; mobile use-only with purchases on the web; the
illustrative price ladder and 25 percent burn share as working numbers; the names.
Additions: the app-store constraint (section 8); produce joins the Ledger; the Kitchen
Garden plants nothing (zero beds); the Master Builder's Call is Claudium-priced.

Original survey decisions D1 to D26 are preserved below as their historical adoption
record. Later explicit decisions refine their scope or timing where noted.

Label legend: C01 and C03 are packet-review finding labels (the C1-C34 series R44 cites)
whose source-reviewed corrections are recorded as the two refinements under
"Source-reviewed Hearth and build-presence refinements" below. Each binds an approved
decision to the reviewed tree (C01 refines D67's shared Hearth cooldown; C03 refines the
visitor experience without renaming a D20 member) and adds no balance constant or new
ruling; the refinement under "Source-reviewed arrival delivery refinement" binds D41 the
same way.

- D1 **Charter purchase shape.** The Freehold Charter is a once-per-account grant the
  economy service records (`owned: true`, the weapon-skin model), mirrored into a new
  `account_freeholds` row by a `configureClaudiumRuntime` hook and healed by the
  `/api/claudium/store` reconcile. It rides the existing `POST /api/claudium/spend` route
  with a game-side SKU allowlist (`src/sim/content/freehold/charters.ts`, the
  `STORAGE_SKUS` twin) and a new spend kind `freehold`. The storage flow's pending-row and
  recovery machinery is NOT reused: a plot is account state, not a live bag mutation.
- D2 **The Inn Room is tier 0 of one ladder.** One freehold record per account. Every
  account holds the free Inn Room (no upkeep, three plinths, a bed); the Cottage is an
  in-place tier upgrade of the same record, and the three plinths' trophies carry over.
- D3 **Offline hosts hold the Inn Room only.** The browser offline world and the headless
  env own the full sim module, but the Cottage tier arrives only as a server-applied grant.
  Offline, the Cottage exists through `/dev freehold cottage` under `ALLOW_DEV_COMMANDS=1`
  and in tests. Land stays money-only.
- D4 **Furnishings are a descriptor, never entities.** The layout crosses the wire as a
  small descriptor (rows of furnishing id, cell, yaw) on a pid-scoped `freeholdState`
  event, re-sent on resume like the rift floor; both hosts regenerate geometry and runtime
  colliders deterministically (the `setRiftRegion` region API). Only the handful of
  interactables (for example the gate door, the Strongbox, the station, a placed feast,
  and in later waves the boards, chests, and vendors) are `kind: 'object'` entities
  riding the normal interest-scoped snapshot.
- D5 **Freehold state is account state.** Persisted in its own `account_freeholds` row
  (`server/freehold_db.ts`), loaded once at fresh join beside the bank bonus facts, never
  inside the character blob (an alt's stale blob must never resurrect a layout). Live
  state is keyed by owner key (`account:<id>` online, `entity:<pid>` offline per D15),
  never by pid, so two
  characters of one account online at once share one house.
- D6 **The Strongbox is bank access at home.** An interactable in the plot that satisfies
  the banker proximity gate for the owner. No new container, no dupe surface; the bank
  window and its item-cell mark family come for free. Locked below condition 30.
- D7 **The station amenity composes into the existing gate.** A `StationDef`-shaped anchor
  inside the plot joins the station list handed to `isAtStation` and `inRangeStationTypes`
  for the owner; recipes and their `stationType` gates are unchanged; training still
  requires the town station (`resolveTrain` is untouched). Locked below condition 30.
- D8 **Nothing ticks.** Condition derives at read time from a stamp and elapsed realm days
  (`ctx.resetDay`, the farm absolute-deadline idiom); the ledger week reuses the realm
  weekly reset; the paid week is an indexed column evaluated at join, claim, and pay, never
  by a per-tick sweep. Visitors are the live claim roster (`InstanceSlot.enteredBy`), not a
  persisted log. Refined by the source-reviewed lifecycle extension boundary below: the
  indexed-column wording does not require a speculative standalone Ledger index (query
  predicates, ordering, cardinality and reverse-FK/retention needs determine the reviewed
  indexes), and the no-tick rule concerns housing economic work, not the renderer/input's
  ordinary frame consumption.
- D9 **The distribution surface map is one pure client module** with a seven-distribution
  matrix test (web, website desktop, Steam, Epic, App Store, Google Play, Seeker dApp
  Store) and a `HudFeatures.freeholdPurchaseEnabled` row. The server never learns the
  distribution; the housing purchase surface is a client gate STRICTER than the Claudium
  store's `!NATIVE_APP` rule (section 8: no purchase surface on Steam or Epic either).
- D10 **Text-free events.** Every housing deny and grant is an id-carrying, pid-scoped
  `SimEvent` (the `farmDenied` model) resolved to `hudChrome.housing.*` keys client-side;
  no `sim_i18n` or `server_i18n` matcher rows unless a phase proves it needs an English
  emit.
- D11 **The RL env excludes housing**, recorded in `headless/CLAUDE.md` beside the farming
  cut and pinned by an `ACTIONS` exclusion test.
- D12 **One PR per wave**, each off the base with `FREEHOLDS_ENABLED` defaulting off; the
  packet teardown offer comes at the very end (wave E close).
- D13 **Art is the long pole and gets stand-ins.** Furnishing and trophy GLBs land in a
  dedicated wave A phase through the `image-to-glb` skill; earlier phases render a
  stand-in kit so every code path is testable before the art exists. Item icons (WebP)
  ride the content phases as same-change obligations, as the repo requires.
- D14 **A furnishing recipe belongs to an existing craft.** Ten crafted pieces, one per
  craft, on the proposal's mapping (section 6.5); Carpenter and Mason stay a wave E option.

Additional decisions locked at packet creation from the sim survey:
- D15 **The freehold rides the dungeon slot pool, owner-keyed.** Two `DungeonDef`
  records in `src/sim/content/freehold/dungeons.ts` (`freehold_inn_room` at index 15,
  `freehold_cottage` at index 16, both `spawns: []`, `guideVisible: false`, absent from
  `FINDER_ACTIVITIES`), a new `DungeonDef.claimKey?: 'party' | 'owner'` (append-only), and
  `meta.freeholdOwnerKey` stamped by the host at `addPlayer` (`account:<id>` online, the
  `feastOwnerKey`-style `entity:<pid>` fallback offline), session-only and listed in the
  parity `META_EXCLUDE`. Guests enter under the owner's key exactly as a party member
  joins a claim. Occupancy and reaping ride `updateInstances` unchanged. No new band, no
  new pool primitive.
- D16 **Live state is a Sim-owned map keyed by owner key**: `ctx.freeholds: Map<ownerKey,
  FreeholdState>` with the guild-bank load/serialize/evict idiom (`loadFreehold`,
  `serializeFreehold`, `evictFreehold`), so two characters of one account share one live
  record. The server persists it in `account_freeholds` with a `rev` compare-and-swap
  upsert (a stale write is refused, never merged). Offline hosts persist NOTHING: the
  offline world is a fresh `Sim` on every entry (every `serializeCharacter` caller lives in
  `server/`, pinned by `tests/professions_farming_state.test.ts`), so a fresh offline Sim
  starts with the default Inn Room record, pinned. Nothing lives only on the instance slot.
- D17 **Furnishings are walk-through in wave A until Phase 10**, which generalises the
  runtime collider region registry (`allocRiftCollisionToken`, `setRiftRegion`,
  `clearRiftRegion`) beyond the rift band and publishes the owner's placed-furnishing
  colliders per claim under ONE collision token per claim (allocated at claim on the
  `InstanceSlot`, released on free; the server holds many claims at once). Every
  furnishing def carries a REQUIRED collision radius `r` from Phase 03 on (`r: 0` means
  walk-through, as for a rug), so Phase 10 adds no content churn.
- D18 **The plot's crafting station may draw from the vault.** `vault_craft_gate.ts`
  gains an explicit arm for "standing in a claim you own with a built station", because
  the proposal's bags-then-vault rule for crafts at home outranks the open-world-only
  default (pinned by a negative case for a visitor's plot).
- D19 **Trophies are furnishing-shaped records, never items.** `trophy_eligibility.ts`
  maps deed ids, illuminated Reliquary pages, `slain:*` marks, owned mounts, and the
  `perfected` stamp to trophy prop ids; `syncTrophyUnlocks(ctx, meta)` runs after the
  join retro block and on first entry, reads only, and records unlocks in the freehold
  record with `retro: true` events. Trophies occupy plinth slots, cost no decor points,
  and are never tradable.
- D20 **Facet member names.** The packet renames the proposal's section 11 facet sketch
  (`freeholdInfo`, `freeholdPlace`, `freeholdMove`, `freeholdRemove`, `freeholdRepair`) to
  `myFreehold`, `placeFurnishing`, `moveFurnishing`, `removeFurnishing`, `payLedger` (the
  farming facet's verb-first style). Do not rename them back.
- D21 **Ruling 6 outranks the section 8 Seeker row for deed surfaces.** Every on-chain
  Freehold Charter surface (mint, trade, holder flair) is web and website-desktop only;
  the Seeker dApp Store row is OFF for deeds. The Seeker PURCHASE row (Claudium) is O4.
- D22 **Only amenities lock below condition 30.** Placement, moving, removing, undo, and
  entry never lock on condition (the proposal locks stations, the Strongbox, and trophy
  finishes; the door always opens). The in-world cosmetic wear (cold hearth light, dull
  trophy finishes) lands with the finishes in Phase 23.
- D23 **Layouts are content.** `INN_ROOM_LAYOUT`, `COTTAGE_LAYOUT`, and every later tier
  layout live in `src/sim/content/freehold/layouts.ts` (data-as-code);
  `src/sim/dungeon_layout.ts` keeps the helpers and the Dawnhold exemplar. The Hearth Key
  item def lives in `src/sim/content/freehold/items.ts`; its use arm and cooldown logic in
  `src/sim/freehold/hearth_key.ts`.
- D24 **The dev grant.** `/dev freehold <tier>` under `ALLOW_DEV_COMMANDS=1` (offline and
  the server dev path) sets the record's tier through a setter in
  `src/sim/freehold/state.ts`, lands in Phase 07, is refused without the flag (pinned),
  and is what the perf tour and the offline Cottage use. Phase 15's Charter grant reuses
  the same setter; Phase 21 extends the command for `lodge`. Refined by D81: the setter
  and the command land in Phase 05 with the default tier-0 Inn Room record; Phase 07
  persists the record and adds the save behind the same setter.
- D25 **Furnishings are Exchange-eligible** at every rarity (the mount rule, proposal
  section 6.5), decided and pinned once in Phase 02; the Exchange itself stays behind its
  existing web-only gate, so no native or Steam or Epic build reaches a furnishing trade.
- D26 **One deny-line selector.** `freeholdDeniedLineKey(reason)` lives once in
  `src/ui/hud/housing/housing_view.ts` over one `hudChrome.housing.denied.*` namespace;
  every later phase appends rows to it, never a second selector or namespace.


### Settlement decisions approved 2026-09-06
Fernando answered the complete batch: "approve all recommendations." The answered
[ruling sheet](ruling-sheet.md) preserves each original question, rationale and exact
response. R01-R46 map in order to D27-D72. External acceptance remains a release gate,
not an unresolved product question.
- D27 **Service catalog and operation authority (R01).** Produce the service-contract draft now: catalog and versioned quotes; account/plot/guild-bound idempotency; durable discoverable intent, receipts and recovery; guild pooled balance; refunds; outage intervals; published conversion/burn schedule. Preserve D9 through a NEW service-owned eligible-checkout issuer/verifier and opaque authorization bound to account, purpose/SKU, policy, quote and operation; the game server receives no distribution label. 15 validates initial SKUs, later priced files append their rows. Signed service acceptance and published catalog are release gates.
- D28 **Counsel, Terms and platform handoffs (R02).** Produce a counsel memo draft, Terms amendment draft, seven-distribution listing/review-notes draft and territory/authority schedule now. Require written acceptance before production enable or a housing-bearing storefront submission. Include Apple multiplatform/IAP and NFT-unlock analysis; make no approval claim.
- D29 **Purchase and independent management capabilities (R03).** Charter and Call purchase only on browser web and website-distributed desktop. Seeker use-only, deeds off. Model website-management as an independent capability, default off on denied storefronts unless the complete destination/flow receives written approval. In-world material payments remain available.
- D30 **Cumulative gates on every priced surface (R04).** Preserve counsel, published Terms and accepted economy-service gates in every priced implementation and QA, including suffixed files and 32/40. All complete purchase submodels, handlers, fetched catalogs, hidden DOM, errors and accessibility text obey the distribution capability.
- D31 **Attributed working values (R05).** Retain the existing values in the explicit inventory below as owner-adopted working targets. Remove unsupported Conan/ArcheAge/GW2 attributions. Every service price stays a quoted service result; no working USD or multiplier computes a payment.
- D32 **Published produce-inclusive weekly schedule (R06).** One published schedule per realm week, independent of owner. Every bill includes produce plus allowed rotating nonproduce families, within the existing three-to-five-line target. Create the exact eligible-ID and calibration worksheet now; 03 authors reference-derived trial bills, 13 validates versioned schedules and immutable prepaid bills, 20 owns the four-week measured report. Fernando/service approve literal bills before enable.
- D33 **Numeric provenance and calibration (R07).** Create one content manifest and numeric provenance worksheet. Each row names source item/recipe or measured model, derivation and rounding, owner and producing file; unreferenced gameplay rates require Fernando's signed tuning appendix before activation. No inferred inventory max-stack quantity, keystone, gear intermediate or quickening catalyst enters a bill.
- D34 **Call effect and current Ledger (R08).** A confirmed Call satisfies the current unpaid weekly bill and restores condition to 100, without adding future prepaid weeks or consuming existing future credits. If current bill is already paid, its quoted repair-only result is explicit before purchase. Correlate receipt to operation, account and plot.
- D35 **Suspension history and credit preservation (R09).** Add authority-fed persistent suspension intervals to 13/13a and service contract. No wear or debt catches up for suspended time; simulated arithmetic uses injected calendar data, never network or wall-clock calls. Preserve paid rate versions and prepay credits. Partial weeks retain the fixed flat repair bill, with no prorating or added outage charge; missed weeks never accumulate back bills. A wholly suspended billing period consumes no prepaid credit; carry it forward without repricing.
- D36 **Account/guild return protection and threshold (R10).** Retain the protective 7/3 policy; derive and persist the prior-absence/grace transition before updating presence. Alts cannot refresh grace repeatedly; guild absence uses eligible member presence. At condition 30 amenities work; only below 30 they pause. Entry/build/undo always work, including 0. Refined by 07b's source review (cite as D36 as refined): admitted gameplay presence, never authentication login (touchLogin / accounts.last_login), is the absence source; 07b carries that contract.
- D37 **Explicit payment source mode (R11).** Make source choice explicit: bags-only, vault-only, or automatic bags-then-vault. Affordability, confirmation and actual atomic deduction use the same mode. Prepay chooses the same source mode and shows the entire fixed batch before committing.
- D38 **Exact roster and final art (R12).** Lock an 18-piece Wave A roster (eight vendor, ten crafted, three pattern recipes within the ten), twenty additional crafted outputs in Wave B with produce decoration counted inside that roster. Produce exact room/furniture/trophy art briefs and reference manifests now. Every wave requires final art for its shipped IDs; art sessions generate approved reference sheets through image-to-glb intake.
- D39 **Measured geometry and finite storage bounds (R13).** Bind them to the authored room/model measurement manifest: aligned floor grid and clearance, transformed model bounds, explicit walk-through rugs, protected door/arrival paths, tabletop/ceiling anchors. Derive finite row/byte ceilings from the largest legal approved layout, including nested/saved copies; enforce before mutation/load. No freehand numeric guess.
- D40 **Shared design foundation (R14).** ux-spec records both the adopted target and verified current token mapping. Housing reuses the actual shared window/theme family; 11 owns an explicit foundation readiness check against DESIGN rollout. Switch only when the coordinated foundation lands. No local theme fork, nonexistent window_frame reuse or global redesign hidden inside housing.
- D41 **First moment in Wave A (R15).** Deliver them in Wave A through 06/09/11/19: interact at gate, choose destination, authoritative arrival pose, short skippable safe hearth view, immediate reduced-motion/control handback, keyed welcome, sanctioned sampled cue once per confirmed arrival, realm-daylight continuity and condition-readable hearth. Refined under "Source-reviewed arrival delivery refinement" below (the section after the C01 and C03 refinements): the cue and welcome are delivered at-most-once per accepted transition, best-effort, through 07c/08a's nullable freshArrivalPresentation directive; a committed arrival followed by a lost ACK or process failure may omit them, and no exactly-once presentation is guaranteed.
- D42 **Complete build-mode interaction (R16).** Wave A gets a detached bounded build camera; bags-family furnishing palette and Trophies tab; footprint/ghost with shape+hatch+reason for rejection; rotate/nudge; session undo/redo; decor/plinth/amenity meters; explicit touch Confirm/Rotate/Cancel 40x40 with safe areas; keyboard/gamepad equivalents. Palette is a nontrapping world companion; Steward/trophy decision windows use ordinary focus/return contracts.
- D43 **Bounded advanced placement scope (R17).** Wave B supports bounded free planar translation/free yaw plus typed floor/wall/table and fixed ceiling anchors for chandeliers, with parent movement atomic. Exclude arbitrary scale, full-axis gimbal and collision-leniency mode from this packet; correct proposal/deck accordingly. Boundaries, doors and clearance never become optional.
- D44 **Bounded placement-only undo and redo (R18).** Placement-only session journal, undo and redo available from 11, bounded by maximum legal placement-row capacity. Store exact-copy identity and revision preconditions; stale inverse refuses atomically. Clear on plot/session change or incompatible external revision with keyed explanation. Money, ledgers and completed sales are outside undo.
- D45 **Global light-budget fairness (R19).** Three authored room emitters is a ceiling, allocated through the existing light sink and live global budget; iOS may have two and pressure may leave one. Ambient/key grade, texture and silhouettes keep the room beautiful and legible. Ghost, blocked reason, floor bounds and capacity information are identical at every tier.
- D46 **Exact screenshot acceptance (R20).** Define shared housing capture helper and exact registry entries in 11/16/17/18, reconciled to planned file names. 20 requires desktop 1600x900, compact 874x402 and tablet 1180x820, plus focus, touch, gamepad, reduced motion, theme, denied-store and LOW-iOS cases.
- D47 **Strongbox and station access (R21).** Strongbox is built-in personal-bank access, no amenity-slot cost. A station uses the slot. Direct Materials Vault chest remains Manor unlock; home station draws permitted personal vault materials through D18. Guild chest exposes guild bank; authorized guild members may craft from their own vault at hall stations. Service-specific authorization stays separate from geometry.
- D48 **Account-wide truthful trophy eligibility (R22).** 17 owns authoritative account-wide eligibility and event-driven refresh for all promised deed/relic/item/mount/title/Perfected sources. Every qualifying source gets a truthful generic display if bespoke form arrives in 23. Preserve known source character/day; unknown history explicitly says unknown. Preserve hidden-content spoiler rules.
- D49 **Full Hearth shelf contract (R23).** Add the new Hearth shelf through the actual catalog/nav/order/localization/source/completion contract, append curated furnishing pages without reordering existing IDs. Furnishing items qualify; patterns and trophy records do not. Track exact inventory and remeasure fingerprint pins, never treat current totals as maximums.
- D50 **Explicit gate and offline-owner visiting (R24).** Interact opens own-home/friend-by-name prompt; proximity never auto-teleports. Support authorized visits while owner offline using bounded lookup/lazy load and global ownership fence. Runtime pool/foreign-realm claim saturation gives honest retry, never loss or an ownership waitlist. Refined by D76 (the friend admission fact is the named owner character's outgoing friend list; the visitor's own list is never an input; a block row on either side refuses; friendAdd/friendRemove/blockAdd bust through a NEW mutation-site hook).
- D51 **Current visitor authority and safe ejection (R25).** Entry always checks current authority. Private stops new visitors; existing admitted guests may finish until exit unless owner uses End visit. Blocking, revoked relationship/membership or explicit End visit safely ejects immediately. Owner can end a visit without changing property ownership. Refined by D77 (guild-owned plots admit members always; guild/public/private only for the guild owner kind; non-members enter as guests under these ejection rules) and by D76 (the hook triggers this recheck).
- D52 **Kitchen Garden public tableau (R26).** Project existing owner farm bed/crop/stage/status publicly without private inventory/timers. Owner board opens their own Harvest Journal; guest gets read-only owner tableau only. Produce props use existing cooking recipes or gold vendor decoration within R12 roster.
- D53 **Pattern channels and excluded seasonal sets (R27).** Preserve adopted raid/rift/Marks doctrine, no delve channel. Every later rare pattern has one named luck channel plus Marks in its manifest; Wave A remains Marks-only. Seasonal furniture sets are explicitly outside this packet; ownership of existing decoration never expires.
- D54 **Service-owned Hall Fund and donor target (R28).** Service owns guild pooled Claudium balance and debit/credit ledger; game mirrors absolute versioned results. Materials/gold and donor cap/audit update atomically. Proposed anti-dominance target: one current weekly Hall Ledger-equivalent per account per realm week across alts; the signed calibration artifact defines resource/currency allowance and rounding without game-side token conversion.
- D55 **Guild layout and member trophy custody (R29).** Officers manage hall layout, members manage only their own assigned trophy plinths. Departing members retain unlock/provenance and their displays detach safely. Guild-first-kill credit uses existing eligible participant clear credit and records each qualifying participant's guild at that clear; multiple represented guilds can qualify. No invented percentage threshold or speculative retro credit from current membership.
- D56 **Guild boards and cosmetic project completion (R30).** War table explicitly shows authorized guild raid lockouts and recorded first kills, with unavailable first-kill section until 31. Projects finish when approved material/fee conditions are met, no artificial multi-week wait. Completion unlocks cosmetic furnishing vendor stock only, never training/combat bypass.
- D57 **Transactional Ward capacity and anchor (R31).** Retain 50 plots and 24 admitted occupants as TUNING, not culling. DB transaction authorizes unique slots/capacity with bounded indexed candidates and stable lock order. Largest represented guild anchors, deterministic ID tie-break; no guild means no anchor. Footprint measured against allocator before art.
- D58 **Permanent Favor and monthly Endeavors (R32).** Favor-unlocked decor capacity is permanent. Monthly Endeavor progress resets on the authority's UTC calendar month, independently of capacity. Keep four ranks/+10 targets; content manifest fixes event weights, thresholds and rewards through approved calibration before enable.
- D59 **Realm Showcase identity and result (R33).** Realm-wide opt-in Showcase, one authenticated account vote per realm season, no self-vote, no eligibility reset by ward move. 13-week seasons align to published realm weekly anchor. Tie-break earliest valid entry then stable ID. Persist close/reward identity before bounded delivery.
- D60 **Closed guest-book reactions and rate (R34).** Closed reactions wave/cheer/admire, no free text; proposed one reaction per account per plot per realm day. Per-plot insert/prune serializes with deterministic oldest order; 50 cap tested concurrently. Give entries, votes and books separate indexed retention/fold policies with durable season result.
- D61 **Stable plot identity and atomic custody (R35).** Stable opaque public plot identity from 07 with account+plot-index lookup, primary-only admission initially. Internal account/guild keys never cross viewer wire. Globally fenced plot ownership permits one authoritative active claim per plot across realms; conflicting realm entry gives busy/retry. Character FIFO then owner/shared-resource serialization; bounded atomic transaction pairs inventory, housing, funds and receipt effects.
- D62 **Durable recovery and bounded save work (R36).** Housing-specific durable receipts are permanent replay authority, with recoverable intent before spend and no DB locks across service IO. Retain compact applied identities unless an accepted service replay horizon permits proven compaction. Coalesce saves to one running+one pending dirty generation; all background producers share admission and workload deadlines.
- D63 **Upgrade overflow and prestige eligibility (R37).** Preserve fitting exact copies. Preview overflow; if bags cannot safely accept it, refuse completion before new fee/material mutation. Top two personal tiers share an existing account prestige OR: prog_legendmaker, col_reliquary_rank_5, dgn_nythraxis, dgn_ignivar or dgn_varkhul. Guild top tiers use their own qualifying recorded raid-clear deed.
- D64 **Furnished-plot transfer custody (R38).** Honor furnished-plot sale: explicit immutable manifest contains shell/tier and eligible transferable placed furnishings only. Seller trophy unlock/provenance, bound/personal copies and omitted goods remain theirs in verified safe custody. Verify entitlement transfer and recovery atomically after service confirmation; native consumes server entitlement, never on-chain access. Refined by D80: buyer capacity (index 0 at tier 0 before 42, a free index under 42's two-plot cap after), the literal refusal freehold.deed.buyer_capacity, the seller's fresh tier-0 record at index 0 with account trophy unlocks retained, and Ward Favor capacity awards travelling with the stable plot ID.
- D65 **Per-asset authority and signed territories (R39).** Per-asset permanent delegate at mint, not collection-wide freeze. Low condition never destroys house, contents or access; no automatic lapse burn. Transfer/moderation restriction and irreversible burn triggers require explicit signed authority. Signed supported-country list, unknown-country refusal; no KR-only legal conclusion.
- D66 **Dyes and bounded layout sharing (R40).** Retain counts. Art/content manifest supplies eight exact palette/name/source rows using approved material colors; no guessed RGB/rates. Dye station requires its amenity/proximity and condition 30+, while ordinary placement remains unlocked. Saved layouts use bounded per-plot storage; share codes carry version/tier/public layout only.
- D67 **Independent second plot and shared Hearth (R41).** Primary-first myFreeholds, myFreehold remains primary alias; stable plot IDs from 07. Independent condition/prepay/visits/ward slot. Each second-home integer material line is ceil(primary approved line times 1.5). Hearth defaults primary, owner selects destination in Steward; shared account cooldown prevents bypass. Refined by D80 (Ward Favor capacity awards are properties of the stable plot ID and travel with the plot; after 42 a purchased plot may occupy the account's free index under the two-plot cap; the second SKU's price is the service's CAL-SERVICE row). Refined per D93: the second plot is granted at the Cottage tier and upgrades through the same build projects as the primary with every integer material line at ceil(1.5x); its weekly Ledger and prepay lines follow the same ceil(1.5x) rule (CAL-LEDGER-A); there is no second-home upgrade refusal; a third plot refuses with freehold.second_plot_cap; a sold primary is replaced by the seller's fresh tier-0 record at index 0 while a sold second plot frees index 1 with no replacement record. Per C01, the Hearth Key's authority is the account's, never the item's: owning the item grants no admission authority, and the combat, dead and jailed refusals apply.
- D68 **New professions excluded (R42).** Explicitly exclude new professions from this packet. 43 produces a measured future-expansion handoff and records no implementation of new crafts. Existing ten professions deliver the complete furnishing program.
- D69 **Base protocol and recurring budget review (R43).** Record actual clean sync at 7d140843d2; PR #3872 OPEN and base already current. Follow existing merge-forward until it merges, then newest release and remove dependency block. Correct no-offline-persistence summary. 20 creates durable every-second-release budget review with measured LOW evidence, never automatic increases.
- D70 **Bounded suffixes and complete reviewer coverage (R44).** Split into suffixed implementation/QA pairs without renumbering, including further splits needed by new acceptance. Update every index/progress/next-file chain. Every file names all actual triggered reviewers; DB review before design and on final diff. Fix fifth-versus-ninth prepay boundary, stale auth tests and all reported nits.
- D71 **Durable preservation and actual next file (R45).** ux-spec is durable. Any future authorized scaffolding teardown first preserves it and linked decisions/contracts under docs/prd/woc and proves links, never deletes the only source. Actual next file is /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-01-foundation.md.
- D72 **Narrow requested memory update (R46).** Permit only the specifically requested freeholds memory entry to be updated with the resulting local tip, packet SETTLED and actual next-file path; no other memory or runtime-setup changes.
- D73 **Final legal-team revisit and handoff.** After implementation and final artwork,
  44b revisits all Terms, counsel, store/platform, service, territory and per-asset
  authority material against the completed feature and prepares its concrete legal-team
  handoff and sign-off tracking. This final review supplements every earlier written
  release/submission gate; it never postpones permission needed for an earlier release.
- D74 **Codex executes every asset-producing implementation.** Every step generating
  shipping GLBs, models, textures, icons, reference images, other images or audio assets
  explicitly requires Codex, not Claude, and the existing repository asset/image/SFX
  pipeline, provenance, quality and performance gates. This packet session creates
  documentation only and does not manufacture assets or claim their approval.
- D75 **Final Codex placeholder-art replacement.** 44a inventories every feature-created
  placeholder icon/image, replaces it through the existing Codex image workflows,
  verifies final art in context and hands its evidence to 44b. It follows 44 QA and
  precedes final legal handoff. No scaffolding deletion or terminal completion precedes
  44a/44b and their paired QAs; durable UX/decisions/contracts remain preserved.

Refinement map for the preserved original record: D29 resolves D21's former O4 as
Seeker use-only; D41 brings D22's hearth/cosmetic readability into Wave A; D47 narrows
D6/D7 to service-specific personal-bank/station gates; D61/D62 specify the atomic
housing-operation foundation without reusing storage-purchase ownership; D68 closes
D14's optional professions as excluded. D71/D73/D75 supersede D12's earlier teardown
and terminal timing, while D38/D74 preserve D13's temporary implementation stand-ins
only until the required final-asset acceptance. D87 keeps D12's one PR per wave and
assigns it an owner for every wave: 20 (A), 27 (B), 33 (C), 39 (D) and 44 (E) each carry
the STOP-and-ask push-go arm, and 27 reads <wave-a-head> as the local tip recorded at the
20 QA PASS or the wave A PR head when one exists. D1-D26 themselves are retained
unchanged.

### Settlement round 2 (independent review, 2026-09-06)

The independent packet review of 2026-09-06 found decision gaps that no D1-D75 or R01-R46
row covered. Each is recorded here with its recommended disposition applied throughout the
packet; the ruling sheet's second round (R47-R64) carries the exact question and the word
column; Fernando approved R47-R64 on 2026-09-06 ("approve all recommendations R47-R64"),
so every round-2 row is settled.

- D76 **Visitor friend admission (R47).** The friend admission fact is: the named owner
  character's outgoing friend list contains the visitor's character
  (friendships.character_id = owner, friend_id = visitor), read through
  whoFriended(visitor) or listFriends(owner) in the bounded on-open lookup and rechecked
  at entry. The visitor's own friend list is never an admission input. A block row on
  either side refuses. friendAdd, friendRemove and blockAdd bust the visitor projection
  through a NEW mutation-site hook and trigger the D51 ejection recheck;
  sendSocialSnapshot is not the feed. A name that resolves to an alt resolves to that
  account's plot, and only the named character's friend list is consulted.
- D77 **Guild-plot visiting policy (R48).** Guild-owned plots admit current members
  always. visit_policy for the guild owner kind is set by the leader or an officer and
  accepts only guild, public or private; friends is refused for that owner kind. Public
  admission is capped by the tier column; the Meeting Hall cap is the Cottage row until 32
  sets its own. Non-members enter as guests under the D51 ejection rules.
- D78 **Hall Fund end-of-life (R49).** The service contract gains a Hall Fund end-of-life
  row: on disband the pooled service balance is refunded pro rata to donor accounts by
  original receipt as separately identified immutable refund operations; the game only
  requests the operation. 29 adds an officer-plus withdraw-to-guild-bank verb for fund
  materials and gold on the 07a rail. The explicit safe disposition in 28a means fund
  materials and gold at zero and the service balance settled or refund-requested.
- D79 **Keep-forever guild history and disband (R50).** A guild that holds any
  keep-forever housing row (guild_deeds, first clears) is never hard-deleted. Disband
  becomes the 28a tombstone disposition: the guild row is retained with a tombstone status, member
  rows are removed, the realm name is released by a tombstone-aware uniqueness rule, and
  guild_deeds rows stay attached. The disband guard extends the existing
  beginGuildBankDelete guard at BOTH deleting call sites (disband and last-member leave)
  before any member row is deleted. GM character or account deletion routes through the
  same guard: leadership passes to the highest-ranked remaining member or, with none, the
  tombstone disposition applies with fund disposition per D78. earned_by stays a nullable
  FK beside an immutable captured public name and realm snapshot written at commit;
  projections read the snapshot.
- D80 **Furnished-plot transfer admission (R51).** Buyer capacity: the purchased plot
  occupies the buyer's plot_index 0 only when that record is at tier 0 (Inn Room); the
  buyer's retained copies and displays are previewed to a safe destination by the same
  manifest rule as the seller's; otherwise the operation refuses with the literal code
  freehold.deed.buyer_capacity. After 42, the purchased plot may occupy the buyer's free
  index under 42's two-plot cap. The seller receives a fresh tier-0 record at index 0 with
  account trophy unlocks retained. Ward Favor capacity awards are properties of the stable
  plot ID and travel with the plot; the seller's fresh record starts at the base budget.
  D64 and D67 are refined accordingly.
- D81 **Default Inn Room record before persistence (R52).** 05 creates every account's
  in-memory tier-0 Inn Room record as part of the claim model (the record D2 says every
  account holds), together with the D24 development grant fixture the perf tour and the
  Cottage captures use; 07 persists that record without changing its identity. 06's
  offline entry and captures depend on 05, not on 07.
- D82 **War table first-kill client seam (R53).** 31's first-kill projection reaches the
  client through the same NEW bounded sibling read 30a names for missing lockout
  projections (behind the current guild domain RouteDef registry with current-authority
  checks), with keyed ready and empty states in the hall boards view and its test; no
  facet member is added, so the parity pin is unchanged. 31 gains an Agent CLIENT slice,
  its suites, its commit and its acceptance box.
- D83 **Housing capacity never gates gameplay (R54).** Guild-clear recording capacity
  never refuses GameServer.join, enterDungeon or a respawn. Exhaustion records a bounded,
  auditable clear-not-captured gap with an operator alert; character rewards, loot and
  existing deeds are unchanged and guild credit for that clear is simply not captured.
  Every busy arm binds only to source activation or credit capture. The 07b join-time
  reservation hook publishes the session regardless of capacity.
- D84 **Calendar clocks (R55).** Every has-the-day-rolled-over fact (ledger, upkeep,
  prepay, condition, guest-book daily admission, Showcase realm week, the per-account
  weekly cap through ledgerWeekOf) uses the realm day resetDay (03:00 in the realm reset
  zone) and the Tuesday week anchor emberWeekAnchorOf. The sim consumes day-keyed facts in
  the resetDay vocabulary; the server produces them with resetDayKey(ms,
  REALM_RESET_TIME_ZONE); epoch-ms fields are display-only. utcDay stamps when something
  happened (deed days, provenance). The Endeavor month is the UTC calendar month
  utcDay.slice(0, 7) per D58, never resetDay.
- D85 **Dark realm behavior (R56).** The sim takes a freeholdsEnabled boot config beside
  devCommands on the SimConfig seam. On a dark realm the Eastbrook gate prompt, the
  furnisher and its stock and the Hearth Key are neither spawned nor sold; the offline
  host stays live under D3. 03 and 06 inherit the rule and a flag-unset server test pins
  it.
- D86 **Purchase submodel absence contract (R57).** Absence on a denied storefront is a
  runtime contract: no DOM node, handler, request, fetched catalog, error copy or
  accessible text. Purchase code and English keys ship dormant in every bundle under the
  runtime capability; the review notes and the 44b handoff say so explicitly.
- D87 **Wave A and E publication arms (R58).** 20 and 44 carry the same STOP-and-ask
  push-go arm as 27, 33 and 39: on the go, the sanctioned push opens that wave's PR; otherwise
  the close ends local, awaiting the push go. 27 defines <wave-a-head> as the local tip
  state.md recorded at the 20 QA PASS, or the wave A PR head when one exists. D12's one PR
  per wave is owned for every wave.
- D88 **Deletion policy for housing operation rows (R59).** 07a states the ON DELETE
  policy per row class: intent rows cascade only when no open operation exists; applied
  tombstones retain a nonidentifying operation identity with the account reference nulled
  or scalar and cascade only under the accepted retention schedule. An open housing
  operation blocks character or account deletion with the mapped refusal class in
  character_delete_db.ts (the storage guard shape); the deletion race joins the real-PG
  list.
- D89 **Upgrade contribution source mode (R60).** Upgrade contributions take an explicit
  source-mode argument per D37 (bags, or the vault inside the owner's own claim under
  D18/D47); the bill counts item units per D33; a confirmed fee whose last leg cannot
  finish because bags are full re-attempts without a second fee.
- D90 **Dye station identity (R61).** The dye picker is enabled by the home station
  amenity of type apothecary: no new amenity kind, no extra slot and no station GLB. The
  art-brief row narrows to swatches and channel masks; a test pins the gate on that exact
  amenity.
- D91 **Distribution capabilities (R62).** Exactly two HudFeatures rows exist:
  freeholdPurchaseEnabled and freeholdManageOnWebsite. Housing use is the server
  entitlement gate (flag plus entitlement) read through the housing facet, never a
  HudFeatures row; deedSurfaces is 14's source pin consumed by 38.
- D92 **One key family and manifest governance (R63).** hudChrome.housing.* as pinned by
  ux-spec and ux-key-manifest.json is the only key family (charter.*,
  steward.manageWebsite); the drafts adopt those ids, and fee, tax and Purchase Terms rows
  are added under charter.*. Window-title, tab and button keys use title case per
  DESIGN.md 5.4; status, description, radio and aria keys stay sentence case. Every UI
  phase names its new keys with exact English in its own file, ux-spec carries the rows,
  and the manifests regenerate in that same phase with every cited count updated.
- D93 **Second freehold tier and upgrades (R64).** The second plot is granted at Cottage
  tier and upgrades through the same build projects as the primary with every integer
  material line at ceil(1.5x) per D67; ledger and prepay lines follow D67; there is no
  second-home upgrade refusal.

## Source-reviewed Hearth and build-presence refinements

C01 implements the approved shared-account Hearth behavior in D67. NEW
server/freehold_hearth_db.ts owns FREEHOLD_HEARTH_SCHEMA, loadFreeholdHearth and
advanceFreeholdHearthOnClient. 07 produces account_freehold_hearth with account_id
primary/FK identity, ready_at_ms and monotonic revision; no transferable plot owns this
cooldown. Private fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision are
committed UI mirrors only, excluded from plot persistence and transfer. Online ready timestamps use the authoritative transaction's epoch clock
observed once after acquiring the account participant. A regressed clock cannot make
an unready key eligible; accepted advances never reduce ready_at_ms or revision. Offline/headless use isolated injected host-clock state and the
same approved duration. 07a checks and advances the account row atomically with accepted
remote Hearth entry under the reviewed actual touch-set order; cached UI values never
authorize. Refusal, already-home no-op and physical-gate entry do not advance it. 42
consumes the same row across both destinations. Transfer copies or clears neither
account's cooldown; character deletion preserves it. Export, soft deactivation, restore,
true account deletion, bounds, FK waits and rollout are explicit 07/07a proof surfaces.

C03 adds the narrow presence verb needed for the approved visitor experience without
renaming any D20 member. NEW housing facet setFreeholdBuildPresence(active: boolean)
and command set_freehold_build_presence carry ephemeral editor presence. 01 owns the
facet/registry/null scaffold, 08 the authority in NEW
src/sim/freehold/build_presence.ts::setFreeholdBuildPresence, and 08a the allowlisted
freeholdState.isDecorating boolean. 11 sends start/stop through that verb; 18 reads only
the public boolean. The host binds each observation to the authenticated session and
current plot/claim generation. The command carries the acknowledged opaque plotId,
acceptedTransitionId and monotonically increasing buildPresenceSeq plus active; these
are stale-message checks, never credentials or caller-selected authority.

The receiving socket binding is captured before queueing and checked against the
current socket again at dispatch; it is host metadata, not a client credential.
buildPresenceSeq is monotonic only within that binding. A newly bound reconnect
starts inactive with a fresh sequence window, even though acceptedTransitionId history
is retained. An old socket or queued prior-generation frame cannot alter that window.

Each active entry requires current edit authority. Multiple authorized owner sessions
are tracked privately; the public boolean is true while any current eligible session
is actively editing. Closing build mode, leaving, disconnecting or permission/claim
revocation clears that session, with no grace period or durable row. A late close from
a superseded entry cannot clear a newer session, and a stale start cannot restore it.
No ghost, inventory, layout history, camera or actor/account identity accompanies the
boolean. Three-host/two-world parity and two-client lifecycle/privacy tests prove this
contract; host projections never infer it from renderer focus or camera state.

## Source-reviewed arrival delivery refinement

D41 remains verbatim above. Its once-per-confirmed-arrival intent is implemented
through 07c/08a's nullable freshArrivalPresentation directive, with at-most-once,
best-effort delivery and consumption for the accepted transition. A committed
arrival followed by lost ACK or process failure may omit visible/audio output;
this contract does not guarantee exactly-once presentation. Snapshot, replay and
resume never remint a fresh directive or recover presentation from historical
firstTierAtAdmission, acceptedTransitionId or dungeonEntrySeq alone. Only 07c's
committed account/tier insert winner may set firstTierViewEligible and permit the
optional first-tier camera. Ordinary return/visitor arrivals remain static, while
a delivered fresh directive may welcome once. 06/09/19 and ux-spec consume this
same delivery contract without adding a routine-entry receipt or another marker.

## Source-reviewed lifecycle extension boundary

07b introduces the account lifecycle module/core/coordinator and immutable protection
history. 28a extends that same owner family through explicit typed account/guild scope:
NEW guild_freehold_lifecycle and guild_freehold_lifecycle_history use real guild keys
and FKs, never account-row polymorphism or summed/copied member-account grace. Every
ordinary current guild member's admitted gameplay qualifies under D36; donation caps
are separate. Guild observation carries server-controlled membership incarnation and
captured time before queues; offline membership addition is not gameplay presence.
Noncoalescible admission/return/membership transitions retain their boundaries while
periodic timestamps alone coalesce. 28a proves the historical membership/transition
fence, mutation boundary, actual lock/index/deletion paths and bounded batches; 29/13a
consume committed guild history and exact union with outage protection. Observer
account/character deletion never erases guild history; disband preserves dependent
hall/credit/operation/protection state until its reviewed disposition completes.

D8's original indexed-column wording does not require a speculative standalone Ledger
index: query predicates, ordering, cardinality and reverse-FK/retention needs determine
the actual reviewed indexes. Its no-tick rule concerns housing economic work, not the
renderer/input's ordinary frame consumption. These source-reviewed implementation
bindings preserve the approved product rules and do not add a balance constant.

## Source-reviewed guild-clear admission refinement

31 owns NEW server/freehold_guild_clear_admission.ts::createGuildClearAdmission
and server/freehold_guild_clear_bridge.ts::createGuildClearBridge. The admission
owner reserves finite source-life slots and encoded bytes before publication; the
bridge preserves the original synchronous recipients, carrier order, source IDs,
day/difficulty, membership incarnation and exact ordinary-save snapshot prefix.
The existing planned guild_deeds_observer remains a committed projection consumer;
07a alone owns the source claim and operation transaction. No second receipt store,
pool, save queue or poller is introduced. 31's NEW exact operations are
reserveGuildClearSourceBatch; prepareGuildClearCharacterAdmission,
commitGuildClearCharacterAdmission and cancelGuildClearCharacterAdmission;
consumeGuildClearSourceReservation; retireGuildClearSourceLife;
releaseCommittedGuildClearCandidate; and retireGuildClearCharacterGeneration.
NEW src/sim/freehold/guild_clear_contract.ts owns pure GuildClearSourceAdmission
and GuildClearAdmission types. The narrow ctx.guildClearAdmission source contract
reserves, consumes and retires source lives; only the full host interface manages
character admission/generation and committed-candidate release.

Each source binds process and source-life generations, template and optional claim
generation, with positive metadata reservation even when no recipient is present.
Wipe/evade retains its unused reservation; a credited death consumes it, and a
later life needs another. Generic sources reserve the proven party/raid envelope.
Each live unconsumed Nythraxis source reserves an envelope for every admitted
authenticated character on that host, independent of location, party or guild;
multiple sources multiply this capacity. Fresh admission extends every affected
reservation all-or-none through 07b's prepareFreeholdLifecycleAdmission,
commitFreeholdLifecycleAdmission and cancelFreeholdLifecycleAdmission before
GameServer.join publishes the character, including administrators. The
reservation owns a prepared GuildClearCharacterAdmissionToken and commits it
through commitGuildClearCharacterAdmission before authenticated Sim/session
publication; a cancelled lifecycle admission cancels the unpublished extension.
The join-time hook publishes the session regardless of capacity (D83): when the
extension cannot fit, the character publishes as an unreserved generation, one
bounded clear-not-captured gap is recorded with an operator alert, and no busy
reaches the player. A captured source whose actual recipient batch exceeds its
reserved envelope (possible only when an unreserved generation participated) is a
not-captured clear: character rewards are unchanged and no guild candidate is
captured. Prepared unpublished character generations count
when another Nythraxis source life reserves; neither interleaving can omit capacity. Resume reuses
its surviving generation; takeover transfers or replaces it under a generation
fence. Authoritative leave releases only unused participant capacity; captured
candidate capacity remains retained. Offline/headless and developer bots retain
ordinary rewards without gaining online account authority.

Every qualifying source producer preflights the whole legal activation/replacement
batch before changing auras, claims, difficulty, IDs, RNG, entities, death/loot or
pending replacement state. This includes normal claims, Reset All, developer
family replacement and spawn batches, in-place respawn, pending respawn and
boot/authored/custom producers. A refused reservation never blocks the producer (D83): the life activates,
the claim proceeds and the corpse revives exactly as before, flagged not-captured
on its session-only token seat (ctx.guildClearSourceLives on SimContext); its
clear credits characters unchanged and captures no guild candidate, and the bridge
records one bounded gap row (source identity, boss, difficulty, utcDay) in the
redacted metrics with the operator alert. Retiring
an entity/claim releases only unused life allocation. Publication assertions are
invariants, not overload handlers after partial mutation; no movement barrier or
new participant cap is permitted.

Synchronous capture consumes already reserved envelopes and preserves every
distinct candidate, including clears without a new character deed. Original
recipient order elects each guild's carrier. Candidates arriving during save IO
remain pending; failure or ambiguous commit retains original identity for
reconciliation. Consumed capacity is released only after a known committed outcome
has entered bounded projection/recovery ownership. Uncommitted memory is not
crash-durable, and no stronger precommit character-reward guarantee is claimed.
Preserve each actual ordinary/carried save arm and reviewed legacy participants;
any new pre-lock statement must be explicitly budgeted and proved, never assumed.

The required online composition cannot silently select an inert admission owner.
Enabling recording inventories all current source lives and authenticated
generations, prepares all reservations and atomically installs readiness at a
synchronous host boundary; inability to fit fails activation without advertising
readiness. Incapable old processes cannot advertise the capability. Once enabled,
recording cannot be disabled to discard candidates or admit excess work. Admitted
sessions and already-live sources continue. Recording capacity never refuses
GameServer.join, enterDungeon or a respawn (D83): every busy outcome binds only to
source activation or credit capture, where it marks the life or clear not-captured
and records the bounded auditable gap; join, entry, revival, character rewards,
loot and existing deeds are unchanged and guild credit for that clear is simply
not captured. There is no waiter queue, global tick pause or dropped candidate.
While freeholdsEnabled is false on the SimConfig seam (D85) or recording is
disabled, no producer consults ctx.guildClearAdmission. Restart installs committed
recovery before ready and shutdown obeys existing deadlines and generation fences.

31 extends MEASURE-BOUNDS with the actual producer census, source/candidate schemas,
slot and byte totals, Nythraxis-life by admitted-character multiplication, pending
and unpublished admission reservations, save concurrency, legal replacement batch
headroom, cancellation/retirement and redacted pressure/failure metrics. Numbers
come from schemas, current rules, deployment workload and measured shared save
budgets; this refinement introduces no balance or capacity literal. Its paired
proof includes every activation/refusal arm, more room occupants than RAID_MAX,
multiple lives and late admissions, independent saves, repeated clears during IO,
ambiguous commits, real PostgreSQL participants and exact no-leak capacity totals.

## Non-negotiables (every phase)
- Determinism: all randomness via `Rng`; housing draws NONE (placement, upkeep, and the
  seeded weekly ledger order are pure functions of content and the realm calendar); no
  wall clock in `src/sim/` (`ctx.lockoutNowMs()` and `ctx.resetDay` are the clocks).
- One sim, three hosts: the module runs unchanged offline, online, and headless; the RL
  env excludes housing by a pin.
- Server authority: every outcome is decided in the sim on the server; the client
  predicts nothing and mirrors deltas.
- Token firewall: no on-chain vocabulary in `src/sim/` (wallet, token, $WOC, mint, holder,
  marketplace, on-chain, Solana, and the on-chain Freehold Charter deed). The Book of Deeds
  (deed ids, `deedsEarned`, guild deeds) is game content and is NOT firewall vocabulary. A
  purchased effect arrives as a server-applied grant after the economy service confirms.
- Store policy: `FREEHOLDS_ENABLED === '1'` read live, default off; no purchase surface
  and no wallet, $WOC, on-chain deed, or marketplace string in any App Store, Google Play, Steam,
  or Epic path; no "earn" language; nothing repossessed, nothing destroyed, no timed loss.
  Dark also means the Sim boots with `freeholdsEnabled` false on that realm (D85): no
  Eastbrook gate object, no furnisher entity or stock, and no Hearth Key grant reach a
  player; the offline browser and headless hosts pass `freeholdsEnabled` true (D3), and
  item, dungeon and layout data merge on every host regardless.
- Housing capacity never gates gameplay (D83): guild-clear recording capacity never refuses
  `GameServer.join`, `enterDungeon` or a respawn; exhaustion records a bounded, auditable
  clear-not-captured gap with an operator alert, character rewards, loot and existing deeds
  are unchanged, and every busy arm binds only to source activation or credit capture.
- Never sell power: no amenity or furnishing changes a combat, progression, gathering, or
  drop number; the only buff in a house is a feast's Well Fed.
- Never a Perfecting keystone (`wyrmfall_core`, `sundered_essence`, `makers_ember`), a
  gear intermediate, or the quickening catalyst in any ledger, furnishing, or upgrade
  bill. Zero new farm beds. Recipes and their `stationType` gates unchanged.
- Vocabulary fixed; "phase" never leaves this directory; no em dashes, en dashes, or
  emojis anywhere.

## Validation matrix (by change type; pick every row the phase touched)
| Change type | Run |
|---|---|
| Any code | `npx tsc --noEmit`; the phase's own vitest files one at a time; `npm run ci:changed` after the LAST commit (read the exit code) |
| `src/sim/` | `npx vitest run tests/architecture.test.ts tests/sim_context.test.ts tests/monolith_budget.test.ts` plus the module's suite and a determinism (same seed, same state) case; parity goldens (`tests/parity/`) regenerated with `UPDATE_PARITY=1` in their own commit when a sampled field or emit changes |
| `src/sim/content/` | `npx vitest run tests/item_icons.test.ts tests/item_art_consistency.test.ts tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/recipe_economy.test.ts tests/provisioner_firewall.test.ts tests/market_filters.test.ts`; `npm run wiki:content` then `npx vitest run tests/guide.test.ts` |
| `src/world_api/` | `npx vitest run tests/world_api_parity.test.ts tests/command_schema.test.ts tests/command_facets.test.ts` |
| Wire or snapshot | `npx vitest run tests/snapshots.test.ts tests/env_protocol.test.ts tests/bandwidth.test.ts` plus the housing chain test |
| `server/` | the domain suite under `tests/server/`; `npx vitest run tests/server/http/surface_inventory.test.ts tests/server/http/error_codes.test.ts tests/server/main_retention_wiring.test.ts tests/api_error_code_parity.test.ts`; pg-armed twins with `TEST_DATABASE_URL=postgres://eastbrook:change-me@localhost:5433/eastbrook` after `npm run db:up` |
| `src/ui/`, `src/styles/`, `src/render/` | `npx vitest run tests/architecture.test.ts tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts`; `npm run i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`; `node scripts/pr_screenshots.mjs` for visual change; `npm run perf:tour` for GPU producers |
| `headless/` | `npx vitest run tests/env_protocol.test.ts tests/client_env.test.ts` |
| Merge bar | Run `node scripts/gate_select.mjs` before readiness, or the deeper `npm run gate`, plus every scoped requirement; CI green is required on a separately authorized wave PR. Stop, CI and reviewers never replace shared tests/typecheck/build/i18n/security. |

## Seams and names (verified 2026-09-05; anchors to re-verify, not promises)
- Sim module: `src/sim/freehold/` behind `SimContext` with an `index.ts` barrel and a
  local `CLAUDE.md`; modules planned: `types.ts`, `state.ts` (load/serialize/evict),
  `instance.ts` (claim, rehydrate, descriptor), `layout_core.ts` (pure placement leaf),
  `placement.ts` (commands), `condition_core.ts`, `ledger_core.ts`, `ledger.ts` (pay),
  `amenities.ts`, `trophy_eligibility.ts`, `trophies.ts`, `visiting.ts`, `grant.ts`
  (server-only grant functions, never on `COMMAND_NAMES`); that is the wave A list, and
  later phases append their own modules (`hearth_key.ts`, `colliders.ts`, `upgrade.ts`,
  `hall_fund.ts`, `guild_deeds.ts`, `garden_view.ts`, `wards.ts`, and so on). New
  `SimContext` primitives
  and callbacks are appended and mirrored in `tests/sim_context.test.ts` (`CALLBACK_KEYS`
  and the fake host); a `freehold/` row joins the `src/sim/CLAUDE.md` system table.
  - Boot config (01, D85): the `SimConfig` seam (`src/sim/types.ts`) gains the optional
    boot field `freeholdsEnabled` beside `devCommands`, mapped by `server/sim_boot_config.ts`
    from `server/freehold_config.ts` `freeholdsEnabled(env)` and passed as true by
    `src/main.ts` and `headless/env_server.ts`; 01 owns the field and its pins, 03 and 06
    consume it.
  - Tier writer (05, D81): `src/sim/freehold/state.ts::setFreeholdTier` and the
    `/dev freehold <tier>` command land in 05 with the default tier-0 Inn Room record; 07
    adds the persisted save behind the same setter; 15's Charter grant reuses it.
  - Calendar (13, 13a, 35; D84): NEW `src/sim/realm_week.ts` (13) holds the pure realm-week
    leaf extracted from `src/sim/professions/masterwrought_materials.ts`
    (`emberWeekAnchorOf`, `emberWeeksBetween` and `emberWeekAnchorPlusWeeks`, re-exported
    from that module unchanged; `resetDayToDayNumber` is module-private today, so the
    extraction exports it from `realm_week.ts` while `masterwrought_materials.ts` keeps
    its local use);
    `ledger_core.ts::ledgerWeekOf(resetDay)` is that helper under the housing name and
    `ledger_core.ts::LEDGER_PREPAY_MAX_WEEKS` is the shipped default of 13's injected prepay
    cap (4 in 13; 25a proves 12 through the injected cap and raises the default only with
    the signed CAL-LEDGER-A version and the 13a acceptance recorded in Content numbers). Housing day keys are produced only by
    `server/raid_reset.ts::resetDayKey(ms, REALM_RESET_TIME_ZONE)` (13a); the sim compares
    day keys and every epoch-ms field is display-only. `realm_month_core.ts` (35) is the
    pure sim leaf for the UTC Endeavor month, fed by `server/sim_calendar_feed.ts`.
  - Colliders (10, D17): the registry keys freehold regions under the per-Sim host token
    (`ctx.riftCollisionToken`, which isolates Sims) by origin (ox, oz); each region carries
    its claim's `collisionToken` as the ownership stamp on set/clear; `runtimeRegionAt`
    derives one candidate origin from `dungeonAt(x)` and the UNCLAMPED slot inverse; the
    `InstanceSlot` interface moves to `src/sim/instances/instance_slot.ts` (re-exported
    from `sim.ts` as a type).
  - Upgrade (21, D89): `src/sim/freehold/upgrade.ts`; `contribute_upgrade` carries an
    explicit source mode (`'bags' | 'vault'`, D37/D89) and a `complete` arm (the
    re-attempt: no materials, no second fee); facet members
    `contributeUpgrade(slot, count, source)` and `finishUpgrade()`.
  - Pattern channels (22, D53): `src/sim/content/dungeons.ts` gains the `nythraxis_housing`
    tail rollGroup below `nythraxis_farm`, and `src/sim/rift/progression.ts` the sorted
    exported `HOUSING_RIFT_PATTERN_ITEM_IDS` plus an appended Draw 8 (the only sim logic 22
    touches).
  - Legend Stand (23): the copy reference is owning character id + itemId + instance.name +
    instance.signer + perfected + rolled.quality legendary, never `itemCopyPin`.
  - Later-wave modules (24/34/35/41): `ward_core.ts`, `ward_assignment_core.ts` (pure,
    called by the server inside the allocation transaction), `wards.ts`,
    `ward_favor_core.ts`, `realm_month_core.ts`, `garden_view.ts` and `dye.ts` (the dye
    picker rides the existing apothecary station amenity, D90: no new amenity kind, slot or
    station GLB).
- Content: `src/sim/content/freehold/` (`tiers.ts`, `charters.ts`, `furnishings.ts`,
  `furnishing_recipes.ts`, `furnishing_patterns.ts`, `ledger_schedule.ts`,
  `trophies.ts`, `dungeons.ts`, `layouts.ts`, `items.ts`, later `npcs.ts` (the 24 farmer
  `NpcDef` `freehold_farmer`, merged into `NPCS`) and `endeavors.ts` (35)), merged by
  `src/sim/data.ts` where the table is item, NPC or dungeon data (tiers and layouts are
  served by reference). Item kind `furnishing`
  (`FurnishingItemDef`), the one new kind. Patterns are `RecipeItemDef` rows
  (`pattern_<output>`), never a new kind.
- Facet: `src/world_api/housing.ts` (`IWorldHousing`), pinned in
  `tests/world_api_parity.test.ts` (five edits per member batch), commands appended to
  `COMMAND_NAMES` and tagged in `COMMAND_FACETS` in `src/world_api.ts`. Phase 01's member
  list is: data `myFreehold` and `freeholdLayout` (null until 05 and 08a light them), the
  clock-base method `housingNowMs()` (the `farmNowMs` shape), and the dark no-op methods
  `freeholdEnter`, `freeholdLeave`, `placeFurnishing`, `moveFurnishing`,
  `removeFurnishing`, `undoPlacement`, `redoPlacement`, `payLedger`, `setVisitPolicy` and
  `setFreeholdBuildPresence` (C03). Later appends, none renaming a D20 member (the list
  phase-01 carries): 12 appends `buildStation` and `myAmenities`, 17 appends
  `placeTrophy(plinthKey, trophyId)` and `clearPlinth(plinthKey)` (commands `place_trophy`
  and `clear_plinth`, `COMMAND_FACETS` 'IWorldHousing') beside the `SimContext` primitive
  `ctx.freeholdAccountSources` (get(ownerKey) and invalidate(ownerKey, sourceKind) keyed
  on the D16 host-stamped owner key the sync holds through meta, never an account id; the
  server binding createFreeholdAccountSourceLoader resolves ownerKey to the account; the
  offline and headless local-only binding returns an empty cross-character projection
  with explicit status while the sync reads the local character's own surfaces from meta
  per D19) appended to `CALLBACK_KEYS`, 18 appends `freeholdVisitors`, 21 appends
  `contributeUpgrade(slot, count, source)` and `finishUpgrade()`, 30a appends NEW
  `guildHallBoards()` (next bullet), 34 appends `myWard` and `moveWard(wardId)`, 42 appends
  `myFreeholds`; every other later member is named in its own phase file with the parity
  pin updated in that same change.
- Hall boards read (30a): NEW `server/guild_hall_boards.ts::routes` (RouteDef
  GET /api/guilds/hall-boards, registered in `server/http/registry.ts` beside
  `guildRosterRoutes`, current-membership check on every call) mirrored by the NEW
  `IWorldHousing` member `guildHallBoards(): Promise<GuildHallBoardsInfo | null>`
  (ClientWorld fetches; the offline Sim answers null; headless no-op). Lockout arm:
  one row per lockout key the live model stamps (eleven: heroicLockoutId of the five
  dungeon final bosses, plus the plain and :heroic keys of nythraxis_boss_arena,
  ignivar_raid_arena and ignivar_inner_crucible), each counting currently online
  members whose lockout is live by the isRaidLocked expiry rule (live session metas
  only, no SQL, no character-blob read, no other member named, no week anchor:
  emberWeekAnchorOf serves the D84 ledger week only) plus the viewer's own rows.
  firstKills arm: 31 fills it from the committed guild_deeds projection; 31 adds
  no facet member (D82).
- Instances: `DungeonDef.claimKey`, `freehold_inn_room` (index 15), `freehold_cottage`
  (index 16); interiors `'inn_room'` and `'cottage'` on the `interior` union with
  `DungeonLayout` records (`INN_ROOM_LAYOUT`, `COTTAGE_LAYOUT`) plus lift functions,
  `STATIC_INTERIOR_COLLIDERS` entries, `groundHeight` arms, render variants; the
  `InstanceSlot` interface lives in `src/sim/instances/instance_slot.ts` from 10.
- Wire: self key `fhold` (owner account state, strict decode in
  `src/net/freehold_snapshot_wire.ts`, created in Phase 01 with an empty allowlist and
  filled in Phase 08a), pid-scoped `freeholdState` descriptor event
  (re-sent on resume like `riftStateEventFor`), text-free `freeholdDenied` and
  `freeholdGranted` events (`freeholdDenied` reasons in append-only order: `no_freehold`,
  `locked`, `cooldown`, `visitors_full`, `not_friend`, `dead`, `combat`, `busy` from 05;
  `instanced` and `match` from 06; `not_owner`, `bags_full`, `item_locked` from 08;
  `short` from 13); server sibling `server/freehold_wire.ts` (the pre-switch
  `refusedFreeholdCommand` predicate and the in-switch `dispatchFreeholdCommand` delegate
  from 01; `emitFreeholdSelfKeys` from 08a); `HEAVY_SELF_CMDS` / `HEAVY_SELF_EVENTS` rows;
  `JAILED_BLOCKED_COMMANDS` for the gate and Hearth Key; `src/net/ward_wire.ts` (34).
- Server: `server/freehold_db.ts` (`FREEHOLD_SCHEMA`, `account_freeholds`, 13's keep-forever
  `freehold_ledgers` for immutable paid bills, wave D `freehold_deeds`),
  `server/freehold_routes.ts` (registered in `server/http/registry.ts`, never inline in
  `main.ts`), `server/freehold_config.ts` (`freeholdsEnabled`), error family `freehold.*`,
  Claudium spend kind `freehold` beside `storage`, telemetry source `freehold`, 15's two
  RouteDef rows appended to `server/freehold_routes.ts` (POST `/api/freehold/quote`, a
  mutating method with a typed body so origin_check, content_type and the body schema gate the
  intent-minting Prepare step, and GET `/api/freehold/operation/:operationId`, the side-effect-free
  status read, handled by NEW `server/freehold_purchases.ts`;
  the checkoutAuthorization reference is stored on the 07a operation rows and never
  leaves the server), SKU ids `freehold_charter_cottage` (03) and
  `freehold_master_builders_call` (15), a `freeholdForAccount` read at fresh join beside
  `bankBonusFactsForAccount`.
- Server, 07a rows (NEW, named so 07a, 13, 15, 28, 37 and 42 cite one vocabulary):
  `server/freehold_claim_db.ts` (`FREEHOLD_CLAIM_SCHEMA`, table `freehold_plot_claims`,
  one active claim per `plot_id`) and `server/freehold_operation_db.ts`
  (`FREEHOLD_OPERATION_SCHEMA`, tables `freehold_operations` for intent and
  `freehold_operation_receipts` for applied tombstones), both placed in `ensureSchema`
  after `FREEHOLD_SCHEMA` and before `STORAGE_PURCHASE_SCHEMA`; the claim renewer
  `renewFreeholdClaims` is a `PeriodicSaveWrites` member registered in
  `PERIODIC_SAVE_WRITE_NAMES` beside `heartbeatLeases` (expiry plus heartbeat, the
  `LEASE_TTL_SECONDS` policy); the open-operation deletion guard raises the NEW
  `CharacterFreeholdOperationOpen` class in `server/character_delete_db.ts` beside
  `CharacterStoragePurchaseOpen` (D88); receipts growth rides a gauge modelled on
  `server/bank_ledger_growth_monitor.ts` and pinned in
  `tests/server/main_retention_wiring.test.ts`.
- Guild roster (origin/release/v0.42.0, verified 2026-09-06, re-verify at every guild
  phase start): GUILD_MEMBER_LIMIT is removed; the cap is per guild, base 100 plus
  20-seat pages up to `GUILD_ROSTER_MAX_MEMBERS` (1,000) in `src/sim/guild_roster.ts`;
  `PgSocialDb.guildMembership` carries `rosterPages`; `addGuildMemberAtomic` reads the cap
  from the locked guild row; NEW `server/guild_roster_page_db.ts` (account KEY SHARE,
  guilds UPDATE, `guild_roster_receipts` insert, character save: accounts, then guilds,
  then characters); `guild_roster_receipts` cascades with guilds and characters;
  `SocialTransport.buyRosterPage`, `SocialEvent.guildRosterResult/guildRosterExpanded`;
  `src/world_api/social_graph.ts` `guildBuyRosterPage` and `GuildInfo.memberCap/nextRosterPrice`
  (every housing facet batch conflicts on `tests/world_api_parity.test.ts` at merge).
- Guild hall rail (28/28a/29; D77, D78, D79): `visit_policy` for the guild owner kind is
  set by the leader or an officer and accepts only `guild`, `public` or `private`; 29's
  officer-plus `hall_fund_withdraw` command moves the fund's material slots and gold into
  the guild bank through the existing guild-bank deposit path on the 07a rail; disband is
  28a's tombstone disposition behind the `beginGuildBankDelete` guard extended at BOTH
  deleting call sites (disband and last-member leave).
- Optional deeds (37/38): `FREEHOLD_DEEDS_ENABLED` (37, default off, live '1' also
  requires `freeholdsEnabled`); NEW `allowSerializedCollectibles` policy switch (38,
  default off, beside `allowMounts`/`allowMechChromas` in `server/woc_market_routes.ts`);
  NEW `server/freehold_deed_market.ts` with the plot-shaped `freehold_deed_listings`
  relation and browse feed (never a `WocListingRow`); the NEW `WocStepUpOperation` kind
  `'list_freehold_plot'` (38); refusal `freehold.deed.buyer_capacity` (D80); 38's client
  deed modules are `src/ui/deed_card_view.ts` and `deed_card_window.ts` (never
  `src/ui/hud/housing/deed_*`).
- Client: `src/render/freehold/` (`furnishings.ts` painter modelled on
  `FarmPatchVisuals`, `furnishing_layout_core.ts` in `RENDER_PURE_CORES`, the interior
  dressing, `furnishing_ghost_visual.ts` and its sibling `freehold_light_grade.ts` (never a
  second `interior_light_rig.ts` basename; test `tests/freehold_light_grade.test.ts`), the
  NEW `'hearthView'` `CameraDirectiveKind` in `src/render/camera_director_core.ts` (09),
  later `ward_exteriors.ts` (34) and `garden_tableau.ts` (24)), `src/ui/hud/housing/`
  (barrel + `CLAUDE.md`: `build_mode_*`, `build_input_core.ts`, `capacity_meter_view.ts`,
  `furnishing_palette_*`, `steward_panel_*`, `trophy_case_*` with
  `trophy_case_view.ts::eligibleTrophyChooser` and
  `TrophyCaseWindow.openForPlinth(plinthKey)` as 17's record-only chooser that 11's
  Replace trophy / Clear plinth affordances call), wave A housing window ids
  `steward-window` (16) and `trophy-case-window` (17), the freehold-gate
  `MapMarkerSemantic` arm (`src/ui/map_marker_semantics_core.ts`) with its art, layer and
  accessibility tokens and the `entity_display_core.ts` object arm for the gate (both from
  06), `src/game/distribution_surfaces.ts` (housing fields `freeholdPurchase`,
  `freeholdManageOnWebsite`, `deedSurfaces`; 14 owns `deedSurfaces`, 38 consumes it),
  exactly two housing `HudFeatures` rows `freeholdPurchaseEnabled` and
  `freeholdManageOnWebsite` (D91), keybinds `toggleBuildMode` ('Shift+KeyB'),
  `rotateFurnishingLeft` ('Comma'), `rotateFurnishingRight` ('Period'), `undoPlacement`
  ('Ctrl+KeyZ'), `redoPlacement` ('Ctrl+Shift+KeyZ').
- i18n: `hudChrome.housing.*` in `src/ui/i18n.catalog/hud_chrome.ts`; item names in the
  item-names domain; `apiError.freehold.*` via `npm run new:endpoint`; world-entity names
  in `src/ui/world_entity_i18n.ts`. `hudChrome.housing.charter.feeDetails`,
  `charter.quoteExpiry` and `charter.terms` are named in 15 and 16 with the same exact
  English and rendered by 16 (D92); every UI phase names its new keys with exact English
  in its own file and regenerates both manifests in that same change (D92).
- Deeds family "Homesteader"; Reliquary "Hearth shelf" (furnishing items only; patterns
  never); provisioner firewall arm for the ledger schedule table.

## Content numbers (approved working targets and measured activation rows)
D31/D33 approve the existing values as attributed TUNING targets; they do not invent
missing prices, stack counts, recipe skills, rates or physical dimensions. Fernando
owns gameplay calibration and the economy service owns every price/token calculation.
The exact source/derivation/rounding/measurement/approval inventory is
content-numbers-workbook.md; its producing artifacts gate activation.

The tier ladder (proposal section 6.3; the Inn Room is the packet's tier 0):

| Tier | Freehold | Guildhall | Rooms | Decor budget | Plinths | Amenity slots | Illustrative fee |
|---|---|---|---|---|---|---|---|
| 0 | Inn Room | (none) | 1 | 20 | 3 | 0 | free, every account, no upkeep |
| Common | Cottage | Meeting Hall | 1 | 60 | 4 | 1 | $20 land (Claudium, service-priced) |
| Uncommon | Lodge | Great Hall | 2 | 120 | 8 | 2 | $25 plus materials |
| Rare | Manor | Bastion | 3 | 200 | 14 | 3 | $50 plus materials |
| Epic | Keep | Fortress | 4 plus a courtyard | 300 | 22 | 4 | $100 plus materials plus a prestige deed |
| Legendary | Citadel | Citadel | 5 plus a courtyard and tower | 420 | 32 | 6 | $200 plus materials plus a prestige deed |

Guildhall illustrative fees are roughly 3x the personal examples; only service quotes
set actual prices. Condition spans 0 to 100, with personal/guild wear 1/2 per eligible
realm day. The adopted protective policy pauses after 7 absent days and grants 3 return
days; 07b account or the later guild lifecycle authority captures qualifying gameplay
presence and preserves immutable protection before advancing it. Authentication login
is not that source. Amenities work at 30 and pause below; entry/build/undo still work at 0.

Ledger bills have 3 to 5 lines, always produce plus allowed rotating nonproduce families,
one published schedule per realm week. Source is explicitly bags-only, vault-only or
automatic bags-then-vault. Prepay capacity is 4 weeks initially and 12 from 25a
(`LEDGER_PREPAY_MAX_WEEKS` in `src/sim/freehold/ledger_core.ts`: 13 ships 4; the twelfth
week activates only behind the signed CAL-LEDGER-A and the 13a calendar-authority
acceptance; ledger_core.ts takes the cap as an injected input with LEDGER_PREPAY_MAX_WEEKS
as the shipped default; 25a proves 12 through the injected cap and raises the default only
in the change that records the signed twelve-week CAL-LEDGER-A version and the 13a
acceptance here); bills and prepaid weeks are `ledgerWeekOf` realm weeks and
wear is per realm day `resetDay` (D84); bills and credits retain source/rate identity. The repair amount is flat within its bill; current
condition 93 versus 60 does not prorate it. Working Cottage/Citadel upkeep targets are
about 10%/20% of measured weekly gatherer output, WOC calibration goals without unsupported
classic-era attribution. The Call reference is about 1.5x a bill's market value, never a
game-computed quote. D34 locks current unpaid bill plus condition 100, no new future
credits or consumption of existing future credits. Suspension and return protection use
exact union; no catch-up debt, double-counted overlap or wholly suspended credit burn.

All of the following remain attributed TUNING targets with the listed owner/producer;
measured or signed rows in the workbook precede runtime activation:

| Quantity | Adopted target and source | Owner and producing work |
|---|---|---|
| Wave A/B furnishing outputs | 18 (8 vendor, 10 craft, 3 pattern recipes within the 10); 20 further crafts including produce decoration | Fernando/content manifest; 03/04/19 and 22/24, Codex asset producers |
| Wave B pattern roster | 6 exact pattern rows named in content-manifest.md, approved D38/D53 roster rather than a classic-era count | Fernando/content; 22 one named raid or rift channel plus Marks per row, signed costs/drop weights |
| Hearth Key | 60 minutes, original proposal/state reference; one account cooldown across destinations | Fernando; 06 interaction, 07/07a account authority, 42 shared consumer |
| Concurrent claimed instances per freehold def | 24 per `DungeonDef` (`INSTANCE_SLOT_COUNT`, `src/sim/data.ts`), pre-allocated per def per realm process and reaped `INSTANCE_EMPTY_TIMEOUT` (300, `src/sim/types.ts`) after emptying; the 25th owner receives `freeholdDenied` busy, never a queue; saturation is the honest busy refusal (D50) | Fernando; 05 (the busy arm), 18 (visitor admission rides the same slot), 34 |
| Snapped yaw and physical limits | 15 degrees from the adopted placement/reference; grid pitch, dimensions, clearance and row/byte limits derive from measured legal room/model manifests | Content/interior/placement owners; 03/06/08/19/25, no unreferenced dimensions |
| Visitors | Inn 8 (D50 reuses Cottage target), then Cottage/Lodge/Manor/Keep/Citadel 8/12/16/20/24; exclude all owner-account sessions | Fernando; 18/26 (rows existing at 26: Inn 8, Cottage 8, Lodge 12), 28 (Meeting Hall = the Cottage row until 32, D77), 32 (Manor 16 and the hall tiers), 40 (Keep 20, Citadel 24); admission caps never render culling |
| Public knock | One per account+plot per 10 seconds | Fernando; 26 |
| Ward | 50 plots and 24 admitted occupants | Fernando; 34 DB/geometry/art proof |
| Favor/Endeavor | 4 ranks, permanent +10 decor per rank; monthly progress uses authority UTC month | Fernando; 35 source/reward calibration |
| Showcase | 13 weeks aligned to published realm week; one account vote per realm season, no self-vote | Fernando; 36 |
| Guest book | 50 entries; wave/cheer/admire; one reaction per account+plot+realm day | Fernando; 36 concurrency/retention proof |
| Hall Fund contribution | One current weekly Hall Ledger-equivalent per account per realm week across alts, D54 | Fernando/service; 29 signed resource/currency allowance and rounding, no game token conversion |
| Contribution log | 90-day retention working window | Fernando/DB owner; 29 export/prune/index proof |
| Pattern resale | sellValue 100 subject to verifying the shipped pattern contract | Content owner; 04/22 literal source fixture |
| Dyes and saved layouts | 8 exact palette rows; 0 to 2 declared tint channels; 5 saved layouts per plot | Fernando/art/content; 41/41a, approved palette sources and derived byte bounds |
| Second-home bill | ceil(primary approved integer line times 1.5) on every integer material line: ledger, prepay and the same build-project upgrade bills as the primary; the second plot is granted at the Cottage tier and has no upgrade refusal (D93) | Fernando/content; 42; service separately owns SKU price |
| Settlement examples | Initial 25% burn/75% treasury; illustrative resale 3% burn/7% treasury/90% seller, royalty independently quoted | Economy service and counsel; signed published service artifact, never local token arithmetic |

### Inherited UX constants (source status verified 2026-09-05)
These are existing shared implementation values or the already adopted `DESIGN.md`
target, not new housing balance decisions. A target row does not claim the shared
rollout has shipped. Housing consumes the shared implementation; missing target tokens
belong to that rollout. Every housing-specific value still needs its content/proposal
reference or an explicit ruling with a TUNING owner.

| Content numbers row label | Source, status and value | Owner |
|---|---|---|
| UX shared spacing and scale | Current `src/styles/tokens.css`: spacing xs 4px, sm 8px, md 16px, lg 24px. `DESIGN.md` shell window padding 12px; existing `--ui-scale` uses authored scale 1. | Shared design foundation; housing consumes. |
| UX typography | Adopted `DESIGN.md` target: title 17/22px, panel title 15/20px, button 14/17px, body 14/19px, metadata 12/15px; body floor 12px and visible `input`/`select`/`textarea` floor 16px under coarse input, not every label (`src/styles/base.css`). Target display Alegreya 700, UI Alegreya Sans 400/500/700, label Alegreya Sans SC 700, reading Alegreya 400. Current `--font-display` remains Cinzel until shared rollout. | Shared design foundation. |
| UX window and item geometry | Adopted `DESIGN.md` target: header 44px; header icon 24 to 28px; desktop close 34px with 40px touch hit target; padding 12 to 16px; tabs 32px with 40px touch hit target; bags-family cells 48px with 4px gap. Target slot/button/window radii 5/7/10px; current `src/styles/tokens.css` small/medium radii 4/8px. | Shared design foundation. |
| UX touch targets | `DESIGN.md` and `src/ui/CLAUDE.md`: minimum 40x40 CSS px and all safe-area insets. Derive world-space pointer projection from the real visible hitbox and apply UI scale once; no invented finger-offset literal. | Shared design foundation; build-input tests. |
| UX motion | Adopted `DESIGN.md` target fast/press/panel/frame durations 90/60/160/120ms; closing panel about 120ms. Current `src/styles/tokens.css`: `--transition-speed` 0.25s and `--transition-ease` cubic-bezier(0.4, 0, 0.2, 1). Reduced motion suppresses spatial UI motion and ambient shimmer. | Shared design foundation; no local replacement tokens. |
| UX tooltip | Adopted `DESIGN.md` target: padding 10px, maximum width 320px, hover delay about 250ms and no keyboard-focus delay. Use the shared `#tooltip` and its current behavior until rollout. | Shared design foundation. |
| UX contrast | `DESIGN.md`: normal text 4.5:1; large text/accent 3:1. Theme contrast repair applies in every theme; error text remains `--color-text-error` reference `#ff8f85`. | Shared design foundation. |
| UX current and adopted colors | Current `src/ui/theme.ts` classic accent/border/panel/text/muted: `#ffd100` / `#6f5a2a` / `#15151f` / `#f0ebd8` / `#998d6a`. Adopted `DESIGN.md` target: `#d8a645` / `#926321` / `#12232c` / `#fff4d9` / `#c4b590`. Target ink 1000/950/900/850/800: `#04090d` / `#071117` / `#0b171e` / `#10212a` / `#172b35`. Existing gold-ramp references 900/800/700/600/500/400/300: `#4a2f10` / `#6b4517` / `#926321` / `#bc8732` / `#d8a645` / `#f0c86d` / `#ffe5a3`. Target hover/focus `#f0c86d`, glint `#ffe5a3`, secondary text `#e8dcbe`, faint text `#9ea6a6`, strong panel near `#060f14` at alpha 0.95; info/warning/danger/success references `#45c9ff` / `#ff9d32` / `#ee4d3c` / `#7fdc4f`. These are source references, never housing-local color literals. | Shared design foundation. |
| UX arrival camera | Existing `src/render/camera_director_core.ts` envelope: `VISTA_DURATION` 5.2s, `VISTA_RAMP_IN` 1.4s, `VISTA_RAMP_OUT` 1.3s and `DIRECTOR_RELEASE_TIME` 0.8s. An input cancellation request starts the existing blend-out immediately; it does not instantly zero directive weight. Ordinary online cosmetic settle is 0 through `src/game/arrival_warmup.ts` `arrivalRevealSettleMaxMs`. A housing consumer needs a measured safe room path and static reduced-motion/invalid-path fallback; this source row invents no distance or timing. | Interior and render owners consuming the shared camera. |
| Housing authored and effective lights | Proposal ceiling: 3 authored room point emitters. Existing `src/render/gfx.ts`: iOS profile 2, constrained profile 3, ordinary profile 6; the contributing budget can fall to 1. Shared allocation remains authoritative. LOW grade and actionable visuals must not depend on all 3 contributing. | Interior/render and asset owners. |
| UX screenshot viewports | Existing `scripts/pr_screenshots.mjs`: desktop default 1600x900; required existing touch tiers compact 874x402 and tablet 1180x820. Mobile default 844x390 is harness behavior, not the compact target. | Housing screenshot helper and wave-close matrix. |
| UX screenshot low seed | Existing screenshot harness settings: `graphicsPreset` 1 and `graphicsDefaultApplied` true. Seed each theme explicitly; set desktop viewport in `beforeLoad` when departing from the harness default. | Build-mode capture helper. |
| UX verification inventories | 557 exact housing keys (each with its owning phase) in ux-key-manifest.json and 733 screenshot variants (330 in wave A, each with its producing phase) in ux-shot-manifest.json, derived from the approved UX inventory rather than gameplay tuning | UX owner; every UI phase that adds keys or shot variants (06/09/11/12/14/16/17/18 in wave A; 21/23/24/25/26/28/29/30/30a/31/34/35/36/37/38/40/41/41a/42 later) regenerates both manifests in its own change with every cited count updated (D92), and wave-close verification compares the exact manifests |
| UX numeric measurement ownership | Grid pitch, room dimensions, camera path, transformed furnishing bounds, clearance and touch projection derive from the approved measured art/room manifest. Placement-history bounds derive from the maximum legal placement-row bound. No unreferenced numeric literal is supplied by the UX document. | Content, interior, placement, asset and build-mode owners; Fernando for any new tuning. |

## Per-phase ledgers (fill as phases complete)
Rows marked planned carry the names the packet fixed in advance; the completing phase
replaces the marker with its actual outputs. A partial row records authored scope
only and never declares its remaining deliverables or paired QA complete.

| Phase | New files | IWorld members | SimEvents | Wire keys and commands | Endpoints | Tables | i18n keys |
|---|---|---|---|---|---|---|---|
| 01 | `src/world_api/housing.ts`, `src/sim/freehold/{types,state,commands,index}.ts` + `CLAUDE.md`, `src/net/freehold_snapshot_wire.ts`, `server/freehold_config.ts`, `server/freehold_wire.ts`, `server/freehold_routes.ts`; extractions `src/sim/mob/move_toward.ts`, `server/live_location.ts`, `src/net/blank_entity.ts`, `src/game/seo_metadata.ts`; tests `freehold_module`, `freehold_snapshot_wire`, `freehold_command_chain_online`, `move_toward`, `seo_metadata`, `server/freehold_wire`, `server/freehold_routes` | `myFreehold`, `freeholdLayout` (data, null); `housingNowMs`, `freeholdEnter`, `freeholdLeave`, `placeFurnishing`, `moveFurnishing`, `removeFurnishing`, `undoPlacement`, `redoPlacement`, `payLedger`, `setVisitPolicy`, `setFreeholdBuildPresence` (dark no-ops); SimContext `ctx.freeholds` (live map) and `ctx.freeholdsEnabled` (read-only); `SimConfig.freeholdsEnabled` | none | `freehold_enter`, `freehold_leave`, `place_furnishing`, `move_furnishing`, `remove_furnishing`, `undo_placement`, `redo_placement`, `pay_ledger`, `set_visit_policy`, `set_freehold_build_presence` (refused pre-switch while `FREEHOLDS_ENABLED !== '1'`; `freehold_enter` jail-blocked); self keys: none (empty allowlist) | GET `/api/freehold` (bearer read guard behind the dedicated tier-1-only `HOUSING_READ_POLICY` IP limiter, 60/min, no tier-2 write; `freehold.disabled` 503 while dark, `{ enabled: true, freehold: null }` lit) | none | `apiError.freehold.invalid_input` (generated, reserved), `apiError.freehold.disabled` (English plus the five M16 non-Latin fills); metrics `woc_freehold_refused_total`; env `FREEHOLDS_ENABLED` (strict `'1'`, default off, `.env.example` + `DEPLOY.md` + `turbo.json`) |
| 02 | `src/sim/item_storage_rules.ts`; `src/ui/hud/housing/{index.ts,CLAUDE.md,furnishing_tooltip_view.ts,furnishing_tooltip.ts}`; extraction `src/ui/mount_tooltip_view.ts`; QA shared projection `src/ui/item_instance_view.ts`; fixture `tests/fixtures/furnishing_item.ts`; original furnishing and mount tooltip tests plus 22 QA suites, including actual consumer/tool/commerce/feast host parity, loaded power, custody/journal restart, identity and presentation | none | none | ItemKind `furnishing` and `FurnishingItemDef`; no new command or snapshot key | none | none | English only: `itemUi.kind.furnishing`, `itemUi.market.filterTypeFurnishing`, `hudChrome.housing.furnishing.footprint`, `hudChrome.housing.furnishing.decorCost`, `hudChrome.housing.furnishing.surfaceFloor`, `hudChrome.housing.furnishing.maker`; generic custody leaf `hudChrome.itemTooltip.partyTradeWindowCustody` |
| 03 (complete, paired QA PASS) | `src/sim/content/freehold/{tiers,charters,ledger_schedule,ledger_trial,furnishings,index}.ts` plus local guidance; `src/sim/{surface_npc_bootstrap.ts,freehold/should_spawn_npc.ts}`; `scripts/freeholds/` measured economy/geometry producers; focused content, ledger, producer, furnishing, rollback, NPC, terrain, empty-Hearth and browser keyboard suites; accepted trial/art evidence and eight item WebPs | none | none | exactly eight furnishing ItemDefs; NPC freehold_furnisher and gated stock; existing wire shape unchanged | none | none | eight `entities.items.freehold_*.name` leaves; world entity name/title/greeting for freehold_furnisher; Hearth shelf and hearth_basics name/description; Homesteader/Householder labels and rewards; English plus five required non-Latin fills |
| 04 (complete, paired QA PASS) | `src/sim/content/freehold/{furnishing_recipes,furnishing_patterns}.ts`; `src/sim/freehold/crafted_availability.ts`; `src/sim/professions/{recipe_visibility,train_recipe}.ts`; `src/net/item_copy_anchor_wire.ts`; `server/world_hello.ts`; crafted economy/geometry producers under `scripts/freeholds/`; `tests/{furnishing_recipes,furnishing_pattern_items,furnishing_crafting,freehold_crafted_availability,freehold_crafted_presentation,freehold_crafted_art,recipe_visibility}.test.ts`; accepted calibration evidence and `crafted-content-art-2026-09-07/catalog-verification.json`; current census in `scripts/item_art_audit.mjs`; accepted final runtime evidence; `crafted-qa-reconciled-2026-09-07/` paired QA evidence | existing `cfg` gains optional `freeholdsEnabled`; existing `recipeList` reflects host availability through `ctx.freeholdsEnabled` on Sim | none | `hello.freeholdsEnabled` mirrors host availability; existing commands retained; ten output and three pattern ItemDefs | none | none | thirteen `entities.items.<id>.name` leaves listed below; `hearth_first_crafts` name in all eighteen base Reliquary locale tables and full desc in five non-Latin tables; changed `guide.reliquaryPage.catalogBody` and `guide.profPages.craftProse.armorcrafting.ladderBody`; English plus five M16 item/guide fills |
| 16 (planned) | `steward_panel_*`, charter card | none | | | reads 15's POST `/api/freehold/quote` and GET `/api/freehold/operation/:operationId` | | `charter.feeDetails`, `charter.quoteExpiry`, `charter.terms`, `charter.section`, `charter.reference`, `charter.supportReview`; window id `steward-window` |
| 17 (planned) | `trophy_case_view.ts`, `trophy_case_window.ts` | `placeTrophy`, `clearPlinth`; SimContext `ctx.freeholdAccountSources` | | `place_trophy`, `clear_plinth` | | | `denied.trophyUnavailable`; window id `trophy-case-window` |
| 25 (planned) | | none | | | | | `build.surface`, `build.freeRotate`, `build.movesChildren`, `denied.supportFull`, `denied.invalidTransform`; shot target `housing-build-advanced` (38 variants) |
| 30 (planned) | NEW `tests/guild_chest_opener.test.ts` | none | | | | | `guild.chestMembersOnly`, `guild.stationMembersOnly`, `guild.amenitiesPaused`; shot target `housing-hall-amenities` (38 variants) |
| 30a (planned) | `server/guild_hall_boards.ts` | `guildHallBoards()` | | | GET `/api/guilds/hall-boards` | | `guild.lockouts`, `guild.firstKills`, `guild.lockoutRow`, `guild.ownLockoutRow`, `guild.noLockouts`, `guild.firstKillsUnavailable`, `guild.membersOnly`, `guild.boardLoading` |
| 31 (planned) | `server/freehold_guild_clear_admission.ts`, `server/freehold_guild_clear_bridge.ts`, `src/sim/freehold/guild_clear_contract.ts` | none (D82) | | | fills 30a's firstKills arm | `guild_deeds` | `guild.firstKillRow` |


04 reconciled paired QA inventory, 2026-09-07: **PASS**, four findings resolved
(three source/test findings and DOC-1). The source repairs span
`0932963250..69ffdab561`, in two commits, `d5ea0825d1` and
`69ffdab561`, with independent entire-fix review and supplement PASS. HN1 adds
`FURNISHING_PATTERN_ITEMS` to `src/sim/content/freehold/index.ts` and routes
`src/sim/data.ts`, `src/sim/content/recipes.ts`, and
`src/sim/freehold/crafted_availability.ts` through that barrel. COV-1 and PER-1 extend `tests/freehold_crafted_availability.test.ts` with
unrelated-state preservation and the actual thirteen-item JSON save cohort.
There are no new files, item IDs, balance values, schema, wire keys, or i18n keys
from these source fixes. DOC-1 corrects only the evidence summaries' calibration
check count to 50, matching the retained receipt; its correction is recorded in
`crafted-qa-reconciled-2026-09-07/reviews/docs-final.md`. Current evidence is in
`crafted-qa-reconciled-2026-09-07/`; the accepted original inventory below is
retained as its historical snapshot. The final shared gate exited 0 with all twelve steps green.

04 accepted development implementation inventory, 2026-09-07
(original implementation snapshot at `3666d89647`):

- Signed development CAL-RECIPES-A, CAL-PATTERNS-A and CAL-FURN-A are in
  `content-numbers-workbook.md`, tied to `crafted-content-trial-2026-09-07/acceptance.md`
  and exact SHA-256 `c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b`.
  The immutable proposal's pending fields are historical; its acceptance supersedes
  them for development only. Production approval remains false.
- `FURNISHING_RECIPES` is merged through `src/sim/content/recipes.ts::ALL_RECIPES`;
  `FURNISHING_PATTERN_ITEMS` merges through `src/sim/data.ts`. Outputs extend
  `src/sim/content/freehold/furnishings.ts`; the vendor's eight-item stock remains
  a distinct inventory. Every output below has recipe ID `recipe_<outputId>` and
  name key `entities.items.<outputId>.name` in `src/ui/i18n.catalog/items.ts`.
  Seven craft station bindings use `STATION_TYPE_BY_CRAFT`. The three explicit
  legacy bindings are inscription/apothecary, jewelcrafting/forge and
  enchanting/toolworks. `trainingStationTypeFor` already reads the explicit
  recipe station before the craft-map fallback; no new station is introduced.

| Output ID | English name | Craft / learning |
|---|---|---|
| `freehold_weapon_rack` | Weapon Rack | weaponcrafting / trainer |
| `freehold_iron_brazier` | Iron Brazier | armorcrafting / trainer |
| `freehold_patchwork_rug` | Patchwork Rug | tailoring / trainer |
| `freehold_hide_armchair` | Hide Armchair | leatherworking / trainer |
| `freehold_clockwork_lamp` | Clockwork Lamp | engineering / pattern |
| `freehold_glass_floor_lamp` | Glass Floor Lamp | alchemy / trainer |
| `freehold_chart_easel` | Chart Easel | inscription / pattern |
| `freehold_jewel_floor_lamp` | Jewel Floor Lamp | jewelcrafting / pattern |
| `freehold_set_supper_table` | Set Supper Table | cooking / trainer |
| `freehold_glow_lantern` | Glow Lantern | enchanting / trainer |

- Pattern IDs/names: `pattern_freehold_clockwork_lamp` (Schematic: Clockwork Lamp),
  `pattern_freehold_chart_easel` (Technique: Chart Easel), and
  `pattern_freehold_jewel_floor_lamp` (Design: Jewel Floor Lamp). Each has its own
  `entities.items.<patternId>.name` key, rare quality, sellValue 100, corresponding
  `recipe_<outputId>` teaching ID and one 16-Mark `HEROIC_VENDOR_STOCK` offer in
  `src/sim/content/heroic_vendor.ts`. No luck route or pattern relic is added.
- Exactly `hearth_basics`, then `hearth_first_crafts`, form the current Hearth
  page inventory. The new page contains the ten outputs above in this order, each
  with its own profession source; its name is First Hearth Crafts. English name
  and desc are owned by `src/sim/content/reliquary.ts`, with `hearth_first_crafts`
  name rows in all eighteen base `src/ui/reliquary_i18n.locales/` tables. The five
  full non-Latin desc rows are in `{zh_CN,zh_TW,ja_JP,ko_KR,ru_RU}.ts`; the thirteen
  remaining base locale page-name obligations were repaired during the full gate.
  Changed guide keys are `guide.reliquaryPage.catalogBody` and
  `guide.profPages.craftProse.armorcrafting.ladderBody`. Item names and both guide
  keys have English sources plus the five M16 fills; compiled locale generation
  and wiki freshness passed in the shared gate.
- Original implementation snapshot totals were 43 pages / 484 raw slots / 337
  unique item IDs / 448 full-completion slots / 419 character-completion slots.
  After release merge `7f4fe99619`, current `tests/reliquary_content.test.ts`
  pins full completion at 462 and character completion at 433; preserve incoming
  catalog additions rather than restoring historical totals. Channel
  pins preserve Crucible: 55 teaching items comprise 54 recipe manuals teaching
  76 drop recipes plus one enchant teaching item. There are 43 non-Crucible
  teaching items; furnishings are the seventh disjoint recipe family. Historical
  03 totals below describe its completion snapshot, not the current catalog.
- Thirteen item-specific `public/ui/items/<id>.webp` assets and
  `public/ui/items/mapping.json` provenance are authored under
  `crafted-content-art-2026-09-07/`; the final rug/provenance v2 has visual
  acceptance. `catalog-verification.json` records 1277 art catalog entries and
  1292 live item definitions, matching the current `scripts/item_art_audit.mjs`
  census. Its machine checks passed but its verdict remains null. The accepted
  runtime manifest is
  `docs/screenshots/freehold-crafted-content-2026-09-07/runtime/manifest.json`,
  SHA-256 `09ab384da4112f60b75cf8ebff986451dad6fda709fef158dda160713c653832`,
  143845 bytes. Its 42 captures are sixteen desktop, twenty-two mobile including
  scroll/portrait, two guide catalog and two catalog-prose views. Six actual
  locales, all thirteen icons, real bags/bank/vendor/tooltips/mail/trainer
  surfaces and three real purchases spending 48 Marks to zero on both desktop
  and mobile are verified, with zero page errors or unloaded images. Frontend
  reviewer and coordinator accepted the set without remaining art/capture nits;
  `items.accepted-art.json::review.runtime` records acceptance. This is software
  browser emulation; it proves neither physical-device/hardware LOW performance
  nor final GLBs/placement. This acceptance does not close the distinct paired 04 QA audit.
- Serialization measurement in `tests/professions_blob_growth.test.ts` now has
  215 known recipes including retired entries (previously 205), 19161 profession
  bytes and a 211458-byte maximal character fixture. The exact 1255-byte growth
  is 324 known-recipe bytes + 355 discovery bytes + 576 Hearth metadata bytes.
  The counterfactual 210203-byte baseline remains tested. The structural
  profession ceiling remains 20480 bytes; the server's 229376-byte threshold is
  still a warning, not a save cap. Finished database performance and persistence
  reviews PASS in `crafted-content-trial-2026-09-07/reviews/implementation-*.md`.
  Disabling the flag on this build preserves state. An older binary preserves
  unknown item copies and recipe strings but may discard unknown discoveries and
  Reliquary progress during load/save; lossless old-binary rollback is not claimed.
  The permanent item-ID golden appends only these thirteen IDs; it does not
  rewrite historical membership.
- Full-gate repairs cover Hearth/profile/guide/bag/Exchange/art/recipe/source
  pins and item IDs, with focused checks green. Sim's recipe list reads the
  capability through `ctx`, preserving the sole config-reader contract. The
  final shared command was
  `GATE_SELECT_BASE=49ed3f09333f4f1293edda9a98fe590c5651c20e node scripts/gate_select.mjs`:
  exit 0, all twelve steps green. Unit results: 3860 files passed / 34 skipped;
  57858 tests passed / 2 expected failures / 541 existing conditional skips.
  Browser results: 43 files / 376 tests passed. Typechecks, environment/server/
  bot/client builds, freshness, security and SFX all passed. Exact command/results
  and reviewer closure are recorded in
  `crafted-content-trial-2026-09-07/implementation-validation.md`, with execution
  log `/tmp/freeholds-crafted-gate-final.log` and reports in its `reviews/`
  directory. Final QA/fresh-review records replace their interim evidence status.
  The four original completion commits are `86eb86bbe2`, `8bd097d898`,
  `b3c2452b49` and `3666d89647`. The post-fourth-commit
  `npm run ci:changed` passed with exit 0, 1967 files checked and existing warnings
  only; working-tree status was clean. This receipt is incorporated by amending
  only the fourth documentation commit, keeping exactly four commits. The parent
  reruns `npm run ci:changed` after the actual final amended commit and records
  that result in the handoff. The commit IDs above identify the final original
  implementation, not an intermediate pre-amendment state. Subsequent dependency
  integration is `2e24ba8818`. The separate 04 QA audit later returned FAIL,
  with 29 findings, 28 accepted repairs and unresolved F01; see the current-phase
  summary and `crafted-qa-2026-09-07/validation.md`.
- Remaining production art/space gates: final crafted reference
  `docs/freeholds/art/references/freehold-crafted-a-board.png`, model family
  `scripts/assets/freehold_crafted/`, exporter `export_freehold_crafted.mjs`, spec
  `freehold_crafted.json`, parsed `tests/freehold_crafted_asset.test.ts`, remeasured
  final geometry/decor costs, legal maximum room packing/one-over refusal,
  protected arrival/navigation and actual LOW performance. Existing numeric,
  service and activation gates remain closed.

02 implementation notes: furnishing has `KIND_RANK` 11, immediately after tool 10 and
before mount 12; all existing relative ordering is preserved. Ordinary bag categories
are unchanged, with furnishings reachable through All only. The floor tooltip is a
registered pure core and the maker value comes from the copy signer, never the def.
The mount tooltip extraction lowers the `hud.ts` ceiling from 18716 to 18703. The UX
key manifest was regenerated byte-identically at 557 approved rows, including the four
existing owner-02 rows; no inventory count changed. No shipped furnishing ID or asset
was added. Scoped validation and `node scripts/gate_select.mjs` passed. The required COVERAGE
reviews, fresh fix-round review and final browser evidence all passed;
post-commit `npm run ci:changed` passed with exit 0. Three scoped commits are local,
with original evidence in `progress.md`.

02 QA notes: four repair commits end at `d386635394`; all 40 findings have
independently reviewed repairs and evidence. The shared item-instance projection
retains authored furnishing identity and real custody while excluding equipment
power. Existing enchant, Rift, feast, discovery, Exchange, WorldMarket and regalia
seams gained positive kind admission; no stored field, wire command, table or
endpoint was added. Existing regalia cache logic moved into its pure core;
`hud.ts` and `renderer.ts` ceilings are now 18663 and 12988. The final census has
zero MISSED sites. D25 remains the mount policy rule, ordinary bags remain
All-only and no source-absent footprint or cost is invented. The generic custody
key was regenerated through the owning pipeline; its exemption requires exact
key AND pending status. No furnishing locale overlay or asset was authored.
The renderer provenance remint changed only current hashes, preserving frozen
captures and asset bytes. Required scoped, host, PostgreSQL and visual reruns
passed. The complete shared gate also passed all 12 steps with actual exit 0;
standalone i18n generation/status and the repeated 110-file source seal passed.
The final verdict documentation, checklist and post-verdict-commit check are
recorded through the QA validation handoff. The named release and handoff gates
below remain unsigned.

03 accepted development implementation notes, 2026-09-07:

- The immutable original acceptance and integrated producer replay are in
  `content-trial-2026-09-07/{acceptance,revalidation}.md`. Fernando accepted the
  fourteen-visit laboratory basis, not measured player hours. Runtime production
  approval remains false and its production schedule null; the separate trial
  lookup returns one of twelve frozen bills for an injected week ordinal.
- Exact item IDs: `freehold_timber_bed`, `freehold_round_table`,
  `freehold_spindle_chair`, `freehold_low_stool`, `freehold_woven_rug`,
  `freehold_brass_lantern`, `freehold_storage_chest`, `freehold_open_bookshelf`.
  Each is common, 250/60 copper, cosmetic, individually stored and backed by the
  accepted measured stand-in geometry and registered painted art.
- `freehold_furnisher` is appended and admitted before entity construction only
  for lit hosts. It uses existing terrain, without a new smoothing pad. Existing
  terrain goldens and dark NPC/RNG fingerprints are preserved. Hearth publishes
  `hearth_basics` with those eight items and the actual vendor source. The
  catalog totals at 03 completion were: 42 pages / 474 raw / 438 full / 409 character slots.
- Homesteader deeds remain the manual `homesteader_first_furnishing` and
  `homesteader_first_cottage`, with the Homesteader title and `householder` border.
  Future placement and Cottage purchase grant sites remain later work.
- The maximal persisted fixture is 210203 bytes; the eight discoveries and Hearth
  metadata add 188 + 444 = 632 bytes. Earlier Homesteader 85 and Field Kit 12 byte
  attribution, narrow tracking band and 229376-byte warning threshold remain.
- Final shared gate, inspected visual evidence, paired QA and fresh review PASS;
  see `content-final-validation-2026-09-07.md` for the exact commands, four commit
  groups and all 39 resolved findings. NPC voice is an explicit pre-shipping
  requirement. Production enable still needs final numerical/geometry acceptance,
  compatible fleet-wide catalogs and the documented pre-enable backup boundary.

<details>
<summary>Historical partial checkpoint before development trial acceptance</summary>

03 implementation notes, 2026-09-07, PARTIAL/BLOCKED:

- `FREEHOLD_TIERS`, `FREEHOLD_TIER_IDS` and `freeholdTierById` publish the existing
  approved `inn_room`/`cottage` targets through frozen records and shared lookups.
  `FREEHOLD_CHARTERS` and `isKnownFreeholdCharterId` publish only
  `freehold_charter_cottage` -> `cottage`, without price or display copy.
  The source freeze records the 2026-09-06 Fernando R05/D31 approval proof and exact
  source hashes; it does not turn illustrative fees into sim values.
- The ledger catalog contains eighteen approved eligibility alternatives, preserving
  separate fish/produce choices and explicit base-first grade order. These are
  obtainable material identities only. `FREEHOLD_LEDGER_SCHEDULE` is exactly
  `{ status: 'pending_approval', calibrationId: 'CAL-LEDGER-A', schedule: null }`.
  No operational quantity, cycle, published bill version or selected weekly row
  exists. The source freeze records every missing CAL-LEDGER-A output and signature;
  literal eligibility/firewall tests cannot substitute for approved-cycle fixtures.
- New deed IDs are `homesteader_first_furnishing` and `homesteader_first_cottage`,
  appended at the actual `DEEDS`/`DEED_ORDER` tail. Both use the existing routine
  milestone value of 5 renown and manual triggers. Their rewards are the Homesteader
  title and `householder` border, respectively. The border uses the shared rendered
  home motif and palette, with no gameplay effect. Existing title/description/name
  localization carries the five required non-Latin fills. No automatic evaluator,
  placement grant or Cottage grant site is added; 08 and 15 still own the raises.
  Both painted deed crests have Codex/canonical-converter provenance in
  `content-art-2026-09-07/deeds.accepted-art.json` and local runtime WebPs. This is
  authored reward content, not a claim that its future housing actions are earnable.
- Hearth's literal shelf type, navigation/order, empty-safe window behavior, guide
  rendering/generator and localized labels are prepared. Published Hearth page
  inventory is empty. Planned page `hearth_basics` remains deferred until all eight
  actual item definitions and the vendor source resolve; it adds no completion
  denominator or arbitrary page limit. Homesteader joins the existing
  `horizons_titles` page through `RELIQUARY_HORIZON_TITLES`. The measured current
  `tests/reliquary_content.test.ts` pins are 466 raw slots, 430 full-completion slots
  and 401 character-completion slots across 41 unchanged pages. A title slot is not
  a furnishing item or Hearth page.
- The furnishing item IDs remain planned only: `freehold_timber_bed`,
  `freehold_round_table`, `freehold_spindle_chair`, `freehold_low_stool`,
  `freehold_woven_rug`, `freehold_brass_lantern`, `freehold_storage_chest` and
  `freehold_open_bookshelf`. No corresponding `ITEMS` entries, shipped-item golden
  additions, item-name locale rows or production item-art registrations exist.
  Planned NPC `freehold_furnisher` is absent from `NPCS`, spawns, stock and
  world-entity name rows. The eight icons remain staged candidates, documented by
  `content-art-2026-09-07/staged-art.json` and `size-review.webp`, rather than shipped
  furnishing assets. Their art does not provide numeric approval or model geometry.
- `content-source-freeze-2026-09-07.md` is the concrete numeric readiness artifact.
  CAL-LEDGER-A is produced by CONTENT/UPKEEP with ECONOMY QA and Fernando/service
  approval of exact bills. CAL-VENDOR-A is CONTENT's complete per-item copper/quality
  table for Fernando approval. CAL-DECOR-A/B is CONTENT/ART's measured model costs
  and legal maximum-layout/LOW evidence for Fernando approval. MEASURE-SPACE is
  ART/CORE's approved room/model/grid/footprint/collision/clearance evidence. All
  remain unsigned; the rug's explicit underlay `r: 0` does not complete its other
  required fields. Production bills and furnishing acquisition remain disabled.
- Coordinator-owned typecheck and all requested scoped suites pass, including 666
  tests in the exact twelve-file command. Wiki/i18n regeneration passed. Six required
  COVERAGE reviewers returned; instruction/art safety and pre/final database growth
  reviews also finished. Repairable findings are addressed and visual evidence is
  accepted. The shared gate passed all 12 steps (57665 unit and 373 browser tests).
  Fresh whole-fix review passed with no open findings or nits; evidence is in
  `content-validation-2026-09-07.md`. No overall PASS is inferred from scoped checks.
  The user subsequently authorized incremental local commits: `1d583786f6` records
  gate import-order repairs, `add3b7b2d9` the approved tables and `93710767dd` the
  deeds, Hearth consumers and their same-change obligations. This documentation
  checkpoint retains the reviews and `content-completion-checklist-2026-09-07.md`.
  Missing activation approvals do not prevent completed independent chunks from
  being committed. The final post-commit `npm run ci:changed` result is reported
  in task completion. No push occurred.

</details>

## Tracked release and handoff gates

There are no unanswered settlement questions. Signatures, measured calibration and
implementation evidence remain concrete acceptance work, with the following owners
and producing artifacts. Their absence blocks the named activation/submission, not
packet decision closure. The live PR dependency above is source state, not a product
question. Never present unsigned drafts as legal/platform/service acceptance.

| Gate | Artifact and producing work | Owner and activation condition |
|---|---|---|
| Economy catalog, authorization and settlement | ../prd/woc/freehold-service-contract.md; 07a/15 then every priced consumer | Economy service and Fernando accept catalog/version, opaque eligible-checkout proof, quotes, pooled ledger, durable recovery and published conversion/burn policy before new spend/enable. |
| Counsel, Terms and storefront model | ../prd/woc/freehold-counsel-memo.md, freehold-terms-amendment.md and freehold-store-listing-drafts.md; 14/15/16, checked 20 and revisited 44b | Legal team and Fernando approve/publish the applicable model before production enable or a housing-bearing storefront submission. Final 44b revisits the completed implementation and prepares the legal-team handoff. |
| Optional deed territories and irreversible authority | ../prd/woc/freehold-deed-service-contract.md and freehold-territory-authority-schedule.md; 37/38, checked 39 and 44b | Service/legal/Fernando sign supported territories, per-asset powers and transfer/irreversible-operation policy before optional deed activation. Unknown eligibility refuses new operations; accepted operation recovery remains required. |
| Approved numerical rows | content-numbers-workbook.md and content-manifest.md; each named producer; the four-week measured report at NEW FUTURE docs/freeholds/ledger-calibration-report.md and the every-second-release budget review at NEW FUTURE docs/freeholds/housing-budget-review.md, both created by 20 and extended by later closes | Fernando owns gameplay target acceptance and the service owns prices. Exact trial derivations, rounding, source and measured calibration/signature precede runtime activation; no missing quantity is guessed. |
| Accepted development content; production calibration unsigned | content-trial-2026-09-07/acceptance.md and revalidation.md supersede the historical content-source-freeze-2026-09-07.md for development; CAL-LEDGER-A, CAL-VENDOR-A, CAL-DECOR-A/B and MEASURE-SPACE retain named final acceptance | Fernando accepted the measured trial on 2026-09-07. CONTENT/UPKEEP/ECONOMY QA still produce final Ledger calibration for Fernando/service approval; CONTENT/ART and ART/CORE retain final vendor, decor, room/model/LOW approval. Production remains disabled. |
| Source calendar, lifecycle and rollout capability | Future persistence-rollout-contract.md, lifecycle-policy-binding.md, lifecycle-db-contract.md and upkeep-calendar-db-contract.md from 07/07b/13a | Named service/operations/DB owners accept account source/reset-policy assignment, immutable history/finality, bounds, capable-release rollout/rollback and actual PG proof before upkeep activation. |
| Final assets and image replacement | art-brief.md/content-manifest.md and per-wave final-asset proof; final 44a icon/image replacement | Codex asset sessions use existing intake/provenance/export/compile/LOW/screenshot gates. No placeholder is counted as a final shipping asset; final 44a rechecks all feature-created icons/images before 44b. |
| Runtime safety and distribution | 01 strict live FREEHOLDS_ENABLED gate; 37 FREEHOLD_DEEDS_ENABLED (default off, requires freeholdsEnabled); 38 NEW allowSerializedCollectibles policy switch (default off, beside allowMounts/allowMechChromas in server/woc_market_routes.ts); 14 seven-distribution capability matrix; every priced implementation and QA | Packet owners prove dark route/command/catalog behavior, complete forbidden submodel absence and independently approved management flow before activation. |

Final ordering is 44 implementation, 44 QA, 44a Codex artwork, 44a QA, 44b legal
revisit/handoff, 44b QA. Only then can the completed program be reported; durable source
preservation still precedes any separately authorized cleanup. No push/PR or legal
message is performed in this documentation session.

## Gotchas (read before the matching phase)

- Crafted availability (2026-09-07): a new `hello.freeholdsEnabled` value must
  invalidate the open crafting view signature even when inventory and profession
  data are unchanged. Keep the capability in the existing refresh signature;
  `tests/crafting_reagent_refresh.test.ts` drives this reconnect case.
- Recipe catalog cache (2026-09-07): the dark filtered list must follow supported
  `ALL_RECIPES` length changes while preserving stable identity when unchanged.
  Rebuild on the same length invalidation contract as the live recipe index;
  `tests/recipe_visibility.test.ts` covers insertion and removal.
- Crafted channel census (2026-09-07): after the Crucible merge,
  `tests/apex_pattern_channels.test.ts` pins 55 teaching items: 54 recipe manuals
  teach 76 drop recipes and one teaching item teaches an enchant. Furnishings
  form the seventh disjoint recipe family; 43 is the non-Crucible teaching-item
  count. Do not apply the old 40-to-43 total or sixth-family instructions to the
  merged catalog.
- Runtime capture (2026-09-07): change locale through the actual Options
  `changeLanguage` fanout. Importing a fresh Vite i18n module can mutate a second
  module instance while the live HUD stays English; inspect the rendered locale
  before accepting a localized capture.
- Item action slots (2026-09-07): neither furnishing nor recipe items have an
  action-slot surface. Capture their real bag, tooltip, crafting, vendor and
  Reliquary contexts as applicable; do not invent an action-slot proof for either
  kind or add a furnishing use action to satisfy the capture harness.
- Accepted content trial (2026-09-07): preserve the exact original artifacts and
  accepted twelve-bill version; production approval remains false/null. The
  actual eight-item Hearth page is published. Empty-catalog fallback still uses
  Overview and is exercised by the real window with an injected older catalog.
  Do not restore historical absence assertions or invent a page cap. NPC voice
  remains required before shipping. Older catalog readers discard new discovery
  and Reliquary metadata; acquisition enable requires compatible fleet-wide
  catalogs and a pre-enable backup, not merely flipping the feature flag off.
- Terrain (2026-09-07): a new NPC definition normally creates an automatic calm
  pad even when that NPC does not spawn. The furnisher deliberately uses existing
  ground. Both terrain goldens must remain unchanged; a feature flag must not
  split shared terrain between hosts.
- Catalog expansion (2026-09-07): the maximal character fixture earns every deed,
  so even currently manual-only records grow its serialized deed map. Isolate each
  new entry before historical content equations; the Homesteader pair contributes
  exactly 44 + 41 bytes. Shift both narrow tracking edges equally, preserve the
  warning threshold and obtain database performance review before and after the
  adjustment. Live art, profile and forced-color geometry counts also have their
  own literal tests beyond the main content suites.
- Screenshot evidence (2026-09-07): CI's sparse checkout couples every referenced
  screenshot subtree from all tracked reference-bearing files, including docs and
  acceptance manifests. A new retained subtree needs the same include in all five
  sparse test-job blocks and the exact cone literal in `tests/ci_workflow.test.ts`.
  Preserve computed set equality; do not narrow its corpus to avoid admitting
  required evidence. A focused parity run after staging catches the omission.
- Codex instruction audit (2026-09-07): follow `AGENTS.md` for runtime authority and
  `docs/codex.md` for effective loading. Read this worktree's skills explicitly if the
  desktop task still advertises another checkout. Use these Gotchas instead of Claude
  personal memory, and reuse only concern criteria from Claude fallback reviewers.
  Preserve staged `.mts`/`.cts` checks and effective Git hook ownership when changing
  adapters. Instruction/skill/hook-only diffs must reach CI security and tests. The
  selective gate is the completion bar; explicitly format new metadata and run
  `npm run ci:changed` after the actual last authorized commit. This audit does not
  start content implementation or change the completed furnishing QA verdict.
- `src/sim/sim.ts`, `server/game.ts`, and `src/net/online.ts` sit at ZERO monolith slack on
  the packet base (their `tests/monolith_budget.test.ts` pins equal their line counts
  there: 12006, 10336 and 5861), and `origin/release/v0.42.0` re-pinned them at 12465,
  10587 and 5873 in its drift commits; the phase re-reads the pins from
  `tests/monolith_budget.test.ts` at phase start after the merge-forward and never budgets
  against either literal. Every delegate or case label added must be paid for by
  extracting an existing block first, then lower the ceiling. `IWORLD_MEMBERS` probes
  the prototypes, so facet methods stay one-line delegates on `Sim` and `ClientWorld`.
- Measured at the 01 head (2026-09-06, base still `origin/feature/masterwrought` 0f53c92ff7,
  PR 3872 open): `src/main.ts` ALSO sat at zero slack (11459) and needed a fourth
  extraction for its one `freeholdsEnabled` line. The four ceilings after 01 equal the
  files exactly: `src/sim/sim.ts` 11983, `server/game.ts` 10301, `src/net/online.ts` 5708,
  `src/main.ts` 11384. Every later phase re-reads the pins; 02's furnishing kind touches
  `src/sim/types.ts`, not a monolith, but any `sim.ts` merge line still owes an extraction.
- Locked during 01 (engineering, no product change): (a) the offline flag is gated like
  its two sibling live-world flags, `freeholdsEnabled: world === undefined` in `src/main.ts`,
  so the stock offline world is lit (D3) while custom editor play-test maps and the editor
  viewport (`src/editor/3d/viewport.ts`) boot dark; the headless env passes `true`.
  (b) `SimConfig.freeholdsEnabled` on a realm is a BOOT SNAPSHOT of `FREEHOLDS_ENABLED`
  (a running realm needs a restart); only the wire predicate and the status route read the
  env live. (c) `freehold_enter` joined `JAILED_BLOCKED_COMMANDS` (a door step into instanced
  space); `freehold_leave` is deliberately not jail-blocked. (d) GET `/api/freehold` mounts
  a DEDICATED housing read limiter (`HOUSING_READ_POLICY`: IP-keyed, 60/min, tier-2 `none`
  so an allowed request pays no pg UPSERT; `HOUSING_READ_MAX_PER_MINUTE` in
  `server/ratelimit.ts`, pinned in `tests/server/tunables.test.ts`) AHEAD of the bearer guard
  and keeps auth AHEAD of the flag check (the flag never leaks to an anonymous probe); every
  later housing endpoint (15, 30a) follows that onion order. (e) `ctx.freeholdsEnabled` has zero production
  consumers until 03 (furnisher stock) and 06 (gate prompt, Hearth Key); the waiver is
  recorded beside the zero-consumer rule in `src/sim/CLAUDE.md`. (f) `ctx.freeholds` is
  owner-keyed: the first `loadFreehold` caller (05/07) pairs it with `evictFreehold` at
  account or character unload in the same change and registers the table prune in
  `server/retention_sweep.ts` with the DDL (07). (g) `freeholdTransitionId` is a
  ClientWorld-only mirror; its first consumer (08a) lands it on `IWorldHousing` and both
  hosts with the parity pin. (h) the first behavioral read of `ctx.freeholdsEnabled` adds a
  parity scenario booting the flag true (03). (i) the housing UI (11) gates its senders on a
  server-advertised capability so a dark realm never burns a command-lane token per click.
  (j) the real housing command bodies (08) re-validate the payload shape inside
  `src/sim/freehold/` so the offline host enforces what `server/freehold_wire.ts` enforces.
  (k) `FreeholdPlotId` is BRANDED (`src/sim/freehold/types.ts`), so a raw string, and in
  particular a `FreeholdState.ownerKey`, cannot be assigned to a public `plotId`; the only
  constructor is `asFreeholdPlotId`. 07's row mapper casts once at the database boundary.
  (l) `ctx.freeholds` is a `Map`, so it walks in INSERTION order, which is host-dependent
  once 07 feeds it. Sim code that iterates it MUST sort by owner key first or the three
  hosts fork on one seed.
  (m) `serializeFreehold` neutralizes `isDecorating` to false at the persistence boundary
  (C03: ephemeral presence never saves), so 07 cannot forget to strip it.
  (n) `ctx.freeholdsEnabled` is NOT re-checked in the sim command bodies, so
  `refusedFreeholdCommand` in `server/game.ts` is the sole enforcement on the COMMAND WIRE
  today (the REST status read gates itself in `server/freehold_routes.ts`).
  Whoever lands the first real body (08) either opens it with a `ctx.freeholdsEnabled`
  early return or records the ruling that the dispatch gate is the one gate.
  (o) `ClientWorld.buildPresenceSeq` is advisory and monotonic-WITH-GAPS: it advances even
  when the frame is dropped (spectating, closed socket), and no server-side ordering or
  drop logic exists yet. C03 must never treat it as a dense counter.
  (p) The five coined non-Latin renderings of "Freehold" are now locked in
  `scripts/i18n_glossary.json` under the `housingSystem` category (ja and ru transliterate,
  ko and both zh render the meaning; that split is the recorded ruling). Later housing
  surfaces reuse those forms and never re-coin a per-surface variant.
  (q) Three server-side throwaway Sims (`server/main.ts` initialCharacterState,
  `server/pbe_boost.ts`, `server/community_test_accounts.ts`) construct without
  `freeholdsEnabled`, so they are dark even on a lit realm. Harmless while no housing
  behavior exists; it becomes a hazard at 05/07 if a fresh character's default freehold
  record is stamped at serialize-character time, because a boosted or provisioned
  character would come out without one.
  (r) The 01 commits are ONE ATOMIC UNIT: the facet commit imports the sim types and
  appends the wire tokens before the module and the game.ts labels exist, so only the tip
  typechecks. Do not bisect inside `4c982784ff..c946091c07`, which holds FIVE commits:
  the four code commits plus the ledger commit that closes them.
  (s) The `blank_entity.ts` extraction is a neutral-default entity FACTORY, not the
  "decode block into a `src/net/*_wire.ts` sibling" the phase file named; the relief is
  equivalent and the move is verbatim, but the substitution is deliberate. The fourth
  extraction (`updateSeoMetadata` out of `src/main.ts`) is likewise unnamed in the phase
  file and justified by the remeasure clause.
  (t) `moveToward`'s doc comment lost an em dash during the otherwise verbatim move (the
  repo forbids em dashes and a Stop hook blocks them), so a future auditor diffing the two
  bodies will find one comment line that is not byte-identical. Everything executable is.

Parity findings the reviewers raised that are LATENT today and owed by a named later phase:
- THE DARK REFUSAL IS INVISIBLE ONLINE. All ten ClientWorld senders use `this.cmd({...})`,
  which attaches no `rid`, and `sendCommandOutcome` returns immediately without one, so the
  server's refusal sends the client nothing and it cannot tell refused from accepted. There
  is also no WS counterpart to the REST `freehold.disabled`. Symmetric with offline today
  (both are silent no-ops), so nothing is broken while dark; the moment the UI ships (11) a
  realm that forgot `FREEHOLDS_ENABLED=1` gives a dead button with zero feedback. 11 either
  sends these through `cmdWithOutcome` or gates its senders on a server-advertised
  capability, which gotcha (i) already requires for a different reason.
- WHEN THE DESCRIPTORS LIGHT UP (05/08a) THEY MUST RETURN VALUE COPIES, never a live
  reference into `ctx.freeholds.get(k).layout`. The online mirror hands out freshly decoded
  objects, so a consumer that mutated the offline live array would fork the two hosts while
  every test stayed green. `cloneFreeholdState` in `state.ts` is the tool.
- THE OFFLINE PATH VALIDATES NOTHING. The server re-guards every payload field before the
  sim; the sim bodies only resolve the caller. Both are no-ops today, so there is no live
  divergence, but 08 must not implement the bodies trusting the server guards or the offline
  world will accept a NaN coordinate the server rejects. Stated in the `commands.ts` header.

Hot-path findings REVIEWED AND DELIBERATELY NOT CODED in 01, recorded so the next phase
inherits the reasoning rather than re-deriving it:
- `moveToward` now reads the seed through `ctx.cfg.seed` twelve times, several inside the
  seven-entry slide fan, where it previously read `this.cfg.seed` directly. Hoisting a
  `const seed` would be one safe line, and it was NOT taken: the byte-clean move is the
  load-bearing property here (two reviewers verified the body diffs empty, and the whole
  extraction's safety argument rests on that), while the perf claim is explicitly unmeasured
  and V8 very likely inlines the trivial getter. The first phase that touches the mover for
  its own reasons should hoist it then, and re-measure rather than assume.
- `recordSlidingWindowAttempt` (`server/ratelimit.ts`) appends EVERY attempt including
  refused ones with no per-key cap, so one flooding IP grows its array unbounded and each
  call is O(N) to filter and spread. Pre-existing shared machinery every tier-1 policy
  already rides; 01 only mounts a new anonymous-reachable entry point on it. Out of scope
  as this branch's regression (the repo's rule on pre-existing whole-tree debt), but the
  cheap fix is to stop appending once the in-window count is already past the limit, since
  the verdict cannot change after that.
- The per-command-frame gate chain now runs two independent dark-feature predicates
  (`refusedRiftForgeCommand`, `refusedFreeholdCommand`) plus about seven other set lookups.
  All O(1) and dwarfed by the frame's `JSON.parse`, so nothing to do now; at a THIRD dark
  feature the seam is one `Map<string, () => boolean>` lookup rather than N sequential calls.
- When 05 lights `myFreehold`, the status route's body stops being a constant and becomes a
  per-account read. It must NOT become an inline `pool.query` in the handler: the seam is the
  keyed bounded per-account shape of `server/discord_status_cache.ts`, and if any moderation
  action can change what the descriptor shows, the bust wire lands in the same change.
- `OtherItemDef.kind` is an `Exclude` list: add `'furnishing'` to it or the new kind
  silently becomes a generic usable (Phase 02).
- `tests/market_filters.test.ts` fails on any `ItemKind` without a browse bucket.
- Parity goldens sample every `PlayerMeta` field by default; a session-only stamp goes in
  `META_EXCLUDE` with a justification; a new emit on a driven path reddens goldens until
  regenerated in its own commit.
- The vault craft gate refuses vault draws inside every instance band; the freehold arm
  (D18) must be explicit and negative-tested.
- `respawnTimer = Infinity` is required on any lootable-false ground object or the
  respawn sweep re-arms it one second later.
- Instances never persist; the row is the truth and the live slot is a cache rebuilt on
  every claim.
- `ALL_DELTA_KEYS` in `tests/snapshots.test.ts` is an exact count; every release sync
  conflicts on it. Bare `emit('key'` in an extracted emitter module is what the scrape
  counts.
- The character blob is CHARACTER state; the freehold is ACCOUNT state (D5). A pre-feature
  binary's first save drops unknown blob fields (forward-only rollout), one more reason
  the row lives outside the blob.
- Bed and crop ids are frozen save keys; furnishing ids, trophy ids, and plinth ids are
  frozen the same way once persisted.
- The offline `farmNowMs` returns the sim clock and the online one `Date.now()`: a house
  timer follows the facet's clock-base contract (`housingNowMs()`), never subtracting any
  other clock.
- Eastbrook re-mint: ANY byte changed in `src/render/renderer.ts` moves the polish
  fingerprint leaf; re-run `scripts/assets/eastbrook_grand_armoury/remint_polish_provenance.mjs`
  and update the four pinned literals in their own commit.
- Screenshots: seed the lowest graphics preset AND `graphicsDefaultApplied` before
  `page.goto`, or the device probe overwrites it; never locate elements by English text.
- Mobile shots: the iPhone UA locks the material tier; shots needing graded light emulate
  Android with an explicit `userAgent` variant.
- Authored-art normalization pin: pin the normalization contract beside the blob, never
  the blob alone; a fingerprint-only re-export that changes size is investigated first.
- Measurement records commit the per-step series, never a summary alone.
- Test-pin traps: a constant self-comparison, an unstripped source-text pin and a harness
  that cannot prove its tests ran are vacuous; every pin needs a can-fail negative control.
- Review discipline: apply ALL findings including nits; a fresh reviewer reads the whole
  fix round; CI is the gate; never push to a fork; PR merge needs approval; sweep every
  push for sensitive material. (These rows exist so Codex sessions, which read no Claude
  memory, meet the same rules.)
