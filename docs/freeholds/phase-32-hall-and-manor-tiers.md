# Phase 32: Great Hall, Manor, Bastion tiers and build projects

Wave C. This implementation file and its paired QA own only the deliverables
below. The locked decisions, content numbers, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md are authoritative. Every
acceptance row applies to the paired QA; nothing is built by this planning packet.

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
This is Phase 32 of Freeholds and Guildhalls: Great Hall, Manor and Bastion upgrade projects.
Harness: Codex. All asset generation must be done by Codex, not Claude. Follow the root CLAUDE.md working-style capability block;
this prompt names no model. Parallelize bounded owners, integrate and verify centrally.

Goal: implement exactly the settled deliverables and acceptance below with no guessed
decision, unsupported number, unresolved finding or unreviewed fix.

STEP 0 - PRE-FLIGHT:
- Use the packet worktree and wave C branch recorded in state.md. Run git status
  --short; if dirty, stop and ask before edits. Preserve unrelated work.
- git fetch origin --prune, then sync per state.md "Worktree, base, and merge-forward":
  the newest origin/release/**
  and remove the dependency block after merge. Run release-merge-audit after a nonempty
  merge and pnpm install --frozen-lockfile if patches/ moved. Never use main.
- Read root and applicable local CLAUDE.md in full; read state.md Gotchas (the matching
  cluster and the test-pin traps), apply ALL findings, review the review-fix round.

STEP 1 - LOAD CONTEXT THROUGH AGENTS:
Have a reader summarize this file, its QA, state.md locked decisions and content numbers,
progress.md row 32, implementation-plan.md reviewer matrix, qa-checklist.md, ux-spec.md,
content-manifest.md, content-numbers-workbook.md and art-brief.md. Do not read planning
coordinators directly. The reader verifies current source anchors below and returns a
promised-versus-live table, exact prior module contracts and proposed own-file changes.
Record any changed tree fact in state.md before editing dependent feature files.

Earlier planned sources: src/sim/content/freehold/tiers.ts, charters.ts, dungeons.ts,
upgrade_projects.ts and layouts.ts; src/sim/freehold/upgrade.ts, hall_fund.ts, grant.ts,
permissions.ts, state.ts and instance.ts; server/freehold_db.ts, server/freehold_wire.ts,
server/claudium.ts; src/ui/hud/housing/steward_panel_view.ts and project view from 21;
src/render/freehold/. Existing source: src/sim/rift/authored.ts exports authoredLiftAt;
src/sim/dungeon_layout.ts consumes authored layout helpers, src/sim/colliders.ts,
src/sim/world.ts and src/render/dungeon.ts own thin geometry integration arms.
NEW planned src/sim/freehold/build_project.ts generalizes the already-tested upgrade
state machine behind its existing seam; tests/freehold_build_project.test.ts pins it.

Before implementation decisions, dispatch database-performance-reviewer with the query,
stored-shape and workload proposal when those surfaces apply; pair persistence/security.
Reuse the named settled rules. Missing measurements/signatures are owned artifact gates,
never a request to let an implementer choose a new balance value.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - EXECUTE WITH EXPLICIT OWNERSHIP:
- CONTENT/LAYOUT owner: append great_hall (2 rooms,120 decor,8 plinths,2 amenities),
  manor and bastion (3 rooms,200 decor,14 plinths,3 amenities) from state Content numbers.
  The visitor cap column (D77): manor 16 (state.md Visitors row); meeting_hall,
  great_hall and bastion take the Fernando-signed hall-tier rows in
  content-numbers-workbook.md, an unsigned release gate until signed, with the Cottage
  row standing until then (D77); never an invented literal.
  Use next verified free DungeonDef indexes, record them before touching consumers;
  no guessed index literal. Layouts and lifts remain content, with the six interior
  integration seams, empty spawns, owner claim, guideVisible false and no Finder row
  (each room keeps `claimKey: 'owner'` and so the World PvP sanctuary, state.md
  "Non-negotiables").
  This file completes exact tier/bill/fee-ID rows in content-manifest.md and derived
  quantities/rounding/reference/approval rows in content-numbers-workbook.md. Eligible
  gather-tier-three node fine materials and separately sourced tier-four crop produce retain the exclusion firewall
  and profession-independent acquisition. Service owns actual fee/quote values.
- SIM/TRANSFER owner: generalize 21's project state behind a small tested module.
  Contributions accumulate permanently until approved bill and confirmed fee are both
  satisfied, whichever arrives last; completion is immediate, with no artificial
  multi-week duration or forced waiting. Two rails, never mixed: the Manor uses 21's
  owner-only contribute_upgrade rail unchanged with the explicit source mode (bags, or
  the vault inside the owner's own claim; D89), no rank and no fund; the Great Hall and
  Bastion use 29's Hall Fund, where members donate through 29 and officers authorize
  project payments from that fund, never a parallel direct-to-project contribution
  rail. Fund custody stays with 29: its officer-plus withdraw-to-guild-bank verb and the
  disband end-of-life refund are 29's and never a project rail (D78). Respect current
  rank, the per-account cap schedule (an unsigned release gate until its signature is
  on file) and separate service balance revision. Exact fitting furnishing copies and
  member trophy provenance carry across. Guild-tier overflow custody target: a
  non-fitting exact copy returns to the bags of the account that placed it (28's
  departure-detach custody when that account is no longer a member), never to the
  completing officer; the Manor returns to the owner's bags per 21. Preview overflow
  and, if any return cannot be made safely (including a placing character that is not a
  live participant of the completing transaction), refuse with the keyed bags_full
  reason before any fee or material mutation, with the preview naming the copies to
  remove. No mail custody branch. Full completion/custody/receipt effects commit
  together; no expiry, lost contribution or duplicate grant.
- SERVER owner: append the three price-free SKU rows and draft service-contract
  outcomes, use 07a's sole durable intent/receipt boundary extended by 15 and 07a's global plot fence/atomic
  save. Unknown SKU, stale quote, replay, second upgrade, wrong rank/unverified service authorization and dark
  flag refuse on both dispatch arms. Guild service quotes bind the guild plot and
  pooled debit; game performs no 3x conversion. Preserve project state across rolling
  versions, crash/restart, pending service results and already-paid bill versions.
- CLIENT/ART owner: final authored interiors, warm hearth/daylight, measured floor/
  clearance and scheduler-prepared dressing preserve LOW beauty and fairness. Shared
  Steward project tab shows exact have/need, selected source/fund, confirmed fee,
  pending/refused, overflow preview and immediate completion. No multi-week timer or
  pay-or-lose tone. Add real desktop/compact/tablet screenshots to the shared helper.
  Project trophies, cosmetic visiting stock and direct Materials Vault chest move
  to 32a; no duplicate implementation owner.

INVARIANTS AND CLOSED ACCEPTANCE CONTRACT:
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
npx vitest run tests/freehold_content.test.ts tests/freehold_build_project.test.ts
tests/freehold_upgrade.test.ts tests/freehold_hall_fund.test.ts
tests/server/freehold_gates.test.ts tests/server/freehold_db.test.ts
tests/provisioner_firewall.test.ts tests/world_api_parity.test.ts
tests/freehold_command_chain_online.test.ts tests/snapshots.test.ts
tests/renderer_compile_gate.test.ts tests/hud_update_drive.test.ts
tests/mobile_window_coverage.test.ts tests/architecture.test.ts
tests/sim_context.test.ts tests/monolith_budget.test.ts tests/localization_fixes.test.ts
tests/deeds_content.test.ts tests/reliquary_content.test.ts
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

STEP 6 - DOC UPDATES AND MEMORY:
Record row 32, exact files/symbols/tests/command outcomes, approved artifact rows and
review evidence in progress.md/state.md; keep built status honest. Preserve all prior
decisions and next links. Record surprising repository rules in the authorized memory.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, files, exact checks/results, review and fresh-fix verdicts, any unmet
release artifact gate, and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-32-qa.md

STOPPING RULES:
- A missing required proof or artifact keeps this contribution incomplete; do not
  invent a value, fake a source, discard custody or weaken an acceptance row.
- Never raise a monolith ceiling, mutate a foreign owner or bypass current authority.
- Keep the branch local; never push, open or merge a PR.
```
