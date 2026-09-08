# Phase 36: realm Showcases and bounded guest books

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 36 of the Freeholds and Guildhalls feature: realm Showcases and bounded guest books.

Harness: Codex, not Claude. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: offer opt-in realm exhibitions and considerate guest reactions with current privacy checks, durable season results and concurrency-safe bounded storage.

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
- If state.md "Push policy" records a stacked wave branch, work on that branch instead of
  feature/freeholds.
- Memory scan: MEMORY.md and entries on the RouteDef scaffold and surface inventory,
  retention registration, cached reads and busts, Postgres gotchas, test-pin traps.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74). Use the sanctioned imagegen/image-to-GLB workflow and its
provenance, runtime registration, fingerprint and in-context checks. This planning
audit creates no game assets. Final art is required here; 44a is a residual sweep,
not permission to leave a placeholder for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "36 Showcases and guest
  books"), and this file
- server/freehold_routes.ts and server/freehold_db.ts (the registry-only table, the
  error family, the tables so far), server/http/CLAUDE.md (new:endpoint, append-only
  ERROR_CODES), server/http/middleware/require_owned.ts, rate_limit.ts, body.ts
- server/social_db.ts (blocks, ignores, friendships), server/social.ts (the block
  predicates)
- server/retention_sweep.ts, server/main.ts (the tables array after listen),
  server/play_session_retention_db.ts (the prune primitive shape), server/cached_read.ts,
  server/bank_ledger_growth_budget.ts (the bounded per-account append log),
  server/db.ts (exportAccountData)
- src/sim/freehold/visiting.ts (the visit policies from Phases 18 and 26), wards.ts (the
  opaque plot id the descriptor carries), trophies.ts (the trophy record and source
  ids), src/sim/sim_context.ts (resetDay, the realm reset-day clock every daily
  rollover keys on; utcDay only stamps when something happened), server/raid_reset.ts
  (resetDayKey, the server producer of resetDay) and server/sim_calendar_feed.ts (how
  the server feeds it), src/sim/realm_week.ts (13's extraction: emberWeekAnchorOf and
  ledgerWeekOf, the Tuesday realm-week anchor), server/retention_sweep.ts
  (utcDayOf: sweep scheduling only), server/freehold_visiting.ts (Phase 18's NEW
  current-authorization sibling, extended by 26: the one block/ignore/visit-policy
  authority)
- src/ui/mailbox_window.ts or the cold-window family src/ui/CLAUDE.md names,
  src/ui/hud/housing/ (the ward panel), tests/server/http/surface_inventory.ts,
  tests/server/main_retention_wiring.test.ts, tests/api_error_code_parity.test.ts
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
The agent returns: the existing RouteDef/error-registry recipe, current social predicates, trusted
calendar feed, cold-window family and query/index inventory. The settled Showcase is
realm-wide opt-in with one account vote per realm season, no self-vote and no reset
by ward movement. Seasons last 13 weeks from the published realm weekly anchor,
counted in realm weeks keyed by resetDay and the Tuesday anchor emberWeekAnchorOf
from src/sim/realm_week.ts (D84). Tie-break earliest valid entry, then stable plot ID.
Guest reactions are exactly
wave/cheer/admire, one per account per plot per realm day, with 50 retained entries.
These adopted tuning values live in state; dates are fed by authority.
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
1. Showcase persistence and close: NEW server/freehold_social_db.ts owns
   freehold_showcase_entries keyed by realm/season/opaque plot ID,
   freehold_showcase_votes uniquely keyed (realm, season, voter_account_id),
   freehold_showcase_results with immutable close identity, and
   freehold_showcase_awards with durable per-award replay identity. Eligibility
   is explicit opt-in and current public permission; no self-vote or ward-hop reset.
   Tally from accepted votes, tie-break entry time then stable plot ID, persist close
   identity/result before reward, and deliver lazily or through bounded checkpointed
   jobs. Entry consent removal/private status prevents further exhibition/voting;
   close excludes entries without current consent. No reward of gameplay power.
