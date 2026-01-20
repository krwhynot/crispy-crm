# Supabase Migration Patterns

Canonical patterns for PostgreSQL migrations in Crispy CRM. All examples are from actual production migrations.

```
                            ┌─────────────────────┐
                            │   organizations     │
                            │  (principals,       │
                            │   distributors,     │
                            │   customers)        │
                            └─────────┬───────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   contacts    │           │  opportunities  │           │    products     │
│               │◄──────────│                 │──────────►│                 │
└───────────────┘   M:M     └────────┬────────┘    M:M    └─────────────────┘
                   junction          │           junction
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  activities   │           │    tasks      │           │ opp_products  │
│               │           │  (personal)   │           │  (junction)   │
└───────────────┘           └───────────────┘           └───────────────┘
```

## Quick Reference

| Pattern | Use When |
|---------|----------|
| A: Table Structure | Creating new tables |
| B: RLS Policies | Controlling row-level access |
| C: View Creation | Creating denormalized views |
| D: Soft Delete | Implementing recoverable delete |
| E: Audit Trail | Tracking who changed what |
| F: RPC Functions | Atomic multi-table operations |
| G: Enum Types | Constraining column values |
| H: Foreign Keys | Referential integrity |
| I: Indexes | Query optimization |
| J: Multi-Tenant | Team isolation patterns |
| K: JSONB RPC Functions | Complex RPC with flexible inputs |
| L: Unified Timeline Views | Aggregating multiple entities into sortable stream |

---

## Pattern A: Table Structure

Standard column ordering and constraints for new tables.

**When to use**: Creating any new table in the schema.

### Junction Table Pattern

**Example:** `20251028213020_create_opportunity_contacts_junction_table.sql`

```sql
CREATE TABLE IF NOT EXISTS opportunity_contacts (
  -- 1. Primary key (always first)
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- 2. Foreign keys (parent references)
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- 3. Business columns
  role VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,

  -- 4. Timestamps (always last)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 5. Constraints
  CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);
```

### Entity Table Pattern

**Example:** `20251129050428_add_distributor_principal_authorizations.sql`

```sql
CREATE TABLE IF NOT EXISTS distributor_principal_authorizations (
  -- 1. Primary key
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- 2. Foreign keys
  distributor_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  principal_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 3. Business columns
  is_authorized BOOLEAN NOT NULL DEFAULT true,
  authorization_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  territory_restrictions TEXT[],
  notes TEXT,

  -- 4. Audit columns (standard pattern)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,  -- Soft delete

  -- 5. Constraints
  CONSTRAINT uq_distributor_principal_authorization UNIQUE (distributor_id, principal_id),
  CONSTRAINT valid_authorization_dates CHECK (
    expiration_date IS NULL OR expiration_date > authorization_date
  ),
  CONSTRAINT no_self_authorization CHECK (distributor_id <> principal_id)
);
```

### Column Order Convention

| Order | Category | Examples |
|-------|----------|----------|
| 1 | Primary Key | `id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY` |
| 2 | Foreign Keys | `organization_id BIGINT NOT NULL REFERENCES organizations(id)` |
| 3 | Business Columns | `name TEXT NOT NULL`, `status TEXT`, `is_active BOOLEAN` |
| 4 | Audit Columns | `created_at`, `updated_at`, `created_by`, `deleted_at` |
| 5 | Constraints | `CONSTRAINT`, `UNIQUE`, `CHECK` |

### Key Points

- **BIGINT over UUID**: BIGINT is faster for joins and indexing
- **GENERATED ALWAYS AS IDENTITY**: Preferred over `SERIAL` (SQL standard)
- **NOT NULL on FKs**: Foreign keys should always be NOT NULL unless truly optional
- **TIMESTAMPTZ over TIMESTAMP**: Always use timezone-aware timestamps
- **DEFAULT NOW()**: Auto-populate timestamps, never trust client time

---

## Pattern B: RLS Policies

Row-Level Security patterns for access control.

**When to use**: Every table that contains user data.

### Shared Team Access Pattern

For collaborative data (contacts, organizations, opportunities).

**Example:** `20251018203500_update_rls_for_shared_team_access.sql`

```sql
-- Architecture: Small team shares all customer data
-- Pattern: USING (true) with explicit documentation

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT
  TO authenticated
  USING (true);  -- Everyone can see all contacts

CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Anyone can create contacts

CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);  -- Anyone can update any contact

CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE
  TO authenticated
  USING (true);  -- Anyone can delete any contact
```

### Personal Access Pattern

For user-specific data (tasks, preferences).

**Example:** `20251018204500_add_helper_function_and_audit_trail.sql`

```sql
-- Pattern: Only creator can access their own records
-- Uses helper function for cleaner policies

CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT
  TO authenticated
  USING (sales_id = public.get_current_sales_id());

CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (sales_id = public.get_current_sales_id());

CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE
  TO authenticated
  USING (sales_id = public.get_current_sales_id());

CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE
  TO authenticated
  USING (sales_id = public.get_current_sales_id());
```

### Complex Access Pattern (Junction Tables)

For tables with complex access rules based on related records.

**Example:** `20251028213020_create_opportunity_contacts_junction_table.sql`

