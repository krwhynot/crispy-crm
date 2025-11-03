# ADR-0005: Soft Delete Strategy for Core Entities

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM manages valuable sales data that may need to be recovered or audited after deletion:

**Business requirements:**
- **Historical reporting:** Sales reports need past data (won/lost opportunities from deleted organizations)
- **Audit trail:** Compliance requires tracking who deleted what and when
- **Undo functionality:** Users accidentally delete entities (opportunity, contact, organization)
- **Data recovery:** Restore mistakenly deleted records without database backup restore
- **Referential integrity:** What happens when organization deleted but has 50 opportunities?

**CRM entity relationships from PRD:**
- **Organizations** → have many Contacts, Opportunities, Activities
- **Contacts** → belong to Organization, linked to Opportunities
- **Opportunities** → belong to Organization, have many Activities, linked to Contacts
- **Products** → referenced by many Opportunities
- **Activities** → linked to Opportunities, Organizations, Contacts

**Technical constraints:**
- PostgreSQL database (ADR-0001)
- Row Level Security (RLS) policies (ADR-0001)
- Auto-generated REST APIs via PostgREST (ADR-0001)
- TypeScript frontend (must handle deleted records in UI)

**Problem:**
Hard delete (permanent removal from database) risks:
- **Data loss:** Accidental deletion = permanent data loss
- **Broken references:** Deleting organization breaks foreign keys to opportunities
- **Audit gaps:** No record of who deleted what
- **Report inaccuracy:** Historical reports missing deleted entities

**Use Cases from PRD:**
- Sales Rep accidentally deletes opportunity (Section 3.4) → needs undo
- Manager reviews won/lost report (Section 3.8) → needs past opportunities even if org deleted
- Admin audits user actions (future requirement) → needs deletion timestamps

## Decision

**Use soft delete (logical deletion) for all core CRM entities: Organizations, Contacts, Opportunities, Products, and Activities.**

Soft delete adds `deleted_at TIMESTAMPTZ` column to each table. Deleted records remain in database with `deleted_at` set to deletion timestamp. Application filters out deleted records unless explicitly viewing "deleted" data.

## Options Considered

### Option 1: Soft Delete (deleted_at column)
**Pros:**
- **Data recovery** - restore deleted record by setting `deleted_at = NULL`
- **Audit trail** - track who deleted, when deleted, can query deletion patterns
- **Historical reporting** - reports include all data (filter deleted if needed)
- **Referential integrity** - child records not orphaned (organization soft-deleted, opportunities still linked)
- **Undo functionality** - implement "Restore" button (UX win)
- **No CASCADE deletes** - child records not automatically deleted (safer)
- **Gradual cleanup** - permanently delete old soft-deleted records after 90 days (policy-based)

**Cons:**
- **Query complexity** - must filter `deleted_at IS NULL` on every query
  - **Mitigation:** Database views, RLS policies, or application layer filtering
- **Index bloat** - deleted records remain in indexes (performance impact over time)
  - **Mitigation:** Partial indexes (`WHERE deleted_at IS NULL`)
- **Unique constraints** - `UNIQUE (email)` prevents re-creating contact with same email if soft-deleted
  - **Mitigation:** Conditional unique constraints (`WHERE deleted_at IS NULL`)
- **Storage cost** - deleted records consume disk space
  - **Mitigation:** Archive/purge after 90 days

### Option 2: Hard Delete (permanent removal)
**Pros:**
- **Simple queries** - no `deleted_at` filtering needed
- **No storage overhead** - deleted records not stored
- **Smaller indexes** - better query performance
- **No unique constraint issues** - can reuse email addresses immediately

**Cons:**
- **Permanent data loss** - no recovery if accidental deletion
- **Broken reports** - historical reports missing deleted entities
- **No audit trail** - can't track who deleted what
- **CASCADE complexity** - child records must be handled (ON DELETE CASCADE or manual cleanup)
- **User frustration** - no "undo" option (poor UX)
- **Compliance risk** - some regulations require audit trail of deletions

