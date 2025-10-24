#!/bin/bash
# Simple seed script for organizations

set -e

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
CSV="/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_standardized.csv"

echo "🌱 Seeding organizations..."

psql "$DB_URL" <<SQL
-- Create segments
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

\COPY temp_orgs FROM '$CSV' CSV HEADER

-- Insert unique segments
INSERT INTO segments (name)
SELECT DISTINCT segment_name
FROM temp_orgs
WHERE segment_name != ''
ON CONFLICT (name) DO NOTHING;

-- Insert organizations
INSERT INTO organizations (name, organization_type, priority, segment_id, phone, linkedin_url, address, city, state, postal_code, notes)
SELECT
  t.name,
  t.organization_type::organization_type,
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
WHERE t.name != '';

SELECT COUNT(*) || ' organizations imported' FROM organizations;
SQL

echo "✅ Done!"
