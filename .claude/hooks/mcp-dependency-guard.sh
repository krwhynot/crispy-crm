#!/bin/bash
# MCP Dependency Guard Hook
# Intercepts MCP tool calls and checks if the MCP server is active
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

# State directory for tracking user choices
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"
mkdir -p "$STATE_DIR"

# State file for this session's MCP choices
MCP_STATE_FILE="$STATE_DIR/mcp-choices-${session_id}.json"

# Define MCP tools and their server requirements
# Format: tool_prefix:server_name:description
declare -A MCP_TOOLS=(
  ["mcp__zen__"]="zen:Zen MCP:Structured debugging and deep thinking"
  ["mcp__supabase__"]="supabase:Supabase MCP:Database operations"
  ["mcp__perplexity__"]="perplexity:Perplexity MCP:Web search"
  ["mcp__context7__"]="context7:Context7 MCP:Library documentation"
  ["mcp__serena__"]="serena:Serena MCP:Code analysis"
)

# Check if tool is an MCP tool we track
matched_prefix=""
for prefix in "${!MCP_TOOLS[@]}"; do
  if [[ "$tool_name" == ${prefix}* ]]; then
    matched_prefix="$prefix"
    break
  fi
done

# Not an MCP tool we track, allow
if [ -z "$matched_prefix" ]; then
  exit 0
fi

# Parse server info
IFS=':' read -r server_key server_name server_desc <<< "${MCP_TOOLS[$matched_prefix]}"

# Check if user already made a choice for this server in this session
if [ -f "$MCP_STATE_FILE" ]; then
  user_choice=$(jq -r ".\"$server_key\" // empty" "$MCP_STATE_FILE" 2>/dev/null || echo "")

  if [ "$user_choice" = "continue_without" ]; then
    # User chose to continue without MCP - allow but warn
    echo "INFO: Proceeding without $server_name (user chose to continue without MCP)"
    exit 0
  elif [ "$user_choice" = "continue_with" ]; then
    # User confirmed MCP is active - allow
    exit 0
  fi
fi

# First time seeing this MCP tool in this session - BLOCK and ask
cat << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏸️  MCP DEPENDENCY CHECK - PAUSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The tool '$tool_name' requires the $server_name server.

📋 Server: $server_name
📝 Purpose: $server_desc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 PLEASE CHOOSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "Continue with MCP" - Activate $server_name, then say this
2. "Continue without MCP" - Skip MCP tools, use manual alternatives

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

exit 2
