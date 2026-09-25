# Phase 35: Ward favor and Endeavors

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 35 of the Freeholds and Guildhalls feature: permanent ward Favor and monthly Endeavors.

Harness: Codex, not Claude (D74). Follow the root CLAUDE.md "Working style by model
capability" block for effort and fan-out; this prompt names no model.

Goal: let shared accomplishments permanently expand decoration capacity while monthly cosmetic Endeavors use their own authority-fed calendar and bounded durable awards.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  and merge it. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Gotchas scan (Codex has no memory step): state.md "Gotchas (read before the matching
  phase)" entries on the realm calendar feed, the escrow-delta idiom, never-sell-power
  sweeps, sim_context callback pins, test-pin traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "35 Ward favor and
  Endeavors"), and this file
- src/sim/freehold/wards.ts, ward_core.ts (the Phase 34 descriptor and its style slot),
  layout_core.ts (the decor budget check), ledger.ts and condition_core.ts (the events a
  paid ledger emits), visiting.ts (the visit event), src/sim/sim_context.ts (utcDay,
  resetDay, the calendar primitives), server/sim_calendar_feed.ts and server/raid_reset.ts
  (resetDayKey, nextWeeklyRaidResetMs; whether any month key exists)
- server/freehold_db.ts (freehold_wards, account_freeholds rev CAS), server/guild_bank_state.ts
  (the escrow-delta merge to copy for concurrent contributors), server/freehold_wire.ts
- src/ui/hud/housing/ (the steward panel family, the Phase 34 ward panel if one landed),
  src/ui/i18n.catalog/hud_chrome.ts (housing namespace)
- tests/freehold_content.test.ts (the power-neutral sweep), tests/freehold_wards.test.ts,
  tests/sim_context.test.ts, tests/parity/trace.ts
- docs/freeholds/ux-spec.md and the content, measurement, service and policy artifacts
  referenced by state.md that this slice consumes (signed, or still open release gates).
The agent returns: the exact existing event and calendar seams, the chosen UTC month feed, atomic
contribution/reward paths and panel family. Favor capacity never decays. Monthly
Endeavor progress resets independently. Retain four ranks and +10 decor per rank as
state-owned targets. The content/numeric manifest owns every event weight, threshold,
monthly goal, target and reward with derivation, owner and approval before activation.
Allowed Favor sources are timely material Ledger payment, distinct admitted visits
and cosmetic Endeavor completion; purchases and repeat visits do not create Favor.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.
Database review is required BEFORE implementation decisions and again on the finished
diff, including changes to callers, persisted JSON, caches or workload even when SQL
text stays unchanged. Reuse 07a's global plot fence and reviewed actual legacy
touch-set, including caller-owned saves, character prelocks/nonces, bank-ledger
classification, guild replay and storage/custody effects. Preserve character FIFO
entry and the proved new-participant suffix, never a replacement generic lock order.
Never enter a queue holding a DB client or hold locks
across service IO. Bound admitted work, acquisition/query/transaction deadlines,
projection keys, rows and bytes; background producers use shared admission and
cancellation. Retain one running plus one pending dirty generation, not unbounded
FIFO writes. Supply a query/index inventory (scope, predicates, order, limit, expected
cardinality and supporting index), reverse-FK export/delete access and retention for
every growing shape. Disposable-PG concurrency, plans, query counts and maximum legal
payload evidence are acceptance, not satisfied by fake-pool tests.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Permanent capacity and calendar: NEW src/sim/freehold/ward_favor_core.ts (pure)
   derives the highest unlocked rank monotonically from validated contributions, and
   layout_core.ts uses the permanent bonus. The capacity award is a property of the
   stable plot ID (D80): persist each credited plot's highest unlocked award on that ID
   so a later ward move never retracts it, it travels with the plot through a 38
   transfer, the seller's fresh tier-0 record starts at the base budget, and a 42 second
   plot starts at base with its own award; lazy delivery uses that durable per-plot
   award identity. NEW src/sim/freehold/realm_month_core.ts (a pure sim leaf; the
   server feeds it) derives the Endeavor month as the UTC calendar month
   utcDay.slice(0, 7) from the authority-fed utcDay (D84, D58), or from a utcMonth field
   fed beside utcDay in server/sim_calendar_feed.ts::feedRealmCalendar with its pin in
   tests/sim_context.test.ts; never resetDay, which is the 03:00 realm-reset civil day.
   The boundary fixture 2026-10-01T03:30Z (2026-09-30 23:30 in America/New_York, where
   resetDay still reads 2026-09-30) yields month 2026-10. Month boundaries reset
   Endeavor counters, never capacity, placed furniture or eligibility. No Date,
   wall-clock or network call enters sim code.
