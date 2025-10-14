#!/usr/bin/env bash
# memory-capture.sh - Logs file changes for memory review
#
# USAGE:
# 1. This hook runs automatically after Write/Edit/MultiEdit
# 2. Logs entries to .claude/memory-capture.log
# 3. Claude reviews log periodically during conversations
# 4. User can trigger: "review memory log" or "check recent changes"
# 5. Claude creates memory entities via mcp__memory__create_entities
#
# Follows CLAUDE.md Memory Management Protocol

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract fields (fallback if jq not available)
file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' || echo "unknown")
tool_name=$(echo "$input" | grep -oP '"tool_name"\s*:\s*"\K[^"]+' || echo "unknown")

# Skip if no file path identified
if [ "$file_path" = "unknown" ]; then
  exit 0
fi

# Classify by file extension/path
type="code"
[[ "$file_path" == *.sql ]] && type="migration"
[[ "$file_path" == *.md ]] && type="documentation"
[[ "$file_path" == *config* ]] && type="configuration"
[[ "$file_path" == *settings* ]] && type="configuration"
[[ "$file_path" == *.json ]] && type="configuration"
[[ "$file_path" == *.toml ]] && type="configuration"
[[ "$file_path" == *.yaml ]] && type="configuration"
[[ "$file_path" == *.yml ]] && type="configuration"

# Get project directory
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Log to memory capture file
log_file="$project_dir/.claude/memory-capture.log"
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$timestamp] [$type] $tool_name: $file_path" >> "$log_file"

exit 0
