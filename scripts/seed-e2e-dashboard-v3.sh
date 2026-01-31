#!/bin/bash
#
# Seed E2E Test Data for Dashboard V3
#
# This script populates the database with test data required for
# Dashboard V3 E2E tests to run successfully.
#
# Prerequisites:
# 1. Supabase CLI installed: brew install supabase/tap/supabase
# 2. Auth user exists: test@example.com (create via Supabase dashboard)
# 3. Migration 20251118050755 applied
#
# Usage:
#   # Seed local database
#   ./scripts/seed-e2e-dashboard-v3.sh
#
#   # Seed cloud database (use with caution!)
#   ./scripts/seed-e2e-dashboard-v3.sh --cloud
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to local
TARGET="local"

# Parse arguments
if [ "$1" = "--cloud" ]; then
  TARGET="cloud"
fi

echo ""
echo "=========================================="
echo "Dashboard V3 E2E Test Data Seed"
echo "=========================================="
echo ""

# Confirm target
if [ "$TARGET" = "cloud" ]; then
  echo -e "${YELLOW}WARNING: You are about to seed the CLOUD database!${NC}"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo ""
  if [ "$REPLY" != "yes" ]; then
    echo "Aborted."
    exit 1
  fi
  DB_URL=$(npx supabase status --linked | grep "DB URL" | awk '{print $3}')
else
  # Check if local Supabase is running
  if ! npx supabase status > /dev/null 2>&1; then
    echo -e "${RED}Error: Local Supabase is not running.${NC}"
    echo ""
    echo "Start it with:"
    echo "  npx supabase start"
    echo ""
    exit 1
  fi

  DB_URL=$(npx supabase status | grep "DB URL" | awk '{print $3}')
fi

echo "Target: $TARGET"
echo "DB URL: ${DB_URL:0:40}..."
echo ""

# Verify migration is applied
echo "Checking migration status..."
MIGRATION_STATUS=$(npx supabase migration list $([ "$TARGET" = "cloud" ] && echo "--linked") | grep "20251118050755" || true)

if [ -z "$MIGRATION_STATUS" ]; then
  echo -e "${RED}Error: Migration 20251118050755 not applied!${NC}"
  echo ""
  echo "Apply it with:"
  if [ "$TARGET" = "cloud" ]; then
    echo "  npm run db:cloud:push"
  else
    echo "  npx supabase db reset"
  fi
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Migration 20251118050755 applied${NC}"
echo ""

# Check for test user
echo "Checking for test user (test@example.com)..."

USER_EXISTS=$(psql "$DB_URL" -tAc "SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'test@example.com')" 2>/dev/null || echo "false")

if [ "$USER_EXISTS" = "f" ] || [ "$USER_EXISTS" = "false" ]; then
  echo -e "${YELLOW}Warning: Test user test@example.com not found${NC}"
  echo ""
  echo "Create the user via:"
  echo "  1. Supabase Dashboard → Authentication → Users → Add User"
  echo "     Email: test@example.com"
  echo "     Password: test123456 (or any password)"
  echo ""
  echo "  2. Or sign up via the app:"
  echo "     http://127.0.0.1:5173/signup"
  echo ""
  read -p "Continue anyway? (yes/no): " -r
  echo ""
  if [ "$REPLY" != "yes" ]; then
    echo "Aborted. Create test user first."
    exit 1
  fi
else
  echo -e "${GREEN}✓ Test user exists${NC}"
  echo ""
fi

# Apply seed file
echo "Applying seed data..."
echo ""

if psql "$DB_URL" -f tests/e2e/fixtures/dashboard-v3-seed.sql; then
  echo ""
  echo -e "${GREEN}=========================================="
  echo "✓ Seed data applied successfully!"
  echo "==========================================${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Run E2E tests:"
  echo "     npm run test:e2e -- dashboard-v3"
  echo ""
  echo "  2. Or run smoke test:"
  echo "     npm run test:e2e -- smoke.spec.ts"
  echo ""
  echo "  3. Verify in browser:"
  echo "     http://127.0.0.1:5173/dashboard-v3"
  echo ""
else
  echo ""
  echo -e "${RED}=========================================="
  echo "✗ Failed to apply seed data"
  echo "==========================================${NC}"
  echo ""
  echo "Check the error above for details."
  echo ""
  exit 1
fi
