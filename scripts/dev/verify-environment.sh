#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env.cloud
if [ -f ".env.cloud" ]; then
  export $(grep -v '^#' .env.cloud | xargs)
elif [ -f "../.env.cloud" ]; then
  export $(grep -v '^#' ../.env.cloud | xargs)
elif [ -f "../../.env.cloud" ]; then
  export $(grep -v '^#' ../../.env.cloud | xargs)
else
  echo -e "${RED}❌ Error: .env.cloud file not found${NC}"
  echo "Please ensure CLOUD_DB is set in .env.cloud"
  exit 1
fi

# Database connections
LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
# CLOUD_DB is already set in .env.cloud

# Verify cloud DB connection string exists
if [ -z "$CLOUD_DB" ]; then
  echo -e "${RED}❌ Error: CLOUD_DB not set in .env.cloud${NC}"
  exit 1
fi

echo -e "${BLUE}🔍 Verifying environment parity...${NC}"
echo ""

# Define tables to check
TABLES=(
  "activities"
  "contacts"
  "contactNotes"
  "opportunities"
  "organizations"
  "products"
  "sales"
  "tasks"
)

MISMATCH=0

# Compare table counts
for table in "${TABLES[@]}"; do
  # Get local count (trim whitespace)
  LOCAL_COUNT=$(psql "$LOCAL_DB" -t -c "SELECT COUNT(*) FROM public.\"$table\";" 2>/dev/null | tr -d ' ')
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to query local database for $table${NC}"
    echo "  Ensure local Supabase is running: npm run supabase:local:start"
    exit 1
  fi

  # Get cloud count (trim whitespace)
  CLOUD_COUNT=$(psql "$CLOUD_DB" -t -c "SELECT COUNT(*) FROM public.\"$table\";" 2>/dev/null | tr -d ' ')
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to query cloud database for $table${NC}"
    echo "  Verify CLOUD_DB in .env.cloud is correct"
    exit 1
  fi

  # Compare counts
  if [[ "$LOCAL_COUNT" -eq "$CLOUD_COUNT" ]]; then
    echo -e "${GREEN}✅ $table: $LOCAL_COUNT (local) = $CLOUD_COUNT (cloud)${NC}"
  else
    echo -e "${RED}❌ $table: $LOCAL_COUNT (local) ≠ $CLOUD_COUNT (cloud)${NC}"
    MISMATCH=1
  fi
done

# Verify test users exist
echo ""
echo -e "${BLUE}👥 Test users:${NC}"
TEST_USERS=$(psql "$CLOUD_DB" -t -c "SELECT email FROM auth.users WHERE email LIKE '%@test.local' ORDER BY email;" 2>/dev/null)
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Could not query test users from cloud database${NC}"
else
  if [ -z "$TEST_USERS" ]; then
    echo -e "${YELLOW}  No test users found${NC}"
  else
    echo "$TEST_USERS" | while IFS= read -r email; do
      if [ ! -z "$(echo $email | tr -d ' ')" ]; then
        echo " $email"
      fi
    done
  fi
fi

# Final status
echo ""
if [[ $MISMATCH -eq 0 ]]; then
  echo -e "${GREEN}✅ Environments are in sync!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Mismatches detected. Run sync again if needed.${NC}"
  exit 1
fi