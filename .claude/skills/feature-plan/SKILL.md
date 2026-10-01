---
name: feature-plan
description: Break a big feature into a phased multi-session implementation plan with per-phase starter prompts, progress tracking, and cross-session state. Invoked only as the /feature-plan slash command (disable-model-invocation keeps it out of the model-facing skill list by design); pass the feature description inline or you will be asked for it.
disable-model-invocation: true
user-invocable: true
---

# Feature Plan: multi-phase implementation planning

Break a large feature into a phased implementation plan designed for multiple Claude Code
sessions. Every phase runs as its own fresh session. The whole point is to **save context
per phase**: the orchestrator delegates reading and fan-out to subagents and keeps only
conclusions, so each session stays sharp. Effort levels, fan-out expectations, and
per-model behavior are NOT this skill's business: the root `CLAUDE.md` "Working style by
model capability" block owns them, and every prompt this skill emits references that block
instead of naming a model.

The user provides a feature description inline (`/feature-plan add a guild bank`) or you
ask for one.

**Before doing anything else: scan memory.** Check the `MEMORY.md` index and project
memory entries for prior decisions or feedback relevant to this feature's domain. Past
incidents encoded there are cheaper than rediscovering them.

## What this repo is (so the plan fits it)

Architecture and invariants live in the root `CLAUDE.md` (one sim three hosts, the
`IWorld` seam, server authority, 20 Hz determinism via `Rng`, the i18n contract, the
same-change content obligations); the plan must respect all of them, so reference that
file rather than restating it. Two planning-specific consequences:

- A feature added to the offline `Sim` is not done until it is mirrored online (via
  `ClientWorld`) and, where relevant, exposed to the RL env. Extend `IWorld` first, then
  implement it in **both** worlds.
- **The contributor i18n policy is stated ONCE, here, and referenced everywhere else in
  the generated packet.** Every new player-visible string is a `t()` key added in ENGLISH
  to the matching `src/ui/i18n.catalog/<domain>.ts` module and rendered via `t()`; never
  edit the `src/ui/i18n.locales/` overlays (release-time maintainer work), with one
  exception, M16: a wordy new English value needs real translations in the five non-Latin
  overlays in the same phase, or the always-on completeness test fails. Never fan out the
  other locales per phase; English rows ride the sanctioned pending mechanism and the
  maintainer fills them at release. Sim/server stay
  language-agnostic but their player text needs a matcher rule in `src/ui/sim_i18n.ts` /
  `src/ui/server_i18n.ts` in the SAME change; the S3 guard
  (`tests/localization_fixes.test.ts`) enforces it. Full model: root `CLAUDE.md` and
  `src/ui/CLAUDE.md`.

## Step 0: Base branch, dependencies, worktree (settle before exploring)

The root `CLAUDE.md` default is: base every task on the newest `release/**` branch, in its
own git worktree. Settle these three questions first and write the answers into
`state.md`; every starter prompt repeats the sync step, because a long packet drifts from
a moving base and each deferred sync grows into a large conflicting merge.

1. **Discover the base, never assume it.** `git fetch origin --prune`, then
   `git branch -r | grep 'origin/release/' | sort -V | tail -1`. A version written in a
   prompt or a memory is only the version that was newest when it was written; the newest
   release branch on `origin` wins every time.
2. **Unmerged dependency PRs.** When the feature needs work that is still in an open PR
   (a systems refresh it builds on), base the packet branch on that PR's HEAD branch, record
   the PR number and head in `state.md` as a dependency, and add a standing instruction to
   every phase's pre-flight: once the PR has merged, merge the newest `release/**` (which
   now contains it) and drop the dependency note. Never plan against a stale copy of an
   unmerged PR; re-fetch its head at every phase start until it merges.
