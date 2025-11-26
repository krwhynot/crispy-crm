# Design: contacts_summary View Extension

**Author:** Claude Code
**Date:** 2025-11-25
**Status:** Design Complete - Ready for Implementation
**Migration Name:** `add_contacts_summary_counts`

## Overview

Extend the `contacts_summary` view to include `nb_notes` and `nb_tasks` count metrics, enabling the ContactList to display activity indicators matching the OrganizationList pattern.

## Current State Analysis

### Existing View Structure
```sql
-- From: 20251020002305_fix_contacts_summary_security_invoker.sql
CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    c.id, c.name, c.first_name, c.last_name, c.email, c.phone,
    c.title, c.department, c.address, c.city, c.state, c.postal_code,
    c.country, c.birthday, c.linkedin_url, c.twitter_handle, c.notes,
    c.sales_id, c.created_at, c.updated_at, c.created_by, c.deleted_at,
    c.search_tsv, c.first_seen, c.last_seen, c.gender, c.tags,
    c.organization_id,
    o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;
```

### Related Tables

| Table | Has `contact_id` | Has `deleted_at` | Index on `contact_id` |
|-------|------------------|------------------|----------------------|
| `contactNotes` | ✅ `contact_id bigint NOT NULL` | ✅ Added in `20251108051117` | ✅ `idx_contact_notes_contact_id` |
| `tasks` | ✅ `contact_id bigint` (nullable) | ✅ Added in `20251028213032` | ❌ Needs index |

### Security Constraints
- **SECURITY INVOKER**: View executes with calling user's permissions
- **RLS on underlying tables**: Both `contactNotes` and `tasks` have RLS enabled
- **Soft-delete aware**: Must filter `deleted_at IS NULL`

## Design Decision

### Option A: Correlated Subqueries (RECOMMENDED)
```sql
(SELECT COUNT(*) FROM "contactNotes" cn
 WHERE cn.contact_id = c.id AND cn.deleted_at IS NULL) AS nb_notes,
(SELECT COUNT(*) FROM tasks t
 WHERE t.contact_id = c.id AND t.deleted_at IS NULL) AS nb_tasks
```

**Pros:**
- Simpler, clearer intent
- PostgreSQL optimizer converts to lateral joins when beneficial
- No GROUP BY complexity
- Matches `principal_pipeline_summary` pattern

**Cons:**
- Slightly less efficient for large datasets without proper indexes

### Option B: LEFT JOIN with COUNT DISTINCT
```sql
LEFT JOIN LATERAL (
  SELECT COUNT(*) as cnt FROM "contactNotes" cn
  WHERE cn.contact_id = c.id AND cn.deleted_at IS NULL
) notes_count ON true
```

**Verdict:** Option A is preferred for consistency with existing views and simplicity.

## Missing Schema Elements

### 1. Contact Status Column (DISCOVERED ISSUE)

The `contacts` table is **missing the `status` column** that the frontend expects:

```typescript
// src/atomic-crm/types.ts line 97
status: string;  // Expected values: 'cold' | 'warm' | 'hot' | 'in-contract'
```

**Required migration addition:**
```sql
-- Add status column to contacts table
ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'cold';
COMMENT ON COLUMN contacts.status IS 'Contact engagement level: cold, warm, hot, in-contract';
```

### 2. Tasks Index for Performance

```sql
-- Add index for contact_id lookups on tasks (currently missing)
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id) WHERE deleted_at IS NULL;
```

## Final Migration Design

