#!/bin/bash
# =============================================================================
# MIGRATION DRIFT DETECTION SCRIPT
# =============================================================================
# Compares local migration files against cloud migration history.
# Use this to detect and diagnose schema divergence before it causes issues.
#
# Usage:
#   ./scripts/check-migration-drift.sh           # Full check with details
#   ./scripts/check-migration-drift.sh --quick   # Quick pass/fail check
#   ./scripts/check-migration-drift.sh --repair  # Show repair commands
# =============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MIGRATIONS_DIR="supabase/migrations"
QUICK_MODE=false
SHOW_REPAIR=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick) QUICK_MODE=true; shift ;;
    --repair) SHOW_REPAIR=true; shift ;;
    *) shift ;;
  esac
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Migration Drift Detection${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if supabase CLI is available
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx not found${NC}"
  exit 1
fi

# Get local migration versions
echo -e "${BLUE}Scanning local migrations...${NC}"
local_versions=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sed 's/.*\///' | sed 's/_.*//' | sort -u)
local_count=$(echo "$local_versions" | wc -l | tr -d ' ')
echo "  Found: $local_count local migration files"

# Get cloud migration versions via dry-run
echo -e "${BLUE}Checking cloud migration history...${NC}"
drift_output=$(npx supabase db push --dry-run 2>&1 || true)

# Check for drift
if echo "$drift_output" | grep -q "migration history does not match"; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠️  MIGRATION DRIFT DETECTED${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ "$QUICK_MODE" = true ]; then
    exit 1
  fi

  # Extract repair commands from output
  echo -e "${YELLOW}Repair commands suggested by Supabase CLI:${NC}"
  echo ""
  echo "$drift_output" | grep -E "supabase migration repair" | while read -r line; do
    echo "  $line"
  done

  if [ "$SHOW_REPAIR" = true ]; then
    echo ""
    echo -e "${BLUE}To fix, run the repair commands above, then verify with:${NC}"
    echo "  npx supabase db push --dry-run"
  fi

  echo ""
  echo -e "${YELLOW}Root causes of drift:${NC}"
  echo "  1. Migrations applied directly to cloud (via MCP, dashboard, or CLI)"
  echo "  2. Local migration files deleted after being applied"
  echo "  3. Different machines creating migrations with different timestamps"
  echo ""

  exit 1

elif echo "$drift_output" | grep -qE "Would apply|migrations? to apply"; then
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📤 PENDING MIGRATIONS${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Local migrations that will be applied on next deploy:"
  echo "$drift_output" | grep -E "Would apply|Applying" | sed 's/^/  /'
  echo ""
  echo -e "${BLUE}To deploy: npx supabase db push${NC}"
  echo ""
  exit 0

else
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ NO DRIFT DETECTED${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Local and cloud migration histories are in sync."
  echo ""
  exit 0
fi
