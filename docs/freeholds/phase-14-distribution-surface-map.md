# Phase 14: the distribution surface map

Wave A, the Cottage MVP. The spec is `progress.md` "14 Distribution surface map"; the
decision is `brainstorm.md` D9 (one pure client module, a seven-distribution matrix, a
`HudFeatures` row, a client gate STRICTER than the Claudium store's `!NATIVE_APP` rule)
and the store-safe rules of proposal section 8. This phase ships the module the three
existing gates fold into, the seven-row matrix test, the source pins that keep housing
behind the gates, the "earn" copy denial, and the locked Seeker use-only capability. It ships NO
purchase surface: those arrive in Phases 15 and 16 behind what this map allows.

### Starter Prompt
```
This is Phase 14 of the Freeholds and Guildhalls feature: the distribution surface map
(src/game/distribution_surfaces.ts, the seven-distribution matrix,
HudFeatures.freeholdPurchaseEnabled, the source pins, the copy scan, the locked Seeker use-only capability).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
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
That final sweep does not postpone artwork owned here.44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

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
   Keep existing wallet, exchange and claudiumStore verdicts unchanged. Housing has
   independent usable, freeholdPurchase, freeholdManageOnWebsiteLine and deedSurfaces
   capabilities; purchase is browser web/website-distributed desktop only. Seeker is
   use-only with deeds off. Missing/throwing/malformed/unknown probes fail closed.
   Housing use remains behind the accepted entitlement-model release gate. Website
   management is not inferred from purchase denial: denied storefronts default off
   until the complete destination/flow has written approval in the surface artifact.
2. Composition and source boundaries. HudFeatures injects housing-use, purchase and
   approved management rows through main.ts; no UI reader branches on NATIVE_APP or
   distribution strings. resolveWalletCapability stays in src/net, which never imports
   src/game. The server does not trust client platform claims as payment authority.
   Existing wallet/Exchange/store behavior remains unchanged while the housing map
   governs its complete optional purchase model.
3. Seven-distribution matrix and absence proof. tests/distribution_surfaces.test.ts
   drives actual Electron stamps and normalizeSolanaMobileCapabilities for web,
   website desktop, Steam, Epic, App Store, Google Play and Seeker. Assert every field,
   missing-input dimension and independently approved management outcome. Denied
   housing purchase means no row, handler, quote request, fetched catalog, hidden DOM,
   error/money copy or accessibility node. Positive path allowlists and mutation
   probes prove source scans cannot exempt an unclassified housing path.
4. Exact language and approval artifacts. All visible housing labels use
   hudChrome.housing.* as specified in ux-spec.md; neutral management copy is shown
   only where its independent capability permits it. Purchase benefits describe
   cosmetic, convenience and access; no earn/income/yield or native/Steam/Epic token,
   wallet or on-chain-deed marketing. Ordinary Book of Deeds source names remain
   gameplay. Cross-link the counsel memo, Terms/listing and accepted service artifacts
   in state.md; their external acceptance is a release gate, not an implementation
   question or a claim of platform approval.
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
  while dark; (3) the seven-distribution surface map independently gates housing use,
  purchase and approved website management, including complete submodel/handler/
  catalog/DOM/accessibility/error absence on denied surfaces. These are cumulative.
- The economy service owns prices and token math: the map answers "may this build show
  a purchase surface", never "what does it cost".
- Store policy: no purchase surface and no wallet, $WOC, on-chain deed, or marketplace string in
  any App Store, Google Play, Steam, or Epic path; no "earn" language; housing use follows its approved entitlement release gate; a neutral website line
  still requires independently approved management capability.
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
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md:
  frontend-seam-reviewer (the HudFeatures rows and the main.ts firewall) and
  privacy-security-review (the store-policy pins and the fail-closed arms). Prompt each
  for COVERAGE not filtering; each writes its report to a file. Do not commit until ALL findings, including nits, are resolved consistently with
  locked rulings and the fixes have fresh review.

- Required reviewers for the complete settled diff: frontend-seam-reviewer and privacy-security-review.

STEP 4 - COMMIT CADENCE:
3 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(game): resolve every distribution surface from one pure map
- feat(ui): add the freehold purchase and manage-on-website HUD features
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
  every field of the map by literal, plus a fail-closed case per input dimension.
- [ ] resolveWalletCapability is untouched (the diff shows no change under src/net) and
  its result feeds the map through main.ts; wocMarketAttachAllowed and the Claudium
  attach read the map; their existing suites pass UNCHANGED.
- [ ] HudFeatures.freeholdPurchaseEnabled and freeholdManageOnWebsite are injected from
  main.ts and consumed nowhere yet (Phase 16 consumes them); the main.ts firewall pin
  holds.
- [ ] tests/freehold_store_gates.test.ts fails when a wallet, $WOC, on-chain deed, mint,
  or marketplace string is planted in a housing path outside the web-only allowlist, and
  when "earn" is planted in a hudChrome.housing.* value (prove both with a temporary
  mutation, then revert).
- [ ] The locked Seeker row is use-only, deeds off and management off unless the
  complete destination/flow has written approval. Independent management authorization
  is pinned; no implicit purchase-denied fallback or native billing deferral remains.
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 14, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 14: the module, the two HudFeatures
  rows, the two test files, the i18n key; the locked Seeker use-only capability under Locked decisions and release gates).
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
