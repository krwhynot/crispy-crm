#!/bin/bash
# MCP Enablement Check Hook
# Warns if critical MCP servers are disabled in the session
#
# This checks the ACTUAL enablement status in ~/.claude.json,
# not just whether the server can connect.
#
# Exit codes:
#   0 = Allow (just warn)
#   2 = Block (critical server disabled)

# Critical servers that should be enabled for full functionality
CRITICAL_SERVERS="zen"
WARN_SERVERS="supabase serena"

# Claude config location
CLAUDE_CONFIG="${HOME}/.claude.json"

# Project directory (set by Claude Code)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only run once per session to avoid spam
STATE_DIR="$(dirname "${BASH_SOURCE[0]}")/state"
mkdir -p "$STATE_DIR"
SESSION_CHECK_FILE="${STATE_DIR}/mcp-checked-${CLAUDE_SESSION_ID:-default}.done"

# Skip if already checked this session
if [[ -f "$SESSION_CHECK_FILE" ]]; then
    exit 0
fi

# Mark as checked
touch "$SESSION_CHECK_FILE"

# Check if config exists
if [[ ! -f "$CLAUDE_CONFIG" ]]; then
    exit 0
fi

# Extract disabled servers for this project using Python (more reliable JSON parsing)
if command -v python3 &>/dev/null; then
    DISABLED_SERVERS=$(python3 << EOF
import json
import sys

try:
    with open("$CLAUDE_CONFIG", "r") as f:
        config = json.load(f)

    # Look for project-specific settings
    projects = config.get("projects", {})
    project_config = projects.get("$PROJECT_DIR", {})

    # Also check if it's stored at root level for the project path
    if not project_config:
        project_config = config.get("$PROJECT_DIR", {})

    disabled = project_config.get("disabledMcpServers", [])
    print(" ".join(disabled))
except Exception as e:
    print("", file=sys.stderr)
    sys.exit(0)
EOF
)
else
    # Fallback: basic grep (less reliable)
    DISABLED_SERVERS=$(grep -A 50 "\"$PROJECT_DIR\"" "$CLAUDE_CONFIG" 2>/dev/null | \
        grep -A 20 "disabledMcpServers" | \
        grep -oE '"[a-zA-Z0-9_-]+"' | \
        tr -d '"' | \
        tr '\n' ' ')
fi

# Check critical servers
CRITICAL_DISABLED=""
for server in $CRITICAL_SERVERS; do
    if echo "$DISABLED_SERVERS" | grep -qw "$server"; then
        CRITICAL_DISABLED="$CRITICAL_DISABLED $server"
    fi
done

# Check warning servers
WARN_DISABLED=""
for server in $WARN_SERVERS; do
    if echo "$DISABLED_SERVERS" | grep -qw "$server"; then
        WARN_DISABLED="$WARN_DISABLED $server"
    fi
done

# Output warnings/blocks
if [[ -n "$CRITICAL_DISABLED" || -n "$WARN_DISABLED" ]]; then
    cat >&2 << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MCP SERVER ENABLEMENT CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

    if [[ -n "$CRITICAL_DISABLED" ]]; then
        cat >&2 << EOF

CRITICAL (disabled):$CRITICAL_DISABLED

These servers provide important functionality.
Enable them with: /mcp → select server → Enable

EOF
    fi

    if [[ -n "$WARN_DISABLED" ]]; then
        cat >&2 << EOF

WARNING (disabled):$WARN_DISABLED

These servers are recommended but optional.

EOF
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
fi

# Always allow - just warn, don't block
exit 0
