# Phase 25a: twelve-week prepay and the Fenbridge gate

Wave B. This implementation file and its paired QA own only the deliverables
below. The locked decisions, content numbers, content-manifest.md,
content-numbers-workbook.md, art-brief.md and ux-spec.md are authoritative. Every
acceptance row applies to the paired QA; nothing is built by this planning packet.

## Deliverables (at most five):

1. Twelve-week material prepay on the existing immutable published weekly schedule.
2. Steward batch preview/source choice and atomic receipt/persistence evidence.
3. Measured Fenbridge gate using the existing own-home/friend prompt and return routing.
4. Final gate art, content obligations and desktop/touch/gamepad round-trip evidence.

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
lifecycle-policy-binding artifact (accepted, or still a named unsigned release gate)
names lifecyclePolicyId, sourceCalendarId and resetPolicyId; serving realm, browser
zone or guessed UTC cannot rebind history.
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
This is Phase 25a of Freeholds and Guildhalls: twelve-week prepay and the Fenbridge gate.
Harness: Codex (D74: this file creates shipping gate art, so the asset-creating steps,
including any QA fix that touches an asset, run in Codex, not Claude). Follow the root
CLAUDE.md "Working style by model capability" block; this prompt names no model.
Parallelize bounded owners, integrate and verify centrally.

Goal: implement exactly the settled deliverables and acceptance below with no guessed
decision, unsupported number, unresolved finding or unreviewed fix.

STEP 0 - PRE-FLIGHT:
- Use the packet worktree and wave B branch recorded in state.md. Run git status
  --short; if dirty, stop and ask before edits. Preserve unrelated work.
