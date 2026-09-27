# Phase 32 QA: audit Great Hall, Manor, Bastion tiers and build projects

**Premise moved at the 2026-09-26 release sync (G1, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** officer-keyed guild authority in this document (layout, pay, upgrades, the fund, the store row, visit policy, succession) is a false premise since the release's custom guild ranks: "officer" is now a stamped bank tier, and guild ranks are a ladder with per-rank permissions. A ruling on the hall permission is owed before phase 28 builds, and every check here keys on the permission it names, never the Officer title.

Audits [phase-32-hall-and-manor-tiers.md](phase-32-hall-and-manor-tiers.md) and every one of its deliverable/acceptance rows. Verdict goes
in progress.md row "32 QA". A check not run cannot be reported as proved.

## Deliverables (at most five):

1. Three tier records and measured layouts as one ladder batch.
2. Exact approved project bills plus versioned service fee rows.
3. Atomic shared project/contribution/completion and exact-copy carry-over.
4. Final three-interior dressing with the shared project progress UI.
5. Durable server/persistence, cross-host, money-gate and custody evidence.

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

## Literal D9 and original-operation money authority

The game server and Sim remain ignorant of physical distribution. The future economy
service owns eligibility verification and opaque authorization bound to account,
purpose/SKU, policy, quote and operation, with issuer/verifier conformance in the
service artifact (accepted or still a named gate). A first-party web checkout session
alone is insufficient.
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
This is Phase 32 (QA): Great Hall, Manor and Bastion upgrade projects.
Harness: Claude Code. Follow root CLAUDE.md working-style capability block;
this prompt names no model. Goal: full COVERAGE, apply every finding and review fixes.

STEP 0 - PRE-FLIGHT: Use the packet worktree and recorded wave C branch. git status
--short must be clean before edits; otherwise stop and ask. Sync per state.md "Worktree,
base, and merge-forward" with git fetch origin --prune, merge the newest
origin/release/**. Run release-merge-audit after nonempty merge; pnpm install
--frozen-lockfile if patches/ moved. Read applicable root/ local guidance. Scan MEMORY.md,
packet memory, test-pin traps, apply ALL findings and review the review-fix round.

STEP 1 - LOAD THROUGH A READER:
Have a fresh reader summarize phase-32-hall-and-manor-tiers.md, this file, state.md locked decisions/content
numbers, progress.md 32, ux-spec.md, content/art/calibration manifests and every changed
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

- [ ] Fresh literal tier pins and exact approved manifests cover all three tiers;
  rendered walls, floors and colliders share measured content and protected circulation;
  the manor visitor cap 16 is pinned as a literal in tests/freehold_content.test.ts and
  the hall-tier cap gate is recorded (D77).
- [ ] Bill-first and fee-first complete immediately when both are confirmed, with no
  new elapsed-time requirement; concurrent members contribute through the capped fund,
  officers approve, all contributed value and exact copies survive refusal/restart; a
  two-officer overflow case in tests/freehold_build_project.test.ts asserts copy custody
  unchanged (the placer's bags, never the completing officer's) and the keyed refusal;
  the Manor rail accepts no rank or fund input.
- [ ] PG races/crash/lease/CAS and durable receipt replay prove one completion and
  atomic resource/overflow custody; both dispatch arms enforce every money/surface gate.
- [ ] Required project/interior screenshots show pending/refused/overflow/member/officer
  states and LOW/reduced-motion behavior; global light budget and prewarm/perf evidence pass.
- [ ] Content, i18n/wiki, all tests, shared gate and complete fresh review pass; no
  reward/vendor/vault work is hidden here beyond the explicit 32a dependency.

The three money gates apply to every SKU, handler and purchase view in this file:
(1) written counsel acceptance before production enable or housing-bearing store
submission; (2) FREEHOLDS_ENABLED defaults off and refuses both dispatch arms and
removes catalog rows while dark; (3) the seven-distribution capability map permits
purchase only on browser web and website-distributed desktop. Seeker is use-only.
Published Terms and accepted economy-service contract/catalog are additional release
gates. Website management is an independent approved capability, default off on denied
storefronts. Native, Steam and Epic receive no purchase submodel, hidden DOM, fetched
catalog, handler, accessibility text or on-chain marketing. Purchase copy promises
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
Record progress.md row "32 QA" verdict, found/fixed counts, commands and proof paths,
review artifacts and covered head. Update state for any verified changed fact. Keep
external signed-artifact release gates explicit without calling them unresolved design.

STEP 7 - FINAL RESPONSE FORMAT:
Report QA verdict, found/fixed counts, exact commands/results, fresh-review verdict and
the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-32a-project-rewards-and-vault.md

STOPPING RULES:
- FAIL names phase-32-hall-and-manor-tiers.md as the next file to rerun with the complete findings.
- Never guess a numeric/source fact, weaken a pin or mark unrun proof complete.
- Never push, open or merge a PR from this QA file.
```
