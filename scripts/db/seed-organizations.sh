#!/bin/bash
# Seed organizations into local database
# Usage: npm run db:local:seed-orgs

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CSV_FILE="$PROJECT_ROOT/data/csv-files/organizations_standardized.csv"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo ""
echo "Seeding organizations from CSV..."

# Import using psql \copy
psql "$DB_URL" <<EOF
\copy organizations (name, organization_type, parent_organization_id, priority, segment_id, website, phone, email, address, city, state, postal_code, notes, logo_url, linkedin_url, annual_revenue, employee_count, founded_year, tax_identifier, context_links, sales_id, created_by, updated_by, deleted_at, import_session_id) FROM '$CSV_FILE' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');

SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE organization_type = 'customer') as customers,
    COUNT(*) FILTER (WHERE organization_type = 'distributor') as distributors,
    COUNT(*) FILTER (WHERE organization_type = 'prospect') as prospects,
    COUNT(*) FILTER (WHERE organization_type = 'unknown') as unknown
FROM organizations;
EOF

echo "✅ Organizations seeded successfully!"
echo ""
