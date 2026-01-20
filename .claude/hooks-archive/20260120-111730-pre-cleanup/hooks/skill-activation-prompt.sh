#!/bin/bash
set -e

# Use CLAUDE_PROJECT_DIR if set, otherwise use the script's actual location
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJECT_DIR/.claude/hooks"
cat | npx tsx skill-activation-prompt.ts
