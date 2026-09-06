# Phase 29: Guildhall purchase and upkeep

Wave C, Guildhalls. The spec is `progress.md` "29 Guildhall purchase and upkeep" (apply the locked choices and verified source facts before implementing); the decisions are `state.md` Locked decisions and the approved artifact manifests (D1: the Charter rides the
spend route; the research document's adopted ruling 3, section 12 of
docs/prd/woc/freeholds-and-guildhalls-research.md: the service settles; D78 and D84).
This phase ships the pooled Claudium purchase (roughly 3x the freehold figure,
service-priced) from the Hall Fund with officer approval, 2x decay for a Guildhall, the
Steward's Ledger paid from the Hall Fund, member donations (materials, gold, Claudium)
with a weekly per-account cap across alts keyed on ledgerWeekOf, the officer-plus
withdraw-to-guild-bank verb (D78), and a contribution log with retention. It is a money
phase (the three gates apply) and a persistence phase.

## Settled delivery and acceptance contract

Service debit/credit and pooled balance are authoritative, projected as absolute
versioned results with stale-response rejection. Officers authorize paid projects;
members can contribute within the cap schedule (a release-gated artifact) and read the
contribution ledger.
The anti-dominance target is one current weekly Hall Ledger-equivalent per account per
realm week across all alts (state TUNING). The cap is keyed (account_id, guild_id,
realm week) with the week from ledgerWeekOf (13's realm week over the resetDay
vocabulary, D84), never the day key; its durable owner is SUM(amount) over
guild_hall_contributions for that key inside the 07a transaction under an EXCLUSIVE
lock taken at 07a's account position (before the guild row: accounts, then guilds,
then characters): FOR NO KEY UPDATE on the accounts row, or a transaction advisory
lock keyed on (account_id, guild_id, realm week); 07a's ordinary account KEY SHARE is a
shared lock and cannot serialize two alts on two realms, so it is not sufficient for the
SUM, and the database reviewer's touch-set manifest records the stronger lock's
compatibility with the existing KEY SHARE holders; the index (account_id, created_at)
sits beside (guild_id, created_at); the sim's pre-check is advisory. This file
produces exact resource/gold and service-owned currency allowance, rounding, quote
version and cap-reset fixtures in
the calibration artifact; enable waits for Fernando/service acceptance. Never convert
gold or materials to token value in game. Material/gold donation, cap accounting and
donor audit commit atomically. Currency donation intent and receipt share 07a's sole
durable recovery rail extended by 15. Race two alts, two officers, two realms and a
timeout after service debit. The fund's end of life is defined (D78): an officer-plus
withdraw-to-guild-bank verb moves fund materials and gold to the guild bank on the 07a
rail, and the service contract's Hall Fund end-of-life row refunds the pooled balance
pro rata to donor accounts by original receipt as separately identified immutable
refund operations the game only requests; a stocked fund reaches 28a's
disband-permitted state only through that verb and that request.

Contributions retain the adopted ninety-day audit window while durable cap/receipt
authority survives required replay and rollover. Inventory query/index paths for guild
read ordering, global created_at prune, account-leading export/delete and reverse FKs;
register indexed bounded prune once after listen and test real concurrent PG behavior.
Guild wear uses the same 07b lifecycle owner extended with guild-scoped eligible-member
observations and history; it never sums individual account grace or adds another
coordinator/store. The 13a calendar supplies finalized suspension coverage without
catch-up debt. At condition
30 amenities work; below 30 they pause; entry, building and undo always remain available.

