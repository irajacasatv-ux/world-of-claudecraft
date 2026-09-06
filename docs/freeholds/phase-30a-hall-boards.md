# Phase 30a: Hall boards

Wave C. This implementation file and its paired QA own only the deliverables
below. The locked decisions, content numbers, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md are authoritative. Every
acceptance row applies to the paired QA; nothing is built by this planning packet.

## Deliverables (at most five):

1. Muster board opening the current authorized guild roster.
2. Calendar board opening the existing guild event calendar.
3. Pledge board opening the existing member-readable pledge projection.
4. War table showing authorized raid lockouts and the recorded-first-kill section.
5. Final board art, measured anchors, shared UI states and privacy/interaction evidence.

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
lifecycle-policy-binding artifact (accepted or still a named gate) names
lifecyclePolicyId, sourceCalendarId and resetPolicyId; serving realm, browser zone or
guessed UTC cannot rebind history.
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
This is Phase 30a of Freeholds and Guildhalls: muster, calendar, pledge and War table boards.
Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md working-style capability block;
this prompt names no model. Parallelize bounded owners, integrate and verify centrally.

Goal: implement exactly the settled deliverables and acceptance below with no guessed
decision, unsupported number, unresolved finding or unreviewed fix.

STEP 0 - PRE-FLIGHT:
- Use the packet worktree and wave C branch recorded in state.md. Run git status
  --short; if dirty, stop and ask before edits. Preserve unrelated work.
- git fetch origin --prune, then sync per state.md "Worktree, base, and merge-forward":
  origin/feature/masterwrought while PR #3872 is open, otherwise newest origin/release/**
  and remove the dependency block after merge. Run release-merge-audit after a nonempty
  merge and pnpm install --frozen-lockfile if patches/ moved. Never use main.
- Read root and applicable local CLAUDE.md in full; read state.md Gotchas (the matching
  cluster and the test-pin traps), apply ALL findings, review the review-fix round.

STEP 1 - LOAD CONTEXT THROUGH AGENTS:
Have a reader summarize this file, its QA, state.md locked decisions and content numbers,
progress.md row 30a, implementation-plan.md reviewer matrix, qa-checklist.md, ux-spec.md,
content-manifest.md, content-numbers-workbook.md and art-brief.md. Do not read planning
coordinators directly. The reader verifies current source anchors below and returns a
promised-versus-live table, exact prior module contracts and proposed own-file changes.
Record any changed tree fact in state.md before editing dependent feature files.

Existing sources: server/guild_roster_cache.ts, server/social.ts, server/social_db.ts,
src/ui/calendar_view.ts, src/ui/calendar_window.ts, the Social window's guild tab
(src/ui/social_window.ts: the muster board's target, the viewer's own current roster,
never the realm guild list behind src/ui/hud/guild_board/guild_roster_view.ts) and the
shipped pledge window discovered through src/ui/hud/guild_board/. Read current local
CLAUDE.md before source inspection. Use the existing per-character raid lockout
authority (PlayerMeta.raidLockouts in src/sim/sim.ts, projected self-only through
IWorldDungeons.raidLockouts in src/world_api/dungeons.ts; a lockout is live while its
expiry exceeds ctx.lockoutNowMs(), the isRaidLocked rule in
src/sim/instances/dungeons.ts; expiries come from the host's raidResetMs and
weeklyRaidResetMs, fed by server/raid_reset.ts nextRaidResetMs and
nextWeeklyRaidResetMs), not a generic guild standings window. No week anchor is read:
emberWeekAnchorOf lives in src/sim/professions/masterwrought_materials.ts and serves
the D84 ledger week only, never raid lockouts.
Earlier planned housing sources: src/sim/freehold/amenities.ts and permissions.ts,
src/sim/content/freehold/layouts.ts, src/render/freehold/ and src/ui/hud/housing/.
NEW planned war_table_view.ts and war_table_window.ts live under src/ui/hud/housing/;
NEW planned tests/hall_boards_view.test.ts pins the four board flows. The War table
data arrives through ONE NEW bounded read: NEW server/guild_hall_boards.ts::routes
(RouteDef GET /api/guilds/hall-boards, registered in server/http/registry.ts beside
guildRosterRoutes, current-membership check on every call) mirrored by the NEW
IWorldHousing member guildHallBoards(): Promise<GuildHallBoardsInfo | null> in
src/world_api/housing.ts, the guildRoster precedent on src/world_api/progression_xp.ts.
ClientWorld fetches the read; the offline Sim answers null (no guild authority
offline); headless keeps the no-op contract; the parity pin in
tests/world_api_parity.test.ts is updated here. First-kill authority arrives in 31,
which fills this read's firstKills arm and adds no facet member (D82).

