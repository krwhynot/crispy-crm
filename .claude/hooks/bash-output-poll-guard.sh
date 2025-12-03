#!/bin/bash
# BashOutput Poll Guard - Detects stuck polling loops
#
# Tracks consecutive empty BashOutput calls per shell_id.
# Warns after 3 empty polls, blocks after 5.

set -e

# Read input from stdin
INPUT=$(cat)

# Extract tool name and shell ID
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
BASH_ID=$(echo "$INPUT" | jq -r '.tool_input.bash_id // .tool_input.shell_id // empty')

# Only process BashOutput calls
if [[ "$TOOL_NAME" != "BashOutput" ]]; then
    echo '{"decision": "approve"}'
    exit 0
fi

# Skip if no shell ID
if [[ -z "$BASH_ID" ]]; then
    echo '{"decision": "approve"}'
    exit 0
fi

# State file location
STATE_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/hooks/state"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/bash-polls-${BASH_ID}.count"

# Configuration
MAX_WARNING=3
MAX_BLOCK=5
RESET_SECONDS=30

# Get current state
NOW=$(date +%s)
EMPTY_COUNT=0
LAST_POLL=0

if [[ -f "$STATE_FILE" ]]; then
    # Read existing state
    read -r EMPTY_COUNT LAST_POLL < "$STATE_FILE" 2>/dev/null || true
    EMPTY_COUNT=${EMPTY_COUNT:-0}
    LAST_POLL=${LAST_POLL:-0}

    # Reset if too long since last poll
    TIME_SINCE=$((NOW - LAST_POLL))
    if [[ $TIME_SINCE -gt $RESET_SECONDS ]]; then
        EMPTY_COUNT=0
    fi
fi

# Increment counter (will be reset by companion post-hook if output found)
EMPTY_COUNT=$((EMPTY_COUNT + 1))

# Save state
echo "$EMPTY_COUNT $NOW" > "$STATE_FILE"

# Check thresholds
if [[ $EMPTY_COUNT -ge $MAX_BLOCK ]]; then
    # Clean up state file on block
    rm -f "$STATE_FILE"

    cat << EOF
{
  "decision": "block",
  "reason": "STUCK PROCESS DETECTED - Shell ${BASH_ID} polled ${EMPTY_COUNT} times with no output. Kill with KillShell({ shell_id: \"${BASH_ID}\" }) and try foreground execution instead."
}
EOF
    exit 0
fi

if [[ $EMPTY_COUNT -ge $MAX_WARNING ]]; then
    REMAINING=$((MAX_BLOCK - EMPTY_COUNT))
    cat << EOF
{
  "decision": "approve",
  "message": "⚠️ WARNING: Possible stuck process detected\n\nShell \"${BASH_ID}\" has returned empty output ${EMPTY_COUNT} consecutive times.\nYou will be BLOCKED after ${REMAINING} more empty polls.\n\nConsider:\n- Is this process actually running?\n- Should you kill it and try foreground execution?\n- Is there a configuration issue preventing output?\n\nUse KillShell to terminate if needed."
}
EOF
    exit 0
fi

# Under threshold - approve
echo '{"decision": "approve"}'
