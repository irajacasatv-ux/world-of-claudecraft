import { describe, expect, it } from 'vitest';
import {
  AGENT_ROUTING_DOCS,
  isAgentToolingPath,
  isCanonicalInstructionPath,
  isCodexExecutableInstructionPath,
  isCodexSkillInstructionPath,
} from '../scripts/lib/agent_surface_paths.mjs';

describe('agent instruction path boundaries', () => {
  it.each(['AGENTS.md', 'deep/AGENTS.override.md', 'docs/CLAUDE.md', 'deep\\AGENTS.md'])(
    'recognizes canonical instruction %s',
    (file) => {
      expect(isCanonicalInstructionPath(file)).toBe(true);
      expect(isAgentToolingPath(file)).toBe(true);
    },
  );
  it('shares exactly the three agent-routing docs, frozen against a consumer appending one', () => {
    expect(AGENT_ROUTING_DOCS).toEqual([
      'docs/codex.md',
      'docs/qa-gate.md',
      'docs/ai-architecture.md',
    ]);
    expect(Object.isFrozen(AGENT_ROUTING_DOCS)).toBe(true);
  });
  it.each(['docs/codex.md', 'docs/qa-gate.md', 'docs/ai-architecture.md'])(
    'treats the agent-routing doc %s as tooling, so a change to it runs the gate',
    (file) => {
      expect(isCanonicalInstructionPath(file)).toBe(false);
      expect(isAgentToolingPath(file)).toBe(true);
    },
  );
  it.each([
    'MY_AGENTS.md',
    'AGENTS.md.bak',
    'docs/notes.md',
    'docs/qa-gate.md.bak',
    'nested/docs/qa-gate.md',
    'codex/game.ts',
    '.codex-backup/config.toml',
  ])('does not mistake ordinary or similarly named paths for active tooling: %s', (file) => {
    expect(isCanonicalInstructionPath(file)).toBe(false);
    expect(isAgentToolingPath(file)).toBe(false);
  });
  it.each(['.codex/config.toml', 'nested/.codex/agents/review.toml', 'AGENTS.override.md'])(
    'applies both code and instruction checks to %s',
    (file) => {
      expect(isCodexExecutableInstructionPath(file)).toBe(true);
    },
  );
  it.each(['.codex/agents/review.md', '.codex/agents/archive/review.toml', 'AGENTS.md'])(
    'does not broaden executable-instruction formats to %s',
    (file) => {
      expect(isCodexExecutableInstructionPath(file)).toBe(false);
    },
  );
  it.each([
    '.agents/skills/task/SKILL.md',
    '.agents/skills/task/references/deep/check.md',
    '.agents/skills/task/references/deep/line\nbreak.md',
    '.agents/skills/task/agents/openai.yaml',
  ])('includes skill instructions at every supported depth: %s', (file) => {
    expect(isCodexSkillInstructionPath(file)).toBe(true);
  });
  it.each(['.agents/skills/task/script.mjs', '.agents/skills/task/example.yaml', 'docs/SKILL.md'])(
    'keeps non-instruction skill formats on their ordinary scan path: %s',
    (file) => {
      expect(isCodexSkillInstructionPath(file)).toBe(false);
    },
  );
});
