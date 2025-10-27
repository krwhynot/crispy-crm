#!/bin/bash
# Import all organizations and contacts from CSV files
set -e

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "🗑️  Clearing existing organizations (keeping test user)..."
psql "$DB_URL" -c "TRUNCATE organizations CASCADE;"

echo "📊 Importing organizations from CSV..."
psql "$DB_URL" <<'EOSQL'
CREATE TEMP TABLE IF NOT EXISTS temp_orgs (
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
EOSQL

# Use csvclean or dos2unix if needed, but try direct import
psql "$DB_URL" <<EOSQL2
\COPY temp_orgs (name, organization_type, priority, segment_name, phone, linkedin_url, address, city, state, postal_code, notes) FROM '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_standardized.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');

-- Insert segments
INSERT INTO segments (name)
SELECT DISTINCT segment_name
FROM temp_orgs
WHERE segment_name IS NOT NULL AND segment_name != ''
ON CONFLICT (name) DO NOTHING;

-- Insert organizations
INSERT INTO organizations (name, organization_type, priority, segment_id, phone, linkedin_url, address, city, state, postal_code, notes)
SELECT
  t.name,
  CASE
    WHEN t.organization_type IN ('customer', 'principal', 'distributor', 'prospect', 'partner')
    THEN t.organization_type::organization_type
    ELSE 'unknown'::organization_type
  END,
  t.priority,
  s.id,
  NULLIF(TRIM(t.phone), ''),
  NULLIF(TRIM(t.linkedin_url), ''),
  NULLIF(TRIM(t.address), ''),
  NULLIF(TRIM(t.city), ''),
  NULLIF(TRIM(t.state), ''),
  NULLIF(TRIM(t.postal_code), ''),
  NULLIF(TRIM(t.notes), '')
FROM temp_orgs t
LEFT JOIN segments s ON s.name = t.segment_name
WHERE t.name IS NOT NULL
  AND TRIM(t.name) != '';

SELECT 'Organizations imported: ' || COUNT(*)::text FROM organizations;
SELECT organization_type, COUNT(*) as count
FROM organizations
GROUP BY organization_type
ORDER BY organization_type;
EOSQL2

echo "✅ Organizations imported!"
