# Phase 31: Guild-level deeds and first-kill trophies

Wave C, Guildhalls. The spec is `progress.md` "31 Guild-level deeds and first-kill
trophies"; the decisions are `state.md` Locked decisions and the approved artifact manifests (D16, D19, and the guild owner
kind from Phase 28). This phase ships the first guild-scoped deed record the game has ever
had (today every deed is per character), first-kill banners and raid statues earned from a
guild's first clears, and the hall trophy plinths that display them.

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
This is Phase 31 of the Freeholds and Guildhalls feature: guild-level deeds and
first-kill trophies (the guild_deeds record, first-clear banners and statues, the hall
plinths).

Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root
CLAUDE.md "Working style by model capability" block for effort and fan-out; this prompt
names no model.
ULTRACODE: not needed for this phase.

Goal: give a guild its own deed record (sim state plus a keep-forever table), credit a
guild's first clear of each qualifying final boss (the FINAL_BOSS_DUNGEONS roster at
both difficulties) exactly once, hang the earned banner or statue on the Guildhall's
plinths through the existing trophy sync, and show the committed first kills on 30a's
War table, with no rng and no text.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Read state.md Gotchas (the deeds content pins, the guild-bank escrow idiom, parity
  goldens and eventDigest, migration safety and the test-pin traps clusters).

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Have one reader agent read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "31 Guild-level deeds and
  first-kill trophies"), and this file
- src/sim/deeds.ts (grantDeed, evaluateDeedsFor, the dungeonClears credit site and the
  deedUnlocked emit), src/sim/types.ts (DeedDef), src/sim/content/deeds.ts (the
  append-only DEED_ORDER),
  src/sim/deeds_completion.ts, src/sim/instances/dungeons.ts (clearedBy on InstanceSlot)
- src/sim/guild_bank.ts (the ctx.guildBanks live map with loadGuildBank, serializeGuildBank,
  evictGuildBank; stampGuildMembership; GUILD_BANK_EDIT_RANKS; the GuildBankOpDelta escrow
  replay), src/sim/sim_context.ts (guildBanks, deedDirtyPids, deedRuntime), tests/sim_context.test.ts
- src/ui/hud/housing/war_table_view.ts and war_table_window.ts, src/world_api/housing.ts
  (guildHallBoards) and server/guild_hall_boards.ts as 30a built them
- src/sim/freehold/ as built so far: types.ts (the guild owner kind from Phase 28),
  trophy_eligibility.ts and trophies.ts (Phases 17 and 23: syncTrophyUnlocks, the plinth
  slots, the finish rule), src/sim/content/freehold/trophies.ts and tiers.ts (plinth counts
  for meeting_hall)
- server/social_db.ts (SOCIAL_SCHEMA: guilds, guild_members, guild_events, guild_banks),
  server/guild_bank_state.ts (boot load and the escrow-delta merge), server/db.ts
  (ensureSchema order, exportAccountData), the deedUnlocked observer in server/game.ts
  detectActivity (grep character_deeds), server/characters.ts (the deeds strip read)
- tests/deeds_content.test.ts, tests/social_system.test.ts (the guild-delete guards),
  tests/parity/trace.ts (META_EXCLUDE), tests/monolith_budget.test.ts
The agent returns: the ONE site where a raid or dungeon final-boss clear credits
deedStats.dungeonClears (the guild observer joins there); the guild live-map idiom to copy
verbatim; the table shape and its ensureSchema slot after SOCIAL_SCHEMA; the guild-at-clear proof requirement: current character_deeds and present membership
alone cannot prove an old guild clear; absent durable historical guild-at-clear evidence,
recording starts at deploy; the plinth count per hall tier; the trophy record shape from Phases 17 and 23;
the extraction candidates in sim.ts and game.ts that pay for the new delegate and call.
Apply the locked provenance/difficulty rules and record verified source facts; never
infer old guild membership or clear difficulty from current membership.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel fan-out, four slices, each given ONLY the reader summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent SIM: src/sim/freehold/guild_clear_contract.ts (the exact pure admission/capture types and
  narrow ctx.guildClearAdmission pins), the session-only ctx.guildClearSourceLives token
  seat, src/sim/freehold/guild_deeds.ts (GuildDeedState { earned: Map<deedId,
  { day, byCharacterId, byName, byRealm, sourceEventId, sourceAcceptedOrder,
  difficulty }>, rev }; day is utcDay per D84 and byName/byRealm are the D79 snapshot;
  ctx.guildDeeds: Map<guildId, GuildDeedState> with
  loadGuildDeeds, serializeGuildDeeds, evictGuildDeeds; the exact whole-source
  onGuildClearForDeeds(ctx, sourceToken, source: GuildClearCapturedSource) hook above
  captures once outside the original clear helper recipient loops, with the full readonly
  original recipient snapshot and both-guild carrier evidence;
  guildDeedUnlocked { guildId, deedId, sourceEventId } and the guild-wide notice publish
  only after the NEW capture-to-save bridge above commits, never directly from capture), src/sim/content/freehold/guild_deeds.ts (GuildDeedDef rows
  guild_first_<boss>_<difficulty> for the sixteen qualifying sources, append-only
  order), the guild arm in trophy_eligibility.ts (guild deed id to banner or statue prop
  id per the closed mapping in the settled contract, with the finish by difficulty) and
  in syncTrophyUnlocks for the hall record, the SimContext primitive and its
  tests/sim_context.test.ts pins, the sim.ts delegate paid by an extraction and a
  LOWERED ceiling, tests/freehold_guild_deeds.test.ts (exactly-once, two guilds, the
  sessionless-first-recipient carrier fixture, the stamp-less participant fixture, the
  dark twin with zero admission calls (D85), no rng, same seed same state).