2. Guest book persistence: NEW freehold_guest_book_entries holds only the closed
   reaction enum wave/cheer/admire and public entry fields, with no free-text column
   or input. NEW freehold_guest_book_daily_claims under the same DB owner carries
   the retention-independent unique (account_id, plot_id, realm_day_id) consumption
   marker. realm_day_id is the resetDay realm reset-day identity (the server produces
   it with resetDayKey(ms, REALM_RESET_TIME_ZONE); the sim consumes ctx.resetDay),
   never the UTC calendar date; epoch-ms fields are display-only and utcDay only stamps
   when an entry was written (D84). The globally stable realm_day_id preserves its
   signed CAL-SOCIAL source calendar/reset binding across policy revisions;
   calendar_id and reset_id remain immutable source references, never an alternate
   key that restores eligibility.
   CAL-SOCIAL specifies authenticated day authority, the shared nonregressing
   admission/closed-day watermark and supported peer/retry horizon before activation.
   Never accept a client day, serving-realm guess or regressible process clock.
   In one 07a transaction, recheck current authority/input, acquire the reviewed
   plot participant, recheck current authority/day under the fence, conflict-safely
   claim the day, append the visible entry and
   deterministically prune oldest-created/id entries to 50. Any failure rolls back
   claim, append and prune together. The marker survives visible pruning, owner or
   moderation deletion and restart. Names obey existing moderation, blocks and
   privacy; unknown reactions and excessive payloads refuse before admission.
