#!/bin/bash
# Verification Before Git Operations Hook (Pure Bash - Fast!)
# Blocks git commit/push/PR creation unless build & types verified in session.
#
# Exit codes:
#   0 = Allow tool execution
#   2 = Block tool execution (message sent to Claude via stderr)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${SCRIPT_DIR}/state"

# Read hook input from stdin
INPUT=$(cat)

# Extract tool name and command using grep/sed (no jq dependency)
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\([^"]*\)".*/\1/')
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\([^"]*\)".*/\1/')

# Only process Bash commands
if [[ "$TOOL_NAME" != "Bash" ]]; then
    exit 0
fi

# Extract command - handle multi-line JSON carefully
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

# Fallback for complex commands with escapes
if [[ -z "$COMMAND" ]]; then
    # Try Python if available for complex JSON
    if command -v python3 &>/dev/null; then
        COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")
    fi
fi

# Ensure state directory exists
mkdir -p "$STATE_DIR"

STATE_FILE="${STATE_DIR}/verification-${SESSION_ID}.state"
BUILD_MARKER="${STATE_DIR}/build-${SESSION_ID}.verified"
TYPES_MARKER="${STATE_DIR}/types-${SESSION_ID}.verified"

# Helper: Check if command matches patterns (case-insensitive)
matches() {
    echo "$COMMAND" | grep -qi "$1"
}

# Check if this is a verification command - create marker files
if matches "npm run build" || matches "npm build"; then
    touch "$BUILD_MARKER"
    exit 0
fi

if matches "tsc --noEmit" || matches "tsc -noEmit" || matches "npx tsc" || matches "npm run typecheck"; then
    touch "$TYPES_MARKER"
    exit 0
fi

# Check if this is a git operation that requires verification
if matches "git commit" || matches "git push" || matches "gh pr create" || matches "gh pr merge"; then
    MISSING=""

    if [[ ! -f "$BUILD_MARKER" ]]; then
        MISSING="${MISSING}  - npm run build\n"
    fi

    if [[ ! -f "$TYPES_MARKER" ]]; then
        MISSING="${MISSING}  - npx tsc --noEmit\n"
    fi

    if [[ -n "$MISSING" ]]; then
        cat >&2 << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION REQUIRED BEFORE GIT OPERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are attempting a git operation.

MISSING VERIFICATION:
$(echo -e "$MISSING")
REQUIRED ACTION:
Run the verification commands first and confirm they pass.
Then retry your git operation.

Use skill: verification-before-completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
        exit 2
    fi
fi

# Allow all other commands
exit 0