```sql
-- Pattern: Access through parent relationship
-- User must have access to the opportunity to access its contacts

CREATE POLICY "Users can view opportunity_contacts through opportunities"
  ON opportunity_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        -- User's organization is a participant
        EXISTS (
          SELECT 1 FROM opportunity_participants op
          INNER JOIN sales s ON s.id = get_current_sales_id()
          WHERE op.opportunity_id = o.id
        )
        -- OR user created/owns the opportunity
        OR o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );
```

### RLS Access Pattern Comparison

| Pattern | Use When | Example Tables |
|---------|----------|----------------|
| **Shared Team** | All team members collaborate on same data | contacts, organizations, opportunities |
| **Personal** | Each user has their own private data | tasks, user_preferences |
| **Complex** | Access derived from parent relationship | opportunity_contacts, opportunity_products |

> **Note:** The `opportunity_participants` junction table shown in the Complex pattern example above is a legacy approach. For most use cases, the **Shared Team** pattern (where all authenticated users in the organization can access records) is simpler and preferred. Use `opportunity_participants` only when you need fine-grained per-opportunity access control beyond ownership.

### Key Points

- **Always document `USING (true)`**: Never leave open policies undocumented
- **Use helper functions**: `get_current_sales_id()` simplifies policies
- **Four operations**: Each table needs SELECT, INSERT, UPDATE, DELETE policies
- **GRANT required**: RLS policies need corresponding GRANT statements

---

## Pattern C: View Creation

Denormalized views with proper security context.

**When to use**: Aggregating data for dashboard queries, reducing client-side joins.

### Basic Aggregation View

**Example:** `20251020001702_add_organizations_summary_rls_policies.sql`

```sql
-- CRITICAL: security_invoker = true respects underlying table RLS
DROP VIEW IF EXISTS organizations_summary;

CREATE VIEW organizations_summary
WITH (security_invoker = true)
AS
SELECT
    o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.segment_id,
    -- Aggregations
    COUNT(DISTINCT opp.id) AS nb_opportunities,
    COUNT(DISTINCT c.id) AS nb_contacts,
    MAX(opp.updated_at) AS last_opportunity_activity
FROM organizations o
LEFT JOIN opportunities opp ON (
    (opp.customer_organization_id = o.id OR
     opp.principal_organization_id = o.id OR
     opp.distributor_organization_id = o.id)
    AND opp.deleted_at IS NULL  -- Always filter soft deletes
)
LEFT JOIN contacts c ON (
    c.organization_id = o.id
    AND c.deleted_at IS NULL  -- Always filter soft deletes
)
WHERE o.deleted_at IS NULL  -- Always filter soft deletes
GROUP BY o.id;

-- Required: Grant access to view
GRANT SELECT ON organizations_summary TO authenticated;

-- Required: Document the view's purpose
COMMENT ON VIEW organizations_summary IS
    'Aggregated view of organizations with counts. Uses security_invoker to enforce RLS.';
```

### View Security Comparison

| Attribute | `security_invoker = true` | `security_invoker = false` (default) |
|-----------|---------------------------|--------------------------------------|
| **RLS Enforcement** | Respects underlying table RLS | Bypasses RLS (runs as owner) |
| **Use For** | User-facing data | Admin-only system views |
| **PostgreSQL Version** | 15+ required | All versions |
| **Security Risk** | Low | High - potential data leak |

### Key Points

- **Always use `security_invoker = true`**: PostgreSQL 15+ default is FALSE
- **Filter soft deletes**: Every JOIN should include `deleted_at IS NULL`
- **GRANT SELECT required**: Views need explicit grants
- **COMMENT ON VIEW**: Document purpose for maintainability
- **DROP before CREATE**: Views can't be modified, must be replaced

---

## Pattern D: Soft Delete

Recoverable deletion using `deleted_at` timestamp.

**When to use**: All tables with business data that might need recovery.

### Soft Delete Column

```sql
-- Standard soft delete column
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Soft delete record (don't use DELETE)
UPDATE opportunities SET deleted_at = NOW() WHERE id = 123;

-- Restore record
UPDATE opportunities SET deleted_at = NULL WHERE id = 123;
```

### Cascade Soft Delete Function

**Example:** `20251221135232_complete_soft_delete_cascade.sql`

```sql
-- Archive function with cascading soft delete
CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Archive the opportunity
  UPDATE opportunities
  SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  -- Cascade archive to all related tables
  UPDATE activities
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE "opportunityNotes"
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE tasks
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- P0 FIX: Junction tables must also be cascaded
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_products
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION archive_opportunity_with_relations(BIGINT) TO authenticated;
```

### Unarchive Function (Symmetrical)

```sql
-- Restore function - symmetrical to archive
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
  UPDATE activities SET deleted_at = NULL WHERE opportunity_id = opp_id;
  UPDATE "opportunityNotes" SET deleted_at = NULL WHERE opportunity_id = opp_id;
  UPDATE tasks SET deleted_at = NULL WHERE opportunity_id = opp_id;
  UPDATE opportunity_contacts SET deleted_at = NULL WHERE opportunity_id = opp_id;
  UPDATE opportunity_products SET deleted_at = NULL WHERE opportunity_id = opp_id;
END;
$$;
```

### Hard Delete vs Soft Delete Comparison

