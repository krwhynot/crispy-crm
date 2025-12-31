# ADR-007: Soft Delete Pattern

## Status

**Accepted** - 2025-10-28

## Context

Crispy CRM requires a deletion strategy that balances data integrity, audit compliance, and operational flexibility. The system manages sales pipeline data where:

1. **Regulatory Compliance**: Business records may need retention for audit trails
2. **User Error Recovery**: Accidental deletions should be reversible without database restoration
3. **Referential Integrity**: Deleting parent records (opportunities) must not orphan related data (activities, notes, tasks)
4. **Pre-Launch Velocity**: The fail-fast principle demands simple, debuggable patterns over complex solutions

Hard deletes were rejected because:
- No recovery path without database backups
- Cascade deletes break historical reporting
- Foreign key violations require careful ordering
- No audit trail of when/why records were removed

## Decision

Implement soft delete using a `deleted_at` timestamp column with **dual-layer filtering** (application + RLS).

### Core Components

**1. Schema Pattern**

All soft-deletable tables include:

```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
```

**2. Partial Indexes for Performance**

```sql
CREATE INDEX idx_<table>_deleted_at ON <table>(deleted_at) WHERE deleted_at IS NULL;
```

This optimizes the common query pattern (active records only) while avoiding index bloat from deleted records.

**3. Application-Layer Filtering (`createResourceCallbacks.ts`)**

The factory pattern centralizes soft delete behavior:

```typescript
export interface SoftDeleteConfig {
  /** Enable soft delete functionality */
  enabled: boolean;
  /** Database field name that stores deletion timestamp */
  field: string;
  /** Filter out deleted records in getList by default */
  filterOutDeleted: boolean;
  /** Value to set when restoring a soft-deleted record (usually null) */
  restoreValue: null | unknown;
}
```

**beforeDelete callback** - Intercepts delete operations:

```typescript
callbacks.beforeDelete = async (params, dataProvider) => {
  const deletedAt = new Date().toISOString();

  await dataProvider.update(resource, {
    id: params.id,
    data: { [softDeleteConfig.field]: deletedAt },
    previousData: params.previousData,
  });

  return {
    ...params,
    meta: { ...params.meta, skipDelete: true },
  };
};
```

**beforeGetList callback** - Adds automatic filtering:

```typescript
callbacks.beforeGetList = async (params, _dataProvider) => {
  const { includeDeleted, ...otherFilters } = params.filter || {};
  const softDeleteFilter =
    softDeleteConfig.filterOutDeleted && !includeDeleted
      ? { [`${softDeleteConfig.field}@is`]: null }
      : {};

  return {
    ...params,
    filter: {
      ...otherFilters,
      ...softDeleteFilter,
    },
  };
};
```

**4. Resource Registry (`resources.ts`)**

Centralized list of soft-delete-enabled resources:

```typescript
export const SOFT_DELETE_RESOURCES = [
  "organizations",
  "contacts",
  "opportunities",
  "opportunity_participants",
  "opportunity_contacts",
  "activities",
  "products",
  "sales",
  "tasks",
  "contact_preferred_principals",
  "segments",
  "contactNotes",
  "opportunityNotes",
  "organizationNotes",
  "interaction_participants",
  "tags",
  "opportunity_products",
  "notifications",
  "distributor_principal_authorizations",
  "organization_distributors",
] as const;
```

**5. RLS Enforcement (Defense in Depth)**

All SELECT policies include `deleted_at IS NULL`:

```sql
-- Simple pattern
CREATE POLICY "select_contacts"
ON contacts
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- With ownership check
CREATE POLICY "authenticated_select_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (deleted_at IS NULL AND user_id = auth.uid());

-- With role-based access
CREATE POLICY "tasks_select_policy"
ON tasks
FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        is_manager_or_admin()
        OR sales_id = current_sales_id()
        OR created_by = current_sales_id()
    )
);
```

**6. Cascade Functions for Complex Relationships**

Opportunities have dependent records that must be archived atomically:

```sql
CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Archive parent
  UPDATE opportunities
  SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  -- Cascade to children
  UPDATE activities
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE "opportunityNotes"
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_participants
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE tasks
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;
END;
$$;
```

Corresponding restore function:

```sql
CREATE OR REPLACE FUNCTION unarchive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  UPDATE opportunities SET deleted_at = NULL WHERE id = opp_id;
  UPDATE activities SET deleted_at = NULL WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
  UPDATE "opportunityNotes" SET deleted_at = NULL WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
  UPDATE opportunity_participants SET deleted_at = NULL WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
  UPDATE tasks SET deleted_at = NULL WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
END;
$$;
```

## Consequences

### Positive

1. **Data Recovery**: Any record can be restored by setting `deleted_at = NULL`
2. **Audit Trail**: Exact deletion timestamp preserved for compliance
3. **Referential Integrity**: Foreign keys remain valid; historical reports work
4. **Defense in Depth**: RLS ensures deleted records invisible even if app layer bypassed
5. **Query Performance**: Partial indexes optimize active-record queries
6. **Atomic Cascades**: RPC functions ensure parent-child consistency

### Negative

1. **Query Complexity**: Every query must consider `deleted_at` (mitigated by RLS + callbacks)
2. **Storage Growth**: Deleted records consume space (acceptable for CRM scale)
3. **Index Overhead**: Partial indexes add write overhead
4. **Cascade Maintenance**: New child relationships require RPC function updates

### Neutral

1. **Migration Burden**: Adding `deleted_at` to existing tables requires migration
2. **Testing Complexity**: Tests must verify both active and deleted record handling

## Anti-Patterns

### Hard Delete

```typescript
// WRONG: Loses all history, breaks audit trail
await supabase.from('contacts').delete().eq('id', contactId);
```

### Boolean Flag

```typescript
// WRONG: No timestamp means no audit trail
is_deleted: boolean  // When was it deleted? Unknown.
```

### `archived_at` Column Name

```typescript
// WRONG: Deprecated terminology creates confusion
// Use deleted_at for consistency across all resources
archived_at: timestamp  // Legacy pattern, do not use
```

### Manual Filter Bypass

```typescript
// WRONG: Bypasses RLS protection, may expose deleted records
const { data } = await supabase
  .from('contacts')
  .select('*')
  .is('deleted_at', null);  // Should use data provider
```

### Correct Pattern

```typescript
// RIGHT: Use data provider with includeDeleted flag when needed
const { data } = await dataProvider.getList('contacts', {
  filter: { includeDeleted: true },  // Explicit opt-in for admin views
});
```

## Key Migrations

| Migration | Purpose |
|-----------|---------|
| `20251028213032_add_soft_delete_cascade_functions.sql` | Cascade RPCs for opportunities |
| `20251108051117_add_soft_delete_columns.sql` | Bulk column addition + partial indexes |
| `20251129180728_add_soft_delete_rls_filtering.sql` | RLS enforcement (17 tables) |

## Related ADRs

- **ADR-017**: Views must filter `deleted_at IS NULL` by default

## References

- Engineering Constitution: "Use `deleted_at` timestamp, never hard delete"
- `src/atomic-crm/providers/supabase/callbacks/createResourceCallbacks.ts` (lines 80-89, 272-307)
- `src/atomic-crm/providers/supabase/resources.ts` (SOFT_DELETE_RESOURCES array)