- Agent SERVER: server/guild_deeds_db.ts (GUILD_DEEDS_SCHEMA: guild_deeds keyed
  (guild_id, deed_id), guild_id REFERENCES guilds(id) with the default action and NO ON
  DELETE RESTRICT (the refusal mechanism is the D79 tombstone guard at both deleting call
  sites, never the FK), earned_by REFERENCES characters(id) ON DELETE SET NULL beside
  NOT NULL earned_by_name and earned_by_realm snapshot columns written at commit (D79),
  earned_day (utcDay), earned_at, original boss/difficulty and
  sourceOperationId/sourceEventId/sourceAcceptedOrder, a keep-forever DDL comment;
  insert through 07a with the durable
  source claim and the exact carrier snapshot through the NEW ordinary-save bridge),
  reuse of 28a's D79 tombstone guard at both server/social.ts deleting sites
  (guild_deeds is already in its keep-forever dependency set; 31 adds the guild_deeds
  dependency pin and the pg twin cases, never a second guard), a sibling
  server/guild_deeds_observer.ts
  draining only committed outcomes into the Sim projection from detectActivity
  (one call in game.ts, paid by an extraction and a lowered ceiling),
  NEW server/freehold_guild_clear_admission.ts and server/freehold_guild_clear_bridge.ts
  with the exact admission/bridge operations and required online/07b composition above;
  bounded lazy or realm-paged
  hydration through shared admission beside the guild-bank loader, the ensureSchema slot, the exportAccountData rows the
  reader summary settled, the firstKills arm of 30a's server/guild_hall_boards.ts read
  (committed guild_deeds projection by guild_id after the current-membership check,
  never the uncommitted candidate), tests/server/guild_deeds_db.test.ts plus its
  pg-armed twin (disband a guild holding a first clear: tombstone outcome, row attached;
  delete the carrier character: projection unchanged) and the tests/social_system.test.ts
  arm for both deleting paths.
- Agent CONTENT: banner and statue trophy props in src/sim/content/freehold/trophies.ts
  (five banner emblem variants for the dungeon final bosses, three statues for the raid
  bosses, sixteen freehold_trophy_guild_first_<boss>_<difficulty> ids with finishes per
  difficulty), final approved GLBs through the image-to-glb skill executed by Codex,
  not Claude (D74; no stand-in ships from this phase; 44a only verifies remnants),
  world-entity
  names in src/ui/world_entity_i18n.ts, a Homesteader deed for hanging a first-kill
  banner, wiki regen and guide keys, the deeds_content and reliquary_content re-pins.
- Agent CLIENT (D82): the first-kill arm of src/ui/hud/housing/war_table_view.ts and
  its painter reading 30a's guildHallBoards facet member (no new facet member, no wire
  key; the parity pin is unchanged), keyed ready and empty states with exact English
  (NEW hudChrome.housing.guild.firstKillRow "{boss} ({difficulty}): first cleared by
  {character} on {day}." for each row; the empty state reuses
  hudChrome.housing.guild.noRecords; boss and difficulty names keep their canonical
  keys; the day renders through formatDateTime), the ready/empty arms in
  tests/hall_boards_view.test.ts, the ux-spec row and ux-key-manifest.json regeneration
  with the cited count updated (D92), and the war-table-first-kills-ready and
  war-table-first-kills-empty scenes appended to `housing-war-table` x
  desktop/compact/tablet (6 variants, the 526 milestone) with ux-shot-manifest.json
  regenerated.
The coordinator edits last: tests/sim_context.test.ts CALLBACK_KEYS and the fake host,
tests/monolith_budget.test.ts, parity goldens if the clear path now emits (their own
commit with UPDATE_PARITY=1). Every agent writes any report longer than a screen to a
file and replies with the path plus a short summary.

