# Phase 06 QA: audit the interiors, the gate, and the Hearth Key

Audits `phase-06-interiors-gate-and-hearth-key.md`. Verdict goes in `progress.md` (row
"06 QA"). The next implementation phase never starts before this file has run.

### Starter Prompt
```
This is Phase 06 (QA) of the Freeholds and Guildhalls feature: audit the interiors (the
two layouts, derived colliders, render variants and dressing), the Eastbrook Freehold
Gate, the Hearth Key, and the refusal toasts.

Harness: Codex. Asset generation in this implementation must use Codex, not Claude.
Follow AGENTS.md and root/directory CLAUDE.md repository contracts; use the active Codex
model and the existing image/model/SFX pipelines, provenance and quality gates.

Goal: audit the Phase 06 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "06 Interiors, the Eastbrook gate, the Hearth Key",
missing tests, dead code, determinism of the derived colliders, three-host parity of both
enter paths, the jailed check, the scheduler contract for the dressing, i18n completeness,
and the committed screenshots; fix what the audit finds; record a verdict.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge origin/feature/masterwrought
  while PR #3872 is open, else the newest origin/release/**; release-merge-audit after a
  non-empty merge; pnpm install --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, renderer.ts edits owing the
  Eastbrook re-mint, screenshots at the lowest graphics preset, "review the review-fix
  round", "apply ALL findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("06 Interiors, the Eastbrook gate,
  the Hearth Key" and the row), docs/freeholds/phase-06-interiors-gate-and-hearth-key.md
  (what was promised)
- the Phase 06 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 06), including the screenshot commit, mapping.json,
  and the regenerated wiki content
- the pins the diff claims: tests/freehold_layouts.test.ts,
  tests/freehold_gate_and_key.test.ts, tests/housing_view.test.ts,
  tests/renderer_compile_gate.test.ts, tests/entity_display_name.test.ts (the object
  case), tests/map_marker_semantics.test.ts, tests/map_semantic_accessibility_core.test.ts,
  tests/minimap_markers.test.ts, tests/item_icons.test.ts, tests/monolith_budget.test.ts
  (sim.ts, world.ts, renderer.ts, hud.ts rows), tests/server/freehold_wire.test.ts (the
  jailed arm and the dark-realm arms)
- src/sim/instances/dungeons.ts and src/render/renderer.ts as they stand (diff both
  against the phase start; classify every changed line)
The agent returns: the promised-versus-delivered table per deliverable, the six touch
points per interior each marked present, the gate and key control flow with every gate in
order, the dressing module's attach path and prewarm home, the extractions with their
moved bodies, every test added with what it asserts, the screenshot paths, and any TODO,
unused import, or decor key with no render prop and no stand-in.

STEP 2 - AUDIT (parallel Agent fan-out, three auditors, each writing its report to a
file and replying with the path plus a short summary; prompt each for COVERAGE: report
every issue including low-severity and uncertain ones; ranking happens later):
- CORRECTNESS: both layouts derive the same collider set on two calls and on both hosts
  (the sim's derivation and the client's read the same table); every anchor and the entry
  sit inside a room; plinth anchors equal the tier table; the gate is tier-routed (a
  cottage-tier record enters index 16, an inn-room record index 15); the offline entry
  rides Phase 05's default record and the Cottage fixture is Phase 05's real `/dev
  freehold cottage` route (D81; no direct setter or window.__game mutation anywhere in
  the capture or tour scripts); the key enters from any open-world zone, consumes
  nothing, and refuses dead, combat, cooldown, `instanced` (rift floor, delve, dungeon
  claim) and `match` (battleground, arena, duel, flag carrier) with no teleport, each
  context resolved the way src/sim/unstuck.ts resolves it; a full-bags entry proceeds
  and mints no key; the gate and the key grant are absent while freeholdsEnabled is
  false (D85) and the offline host stays live;
  the item def lives in src/sim/content/freehold/items.ts and the use arm in
  src/sim/freehold/hearth_key.ts (D23); the cooldown belongs to isolated account host-clock state offline and 07/07a durable
  account authority online; a plot field never authorizes admission. Pin the isolated
  offline/headless injected ctx.lockoutNowMs() behavior and committed online display
  mirror separately. 07/07a's later online acceptance exclusively uses its database
  epoch after the account participant lock; a Sim/display clock or stale mirror must
  never authorize a remote entry. Preserve that host seam now; its real-PG clock-
  disagreement/race proof belongs to 07a, not an unavailable 06 dependency. The
  cooldown equals the state.md working value (60 minutes); the key is granted once per
  character and re-granted
  when absent; leaving lands at the gate; a jailed session's `use` of the key is refused
  on the server (the check reads msg.item, the only payload field) and freehold_enter
  stays in JAILED_BLOCKED_COMMANDS; left-click, right-click and the nearby-interact press
  on the gate open the prompt through the real client routing and never reach
  pickUpObject; the gate has a `freehold-gate` marker semantic with art, layer and
  accessibility tokens and the entity_display_core arm names it by key; the dressing
  attaches only through the gated loop with every material prewarmed; no light was added;
  the extractions are move-not-rewrite; no "manage on the website" or purchase copy
  appears in the gate path; the one deny-line selector is freeholdDeniedLineKey in
  src/ui/hud/housing/housing_view.ts over hudChrome.housing.denied.* (D26), no second
  one, total over the enum with the five NEW English values exactly as the
  implementation file names them; hearthKey.tooltip carries the Wave A English with no
  second-home sentence.
- TEST COVERAGE: each claimed pin has a DECISIVE assertion (a position literal for the
  gate landing, the cooldown written fresh as the state.md working value, a reason token
  per refusal); the
  determinism test compares two independent derivations, never one against itself; the
  online arm drives the real dispatch for gate confirmation and for `use`; the jailed pin
  toggles the session flag and asserts no teleport; one negative per key context asserts
  the reason token (`instanced` for rift, delve and dungeon; `match` for battleground,
  arena, duel and flag carrier) with no teleport; the dark-realm arms assert the gate
  entity absent and no key granted with the flag unset; the three marker suites pin the
  new kind by literal; the perf tour result is recorded with zero live-program events in
  both interiors; missing negatives (a non-owner confirming a gate destination without
  authority gets the correct refusal; `use` with a non-key item ignores the freehold
  arm; a key use while already at the selected home is a no-op with no cooldown change;
  a full-bags entry succeeds with no key minted).
- DEAD CODE AND HYGIENE: unused imports and types, leftover TODOs, the architecture
  import invariant (no render import in src/sim/, no sim mutation from src/render/), the
  word "phase" or "rent" or the banned phrase "real estate" (state.md "Non-negotiables",
  vocabulary fixed; qa-checklist.md "Ownership and classic fidelity") in any code,
  comment, or commit message, em
  dashes or emojis, a hand-edited generated file, a locale overlay touched, "earn" in any
  hudChrome.housing.* value, an orphaned WebP or provenance row, the src/render/freehold/
  CLAUDE.md present and accurate, the placeholder interior from Phase 05 fully removed,
  screenshots present for desktop, compact, and tablet and captured at the lowest preset.
Then the dispatch reviewers per docs/freeholds/implementation-plan.md for the surfaces
the diff touched (architecture-reviewer, render-performance-reviewer,
content-obligations-reviewer, frontend-seam-reviewer, cross-platform-sync,
privacy-security-review, server-hot-path-reviewer, test-coverage-auditor), and finally
qa-checklist (the completion gate), all for COVERAGE, all to files.

SETTLED COVERAGE ADDITIONS:
- Walk through proximity without interacting and assert zero teleport. Drive explicit
  gate confirm offline and through real dispatch, plus keyboard/pad/touch cancel/focus
  return. Own/friend row states and authoritative pending/error/full/busy/recovery states
  match ux-spec; friend lookup is enabled by 18 before Wave A close, never guessed here.
- Measure both safe entry/facing/door/path layouts against art-brief and the workbook;
  blocked paths or overlapping occupied arrival positions cannot pass content validation.
- Verify confirmed dungeonEntrySeq handoff and same-arrival resume identity. Its
  downstream 07c/08a/09 contract permits at most one consumption of a delivered fresh
  directive, with optional camera only for the committed account/tier winner. Static
  return/visitor, snapshot/resume/replay and commit-before-ACK omission cannot acquire
  a new view/cue from historical identity alone. Preserve owner authority when using
  a key and already-at-home no-op with unchanged cooldown. Inspect 40x40 touch
  targets, safe areas and all keyed prompt/refusal strings in screenshots.
- Lighting/camera/sampled welcome is explicitly owned by 09; 06 may not falsely claim
  final arrival beauty from a shell-only screenshot. The final 18/19/20 handoff is named.

<!-- core-ux-gate-qa:start -->
GATE UX FIX-ROUND COVERAGE:
- Verify plant-sheet decision-window family and housing_view.ts/visit_prompt_view.ts
  ownership. Name-field Enter runs Find home; explicit Enter is absent until the matching
  authorized result. Focus/announce the result, then Tab to Enter. Editing the name
  invalidates result/capability immediately. Race two lookups and verify older request/
  normalized-name responses cannot replace or authorize the current draft; failure keeps
  the name for retry and actual entry repeats authority.
- An active Hearth Key cooldown cannot lock the physical gate. Condition-only pause
  does not prevent entry/build while all independent admission rules still apply.
- Delayed online cosmetics add no settle wait: structural safety and prepared readable
  representations gate reveal, optional art finishes later. Bounded offline wait and
  ordinary arrival do not inherit the special first-spawn establishing-shot wait.
<!-- core-ux-gate-qa:end -->


CODEX ASSET EXECUTION (D74/D75):
- Any generated model/GLB, texture, reference image, icon/image or sampled asset in this
  implementation is executed by Codex through the existing repository pipeline, including
  provenance, deterministic export/fingerprint and in-context quality/performance checks.
  QA verifies that execution evidence. The final 44a Codex pass rechecks and replaces
  all feature-created placeholder icons/images; it does not waive this producer's
  same-change or per-wave final-asset obligations. No asset is generated in the packet audit.

HEARTH KEY CREDENTIAL AND SHARED-ACCOUNT PROOF:
Inventory regrant restores a usable shortcut only; current account/plot admission is
the authority. Test a held/transferred/forged key with no ownership, an absent key with
authorized physical entry, and regrant without minting an entitlement. Remote-key entry
uses 07/07a's account participant and committed private mirror; no plot save can reset
it. Two alts and later two destinations share the duration. Already-home/refused/key-
cooling physical-gate paths do not consume cooldown. This pair's offline behavior is
proved now; online production admission requires the completed 07/07a authority proof.

STEP 3 - VALIDATION:
- Run the Phase 06 STEP 3 suite list plus `npx tsc --noEmit`; `npm run i18n:gen`,
  `npm run wiki:content` and the ux-key-manifest.json and ux-shot-manifest.json
  regeneration followed by `git status --porcelain` (a dirty file means a stale regen,
  the manifests included; D92); `PERF_SCENARIO=bench_freehold_interiors npm run perf:tour`
  through both
  interiors once more.

FINAL REVIEW AND COMPLETION CONTRACT:
- Required reviewers for the actual promised surfaces: architecture-reviewer, cross-platform-sync, render-performance-reviewer, content-obligations-reviewer, frontend-seam-reviewer, privacy-security-review, server-hot-path-reviewer, test-coverage-auditor, qa-checklist.
  Dispatch each for COVERAGE and wait for every report. Apply ALL findings including
  nits, then a FRESH reviewer reads the entire fix round. Earlier slice lists are
  ownership examples; this complete roster is the minimum finishing dispatch.
- Database performance reviews happen before implementation decisions and on the finished
  diff whenever SQL/call sites/stored shapes/queues/locks/timeouts/growth change; pair
  migration-safety and privacy-security-review for persistence/authority changes.
- Run node scripts/gate_select.mjs before calling this contribution complete, as well as
  every scoped/PG/visual/SFX check named here. Report exact commands and outcomes. A
  skipped required suite or a reviewer report alone is not a passing shared gate.

STEP 4 - FIX:
- Apply ALL findings, including nits. Resolve a conflict with a locked decision
  explicitly before PASS; a recorded conflict is not a deferred fix. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere; a fix that changes a visual re-captures
  the screenshots. Then review the fix commits with a FRESH reviewer (fixes are
  unreviewed code until someone reads them). `npm run ci:changed` after the last commit;
  read the exit code.

REVIEW COMPLETION CONTRACT:
All findings, including nits, must be resolved and the entire fix round independently
reviewed before PASS. External signatures remain named release-gated artifacts, never
deferred review findings. Record found/resolved counts and the fresh reviewer verdict.

STEP 5 - ACCEPTANCE:
- [ ] Every Phase 06 acceptance box is verified by a check that ran, not by inspection.
- [ ] Both enter paths work offline and online in a test that ran; the jailed arm is pinned.
- [ ] Every finding, including every nit, is resolved and a fresh reviewer has verified
  the complete fix round. No deferred review finding remains.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "06 QA": verdict (PASS / FAIL), counts found and
  fixed, and the fresh fix-review evidence. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, fresh fix-review evidence, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-07-persistence.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 06 file
  (phase-06-interiors-gate-and-hearth-key.md) as the next file to re-run with the
  findings attached.
- Do not push the branch; never merge a PR.
```
