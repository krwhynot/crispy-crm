#!/bin/bash
# MCP Dependency Guard Hook
# Intercepts ALL MCP tool calls and pauses for user confirmation
# Exit code 2 = block the operation with feedback to Claude
# Exit code 0 = allow the operation

set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Extract tool name from payload
if command -v jq >/dev/null 2>&1; then
  tool_name=$(echo "$payload" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
  session_id=$(echo "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
else
  # Fallback: allow if jq not available
  exit 0
fi

# If no tool name, allow
if [ -z "$tool_name" ]; then
  exit 0
fi

# Check if this is an MCP tool (starts with mcp__)
if [[ "$tool_name" != mcp__* ]]; then
  exit 0
fi

# Extract server name from tool (mcp__SERVER__method -> SERVER)
# Example: mcp__zen__debug -> zen
#          mcp__supabase__execute_sql -> supabase
server_key=$(echo "$tool_name" | sed -n 's/^mcp__\([^_]*\)__.*/\1/p')

# If we couldn't parse the server name, allow (shouldn't happen)
if [ -z "$server_key" ]; then
  exit 0
fi

# Create friendly server name (capitalize first letter)
server_name="${server_key^} MCP"

# State directory for tracking user choices
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"
mkdir -p "$STATE_DIR"

# State file for this session's MCP choices
MCP_STATE_FILE="$STATE_DIR/mcp-choices-${session_id}.json"

# Initialize state file if doesn't exist
if [ ! -f "$MCP_STATE_FILE" ]; then
  echo "{}" > "$MCP_STATE_FILE"
fi

# Check if user already made a choice for this server in this session
# First check server-specific, then check global
user_choice=$(jq -r ".\"$server_key\" // empty" "$MCP_STATE_FILE" 2>/dev/null || echo "")
global_choice=$(jq -r '._global // empty' "$MCP_STATE_FILE" 2>/dev/null || echo "")

# Server-specific choice takes precedence over global
if [ -z "$user_choice" ]; then
  user_choice="$global_choice"
fi

if [ "$user_choice" = "continue_without" ]; then
  # User chose to continue without MCP - allow but inform
  echo "INFO: Proceeding without $server_name (user chose to continue without MCP)"
  exit 0
elif [ "$user_choice" = "continue_with" ]; then
  # User confirmed MCP is active - allow silently
  exit 0
fi

# First time seeing this MCP server in this session - BLOCK and ask
cat << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏸️  MCP DEPENDENCY CHECK - PAUSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The tool '$tool_name' requires the $server_name server.

📋 Server: $server_name
🔧 Tool: $tool_name

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 PLEASE CHOOSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "Continue with MCP" - Activate $server_name, then say this
2. "Continue without MCP" - Skip this tool, use manual alternatives

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

exit 2
