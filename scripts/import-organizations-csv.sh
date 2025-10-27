#!/bin/bash
# Import organizations from CSV after seed.sql has run
# This script should be run manually after npm run db:local:reset

set -e

echo "📊 Importing organizations from CSV..."

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
CSV_FILE="/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_standardized.csv"

# Check if CSV exists
if [ ! -f "$CSV_FILE" ]; then
  echo "❌ Error: CSV file not found at $CSV_FILE"
  exit 1
fi

# Import using psql
psql "$DB_URL" <<SQL
-- Create temporary table for CSV import
CREATE TEMP TABLE temp_orgs (
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

-- Import CSV
\COPY temp_orgs FROM '$CSV_FILE' CSV HEADER

-- Insert unique segments
INSERT INTO segments (name)
SELECT DISTINCT segment_name
FROM temp_orgs
WHERE segment_name IS NOT NULL AND segment_name != ''
ON CONFLICT (name) DO NOTHING;

-- Insert organizations (skip if name already exists from seed.sql)
INSERT INTO organizations (name, organization_type, priority, segment_id, phone, linkedin_url, address, city, state, postal_code, notes)
SELECT
  t.name,
  COALESCE(t.organization_type::organization_type, 'unknown'::organization_type),
  t.priority,
  s.id,
  NULLIF(t.phone, ''),
  NULLIF(t.linkedin_url, ''),
  NULLIF(t.address, ''),
  NULLIF(t.city, ''),
  NULLIF(t.state, ''),
  NULLIF(t.postal_code, ''),
  NULLIF(t.notes, '')
FROM temp_orgs t
LEFT JOIN segments s ON s.name = t.segment_name
WHERE t.name IS NOT NULL AND t.name != ''
  AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.name = t.name);

-- Show results
SELECT COUNT(*) as total_orgs, organization_type
FROM organizations
GROUP BY organization_type
ORDER BY organization_type;
SQL

echo "✅ Organizations imported successfully!"
