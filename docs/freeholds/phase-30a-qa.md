# Phase 30a QA: audit Hall boards

Audits [phase-30a-hall-boards.md](phase-30a-hall-boards.md) and every one of its deliverable/acceptance rows. Verdict goes
in progress.md row "30a QA". A check not run cannot be reported as proved.

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
This is Phase 30a (QA): muster, calendar, pledge and War table boards.
Harness: Claude Code. Follow root CLAUDE.md working-style capability block;
this prompt names no model. Goal: full COVERAGE, apply every finding and review fixes.

STEP 0 - PRE-FLIGHT:
Use the packet worktree and recorded wave C branch. git status --short must be
clean before edits; otherwise stop and ask. Sync per state.md "Worktree, base, and
merge-forward" with git fetch origin --prune, merge the newest origin/release/**. Run release-merge-audit after
nonempty merge; pnpm install --frozen-lockfile if patches/ moved. Read applicable root/
local guidance. Scan MEMORY.md, packet memory, test-pin traps, apply ALL findings and
review the review-fix round.

STEP 1 - LOAD THROUGH A READER:
Have a fresh reader summarize phase-30a-hall-boards.md, this file, state.md locked decisions/content
numbers, progress.md 30a, ux-spec.md, content/art/calibration manifests and every changed
source/test in the recorded diff. Verify anchors against the actual tree. Return the
complete promised-versus-delivered table, raw-command/public-wire/private-state paths,
resource/receipt/save effects, exact test assertions, screenshot paths and every stub.
Do not reopen settled design choices or silently choose missing numeric values.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - FRESH COVERAGE REVIEW:
Parallel read-only CORRECTNESS, TEST COVERAGE and HYGIENE reviewers write full reports
to files, with BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT. Audit every implementation
acceptance row below, raw authority bypasses, exact-copy custody, failure/retry/restart,
strict codec/mixed-release preservation, current membership, screenshot states and
language rules. Tests need fresh literals, negative controls and work-happened anchors;
real PG evidence must run ARMED, never skipped. No test may merely mirror its table.

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

Required specialist roster: architecture-reviewer, cross-platform-sync, privacy-security-review, migration-safety, database-performance-reviewer, server-hot-path-reviewer, content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
For database changes, inspect both the before-decisions and final-diff database reports;
missing query/lock/queue/cancellation/size proof is a finding. Actual touched surfaces
can add required reviewers. The parent runs deterministic gates once; reviewers consume
evidence and rerun only a specifically doubted check.

STEP 3 - VALIDATION:
Run the full implementation STEP 3 command list, npx tsc --noEmit and all specifically
doubted cases. Run node scripts/gate_select.mjs (or deeper npm run gate) for the shared
pre-merge contract, not only ci:changed. Record command, exit, assertion and evidence
path. Required screenshots must exist; missing after-shots are failures.

STEP 4 - APPLY ALL FINDINGS AND REVIEW THE FIX ROUND:
Apply ALL findings including nits; add decisive regression evidence for behavior fixes.
Rerun affected proof and required gate. When commits are authorized, use scoped
Conventional Commits with a body and explicit paths, never git add -A or a coauthor
trailer, and the word "phase" nowhere in a message. A second fresh reviewer reads the
entire fix round; iterate until every finding is resolved. Never push or open/merge a PR.

STEP 5 - ACCEPTANCE:
ALL findings, including nits and uncertain findings resolved against source evidence,
must be applied and the complete fix round read by a fresh reviewer before PASS.
External signatures remain concrete release-gated artifacts, never deferred review findings.
- [ ] Every implementation box above has actual command/fixture/screenshot evidence.
- [ ] Required before/final specialist reviews and the shared gate passed.
- [ ] Every finding including nits is applied and a fresh reviewer verified all fixes.
- [ ] The paired next link, manifests, state/progress and actual final diff agree.

STEP 6 - DOC UPDATES AND MEMORY:
Record progress.md row "30a QA" verdict, found/fixed counts, commands and proof paths,
review artifacts and covered head. Update state for any verified changed fact. Keep
external signed-artifact release gates explicit without calling them unresolved design.

STEP 7 - FINAL RESPONSE FORMAT:
Report QA verdict, found/fixed counts, exact commands/results, fresh-review verdict and
the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-31-guild-deeds-and-first-kill-trophies.md

STOPPING RULES:
- FAIL names phase-30a-hall-boards.md as the next file to rerun with the complete findings.
- Never guess a numeric/source fact, weaken a pin or mark unrun proof complete.
- Never push, open or merge a PR from this QA file.
```
