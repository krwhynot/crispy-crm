#!/bin/bash
# session-start-tasks.sh - Shows ready tasks (P0/P1 Open items) on session startup
#
# Hook Event: SessionStart (called separately from session-init.sh)
# Purpose: Parse technical-debt.md and display actionable P0/P1 tasks
# Output: Plain text task list (not JSON)
# Exit: Always 0 (advisory only, never blocks session)

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
DEBT_FILE="$PROJECT_DIR/docs/technical-debt.md"
MAX_TASKS=5

# Check if technical-debt.md exists
if [[ ! -f "$DEBT_FILE" ]]; then
  echo "📋 Ready Tasks: No technical-debt.md found"
  exit 0
fi

# Parse P0 and P1 Open items from the markdown tables
# Table format: | ID | Category | Issue | File(s) | Status |
# We want rows where Status column contains "Open"

# Extract P0 items (between "## P0" and "---")
P0_ITEMS=$(awk '
  /^## P0/,/^---/ {
    if (/^\| [A-Z]+-[0-9]+ \|/ && /Open[[:space:]]*\|[[:space:]]*$/) {
      # Extract ID and Issue (columns 1 and 3)
      split($0, cols, "|")
      id = cols[2]
      issue = cols[4]
      # Trim whitespace
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", issue)
      # Truncate issue to 50 chars for display
      if (length(issue) > 50) {
        issue = substr(issue, 1, 47) "..."
      }
      print id "|" issue
    }
  }
' "$DEBT_FILE")

# Extract P1 items (between "## P1" and "---")
P1_ITEMS=$(awk '
  /^## P1/,/^## P2/ {
    if (/^\| [A-Z]+-[0-9]+ \|/ && /Open[[:space:]]*\|[[:space:]]*$/) {
      # Extract ID and Issue (columns 1 and 3)
      split($0, cols, "|")
      id = cols[2]
      issue = cols[4]
      # Trim whitespace
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", issue)
      # Truncate issue to 50 chars for display
      if (length(issue) > 50) {
        issue = substr(issue, 1, 47) "..."
      }
      print id "|" issue
    }
  }
' "$DEBT_FILE")

# Count items
P0_COUNT=$(echo "$P0_ITEMS" | grep -c '|' 2>/dev/null || echo 0)
P1_COUNT=$(echo "$P1_ITEMS" | grep -c '|' 2>/dev/null || echo 0)
TOTAL_COUNT=$((P0_COUNT + P1_COUNT))

# Handle case where no open P0/P1 items exist
if [[ $TOTAL_COUNT -eq 0 ]]; then
  echo "📋 Ready Tasks: All P0/P1 items resolved!"
  echo ""
  echo "💡 Tip: Run '/audit:full' to check for new issues"
  exit 0
fi

# Output header
echo "📋 Ready Tasks (No Blockers):"

# Track how many we've displayed
DISPLAYED=0

# Display P0 items first (red)
if [[ -n "$P0_ITEMS" && "$P0_ITEMS" != "" ]]; then
  while IFS='|' read -r id issue; do
    if [[ -n "$id" && $DISPLAYED -lt $MAX_TASKS ]]; then
      echo "   🔴 ${id}: ${issue} (P0)"
      DISPLAYED=$((DISPLAYED + 1))
    fi
  done <<< "$P0_ITEMS"
fi

# Display P1 items (orange)
if [[ -n "$P1_ITEMS" && "$P1_ITEMS" != "" && $DISPLAYED -lt $MAX_TASKS ]]; then
  while IFS='|' read -r id issue; do
    if [[ -n "$id" && $DISPLAYED -lt $MAX_TASKS ]]; then
      echo "   🟠 ${id}: ${issue} (P1)"
      DISPLAYED=$((DISPLAYED + 1))
    fi
  done <<< "$P1_ITEMS"
fi

# Show count if there are more items
REMAINING=$((TOTAL_COUNT - DISPLAYED))
if [[ $REMAINING -gt 0 ]]; then
  echo "   ... and ${REMAINING} more P0/P1 items"
fi

echo ""
echo "💡 Tip: See 'docs/development/TASK_MANAGEMENT.md' for workflow guide"

exit 0