### Option 3: Archival Table (move to separate table)
**Pros:**
- **Clean main tables** - active data separate from deleted data
- **Better performance** - main table queries don't scan deleted rows
- **Easy purging** - truncate archival table to remove all old data

**Cons:**
- **Complex queries** - reports need `UNION` across main + archival tables
- **Schema duplication** - archival table must match main table schema (maintenance burden)
- **Trigger complexity** - triggers to move data from main → archival on delete
- **Foreign key issues** - FKs from main table can't reference archival table
- **More storage** - duplicated data (deleted record in main + archival for brief window)

### Option 4: Event Sourcing (immutable event log)
**Pros:**
- **Complete audit trail** - every change recorded as event
- **Time travel** - reconstruct state at any point in history
- **No data loss** - all events retained forever

**Cons:**
- **Massive complexity** - requires event store, projection system, CQRS architecture
- **Overkill for CRM** - event sourcing best for financial systems, not sales CRM
- **Performance overhead** - replaying events to get current state
- **Team unfamiliar** - 20-week MVP timeline can't absorb learning curve
- **Storage explosion** - all events forever (expensive)

## Consequences

### Positive Consequences

**Data Safety:**
- **Undo within 90 days** - users can restore accidentally deleted records
- **Audit compliance** - track all deletions (who, when) for compliance reporting
- **Historical accuracy** - reports include all data (won/lost opportunities even if org deleted)

**User Experience:**
- **Restore functionality** - "Restore" button in UI for deleted records
- **Trash view** - users can browse deleted entities (like email trash folder)
- **Confidence** - users not afraid to delete (know it's recoverable)

**Data Integrity:**
- **No orphaned records** - opportunities still linked to deleted organization
- **Referential integrity maintained** - foreign keys still valid
- **No CASCADE nightmares** - deleting organization doesn't delete all opportunities

**Specific CRM Use Cases:**
- Sales Rep deletes opportunity by mistake → Manager restores it
- Organization marked inactive → All contacts/opportunities preserved for historical reports
- Product discontinued → Past opportunities still reference product for volume reports

### Negative Consequences

**Query Complexity:**
- **Every query needs deleted_at filter:**
  ```sql
  -- ❌ Wrong: Returns deleted records
  SELECT * FROM organizations;

  -- ✅ Correct: Filters deleted records
  SELECT * FROM organizations WHERE deleted_at IS NULL;
  ```
- **Mitigation:** Use database views or RLS policies to hide deleted records by default

**Performance Impact:**
- **Larger tables** - deleted records remain, indexes larger
- **Slower queries** - scanning more rows even with `deleted_at IS NULL` filter
- **Mitigation:** Partial indexes (`CREATE INDEX ON organizations(name) WHERE deleted_at IS NULL`)

**Unique Constraint Challenges:**
- **Problem:** User deletes contact (email@example.com), then creates new contact with same email
  - Database rejects: `UNIQUE (email)` violated (soft-deleted record still has that email)
- **Solution:** Conditional unique constraints:
  ```sql
  -- ❌ Wrong: Unique across all records
  UNIQUE (email)

  -- ✅ Correct: Unique only among active records
  CREATE UNIQUE INDEX unique_active_email ON contacts(email) WHERE deleted_at IS NULL;
  ```

**Storage Overhead:**
- **Deleted records consume disk space** (mitigated by cheap storage, ~$0.10/GB/month)
- **Mitigation:** Purge policy - permanently delete after 90 days

### Neutral Consequences

- **RLS policies simpler** - no need for separate "deleted" table with complex joins
- **Application layer responsible** for filtering deleted records (or use views)
- **Backup strategy unchanged** - backups include deleted records (good for recovery)

## Implementation Notes

**Database Schema Pattern:**

```sql
-- All core entities get these columns
CREATE TABLE organizations (
  organization_id UUID PRIMARY KEY,
  organization_name TEXT NOT NULL,
  -- ... other columns ...

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,  -- NULL = active, timestamp = deleted

  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id)  -- Who soft-deleted this record
);

-- Partial index for active records only
CREATE INDEX idx_organizations_active ON organizations(organization_name)
  WHERE deleted_at IS NULL;

-- Conditional unique constraint (active records only)
CREATE UNIQUE INDEX unique_active_organization_name ON organizations(organization_name)
  WHERE deleted_at IS NULL;
```

**Database View (Hide Deleted by Default):**

```sql
-- View for active organizations (deleted_at IS NULL)
CREATE VIEW organizations_active AS
SELECT * FROM organizations WHERE deleted_at IS NULL;

-- Application queries view instead of table
SELECT * FROM organizations_active;  -- Only active records
```

**RLS Policy (Exclude Deleted):**

```sql
-- RLS policy: Users can only see active (non-deleted) records
CREATE POLICY organizations_select_active ON organizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Separate policy for viewing deleted records (admin only)
CREATE POLICY organizations_select_deleted ON organizations
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NOT NULL AND
    auth.jwt() ->> 'role' = 'admin'
  );
```

**Soft Delete Function:**

```sql
-- Function to soft-delete record (sets deleted_at, deleted_by)
CREATE OR REPLACE FUNCTION soft_delete_organization(org_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE organizations
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend Pattern (React Query):**

```typescript
// Delete mutation (soft delete via Supabase update)
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('organization_id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted. Restore from Trash if needed.');
    },
  });
}

