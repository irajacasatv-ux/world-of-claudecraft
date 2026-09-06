# Freeholds and Guildhalls: implementation plan

## The per-phase workflow

The packet worktree is `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`
on `feature/freeholds`, unless state.md records a separately authorized later wave branch.
The current settle-and-polish audit remains local and produces no implementation, push,
opened PR or merge. Follow the active harness's root instructions; this packet names no model.

1. Pre-flight: verify clean git status for a new implementation session and preserve
   unrelated work. Follow state.md "Worktree, base, and merge-forward": fetch origin
   with prune; while PR #3872 is open merge origin/feature/masterwrought, otherwise
   merge the newest origin/release/** and remove the dependency block. Never use main.
   Run release-merge-audit after a non-empty merge and frozen install if patches/ moved.
2. Load context through agents: root/directory CLAUDE, state, progress, exact implementation
   and QA, UX, manifests and current source/test anchors. Scan MEMORY.md, the packet entry,
   test-pin traps, apply ALL findings and review the review-fix round. Reports go to the
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
name difference never removes a concern. Reviewers inspect the parent's deterministic
command evidence instead of rerunning the full gate. Finish every delegated task before
reporting completion.

## Cross-cutting gates

### Durable ownership, storage and work bounds

07 owns stable opaque plot identity, separate account Hearth authority and bounded
versioned storage. 07a checks and advances the account Hearth row only with accepted
remote entry; private UI mirrors and transfer manifests never own the cooldown. 07a is the sole global
claim fence and atomic resource/receipt composition; 08 owns authoritative ephemeral
build presence and 08a owns public/private transport with isDecorating only.
Separate character and housing autosaves are never an atomic transfer. Acquire queues
and admission before DB clients, preserve the actual legacy save touch set and relative
lock order, and use the existing pre-lock plus nonce fence. beginCharacterSaveTx supplies
deadline setup, not the lock hierarchy; saveCharacterStateOnClient alone carries the
known InitPlan race. Bank-ledger classification precedes guild replay; preserve actual
market/mail/storage/custody/FK/trigger ordering. The exact housing composition manifest is
reviewed before coding and proven with PG interleaves, never replaced by a universal
all-receipts-last order. No DB client or lock spans service IO. Keep the dependency set unchanged; no new packages.

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
finality covers each dependency. Missing coverage remains not-ready, not chargeable time. 13a owns the durable shared
upkeep calendar/history and bounded finalized-coverage projection, explicit source identity
and compatible calendar-head participation in 07a. DB/persistence/security reviewers must
verify those concrete stores and consumers, request budgets, cancellation and real waits.
13a produces NEW FUTURE `docs/freeholds/upkeep-calendar-db-contract.md` for the exact
DDL/query/lock/budget/PG evidence; this is a future implementation output, not a current
packet link or counted artifact.

28a extends the same lifecycle owner with separate guild-keyed head/history and
server-controlled membership-incarnation evidence. Eligible current-member gameplay
is distinct from donor allowance. No account-grace aggregation or roster-cache authority
is permitted; historical guild protection and safe disband remain intact.

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
3. The seven-distribution matrix independently governs use, purchase, website management
   and optional deed capability, with unknown distribution fail-closed. Denied capabilities
   are absent from whole submodels, handlers, fetched catalogs, hidden DOM, errors and
   accessibility text. Website management is not an automatic fallback purchase link.

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
the server entitlement and is independent of optional chain-holder queries.

### Content, UX and performance

content-manifest and content-numbers-workbook own exact inventory/source/derivation/
rounding/approval. Art-brief and ux-spec own reference and presentation acceptance. Wave A
has eighteen furnishing outputs, including three pattern recipes within its ten craft
outputs; Wave B adds exactly twenty including produce decoration. Wave A is Marks-only;
later rare patterns have one named raid OR rift channel plus Marks, never a delve channel.
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
from screenshots. 09 owns the initial shared helper and twelve interior variants; 11/16/17/18 extend
its exact one-capture/one-image targets, and 11 extends
housing art-only diff selection; 20 verifies the expanded matrix.

The shared capture helper/registry import is produced by 09 with twelve functional
Inn/Cottage day/night variants. 11 replaces that descriptor with its 89 working variants;
16/17/18 cumulatively register 178/226/330. 20 verifies 330, never requiring later UI in
an earlier pair. Explicit build-empty is included; guest observation uses the existing
visit-owner-building scene without duplication. Exact constructor/descriptors, fixture
postconditions and 329 English keys are recorded in UX and regenerated JSON inventories.

### Developer fixtures

07 owns the explicit dev-only loopback bridge, not a browser assumption about server env.
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

## The contributor i18n policy

Every player-visible label, tooltip, aria/alt, error, toast, dialog and loading state
resolves through t() and the correct English catalog. Housing UI is hudChrome.housing.*;
shared kind/item/entity/API sinks retain their own namespaces. Every authored player
string in ux-spec.md and ux-key-manifest.json remains hudChrome.housing.*. Required
runtime apiError.freehold.* bindings mirror the matching approved English in the
existing API error catalog and API_ERROR_KEYS for protocol parity; they are not a
second housing HUD namespace and are not added to the UX key manifest. Use formatNumber,
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
are current. Regenerate goldens/fingerprints only from the actual implementation and
keep required provenance commits separate. No em dash, en dash, emoji, .only test filter,
leftover debugger or nondeterministic sim clock/random call. New code, comments, commit
and PR messages never mention this packet's work numbering.

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
its paired QA and any unsigned release artifact. Later push/PR creation requires explicit
authorization covering that action and the current state push policy; never merge or
enqueue a PR from these sessions. This audit never pushes or opens/merges a PR. Do not
convert future publication instructions into current authorization. Deploy is separately
authorized and follows DEPLOY.md; never ALLOW_DEV_COMMANDS=1 in production.

Neither 44, 44a nor 44b may remove the only source of UX, decisions, answered rulings, content/numbers/art, audit or service/
counsel/Terms/listing/territory evidence. Before any future cleanup request, prepare a
reviewable preservation change with exact source/destination and incoming-link manifests,
content/anchor equivalence and a fresh review. The proposed durable UX destination is
NEW docs/prd/woc/freehold-ux-spec.md, created only if that future preservation is approved;
other destinations are enumerated by 44, not guessed here. All six existing handoff drafts
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
| [10](phase-10-furnishing-colliders.md) | Furnishing colliders | architecture-reviewer, cross-platform-sync, privacy-security-review, test-coverage-auditor, qa-checklist |
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
| [22](phase-22-furnishings-all-crafts.md) | Furnishings across all ten crafts and the R8 pattern channels | frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [23](phase-23-legend-stand-and-trophy-families.md) | Legend Stand and the remaining trophy families | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [24](phase-24-kitchen-garden-tableau.md) | Kitchen Garden tableau | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [25](phase-25-build-mode-v2.md) | Build mode v2 | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [25a](phase-25a-prepay-and-fenbridge-gate.md) | Twelve-week prepay and the Fenbridge gate | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [26](phase-26-open-house-visiting.md) | Open-house visiting | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [27](phase-27-wave-b-close.md) | Wave B close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [28](phase-28-guild-owner-kind-and-hall-fund.md) | The guild owner kind, the Meeting Hall, the Hall Fund | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [28a](phase-28a-guild-lifecycle-and-membership.md) | Guild lifecycle and membership evidence | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, test-coverage-auditor, qa-checklist |
| [29](phase-29-guildhall-purchase-and-upkeep.md) | Guildhall purchase and upkeep | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [30](phase-30-hall-amenities.md) | Hall amenities | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [30a](phase-30a-hall-boards.md) | Hall boards | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [31](phase-31-guild-deeds-and-first-kill-trophies.md) | Guild-level deeds and first-kill trophies | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [32](phase-32-hall-and-manor-tiers.md) | Great Hall, Manor, Bastion tiers and build projects | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [32a](phase-32a-project-rewards-and-vault.md) | Project rewards and direct vault access | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [33](phase-33-wave-c-close.md) | Wave C close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [34](phase-34-wards.md) | Wards: shared neighborhoods and exteriors | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [35](phase-35-ward-favor-and-endeavors.md) | Ward favor and Endeavors | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [36](phase-36-showcases-and-guest-books.md) | Showcases and guest books | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [37](phase-37-charter-service-contract.md) | On-chain Freehold Charter: service contract, ledger table, geo-exclusion | privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [38](phase-38-charter-mint-and-trading.md) | Charter mint surface and marketplace trading (web only) | cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, test-coverage-auditor, qa-checklist |
| [39](phase-39-wave-d-close.md) | Wave D close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [40](phase-40-keep-and-citadel-tiers.md) | Keep and Citadel tiers, prestige deeds | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [41](phase-41-dye-station-and-layout-sharing.md) | Dye station | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [41a](phase-41a-layout-save-and-sharing.md) | Layout saves and public sharing | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
| [42](phase-42-second-freehold-sku.md) | Second freehold SKU | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [43](phase-43-carpenter-and-mason.md) | Existing-craft coverage and future expansion handoff | architecture-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44](phase-44-wave-e-close.md) | Wave E integration close | architecture-reviewer, cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44a](phase-44a-final-codex-artwork.md) | Final Codex artwork | frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist |
| [44b](phase-44b-final-legal-handoff.md) | Final legal revisit and handoff | cross-platform-sync, privacy-security-review, database-performance-reviewer, migration-safety, frontend-seam-reviewer, test-coverage-auditor, qa-checklist |
