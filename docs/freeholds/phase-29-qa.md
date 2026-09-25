# Phase 29 QA: audit Guildhall purchase and upkeep

Audits `phase-29-guildhall-purchase-and-upkeep.md`. Verdict goes in `progress.md` (row
"29 QA"). The next implementation phase never starts before this file has run.

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
This is Phase 29 (QA) of the Freeholds and Guildhalls feature: audit Guildhall purchase
and upkeep (the pooled purchase, 2x decay, the fund-paid ledger, donations and the
weekly cap, the officer withdraw to the guild bank, the contribution log with
retention).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 29 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "29 Guildhall purchase and upkeep", missing
tests, dead code, exactly-once purchase, the money gates, server authority over rank
and the cap, persistence and retention, and the keystone exclusion; fix what the audit
finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave C. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the storage-charter exactly-once entries, the Postgres cluster.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the STEP 1 decisions Phase 29 recorded),
  docs/freeholds/progress.md ("29 Guildhall purchase and upkeep" and the row),
  docs/freeholds/phase-29-guildhall-purchase-and-upkeep.md (what was promised),
  docs/prd/woc/freehold-service-contract.md
- the Phase 29 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 29)
- the pins the diff claims: tests/server/freehold_gates.test.ts,
  tests/freehold_hall_fund.test.ts, tests/freehold_ledger.test.ts,
  tests/freehold_condition.test.ts, tests/server/freehold_db.test.ts,
  tests/server/main_retention_wiring.test.ts, tests/provisioner_firewall.test.ts,
  tests/woc_store_window_contract.test.ts, tests/distribution_surfaces.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every place a
price, amount, or split is computed or compared (there should be only the fingerprint
forward), every rank check and its source, the cap key and its durable SUM and lock
position, where ledgerWeekOf is read (and that resetDay alone is never the week), the
withdraw verb's rail and guild-bank participants, the DDL, both indexes and prune text,
the retention registration, the export row, every new guild.* and charter.* key against
the regenerated manifests, every test added with what it asserts, and any TODO, unused
import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the purchase is
  exactly-once across a replayed key, a different key, a crashed session, and a second
  officer; a member cannot purchase, pay from the fund or withdraw on BOTH dispatch
  arms; the cap is keyed (account_id, guild_id, realm week) through ledgerWeekOf, resets
  on the realm weekly boundary and NOT on a resetDay rollover or a wall-clock week
  (D84); the officer withdraw empties materials and gold to the guild bank, a stocked
  fund reaches the disband-permitted state only through it plus the service end-of-life
  request, and a non-empty fund refuses disband on both guild-deleting call sites
  (D78); the Guildhall ledger draws only
  from the fund's slots through the one planner; guild wear uses the same finalized-history evaluation rules with its authoritative eligible-member lifecycle scope; the
  store filter hides both SKUs while dark and the purchase surface is absent on native,
  Steam, and Epic as a runtime contract (no DOM node, handler, request or accessible
  text; the dormant code and keys ship in every bundle, D86); the contribution log is
  written once per donation and pruned by the registered primitive; the extractions
  are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (the cap literal is fresh; a
  resetDay rollover that does not cross the weekly reset leaves the cap consumed and
  the week boundary restores it; the pg-armed race of two alts on two realms (two
  server processes against one Postgres, both donations started before either
  commits) commits at most one cap's worth with the second refused donation_capped,
  and the query/index inventory lists the account-leading index and the exclusive lock
  mode the SUM runs under (FOR NO KEY UPDATE on the accounts row or a transaction
  advisory lock on the cap key, never the shared KEY SHARE); the withdraw and
  disband-permitted arms are pg-armed with
  tests/social_system.test.ts; the exactly-once test asserts the record after each
  replay; the rank tests cover every rank per command including withdraw; the prune
  test proves the batch bound and the cutoff; the retention wiring pin proves
  exactly-once registration after listen; the pg twin ARMED); orphaned tests; a
  determinism case with a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant and the token firewall, a price or copy field on any SKU record, the
  word "phase" in any code, comment, or commit message, em dashes or emojis, generated
  files hand-edited, an env key without an .env.example row, any hudChrome.housing.hall.
  key in the diff, a new string outside the guild.* and charter.* keys 29 named or
  missing from the regenerated manifests, the approved decisions and verified
  implementation facts recorded in state.md, freehold-service-contract.md matching
  charters.ts including the Hall Fund end-of-life row.
- Required reviewers: privacy-security-review, database-performance-reviewer, migration-safety, server-hot-path-reviewer, architecture-reviewer, cross-platform-sync, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 29 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin.

STEP 4 - FIX:
- Apply ALL findings including nits, resolving any claimed conflict against the
  approved decision rather than leaving an unreviewed exception. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
ALL findings, including nits and uncertain findings resolved against source evidence,
must be applied and the complete fix round read by a fresh reviewer before PASS.
External signatures remain concrete release-gated artifacts, never deferred review findings.
- [ ] Every Phase 29 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "29 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-30-hall-amenities.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 29 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
