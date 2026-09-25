# Phase 26: open-house visiting

Wave B, the Lodge tier and the rest of the first wave. The spec is `progress.md` "26
Open-house visiting"; the decisions are `state.md` Locked decisions and the approved artifact manifests (D8: visitors are
the live claim roster, never a persisted log). This phase extends Phase 18's friends-only
visiting with the `guild` and `public` policies, visitor caps by tier (8, 12, 16, 20, and
24), the door knock and the "who is home" line, the visit prompt listing open houses of friends and
guildmates, and rate limits on public entry. Every predicate is stamped on the server at
dispatch and never trusted from the client. The friend relation is 18's D76 predicate
(the named owner character's outgoing friend list, read through whoFriended or
listFriends and rechecked at entry; the visitor's own list is never an input) and the
block rule is 18's account-level mapping; the guild relation is the server-stamped
current membership. The guild owner kind's visit policy is 28's per D77 (members always;
guild, public or private only; friends refused; the Meeting Hall cap the Cottage row
until 32); this file ships the account owner kind's guild and public policies that 28
consumes.

## Settled delivery and acceptance contract

The list is a registry-only REST read, opened on demand, never a polled self key.
KeyedCachedRead stores bounded raw projections, never authority. Each list, knock and
entry rechecks current policy, friendship, guild membership and block/ignore facts;
batch social facts and bound unknown/high-entropy lookups. Committed policy, membership,
relationship, block and deletion changes invalidate relevant projections immediately.
Private stops new admissions; current guests stay read-only until exit unless explicit
End visit or relationship/membership revocation/block safely ejects them to their
remembered gate. No TTL grants revoked access. All sessions of the owning account are
excluded from visitor counts. Authorized offline-owner visits reuse 18's bounded lazy
load and global ownership fence; foreign-realm claim saturation returns busy/retry.
Capture private/full/offline/busy, owner building, End visit and revoked-member cases;
visitors see only accepted public revisions and no owner ghost/history. Public-entry
rate, burst, key/page bounds and deadlines are owned rows in the server workload
worksheet, derived from existing lane/admission limits and measured query evidence,
approved before enable; one knock per account+plot per ten seconds remains state TUNING.

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

1. Guild/public policy and visitor-cap matrix.
2. Bounded permission-filtered on-open list.
3. Current-authority admission and offline-owner visit lifecycle.
4. Rate-limited knock and End visit/revocation behavior.
5. Shared visit/Steward UX and multi-client evidence.

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

## Arrival consumer dependency

Use the 07c account-wide normalized arrival-tier owner, not a plot-local seen set.
NEW server/freehold_arrival_db.ts::markFreeholdArrivalTierOnClient is the conflict-safe
insert inside 07a's accepted-owner-entry; only its committed insert winner gets fresh
first-tier eligibility. 08a's private result separates historical firstTierAtAdmission
from nullable freshArrivalPresentation carrying acceptedTransitionId, playWelcomeCue
and firstTierViewEligible. Confirmed dungeonEntrySeq and destination plot match before
the camera/audio consumer acts. Each new accepted arrival may welcome; snapshots,
resume and replay carry null and never restart sound/camera. Commit-before-ACK may
skip presentation, so do not claim exactly-once visible delivery. Visitors create no
account tier mark; no permanent receipt is added for routine arrivals. A new tier,
Fenbridge entry or second account session reuses this same authority and safe handback.
Pair tests cover two accounts, same-account alts/concurrent realms, returning tier,
guest, rejected entry, commit-before-ACK and reconnect. Asset/view execution is Codex.

## Knock recipient and location contract

A knock is delivered only after current visiting policy admits the caller and a current
authenticated session of the owner account is inside the TARGET opaque plot's current
claim/entry generation. Merely online, outside housing or at a different owned plot
is insufficient. Route the pid-scoped notice once to each currently eligible owner
session at that target, with no duplicate per-session delivery; an account alt there
is a valid recipient, while owner-account alts elsewhere receive nothing. Recheck
location/claim generation at dispatch so leaving or takeover cannot leak a stale knock.
This routing creates no account-wide offline notification or persisted knock history.
A knock from a blocked character (a block row on either side, mapped at the account level
as 18 defines: any owner-account character blocking the knocker's character, or the
knocker's character blocking any owner-account character) is refused at admission with
the generic denial before any frame is built; the routeEvents block/ignore predicates
cover chat and the three invite types only and are never relied on for the knock.

Paired fixtures distinguish owner offline, online in the world, inside a different
plot, inside the target plot, and two same-account alts split between target and away.
Also cover multiple current owner sessions at target, policy refusal, rate-limit refusal,
leave/takeover between admission and dispatch, and duplicate command delivery. Assert
exact pid recipients and once-per-recipient notice counts separately from the existing
account-plus-plot ten-second rate-limit assertions, on both online dispatch arms.

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
This is Phase 26 of the Freeholds and Guildhalls feature: open-house visiting (the guild
and public policies, caps by tier, the door knock and who-is-home line, the visit
prompt, rate limits on public entry).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 18 seams).

Goal: let an owner open the door to guildmates or to everyone, capped by tier, with a
knock the owner hears, a prompt that lists the open houses a player may enter, and a
public-entry rate limit, with every relation decided on the server.

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
- If state.md "Push policy" records a stacked wave B branch, work on that branch instead
  of feature/freeholds; the merge-forward rule is unchanged.
- Memory scan: MEMORY.md and entries on the monolith ratchet, the server and tests
  cluster of the gotcha catalog (hot paths, cached reads, surface inventory), test-pin
  traps, "guard exemptions must be POSITIVE", the offline IWorld aliasing entry.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "26 Open-house visiting"),
  and this file
