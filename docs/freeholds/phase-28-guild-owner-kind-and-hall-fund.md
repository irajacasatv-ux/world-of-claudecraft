# Phase 28: the guild owner kind, the Meeting Hall, the Hall Fund

Wave C, Guildhalls. The spec is `progress.md` "28 The guild owner kind, the Meeting Hall,
the Hall Fund" (use the locked decisions and recorded tree facts before implementing); the decisions are `state.md` (D15, D16: one record
type keyed by owner key) and `brainstorm.md` (ruling 1: one system, two owner kinds).
This phase ships owner kind `guild` on the same record type (`guildhall:guild:<id>`),
the `meeting_hall` tier and layout, rank permissions (leaders/officers manage layout, members manage only their own assigned
trophy plinths and otherwise view), and the Hall Fund escrow (materials plus a Claudium balance with a member-readable
ledger) persisted beside `guild_banks` with the escrow-delta merge idiom. It is a
persistence phase.

## Settled delivery and acceptance contract

Use the sibling guild_freeholds table and separate ghall mirror, with opaque public
plot ID and server-only guild owner key. The global fence permits one authoritative
claim across realms. Guild leader/officer roles manage shared layout, pay and approve
projects; ordinary members may display/remove only their own trophies on assigned
plinths and use authorized amenities. Never convert a personal trophy into transferable
guild property. Departure detaches that member's displays safely while preserving
their account unlock and original provenance; membership revocation immediately ends
access. Guild trophies remain separate shared guild records. Every rank/command and
assigned/nonassigned/foreign plinth case gets a raw-command negative test.

The economy service owns pooled currency and its debit/credit ledger; the sim mirrors
an absolute confirmed balance plus monotonic service revision, separate from material
revision. Old responses cannot overwrite new. Hall materials/gold, contributor cap and
donor audit participate in one atomic transfer. Fund slot/log/byte limits derive from
the legal approved bill/cap/content manifest and are pinned before enable. Lazy guild
hydration reuses existing admission/single-flight bounds, never whole-table boot load.

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

1. Stable guild plot/claim ownership identity.
2. Rank, amenity and member-owned assigned trophy-plinth permissions.
3. Meeting Hall content/layout and final art.
4. Service-currency mirror and material/gold Hall Fund state.
5. Atomic bounded persistence/lazy hydration and cross-host evidence.

## Shared authority and persistence dependency

This file extends the single producer from 07a, not a second account or guild payment
system: NEW server/freehold_mutation.ts::commitFreeholdMutation and
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation own
durable intent, applied identities, global claim fencing and atomic effects. Phase15
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

## Guild lifecycle follow-on boundary

The dedicated phase-28a-guild-lifecycle-and-membership.md and its QA extend 07b with
guild_freehold_lifecycle and guild_freehold_lifecycle_history, committed membership
incarnation, original guild binding and installCommittedLifecycleProjection. This file
owns no sixth lifecycle deliverable. Its guild_freeholds parent reference uses RESTRICT
and raw disband is refused while live hall/fund dependencies remain; 28a adds the same
safe-disposition protection for lifecycle/checkpoint/credit/recovery dependencies before
29 enables upkeep. No account history is rekeyed or copied, and no new receipt owner
is created. The 07a and 13a shared contracts above remain prerequisites for all consumers.

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
This is Phase 28 of the Freeholds and Guildhalls feature: the guild owner kind, the
Meeting Hall, and the Hall Fund (the guildhall record and claim key, rank permissions,
the Meeting Hall tier and layout, the Hall Fund escrow and its persistence).

Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices over the Phase 05, 07, and 12 seams).

Goal: make a guild an owner of the one freehold record type, keyed on the guild id,
claimed by any member with leader/officer layout management and member-owned assigned trophy plinths, with a Meeting Hall tier
and a Hall Fund escrow that members can read and the server persists safely beside the
guild bank.

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
- Memory scan: MEMORY.md and entries on the monolith ratchet, the Postgres cluster of the
  gotcha catalog, world_api parity pins, sim_context callback pins, test-pin traps, the
  guild bank escrow-delta entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "28 The guild owner kind,
  the Meeting Hall, the Hall Fund"), and this file
- src/sim/freehold/ (types.ts, state.ts, instance.ts, placement.ts, ledger.ts,
  amenities.ts, visiting.ts, index.ts, CLAUDE.md), src/sim/content/freehold/tiers.ts,
  dungeons.ts, and layouts.ts (COTTAGE_LAYOUT and LODGE_LAYOUT, D23)
- src/sim/guild_bank.ts (GuildBankState, loadGuildBank, serializeGuildBank,
  evictGuildBank, stampGuildMembership, GUILD_RANKS, GuildRank, GUILD_BANK_EDIT_RANKS,
  requireOfficerBook, the GuildBankOpDelta log), src/sim/sim_context.ts (ctx.guildBanks
  and the passthrough getter), tests/sim_context.test.ts, src/world_api/social_graph.ts
