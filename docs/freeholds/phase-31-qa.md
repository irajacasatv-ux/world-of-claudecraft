# Phase 31 QA: audit Guild-level deeds and first-kill trophies

Audits `phase-31-guild-deeds-and-first-kill-trophies.md`. Verdict goes in `progress.md`
(row "31 QA"). The next implementation phase never starts before this file has run.

## Settled delivery and acceptance contract

Three terms are used exactly and never interchanged. A credited recipient is a
participant the UNCHANGED existing clear-credit rules credit (the generic eligible
snapshot in src/sim/combat/damage.ts or the Nythraxis room roster). A carrier-eligible
participant is a credited recipient whose stamped meta.guildMembership is non-null at
the hook AND who holds a live authenticated GuildClearCharacterGeneration; sessionless
players and developer bots are never carrier-eligible. A retired generation is a
character generation after authoritative leave. Credit each guild represented by at
least one carrier-eligible participant, using that participant's stamped membership at
the clear, never current roster at later display time or an invented percentage
threshold. The existing clear-credit rules define participation; a remote/offline
guildmate does not create credit. Preserve boss, difficulty, original day/character
and durable event identity. Historic
backfill requires actual guild-at-clear evidence; character_deeds plus present-day
membership is insufficient, so absent such proof recording begins at deploy. Unknown
old difficulty/date stays explicitly unknown and never mints a higher finish. Do not
change character deed credit or grant renown/power. Multiple clears/observers/restarts
insert one (guild_id, deed_id) first-clear row and publish only committed unlocks with a stable notice identity.

Qualifying sources are every FINAL_BOSS_DUNGEONS template (src/sim/deeds.ts) at normal
and heroic: sixteen guild deed ids guild_first_<boss>_<difficulty>, one trophy prop id
each. The five dungeon final bosses (morthen, vael_the_mistcaller, ysolei,
korzul_the_gravewyrm, wildheart_high_priest) hang the banner family with a per-boss
emblem; the three raid bosses (nythraxis_scourge_of_thornpeak,
ignivar_herald_of_the_last_flame, varkhul_forgefather_of_the_last_flame) stand a
statue; the finish follows 23's finishFor rule (normal bronze, heroic silver).

Populate 30a's previously unavailable first-kill War table section from this bounded
authorized projection through 30a's guildHallBoards read; no facet member is added
here, so the parity pin is unchanged (D82). Guild trophies are shared guild records;
member personal plinths preserve 28's ownership/departure policy. Final banner/statue
art, source/name originality, wiki and all content obligations land together. Lazy or
realm-paged hydration replaces whole-table boot scans. Include the earned_by
reverse-FK/export access path, the immutable earned_by_name and earned_by_realm
snapshot the projection reads (D79), keep-forever compact proof and bounded projected
bytes in the query index inventory, with disposable-PG duplicate/concurrency/restart
evidence. Housing capacity never gates gameplay (D83): recording exhaustion records a
bounded auditable clear-not-captured gap with an operator alert; join, dungeon entry,
respawn, character rewards, loot and existing deeds are unchanged.

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

1. Bounded source-life and authenticated-character admission with complete activation coverage.
2. Immutable guild-at-clear capture and original-carrier save-snapshot bridge.
3. Durable first-source proof and bounded committed-outcome persistence/projection.
4. Append-only guild deed content and final shared trophy forms with truthful provenance.
5. War table first-kill UI and complete source, custody, privacy and concurrency evidence.

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

## Source-life admission and original clear capture

The reviewed engineering refinement and verified source facts are recorded in state.md
("Source-reviewed guild-clear admission refinement", as narrowed by D83).
Existing src/sim/deeds.ts::onDungeonFinalBossKilledForDeeds synchronously updates the
original recipients and returns void. GameServer.detectActivity observes deedUnlocked,
appends to the actual pendingDeedRecords and requests ordinary saveCharacter; that writer
captures recordUpTo beside its serialized snapshot. There is no dedicated all-party
clear transaction. Nythraxis's actual room roster can exceed RAID_MAX; the normal realm
login setting is not a hard bound because admins may bypass it and configuration may
disable it. Never replace the actual credited-recipient set with either nominal limit.

