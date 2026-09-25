# Phase 23 QA: audit the Legend Stand and the remaining trophy families

Audits `phase-23-legend-stand-and-trophy-families.md`. Verdict goes in `progress.md`
(row "23 QA"). The next implementation phase never starts before this file has run.

## Settled delivery and acceptance contract


Use the account-wide authoritative source union and event-driven refresh from 17.
Each source already eligible there stays displayable; new forms never revoke unlocks.
Actual item display projects the authorized model/skin and public fields without moving,
consuming, locking or binding the copy. Legend Stand identifies the exact owned copy;
loss of possession darkens its display without changing the item or historical proof.
Project only known original character/date/difficulty; unknown historical day or clear
difficulty uses the explicit unknown key and cannot manufacture a silver/gilded finish.
Rift S-rank requires its actual recorded stamp. Spoiler policy applies to every unseen
source. Every promised source has a literal manifest row and positive/negative fixture.
Owner and guest see the same public provenance; internal account IDs and private item
fields never cross the descriptor. Finish identity survives shed bloom and reduced
lights via material value, emblem and silhouette; hearth-condition feedback already
exists in wave A and is extended, not delayed here.

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

1. Bespoke models replacing every wave A generic trophy display.
2. Legend Stand and actual-item weapon/armor displays.
3. Cosmetic mounts, title banners and farming/profession displays.
4. Truthful source/difficulty/date projection and final finish art.
5. Account-wide live/retro sync and custody/visual evidence.

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

## Trophy key and live-versus-history contract

All housing trophy chrome uses the canonical plural hudChrome.housing.trophies.*
namespace from ux-spec.md; do not add a parallel singular trophy namespace. Historical
account-source reconciliation uses retro: true and remains quiet. A newly earned live
source uses retro: false and retains the approved live unlock notification. Repeated
joins, rehydration, form upgrades of an already eligible trophy and source-cache refresh
cannot turn historical eligibility into a new live earn or replay a toast.

Paired fixtures independently drive historical already-earned source, a fresh live
unlock, duplicate live delivery, second join and generic-to-bespoke form replacement.
Assert exact retro booleans, original source IDs, one unlock mutation and the approved
notification/no-notification result. Check online/offline/headless projection parity,
the exact rendered plural i18n key set, and absence of singular namespace fallback.

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
This is Phase 23 (QA) of the Freeholds and Guildhalls feature: audit the Legend Stand
and the remaining trophy families (eligibility, the finishes, the plaque projection,
the props, the cosmetic wear below 30, every content obligation).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 23 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "23 Legend Stand and the remaining trophy
families", missing tests, dead code, determinism, three-host parity, the no-item and
never-tradable rules, the read-only trophy module, and the render budget; fix what the
audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on the branch state.md
  records for wave B. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", the parity goldens entries.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("23 Legend Stand and the
  remaining trophy families" and the row),
  docs/freeholds/phase-23-legend-stand-and-trophy-families.md (what was promised)
- the Phase 23 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 23)
- the pins the diff claims: tests/freehold_trophies.test.ts,
  tests/freehold_condition.test.ts, tests/freehold_content.test.ts,
  tests/deeds_content.test.ts,
  tests/reliquary_content.test.ts, tests/trophy_tooltip_view.test.ts,
  tests/snapshots.test.ts, tests/renderer_compile_gate.test.ts,
  tests/freehold_command_chain_online.test.ts, tests/server/freehold_wire.test.ts, the
  parity goldens
