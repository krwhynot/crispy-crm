#!/bin/bash
# Seed contacts from contacts_db_ready.csv into local Supabase database
# Run this after seeding organizations: ./scripts/seed-organizations-from-standardized.sh
#
# Engineering Constitution Compliance:
# - Single source of truth: CSV → Database
# - Fail fast: Exit on error
# - No over-engineering: Direct COPY, no complex transforms

set -e  # Exit on error

echo "🌱 Seeding contacts from database-ready CSV..."

# Database connection string
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# CSV file path
CONTACTS_CSV="$(dirname "$0")/../data/csv-files/cleaned/contacts_db_ready.csv"

# Check if CSV file exists
if [ ! -f "$CONTACTS_CSV" ]; then
  echo "❌ Error: Contacts CSV not found at $CONTACTS_CSV"
  exit 1
fi

# Count rows
TOTAL_ROWS=$(wc -l < "$CONTACTS_CSV")
DATA_ROWS=$((TOTAL_ROWS - 1))  # Subtract header row

echo "📊 Found $DATA_ROWS contacts to import"

echo "📊 Step 1/3: Creating staging table and importing CSV data..."
psql "$DB_URL" <<SQL
-- Drop staging table if it exists
DROP TABLE IF EXISTS contacts_staging CASCADE;

-- Create staging table matching CSV structure
CREATE TABLE contacts_staging (
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,  -- Will be JSONB in production table
  phone TEXT,  -- Will be JSONB in production table
  title TEXT,
  department TEXT,
  organization_id TEXT,  -- Will be BIGINT in production table
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  linkedin_url TEXT,
  notes TEXT
);

-- Import CSV file using COPY
\COPY contacts_staging FROM '$CONTACTS_CSV' CSV HEADER
SQL

echo "✅ Staging table created and CSV imported"

echo "🔄 Step 2/3: Migrating contacts to production table..."
psql "$DB_URL" <<SQL
-- Insert contacts from staging to production table
INSERT INTO contacts (
  name,
  first_name,
  last_name,
  email,  -- JSONB array
  phone,  -- JSONB array
  title,
  department,
  organization_id,
  address,
  city,
  state,
  postal_code,
  country,
  linkedin_url,
  notes,
  created_at,
  updated_at
)
SELECT
  c.name,
  NULLIF(c.first_name, ''),
  NULLIF(c.last_name, ''),
  COALESCE(c.email::jsonb, '[]'::jsonb),  -- Convert text to JSONB
  COALESCE(c.phone::jsonb, '[]'::jsonb),  -- Convert text to JSONB
  NULLIF(c.title, ''),
  NULLIF(c.department, ''),
  CASE
    WHEN c.organization_id ~ '^[0-9]+\.?0?$'
    THEN NULLIF(FLOOR(c.organization_id::numeric)::bigint, 0)
    ELSE NULL
  END as organization_id,  -- Convert text to BIGINT, handle decimals
  NULLIF(c.address, ''),
  NULLIF(c.city, ''),
  NULLIF(c.state, ''),
  NULLIF(c.postal_code, ''),
  COALESCE(NULLIF(c.country, ''), 'USA'),
  NULLIF(c.linkedin_url, ''),
  NULLIF(c.notes, ''),
  NOW(),
  NOW()
FROM contacts_staging c
WHERE c.name IS NOT NULL AND c.name != '';
SQL

echo "✅ Contacts migrated to production table"

echo "📊 Step 3/3: Verifying import and cleaning up..."
psql "$DB_URL" <<SQL
SELECT
  'Contacts imported:' as metric,
  COUNT(*)::text as count
FROM contacts
UNION ALL
SELECT
  'Contacts with email:',
  COUNT(*)::text
FROM contacts
WHERE jsonb_array_length(email) > 0
UNION ALL
SELECT
  'Contacts with phone:',
  COUNT(*)::text
FROM contacts
WHERE jsonb_array_length(phone) > 0
UNION ALL
SELECT
  'Contacts with organization:',
  COUNT(*)::text
FROM contacts
WHERE organization_id IS NOT NULL;

-- Clean up staging table
DROP TABLE IF EXISTS contacts_staging CASCADE;
SQL

echo ""
echo "✨ Contacts seeded successfully!"
echo ""
echo "📌 Next steps:"
echo "   1. Start the dev server: npm run dev"
echo "   2. Login with: admin@test.com / password123"
echo "   3. Verify contacts in the UI"
echo ""