- src/sim/freehold/visiting.ts (the friends and private policies, the cap literal, the
  read-only visitor rule, freeholdVisitors), src/sim/freehold/instance.ts (the
  owner-keyed claim, enteredBy as the live roster), src/sim/content/freehold/tiers.ts
  (where a per-tier visitor cap column would sit), src/sim/freehold/types.ts (the visit
  policy union, append-only), src/sim/guild_bank.ts (stampGuildMembership, GUILD_RANKS,
  the session-only PlayerMeta.guildMembership stamp), src/world_api/social_graph.ts
- server/freehold_wire.ts (the Phase 18 friend predicate stamped at dispatch),
  server/social.ts and server/social_db.ts (the friendships table, FriendEntry, the
  guild_members table), server/guild_roster_cache.ts (GuildRosterCache for display only), server/msg_lanes.ts
  (classifyMsgLane, consumeLaneToken) and server/ratelimit.ts (a per-account policy
  shape), server/cached_read.ts (createCachedRead) and server/discord_status_cache.ts
  (the bounded keyed LRU shape), server/freehold_routes.ts and server/http/CLAUDE.md
  (the new:endpoint scaffold), server/heavy_self.ts, tests/server/http/surface_inventory.ts
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts (the housing one-liners and the event mirrors),
  src/net/freehold_snapshot_wire.ts, tests/helpers/bare_client.ts
- src/ui/hud/housing/ (the Phase 18 visit prompt on the gate, the cap refusal toast,
  hudChrome.housing.visit.* in src/ui/i18n.catalog/hud_chrome.ts), src/ui/hud/professions/
  farming_plant_sheet_window.ts (the cold window family), src/styles/hud.mobile.css
- tests/freehold_visiting.test.ts, tests/server/freehold_wire.test.ts,
  tests/server/freehold_routes.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/server/http/surface_inventory.test.ts, tests/api_error_code_parity.test.ts,
  tests/monolith_budget.test.ts, tests/snapshots.test.ts
