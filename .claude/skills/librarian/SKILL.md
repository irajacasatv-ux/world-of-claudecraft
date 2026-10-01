---
name: librarian
description: Sweep World of ClaudeCraft's instruction files (every CLAUDE.md and AGENTS.md, the agent and skill definitions, and the routing docs, as docs/ai-architecture.md defines them) for drift, then fix it. Use after each release mint, after a large rename or refactor, when a session finds an instruction the code contradicts, or when asked to clean up, align, or audit the docs or the AI architecture.
user-invocable: true
---

# Librarian: keep the instruction files true

Every AI session in this repository starts from its instruction files, so drift there costs
every later contribution. This sweep finds it, proves each finding against the code, and fixes
it in one reviewed change. The writing standard is `docs/ai-architecture.md`, "Writing
instruction files"; the per-diff check is the `docs-librarian` agent, which `/qa` dispatches on
any change to an instruction file. Pass `changed` to sweep only the files the current branch
touched; with no argument, sweep everything.

## 1. Set up

Follow the root `CLAUDE.md` default task workflow: a fresh worktree on the newest
`release/**` branch, installed with `pnpm install --frozen-lockfile`. A sweep is its own
change; never fold it into feature work.

## 2. Mechanical floor

Run `npx vitest run tests/instruction_drift.test.ts`. Fix every red: a renamed or deleted
path, module, or npm script gets its reference updated to the current name, or removed with
the sentence that depended on it. Add an `EXEMPT` row only for a reference that deliberately
names a non-file (an output, an example, an external repository), with the reason.

## 3. Judgment pass

Dispatch `docs-librarian` agents in parallel, one message, one batch each (sweep mode; give
each its file list and a tool budget, and ask for the full report as its final reply):

1. Root `CLAUDE.md`, `AGENTS.md`, `docs/qa-gate.md`, `docs/ai-architecture.md`, `docs/codex.md`,
   `.agents/skills/`, and `.codex/agents/` (repository facts only).
2. `.claude/agents/` and `.claude/skills/`.
3. `src/CLAUDE.md`, `src/sim/**`, `src/world_api/`, `src/net/`, `src/admin/`, `src/guide/**`,
   `src/editor/`.
4. `src/render/**`, `src/ui/**`, `src/styles/`, `src/game/`.
5. `server/**`, `tests/**`, `bot/`.
6. `scripts/**`, `public/**`, `docs/CLAUDE.md` (including its dead-evidence check), `headless/`,
   `python/`, `electron/**`.

With `changed`, dispatch one `docs-librarian` in diff mode instead. The Codex files are in
scope for stale repository facts only; their Codex-specific guidance belongs to the
`$woc-codex-audit` skill.

## 4. Confirm, then apply

Treat each finding as a claim: re-check it against the code yourself before editing (grep the
symbol, read the cited file, `git blame` both sides of a conflict). Apply the confirmed High
and Medium findings one at a time, as the agent's OLD/NEW or better. Do not apply, and list
for the maintainer instead: a change to a prohibition or safety rule, a conflict history
cannot order, anything that adds a command to run or loosens a gate, and every Low finding.

## 5. Validate and review

- `npx vitest run tests/instruction_drift.test.ts`, plus every test that reads a file you
  edited (`rg -l '<edited path>' tests` finds them), plus `npm run ci:changed`.
- Send the diff to a fresh `docs-librarian` in diff mode. Fix what it finds and repeat until a
  round returns no High or Medium finding.

## 6. Deliver

Commit with Conventional Commits (`docs(ai): ...`) and a body saying what drifted and why it
matters. Deliver per the root `CLAUDE.md` "Deliverable" rule, and list the flagged decisions
in the PR body so the maintainer can rule on them.
