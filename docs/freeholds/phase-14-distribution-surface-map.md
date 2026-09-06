# Phase 14: the distribution surface map

Wave A, the Cottage MVP. The spec is `progress.md` "14 Distribution surface map"; the
decision is `brainstorm.md` D9 (one pure client module, a seven-distribution matrix, a
`HudFeatures` row, a client gate STRICTER than the Claudium store's `!NATIVE_APP` rule)
and the store-safe rules of proposal section 8. This phase ships the module the three
existing gates fold into, the seven-row matrix test, the source pins that keep housing
behind the gates, the "earn" copy denial, and the O4 (Seeker) verdict. It ships NO
purchase surface: those arrive in Phases 15 and 16 behind what this map allows.

### Starter Prompt
```
This is Phase 14 of the Freeholds and Guildhalls feature: the distribution surface map
(src/game/distribution_surfaces.ts, the seven-distribution matrix,
HudFeatures.freeholdPurchaseEnabled, the source pins, the copy scan, the O4 verdict).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (one pure module plus pins).

Goal: answer "which housing surfaces may this build show" in ONE pure module that every
existing distribution gate calls without changing its verdict, pin the answer for all
seven distributions through the real Electron config stamps, and prove by source pins
that no wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace string ships in a housing path a native,
Steam, or Epic build can reach.

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
Parallel Agent fan-out, two slices, each given ONLY the Explore summary and its own
files (disjoint except src/main.ts and state.md, which the coordinator edits last):
- Agent MAP: src/game/distribution_surfaces.ts (pure, DOM-free, no src/net import:
  resolveDistributionSurfaces({ nativeApp, desktopApp, walletEnabled, mobileCapabilities,
  desktopProbes })
  returning { wallet, exchange, claudiumStore, freeholdPurchase,
  freeholdManageOnWebsiteLine, deedSurfaces }, every arm failing closed on a missing or
  throwing probe; freeholdPurchase true ONLY where claudiumStore is true AND the build is
  the web or the website desktop stamp; freeholdManageOnWebsiteLine true wherever the
  house is usable but freeholdPurchase is false; deedSurfaces true on the web and the
  literal 'website' desktop stamp only (D21: the Seeker row is OFF for deeds) and unused
  until Wave D; the wallet row echoes walletEnabled); the composition direction:
  resolveWalletCapability stays in src/net UNTOUCHED, main.ts calls it, passes its
  result in as walletEnabled, and injects the map's rows; only wocMarketAttachAllowed
  (src/game) and the main.ts Claudium attach read the map, with NO verdict change (their
  existing suites stay green untouched); tests/distribution_surfaces.test.ts with one
  `it` per
  distribution (web, website desktop, Steam, Epic, App Store, Google Play, Seeker dApp
  Store) driven through the REAL electron/desktop_config.cjs stamps and the real
  normalizeSolanaMobileCapabilities, plus a per-dimension fail-closed case.
- Agent PINS: HudFeatures.freeholdPurchaseEnabled and freeholdManageOnWebsite rows in
  src/ui/hud.ts with the src/main.ts injection (the dailyRewardsEnabled shape, the
  coordinator applies the main.ts line); tests/freehold_store_gates.test.ts: source-text
  pins that no housing module under src/ui/hud/housing/, src/game/distribution_surfaces.ts,
  or the hudChrome.housing namespace carries a wallet, $WOC, on-chain deed (mint, trade, holder), or marketplace
  string reachable when freeholdPurchase is false (a POSITIVE allowlist of the web-only
  files, never a "not in scope" exemption; the scanned strings are the on-chain ones,
  wallet, $WOC, token, mint, on-chain, NFT, holder, Charter deed, marketplace, Exchange;
  the bare word deed is NEVER scanned because the Book of Deeds ships in every build), the "earn" denial over every
  hudChrome.housing.* English value, and a pin that main.ts never reads the map inside
  src/net; the O4 write-up (STEP 5) for state.md.
Every agent writes any report longer than a screen to a file and replies with the path
plus a short summary. Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLDS_ENABLED is set in
  production and before any store submission carrying housing copy (this phase changes
  nothing there); (2) the fail-closed flag defaulting off stays pinned (Phase 01) and
  this map is a SECOND, client-side gate on top of it, never a replacement; (3) the
  per-distribution surface map is pinned by the seven-row matrix from this phase on.
- The economy service owns prices and token math: the map answers "may this build show
  a purchase surface", never "what does it cost".
- Store policy: no purchase surface and no wallet, $WOC, on-chain deed, or marketplace string in
  any App Store, Google Play, Steam, or Epic path; no "earn" language; the house is
  usable everywhere; the manage-on-the-website line is neutral copy.
- The server never learns the distribution (the map is client-only); nothing in
  src/sim/ or server/ changes.
- src/net never imports src/game; the map lives in src/game/ and is injected through
  main.ts (the firewall), never read inside src/net.
- Graphics and tier knobs stay gameplay-neutral (untouched here).
- i18n: the policy in docs/freeholds/implementation-plan.md; the one English key this
  phase may add is hudChrome.housing.manageOnWebsite (neutral, no store name).
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- Any Claudium branch, SKU, or purchase flow (Phase 15).
- Any window, store row, button, or panel (Phase 16).
- Native billing, a native IAP SKU, or a Seeker wallet rail for housing: the O4 verdict
  is recorded, not built.
- Deed surfaces beyond the map row (Wave D).

STEP 3 - VALIDATION + REVIEW DISPATCH:
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
  for COVERAGE not filtering; each writes its report to a file. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
3 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(game): resolve every distribution surface from one pure map
- feat(ui): add the freehold purchase and manage-on-website HUD features
- test(client): pin the housing store policy per distribution
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
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
- [ ] O4 recorded in state.md: from the real code the Seeker dApp Store build has no
  Claudium purchase surface (the store attaches only when !NATIVE_APP), so its row is
  "usable, manage on the website" until native billing exists; Fernando rules on any
  change.
- [ ] All STEP 3 suites green; both reviewers report no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 14, notes, deferrals) and
  docs/freeholds/state.md (the per-phase ledger row 14: the module, the two HudFeatures
  rows, the two test files, the i18n key; the O4 verdict under OPEN items).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-14-qa.md

STOPPING RULES:
- Stop and ask if folding an existing gate into the map would change ANY existing
  verdict (the fold is move-not-rewrite; a verdict change is a Fernando decision).
- Stop if the tree proves a Seeker purchase surface exists that section 8 would allow;
  record it and ask before widening freeholdPurchase.
- Do not push the branch; never merge a PR.
```
