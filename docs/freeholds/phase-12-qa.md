# Phase 12 QA: audit the Strongbox and station amenities

Audits `phase-12-strongbox-and-station.md`. Verdict goes in `progress.md` (row "12
QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 12 (QA) of the Freeholds and Guildhalls feature: audit the Strongbox and
station amenities (bank access at home, the station amenity slot, the vault craft gate
arm, the amenity lock rule).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 12 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "12 Strongbox and station amenities", missing
tests, dead code, the never-sell-power rule, the one-gate and one-planner rules, the
explicit vault arm and its negatives, the amenity lock, determinism of the spawns,
three-host parity, and the monolith ratchet; fix what the audit finds; record a
verdict.

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
- Memory scan: MEMORY.md, the test-pin traps catalog, the guard-exemptions-must-be-positive
  entry, "review the review-fix round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("12 Strongbox and station
  amenities" and the row), docs/freeholds/phase-12-strongbox-and-station.md (what was
  promised)
- the Phase 12 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 12); `git diff <phase-start>..HEAD --
  tests/professions_crafting_hub.test.ts src/sim/professions/training.ts
  src/sim/content/professions.ts` expected EMPTY
- the pins the diff claims: tests/freehold_strongbox.test.ts,
  tests/freehold_station.test.ts, tests/vault_craft_gate.test.ts, tests/vault_wire.test.ts,
  tests/bank_wire.test.ts, tests/craft_from_vault.test.ts, tests/world_api_parity.test.ts,
  tests/command_schema.test.ts, tests/freehold_command_chain_online.test.ts,
  tests/server/freehold_amenities_online.test.ts (the spied-pool query counter),
  tests/entity_display_name.test.ts, tests/monolith_budget.test.ts
The agent returns: the promised-versus-delivered table per deliverable, every new symbol
and where each is consumed, the exact composition sites for the Strongbox gate and the
station list (and every caller that reads a station list WITHOUT the freehold rows),
the vault arm as written with its position among the existing arms, every test added
with what it asserts, and any TODO, unused import, second reach rule, or second
sourcing planner.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-12-strongbox-and-station.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

Deliverables (at most five):
1. Built-in Strongbox access. NEW src/sim/freehold/amenities.ts (the Strongbox and
   station amenity core behind the SimContext seam, the module 30's registry when-list
   cites) spawns the claim-scoped visible object
   at the authored anchor, tracks it in inst.objectIds and keeps respawnTimer Infinity.
   freeholdStrongboxSatisfies checks owner, current claim, BANKER_RANGE and condition.
   Strongbox is personal-bank access with no extra capacity and no amenity-slot cost.
   Separate service authorization from shared geometry: do not broaden nearBanker so
   materials_vault.ts or guild_bank.ts inherit this right. All eight nearBanker-gated
   personal-bank operations consume the capability-specific home-bank arm, each with
   its own arm in tests/freehold_strongbox.test.ts: bankInfoFor, bankInfoWireRevFor,
   bankDeposit, bankWithdraw and bankBuySlots (src/sim/bank.ts) and bankUnlockSocket,
   bankSocketBag and bankUnsocketBag (src/sim/bank_sockets.ts); the Strongbox is the
   whole bank at home (D6), so no op answers the town refusal there and no new refusal
   key is needed. Town banker behavior and nearBankerTemplateId remain unchanged. A
   visitor can see the prop but cannot open or mutate personal banking.
2. Station slot and crafting projection. build_station fills the Cottage's one
   amenity slot from the six allowed StationTypes and is owner-only. The persisted
   station field has a positive normalizer allowlist. freeholdStationsFor composes
   into evaluateCraftAdmission and the HUD in-range read only. The existing town
   station list, isAtAnyStation, resolveTrain and Maker's Bond unbind never inherit
   home permissions. The Strongbox and one station coexist. Entry and building still
   work at zero condition; only the amenity service is paused below 30, available at 30.
