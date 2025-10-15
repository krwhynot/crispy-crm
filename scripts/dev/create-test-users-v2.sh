#!/bin/bash
# =====================================================================
# Create Test Users Script (Refactored for Supabase Auth API)
# =====================================================================
# Creates 3 test users using Supabase CLI auth commands:
# - Admin: Full access with extensive test data (100 contacts, 50 orgs, 75 opps)
# - Sales Director: Moderate data (60 contacts, 30 orgs, 40 opps)
# - Account Manager: Minimal data (40 contacts, 20 orgs, 25 opps)
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
BLUE='\033[0;34m'
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

# Determine psql command (Docker or native)
if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    PSQL_CMD="docker exec -i $CONTAINER_NAME psql -U postgres -d postgres"
else
    PSQL_CMD="psql $DB_URL"
fi

# =====================================================================
# Prerequisites Check
# =====================================================================

echo -e "${BLUE}👥 Creating test users with role-specific data...${NC}"
echo "   Database: $DB_URL"
echo ""

info_msg "Checking prerequisites..."

# Check for required utilities
if ! command -v npx &> /dev/null; then
    error_exit "npx not found. Please install Node.js."
fi

if ! command -v node &> /dev/null; then
    error_exit "node not found. Please install Node.js."
fi

# Check if Supabase is running
if ! npx supabase status &> /dev/null; then
    error_exit "Local Supabase is not running. Run: npx supabase start"
fi

info_msg "Testing database connection..."
if ! $PSQL_CMD -c "SELECT 1;" &> /dev/null; then
    error_exit "Cannot connect to database at $DB_URL"
fi

success_msg "Prerequisites check passed"
echo ""

# =====================================================================
# Step 1: Create Auth Users via Supabase CLI
# =====================================================================

echo "1️⃣  Creating auth users via Supabase CLI..."

# Create Admin user
info_msg "Creating admin user ($ADMIN_EMAIL)..."
if npx supabase auth admin create-user \
    --email="$ADMIN_EMAIL" \
    --password="$TEST_PASSWORD" \
    --confirm &> /dev/null; then
    success_msg "Admin user created"
else
    info_msg "Admin user already exists (continuing...)"
fi

# Create Sales Director user
info_msg "Creating sales director ($DIRECTOR_EMAIL)..."
if npx supabase auth admin create-user \
    --email="$DIRECTOR_EMAIL" \
    --password="$TEST_PASSWORD" \
    --confirm &> /dev/null; then
    success_msg "Sales director created"
else
    info_msg "Sales director already exists (continuing...)"
fi

# Create Account Manager user
info_msg "Creating account manager ($MANAGER_EMAIL)..."
if npx supabase auth admin create-user \
    --email="$MANAGER_EMAIL" \
    --password="$TEST_PASSWORD" \
    --confirm &> /dev/null; then
    success_msg "Account manager created"
else
    info_msg "Account manager already exists (continuing...)"
fi

echo ""

# =====================================================================
# Step 2: Get User IDs and Update Sales Records
# =====================================================================

echo "2️⃣  Updating sales records with permissions..."

# Get user IDs from auth.users
ADMIN_ID=$($PSQL_CMD -t -c "SELECT id FROM auth.users WHERE email = '$ADMIN_EMAIL';" | xargs)
DIRECTOR_ID=$($PSQL_CMD -t -c "SELECT id FROM auth.users WHERE email = '$DIRECTOR_EMAIL';" | xargs)
MANAGER_ID=$($PSQL_CMD -t -c "SELECT id FROM auth.users WHERE email = '$MANAGER_EMAIL';" | xargs)

if [ -z "$ADMIN_ID" ] || [ -z "$DIRECTOR_ID" ] || [ -z "$MANAGER_ID" ]; then
    error_exit "Failed to retrieve user IDs. Auth users may not have been created."
fi

success_msg "Retrieved user IDs:"
echo "   Admin:    $ADMIN_ID"
echo "   Director: $DIRECTOR_ID"
echo "   Manager:  $MANAGER_ID"