2. Authored Endeavor content: src/sim/content/freehold/endeavors.ts carries append-only
   goal/metric/reward IDs (goals `freehold_endeavor_<goal>`, reward props
   `freehold_endeavor_reward_<prop>`) and exact approved weights/thresholds/targets from
   content-manifest.md's Endeavor rows and the CAL-ENDEAVORS workbook artifact
   (UNSIGNED until approved). Monthly activities are cosmetic, no stat, training,
   recipe/drop/gathering advantage or paid input. The manifest states distinct-visit
   identity and contribution fingerprints; unknown/unapproved rows cannot activate.
   Include final prop art, names/IP check, source records, wiki and applicable deed/
   Reliquary obligations for every shipped reward. Changed props register with the
   existing render scheduler, prewarm before visibility and retire on release;
   repeated entry/leave must not grow GPU resources. Record measured LOW frame/GPU
   and actionable-visibility evidence against the approved workbook budget.
3. Durable progress and awards: one observer on existing accepted events creates
   identified contribution deltas, deduped atomically with progress under ward
   serialization. Persist permanent rank, calendar-specific counters, completion ID,
   eligible member snapshot, per-account reward-delivery identity and the per-plot
   capacity award (D80) using additive bounded rows. Cosmetic prop rewards go to
   actual safe item custody; trophy display unlocks
   go to trophy records, never counterfeit inventory. Lazy award on member load/entry
   or indexed resumable admitted batches, not a whole-guild housing rewrite. Crashes,
   duplicate events, alts and overlapping workers cannot duplicate progress/reward.
4. Ward panel and wire: serialize the ward projection once per revision, decode it
   strictly in src/net/ward_wire.ts and extend the Steward-family cold window/painter.
   Show permanent capacity separately from monthly progress with reward silhouettes
   that obey spoiler policy; the keyed loading/empty/in-progress/complete/hidden-reward/
   unavailable states use the exact English rows below (D92), current ACL, focus and
   mobile rules from ux-spec. Append the rows to ux-spec section 10, extend the
   `housing-ward` section 11 target with the six favor/endeavor scenes
   ward-endeavors-loading, ward-endeavors-empty, ward-endeavor-in-progress,
   ward-endeavor-complete, ward-endeavor-hidden-reward and ward-endeavors-unavailable x
   desktop/compact/tablet (18 variants, the 562 milestone), regenerate
   ux-key-manifest.json and ux-shot-manifest.json in
   the same change, and add the parity pins.
5. Proof: tests/freehold_ward_favor.test.ts covers permanent ranks across month/ward
   transitions, injected calendar boundaries, pure twin-run determinism and no paid
   input. Real-PG races, duplicate/restart completion and lazy offline-member delivery
   prove exactly-once awards and bounded plans/query counts; positive cosmetic
   allowlist has a failing forbidden-reward control. Retention folds completed progress
   only after durable completion/award identities preserve replay authority.

Exact English keys this phase ships (D92; {month} and {date} through formatDateTime,
counts through formatNumber; the window title reuses 34's ward.title, and the two
section-title rows ward.favor and ward.endeavors are shipped here, not by 34):

