#!/bin/bash
# Initialize Superpowers System at Session Start
# This hook runs automatically when Claude Code starts in this project

# --- DEBUGGING START ---
LOG_FILE="/tmp/claude_hook_debug_$(date +%Y%m%d_%H%M%S).log"
echo "--- init-superpowers.sh Debug Log ---" > "$LOG_FILE"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "Current Working Directory: $(pwd)" >> "$LOG_FILE"
echo "CLAUDE_PROJECT_DIR: \"$CLAUDE_PROJECT_DIR\"" >> "$LOG_FILE"
echo "Attempting to execute: ${CLAUDE_PROJECT_DIR}/.claude/hooks/init-superpowers.sh" >> "$LOG_FILE"
echo "Path to self (0): $0" >> "$LOG_FILE"
echo "PATH environment variable: $PATH" >> "$LOG_FILE"
echo "User: $(whoami)" >> "$LOG_FILE"
echo "Shell: $SHELL" >> "$LOG_FILE"
echo "--- DEBUGGING END ---" >> "$LOG_FILE"
# --- DEBUGGING END ---

# Color codes for beautiful output
ROCKET="🚀"
STAR="⭐"
CHECK="✅"
POWER="⚡"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Display confirmation message
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${ROCKET} ${BOLD}${GREEN} YOU HAVE SUPERPOWERS NOW!${NC} ${ROCKET}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${STAR} ${YELLOW}Superpowers System:${NC} ${GREEN}ACTIVE${NC}"
echo -e "${POWER} ${YELLOW}Workflow Enforcement:${NC} ${GREEN}ENABLED${NC}"
echo -e "${CHECK} ${YELLOW}Skill Checking:${NC} ${GREEN}MANDATORY${NC}"
echo ""
echo "The following protocols are now enforced:"
echo "  • Check for relevant skills before ANY task"
echo "  • Use skills without exception when they apply"
echo "  • Create TodoWrite entries for all checklists"
echo "  • Follow proven workflows (no shortcuts)"
echo ""
echo -e "${BOLD}${BLUE}───────────────────────────────────────────────────────────────${NC}"
echo "Session initialized at: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BOLD}${BLUE}───────────────────────────────────────────────────────────────${NC}"
echo ""

# Return success to indicate hook completed
exit 0