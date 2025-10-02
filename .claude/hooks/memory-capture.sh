#!/bin/bash
# Auto-capture memory after significant tool usage

# Get the project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only capture for Write/Edit operations (avoid noise)
if [[ "$CLAUDE_TOOL_NAME" =~ ^(Write|Edit|MultiEdit)$ ]]; then

  # Get changed files from payload
  CHANGED_FILES="${CLAUDE_CHANGED_FILES:-unknown}"
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

  # Create a simple log entry
  echo "[$TIMESTAMP] Tool: $CLAUDE_TOOL_NAME, Files: $CHANGED_FILES" >> "$PROJECT_DIR/.claude/memory-log.txt"

  # TODO: Add actual MCP memory tool call here
  # This would require calling a Node.js/Python script that uses the MCP memory API
  # Example: node "$PROJECT_DIR/.claude/hooks/create-memory.js" "$CHANGED_FILES"

fi

exit 0
