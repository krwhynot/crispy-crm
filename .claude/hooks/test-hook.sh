#!/usr/bin/env bash
set -euo pipefail

# Simple test hook to verify hooks are working
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook triggered: ${CLAUDE_HOOK_EVENT:-unknown}" >> "${CLAUDE_PROJECT_DIR}/.claude/hooks.log"

# Log the payload for debugging
if [ "${DEBUG_HOOKS:-0}" = "1" ]; then
  payload="$(cat)"
  echo "Payload: $payload" >> "${CLAUDE_PROJECT_DIR}/.claude/hooks.log"
fi