- git fetch origin --prune, then sync per state.md "Worktree, base, and merge-forward":
  merge the newest origin/release/**. Run release-merge-audit after a nonempty
  merge and pnpm install --frozen-lockfile if patches/ moved. Never use main.
- Read root and applicable local CLAUDE.md in full, then state.md "Gotchas (read before
  the matching phase)" and the test-pin traps it records (Codex has no Claude memory
  file; apply ALL findings and review the review-fix round are packet rules there).

STEP 1 - LOAD CONTEXT THROUGH AGENTS:
Have a reader summarize this file, its QA, state.md locked decisions and content numbers,
progress.md row 25a, implementation-plan.md reviewer matrix, qa-checklist.md, ux-spec.md,
content-manifest.md, content-numbers-workbook.md and art-brief.md. Do not read planning
coordinators directly. The reader verifies current source anchors below and returns a
promised-versus-live table, exact prior module contracts and proposed own-file changes.
Record any changed tree fact in state.md before editing dependent feature files.

Earlier planned modules: src/sim/freehold/ledger_core.ts, ledger.ts, condition_core.ts,
instance.ts and gate/key routing from 06; src/ui/hud/housing/steward_panel_view.ts and
steward_panel_window.ts; src/sim/content/freehold/layouts.ts; server/freehold_wire.ts.
Verified existing anchors: src/sim/fenbridge_layout.ts exports FENBRIDGE_LAYOUT and
FENBRIDGE_STATIONS_BY_ID; src/sim/content/zone2.ts consumes FENBRIDGE_LAYOUT and
src/sim/content/professions.ts consumes FENBRIDGE_STATIONS_BY_ID; and
tests/professions_station_placement.test.ts owns the placement-safety precedent.
tests/freehold_ledger.test.ts and tests/freehold_gate_and_key.test.ts are earlier planned
test suites. New gate IDs/position fields are authored here and recorded in state.

Before implementation decisions, dispatch database-performance-reviewer with the query,
stored-shape and workload proposal when those surfaces apply; pair persistence/security.
Reuse the named settled rules. Missing measurements/signatures are owned artifact gates,
never a request to let an implementer choose a new balance value.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - EXECUTE WITH EXPLICIT OWNERSHIP:
- LEDGER owner: extend 13's four-week batch to the state-adopted twelve weeks on 13's
  src/sim/freehold/ledger_core.ts::LEDGER_PREPAY_MAX_WEEKS (NEW in 13, 4 there); the
  prepaid weeks are ledgerWeekOf realm weeks (D84). Enabling the twelfth week is gated
  by two cumulative named artifacts: a signed CAL-LEDGER-A (content-numbers-workbook.md
  section F, the immutable-prepay row) and the 13a calendar-authority acceptance
  (state.md tracked gate "Source calendar, lifecycle and rollout capability",
  docs/freeholds/upkeep-calendar-db-contract.md). ledger_core.ts takes the cap as an
  injected input with LEDGER_PREPAY_MAX_WEEKS as the shipped default, so the
  twelfth-accepted/thirteenth-refused fixtures prove 12 through the injected cap while
  the shipped default stays 4 and the Steward's prepay picker offers only the shipped
  cap; the default is raised to 12 only in the change that records the signed
  twelve-week CAL-LEDGER-A version and the 13a acceptance in state.md, and until that
  change lands twelve-week prepay is a named unsigned release gate, never live. The
  accepted batch includes immutable bill
  versions for every selected week; fifth week is now permitted, twelfth is permitted,
  thirteenth refuses before deduction. Affordability, confirmation and atomic consumption
  all honor the selected bags-only, vault-only or automatic bags-then-vault source.
  Preserve existing paid bills and credits across schedule changes, outage intervals,
  absence/grace, restart and upgrade. No fee or Call behavior changes here.
- GATE owner: measure a safe Fenbridge candidate against FENBRIDGE_LAYOUT and the
  station-placement safety bar; record authored coordinates, footprint, clearance,
  door/return position and source measurement in content-manifest.md and
  content-numbers-workbook.md before use. Add a second named gate using 06's existing
  interact prompt (own homes/friend name), never proximity auto-teleport. Preserve
  the specific entry gate for leave/ejection in session metadata, excluded from saves
  and parity sampling as appropriate; test Eastbrook versus Fenbridge round trips.
  The candidate's World PvP policy is read with `worldPvpZonePolicyAt`
  (src/sim/pvp/world_pvp_zones.ts). Mirefen Marsh is contested (src/sim/content/zone2.ts
  carries no `worldPvp` field), unlike Eastbrook Vale's sanctuary
  (src/sim/content/zone1.ts), so a Fenbridge exit or a D51 ejection lands a still-flagged
  player on contested ground. RULING OWED from Fernando before 25a builds: accept that,
  or route safety ejections to the Eastbrook sanctuary gate.
- CLIENT/CONTENT owner: Steward prepay picker/summary shows the selectable batch up to
  the shipped cap (four weeks until the default is raised, twelve after) and exact
  source-mode cost, loading/refusal/reconnect state and
  receipt correlation. Fenbridge gate reuses arrival camera/sanctioned sound and
  focus handback from ux-spec.md with final art, safe-area interaction, entity names,
  same-change originality/wiki and content pins. No invented new camera duration.
- Coordinator extends command fields, public descriptor, both worlds and strict pins
  only where the changed gate identity requires it. Reuse 07a's commitFreeholdMutation seam
  for the full prepay deduction and credits; no partial batch can persist.

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
npx vitest run tests/freehold_ledger.test.ts tests/freehold_condition.test.ts
tests/freehold_gate_and_key.test.ts tests/freehold_command_chain_online.test.ts
tests/server/freehold_db.test.ts tests/server/freehold_wire.test.ts
tests/professions_station_placement.test.ts tests/world_api_parity.test.ts
tests/snapshots.test.ts tests/architecture.test.ts tests/sim_context.test.ts
tests/monolith_budget.test.ts tests/hud_update_drive.test.ts
tests/mobile_window_coverage.test.ts tests/renderer_compile_gate.test.ts
tests/localization_fixes.test.ts
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
- [ ] Literal twelfth accepted/thirteenth refused fixtures cover bags-only, vault-only
  and automatic source modes, locked items, short funds, no partial deduction, schedule
  change, outage, restart and fee-independent prepay. Fifth-week rejection from 13 is
  intentionally replaced here through the injected cap, with no contradictory stale
  pin; the shipped LEDGER_PREPAY_MAX_WEEKS default is 12 only if the signed CAL-LEDGER-A
  version and the 13a calendar-authority acceptance are recorded by name in state.md in
  the same change, otherwise it stays 4, the picker offers four weeks, and twelve-week
  prepay is recorded as the named unsigned release gate.
- [ ] Fenbridge placement passes the measured camp/door/path safety bar; entering from
  either gate and leaving or being safely ejected returns to the gate actually used.
  Offline and online prompts never teleport from proximity alone.
- [ ] Required screenshots show twelve-week batch/source preview and pending/refused
  payment plus Fenbridge gate/arrival on desktop, compact and tablet at LOW; audio has
  separate sanctioned cue evidence, and keyboard/gamepad/touch preserve focus.
- [ ] Final gate art and exact measurements/content/i18n/wiki obligations are present.
- [ ] All stated checks, the shared gate and complete review/fresh-fix round pass.

STEP 6 - DOC UPDATES AND MEMORY:
Record row 25a, exact files/symbols/tests/command outcomes, approved artifact rows and
review evidence in progress.md/state.md; keep built status honest. Preserve all prior
decisions and next links. Record surprising repository rules in the authorized memory.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, files, exact checks/results, review and fresh-fix verdicts, any unmet
release artifact gate, and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-25a-qa.md

STOPPING RULES:
- A missing required proof or artifact keeps this contribution incomplete; do not
  invent a value, fake a source, discard custody or weaken an acceptance row.
- Never raise a monolith ceiling, mutate a foreign owner or bypass current authority.
- Keep the branch local; never push, open or merge a PR.
```
