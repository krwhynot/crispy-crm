#!/bin/bash
# ESLint Check Hook (PostToolUse)
# Runs ESLint on TypeScript/React files after edits to catch issues early
# This is informational - it doesn't block, just provides feedback

set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Extract file path from payload
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
else
  exit 0
fi

# If no file path or file doesn't exist, skip
if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Only run on TypeScript/React files
case "$file_path" in
  *.ts|*.tsx)
    # Check if eslint is available
    if ! command -v npx >/dev/null 2>&1; then
      exit 0
    fi

    # Run ESLint with default stylish output
    # Limit output to first 10 lines to avoid noise
    output=$(npx eslint "$file_path" 2>/dev/null | head -10 || true)

    if [ -n "$output" ]; then
      echo "⚠️ ESLint issues in $file_path:"
      echo "$output"
    fi
    ;;
esac

# Always exit 0 - this hook is informational, not blocking
exit 0
