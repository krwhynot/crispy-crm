#!/bin/bash
# Bash Result Tracker - Logs commands and provides failure feedback
# PostToolUse hook for Bash tool

# Read input from stdin
input=$(cat)

# Extract exit code (default to 0 if null/missing)
exit_code=$(echo "$input" | jq -r '.tool_result.exit_code // 0')

# Extract command (truncate for safety)
command=$(echo "$input" | jq -r '.tool_input.command // "unknown"')

# Ensure log directory exists
log_dir="$HOME/.claude"
mkdir -p "$log_dir"
log_file="$log_dir/bash-audit.log"

# Get timestamp (cross-platform)
timestamp=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')

# Log entry: timestamp | exit_code | command (truncated to 200 chars)
command_preview="${command:0:200}"
echo "$timestamp | $exit_code | $command_preview" >> "$log_file"

# Feedback on failures (via stderr for visibility)
if [ "$exit_code" != "0" ] && [ "$exit_code" != "null" ]; then
  echo "⚠️ Command failed (exit $exit_code)" >&2

  # Suggest fixes for common patterns
  case "$command" in
    *"npm"*)
      echo "💡 Try: npm cache clean --force" >&2
      ;;
    *"vitest"*|*"jest"*)
      echo "💡 Check test file syntax or run: just test" >&2
      ;;
    *"tsc"*)
      echo "💡 Run: npx tsc --noEmit to see full errors" >&2
      ;;
    *"supabase"*)
      echo "💡 Check: docker ps | Supabase container may be down" >&2
      ;;
    *"permission denied"*|*"EACCES"*)
      echo "💡 Check file permissions or try with sudo" >&2
      ;;
  esac
fi

# Never block - always exit 0
exit 0