| Aspect | Hard Delete | Soft Delete |
|--------|-------------|-------------|
| **SQL Command** | `DELETE FROM table WHERE id = X` | `UPDATE table SET deleted_at = NOW() WHERE id = X` |
| **Recovery** | Impossible without backup | `SET deleted_at = NULL` |
| **Foreign Keys** | Cascades automatically | Must cascade manually (function) |
| **Query Complexity** | Simple | Requires `WHERE deleted_at IS NULL` everywhere |
| **Storage** | Data removed | Data preserved |
| **Audit Trail** | Lost | Preserved |
| **Use When** | Test data, GDPR right-to-delete | Business data, audit requirements |

### Key Points

- **Cascade functions must be complete**: Include ALL related tables (junction tables!)
- **Views must filter**: `WHERE deleted_at IS NULL` in all views
- **Symmetrical restore**: `unarchive` function must mirror `archive`
- **Use functions**: Don't scatter soft delete logic across application code

---

## Pattern E: Audit Trail

Tracking who created and modified records.

**When to use**: All tables with business data.

### Helper Function

**Example:** `20251018204500_add_helper_function_and_audit_trail.sql`

```sql
-- Centralized function to get current user's sales_id
-- Used in RLS policies and audit columns

CREATE OR REPLACE FUNCTION public.get_current_sales_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_sales_id() TO authenticated;

COMMENT ON FUNCTION public.get_current_sales_id() IS
  'Returns the sales_id for the currently authenticated user. Used in RLS policies and audit trails.';
```

### Audit Columns

```sql
-- Add audit columns to existing table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS created_by bigint
    DEFAULT public.get_current_sales_id()  -- Auto-populates on INSERT
    REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS updated_by bigint
    REFERENCES sales(id) ON DELETE SET NULL;

COMMENT ON COLUMN contacts.created_by IS
  'Sales rep who created this contact. Auto-populated on INSERT.';
COMMENT ON COLUMN contacts.updated_by IS
  'Sales rep who last updated this contact. Auto-populated by trigger.';
```

### Auto-Update Trigger

```sql
-- Trigger function to set updated_by automatically
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.updated_by := public.get_current_sales_id();
  RETURN NEW;
END;
$$;

-- Apply trigger to table
DROP TRIGGER IF EXISTS set_updated_by_contacts ON contacts;
CREATE TRIGGER set_updated_by_contacts
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();
```

### Audit Column Reference

| Column | Type | Auto-Population | Purpose |
|--------|------|-----------------|---------|
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | When record was created |
| `updated_at` | `TIMESTAMPTZ` | Trigger | When record was last modified |
| `created_by` | `BIGINT` | `DEFAULT get_current_sales_id()` | Who created the record |
| `updated_by` | `BIGINT` | Trigger | Who last modified the record |
| `deleted_at` | `TIMESTAMPTZ` | Manual | When record was soft-deleted |

### Key Points

- **`created_by` uses DEFAULT**: Automatically set on INSERT
- **`updated_by` uses TRIGGER**: Automatically set on UPDATE
- **ON DELETE SET NULL**: Preserve audit history when user deleted
- **SECURITY DEFINER**: Required to access `auth.uid()` from trigger context

---

## Pattern F: RPC Functions

Server-side functions for atomic multi-table operations.

**When to use**: Operations that touch multiple tables atomically.

### Optimistic Locking Pattern

**Example:** `20251222034729_add_opportunity_version_column.sql`

```sql
-- Version column for conflict detection
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN opportunities.version IS
  'Optimistic locking version - increments on each update. '
  'Used to detect concurrent edit conflicts.';

-- Auto-increment trigger
CREATE OR REPLACE FUNCTION public.increment_opportunity_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := GREATEST(OLD.version + 1, NEW.version);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_version_increment
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_opportunity_version();
```

### Multi-Table Atomic Operation

```sql
-- RPC function for atomic opportunity + products sync
CREATE OR REPLACE FUNCTION public.sync_opportunity_with_products(
  opportunity_data jsonb,
  products_to_create jsonb,
  products_to_update jsonb,
  product_ids_to_delete integer[],
  expected_version integer DEFAULT NULL  -- Optimistic locking
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  opportunity_id BIGINT;
  rows_updated INTEGER;
BEGIN
  -- Update with version check
  IF expected_version IS NOT NULL THEN
    UPDATE opportunities SET
      name = opportunity_data->>'name',
      -- ... other columns
      updated_at = NOW()
    WHERE id = (opportunity_data->>'id')::BIGINT
      AND version = expected_version  -- Optimistic lock check
    RETURNING id INTO opportunity_id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    IF rows_updated = 0 THEN
      -- Version mismatch - concurrent modification detected
      RAISE EXCEPTION 'CONFLICT: This opportunity was modified by another user. [expected_version=%, id=%]',
        expected_version,
        (opportunity_data->>'id')::BIGINT
        USING ERRCODE = 'serialization_failure';  -- 40001
    END IF;
  END IF;

  -- Create new products
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (opportunity_id, product_name, ...)
    SELECT opportunity_id, p->>'product_name', ...
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- Soft delete removed products (Constitution principle)
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    UPDATE opportunity_products
    SET deleted_at = NOW()
    WHERE id = ANY(product_ids_to_delete)
      AND deleted_at IS NULL;
  END IF;

  -- Return updated record with new version
  RETURN jsonb_build_object('data', ...);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.sync_opportunity_with_products(...) TO authenticated;
```

### SECURITY DEFINER vs INVOKER Comparison

