# Opportunity Contacts Junction Table Migration

## Status: COMPLETED
Migration successfully applied to production database.

## Overview

This migration implements the industry-standard **junction table pattern** for managing many-to-many relationships between opportunities and contacts. This is a critical data integrity fix that brings the system in line with CRM best practices used by Salesforce, HubSpot, and Pipedrive.

**Migration Name:** `create_opportunity_contacts_junction_table`
**Applied:** 2025-10-28
**Migration File:** `supabase/migrations/20251028213020_create_opportunity_contacts_junction_table.sql`

## Problem Statement

Previously, opportunity-contact relationships were stored as a denormalized array field (`contact_ids BIGINT[]`) in the opportunities table. This approach has critical limitations:

- **Data Integrity Issues:** No referential integrity between opportunities and contacts
- **Query Complexity:** Array operations are inefficient for filtering and joining
- **Flexibility Loss:** Cannot store relationship metadata (role, is_primary, notes)
- **Scalability:** Array operations don't scale well with large datasets
- **Foreign Key Violations:** No CASCADE delete protection if a contact is deleted

## Solution: Junction Table Pattern

The `opportunity_contacts` table implements the canonical junction table pattern:

```
Opportunities <---> Opportunity_Contacts <---> Contacts
       1                    N                      N
```

### Table Schema

```sql
CREATE TABLE opportunity_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);
```

### Column Definitions

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | BIGINT | NO | auto-generated | Primary key |
| `opportunity_id` | BIGINT | NO | - | Foreign key to opportunities(id), CASCADE delete |
| `contact_id` | BIGINT | NO | - | Foreign key to contacts(id), CASCADE delete |
| `role` | VARCHAR(50) | YES | NULL | Contact's role in opportunity (decision maker, influencer, etc.) |
| `is_primary` | BOOLEAN | YES | false | Whether this is the primary contact for the opportunity |
| `notes` | TEXT | YES | NULL | Additional notes about this contact in context of opportunity |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Timestamp when relationship was created |

### Key Features

1. **Referential Integrity**: Foreign keys with CASCADE DELETE ensure data consistency
   - If an opportunity is deleted, all its contact associations are automatically removed
   - If a contact is deleted, all its opportunity associations are automatically removed

2. **Unique Constraint**: `UNIQUE (opportunity_id, contact_id)` prevents duplicate relationships

3. **Rich Relationship Data**: Unlike the array field, junction table can store:
   - Role of contact in the opportunity (e.g., "Decision Maker", "Influencer")
   - Whether this is the primary contact
   - Contextual notes about the relationship

4. **Efficient Querying**: Standard SQL joins instead of array operations
   - Much faster filtering and aggregation
   - Better index utilization
   - Compatible with standard ORM query builders

## Row Level Security (RLS) Policies

Four RLS policies protect data access:

### 1. SELECT Policy: View opportunity_contacts
Users can view opportunity_contacts if they have access to the associated opportunity:
- User's organization is a participant in the opportunity, OR
- User created/owns the opportunity, OR
- User is the account manager

### 2. INSERT Policy: Add opportunity_contacts
Users can add contacts to an opportunity if they:
- Created the opportunity, OR
- Own the opportunity, OR
- Are the account manager

### 3. UPDATE Policy: Modify opportunity_contacts
Same permissions as INSERT - must be creator, owner, or account manager

### 4. DELETE Policy: Remove opportunity_contacts
Same permissions as INSERT/UPDATE

## Indexes for Performance

Three optimized indexes ensure query performance:

```sql
CREATE INDEX idx_opportunity_contacts_opportunity_id
  ON opportunity_contacts(opportunity_id);

CREATE INDEX idx_opportunity_contacts_contact_id
  ON opportunity_contacts(contact_id);

CREATE INDEX idx_opportunity_contacts_is_primary
  ON opportunity_contacts(opportunity_id, is_primary)
  WHERE is_primary = true;
```

**Index Strategy:**
- First two indexes: Essential for foreign key lookups and filtering by opportunity or contact
- Third index: Optimized for common query pattern "get primary contact for opportunity"
- Partial index on `is_primary = true` saves space and improves query planning

## Data Migration

The migration automatically migrated existing data from the `opportunities.contact_ids` array:

```sql
INSERT INTO opportunity_contacts (opportunity_id, contact_id)
SELECT o.id, unnest(o.contact_ids)
FROM opportunities o
WHERE o.contact_ids IS NOT NULL AND array_length(o.contact_ids, 1) > 0
ON CONFLICT (opportunity_id, contact_id) DO NOTHING;
```

**Behavior:**
- All existing contact IDs from the array are migrated to junction table rows
- All migrated relationships have `is_primary = false` (default)
- If duplicate relationships exist, they are ignored (ON CONFLICT DO NOTHING)
- Preserves all existing opportunity-contact associations

