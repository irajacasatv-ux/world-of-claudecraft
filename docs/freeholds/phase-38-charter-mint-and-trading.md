# Phase 38: Charter mint surface and marketplace trading (web only)

Wave D, Wards and Charters. The spec is `progress.md` "38 Charter mint surface and
marketplace trading (web only)"; the decisions are `state.md` (the token firewall, the
three money gates, the surface map) and `brainstorm.md` (D9 the distribution map, O2 the
counsel memo). This is a money and token phase with NO `src/sim/` change: it ships the
web-only mint surface behind the Exchange gate, deed trading as the marketplace's
"serialized collectible" category (3 percent burned, 7 percent treasury, 90 percent
seller, all computed by the economy service), holder flair on the exterior read-only, and
the distribution matrix extended so no native, Steam, or Epic build reaches any of it.

### Starter Prompt
```
This is Phase 38 of the Freeholds and Guildhalls feature: the Charter mint surface and
marketplace trading (web only; the serialized collectible category; holder flair; the
distribution matrix extended).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: put the Phase 37 deed behind the web-only Exchange gate (mint, list, buy) as a
marketplace category the service prices and splits, show holder flair on the exterior
as a read-only cosmetic, and extend the seven-distribution surface map so every native,
Steam, and Epic path stays free of every deed, wallet, mint, and marketplace string.

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
- Memory scan: MEMORY.md and entries on the marketplace review and hardening packet,
  the dev deploy being MAINNET, the wallet re-auth review, the exchange website-desktop
  PR, distribution gates, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md (the counsel gate status, the Phase 37 decisions),
  docs/freeholds/progress.md (only "38 Charter mint surface and marketplace trading"),
  this file, docs/prd/woc/freehold-deed-service-contract.md
- src/game/distribution_surfaces.ts and tests/distribution_surfaces.test.ts (the Phase
  14 seven-row matrix), src/game/woc_market_wiring.ts (wocMarketAttachAllowed,
  wocMarketBrowserHandoffAllowed), src/net/wallet_capability.ts, electron/desktop_config.cjs
  (wocExchangeSupported), src/ui/hud.ts HudFeatures (freeholdPurchaseEnabled,
  dailyRewardsEnabled), tests/client_shell.test.ts, tests/woc_market_wiring.test.ts,
  tests/electron_desktop_config.test.ts
- server/woc_market_routes.ts (the policy switches allowMounts and allowMechChromas,
  the category vocabulary mirrored as literals, the status route), server/woc_market_service.ts,
  server/woc_market_db.ts, server/woc_market_proxy.ts (service-computed splits),
  server/freehold_deed_routes.ts, server/freehold_deeds_db.ts, server/freehold_deed_proxy.ts
  (Phase 37), server/chat_flair_stamp.ts (stampChatSenderFlair: the holder flair
  precedent), server/freehold_wire.ts (the ward descriptor serialization)
- src/ui/ the Exchange window family (grep woc_market under src/ui/), src/ui/hud/housing/,
  src/sim/freehold/ward_core.ts (the reserved style slot from Phase 34; READ ONLY, the
  sim does not change)
- tests/server/woc_market_routes.test.ts, tests/server/freehold_deed_routes.test.ts
The agent returns: the surface-map extension recipe (a deedSurfaces row: web on,
website desktop through wocExchangeSupported; Seeker, App Store, Google Play, Steam, and
Epic off, because D21 has ruling 6 (web only) outrank the section 8 Seeker row); the
Exchange window's category rendering seam; the market policy switch to
add (allowSerializedCollectibles, default off) and the listing arm for a non-item asset
keyed by the freehold_deeds row; the custody model (the service freezes the asset on
listing through the delegate and settles the transfer; the game records the new holder
after the service confirms); how the server fills the ward descriptor's style slot with
a cosmetic flair id without any sim type change. Settle in STEP 1 and record in
state.md before implementing: what a deed transfer moves (the packet default from the
Phase 37 contract: the title and the flair move; the plot entitlement moves only
through the web claim flow after the service verifies the new holder; never in a native
app), and the flair id vocabulary (cosmetic ids only).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent GAME+UI: the deedSurfaces row in src/game/distribution_surfaces.ts and the
  seven-row matrix extension in tests/distribution_surfaces.test.ts; HudFeatures.freeholdDeedSurfacesEnabled
  beside freeholdPurchaseEnabled, composed in src/main.ts (one line; main.ts stays a
  firewall); src/ui/hud/housing/deed_card_view.ts and deed_card_window.ts (mint, status,
  the handoff into the Exchange window's collectible tab) mounted only when the feature
  is on; the Exchange window's serialized collectible category rendering; the source
  pins in tests/client_shell.test.ts (no deed, wallet, mint, or marketplace string in a
  native, Steam, or Epic path); hudChrome.housing.* keys; pr_shot_targets entries for
  the web surface and the native absence.
- Agent SERVER: the allowSerializedCollectibles policy switch (default off) and the
  listing, quote, and settlement arms in server/woc_market_service.ts for a deed keyed
  by the freehold_deeds row (freeze on listing through the service, the new holder
  written after the service confirms, re-verify before any use); the mint route wired
  to the Phase 37 proxy; the holder flair stamped into the ward descriptor at serialize
  time from the existing holder tier (server-only; the sim never learns it); every route
  refusing while FREEHOLD_DEEDS_ENABLED or WOC_MARKET_ENABLED is dark; tests under
  tests/server/ (the split is never computed here: a grep pin for 0.03, 0.07, 0.9,
  3, 7, 90 near deed code fails the suite).
- Agent NET: the flair field decoded strictly in src/net/ward_wire.ts as an opaque
  cosmetic id (unknown ids dropped to none, never rendered raw), the exterior painter's
  banner variant keyed by that id.
The coordinator edits last: tests/distribution_surfaces.test.ts if two slices touched
it, tests/monolith_budget.test.ts. Every agent writes any report longer than a screen
to a file and replies with the path plus a short summary. Never `mode: "plan"` on
teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before enable (FREEHOLD_DEEDS_ENABLED and
  allowSerializedCollectibles stay off until the memo in state.md is signed); (2) the
  fail-closed flags defaulting off, refusing every deed route and hiding every deed
  surface while dark, pinned; (3) the per-distribution surface map pinned by the
  seven-row matrix with the deed column. The economy service owns prices and token
  math (the mint fee, the royalty, the 3, 7, 90 split); the game forwards ids and keys
  and never computes a peg, a burn, or a split.
- The token firewall at the state.md scope (no on-chain word in src/sim/: wallet, token,
  $WOC, mint, holder, marketplace, on-chain, Solana; Book of Deeds ids are game content):
  NO src/sim/ change in this phase; the flair is an opaque cosmetic id.
- Store policy: no deed, wallet, $WOC, mint, or marketplace string or control in any App
  Store, Google Play, Steam, or Epic path, and no deed string or control in the Seeker
  path (source pins; D21 keeps the deed surfaces to web and website desktop); the house
  is fully usable everywhere; deed ownership unlocks nothing in a native app (Apple
  3.1.1).
- Nothing repossessed: selling the deed never removes the seller's furnishings or
  trophies; the transfer rule settled in STEP 1 is recorded and pinned.
- The i18n policy in docs/freeholds/implementation-plan.md; vocabulary fixed; "phase"
  in no code, comment, commit, or PR text; monolith ceilings never raised.

Out of scope (do NOT do in this phase):
- Any src/sim/ change; a native IAP rail; enabling any flag outside a test; any deed
  surface on Seeker (D21).

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/distribution_surfaces.test.ts
  tests/client_shell.test.ts tests/woc_market_wiring.test.ts tests/electron_desktop_config.test.ts
  tests/freehold_store_gates.test.ts tests/server/woc_market_routes.test.ts
  tests/server/freehold_deed_routes.test.ts tests/server/http/surface_inventory.test.ts
  tests/api_error_code_parity.test.ts tests/architecture.test.ts tests/monolith_budget.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts tests/localization_fixes.test.ts`
  plus the tests/server/ suites the SERVER slice added and the pg-armed twin; `npm run
  i18n:gen` then `npx vitest run tests/i18n_completeness.test.ts`; `node
  scripts/pr_screenshots.mjs`; `git diff
  <phase-start>..HEAD --name-only | grep '^src/sim/'` must print nothing.
