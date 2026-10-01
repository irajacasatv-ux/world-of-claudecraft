<!-- docs/ - living operator guidance for the AI collaboration layer. -->

# The AI collaboration layer

World of ClaudeCraft is written by AI agents, so the files that brief those agents are as much
a part of the product as the code: every instruction an agent reads shapes every change it
makes. This guide describes what those files are, when each one loads, the standard they are
written to, and how they are kept true. Root `CLAUDE.md` owns the repository rules themselves;
this guide owns the layer that delivers them.

## What loads when

| Layer | Files | When an agent reads it |
|---|---|---|
| Root rules | `CLAUDE.md` | Every Claude Code session, in full. |
| Area rules | `<dir>/CLAUDE.md` | When the session reads a file in that directory. |
| Reviewers | `.claude/agents/*.md` | When a session or `/qa` dispatches one; each runs read-only in a fresh context. |
| Skills | `.claude/skills/*/SKILL.md` | When a request matches the skill's `description`, or on `/name`. |
| Hooks | `.claude/hooks/`, `.githooks/pre-push` | Automatically: the cheap invariant floor (`.claude/hooks/README.md`). |
| Codex | `AGENTS.md`, `.codex/`, `.agents/` | Codex sessions; `docs/codex.md` owns that side, and root `CLAUDE.md` stays canonical for both. |

**Instruction files** are every `CLAUDE.md` and `AGENTS.md`, the `.claude/agents/`,
`.claude/skills/`, and `.agents/skills/` definitions, and the three docs that route them:
`docs/qa-gate.md`, this guide, and `docs/codex.md` (`isInstructionFile` in
`scripts/lib/instruction_refs.mjs` is the same set). Every reference to "an instruction file"
in the other files means this set.

A rule lives in the narrowest file that covers everything it governs: an invariant of the whole
repository in root `CLAUDE.md`, an area's conventions in that area's `CLAUDE.md`, a procedure in
the skill that runs it, a review heuristic in the reviewer that applies it.

## Reviewers

