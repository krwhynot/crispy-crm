#!/bin/bash
# Subagent Output Validator Hook
# Validates agent outputs for completeness before acceptance
#
# Hook Event: SubagentStop
# Exit codes:
#   0 = Allow (approve agent output)
#   2 = Block (incomplete output detected)
#
# Logs all completions to ~/.claude/subagent-audit.log

set -e

# Read JSON input from stdin
INPUT=$(cat)

# Parse agent info using jq (with fallback)
if command -v jq >/dev/null 2>&1; then
  AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name // "unknown"')
  AGENT_OUTPUT=$(echo "$INPUT" | jq -r '.output // ""')
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "no-session"')
else
  # Fallback: grep-based parsing or allow
  AGENT_NAME=$(echo "$INPUT" | grep -oP '"agent_name"\s*:\s*"\K[^"]+' || echo "unknown")
  AGENT_OUTPUT=$(echo "$INPUT" | grep -oP '"output"\s*:\s*"\K[^"]+' || echo "")
  SESSION_ID="${CLAUDE_SESSION_ID:-no-session}"
fi

# Log file location
LOG_FILE="${HOME}/.claude/subagent-audit.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Helper function for timestamped logging
log_entry() {
  local status="$1"
  local message="$2"
  local timestamp=$(date -Iseconds)
  echo "[$timestamp] [$SESSION_ID] [$status] Agent: $AGENT_NAME | $message" >> "$LOG_FILE"
}

# Incomplete patterns to detect (case-insensitive)
INCOMPLETE_PATTERNS=(
  "TODO"
  "FIXME"
  "XXX"
  "HACK"
  "not implemented"
  "to be implemented"
  "needs implementation"
  "placeholder"
  "stub"
  "incomplete"
  "work in progress"
  "WIP"
)

# Check output for incomplete markers
check_incomplete() {
  local output_lower=$(echo "$AGENT_OUTPUT" | tr '[:upper:]' '[:lower:]')

  for pattern in "${INCOMPLETE_PATTERNS[@]}"; do
    pattern_lower=$(echo "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$output_lower" == *"$pattern_lower"* ]]; then
      echo "$pattern"
      return 0
    fi
  done
  return 1
}

# Skip validation for empty outputs (agent may have failed early)
if [[ -z "$AGENT_OUTPUT" ]]; then
  log_entry "WARN" "Empty output - allowing but flagging"
  echo '{"decision": "approve", "message": "⚠️ Subagent returned empty output"}'
  exit 0
fi

# Check for incomplete markers
MATCHED_PATTERN=$(check_incomplete) && {
  log_entry "BLOCKED" "Incomplete marker found: $MATCHED_PATTERN"

  cat << EOF
{
  "decision": "block",
  "reason": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚫 SUBAGENT OUTPUT INCOMPLETE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAgent \"${AGENT_NAME}\" returned incomplete output.\n\nDetected pattern: ${MATCHED_PATTERN}\n\nACTION REQUIRED:\n- Resume the agent to complete the task\n- Or manually address the incomplete sections\n\nSee: ~/.claude/subagent-audit.log\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}
EOF
  exit 0  # Return 0 with block decision in JSON
}

# Output is complete - log and approve
log_entry "APPROVED" "Output validated successfully"
echo '{"decision": "approve"}'
exit 0
