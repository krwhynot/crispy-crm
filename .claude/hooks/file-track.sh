#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Parse files from payload using jq
if command -v jq >/dev/null 2>&1; then
  # Extract file_path or file_paths from tool_input
  mapfile -t files < <(echo "$payload" | jq -r '
    [
      .tool_input.file_path // empty,
      (.tool_input.file_paths // [])[]
    ] | .[]
  ' 2>/dev/null || true)
else
  # Fallback: try basic grep if jq not available
  files=()
  if file=$(echo "$payload" | grep -oP '"file_path"\s*:\s*"[^"]+' | cut -d'"' -f4); then
    files+=("$file")
  fi
fi

# Log configuration
log="${HOME}/.claude/changes.log"
mkdir -p "${HOME}/.claude"

# Log each file operation
ts="$(date '+%Y-%m-%d %H:%M:%S')"
host="$(hostname -s 2>/dev/null || echo 'host')"
user="${USER:-user}"
tool="${CLAUDE_TOOL_NAME:-unknown}"

for f in "${files[@]}"; do
  if [ -n "$f" ]; then
    # Determine file size
    full_path="$f"
    if [ ! -e "$full_path" ] && [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
      full_path="${CLAUDE_PROJECT_DIR}/$f"
    fi

    if [ -e "$full_path" ]; then
      size="$(stat -c '%s' "$full_path" 2>/dev/null || stat -f '%z' "$full_path" 2>/dev/null || echo '0')"
      action="MODIFY"
    else
      size="new"
      action="CREATE"
    fi

    echo "[$ts] [$user@$host] [$action:$tool] $f (${size} bytes)" >> "$log"
  fi
done