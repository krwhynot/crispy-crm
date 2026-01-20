#!/bin/bash
# session-init.sh - Initializes Claude Code session for Crispy CRM
#
# Hook Event: SessionStart
# Purpose: Set environment variables, check cache staleness, verify Supabase status
# Exit: Always 0 (initialization is advisory, never blocks session)

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ENV_FILE="${CLAUDE_ENV_FILE:-}"
WARNINGS=""

# Helper to write environment variables (only to file, skip if no file)
write_env() {
  if [[ -n "$ENV_FILE" ]]; then
    echo "$1" >> "$ENV_FILE"
  fi
}

# Helper to add warning
add_warning() {
  if [[ -n "$WARNINGS" ]]; then
    WARNINGS="$WARNINGS | $1"
  else
    WARNINGS="$1"
  fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Set Environment Variables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
write_env "PROJECT_TYPE=react-admin"

# Extract version from package.json using jq (with fallback)
if command -v jq &>/dev/null && [[ -f "$PROJECT_DIR/package.json" ]]; then
  VERSION=$(jq -r '.version // "unknown"' "$PROJECT_DIR/package.json")
else
  VERSION="unknown"
fi
write_env "CRISPY_CRM_VERSION=$VERSION"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Check Discovery Cache Staleness
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANIFEST="$PROJECT_DIR/.claude/state/manifest.json"
if [[ -f "$MANIFEST" ]]; then
  # Cross-platform file age check
  if [[ "$(uname)" == "Darwin" ]]; then
    file_mtime=$(stat -f%m "$MANIFEST")
  else
    file_mtime=$(stat -c%Y "$MANIFEST")
  fi
  current_time=$(date +%s)
  age_hours=$(( (current_time - file_mtime) / 3600 ))

  if [[ $age_hours -gt 24 ]]; then
    add_warning "⚠️ Cache stale (${age_hours}h) → just discover-incr"
  fi
else
  add_warning "⚠️ No cache → just discover"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Auto-Start Supabase (if not running)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Fast check: look for supabase_db container (the core postgres instance)
# This avoids slow `docker ps` enumeration by using a targeted filter
SUPABASE_RUNNING=false
if command -v docker &>/dev/null; then
  if docker ps -q --filter "name=supabase_db" 2>/dev/null | grep -q .; then
    SUPABASE_RUNNING=true
  fi
fi

if [[ "$SUPABASE_RUNNING" == "false" ]]; then
  # Start Supabase in background - don't block session startup
  # Use nohup to detach completely, redirect output to log file
  SUPABASE_LOG="$PROJECT_DIR/.claude/supabase-start.log"
  nohup npx supabase start > "$SUPABASE_LOG" 2>&1 &
  SUPABASE_STATUS="🚀 Supabase starting in background (log: .claude/supabase-start.log)"
else
  SUPABASE_STATUS="✅ Supabase running"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Build and Output JSON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build message with optional warnings
if [[ -n "$WARNINGS" ]]; then
  MESSAGE="Crispy CRM v${VERSION} | ${SUPABASE_STATUS} | ${WARNINGS}"
else
  MESSAGE="Crispy CRM v${VERSION} | ${SUPABASE_STATUS}"
fi

cat << EOF
{
  "systemMessage": "$MESSAGE",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Project: Crispy CRM v${VERSION} | Stack: React Admin + Supabase"
  }
}
EOF

exit 0