| Aspect | SECURITY DEFINER | SECURITY INVOKER |
|--------|------------------|------------------|
| **Permissions** | Runs as function owner | Runs as calling user |
| **RLS Enforcement** | Bypasses RLS | Respects RLS |
| **Use When** | System operations, helper functions | User operations |
| **Risk Level** | Higher (privilege escalation) | Lower |
| **`search_path` Required** | Yes, always set explicitly | Optional |

### Key Points

- **Always set `search_path`**: Prevents search_path injection attacks
- **Use SECURITY DEFINER sparingly**: Only for helper functions needing elevated access
- **JSONB for complex input**: Clean interface for multi-row operations
- **Return new version**: Client needs updated version for next save
- **Soft delete in functions**: Respect soft delete even in batch operations

---

## Pattern G: Enum Types

Type-safe constrained values.

**When to use**: Columns with fixed set of allowed values.

### Creating Enum Types

**Example:** `20251129040323_add_sample_status_enum.sql`

```sql
-- Create enum with DO block for idempotency
DO $$ BEGIN
    CREATE TYPE "public"."sample_status" AS ENUM (
        'sent',
        'received',
        'feedback_pending',
        'feedback_received'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "public"."sample_status" OWNER TO "postgres";

-- Use enum in column
ALTER TABLE "public"."activities"
ADD COLUMN IF NOT EXISTS "sample_status" "public"."sample_status";

-- Document the enum values
COMMENT ON COLUMN "public"."activities"."sample_status" IS
    'Status of sample activities. Values: sent, received, feedback_pending, feedback_received';
```

### Adding Values to Existing Enum

```sql
-- Safe enum extension with DO block
DO $$ BEGIN
    ALTER TYPE "public"."interaction_type" ADD VALUE IF NOT EXISTS 'sample';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "public"."interaction_type" ADD VALUE IF NOT EXISTS 'note';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
```

### Enum Naming Convention

| Convention | Example |
|------------|---------|
| **Type name** | `snake_case`, singular: `sample_status`, `interaction_type` |
| **Values** | `snake_case`: `feedback_pending`, `closed_won` |
| **Prefix** | Optional, for disambiguation: `opportunity_stage` |

### Key Points

- **DO block for idempotency**: Prevents errors on re-run
- **Cannot remove values**: Enum values can only be added, never removed
- **ADD VALUE IF NOT EXISTS**: PostgreSQL 10+ feature
- **CHECK constraint alternative**: For simpler cases, use `CHECK (status IN ('a', 'b'))`

---

## Pattern H: Foreign Keys

Referential integrity with cascading behavior.

**When to use**: Every relationship between tables.

### ON DELETE CASCADE Pattern

**Example:** `20251129050428_add_distributor_principal_authorizations.sql`

```sql
-- Use CASCADE when child records should be deleted with parent
CREATE TABLE distributor_principal_authorizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- CASCADE: When org deleted, authorization deleted
  distributor_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  principal_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- SET NULL: Preserve audit when user deleted
  created_by BIGINT REFERENCES sales(id) ON DELETE SET NULL,

  -- Constraints for business rules
  CONSTRAINT uq_distributor_principal_authorization UNIQUE (distributor_id, principal_id),
  CONSTRAINT valid_authorization_dates CHECK (
    expiration_date IS NULL OR expiration_date > authorization_date
  ),
  CONSTRAINT no_self_authorization CHECK (distributor_id <> principal_id)
);
```

### Self-Referencing Foreign Key

```sql
-- Self-reference for hierarchical data
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS related_opportunity_id BIGINT
    REFERENCES opportunities(id);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_related_opportunity_id
  ON opportunities(related_opportunity_id)
  WHERE related_opportunity_id IS NOT NULL;
```

### Foreign Key Cascading Comparison

| Strategy | SQL | Use When |
|----------|-----|----------|
| **CASCADE** | `ON DELETE CASCADE` | Child meaningless without parent (junction tables) |
| **SET NULL** | `ON DELETE SET NULL` | Preserve data, clear reference (audit columns) |
| **RESTRICT** | `ON DELETE RESTRICT` | Prevent deletion if children exist |
| **NO ACTION** | Default | Same as RESTRICT, checks deferred |

### Key Points

- **Junction tables use CASCADE**: `opportunity_contacts`, `opportunity_products`
- **Audit columns use SET NULL**: Preserve history when user deleted
- **Always add indexes**: Foreign key columns need indexes for JOIN performance
- **CHECK constraints**: Add business rules beyond referential integrity

---

## Pattern I: Indexes

Query optimization strategies.

**When to use**: Foreign keys, frequently filtered columns, partial result sets.

### Partial Indexes (Filtered)

**Example:** `20251130042855_add_performance_indexes.sql`

```sql
-- Index only active records (excludes soft-deleted)
CREATE INDEX IF NOT EXISTS idx_activities_activity_date_active
ON activities(activity_date)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_activities_activity_date_active IS
'Performance index for dashboard activity counts. Excludes soft-deleted records.';

-- Index only incomplete tasks
CREATE INDEX IF NOT EXISTS idx_tasks_sales_due_date_incomplete
ON tasks(sales_id, due_date)
WHERE completed = false;

-- Index only open opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_active
ON opportunities(stage)
WHERE deleted_at IS NULL
  AND stage NOT IN ('closed_won', 'closed_lost');
```

### Composite Index (Multi-Column)

