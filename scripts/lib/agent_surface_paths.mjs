// Shared path policy for CI reachability and instruction scanning.
// Paths are repository-relative. Runtime directories are active at any depth.
const normalized = (file) => file.replaceAll('\\', '/');

/** @param {string} file */
export function isCanonicalInstructionPath(file) {
  return /(^|\/)(?:AGENTS(?:\.override)?|CLAUDE)\.md$/.test(normalized(file));
}

/** @param {string} file */
export function isAgentToolingPath(file) {
  const path = normalized(file);
  return (
    isCanonicalInstructionPath(path) ||
    /(^|\/)\.(?:codex|agents|claude|githooks)\//.test(path) ||
    path === 'docs/codex.md'
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
