# Phase 14: the distribution surface map

**Premise moved at the 2026-09-26 release sync (G4, docs/freeholds/state.md, "Premises the 2026-09-26 sync moved"):** the Exchange gate now has two consumers, the in-world window and the character-select read-only browse (src/game/charselect_woc_market_wiring.ts); the map folds both.

Wave A, the Cottage MVP. The spec is `progress.md` "14 Distribution surface map"; the
decision is `state.md` D9 (one pure client module, a seven-distribution matrix, a
`HudFeatures` row, a client gate STRICTER than the Claudium store's `!NATIVE_APP` rule),
refined by D91 (exactly two `HudFeatures` rows), D86 (runtime absence) and the
store-safe rules of proposal section 8. This phase ships the module the three
existing gates fold into, the seven-row matrix test, the source pins that keep housing
behind the gates, the "earn" copy denial, and the locked Seeker use-only capability. It ships NO
purchase surface: those arrive in Phases 15 and 16 behind what this map allows.

### Starter Prompt
```
This is Phase 14 of the Freeholds and Guildhalls feature: the distribution surface map
(src/game/distribution_surfaces.ts, the seven-distribution matrix, the two HudFeatures
rows freeholdPurchaseEnabled and freeholdManageOnWebsite, the source pins, the copy
scan, the locked Seeker use-only capability).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (one pure module plus pins).

Goal: answer "which housing surfaces may this build show" in ONE pure module that every
existing distribution gate calls without changing its verdict, pin the answer for all
seven distributions through the real Electron config stamps, and prove by source pins
that no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string ships in a housing path a native,
Steam, or Epic build can reach.

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
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. PR #3872 has merged, so discover the newest
  release branch (`git branch -r | grep 'origin/release/' | sort -V | tail -1`), compare
  with `git rev-list --left-right --count HEAD...origin/release/<newest>`, and merge it.
  After any non-empty merge run the release-merge-audit skill;
  `pnpm install --frozen-lockfile` if the merge touched patches/.
- Memory scan: MEMORY.md and entries on the vanilla frontend stack, src/main.ts as a
  firewall, the Electron desktop app and its capability probes, the woc marketplace
  hardening packet (the Exchange gate), source-scan traps (a scoped scan falling back to
  whole-file; guard exemptions must be POSITIVE), test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "14 Distribution surface
  map"), and this file
- src/net/wallet_capability.ts (resolveWalletCapability, SolanaMobileCapabilities,
  WalletCapabilityBridge, the decision table), src/net/native_solana_mobile.ts
  (normalizeSolanaMobileCapabilities: unknown fails closed, absent plugin fails closed),
  src/game/woc_market_wiring.ts (wocMarketAttachAllowed, wocMarketBrowserHandoffAllowed,
  the anti-steering rationale in its header), src/client_origin.ts (NATIVE_APP,
  DESKTOP_APP), src/runtime.ts (isDesktopAppRuntime, DesktopBridge, desktopBridge)
- src/main.ts: the walletCapabilityReady composition, the `if (!NATIVE_APP)
  hud.attachClaudium(claudiumHooks)` attach and its comment, the HudFeatures injection
  (dailyRewardsEnabled), wireWallet; src/ui/hud.ts HudFeatures and its one consumer
  (dailyRewardsEnabled)
- electron/desktop_config.cjs (resolveDistribution, the website/steam/epic stamps,
  wocExchangeSupported: literal 'website' only, fail closed on absent or malformed),
  electron/main.cjs (the desktop-wallet-capability and desktop-exchange-capability IPC
  answers), electron/preload.cjs (the four capability probes on window.wocDesktop),
  android/app/build.gradle (the play and solanaStore flavors)
- src/ui/store_promo_card.ts (shouldShowStorePromo), src/ui/steam_wishlist.ts
  (steamWishlistSuppressed), src/ui/terms_link.ts and src/ui/wiki_link.ts (NATIVE_APP
  hrefs), src/styles/hud.css (the body.native-app and body.desktop-app static rules)
- tests/wallet_connection_view.test.ts ("wallet host capability"),
  tests/woc_market_wiring.test.ts ("pins the four distribution outcomes through the real
  shell decision", "attaches nothing inside a refused shell", "main.ts stays a
  firewall"), tests/electron_desktop_config.test.ts, tests/electron_ipc_channels.test.ts
  (the preload method list), tests/client_shell.test.ts ("excludes wallet surfaces from
  unverified native and Steam builds while allowing Seeker"), tests/store_promo_card.test.ts,
  tests/steam_wishlist.test.ts, tests/native_solana_mobile.test.ts,
  tests/woc_store_window_contract.test.ts
- src/ui/i18n.catalog/hud_chrome.ts (the housing namespace as Phases 05 to 13 left it),
  .githooks/pre-push (the copy-rule scan: it covers dashes and emojis only; package.json
  has no copy:scan script)
- src/net/CLAUDE.md (src/net never imports src/game; main.ts is the junction),
  src/game/CLAUDE.md, root CLAUDE.md "Modularity"
The agent returns: the three existing decision tables side by side (wallet, Exchange,
Claudium store) per distribution; the exact input each gate reads (flags, probes, the
capability triple); the HudFeatures injection recipe; how the woc_market_wiring test
drives the REAL desktop_config stamps (the shape the seven-row matrix copies); the
source-pin shape in client_shell.test.ts; what the tree says about Seeker today (the
Claudium store attaches only when !NATIVE_APP, so no Claudium purchase surface exists on
any native build, Seeker included); every place the word "earn" could be scanned.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

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

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) written counsel acceptance, published accepted Terms/
  listing artifacts and the accepted economy-service contract before production enable
  or any housing-bearing store submission; external sign-off status lives in state.md;
  (2) FREEHOLDS_ENABLED defaults off and the server refuses/hides housing purchases
  while dark; (3) the seven-distribution surface map independently gates housing purchase,
  approved website management and the deed surfaces (housing use is the server
  entitlement gate read through the housing facet, never a map or HudFeatures row, per
  D91), including complete submodel/handler/catalog/DOM/accessibility/error absence on
  denied surfaces as the D86 runtime contract. These are cumulative. Dark means D85:
  the sim's freeholdsEnabled boot config beside devCommands on the SimConfig seam spawns
  no gate, furnisher or Hearth Key on a dark realm, and the offline host stays live
  under D3.
- The economy service owns prices and token math: the map answers "may this build show
  a purchase surface", never "what does it cost".
- Store policy: no purchase surface and no wallet, $WOC, on-chain deed, or marketplace string in
  any App Store, Google Play, Steam, or Epic path; no "earn" language; housing use
  follows its approved entitlement release gate through the housing facet; a neutral
  website line still requires the independently approved freeholdManageOnWebsite
  capability, off by default on every row.
- The server never learns the distribution (the map is client-only); nothing in
  src/sim/ or server/ changes.
- src/net never imports src/game; the map lives in src/game/ and is injected through
  main.ts (the firewall), never read inside src/net.
- Graphics and tier knobs stay gameplay-neutral (untouched here).
- i18n: the policy in docs/freeholds/implementation-plan.md; the management English key is
  hudChrome.housing.steward.manageWebsite (neutral, no store name).
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any Claudium branch, SKU, or purchase flow (Phase 15).
- Any window, store row, button, or panel (Phase 16).
- Native billing, a native IAP SKU, or a Seeker wallet rail for housing: the locked Seeker use-only capability
  is already locked; no native housing billing is in scope.
- Deed surfaces beyond the map row (Wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: privacy-security-review, frontend-seam-reviewer,
test-coverage-auditor, qa-checklist.
- Run: `npx tsc --noEmit`; `npx vitest run tests/distribution_surfaces.test.ts`;
  `npx vitest run tests/freehold_store_gates.test.ts`; `npx vitest run
  tests/wallet_connection_view.test.ts tests/woc_market_wiring.test.ts
  tests/client_shell.test.ts tests/electron_desktop_config.test.ts
  tests/electron_ipc_channels.test.ts tests/store_promo_card.test.ts
  tests/steam_wishlist.test.ts tests/native_solana_mobile.test.ts
  tests/woc_store_window_contract.test.ts tests/architecture.test.ts
  tests/hud_update_drive.test.ts tests/monolith_budget.test.ts`; `npm run i18n:gen` then
  `npx vitest run tests/i18n_completeness.test.ts tests/localization_fixes.test.ts`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md,
  the full roster above: frontend-seam-reviewer (the two HudFeatures rows and the main.ts
  firewall), privacy-security-review (the store-policy pins and the fail-closed arms),
  test-coverage-auditor (the seven-row matrix, the mutation probes, the allowlist) and
  qa-checklist (the whole diff). Prompt each for COVERAGE not filtering; each writes its
  report to a file. Do not commit until ALL findings, including nits, are resolved
  consistently with locked rulings and the fixes have fresh review.

- Required reviewers for the complete settled diff: frontend-seam-reviewer,
  privacy-security-review, test-coverage-auditor and qa-checklist (the same four as the
  required list above).

STEP 4 - COMMIT CADENCE:
3 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(game): resolve every distribution surface from one pure map
- feat(ui): add the freeholdPurchaseEnabled and freeholdManageOnWebsite HUD features
- test(client): pin the housing store policy per distribution
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] tests/distribution_surfaces.test.ts has exactly seven distribution cases driven
  through the real Electron stamps and the real capability normalizer, each asserting
  every field of the map by literal (freeholdPurchase, freeholdManageOnWebsite,
  deedSurfaces and the unchanged wallet/exchange/claudiumStore verdicts), plus a
  fail-closed case per input dimension; the default fixture asserts
  freeholdManageOnWebsite false on all seven rows and the per-row approval input flips
  only the row it names.
- [ ] resolveWalletCapability is untouched (the diff shows no change under src/net) and
  its result feeds the map through main.ts; wocMarketAttachAllowed and the Claudium
  attach read the map; their existing suites pass UNCHANGED.
- [ ] Exactly two HudFeatures rows, freeholdPurchaseEnabled and freeholdManageOnWebsite,
  are injected from main.ts and consumed nowhere yet (Phase 16 consumes them); the
  HudFeatures shape pin in tests/woc_store_window_contract.test.ts fails on a third
  housing row; the main.ts firewall pin holds.
- [ ] tests/freehold_store_gates.test.ts fails when a wallet, $WOC, on-chain deed, mint,
  or marketplace string is planted in a housing path outside the positive web-only
  allowlist named in deliverable 4, and when "earn" is planted in a hudChrome.housing.*
  value (prove both with a temporary mutation, then revert); the absence assertions are
  DOM, handler and recorded-request scans, never bundle scans (D86).
- [ ] The locked Seeker row is use-only (use is not a map field), deeds off and
  management off unless the complete destination/flow has written approval. Independent
  management authorization is pinned; no implicit purchase-denied fallback or native
  billing deferral remains.
- [ ] ux-key-manifest.json is regenerated in this phase's diff with the two owner-14
  steward.manageWebsite and steward.manageWebsiteAria rows and every cited count
  updated (D92).
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 14, notes, named unsigned gates) and
  docs/freeholds/state.md (the per-phase ledger row 14: the module, the two HudFeatures
  rows freeholdPurchaseEnabled and freeholdManageOnWebsite, the deedSurfaces source pin
  38 consumes, the two test files, the two i18n keys and the regenerated manifest; the
  locked Seeker use-only capability
  under Locked decisions and release gates).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-14-qa.md

STOPPING RULES:
- Stop and ask if folding an existing gate into the map would change ANY existing
  verdict (the fold is move-not-rewrite; a verdict change is a Fernando decision).
- Stop if a changed tree invalidates the approved distribution matrix; record the
  fact in state.md before dependent edits. Existing wallet support never widens
  the locked Seeker housing purchase capability.
- Do not push the branch; never merge a PR.
```