- server/guild_bank_state.ts (loadGuildBanksIntoSim, mergeGuildBankRow,
  collectGuildBankDeltas, GUILD_BANK_MERGED_MAX_BYTES), server/guild_bank_lazy_loader.ts,
  server/social_db.ts (the guilds, guild_members, and guild bank tables), server/freehold_db.ts
  (FREEHOLD_SCHEMA, account_freeholds), server/db.ts (ensureSchema order, exportAccountData),
  server/freehold_wire.ts, server/ws_auth.ts (the fresh-join account facts read)
- src/world_api/housing.ts, src/world_api.ts, tests/world_api_parity.test.ts,
  src/net/online.ts, src/net/freehold_snapshot_wire.ts, tests/snapshots.test.ts
  (ALL_DELTA_KEYS), tests/parity/trace.ts
- tests/freehold_instance.test.ts (the Phase 05 suite under its real name),
  tests/server/freehold_db.test.ts, tests/guild_bank*.test.ts, tests/monolith_budget.test.ts
The agent returns, and the session records in state.md BEFORE implementing: the locked sibling `guild_freeholds` table keyed by stable opaque plot ID
with a unique indexed guild_id REFERENCES guilds(id) ON DELETE RESTRICT, reusing 07
record fields and global ownership fencing; the separate `ghall` self key because
an account may own both a personal freehold and guild membership; the Hall Fund shape (`HallFundState`: material slots as InvSlot rows, a
service-owned pooled Claudium balance mirrored as an absolute versioned result, a bounded member-readable
ledger) and its ctx primitive `ctx.hallFunds` beside ctx.guildBanks; how the guild id
reaches the claim key from the session-only guildMembership stamp; the escrow-delta
merge shape to copy for the fund; the export obligation for donor rows; the extraction
candidates for every coordinator line.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files; the coordinator edits the shared pin files last (src/world_api.ts,
tests/world_api_parity.test.ts, tests/sim_context.test.ts, tests/snapshots.test.ts,
tests/monolith_budget.test.ts, the parity goldens):
- Agent SIM: `ownerKind: 'account' | 'guild'` on FreeholdState, `freeholdKeyFor` gaining
  the guild arm (`guildhall:guild:<id>` from meta.guildMembership, refused `no_guild`
  without a stamp), the `guildhall_meeting_hall` DungeonDef at the verified next free appended index with claimKey
  'owner', src/sim/freehold/permissions.ts (`canEditGuildhall(meta)` over the
  GUILD_BANK_EDIT_RANKS family: leaders/officers manage layout, pay and approve upgrades; members manage only their
  own assigned trophy plinths, read the fund and use authorized built amenities;
  every other layout/fund mutation refuses `not_officer`;
  both reasons appended to freeholdDeniedLineKey in src/ui/hud/housing/housing_view.ts,
  D26), src/sim/freehold/hall_fund.ts (HallFundState, loadHallFund, serializeHallFund,
  evictHallFund, hallFundInfoFor readable by every member, material/gold mutations recorded with durable operation IDs for atomic transfer replay,
  while service currency is an absolute versioned balance mirror with a separate revision; no donation command yet), the
  ctx.hallFunds primitive with its sim_context.test.ts fake-host and live-view pins, the
  freehold/ CLAUDE.md rows; tests/freehold_guildhall.test.ts and
  tests/freehold_hall_fund.test.ts.
- Agent CONTENT-LAYOUT: the `meeting_hall` row in tiers.ts (rooms 1, decor budget 60,
  plinths 4, amenity slots 1, the 2x decay flag for Phase 29; deep-frozen),
  MEETING_HALL_LAYOUT in src/sim/content/freehold/layouts.ts (D23) with the six interior
  touch points and the render variant under src/render/freehold/, the feast-hall table and board anchors reserved as decor keys
  for Phase 30, the world-entity name, `npm run wiki:content` plus a guide.* key, a
  Homesteader-family deed row appended at the END of deeds.ts only if the contract
  requires one (record the decision).
- Agent SERVER: server/freehold_db.ts gains `guild_freeholds` (additive, idempotent,
  keep-forever comment, the rev upsert) and `guild_hall_funds (guild_id PK, data JSONB
  CHECK object, updated_at)` merged with the guild-bank escrow-delta idiom
  (session-owned unflushed deltas, size-bounded, written with inventory/cap/audit participants inside the 07a bounded atomic
  transfer transaction, never independently of its resource deduction), a lazy load at first member claim beside the guild bank loader, the
  `ghall` self key emitted for members inside the hall (strict decode sibling), the
  guild id resolved from the session for every guildhall command, exportAccountData rows
  for donor-linked ledger entries, tests/server/freehold_db.test.ts extended with the
  fake pool and the pg-armed twin (round trip, direct guild-delete refusal while the hall exists, explicit safe disposition before cleanup, a pre-feature guild
  loads null, a stale rev refused).
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- One system: no second module; the guild record is the same FreeholdState with an
  owner kind; guests enter under the guild key as party members join a claim (D15).