3. Explicit personal vault crafting arm. vaultDrawBlocked checks owned current claim,
   built valid station and available amenity after membership arms and before geometry
   fallback; the cvault projection uses the same cheap read. Material consumption
   retains one planReagentSourceDraw. Home crafting can draw the owner's personal
   vault without opening direct Materials Vault management. Direct vault chest access
   is the later Manor amenity; guild bank access requires the later guild chest plus
   membership, never a Strongbox. Phase 30 extends station access to permitted guild
   members drawing their own vault, without sharing private vault data.
4. Thin interaction and wire integration. strongbox_interact.ts uses the shared press
   funnel and real bank window. buildStation/myAmenities, build_station, text-free
   grants/denials, descriptor amenity rows and mst projection traverse IWorld, both
   worlds, command tags, server dispatch and strict decoder together. Claim teardown
   removes both objects. Denied/paused hints use hudChrome.housing.* through the one
   selector and existing window/focus family in ux-spec.md. This phase owns the
   hudChrome.housing.interior.* rows it appends to 09's base (exact English; ux-spec
   carries them with 12 as owner): interior.strongbox = "Strongbox";
   interior.strongboxTooltip = "Open your personal bank here. This does not add storage
   space."; interior.stationTooltip = "Use this home's {station}. Recipes keep their
   normal skill and training requirements."; interior.strongboxVisitorTooltip = "This
   Strongbox opens the owner's personal bank. Guests cannot use it.";
   interior.strongboxPausedTooltip = "This Strongbox is paused by the home's condition.
   The owner can restore condition to use it."; interior.stationVisitorTooltip = "This
   station is for the home's authorized users."; interior.stationPausedTooltip = "This
   station is paused by the home's condition. The owner can restore condition to use
   it.". This phase regenerates ux-key-manifest.json (its seven interior.* rows, owner
   12) in its own change with every cited count updated (D92); it adds no
   ux-shot-manifest.json variant.
   Interior tooltips branch on the actual service authorization/condition model:
   owner-ready, visitor read-only and condition-paused are distinct keys. A mere
   hearth asset or inaccessible owner service does not imply condition lockout.
   Low condition alone cannot prevent entry/decoration; independent admission rules
   still apply. Only form controls input/select/textarea have the coarse 16px floor.
   Station persistence distinguishes absent/default, malformed known-schema and valid
   unsupported future identifiers. Preserve a future owned station's original record
   read-only under 07's capability/recovery contract; do not drop it, construct an empty
   station or grant a second station. Pin original value/ownership through load/save,
   denied mutation and recovery, separately from absent and known malformed fixtures.
5. Boundary proof. Pin owner/visitor/out-of-range/condition 29/30 for banking and
   crafting; assert personal bank allowed while direct vault and guild bank stay
   denied at Strongbox. Pin simultaneous Strongbox+station, second station refusal,
   no town training/unbind bypass, cvault owner-only data and zero new per-tick SQL
   (pinned by a fake-pool query counter in NEW
   tests/server/freehold_amenities_online.test.ts, owned here, which drives GameServer
   with a spied pg pool the way tests/server/title_reads.test.ts does, over a driven
   tick and snapshot window with the Strongbox and station built and the cvault probe
   live, asserting zero queries attributed to amenity reads; plus
   tests/architecture.test.ts proving src/sim/freehold/ imports nothing from server/).
   Rerun bank/vault/guild authorization and station online suites, command/wire parity,
   persistence normalization and object teardown. Invoke database-performance-reviewer
   before storage/caller decisions and on finished diff, alongside architecture,
   cross-platform, privacy, migration and frontend reviewers for these surfaces.

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

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run the Phase 12 STEP 3 suite list plus `npx tsc --noEmit`; run tests/parity clean
  and confirm any golden commit stands alone; confirm the regenerated
  ux-key-manifest.json (seven owner-12 rows, counts updated) is in the phase diff.

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
- [ ] Every Phase 12 acceptance box is verified by a check that ran, not by inspection.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "12 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-13-condition-and-ledger-core.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 12 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
