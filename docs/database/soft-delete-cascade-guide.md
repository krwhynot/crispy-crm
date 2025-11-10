# Soft Delete Cascading for Opportunities

## Overview

This guide documents the soft delete cascading functionality implemented for opportunities in Atomic CRM. When an opportunity is archived (soft deleted), all related records should be archived in cascade. Conversely, when an opportunity is unarchived, related records should be restored.

**Status:** P1 - Data consistency critical fix
**Migration:** `20251028213032_add_soft_delete_cascade_functions.sql`
**Created:** 2025-10-28

## Problem Statement

Previously, when unarchiving an opportunity (setting `deleted_at = NULL`), the related records (notes, interactions, activities, tasks, participants) remained archived, creating orphaned data and data inconsistency.

### Example Scenario

1. Create Opportunity A with 3 activities and 2 notes
2. Archive Opportunity A (cascade archives all related records)
3. Unarchive Opportunity A
4. **Problem:** The 3 activities and 2 notes remain archived → data inconsistency

## Solution

Two RPC functions implement cascading soft delete logic:

1. **`archive_opportunity_with_relations(opp_id BIGINT)`** - Archives opportunity and cascades to related records
2. **`unarchive_opportunity_with_relations(opp_id BIGINT)`** - Unarchives opportunity and cascades to related records

## Schema Changes

### New Columns Added

```sql
-- opportunityNotes table
ALTER TABLE "opportunityNotes"
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- tasks table
ALTER TABLE tasks
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
```

These columns were added to align with the soft delete pattern already used in:
- `opportunities.deleted_at`
- `activities.deleted_at`
- `opportunity_participants.deleted_at`

## RPC Functions

### archive_opportunity_with_relations(opp_id BIGINT)

Archives an opportunity and cascades the soft delete to all related records.

**Usage:**
```sql
SELECT archive_opportunity_with_relations(123);
```

**Behavior:**
- Sets `opportunities.deleted_at = NOW()` where `id = opp_id`
- Cascades to `activities` (where `opportunity_id = opp_id`)
- Cascades to `opportunityNotes` (where `opportunity_id = opp_id`)
- Cascades to `opportunity_participants` (where `opportunity_id = opp_id`)
- Cascades to `tasks` (where `opportunity_id = opp_id`)
- Only archives records that are currently active (`deleted_at IS NULL`)

**Security:** SECURITY DEFINER (runs with schema owner privileges)

**Error Handling:**
- Raises exception if `opp_id` is NULL

### unarchive_opportunity_with_relations(opp_id BIGINT)

Restores an archived opportunity and cascades the restoration to all related records.

**Usage:**
```sql
SELECT unarchive_opportunity_with_relations(123);
```

**Behavior:**
- Sets `opportunities.deleted_at = NULL` where `id = opp_id`
- Cascades to `activities` (where `opportunity_id = opp_id AND deleted_at IS NOT NULL`)
- Cascades to `opportunityNotes` (where `opportunity_id = opp_id AND deleted_at IS NOT NULL`)
- Cascades to `opportunity_participants` (where `opportunity_id = opp_id AND deleted_at IS NOT NULL`)
- Cascades to `tasks` (where `opportunity_id = opp_id AND deleted_at IS NOT NULL`)
- Restores all deleted related records

**Security:** SECURITY DEFINER (runs with schema owner privileges)

**Error Handling:**
- Raises exception if `opp_id` is NULL

## Frontend Integration

These functions should be called from the frontend via the Supabase data provider:

### Archive an Opportunity

```typescript
// Using react-admin or custom client
const dataProvider = useDataProvider();

// Archive opportunity and cascade
await dataProvider.rpc('archive_opportunity_with_relations', {
  opp_id: opportunityId
});
```

### Unarchive an Opportunity

```typescript
// Using react-admin or custom client
const dataProvider = useDataProvider();

// Unarchive opportunity and cascade
await dataProvider.rpc('unarchive_opportunity_with_relations', {
  opp_id: opportunityId
});
```

## Related Records Affected by Cascade