- Spawn review agents per docs/freeholds/implementation-plan.md: privacy-security-review,
  frontend-seam-reviewer, plus server-hot-path-reviewer (listing and verify reads) and
  cross-platform-sync (the descriptor field on the wire). Prompt each for COVERAGE not
  filtering; each writes its report to a file. Do not commit until no BLOCKING issues
  remain.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(game): extend the distribution surface map with the deed surfaces column
- feat(server): list and settle Freehold Charters as the serialized collectible category
- feat(ui): add the web-only Charter mint card and the collectible tab
- feat(net): mirror holder flair as an opaque cosmetic id on ward exteriors
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The seven-row matrix passes with the deed column: web on, website desktop only
  through wocExchangeSupported, Seeker, App Store, Google Play, Steam, and Epic off
  (D21); the source pins find no deed, wallet, mint, or marketplace string in those paths.
- [ ] Every deed and collectible route refuses while either flag is dark (pinned per
  route); the surfaces are absent while HudFeatures says off.
- [ ] A listing freezes through the service, a settlement records the new holder only
  after the service confirms, and no split, burn, or royalty constant exists in the game
  (grep pin); the seller keeps every furnishing and trophy.
- [ ] Holder flair renders from an opaque id; an unknown id renders nothing; the diff
  touches no src/sim/ path.
- [ ] Screenshots: the mint card on web and its absence on a native emulation; all
  STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 38, notes, deferrals) and
  docs/freeholds/state.md (ledger row 38: endpoints, wire fields, facet or feature rows,
  i18n keys; the transfer rule and flair vocabulary; the counsel gate still OPEN).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-38-qa.md

STOPPING RULES:
- Stop and ask if the Exchange window cannot render a non-item category without a
  src/sim/ change; the answer is a server-fed row, never a firewall exception.
- Stop if the flair cannot be filled without an on-chain word (holder, mint, marketplace)
  in a sim type.
- Do not push the branch; never merge a PR.
```