This file produces NEW server/freehold_guild_clear_admission.ts::createGuildClearAdmission
for synchronous capacity accounting and NEW
server/freehold_guild_clear_bridge.ts::createGuildClearBridge for immutable source
capture, original carriers, bounded pending prefixes, exact save-snapshot association
and committed-outcome handoff. The already planned server/guild_deeds_observer.ts consumes
only committed outcomes for projection/notices. 07a remains the sole operation/source-
claim transaction authority. Add no receipt table, pool, independent save queue or
background polling loop. Reservation is capacity only, never credit or authorization.

### Exact NEW operation and type contract

NEW src/sim/freehold/guild_clear_contract.ts owns pure readonly types and interfaces.
GuildClearSourceIdentity binds process generation, source-life generation, boss/template
and optional claim generation; entity ID alone is not identity. GuildClearCharacterGeneration
binds authenticated account/character/session/lease and process generations internally.
All tokens below are opaque, owner-issued, generation-fenced, single-purpose values;
none crosses client commands, public wire or saved player content. A wrong, retired or
superseded token cannot mutate current capacity. Repeating an already completed action
is an idempotent no-op with an explicit outcome, never a second release.

GuildClearAdmissionResult<T> is the closed union { ok: true, token: T } or
{ ok: false, reason: 'busy' | 'not_ready' | 'stale_generation' }.
GuildClearTransitionResult is 'applied' | 'already_applied' | 'stale_generation'.
These are text-free internal outcomes. A busy outcome binds only to source activation
or credit capture (D83): it marks a source life or a captured clear not-captured and is
recorded as the bounded clear-not-captured gap with an operator alert; it never reaches
a player as a refusal and never leaks capacities or source identities.
GuildClearSourceBatchRequest is an immutable bounded array of planned qualifying lives
and their existing recipient envelopes, including replacement identities and the full
batch before any mutation. GuildClearCapturedSource carries the immutable original
source identity, recipients/order, provenance and 28a membership evidence below.

| Operation group | Exact NEW signatures and ownership |
| --- | --- |
| Reserve source life or complete replacement batch | reserveGuildClearSourceBatch(request: GuildClearSourceBatchRequest): GuildClearAdmissionResult<GuildClearSourceBatchToken>; the batch token owns one GuildClearSourceReservationToken for each planned source life. |
| Prepare, commit or cancel fresh-character extension | prepareGuildClearCharacterAdmission(request: GuildClearCharacterAdmissionRequest): GuildClearAdmissionResult<GuildClearCharacterAdmissionToken>; commitGuildClearCharacterAdmission(token: GuildClearCharacterAdmissionToken): GuildClearTransitionResult; cancelGuildClearCharacterAdmission(token: GuildClearCharacterAdmissionToken): GuildClearTransitionResult. |
| Consume an existing source at synchronous capture | consumeGuildClearSourceReservation(token: GuildClearSourceReservationToken, source: GuildClearCapturedSource): GuildClearAdmissionResult<GuildClearCapturedBatchToken>; a correctly reserved admitted clear has capacity and cannot return busy. |
| Retire an unconsumed source life | retireGuildClearSourceLife(token: GuildClearSourceReservationToken): GuildClearTransitionResult; only unused allocation is released. |
| Release a committed candidate | releaseCommittedGuildClearCandidate(token: GuildClearCandidateReservationToken, handoff: GuildClearCommittedHandoff): GuildClearTransitionResult; accepted 07a outcome plus bounded projection/recovery ownership is required. |
| Retire a character generation after authoritative leave (a retired generation) | retireGuildClearCharacterGeneration(generation: GuildClearCharacterGeneration): GuildClearTransitionResult; only unused participant envelopes are released once the generation is retired. |

GuildClearCharacterAdmissionRequest contains the authenticated candidate generation,
optional surviving/replaced generation and original 07b admission identity. The factory
tracks both published and prepared-unpublished character generations: a Nythraxis life
reserved while an admission is pending must include that prepared envelope too.
GuildClearCapturedBatchToken contains the bounded per-guild GuildClearCandidateReservationToken
values. The consuming bridge keeps their immutable source evidence and original operation
identity; callers cannot turn the tokens into a second grant or refund authority.

