<!-- docs/ - living operator guidance for repository Codex support. -->

# Codex in World of ClaudeCraft

Root and local `CLAUDE.md` files own repository facts, architecture, invariants and QA.
`AGENTS.md`, `.codex/`, and `.agents/` add Codex discovery and runtime guidance.
Claude-specific models, memory, slash commands and agent APIs do not apply to Codex.

## Start a session

1. Follow the root default release/worktree workflow unless the user explicitly selects
   an existing worktree or another workflow. Verify branch, HEAD and status before edits.
2. Launch Codex at the intended worktree root. Review its instructions, configuration,
   hook registrations and referenced scripts before trusting the project.
3. Restart after instruction/configuration changes to rebuild the startup context.
   Read relevant local `CLAUDE.md` files explicitly before entering their areas.
4. Where available, use `/hooks` to review changed hook definitions. Project trust alone
   does not approve them; do not bypass hook trust to make setup appear complete.
5. Use `$woc-qa` before calling implementation complete.

## What loads and when

Codex selects the first nonempty global `AGENTS.override.md` or `AGENTS.md` under
`CODEX_HOME` (normally `~/.codex`). It then walks from project root to startup CWD,
selecting at most one file per directory: `AGENTS.override.md`, `AGENTS.md`, then
configured fallback names. Later directory guidance has precedence. Here the fallback
is `CLAUDE.md`; root `AGENTS.md` wins discovery, so root `CLAUDE.md` still needs its
explicit read. Opening a nested source later does not rebuild the startup chain.
See [instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Configuration resolves from CLI/session overrides through trusted project layers,
selected profile, user config, system config, then defaults. A closer project layer
wins; an untrusted project omits its config, hooks and rules. The live harness can
supply additional settings and instructions. Repository files cannot override system,
developer or user authority. See [configuration precedence](https://learn.chatgpt.com/docs/config-file/config-basic#configuration-precedence).

Skill descriptions and metadata are available before the full `SKILL.md` is read.
Repository `.agents/skills` discovery follows startup CWD toward the repository root;
personal, system and plugin sources may also contribute. Skill-directory symlinks are
followed, and duplicate names are not merged. Inspect the exact available path before
assuming a project skill replaced a personal copy. An already-running desktop task may
still expose skills from its original checkout after shell commands change directory.
Read the intended worktree copy explicitly and restart there for future sessions.
See [skill discovery and metadata](https://learn.chatgpt.com/docs/build-skills).

## Models and harness controls

The repository pins no model, reasoning effort, provider or session permissions.
Inherit the active selection in subagents. Use the current
[model documentation](https://learn.chatgpt.com/docs/models) and the actual client's
supported controls when a task requires a selection change. API request parameters,
including those in the [GPT-6 Astra guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra),
are not automatically Codex configuration keys. Correctness and review depth remain
constant across model choices.

The project retains the documented `agents.max_threads` compatibility alias. Its
`max_depth` applies to V1 delegation and is ignored by V2; a desktop harness may impose
its own concurrency or nesting limits. These are defaults, not a promise that every
harness honors them. See [subagent settings](https://learn.chatgpt.com/docs/agent-configuration/subagents#global-settings)
and the [configuration schema](https://learn.chatgpt.com/docs/config-schema.json).

Custom reviewers request `sandbox_mode = "read-only"` and explicitly prohibit edits.
Verify live permissions: a harness can reapply parent overrides, so the TOML alone does
not prove filesystem enforcement. Approval policy and sandbox access are separate;
`never` suppresses approval prompts without granting access. See
[agent permissions](https://learn.chatgpt.com/docs/agent-approvals-security).

## Checked-in surfaces

| Surface | Ownership and purpose |
|---|---|
| `AGENTS.md` | Codex bootstrap, authority, routing and completion |
| `.codex/config.toml` | Canonical-doc fallback, instruction budget and delegation defaults |
| `.codex/hooks.json`, `.codex/hooks/*.sh` | Codex lifecycle adapters over shared local scripts |
| `.codex/agents/*.toml` | Read-only reviewer criteria with inherited model/effort |
| `.agents/skills/*/SKILL.md`, `agents/openai.yaml` | Workflow bodies, discovery and invocation policy |
| `docs/codex.md` | Living setup and maintenance runbook |
| `docs/qa-gate.md`, `scripts/lib/agent_surface_paths.mjs` | Shared QA and instruction-path classification |
| `tests/codex_setup.test.ts`, `tests/codex_hooks.test.ts` | Setup policy and actual hook behavior |

Personal credentials, profiles, sessions, caches and parked worktrees stay outside the
tracked Codex surface. Never copy credentials or unredacted personal configuration into a report.
The repository adds no plugin; repository skill discovery already serves this project.

## Skills and reviewers

- `$woc-qa` coordinates required checks, concern coverage and fresh review.
- `$woc-extract-and-test` implements behavior through a focused tested seam.
- `$woc-feature-plan` creates implementation-ready vertical slices.
- `$woc-review-pr` reviews and drafts; submitting feedback needs authorization.
- `$woc-file-issue` drafts and files only when creation is explicitly requested.
- `$woc-write-game-tooltips` writes or audits English tooltips against live mechanics.
- `$woc-image-to-glb` follows the shared asset acceptance and export pipeline.
- `$woc-release-merge-audit` inspects semantic damage after integration.
- `$woc-release-malware-audit` combines scanning with contextual triage.
- `$woc-codex-audit` audits this system; an explicit audit-and-fix request includes remediation.

Planning and issue creation disable implicit invocation. Other skills have precise triggers;
invocation policy is a selection control, not permission for writes. Honor authorization
already given, complete independent work when a question blocks one step, and keep actual
external-write and audit-only boundaries. Reuse canonical contracts without copying Claude
runtime directives. Freeholds records Codex lessons in `docs/freeholds/state.md` "Gotchas".

Registered roles cover sim architecture, host parity, persistence, database performance,
security, test coverage, frontend, release malware and official documentation. The main
agent owns integration and deterministic execution. Reviewers consume the assigned scope
and evidence. An unresolved diff is a failed dispatch, not a clean review.

Use every matching concern in `docs/qa-gate.md`. When its Codex column has no role, give a
bounded read-only subagent the corresponding Claude review criteria, excluding model
frontmatter, Claude tool/runtime instructions and duplicate test execution. Record the
fallback. Give overlapping implementation paths one owner and finish delegated work before
reporting completion.

`woc_database_performance` runs before database-affecting implementation decisions and
again on the finished diff, including driver/dependency and PostgreSQL engine, resource,
configuration and topology changes. The documentation role adds an optional credential-free
OpenAI Docs MCP; it does not remove inherited MCP servers. Use only relevant read-only tools.

## Hooks, CI and validation

Hook sources accumulate across active global, project and enabled-plugin layers. Definitions
need their own trust review; changed definitions may be skipped pending approval. Commands run
from session CWD. See [hooks](https://learn.chatgpt.com/docs/hooks).

- `SessionStart` resolves the worktree root through `.codex/hooks/ensure-hooks.sh`, respects
  an existing effective `core.hooksPath`, then delegates setup to the unchanged shared helper.
- `Stop` delegates to `.claude/hooks/qa-stop.sh` and adds module-extension predicates the
  shared script lacks. It scans staged, unstaged and untracked additions. A clean result is
  silent; a blocking result is JSON; the loop guard prevents repeated Stop blocking.

Hooks aid the edit loop. They do not enforce all tool writes or replace the QA gate. Claude's
`PreToolUse` generated-file guard is not registered in the repository Codex hook file; Codex
must still obey generated-file ownership. No hook execution is claimed merely from file presence.

CI classifies agent instructions, runtime directories and shared Git hooks as code so they
reach tests, malware checks and builds. The malware scanner covers instruction Markdown,
executable agent/config TOML and extensionless Git hooks; canonical instructions and nested
agent tooling under docs remain scanned while ordinary docs fixtures stay excluded. These checks supplement review;
signature scanning is not complete detection of malicious behavior.

Run focused tests while iterating and the canonical `node scripts/gate_select.mjs` before
readiness; `npm run gate` remains the deeper option. Reuse passing evidence unless a change,
failure or unresolved concern warrants repetition. Record the exact comparison base and exit
codes. Explicitly format/check new metadata, which `ci:changed` may omit while untracked even
after staging. After authorized commits, run `npm run ci:changed` after the actual last commit.

## Maintenance and history

Run `$woc-codex-audit` when the support layer changes. Keep a durable report in `docs/architecture/`
with inventory, sources, findings/dispositions, validation and fresh-review evidence. One-off
reports are historical snapshots; this file is the living runbook. Do not infer measured model
performance from instruction inspection.

The CI-side Codex reviewer was retired in 2026-08 by maintainer decision. Keep it retired;
interactive `$woc-review-pr` serves on-demand review. A future CI reviewer requires a separately
authorized security design. Historical model-specific experiments and gameplay Codex fixtures
retain their provenance. They do not select the coding agent's model.
