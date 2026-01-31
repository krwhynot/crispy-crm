#!/bin/bash
# =====================================================================
# Create Test Users Script
# =====================================================================
# Creates 3 test users with role-specific data volumes:
# - Admin: Full access with extensive test data
# - Sales Director: Read-all, write-own with moderate data
# - Account Manager: Read/write-own with minimal data
# =====================================================================

set -e  # Exit on any error

# =====================================================================
# Configuration
# =====================================================================

# User configuration from environment or defaults
ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-admin@test.local}"
DIRECTOR_EMAIL="${TEST_DIRECTOR_EMAIL:-director@test.local}"
MANAGER_EMAIL="${TEST_MANAGER_EMAIL:-manager@test.local}"
TEST_PASSWORD="${TEST_USER_PASSWORD:-TestPass123!}"

# Database configuration - accept as first argument or use default
DB_URL="${1:-postgresql://postgres:postgres@localhost:54322/postgres}"

# Docker container name for local Supabase
CONTAINER_NAME="supabase_db_crispy-crm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================================================================
# Utility Functions
# =====================================================================

error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

success_msg() {
    echo -e "${GREEN}✓${NC} $1"
}

info_msg() {
    echo -e "${YELLOW}→${NC} $1"
}

# =====================================================================
# Prerequisite Checks
# =====================================================================

echo "👥 Creating test users with role-specific data..."
echo "   Database: $DB_URL"
echo ""

# Check for required utilities
info_msg "Checking prerequisites..."

# Check for uuidgen
if ! command -v uuidgen &> /dev/null; then
    error_exit "uuidgen is required but not installed. Install uuid-runtime package."
fi

# Check for node
if ! command -v node &> /dev/null; then
    error_exit "node is required but not installed. Please install Node.js."
fi

# Check database connectivity
# Try Docker first if URL is localhost
if [[ "$DB_URL" == *"localhost"* ]] || [[ "$DB_URL" == *"127.0.0.1"* ]]; then
    # Check if Docker container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        info_msg "Using Docker container: ${CONTAINER_NAME}"
        PSQL_CMD="docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres"
    else
        error_exit "Docker container ${CONTAINER_NAME} is not running. Start it with: npm run supabase:local:start"
    fi
else
    # For remote databases, use psql directly
    if ! command -v psql &> /dev/null; then
        error_exit "psql is required for remote database connections but not installed."
    fi
    PSQL_CMD="psql $DB_URL"
fi

# Test database connection
info_msg "Testing database connection..."
if ! $PSQL_CMD -c "SELECT 1" &> /dev/null; then
    error_exit "Failed to connect to database"
fi

# Check pgcrypto extension
info_msg "Checking pgcrypto extension..."
if ! $PSQL_CMD -c "SELECT 'pgcrypto installed'::text FROM pg_extension WHERE extname = 'pgcrypto'" | grep -q "pgcrypto installed"; then
    info_msg "Installing pgcrypto extension..."
    $PSQL_CMD -c "CREATE EXTENSION IF NOT EXISTS pgcrypto"
fi

success_msg "Prerequisites check passed"
echo ""

# =====================================================================
# Generate User IDs
# =====================================================================

info_msg "Generating deterministic user IDs..."

# Generate UUIDs deterministically using UUIDv5 with DNS namespace
ADMIN_ID=$(uuidgen -s -n @dns -N "$ADMIN_EMAIL")
DIRECTOR_ID=$(uuidgen -s -n @dns -N "$DIRECTOR_EMAIL")
MANAGER_ID=$(uuidgen -s -n @dns -N "$MANAGER_EMAIL")

success_msg "Generated user IDs:"
echo "   Admin:    $ADMIN_ID"
echo "   Director: $DIRECTOR_ID"
echo "   Manager:  $MANAGER_ID"
echo ""

# =====================================================================
# Step 1: Create Auth Users
# =====================================================================

echo "1️⃣  Creating auth.users..."

$PSQL_CMD << EOF
-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$ADMIN_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$ADMIN_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

-- Sales Director user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$DIRECTOR_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$DIRECTOR_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Sales Director", "role": "sales_director"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

-- Account Manager user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$MANAGER_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$MANAGER_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Account Manager", "role": "account_manager"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();
EOF

if [ $? -eq 0 ]; then
    success_msg "Auth users created successfully"
else
    error_exit "Failed to create auth users"
fi

# =====================================================================
# Step 2: Create Sales Records
# =====================================================================

echo ""
echo "2️⃣  Creating public.sales records..."

$PSQL_CMD << EOF
-- Create or update sales records
-- The auth triggers should handle this, but we ensure they exist
INSERT INTO public.sales (
  user_id,
  first_name,
  last_name,
  email,
  is_admin
) VALUES
  ('$ADMIN_ID'::uuid, 'Admin', 'User', '$ADMIN_EMAIL', true),
  ('$DIRECTOR_ID'::uuid, 'Sales', 'Director', '$DIRECTOR_EMAIL', false),
  ('$MANAGER_ID'::uuid, 'Account', 'Manager', '$MANAGER_EMAIL', false)
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();
EOF

if [ $? -eq 0 ]; then
    success_msg "Sales records created successfully"
else
    error_exit "Failed to create sales records"
fi

# =====================================================================
# Step 3: Get Sales IDs for Data Generation
# =====================================================================