// Restore mutation (set deleted_at = NULL)
export function useRestoreOrganization() {
  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ deleted_at: null, deleted_by: null })
        .eq('organization_id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Organization restored.');
    },
  });
}

// Query active organizations (RLS policy filters deleted automatically)
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .is('deleted_at', null);  // Explicit filter (belt-and-suspenders with RLS)

      if (error) throw error;
      return data;
    },
  });
}
```

**UI Pattern (Trash View):**

```typescript
// Trash view: Show deleted records (admin only)
function OrganizationTrash() {
  const { data: deletedOrgs } = useQuery({
    queryKey: ['organizations', 'deleted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*, deleted_by:users!deleted_by(full_name)')
        .not('deleted_at', 'is', null)  // Only deleted records
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <h2>Deleted Organizations</h2>
      {deletedOrgs?.map((org) => (
        <TrashCard
          key={org.organization_id}
          title={org.organization_name}
          deletedAt={org.deleted_at}
          deletedBy={org.deleted_by?.full_name}
          onRestore={() => restoreOrg(org.organization_id)}
          onPermanentDelete={() => hardDelete(org.organization_id)}
        />
      ))}
    </div>
  );
}
```

**Purge Policy (Permanent Delete After 90 Days):**

```sql
-- Scheduled job (run daily via pg_cron or Supabase Edge Function)
CREATE OR REPLACE FUNCTION purge_old_soft_deletes()
RETURNS VOID AS $$
BEGIN
  -- Permanently delete records soft-deleted >90 days ago
  DELETE FROM organizations
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days';

  DELETE FROM contacts
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days';

  -- ... repeat for other tables
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
-- SELECT cron.schedule('purge-soft-deletes', '0 2 * * *', 'SELECT purge_old_soft_deletes()');
```

**Migration Strategy:**

1. **Add deleted_at columns** to all core tables
2. **Create partial indexes** for active records
3. **Update unique constraints** to conditional constraints
4. **Create RLS policies** to exclude deleted records
5. **Update application queries** to filter `deleted_at IS NULL` (or use views)
6. **Implement Trash UI** for viewing/restoring deleted records
7. **Set up purge job** (Edge Function or pg_cron)

## References

- **PRD Section 3:** CRUD operations for Organizations, Contacts, Opportunities
- **PRD Section 2.1:** Audit fields (created_at, updated_at, created_by, updated_by)
- **PostgreSQL Partial Indexes:** https://www.postgresql.org/docs/current/indexes-partial.html
- **Soft Delete Best Practices:** https://stackoverflow.com/questions/2549839/soft-delete-best-practices
- **Related ADR:** ADR-0001 (Supabase Backend - RLS policy implications)
- **Related ADR:** ADR-0004 (JWT Auth - deleted_by references auth.users)

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
