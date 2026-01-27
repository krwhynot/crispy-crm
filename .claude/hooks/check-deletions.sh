#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
cmd=$(echo "$payload" | jq -r '.tool_input.command // empty')

# Detect file deletion commands (at command start only)
if echo "$cmd" | grep -qE '^\s*(rm|git rm|trash)'; then
  touch "${CLAUDE_PROJECT_DIR}/.claude/state/.prune-needed"
  echo '{"systemMessage": "⚠️ File deletion detected. Inventories may need pruning. Run: .claude/hooks/prune-stale-inventory.sh"}'
fi