The three money gates apply to every SKU, handler and purchase view in this file:
(1) written counsel acceptance before production enable or housing-bearing store
submission; (2) FREEHOLDS_ENABLED defaults off and refuses both dispatch arms and
removes catalog rows while dark; (3) the seven-distribution capability map permits
purchase only on browser web and website-distributed desktop. Seeker is use-only.
Published Terms and accepted economy-service contract/catalog are additional release
gates. Website management is an independent approved capability, default off on denied
storefronts. Native, Steam and Epic receive no purchase submodel, hidden DOM, fetched
catalog, handler, accessibility text or on-chain marketing: absence on a denied
storefront is a runtime contract (no DOM node, handler, request, fetched catalog, error
copy or accessible text), and the purchase code with its English keys ships dormant in
every bundle under the runtime capability (D86). Purchase copy promises
cosmetic, convenience and access only, never earn, income or yield. The economy
service owns every price and all token math; expectedCostClaudium is only a forwarded
quote fingerprint. Illustrative USD, 3x and other working targets never compute cost.
Use the single 07a durable operation/receipt rail extended by 15: bind account, opaque
plot/guild target, operation and quote version; persist intent before spend; retry
ambiguity with the same key; apply effect and receipt atomically. No DB client or lock
spans service IO, and live key arrays are not permanent replay authority.

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

## Deliverables (at most five):

1. Service-owned pooled purchase and durable recovery.
2. Atomic capped material/gold/currency contributions.
3. Guild condition and immutable Hall Ledger settlement.
4. Indexed retained donor audit, export/delete and recovery proof.
5. Member/officer Steward/store UX and authority evidence.

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

## Guild lifecycle extension of the existing owner

Phase 28a extends the SAME 07b lifecycle core/coordinator/DB owner with separate
guild_freehold_lifecycle and guild_freehold_lifecycle_history relations. Never change
the account-keyed primary identity or sum personal account grace into guild protection.
Phase 29 consumes this committed guild source through 13/13a's existing typed upkeep
projection. The producer is the dedicated 28a lifecycle deliverable; 29 owns its upkeep
consumer and integration proof. No competing lifecycle module, timer, ingress or
receipt authority. The same schema-version, source-binding, history/finality and
capability-preservation contracts apply to guild scope.

Any current guild member's authenticated gameplay presence is eligible, independent
of donor amount, officer rank or tenure. Capture observation time, authenticated
account/character identity, process/session/lease generation, stable guild binding and
server-controlled membership incarnation/evidence before queues. Phase 28a owns this
narrow membership-incarnation/fencing extension at the actual mutation hooks. A local
guildStampSeq or a later roster lookup alone is not historical membership evidence.
Adding an offline member
does not fabricate gameplay presence. Membership removal settles the last eligible
observation at the removal boundary before invalidating that binding; a later roster
read cannot manufacture past membership. Keep immutable return/protection boundaries
separate from coalesced periodic latest-presence writes. One admitted character
observation touches at most its current guild; batch membership-key probes and coalesce
periodic work once per dirty guild, never full display-roster loads or one head write
per member. Current policy changes use committed, generation-aware invalidation.

Verified source seams: server/social_db.ts::PgSocialDb.guildMembership is the
character-keyed lookup; guildMembers uses server/guild_roster_cache.ts::GuildRosterCache
for display. server/social.ts::SocialTransport.onGuildMembershipChanged publishes
committed changes to the GameServer guildStampSeq/Sim.setPlayerGuildMembership hook;
src/sim/guild_bank.ts::stampGuildMembership remains the Sim stamping implementation.
The new durable membership incarnation composes with those seams; it is not falsely
described as already shipped. Rank-only changes do not restart grace, and a member
joining a different guild copies neither prior-guild nor personal grace. Unprovable
queued eligibility stays unresolved/not-ready with original evidence preserved.

Extend 07b's lifecycle planner/coordinator/load/page/advance APIs (NEW planned outputs
of 07b, in the tree by the time this file starts) with a typed account-or-guild scope
and separate static SQL branches. The account tables remain
account-keyed. The guild head is keyed by guild_id and history by guild/transition
generation with indexed bounded time/generation pages. The same
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding resolves the
guild's accepted durable identity/registry binding, never an observer's account binding.
installCommittedLifecycleProjection installs only nonregressing, internally consistent
current-generation scope state. Member ghall exposes authorized derived condition/
protection facts, never individual observation identities or lifetime history.