# Update sales records to set admin flag for admin user
$PSQL_CMD << EOF
-- Update admin user to have is_admin flag
UPDATE public.sales
SET is_admin = true
WHERE user_id = '$ADMIN_ID'::uuid;

-- Update other users to ensure is_admin is false
UPDATE public.sales
SET is_admin = false
WHERE user_id IN ('$DIRECTOR_ID'::uuid, '$MANAGER_ID'::uuid);
EOF

success_msg "Sales records updated with permissions"
echo ""

# =====================================================================
# Step 3: Generate Role-Specific Test Data
# =====================================================================

echo "3️⃣  Generating test data..."

# Admin user - extensive test data
info_msg "Generating admin data (100 contacts, 50 orgs, 75 opportunities)..."
SEED_ORGANIZATION_COUNT=50 \
SEED_CONTACT_COUNT=100 \
SEED_OPPORTUNITY_COUNT=75 \
SEED_ACTIVITY_COUNT=200 \
SEED_NOTE_COUNT=150 \
SEED_TASK_COUNT=100 \
SEED_PRODUCT_COUNT=100 \
TEST_USER_ID=$ADMIN_ID \
node scripts/seed-data.js || error_exit "Failed to generate admin test data"

# Sales Director - moderate test data
info_msg "Generating director data (60 contacts, 30 orgs, 40 opportunities)..."
SEED_ORGANIZATION_COUNT=30 \
SEED_CONTACT_COUNT=60 \
SEED_OPPORTUNITY_COUNT=40 \
SEED_ACTIVITY_COUNT=120 \
SEED_NOTE_COUNT=90 \
SEED_TASK_COUNT=60 \
TEST_USER_ID=$DIRECTOR_ID \
node scripts/seed-data.js || error_exit "Failed to generate director test data"

# Account Manager - minimal test data
info_msg "Generating manager data (40 contacts, 20 orgs, 25 opportunities)..."
SEED_ORGANIZATION_COUNT=20 \
SEED_CONTACT_COUNT=40 \
SEED_OPPORTUNITY_COUNT=25 \
SEED_ACTIVITY_COUNT=80 \
SEED_NOTE_COUNT=60 \
SEED_TASK_COUNT=40 \
TEST_USER_ID=$MANAGER_ID \
node scripts/seed-data.js || error_exit "Failed to generate manager test data"

echo ""

# =====================================================================
# Step 4: Record Test User Metadata
# =====================================================================

echo "4️⃣  Recording test user metadata..."

$PSQL_CMD << EOF
-- Record metadata for each test user
INSERT INTO public.test_user_metadata (user_id, role, created_by, test_data_counts)
VALUES
  ('$ADMIN_ID'::uuid, 'admin', 'create-test-users.sh', '{"contacts":100,"organizations":50,"opportunities":75,"activities":200,"tasks":100,"notes":150}'::jsonb),
  ('$DIRECTOR_ID'::uuid, 'sales_director', 'create-test-users.sh', '{"contacts":60,"organizations":30,"opportunities":40,"activities":120,"tasks":60,"notes":90}'::jsonb),
  ('$MANAGER_ID'::uuid, 'account_manager', 'create-test-users.sh', '{"contacts":40,"organizations":20,"opportunities":25,"activities":80,"tasks":40,"notes":60}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET
  last_sync_at = NOW(),
  test_data_counts = EXCLUDED.test_data_counts;
EOF

success_msg "Test user metadata recorded"
echo ""

# =====================================================================
# Summary
# =====================================================================

echo -e "${GREEN}✅ Test users created successfully!${NC}"
echo ""
echo "📧 Login Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Admin:           $ADMIN_EMAIL"
echo "   Sales Director:  $DIRECTOR_EMAIL"
echo "   Account Manager: $MANAGER_EMAIL"
echo "   Password:        $TEST_PASSWORD"
echo ""
echo "📊 Test Data Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Admin:    100 contacts, 50 orgs, 75 opportunities, 200 activities"
echo "   Director:  60 contacts, 30 orgs, 40 opportunities, 120 activities"
echo "   Manager:   40 contacts, 20 orgs, 25 opportunities,  80 activities"
echo ""
echo "🌐 Access the app at: http://localhost:5173"
echo ""
