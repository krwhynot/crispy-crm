#!/bin/bash
# Track successful test runs for session completion verification
# Runs after Bash - creates marker when tests pass (exit 0)

set -e

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"
mkdir -p "$STATE_DIR"

# Read hook input from stdin
input=$(cat)

# Extract command and result
command=$(echo "$input" | jq -r '.tool_input.command // empty')
exit_code=$(echo "$input" | jq -r '.tool_result.exit_code // 0')
session_id=$(echo "$input" | jq -r '.session_id // empty')

# Check if it's a test command (vitest, jest, playwright, npm test, just test)
if echo "$command" | grep -qiE "vitest|playwright|jest|npm test|pnpm test|just test"; then
    if [ "$exit_code" = "0" ]; then
        marker_file="${STATE_DIR}/tests-passed-${session_id}.marker"
        echo "$(date -Iseconds) | $command" > "$marker_file"
        echo "✅ Tests passed - session completion allowed" >&2
    else
        echo "⚠️ Tests failed (exit $exit_code) - run again before completion" >&2
    fi
fi

exit 0  # Never block (PostToolUse is advisory)