INVARIANTS THIS PHASE MUST KEEP:
- Determinism: the guild record draws no Rng; each captured clear preserves its tick
  order; cross-realm first-source claims use the committed authority order above; no
  wall clock in src/sim/ (earned_day is ctx.utcDay per D84).
- One sim, three hosts: offline and headless hold an empty guild deeds map and never
  crash on a clear; the RL exclusion pin stays green.
- Server authority: the credit is decided in the sim; the client mirrors the event.
- Persistence gates: additive idempotent DDL, keep-forever stated at the DDL, the
  exportAccountData rows, the D79 tombstone disposition at both deleting call sites
  (tests/social_system.test.ts guards).
- Housing capacity never gates gameplay (D83) and a dark realm consults no admission
  owner (D85).
- Never sell power, trophies are earned and never sold, nothing destroyed.
- Token firewall at the state.md scope (on-chain vocabulary only: wallet, token, $WOC,
  mint, holder, marketplace, on-chain, Solana); Book of Deeds ids are game content, so
  guild_deeds.ts and its deed ids sit inside the allowed set. The i18n policy in
  docs/freeholds/implementation-plan.md (text-free events resolved to hudChrome.housing.*
  keys); vocabulary fixed; "phase" in no code, comment, commit, or PR text; sim.ts and
  game.ts ceilings LOWER after this phase.

Out of scope (do NOT do in this phase):
- Tiers above Meeting Hall and build projects (Phase 32); Showcase votes (Phase 36).
- Fabricated retro first kills: without trustworthy guild-at-clear per-boss/difficulty history, the
  record starts at deploy and the doc says so.
- Any change to character deed semantics, renown, or titles.


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_guild_deeds.test.ts
  tests/deeds_content.test.ts tests/reliquary_content.test.ts tests/item_icons.test.ts
  tests/item_art_consistency.test.ts tests/localization_fixes.test.ts
  tests/server/guild_deeds_db.test.ts tests/server/main_retention_wiring.test.ts
  tests/social_system.test.ts tests/hall_boards_view.test.ts
  tests/world_api_parity.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; `npm run wiki:content` then `npx vitest run
  tests/guide.test.ts`; the pg-armed twin with TEST_DATABASE_URL set after `npm run db:up`;
  node scripts/pr_screenshots.mjs for the War table ready/empty targets; the parity
  goldens if regenerated (the dark twin must leave them unchanged).
- Required reviewers: architecture-reviewer, content-obligations-reviewer, migration-safety, privacy-security-review, database-performance-reviewer, cross-platform-sync, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE for every admission producer, the ordinary-save bridge and all other changed surfaces to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
5 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add guild-level deeds behind SimContext with first-clear credit
- feat(server): persist original guild-clear proof before publishing unlocks
- feat(content): add first-kill banner and raid statue trophies for the hall plinths
- feat(ui): show recorded first kills on the War table
- test(sim): pin first-kill exactly-once and the hall trophy sync
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] guild_deeds DDL is additive, idempotent, keep-forever at the DDL with no ON DELETE
  RESTRICT and the D79 snapshot columns; the pg twin proves the tombstone outcome for a
  disbanding guild holding a first clear and an unchanged projection after the carrier
  character is deleted; migration-safety reports all findings including nits resolved
  after fresh fix review.
- [ ] A guild party's clear of a qualifying final boss credits the guild deed exactly
  once (two clears, one row; a second guild credits its own), pinned with the literal
  sixteen-id set and the cross-carrier and lost-carrier literal rows, and a same-seed
  twin run.
- [ ] Every earned guild deed hangs its banner (dungeon final boss) or statue (raid
  boss) on the hall plinths through syncTrophyUnlocks with the difficulty finish; costs
  no decor points; never tradable.
- [ ] Capacity exhaustion never refuses join, entry or revival (D83) and a dark realm
  makes zero admission calls (D85), both pinned with unchanged parity goldens.
- [ ] The War table first-kill section shows the committed projection through 30a's
  guildHallBoards read with keyed ready and empty states (the war-table-first-kills-ready
  and war-table-first-kills-empty scenes) on desktop, compact and tablet screenshots;
  the world_api parity pin is unchanged (D82).
- [ ] Offline and headless: empty map, no crash, env_protocol pin unchanged.
- [ ] Every new trophy prop id has committed final art from docs/freeholds/art-brief.md and its approved reference manifest;
  content-obligations-reviewer reports all findings including nits resolved after fresh fix review.
- [ ] All STEP 3 suites green; every reviewer reports all findings including nits resolved after fresh fix review.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 31, notes, named unsigned gates) and
  docs/freeholds/state.md (ledger row 31: new files, SimEvents, the table, the primitive;
  the deploy-start (no retro) and finish rules).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-31-qa.md

STOPPING RULES:
- Stop and ask if the only honest first-kill credit site would change character deed
  behavior (the observer must read, never re-grant).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
