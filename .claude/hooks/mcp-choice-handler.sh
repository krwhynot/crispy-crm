#!/bin/bash
# MCP Choice Handler Hook (UserPromptSubmit)
# Detects when user says "Continue with MCP" or "Continue without MCP"
# and updates the session state accordingly

set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Extract prompt and session_id
if command -v jq >/dev/null 2>&1; then
  prompt=$(echo "$payload" | jq -r '.prompt // empty' 2>/dev/null || echo "")
  session_id=$(echo "$payload" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
else
  exit 0
fi

# If no prompt, skip
if [ -z "$prompt" ]; then
  exit 0
fi

# State directory
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"
mkdir -p "$STATE_DIR"

# State file for this session's MCP choices
MCP_STATE_FILE="$STATE_DIR/mcp-choices-${session_id}.json"

# Normalize prompt to lowercase for matching
prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

# Define MCP servers to track
MCP_SERVERS=("zen" "supabase" "perplexity" "context7" "serena")

# Initialize state file if doesn't exist
if [ ! -f "$MCP_STATE_FILE" ]; then
  echo "{}" > "$MCP_STATE_FILE"
fi

# Check for "continue with mcp" pattern
if [[ "$prompt_lower" == *"continue with mcp"* ]] || [[ "$prompt_lower" == *"continue with zen"* ]] || [[ "$prompt_lower" == *"mcp is active"* ]] || [[ "$prompt_lower" == *"zen is active"* ]]; then
  # User confirmed MCP is active - update state for all servers
  # (In a more sophisticated version, we'd detect which specific server)

  new_state=$(jq '.' "$MCP_STATE_FILE")
  for server in "${MCP_SERVERS[@]}"; do
    new_state=$(echo "$new_state" | jq --arg s "$server" '.[$s] = "continue_with"')
  done
  echo "$new_state" > "$MCP_STATE_FILE"

  echo "✅ MCP confirmed active. Proceeding with full capability."
  exit 0
fi

# Check for "continue without mcp" pattern
if [[ "$prompt_lower" == *"continue without mcp"* ]] || [[ "$prompt_lower" == *"without mcp"* ]] || [[ "$prompt_lower" == *"skip mcp"* ]] || [[ "$prompt_lower" == *"no mcp"* ]]; then
  # User chose to continue without MCP - update state for all servers

  new_state=$(jq '.' "$MCP_STATE_FILE")
  for server in "${MCP_SERVERS[@]}"; do
    new_state=$(echo "$new_state" | jq --arg s "$server" '.[$s] = "continue_without"')
  done
  echo "$new_state" > "$MCP_STATE_FILE"

  echo "ℹ️ Continuing without MCP. Manual alternatives will be used."
  exit 0
fi

# No MCP-related choice detected, pass through
exit 0
