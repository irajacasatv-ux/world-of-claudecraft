<!-- docs/architecture/ - dated Codex audit record, not a runtime instruction source. -->

# Codex instruction and tooling audit, 2026-09-07

Status: **CURRENT**. All 31 in-scope findings are fixed (eight P1, 23 P2), with zero
open findings. Required gates and fresh independent review passed. This report evaluates
repository support using the active GPT-6 Astra session and inherited reasoning, not a
model migration. Outside-scope recommendations and external documentation discrepancies
remain explicitly qualified below.

## Scope and comparison

The authorized checkout is `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`,
branch `feature/freeholds`. Before edits, `git status --short` was empty,
`git branch --show-current` returned that branch, and `git rev-parse HEAD` returned
`15b483b84aa3bfa37bf40f3c9667f53885ad59f9`. The expected and actual checkpoints matched;
there was no intervening work. This commit is the comparison base for this entire round,
including untracked additions. No branch switch, reset, new worktree, merge, rebase, push,
PR, issue or posted review was performed.

The task expressly authorized local fixes, validation, independent review and local commits,
and excepted the normal release/new-worktree workflow. It did not authorize personal
configuration, application/plugin-cache, Claude setup, gameplay or asset changes. All
`CLAUDE.md`, `.claude/**`, furnishing implementation and furnishing QA evidence remain
unchanged. Freeholds edits only clarify Codex runtime/memory references and record lessons.
The next content packet was not implemented. CI now includes the already-existing furnishing
screenshot evidence in its sparse test checkouts. No asset authoring or export was run.
The required browser gate rewrites existing gathering screenshots as a test side effect:
four under `docs/screenshots/intentional-gathering-pr1/` on the first run, plus
`docs/screenshots/intentional-gathering-pr2/source-picker-1280x720.png` on the final run.
The parent restored their exact HEAD bytes after each gate and verified the entire screenshot
diff was empty. No asset/evidence delta is delivered.

## Effective instruction inventory

This is a dated inventory, not a promised permanent file count. Root and relevant local
contracts were read in full. `docs/CLAUDE.md` makes this a historical record;
`docs/codex.md` remains the living operator guide.

| Surface | Loading, precedence, ownership and coverage |
|---|---|
| System/developer and active user instructions | Highest runtime authority. This task selects the exact worktree and authorizes local remediation/commits. Live tools expose GPT-6 Astra inheritance, seven total collaboration slots, full filesystem access and no approval prompts. |
| `AGENTS.md` | Sole root Codex entry; no nested `AGENTS.md` or `AGENTS.override.md` existed at the starting checkpoint. It directs explicit canonical reads and excludes Claude runtime semantics. |
| Root and nested `CLAUDE.md` | Canonical repository facts/invariants. Root AGENTS wins automatic discovery, so root CLAUDE is explicitly read. Relevant locals: docs, scripts and tests. Other domain contracts remain discoverable and unchanged. |
| `.codex/config.toml` | Trusted project defaults: fallback `CLAUDE.md`, 65536-byte guidance budget, legacy concurrency alias and V1 depth limit. No model, effort, provider, auth or session-permission pins. No deeper project config or configured alternate fallback was found. |
| `.codex/hooks.json`, `.codex/hooks/qa-stop.sh`, new `.codex/hooks/ensure-hooks.sh` | SessionStart and Stop registrations plus executable adapters. Hooks need separate trust; source presence does not establish live invocation. Script bodies are read at execution, so review dependencies too. |
| `.claude/hooks/ensure-hooks.sh`, `.claude/hooks/qa-stop.sh`, `.githooks/pre-push` | Active shared dependencies referenced by Codex adapters. Kept unchanged. Codex wrapper repairs root resolution and effective-owner handling without altering Claude behavior. The pre-push floor is an executable, not inert documentation. |
| `.codex/agents/*.toml` | Standalone read-only reviewers: cross-platform, database performance, docs researcher, frontend, persistence, release malware, security, sim architecture and test coverage. All names, required metadata, inheritance and read-only instructions reviewed. |
| `.agents/skills/**` | Every SKILL body and `agents/openai.yaml` inspected: audit, extract/test, feature plan, file issue, image-to-GLB, QA, release malware, release merge, PR review and tooltips. No repository skill scripts/reference directories or symlinks existed. Recursive referenced Markdown is now scanner-tested before such files arrive. |
| Shared asset instructions | Image adapter follows `.claude/skills/image-to-glb/SKILL.md` and `docs/image-to-glb-asset-workflow.md` acceptance/fingerprint rules. Installed img2threejs is authoring assistance, not a build dependency. No asset workflow was executed. |
| Reviewer fallbacks | Concern criteria in `.claude/agents/{server-hot-path-reviewer,render-performance-reviewer,content-obligations-reviewer,gate-integrity-reviewer}.md` remain canonical and unchanged. Codex excludes their Claude frontmatter, team APIs, scope shortcuts and duplicate command execution. |
| Living docs/templates | `docs/codex.md`, `docs/qa-gate.md`, root README Codex pointer, Freeholds implementation plan and Codex starters reviewed. The exact next starter now uses state Gotchas rather than Claude personal memory. Central AGENTS maps inherited starter wording to Codex runtime authority. |
| Package/gate/CI | `package.json` security and changed-file scripts, `.github/workflows/ci.yml`, classifier, selection import closure, malware scanner, `.gitignore`, pre-push hook and regression tests inspected. No package/lockfile changes. Agent-only changes now reach CI; selection's fail-closed behavior and all required steps remain. |
| Retired/historical/generated | CI AI reviewer remains absent, with its retirement tests preserved. Historical performance-loop model choices retain provenance. `tests/parity/golden/priest_codex.json` and the final artwork packet use the gameplay Codex meaning. Generated i18n/media/SFX outputs remain generator-owned; no asset or gameplay fixture was repinned. |

