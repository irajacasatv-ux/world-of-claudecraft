# Phase 39: wave D close (integration matrix, screenshots, the Wards and Charters PR)

Wave D, Wards and Charters. The spec is `progress.md` "39 Wave D close"; the matrix is
`qa-checklist.md`; the PR rules are `implementation-plan.md` "PR cadence" and `state.md`
"Push policy". This is the final QA variant: it runs the whole-feature matrix over the
wave D diff (Phases 34 to 38), captures screenshots, runs the wiki pass, and opens the
wave D PR only after Fernando's push go. Both deed flags stay off. It ships no new
behavior.


Deliverables (at most five):
1. Scoped/whole-feature validation evidence required by the wave.
2. Final UX screenshots and interaction evidence.
3. Wiki and content freshness.
4. Fresh coverage/fix review and signed-artifact gate inventory.
5. Local reviewable release documentation and any separately authorized publication.
The audit session that settled this packet does not execute this future close.

### Starter Prompt
```
This is Phase 39 of the Freeholds and Guildhalls feature: wave D close (the integration
matrix over Phases 34 to 38, screenshots, the wiki pass, the Wards and Charters PR).

Harness: Claude Code (the active harness; this close is review-only, and D74 requires
Codex only for asset-creating steps). Follow the root CLAUDE.md "Working style and effort
by model" block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: prove wave D whole (every row of docs/freeholds/qa-checklist.md verified by a check
that ran, with the money and store-policy row given the deed surfaces' full attention),
commit the before/after screenshots, and open the wave D PR off the base branch with
FREEHOLDS_ENABLED and FREEHOLD_DEEDS_ENABLED defaulting off only after Fernando's push
go, then watch CI to green. Never merge.

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
- Memory scan: MEMORY.md and entries on screenshots at lowest graphics, capture rigs and
  English text, CI is the gate, never push to a fork, PR merge needs approval, the
  sensitive-material sweep, the marketplace review verdict.

ASSET EXECUTION REQUIREMENT: Every shipping asset-generation or replacement task
in this phase, including GLBs, references, icons and images, must be executed by
Codex, not Claude (D74); this review-only close runs in the active harness and hands
any asset-creating matrix fix to a Codex session. Use Codex's built-in image generation
tool (an external prerequisite: STOP if it is unavailable) following
docs/design/eastbrook-vale-rebuild/imagegen-prompts.md with rows in
imagegen-provenance.md and CREDITS.md, and the image-to-GLB workflow in
.agents/skills/woc-image-to-glb/SKILL.md, with their provenance, runtime registration,
fingerprint and in-context checks. This planning audit creates no game assets. Final
art is required here; 44a is a residual sweep, not permission to leave a placeholder
for a later phase.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the tracked release gates; D64/D65, the transfer rule; the
  Runtime safety row), with both deed flags read from their owning files:
  FREEHOLD_DEEDS_ENABLED (phase-37) and NEW allowSerializedCollectibles (phase-38
  deliverable 2, the policy switch beside allowMounts/allowMechChromas in
  server/woc_market_routes.ts),
  docs/freeholds/qa-checklist.md (every row), docs/freeholds/progress.md (rows 34 to 38
  and their QA rows, every finding disposition, the Phase 33 close record as the shape), this file
- the wave diff: `git log --oneline <wave-d-start>..HEAD` and `git diff <wave-d-start>..HEAD
  --stat --name-only`, with <wave-d-start> the tip recorded at the Phase 33 close
- .github/PULL_REQUEST_TEMPLATE.md, .claude/skills/pr-screenshots/SKILL.md,
  scripts/pr_shot_targets.mjs (the ward, guest book, ward panel, and mint card targets),
  docs/qa-gate.md (the reviewer table), docs/prd/woc/freehold-deed-service-contract.md
The agent returns: the matrix row list with the exact command per row (the money and
store-policy row's "earn" scan and token-string pins live in
tests/freehold_store_gates.test.ts), the wave diff surface list mapped to the reviewer table
(any src/sim/ path under a deed commit is a finding), the screenshot target ids (the
ward square, an exterior per tier, the ward panel with favor and Endeavors, the guest
book, the mint card on web and its absence on a native emulation; desktop, compact,
tablet), the PR body skeleton, and every resolved finding and the "Release gates" table
to state in the PR: each of the six docs/prd/woc artifacts (freehold-service-contract.md,
freehold-counsel-memo.md, freehold-terms-amendment.md, freehold-store-listing-drafts.md,
freehold-deed-service-contract.md, freehold-territory-authority-schedule.md) plus the
approved numerical rows (content-numbers-workbook.md) and the lifecycle/rollout
artifacts (persistence-rollout-contract.md, lifecycle-policy-binding.md,
lifecycle-db-contract.md, upkeep-calendar-db-contract.md), each by path with its signed
or unsigned status.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files:
- Agent MATRIX: run every row of docs/freeholds/qa-checklist.md over the wave diff, one
  command at a time, reading exit codes, with the pg-armed twins run after `npm run db:up`
  with TEST_DATABASE_URL set to the URL state.md's "Validation matrix" server/ row gives
  and the
  row recording "pg twins executed: N tests ran, 0 skipped"; for the money and
  store-policy row also run
  the seven-row matrix, the source pins, and the tests/freehold_store_gates.test.ts
  "earn" and token-string pins, and scan actual housing purchase/on-chain deed
  submodels, rendered copy, DOM, accessibility, errors and scoped build paths for
  prohibited wallet/token/mint/marketplace/holder promotion on every denied
  distribution, including Seeker and unknown-capability builds. Do not
  ban the ordinary word deed or gameplay Book of Deeds. Add a positive native Book
  of Deeds rendering/unlock control and ordinary-home entitlement control beside
  the denied on-chain housing surface cases; record the result table (row, command, result, evidence path) to a file; a row that cannot run
  is FAIL, never "looks done".
- Agent SHOTS: capture before/after screenshots through the pr-screenshots skill
  (desktop and the compact and tablet mobile targets, landscape, lowest graphics preset
  seeded before page.goto, never finding elements by English text), commit them under
  docs/screenshots/ with explicit paths, and return the markdown block for the PR body.
- Agent WIKI: `npm run wiki:content`, `npx vitest run tests/guide.test.ts`, the guide
  prose keys for wards, favor, Endeavors, Showcases, and guest books. Housing guide
  copy excludes on-chain deed/wallet/marketplace promotion, while ordinary gameplay
  Book of Deeds names and unlock guidance remain permitted and spoiler-safe. Run
  `npm run i18n:gen`.
The screenshot reviewer maps each target to docs/freeholds/ux-spec.md, including
keyboard/gamepad/touch, current focus return, reduced motion, LOW/iOS light-pressure
fallback, denied storefront submodels and final art. Referenced content/numeric/art
manifests and service/counsel/Terms/listing/territory artifacts are durable acceptance
evidence; unsigned artifacts remain named release gates, no unresolved product vote.
Then the coordinator spawns qa-checklist over the whole wave diff plus every reviewer the
matrix names for the surfaces present (the docs/freeholds/implementation-plan.md dispatch
table; privacy-security-review is mandatory for this wave), for COVERAGE, to files.
Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- FREEHOLDS_ENABLED and FREEHOLD_DEEDS_ENABLED default off and refuse every NEW housing/deed
  paid action while dark, while preserving accepted-operation recovery; NEW
  allowSerializedCollectibles (38 deliverable 2) defaults off; the
  seven-row matrix with the deed column is green; denied Seeker/App Store/Google
  Play/Steam/Epic housing purchase/deed surfaces expose no wallet, $WOC, on-chain
  deed, mint or marketplace promotion. Ordinary gameplay Book of Deeds remains
  allowed and positively tested; no housing "earn" language; the economy service owns
  every price and split; every artifact in the "Release gates" table is stated in the PR
  body with its signed or unsigned status.
- Never sell power; keystone exclusion; zero farm beds; nothing destroyed, nothing
  repossessed.
- The PR text contains the word "phase" nowhere, no em dashes, no emojis; vocabulary
  fixed; the sensitive-material sweep runs before any push (no secret, key, or service
  URL in any committed file).
- Push policy: the push happens only after Fernando's explicit go; origin only, never a
  fork; a PR is never merged by a session.

Out of scope (do NOT do in this phase):
- Unrelated new behavior or content. Every matrix/review finding, including larger
  required corrections and nits, is fixed with affected checks rerun and a fresh fix
  review before close. External signatures stay concrete release gates; no finding
  is carried into a later wave merely because of size.
- Enabling any flag anywhere; Keep, Citadel, dyes, the second SKU (wave E).

PROPOSED SERVICE AUTHORIZATION AND RECOVERY CONTRACT:
Preserve literal D9: the game server receives no distribution/channel label,
country assertion or physical-client attestation. The NEW external economy-service
issuer/verifier and policy module verify an actual eligible checkout session and
current territory under signed policy; the signed acceptance names their exact
external repository/module or interface-artifact identity and conformance proof.
Account auth, Origin, user agent, client JSON, linked stores, a desktop bridge
capability and an outgoing server secret are not physical-distribution proof.
The service binds NEW checkoutAuthorization to account, purpose/kind, SKU, policy
version, accepted quote, operation and full plot/guild/custody fingerprint. The game
consumes only the opaque protected reference and service-verified allow/refusal/effect;
it never issues eligibility from headers, accepts a channel JSON field or logs/exposes
the authorization. Unknown/malformed/unverified eligibility refuses NEW spend.
The adapter authenticates the actual service response and bounds decode before
validating the complete operation/effect/fingerprint. A signed acceptance document
is not proof of runtime cryptographic validation. Malformed or nonterminal results
never grant a local effect or prove that no debit occurred; preserve the original
operation for bounded status discovery and recovery.

NEW source ownership is explicit: 07a's
server/freehold_operation_db.ts::prepareFreeholdOperation/applyFreeholdOperation owns
protected authorization binding, fingerprint and durable receipt authority;
server/freehold_mutation.ts::commitFreeholdMutation owns atomic local effects.
Phase 15's NEW server/freehold_purchases.ts is the initial opaque quote/status/
authorization consumer; NEW server/freehold_deed_proxy.ts is the later deed consumer
of that same verified boundary. No game geo or distribution-attestation module is
introduced. These are proposed producers, not existing exports; read prepared
phase-07a-transactional-mutation-boundary.md and its QA before implementation.

Dark flags and unknown/current eligibility refuse new paid actions, not recovery of
an already accepted original operation. Receipt/status discovery, local application
or accepted compensation use its immutable outcome and original protected binding
without a new checkout session or debit. Current local entitlement, ownership, fence
and custody guards still apply. Rejected/expired new quotes need fresh confirmation;
an accepted historical quote is not a fallback new purchase. Both service conformance
and game tests cover forged eligibility inputs, cross-binding reuse, policy/territory/
expiry changes before new spend, and accepted-operation recovery after those changes.

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
- The matrix IS the validation: every row of docs/freeholds/qa-checklist.md, plus
  `npx tsc --noEmit`, `npm run ci:changed` after the LAST commit (read the exit code),
  and `node scripts/gate_select.mjs` before completion, even when CI will run later.
- Reviewers: qa-checklist plus every reviewer the matrix names (the dispatch table),
  all for COVERAGE not filtering, all to files. Name the actual wave reviewers:
  architecture-reviewer, cross-platform-sync, migration-safety, database-performance-reviewer,
  privacy-security-review, server-hot-path-reviewer, frontend-seam-reviewer,
  render-performance-reviewer, content-obligations-reviewer and test-coverage-auditor.
  Inspect existing deterministic evidence once; DB review covers decisions and final
  callers/shapes/queries. Apply ALL findings and fresh-review fixes. No push while a
  finding or required contribution check remains unsatisfied.

STEP 4 - COMMIT CADENCE:
2 to 4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(screenshots): add the ward, guest book, and Charter surface captures
- docs(wiki): regenerate the guide for wards, favor, Endeavors, and guest books
- fix(<scope>): <one commit per matrix finding, if any>
- docs(freeholds): record the wave D matrix results
Then `npm run ci:changed`; read the exit code. Then STOP and ask Fernando for the push
go (state.md "Push policy"); ask in the same message whether wave E continues on the
same branch after this PR merges or on a stacked branch (D12: one PR per wave, each off
the base), and record the answer in state.md. On the go: `git push origin <branch>`
(origin only), open the PR off the base branch recorded in state.md following
.github/PULL_REQUEST_TEMPLATE.md (summary stating both deed flags default off and the
"Release gates" table from STEP 1 with each artifact's signed or unsigned status and
"awaiting its signed acceptance" where unsigned, related issues, type of change, how it
was tested with the matrix table, the screenshots block, the checklist), then
`gh pr checks --watch`. Without the go, stop at "matrix green, awaiting push go".

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every qa-checklist.md row has a recorded result from a command that ran; no row
  is FAIL; the money and store-policy row's evidence includes the seven-row matrix, the
  source pins, the freehold_store_gates pins, and the scoped on-chain housing surface scan and ordinary Book of Deeds control.
- [ ] Screenshots (desktop, compact, tablet) are committed under docs/screenshots/ and
  referenced from the PR body, including the native absence of the mint card.
- [ ] The wiki is fresh (tests/guide.test.ts green), spoiler-safe, and store-safe.
- [ ] Either the PR is open off the recorded base with CI green (`gh pr checks --watch`)
  (push go given), or the branch is local at "matrix green, awaiting push go" with the
  PR body drafted; in both cases the body is complete per the template, no "phase" in
  the PR text, both deed flags off by default, and the "Release gates" table states the
  signed or unsigned status of freehold-service-contract.md, freehold-counsel-memo.md,
  freehold-terms-amendment.md, freehold-store-listing-drafts.md,
  freehold-deed-service-contract.md, freehold-territory-authority-schedule.md, the
  approved numerical rows and the four lifecycle/rollout artifacts accurately.
- [ ] qa-checklist and every dispatched reviewer confirm ALL findings including nits resolved, and a fresh reviewer passes the complete fix round. External signatures remain tracked release gates, never deferred review findings.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (row 39 with the matrix table, the PR number and
  URL, resolved finding counts and tracked external release gates) and docs/freeholds/state.md ("Current phase", the
  wave E start tip, the PR number or local tip, any stacked-branch choice for wave E
  under D12; the locked prestige OR and Carpenter/Mason exclusion carried into wave E).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status ("pushed, green, ready for review", or "matrix green, awaiting
push go" if the go has not come), the PR URL when one exists, the matrix summary,
review verdicts, resolved findings, the locked prestige and future-craft handoff scope,
and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-39-qa.md

STOPPING RULES:
- Stop at "matrix green, awaiting push go" until Fernando sanctions the push; never
  push on your own judgment.
- Stop at "pushed, green, ready for review"; never merge a PR; never enqueue it.
- A red matrix row that needs more than a one-commit fix stops the close: record it and
  name the owning phase file to re-run.
- Do not push the branch without the go; never merge a PR.
```