```sql
-- Order columns by selectivity (most selective first)
CREATE INDEX IF NOT EXISTS idx_opportunity_contacts_is_primary
  ON opportunity_contacts(opportunity_id, is_primary)
  WHERE is_primary = true;

-- Index for active authorizations lookup
CREATE INDEX idx_dpa_active
ON distributor_principal_authorizations(distributor_id, principal_id)
  WHERE deleted_at IS NULL AND is_authorized = true;
```

### Covering Index (Index-Only Scan)

```sql
-- Include name for index-only scan on principal JOINs
CREATE INDEX IF NOT EXISTS idx_organizations_principal
ON organizations(id, name)
WHERE organization_type = 'principal' AND deleted_at IS NULL;

COMMENT ON INDEX idx_organizations_principal IS
'Covering index for principal pipeline view. Includes id and name for index-only scans.';
```

### Index Naming Convention

```
idx_[table]_[columns]_[filter]

Examples:
- idx_activities_activity_date_active
- idx_tasks_sales_due_date_incomplete
- idx_opportunities_stage_active
- idx_dpa_distributor_id (simple FK index)
```

### Index Strategy Reference

| Index Type | Pattern | Use When |
|------------|---------|----------|
| **Partial** | `WHERE deleted_at IS NULL` | Most queries filter soft deletes |
| **Composite** | `(col1, col2)` | Multi-column WHERE clauses |
| **Covering** | `(id, name)` | Avoid table lookup in JOINs |
| **FK Index** | `(foreign_key_id)` | Every foreign key column |

### Key Points

- **Partial indexes are smaller**: Exclude soft-deleted records
- **Column order matters**: Most selective first in composite indexes
- **Covering indexes**: Include columns needed in SELECT/JOIN
- **Verify with EXPLAIN**: Test index usage with `EXPLAIN ANALYZE`

---

## Pattern J: Multi-Tenant Isolation

Team-based data separation patterns.

**When to use**: Current single-company model, with future multi-tenant expansion path.

### Current Architecture: Shared Team

```sql
-- ARCHITECTURE: Single Company with Shared Team Access
--
-- This CRM is designed for a SINGLE ORGANIZATION with multiple sales users
-- who collaborate on the same customer base. All authenticated users see all
-- opportunities, contacts, organizations, and shared data.
--
-- SECURITY MODEL:
-- - Shared Data (opportunities, contacts, organizations): All team members
-- - Personal Data (tasks): Only creator can view/edit
-- - Authentication is the only boundary (external users are anon role)
```

### Helper Function for Future Expansion

```sql
-- Placeholder for future multi-tenant expansion
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS BIGINT AS $$
  -- NOTE: Currently returns NULL - no company isolation implemented
  -- To enable company isolation:
  -- 1. Add sales.company_id column
  -- 2. Backfill with actual company assignments
  -- 3. Replace this query:
  --    SELECT company_id FROM public.sales WHERE user_id = auth.uid() LIMIT 1;
  SELECT NULL::BIGINT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;
```

### Multi-Tenant Expansion Path

When expanding to multi-tenant SaaS:

```sql
-- Step 1: Add company_id to sales table
ALTER TABLE sales ADD COLUMN company_id BIGINT REFERENCES organizations(id);

-- Step 2: Update helper function
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS BIGINT AS $$
  SELECT company_id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Step 3: Update RLS policies
CREATE POLICY company_isolation_contacts ON contacts
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE company_id = get_current_user_company_id()
    )
  );
```

### Key Points

- **Document the architecture**: Make shared access intentional, not accidental
- **Placeholder functions**: Enable future expansion without breaking changes
- **RLS policies ready**: Current policies can be extended with company checks
- **Helper functions**: Centralize tenant logic for consistent enforcement

---

## Pattern K: JSONB RPC Functions

Server-side functions accepting JSONB parameters for complex operations.

**When to use**: Multi-field inputs, optional parameters, atomic multi-table operations.

### Basic JSONB RPC Pattern

**Example:** `20260111130300_create_log_activity_with_task.sql`