| Key | Exact English |
| --- | --- |
| hudChrome.housing.ward.favor | Neighborhood Favor |
| hudChrome.housing.ward.endeavors | Neighborhood Endeavors |
| hudChrome.housing.ward.favorRank | Favor rank {rank} of {maximum} |
| hudChrome.housing.ward.favorCapacity | Permanent decor bonus: +{count} |
| hudChrome.housing.ward.favorTooltip | Favor comes from paying your Ledger on time, from distinct neighbors visiting, and from completed Endeavors. It never decays and never drops when your home moves. |
| hudChrome.housing.ward.endeavorMonth | Endeavors for {month} |
| hudChrome.housing.ward.endeavorProgress | {current} of {goal} |
| hudChrome.housing.ward.endeavorComplete | Complete |
| hudChrome.housing.ward.endeavorReward | Reward: {reward} |
| hudChrome.housing.ward.endeavorRewardHidden | The reward is revealed when this Endeavor is complete. |
| hudChrome.housing.ward.endeavorsEmpty | No Endeavors are running this month. |
| hudChrome.housing.ward.endeavorsLoading | Loading Endeavors... |
| hudChrome.housing.ward.endeavorsUnavailable | Endeavors are unavailable right now. Your Favor is unchanged. |
| hudChrome.housing.ward.endeavorsReset | Progress resets on {date}. |

INVARIANTS THIS PHASE MUST KEEP:
Every player-visible string, including error, aria, tooltip and empty-state text,
uses an English hudChrome.housing.* key and the formatters from src/ui/i18n.ts.
Tooltips follow docs/design/tooltip-writing.md. Reuse docs/freeholds/ux-spec.md and the
shared family/painter/window lifecycle, focus return, keyboard/gamepad, touch safe-area,
reduced-motion and graphics-fairness contracts; do not fork the theme. New paths,
symbols, wire fields, tables and tests under housing/freehold are PLANNED unless an
earlier completed ledger row owns them. Re-find every existing anchor in the tree.
No power sale, keystone/gear-intermediate/quickening-catalyst bill, new farm bed,
repossession or calendar destruction. Sim stays deterministic and token-free; all
server player events are keyed data. Coordinators compose siblings and never grow
past their pinned ceilings. Fresh tests use literal expectations and negative controls.


Out of scope:
Any behavior beyond these deliverables, any invented balance rate, and any production flag enable.

ACCOUNT AUTHORITY, CALENDAR AND RECOVERY ACCEPTANCE:
Consume 07b's single account lifecycle authority: NEW
server/freehold_lifecycle_db.ts::loadFreeholdLifecycle/loadFreeholdLifecycleProtectionPage/
advanceFreeholdLifecycleOnClient, coordinated by
server/freehold_lifecycle.ts::createFreeholdLifecycleCoordinator and the accepted
server/freehold_lifecycle_binding.ts::resolveFreeholdLifecycleBinding policy registry.
Capture authenticated observations before queues; committed monotonic transitions,
not authentication login or a plot-local last-seen field, authorize account grace.
Immutable multi-return history or lossless prefix facts cover dormant/foreign plots;
union overlapping lifecycle protection and service suspensions exactly, never sum
independent credits, force-write foreign plots or restart grace on an alt/plot switch.

07c's NEW server/freehold_arrival_db.ts::loadFreeholdArrivalTiers/
markFreeholdArrivalTierOnClient owns normalized account+tier marks, separate from
lifecycle and plot saves. Only the committed accepted-owner-entry insert winner
has first-tier eligibility. NEW arrivals may receive a private freshArrivalPresentation
directive; snapshot/resume/replay set it null even with firstTierAtAdmission history.
Commit-before-ACK can skip presentation; no exactly-once visible/audio promise and
no permanent receipt for routine visits. Second plots and transfers do not duplicate,
copy or clear account arrival marks or seller lifecycle history.

