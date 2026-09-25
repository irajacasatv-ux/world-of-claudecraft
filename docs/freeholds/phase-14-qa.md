# Phase 14 QA: audit the distribution surface map

Audits `phase-14-distribution-surface-map.md`. Verdict goes in `progress.md` (row "14
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 14 (QA) of the Freeholds and Guildhalls feature: audit the distribution
surface map (the pure module, the seven-distribution matrix, the two HudFeatures rows
freeholdPurchaseEnabled and freeholdManageOnWebsite, the store-policy source pins, the
"earn" scan, the locked Seeker use-only capability).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 14 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "14 Distribution surface map", missing tests,
dead code, the fail-closed arms, the unchanged verdicts of the two gates that read the
map and the untouched resolveWalletCapability, the main.ts firewall, and the store-policy pins; fix what the audit finds; record a verdict.

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
- Sync the base per state.md "Worktree, base, and merge-forward" (merge the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the source-scan traps (a scoped
  scan falling back to whole-file; guard exemptions must be POSITIVE), "review the
  review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("14 Distribution surface map" and
  the row), docs/freeholds/phase-14-distribution-surface-map.md (what was promised)
- the Phase 14 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 14)
- the pins the diff claims: tests/distribution_surfaces.test.ts,
  tests/freehold_store_gates.test.ts, tests/wallet_connection_view.test.ts,
  tests/woc_market_wiring.test.ts, tests/client_shell.test.ts,
  tests/electron_desktop_config.test.ts
The agent returns: the promised-versus-delivered table per deliverable, the seven-row
matrix as the test actually asserts it (every field per distribution), the before and
after verdict tables of wocMarketAttachAllowed and the Claudium attach plus proof that
resolveWalletCapability is untouched, where the HudFeatures rows are injected and
consumed, the allowlist the source pin uses, and any TODO, unused import, or arm that
resolves true on a missing probe.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-14-distribution-surface-map.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Independent surface capabilities. distribution_surfaces.ts is the pure
   src/game junction receiving walletEnabled and verified shell/mobile probes.
   Keep existing wallet, exchange and claudiumStore verdicts unchanged. The map's housing
   fields are exactly three: freeholdPurchase, freeholdManageOnWebsite and deedSurfaces
   (D91). Housing use is not a map field: it is the server entitlement gate (flag plus
   entitlement) read through the housing facet, and it stays behind the accepted
   entitlement-model release gate. Purchase is browser web/website-distributed desktop
   only. deedSurfaces is owned here as this phase's source pin (on only for web and
   website desktop through the strict wocExchangeSupported semantics, off on the five
   denied rows) and is consumed by 38 from the map through main.ts; 38 changes no
   distribution row and adds no HudFeatures row. Seeker is use-only with deeds off.
   Missing/throwing/malformed/unknown probes fail closed. Website management is not
   inferred from purchase denial: freeholdManageOnWebsite defaults off on every row,
   browser web and website desktop included, and the map takes a per-row written
   approval input that only the surface artifact's recorded approval can set; the
   default fixture asserts management false on all seven rows.
2. Composition and source boundaries. main.ts injects exactly two HudFeatures rows,
   freeholdPurchaseEnabled and freeholdManageOnWebsite (D91), from the map's two
   matching fields; there is no housing-use row and no deed row in HudFeatures. No UI
   reader branches on NATIVE_APP or
   distribution strings. resolveWalletCapability stays in src/net, which never imports
   src/game. The server does not trust client platform claims as payment authority.
   Existing wallet/Exchange/store behavior remains unchanged while the housing map
   governs its complete optional purchase model.