```sql
-- RPC function with JSONB input for flexible parameter handling
CREATE OR REPLACE FUNCTION log_activity_with_task(
  p_activity JSONB,
  p_task JSONB DEFAULT NULL  -- Optional second JSONB object
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER               -- Respects RLS (user context)
SET search_path TO 'public'    -- Security: prevent search_path injection
AS $$
DECLARE
  v_activity_id BIGINT;
  v_task_id BIGINT;
  v_current_sales_id BIGINT;
BEGIN
  -- Get current user for audit attribution
  v_current_sales_id := get_current_sales_id();

  IF v_current_sales_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated or sales record not found';
  END IF;

  -- ============================================
  -- INPUT VALIDATION (Fail Fast)
  -- ============================================
  IF p_activity IS NULL THEN
    RAISE EXCEPTION 'Activity data is required';
  END IF;

  -- Validate required fields exist
  IF p_activity->>'activity_type' IS NULL THEN
    RAISE EXCEPTION 'Activity type is required';
  END IF;

  IF p_activity->>'subject' IS NULL OR trim(p_activity->>'subject') = '' THEN
    RAISE EXCEPTION 'Activity subject is required';
  END IF;

  -- Business rule: must have contact OR organization
  IF (p_activity->>'contact_id') IS NULL AND (p_activity->>'organization_id') IS NULL THEN
    RAISE EXCEPTION 'Activity must have either contact_id or organization_id';
  END IF;

  -- ============================================
  -- INSERT WITH TYPE CASTING
  -- ============================================
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    contact_id,
    organization_id,
    created_by
  ) VALUES (
    (p_activity->>'activity_type')::activity_type,    -- Cast to enum
    (p_activity->>'type')::interaction_type,          -- Cast to enum
    p_activity->>'subject',                           -- Text: no cast needed
    p_activity->>'description',
    COALESCE((p_activity->>'activity_date')::timestamptz, NOW()),  -- Default
    (p_activity->>'contact_id')::bigint,              -- Cast to BIGINT
    (p_activity->>'organization_id')::bigint,
    v_current_sales_id
  )
  RETURNING id INTO v_activity_id;

  -- Optional second insert (conditional)
  IF p_task IS NOT NULL THEN
    IF p_task->>'title' IS NULL OR trim(p_task->>'title') = '' THEN
      RAISE EXCEPTION 'Task title is required when creating follow-up task';
    END IF;

    INSERT INTO tasks (title, contact_id, sales_id, type)
    VALUES (
      p_task->>'title',
      (p_task->>'contact_id')::bigint,
      v_current_sales_id,
      COALESCE((p_task->>'type')::task_type, 'Follow-up'::task_type)
    )
    RETURNING id INTO v_task_id;
  END IF;

  -- ============================================
  -- RETURN STRUCTURED RESULT
  -- ============================================
  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'task_id', v_task_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction rolled back automatically
    RAISE EXCEPTION 'log_activity_with_task failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION log_activity_with_task(JSONB, JSONB) TO authenticated;

COMMENT ON FUNCTION log_activity_with_task IS
'Atomically creates an activity and optionally a follow-up task.
Parameters: p_activity (JSONB, required), p_task (JSONB, optional).
Returns: { success: true, activity_id: bigint, task_id: bigint|null }';
```

### JSONB Array Handling Pattern

**Example:** `20251030132011_add_rpc_backend_validation.sql`

```sql
-- Converting JSONB arrays to PostgreSQL arrays
DECLARE
  contact_ids_array BIGINT[];
BEGIN
  -- Check if JSONB key exists and is not null
  IF opportunity_data ? 'contact_ids' AND opportunity_data->'contact_ids' IS NOT NULL THEN
    -- Convert JSONB array to PostgreSQL BIGINT array
    SELECT ARRAY_AGG((value#>>'{}')::BIGINT)
    INTO contact_ids_array
    FROM jsonb_array_elements(opportunity_data->'contact_ids');
  ELSE
    contact_ids_array := '{}'::BIGINT[];  -- Default empty array
  END IF;

  -- Validate array length for business rules
  IF jsonb_array_length(opportunity_data->'contact_ids') = 0 THEN
    RAISE EXCEPTION 'At least one contact is required';
  END IF;
END;
```

### JSONB Input Validation Checklist

| Validation Type | Pattern | Example |
|-----------------|---------|---------|
| **Required Object** | `IF p_data IS NULL THEN RAISE` | `IF p_activity IS NULL THEN RAISE EXCEPTION 'Activity data is required'` |
| **Required Field** | `IF p_data->>'field' IS NULL` | `IF p_activity->>'subject' IS NULL THEN RAISE EXCEPTION 'Subject required'` |
| **Empty String** | `trim(p_data->>'field') = ''` | `IF trim(p_activity->>'subject') = '' THEN RAISE EXCEPTION 'Subject empty'` |
| **Key Exists** | `p_data ? 'key'` | `IF opportunity_data ? 'contact_ids' THEN ...` |
| **Array Length** | `jsonb_array_length(p_data->'arr')` | `IF jsonb_array_length(products) = 0 THEN RAISE EXCEPTION 'Products required'` |
| **OR Condition** | Multiple field checks | `IF field1 IS NULL AND field2 IS NULL THEN RAISE EXCEPTION 'Need at least one'` |

### Key Points

- **SECURITY INVOKER for user operations**: Respects RLS policies
- **Always set `search_path`**: Prevents injection attacks
- **Validate before insert**: Fail fast with clear error messages
- **Type casting**: Use `::type` for enums, bigint, timestamptz
- **COALESCE for defaults**: `COALESCE((p_data->>'field')::type, default_value)`
- **Return JSONB**: Use `jsonb_build_object()` for structured responses
- **Document parameters**: Use COMMENT ON FUNCTION for API documentation

---

## Pattern L: Unified Timeline Views

UNION ALL views that aggregate multiple entity types into a single sortable stream.

**When to use**: Combining activities, tasks, notes, or other records for timeline displays.

### Basic Timeline View Pattern

**Example:** `20260119000001_create_entity_timeline_view.sql`

