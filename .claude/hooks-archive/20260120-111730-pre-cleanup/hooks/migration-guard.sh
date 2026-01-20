#!/bin/bash
# Migration Guard Hook (PreToolUse)
# Warns when editing existing Supabase migration files
# Best practice: Create new migrations instead of editing existing ones

set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Extract file path from payload
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
else
  exit 0
fi

# If no file path, allow
if [ -z "$file_path" ]; then
  exit 0
fi

# Check if it's a migration file
if [[ "$file_path" == *"supabase/migrations/"* ]] && [[ "$file_path" == *.sql ]]; then
  # Extract migration filename
  migration_name=$(basename "$file_path")

  # Check if this is an existing migration (file exists on disk)
  if [ -f "$file_path" ]; then
    echo "⚠️ WARNING: You are editing an existing migration: $migration_name"
    echo ""
    echo "Best practice: Create a NEW migration instead of modifying existing ones."
    echo "Existing migrations may have already been applied to production."
    echo ""
    echo "To create a new migration:"
    echo "  npx supabase migration new <migration_name>"
    echo ""
    echo "Proceeding with edit... (consider creating a new migration instead)"
  fi
fi

# Always allow - this hook is advisory, not blocking
exit 0
