# CSV to PostgreSQL Migration Guide

## Overview

This guide documents the migration of contact and organization data from CSV files to the Atomic CRM PostgreSQL database.

**Source Files:**
- `data/new-contacts.csv` - 1,646 valid contacts
- `data/organizations.csv` - 2,025 valid organizations

**Generated Files:**
- `/tmp/segments_import.csv` - 30 segment definitions
- `/tmp/organizations_cleaned.csv` - 2,025 cleaned organizations
- `/tmp/contacts_cleaned.csv` - 1,646 cleaned contacts
- `/tmp/questionable_names.csv` - 579 contacts with ambiguous names (for future review)

---

## Migration Strategy: Staged Approach

Following industry best practices, this migration uses a **staging table** approach to safely handle data transformation and relationship matching without corrupting production tables.

### Phase 1: Import Segments
Segments must be imported first as they are referenced by organizations.

```sql
-- Create segments from CSV
COPY segments (name, created_by)
FROM '/tmp/segments_import.csv'
WITH (FORMAT csv, HEADER true);
```

### Phase 2: Import Organizations (Staging)

```sql
-- Create staging table
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
    secondary_account_manager TEXT,
    -- Foreign keys (to be populated)
    segment_id UUID,
    sales_id BIGINT
);

-- Import CSV data
COPY organizations_staging (name, organization_type, priority, segment_name,
                            phone, linkedin_url, address, city, state,
                            postal_code, notes, primary_account_manager,
                            secondary_account_manager)
FROM '/tmp/organizations_cleaned.csv'
WITH (FORMAT csv, HEADER true, NULL '');
```

### Phase 3: Transform Organizations (Match Segments)

```sql
-- Match segment names to segment_id
UPDATE organizations_staging os
SET segment_id = s.id
FROM segments s
WHERE lower(trim(os.segment_name)) = lower(trim(s.name))
  AND os.segment_name IS NOT NULL
  AND os.segment_name != '';

-- TODO: Match primary_account_manager to sales.id
-- This requires either:
-- 1. Creating sales records for account managers first, OR
-- 2. Leaving sales_id as NULL until sales reps are onboarded
```

### Phase 4: Load Organizations to Production

```sql
-- Insert into production table
INSERT INTO organizations (
    name, organization_type, priority, segment_id, phone,
    linkedin_url, address, city, state, postal_code, notes
)
SELECT
    name,
    organization_type::organization_type,  -- Cast to enum
    CASE
        WHEN priority IN ('A', 'B', 'C', 'D') THEN priority
        ELSE NULL
    END,
    segment_id,
    phone,
    linkedin_url,
    address,
    city,
    state,
    postal_code,
    notes
FROM organizations_staging;

-- Store the mapping for contacts phase
CREATE TABLE org_name_to_id_mapping AS
SELECT name, id FROM organizations;
```

### Phase 5: Import Contacts (Staging)

```sql
-- Create staging table
CREATE TABLE contacts_staging (
    first_name TEXT,
    last_name TEXT,
    name TEXT,
    title TEXT,
    email TEXT,  -- Will be JSONB
    phone TEXT,  -- Will be JSONB
    organization_name TEXT,
    account_manager TEXT,
    linkedin_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    notes TEXT,
    -- Foreign keys (to be populated)
    organization_id BIGINT,
    sales_id BIGINT
);

-- Import CSV data
COPY contacts_staging (first_name, last_name, name, title, email, phone,
                       organization_name, account_manager, linkedin_url,
                       address, city, state, postal_code, notes)
FROM '/tmp/contacts_cleaned.csv'
WITH (FORMAT csv, HEADER true, NULL '');
```

### Phase 6: Transform Contacts (Match Organizations)