```sql
-- Migration: add_contacts_summary_counts
-- Purpose: Add nb_notes and nb_tasks to contacts_summary view
-- Also adds missing status column to contacts table

-- =============================================================================
-- STEP 1: Add missing status column to contacts table
-- =============================================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'cold';
COMMENT ON COLUMN contacts.status IS
    'Contact engagement level: cold (dormant), warm (engaged), hot (ready), in-contract (closed)';

-- =============================================================================
-- STEP 2: Add performance index for tasks.contact_id
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id
ON tasks(contact_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- STEP 3: Drop and recreate contacts_summary view with count columns
-- =============================================================================
DROP VIEW IF EXISTS contacts_summary;

CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    -- Core contact fields
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    c.organization_id,
    c.status,  -- NEW: engagement status

    -- Organization reference
    o.name AS company_name,

    -- NEW: Activity count metrics (soft-delete aware)
    (SELECT COUNT(*)::integer
     FROM "contactNotes" cn
     WHERE cn.contact_id = c.id
       AND cn.deleted_at IS NULL) AS nb_notes,

    (SELECT COUNT(*)::integer
     FROM tasks t
     WHERE t.contact_id = c.id
       AND t.deleted_at IS NULL) AS nb_tasks

FROM contacts c
LEFT JOIN organizations o
    ON o.id = c.organization_id
   AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;

-- =============================================================================
-- STEP 4: Re-grant permissions (CRITICAL - views lose grants on recreation)
-- =============================================================================
GRANT SELECT ON contacts_summary TO authenticated;

-- =============================================================================
-- STEP 5: Update documentation
-- =============================================================================
COMMENT ON VIEW contacts_summary IS
    'Contact summary with organization name and activity counts. '
    'Uses security_invoker to enforce RLS from underlying tables. '
    'Includes nb_notes and nb_tasks for UI display.';
```

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| **RLS Bypass** | `security_invoker = true` ensures subqueries respect RLS |
| **Performance DoS** | Indexes on `contact_id` columns prevent full table scans |
| **Soft-delete leakage** | All subqueries filter `deleted_at IS NULL` |
| **Permission grant loss** | Explicit `GRANT SELECT` after view recreation |

## Performance Analysis

### Query Plan (Expected)
```
Seq Scan on contacts c
  Filter: (deleted_at IS NULL)
  SubPlan 1 (nb_notes)
    -> Index Only Scan on idx_contact_notes_contact_id
  SubPlan 2 (nb_tasks)
    -> Index Only Scan on idx_tasks_contact_id
  -> Index Scan on organizations o (for company_name)
```

### Index Utilization
| Table | Index | Used By |
|-------|-------|---------|
| `contactNotes` | `idx_contact_notes_contact_id` | nb_notes subquery |
| `tasks` | `idx_tasks_contact_id` (NEW) | nb_tasks subquery |
| `organizations` | Primary key | company_name join |

## Type Updates Required

### TypeScript Contact Interface
```typescript
// src/atomic-crm/types.ts - Contact interface already has status
// Add nb_notes and nb_tasks (optional for backward compatibility)
export interface Contact extends Pick<RaRecord, "id"> {
  // ... existing fields ...
  status: string;  // Now backed by database column
  nb_notes?: number;  // NEW
  nb_tasks?: number;  // NEW
}
```

### Database Generated Types
After migration, regenerate types:
```bash
npx supabase gen types typescript --local > src/types/database.generated.ts
```

## Validation Checklist

- [ ] Migration runs without error on local
- [ ] `status` column appears in contacts table
- [ ] `idx_tasks_contact_id` index created
- [ ] View returns `nb_notes` and `nb_tasks` counts
- [ ] RLS still enforced (test with non-admin user)
- [ ] Soft-deleted notes/tasks excluded from counts
- [ ] TypeScript types regenerated
- [ ] ContactList displays counts (if column added)

## Rollback Strategy

```sql
-- Rollback: remove_contacts_summary_counts

-- Recreate original view (without counts)
DROP VIEW IF EXISTS contacts_summary;

CREATE VIEW contacts_summary
WITH (security_invoker = true)
AS
SELECT
    c.id, c.name, c.first_name, c.last_name, c.email, c.phone,
    c.title, c.department, c.address, c.city, c.state, c.postal_code,
    c.country, c.birthday, c.linkedin_url, c.twitter_handle, c.notes,
    c.sales_id, c.created_at, c.updated_at, c.created_by, c.deleted_at,
    c.search_tsv, c.first_seen, c.last_seen, c.gender, c.tags,
    c.organization_id,
    o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;

GRANT SELECT ON contacts_summary TO authenticated;

-- Note: status column and index can remain (backward compatible)
```

## References

- **Reference migration:** `20251020002305_fix_contacts_summary_security_invoker.sql`
- **Soft-delete pattern:** `20251108051117_add_soft_delete_columns.sql`
- **Engineering Constitution:** Soft-deletes rule, fail-fast principle
- **ContactBadges.tsx:** Expects `status` field on contacts