Add the guild head/history participants only at the compatible reviewed suffix of
07a's actual membership/save touch sets, enumerated from the release tree as 28a does:
addGuildMemberAtomic's guild-parent lock (the cap read from the locked row),
removeGuildMember's deletion (a transaction after 28a), transferGuildLeader's parent
plus member updates, deleteGuild's cascades (guild_members, guild_events, guild_banks,
guild_pledges, guild_pledge_ladder and the release guild_roster_receipts), the roster
page purchase in server/guild_roster_page_db.ts (account KEY SHARE, guilds row UPDATE,
guild_roster_receipts insert, character save, all inside beginCharacterSaveTx behind
acquirePaidGuildCreateClient: accounts, then guilds, then characters) and
onGuildMembershipChanged delivery; 29's donation, cap and withdraw participants join at
that suffix. No blanket head-first hierarchy. Retain guild lifecycle references with
RESTRICT as the backstop only; the refusal path is the existing beginGuildBankDelete
guard extended at BOTH guild-deleting
call sites before any member row is deleted, and the explicit safe disposition means
fund materials and gold at zero through this file's withdraw-to-guild-bank verb and the
pooled service balance settled or refund-requested (D78); disband of a guild holding a
keep-forever housing row is 28a's tombstone disposition (D79). This adds no automatic
house/content loss policy. Deleting an observing character/account
must not cascade the guild's protection history. Preserve original guild source IDs
and finalized intervals across dormant load, restart and administrative recovery.

28a produces the exact schema/query/FK/lock/bounds/retention extension in the existing
07b lifecycle DB contract, with reviewed literal measurements in MEASURE-BOUNDS;
it does not create another artifact owner. 29 tests current-member activity, offline
roster additions, removal at the observation boundary, all members absent/returning,
concurrent alts/realms, long dormant hall, overlapping outage, stale revision/finality,
disband refusal at both call sites and the disband-permitted state after the withdraw
verb (D78), observer deletion and bounded periodic load. Database/persistence/security
review before and after, plus disposable-PG concurrency evidence, are required.

## Literal D9 and original-operation money authority

The game server and Sim remain ignorant of physical distribution. The future economy
service owns eligibility verification and opaque authorization bound to account,
purpose/SKU, policy, quote and operation, with issuer/verifier conformance in the
accepted service artifact. A first-party web checkout session alone is insufficient.
Client channel labels, Origin, UA, arbitrary JSON, linked Steam/Epic accounts and the
game-service secret never prove eligibility; do not add a trusted channel field to the
game server. The client capability map controls presentation, not purchase authority.
Unknown eligibility refuses NEW spend. Already accepted payments recover under their
original operation after session/authorization expiry or eligibility change.

Use the service response protocol specified in 15: authenticated bounded decoding,
complete original operation/fingerprint/target/effect validation and terminal-state
classification. A malformed/nonterminal reply is neither a grant nor proof of no
debit. Written signed acceptance is not runtime cryptographic verification. The 07
developer fixture cannot mint a paid receipt or satisfy online service authorization.
Keep all three money gates: counsel before enable/store submission, default-off
FREEHOLDS_ENABLED on both dispatch arms/catalog, and the seven-distribution surface map.
Published Terms, accepted service catalog/contract and issuer/verifier evidence remain
release gates; the final legal-team handoff in 44b does not postpone these earlier gates.
The economy service owns every price and all token math; expectedCostClaudium is only
the forwarded literal quote fingerprint. Test false client claims, unknown eligibility,
malformed/ambiguous replies and successful original-operation recovery on both arms.

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
This is Phase 29 of the Freeholds and Guildhalls feature: Guildhall purchase and upkeep
(the pooled Claudium purchase with officer approval, 2x decay, the ledger paid from the
Hall Fund, member donations with a weekly cap, the officer withdraw to the guild bank,
the contribution log with retention).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (four slices over the Phase 13/13a, 15, and 28 seams).

