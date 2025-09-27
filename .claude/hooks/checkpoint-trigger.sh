#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Parse files from payload
if command -v jq >/dev/null 2>&1; then
  mapfile -t files < <(echo "$payload" | jq -r '
    [
      .tool_input.file_path // empty,
      (.tool_input.file_paths // [])[]
    ] | .[]
  ' 2>/dev/null || true)
else
  files=("dummy")  # Ensure at least one trigger if jq unavailable
fi

# Ensure checkpoint manager exists
if [ ! -x "${HOME}/.claude/checkpoint-manager.sh" ]; then
  exit 0
fi

# Trigger checkpoint for each file (runs in project directory)
proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"
for _ in "${files[@]}"; do
  (
    cd "$proj" 2>/dev/null || exit 0
    "${HOME}/.claude/checkpoint-manager.sh" trigger >/dev/null 2>&1
  ) &
done
wait 2>/dev/null || true