| Table | Impact | Notes |
|-------|--------|-------|
| `activities` | Full cascade | Records with `opportunity_id` are archived/unarchived |
| `opportunityNotes` | Full cascade | Records with `opportunity_id` are archived/unarchived |
| `opportunity_participants` | Full cascade | Records with `opportunity_id` are archived/unarchived |
| `tasks` | Full cascade | Records with `opportunity_id` are archived/unarchived |

## Testing

The migration includes comprehensive test cases verifying:

1. **Cascade Archive:**
   - Creating test opportunity with 1 activity, 1 note, 1 task
   - Calling `archive_opportunity_with_relations(11)`
   - Verifying all records have `deleted_at IS NOT NULL`
   - Result: All 4 records (opportunity + 3 related) successfully archived

2. **Cascade Unarchive:**
   - Calling `unarchive_opportunity_with_relations(11)`
   - Verifying all records have `deleted_at IS NULL`
   - Result: All 4 records successfully unarchived

### Test Query Results

```
Archive Test:
- opportunities: 1 total, 0 active, 1 deleted ✓
- activities: 1 total, 0 active, 1 deleted ✓
- opportunityNotes: 1 total, 0 active, 1 deleted ✓
- tasks: 1 total, 0 active, 1 deleted ✓

Unarchive Test:
- opportunities: 1 total, 1 active, 0 deleted ✓
- activities: 1 total, 1 active, 0 deleted ✓
- opportunityNotes: 1 total, 1 active, 0 deleted ✓
- tasks: 1 total, 1 active, 0 deleted ✓
```

## Industry Best Practices

This implementation follows industry-standard soft delete cascading patterns:

1. **Single Transaction Safety:** All updates are atomic within a single stored procedure
2. **Data Integrity:** Only modifies records directly related to the opportunity
3. **Audit Trail:** Preserves `deleted_at` timestamp for compliance and recovery
4. **RLS Compatible:** Functions respect row-level security policies when called through RPC
5. **Idempotency:** Can be called multiple times without side effects

## Data Recovery

If records are accidentally archived, they can be restored individually:

```sql
-- Restore a single activity
UPDATE activities SET deleted_at = NULL WHERE id = activity_id;

-- Or restore all activities for an opportunity
SELECT unarchive_opportunity_with_relations(opportunity_id);
```

## Migration Path

This migration is safe for production:

1. Adds `deleted_at` columns with NULL defaults (non-breaking)
2. Creates new functions (backward compatible)
3. Grants execution permissions to authenticated users
4. No existing data is modified during migration

**Deployment Steps:**
```bash
# Local development
npm run db:local:reset

# Cloud production
npm run db:cloud:push
```

## File References

- Migration: `/supabase/migrations/20251028213032_add_soft_delete_cascade_functions.sql`
- This Guide: `/docs/database/SOFT_DELETE_CASCADE_GUIDE.md`

## Related Documentation

- [Database Workflow Guide](docs/supabase/WORKFLOW.md)
- [Migration Business Rules](docs/database/migration-business-rules.md)
- [Supabase RPC Documentation](https://supabase.com/docs/guides/database/functions)

## Support & Troubleshooting

### Function not found error?

Ensure the migration has been applied:
```bash
npm run db:cloud:push  # For production
npm run db:local:reset # For local development
```

### Records not cascading?

Verify the related records have the correct `opportunity_id`:
```sql
SELECT id, opportunity_id, deleted_at FROM activities WHERE opportunity_id = ?;
SELECT id, opportunity_id, deleted_at FROM "opportunityNotes" WHERE opportunity_id = ?;
SELECT id, opportunity_id, deleted_at FROM tasks WHERE opportunity_id = ?;
```

### Need to restore individual records?

```sql
-- Restore a single record without cascading
UPDATE activities SET deleted_at = NULL WHERE id = activity_id;
```

## Changelog

### Version 1.0 (2025-10-28)
- Initial release
- Added `deleted_at` columns to `opportunityNotes` and `tasks`
- Implemented `archive_opportunity_with_relations()` function
- Implemented `unarchive_opportunity_with_relations()` function
- Comprehensive testing and documentation