echo ""
echo "3️⃣  Looking up sales IDs..."

# Query the bigint sales.id values that were just created
ADMIN_SALES_ID=$($PSQL_CMD -t -c "SELECT id FROM sales WHERE user_id = '$ADMIN_ID'::uuid" | tr -d ' ')
DIRECTOR_SALES_ID=$($PSQL_CMD -t -c "SELECT id FROM sales WHERE user_id = '$DIRECTOR_ID'::uuid" | tr -d ' ')
MANAGER_SALES_ID=$($PSQL_CMD -t -c "SELECT id FROM sales WHERE user_id = '$MANAGER_ID'::uuid" | tr -d ' ')

success_msg "Sales IDs retrieved:"
echo "   Admin:    $ADMIN_SALES_ID"
echo "   Director: $DIRECTOR_SALES_ID"
echo "   Manager:  $MANAGER_SALES_ID"

# =====================================================================
# Step 4: Generate Role-Specific Test Data
# =====================================================================

echo ""
echo "4️⃣  Generating test data..."

# Set environment variables for local Supabase connection
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-http://localhost:54321}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"

# Admin gets most data (50 orgs, 100 contacts, 75 opportunities)
echo ""
info_msg "Generating admin data (50 orgs, 100 contacts, 75 opportunities)..."
SEED_ORGANIZATION_COUNT=50 \
SEED_CONTACT_COUNT=100 \
SEED_OPPORTUNITY_COUNT=75 \
SEED_ACTIVITY_COUNT=200 \
SEED_PRODUCT_COUNT=100 \
TEST_USER_ID="$ADMIN_SALES_ID" \
node /home/krwhynot/projects/crispy-crm/scripts/seed-data.js

if [ $? -eq 0 ]; then
    success_msg "Admin data generated"
else
    error_exit "Failed to generate admin data"
fi

# Director gets moderate data (30 orgs, 60 contacts, 40 opportunities)
echo ""
info_msg "Generating director data (30 orgs, 60 contacts, 40 opportunities)..."
SEED_ORGANIZATION_COUNT=30 \
SEED_CONTACT_COUNT=60 \
SEED_OPPORTUNITY_COUNT=40 \
SEED_ACTIVITY_COUNT=120 \
SEED_PRODUCT_COUNT=0 \
TEST_USER_ID="$DIRECTOR_SALES_ID" \
node /home/krwhynot/projects/crispy-crm/scripts/seed-data.js

if [ $? -eq 0 ]; then
    success_msg "Director data generated"
else
    error_exit "Failed to generate director data"
fi

# Manager gets minimal data (20 orgs, 40 contacts, 25 opportunities)
echo ""
info_msg "Generating manager data (20 orgs, 40 contacts, 25 opportunities)..."
SEED_ORGANIZATION_COUNT=20 \
SEED_CONTACT_COUNT=40 \
SEED_OPPORTUNITY_COUNT=25 \
SEED_ACTIVITY_COUNT=80 \
SEED_PRODUCT_COUNT=0 \
TEST_USER_ID="$MANAGER_SALES_ID" \
node /home/krwhynot/projects/crispy-crm/scripts/seed-data.js

if [ $? -eq 0 ]; then
    success_msg "Manager data generated"
else
    error_exit "Failed to generate manager data"
fi

# =====================================================================
# Step 5: Track Test User Metadata
# =====================================================================

echo ""
echo "5️⃣  Recording test user metadata..."

$PSQL_CMD << EOF
-- Create metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.test_user_metadata (
  user_id uuid PRIMARY KEY,
  role text NOT NULL,
  test_data_counts jsonb,
  created_at timestamptz DEFAULT NOW(),
  last_sync_at timestamptz DEFAULT NOW()
);

-- Insert or update metadata
INSERT INTO public.test_user_metadata (user_id, role, test_data_counts)
VALUES
  ('$ADMIN_ID'::uuid, 'admin', '{"contacts": 100, "organizations": 50, "opportunities": 75, "activities": 200, "products": 100}'::jsonb),
  ('$DIRECTOR_ID'::uuid, 'sales_director', '{"contacts": 60, "organizations": 30, "opportunities": 40, "activities": 120, "products": 0}'::jsonb),
  ('$MANAGER_ID'::uuid, 'account_manager', '{"contacts": 40, "organizations": 20, "opportunities": 25, "activities": 80, "products": 0}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  test_data_counts = EXCLUDED.test_data_counts,
  last_sync_at = NOW();
EOF

if [ $? -eq 0 ]; then
    success_msg "Test user metadata recorded"
else
    error_exit "Failed to record test user metadata"
fi

# =====================================================================
# Summary
# =====================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Test users created successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 Login credentials:"
echo "   Admin:           $ADMIN_EMAIL / $TEST_PASSWORD"
echo "   Sales Director:  $DIRECTOR_EMAIL / $TEST_PASSWORD"
echo "   Account Manager: $MANAGER_EMAIL / $TEST_PASSWORD"
echo ""
echo "📊 Data summary:"
echo "   Admin:    100 contacts, 50 orgs, 75 opportunities, 200 activities"
echo "   Director:  60 contacts, 30 orgs, 40 opportunities, 120 activities"
echo "   Manager:   40 contacts, 20 orgs, 25 opportunities, 80 activities"
echo ""
echo "🔗 Access the app at: http://localhost:5173"
echo ""