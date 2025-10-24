#!/bin/bash
# Seed migration data into local Supabase database
# Run this after `npm run db:local:reset` or `npx supabase db reset`

set -e  # Exit on error

echo "🌱 Seeding migration data into local database..."

# Database connection string
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# CSV file paths
SEGMENTS_CSV="/home/krwhynot/projects/crispy-crm/data/migration-output/segments_import.csv"
ORGS_CSV="/home/krwhynot/projects/crispy-crm/data/migration-output/organizations_final.csv"
CONTACTS_CSV="/home/krwhynot/projects/crispy-crm/data/migration-output/contacts_final.csv"

# Check if CSV files exist
if [ ! -f "$SEGMENTS_CSV" ]; then
  echo "❌ Error: Segments CSV not found at $SEGMENTS_CSV"
  exit 1
fi

if [ ! -f "$ORGS_CSV" ]; then
  echo "❌ Error: Organizations CSV not found at $ORGS_CSV"
  exit 1
fi

if [ ! -f "$CONTACTS_CSV" ]; then
  echo "❌ Error: Contacts CSV not found at $CONTACTS_CSV"
  exit 1
fi

echo "📊 Step 1/4: Creating staging tables and importing CSV data..."
psql "$DB_URL" <<SQL
-- Drop staging tables if they exist
DROP TABLE IF EXISTS segments_staging CASCADE;
DROP TABLE IF EXISTS organizations_staging CASCADE;
DROP TABLE IF EXISTS contacts_staging CASCADE;

-- Create staging tables
CREATE TABLE segments_staging (
  name TEXT,
  created_by TEXT
);

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
  notes TEXT,
  primary_account_manager TEXT,
  secondary_account_manager TEXT
);

CREATE TABLE contacts_staging (
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  organization_name TEXT,
  account_manager TEXT,
  linkedin_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT
);

-- Import CSV files using COPY
\COPY segments_staging FROM '$SEGMENTS_CSV' CSV HEADER
\COPY organizations_staging FROM '$ORGS_CSV' CSV HEADER
\COPY contacts_staging FROM '$CONTACTS_CSV' CSV HEADER
SQL

echo "🔄 Step 2/3: Migrating data to production tables..."
psql "$DB_URL" <<SQL
-- Migrate segments
INSERT INTO segments (name, created_by)
SELECT
  s.name,
  CASE
    WHEN s.created_by = 'system_default' THEN NULL
    WHEN s.created_by = 'csv_import' THEN 'd3129876-b1fe-40eb-9980-64f5f73c64d6'::uuid
    ELSE 'd3129876-b1fe-40eb-9980-64f5f73c64d6'::uuid
  END as created_by
FROM segments_staging s
ON CONFLICT (name) DO NOTHING;

-- Migrate organizations
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
  o.phone,
  o.linkedin_url,
  o.address,
  o.city,
  o.state,
  o.postal_code,
  o.notes,
  NOW(),
  NOW()
FROM organizations_staging o
LEFT JOIN segments s ON s.name = o.segment_name
WHERE o.name IS NOT NULL AND o.name != '';

-- Migrate contacts
INSERT INTO contacts (
  name,
  first_name,
  last_name,
  title,
  email,
  phone,
  organization_id,
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
  -- name field (required): Use full name from CSV, or construct from first/last
  COALESCE(
    NULLIF(TRIM(c.name), ''),
    TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, ''))
  ) as name,
  NULLIF(TRIM(c.first_name), '') as first_name,
  NULLIF(TRIM(c.last_name), '') as last_name,
  NULLIF(TRIM(c.title), '') as title,
  -- Convert email to JSONB format if present
  CASE
    WHEN c.email IS NOT NULL AND TRIM(c.email) != '' THEN
      jsonb_build_array(
        jsonb_build_object('type', 'main', 'value', TRIM(c.email), 'primary', true)
      )
    ELSE '[]'::jsonb
  END as email,
  -- Convert phone to JSONB format if present
  CASE
    WHEN c.phone IS NOT NULL AND TRIM(c.phone) != '' THEN
      jsonb_build_array(
        jsonb_build_object('type', 'main', 'value', TRIM(c.phone), 'primary', true)
      )
    ELSE '[]'::jsonb
  END as phone,
  o.id as organization_id,
  NULLIF(TRIM(c.linkedin_url), '') as linkedin_url,
  NULLIF(TRIM(c.address), '') as address,
  NULLIF(TRIM(c.city), '') as city,
  NULLIF(TRIM(c.state), '') as state,
  NULLIF(TRIM(c.postal_code), '') as postal_code,
  NULLIF(TRIM(c.notes), '') as notes,
  NOW(),
  NOW()
FROM contacts_staging c
LEFT JOIN organizations o ON o.name = c.organization_name
WHERE (c.first_name IS NOT NULL OR c.last_name IS NOT NULL)
  AND TRIM(COALESCE(c.first_name, '') || COALESCE(c.last_name, '')) != '';
SQL

echo "✅ Step 3/3: Verifying import and cleaning up..."
psql "$DB_URL" <<SQL
SELECT
  'Segments imported:' as metric,
  COUNT(*)::text as count
FROM segments
UNION ALL
SELECT
  'Organizations imported:',
  COUNT(*)::text
FROM organizations
WHERE organization_type != 'principal'
UNION ALL
SELECT
  'Contacts imported:',
  COUNT(*)::text
FROM contacts
UNION ALL
SELECT
  'Principal organizations:',
  COUNT(*)::text
FROM organizations
WHERE organization_type = 'principal'
UNION ALL
SELECT
  'Products imported:',
  COUNT(*)::text
FROM products;

-- Clean up staging tables
DROP TABLE IF EXISTS segments_staging CASCADE;
DROP TABLE IF EXISTS organizations_staging CASCADE;
DROP TABLE IF EXISTS contacts_staging CASCADE;
SQL

echo ""
echo "✨ Migration data seeded successfully!"
echo ""
echo "📌 Next steps:"
echo "   1. Start the dev server: npm run dev"
echo "   2. Login with: admin@test.com / password123"
echo "   3. Verify organizations and contacts in the UI"