- server/CLAUDE.md "Hot paths"
The agent returns: the policy union and the cap literal with their pins; the friend
predicate's exact server stamping shape to copy for the guild predicate (the roster or
the session guild stamp, and which is cheaper and bust-safe); the lane and policy shape
for a public-entry rate limit; the locked registry-only on-open REST list behind a bounded keyed projection cache
with current per-request authorization, cursor pagination and batched social facts; the knock
event shape (pid-scoped to the owner, carrying the visitor name as a value); the
extraction candidates for any coordinator line.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/command_schema.test.ts,
tests/server/http/surface_inventory.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, the parity goldens):
- Agent SIM: visiting.ts gains `guild` and `public` on the policy union (append-only),
  `visitorCapFor(tier)` from a per-tier column in tiers.ts: this file fills the rows
  that exist at 26 (inn_room 8, cottage 8, lodge 12 per state.md Content numbers,
  TUNING, pinned by fresh literals; Fernando owns the gameplay targets) and pins that
  every later tier row carries its own value from the state.md column (28's
  meeting_hall takes the Cottage row per D77, Manor 16 lands with 32's row, 40 appends
  Keep 20 and Citadel 24); the relation matrix (owner, friend, guildmate, stranger)
  against the four policies for the account owner kind with text-free freeholdDenied
  reasons (`not_friend`, `not_guildmate`, `private`, `visitors_full`; the first three
  map to the existing hudChrome.housing.visit.unavailable line, the privacy-safe single
  denial 18 established, and `visitors_full` to visit.full, in freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts, D26); the `knock_freehold` command (a visitor at
  the gate emits a pid-scoped `freeholdKnock` to eligible owner-account sessions
  currently inside that target plot when the policy admits and no block row exists on
  either side, carrying the visitor's name as a value, never text), the who-is-home
  line already on freeholdVisitors extended with the policy; the friend relation is
  18's D76 read and the guild relation the server-stamped predicate the dispatch
  passes, offline no-op for guild and public (private and friends only);
  tests/freehold_visiting.test.ts extended.
- Agent SERVER: server/freehold_wire.ts stamps the guildmate predicate at dispatch (from
  authoritative current PgSocialDb.guildMembership and the committed membership hooks,
  never the display roster cache, never from the payload) beside 18's D76 friend read
  (whoFriended or listFriends), applies the block check (either side, account-level)
  at admission for entry and knock, applies the public-entry rate limit and the knock
  rate limit (one knock per account+plot per 10 seconds, keyed (accountId, plotId) in a
  bounded LRU map on the server, the maxEntries idiom of
  server/discord_status_cache.ts, consulted on both dispatch arms; the public-entry
  limit is keyed (accountId) the same way; session lanes are not the bucket, since
  MsgLaneState lives on ClientSession and server/msg_lanes.ts has no account or plot
  dimension; the literals are state.md TUNING), the `knock_freehold` case with the
  label only in game.ts (paid by an extraction), the open-houses read as a
  registry-only RouteDef appended by hand to the existing server/freehold_routes.ts
  table (the Phase 01 scaffold already owns the
  freehold domain; do not rerun it), with GET, the bearer guard freehold_routes.ts
  already uses (server/http/middleware/bearer_active_guard.ts), rateLimit, a bounded
  keyed cache per account with bounds/deadlines derived from the approved query
  worksheet; recheck current authority and bust after committed policy, membership,
  friendship (the D76 hook), block/ignore and deletion changes; a private house is
  never listed; a friends-only house is listed only to characters on the named owner
  character's outgoing friend list (D76); refuses freehold.disabled while dark; the
  surface inventory row; new
  freehold.* error leaves appended to the existing catalog block, ERROR_CODES,
  API_ERROR_KEYS, EXPECTED_CODES, and KNOWN_CODES as Phase 01 specifies;
  tests/server/freehold_wire.test.ts and tests/server/freehold_routes.test.ts extended.
- Agent UI: the visit prompt in src/ui/hud/housing/ (visit_prompt_view.ts pure core and
  visit_prompt_window.ts painter in the cold window family) gaining an Open Houses tab
  that lists open houses with owner name, tier, policy, and occupancy (states: empty,
  loading, error, ready; a refused knock, a full house and a busy entry reuse the
  existing visit.* and denied.* lines), a knock button per row, the who-is-home line
  with the policy (visit.policyConfirmed), the policy picker on the Steward panel
  gaining the existing visit.guild and visit.public radios, the mobile sheet decision,
  hud_update_drive rows, the housing-visiting registry entry extended with this file's
  variants (open-house-list-empty, open-house-list-ready, open-house-list-error,
  open-house-knock-sent, open-house-knock-wait, visit-public-full), screenshots
  (desktop, compact, tablet). Every new string is one of the NEW
  hudChrome.housing.visit.* keys below (exact English; the same namespace 18 owns, no
  second family); ux-spec section 7 carries the rows and both UX manifests regenerate in
  this phase with every cited count updated (D92). Focus order: tab, list rows, the
  row's Knock then Enter, Refresh, Close.
  NEW keys (exact English; title case for the tab and buttons, sentence case otherwise):
  hudChrome.housing.visit.openHouses = "Open Houses";
  hudChrome.housing.visit.openHousesEmpty = "No friends or guildmates have an open house
  right now."; hudChrome.housing.visit.openHousesLoading = "Finding open houses...";
  hudChrome.housing.visit.openHousesError = "Open houses could not be loaded. Try
  again."; hudChrome.housing.visit.refreshList = "Refresh";
  hudChrome.housing.visit.listEntry = "{name}'s {tier}";
  hudChrome.housing.visit.listEntryAria = "{name}'s {tier}, open to {policy}, {count} of
  {limit} visitors"; hudChrome.housing.visit.openTo = "Open to {policy}";
  hudChrome.housing.visit.knock = "Knock"; hudChrome.housing.visit.knockAria = "Knock on
  {name}'s door"; hudChrome.housing.visit.knockSent = "You knocked on {name}'s door.";
  hudChrome.housing.visit.knockWait = "Wait a moment before knocking there again.";
  hudChrome.housing.visit.knockRefused = "You cannot knock there right now.";
  hudChrome.housing.visit.knockHeard = "{name} is knocking at the door.";
  hudChrome.housing.visit.entryWait = "Too many visits in a short time. Try again
  shortly.".
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- Server authority: the friend, guildmate, and public relations are stamped on the
  server at dispatch and never read from the payload; visitors stay read-only (every
  placement, pay, upgrade, and amenity command refuses `not_owner`).
- D8: visitors are the live roster (enteredBy); no persisted visitor log; the
  open-house read is opened on demand behind a bounded cache, never polled per tick,
  and never queries Postgres from the tick.
- Determinism: no Rng; caps are content; the knock is an event, not state.
- One sim, three hosts: guild and public are offline no-ops (pinned); the RL exclusion
  pin stays green.
- Privacy: a private house is invisible in every list; a knock reveals only a name the
  owner could already see; block and ignore lists are honored at dispatch in the
  admission check for entry, list and knock (the routeEvents predicates cover chat and
  the three invite types only): a knock from a character on any owner-account
  character's block list, or whose character blocks any owner-account character, is
  refused with the generic denial and no freeholdKnock frame is built.
- Store policy: no purchase surface here; no "earn" language in purchase benefits; nothing timed or lost.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10);
  apiError.freehold.* leaves through the scaffold.
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- Working values (the caps 8, 12, 16, 20, and 24; one knock per account+plot per 10
  seconds) are state.md numbers; Fernando owns the finals.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guest books, reactions, the Showcase vote (Phase 36); wards as the entry point
  (Phase 34); the guild owner kind's visit policy (28 defines it per D77: members
  always, guild/public/private only, friends refused, the Meeting Hall cap the Cottage
  row until 32; 28 consumes this file's policy values, cap column and keys).