```sql
-- Exact match (case-insensitive)
UPDATE contacts_staging cs
SET organization_id = o.id
FROM organizations o
WHERE lower(trim(cs.organization_name)) = lower(trim(o.name))
  AND cs.organization_id IS NULL
  AND cs.organization_name IS NOT NULL
  AND cs.organization_name != '';

-- Normalized match (for remaining unmatched)
UPDATE contacts_staging cs
SET organization_id = o.id
FROM organizations o
WHERE regexp_replace(lower(trim(cs.organization_name)), '\\.|,| inc| llc| dba:.*$', '', 'g') =
      regexp_replace(lower(trim(o.name)), '\\.|,| inc| llc| dba:.*$', '', 'g')
  AND cs.organization_id IS NULL
  AND cs.organization_name IS NOT NULL
  AND cs.organization_name != '';

-- Generate exception report for unmatched organizations
COPY (
    SELECT name, organization_name, email, phone
    FROM contacts_staging
    WHERE organization_id IS NULL
      AND organization_name IS NOT NULL
      AND organization_name != ''
) TO '/tmp/unmatched_organizations.csv' WITH CSV HEADER;
```

### Phase 7: Manual Review & Corrections

**Action Required:** Review `/tmp/unmatched_organizations.csv` and decide for each:
1. Create a new organization?
2. Correct the name to match an existing organization?
3. Leave unlinked (organization_id = NULL)?

Apply corrections manually:
```sql
-- Example: Link contact to correct organization
UPDATE contacts_staging
SET organization_id = (SELECT id FROM organizations WHERE name = 'Correct Name')
WHERE name = 'John Doe' AND organization_name = 'Misspelled Name';
```

### Phase 8: Load Contacts to Production

```sql
-- Insert into production table
INSERT INTO contacts (
    first_name, last_name, name, title, email, phone,
    organization_id, linkedin_url, address, city, state,
    postal_code, notes
)
SELECT
    NULLIF(first_name, ''),
    NULLIF(last_name, ''),
    NULLIF(name, ''),
    NULLIF(title, ''),
    CASE
        WHEN email = '' THEN NULL
        ELSE email::jsonb
    END,
    CASE
        WHEN phone = '' THEN NULL
        ELSE phone::jsonb
    END,
    organization_id,
    NULLIF(linkedin_url, ''),
    NULLIF(address, ''),
    NULLIF(city, ''),
    NULLIF(state, ''),
    NULLIF(postal_code, ''),
    NULLIF(notes, '')
FROM contacts_staging;
```

### Phase 9: Cleanup

```sql
DROP TABLE organizations_staging;
DROP TABLE contacts_staging;
DROP TABLE org_name_to_id_mapping;
```

---

## Data Transformations Applied

### Organizations

1. **Priority Normalization**: A+, A, A- → 'A'; invalid values → NULL
2. **Organization Type**:
   - Segment='Distributor' → type='distributor', segment=NULL
   - Others → type='customer' (if segment present) or 'unknown'
3. **Segment Matching**: Text segment names matched to `segments.id`
4. **Ignored Columns**: DISTRIBUTOR, Distr Rep, weekly priority

### Contacts

1. **Name Parsing**:
   - "First Last" → first_name='First', last_name='Last'
   - "Chef First Last" → first_name='Chef First', last_name='Last'
   - "SingleName" → first_name='SingleName', last_name=NULL
   - Original preserved in `name` field
2. **Email/Phone JSONB Format**:
   ```json
   [{"type":"main","value":"email@example.com","primary":true}]
   ```
   Empty values → NULL (not empty array)
3. **Priority Dropped**: Contact priority removed per requirements
4. **Ignored Columns**: PRIORITY, Filtered Contacts

---

## Data Quality Summary

### Organizations
- **Total**: 2,025 organizations
- **Distributors**: 293 (organization_type='distributor')
- **With Segments**: 759 (29 unique segment types)
- **With Priority**: 1,537
- **With Primary Manager**: 1,582 (names need matching to `sales` table)
- **With Secondary Manager**: 157 (stored for future use)
- **With Phone**: 84
- **With Address**: 151