3. **A dedicated worktree per packet** (`git worktree add ../<repo>-<feature> <branch>`,
   or the harness's worktree tool), installed with `pnpm install --frozen-lockfile`.
   Record the path in `state.md`. New-feature branches stay LOCAL until the maintainer
   says to push (pushing to `origin` exposes the feature to every contributor); routine
   fixes on known work push as normal, and pushes go to `origin`, never a fork.

**Per-phase sync (repeat in every starter prompt's pre-flight):** fetch, discover the
newest `release/**`, compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
merge if behind (or merge the dependency PR's fresh head while it is still open), run the
`release-merge-audit` skill after any non-empty merge, and re-run
`pnpm install --frozen-lockfile` if the merge touched `patches/` (a stale patched
dependency fails like a renderer defect and announces nothing).

## Orchestration toolbox: choose deliberately before running any phase

Pick the lightest tool that fits; escalate only when the work demands it. (How
aggressively to fan out is a working-style question; the root block owns it. The one
rule this skill repeats because every emitted prompt depends on it: **request fan-out
explicitly and name the split**; do not assume the runner infers it.)

| Tool | Use it when | Context effect |
|------|-------------|----------------|
| **Explore subagent** (`subagent_type: "Explore"`) | Mapping the codebase, locating files/patterns, "where is X used" | Raw reads stay in the subagent; only the summary returns. Default for all recon. |
| **Parallel Agent fan-out** (multiple `Agent` calls in one message) | Independent vertical slices (sim + server + ui + tests); parallel reviews | Each agent's work stays in its own context. Cap at ~5 manual agents. |
| **Continue a warm agent** (`SendMessage` to an agent that already ran) | Multi-round collaboration where an agent needs its prior context | Reuses its context instead of re-briefing a fresh one. |
| **Workflow** (the `Workflow` tool) | Batch-heavy phases needing scale + verification: mass edits, content sweeps, exhaustive audits | Intermediate results live in script variables, not your context. Opt-in: only when the running prompt includes `ultracode` (or the user asked). |
| **ToolSearch / deferred tools** | A phase needs a tool not loaded by default | Keeps unused schemas out of context. |

Hard rules:
- **Subagents inherit the parent model**; set a model only when you deliberately want a
  cheaper tier.
- **Manual parallel fan-out caps at ~5 agents.** Past that, use a Workflow; for
  batch-heavy phases the starter prompt should TELL the runner to add `ultracode`.
- **Every agent delivers its full report.** Ask for the complete report as the agent's
  final reply. Durable findings the next session needs (a QA verdict, a review ledger) go
  into the packet directory, written by the orchestrator from that reply; reply size
  limits and whether a subagent may write files depend on the harness version, so never
  rely on either.
- **Shared working tree.** A concurrent session may share the checkout, so another
  session's work can sit in the same index. Commit sequentially with EXPLICIT paths,
  never `git add -A`.

## Prompting discipline (apply to EVERY prompt this skill emits)

1. **State scope literally and exhaustively.** Write "all three hosts", "every new player
   string", "each of the nine classes"; never "the sections" or "the files". (Root
   working-style rule: models follow instructions literally; when a rule covers every
   case, say "every" or "all".)
2. **Reserve ALL-CAPS / NON-NEGOTIABLE for genuine determinism, server-authority,
   security, and data-integrity gates.** If everything is emphasized, nothing is.
3. **For review/QA agents, the finding stage is COVERAGE, not filtering.** Always prompt:
   "report every issue including low-severity and uncertain ones; ranking happens in a
   later step."
4. **Full reports, bounded work** (the rule above). Give each reviewer a tool budget and
   ask for the report by a set call count. If one stops without a report, resume it with:
   *"Stop reading more files. Reply with the full report now based on what you've already
   seen. No more tool calls. Format: BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT."*
5. **Demand structured handoffs.** A phase ends by writing its state to `progress.md` /
   `state.md` and (for big packets) a per-phase resume file; that IS the cross-session
   memory. The next session reads the summary, not the transcript.
6. **Never write the word "phase" into shipped artifacts.** Packets are internal
   scaffolding that gets deleted; "phase" belongs in the packet files only, never in
   code, comments, commit messages, or PR text.

## Context discipline (how each phase stays cheap)

- The orchestrator does **not** read large docs or sprawl across source files: it spawns
  an Explore agent that returns a focused summary (the coordinator monoliths and the i18n
  catalog + overlays are the big offenders; never read them whole in the main loop).
- Give each implementation agent ONLY the slice it needs (the Explore summary + its own
  files), never the raw planning docs.
- Delegate web/doc lookups to a subagent (classic-era formula references, a third-party
  API); keep raw docs out of the main context.
- For 12+ phase packets, use per-phase resume files so a fresh session resumes from a
  checkpoint, not from scratch.

## Step 1: Understand the feature

If no inline description, ask. Get enough detail to understand scope; do not
over-interrogate.

**Existing research or PRD.** When the feature already has a research report, PRD, or
design doc in the repo (`docs/prd/`, `docs/design/`), it is the input, not something to
redo: the Step 2 Explore agent summarizes it (adopted rulings, OPEN items, named seams,
non-negotiables, any MVP slice) and the plan cites it by path. Do not re-run web research
the report already carries; spawn the web-research agent only for questions the report
marks OPEN or does not cover.

## Step 2: Explore the codebase + research the external surface (parallel agents)

Spawn in parallel in a single message; do NOT read these files yourself. Adapt the split
to the feature (a content-only feature needs the sim/content explorer, not the net
explorer):

- **`research-explorer`** (when a report or PRD exists): the report and its appendices;
  returns the adopted rulings, OPEN items, named reusable seams, exclusions, and the
  suggested phasing or MVP slice.
- **`sim-explorer`**: `src/sim/` core (tick loop, combat/abilities/threat, mob AI,
  social/economy systems, RL observation surface, `Rng` usage) and the overlapping
  `src/sim/content/` records; note relevant test patterns in `tests/`.
- **`server-explorer`**: `server/` (GameServer loop and dispatch, wire snapshots,
  Postgres persistence and the inline `SCHEMA`, auth, social/moderation, rate limits,
  the RouteDef pipeline under `server/http/`).
- **`client-explorer`**: `src/render/`, `src/ui/`, `src/game/`; note which `IWorld`
  members the feature will read or call.
- **`net-explorer`**: `src/net/` and the wire lockstep with `server/game.ts`; use when
  anything crosses the network.
- **`admin-explorer`**: `src/admin/` when there is an operator surface (operators are
  users; admin strings localize too).
- **`headless-explorer`**: `headless/` + `python/` for RL-env work.
- **`dependency-explorer`** (when Step 0 found an unmerged dependency PR): that PR's diff
  on the surfaces this feature touches, so the plan builds on what is landing rather
  than on the release branch's older shape.

**Web-research agent (REQUIRED for any third-party surface or exact classic-era
formula):** pull current, primary-source data, return a tight brief with citations, and
mark anything unverifiable OPEN rather than guessing. Fold OPEN items into the plan as
blockers, never assumptions. Gameplay math follows real classic-era formulas; never
invent balance numbers.

## Step 3: Brainstorm with the user

Present summarized findings and brainstorm: what exists vs what is new, what `IWorld`
surface needs adding, ideas that leverage existing systems (parties, duels, arena, trade,
market, dungeons, talents, pets), what stands out while staying classic-faithful, and any
OPEN items needing a human decision before phasing. Get buy-in on the vision before
planning phases. When a report already carries adopted rulings, confirm them in one
message rather than reopening them.

## Step 4: Create the planning documents

Create `docs/{feature-name}/`:

- `README.md`: packet entry point and index; links every phase file plus the
  cross-cutting docs. A newcomer orients from here alone.
- `brainstorm.md`: vision, approved ideas, current state, reusable systems/`IWorld`
  members, new work needed, research findings + OPEN items (or a pointer to the existing
  report plus only the deltas).
- `implementation-plan.md`: TOC + canonical workflow + phase summary table. It carries
  the packet's ONE copy of the review-dispatch rules (below) and the validation matrix
  reference; starter prompts point at it, never inline a copy.
- `progress.md`: status table (implementation AND QA phases as separate rows) +
  per-phase deliverable/acceptance checklists + notes per completed phase.
- `state.md`: cross-phase cheat sheet (below).
- `qa-checklist.md`: whole-feature integration matrix verified once at packet completion
  (three-host parity, determinism, i18n completeness per the policy above, classic
  fidelity, server authority, persistence back-compat, performance budgets, copy scan,
  CI green, deploy verification only if deployed).

**For packets with 12+ phases (or non-trivial phases), prefer per-phase resume files**:
`phase-XX-{slug}.md` (a self-contained implementation prompt a fresh session can execute
without the TOC) and `phase-XX-qa.md` (its QA prompt). `implementation-plan.md` then
becomes TOC + workflow + summary table.

### Phase sizing (critical)

Prefer many small phases over fewer large ones. A phase that tries to do too much burns
context, produces sloppier output, and misses details. Each implementation phase must be
completable in a single focused session without exhausting the context window:

- One phase = one logical slice ("add the ability to the sim + content data + tests", or
  "wire the HUD window to the new `IWorld` members"). If you write "and also..." in a
  phase description, split it.
- 2 to 4 deliverables per phase is ideal; more than 5 means the phase is too big.
- When in doubt, split. Two small phases with QA passes beat one large rushed phase.

### Phase ordering

1. Phase 1 is always architecture/foundation: extend `IWorld` and the sim data model,
   establish the pattern later phases follow.
2. Every implementation phase gets a QA phase immediately after it (Phase 1, Phase 1 QA,
   Phase 2, ...), each a separate session, in strict order: phase, its QA, the next
   phase. The in-phase `/qa` run is a completion self-review, never a substitute for the
   dedicated QA phase. The one exception is a phase the plan marks LOW-RISK when it is
   written: docs, copy, or isolated UI polish that touches no `src/sim/`, wire, persistence,
   security, money, or test-infrastructure surface. A low-risk phase closes on its
   in-session `/qa` run instead, and its row in `progress.md` says so. When in doubt, it
   gets the paired QA phase, and the packet's last phase always does, because the final QA
   phase closes the packet.
3. Sim behavior lands server-side and mirrors into `ClientWorld` as you go, not at the
   end.
4. Then server persistence (additive DDL, save/load round-trip, JSONB back-compat), then
   renderer/HUD/i18n surface, then polish last.
5. When the report or the maintainer names an MVP slice, phase it so that slice is
   playable end to end first (every host, every store build) before any later tier or
   owner kind widens it; the architecture is built once and only extended afterwards.
6. Every completed phase or QA ends by naming the NEXT file to run (full path).
7. The final QA phase closes the packet, opens the PR, and offers **packet teardown**
   (below). Never merge the PR: green CI plus mergeable is not the merge trigger, an
   approving review is, and merging is the maintainer's action.

### Review dispatch (the one canonical copy lives in the generated plan)

The reviewer roster and what each agent owns is the table in `docs/qa-gate.md`
("Reviewer coverage"); do not copy it here or into prompts. What that table lacks, and
what `implementation-plan.md` DOES carry as the packet's single copy, is the dispatch
trigger: which diff surfaces spawn which agent. Generate it from these heuristics:

- Spawn an agent ONLY when the phase diff touches its surface: `privacy-security-review`
  for `server/`, `src/admin/`, `src/net/`, deploy/secret files, SQL/auth, or any new
  nondeterminism source in `src/sim/`; `migration-safety` for DDL or persisted-state
  shape changes; `database-performance-reviewer` for anything that can change database
  work or growth; `server-hot-path-reviewer` for work that runs per tick, per request,
  per broadcast, or per session (a shared read, a cache, a growing table or collection, a
  snapshot or event payload); `cross-platform-sync` for `IWorld` facets, sim
  behavior/events, wire or matcher changes, or the RL surface; `architecture-reviewer`
  for `src/sim/` determinism and the `SimContext` seam; `frontend-seam-reviewer` for
  `src/ui/`, `src/styles/`, and `src/render/` presentation code (plus the graphics-tier
  files under `src/game/` it names); `render-performance-reviewer` for any diff that
  creates GPU work (a material, a light, a GL context, a scene attach, VFX lifetime, a
  performance probe); `content-obligations-reviewer` for any `src/sim/content/` record
  change (the same-change obligations); `gate-integrity-reviewer` for gate/CI pipeline
  files; `docs-librarian` for any instruction file the phase adds or changes (the set
  `docs/ai-architecture.md` defines);
  `test-coverage-auditor` when a phase's test additions are the deliverable;
  `qa-checklist` when a phase or deliverable set is COMPLETE (the `/qa` skill runs it
  with the fan-out it names).
- Most phases trigger one or two agents. If no surface matches (docs or comments that are
  not instruction files), spawn NONE; do not default to running a security review anyway.
- Prompt every spawned reviewer for COVERAGE, not filtering, ask for its full report as
  its final reply, and do not commit until each reports no BLOCKING issues.

### Validation (referenced by every phase; the matrix lives in `state.md`)

Baseline per phase: `npx tsc --noEmit` plus the affected vitest files (one file at a
time while iterating); add `tests/architecture.test.ts` for `src/sim/` changes,
`tests/localization_fixes.test.ts` if any player text or emit changed, the
wire/snapshot suites (`tests/snapshots.test.ts`, `tests/env_protocol.test.ts`,
`tests/bandwidth.test.ts`) if the protocol changed, and `npm run ci:changed` for Biome
on changed files AFTER the phase's final commit (read its exit code, then filter any
error paths against your own `git diff <base> HEAD --name-only` before calling a red
"scope noise"; fix with a SCOPED `npx @biomejs/biome check --write <file>`, never
whole-tree, and re-run the check, because a format pass is not a check pass).

**The merge bar is CI green on the PR** (root `CLAUDE.md`, "Deliverable"). Once the
branch is cleared for pushing, push and watch (`gh pr checks --watch` or a background
watcher) to completion instead of running the full suite locally, as long as CI ran the PR
test tier (`code=true`); the maintainer prefers CI here. Before the branch is cleared, and
for a docs-only phase, gate locally with `node scripts/gate_select.mjs`.
Step lists and tiers live in `docs/qa-gate.md`; do not restate them in prompts.

### Code hygiene (include once in the plan's workflow section)

Module-first per the root Modularity section and the `extract-and-test` skill (the
monolith ratchet `tests/monolith_budget.test.ts` enforces it); every new behavior gets
tests (sim changes get a determinism assertion); update or remove tests you break;
delete replaced code, unused imports, and dead types; never hand-edit generated files;
no em dashes, en dashes, or emojis anywhere; the word "phase" never leaves the packet.

### The shared starter-prompt template (one template; QA phases apply the delta below)

````
### Starter Prompt
```
This is Phase N {(QA)} of the {Feature Name} feature: {Phase Title}.

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: add the keyword `ultracode` to this prompt if this phase is batch-heavy
(content sweeps, bulk catalog additions, exhaustive audit) so orchestration runs
through a Workflow instead of hand-spawned agents.

Goal: {one sentence}

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/{feature-name}/state.md, on its branch.
  Verify `git status` is clean; if not, ask the user (a concurrent session may share
  this checkout).
- Sync the base: `git fetch origin --prune`; discover the newest release branch
  (`git branch -r | grep 'origin/release/' | sort -V | tail -1`); {while the dependency
  PR #NNNN is open, merge its fresh head instead}; merge if behind; run the
  release-merge-audit skill after a non-empty merge; `pnpm install --frozen-lockfile`
  if the merge touched patches/.
- Memory scan: check MEMORY.md and entries relevant to this phase's domain
  (suggested topics: {phase-specific}).

STEP 1 - LOAD CONTEXT:
Read docs/{feature-name}/state.md, progress.md, and this phase's file yourself; they are
written for this session. Spawn an Explore agent to survey and summarize:
- {relevant source files, listed individually}
- the relevant sub-CLAUDE.md files
The agent returns: {specific info this phase needs}.
{If a third-party API or exact classic-era formula is involved: also spawn a
web-research agent; unverifiable facts are OPEN, never guessed.}

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Pick the lightest tool that fits (Explore for recon, parallel Agent fan-out for
independent slices, Workflow for batch/scale). Request fan-out EXPLICITLY and name
the split. Give each agent ONLY the Explore summary. Use `isolation: "worktree"` only
if agents edit overlapping files. Every agent replies with its full report; write
durable findings into the packet directory yourself.

{Agent A} deliverables:
- {bullet}

INVARIANTS THIS PHASE MUST KEEP (call out the ones in play):
- Determinism: all randomness via `Rng`; no wall-clock in `src/sim/`.
- Seam: extend `IWorld` first, then implement in BOTH `Sim` and `ClientWorld`.
- Server authority: the client never decides outcomes.
- i18n: the contributor policy in docs/{feature-name}/implementation-plan.md
  (English-only catalog keys; matcher rule in the same change for sim/server text).
- Content: any src/sim/content/ record carries its same-change obligations
  (root CLAUDE.md new-content bullet: deeds, reliquary, wiki regen + guide keys,
  item art, name fills).
- Classic-era formulas only; do not invent balance numbers.
- {Money, token, or store-policy gates named in state.md: fail-closed flags, counsel
  sign-off before enable, no purchase surface in a store build that forbids it.}

Out of scope (do NOT do in this phase):
- {explicit exclusions}

STEP 3 - VALIDATION + REVIEW DISPATCH:
- Run: {phase-specific commands from the state.md validation matrix}.
- Spawn review agents per the dispatch rules in
  docs/{feature-name}/implementation-plan.md (the one canonical copy): check
  `git diff --name-only` against the phase-start commit, spawn ONLY matching agents
  (often one or two; none if no surface matches), prompt each for COVERAGE not
  filtering, and ask for its full report as its final reply. Do not commit until no
  BLOCKING issues remain.

STEP 4 - COMMIT CADENCE:
{2-5} commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- {commit headline}
Then `npm run ci:changed` after the LAST commit; read the exit code.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] {item}

STEP 6 - DOC UPDATES + MEMORY:
- Update progress.md (phase status; deferrals) and state.md (new IWorld members,
  SimEvents, wire fields, endpoints, tables, i18n keys; locked decisions).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, deferred
items, and the FULL PATH of the next file to run (the paired QA file after an
implementation phase, or the next implementation file after a LOW-RISK phase or a QA
phase).

STOPPING RULES:
- {explicit stop conditions, e.g. "stop if determinism cannot be preserved"}
- Do not push a new feature branch without the maintainer's go; never merge a PR.
```
````

**QA-phase delta** (apply to the same template):
- Goal becomes: audit the paired implementation phase for correctness, missing tests,
  dead code, determinism, three-host parity, and i18n completeness; the Explore agent
  also loads the implementation phase's prompt (what was promised) and the phase diff.
- STEP 2 spawns audit agents instead of implementers: `qa-checklist` (the
  phase-completion gate; brief it with every deliverable and acceptance criterion, edge
  cases, offline/online parity, and dead code the phase left), `test-coverage-auditor`
  (untested paths, determinism assertions, orphaned tests, assertions that mean
  something), and the dispatch-rule reviewers.
- STEP 4 becomes FIX: apply all BLOCKING and SHOULD-FIX items, re-run the validation
  matrix, commit fixes separately from the verdicts, and review the fix commits too
  (fixes are unreviewed code until someone reads them).
- Final response format: QA verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts found
  and fixed, deferred items, the next file's full path.
- Final QA phase only: run the whole-feature `qa-checklist.md` matrix, capture the PR
  screenshots for any visual change (the `pr-screenshots` skill, committed under
  `docs/screenshots` and referenced from the PR body), run **packet teardown** (below),
  then open the PR off the base branch following `.github/PULL_REQUEST_TEMPLATE.md`
  and watch CI. Stop at "pushed, green, ready for review".

### Cross-cutting gates (include once in the plan, referenced by phases)

- **Persistence phases:** additive, idempotent inline DDL (`CREATE TABLE IF NOT
  EXISTS` / `ADD COLUMN IF NOT EXISTS`; there is no migrations directory), JSONB
  back-compat for old saves, indexes for new predicates, a retention story for every
  table that grows, and a save/load round-trip test.
- **Client phases:** touch controls and mobile safe areas work (verify with the mobile
  screenshot scripts, e.g. `node scripts/mobile_visual.mjs`); no hover-only essential
  info; graphics tiers stay gameplay-neutral; before/after screenshots for any visual
  change (desktop and mobile) via the `pr-screenshots` skill.
- **Performance:** sim work stays in the 20 Hz tick budget (no per-tick allocations in
  hot paths); snapshots stay interest-scoped and delta-guarded; renderer reads, never
  mutates; every new GPU producer is a client of the preparation scheduler;
  `npm run asset:budget` / `npm run perf:tour` for budget-touching phases; keep the
  dependency set tiny.
- **Money, tokens, and store policy:** any feature that takes payment, touches $WOC or
  Claudium, mints or reads on-chain state, or ships a purchase surface carries three
  gates the plan lists as OPEN blockers with an owner: a counsel sign-off before enable
  (the marketplace precedent), a fail-closed feature flag defaulting off, and a
  per-distribution surface map (web, website desktop, Steam, Epic, App Store, Google
  Play, Solana dApp Store) pinned by tests so no store build shows a surface its policy
  forbids. The economy service owns prices and token math; the game never computes them.
- **Deploys are rare, deliberate, separate steps**, never part of a phase: follow
  `DEPLOY.md` end to end (it owns the update path and the `/api/status` health check).
  Never set `ALLOW_DEV_COMMANDS=1` in production.

### state.md contents

ONLY what the next session needs: the worktree path, branch, base branch, and any
dependency PR with its merge-forward instruction; current phase + status; locked design
decisions (adopted rulings from the report, cited by section); non-negotiable
constraints; the validation matrix by change type (sim-only, content-only, server-only,
net/wire, ui/render, headless/RL, plus `npm run ci:changed` for any code change and CI
green as the merge bar); key file paths; per-phase lists of new files, `IWorld` members,
`SimEvent`s / wire fields, endpoints, tables, i18n keys; OPEN research items, policy
gates, and known gotchas.

### Packet teardown (final phase only)

The packet in `docs/{feature-name}/` is scaffolding, not a shipping artifact. Once every
phase is green, the final QA phase MUST offer to remove it before a PR: surface any
deferred follow-ups FIRST, ask the user explicitly, and on confirmation delete ONLY that
directory with an explicit path (`git rm -r docs/{feature-name}/` and a
`docs: remove {feature-name} planning scaffolding` commit if committed; `rm -rf` if never
committed). If the user declines, leave it. Never delete anything else and never
`git add -A`. A research report or PRD that predates the packet is not scaffolding; it
stays.

## Step 5: Commit and summarize

Commit the planning docs (EXPLICIT paths, Conventional Commit with a body, no em dashes
or emojis): `docs: add {feature-name} phased implementation plan`. Keep the branch local
until the maintainer says to push.

Present to the user: the base branch and any dependency PR; phase count and one line per
implement/QA pair; how to start Phase 1 (paste its starter prompt into a fresh session in
the packet worktree); locked decisions in `state.md`; OPEN research and policy items; and
that the final QA phase offers packet teardown before the PR.