Goal: let a guild buy its Meeting Hall from the pooled Hall Fund exactly once, keep it
up through a ledger the fund pays with materials any member may donate under a weekly
cap, let an officer move the fund's materials and gold back to the guild bank, and keep
an auditable, retained contribution log, with the economy service owning every price.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave C branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the storage-charter exactly-once model, the
  Postgres cluster of the gotcha catalog (retention, growth budgets), the server and
  tests cluster, test-pin traps, the monolith ratchet.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the Phase 28 decisions), docs/freeholds/progress.md (only
  "29 Guildhall purchase and upkeep"), docs/prd/woc/freehold-service-contract.md, this file
- src/sim/freehold/ (hall_fund.ts, permissions.ts, ledger_core.ts, ledger.ts,
  condition_core.ts, grant.ts, state.ts, CLAUDE.md), src/sim/content/freehold/charters.ts,
  tiers.ts (the 2x decay flag), ledger_schedule.ts, src/sim/professions/reagent_sources.ts
  (planReagentSourceDraw: the one planner), src/sim/professions/farm_watch_fee.ts (the
  published-order model), src/sim/item_copy_ref.ts
- server/claudium.ts (the kind === 'freehold' branch, the store filter),
  server/claudium_proxy.ts, server/storage_purchases.ts (the exactly-once and
  DEFINITIVE_REFUSAL_REASONS shapes), server/freehold_wire.ts, server/freehold_db.ts,
  server/retention_sweep.ts (createRetentionSweep, the tables array in server/main.ts),
  server/play_session_retention_db.ts (the prune primitive exemplar),
  server/bank_ledger_growth_budget.ts (the growth-budget exemplar: the cross-process
  hard ceiling for a keep-forever table, not a per-account log),
  server/economy_telemetry.ts, server/db.ts (exportAccountData), .env.example
- server/raid_reset.ts (nextWeeklyRaidResetMs, WEEKLY_RESET_WEEKDAY: the realm weekly
  boundary) and server/sim_calendar_feed.ts (resetDay: the realm DAY key; the cap week
  is 13's ledgerWeekOf over it, never the day key, D84), src/sim/guild_bank.ts (the
  guild-bank deposit path the withdraw verb targets)
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts, src/net/freehold_snapshot_wire.ts, src/ui/hud/housing/
  steward_panel_view.ts, the WOC Store window module tests/woc_store_window_contract.test.ts
  pins, src/ui/charter_card_view.ts, src/game/distribution_surfaces.ts
- tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/freehold_ledger.test.ts,
  tests/freehold_condition.test.ts, tests/freehold_hall_fund.test.ts,
  tests/provisioner_firewall.test.ts, tests/monolith_budget.test.ts