Before implementation decisions, dispatch database-performance-reviewer with the query,
stored-shape and workload proposal when those surfaces apply; pair persistence/security.
Reuse the named settled rules. Missing measurements/signatures are owned artifact gates,
never a request to let an implementer choose a new balance value.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - EXECUTE WITH EXPLICIT OWNERSHIP:
- BOARD DATA owner: muster/calendar/pledge reuse their existing authorized data and
  window openers (muster: the Social window guild tab on the viewer's own guild;
  calendar: src/ui/calendar_window.ts; pledge: the shipped pledge window). War table
  explicitly composes guild raid lockout summaries and recorded first kills, never
  substitutes generic standings. Closed lockout shape (D56): one row per lockout key
  the live model stamps, eleven in all: heroicLockoutId(<dungeonId>) for the five
  dungeon final bosses (their normal difficulty stamps no lockout) and both the plain
  and :heroic keys for nythraxis_boss_arena (realm-daily boundary), ignivar_raid_arena
  and ignivar_inner_crucible (weekly boundary, WEEKLY_LOCKOUT_RAID_ROOMS). Each row
  counts the guild's currently online members on this realm whose lockout for that key
  is live (expiry above ctx.lockoutNowMs(), the isRaidLocked rule; no week anchor),
  plus the viewer's OWN lockout rows, the same self-only facts IWorldDungeons.raidLockouts
  already shows. Source: the live PlayerMeta.raidLockouts of sessions whose stamped
  guildMembership is this guild, read once per board open by the GET read above; never
  a character-blob read, a listCharactersAllRealms scan or an offline member. No other
  member is named, so no new per-character fact is disclosed and current membership is
  the only consent needed; the row text says online members, so the count is truthful.
  Read-only projection must recheck current membership and expose only authorized
  guild facts; wrong-guild, revoked and guest viewers (D77) receive the keyed
  members-only state, never a count. Until 31, the first-kill section uses an explicit
  keyed unavailable state, never fabricated history or a forever-empty success. 31
  connects its durable first-clear projection through this same read (D82).
- UI owner: use the same shared window, ledger/list/tab and PainterHost family as the
  Steward/collection UI. Each board has empty, loading, error, locked/nonmember,
  reconnect and ready states; first kills also has source-unavailable state. NEW keys
  with exact English (D92; tabs in title case, states in sentence case):
  hudChrome.housing.guild.lockouts "Raid Lockouts"; guild.firstKills "First Kills";
  guild.lockoutRow "{boss} ({difficulty}): {locked} of {online} online members are
  locked until the next reset."; guild.ownLockoutRow "You are locked to {boss}
  ({difficulty}) until {resetAt}."; guild.noLockouts "No online member is locked to a
  final boss right now.";
  guild.firstKillsUnavailable "First kills are not recorded yet."; guild.membersOnly
  "Only current members of this guild can read the hall boards."; guild.boardLoading
  "Loading the board...". Reuse guild.warTable (title), guild.noRecords (empty),
  common.unavailable (error) and common.reconnecting (reconnect); boss and difficulty
  names keep their canonical entity/dungeon keys; digits and dates go through
  formatNumber/formatDateTime. ux-spec carries the rows and ux-key-manifest.json
  regenerates in this phase with every cited count updated. Keyboard
  and gamepad navigate board tabs/list before Close and restore the invoking board
  focus; touch uses the shared compact/tablet sheet. Read-only guest/member boundaries
  use server authority (D77: members always, guests under D51). No board grants power
  or changes guild calendar/pledge data.
- WORLD/ART owner: measured anchors in MEETING_HALL_LAYOUT protect circulation and
  entry camera. Board objects join claim objectIds and teardown. Final wood/brass/
  parchment art, localized entity/title-map names, originality and wiki obligations
  land with scheduler prewarm. Extend the shared housing screenshot helper with the
  stable `housing-war-table` scenes ux-spec section 11 registers for this phase:
  hall-boards-roster, hall-boards-calendar, hall-boards-pledge, hall-boards-members-only,
  war-table-lockouts and war-table-first-kills-unavailable x desktop/compact/tablet (18
  variants, the 511 milestone; 31 appends war-table-first-kills-ready and
  war-table-first-kills-empty).
- SERVER owner: reuse existing cached reads and raw projections wherever available.
  The missing lockout projection is exactly the NEW bounded sibling read named in STEP 1
  (server/guild_hall_boards.ts behind the guild domain RouteDef registry, mirrored by the
  guildHallBoards facet member), with current-authority checks on every call, a
  query/index inventory (the lockout arm issues no SQL: it reads live sessions; 31's
  firstKills arm reads the committed guild_deeds projection by guild_id), batch social
  facts, cancellation and tests before use. This is permitted read-only seam work; no
  speculative write API or per-frame SQL. Record exact source symbols in state before
  adapting the consumers. Root integrates wire/schema/parity.

