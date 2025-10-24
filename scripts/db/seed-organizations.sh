#!/bin/bash
# ============================================================================
# Seed Organizations Data into Local Database
# ============================================================================
#
# This script imports the cleaned organizations CSV into the local Supabase
# database after running npm run db:local:reset
#
# Prerequisites:
#   1. Local Supabase running (npx supabase start)
#   2. Database schema migrated (npm run db:local:reset)
#   3. organizations_final.csv exists
#
# Usage:
#   ./scripts/db/seed-organizations.sh
#   or: npm run db:local:seed-orgs
#
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "======================================================================"
echo "Organizations Seed Script"
echo "======================================================================"
echo ""

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CSV_FILE="$PROJECT_ROOT/data/csv-files/organizations_final.csv"

# Check if CSV exists
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: CSV file not found:${NC}"
    echo "  $CSV_FILE"
    echo ""
    echo "Please run the cleaning scripts first:"
    echo "  python3 scripts/data/transform_organizations_csv.py"
    echo "  python3 scripts/data/deduplicate_organizations.py"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found CSV file: organizations_final.csv"

# Get database URL from Supabase CLI
DB_URL=$(npx supabase status --output json 2>/dev/null | grep -o '"DB URL": "[^"]*' | cut -d'"' -f4)

if [ -z "$DB_URL" ]; then
    echo -e "${RED}Error: Could not get database URL${NC}"
    echo ""
    echo "Make sure Supabase is running:"
    echo "  npx supabase start"
    exit 1
fi

echo -e "${GREEN}✓${NC} Connected to local database"
echo ""

# Check if organizations already exist
ORG_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | tr -d ' ')

if [ "$ORG_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Warning: Organizations table already contains $ORG_COUNT records${NC}"
    echo ""
    read -p "Do you want to clear and re-import? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    echo "Clearing existing organizations..."
    psql "$DB_URL" -c "DELETE FROM organizations;" >/dev/null
fi

echo "Importing organizations from CSV..."

# Import using \copy (client-side copy)
psql "$DB_URL" -c "\copy organizations (name, organization_type, parent_organization_id, priority, segment_id, website, phone, email, address, city, state, postal_code, notes, logo_url, linkedin_url, annual_revenue, employee_count, founded_year, tax_identifier, context_links, sales_id, created_by, updated_by, deleted_at, import_session_id) FROM '$CSV_FILE' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '')"

# Update computed flags
echo "Updating computed flags..."
psql "$DB_URL" -c "UPDATE organizations SET is_distributor = true WHERE organization_type = 'distributor';" >/dev/null
psql "$DB_URL" -c "UPDATE organizations SET is_principal = true WHERE organization_type = 'principal';" >/dev/null

echo ""
echo "======================================================================"
echo "Import Verification"
echo "======================================================================"

# Get statistics
psql "$DB_URL" -c "
SELECT
    '✅ Total organizations' as metric,
    COUNT(*)::TEXT as value
FROM organizations
UNION ALL
SELECT
    '   • Customers',
    COUNT(*)::TEXT
FROM organizations WHERE organization_type = 'customer'
UNION ALL
SELECT
    '   • Distributors',
    COUNT(*)::TEXT || ' (is_distributor=' || COUNT(*) FILTER (WHERE is_distributor = true)::TEXT || ')'
FROM organizations WHERE organization_type = 'distributor'
UNION ALL
SELECT
    '   • Prospects',
    COUNT(*)::TEXT
FROM organizations WHERE organization_type = 'prospect'
UNION ALL
SELECT
    '   • Principals',
    COUNT(*)::TEXT || ' (is_principal=' || COUNT(*) FILTER (WHERE is_principal = true)::TEXT || ')'
FROM organizations WHERE organization_type = 'principal'
UNION ALL
SELECT
    '   • Unknown',
    COUNT(*)::TEXT
FROM organizations WHERE organization_type = 'unknown'
UNION ALL
SELECT
    '   • With phone',
    COUNT(*)::TEXT || ' (' || ROUND(COUNT(*)::DECIMAL / NULLIF((SELECT COUNT(*) FROM organizations), 0) * 100, 1)::TEXT || '%)'
FROM organizations WHERE phone IS NOT NULL AND phone != ''
UNION ALL
SELECT
    '   • With email',
    COUNT(*)::TEXT || ' (' || ROUND(COUNT(*)::DECIMAL / NULLIF((SELECT COUNT(*) FROM organizations), 0) * 100, 1)::TEXT || '%)'
FROM organizations WHERE email IS NOT NULL AND email != ''
UNION ALL
SELECT
    '   • With notes',
    COUNT(*)::TEXT || ' (' || ROUND(COUNT(*)::DECIMAL / NULLIF((SELECT COUNT(*) FROM organizations), 0) * 100, 1)::TEXT || '%)'
FROM organizations WHERE notes IS NOT NULL AND notes != '';
"

echo ""
echo "======================================================================"
echo -e "${GREEN}✅ Organizations imported successfully!${NC}"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "  1. Start the app: npm run dev"
echo "  2. Navigate to: http://localhost:5173/organizations"
echo "  3. Verify data displays correctly"
echo ""
