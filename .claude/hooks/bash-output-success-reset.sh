#!/bin/bash
# BashOutput Success Reset - Companion to poll guard
#
# Resets the empty poll counter when BashOutput returns actual content.
# This prevents false positives when a process is just slow but working.

set -e

# Read input from stdin
INPUT=$(cat)

# Extract tool info
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
BASH_ID=$(echo "$INPUT" | jq -r '.tool_input.bash_id // .tool_input.shell_id // empty')
# The output from BashOutput is in tool_output for PostToolUse hooks
OUTPUT=$(echo "$INPUT" | jq -r '.tool_output.stdout // .tool_output.output // .tool_output // empty')

# Only process BashOutput calls
if [[ "$TOOL_NAME" != "BashOutput" ]]; then
    exit 0
fi

# Skip if no shell ID
if [[ -z "$BASH_ID" ]]; then
    exit 0
fi

# State file location
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/hooks/state"
STATE_FILE="$STATE_DIR/bash-polls-${BASH_ID}.count"

# If output is not empty, reset the counter
if [[ -n "$OUTPUT" ]] && [[ "$OUTPUT" != "null" ]] && [[ "$OUTPUT" != "(No content)" ]]; then
    rm -f "$STATE_FILE" 2>/dev/null || true
fi

exit 0