GuildClearSourceAdmission is the narrow synchronous interface for
ctx.guildClearAdmission: reserveGuildClearSourceBatch, consumeGuildClearSourceReservation
and retireGuildClearSourceLife. Full host GuildClearAdmission adds the character and
committed-handoff operations above. The source-facing contract is injected through
SimContext; no server import, SQL, async callback, process clock or distribution knowledge
enters Sim. The bridge's exact NEW signatures are:

- captureGuildClearCandidates(sourceToken: GuildClearSourceReservationToken, source: GuildClearCapturedSource): GuildClearAdmissionResult<GuildClearCapturedBatchToken>.
- captureGuildClearSavePrefix(characterGeneration: GuildClearCharacterGeneration, snapshotIdentity: GuildClearSaveSnapshotIdentity): GuildClearCapturedPrefix.
- applyGuildClearSaveOutcome(capturedPrefix: GuildClearCapturedPrefix, outcome: GuildClearSaveOutcome): GuildClearTransitionResult.

GuildClearSaveSnapshotIdentity binds the carrier generation, lease/save generation and
exact serialized snapshot identity. GuildClearCapturedPrefix is an immutable bounded
ordered list of candidate identities/tokens and its captured prefix boundary, associated
with that snapshot. GuildClearSaveOutcome is the closed committed/known-not-committed/
ambiguous/stale-generation union with original 07a operation identity; only committed
carries the verified applied source-claim outcome. GuildClearCommittedHandoff includes
that exact candidate/source/operation identity and proof of accepted bounded projection/
recovery ownership before release. None of these types serializes a full private roster
or trusts client-selected capacity, snapshot identity, outcome or token construction.

### Whole-source hook and nonrecursive host delegation

Pin the NEW Sim hook exactly as
onGuildClearForDeeds(ctx: SimContext, sourceToken: GuildClearSourceReservationToken,
source: GuildClearCapturedSource): GuildClearAdmissionResult<GuildClearCapturedBatchToken>.
GuildClearCapturedSource holds the readonly full ORIGINAL recipient snapshot and its
order, not one meta or a newly queried roster. Capture that immutable source snapshot
at the original helper entry; call this hook exactly ONCE after the existing clear
counter/reward mutations and outside every recipient loop in
onDungeonFinalBossKilledForDeeds. Its generic and Nythraxis callers therefore each
consume one whole source life, even when several guilds are represented. Preserve
all original character counters, speed tasks and reward ordering. The source token's
Sim seat is the session-only ctx.guildClearSourceLives: Map<entityId,
GuildClearSourceReservationToken> on SimContext beside guildBanks, rewritten when a
life is bound (spawn, respawn, replacement) and deleted at removal, so entity id reuse
cannot alias a life; it lives on neither Entity nor PlayerMeta, so the wireEntity
allowlist and META_EXCLUDE are unchanged and the tests/sim_context.test.ts fake host
pins it. Capture reads the Sim's stamped meta.guildMembership at the hook; a fresh-join
participant whose stamp has not landed yet (the server/game.ts join snapshot lands a
beat after addPlayer) represents no guild at that capture, pinned by a stamp-less
participant fixture.