### User, installed and harness layers (read-only)

The user config is `~/.codex/config.toml`; `CODEX_HOME` is unset. No global AGENTS or
override, Unix system config/requirements, or additional ancestor project instructions
were found. No selected profile was observed. The local CLI is `codex-cli 0.153.4`,
resolved through `~/.local/bin/codex` to its standalone package. `codex features list`
reported hooks, skills and multi-agent facilities available; it is not a dump of the
already-running desktop task's effective configuration.

The personal config selects Astra/ultra and enables hooks. This records a user selection,
not a new repository pin or an API compatibility assertion. It trusts the original
Documents checkout. Hook trust records also name that original checkout; no evidence
established that this target worktree's changed hooks were trusted or fired natively.
All behavior claims below use isolated subprocess fixtures. The effective Git hook path
still points to the original checkout's `.githooks`; it was observed and preserved.

Global hooks include GitKraken CLI lifecycle callbacks and NotchBar status callbacks.
GitKraken's PermissionRequest registration has a timeout of 86400 seconds. Global notify
configuration is also present. Enabled Warp hooks cover SessionStart, Stop,
PermissionRequest, UserPromptSubmit and PostToolUse. The browser plugin declares a Stop
MCP callback to `node_repl.turn_ended`. These sources accumulate with repository hooks;
they are not replaced by project configuration. Their definitions/trust presence is
observed, their invocation and application-internal effects are not asserted.

Configured plugins: Warp, Codex app tools, Sites, browser, visualize, documents, PDF,
spreadsheets, presentations, template creator, computer use and unified computer use.
The session additionally advertises plugin management and deep research skills. Cached
OpenAI templates exist without a corresponding advertised skill here. Cache presence,
enabled configuration and session exposure are separate observations, not synonyms.
Plugin manifests were inventoried read-only; none was edited or installed.

Personal skills include find-skills and orca-cli. System skill files include imagegen,
OpenAI Docs, plugin creator, skill creator, skill installer and an unadvertised review-agent.
Three different physical skill directories declare `img2threejs`: the primary directory,
`img2threejs-v1.3.0-7b1c62c-backup`, and `img2threejs.bak-20260728112232`; their body hashes
differ and all three appear in this session. They are directories, not symlinks. Do not
assume a same-name skill overrides the others.

The session's repository skill paths point at the original Documents checkout. Their
bodies matched this worktree at the starting checkpoint but will not acquire this round's
edits through shell CWD changes. The target copies were read explicitly. Feature-plan and
file-issue exist with implicit invocation disabled but are not advertised in this session's
skill list; their filesystem presence is not proof of exposure. No repository correction
can rebuild an already-running task's discovery state.