The agent returns: the promised-versus-delivered table per family (every 23-owned row of
content-manifest.md "Specialized trophy model inventory for 23", every MOUNT_KEYS entry
mapped or excluded, all ten prog_grandmaster_<craft> deeds, dgn_rift and dgn_rift_s_rank,
including every wave A generic display upgraded here, each with its source id, trophy id,
finish, final prop); the plaque fields the descriptor carries and where each is read from
(signer, the owning character's prog_legendmaker deed day or the dateUnknown arm); the
Legend Stand copy reference fields; the wire, decode and mirror lines with their owning
slice and the older-decoder fixture; every
test added with what it asserts; every write the trophy module performs (it should
perform none outside the freehold record); any TODO, unused import, or stub.

Database review runs before implementation decisions and again on the finished diff.

The reader must include every contract and deliverable section above this Starter
Prompt in its returned acceptance table, including sole authority ownership, D9,
history/finality and required Codex asset execution where applicable.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: every family's source id exists in the tree and maps to exactly one
  trophy id, and the delivered family set equals the 23-owned manifest inventory (no
  fixed mount count; MOUNT_KEYS under the availability filter); the finish per tier is
  right on both hosts; the Legend Stand reads the
  item and never moves, locks, binds, or consumes it, keeps its stable copy reference
  across a lock toggle and an enchant, and darkens (never removes) when
  the item leaves possession, resolving two identical copies identically on both hosts;
  the plaque shows the signer and the owning character's
  prog_legendmaker deed day only when that character's legendariesForged counter equals
  1, otherwise the dateUnknown key, never a synthesized or first-promotion day, and
  nothing under src/sim/professions/ changed; provenance reads the captured snapshot
  written at grant (D79) as utcDay stamps (D84); the retro grant is idempotent across a
  second join and a
  relog; capture never refuses join, enterDungeon or respawn (D83); a visitor sees the
  owner's trophies through the descriptor; no hidden instance
  field crosses the wire; the plaque, finish and inactive picks decode through the strict
  allowlist and an older decoder shows bronze with a hidden plaque; below condition 30
  the hearth light is cold and every finish
  dull on both hosts, restored at 30, nothing removed and no actionable readout hidden
  (D22); the extractions are move-not-rewrite.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (source ids as fresh
  literals; a negative case per family and per Legend Stand rule, including the
  promoted copy with no recorded day, the two-promotions-on-one-character fixture that
  shows dateUnknown on both stands, the duplicate-copy fixture that agrees on both
  hosts, and the lock-toggle and enchant cases that keep the
  stand lit; the no-item sweep
  compares every trophy id against ITEMS, every mergeItems part and the ALL_RECIPES
  result ids and would fail on a synthetic colliding id; the
  never-tradable pin drives the market, trade, mail, and bank arms WITH a placed trophy
  record present and asserts none can address it, and the SimContext spies record no
  addItem, removeItem, market, mail or bank primitive from placing and removing it (a
  pin that passes with no trophy code is a defect); the D83 pin joins with capture
  exhausted; the old-client pin uses an older-decoder fixture, not a comment; the zero-Rng pin
  uses the observer, not an inference); orphaned tests; the parity scenario fires the
  retro path.
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant (reliquary write ownership), any write under src/sim/professions/,
  the word "phase" in any code, comment,
  or commit message, em dashes or emojis, generated files hand-edited, any shipped stand-in, a finish material attached outside the scheduler, the local
  CLAUDE.md rows accurate.
- Required reviewers: architecture-reviewer, content-obligations-reviewer, render-performance-reviewer, frontend-seam-reviewer, cross-platform-sync, privacy-security-review, migration-safety, database-performance-reviewer, server-hot-path-reviewer, test-coverage-auditor, qa-checklist. Each reports COVERAGE to a file.
  Apply ALL findings including nits; a fresh reviewer reads every fix. The actual diff
  may trigger additional specialists; database review runs before decisions and again
  on the finished diff for database surfaces.

STEP 3 - VALIDATION:
- Run the Phase 23 STEP 3 suite list plus `npx tsc --noEmit`, `npm run wiki:content`
  followed by `npx vitest run tests/guide.test.ts`, and `npm run perf:tour`.

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
- [ ] Every Phase 23 acceptance box is verified by a check that ran, not by inspection.
- [ ] No finding remains unresolved; every nit is applied and the fix round is reviewed.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "23 QA": verdict (PASS / FAIL), counts found and
  fixed, separately tracked external artifact/release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, separately tracked external artifact/release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-24-kitchen-garden-tableau.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 23 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
