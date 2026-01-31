#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display warning with emoji and require confirmation
echo -e "${RED}⚠️  ENVIRONMENT RESET${NC}"
echo "   This will DELETE all data in both local and cloud databases."
echo "   Schema structure will be preserved."
echo ""
read -p "Type 'RESET' to confirm: " CONFIRM

if [[ "$CONFIRM" != "RESET" ]]; then
  echo -e "${RED}❌ Cancelled${NC}"
  exit 1
fi

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
  export $(grep -v '^#' .env.production | xargs)
elif [ -f "../.env.production" ]; then
  export $(grep -v '^#' ../.env.production | xargs)
elif [ -f "../../.env.production" ]; then
  export $(grep -v '^#' ../../.env.production | xargs)
else
  echo -e "${RED}❌ Error: .env.production file not found${NC}"
  echo "Please ensure DATABASE_URL_PRODUCTION is set in .env.production"
  exit 1
fi

# Database connections
LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"

# Verify cloud DB connection string exists
if [ -z "$CLOUD_DB" ]; then
  echo -e "${RED}❌ Error: DATABASE_URL_PRODUCTION not set in .env.production${NC}"
  exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Reset local database
echo ""
echo -e "${BLUE}🧹 Resetting local database...${NC}"
npx supabase db reset
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to reset local database${NC}"
  echo "  Ensure local Supabase is running: npm run supabase:local:start"
  exit 1
fi
echo -e "${GREEN}✅ Local database reset successfully${NC}"

# Step 2: Reset cloud database (preserve schema)
echo ""
echo -e "${BLUE}🧹 Resetting cloud database...${NC}"

# Use a single transaction to ensure atomicity
psql "$CLOUD_DB" << 'EOF' 2>/dev/null
BEGIN;

-- Truncate all public tables with CASCADE
TRUNCATE TABLE
  public.activities,
  public."contactNotes",
  public.contacts,
  public."dealNotes",
  public.deals,
  public.opportunities,
  public.organizations,
  public.products,
  public.sales,
  public.segments,
  public.tags,
  public.tasks,
  public.test_user_metadata
CASCADE;

-- Delete test users from auth.users
DELETE FROM auth.users WHERE email LIKE '%@test.local';

COMMIT;
EOF

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Some tables may not exist in cloud database${NC}"
  echo "  Attempting alternative truncation..."

  # Try truncating only tables that exist
  psql "$CLOUD_DB" << 'EOF' 2>/dev/null
BEGIN;

-- Truncate only tables that exist
DO $$
DECLARE
  tbl_name text;
BEGIN
  FOR tbl_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'activities', 'contactNotes', 'contacts', 'dealNotes',
      'deals', 'opportunities', 'organizations', 'products',
      'sales', 'segments', 'tags', 'tasks', 'test_user_metadata'
    )
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I CASCADE', tbl_name);
  END LOOP;
END $$;

-- Delete test users from auth.users
DELETE FROM auth.users WHERE email LIKE '%@test.local';

COMMIT;
EOF

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to reset cloud database${NC}"
    echo "  Verify DATABASE_URL_PRODUCTION in .env.production is correct"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Cloud database reset successfully${NC}"

# Step 3: Create fresh test users
echo ""
echo -e "${BLUE}👥 Creating fresh test users...${NC}"
if [ -f "$SCRIPT_DIR/create-test-users.sh" ]; then
  "$SCRIPT_DIR/create-test-users.sh" "$LOCAL_DB"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create test users${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Test users created successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: create-test-users.sh not found, skipping test user creation${NC}"
fi

# Step 4: Sync to cloud
echo ""
echo -e "${BLUE}🔄 Syncing to cloud...${NC}"
if [ -f "$SCRIPT_DIR/sync-local-to-cloud.sh" ]; then
  "$SCRIPT_DIR/sync-local-to-cloud.sh" --force
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to sync to cloud${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Synced to cloud successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: sync-local-to-cloud.sh not found, skipping cloud sync${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}✅ Environment reset complete!${NC}"
echo "   Both local and cloud have fresh test data."