Read-only agents, dispatched by `/qa` (through `qa-checklist`'s routing table) or directly. The
concern each owns, and its Codex counterpart, is the "Reviewer coverage" table in
`docs/qa-gate.md`.

| Agent | Reviews |
|---|---|
| `qa-checklist` | Every completed change: the end-of-contribution gate that names the others. |
| `architecture-reviewer` | `src/sim/` determinism, the `SimContext` seam, move-not-rewrite. |
| `cross-platform-sync` | Parity across the three hosts and the two `IWorld` implementations. |
| `migration-safety` | Schema DDL and persisted-state shape, save/load back-compat. |
| `database-performance-reviewer` | SQL cost, indexes, pool and lock pressure, stored-data growth. |
| `server-hot-path-reviewer` | Per-tick, per-request, and recurring server work. |
| `privacy-security-review` | Server authority, auth, secrets, input validation, dev-command gating. |
| `frontend-seam-reviewer` | HUD, styles, and render presentation seams; graphics fairness. |
| `render-performance-reviewer` | GPU preparation, render memory, hitch evidence. |
| `content-obligations-reviewer` | The same-change obligations of every game-content record. |
| `gate-integrity-reviewer` | The gate and CI selection pipeline. |
| `test-coverage-auditor` | Whether each claimed behavior has a decisive assertion. |
| `release-malware-audit` | Deliberately planted malicious code, at release. |
| `docs-librarian` | Instruction-file drift: stale facts, conflicts, history, dated prompting. |

Every diff reviewer (all but the whole-tree `release-malware-audit`) scopes from
`node scripts/review_scope.mjs`, the same integration base the selective gate uses, and
reports every finding with a confidence; the orchestrator confirms findings against the code
and filters in a separate pass. On a branch stacked on another feature branch, that base is
the parent branch: brief each reviewer to run `GATE_SELECT_BASE=<parent> node
scripts/review_scope.mjs`, because a subagent does not inherit your shell's environment.

## Skills

| Skill | Use |
|---|---|
| `qa` | The end-of-contribution review: `qa-checklist`, the reviewers it names, the deterministic floor. |
| `extract-and-test` | Build features and fix bugs module-first and test-first. |
| `feature-plan` | User-invoked: phase a large feature into multi-session work. |
| `review-pr` | Review a GitHub pull request the way the maintainer does. |
| `release-merge-audit` | Audit a release merge into a long-lived branch for drift. |
| `release-malware-audit` | The release-gate malicious-code scan. |
| `ci-triage` | Classify and fix a red, stalled, or cancelled CI run. |
| `i18n-locale-fill` | Fill pending locale rows at release. |
| `write-game-tooltips` | Write or audit player tooltips against the live mechanic. |
| `pr-screenshots` | Before/after screenshots for a visual change. |
| `file-issue` | File a GitHub issue in the house format. |
| `asset-pipeline` | Generate textured 3D assets through the Tripo pipeline. |
| `image-to-glb` | Build a procedural GLB from a reference image. |
| `blender-anim-pipeline` | Author new GLB animation clips. |
| `hunt-live-programs` | Find and gate shader programs that link during play. |
| `librarian` | Sweep the instruction files for drift and fix it. |

`tests/instruction_drift.test.ts` fails when an agent or skill has no row in these tables, so
the catalog cannot fall behind the directories.

## Writing instruction files

Every `CLAUDE.md`, `AGENTS.md`, agent, and skill is written to this standard; `docs-librarian`
reviews against it.

- **State the current rule and its reason.** Never let history stand in for the rule: no PR or
  issue numbers, phase or ruling ids, or dates as its authority, and no "now", "no longer", or
  "used to". The record of how a rule came to be belongs in commit messages and PRs.
- **Anchor on what does not rot.** Cite paths, exported symbols, and pinned tests; never
  literal counts or line numbers. When a list has an owner (a test, a table, a registry),
  point at the owner instead of copying the list.
- **One home per fact.** Point to the canonical file instead of restating it. When two files
  must both state a rule, they say the same thing, and a change to one changes both.
- **Write for a literal reader.** Current models do what the text says: say "every" or "all"
  when a rule has no exceptions, and put each exception inside the rule it qualifies. Use
  normal volume; CAPS only for a hard constraint, with its reason beside it.
- **Describe the outcome and the check, not a script**, except for fragile operations (git
  history, releases, credentials, destructive steps), where the exact command is the point.
- **Keep model and harness details out.** No model names, effort levels, or harness internals
  (tool parameter names, reply size limits): they change with every release. The root
  "Working style by model capability" block is the one place that speaks to capability tiers
  (and to effort, for runtimes that let the agent set it). Agent frontmatter (`model`,
  `tools`, `maxTurns`) and the "Delivering your report" block every agent shares are harness
  configuration, not rules: keep them identical across agents and change them together.
- **Leave review and delegation to the gates.** `/qa` already dispatches fresh reviewers; a
  file adds an instruction to verify or delegate only for a need the gates do not cover.
  Review prompts ask for every finding with a confidence and leave filtering to the
  orchestrator.
- **Give every prohibition its reason.** Changing a prohibition or a safety rule is a
  maintainer decision, never a cleanup.

## Keeping it aligned

1. **Every change:** `tests/instruction_drift.test.ts` fails on a path, source module, or npm
   script an instruction file names that no longer resolves.
2. **Every change to an instruction file:** `/qa` routes it to `docs-librarian`, which
   checks the new text against the code, the other instruction files, and this standard.
3. **After each release mint, and after any large rename or refactor:** run `/librarian`, the
   full sweep across every instruction file, as its own reviewed change.
4. **At each new model generation:** prompting that one model needed is often dead weight or
   harmful on the next, so the sweep re-reads the files against the new model's documented
   behavior.

## Operator setup

The model and effort level are operator settings, never instruction-file content. Every
contributor follows the root "Working style by model capability" tiers, which select by what a
model can do rather than by its name.
