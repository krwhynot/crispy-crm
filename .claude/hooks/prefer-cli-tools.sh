#!/bin/bash
# Enforce preferred CLI tools per CLAUDE.md
# Exit code 2 = block with feedback

set -euo pipefail

payload="$(cat)"

if command -v jq >/dev/null 2>&1; then
  cmd=$(echo "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
else
  exit 0
fi

[ -z "$cmd" ] && exit 0

# --- grep → rg ---
if echo "$cmd" | grep -qE '\b(grep|egrep|fgrep)\b'; then
  echo "❌ BLOCKED: Use 'rg' (ripgrep) instead of grep."
  echo ""
  echo "Examples:"
  echo "  rg \"pattern\" --type ts    # TypeScript files"
  echo "  rg -i \"pattern\"            # Case-insensitive"
  echo "  rg -C 3 \"pattern\"          # With context"
  exit 2
fi

# --- find → fd ---
if echo "$cmd" | grep -qE '^\s*find\b'; then
  echo "❌ BLOCKED: Use 'fd' instead of find."
  echo ""
  echo "Examples:"
  echo "  fd -e tsx \"name\"           # Find .tsx files"
  echo "  fd -t f \"pattern\"          # Find files matching pattern"
  echo "  fd . src/                   # List files in src/"
  exit 2
fi

# --- npm run → just ---
if echo "$cmd" | grep -qE '\bnpm run\b'; then
  echo "❌ BLOCKED: Use 'just' instead of npm run."
  echo ""
  echo "Examples:"
  echo "  just dev                    # Start dev server"
  echo "  just build                  # Build project"
  echo "  just --list                 # Show all recipes"
  exit 2
fi

# --- cat/head/tail for file reading ---
# Only block when reading source files (not for pipes)
if echo "$cmd" | grep -qE '^\s*(cat|head|tail)\s+[^|]+\.(ts|tsx|js|jsx|json|md)'; then
  echo "⚠️  SUGGESTION: Consider using 'bat' for syntax highlighting."
  echo ""
  echo "Examples:"
  echo "  bat --plain file.ts         # Plain output"
  echo "  bat --line-range=10:20 f    # Specific lines"
  # Allow but warn (exit 0, not 2)
  exit 0
fi

# --- ls → eza (if installed) ---
if command -v eza >/dev/null && echo "$cmd" | grep -qE '^\s*ls\b'; then
  echo "⚠️  SUGGESTION: Use 'eza' for better file listing."
  echo "  eza -la              # List with details"
  echo "  eza --git            # Show git status"
  echo "  eza --tree           # Tree view"
  exit 0  # Warn only
fi

# --- sed → sd (if installed) ---
if command -v sd >/dev/null && echo "$cmd" | grep -qE '^\s*sed\b.*s/'; then
  echo "⚠️  SUGGESTION: Use 'sd' for simpler find & replace."
  echo "  sd 'old' 'new' file  # Replace in file"
  echo "  sd -s 'old' 'new'    # Literal (no regex)"
  exit 0  # Warn only
fi

exit 0
