#!/bin/bash
# Seed organizations from organizations_standardized.csv into local Supabase database
# Run this after `npm run db:local:reset` or `npx supabase db reset`

set -e  # Exit on error

echo "🌱 Seeding organizations from standardized CSV..."

# Database connection string
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# CSV file path
ORGS_CSV="/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_standardized.csv"

# Check if CSV file exists
if [ ! -f "$ORGS_CSV" ]; then
  echo "❌ Error: Organizations CSV not found at $ORGS_CSV"
  exit 1
fi

# Count rows
TOTAL_ROWS=$(wc -l < "$ORGS_CSV")
DATA_ROWS=$((TOTAL_ROWS - 1))  # Subtract header row

echo "📊 Found $DATA_ROWS organizations to import"

echo "📊 Step 1/3: Creating staging table and importing CSV data..."
psql "$DB_URL" <<SQL
-- Drop staging table if it exists
DROP TABLE IF EXISTS organizations_staging CASCADE;

-- Create staging table matching CSV structure
CREATE TABLE organizations_staging (
  name TEXT,
  organization_type TEXT,
  priority TEXT,
  segment_name TEXT,
  phone TEXT,
  linkedin_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT
);

-- Import CSV file using COPY
\COPY organizations_staging FROM '$ORGS_CSV' CSV HEADER
SQL

echo "✅ Staging table created and CSV imported"

echo "🔄 Step 2/3: Creating segments and migrating organizations..."
psql "$DB_URL" <<SQL
-- First, create all unique segments from the data
INSERT INTO segments (name, created_by)
SELECT DISTINCT
  segment_name,
  'd3129876-b1fe-40eb-9980-64f5f73c64d6'::uuid  -- admin@test.com user ID
FROM organizations_staging
WHERE segment_name IS NOT NULL
  AND segment_name != ''
ON CONFLICT (name) DO NOTHING;

-- Now insert organizations
INSERT INTO organizations (
  name,
  organization_type,
  priority,
  segment_id,
  phone,
  linkedin_url,
  address,
  city,
  state,
  postal_code,
  notes,
  created_at,
  updated_at
)
SELECT
  o.name,
  COALESCE(o.organization_type::organization_type, 'unknown'::organization_type),
  o.priority,
  s.id as segment_id,
  NULLIF(o.phone, ''),
  NULLIF(o.linkedin_url, ''),
  NULLIF(o.address, ''),
  NULLIF(o.city, ''),
  NULLIF(o.state, ''),
  NULLIF(o.postal_code, ''),
  NULLIF(o.notes, ''),
  NOW(),
  NOW()
FROM organizations_staging o
LEFT JOIN segments s ON s.name = o.segment_name
WHERE o.name IS NOT NULL AND o.name != ''
ON CONFLICT (name) DO NOTHING;
SQL

echo "✅ Organizations migrated to production table"

echo "📊 Step 3/3: Verifying import and cleaning up..."
psql "$DB_URL" <<SQL
SELECT
  'Segments imported:' as metric,
  COUNT(*)::text as count
FROM segments
WHERE name != 'Default Segment'  -- Exclude default segment
UNION ALL
SELECT
  'Organizations imported:',
  COUNT(*)::text
FROM organizations
UNION ALL
SELECT
  'Organizations by type:',
  organization_type::text || ': ' || COUNT(*)::text
FROM organizations
GROUP BY organization_type
ORDER BY organization_type;

-- Clean up staging table
DROP TABLE IF EXISTS organizations_staging CASCADE;
SQL

echo ""
echo "✨ Organizations seeded successfully!"
echo ""
echo "📌 Next steps:"
echo "   1. Start the dev server: npm run dev"
echo "   2. Login with: admin@test.com / password123"
echo "   3. Verify organizations in the UI"
