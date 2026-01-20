#!/bin/bash
# File Protection Hook
# Blocks edits to sensitive files like .env, credentials, and lock files
# Exit code 2 = block the operation with feedback to Claude

set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Extract file path from payload
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
else
  # Fallback: allow if jq not available
  exit 0
fi

# If no file path, allow
if [ -z "$file_path" ]; then
  exit 0
fi

# List of protected patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "supabase/.env"
  "package-lock.json"
  "pnpm-lock.yaml"
  "yarn.lock"
  ".git/"
  "credentials"
  "secrets"
)

# Check if file matches any protected pattern
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$file_path" == *"$pattern"* ]]; then
    # Exit code 2 blocks the operation and sends feedback to Claude
    echo "BLOCKED: Cannot edit '$file_path' - this is a protected file."
    echo "Protected files include: .env files, lock files, .git/, and credentials."
    echo "If you need to modify environment variables, ask the user to do it manually."
    exit 2
  fi
done

# File is not protected, allow the operation
exit 0
