#!/usr/bin/env bash
# Resolve Codex's session cwd and honor every effective Git hook owner before using
# the shared installer. The Claude-owned helper remains unchanged.
set -uo pipefail

command -v git >/dev/null 2>&1 || exit 0
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" 2>/dev/null || exit 0

# A successful lookup owns the path even when its value is explicitly empty.
# This includes global, local, worktree, and command-scope configuration.
if current=$(git config --get core.hooksPath 2>/dev/null); then
  case "$current" in
    /*/.githooks)
      if [ "$current" != "$root/.githooks" ]; then
        echo "World of ClaudeCraft: core.hooksPath points at another checkout's .githooks ($current); the pre-push floor that runs here may be a stale copy. Review the effective setting before repointing it." >&2
      fi
      ;;
  esac
  exit 0
else
  config_status=$?
  # Exit 1 means the key is absent. A configuration error is not permission to write.
  [ "$config_status" -eq 1 ] || exit 0
fi

CLAUDE_PROJECT_DIR="$root" bash "$root/.claude/hooks/ensure-hooks.sh"
