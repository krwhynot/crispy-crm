#!/bin/bash
# MCP Choice Handler Hook (UserPromptSubmit)
# Detects when user says "Continue with MCP" or "Continue without MCP"
# and updates the session state accordingly
# Supports both global choices and server-specific choices

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

# Initialize state file if doesn't exist
if [ ! -f "$MCP_STATE_FILE" ]; then
  echo "{}" > "$MCP_STATE_FILE"
fi

# Check for server-specific patterns first
# e.g., "continue with zen", "zen is active", "supabase mcp is ready"
extract_server_name() {
  local input="$1"
  # Try to extract server name from common patterns
  # "continue with zen" -> zen
  # "zen is active" -> zen
  # "supabase mcp is ready" -> supabase

  # Known MCP servers (add more as needed)
  local servers=("zen" "supabase" "perplexity" "context7" "serena" "ref" "sequential")

  for server in "${servers[@]}"; do
    if [[ "$input" == *"$server"* ]]; then
      echo "$server"
      return 0
    fi
  done

  return 1
}

# Check for "continue with mcp" patterns (global or server-specific)
if [[ "$prompt_lower" == *"continue with mcp"* ]] || \
   [[ "$prompt_lower" == *"mcp is active"* ]] || \
   [[ "$prompt_lower" == *"mcp is ready"* ]] || \
   [[ "$prompt_lower" == *"mcp enabled"* ]]; then

  # Check if server-specific
  specific_server=$(extract_server_name "$prompt_lower" || echo "")

  if [ -n "$specific_server" ]; then
    # Update just this server
    new_state=$(jq --arg s "$specific_server" '.[$s] = "continue_with"' "$MCP_STATE_FILE")
    echo "$new_state" > "$MCP_STATE_FILE"
    echo "✅ ${specific_server^} MCP confirmed active."
  else
    # Global - mark all as active (using wildcard key)
    new_state=$(jq '. + {"_global": "continue_with"}' "$MCP_STATE_FILE")
    echo "$new_state" > "$MCP_STATE_FILE"
    echo "✅ All MCP servers confirmed active."
  fi
  exit 0
fi

# Check for server-specific activation without "continue" keyword
# e.g., "zen is active", "supabase mcp ready"
if [[ "$prompt_lower" == *"is active"* ]] || \
   [[ "$prompt_lower" == *"is ready"* ]] || \
   [[ "$prompt_lower" == *"is enabled"* ]]; then

  specific_server=$(extract_server_name "$prompt_lower" || echo "")

  if [ -n "$specific_server" ]; then
    new_state=$(jq --arg s "$specific_server" '.[$s] = "continue_with"' "$MCP_STATE_FILE")
    echo "$new_state" > "$MCP_STATE_FILE"
    echo "✅ ${specific_server^} MCP confirmed active."
    exit 0
  fi
fi

# Check for "continue without mcp" patterns
if [[ "$prompt_lower" == *"continue without mcp"* ]] || \
   [[ "$prompt_lower" == *"without mcp"* ]] || \
   [[ "$prompt_lower" == *"skip mcp"* ]] || \
   [[ "$prompt_lower" == *"no mcp"* ]] || \
   [[ "$prompt_lower" == *"mcp not available"* ]] || \
   [[ "$prompt_lower" == *"mcp unavailable"* ]]; then

  # Check if server-specific
  specific_server=$(extract_server_name "$prompt_lower" || echo "")

  if [ -n "$specific_server" ]; then
    # Update just this server
    new_state=$(jq --arg s "$specific_server" '.[$s] = "continue_without"' "$MCP_STATE_FILE")
    echo "$new_state" > "$MCP_STATE_FILE"
    echo "ℹ️ Continuing without ${specific_server^} MCP. Manual alternatives will be used."
  else
    # Global - mark all as without (using wildcard key)
    new_state=$(jq '. + {"_global": "continue_without"}' "$MCP_STATE_FILE")
    echo "$new_state" > "$MCP_STATE_FILE"
    echo "ℹ️ Continuing without MCP. Manual alternatives will be used for all MCP tools."
  fi
  exit 0
fi

# No MCP-related choice detected, pass through
exit 0