```sql
-- ============================================================================
-- STEP 1: Ensure indexes exist on source tables for view performance
-- ============================================================================

-- Indexes on filter columns are CRITICAL for timeline performance
CREATE INDEX IF NOT EXISTS idx_activities_contact_id
  ON activities(contact_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_organization_id
  ON activities(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_entry_date
  ON activities(activity_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_entry_date
  ON tasks(due_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Create unified timeline view with UNION ALL
-- ============================================================================

CREATE OR REPLACE VIEW entity_timeline AS
-- First source: Activities
SELECT
  id,
  'activity'::text AS entry_type,    -- Discriminator column
  type::text AS subtype,             -- Specific type (call, email, etc.)
  subject AS title,                  -- Normalize column names
  description,
  activity_date AS entry_date,       -- Unified date column for sorting
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  NULL::bigint AS sales_id,          -- Column not in activities
  created_at
FROM activities
WHERE deleted_at IS NULL             -- Always filter soft deletes

UNION ALL

-- Second source: Tasks
SELECT
  id,
  'task'::text AS entry_type,
  type::text AS subtype,
  title,
  description,
  due_date AS entry_date,
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  sales_id,                          -- Task-specific column
  created_at
FROM tasks
WHERE deleted_at IS NULL
  AND (snooze_until IS NULL OR snooze_until <= CURRENT_DATE);  -- Business rule

-- ============================================================================
-- STEP 3: Grant and document
-- ============================================================================

GRANT SELECT ON entity_timeline TO authenticated;

COMMENT ON VIEW entity_timeline IS
  'Unified timeline of activities and tasks for contacts/organizations.
   Filter by contact_id or organization_id. Sort by entry_date DESC.
   entry_type: activity | task. subtype: specific type (call, email, etc.).';
```

### Timeline View Design Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Discriminator** | Add `entry_type` column to identify source table |
| **Subtype** | Add `subtype` column for specific classification |
| **Unified Date** | Alias different date columns to single `entry_date` |
| **NULL Placeholders** | Use `NULL::type AS column_name` for missing columns |
| **Soft Delete Filter** | Every branch needs `WHERE deleted_at IS NULL` |
| **Business Rules** | Apply per-branch filters (e.g., snooze logic) |

### Performance Optimization

```sql
-- 1. UNION ALL (not UNION) - No deduplication overhead
-- UNION removes duplicates (slow), UNION ALL keeps all rows (fast)
SELECT ... FROM activities WHERE ...
UNION ALL  -- Use UNION ALL, not UNION
SELECT ... FROM tasks WHERE ...

-- 2. Partial indexes on filter columns
CREATE INDEX idx_activities_contact_id
  ON activities(contact_id)
  WHERE deleted_at IS NULL;  -- Only index non-deleted rows

-- 3. Descending indexes for timeline sorting
CREATE INDEX idx_activities_entry_date
  ON activities(activity_date DESC)  -- DESC matches ORDER BY entry_date DESC
  WHERE deleted_at IS NULL;

-- 4. Covering indexes for common queries
CREATE INDEX idx_activities_timeline_covering
  ON activities(contact_id, activity_date DESC)
  INCLUDE (id, type, subject)  -- Avoid table lookup
  WHERE deleted_at IS NULL;
```

### Adding Sources to Existing Timeline

```sql
-- Extend existing timeline with new source (e.g., notes)
CREATE OR REPLACE VIEW entity_timeline AS
-- ... existing activities SELECT ...
UNION ALL
-- ... existing tasks SELECT ...
UNION ALL
-- New source: Notes
SELECT
  id,
  'note'::text AS entry_type,
  NULL::text AS subtype,           -- Notes don't have subtypes
  title,
  content AS description,
  created_at AS entry_date,        -- Notes use created_at for timeline
  contact_id,
  organization_id,
  opportunity_id,
  created_by,
  NULL::bigint AS sales_id,
  created_at
FROM notes
WHERE deleted_at IS NULL;

-- Remember to add indexes for new source
CREATE INDEX IF NOT EXISTS idx_notes_contact_id
  ON notes(contact_id) WHERE deleted_at IS NULL;
```

### Query Patterns for Timeline Views

```sql
-- Basic timeline query for a contact
SELECT entry_type, subtype, title, entry_date
FROM entity_timeline
WHERE contact_id = 123
ORDER BY entry_date DESC
LIMIT 20;

-- Timeline with pagination
SELECT entry_type, subtype, title, entry_date
FROM entity_timeline
WHERE organization_id = 456
  AND entry_date < '2026-01-15'  -- Cursor-based pagination
ORDER BY entry_date DESC
LIMIT 20;

-- Filtered timeline (only activities)
SELECT entry_type, subtype, title, entry_date
FROM entity_timeline
WHERE contact_id = 123
  AND entry_type = 'activity'
ORDER BY entry_date DESC;
```

### Key Points

- **UNION ALL not UNION**: Avoid deduplication overhead
- **Consistent column structure**: All branches must have identical columns
- **Discriminator column**: `entry_type` identifies source table
- **Index ALL filter columns**: contact_id, organization_id, entry_date
- **DESC indexes for timeline**: Match sort order for optimal performance
- **Soft delete in every branch**: `WHERE deleted_at IS NULL`
- **Business rules per branch**: Apply source-specific filters (snooze, etc.)
- **CREATE OR REPLACE VIEW**: Views can be replaced without DROP

---

## Anti-Patterns

Common mistakes found in actual migrations, with fixes.

### Anti-Pattern 1: Missing Junction Table Cascade

**Problem:** Junction tables not included in soft delete cascade, causing orphan records.

```sql
-- BAD: Missing junction tables in cascade
CREATE OR REPLACE FUNCTION archive_opportunity_with_relations(opp_id BIGINT)
AS $$
BEGIN
  UPDATE opportunities SET deleted_at = NOW() WHERE id = opp_id;
  UPDATE activities SET deleted_at = NOW() WHERE opportunity_id = opp_id;
  UPDATE tasks SET deleted_at = NOW() WHERE opportunity_id = opp_id;
  -- MISSING: opportunity_contacts, opportunity_products!
END;
$$;
```

