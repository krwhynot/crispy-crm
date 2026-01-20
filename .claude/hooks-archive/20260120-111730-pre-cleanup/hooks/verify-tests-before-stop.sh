#!/bin/bash
# Stop hook: Block session completion if code modified but tests not run
#
# Output: JSON decision object to stdout
#   {"decision": "approve"} - Allow stop
#   {"decision": "block", "reason": "...", "systemMessage": "..."} - Block stop

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"

# Read hook input from stdin
input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id // empty')

code_marker="${STATE_DIR}/code-modified-${session_id}.marker"
tests_marker="${STATE_DIR}/tests-passed-${session_id}.marker"

# If no code was modified, allow stop (research session)
if [ ! -f "$code_marker" ]; then
    echo '{"decision": "approve"}'
    exit 0
fi

# Count modified files
modified_count=$(wc -l < "$code_marker" 2>/dev/null | tr -d ' ')

# Check if tests ran
if [ ! -f "$tests_marker" ]; then
    # Build JSON response with jq to handle escaping
    jq -n \
      --arg reason "Tests must be run after code changes" \
      --arg msg "Modified ${modified_count} TypeScript/React file(s) but tests were not executed. Run: just test, just test:unit, or npx vitest run" \
      '{decision: "block", reason: $reason, systemMessage: $msg}'
    exit 0
fi

# Tests ran - allow stop
jq -n \
  --arg msg "Tests verified - ${modified_count} file(s) modified, tests passed" \
  '{decision: "approve", systemMessage: $msg}'
exit 0
