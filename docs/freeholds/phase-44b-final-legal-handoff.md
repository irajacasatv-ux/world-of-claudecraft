# Phase 44b: final Terms and legal-team handoff against completed implementation

This implementation file and its QA are the complete contract for this bounded slice.
The locked decisions in `state.md`, the content/measurement manifests and `ux-spec.md`
are authoritative. Nothing in this planning packet is marked built.

### Starter Prompt
```
This is Phase 44b of the Freeholds and Guildhalls feature: final Terms and legal-team handoff against completed implementation.

Harness: Claude Code. Follow the root CLAUDE.md working-style block for effort and
fan-out; this prompt names no model.

Goal: revisit every Terms/legal/platform/service promise against the completed feature and final artwork, then produce the concrete review package and tracked sign-off handoff for the legal team.

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
- Memory scan: MEMORY.md and entries on screenshots at lowest graphics, capture rigs and
  English text, CI is the gate, never push to a fork, PR merge needs approval, the
  sensitive-material sweep, tooling improvements at session end.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- state.md D73, every prior paid-release gate and actual signed status, completed 44
  and 44a/QA evidence, final-artwork-audit.md, ux-spec.md and the full implemented diff.
- docs/prd/woc/freehold-counsel-memo.md, freehold-terms-amendment.md,
  freehold-store-listing-drafts.md, freehold-service-contract.md,
  freehold-deed-service-contract.md and freehold-territory-authority-schedule.md.
- The live governing documents the drafts must reconcile: public/terms.html ("Last
  updated: 25 August 2026") section 8 ("We do not sell virtual items or currency" and
  "modify, remove, reset, or wipe ... without liability or compensation"), section 9
  (token issuance: "We do not issue, mint, control, manage, promote as an investment,
  or guarantee the $WOC token"), section 12 ("reset or wipe data"), section 19
  (termination: "On termination, your licence to use the Service ends" plus the
  marketplace escrow sentence) and section 22 (the marketplace "is not available in the
  App on any platform", the one-document pattern the housing deed schedule adopts);
  public/privacy.html ("Last updated: 21 June 2026") section 2 (wallet verification
  "does not involve any transaction"), section 6 (inactive-account deletion) and
  section 8 (the in-game deletion option versus the soft-deactivation code in
  server/account.ts); TERMS_AND_CONDITIONS.md; TERMS_AND_CONDITIONS_MARKETPLACE_DRAFT.md
  (the counsel redline precedent, with its open [COUNSEL] questions on shared sections
  8, 9 and 10 and the section 17 liability cap); and src/ui/terms_link.ts (every shell
  links the one canonical Terms
  URL). The handoff names each clause and the amendment's disposition for it (redline,
  disclaimer or leave).
- Actual account entitlement, distribution presentation, service authorization,
  quotes/settlement/refunds, no-loss upkeep, transfer/custody, privacy/export/deletion,
  moderation, art/IP/provenance and rollout/recovery behavior and their test evidence;
  the support-reconciliation ownership statement the revised
  freehold-service-contract.md carries (service-owned, operator-authenticated tooling on
  the economy service; the game applies accepted outcomes only through the 07a/15
  original-operation recovery reader and owns no operator route or admin page) and the
  refund-drill evidence that depends on it.
- Current primary platform/legal source documents cited in the package, including the
  Solana Mobile Publisher Policy at its current host
  https://legal.solanamobile.com/publisher-policy-web (the solanamobile.com URL answers
  a 308 redirect there; retrieved 2026-09-06, "Last Updated: Jul 21, 2026", part of the
  dApp Store Developer Agreement), the dApp Store Developer Agreement as a named
  acceptance artifact and the dApp Store Terms of Use at
  legal.solanamobile.com/en/dapp-store-tos; an inaccessible current text stays a named
  counsel artifact gate. Legal counsel owns applicability and approval, not this coding
  session's policy inference.
- docs/freeholds/ux-spec.md and the signed content, measurement, service and policy
  artifacts referenced by state.md that this slice consumes.
The agent returns: a clause-by-clause implemented-versus-promised matrix, changed facts since early
drafts, current primary-source retrieval/limitations, signed-artifact inventory and
the legal team's precise required determinations. This is the final revisit the user
requested, never permission to enable a paid surface before its earlier counsel,
Terms, service, territory and platform gates have been accepted.
All design rulings are locked; a missing required signed artifact keeps its release
gate closed and produces a named validation result, never a guessed runtime value.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Deliverables (at most five):
Assign disjoint implementation ownership by the following 5 deliverables.
The coordinator alone edits shared parity/command/snapshot/monolith pins after workers
finish. Workers receive only the context report and owned files, preserve others' edits,
and return full reports to the scratchpad with a path and short summary.
1. Completed-feature evidence matrix: create planned
   docs/prd/woc/freehold-final-legal-handoff.md with exact implementation/commit scope,
   clause/surface/operation mapping, screenshots/tests, final artwork provenance and
   every already accepted or still external determination. Describe actual effects,
   eligible checkout authorization, transfer manifest, no-loss protection and the
   purchase-submodel absence contract plainly (D86: absence on a denied storefront is a
   runtime contract with no DOM node, handler, request, fetched catalog, error copy or
   accessible text, while purchase code and English keys ship dormant in every bundle
   under the runtime capability; the review notes say "not rendered or reachable", never
   "absent from the bundle", and counsel confirms this line item); do not substitute the
   earlier proposal for verified built behavior.
2. Terms and player-copy revisit: refresh the concrete Terms amendment, counsel memo
   and seven-distribution listing/review-note drafts to match the final behavior.
   Include account entitlement versus optional deed, custody/refund/cancellation,
   material/upkeep/Call effect, cosmetic/access limits and privacy/retention details.
   Preserve the housing language and source-key rules (D92: hudChrome.housing.* as pinned
   by ux-spec and ux-key-manifest.json is the only key family; the drafts adopt those
   ids). Proposed legal drafting is
   clearly marked for legal-team review, never presented as approved legal advice.
3. Service/platform/territory reconciliation: check the final service/deed contracts,
   accepted issuer/verifier evidence, published catalog/settlement, authority schedule,
   current primary platform terms and exact enabled/rejected rows against actual
   conformance. Preserve literal D9 and original-operation recovery. Missing current
   external evidence is a named artifact/sign-off release gate, not a guessed policy
   conclusion or new country/fee. A new implementation mismatch is fixed and reviewed
   before this package claims ready for legal review.
4. Concrete legal-team handoff: assemble the final memo/Terms redline/listing/service/
   territory/art evidence bundle, concise review brief and explicit determination
   checklist for the legal team. Record legal-team owner, Fernando's routing owner,
   artifact revision, handoff-ready/delivered/accepted status, dated response evidence
   and exact release gates in state.md. Prepare a reviewable cover message and safe
   artifact links. Delivery requires an authorized recipient/channel; never invent
   contact details or claim a draft was sent. This docs audit sends no legal message.
   The handoff artifact remains complete even while external review is pending.
5. Final completeness and preservation audit: validate the entire chain through 44b QA,
   all approved decisions, final-art inventory, exact anchors and legal/economy gate
   status. Run the proportional contribution gate and fresh coverage/fix review.
   Preserve all packet, UX, decision, content/art and legal/service sources. Mark
   implementation packet complete only after 44b QA passes; external review/sign-off,
   authorized publication and deployment retain their separate truthful statuses.
   Any later scaffolding cleanup is a separate explicitly authorized task with
   reviewed durable preservation/link proof, never an action in 44/44a/44b.

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


Out of scope:
Game/art generation, new product mechanics, selecting legal jurisdictions or fees, automatic external messages, release/deploy enablement, packet deletion or claiming counsel acceptance.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run git diff --check on the exact updated documentation; validate every local
  link, implementation symbol/test citation, service/art evidence path and full packet
  STEP/next-file/language lint. Follow docs/qa-gate.md for this documentation change,
  including node scripts/gate_select.mjs when required, and the Stop-hook floor.
- Refresh and cite current primary platform/legal documents; record inaccessible
  current text as an explicit counsel artifact requirement. Do not claim counsel
  review, store submission, actual delivery or external-service tests occurred when
  only documents or earlier evidence were inspected.
- Run node scripts/gate_select.mjs before completion; npm run ci:changed is not a
  substitute. Re-run only affected checks after fixes, then verify the final head.
- Dispatch privacy-security-review, migration-safety, database-performance-reviewer, cross-platform-sync, frontend-seam-reviewer, test-coverage-auditor and qa-checklist
  for the stated surfaces; actual additional surfaces trigger their canonical reviewer.
  Additional database changes would require their own pre/final review. Every report
  uses COVERAGE, BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT, saved to a file.
  Apply ALL findings including nits; a fresh reviewer reads the fix round.

STEP 4 - COMMIT CADENCE:
Commit each coherent owned deliverable with a scoped Conventional Commit and a body.
Stage EXPLICIT task paths, never git add -A. No coauthor trailer, em dash, en dash,
emoji, or word "phase" appears in a commit message. Keep generated output with its
authoring source. Run npm run ci:changed after the last commit and read its exit code.

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] The final handoff maps every Terms/legal/platform/service promise to the actual
  completed feature and final artwork, with precise evidence, the named live Terms and
  Privacy clauses with their dispositions, the D86 dormant-submodel line item, the
  support-reconciliation ownership statement and no unsupported policy or approval claim.
- [ ] Concrete counsel/Terms/listing/service/deed/territory documents are reconciled and reviewable; earlier paid-release gates remain cumulative and enforced.
- [ ] The legal-team package, cover-message draft, owners, revision and external sign-off/release-gate tracking are complete; delivery status is truthful and no recipient/channel is invented.
- [ ] Full chain/anchors/language/final-art and proportional QA/fresh fix review pass,
  all durable sources remain, and 44b QA alone is the terminal implementation-packet
  audit.

STEP 6 - DOC UPDATES + MEMORY:
Update progress.md row 44b and state.md's implementation ledger with actual paths,
commands, wire/schema contracts, screenshots, signed-artifact evidence and gate status.
Record facts learned; do not reopen the locked product rulings or mark a release gate
accepted without its signed artifact. Numeric tables are literal, provenance-backed
and approved before activation.

STEP 7 - FINAL RESPONSE FORMAT:
Report status, touched files, exact validation commands and outcomes, reviewer verdicts,
tracked release gates and the FULL PATH of the next file:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-44b-qa.md

STOPPING RULES:
A failed acceptance check stops completion. Preserve state on failed mutation, decode,
quote, capacity, lease or revision checks. No widening of a monolith ceiling or silent
change to a locked ruling. Push 44b commits to an open wave E PR only under a go that
covers follow-up pushes; otherwise stop and ask; never open or merge a PR in this slice.
```
