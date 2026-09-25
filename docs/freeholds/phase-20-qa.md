# Phase 20 QA: audit the wave A close

Audits `phase-20-wave-a-close.md` and the complete integrated Wave A feature diff,
including cross-file behavior, authority, parity, persistence, UI and capture contracts.
Earlier individual QA is input evidence and never waives whole-wave feature review.
Verdict goes in progress.md (row 20 QA); Wave B starts only after this audit passes and
state.md records the wave B branching choice (D87).

## Complete Wave A screenshot matrix

Implementing file 20 and its QA own this complete matrix. Required baseline
sizes are desktop 1600x900, compact 874x402 and tablet 1180x820 from state "UX
screenshot viewports". Every row marked all-baseline gets a separate readable
capture at each size. Rows below group review responsibilities for readability
only. Every named state maps to its own explicit unique section 11 variant and
one image; no composite or last-state-only capture substitutes for an unobserved
arm. File names include target, scene, viewport, theme, preset, motion, input,
distribution, light/media profile and before/after identity. Missing required
after-state is a failure.

| Scenario target | Required visible state and assertion | Viewports | Primary owner |
|---|---|---|---|
| gate-own-prompt; inn-safe-landing; cottage-safe-landing | Real own-home prompt and authoritative safe room landing/exit; honest absent-surface quay baseline; no day/night or first-arrival presentation claim | All baseline | 06 |
| gate-own-choice; gate-friend-empty; gate-lookup-pending; gate-lookup-ready; gate-lookup-stale; gate-lookup-refused | Eastbrook semantic marker, real interact prompt, own/friend choice, no proximity teleport | All baseline | 06/18 |
| arrival-inn | New accepted owner transition with committed fresh first-tier directive, safe reveal, truthful plinth, welcome and no automatic panel | All baseline | 06/09/19 |
| arrival-cottage; arrival-ordinary-return; arrival-visitor | Cottage first-tier view requires fresh committed-winner directive; ordinary-return/visitor scenes have new ordinary welcome only and static camera | All baseline | 06/09/19 |
| interior-inn-day; interior-inn-night; interior-cottage-day; interior-cottage-night | Steady actual Inn/Cottage at pinned named day/night and fixed moon presets, safe static view, readable LOW window/hearth/material distinction; no build UI or fresh arrival replay | All baseline | 09; shared target extended by 11 |
| build-empty | No available furnishing copies, build.empty, no selectable item/ghost/confirm, usable tab/close | All baseline | 11 |
| build-ready; build-placed-selected; build-move-preview; build-remove-review; build-remove-refused | Owned-copy marks, palette/Trophies tab, recognizable ghost, real footprint, live decor/plinth/amenity meters | All baseline | 11 |
| build-blocked | Hatched/crossed footprint plus exact reason, confirm unavailable, full touch strip visible | All baseline | 11 |
| build-decor-full; build-plinth-full; build-amenity-full | Live used/limit and needed/remaining, no invented warning threshold, no false place success | All baseline | 11 |
| build-history-confirmed; build-history-undone; build-history-redone; build-history-stale | A real confirmed move, undo and redo, then stale inverse/refused-history explanation | All baseline | 11 |
| build-pending; build-refused; build-reconnect | Original operation pending then reconnect, last committed world, mutation paused, no duplicate send | All baseline | 11 |
| steward-bags; steward-vault; steward-automatic; steward-vault-unavailable | Actual needed/bags/vault split and all source modes, truthful source-named action | All baseline | 16 |
| steward-prepay-review | Full versioned bill batch and source deductions, covered-through date, confirmation cleanup | All baseline | 16 |
| steward-condition-30; steward-condition-29 | Condition 30 with amenity available, condition 29 with amenity paused and safe home explanation | All baseline | 13/16 |
| steward-inn | No-upkeep state with no payment component | All baseline | 16 |
| steward-pending; steward-refused; steward-reconnect | One in-flight material send, matching refusal, preserved source/week draft | All baseline | 16 |
| charter-ready; charter-reconciled (also website-desktop) | Accurate art/grant/free-room copy, current service quote and review; browser and website desktop capability | All baseline for web; desktop for website shell | 16 |
| charter-pending; charter-cancelled; charter-reconciling; charter-reconciled | Pending/cancelled/reconciled original intent, current receipt, no second purchase invitation | All baseline on allowed web | 15/16 |
| charter-quote-unavailable; charter-quote-expired | Explicit quote unavailable/stale, no zero-price fallback | All baseline on allowed web | 16 |
| charter-denied | No purchase or unapproved management component and accompanying DOM/accessibility/network assertions for every denied distribution | All baseline using injected actual surface verdict | 14/16 |
| trophies-owned; trophies-unearned-known; trophies-hidden | Eligible art, truthful known-source silhouette, hidden-source non-disclosure, no free invented feat | All baseline | 17 |
| trophies-provenance-known; trophies-provenance-unknown; trophies-maker; trophies-possession-inactive; trophies-plinth-preview; trophies-replace-review; trophies-clear-review; trophies-refreshing | Same public deed/page/mark/name/day for owner and visitor; unknown history explicit; selected plinth | All baseline | 17 |
| visit-read-only; visit-owner-away | Guest context, who-is-home, offline-owner permitted entry, Leave, absent owner controls | All baseline | 18 |
| visit-owner-building | Guest sees accepted layout plus decorating line, owner ghost absent by real wire proof | All baseline | 11/18 |
| visit-full; visit-private-refused | Authorized full refusal and privacy-safe unknown/private refusal preserve typed name | All baseline | 18 |
| visit-policy-draft; visit-policy-pending; visit-policy-saved; visit-policy-refused; visit-end-review; visit-end-pending; visit-end-succeeded; visit-revoked | Existing guest safely returned after End visit/revocation; no stale cached admission | All baseline | 18 |
| entry-pending; entry-error; entry-busy; arrival-online-delayed-cosmetics | Pending/failed room load or foreign-realm busy state, retry with no false loss/waitlist | All baseline | 06/07/18 |