### Contacts
- **Total**: 1,646 contacts
- **With First Name**: 1,433 (87%)
- **With Last Name**: 985 (60%)
- **Single-Name Contacts**: 448 (27%) - stored in first_name only
- **With Email**: 836 (51%)
- **With Phone**: 466 (28%)
- **With Organization**: 1,638 (99%)
- **With Address**: 145 (9%)

### Known Issues for Future Resolution

1. **Ambiguous Names**: 579 contacts have questionable name parsing (see `/tmp/questionable_names.csv`)
   - Examples: "Chef Manager Tinaglia", "VP Community Engagement", "David Tsirekas Craig Richardson"
   - These can be corrected in the live system after import

2. **Account Manager Matching**: 1,582 organizations + contacts reference account managers by name
   - Requires creating `sales` records or matching to existing ones
   - Can be completed during system onboarding

3. **Secondary Managers**: 157 organizations have secondary managers
   - Currently stored in notes until schema supports multiple managers

---

## Segments Created

30 segments were identified and created:

1. Unknown (default)
2. Bar/Lounge (13)
3. Breakfast/Brunch (6)
4. Business and Industry (4)
5. Casual (120)
6. Caterer (10)
7. Chain/Group Member (130)
8. College & Universites (45)
9. Country Clubs/Golf/Health Fitness (24)
10. Education (5)
11. Education K thru 12 (1)
12. Entertainment/Casinos/Theatres (29)
13. Ethnic (12)
14. Fast food (12)
15. Fine Dining (89)
16. Food Truck (5)
17. Gastropub (135)
18. Group Purchasing Organization (8)
19. Healthcare (13)
20. Hospitality (13)
21. Industrial (1)
22. Italian (4)
23. Management company (19)
24. Meal Prep Service (5)
25. Military/Government (1)
26. Pizza (32)
27. Retail (3)
28. Travel (10)
29. Vegan/ Vegetarian (9)
30. Vending (1)

**Note**: "Distributor" (293 orgs) is NOT a segment - these have organization_type='distributor' instead.

---

## Migration Checklist

- [ ] Phase 1: Import segments from `/tmp/segments_import.csv`
- [ ] Phase 2: Create organizations staging table and import
- [ ] Phase 3: Match segments to organizations
- [ ] Phase 4: Load organizations to production
- [ ] Phase 5: Create contacts staging table and import
- [ ] Phase 6: Match organizations to contacts (automated)
- [ ] Phase 7: Review `/tmp/unmatched_organizations.csv` and apply corrections
- [ ] Phase 8: Load contacts to production
- [ ] Phase 9: Clean up staging tables
- [ ] Post-Migration: Create/match sales representatives
- [ ] Post-Migration: Review and correct ambiguous names from `/tmp/questionable_names.csv`

---

## JSONB Email/Phone Format Reference

Based on industry standards and expert recommendation:

```json
// Email example
[
  {
    "type": "main",
    "value": "contact@example.com",
    "primary": true
  }
]

// Phone example
[
  {
    "type": "main",
    "value": "+15551234567",
    "primary": true
  }
]
```

**Indexing for Performance:**
```sql
-- Create GIN index on email JSONB
CREATE INDEX idx_contacts_email ON contacts USING GIN (email);

-- Create GIN index on phone JSONB
CREATE INDEX idx_contacts_phone ON contacts USING GIN (phone);

-- Query example: Find contact by email
SELECT * FROM contacts
WHERE email @> '[{"value": "contact@example.com"}]'::jsonb;
```

---

## Support Files

- **Segments**: `/tmp/segments_import.csv` - Ready for import
- **Organizations**: `/tmp/organizations_cleaned.csv` - Ready for import
- **Contacts**: `/tmp/contacts_cleaned.csv` - Ready for import
- **Name Review**: `/tmp/questionable_names.csv` - Optional post-migration cleanup
- **This Guide**: `/tmp/MIGRATION_GUIDE.md`

---

Generated: 2025-10-22
CRM Version: Atomic CRM (Pre-launch)
Database: PostgreSQL with Supabase
