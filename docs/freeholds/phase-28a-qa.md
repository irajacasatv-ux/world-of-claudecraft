# Phase 28a QA: audit guild lifecycle and membership evidence

Audit phase-28a-guild-lifecycle-and-membership.md and the exact five deliverables below.
The verdict goes in progress.md row 28a QA; 29 cannot start until this pair passes.

## Deliverables (at most five):

1. Guild-keyed lifecycle head and immutable protection history under 07b's owner.
2. Committed membership-incarnation evidence and revocation-boundary capture.
3. Bounded admitted guild observation, coalescing and nonregressing installation.
4. Original guild binding, shared-calendar projection and the D79 tombstone disposition.
5. Real-Postgres authority, history, lock, retention and load proof.

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
read cannot manufacture past membership. removeGuildMember is today a single autocommit
DELETE ... RETURNING in server/social_db.ts, so 28a converts it into a transaction that
settles the observation and then publishes, and the in-memory SocialDb in
tests/social_system.test.ts mirrors that transaction. Keep immutable return/protection
boundaries
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
described as already shipped. Release semantics (origin/release/v0.42.0, verified
2026-09-06; re-verify every anchor against the newest origin/release/** at phase start
per the merge-forward rule): GUILD_MEMBER_LIMIT is removed and the roster cap is per
guild, base 100 plus 20-seat pages up to GUILD_ROSTER_MAX_MEMBERS (1,000 seats) in
src/sim/guild_roster.ts; PgSocialDb.guildMembership returns rosterPages beside
guildId/guildName/rank; addGuildMemberAtomic drops its limit parameter and reads the cap
from the FOR UPDATE guild row; SocialTransport gained buyRosterPage and SocialEvent
gained guildRosterResult and guildRosterExpanded; NEW server/guild_roster_page_db.ts
(the roster page purchase) rides acquirePaidGuildCreateClient and beginCharacterSaveTx,
locks the account parent KEY SHARE, UPDATEs the guilds row (GUILD_ROSTER_PAGE_CAS_SQL,
re-checking the buyer is still leader), inserts guild_roster_receipts and then saves
the character, in the hierarchy accounts, then guilds, then characters; NEW table
guild_roster_receipts cascades with guilds and characters; src/world_api/social_graph.ts
gained guildBuyRosterPage and GuildInfo.memberCap/nextRosterPrice, so
tests/world_api_parity.test.ts conflicts on every housing facet batch at merge; the
tests/social_system.test.ts SocialDb and transport fakes must implement those release
shapes. Rank-only changes do not restart grace, and a member joining a different guild
copies neither prior-guild nor personal grace. Unprovable queued eligibility stays
unresolved/not-ready with original evidence preserved.

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
07a's actual membership/save touch sets, enumerated from the release tree:
addGuildMemberAtomic's guild-parent lock (the cap read from the locked row),
removeGuildMember's deletion (a transaction after 28a), transferGuildLeader's parent
plus member updates, deleteGuild's cascades (guild_members, guild_events, guild_banks,
guild_pledges, guild_pledge_ladder and the release guild_roster_receipts), the roster
page purchase in server/guild_roster_page_db.ts (account KEY SHARE, guilds row UPDATE,
guild_roster_receipts insert, character save, all inside beginCharacterSaveTx behind
acquirePaidGuildCreateClient: accounts, then guilds, then characters) and
onGuildMembershipChanged delivery. No blanket head-first hierarchy. Retain guild
lifecycle references with RESTRICT as the backstop only; the refusal path is the
existing beginGuildBankDelete guard extended at BOTH guild-deleting call sites
(guildDisband, and guildLeave last-member-out) before any member row is deleted,
refusing while hall, fund, checkpoint, credit or recovery dependencies remain. The
explicit safe disposition means (D78): fund materials and gold at zero through 29's
officer-plus withdraw-to-guild-bank verb, and the pooled service balance settled or
refund-requested through the service contract's Hall Fund end-of-life row. A guild
that holds any keep-forever housing row (the hall record, guild_deeds, first clears)
is never hard-deleted: disband is the tombstone disposition (D79): the guild row is
retained with a tombstone status, member rows are removed, the realm name is released
by a tombstone-aware uniqueness rule (guilds_realm_name is today a plain UNIQUE index
on guilds), and guild_deeds rows stay attached. GM character or account deletion routes
through the same guard (D79): leadership passes to the highest-ranked remaining member
or, with none, the tombstone disposition applies with fund disposition per D78; today
deleteCharacter in server/db.ts has no leader guard and guild_members cascades on
character deletion, so 28a adds the routing at that mutation site. This adds no
automatic house/content loss policy. Deleting an observing character/account must not
cascade the guild's protection history. Housing capacity never gates gameplay (D83):
the 07b join-time reservation hook publishes the session regardless of guild
observation capacity, and exhaustion records a bounded, auditable gap with an operator
alert instead of refusing GameServer.join. Preserve original guild source IDs and
finalized intervals across dormant load, restart and administrative recovery.

28a produces the exact schema/query/FK/lock/bounds/retention extension in the existing
07b lifecycle DB contract, with reviewed literal measurements in MEASURE-BOUNDS;
it does not create another artifact owner. This pair proves the producer; 29 additionally tests current-member activity, offline
roster additions, removal at the observation boundary, all members absent/returning,
concurrent alts/realms, long dormant hall, overlapping outage, stale revision/finality,
disband refusal, observer deletion and bounded periodic load. Database/persistence/
security review before and after, plus disposable-PG concurrency evidence, are required.

## Exact measurement and acceptance evidence

This pair produces the guild extension of 07b's schema/query/FK/lock/retention contract
and MEASURE-BOUNDS rows in content-numbers-workbook.md. Derive literal batch, queue,
row-byte, history-page and timeout limits from the existing shared-admission limits,
measured legal membership cardinality (GUILD_ROSTER_MAX_MEMBERS, 1,000 seats, from
src/sim/guild_roster.ts on the release branch, never the old 100-member model) and
seeded PostgreSQL plans; the database reviewer
accepts the resulting named artifact before runtime enable. No numeric gameplay rule
is created. R10's absence/return policy and its accepted binding are unchanged; R28's
donation cap is not a presence-eligibility rule. No rank/tenure/donation percentage is
introduced. Reuse the same static account/guild branch owner and finality semantics.

Prove additive idempotent DDL, minimum-capable rollout and rollback preserving history;
member activity while the hall is unloaded; offline roster additions; kicked members
with queued observations; rank-only changes; leave/rejoin/new-guild incarnations;
concurrent members/alts/realms; periodic coalescing preserving every return boundary;
all members absent and returning across repeated cycles; original guild calendar after
realm change; stale or missing binding/history not-ready; open multi-year outages;
disband refused at BOTH guild-deleting call sites before any member row is deleted for
each live hall/fund/checkpoint/credit/recovery dependency; the explicit safe
disposition (D78) before the tombstone disposition, which retains the guild row,
releases the realm name and keeps guild_deeds attached (D79); GM character deletion
with a hall present passing leadership to the highest-ranked remaining member, and with
none applying the tombstone with the fund disposition requested per D78 (pg-armed);
the D83 join-time rule (the session publishes regardless of guild observation capacity
and exhaustion records a bounded auditable gap); observer character/account deletion
preserving guild history; stale generation install; cancellation and query-count/plan
bounds.
Protect internal account/character/session evidence from every owner/member/public wire
projection. Offline/headless hosts retain the approved nonnetwork behavior without
inventing server membership evidence. No timer requires a loaded hall or per-member
head-write loop, and no client is acquired while joining a serializer.

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
This is Phase 28a QA of Freeholds and Guildhalls.
Harness: Claude Code. Follow root CLAUDE.md "Working style by model capability";
this prompt names no model. Any asset fix must use Codex, not Claude.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave C branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the monolith ratchet, the Postgres cluster of the
  gotcha catalog, world_api parity pins, sim_context callback pins, test-pin traps, the
  guild bank escrow-delta entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn an Explore reader for the entire 28a implementation file, all contracts above,
the approved state decisions (D78, D79, D83 included), 07b/13a authority contracts,
28's guard and membership seams, the release roster facts (roster page purchase,
guild_roster_receipts, rosterPages, GUILD_ROSTER_MAX_MEMBERS) re-verified against the
newest origin/release/**, implementation diff and measurement evidence. Return every
promise and its test/anchor in a scratch report, with no assumption of passing by
inspection.

STEP 2 - AUDIT:
Parallel independent readers cover: membership/incarnation/commit authority and privacy;
PostgreSQL locks, indexes, retained history, deletion, finality and query/queue bounds;
and decisive test coverage, cross-host parity, unsupported versions and rollout.
Prove every scenario in the exact evidence contract above. Require literal observed
source identities and outcomes, work-happened anchors, actual disposable-PG interleavings,
and measured query counts/plans. A fake pool or a mocked timestamp cannot prove the
membership transaction's real lock compatibility. Check no periodic coalescer erases
return transitions and no deleted observer cascades another guild's protection. Prove
the disband guard refuses at BOTH deleting call sites before any member row is deleted;
the tombstone disposition retains the guild row, releases the realm name and keeps
guild_deeds attached; and the pg-armed GM-deletion case (delete the leader's character
with a hall present: leadership passes to the highest-ranked remaining member, or with
none the tombstone applies and the D78 fund disposition is requested; the guild row,
hall and history survive). Prove the D83 join-time publish under exhausted capacity.
Required reviewers: database-performance-reviewer before fixes involving SQL/cadence
and again on the finished diff, migration-safety, privacy-security-review,
architecture-reviewer, server-hot-path-reviewer, cross-platform-sync, test-coverage-auditor
and qa-checklist. UI/render/content fixes additionally trigger frontend-seam-reviewer,
render-performance-reviewer and content-obligations-reviewer. Each writes COVERAGE,
BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT to a file. Apply ALL findings including nits.

STEP 3 - VALIDATION:
Run the exact 28a STEP 3 suite list and PostgreSQL twins with TEST_DATABASE_URL armed.
Run node scripts/gate_select.mjs (or deeper npm run gate) and record exact exits.
Compare the source-policy/artifact values to actual code and seeded plans; no fabricated
measurement, silently skipped PG suite or claimed-but-unrun check can pass acceptance.

STEP 4 - FIX:
Apply every finding with scoped Conventional Commits, bodies and explicit paths;
never git add -A, no co-author trailer, and no "phase" in any commit message. Re-run
changed-surface checks and the required gate. A fresh reviewer reads every fix before
a verdict; npm run ci:changed after the final commit is additional evidence only.

STEP 5 - ACCEPTANCE:
ALL findings, including nits and uncertain findings resolved against source evidence,
must be applied and the complete fix round read by a fresh reviewer before PASS.
External signatures remain concrete release-gated artifacts, never deferred review findings.
- [ ] Every implementation acceptance and evidence row passed a decisive executed check.
- [ ] Before/final database, persistence and security reports cover the actual participants.
- [ ] All findings including nits are fixed and a fresh reader verified the complete fix round.
- [ ] No shadow lifecycle/receipt authority, undefined deletion disposition, hard delete
  of a guild holding a keep-forever row, fabricated membership or unbounded
  history/roster loop remains.

STEP 6 - DOC UPDATES + MEMORY:
Record PASS or FAIL, findings/fix counts and actual test exits in progress.md row 28a QA.
Update exact implementation facts in state.md and the existing contract/workbook rows.
Record useful traps in memory; acceptance is not a runtime launch authorization.

STEP 7 - FINAL RESPONSE FORMAT:
End with verdict, coverage, fixes, exact checks and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-29-guildhall-purchase-and-upkeep.md

STOPPING RULES:
- A failed contract or check returns to the 28a implementation file with concrete evidence.
- Do not push the branch, open or merge a PR.
```
