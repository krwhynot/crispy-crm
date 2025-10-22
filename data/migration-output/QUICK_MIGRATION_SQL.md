# Quick Migration SQL Reference

Copy-paste SQL commands for importing cleaned data to Atomic CRM database.

---

## Prerequisites

1. Supabase local instance running: `npm run db:local:start`
2. CSV files ready in `data/migration-output/`
3. Database schema deployed with latest migrations

---

## Step 1: Create Staging Tables

```sql
-- Segments staging
CREATE TABLE IF NOT EXISTS segments_staging (
  name TEXT
);

-- Organizations staging
CREATE TABLE IF NOT EXISTS organizations_staging (
  name TEXT,
  segment_name TEXT,
  organization_type TEXT,
  priority TEXT,
  website TEXT,
  linkedin_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  account_manager_primary TEXT,
  account_manager_secondary TEXT
);

-- Contacts staging
CREATE TABLE IF NOT EXISTS contacts_staging (
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
```

---

## Step 2: Import CSV Files

**Using psql (local terminal):**

```bash
# Navigate to project directory
cd /home/krwhynot/projects/crispy-crm

# Import segments
psql $DATABASE_URL -c "\COPY segments_staging FROM 'data/migration-output/segments_import.csv' CSV HEADER"

# Import organizations
psql $DATABASE_URL -c "\COPY organizations_staging FROM 'data/migration-output/organizations_final.csv' CSV HEADER"

# Import contacts
psql $DATABASE_URL -c "\COPY contacts_staging FROM 'data/migration-output/contacts_final.csv' CSV HEADER"
```

**Using Supabase SQL Editor:**

```sql
-- Upload CSV files via Supabase Dashboard, then:
-- (This is a manual upload process via UI)
```

---

## Step 3: Import Segments

```sql
-- Import segments (30 records)
INSERT INTO segments (name)
SELECT DISTINCT name
FROM segments_staging
WHERE name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT COUNT(*) as segment_count FROM segments;
-- Expected: 30
```

---

## Step 4: Import Organizations

```sql
-- Import organizations with segment lookup (2,025 records)
INSERT INTO organizations (
  name,
  segment_id,
  organization_type,
  priority,
  website,
  linkedin_url,
  address,
  city,
  state,
  postal_code,
  notes,
  user_id,
  created_at,
  updated_at
)
SELECT
  o.name,
  s.id AS segment_id,
  COALESCE(o.organization_type, 'customer') AS organization_type,
  o.priority,
  o.website,
  o.linkedin_url,
  o.address,
  o.city,
  o.state,
  o.postal_code,
  o.notes,  -- IMPORTANT: Contains preserved contact data
  auth.uid() AS user_id,  -- Replace with actual user_id
  NOW(),
  NOW()
FROM organizations_staging o
LEFT JOIN segments s ON o.segment_name = s.name
ON CONFLICT (name, user_id) DO UPDATE SET
  segment_id = EXCLUDED.segment_id,
  organization_type = EXCLUDED.organization_type,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Verify
SELECT COUNT(*) as org_count FROM organizations;
-- Expected: 2,025
```

---

## Step 5: Import Contacts

```sql
-- Import contacts with organization lookup (1,572 records)
INSERT INTO contacts (
  first_name,
  last_name,
  name,
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
  user_id,
  created_at,
  updated_at
)
SELECT
  c.first_name,
  c.last_name,
  c.name,
  c.title,
  -- Convert email string to JSONB
  CASE
    WHEN c.email IS NOT NULL AND c.email != ''
    THEN c.email::jsonb
    ELSE NULL
  END AS email,
  -- Convert phone string to JSONB
  CASE
    WHEN c.phone IS NOT NULL AND c.phone != ''
    THEN c.phone::jsonb
    ELSE NULL
  END AS phone,
  org.id AS organization_id,
  c.linkedin_url,
  c.address,
  c.city,
  c.state,
  c.postal_code,
  c.notes,
  auth.uid() AS user_id,  -- Replace with actual user_id
  NOW(),
  NOW()
FROM contacts_staging c
LEFT JOIN organizations org
  ON c.organization_name = org.name
  AND org.user_id = auth.uid()  -- Replace with actual user_id
WHERE c.name IS NOT NULL AND c.name != '';

-- Verify
SELECT COUNT(*) as contact_count FROM contacts;
-- Expected: 1,572
```

---

## Step 6: Verification Queries

### Count Checks