Focused additions are mandatory, with the relevant baseline scene reused:

| Variant | Visible proof and nonvisual check |
|---|---|
| Parchment and highContrast/forced colors | Build blocked, Steward condition/payment and trophy provenance retain readable text/focus/shape through theme repair. |
| Reduced motion | Static arrival or immediate handback; no ghost pulse, animated hatch, auto-orbit, shimmer or flame-dependent state. Same controls and information. |
| LOW iOS and pressured light case | Explicit ios-effective-one and high-preset variants assert live light-profile state. Separate real LOW iOS/WebKit device captures prove engine/readability/input; Chromium UA emulation proves only the profile branch. |
| Keyboard | Real open/tab/grid/confirm/cancel/close sequence, focused control visible, no focus lost after relocalize or authoritative refresh. |
| Gamepad | Actual active-family glyphs and successful palette, move, rotate, nudge, confirm, undo and cancel sequence; no simultaneous combat action. |
| Touch | Real compact/tablet tap-only and drag arbitration, safe areas, target size and input floor; no action hidden under existing HUD or keyboard. |
| Portrait shell | Existing rotation-gate presentation remains correct; no claim of a playable portrait build editor. |
| Audio and mute | Separate event evidence: ordinary feedback only on a newly accepted delivered transition; no cue/directive remint on replay/resume or fresh-client recovery; commit-before-ACK may skip output. Matching placement/payment feedback, mute and spatial teardown still apply. Screenshots cannot prove sound. |
| Multiplayer/authority | Two-client public revision/privacy, full-cap/refusal, offline-owner admission and revocation; restart/receipt integration for paid results. Offline screenshot fixtures cannot prove these. |

Every owning UI file extends the source/mechanic tooltip fixture, focused painter
and invalidation/focus tests, mobile and theme guards, i18n, fairness and script
selection pins appropriate to its diff. File 20 records the screenshot manifest,
input/audio/LOW evidence, content/art finish and outstanding external release
sign-offs as gates. A screenshot is evidence of the recorded state and build,
never proof that all implementation, performance or service gates passed.

