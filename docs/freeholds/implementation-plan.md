# Freeholds and Guildhalls: implementation plan

1. [The per-phase workflow](#the-per-phase-workflow)
2. [Review dispatch (the packet's one canonical copy)](#review-dispatch)
3. [Cross-cutting gates](#cross-cutting-gates)
4. [The contributor i18n policy](#the-contributor-i18n-policy)
5. [Code hygiene](#code-hygiene)
6. [PR cadence](#pr-cadence)
7. [Phase summary](#phase-summary)

## The per-phase workflow
Every phase is one fresh Claude Code session in the packet worktree
(`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch
`feature/freeholds`). The session pastes the phase file's starter prompt and follows it:

1. **Pre-flight.** Clean `git status` (a concurrent session may share the checkout; ask
   before touching a dirty tree). Sync the base per `state.md` ("Base and merge-forward"):
   while PR #3872 is open, fetch and merge `origin/feature/masterwrought`; once it has
   merged, discover the newest `origin/release/**` and merge that instead, then delete the
   dependency note from `state.md`. After any non-empty merge run the `release-merge-audit`
   skill and, if the merge touched `patches/`, `pnpm install --frozen-lockfile`. Scan
   `MEMORY.md` for the phase's domain.
2. **Load context through one Explore agent**, never by reading the planning docs or the
   coordinators directly: the agent reads `state.md`, `progress.md`, this phase's file, the
   named source files, and the relevant `CLAUDE.md` files, and returns only what the phase
   needs. A third-party API or an exact classic-era number gets a web-research agent;
   anything it cannot verify is OPEN, never guessed.
3. **Execute** with the lightest orchestration that fits (Explore for recon, a parallel
   Agent fan-out for independent slices, a Workflow for batch-heavy phases: the phase file
   says which and names the split). Each implementer gets only the Explore summary plus its
   own files. Every agent writes any report longer than a screen to a file and replies with
   the path plus a short summary.
4. **Validate** with the `state.md` validation matrix rows for the change types the phase
   touched, one vitest file at a time while iterating, `npx tsc --noEmit` liberally.
5. **Review dispatch** per the rules below, only for the surfaces the diff touched; every
   reviewer is prompted for COVERAGE (report every issue including low-severity and
   uncertain ones; ranking happens later) and writes its report to a file. No commit while a
   BLOCKING finding stands.
6. **Commit** in 2 to 5 Conventional Commits with a scope and a body, EXPLICIT paths, never
   `git add -A`, no em dashes, no emojis, the word "phase" nowhere. Then
   `npm run ci:changed` after the LAST commit and read its exit code (filter any error path
   against `git diff <base>..HEAD --name-only` before calling a red "scope noise"; fix with
   a scoped `npx @biomejs/biome check --write <file>`; a format pass is not a check pass, so
   re-run the check).
7. **Hand off.** Update `progress.md` (status, deferrals, notes) and `state.md` (new
   `IWorld` members, `SimEvent`s, wire keys, commands, endpoints, tables, i18n keys, locked
   decisions), record any surprising rule in memory, and end the response with: status,
   files touched, validation results, review verdicts, deferred items, and the FULL PATH of
   the next file (the paired QA file after an implementation phase; the next
   implementation file after a QA phase).

The in-phase `qa-checklist` run is a completion self-review. The dedicated
`phase-NN-qa.md` session is the gate; phase NN+1 never starts before it has recorded a
verdict in `progress.md`.

## Review dispatch
The reviewer roster and what each owns is the "Reviewer coverage" table in
`docs/qa-gate.md`. This table is the packet's single copy of the TRIGGER: which diff
surfaces spawn which agent. Check `git diff --name-only <phase-start>..HEAD`, spawn ONLY
the matching agents (most phases trigger one or two; a docs-only or test-only phase spawns
none), prompt each for COVERAGE, and have each write its report to a file under the session
scratchpad.

| Diff touches | Spawn |
|---|---|
| `server/`, `src/admin/`, `src/net/`, deploy or secret files, SQL or auth, any new nondeterminism source under `src/sim/` | `privacy-security-review` |
| DDL, a persisted shape (`account_freeholds` JSONB, `CharacterState`), save or load code | `migration-safety` |
| Anything that changes database work or growth (a query, an index, a table, a cadence) | `database-performance-reviewer` |
| Work per tick, per request, per broadcast, or per session (a shared read, a cache, a growing collection, a snapshot or event payload) | `server-hot-path-reviewer` |
| An `IWorld` facet, sim behavior or events, wire or matcher changes, the RL surface | `cross-platform-sync` |
| `src/sim/` determinism, tick order, the `SimContext` seam | `architecture-reviewer` |
| `src/ui/`, `src/styles/`, `src/render/` presentation code, the graphics-tier files under `src/game/` | `frontend-seam-reviewer` |
| Any GPU producer: a material, a light, a GL context, a scene attach, VFX lifetime, a perf probe | `render-performance-reviewer` |
| Any `src/sim/content/` record (items, recipes, deeds, reliquary, tiers, furnishings, patterns) | `content-obligations-reviewer` |
| `scripts/gate*.mjs`, `scripts/lib/gate_*.mjs`, `scripts/lib/ci_*.mjs`, `.github/workflows/` | `gate-integrity-reviewer` |
| A phase whose deliverable is tests (every QA phase; any phase adding a pin suite) | `test-coverage-auditor` |
| A phase or deliverable set is COMPLETE | `qa-checklist` (the `/qa` skill runs it with the fan-out it names) |

QA phases additionally spawn three audit agents (correctness, test coverage, dead code)
before the dispatch reviewers; see the QA template in each `phase-NN-qa.md`.

## Cross-cutting gates
- **Persistence phases** (07, 12, 15, 21, 28, 29, 31, 34, 35, 36, 37, 41, 42): additive, idempotent inline DDL only
  (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`;
  there is no migrations directory), JSONB back-compat for every older row, an index for
  every new predicate, a retention registration or a keep-forever DDL comment for every
  table that grows, an `exportAccountData` row for every account-linked table, and a
  save/load round-trip test (fake pool plus the pg-armed twin).
- **Client phases** (06, 09, 11, 12, 16, 17, 18, 24, 25, 26, 29, 30, 32, 34, 35, 36, 38, 40, 41, 42): touch
  targets 40x40 minimum, inputs 16px, landscape mobile, safe-area insets on edge-anchored
  strips, a mobile-sheet decision for every new window id, no hover-only essential
  information, graphics tiers gameplay-neutral (the placement ghost and the invalid state
  draw at every tier), and before/after screenshots (desktop and mobile) through the
  `pr-screenshots` skill committed under `docs/screenshots/` and linked from the PR body.
- **Performance:** no per-tick allocation in the sim hot path and nothing housing-shaped
  runs per tick at all (D8); snapshots stay interest-scoped and delta-guarded; the
  renderer reads and never mutates; every new GPU producer is a client of the preparation
  scheduler; `npm run perf:tour` and `npm run asset:budget` on budget-touching phases; the
  dependency set stays tiny (no new packages).
- **Money, tokens, and store policy** (the three gates every priced surface carries, listed
  in `state.md` as OPEN with an owner): (1) counsel sign-off before `FREEHOLDS_ENABLED` is
  set in production and before any store submission carrying housing copy; (2) a fail-closed
  feature flag defaulting off (`FREEHOLDS_ENABLED === '1'` read live per call; every housing
  route and command refuses `freehold.disabled` while dark; the store filter drops the
  Charter SKU); (3) the per-distribution surface map pinned by a seven-row matrix test so no
  store build shows a surface its policy forbids. The economy service owns every price and
  all token math; the game forwards `expectedCostClaudium` as a fingerprint and never
  computes a peg, a burn, or a split. No on-chain vocabulary in `src/sim/` (the token
  firewall as `state.md` scopes it; the Book of Deeds is not firewall vocabulary).
- **Deploys** are rare, deliberate, separate steps that follow `DEPLOY.md`; never part of a
  phase; never `ALLOW_DEV_COMMANDS=1` in production.

## The contributor i18n policy
Stated in full in the root `CLAUDE.md` and `src/ui/CLAUDE.md`; the packet applies it as:
every new player-visible string is a `t()` key added in ENGLISH to the matching
`src/ui/i18n.catalog/<domain>.ts` module (housing UI under a `housing` namespace in
`hud_chrome.ts`; item names in the item-names domain; API errors through
`npm run new:endpoint`), rendered only through `t()`, `formatNumber`, `formatMoney`,
`formatDateTime`. Never edit `src/ui/i18n.locales/`; never fan translations out per phase;
the maintainer fills locales at release. The one PR-tier exception, M16: a wordy new
English value (four or more consecutive lowercase letters after stripping tokens) needs
its five non-Latin fills in the same change. `src/sim/` and `server/` stay
language-agnostic: housing emits text-free, id-carrying `SimEvent`s (D10); if a phase
must emit English from sim or server, it adds the matcher rule in `src/ui/sim_i18n.ts` or
`src/ui/server_i18n.ts` in the SAME change (the S3 guard
`tests/localization_fixes.test.ts` enforces it). Run `npm run i18n:gen` after adding keys.

## Code hygiene
Module-first per the root Modularity section and the `extract-and-test` skill: every new
behavior is its own small tested module behind an existing seam (`SimContext`, `IWorld`,
`RouteDef`, `PainterHost`, `RENDER_PURE_CORES`), never a method cluster on `sim.ts`,
`game.ts`, `online.ts`, `hud.ts`, or `renderer.ts`. `online.ts` and `game.ts` sit at their
`tests/monolith_budget.test.ts` ceilings with ZERO slack: a phase that must add a line to
either extracts an existing block first and lowers the ceiling. Every new behavior gets
tests; every `src/sim/` change gets a determinism assertion; update or remove tests you
break; delete replaced code, unused imports, and dead types; never hand-edit generated
files (`*.generated.ts`, the resolved i18n bundles, the SFX manifest); no em dashes, en
dashes, or emojis anywhere; the word "phase" never leaves this directory.

## PR cadence
One PR per wave, each off the base branch recorded in `state.md`, opened by the wave's
close phase after the whole-feature matrix (`qa-checklist.md`) passes, following
`.github/PULL_REQUEST_TEMPLATE.md`, with `FREEHOLDS_ENABLED` defaulting off. The branch is
pushed only after Fernando's go (state.md "Push policy"); pushes go to `origin`, never a
fork; CI green on the PR is the merge bar and the maintainer merges. Wave B starts on the
same branch after wave A's PR is merged (or, if Fernando prefers stacked PRs, on a branch
off wave A's head; `state.md` records the choice when wave A closes). The packet teardown
offer happens once, at the wave E close.

## Phase summary
The per-phase deliverables and acceptance checklists (the spec) are in `progress.md`.

| Phase | Goal (one line) | Main surfaces | Reviewers |
|---|---|---|---|
| 01 | `IWorldHousing` facet with stubs in both worlds, `src/sim/freehold/` skeleton behind `SimContext`, `FREEHOLDS_ENABLED` getter and `freehold.disabled` code with dispatch-time refusal, RL exclusion pin | world_api, sim, server config and wire sibling, headless | cross-platform-sync, architecture-reviewer, privacy-security-review |
| 02 | `FurnishingItemDef` and the `'furnishing'` item kind across every consumer, pinned with a fixture | sim types, ui kind consumers, market filters | cross-platform-sync, frontend-seam-reviewer, architecture-reviewer |
| 03 | Content: tier ladder (Inn Room, Cottage), Charter SKU allowlist, ledger schedule table, vendor-basic furnishings, every content obligation | content, item art, deeds, reliquary, wiki | content-obligations-reviewer |
| 04 | Content: ten crafted furnishings (one per craft) and three quartermaster patterns on the R8/D13 channels, provisioner firewall arm | content, professions, item art | content-obligations-reviewer |
| 05 | Owner-keyed instance claim on the dungeon slot pool: two `DungeonDef` records, `claimKey`, `freeholdOwnerKey` stamp, enter and leave commands, jailed set | sim instances, content, server wire, net | architecture-reviewer, cross-platform-sync, server-hot-path-reviewer |
| 06 | Cottage and Inn Room interiors from layouts and variants, the Eastbrook Freehold Gate, the Hearth Key item | sim layouts and colliders, render dungeon, content | architecture-reviewer, render-performance-reviewer, content-obligations-reviewer, frontend-seam-reviewer |
| 07 | `account_freeholds` row: DDL, load at join, rev-fenced save path, normalize and serialize, export and delete, the offline storage slot | server db, ws_auth, sim state | migration-safety, database-performance-reviewer, privacy-security-review, server-hot-path-reviewer |
| 08 | `layout_core.ts` placement validation, place/move/remove/undo commands, the `freeholdState` descriptor event, strict decode, the chain test | sim, server wire, net | architecture-reviewer, cross-platform-sync, server-hot-path-reviewer |
| 09 | `src/render/freehold/` furnishing view (scheduler client, stand-in kit), interior light rig, placement ghost | render | render-performance-reviewer, frontend-seam-reviewer |
| 10 | Runtime furnishing colliders on both hosts through a generalised region registry | sim colliders, net | architecture-reviewer, cross-platform-sync |
| 11 | Build mode UI: parameterised ground-aim placement, palette, strip, keybinds, pad, touch, i18n, mobile | ui, game input, styles | frontend-seam-reviewer |
| 12 | Strongbox (bank access at home) and the station amenity slot, the D18 vault arm, the amenity lock rule | sim bank gate, professions stations, ui | architecture-reviewer, cross-platform-sync, migration-safety |
| 13 | `condition_core.ts` and `ledger_core.ts`, pay command, four-week prepay, lockout at 30, week boundary, keystone exclusion pin | sim, server calendar feed | architecture-reviewer, cross-platform-sync, server-hot-path-reviewer |
| 14 | `src/game/distribution_surfaces.ts` and the seven-distribution matrix, `HudFeatures.freeholdPurchaseEnabled`, source pins, copy scan, the O4 verdict | game, ui, electron config, tests | frontend-seam-reviewer, privacy-security-review |
| 15 | Claudium spend kind `freehold`: Charter grant into the account row, Master Builder's Call repair grant, telemetry source, flag gating, the service contract doc | server claudium, sim grant, db | privacy-security-review, migration-safety, database-performance-reviewer |
| 16 | Steward panel (condition, due, have and need, pay from bags or vault, prepay, Master Builder's Call) and the store surfaces per distribution | ui, styles, store window | frontend-seam-reviewer |
| 17 | `trophy_eligibility.ts`, retroactive grant on first entry, trophy props on plinths, provenance tooltip, the Inn Room's three plinths | sim, content, ui, render | architecture-reviewer, content-obligations-reviewer, frontend-seam-reviewer |
| 18 | Friends-only visiting, cap 8, read-only visitors, who-is-home, offline no-op | sim, server social, net, ui | privacy-security-review, cross-platform-sync, server-hot-path-reviewer |
| 19 | Furnishing and trophy GLBs through the image-to-glb pipeline, prewarm homes, the LOW-preset phone check (`ultracode`) | public models, render | render-performance-reviewer |
| 20 | Wave A close: integration matrix, wiki pass, perf tour, screenshots, the MVP PR | all | qa-checklist plus every reviewer the matrix names |
| 21 | Lodge tier and the upgrade build project (Claudium fee SKU plus a materials bill, layout carry-over) | content, sim, server claudium | content-obligations-reviewer, architecture-reviewer, privacy-security-review |
| 22 | About twenty more furnishings across all ten crafts plus produce props, the R8 pattern channels (`ultracode`) | content, item art | content-obligations-reviewer |
| 23 | Legend Stand, Harvestmaster sheaf, first-harvest markers, banners, finishes, the remaining trophy families | sim, content, render | architecture-reviewer, content-obligations-reviewer, render-performance-reviewer |
| 24 | Kitchen Garden tableau over `myFarmPlots` (zero beds), Harvest Journal board, farmer NPC | sim projection, render, content | architecture-reviewer, render-performance-reviewer |
| 25 | Build mode v2: wall and table-top snapping, redo, capacity meter, advanced mode, twelve-week prepay, the Fenbridge gate | sim layout, ui, content | architecture-reviewer, frontend-seam-reviewer |
| 26 | Open-house visiting: guild and public policies, caps by tier, door knock, rate limits | sim, server social, ui | privacy-security-review, server-hot-path-reviewer |
| 27 | Wave B close | all | qa-checklist |
| 28 | Owner kind `guild`, the Meeting Hall, rank permissions, the Hall Fund escrow with a member-readable ledger | sim, server guild, db | architecture-reviewer, migration-safety, privacy-security-review |
| 29 | Guildhall purchase (pooled Claudium), 2x decay, Hall Fund upkeep, donation cap, contribution log with retention | server claudium, sim ledger, db | privacy-security-review, database-performance-reviewer |
| 30 | Guild bank chest, feast hall, hall-shared station predicate, muster and calendar boards, pledge-board mirror, war table | sim, ui, render | architecture-reviewer, frontend-seam-reviewer |
| 31 | Guild-level deed record, first-kill banners, raid statues | sim deeds, content, db | architecture-reviewer, content-obligations-reviewer, migration-safety |
| 32 | Great Hall, Manor, Bastion tiers, multi-week build projects, project trophies, visiting vendors, the Materials Vault chest | content, sim, ui | content-obligations-reviewer, architecture-reviewer |
| 33 | Wave C close | all | qa-checklist |
| 34 | Wards: shared instanced neighborhoods, freehold exteriors, the Guildhall anchor plot | sim instances, render, content | architecture-reviewer, render-performance-reviewer, server-hot-path-reviewer |
| 35 | Ward favor bar and monthly Endeavors (cosmetic rewards only) | sim, server, ui | architecture-reviewer, cross-platform-sync |
| 36 | Seasonal Showcase vote, guest book with reactions only (no free text), retention | server, db, ui | privacy-security-review, database-performance-reviewer |
| 37 | On-chain Freehold Charter: service mint and verify contract, `freehold_deeds` table, geo-exclusion, `FREEHOLD_DEEDS_ENABLED`, counsel gate | server, db, docs | privacy-security-review, migration-safety |
| 38 | Web-only mint surface, deed trading as the marketplace's serialized collectible, holder flair read-only, matrix extended | ui, game, server market | privacy-security-review, frontend-seam-reviewer |
| 39 | Wave D close | all | qa-checklist |
| 40 | Keep and Citadel (and Fortress) tiers, courtyard and tower layouts, the prestige-deed gate | content, sim, render | content-obligations-reviewer, render-performance-reviewer |
| 41 | Dye station (alchemy), dye slots, layout save, load, share | sim, content, ui | architecture-reviewer, frontend-seam-reviewer |
| 42 | Second freehold SKU with a progressive upkeep schedule | content, server claudium, sim | privacy-security-review, architecture-reviewer |
| 43 | Carpenter and Mason off-wheel crafts, conditional on the measured furnishing demand and a ruling | content, professions | content-obligations-reviewer |
| 44 | Wave E close: final matrix, packet teardown offer, PR | all | qa-checklist |