The NEW bridge returns sourceAdmission: GuildClearSourceAdmission for online boot
injection. buildRealmSimConfig/GameServer injects bridge.sourceAdmission into
ctx.guildClearAdmission, never the raw capacity-accounting handle. Its reserve and
retire methods delegate to the private createGuildClearAdmission owner; its
consumeGuildClearSourceReservation method delegates to bridge.captureGuildClearCandidates.
That bridge method calls the PRIVATE accounting owner's
consumeGuildClearSourceReservation exactly once, records the resulting immutable
per-guild candidates/prefixes and returns the captured-batch outcome. It must not
call the ctx adapter recursively. No source producer may bypass the bridge by calling
the raw capacity-only consume. 07b's host character prepare/commit/cancel operations
keep their planned exact names and owner (07b's NEW module); this changes no lifecycle
admission API.

A decisive two-guild fixture uses one original recipient snapshot, with interleaved
guild membership and an independently pinned first carrier-eligible carrier per guild;
a second fixture makes the first recipient in original order a sessionless guild member
and asserts the next carrier-eligible member carries. Assert
one whole-source hook call, one bridge capture, one private accounting consume and
both original-order carriers/candidates. Reordering save completion cannot change
those carriers; duplicate callback delivery cannot consume again or append another
candidate batch. Assert unchanged character counters/rewards and no recursive adapter
call, raw-accounting bypass or public unlock before the durable source outcome.

### Capacity and fresh authenticated admission

Each source life reserves positive bounded metadata even with no recipients. Bound
slots AND encoded bytes. Generic final-boss lives reserve the actual proven party/raid
recipient envelope. Every live unconsumed Nythraxis life conservatively reserves an
envelope for EVERY admitted authenticated character in the host, regardless of party,
location or guild. Possible distinct guilds are bounded by that actual envelope, so
later membership changes need no extra guild allocation. Several Nythraxis lives multiply
the per-character reservation; RAID_MAX, suggestedPlayers and MAX_PLAYERS_PER_REALM do
not bound the Nythraxis room roster. No invented participant cap or movement barrier.

07b's planned prepareFreeholdLifecycleAdmission / commitFreeholdLifecycleAdmission /
cancelFreeholdLifecycleAdmission bridge composes the exact character operations above.
Preparation extends every affected live-source reservation all-or-none BEFORE
authenticated Sim/GameServer.join publication, including administrator admission, and
retains the GuildClearCharacterAdmissionToken through the lifecycle admission attempt.
The join-time hook publishes the session regardless of capacity (D83): when the
extension cannot fit, the character publishes as an unreserved generation, the gap is
recorded, and no busy reaches the player; a cancelled lifecycle admission still cancels
the unpublished extension. A captured source whose actual recipient batch exceeds its
reserved envelope (possible only when an unreserved generation participated) is a
not-captured clear: character rewards are unchanged and no guild candidate is captured.
A new source reservation counts prepared-unpublished generations, preventing an
activation/admission interleaving gap.

A surviving-generation resume reuses capacity. Takeover is a generation-fenced transfer
or replacement, never duplicate publication or an old completion releasing new capacity.
retireGuildClearCharacterGeneration runs only after authoritative leave makes that
generation retired: no clear callback can name it. Release only unused participant envelope;
already captured candidate capacity survives leave and takeover independently. Sessionless
offline/headless players and developer bots gain no online account authority and keep
their existing character reward behavior. Required online composition cannot choose
an inert adapter; isolated hosts use the explicit nonnetwork contract and parity pins.

### Every source producer reserves before side effects

Bind a fresh source-life generation to each creditable life. Wipe, evade and mechanic
reset retain an unused reservation. A credited death consumes it; resurrection/respawn
requires a new reservation even if the entity ID is reused. Duplicate callbacks cannot
capture a second batch. A source token is associated with its exact planned spawn and
claim/life generation before publication; unused reservations on a refused branch are
retired without touching an earlier source. All batch preflights occur before the first
claim, aura, ID, RNG, entity, death or loot mutation listed below. A refused
reservation never blocks the producer (D83): the life activates exactly as before,
flagged not-captured on its token seat; its clear credits characters unchanged, the hook
returns the gap outcome instead of a captured batch, and the bridge records one bounded
gap row (source identity, boss, difficulty, utcDay) in the redacted metrics with the
operator alert. Gap rows are bounded by the metrics retention, never a queue.

| Verified producer or teardown seam | Closed admission behavior |
| --- | --- |
| src/sim/instances/dungeons.ts::enterDungeon new claim | Reserve every qualifying life before private claimInstance changes fields, IDs, RNG or spawned entities. A refused reservation marks those lives not-captured; entry and claim proceed unchanged (D83). |
| resetDungeonInstances | Reserve the complete replacement batch before freeing any claim; a refused batch marks the replacement lives not-captured; all-or-none difficulty/reset semantics are unchanged. |
| Developer Ignivar-family replacement within enterDungeon | Preflight before clearing encounter auras or freeing family claims, not merely just before claimInstance; refusal marks not-captured and never blocks. |
| spawnMobsForDev | Reserve all qualifying lives in the requested batch before spawning; no partial source-producing batch; a refused batch spawns unchanged as not-captured lives. |
| src/sim/mob/lifecycle.ts::respawnMob via dead-mob update | Reserve the next life before clearing death, loot or any respawn state. Revival is never deferred (D83): a refused reservation revives the mob as a not-captured life. |
| Sim.updatePendingMobRespawns | Reserve before replacement creation AND removal of the pending entry; refusal marks not-captured. |
| Boot, authored and custom spawn producers | Classify the actual FINAL_BOSS_DUNGEONS roster and every reachable qualifying producer; preflight before publication, including non-claim developer sources; refusal marks not-captured. |
| private freeInstance, family reaping, developer despawn and entity removal | Retire the exact old source generation and release only unconsumed allocation; captured candidates survive entity/claim teardown. |

A publication assertion proves no qualifying online source becomes live without a
reservation outcome (reserved, or explicitly not-captured). It is an invariant check,
never the normal pressure handler or permission to throw after partial mutation. Cover
the generic clear route and grantNythraxisLockout / onNythraxisKillForDeeds with the
original room roster, including former raid members.
No later roster or caller-selected participant maximum changes existing clear credit.

### Immutable capture, ordinary save and committed release

At the original synchronous callback capture process/source-life/claim identity,
sourceEventId and original clear order, boss, difficulty, utcDay (D84: earned_day
stamps when the clear happened, never resetDay), authenticated attribution and 28a
guild-at-clear membership incarnation. The first carrier-eligible participant in the
ORIGINAL credited-recipient order is each guild's carrier; a recipient that fails a
carrier test is skipped in that order. Save scheduling or later online/session
iteration cannot elect another carrier. Consume already-held
source envelopes, retain bounded candidate tokens and release unused worst-case
envelopes. Await no SQL and preserve all existing character counters/rewards.

The bridge owns a bounded per-carrier pending candidate prefix separate from
pendingDeedRecords: a qualifying clear with no new character deed still captures and
requests the ordinary admitted carrier save. Every distinct clear identity/order survives
batching; never replace a prefix with latest timestamp/count. Associate the exact
captured prefix with the EXACT serialized carrier snapshot and its lease/save generation.
Candidates arriving during IO remain pending for the next snapshot. Reservation does
not elect the durable first clear, change source order or authorize an unlock.

07a atomically commits the source claim with that carrier's actual save effects through
prepareFreeholdOperation/applyFreeholdOperation. Preserve each ordinary/carried save arm,
legacy transaction participants, lock ordering and statement/workload budgets. Not all
save arms already use runFencedCharacterSave; never add an unbudgeted prelock by claiming
otherwise. Other recipients keep independent saves; no all-party reward transaction or
stronger precommit character-reward durability is promised. No extra receipt or save queue.

The guild_deeds row retains sourceOperationId, sourceEventId, sourceAcceptedOrder, boss,
difficulty, original earned_day (utcDay) and earned_at (epoch ms, display only), a
nullable earned_by FK beside the immutable earned_by_name and earned_by_realm public
snapshot written at commit (D79; the projection reads the snapshot, so deleting the
carrier character changes nothing visible), with the unique (guild_id, deed_id)
constraint. Closed first-source rule: the durable first is the first COMMITTED source
claim for that (guild_id, deed_id); a later-committing earlier clear is dropped by ON
CONFLICT and never rewrites earned_day, earned_by, the snapshot or earned_at;
sourceAcceptedOrder is 07a's acceptance order and the sourceEventId/tick order is
captured provenance only; a clear whose only carrier never commits is not recorded,
and the guild's next committed clear is its first. ON CONFLICT is duplicate defense,
not a replacement for immutable capture. No full lifetime roster or private source
payload enters the wire; keep compact original proof with the durable outcome.

Verified state source fact: legacy GameServer.saveCharacter can return true from its
no-state/no-entity branch after recordUpTo when storage and ledger effects are empty,
without committing a character snapshot or guild source claim. A boolean success is
therefore never GuildClearSaveOutcome.committed evidence. Require the exact verified
07a applied source-claim outcome; absent that proof, retain candidate capacity and
original identity for reconciliation and publish nothing.

The paired fixture drives that literal legacy no-state/no-effects true return while
a guild candidate is pending. Assert it cannot be classified committed, release its
candidate reservation, drain its pending source prefix or publish an unlock/notice.
Only a later verified original source-claim outcome can authorize committed handoff.

Failure or ambiguous commit retains candidate, reservation and original operation
identity for reconciliation. Stale leases cannot save for a new generation, and no later
roster re-elects a carrier. Success drains only the captured prefix. Release consumed
capacity only after a KNOWN committed outcome is safely handed to bounded projection/
recovery bookkeeping via releaseCommittedGuildClearCandidate; moving into an unbounded
queue is not release. No notice appears before commit. Uncommitted memory is not
crash-durable; committed restart recovery uses the original 07a identity without replaying
character deeds. The observer installs committed nonregressing state, then emits
text-free guildDeedUnlocked and the stable notice identity. Commit-before-ACK may skip
a toast while reconnect reads committed state; no exactly-once visible toast promise.

### Required boot, rolling and overload behavior

Online buildRealmSimConfig/GameServer composition requires the admission and bridge
dependencies, following the existing required Materials Vault admission precedent.
Before disabled-to-enabled recording, inventory all current qualifying source lives and
authenticated generations, prepare all base/recipient allocations, then install readiness
and generation atomically at a synchronous host boundary. If the complete inventory
cannot fit, leave recording disabled and report a failed activation prerequisite. Never
advertise enabled while omitting existing lives. Once enabled, do not disable recording
to admit extra work or discard pending candidates. An incapable old process cannot
advertise this capability. Graceful replacement drains/preserves committed identities
within existing shutdown deadlines; restart installs committed recovery before ready.
Original process/session/source generations fence resume, retirement and late callbacks.

CLOSED overload policy (D83): admitted sessions and already live source lives
continue. Recording capacity never refuses GameServer.join, enterDungeon or a respawn.
When a fresh character extension or a new source reservation cannot fit, the session
publishes or the life activates unchanged as unreserved/not-captured, one bounded
clear-not-captured gap is recorded with an operator alert, character rewards, loot and
existing deeds are untouched, and guild credit for that clear is simply not captured.
Retain captured candidates. No realm-wide tick pause, dropped candidate, movement/room
barrier, invented participant limit, waiter queue or unbounded promise queue.

Dark realm and disabled recording (D85): the Sim reads freeholdsEnabled from the
SimConfig seam beside devCommands. While it is false, or while recording is disabled,
no producer consults ctx.guildClearAdmission and every seam in the table above behaves
exactly as before, pinned by a dark twin of the producer fixture asserting zero
admission calls and identical instance/entity state, by the flag-unset server test, and
by unchanged parity goldens.

### Measurement artifact and decisive proof

31 produces the MEASURE-BOUNDS source-reservation/admission extension: actual template
and activation census; bounded source/candidate schemas and encoded metadata bytes;
generic lives, Nythraxis lives, authenticated and prepared-unpublished generations,
pending candidates, Nythraxis-life x character-envelope multiplication; finite slot/byte
capacity, admitted save concurrency, batch/cancellation/deadline limits and headroom for
an accepted legal replacement batch. Record refusal/reserved/consumed bytes, oldest
candidate age, save/recovery failures and activation readiness metrics. Derive values
from schemas, existing recipient rules, deployment workload and measured shared save
budgets. Realm login settings, FIFO writer and BackgroundDbGate alone prove no capacity
bound. No new numerical limit is asserted here; accepted measured artifact rows gate enable.

Paired QA decisively proves generic and actual Nythraxis room credit including MORE
occupants than RAID_MAX, former raid members and late membership changes; several live
Nythraxis sources at fresh admission with exact multiplication; administrator bypass,
disabled realm cap, a failed extension that still publishes the session as unreserved
(D83) and a cancelled preparation with no published session, surviving resume and
takeover. Existing admitted players must clear after capacity exhaustion, and every
exhaustion arm proves join, entry and revival unchanged with one recorded gap. Test
original carrier order and a clear with no new character deed; distinct clears during
delayed saving, new candidate during IO, retry/failure/ambiguity, cross-carrier ordering
and competing realms with exact snapshot/prefix identity and pending remainder. The
cross-carrier expected row is literal: clear A (earlier tick, carrier X) and clear B
(later tick, carrier Y) with Y committing first leaves the row holding B's
sourceEventId, B's utcDay and Y's name snapshot, byte-identical after X's ON CONFLICT
no-op; the lost-carrier row: A's sole carrier never commits, no row exists, and B's
commit inserts B as the first.

Pin Reset All and family replacement refusal BEFORE any aura/claim/difficulty/ID/RNG
change; unclaimed developer bosses, repeated lives sharing entity ID, no-clear death,
evade/despawn, in-place respawn and pending replacement; teardown with captured work,
late callbacks and old-generation release; leave/cancellation/shutdown; initial enable
of existing canonical/dev lives and all-or-none failed readiness; capable/incapable
rolling processes. Assert exact slot/byte totals, no leaked tokens and no moved unbounded
queue across every success/refusal path. Use real disposable PostgreSQL tests for the
actual save participants, source claims, ambiguous commits and committed recovery, with
aggregate/redacted evidence. A guild holding a first clear is never hard-deleted:
disband and last-member leave take the D79 tombstone disposition at both deleting call
sites (the beginGuildBankDelete guard in server/social.ts, extended before any member
row is deleted), guild_deeds rows stay attached and the original attribution proof is
unchanged. Database, persistence, architecture and security review
runs before these decisions and again on the finished diff, then a fresh reader verifies
all fixes. These are future runtime requirements, not tests run by this docs audit.

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
This is Phase 31 (QA) of the Freeholds and Guildhalls feature: audit guild-level deeds
and first-kill trophies.

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 31 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "31 Guild-level deeds and first-kill trophies",
missing tests, dead code, determinism, three-host parity, persistence safety, and the
content obligations; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds (or the stacked wave branch state.md records). Verify `git status`
  is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("31" and its row),
  docs/freeholds/phase-31-guild-deeds-and-first-kill-trophies.md (what was promised)
- the Phase 31 diff: `git log --oneline <phase-start>..HEAD`, `git diff <phase-start>..HEAD
  --stat`, then the full diff of every touched file (the commits named in progress.md
  row 31)
- the pins the diff claims: tests/freehold_guild_deeds.test.ts, tests/sim_context.test.ts,
  tests/server/guild_deeds_db.test.ts (and its pg twin), tests/deeds_content.test.ts,
  tests/social_system.test.ts, tests/hall_boards_view.test.ts,
  tests/world_api_parity.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, and any
TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: the credit site is the one credit function and BOTH its callers (the
  generic eligible snapshot and the Nythraxis room roster) and it reads deed state
  without re-granting character deeds; exactly-once holds across a relog and across two
  guilds; the carrier is the first carrier-eligible recipient in original order; the
  cross-carrier and lost-carrier literal rows hold; the guild record uses the load,
  serialize, evict idiom and never persists whole from one session; the DDL is additive
  and keep-forever with no ON DELETE RESTRICT; disbanding a guild that holds a first
  clear takes the D79 tombstone outcome at both deleting call sites with the row
  attached, deleting the carrier character leaves the projection unchanged (pg twin),
  and the social_system guards still hold; capacity exhaustion never refuses join, entry
  or revival and a dark realm makes zero admission calls (D83, D85); the War table reads
  the committed projection, never the uncommitted candidate (D82); the hall plinths show
  the finish per difficulty; offline and headless hold an empty map without a crash;
  every extraction is move-not-rewrite (diff the moved bodies).
- TEST COVERAGE: every claimed pin has a DECISIVE assertion (literal deed ids and prop
  ids written fresh; a same-seed twin run with a work-happened anchor; the second clear
  asserts no second row; a per-dimension negative for a non-guild party's clear); no
  constant self-comparison; parity goldens regenerated in their own commit if an emit
  joined a driven path.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the token firewall (on-chain words only; Book of Deeds ids are
  allowed), the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, the freehold/ CLAUDE.md updated for the new module.
- Required reviewers: architecture-reviewer, content-obligations-reviewer, migration-safety, privacy-security-review, database-performance-reviewer, cross-platform-sync, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE for every admission producer, the ordinary-save bridge and all other changed surfaces to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 31 STEP 3 suite list plus `npx tsc --noEmit`, including the pg-armed
  twin with TEST_DATABASE_URL set.

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
- [ ] Every Phase 31 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "31 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-32-hall-and-manor-tiers.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 31 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