13/13a own shared source calendar/history/checkpoint evaluation. Preserve calendarId,
schemaVersion/resetPolicyId and immutable prepaid bill/rate/material/receipt identities
across foreign-realm claims and transfers. No rebinding to serving realm/browser zone.
Historical dependencies of durable condition/bill/credit effects must be irrevocably
finalized and read at consistent committed calendar/lifecycle revisions; unfinalized,
missing or unsupported coverage keeps the affected effect pending. A future-credit
purchase does not require future time to be finalized. Long absences/outages use
bounded indexed prefix probes, never lifetime scans or absent-day/week loops.
Calendar-only exclusive writers and compatible shared mutation readers follow 07a's
actual legacy touch-set proof; no invented reverse lock hierarchy. Current-generation
projection/ACK identity cannot regress after delayed loads or superseded delivery.
Server-only operator evidence, secrets and diagnostics never reach either owner or
visitor wire: explicit allowlist builders and distinctive sentinel tests prove it.

At a sale/ownership transfer, materialize the old owner's condition at the transfer
boundary from finalized original calendar/lifecycle history; preserve source calendar
and immutable credits, retain seller account history, and apply buyer lifecycle only
prospectively without copying grace. Unknown authority holds application for bounded
original-operation recovery/accepted compensation, never a replacement charge or
silent calendar reset. Current local custody/fence guards still apply.
Character deletion, soft deactivation, restoration, true account deletion and export
are separate: deactivation is not an FK cascade; restored history/credits/receipts keep
their meaning. Explicit housing export loaders expose allowed facts only. Unknown or
oversized originals remain durable/read-only with bounded diagnostic/reference, not
empty/new-home defaults or filtered destructive arrival-set rewrites.
07's persistence-rollout-contract.md and 07b's lifecycle-policy-binding.md/
lifecycle-db-contract.md plus 13a's upkeep-calendar-db-contract.md name minimum
capable releases, measured bounds, exact schema/save fixtures and accepted policies.
Enable only a proven capable rollout; unchanged normalized rows do not prove an old
binary implements lifecycle, export or saves. Rollback quiesces NEW effects and
preserves accepted original-operation recovery identities and supported recovery.
Each consuming implementation/QA runs relevant two-character/two-plot/two-realm,
dormant-history, delayed-generation, finality/transfer, deactivation/restore/export
and capable/uncapable-release fixtures through real composition and disposable PG.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/architecture.test.ts
  tests/sim_context.test.ts tests/monolith_budget.test.ts tests/freehold_ward_favor.test.ts
  tests/freehold_wards.test.ts tests/freehold_content.test.ts tests/freehold_determinism.test.ts
  tests/world_api_parity.test.ts tests/snapshots.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/pr_shot_targets.test.ts` plus the
  tests/server/ suites the SERVER slice added and the pg-armed twin; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`;
  parity goldens if regenerated.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer, content-obligations-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Database review runs before decisions and again on the completed diff. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Four-rank/+10 approved targets remain permanent across all month boundaries; the UTC Endeavor month (utcDay.slice(0, 7), D84; the 2026-10-01T03:30Z fixture yields 2026-10) resets only its own progress; the capacity award travels with the stable plot ID across a transfer fixture and the seller's fresh record starts at base (D80).
- [ ] Every weight, threshold, goal and reward has an exact approved manifest row and runtime literal pin; no guessed contribution formula or purchase input.
- [ ] Real-PG duplicate/concurrent/restart progress and award cases grant once, preserve offline eligibility and use bounded lazy or resumable delivery.
- [ ] Ward panel shows permanent capacity and monthly progress distinctly on desktop/compact/tablet; current authorization, spoiler-safe silhouettes and strict wire parity pass; the favor/endeavor key rows and the six `housing-ward` endeavor scenes (ward-endeavors-loading, ward-endeavors-empty, ward-endeavor-in-progress, ward-endeavor-complete, ward-endeavor-hidden-reward, ward-endeavors-unavailable) are registered and both manifests regenerated (D92).
- [ ] All suites, content art obligations, DB plans/growth evidence, reviews and contribution gate pass.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 35 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-35-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
