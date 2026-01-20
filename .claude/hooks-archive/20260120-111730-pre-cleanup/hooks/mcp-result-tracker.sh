#!/bin/bash
# MCP Result Tracker - Logs all MCP tool calls for debugging/optimization
# PostToolUse hook for mcp__ prefix tools

# Read input from stdin (never blocks - reads what's available)
input=$(cat)

# Extract tool name with fallback
tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"')

# Parse tool name to extract server and tool components
# Formats:
#   mcp__plugin_<plugin>_<server>__<tool> (e.g., mcp__plugin_crispy_code-intel__search_code)
#   mcp__<server>__<tool> (e.g., mcp__Ref__ref_search_documentation)

if [[ "$tool_name" =~ ^mcp__plugin_[^_]+_(.+)__(.+)$ ]]; then
    # Plugin format: mcp__plugin_<plugin>_<server>__<tool>
    server="${BASH_REMATCH[1]}"
    tool="${BASH_REMATCH[2]}"
elif [[ "$tool_name" =~ ^mcp__(.+)__(.+)$ ]]; then
    # Standard format: mcp__<server>__<tool>
    server="${BASH_REMATCH[1]}"
    tool="${BASH_REMATCH[2]}"
else
    # Fallback for malformed names
    server="unknown"
    tool="${tool_name#mcp__}"
fi

# Determine success/failure from tool_result
# Handle both object results (with .error field) and string results
# Also detect failure keywords in string responses

result_type=$(echo "$input" | jq -r '.tool_result | type')

if [[ "$result_type" == "object" ]]; then
    # Object result - check for .error field
    error=$(echo "$input" | jq -r '.tool_result.error // empty')
    result_empty=$(echo "$input" | jq -r 'if .tool_result == null or .tool_result == {} then "true" else "false" end')
elif [[ "$result_type" == "string" ]]; then
    # String result - check for failure keywords
    result_str=$(echo "$input" | jq -r '.tool_result')
    if [[ "$result_str" =~ ^(Failed|Error|error:|failed:) ]]; then
        error="$result_str"
    else
        error=""
    fi
    result_empty="false"
else
    # Null or other type
    error=""
    result_empty=$(echo "$input" | jq -r 'if .tool_result == null then "true" else "false" end')
fi

if [[ -n "$error" ]]; then
    success="false"
    status_icon="❌"
elif [[ "$result_empty" == "true" ]]; then
    success="unknown"
    status_icon="⚠️"
else
    success="true"
    status_icon="✓"
fi

# Ensure log directory exists
log_dir="$HOME/.claude"
mkdir -p "$log_dir"
log_file="$log_dir/mcp-audit.log"

# Get timestamp
timestamp=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')

# Log entry format: timestamp | server | tool | success | error_preview
if [[ -n "$error" ]]; then
    # Truncate error to 100 chars for log readability
    error_preview="${error:0:100}"
    echo "$timestamp | $server | $tool | $success | $error_preview" >> "$log_file"
else
    echo "$timestamp | $server | $tool | $success |" >> "$log_file"
fi

# Provide feedback on failures (via stderr so it shows as warning)
if [[ "$success" == "false" ]]; then
    echo "$status_icon MCP call failed: $server/$tool" >&2
    echo "   Error: ${error:0:200}" >&2
fi

# Never block - always exit 0
exit 0
