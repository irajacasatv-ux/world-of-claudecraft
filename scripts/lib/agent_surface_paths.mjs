// Shared path policy for CI reachability and instruction scanning.
// Paths are repository-relative. Runtime directories are active at any depth.
const normalized = (file) => file.replaceAll('\\', '/');

/** @param {string} file */
export function isCanonicalInstructionPath(file) {
  return /(^|\/)(?:AGENTS(?:\.override)?|CLAUDE)\.md$/.test(normalized(file));
}

// The docs that route agent instructions: the Codex guide, the reviewer-coverage table, and
// the AI-architecture guide whose catalog tests/instruction_drift.test.ts pins. A change to
// one of them must run the gate like any other instruction file.
export const AGENT_ROUTING_DOCS = Object.freeze([
  'docs/codex.md',
  'docs/qa-gate.md',
  'docs/ai-architecture.md',
]);

/** @param {string} file */
export function isAgentToolingPath(file) {
  const path = normalized(file);
  return (
    isCanonicalInstructionPath(path) ||
    /(^|\/)\.(?:codex|agents|claude|githooks)\//.test(path) ||
    AGENT_ROUTING_DOCS.includes(path)
  );
}

/** @param {string} file */
export function isCodexExecutableInstructionPath(file) {
  const path = normalized(file);
  return (
    /(^|\/)AGENTS\.override\.md$/.test(path) ||
    /(^|\/)\.codex\/(?:config\.toml|agents\/[^/]+\.toml)$/.test(path)
  );
}

/** @param {string} file */
export function isCodexSkillInstructionPath(file) {
  return /(^|\/)\.agents\/skills\/[^/]+\/(?:[\s\S]+\.md|agents\/openai\.yaml)$/.test(
    normalized(file),
  );
}