The wave close reviews the complete wave's feature code and interactions against
its actual full-wave diff and evidence. Prior per-file QA informs that integration
review but does not exclude feature behavior when the close's immediate edits are
documentation. Resolve every review finding including nits, then obtain a fresh
review of the entire fix round. Only named external signature artifacts remain
release gates; they are never deferred review findings.

The implementation plan's reviewer matrix applies to every owner: frontend,
accessibility/i18n, test coverage, render performance for materials/lights/scene
attach, parity/sim for feature behavior, and security/persistence/database review
for authority or spending. Parent implementation sessions run the shared gate
once and reviewers inspect its evidence; repeated ad hoc test runs do not replace
the canonical QA contract. This packet settles what they must build and prove.

Exact additional focused scene IDs from the section 11 manifest: build-keyboard-focused, build-pad-placement, build-touch-controls, portrait-rotation-gate, trophies-grid-focused. Each retains its declared input/view/media dimensions and one image per variant.

### Starter Prompt
```
This is Phase 20 (QA) of the Freeholds and Guildhalls feature: audit the wave A close
(the matrix results, the screenshots, the PR body, and CI when a push go was given).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.

Goal: verify that every matrix row was proved by a check that ran, that the PR body is
complete and template-conformant with the flag defaulting off, that CI is green when a
PR exists (otherwise that the recorded local gate is green at the current head), that
no "phase", wallet, token, on-chain deed, or marketplace word leaked into a native-reachable
housing path or the PR text, and that the service and counsel/Terms release handoffs are recorded; fix what the
audit finds; record a verdict.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge
  the newest origin/release/**;
  release-merge-audit after a non-empty merge; pnpm install --frozen-lockfile if patches/
  moved). A non-empty merge after a PR was opened means the PR head moved: note it for
  the CI re-check below (N/A when state.md records no push go).
- Memory scan: MEMORY.md, the test-pin traps catalog, "review the review-fix round",
  "apply ALL findings", "CI is the gate", "PR merge needs approval", "never push to fork".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("20 Wave A close" and its matrix
  table), docs/freeholds/qa-checklist.md, docs/freeholds/phase-20-wave-a-close.md (what
  was promised)
- the close diff: `git log --oneline <phase-start>..HEAD`, every fix commit and its
  reviewer report, docs/screenshots/<slug>/, docs/prd/woc/freehold-service-contract.md
- the PR body draft, recorded base/tip and exact gate evidence;
  .github/PULL_REQUEST_TEMPLATE.md; when state.md records a push go and a PR number,
  `gh pr view <number> --json title,body,baseRefName,headRefName,url,mergeable` and
  `gh pr checks <number>`; otherwise the PR/CI items read N/A (awaiting authorization)
- the matrix outputs the MATRIX agent wrote (the paths recorded in progress.md)
The agent returns: a row-by-row table of matrix claim versus recorded proof (command,
output path, assertion count); the PR body against the template section by section;
every screenshot link resolved to a committed file; the CI check list with states at
the current head when a PR exists, else the recorded local gate evidence (the
node scripts/gate_select.mjs exit code at the current head); every occurrence of
"phase", the phrase real estate (research.md section 12 ruling 9; the qa-checklist
Ownership row), "wallet", "$WOC", "mint", "trade", "holder", "marketplace", or "earn"
(the on-chain deed vocabulary) in the PR title and body and in the hudChrome.housing.*
values; never the bare word deed: the Book of Deeds, deed ids and
hudChrome.housing.trophies.deed/requireDeed are ordinary gameplay vocabulary and are
allowlisted, with a positive Book of Deeds rendering control beside the denied-surface
cases as Phase 39 states; the flag default row and its pin.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-20-wave-a-close.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Complete Wave A readiness matrix. Run qa-checklist.md over the whole reviewed
   wave, all settled D decisions and ux-spec.md; require every preceding implementation
   and QA pair PASS. Include server/offline/headless parity, dark flags (including the
   D85 flag-unset server pin: no gate prompt, furnisher stock or Hearth Key on a dark
   realm), seven surface capabilities, atomic transfer/receipt crash races, bounded DB
   workloads and content provenance. Parent runs deterministic commands once with bounded
   workers and records command/exit/output path; the pg-armed twins run after
   `npm run db:up` with TEST_DATABASE_URL set to the URL state.md's "Validation matrix"
   server/ row gives, and each such row records "pg twins executed: N tests ran, 0 skipped"
   (the local gate sets no TEST_DATABASE_URL itself). The pre-merge bar is
   node scripts/gate_select.mjs (or the deeper npm run gate), plus the Stop-hook floor; ci:changed alone is not the
   contribution gate. Fix each actual failure test-first, dispatch relevant review and
   freshly review every fix. No unreviewed nit or missing artifact becomes a PASS.
2. Exact visual and input matrix. Execute the exact screenshot target/state matrix above
   on desktop 1600x900, compact 874x402 and tablet 1180x820, using the common housing
   helper and real HUD/Sim states. The approved constructor/descriptors expand to the
   wave A set of 339 unique variants (339 of the 742-variant program inventory in
   ux-spec section 11; each later close verifies its own milestone union); one capture
   callback produces one image. A transient sequence
   ending in success never substitutes for pending/refusal/reconnect images. Required after-shots fail on missing state. Capture
   #ui on touch to show safe-area strips, not a crop that hides them. Separate evidence
   proves the sanctioned arrival sound, skip/reduced-motion camera return, actual
   gamepad sequence and true two-client visiting. Confirm all final art IDs, measured
   LOW budgets and identical actionable ghost/blocked/capacity information at every
   tier, including iOS pressure fallback. Screenshots and recordings link to actual
   checked-in evidence; no still image is treated as payment/ACL proof.
3. Production handoffs and four-week measurement artifact. Record the
   service/counsel/Terms/listing artifact package as handoff-ready, with acceptance status
   recorded as an unsigned release gate unless a signature artifact is on file, together
   with the named release gates from state.md, including the lifecycle/rollout gate: 07's
   persistence-rollout-contract.md, 07b's lifecycle-policy-binding.md and
   lifecycle-db-contract.md and 13a's upkeep-calendar-db-contract.md are named unsigned
   gates (accepted, or still a named gate) that wave A is the first close to carry;
   preserve all earlier production/store-submission sign-off gates. Create the NEW root
   TERMS_AND_CONDITIONS_FREEHOLD_DRAFT.md from docs/prd/woc/freehold-terms-amendment.md
   as a redline against TERMS_AND_CONDITIONS.md (the
   TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md precedent, kept beside the live Terms,
   never replacing them), and record the submitted storefront metadata text and its
   digest per distribution in the evidence bundle; the amendment names both artifacts.
   At the packet end,
   phase-44a-final-codex-artwork.md must replace every residual feature-created
   placeholder icon/image with final Codex artwork and emit final-artwork-audit.md.
   Then phase-44b-final-legal-handoff.md revisits the actual built system, Terms, policy,
   territory and listing copies and emits docs/prd/woc/freehold-final-legal-handoff.md
   for the legal team with tracked sign-off. No early gate is postponed to that handoff;
   report external acceptance honestly without OPEN design questions. Produce the
   four-week measured Ledger report artifact at
   docs/freeholds/ledger-calibration-report.md (NEW FUTURE; the path later closes
   extend), defined by the content/calibration manifest: approved schedule IDs and
   versions, ordinary weekly gatherer output methodology, produce/nonproduce bill composition, source-mode demand, material
   availability/tradability, outage exclusions, costs and condition/absence behavior.
   Compare to retained Cottage 10% output target using measured observations, no
   promised market price increase. Owner is Fernando with economy-service acceptance;
   no production enable until literal bills and the report are signed. If the
   observation window has not elapsed, a runnable collection/report artifact and
   scheduled owner handoff are complete, while its production release gate stays
   visibly unaccepted. No invented data or silent approval by elapsed time.
4. Durable budget review and release preparation. Create the every-second-release
   housing budget review artifact at docs/freeholds/housing-budget-review.md (NEW FUTURE)
   with named Fernando/render/performance owners,
   measured LOW device scenarios, per-room assets/bytes/triangles/light allocations,
   admitted-player visibility and decision record. No automatic capacity increase.
   Complete wiki/guide and English-key/copy sweeps. Prepare a template-compliant MVP
   PR body with scoped behavior, all proof, default-off flags, seven surface summary,
   named external release gates and the mixed-release statement: FREEHOLDS_ENABLED
   defaults off; an old client against a new server and a new client against an old
   server both follow 08a's absent/null snapshot-key semantics; housing DDL is additive
   and re-applied under ensureSchema's advisory lock with JSONB back-compat; rollback
   quiesces new housing mutations while preserving accepted recovery identities
   (migration-safety verifies the statement). The push and the wave A PR happen only
   on Fernando's push go (STEP 4, D87); without it the branch stays local.
5. Fresh review and recorded next handoff. Whole-wave qa-checklist and all actual
   architecture, cross-platform, content, render, frontend, privacy, migration,
   database-performance, server-hot-path and test-coverage reviewers inspect evidence.
   Database review
   runs before decisions and on finished diff, including query/index/byte/queue and
   disposable-PG proofs. Apply all findings and obtain a fresh fix-round verdict.
   Record screenshot matrix, calibration/report and release gates, budget review,
   the local tip or PR number, the wave B branching choice and actual next file;
   nothing is marked built by this packet audit.

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states. Missing before/after capture, skipped environment test,
  unaccepted release gate or absent artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations, no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing use,
  purchase and approved website management, including complete submodel/handler/
  catalog/DOM/accessibility/error absence on denied surfaces. These are cumulative.
- The economy service owns every price and all token math; the client forwards the
  immutable quote fingerprint and computes no tariff, conversion, discount or burn.

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, render-performance-reviewer,
content-obligations-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Re-run every matrix row the audit doubted, one vitest file at a time, plus
  `npx tsc --noEmit`; verify the recorded local gate evidence matches the CURRENT head;
  when a PR exists, confirm `gh pr checks <number>` is fully green at the CURRENT head.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code. A fix that must reach an open PR is pushed
  only if Fernando's Phase 20 go covered follow-up pushes on the same PR; otherwise
  commit locally, stop, and ask. After any push, `gh pr checks --watch` to green.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every matrix row in progress.md points at a proof that ran, not an inspection.
- [ ] The PR body is complete per the template, carries no "phase" or forbidden word,
  every screenshot link resolves, service and counsel/Terms release gates are recorded as
  unsigned release gates unless a signature artifact is on file, the lifecycle/rollout
  artifacts (persistence-rollout-contract.md, lifecycle-policy-binding.md,
  lifecycle-db-contract.md, upkeep-calendar-db-contract.md) and the two report paths
  (ledger-calibration-report.md, housing-budget-review.md) are named, the mixed-release
  and rollback statement is present, the flag default off is stated.
- [ ] The required local gate is green at the current head; when state.md records a
  push go, CI is green at the current PR head, otherwise the PR/CI criteria read N/A
  (awaiting authorization) and the row is recorded PASS, awaiting publication; all
  findings, including nits, are resolved; the complete fix round has a fresh reviewer
  verdict.
- [ ] state.md records the local tip or the PR head SHA, the wave B branching choice and
  named release gates.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "20 QA": verdict (PASS, PASS awaiting publication, or FAIL), counts
  found and fixed, external release gates. state.md: the local head or PR head SHA the
  verdict covers; anything the fixes
  changed in a ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: QA verdict (PASS, or PASS awaiting publication when no push go is recorded),
findings/fixes, release gates, the PR URL and CI state when a PR exists, exact
validation evidence, then the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-21-lodge-tier-and-upgrade.md
State in the same line that wave B starts only on the branch state.md records for it:
if the choice is "after the PR merges", the next session waits for the maintainer's
merge and syncs per STEP 0 first; otherwise wave B continues on the recorded local
branch after this QA passes.

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name phase-20-wave-a-close.md as the
  next file to re-run with the findings attached.
- Do not push the branch without a go that covers the push; never merge a PR.
```