- Any persisted visit history or analytics table.


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_visiting.test.ts tests/freehold_content.test.ts
  tests/freehold_determinism.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/env_protocol.test.ts tests/bandwidth.test.ts
  tests/freehold_command_chain_online.test.ts tests/server/freehold_wire.test.ts
  tests/server/freehold_routes.test.ts tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/new_endpoint.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/visit_prompt_view.test.ts tests/hud_update_drive.test.ts
  tests/mobile_window_coverage.test.ts`; `npm run i18n:gen` then `npx vitest run
  tests/i18n_completeness.test.ts`; regenerate both UX manifests per state.md "UX
  verification inventories" and compare exact counts (D92); `node
  scripts/pr_screenshots.mjs` for the visit prompt targets; parity goldens regenerated
  in their own commit if an emit changed.
- Required reviewers: architecture-reviewer, privacy-security-review, server-hot-path-reviewer, cross-platform-sync, frontend-seam-reviewer, database-performance-reviewer, migration-safety, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the guild and public visit policies, tier caps, and the door knock
- feat(server): stamp visitor relations at dispatch and rate-limit public entry
- feat(server): add the open-houses read behind a bounded cached read
- feat(ui): add the visit prompt and the who-is-home line
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_visiting.test.ts covers the full relation-by-policy matrix (four
  relations times four policies) with the reason per refusal, the cap boundary per tier
  by fresh literals, the knock only when admitted and an eligible owner-account session is at that target plot, and the guild
  and public offline no-op.
- [ ] tests/server/freehold_wire.test.ts proves a payload claiming friendship or guild
  membership is ignored (the server stamp decides), and the public-entry and knock limits
  refuse the N plus first entry or knock within the window on both dispatch arms, with
  two sessions of one account sharing one knock bucket per plot and two plots holding
  separate buckets; a blocked knocker (either side, any owner-account character) is
  refused at admission on both arms and no freeholdKnock frame reaches any owner
  session.
- [ ] tests/server/freehold_routes.test.ts proves the open-houses read never lists a
  private house, lists a friends-only house to friends only, busts on a policy change,
  and refuses while dark; the surface inventory row and error codes are in.
- [ ] The visit prompt lists open houses, knocks, and enters on mouse, pad, and touch;
  every new string resolves through a visit.* key named in STEP 2 and both UX manifests
  are regenerated with the cited counts updated (D92); screenshots committed; the
  mobile sheet decision recorded.
- [ ] A flagged owner and a flagged guild or public guest in the same room are not
  hostile, through the real sim hostility arm and the client verdict
  (src/ui/pvp_hostile_core.ts): the room stays a World PvP sanctuary under every new
  policy (state.md "Non-negotiables"; tests/freehold_world_pvp_sanctuary.test.ts).
- [ ] All STEP 3 suites green; the reviewers confirm ALL findings, including nits, are resolved and freshly reviewed; the ceilings did not
  rise.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 26, notes, named unsigned release
  gates) and
  docs/freeholds/state.md (the per-phase ledger row 26: new command, events, the
  endpoint, error codes, i18n keys, the cap literals; the REST-versus-self-key decision
  and the guild predicate source).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-26-qa.md

STOPPING RULES:
- Stop and ask if the open-house list cannot be served without a per-tick or
  per-snapshot database read (the hot-path rules forbid it; the answer is a cache or a
  narrower list).
- Stop if a relation would have to be trusted from the client for any path.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