The documentation role adds only OpenAI Docs MCP in its own file, but inherited MCP servers
remain available. The user's configured server names include OpenAI Docs, Xcode tooling,
Better Stack, Cloudflare services/docs, Context7, Playwright, Proxyman, Resend, Sentry,
SmartBear, Sosumi, Stitch, Supabase, Figma, Node REPL and computer use. Credentials, headers,
auth files and connection values were not emitted or copied into this record. Custom role
instructions loaded in the docs child; its live permission block still inherited full
access/never. Thus read-only role intent was observed, filesystem enforcement from agent
TOML was not proven.

## Official guidance and discrepancies

Fetched current official sources on 2026-09-07 with OpenAI Docs. The documentation
researcher independently checked consequential claims; the parent fetched discovery,
precedence, hooks and subagent settings directly. These are unversioned pages.

| Source | Consequence for this repository |
|---|---|
| [GPT-6 Astra guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra) | Audit literal skill influence, unnecessary pauses, delegation instructions and verification scope. Apply concise model-neutral corrections; do not copy API migration parameters into Codex TOML. |
| [AGENTS discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Startup chain, one nonempty file per directory, override/AGENTS/fallback order, root-to-CWD precedence and explicit nested reads. |
| [Configuration precedence](https://learn.chatgpt.com/docs/config-file/config-basic#configuration-precedence) | CLI/session, trusted project, profile, user, system, defaults; trust controls project loading. |
| [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) | Verify actual Codex keys and machine-owned settings; no API-shaped settings were added. |
| [Skills](https://learn.chatgpt.com/docs/build-skills) | Metadata precedes bodies; symlinks are followed; duplicate names are not merged; implicit policy controls selection, not authorization. |
| [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | Standalone role requirements, model/effort inheritance, live override behavior and canonical concurrency setting. |
| [Schema](https://learn.chatgpt.com/docs/config-schema.json) | `max_depth` is V1-only and ignored by V2. Schema retrieval required official web fallback after Docs MCP failed its JSON retrieval. |
| [Hooks](https://learn.chatgpt.com/docs/hooks) | Sources accumulate; project and definition trust differ; hooks run from session CWD. Empty success output is valid; nonempty Stop output must use its JSON contract. |
| [Approvals/security](https://learn.chatgpt.com/docs/agent-approvals-security), [permissions](https://learn.chatgpt.com/docs/permissions) | Approval policy and filesystem access differ. Do not change real permissions to satisfy tests or infer enforcement from a file alone. |

Unresolved external discrepancies are recorded rather than converted to unsupported settings:

- The dedicated AGENTS guide describes a combined byte cap; advanced config says each
  file. No truncation behavior was measured in this run.
- Config reference effort enumeration stops at xhigh; subagents docs and this harness expose
  higher settings. Preserve inherited reasoning rather than assert a universal enumeration.
- The schema omits `max_threads`, while subagent prose explicitly supports it as a legacy
  alias. Retaining that documented alias avoids an unneeded compatibility migration.
- Config reference describes `skills.config.path` as a directory; the skill guide has a
  SKILL.md example. No personal skill-disable entries were rewritten.

No latency, cost, model-quality or task-performance improvement was measured. The verified
outcome is clearer instructions and stronger tested tooling behavior.

## Findings ledger

Every evidence phrase below is anchored to the starting checkpoint or the named failing
fixture; it is not a current instruction. `P1` denotes a reliability/security-coverage defect;
`P2` includes maintainability and nits. No P0 was found. Fix verification and final disposition
are recorded with the final evidence below.

| ID | Severity | Exact evidence and consequence | Correction / verification |
|---|---|---|---|
| F01 | P1 | `isCodePath` in `scripts/lib/ci_change_classify.mjs` omitted agent directories and canonical names; `CLAUDE.md => false` was pinned. Agent-only PRs skipped tests/security/builds. | Shared path policy widens code classification, with independent family and rename assertions; selection import closure includes the new helper. |
| F02 | P1 | `scanFile` used only `MD_RULES` for `.codex/agents/*.toml`, missing executable MCP launch content. | Dual source/instruction scanning, real `scanTree` miner and instruction fixtures with literal HIGH. |
| F03 | P1 | `classify` omitted extensionless `.githooks/pre-push`, which SessionStart enables. | Git-hook paths receive source rules; collection and actual HIGH detection tested. |
| F04 | P2 | Codex skill matching recognized only exact SKILL.md and metadata, excluding nested reference Markdown. | Recursive skill Markdown policy and deep fixture; prospective coverage, no existing malicious reference found. |
| F05 | P2 | The scanner skipped `docs/` before recognizing its actual canonical `CLAUDE.md`. | Canonical instructions, `docs/codex.md` and nested agent runtime directories remain reachable under docs. Eight exact discovery positives, literal five instruction/three executable HIGH hits, and ordinary docs negatives cover the boundary. |
| F06 | P1 | `.codex/hooks/qa-stop.sh` used `git diff -U0`, so staging a module debugger/focused test bypassed its predicates. | Compare against HEAD; staged/unstaged/untracked `.mts`/`.cts` subprocess matrix and loop/JSON checks. |
| F07 | P2 | SessionStart called shared ensure-hooks without normalizing its `$PWD`/`CLAUDE_PROJECT_DIR` root. | Codex root-resolving wrapper, real registered-command tests from nested/root CWD and stale inherited environment. |
| F08 | P2 | Shared setup checked only `git config --local --get core.hooksPath`, shadowing other effective owners. | Wrapper respects all effective owners and config errors; isolated scope, empty-value and idempotency fixtures. Fresh review also corrected the runbook claim that a local unset disables every effective owner. |
| F09 | P2 | `scripts/ci_changed.mjs` promised repo-root execution but Biome spawn inherited caller CWD. | Explicit spawn CWD; fixture reproduces the old `/scripts` result and pins child exit 73 propagation. |
| F10 | P1 | Existing `tests/ci_workflow.test.ts` failed because `furnishing-item-kind` evidence was referenced but absent from sparse cones. | Include existing evidence in all five sparse test jobs and their exact block pin; no screenshot changes. |
| F11 | P2 | `codex_setup` ignore checks only searched for strings and could miss later override rules. | Real Git check-ignore fixture verifies shared and private paths independently. |
| F12 | P2 | Most implicit flags could flip without failing, including issue creation's false policy. | Independent complete per-skill boolean map. No invocation policies were weakened. |
| F13 | P2 | Scanner severity tests compared to exported `r.sev`, and instruction fixtures pinned categories only. | Literal gate-blocking severities plus non-vacuity; preserve the intentional MEDIUM allowance-increase rule. |
| F14 | P2 | Hook tests claimed trackedness while proving only existence, omitted clean exit checks; malware test duplicated a redactor pin and had a stale title. | Precise repository-script claim, subprocess statuses, effective tracking verification before commit, deduplicated assertion and accurate comments. Fix-round review also removed lint nits and a focused-test fixture literal that triggered the real Stop check. |
| F15 | P1 | PR skill's single exception allowed “push, edit the branch” when asked to “submit the review”. | Separate feedback authorization from local implementation, commits and pushes. |
| F16 | P1 | Test reviewer said “Exit early” without distinguishing unresolved/empty default diffs from resolved prose-only scope. | Require assigned scope, UNRESOLVED evidence and nonempty in-scope behavior verdicts. |
| F17 | P1 | Generic Codex QA omitted fallback for four mandatory concerns marked not mirrored in the canonical QA table. | Require every matching concern through bounded fallback criteria and shared evidence. |
| F18 | P2 | Freeholds fallback said Claude prompts run “verbatim”, importing model frontmatter and reviewer-owned commands. | Reuse concern criteria only; preserve inherited runtime and coordinator execution. |
| F19 | P2 | Image adapter named `package-lock.json` as the active fingerprint input. | Correct to canonical `pnpm-lock.yaml`; preserve asset-specific acceptance/gates and generate no assets. |
| F20 | P2 | QA/extract/merge-audit adapters required full gate where canonical selective gate is sufficient. | Point at the canonical bar, retain deeper/full fallback, prohibit duplicate broad runs without reason. |
| F21 | P2 | Runbook worktree rule applied only when sessions overlap, unlike canonical default. | Reference canonical workflow and explicit user exceptions. |
| F22 | P2 | Runbook labeled Sol/Terra/Luna ranking “Current public model guidance”. | Replace ranking and obsolete spelling discussion with official links and inherited choices; no Astra pin. |
| F23 | P2 | Runbook omitted the registered tooltip skill. | Include the workflow in the operator inventory. |
| F24 | P2 | Next Codex starter asked for MEMORY.md despite implementation-plan's state Gotchas mapping. | Correct exact next starter, centralize inherited runtime mapping and record lessons in authorized state. |
| F25 | P2 | Tooltip audit trigger unconditionally directed rewriting English and adding tests. | Distinguish read-only audits from authorized authoring; reuse existing coverage for prose-only changes. |
| F26 | P2 | Tooltip skill said “Stop and record a mismatch”, potentially stopping independent work. | Report unresolved mechanic claims, preserve truthfulness and continue independent authorized work. |
| F27 | P2 | QA said reject “inherited” findings even for an explicitly scoped whole-tree audit. | Judge findings against requested scope and explain rejected candidates. |
| F28 | P2 | Runbook promised a universal one-level cap and “only” official MCP; hook trust/enforcement claims lacked live-runtime qualification. | Distinguish documented defaults, observed harness behavior, inherited MCP and unverified native execution. |
| F29 | P2 | Default worktree/skill wording left repeated authorization and task-stopping interpretation ambiguous. | Concise authority/follow-through rule, bounded ownership/delegation and meaningful updates; real invariants retained. |
| F30 | P2 | Audit skill described assessment but not the explicitly authorized complete fix/review workflow. | Require findings dispositions, tests, exact evidence, fresh complete-round review and no CURRENT with open findings. |
| F31 | P2 | QA runbook said the gate uses “the tracking branch”, contradicting `resolveSelectBase`. | Correct override/release/main/HEAD fallback description; explicit checkpoint used here. |

### Rejected and outside-scope observations

- Rejected: audit skill's read-only default blocks this task. Its existing implementation
  exception already applied; explicit user authorization remains sufficient.
- Rejected: replace the legacy concurrency alias or add an Astra/effort pin solely for this
  audit. Official prose still supports the alias, and runtime inheritance is intentional.
- Rejected: empty successful Stop output violates the protocol. Official hooks docs allow it.
- Rejected: every wallet-category rule must be HIGH. The allowance-increase signature is
  intentionally MEDIUM; the corrected test pins that exception explicitly.
- Rejected: scan all docs source-looking fixtures or self-exclude every Codex agent to quiet
  broadened scanning. Preserve ordinary docs exclusions; keep executable agent settings scanned.
  A benign malware-review criterion self-matched after coverage widened; equivalent wording
  preserves the review concern without suppressing detection or changing severity.
- Retained: explicit external-write authorization, dirty-checkout pauses, provenance/asset
  gates, generated-file ownership, required tests, and retired-reviewer boundaries.
- Outside repository-write scope: remove duplicate personal img2threejs backups from discovery,
  audit global GitKraken/NotchBar/Warp callbacks and the long permission hook timeout, reconcile
  personal hook ownership, and restart the desktop task in this worktree. No personal config,
  plugin cache, installed application or Claude setup was changed.
- Historical: `docs/perf/insane-parity-loop-prompt.md` retains its dated model/effort experiment;
  no active inbound reuse was established. Gameplay Codex names and model-specific fixtures
  retain their original meaning and provenance.

## Validation and independent review

Evidence is coordinator-owned. Raw logs are retained locally under `tmp/codex-audit/`;
actual commands and process exit codes are summarized below. All commands run at the authorized
worktree root unless the isolated entry-point fixture intentionally selects its `scripts/`
directory. The broad gate uses the exact starting checkpoint, not the feature branch's upstream.

The 31 ledger findings include eight P1 and 23 P2; all corrections are implemented. Six
fix-round follow-ups were resolved within their owning findings: nested docs runtime scanning
(F05), command-scope/config-error proof (F08), the self-triggering focused-test fixture (F06/F14),
stale comments/formatter nits (F14), the fresh review's scope-aware hook-ownership
operator guidance (F08), and reproducible metadata command evidence (F30). These are not additional double-counted findings.

| Command/evidence | Actual result |
|---|---|
| `npx vitest run tests/ci_change_classify.test.ts tests/malware_scan.test.ts` before implementation | Exit 1: 23 failed, 108 passed. Reproduced classification/scanner gaps; one overstrong severity expectation was rejected and corrected without weakening the existing rule. |
| `npx vitest run tests/codex_hooks.test.ts` before the wrapper fix | Exit 1: final registered-command fixture had 10 failed, 13 passed. Earlier fixture refinements are retained in red hook logs. |
| `npx vitest run tests/ci_changed_entry.test.ts` before spawn-CWD fix | Exit 1: actual child ran from `scripts/`; the fixture also pins propagation of child exit 73. |
| First combined targeted round, then expanded 11-file round | Exits 1: first 331 passed/2 failed; expanded 381 passed/2 failed. Corrected missing runbook role reference, benign reviewer wording self-match, obsolete CLAUDE docs-only pin, and inherited missing furnishing sparse cone. No detection severity or acceptance was relaxed. |
| `npx vitest run tests/ci_workflow.test.ts` after sparse-cone correction | Exit 0: 27 passed. Intermediate exact-block fixture mismatch was corrected to include the existing evidence path. |
| Final focused command shown below, `targeted-reviewed.log` | Exit 0: 11 files, 386 tests passed. |
| Explicit `npx @biomejs/biome check --write --files-ignore-unknown=true` with every changed/new path passed as an argument | Exit 0; 15 recognized files checked, four formatted, no remaining Biome diagnostics in `format-reviewed.log`. No repository-wide rewrite. |
| Python `tomllib.loads` over `.codex/config.toml` and nine `.codex/agents/*.toml`, plus `json.loads` of `.codex/hooks.json` | Exit 0. |
| Ruby `YAML.load_file` over ten `agents/openai.yaml` files and CI YAML, plus `YAML.safe_load` over all ten SKILL frontmatters | Exit 0. Python/Node YAML imports were unavailable (exit 1); Ruby used the installed parser without adding dependencies. |
| `bash -n .codex/hooks/ensure-hooks.sh .codex/hooks/qa-stop.sh` | Exit 0. |
| `bash .codex/hooks/qa-stop.sh` with stdin `{"stop_hook_active":false}` on the actual dirty fix round | Exit 0, empty stdout/stderr; the real adapter no longer self-triggers on its fixtures. |
| `node scripts/malware_scan.mjs --json --quiet` | Exit 1 is the raw scanner's expected nonempty-findings result: 8,306 files; zero HIGH, 35 MEDIUM, 406 LOW. Finished-diff reviewer examined all 26 flags in changed files; identities remained unchanged after final scanner widening. Security gate's HIGH-only policy stays intact. |
| `GATE_SELECT_BASE=15b483b84aa3bfa37bf40f3c9667f53885ad59f9 node scripts/gate_select.mjs` (`gate.log`) | Exit 0, all 12 steps. Full-suite fallback: 3,838 files passed/34 skipped, 57,632 tests passed/2 expected failures/541 skipped. Browser: 42 files/373 tests passed. |
| Same exact gate command after review's additional scanner behavior correction (`gate-reviewed.log`) | Exit 0, all 12 steps. Full suite: 3,838 files passed/34 skipped, 57,635 tests passed/2 expected failures/541 skipped. Browser: 42 files/373 tests passed. All required typecheck, build, freshness, lint and security steps passed. |
| `git diff --check` | Exit 0. |

```sh
npx vitest run tests/codex_setup.test.ts tests/codex_hooks.test.ts \
  tests/agent_surface_paths.test.ts tests/malware_scan.test.ts \
  tests/ci_changed_entry.test.ts tests/ci_changed_base.test.ts \
  tests/ci_change_classify.test.ts tests/ci_test_select.test.ts \
  tests/ci_selection_pipeline.test.ts tests/gate_select_plan.test.ts \
  tests/ci_workflow.test.ts
```

The precommit formatter was invoked through Python with the following exact scope builder
and argument array (output was redirected to `tmp/codex-audit/format-reviewed.log`):

```python
paths = subprocess.check_output(['git', 'diff', '--name-only', '-z']).decode().split('\0') + subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z']).decode().split('\0')
paths = sorted(set(filter(None, paths)))
subprocess.run(['npx', '@biomejs/biome', 'check', '--write', '--files-ignore-unknown=true', *paths], stdout=log, stderr=subprocess.STDOUT)
```

It included every tracked change and untracked addition, including new metadata, before any
staging. The following explicit final check and metadata invocations also ran with exit 0;
TOML and YAML were parsed separately because Biome does not validate those formats here:

```sh
npx @biomejs/biome check --files-ignore-unknown=true \
  .codex/hooks.json .codex/config.toml \
  .codex/agents/woc_release_malware.toml .codex/agents/woc_test_coverage.toml \
  scripts/lib/agent_surface_paths.mjs scripts/lib/agent_surface_paths.d.mts \
  tests/agent_surface_paths.test.ts tests/ci_changed_entry.test.ts \
  tests/codex_hooks.test.ts tests/malware_scan.test.ts

python3 - <<'PY_METADATA'
from pathlib import Path
import tomllib,json
for p in [Path('.codex/config.toml'),*Path('.codex/agents').glob('*.toml')]:
 tomllib.loads(p.read_text())
json.loads(Path('.codex/hooks.json').read_text())
print('PASS: project config, 9 agent TOML files and hooks JSON parsed')
PY_METADATA

ruby -e 'require "yaml"; Dir[".agents/skills/*/agents/openai.yaml"].each { |p| YAML.load_file(p) }; Dir[".agents/skills/*/SKILL.md"].each { |p| YAML.safe_load(File.read(p).split("---",3)[1]) }; YAML.load_file(".github/workflows/ci.yml"); puts "PASS: 10 skill metadata files, 10 skill frontmatter blocks and CI YAML parsed"'
```

The selector correctly used its full-suite fallback for executable hook changes, including
all blind/partial tests. Both required invocations retain artifact generation/freshness,
security, Biome, browser regressions, all typechecks and client/server/env/bot builds. Broad
checks were repeated only after the reviewer-driven production scanner change. Existing
npm/pnpm-config notices, Node storage notices and Vite chunk/dynamic-import warnings are
non-failing and were not treated as performance findings. No required local check is waived;
remote CI, native desktop hook trust, Windows execution and model performance were not measured.

Initial independent COVERAGE readers: instruction/skill conflicts (`instructions_review`),
configuration/hooks/CI security (`security_review`, woc_security), decisive tests
(`coverage_review`, woc_test_coverage), and official documentation (`official_sources`,
woc_docs_researcher). Every reader included nits and uncertainty. Parent verified consequential
findings against source. A bounded worker owned only hook adapters and their new subprocess
suite; the parent ran red/green commands and integrates all changes.

Finished-diff security, coverage and malware reviewers returned PASS. Coverage used the
canonical gate-integrity criteria through the Codex fallback: checks 1/2/4/6 PASS and 3/5
not applicable. The malware reviewer examined the full fix diff and all changed-file scanner
flags; no confirmed malicious behavior or weakened scanning was found.

The separate `fresh_round_review` inspected every one of the 35 fix paths, all new files,
surrounding hook/scanner/selection code and this report, 36 paths in total. It found two P2
nits: scope-insensitive Git-hook removal guidance and non-reproducible metadata command
summaries. Both were corrected and rereviewed. The completion checkpoint also caught the remaining
source-picker screenshot output before staging; its exact original bytes were restored. Its final verdict is **PASS**, with zero open findings after reading the completed gate
log and the parent-confirmed process exit 0. It independently checked all six gate-integrity
concerns and all 26 changed-path scanner flags. No reviewer duplicated the deterministic gate.

## Local commit and completion evidence

The implementation is committed as
`f60ec767f9d027dcc9fb7178e5dcc5c568f01185`,
`fix(codex): harden instruction workflows and tooling coverage`. Exactly the 35 reviewed
fix paths were staged by explicit argument list. The commit carries the required body.
`git ls-files --error-unmatch` confirmed all six new implementation/test files were in the
index, and `git diff --cached --check` exited 0 before the commit. A pre-stage guard caught
the browser screenshot residue and stopped before staging; after restoring it, the exact
path-set guard passed.

After that actual fix commit, this command exited **0** and checked all 15 recognized files:

```sh
GATE_SELECT_BASE=15b483b84aa3bfa37bf40f3c9667f53885ad59f9 npm run ci:changed
```

This report is the separate verdict commit, titled
`docs(codex): record the completed Astra support audit`, with its own commit body. The final
completion step repeats the same command after the report commit, reads its process exit,
and verifies a clean worktree; its actual result and both commit IDs are recorded in the
accompanying task completion response. The report does not preclaim that later execution.
All evidence above was available before this report's commit. No push or remote mutation
is authorized or performed by this audit.

## Resume boundary

Furnishing remains complete including QA. The next implementation entry remains
[phase-03-content-tiers-and-basics.md](../freeholds/phase-03-content-tiers-and-basics.md).
Work can resume there after the local completion check, from the authorized worktree with
its updated Codex instructions loaded. This audit does not authorize a merge-forward or
begin that packet.
