#!/bin/bash
# Track TypeScript/React code modifications for test enforcement
# Runs after Write/Edit/MultiEdit - creates marker if .ts/.tsx modified

set -e

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"
mkdir -p "$STATE_DIR"

# Read hook input from stdin
input=$(cat)

# Extract file path and session ID
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')

# Only track TypeScript/React files
if [[ "$file_path" =~ \.(ts|tsx)$ ]]; then
    marker_file="${STATE_DIR}/code-modified-${session_id}.marker"
    echo "$(date -Iseconds) | $file_path" >> "$marker_file"
fi

exit 0  # Never block (PostToolUse is advisory)