3. Routes, privacy and growth: hand-extend the existing freehold RouteDef domain;
   do not rerun the scaffold against its existing error catalog. Register routes and
   every new stable error in the five Phase 01 catalogs/pins. Owner delete uses
   requireOwned keyed on the numeric entry id (num({ int, min: 1 })), never the opaque
   plot id. All reads/writes call server/freehold_visiting.ts current authorization
   (18's NEW sibling, extended by 26) as the only block/ignore/visit-policy authority,
   which applies D76 (the named owner character's outgoing friend list is the
   admission fact; a block row on either side refuses; an alt name resolves to that
   account's plot) and D77 (guild plots admit members always; guild/public/private
   only; friends refused for the guild owner kind), and recheck consent.
   Unknown/private/blocked plots return the same 404. Bounded projection
   caches never authorize access; rate/admission-limit high-entropy plot keys.
   Inventory every growing relation separately: freehold_showcase_entries,
   freehold_showcase_votes, freehold_showcase_results, freehold_showcase_awards,
   freehold_guest_book_entries and freehold_guest_book_daily_claims. Entries/votes
   fold only after durable close; result/award identities retain replay authority.
   Visible guest entries prune on insert and accepted retention policy. NEW
   pruneFreeholdGuestBookDailyClaims in server/freehold_social_db.ts is an indexed,
   bounded retention_sweep producer; a day becomes eligible only after the signed
   authority's nonregressing closed-day watermark and supported delayed/retry/
   restart/rolling-release paths make readmission impossible. Every capable peer
   rejects expired captured attempts, including after waiting for the plot fence;
   policy/clock regression cannot reopen a retired day. Cleanup fails closed if
   that proof is unavailable. No guessed TTL or client timestamp authorizes cleanup.
   Supply exact predicates/order/limits, expiry and account/plot reverse-FK indexes,
   row/byte bounds, export/delete treatment and aggregate admitted cleanup work for
   every relation. Erasure removes allowed personal data without reopening any
   surviving account's admission or replay identity. Register every bounded prune
   through existing shared retention admission and cancellation.
4. Social windows and reward presentation: server-fed Showcase list/vote and guest
   book cold windows use ux-spec later-wave Steward/list family with explicit opt-in,
   no-vote/used/closed/locked/empty/loading/error states, public provenance and
   read-only guest mode. The guest book opens from the existing gate-door interactable
   (the D4 object entity whose prompt 26's knock already extends) with a keyed
   guestBook.title row; no new world entity is added. Existing showcase.* and
   guestBook.* keys plus common.unavailable, common.retry and common.reconnecting
   (error, unavailable, reconnect) are reused; NEW keys under hudChrome.housing with
   exact English (D92), appended to ux-spec.md's key tables with the section 11
   housing-showcase target (scenes showcase-consent, showcase-list, showcase-voted,
   showcase-vote-used, showcase-season-closed, showcase-season-locked, showcase-empty,
   showcase-loading and showcase-error x desktop/compact/tablet, 27 variants) and
   housing-guest-book target (guest-book-empty, guest-book-reactions,
   guest-book-recorded, guest-book-used and guest-book-denied, 15 variants; together
   the 604 milestone), both manifests
   regenerated in this same change with every cited count updated:
   showcase.seasonClosed "This Showcase season is closed. The next season opens on
   {date}."; showcase.seasonLocked "Voting is locked while results are counted.";
   showcase.voteUsed "You have already voted this season."; showcase.ownEntry "You
   cannot vote for your own home."; showcase.loading "Loading the Showcase...";
   guestBook.used "You have already left a reaction here today."; guestBook.loading
   "Loading the guest book...". All strings are keyed; source names obey spoiler
   rules; trophy-decor reward content/art/source obligations are fulfilled, including
   the Book of Deeds and Reliquary obligations stated on the content-manifest.md
   Showcase reward row. Add
   desktop/compact/tablet captures and source pins for no text input. Changed reward
   props use the existing scheduler, prewarm and retirement contract, with repeated
   entry/leave proving no resource growth. Record measured LOW frame/GPU and
   actionable-visibility evidence against the approved workbook budget.
5. Proof: route inventory/error parity, same-seed tally and cross-host reward pins,
   fakeCtx unit cases and disposable-PG vote/guest insert/season-close races. Test
   self-vote, second character, ward moves, opt-out/private close, duplicate worker,
   crash before/after award and concurrent 50-entry cap. A posts, 50 other authors
   displace A, then A's alt/process/restarted session remains refused that day;
   repeat after owner/moderation deletion, pruning/cleanup races and rollover.
   The next authoritative day permits one new reaction. Prove stale captured-day
   refusal and rollback after claim insertion. A fixture with reactions at 02:59 and
   03:01 realm-local across a UTC midnight shows exactly one accepted claim per
   reset-day key on each side of the reset instant (D84). Disposable PG records actual query
   plans/counts, lock waits, peak admitted work, row/byte growth, reverse-FK cascades,
   all relation retention jobs and account export/delete at approved cardinality.

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
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_social_db.test.ts
  tests/server/freehold_social_routes.test.ts tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/main_retention_wiring.test.ts
  tests/api_error_code_parity.test.ts tests/server/new_endpoint.test.ts
  tests/freehold_showcase_tally.test.ts tests/freehold_guest_book_reactions.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts tests/localization_fixes.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts`; the pg-armed
  twin with TEST_DATABASE_URL set after `npm run db:up`; `npm run i18n:gen` then
  `npx vitest run tests/i18n_completeness.test.ts`; `node scripts/pr_screenshots.mjs`.
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
- [ ] Realm-wide opt-in and account/realm/season uniqueness, no self-vote/hop reset, 13-week anchor and deterministic tie-break pass literal and real-PG race tests.
  Use equal accepted vote totals and equal valid entry timestamps with opposing
  identity orders: plot-a has entry-z and plot-z has entry-a. The stable plot-a result
  must win regardless of insertion/query order, process or restart; choosing entry-a
  must fail. Run this literal comparator and real-PG close/replay fixture.
- [ ] Close result and award identity persist before bounded reward delivery; opt-out/current ACL and duplicate/restart cases preserve privacy and exactly-once reward.
- [ ] wave/cheer/admire, one reaction/account/plot/day and concurrent 50-entry cap are enforced at DB/route/window boundaries with no free-text field. The day is the resetDay reset-day key: the 02:59/03:01 realm-local fixture across a UTC midnight accepts exactly one claim per reset-day key on each side (D84).
- [ ] All six named social relations have indexed lifecycle, export/delete and row/byte/retention evidence; daily claims survive display deletion/pruning and retire only after nonregressing authority closes every readmission path. Current block/ignore/visit checks prevent cache authorization.
- [ ] All keyed window states, desktop/compact/tablet captures, content/parity checks, reviews and contribution gate pass. The NEW showcase/guestBook keys and the housing-showcase (showcase-*) and housing-guest-book (guest-book-*) scenes are in ux-spec.md and both regenerated manifests (D92).

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 36 and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-36-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Do not push the branch or open/merge a PR in this slice.
```
