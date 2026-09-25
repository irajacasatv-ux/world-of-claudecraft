# Phase 21 QA: audit the Lodge tier and the upgrade build project

Audits `phase-21-lodge-tier-and-upgrade.md`. Verdict goes in `progress.md` (row "21
QA"). The next implementation phase never starts before this file has run.

## Settled delivery and acceptance contract


Complete when the full bill and confirmed fee exist, whichever arrives last. A full
material contribution may wait safely for the fee. Preflight fitting copies and overflow
before a new fee/material mutation; preview overflow, keep fitting copy IDs and provenance,
and refuse bags_full if safe bag return cannot fit. Completed effects, inventory,
fund/fee receipt and upgrade revision commit atomically. Test both payment orders,
duplicate/reordered confirmations, last-contribution versus fee races, full bags,
restart and already-completed attempts with no lost or duplicated copy.

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

## Deliverables (at most five):

1. Lodge tier, measured layout and final content/art obligations.
2. Approved upgrade bill and versioned service fee contract.
3. Atomic upgrade/contribution/completion and exact-copy carry-over.
4. Durable receipt/persistence and public progress projection.
5. Steward preview/progress UX and custody/parity evidence.

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
lifecycle-policy-binding artifact (accepted or still a named release gate) names
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
service artifact (accepted or still a named release gate). A first-party web checkout
session alone is insufficient.
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

## Canonical upgrade projection

The existing myFreehold.upgrade projection carries approved project progress and the
committed 07a operation reference; no sibling myUpgradeProject facet is introduced.
The strict fhold decoder and existing housing facet expose the same optional upgrade
shape on online, offline and headless adapters. Extend literal world_api parity keys
and both-world fixtures; assert unchanged facet membership, pre-project absence,
partial bill, fee-first, bill-first and completed revision projection with no receipt
or private source leakage. Owner progress uses this one world projection on every host.

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
This is Phase 21 (QA) of the Freeholds and Guildhalls feature: audit the Lodge tier and
the upgrade build project (the tier record and layout, the fee SKU and bill, the
contribute command, carry-over, the second amenity slot).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 21 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "21 Lodge tier and the upgrade build project",
missing tests, dead code, determinism, three-host parity, the money gates, persistence
back-compat, the keystone exclusion, and never-destroy; fix what the audit finds;
record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the storage-charter exactly-once entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("21 Lodge tier and the upgrade
  build project" and the row), docs/freeholds/phase-21-lodge-tier-and-upgrade.md (what
  was promised), docs/prd/woc/freehold-service-contract.md
- the Phase 21 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 21)
- the pins the diff claims: tests/freehold_content.test.ts, tests/freehold_upgrade.test.ts,
  tests/freehold_layout_core.test.ts, tests/provisioner_firewall.test.ts,
  tests/server/freehold_gates.test.ts, tests/server/freehold_db.test.ts,
  tests/world_api_parity.test.ts, tests/snapshots.test.ts, tests/monolith_budget.test.ts,
  tests/steward_panel_view.test.ts, tests/steward_panel_window.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, every test added with what it asserts, the bill's
id list against the keystone, intermediate, and catalyst exclusions (unit counts, never
stackSize), the source-mode argument and both mode paths (bags, vault inside the
owner's claim), the re-attempt path after a bags_full completion refusal, the Steward
upgrade keys and steward-upgrade-* scenes against ux-spec and the registry, the DDL
text added, and any TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every deliverable and acceptance criterion actually met; the fee grant is
  exactly-once on replay of the same purchase key AND a different key after completion;
  completion requires the confirmed fee receipt and full bill in either order, with preflight overflow before fresh mutation; carry-over keeps
  every row that validates in the Lodge rooms and returns or refuses the rest without
  mutating on refusal; the Lodge's first room is the Cottage cell grid, door, plinth
  anchors 1 to 4 and amenity anchor 1 verbatim, so carry-over preserves identity (D80
  premise); all actually eligible Inn Room trophy displays survive two upgrades;
  contributions honor the explicit source mode (D37, D89): affordability, confirmation
  and the atomic deduction use the same mode, a bags contribution never reaches the
  vault, and the vault arm is authorized only inside the owner's own claim under
  D18/D47; a fee confirmed against full bags leaves the project pending with its
  receipt under the original 07a operation and finishes later exactly once with no
  second fee (07a recovery at the next accepted entry, pinned in
  tests/server/freehold_gates.test.ts, and the finishUpgrade arm, pinned in
  tests/freehold_upgrade.test.ts); prepaid credits and the current
  immutable bill survive completion unchanged and the schedule stays the tier-independent
  realm-week table (D35); day facts use resetDay through 13a and the completion stamp is
  utcDay (D84); the
  flag dark refuses the SKU on BOTH dispatch arms and the store filter; the pre-column
  account_freeholds row loads with no project; the Lodge layout's colliders equal its
  rendered walls (authoredColliders from the same tables); the Steward upgrade section
  renders every keyed state with the exact English the implementation file names and
  the six steward-upgrade-* after-shots are on file; the extractions are
  move-not-rewrite (diff the moved bodies).
- TEST COVERAGE: each claimed pin has a DECISIVE assertion that fails on regression (the
  tier row and bill ids are fresh literals, never read back from the table; the keystone
  sweep spells the three ids and the intermediate words; the exactly-once test asserts
  the record after the replay, not just the return value); a negative case per deny
  reason and per source mode (bags never touches the vault; vault outside the claim
  refuses with nothing deducted); the re-attempt test asserts one completion and one
  receipt after two finish calls; the geometry subset pin compares fresh literal
  anchors, never the layout read back; the Steward states are pinned by exact English
  keys; the determinism case asserts a work-happened anchor before the equality;
  orphaned tests; the pg twin not skipped.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant, the word "phase" in any code, comment, or commit message, em dashes
  or emojis, generated files hand-edited, a price or copy field on the SKU or project
  record (negative pin present), the local CLAUDE.md rows for upgrade.ts and
  upgrade_projects.ts present and accurate.
- Required reviewers: content-obligations-reviewer, architecture-reviewer, privacy-security-review, migration-safety, database-performance-reviewer, cross-platform-sync, render-performance-reviewer, frontend-seam-reviewer, server-hot-path-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 21 STEP 3 suite list plus `npx tsc --noEmit`, the pg-armed twin, and
  `npm run wiki:content` followed by `npx vitest run tests/guide.test.ts`.

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
- [ ] Every Phase 21 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "21 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-22-furnishings-all-crafts.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 21 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