## Backward Compatibility

The `opportunities.contact_ids` array field is **NOT dropped** to maintain backward compatibility during frontend migration.

**Important:** This is a temporary measure. Once the frontend is updated to use the junction table, the array field will be deprecated and removed in a future migration.

**Current State:**
- Junction table is the **canonical source** for opportunity-contact relationships
- Array field is maintained for compatibility only
- Frontend should migrate to query `opportunity_contacts` table directly

## Verification

Migration verification completed successfully:

```
✓ Table created with correct schema (7 columns)
✓ RLS enabled
✓ 4 RLS policies created (SELECT, INSERT, UPDATE, DELETE)
✓ 5 indexes created (1 PK + 3 foreign key + 1 composite)
✓ 2 foreign key constraints with CASCADE delete
✓ Unique constraint on (opportunity_id, contact_id)
✓ Table and column comments added for documentation
```

## Query Examples

### Get all contacts for an opportunity
```sql
SELECT c.*, oc.role, oc.is_primary, oc.notes
FROM opportunity_contacts oc
JOIN contacts c ON oc.contact_id = c.id
WHERE oc.opportunity_id = $1
ORDER BY oc.is_primary DESC, oc.created_at ASC;
```

### Get primary contact for an opportunity
```sql
SELECT c.*, oc.role, oc.notes
FROM opportunity_contacts oc
JOIN contacts c ON oc.contact_id = c.id
WHERE oc.opportunity_id = $1 AND oc.is_primary = true;
```

### Get all opportunities for a contact
```sql
SELECT o.*, oc.role, oc.is_primary
FROM opportunity_contacts oc
JOIN opportunities o ON oc.opportunity_id = o.id
WHERE oc.contact_id = $1
ORDER BY o.created_at DESC;
```

### Add a contact to an opportunity
```sql
INSERT INTO opportunity_contacts (opportunity_id, contact_id, role, is_primary)
VALUES ($1, $2, $3, $4)
ON CONFLICT (opportunity_id, contact_id) DO UPDATE
  SET role = EXCLUDED.role,
      is_primary = EXCLUDED.is_primary;
```

### Set primary contact for an opportunity
```sql
-- Clear previous primary
UPDATE opportunity_contacts
SET is_primary = false
WHERE opportunity_id = $1;

-- Set new primary
UPDATE opportunity_contacts
SET is_primary = true
WHERE opportunity_id = $1 AND contact_id = $2;
```

## Frontend Migration Guide

### Phase 1: Read from Junction Table (Current)
Frontend should be updated to query `opportunity_contacts` instead of parsing the array:

**Before:**
```javascript
// Old approach - parsing array
const contactIds = opportunity.contact_ids || [];
const contacts = await db.contacts.where('id').in(contactIds).toArray();
```

**After:**
```javascript
// New approach - junction table join
const contacts = await db.opportunityContacts
  .where('opportunity_id').equals(opportunityId)
  .join(db.contacts, 'contact_id', 'id')
  .toArray();
```

### Phase 2: Write to Junction Table
When creating/updating opportunities, write to junction table:

```javascript
// Add contact to opportunity
await db.opportunityContacts.add({
  opportunity_id: opportunityId,
  contact_id: contactId,
  role: 'Decision Maker',
  is_primary: true
});
```

### Phase 3: Remove Array Field
After frontend is fully migrated (typically 1-2 sprints), the `opportunities.contact_ids` field will be removed in a follow-up migration.

## Rollback Plan

If issues arise, the migration can be rolled back:

```sql
-- Drop the junction table and RLS policies
DROP TABLE IF EXISTS opportunity_contacts CASCADE;
```

The original `opportunities.contact_ids` array field remains intact and will continue to function.

## Impact Assessment

### Performance
- **Improved:** Query filtering and joining (SQL queries vs array operations)
- **Improved:** Index utilization for opportunity-contact lookups
- **Neutral:** Slight overhead from junction table joins (typical for normalized schemas)

### Data Integrity
- **Improved:** Referential integrity enforced via foreign keys
- **Improved:** CASCADE delete prevents orphaned records
- **Improved:** Unique constraint prevents duplicate relationships

### Breaking Changes
- **None:** Backward compatible. Old array field still exists.

## Related Documentation

- [Migration Business Rules](migration-business-rules.md)
- [Supabase Workflow](../supabase/WORKFLOW.md)
- [Production Safety Guide](../../scripts/db/PRODUCTION-WARNING.md)

## Questions or Issues?

For questions about this migration:
1. Review the SQL in `supabase/migrations/20251028213020_create_opportunity_contacts_junction_table.sql`
2. Check the table structure: `\d opportunity_contacts` in psql
3. Consult the [Engineering Constitution](../claude/engineering-constitution.md)