**Fix:** Include ALL related tables in cascade functions.

```sql
-- GOOD: All related tables included
UPDATE opportunity_contacts SET deleted_at = NOW() WHERE opportunity_id = opp_id;
UPDATE opportunity_products SET deleted_at = NOW() WHERE opportunity_id = opp_id;
```

### Anti-Pattern 2: Missing security_invoker on Views

**Problem:** Views created without `security_invoker` bypass RLS.

```sql
-- BAD: No security_invoker - bypasses RLS (PostgreSQL 15+ default is FALSE)
CREATE VIEW organizations_summary AS
SELECT * FROM organizations;  -- All users see ALL data!
```

**Fix:** Always use `security_invoker = true` on user-facing views.

```sql
-- GOOD: Respects underlying table RLS
CREATE VIEW organizations_summary
WITH (security_invoker = true)
AS
SELECT * FROM organizations;
```

### Anti-Pattern 3: Undocumented Open RLS

**Problem:** `USING (true)` without explanation looks like a security bug.

```sql
-- BAD: Looks like a security vulnerability
CREATE POLICY select_contacts ON contacts
  FOR SELECT USING (true);  -- Why? Bug or intentional?
```

**Fix:** Document the architectural decision.

```sql
-- GOOD: Intent is clear
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT
  TO authenticated
  USING (true);  -- Everyone can see all contacts (small team shared model)
```

### Anti-Pattern 4: Hard Delete in Application Code

**Problem:** Hard delete scattered across codebase, loses audit trail.

```sql
-- BAD: Called from application code
DELETE FROM opportunities WHERE id = 123;
```

**Fix:** Use soft delete functions.

```sql
-- GOOD: Soft delete with cascade
SELECT archive_opportunity_with_relations(123);
```

### Anti-Pattern 5: Missing GRANT on Views

**Problem:** RLS policies without GRANT = "permission denied" errors.

```sql
-- BAD: RLS enabled but no GRANT
CREATE VIEW opportunities_summary WITH (security_invoker = true) AS ...;
-- Error: permission denied for view opportunities_summary
```

**Fix:** Always pair view creation with GRANT.

```sql
-- GOOD: Both required
CREATE VIEW opportunities_summary WITH (security_invoker = true) AS ...;
GRANT SELECT ON opportunities_summary TO authenticated;
```

### Anti-Pattern 6: Non-Idempotent Migrations

**Problem:** Migration fails on re-run.

```sql
-- BAD: Fails if run twice
CREATE TABLE contacts (...);  -- ERROR: relation "contacts" already exists
CREATE INDEX idx_contacts_org ON contacts(organization_id);  -- ERROR: already exists
```

**Fix:** Use `IF NOT EXISTS` everywhere.

```sql
-- GOOD: Safe to re-run
CREATE TABLE IF NOT EXISTS contacts (...);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
```

---

## Migration Safety Checklist

Use this checklist before merging any migration:

### Structure & Naming

- [ ] Table/column names are snake_case
- [ ] Follows column order: PK → FKs → Business → Audit → Constraints
- [ ] Uses BIGINT for IDs (not UUID)
- [ ] Uses TIMESTAMPTZ (not TIMESTAMP)

### Security

- [ ] New table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] All four RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Views use `security_invoker = true`
- [ ] GRANT statements match RLS policies
- [ ] `USING (true)` policies are documented with architecture comment

### Soft Delete & Audit

- [ ] New table has `deleted_at TIMESTAMPTZ` column
- [ ] New table has audit columns (`created_at`, `updated_at`, `created_by`)
- [ ] Cascade functions updated to include new tables
- [ ] Views filter `WHERE deleted_at IS NULL`

### Indexes & Performance

- [ ] Foreign key columns have indexes
- [ ] Frequently filtered columns have partial indexes
- [ ] Index names follow convention: `idx_[table]_[columns]_[filter]`

### Idempotency

- [ ] Uses `CREATE TABLE IF NOT EXISTS`
- [ ] Uses `CREATE INDEX IF NOT EXISTS`
- [ ] Uses `DROP ... IF EXISTS` before CREATE for views/functions
- [ ] Enum additions use `DO $$ ... EXCEPTION WHEN duplicate_object ...`

### Functions & Triggers

- [ ] Functions set `search_path` explicitly
- [ ] SECURITY DEFINER functions have minimal scope
- [ ] Trigger functions are idempotent
- [ ] GRANT EXECUTE statements included

### Documentation

- [ ] COMMENT ON TABLE/COLUMN for new structures
- [ ] COMMENT ON INDEX explaining purpose
- [ ] COMMENT ON FUNCTION with parameter descriptions
- [ ] Migration header comment explaining purpose

### Testing

- [ ] Migration runs successfully on fresh database
- [ ] Migration runs successfully on existing database (idempotent)
- [ ] RLS policies verified with test user
- [ ] Indexes verified with EXPLAIN ANALYZE

---

## Migration File Naming

```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
20251028213020_create_opportunity_contacts_junction_table.sql
20251130042855_add_performance_indexes.sql
20251221135232_complete_soft_delete_cascade.sql
```

**Naming Guidelines:**
- Use descriptive, action-oriented names
- Prefix with action: `create_`, `add_`, `fix_`, `update_`, `remove_`
- Include affected table/feature
- Keep under 60 characters total