The agent returns, and the session records in state.md BEFORE implementing: the locked service-owned guild pooled balance and debit/credit ledger
contract (the game receives an absolute versioned balance and never redeems local
credit as authority); the Phase 15 fake-service harness implements that exact draft; the officer-approval shape (the spend route checks the
session's rank; the store surface shows the row to officers only); the contributions
table shape (`guild_hall_contributions`: guild id, account id, kind, item id, amount,
created_at; indexes on (guild_id, created_at) and (account_id, created_at); a retention
window env key with a positive default; the prune primitive) and its export row; the
weekly cap as a multiple of one ledger (the state.md rule, TUNING) keyed (account_id,
guild_id, realm week) through ledgerWeekOf with the durable SUM under an exclusive lock
at 07a's account position (FOR NO KEY UPDATE on the accounts row, or a transaction
advisory lock on the cap key; never the shared KEY SHARE, D84); the
withdraw-to-guild-bank verb's shape on the 07a rail (D78); the extraction candidates
for every coordinator line.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, four slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts,
docs/prd/woc/freehold-service-contract.md, the parity goldens):
- Agent SIM: condition_core.ts takes the decay rate from the tier (2 per realm day for a
  Guildhall, 1 for a freehold; the unchanged pause/grace rules evaluated from 07b/13a committed history); ledger.ts pays a
  Guildhall's ledger from the Hall Fund's material slots through the one planner (the
  fund as the carried pool, no vault), officer rank required; hall_fund.ts gains the
  `hall_fund_donate` command (materials from bags through the item_copy_ref tri-state,
  gold from meta.copper; an absolute revisioned Claudium balance only ever arrives from verified service outcome), the
  weekly per-account cap across alts keyed (account_id, guild_id, ledgerWeekOf) (one
  current weekly Hall Ledger-equivalent per account across alts, with resource/currency
  allowance and rounding from the calibration schedule; the sim's check is advisory
  and the server's SUM is the durable count, D84) with a text-free `donation_capped`
  refusal appended to freeholdDeniedLineKey in src/ui/hud/housing/housing_view.ts
  (D26), the `hall_fund_withdraw` command (officer-plus; moves the fund's material
  slots and gold into the guild bank through the existing guild-bank deposit path on
  the 07a rail, refused `not_officer` for a member and by the guild bank's own capacity
  refusal, D78), a bounded in-record contribution ledger; text-free freeholdGranted and
  freeholdDenied reasons; tests/freehold_hall_fund.test.ts, tests/freehold_ledger.test.ts,
  and tests/freehold_condition.test.ts extended.
- Agent SERVER-MONEY: the `guildhall_charter_meeting_hall` SKU in charters.ts (no price,
  no copy) and the `hall_fund_donation_claudium` SKU (repeatable) under spend kind
  freehold; grant.ts gains `freeholdGrantGuildhall(ctx, guildKey, skuId, purchaseKey,
  { dryRun })` (exactly-once through the durable housing intent/receipt rail) and
  `hallFundApplyConfirmedBalance(ctx, guildKey, absoluteBalance, serviceRevision, operationId)`
  (NEW planned grant helper; never increment a game-authoritative currency amount); the spend branch checks
  the session's rank for the purchase, dry-runs before the spend, applies after a
  definitive result, refuses while dark and drops both SKUs from the store filter; a
  `freehold` telemetry source row for the new commands; tests/server/freehold_gates.test.ts
  extended (both dispatch arms).
- Agent SERVER-DB: `guild_hall_contributions` in server/freehold_db.ts (additive DDL,
  both indexes: (guild_id, created_at) for reads and prune and (account_id, created_at)
  for the cap SUM, export and delete, a prune primitive `pruneHallFundContributionsBatch`
  in the owning module) registered in the retention tables array in server/main.ts
  after listen, the env key in .env.example, the exportAccountData row for a donor's
  own entries, the write inside the donation path with the cap SUM under an exclusive
  lock at 07a's account position inside the same transaction (FOR NO KEY UPDATE on the
  accounts row, or a transaction advisory lock keyed (account_id, guild_id, realm
  week); the shared KEY SHARE cannot serialize two alts on two realms, D84), the
  withdraw verb's guild-bank participants at their 07a positions, the disband-permitted
  state exposed to 28a's guard (fund materials and gold at zero, service balance settled
  or refund-requested, D78); tests/server/freehold_db.test.ts and
  tests/server/main_retention_wiring.test.ts extended, the pg-armed twin.
