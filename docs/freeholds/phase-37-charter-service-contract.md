# Phase 37: the on-chain Freehold Charter (service contract, ledger table, geo-exclusion)

Wave D, Wards and Charters. The spec is `progress.md` "37 On-chain Freehold Charter:
service contract, ledger table, geo-exclusion"; the decisions are `state.md` (the token
firewall, the three money gates) and `brainstorm.md` (O2 the counsel memo, D1 the service
owns entitlements). This is a money and token phase with NO client surface and NO
`src/sim/` change: it ships the economy-service mint and verify contract (a Metaplex Core
asset with Permanent Freeze and Permanent Burn delegates, collection royalties to the
treasury), the `freehold_deeds` table (claim once, re-verify at use), the geo-exclusion
list (South Korea, following the Epic Games Store list), the counsel memo gate recorded
as OPEN, and the `FREEHOLD_DEEDS_ENABLED` flag defaulting off.

### Starter Prompt
```
This is Phase 37 of the Freeholds and Guildhalls feature: the on-chain Freehold Charter
service contract, the freehold_deeds ledger table, geo-exclusion, and the
FREEHOLD_DEEDS_ENABLED flag (server and docs only; no client surface; no src/sim/ change).

Harness: Claude Code. Follow the root CLAUDE.md "Working style and effort by model"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase.

Goal: land the server half of on-chain deeds dark: a written service contract, a
fail-closed flag, a keep-forever claim table with a claim-once rail, a service proxy that
never throws and never computes token math, a geo-exclusion arm, and the counsel gate
recorded as OPEN, all without a single src/sim/ line and without any surface a player
can reach.

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
- Memory scan: MEMORY.md and entries on the marketplace review verdict and hardening
  packet, the dev deploy being MAINNET, fail-closed flags, the RouteDef scaffold,
  migration safety, no sensitive material in the open repo, test-pin traps.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "37 On-chain Freehold
  Charter"), and this file; docs/prd/woc/freeholds-and-guildhalls-research.md section 9
  only (the on-chain design) and section 8's geo-exclusion line
- server/claudium_proxy.ts (callServiceDetailed, claudiumServiceConfigured, the typed
  unavailable results), server/claudium_spend_wire.ts (parse, never coerce),
  server/woc_market_proxy.ts (createWocMarketEconomyProxy, the service-computed fee
  splits the game never derives), server/woc_market_routes.ts (wocMarketConfig, the
  woc_market.disabled 403 refusal), server/steam/config.ts (steamEnabled)
- server/seeker_entitlement_db.ts (SEEKER_ENTITLEMENT_SCHEMA, the keep-forever comment,
  claimAvailableSeekerEntitlement with ON CONFLICT DO NOTHING), server/seeker_entitlement.ts
  (hasSeekerEntitlement, verifyCurrentSeekerEntitlement), server/db.ts (ensureSchema
  order, exportAccountData), server/freehold_db.ts, server/freehold_config.ts
- server/signup_attribution.ts (geoCountryHeaderName, parseSignupCountry: the trusted
  edge geo header), server/http/CLAUDE.md, server/http/registry.ts, .env.example
- tests/server/seeker_entitlement.test.ts, tests/server/storage_gates.test.ts,
  tests/server/http/surface_inventory.ts, tests/architecture.test.ts (the token firewall
  pin over src/sim), tests/monolith_budget.test.ts
The agent returns: the proxy shape to copy (one fetch wrapper, the secret header, typed
results, neverReached); the keep-forever claim-table shape and its ensureSchema slot;
the flag getter and the 403 refusal shape; the geo header reader; the new:endpoint
invocation for a freehold deed domain; the exact list of what the game must NEVER
compute (price, burn, split, royalty). Settle in STEP 1 and record in state.md before
implementing: the excluded country list literal (working: KR only, counsel owns it) and
the unknown-country policy (the packet default is refuse, fail closed).

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Parallel Agent fan-out, three slices, each given ONLY the Explore summary and its own
files (disjoint except the shared pin files the coordinator edits last):
- Agent DOCS: docs/prd/woc/freehold-deed-service-contract.md: the economy service mints
  one Metaplex Core asset per plot (never fungible, never a series) with the Permanent
  Freeze Delegate and the Permanent Burn Delegate held by the treasury authority,
  collection-level royalties to the treasury, the mint cost paid through the existing
  rail; endpoints POST mint (account id, plot key, idempotency key in; mint address and
  status out) and GET verify/:mint (current holder and status out); re-verify at each use;
  the resale split (3 percent burned, 7 percent treasury, 90 percent seller) and the
  royalty are the service's numbers, the game never computes them; the counsel memo and
  Terms revision recorded as OPEN with owner counsel; the Apple 3.1.1 rule (deed
  ownership unlocks nothing in any native app; the entitlement does the unlocking).
- Agent SERVER: server/freehold_deed_config.ts (freeholdDeedsEnabled(env) strict '1',
  read live, default off, and also requires freeholdsEnabled), server/freehold_deed_proxy.ts
  (mintFreeholdDeed, verifyFreeholdDeed over callServiceDetailed; never throws; typed
  unavailable; no coercion), server/freehold_deed_geo.ts (deedGeoExcluded(country) with
  the settled list and the unknown policy; the country from geoCountryHeaderName),
  server/freehold_deeds_db.ts (FREEHOLD_DEEDS_SCHEMA: freehold_deeds (mint TEXT PRIMARY
  KEY, account_id REFERENCES accounts(id) ON DELETE CASCADE, plot_key, claimed_at,
  last_verified_at, status CHECK), UNIQUE (account_id, plot_key), a keep-forever DDL
  comment, claimFreeholdDeed with ON CONFLICT DO NOTHING, touchFreeholdDeedVerification
  throttled by last_verified_at), the exportAccountData row, the ensureSchema slot after
  SCHEMA, the .env.example rows (FREEHOLD_DEEDS_ENABLED, the excluded list knob if one).
- Agent ROUTES: `npm run new:endpoint` for server/freehold_deed_routes.ts (registry
  only): POST /api/freehold/deed/claim and GET /api/freehold/deed, every route answering
  freehold.deeds_disabled (403) while dark, then freehold.deed_geo_excluded,
  freehold.deed_unavailable, freehold.deed_already_claimed; activeGuard and rateLimit;
  the surface inventory rows; tests/server/freehold_deed_routes.test.ts (fakeCtx, FakeDb,
  the flag toggled per case, 'true' and '0' still dark) and tests/server/freehold_deeds_db.test.ts
  plus the pg-armed twin (the claim-once rail, the cascade).
The coordinator edits last: tests/server/http/surface_inventory.ts,
tests/monolith_budget.test.ts if game.ts or main.ts moved. Every agent writes any
report longer than a screen to a file and replies with the path plus a short summary.
Never `mode: "plan"` on teammates.

INVARIANTS THIS PHASE MUST KEEP:
- The three money gates: (1) counsel sign-off before FREEHOLD_DEEDS_ENABLED is ever set
  in production or any store copy mentions a deed (recorded OPEN, owner counsel); (2) the
  fail-closed flag defaulting off, strict '1', read live, refusing every deed route while
  dark, pinned; (3) the per-distribution surface map pinned by tests (this phase adds no
  surface; Phase 38 extends the map). The economy service owns prices and token math:
  the game forwards ids and keys and never computes a peg, a burn, a split, or a royalty.
- The token firewall at the state.md scope (no on-chain word in src/sim/: wallet, token,
  $WOC, mint, holder, marketplace, on-chain, Solana; deed ids from the Book of Deeds are
  game content and stay allowed): NO change under src/sim/ at all in this phase (the QA
  checks the diff path list).
- Persistence gates: additive idempotent DDL, keep-forever stated, the export row, the
  cascade; parameterized SQL; secrets only through env; nothing committed under .env.
- Store policy: no client surface, no string, no route reachable from a native, Steam,
  or Epic build (there is no client change at all).
- Nothing repossessed: a deed never gates the plot entitlement; the door still opens.
- Vocabulary fixed; "phase" in no code, comment, commit, or PR text; monolith ceilings
  never raised.

Out of scope (do NOT do in this phase):
- Any client surface, any mint button, any marketplace listing arm (Phase 38).
- Any src/sim/ change; any on-chain word (the state.md firewall list) in a sim event or
  descriptor.
- Setting the flag anywhere but a test.

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: `npx tsc --noEmit`; `npx vitest run tests/server/freehold_deed_routes.test.ts
  tests/server/freehold_deeds_db.test.ts tests/server/http/surface_inventory.test.ts
  tests/server/http/error_codes.test.ts tests/server/new_endpoint.test.ts
  tests/api_error_code_parity.test.ts tests/localization_fixes.test.ts
  tests/architecture.test.ts tests/monolith_budget.test.ts tests/server/main_retention_wiring.test.ts`;
  the pg-armed twin with TEST_DATABASE_URL set after `npm run db:up`; `git diff
  <phase-start>..HEAD --name-only | grep '^src/sim/'` must print nothing.
- Spawn review agents per docs/freeholds/implementation-plan.md: privacy-security-review,
  migration-safety, plus database-performance-reviewer (a new table and the verify
  cadence). Prompt each for COVERAGE not filtering; each writes its report to a file.
  Do not commit until no BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
3 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- docs(prd): record the Freehold Charter deed service contract and the counsel gate
- feat(server): add the freehold deed ledger, service proxy, and geo-exclusion behind FREEHOLD_DEEDS_ENABLED
- test(server): pin the deed flag, the claim-once rail, and the geo refusal
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] The service contract doc exists with the delegates, the royalty, the endpoints,
  the re-verify rule, and the counsel gate recorded OPEN with an owner.
- [ ] FREEHOLD_DEEDS_ENABLED unset, 'true', and '0' all refuse every deed route with
  freehold.deeds_disabled (pinned per route); '1' without FREEHOLDS_ENABLED still refuses.
- [ ] freehold_deeds DDL is additive, idempotent, keep-forever; a second claim for the
  same plot is a no-op (pg twin); the export row is present; account delete cascades.
- [ ] A KR country header refuses with freehold.deed_geo_excluded; an unknown country
  follows the recorded policy; the header name comes from geoCountryHeaderName.
- [ ] The diff touches no src/sim/ path; no price, burn, split, or royalty constant
  exists in server/ (grep pinned); the proxy never throws (a thrown fetch becomes
  unavailable).
- [ ] All STEP 3 suites green; every reviewer reports no BLOCKING.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 37, notes, deferrals) and
  docs/freeholds/state.md (ledger row 37: endpoints, table, error codes, the flag; the
  geo decisions; the OPEN counsel gate with owner under "OPEN items and policy gates").
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-37-qa.md

STOPPING RULES:
- Stop and ask if any step would need a src/sim/ line or an on-chain word in a sim type;
  the answer is a server-side shape, never a firewall exception.
- Stop if the service contract needs a number the economy service has not published;
  record it OPEN, never invent it.
- Do not push the branch; never merge a PR.
```
