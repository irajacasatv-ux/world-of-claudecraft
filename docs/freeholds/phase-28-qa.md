# Phase 28 QA: audit the guild owner kind, the Meeting Hall, and the Hall Fund

**Premise moved at the 2026-09-26 release sync (G1, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** officer-keyed guild authority in this document (layout, pay, upgrades, the fund, the store row, visit policy, succession) is a false premise since the release's custom guild ranks: "officer" is now a stamped bank tier, and guild ranks are a ladder with per-rank permissions. A ruling on the hall permission is owed before phase 28 builds, and every check here keys on the permission it names, never the Officer title.

Audits `phase-28-guild-owner-kind-and-hall-fund.md`. Verdict goes in `progress.md` (row
"28 QA"). The next implementation phase never starts before this file has run.

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
The fund's end of life is defined (D78): 29 adds an officer-plus withdraw-to-guild-bank
verb for fund materials and gold on the 07a rail, and the service contract's Hall Fund
end-of-life row refunds the pooled balance pro rata to donor accounts by original
receipt as separately identified immutable refund operations the game only requests.
Guild-owned plots follow the D77 visiting policy: current members are admitted always;
visit_policy for the guild owner kind is set by the leader or an officer and accepts
only guild, public or private (friends is refused for that owner kind); public admission
is capped by the tier column, the Meeting Hall cap being the Cottage row until 32 sets
its own; non-members enter as read-only guests under the D51 ejection rules.

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

## Guild lifecycle follow-on boundary

The dedicated phase-28a-guild-lifecycle-and-membership.md and its QA extend 07b with
guild_freehold_lifecycle and guild_freehold_lifecycle_history, committed membership
incarnation, original guild binding and installCommittedLifecycleProjection. This file
owns no sixth lifecycle deliverable. Its guild_freeholds parent reference uses RESTRICT
as the backstop only; the refusal path is the existing beginGuildBankDelete guard in
server/social.ts extended at BOTH guild-deleting call sites (guildLeave last-member-out
before removeGuildMember in finishGuildLeave, and guildDisband) to refuse while
guild_freeholds, guild_hall_funds, lifecycle or recovery rows remain (S5, D79). A guild
that holds any keep-forever housing row is never hard-deleted: disband is 28a's
tombstone disposition (D79). The explicit safe disposition means fund materials and gold
at zero through 29's officer-plus withdraw-to-guild-bank verb and the pooled service
balance settled or refund-requested through the service contract's Hall Fund end-of-life
row (D78). 28a adds the same protection for lifecycle/checkpoint/credit/recovery
dependencies before 29 enables upkeep. No account history is rekeyed or copied, and no
new receipt owner is created. The 07a and 13a shared contracts above remain
prerequisites for all consumers.

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
This is Phase 28 (QA) of the Freeholds and Guildhalls feature: audit the guild owner
kind, the Meeting Hall, and the Hall Fund (the guildhall record and claim, rank
permissions, the tier and layout, the escrow and its persistence).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 28 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "28 The guild owner kind, the Meeting Hall,
the Hall Fund", missing tests, dead code, determinism, three-host parity, server
authority over rank and membership, persistence back-compat and the escrow-delta
merge, and the token firewall; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave C. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the Postgres cluster of the gotcha catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the STEP 1 decisions Phase 28 recorded),
  docs/freeholds/progress.md ("28 The guild owner kind, the Meeting Hall, the Hall Fund"
  and the row), docs/freeholds/phase-28-guild-owner-kind-and-hall-fund.md (what was
  promised)
- the Phase 28 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 28)
- the pins the diff claims: tests/freehold_guildhall.test.ts,
  tests/freehold_hall_fund.test.ts, tests/server/freehold_db.test.ts,
  tests/sim_context.test.ts, tests/world_api_parity.test.ts, tests/snapshots.test.ts,
  tests/monolith_budget.test.ts, the guild bank suites
The agent returns: the promised-versus-delivered table per deliverable, the DDL text
added, every read of guildMembership and where it is stamped, every write to the Hall
Fund and its delta record, the export rows added, every test added with what it
asserts, and any TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the guild claim
  key ignores party and character; a kicked member loses edit and entry on the next
  stamp; every shared-layout/fund edit refuses a plain member on BOTH dispatch arms,
  while only that member's assigned personal trophy plinth remains editable; the D77
  guild-plot policy matrix holds on both hosts (members always; guild, public or private
  only; friends refused; public capped at the Cottage row) and only a leader or officer
  sets it; disband refuses at BOTH guild-deleting call sites with the member row intact
  after a refused /gquit, and a stocked fund cannot disband until 29's withdraw verb
  empties materials and gold and the service balance is settled or refund-requested
  (D78); the hall record stores no guild name; the fund merge never persists a whole
  book from one session and bounds its size; a stale rev is refused, never merged; the
  guild bank suites are unchanged and green; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (rank cases per command, not
  one representative; the DDL pinned as literal text; disband refusal for each live
  hall/fund dependency at BOTH guild-deleting call sites (the /gquit last-member path
  before removeGuildMember, and guildDisband), the stocked-fund arm (D78), the D77
  policy matrix with every cell and the friends refusal, the hall edit set equal to the
  exported GUILD_BANK_EDIT_RANKS (S4), the tombstone disposition permitted only after
  the explicit safe disposition (D79) and the pre-feature case against the pg twin
  ARMED; the live-view pin mutates through the Sim and reads through ctx); orphaned
  tests; a determinism case with a work-happened anchor.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant and the token firewall at the state.md scope (no on-chain vocabulary in
  src/sim/ per the state.md list; the Book of Deeds is game content), the word "phase" in any code, comment, or commit message, em dashes or
  emojis, generated files hand-edited, a table without a keep-forever comment or a
  retention registration, the local CLAUDE.md rows accurate, the approved decisions and verified implementation facts
  recorded in state.md.
- Required reviewers: migration-safety, privacy-security-review, architecture-reviewer, cross-platform-sync, database-performance-reviewer, server-hot-path-reviewer, render-performance-reviewer, frontend-seam-reviewer, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 28 STEP 3 suite list plus `npx tsc --noEmit` and the pg-armed twin.

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
- [ ] Every Phase 28 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "28 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-28a-guild-lifecycle-and-membership.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 28 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