INVARIANTS AND CLOSED ACCEPTANCE CONTRACT:
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

Every new logic block is a small module behind existing SimContext/IWorld/PainterHost/
renderer seams. Render/UI consume IWorld only; both Sim and ClientWorld implement the
facet and headless keeps the housing exclusion/no-op contract. No DOM/Three in sim,
no wall clock or Math.random there; host calendar inputs preserve clock domains.
Re-find monolith ceilings rather than quoting stale slack; never raise one, pay thin
delegates with safe extraction and lower the ceiling. Every changed content record
carries its same-change obligations and naming originality. No generated artifact or
locale overlay is hand-edited; canonical M16 exception remains applicable. No em dash,
en dash, emoji or forbidden purchase vocabulary. No shipped stand-in counts as final art.

STEP 3 - VALIDATION AND REVIEW:
- npx tsc --noEmit, then the focused suites below (new names are planned tests owned by
  this file or its recorded predecessor; run each with bounded workers and read exits):
npx vitest run tests/hall_boards_view.test.ts tests/freehold_guildhall.test.ts
tests/freehold_command_chain_online.test.ts tests/world_api_parity.test.ts
tests/snapshots.test.ts tests/entity_display_name.test.ts
tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
tests/mobile_window_coverage.test.ts tests/architecture.test.ts
tests/monolith_budget.test.ts tests/localization_fixes.test.ts
- npm run i18n:gen, then npx vitest run tests/i18n_completeness.test.ts;
  npm run wiki:content, then npx vitest run tests/guide.test.ts for content changes.
- Run the disposable-Postgres twins ARMED with TEST_DATABASE_URL after npm run db:up
  for persisted changes. Capture the query/lock/recovery/bound evidence above.
- Run npm run asset:budget, npm run perf:tour and node scripts/pr_screenshots.mjs for
  the owned visual targets; node scripts/mobile_input_zoom_check.mjs against npm run dev.
  Re-pin parity goldens in their own reviewed commit only when sampled behavior changes.
- Required reviewers: architecture-reviewer, cross-platform-sync, privacy-security-review, migration-safety, database-performance-reviewer, server-hot-path-reviewer, content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
  Each reports COVERAGE to a file with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT.
  Database review repeats on the finished diff. Apply ALL findings including nits;
  a fresh reviewer reads all fixes. The actual diff may trigger additional reviewers.
- Run node scripts/gate_select.mjs (or deeper npm run gate) as the shared pre-merge bar
  after integration; npm run ci:changed after the last commit is additional evidence,
  never a substitute. Record exact command, exit and proof path for every acceptance.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
Only when implementation commits are authorized: Conventional Commits with scope and
body, explicit owned paths, never git add -A, no coauthor trailer, and the word "phase"
nowhere in messages. Separate behavior/content, generated fingerprints and verification
as coherent reviewed commits. Never push, open or merge a PR from this file.

STEP 5 - ACCEPTANCE:
- [ ] Every board opens the named real window/projection (muster: the Social window
  guild tab on the viewer's own guild), with wrong-guild/revoked membership negative
  tests and no hidden private fields or mutable board authority.
- [ ] War table shows the closed eleven-key online-member lockout counts (daily and
  weekly expiries by the isRaidLocked rule, no week anchor) plus the viewer's own rows
  through guildHallBoards (no SQL, no character-blob read, no other member named, a
  wrong-guild negative for lockout rows) and the truthful keyed first-kill unavailable
  state until 31, which fills the same read's firstKills arm and owns the ready/empty
  proof (D82); the parity pin for the new facet member is updated here.
- [ ] All empty/loading/error/locked/reconnect/ready states, keyboard/gamepad focus
  return, 40x40 safe-area touch and compact/tablet layouts have real-state screenshots.
- [ ] Final board art, measured circulation, content/title-map/wiki and GPU prewarm
  satisfy the shared quality bar; read paths have bounded current-authority evidence;
  every new key named in STEP 2 is in ux-spec and ux-key-manifest.json with the cited
  count updated (D92).
- [ ] All checks, shared gate and complete reviewer/fresh-fix round pass.

STEP 6 - DOC UPDATES AND MEMORY:
Record row 30a, exact files/symbols/tests/command outcomes, approved artifact rows and
review evidence in progress.md/state.md; keep built status honest. Preserve all prior
decisions and next links. Record surprising repository rules in the authorized memory.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, files, exact checks/results, review and fresh-fix verdicts, any unmet
release artifact gate, and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-30a-qa.md

STOPPING RULES:
- A missing required proof or artifact keeps this contribution incomplete; do not
  invent a value, fake a source, discard custody or weaken an acceptance row.
- Never raise a monolith ceiling, mutate a foreign owner or bypass current authority.
- Keep the branch local; never push, open or merge a PR.
```