- Agent UI: the Guildhall row in the WOC Store window for officers only where
  HudFeatures.freeholdPurchaseEnabled (D91; absence on a denied storefront is the D86
  runtime contract), the Steward panel for a Guildhall (fund have and need, pay from
  the fund, the donation form with the cap readout, the contribution ledger, the
  officer-only Withdraw to Guild Bank action, D78), the mobile sheet decision,
  screenshots. Every new string is one of the NEW keys below in the existing
  hudChrome.housing.guild.* and charter.* families (never a housing.hall.* namespace);
  ux-spec sections 8 and 10 carry the rows and both UX manifests regenerate in this
  phase with every cited count updated (D92). Existing keys are reused where they fit
  (guild.title, guild.fund, guild.contributions, guild.officerRequired,
  steward.haveNeed, charter.review, charter.confirm, charter.pending, charter.price).
  NEW keys (exact English; title case for buttons and titles, sentence case otherwise):
  hudChrome.housing.charter.guildhallTitle = "Guildhall Charter";
  hudChrome.housing.charter.guildhallSummary = "Open a Meeting Hall for your guild,
  paid from the Hall Fund."; hudChrome.housing.charter.guildhallOfficerOnly = "A guild
  officer can complete this purchase for the guild.";
  hudChrome.housing.charter.guildhallReceived = "Your guild's Meeting Hall is ready.";
  hudChrome.housing.charter.guildhallOwned = "Your guild already has a hall.";
  hudChrome.housing.guild.fundBalance = "Hall Fund balance: {balance}";
  hudChrome.housing.guild.payFromFund = "Pay From the Hall Fund";
  hudChrome.housing.guild.reviewFundPayment = "Review Hall Fund Payment";
  hudChrome.housing.guild.fundPaymentPending = "Paying this week's Ledger from the Hall
  Fund..."; hudChrome.housing.guild.fundPaid = "This week's Ledger is paid from the Hall
  Fund."; hudChrome.housing.guild.donate = "Donate";
  hudChrome.housing.guild.donateTitle = "Donate to the Hall Fund";
  hudChrome.housing.guild.donateMaterials = "Materials";
  hudChrome.housing.guild.donateGold = "Gold";
  hudChrome.housing.guild.donateClaudium = "Claudium";
  hudChrome.housing.guild.capReadout = "This week: {used} of {cap} donated";
  hudChrome.housing.guild.capReached = "You have reached this week's donation limit.";
  hudChrome.housing.guild.capResets = "Your donation limit resets with the weekly
  reset."; hudChrome.housing.guild.donatePending = "Sending your donation...";
  hudChrome.housing.guild.donated = "Your donation is recorded.";
  hudChrome.housing.guild.contributionsEmpty = "No contributions have been recorded
  yet."; hudChrome.housing.guild.contributionEntry = "{name} gave {amount} on {date}";
  hudChrome.housing.guild.contributionsWindow = "Contributions from the last {days}
  days"; hudChrome.housing.guild.withdrawToBank = "Withdraw to Guild Bank";
  hudChrome.housing.guild.withdrawConfirm = "Move the Hall Fund's materials and gold to
  the guild bank?"; hudChrome.housing.guild.withdrawPending = "Moving the Hall Fund to
  the guild bank..."; hudChrome.housing.guild.withdrawn = "The Hall Fund's materials and
  gold are in the guild bank."; hudChrome.housing.guild.fundEmpty = "The Hall Fund is
  empty."; hudChrome.housing.guild.conditionRate = "A Guildhall wears twice as fast as a
  personal home."
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (tracked release gate); (2) the
  fail-closed flag defaulting off refuses both SKUs at the spend branch and hides them
  in the store filter, pinned; (3) the per-distribution surface map pinned by tests keeps
  the purchase and donation surfaces unreachable on every native, Steam, and Epic build
  as a runtime contract (D86: no DOM node, handler, request or accessible text; the
  dormant code and keys ship in every bundle). The
  economy service owns prices and token math: the game forwards expectedCostClaudium as
  a fingerprint and never computes a peg, a burn, a split, or the 3x.
- Exactly-once: durable housing receipt/recovery authority; replay and restart grant
  once, a second entitlement refuses, and a confirmed donation balance revision applies
  once without trusting a bounded live key array.
- Server authority: rank from the session stamp; the cap and the week (ledgerWeekOf,
  D84) from the realm calendar with the durable SUM in Postgres; nothing trusted from
  the payload.
- Persistence: additive idempotent DDL, indexes for the prune predicate and the
  account-leading cap/export path, a retention registration for the growing table, an
  export row, fake pool plus pg-armed twin.
- Determinism: no Rng; the week is ledgerWeekOf over ctx.resetDay (D84), never the day
  key; no wall clock in src/sim/.
- Never a Perfecting keystone, gear intermediate, or catalyst in the Guildhall ledger
  (the same schedule table, swept); never destroy: condition 0 still opens the hall.
