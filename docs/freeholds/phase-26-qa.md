# Phase 26 QA: audit open-house visiting

Audits `phase-26-open-house-visiting.md`. Verdict goes in `progress.md` (row "26 QA").
The next implementation phase never starts before this file has run.

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
This is Phase 26 (QA) of the Freeholds and Guildhalls feature: audit open-house
visiting (the guild and public policies, caps by tier, the knock, the visit prompt,
the open-houses read, the public-entry rate limit).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 26 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "26 Open-house visiting", missing tests, dead
code, server authority over every relation, privacy of private houses, hot-path
discipline of the list read and the knock fan-out, and the offline no-op; fix what
the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the server and tests cluster of the gotcha catalog.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("26 Open-house visiting" and
  the row), docs/freeholds/phase-26-open-house-visiting.md (what was promised)
- the Phase 26 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 26)
- the pins the diff claims: tests/freehold_visiting.test.ts,
  tests/server/freehold_wire.test.ts, tests/server/freehold_routes.test.ts,
  tests/freehold_command_chain_online.test.ts, tests/server/http/surface_inventory.test.ts,
  tests/api_error_code_parity.test.ts, tests/visit_prompt_view.test.ts,
  tests/monolith_budget.test.ts, tests/snapshots.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the relation
matrix as tested (every cell), every server read the list route performs and its
cache and bust wiring, where the guildmate predicate is sourced and that the friend
relation is 18's D76 read, the knock and public-entry bucket keys ((accountId, plotId)
and (accountId)) with their LRU bounds, where the block check sits in the admission
path, every event added, every new visit.* key against the regenerated manifest, and
any TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; every relation
  is stamped on the server (a crafted payload claiming friend or guildmate is refused on
  BOTH dispatch arms); the guildmate predicate rechecks current authority immediately after a kick,
  invalidates presentation caches and ejects a revoked visitor without a TTL grace; a private house never appears in
  any list or knock path; a blocked knocker (either side, any owner-account character)
  is refused at admission on both arms and no freeholdKnock frame reaches any owner
  session; two sessions of one account share one knock bucket per plot and two plots
  hold separate buckets; the cap boundary per tier holds with the owner excluded from
  the count as Phase 18 pinned; the knock reaches each eligible owner-account session at that target plot once, never an online-away or different-plot alt;
  guild and public are offline no-ops; the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (all sixteen relation-policy
  cells, not a sample; the rate-limit test counts the refused entry, not the elapsed
  time, with the two-sessions-one-account and two-plot arms; the blocked-knocker test
  asserts zero freeholdKnock frames; the list test asserts the absence of the private
  house by id; the bust test changes the policy and re-reads; the offline no-op pin
  asserts the refusal reason); orphaned tests; the chain test carries the knock and the
  policy fields; every visit.* key named in 26 STEP 2 exists in the regenerated
  manifest with the cited counts updated and no string bypasses t().
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a persisted visitor log, a database read
  reachable from the tick, the surface inventory row present, the local CLAUDE.md rows
  accurate.
- Required reviewers: architecture-reviewer, privacy-security-review, server-hot-path-reviewer, cross-platform-sync, frontend-seam-reviewer, database-performance-reviewer, migration-safety, content-obligations-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 26 STEP 3 suite list plus `npx tsc --noEmit`.

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
- [ ] Every Phase 26 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "26 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-27-wave-b-close.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 26 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
