#!/bin/bash
# cleanup-state.sh - Cleans up old hook state files on session end
# Deletes files older than 7 days to prevent indefinite accumulation
#
# Hook Event: SessionEnd
# Exit: Always 0 (cleanup is advisory, never blocks session end)

set -e

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/state"

if [ -d "$STATE_DIR" ]; then
  # Delete files older than 7 days
  find "$STATE_DIR" -type f -mtime +7 -delete 2>/dev/null || true

  # Count remaining files (optional logging)
  remaining=$(find "$STATE_DIR" -type f 2>/dev/null | wc -l)
  echo "State cleanup complete. $remaining files remaining."
fi

exit 0