```sql
-- Total records
SELECT
  (SELECT COUNT(*) FROM segments) as segments,
  (SELECT COUNT(*) FROM organizations) as organizations,
  (SELECT COUNT(*) FROM contacts) as contacts;

-- Expected: segments=30, organizations=2,025, contacts=1,572
```

### Organization Notes Check

```sql
-- Organizations with contact notes
SELECT
  name,
  LEFT(notes, 100) as note_preview
FROM organizations
WHERE notes LIKE '%Contact:%'
ORDER BY name
LIMIT 10;

-- Expected: 93 organizations with notes
```

### Contact Name Corrections Check

```sql
-- Sample corrected contacts
SELECT
  name,
  first_name,
  last_name,
  title
FROM contacts
WHERE title IN ('Chef', 'Manager', 'Owner')
ORDER BY name
LIMIT 10;

-- Should show clean first/last/title separation
```

### Email/Phone JSONB Check

```sql
-- Contacts with email
SELECT
  name,
  email->0->>'value' as email_value
FROM contacts
WHERE email IS NOT NULL
LIMIT 10;

-- Contacts with phone
SELECT
  name,
  phone->0->>'value' as phone_value
FROM contacts
WHERE phone IS NOT NULL
LIMIT 10;
```

### Organization-Contact Relationships

```sql
-- Contacts per organization
SELECT
  o.name,
  COUNT(c.id) as contact_count
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
GROUP BY o.name
ORDER BY contact_count DESC
LIMIT 20;
```

---

## Step 7: Cleanup Staging Tables

```sql
-- After verification, remove staging tables
DROP TABLE IF EXISTS contacts_staging;
DROP TABLE IF EXISTS organizations_staging;
DROP TABLE IF EXISTS segments_staging;
```

---

## Rollback Procedure (If Needed)

```sql
-- Delete imported data (preserve staging tables)
DELETE FROM contacts WHERE created_at > '[migration_timestamp]';
DELETE FROM organizations WHERE created_at > '[migration_timestamp]';
DELETE FROM segments WHERE name IN (SELECT name FROM segments_staging);

-- Re-import using corrected SQL
```

---

## Common Issues & Solutions

### Issue: JSONB Cast Error

**Error:**
```
ERROR: invalid input syntax for type json
```

**Solution:**
```sql
-- Check for malformed JSON in staging
SELECT email FROM contacts_staging WHERE email IS NOT NULL LIMIT 10;

-- Fix: Ensure CSV has proper JSON escaping
```

### Issue: Missing Organization Lookup

**Error:**
```
organization_id is NULL for many contacts
```

**Solution:**
```sql
-- Check organization name matches
SELECT DISTINCT c.organization_name
FROM contacts_staging c
LEFT JOIN organizations o ON c.organization_name = o.name
WHERE o.id IS NULL;

-- Fix: Update organization names in staging to match
```

### Issue: User ID Reference

**Error:**
```
auth.uid() returns NULL
```

**Solution:**
```sql
-- Replace auth.uid() with actual user UUID
-- Get user ID first:
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Use that ID in INSERT statements instead of auth.uid()
```

---

## Performance Tips

1. **Disable triggers during import** (if safe):
   ```sql
   ALTER TABLE contacts DISABLE TRIGGER ALL;
   -- Run imports
   ALTER TABLE contacts ENABLE TRIGGER ALL;
   ```

2. **Create indexes after import** (not before):
   ```sql
   -- Import data first, then:
   CREATE INDEX idx_contacts_org ON contacts(organization_id);
   CREATE INDEX idx_orgs_segment ON organizations(segment_id);
   ```

3. **Batch imports for large datasets**:
   ```sql
   -- Import in chunks of 500
   INSERT INTO contacts (...)
   SELECT ... FROM contacts_staging
   LIMIT 500 OFFSET 0;
   ```

---

## Post-Migration Validation Checklist

- [ ] Segment count = 30
- [ ] Organization count = 2,025
- [ ] Contact count = 1,572
- [ ] 93 organizations have notes with "Contact:" prefix
- [ ] Email JSONB queries work: `email->0->>'value'`
- [ ] Phone JSONB queries work: `phone->0->>'value'`
- [ ] All contacts have valid organization_id (no NULLs unless orphaned)
- [ ] Search in UI works for organization notes
- [ ] Sample 10 corrected contacts manually verified
- [ ] No duplicate contacts (check by name + organization)

---

*Quick Reference Guide - Ready for Copy-Paste Migration*
*See FINAL_MIGRATION_SUMMARY.md for complete documentation*
