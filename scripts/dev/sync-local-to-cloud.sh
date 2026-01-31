#!/bin/bash
set -e

# ============================================================================
# Local to Cloud Sync Script
#
# Purpose: Push local PostgreSQL test data to cloud Supabase with automatic backup
# Prerequisites:
#   - Local Supabase running (npm run supabase:local:start)
#   - .env.production configured with cloud credentials
#   - pg_dump and psql utilities available
# ============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required utilities
command -v pg_dump >/dev/null 2>&1 || { echo -e "${RED}Error: pg_dump is not installed${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}Error: psql is not installed${NC}"; exit 1; }

# Source production environment
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
else
  echo -e "${RED}Error: .env.production not found${NC}"
  exit 1
fi

# Configuration
LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/sync"

# Validate cloud database URL
if [ -z "$CLOUD_DB" ]; then
  echo -e "${RED}Error: DATABASE_URL_PRODUCTION not set in .env.production${NC}"
  exit 1
fi

# Extract cloud hostname for display
CLOUD_HOST=$(echo "$CLOUD_DB" | sed -n 's/.*@\([^/]*\).*/\1/p')

# Safety check - require --force flag
if [[ "$1" != "--force" ]]; then
  echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE cloud database with local data${NC}"
  echo -e "   Cloud Host: ${BLUE}${CLOUD_HOST}${NC}"
  echo ""
  echo "   This operation will:"
  echo "   • Backup the cloud database"
  echo "   • Clear all cloud public schema data"
  echo "   • Import all local test data"
  echo "   • Sync test auth users (emails ending with @test.local)"
  echo ""
  echo -e "   Run with ${GREEN}--force${NC} to confirm:"
  echo -e "   ${BLUE}./scripts/dev/sync-local-to-cloud.sh --force${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       LOCAL TO CLOUD SYNC - STARTING${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Create backup directory
echo -e "${BLUE}📁 Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Step 2: Backup cloud database before changes
echo -e "${BLUE}📦 Backing up cloud database...${NC}"
echo "   Target: $BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"
pg_dump "$CLOUD_DB" \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"
echo -e "${GREEN}   ✓ Cloud backup created${NC}"

# Step 3: Dump local data (exclude auth schema initially)
echo -e "${BLUE}📤 Exporting local data...${NC}"
echo "   Target: $BACKUP_DIR/local_dump_$TIMESTAMP.sql"
pg_dump "$LOCAL_DB" \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/local_dump_$TIMESTAMP.sql"
echo -e "${GREEN}   ✓ Local data exported${NC}"

# Step 4: Clear cloud public schema data (preserve structure)
echo -e "${BLUE}🧹 Clearing cloud data...${NC}"
psql "$CLOUD_DB" << 'EOF' >/dev/null 2>&1
TRUNCATE TABLE
  public.activities,
  public."contactNotes",
  public.contacts,
  public."opportunityNotes",
  public.opportunities,
  public.organizations,
  public.products,
  public.sales,
  public.segments,
  public.tags,
  public.tasks,
  public.test_user_metadata
CASCADE;
EOF
echo -e "${GREEN}   ✓ Cloud data cleared${NC}"

# Step 5: Import local data to cloud
echo -e "${BLUE}📥 Importing local data to cloud...${NC}"
psql "$CLOUD_DB" < "$BACKUP_DIR/local_dump_$TIMESTAMP.sql" >/dev/null 2>&1
echo -e "${GREEN}   ✓ Local data imported${NC}"

# Step 6: Sync auth users separately (preserve passwords)
echo -e "${BLUE}👤 Syncing test auth users...${NC}"

# First, export test users from local
TEMP_USERS_FILE="$BACKUP_DIR/test_users_$TIMESTAMP.json"
psql "$LOCAL_DB" -t -A -c "
  SELECT json_agg(json_build_object(
    'id', id,
    'email', email,
    'encrypted_password', encrypted_password,
    'raw_user_meta_data', raw_user_meta_data,
    'email_confirmed_at', email_confirmed_at,
    'created_at', created_at,
    'updated_at', updated_at
  ))
  FROM auth.users
  WHERE email LIKE '%@test.local';
" > "$TEMP_USERS_FILE"

# Check if we have users to sync
if [ -s "$TEMP_USERS_FILE" ] && [ "$(cat "$TEMP_USERS_FILE")" != "" ] && [ "$(cat "$TEMP_USERS_FILE")" != "null" ]; then
  # Import users to cloud
  psql "$CLOUD_DB" << EOF >/dev/null 2>&1
WITH user_data AS (
  SELECT
    (value->>'id')::uuid as id,
    value->>'email' as email,
    value->>'encrypted_password' as encrypted_password,
    (value->>'raw_user_meta_data')::jsonb as raw_user_meta_data,
    COALESCE((value->>'email_confirmed_at')::timestamptz, NOW()) as email_confirmed_at,
    COALESCE((value->>'created_at')::timestamptz, NOW()) as created_at,
    COALESCE((value->>'updated_at')::timestamptz, NOW()) as updated_at
  FROM json_array_elements('$(cat "$TEMP_USERS_FILE")'::json)
)
INSERT INTO auth.users (
  id, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  aud, role, instance_id
)
SELECT
  id, email, encrypted_password, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = EXCLUDED.updated_at;
EOF
  echo -e "${GREEN}   ✓ Test users synced${NC}"
else
  echo -e "${YELLOW}   ⚠ No test users found to sync${NC}"
fi

# Clean up temp file
rm -f "$TEMP_USERS_FILE"

# Step 7: Log sync operation
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📋 SYNC SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo "   Operation: local_to_cloud"
echo "   Initiated by: $(whoami)"
echo "   Timestamp: $TIMESTAMP"
echo "   Cloud Host: $CLOUD_HOST"
echo "   Backup Location: $BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Step 8: Verify counts by calling verify-environment.sh
if [ -f "./scripts/dev/verify-environment.sh" ]; then
  echo ""
  echo -e "${BLUE}✅ Verifying environment...${NC}"
  ./scripts/dev/verify-environment.sh
else
  echo -e "${YELLOW}⚠ verify-environment.sh not found, skipping verification${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 SYNC COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📊 Backup saved: ${BLUE}$BACKUP_DIR/cloud_backup_$TIMESTAMP.sql${NC}"
echo -e "🔄 To rollback: ${YELLOW}psql \$CLOUD_DB < $BACKUP_DIR/cloud_backup_$TIMESTAMP.sql${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   • Auth triggers must exist on cloud for sales records to sync"
echo "   • Run migration 20251015014019 if triggers are missing"
echo ""