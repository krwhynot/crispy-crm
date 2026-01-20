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
if echo "$cmd" | grep -qE '(^|\s)(grep|egrep|fgrep)\s+[^|]+\.(ts|tsx|js|jsx|json|md|py|rs|go|java|c|cpp|h)'; then
  echo "❌ BLOCKED: Use 'rg' (ripgrep) instead of grep." >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  rg \"pattern\" --type ts    # TypeScript files" >&2
  echo "  rg -i \"pattern\"            # Case-insensitive" >&2
  echo "  rg -C 3 \"pattern\"          # With context" >&2
  exit 2
fi

# --- find → fd ---
if echo "$cmd" | grep -qE '^\s*find\b'; then
  echo "❌ BLOCKED: Use 'fd' instead of find." >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  fd -e tsx \"name\"           # Find .tsx files" >&2
  echo "  fd -t f \"pattern\"          # Find files matching pattern" >&2
  echo "  fd . src/                   # List files in src/" >&2
  exit 2
fi

# --- npm run → just ---
if echo "$cmd" | grep -qE '\bnpm run\b'; then
  echo "❌ BLOCKED: Use 'just' instead of npm run." >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  just dev                    # Start dev server" >&2
  echo "  just build                  # Build project" >&2
  echo "  just --list                 # Show all recipes" >&2
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