3. Seven-distribution matrix and absence proof. tests/distribution_surfaces.test.ts
   drives actual Electron stamps and normalizeSolanaMobileCapabilities for web,
   website desktop, Steam, Epic, App Store, Google Play and Seeker. Assert every field,
   missing-input dimension and independently approved management outcome. This is the
   only seven-row matrix: a HUD-level consumer test (16's
   tests/woc_store_window_contract.test.ts) produces its rows by calling the real
   distribution_surfaces verdict function with this phase's probe fixtures and feeding
   the two housing fields into the Hud features bag, never by hand-written boolean
   pairs. Denied housing purchase is a runtime absence contract (D86): no row, handler,
   quote request, fetched catalog, hidden DOM, error/money copy or accessibility node,
   asserted by DOM, handler and recorded-request scans, never bundle scans; purchase
   code and English keys ship dormant in every bundle under the runtime capability, and
   the review notes and the 44b handoff say "not rendered or reachable", never "absent
   from the bundle". Positive path allowlists and mutation
   probes prove source scans cannot exempt an unclassified housing path.
4. Exact language and approval artifacts. All visible housing labels use
   hudChrome.housing.* as specified in ux-spec.md; neutral management copy is shown
   only where its independent capability permits it. Purchase benefits describe
   cosmetic, convenience and access; no earn/income/yield or native/Steam/Epic token,
   wallet or on-chain-deed marketing. Ordinary Book of Deeds source names remain
   gameplay. Cross-link the counsel memo, Terms/listing and service artifacts in
   state.md (handoff-ready; acceptance status recorded as an unsigned release gate
   unless a signature artifact is on file); their external acceptance is a release
   gate, not an implementation question or a claim of platform approval. The web-only
   allowlist of tests/freehold_store_gates.test.ts is a positive list of paths: the
   charter.* and steward.manageWebsite keys of hudChrome.housing.* (D92) and, when 38
   lands them, the hudChrome.housing.deed.* key block plus 38's NEW
   src/ui/deed_card_view.ts and deed_card_window.ts modules and its Homes tab leaf,
   which 38 registers in this allowlist in the same change as its own
   mutation probe; any on-chain word outside the allowlist fails the pin, and every
   allowlist extension carries its own mutation probe. This phase regenerates
   ux-key-manifest.json (its two rows steward.manageWebsite and
   steward.manageWebsiteAria, owner 14) in its own change with every cited count
   updated (D92); it adds no ux-shot-manifest.json variant.
   Preserve literal D9: the game server stays unaware of distribution. Existing
   account auth, Origin/UA/JSON, linked platform accounts and desktop capability probes
   cannot authenticate a checkout channel. The economy service's NEW issuer/verifier
   owns opaque account/purpose/SKU/policy/quote/operation-bound authorization; the game
   receives only the validated effect through its narrow host seam. The signed service
   artifact names exactly which fact is proven; the current tree has no such complete
   issuer/verifier. Unknown eligibility refuses new spend while confirmed payments
   keep original-key recovery. UI absence and this payment authority are separate gates.
5. Regression and accessibility proof. Preserve existing wallet/Exchange/Claudium
   tests, pin new HudFeatures wiring and source scans, and test absent submodels
   through DOM, accessibility and recorded requests as well as pure booleans. Run
   frontend-seam-reviewer and privacy-security-review, followed by fresh fix review.
   Exact money-gate and service-price rules below apply to implementation and QA.

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
  while dark; (3) the seven-distribution surface map independently gates housing purchase,
  approved website management and the deed surfaces (housing use is the server
  entitlement gate read through the housing facet, never a map or HudFeatures row, per
  D91), including complete submodel/handler/catalog/DOM/accessibility/error absence on
  denied surfaces as the D86 runtime contract. These are cumulative.
- The economy service owns every price and all token math; the client forwards the
  immutable quote fingerprint and computes no tariff, conversion, discount or burn.

STEP 3 - VALIDATION:
Required named reviewers for this file: privacy-security-review, frontend-seam-reviewer,
test-coverage-auditor, qa-checklist.
- Run the Phase 14 STEP 3 suite list plus `npx tsc --noEmit`; confirm the regenerated
  ux-key-manifest.json (two owner-14 rows, counts updated) is in the phase diff.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 14 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "14 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row or the
  locked Seeker capability.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-15-claudium-charter-and-call.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 14 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