- Determinism: no Rng; no wall clock in src/sim/; the guild id enters as a host stamp.
- Server authority: rank and membership come from the server-stamped guildMembership,
  never the payload; a shared book is never persisted whole by one session (deltas only).
- Persistence: additive idempotent DDL, JSONB back-compat, an index for every new
  predicate, keep-forever stated for guild_freeholds and guild_hall_funds, export rows for account-linked
  data, a save/load round trip with the fake pool and the pg-armed twin.
- Token firewall: the Hall Fund's Claudium balance is a number the server mirrors after
  the economy service confirms a donation; the sim never prices, burns, or splits;
  no on-chain vocabulary in src/sim/ (wallet, token, $WOC, mint, holder, marketplace,
  on-chain, Solana, the on-chain Freehold Charter deed), the state.md scope; the Book of
  Deeds is game content, never firewall vocabulary.
- Never sell power; nothing destroyed; the hall's door always opens for members.
- i18n: the policy in docs/freeholds/implementation-plan.md; text-free events (D10).
- Monolith: src/sim/sim.ts, server/game.ts, and src/net/online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; a
  delegate, case label, or mirror line pays with an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Guild lifecycle/history and durable membership incarnations (Phase 28a).
- Purchase, donations, the donation cap, 2x decay, the contribution log (Phase 29); the
  guild bank chest, feast hall, boards, hall-shared stations (Phase 30); guild deeds
  (Phase 31); Great Hall and above (Phase 32).


STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts
  tests/freehold_guildhall.test.ts tests/freehold_hall_fund.test.ts
  tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/command_schema.test.ts
  tests/command_facets.test.ts tests/snapshots.test.ts tests/env_protocol.test.ts
  tests/bandwidth.test.ts tests/freehold_command_chain_online.test.ts
  tests/server/freehold_db.test.ts tests/server/freehold_wire.test.ts
  tests/server/main_retention_wiring.test.ts tests/deeds_content.test.ts
  tests/renderer_compile_gate.test.ts tests/dungeons.test.ts
  tests/localization_fixes.test.ts` plus the guild bank suites unchanged; `npm run
  wiki:content` then `npx vitest run tests/guide.test.ts`; the pg-armed twin after
  `npm run db:up`; goldens regenerated in their own commit if an emit changed.
- Required reviewers: migration-safety, privacy-security-review, architecture-reviewer, cross-platform-sync, database-performance-reviewer, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

Shared pre-merge bar: run node scripts/gate_select.mjs (or deeper npm run gate);
ci:changed is additional evidence, never its substitute. Record the exact exit.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): add the guild owner kind, rank permissions, and the Hall Fund escrow
- feat(content): add the Meeting Hall tier and layout
- feat(server): persist guild freeholds and the Hall Fund beside the guild bank
- test(server): round-trip the guild tables against the fake pool and Postgres
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] tests/freehold_guildhall.test.ts proves: two members of one guild share one claim
  and party membership is ignored; a non-member is refused `no_guild`; a member views, uses authorized amenities and manages only their own assigned
  trophy plinth; other layout/fund edits refuse `not_officer`; an officer and the leader edit;
  the same seed gives the same hall on both hosts.
- [ ] tests/freehold_hall_fund.test.ts proves load, serialize, and evict are idempotent,
  identified material/gold deltas replay once and old service balance revisions cannot overwrite newer ones, and the ledger is bounded.
- [ ] tests/server/freehold_db.test.ts pins the guild_freeholds and guild_hall_funds DDL text, round-trips both
  against the fake pool and Postgres, refuses raw guild deletion while hall/fund dependencies remain,
  permits cleanup only after explicit safe disposition, loads null for a
  pre-feature guild, and refuses a stale rev.
- [ ] The Meeting Hall renders on proximity; the ghall key decodes strictly; the RL
  exclusion pin stays green.
- [ ] All STEP 3 suites green; the reviewers confirm ALL findings, including nits, are resolved and freshly reviewed; the ceilings did not
  rise; state.md records the verified implementation facts and accepted artifact rows.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 28, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 28: new files, members, the self
  key, tables, i18n keys; the tier table's Meeting Hall row; the verified implementation facts beside the approved decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, tracked artifact/release
gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-28-qa.md

STOPPING RULES:
- Service pooling is locked in the service-contract draft. Missing signed acceptance
  is a release gate; the fake service must implement that contract without game pricing.
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
