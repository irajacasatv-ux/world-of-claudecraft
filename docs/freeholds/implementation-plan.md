# Freeholds and Guildhalls: implementation plan

## The per-phase workflow

The packet worktree is `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`
on `feature/freeholds`, unless state.md records a separately authorized later wave branch.
The current settle-and-polish audit remains local and produces no implementation, push,
opened PR or merge. Follow the active harness's root instructions; this packet names no model.

1. Pre-flight: verify clean git status for a new implementation session and preserve
   unrelated work. Follow state.md "Worktree, base, and merge-forward": fetch origin
   with prune and merge the newest origin/release/** (the version-newest one). Never
   use main.
   Run release-merge-audit after a non-empty merge and frozen install if patches/ moved.
2. Load context through agents: root/directory CLAUDE, state, progress, exact implementation
   and QA, UX, manifests and current source/test anchors. Scan MEMORY.md, the packet entry,
   test-pin traps, apply ALL findings and review the review-fix round (Claude Code; a Codex
   session reads state.md "Gotchas" instead, since Claude memory does not apply). Reports go to the
   scratchpad with paths and short summaries; do not directly load planning coordinators.
   Record changed tree facts in state before dependent edits. Verify unstable external
   interfaces from current primary sources; missing signatures/measurements remain owned
   artifact release gates, never invented values or new untracked product questions.
3. Execute the exact five-or-fewer coherent outputs in the implementation file. Give
   overlapping files one owner, keep coordinator integration local, and preserve others'
   changes. Use existing SimContext, IWorld, RouteDef, PainterHost and scheduler seams.
4. Validate proportionately while iterating, then run every required scoped check and
   node scripts/gate_select.mjs before readiness; npm run gate is the deeper option.
   No CI-only, ci:changed-only, hook-only or reviewer-only completion substitute exists.
5. Dispatch all matching specialists below for COVERAGE, not filtering. Apply ALL findings
   including nits, then a fresh reviewer verifies the entire fix round. Keep the parent
   responsible for integration, consequential finding verification and final commands.
6. Commit only explicitly authorized paths with Conventional Commits scope and body,
   no coauthor trailer and no word "phase" in messages. Never git add -A. Run
   npm run ci:changed after the last commit and read the exit code. Preserve generated
   artifact ownership and use changed-file formatting only.
7. Update progress and state with actual commands/results, exported/wire/schema changes,
   artifact status and review evidence. End with the full next path. Every implementation
   is followed by its own QA; suffixes are mandatory nodes and 44b QA ends the program.

A settled packet is not built software. A passed implementation QA is not legal,
service or platform approval. Never mark a skipped required test as passing.

## Review dispatch

[docs/qa-gate.md](../qa-gate.md) owns reviewer responsibilities. This table is the packet's
canonical trigger map; the summary below names minimum planned specialists for the promised
surfaces. Add actual new triggers if the diff grows. Conditional boilerplate mentioning a
reviewer is not evidence that the required review ran. All QA files also have independent
correctness, test-coverage and hygiene readers; all completed work gets qa-checklist.

| Changed surface | Required reviewer |
|---|---|
| Sim behavior, determinism, tick order or SimContext | architecture-reviewer |
| IWorld, commands/events, wire, host parity or RL bindings | cross-platform-sync |
| Server/net, authorization, SQL, secrets, privacy or new nondeterminism | privacy-security-review |
| DDL, stored data, normalization, save/load or custody | migration-safety |
| SQL/callers, indexes, cardinality/cadence, stored growth, queues/pools/locks/timeouts, driver/engine/resources/topology | database-performance-reviewer before implementation decisions AND on the finished diff |
| Per-request/session/broadcast/tick work, caches, hydration or growing collections | server-hot-path-reviewer |
| UI/styles/game input or presentation/render fairness | frontend-seam-reviewer |
| New GPU producers, scene attachment, materials/lights/prewarm or GPU performance | render-performance-reviewer |
| Content IDs/recipes/deeds/Reliquary/items/tiers/art obligations | content-obligations-reviewer |
| Gate/CI selection or workflow pipeline | gate-integrity-reviewer |
| Tests, pins and every QA | test-coverage-auditor |
| Every completed implementation/QA/close | qa-checklist |

For Codex, use the corresponding registered read-only role when one exists; a harness
name difference never removes a concern. Where docs/qa-gate.md marks a role not yet
mirrored (server-hot-path-reviewer, render-performance-reviewer,
content-obligations-reviewer, gate-integrity-reviewer), the Codex session runs the
matching .claude/agents/<name>.md review criteria through a read-only sub-agent, excluding
Claude frontmatter, runtime/team APIs and duplicated command execution, and records
that fallback in its report; the mirrored woc_* roles under .codex/agents/ serve the rest.
Reviewers inspect the parent's deterministic command evidence instead of rerunning the
full gate. Finish every delegated task before reporting completion. The Phase summary
table below is the per-phase roster; every phase file's own required list and its STEP 3
dispatch line equal its row.

## Cross-cutting gates

### Durable ownership, storage and work bounds

07 owns stable opaque plot identity, separate account Hearth authority and bounded
versioned storage; 05 owns every account's default in-memory tier-0 Inn Room record and
the D24 dev grant fixture, which 07 persists without changing their identity (D81). 07a
checks and advances the account Hearth row only with accepted remote entry; private UI
mirrors and transfer manifests never own the cooldown. 07a is the sole global claim fence
and atomic resource/receipt composition; 08 owns authoritative ephemeral build presence
and 08a owns public/private transport with isDecorating only. Separate character and
housing autosaves are never an atomic transfer. Acquire queues and admission before DB
clients, preserve the actual legacy save touch set and relative lock order, and use the
existing pre-lock plus nonce fence. beginCharacterSaveTx supplies deadline setup, not the
lock hierarchy; saveCharacterStateOnClient alone carries the known InitPlan race.
Bank-ledger classification precedes guild replay; preserve actual
market/mail/storage/custody/FK/trigger ordering. The exact housing composition manifest is
reviewed before coding and proven with PG interleaves, never replaced by a universal
all-receipts-last order. No DB client or lock spans service IO. Keep the dependency set
unchanged; no new packages.

Every cross-record effect and receipt commits atomically before ACK. Durable discoverable
intent precedes external spend; repeatable operations retain original identity across
ambiguity/restart and permanent replay authority unless accepted horizon evidence proves
safe compaction. A stale fence/CAS cannot discard acknowledged item custody.

Schemas are additive/idempotent and mixed-release compatible. Preserve unsupported,
unknown-owned or oversized stored state safely; never overwrite it with empty defaults.
Bound rows, strings, graphs, encoded/decoded bytes and query results before deep allocation
and mutation. Every source value has a measured/signed workbook row. Every DB access has
an actual predicate/order/limit/cardinality/index inventory, including reverse FKs, exports,
deletes and pruning; do not create a speculative Ledger-week index or demand an index
for every predicate without a query. Existing large-table index additions use the
concurrent-index seam. Keep-forever or bounded retention must be explicit for every table.
07a states the ON DELETE policy per housing operation row class: intent rows cascade only
when no open operation exists; applied tombstones retain a nonidentifying operation
identity with the account reference nulled or scalar and cascade only under the accepted
retention schedule. An open housing operation blocks character or account deletion with
the mapped refusal class in character_delete_db.ts (the storage guard shape), and the
deletion race joins the real-PG list (D88).

Coalesce to one running plus one pending dirty generation, preserve newer dirty work,
share bounded admission/deadlines/pool budget and cancel safely. Eviction waits for live
claim/session/operation/write references. No uncached per-viewer shared read, unbounded
boot scan or claim of guaranteed reserved connections is allowed. Fake-pool tests do not
prove locks/plans: required disposable-PG suites must execute with TEST_DATABASE_URL set.

The first-tier arrival marker is bounded private account-scoped auxiliary storage, not
just camera state. 07b/07c/07a/08a and their DB/persistence/security reviewers prove the exact
account store and load/write owner, known-tier bounds, empty legacy default and atomic
accepted-owner-entry mark-before-ACK. Document unique/FK waits in the real touch-set map.
The Sim set is a mirror; plot saves, sale/transfer and character deletion do not copy,
clear or rewrite account eligibility. Account deletion removes it. A crash after commit
may skip this optional presentation; guest/reconnect/replay cannot mint it again. No
permanent operation receipt is added for every ordinary arrival.

07b owns the one account lifecycle authority for prior absence/grace; 13 and every
plot consume its committed transition and retained protection history. Secondary plots or simultaneous claims cannot
restart it. Arrival eligibility remains a separate meaning. Evaluate the exact union of account
absence/grace and service suspensions; never subtract overlapping independent totals
twice. Covered mutable history cannot authorize durable effects before irrevocable
finality covers each dependency. Missing coverage remains not-ready, not chargeable time.
Every has-the-day-rolled-over fact (ledger, upkeep, prepay, condition, guest-book daily
admission, Showcase realm week, the per-account weekly cap through ledgerWeekOf) uses the
realm day resetDay and the Tuesday week anchor emberWeekAnchorOf; the server produces day
keys with resetDayKey(ms, REALM_RESET_TIME_ZONE), the sim consumes them, epoch-ms fields
are display-only, utcDay stamps when something happened and the Endeavor month is the UTC
calendar month utcDay.slice(0, 7) (D84). 13a owns the durable shared
upkeep calendar/history and bounded finalized-coverage projection, explicit source identity
and compatible calendar-head participation in 07a. DB/persistence/security reviewers must
verify those concrete stores and consumers, request budgets, cancellation and real waits.
13a produces NEW FUTURE `docs/freeholds/upkeep-calendar-db-contract.md` for the exact
DDL/query/lock/budget/PG evidence; this is a future implementation output, not a current
packet link or counted artifact.

28a extends the same lifecycle owner with separate guild-keyed head/history and
server-controlled membership-incarnation evidence. Eligible current-member gameplay
is distinct from donor allowance. No account-grace aggregation or roster-cache authority
is permitted; historical guild protection and safe disband remain intact. A guild that
holds any keep-forever housing row is never hard-deleted: disband is the 28a tombstone
disposition (guild row retained with a tombstone status, member rows removed, realm name
released by a tombstone-aware uniqueness rule, guild_deeds attached), the existing
beginGuildBankDelete guard is extended at BOTH deleting call sites before any member row
is deleted, GM character or account deletion passes leadership to the highest-ranked
remaining member or tombstones, and earned_by stays a nullable FK beside an immutable
captured public name and realm snapshot that projections read (D79). The service contract
carries the Hall Fund end-of-life row (pro rata refund to donor accounts by original
receipt as separately identified immutable refund operations) and 29 adds the officer-plus
withdraw-to-guild-bank verb for fund materials and gold on the 07a rail (D78).

Guild-clear recording capacity never refuses GameServer.join, enterDungeon or a respawn:
exhaustion records a bounded, auditable clear-not-captured gap with an operator alert,
character rewards, loot and existing deeds are unchanged, and every busy arm binds only to
source activation or credit capture; the 07b join-time reservation hook publishes the
session regardless (D83). 31's first-kill projection reaches the client through the same
NEW bounded sibling read 30a names for missing lockout projections, behind the current
guild RouteDef registry with current-authority checks; no facet member is added and the
parity pin is unchanged (D82). Visitor admission reads the named owner character's
outgoing friend list (never the visitor's own list), a block row on either side refuses,
and friendAdd, friendRemove and blockAdd bust the visitor projection through a NEW
mutation-site hook that triggers the D51 ejection recheck (D76); guild-owned plots admit
current members always and accept only guild, public or private policies, with public
admission capped by the tier column (D77).

17 owns NEW server/freehold_account_sources_db.ts::loadFreeholdAccountCharacterSourcePage
and server/freehold_account_sources.ts::createFreeholdAccountSourceLoader. Its static
versioned account-keyed character pages, bounded shared admission/cache and current-
generation source replacement serve trophies and 24's farm extension. No full-state
SELECT, per-viewer page loop or invented account-global character cap is allowed.
Current local sources replace whole saved slices, including empty; nonlocal sources
remain saved. Unknown/incomplete/failed reads do not authorize deletion or false emptiness.
DB/persistence/security reviewers inspect exact projection/index plans, total bytes,
cache bounds, invalidation, cancellation and privacy before and after implementation.

The account Hearth contract is NEW server/freehold_hearth_db.ts with
FREEHOLD_HEARTH_SCHEMA, loadFreeholdHearth and advanceFreeholdHearthOnClient. The
account_freehold_hearth row is the only online cooldown authority; owner-only
fhold/myFreehold.hearthKeyReadyAtMs and hearthKeyRevision are committed mirrors.
Same-account alts, processes and destinations race one participant inside 07a. A
physical gate, refusal or already-home no-op spends nothing; transfer copies or
clears neither account. Storage/export/lifecycle/clock/FK and real-PG proof belong to 07/07a.

The ephemeral setFreeholdBuildPresence facet/set_freehold_build_presence command is
introduced as a dark stub by 01, authorized by 08 and projected by 08a as isDecorating.
11 sends start/stop and 18 reads the public boolean. Current session/plot/claim/entry
and monotonic sequence guards prevent late starts/clears, with immediate cleanup at
the real accepted socketClosed seam. No persisted row, receipt, ghost or private edit
state accompanies presence; source/consumer parity and two-client lifecycle proof apply.

### Money, tokens and store policy

The three cumulative money gates apply to every priced implementation AND paired QA:
14, 15, 16, 21, 29, 32, 37, 38, 40 and 42, and any suffixed consumer that exposes the
same paid effect. 25a's material-only prepay and 32a's gold-priced cosmetic stock retain
relevant authority, source/custody and approved-policy constraints without inventing a
new service-priced action. Any later price-bearing diff inherits the full applicable gate.

1. Written counsel acceptance, accepted/published Terms and listing/review-note artifacts,
   plus signed economy-service authorization/catalog/recovery/settlement acceptance, before
   production enable or any housing-bearing store submission. state names owner, exact
   signed artifact, digest/version and remaining gate; unsigned drafts are not approval.
2. FREEHOLDS_ENABLED defaults off, reads the strict '1' policy live and refuses every
   housing route/command while dark. Purchase composition/catalog filtering also stays dark.
   Dark also means the Sim boots with freeholdsEnabled false on the SimConfig seam: the
   Eastbrook gate prompt, the furnisher and its stock and the Hearth Key are neither spawned
   nor sold on that realm, while the offline host stays live under D3 (D85).
3. The seven-distribution matrix independently governs purchase, website management
   and optional deed capability, with unknown distribution fail-closed; housing use is
   the server entitlement gate read through the housing facet, never a map or
   HudFeatures row, and exactly two HudFeatures rows exist, freeholdPurchaseEnabled and
   freeholdManageOnWebsite (D91). Denied capabilities
   are absent from whole submodels, handlers, fetched catalogs, hidden DOM, errors and
   accessibility text; that absence is a runtime contract, and the purchase code and
   English keys ship dormant in every bundle under the runtime capability, which the review
   notes and the 44b handoff say explicitly (D86). Website management is not an automatic
   fallback purchase link.

The service owns every price, quote, fee, conversion, burn/treasury/resale/royalty and
all token arithmetic. The game forwards expectedCostClaudium only as an expected-cost
fingerprint, never calculates a peg, price, multiplier or split. Content Charter records
carry no service price. Copy describes cosmetic, convenience and access, with no
purchase-benefit earnings/income/yield claims. The Book of Deeds is ordinary gameplay;
never use a bare-deed word scan that breaks it. No token or on-chain vocabulary enters
src/sim/ outside the exact state.md firewall contract.

Preserve literal D9 game-server distribution ignorance: NEW service-owned opaque
authorization binds account, purpose/SKU, policy, quote and operation and returns the
verified ordinary effect through the narrow host boundary. No existing trusted issuer
is assumed. Client labels, Origin/UA/JSON, linked storefront accounts and the game-service
secret do not prove distribution eligibility. Unknown eligibility refuses new spend;
accepted operations remain recoverable under the original identity. Native access uses
the server entitlement and is independent of optional chain-holder queries. Furnished-plot
transfer admits the buyer only when the purchased plot can occupy plot_index 0 at tier 0
(or a free index under 42's two-plot cap), refuses with the literal code
freehold.deed.buyer_capacity otherwise, previews the buyer's retained copies to a safe
destination by the seller's manifest rule, gives the seller a fresh tier-0 record at index
0 with account trophy unlocks retained, and lets Ward Favor capacity awards travel with
the stable plot ID (D80). Upgrade contributions take an explicit source-mode argument
(bags, or the vault inside the owner's own claim), bills count integer item units, and a
confirmed fee whose last leg cannot finish because bags are full re-attempts without a
second fee (D89).

### Content, UX and performance

content-manifest and content-numbers-workbook own exact inventory/source/derivation/
rounding/approval. Art-brief and ux-spec own reference and presentation acceptance. Wave A
has eighteen furnishing outputs, including three pattern recipes within its ten craft
outputs; Wave B adds exactly twenty including produce decoration. Wave A is Marks-only;
later rare patterns have one named raid OR rift channel plus Marks, never a delve channel.
The dye picker is enabled by the home station amenity of type apothecary: no new amenity
kind, no extra slot and no station GLB (D90). Homesteader and guild deeds, Endeavor goals
and reward props, the Showcase reward and the Kitchen Garden entities are inventoried in
content-manifest.md beside the furnishing tables.
The Hearth shelf is a new full catalog/nav/source/completion contract, not a guessed page
cap. New IDs carry all same-change art/provenance/name/originality/deed/Reliquary/wiki
obligations. Final shipping art is mandatory at every wave close; stand-ins do not satisfy
final asset acceptance. No new professions are implemented by 43.

Housing interface uses the actual shared window families and mapped tokens. DESIGN.md's
adopted foundation remains the target; 11 checks readiness and consumes the coordinated
rollout rather than inventing a local theme or reusing reverted window_frame code.
Every state, key, keyboard/focus order, touch/pad action and screenshot target comes from
ux-spec. The build palette is a world companion with explicitly composed input arbitration,
not an accidental trapping modal. Touch targets are at least 40x40; the coarse-input 16px
anti-zoom floor applies to input/select/textarea controls, not every label. Respect
landscape/safe areas, non-hover routes and shared focus return.

Every actionable ghost footprint, blocked shape/reason, collision/door/arrival safety,
capacity and admitted player remains legible at every preset. Three authored room emitters
is only a ceiling inside the live global sink; iOS LOW may allow two and pressure one.
Render reads IWorld, uses identity-aware initialized signatures and scheduler/prewarm gates,
and ignores stale async completion after a leave/plot change. No per-tick housing economic
sweep or SQL is added; ordinary renderer consumption and shared interaction input are not
forbidden by that scope. Unchanged paths allocate/serialize no repeated shared payload.

Structural readiness gates reveal; ordinary online additional cosmetic settle remains zero,
and bounded offline waiting does not guarantee final cosmetics. Use prepared readable
representations while optional art loads. Arrival input resumes immediately on cancel,
while the existing camera offset blends safely over DIRECTOR_RELEASE_TIME; reduced motion
starts no directive. Sampled cue/SFX conformance and real audio evidence are independent
from screenshots. 06 owns its functional helper and nine gate/landing variants;
09 introduces the planned shared housing helper with twelve day/night interior variants; 11/16/17/18 extend
its exact one-capture/one-image targets, and 11 extends
housing art-only diff selection; 20 verifies the expanded matrix.

06 registers nine functional gate/landing variants through pr_shot_freeholds.mjs.
09 introduces the shared pr_shot_housing.mjs helper and twelve Inn/Cottage day/night
variants (21 total across both helpers).
11 extends the build descriptor (98 total across the registry);
16/17/18 cumulatively register 187/235/339. 20 verifies 339, never requiring later UI in
an earlier pair. Later waves register by producer in the same way and each regenerates
ux-shot-manifest.json in its own change: 21 reaches 357, 23 366, 24 408, 25 446, 26 464,
30 502, 30a 520, 31 526, 34 544, 35 562, 36 604, 38 648, 40 663, 41 681, 41a 705 and 42
742, each wave close verifying its union. Explicit build-empty is included; guest
observation uses the existing visit-owner-building scene without duplication. Exact
constructor/descriptors, fixture postconditions and 557 English keys (each with one owning phase) are recorded in UX and regenerated JSON inventories; every UI phase names its new
keys with exact English in its own file, ux-spec carries the rows, and the manifests
regenerate in that same phase with every cited count updated (D92).

### Developer fixtures

05 owns the explicit dev-only loopback bridge, the setFreeholdTier setter and the /dev
freehold <tier> command (D81), not a browser assumption about server env; 07 adds the
persisted save behind the same setter without changing the record's identity.
GET /__freehold/dev-authorization exists only in configureServer with exact flag 1 and
real socket+Host diagnosticsReadAllowed, strict affirmative boolean/no-store, no preview
or production endpoint. Preserve defineConfig({ ... }) and Docker import admission.
Offline bootstrap is DEV HTTP(S) loopback only, same-origin/no credentials/cache/redirect,
strict payload, entry cancellation and false-on-failure while ordinary Inn entry continues.
Both devCommands and separate nonpersisted freeholdDevGrantEnabled are required for the
real housing command. Browser fixture state never becomes online ownership or a receipt;
separately flag-authorized server dev commands retain their ordinary setter/save behavior.
No public VITE_* switch, query/storage override, direct tier injection or fake receipt.

All review findings, including nits, are resolved and a fresh reviewer checks the
entire fix round before PASS. No PASS-WITH-FOLLOWUPS or deferred-nit closeout is valid.
External signed artifacts remain explicit release gates, not deferred review findings.
Progress rows carry named unsigned release gates; the packet defines no deferral record.

## The contributor i18n policy

Every player-visible label, tooltip, aria/alt, error, toast, dialog and loading state
resolves through t() and the correct English catalog. Housing UI is hudChrome.housing.*;
shared kind/item/entity/API sinks retain their own namespaces. Every authored player
string in ux-spec.md and ux-key-manifest.json remains hudChrome.housing.*. Required
runtime apiError.freehold.* bindings mirror the matching approved English in the
existing API error catalog and API_ERROR_KEYS for protocol parity; they are not a
second housing HUD namespace and are not added to the UX key manifest. hudChrome.housing.*
as pinned by ux-spec and ux-key-manifest.json is the only key family (charter.*,
steward.manageWebsite); window-title, tab and button keys use title case per DESIGN.md
5.4, and status, description, radio and aria keys stay sentence case (D92). Use formatNumber,
formatMoney and formatDateTime from src/ui/i18n.ts; authority supplies calendar identity
and the client locale formats dates in the intended realm timezone. Use the tooltip
skill and docs/design/tooltip-writing.md for every tooltip.

Follow root/UI English-only contribution rules. Never edit locale overlays except the
M16 same-change requirement: a wordy English value with four consecutive lowercase
letters after stripping tokens receives its five non-Latin fills. The maintainer fills
other locales at release. Never hand-edit generated artifacts.
Sim/server remain language-agnostic with stable reason IDs and parameters. The existing
dungeon enter/leave English path must be matcher-covered in the same change; no new
housing English emit bypasses the S3 guard. Run i18n generation, freshness and parity.

The first freehold API scaffold preserves generated freehold.invalid_input and later
appends freehold.disabled to every catalog/mapping/pin site. Move generated module/test
to their chosen _routes names and repair imports. Existing-domain extensions are hand
RouteDef/error-table additions; do not rerun the generator expecting it to append leaves.

## Code hygiene and evidence

Module-first code belongs behind existing public seams; coordinator additions require
behavior-preserving extraction and measured/lowered ceilings. Record moved source facts
before citations change. Do not claim remembered monolith slack, literal counts or symbols
are current; measure the ceilings against tests/monolith_budget.test.ts at phase start,
since the release branch retunes them. Regenerate goldens/fingerprints only from the
actual implementation and keep required provenance commits separate. No em dash, en dash,
emoji, .only test filter, leftover debugger or nondeterministic sim clock/random call. New
code, comments, commit and PR messages never mention this packet's work numbering.

The Stop floor is instant copy/hygiene scanning, not tests/typecheck/build/review. Claude
uses .claude/hooks/qa-stop.sh; Codex's adapter delegates and adds its runtime coverage.
Before implementation readiness run all scoped requirements plus node scripts/gate_select.mjs
(or deeper npm run gate), and report exact commands/outcomes/skips. At this packet-only
settlement stage, structural/link/anchor/copy/Stop evidence must be labeled documentation
validation; it does not assert feature, PG, browser, SFX or service execution.

## Codex asset execution and final handoff

D74 requires Codex, not Claude, for every implementation that generates shipping models,
GLBs, textures, reference images, icons/images or other assets. Its starter prompt names
Codex explicitly and follows AGENTS.md plus the repository's existing asset/image/SFX
intake, generation, provenance, export and quality/performance pipeline. Review-only
work follows the active harness. No asset generation occurs in this packet audit.

D75 adds 44a after 44 QA: inventory and replace every feature-created placeholder icon/
image through Codex and verify final assets in context. Earlier same-change/per-wave
final-art requirements remain. D73 adds 44b after 44a QA: revisit every Terms/legal/
platform/service/territory determination against completed behavior and prepare the
concrete legal-team handoff and tracked sign-off status. Earlier release/submission
permissions cannot be postponed to that final revisit. Legal delivery uses an authorized
recipient/channel; a draft is never reported delivered. 44b QA is terminal completion.

## PR cadence and final preservation

Each wave close prepares a concrete reviewed release package and records the shared gate,
its paired QA and any unsigned release artifact, then STOPS and asks Fernando for the push
go: on the go the sanctioned push opens that wave's PR (D12, one PR per wave, owned by 20,
27, 33, 39 and 44 under D87); otherwise the close ends local, awaiting the push go.
Push/PR creation requires explicit authorization covering that action and the current
state push policy; never merge or enqueue a PR from these sessions. This audit never
pushes or opens/merges a PR. Do not convert future publication instructions into current
authorization. Deploy is separately authorized and follows DEPLOY.md; never
ALLOW_DEV_COMMANDS=1 in production.

Neither 44, 44a nor 44b may remove the only source of UX, decisions, answered rulings, content/numbers/art, audit or service/
counsel/Terms/listing/territory evidence. Before any future cleanup request, prepare a
reviewable preservation change with exact source/destination and incoming-link manifests,
content/anchor equivalence and a fresh review. The proposed durable UX destination is
NEW docs/prd/woc/freehold-ux-spec.md, created only if that future preservation is approved;
the other destinations are the proposed source-to-destination table phase-44 records
(marked proposed, never executed), not guessed here. All six existing handoff drafts
stay intact. 44a creates the final-artwork-audit.md evidence and 44b produces the
NEW FUTURE docs/prd/woc/freehold-final-legal-handoff.md after revisiting actual completed
behavior. Neither future output is falsely counted as an already-created packet artifact. Obtain explicit approval of the exact remaining scaffolding deletion diff;
a push approval or silence is not deletion consent. 43 produces its separately scoped
future-craft handoff with no new profession implementation or implied release promise.

## Phase summary

Every row also requires test-coverage-auditor and qa-checklist as printed. Wave closes
use the union of every actual changed surface, even when their immediate edits are docs.
The link to the implementation preserves exact five-deliverable ownership.

| Phase | Main output / surfaces | Required reviewers |
|---|---|---|
| [01](phase-01-foundation.md) | Foundation | architecture-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [02](phase-02-furnishing-item-kind.md) | Furnishing item kind | architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [03](phase-03-content-tiers-and-basics.md) | Content: tiers, Charter SKU, ledger schedule, vendor basics | architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [04](phase-04-content-crafted-and-patterns.md) | Content: crafted furnishings and quartermaster patterns | content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [05](phase-05-instance-claim.md) | Instance claim | architecture-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [06](phase-06-interiors-gate-and-hearth-key.md) | Interiors, the Eastbrook gate, the Hearth Key | architecture-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [07](phase-07-persistence.md) | Persistence | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [07a](phase-07a-transactional-mutation-boundary.md) | Transactional mutations and global claim fencing | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [07b](phase-07b-account-lifecycle.md) | Account lifecycle and protection history | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [07c](phase-07c-arrival-eligibility.md) | Account first-tier arrival eligibility | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [08](phase-08-layout-and-placement-sim.md) | Layout core and placement commands | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [08a](phase-08a-descriptor-and-wire.md) | Public descriptors and consumer-correct wire state | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [09](phase-09-render-furnishings.md) | Render: furnishing view, light rig, ghost | cross-platform-sync, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, gate-integrity-reviewer, test-coverage-auditor, qa-checklist |
| [10](phase-10-furnishing-colliders.md) | Furnishing colliders | architecture-reviewer, cross-platform-sync, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [11](phase-11-build-mode-ui.md) | Build mode UI | cross-platform-sync, privacy-security-review, frontend-seam-reviewer, render-performance-reviewer, gate-integrity-reviewer, test-coverage-auditor, qa-checklist |
| [12](phase-12-strongbox-and-station.md) | Strongbox and station amenities | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [13](phase-13-condition-and-ledger-core.md) | Condition and the Steward's Ledger core | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [13a](phase-13a-authoritative-upkeep-calendar.md) | Authoritative upkeep calendar | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [14](phase-14-distribution-surface-map.md) | Distribution surface map | privacy-security-review, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [15](phase-15-claudium-charter-and-call.md) | Claudium: the Freehold Charter and the Master Builder's Call | architecture-reviewer, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [16](phase-16-steward-panel-and-store-surfaces.md) | Steward panel and store surfaces | privacy-security-review, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [17](phase-17-trophies.md) | Trophies | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [18](phase-18-visiting.md) | Visiting | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [19](phase-19-art-batch.md) | Art batch | frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [20](phase-20-wave-a-close.md) | Wave A close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [21](phase-21-lodge-tier-and-upgrade.md) | Lodge tier and the upgrade build project | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [22](phase-22-furnishings-all-crafts.md) | Furnishings across all ten crafts and the R8 pattern channels | architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [23](phase-23-legend-stand-and-trophy-families.md) | Legend Stand and the remaining trophy families | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [24](phase-24-kitchen-garden-tableau.md) | Kitchen Garden tableau | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [25](phase-25-build-mode-v2.md) | Advanced placement and build mode | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [25a](phase-25a-prepay-and-fenbridge-gate.md) | Twelve-week prepay and the Fenbridge gate | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [26](phase-26-open-house-visiting.md) | Open-house visiting | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [27](phase-27-wave-b-close.md) | Wave B close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [28](phase-28-guild-owner-kind-and-hall-fund.md) | The guild owner kind, the Meeting Hall, the Hall Fund | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [28a](phase-28a-guild-lifecycle-and-membership.md) | Guild lifecycle and membership evidence | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [29](phase-29-guildhall-purchase-and-upkeep.md) | Guildhall purchase and upkeep | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [30](phase-30-hall-amenities.md) | Guild chest, feast table and shared stations | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [30a](phase-30a-hall-boards.md) | Hall boards | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [31](phase-31-guild-deeds-and-first-kill-trophies.md) | Guild-level deeds and first-kill trophies | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [32](phase-32-hall-and-manor-tiers.md) | Great Hall, Manor, Bastion tiers and build projects | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [32a](phase-32a-project-rewards-and-vault.md) | Project rewards and direct vault access | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [33](phase-33-wave-c-close.md) | Wave C close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [34](phase-34-wards.md) | Wards: shared neighborhoods and exteriors | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [35](phase-35-ward-favor-and-endeavors.md) | Ward favor and Endeavors | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [36](phase-36-showcases-and-guest-books.md) | Showcases and guest books | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [37](phase-37-charter-service-contract.md) | On-chain Freehold Charter: service contract, ledger table, geo-exclusion | privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [38](phase-38-charter-mint-and-trading.md) | Charter mint surface and marketplace trading (web only) | cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [39](phase-39-wave-d-close.md) | Wave D close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [40](phase-40-keep-and-citadel-tiers.md) | Keep and Citadel tiers, prestige deeds | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [41](phase-41-dye-station-and-layout-sharing.md) | Dye station | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [41a](phase-41a-layout-save-and-sharing.md) | Layout saves and public sharing | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [42](phase-42-second-freehold-sku.md) | Second freehold admission and shared Hearth cooldown | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [43](phase-43-carpenter-and-mason.md) | Existing-craft coverage and future expansion handoff | architecture-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44](phase-44-wave-e-close.md) | Wave E integration close before final artwork and legal handoff | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44a](phase-44a-final-codex-artwork.md) | Final Codex artwork | frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44b](phase-44b-final-legal-handoff.md) | Final Terms and legal-team handoff against completed implementation | cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