- Store policy: no "earn" language in purchase benefits; no timed loss; nothing repossessed.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings.
- Working numbers (roughly 3x, the weekly cap, the retention window) are state.md
  values; the economy service and Fernando own the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Hall amenities and boards (Phase 30); guild deeds (Phase 31); Great Hall, Bastion, and
  build projects (Phase 32); any gold rail for the purchase.


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_hall_fund.test.ts tests/freehold_ledger.test.ts
  tests/freehold_condition.test.ts tests/freehold_guildhall.test.ts
  tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/provisioner_firewall.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/server/freehold_gates.test.ts tests/server/freehold_db.test.ts
  tests/server/freehold_wire.test.ts tests/server/main_retention_wiring.test.ts
  tests/server/claudium.test.ts tests/server/storage_gates.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/woc_store_window_contract.test.ts tests/distribution_surfaces.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/social_system.test.ts` plus the guild bank suites unchanged; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; regenerate both UX
  manifests per state.md "UX verification inventories" and compare exact counts
  (D92); the pg-armed twin after `npm run db:up`; screenshots for the store row and the
  Guildhall Steward panel.
- Required reviewers: privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add Hall Fund donations, the officer withdraw, the weekly cap and the
  Guildhall ledger draw
- feat(server): grant the Guildhall through the pooled Hall Fund spend
- feat(server): log Hall Fund contributions with retention
- feat(ui): show the Guildhall row and the fund ledger to officers
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/server/freehold_gates.test.ts proves on both dispatch arms: a member is
  refused the purchase, an officer's purchase grants once, a replayed key grants once, a
  second purchase refuses, price drift refuses, the flag dark refuses and hides the SKUs.
- [ ] tests/freehold_hall_fund.test.ts proves the cap keyed (account_id, guild_id,
  realm week) across alts by fresh literals, that a resetDay rollover which does not
  cross the weekly reset leaves the cap consumed and the ledgerWeekOf boundary restores
  it (both by fresh literals, D84), material and gold donations, an absolute revisioned
  Claudium balance only through the verified service-result grant, the Guildhall ledger
  paid from the fund by an officer and refused for a member, and the officer withdraw
  moving materials and gold to the guild bank while a member is refused;
  tests/freehold_condition.test.ts pins 2 per day for a Guildhall.
- [ ] tests/server/main_retention_wiring.test.ts registers the prune exactly once after
  listen with the window from config; tests/server/freehold_db.test.ts pins the DDL,
  both indexes and the prune primitive (fake pool and pg twin); the export row is in;
  the pg-armed race of two alts on two realms (two server processes against one
  Postgres, both donations started before either commits) commits at most one cap's
  worth, the second refusing donation_capped, and the query/index inventory lists the
  account-leading index and the exclusive lock mode the SUM runs under (D84).
- [ ] The pg-armed twin with tests/social_system.test.ts proves a stocked fund reaches
  the disband-permitted state (materials and gold at zero through the withdraw verb,
  the service balance settled or refund-requested through the end-of-life request) and
  that a non-empty fund refuses disband on both guild-deleting call sites (D78).
- [ ] Every new guild.* and charter.* key named in STEP 2 exists in the regenerated
  manifests with the cited counts updated, and grep of the diff finds no
  housing.hall. key (D92).
- [ ] docs/prd/woc/freehold-service-contract.md carries the two SKUs, the pooled-balance
  protocol, the cap schedule and the Hall Fund end-of-life row (D78); the handoff is
  handoff-ready, with its acceptance status recorded as an unsigned release gate unless
  a signature artifact is on file.
- [ ] All STEP 3 suites green; the reviewers confirm ALL findings, including nits, are resolved and freshly reviewed; the ceilings did not
  rise; state.md records the verified implementation facts and accepted artifact rows.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 29, notes, named unsigned release
  gates) and
  docs/freeholds/state.md (the per-phase ledger row 29: commands, SKUs, the table, the
  env key, i18n keys; the settlement and cap decisions as locked).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-29-qa.md

STOPPING RULES:
- A service-contract mismatch fails integration acceptance and keeps production off;
  complete the service-contract handoff (its acceptance an unsigned release gate until
  a signature artifact is on file) without adding game-side price arithmetic.
- Stop if the contribution log cannot be bounded and retained (a growing table without
  a retention story is a defect).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
