# Database Patterns

## Purpose

Document database design patterns for Atomic CRM using Supabase PostgreSQL with RLS. Covers migrations, two-layer security (GRANT + RLS), enum types, helper functions, triggers, and role-based permissions.

## Core Principle: Two-Layer Security

**Critical Rule:** PostgreSQL needs BOTH grants AND RLS policies.

**Security Model:**
1. **GRANT** - Table-level access permissions
2. **RLS Policies** - Row-level filtering

❌ **Common mistake:** RLS without GRANT = "permission denied" errors

## Pattern 1: Creating Migrations

### Correct Pattern

**From CLAUDE.md:**

```bash
# ✅ CORRECT - Use Supabase CLI
npx supabase migration new add_contact_tags
# Generates: 20250126143000_add_contact_tags.sql

# ❌ WRONG - Manual numbering
# 001_add_contact_tags.sql
# File won't be ordered correctly
```

**Migration File Structure:**

```sql
-- =====================================================================
-- Feature Name: Role-Based Permission System
-- =====================================================================
-- Description: Implements 3-tier role system
-- Date: 2025-11-11
-- Author: System
-- =====================================================================

-- PART 1: Create Types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

COMMENT ON TYPE user_role IS 'User roles: admin (full access), manager (edit all, no delete), rep (edit own only, no delete)';

-- PART 2: Create Tables
CREATE TABLE example_table (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PART 3: Enable RLS
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- PART 4: GRANT Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON example_table TO authenticated;
GRANT USAGE ON SEQUENCE example_table_id_seq TO authenticated;

-- PART 5: Create RLS Policies
CREATE POLICY select_example ON example_table
  FOR SELECT TO authenticated
  USING (true);

-- PART 6: Verification
DO $$
BEGIN
  RAISE NOTICE 'Migration applied successfully';
END $$;
```

**Key Features:**
- Header with description
- Numbered parts for organization
- Comments explaining each section
- Verification block at end

## Pattern 2: Two-Layer Security (GRANT + RLS)

### Correct Pattern

**From `20251111121526_add_role_based_permissions.sql:153`:**

```sql
-- Step 1: Enable RLS on table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Step 2: GRANT table-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Step 3: CREATE RLS policies for row-level filtering
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Why Both Layers:**

```
┌─────────────────────────────────────────┐
│ Authentication Layer (Supabase Auth)    │
│ - Verifies JWT token                    │
│ - Identifies user (auth.uid())          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ GRANT Layer (Table Access)              │
│ - Can user access this table?           │
│ - authenticated role needs GRANT        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ RLS Policy Layer (Row Filtering)        │
│ - Which rows can user see/modify?       │
│ - Filters based on role/ownership       │
└─────────────────────────────────────────┘
```

### ❌ WRONG: Only RLS, No GRANT

```sql
-- ❌ WRONG - RLS without GRANT
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- Result: "permission denied for table contacts"
-- Why: authenticated role has no GRANT on table
```

### ❌ WRONG: Only GRANT, No RLS

```sql
-- ❌ WRONG - GRANT without RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

-- Result: All authenticated users see ALL rows
-- Why: No row-level filtering, RLS not enabled
```

## Pattern 3: Role-Based Permissions

### Helper Functions Pattern

**From `20251111121526_add_role_based_permissions.sql:51`:**

```sql
-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_role() IS 'Returns the role of the currently authenticated user';

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin role';

-- Check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's sales_id
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Why SECURITY DEFINER:**
- Runs with definer's privileges (bypasses RLS)
- Needed to query sales table from RLS context
- Stable for performance (result cacheable)

### RLS Policies with Role Checks

**Personal Ownership Pattern (Tasks):**

```sql
-- SELECT: All authenticated users can view all tasks
CREATE POLICY select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Users can only create tasks assigned to themselves
CREATE POLICY insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = public.current_sales_id());

-- UPDATE: Reps can only update their own, managers/admins can update all
CREATE POLICY update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

-- DELETE: Only admins can delete tasks
CREATE POLICY delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Shared Resource Pattern (Contacts, Organizations):**

```sql
-- All can view and edit, only admins can delete
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Permission Matrix:**

| Resource | Admin | Manager | Rep |
|----------|-------|---------|-----|
| **Shared (Contacts/Orgs/Products)** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ All | ✅ All | ✅ All |
| Delete | ✅ | ❌ | ❌ |
| **Personal (Tasks/Notes)** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ All | ✅ All | ✅ Own |
| Delete | ✅ | ❌ | ❌ |
| **Opportunities** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ (assigned to self) |
| Edit | ✅ All | ✅ All | ✅ Own |
| Delete | ✅ | ❌ | ❌ |

## Pattern 4: Enum Types

### Correct Pattern

**From `20251018152315_cloud_schema_fresh.sql:22`:**

```sql
-- Create enum type
CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

ALTER TYPE public.priority_level OWNER TO postgres;

-- Use in table
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  priority priority_level DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Adding Enum Values (Safe):**

```sql
-- Add new enum value (safe, can't be removed)
ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'urgent' AFTER 'critical';
```

**Removing Enum Values (Unsafe):**

```sql
-- ❌ WRONG - Can't remove enum values in PostgreSQL
-- ALTER TYPE priority_level DROP VALUE 'urgent'; -- Not supported!

-- ✅ CORRECT - Deprecate with comments, create new enum
COMMENT ON TYPE priority_level IS 'DEPRECATED: urgent value no longer used. Use critical instead.';

-- Or create new enum and migrate
CREATE TYPE priority_level_v2 AS ENUM ('low', 'medium', 'high', 'critical');
-- Then migrate data and swap types
```

**Common Enums in Atomic CRM:**

```sql
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');
CREATE TYPE task_type AS ENUM ('Call', 'Email', 'Meeting', 'Follow-up', 'None');
CREATE TYPE opportunity_stage AS ENUM (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'awaiting_response',
  'closed_won',
  'closed_lost'
);
CREATE TYPE organization_type AS ENUM (
  'customer',
  'principal',
  'distributor',
  'prospect',
  'partner',
  'unknown'
);
```

## Pattern 5: Triggers

### Sync Trigger Pattern

**From `20251111121526_add_role_based_permissions.sql:353`:**

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role();

COMMENT ON TRIGGER keep_is_admin_synced ON sales IS 'Keeps is_admin column in sync with role column during transition period';
```

**When to Use Triggers:**
- Sync computed fields
- Enforce complex constraints
- Audit changes (created_at, updated_at)
- Cascade updates/deletes

### Updated_at Trigger Pattern

```sql
-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Auth Trigger Pattern

```sql
-- Create sales record when auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.sales (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'rep', -- Default role
    NEW.created_at,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Pattern 6: JSONB Columns

### Correct Pattern

```sql
-- Create table with JSONB array columns
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name TEXT,
  last_name TEXT,

  -- JSONB arrays for multi-valued fields
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example data
INSERT INTO contacts (first_name, last_name, email, phone) VALUES (
  'John',
  'Doe',
  '[{"email": "john@example.com", "type": "Work"}, {"email": "john.doe@personal.com", "type": "Home"}]'::jsonb,
  '[{"number": "555-1234", "type": "Work"}]'::jsonb
);

-- Query JSONB arrays
SELECT first_name, last_name,
       email->0->>'email' AS primary_email
FROM contacts
WHERE email @> '[{"type": "Work"}]'::jsonb;
```

**Why JSONB:**
- Flexible schema (add fields without migration)
- Efficient indexing
- Rich query operators
- Perfect for UI-driven arrays (email, phone, tags)

### GIN Index for JSONB

```sql
-- Index for JSONB queries
CREATE INDEX idx_contacts_email_gin ON contacts USING GIN (email);
CREATE INDEX idx_contacts_tags_gin ON contacts USING GIN (tags);

-- Enables fast queries like:
-- WHERE email @> '[{"type": "Work"}]'::jsonb
-- WHERE tags @> '["vip"]'::jsonb
```

## Pattern 7: Indexes

### Common Index Patterns

```sql
-- Primary key (automatic index)
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY

-- Foreign key index (for joins)
CREATE INDEX idx_tasks_sales_id ON tasks(sales_id);
CREATE INDEX idx_tasks_opportunity_id ON tasks(opportunity_id);

-- Filtered index (for common queries)
CREATE INDEX idx_tasks_incomplete ON tasks(sales_id) WHERE completed = false;
CREATE INDEX idx_opportunities_active ON opportunities(stage) WHERE stage NOT IN ('closed_won', 'closed_lost');

-- Multi-column index (for composite queries)
CREATE INDEX idx_opportunities_stage_priority ON opportunities(stage, priority);

-- Text search index
CREATE INDEX idx_contacts_search_tsv ON contacts USING GIN(search_tsv);

-- Role-based query index
CREATE INDEX idx_sales_role ON sales(role);
```

## Pattern 8: Views for Computed Columns

### Summary View Pattern

```sql
-- View with aggregated data
CREATE OR REPLACE VIEW organizations_summary AS
SELECT
  o.id,
  o.name,
  o.type,
  -- Count relationships
  COUNT(DISTINCT c.id) AS contact_count,
  COUNT(DISTINCT opp.id) AS opportunity_count,
  COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage = 'closed_won') AS won_count,
  -- Computed fields
  COALESCE(SUM(opp.estimated_value) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')), 0) AS pipeline_value,
  MAX(act.created_at) AS last_activity_date
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
LEFT JOIN opportunities opp ON opp.customer_organization_id = o.id
LEFT JOIN activities act ON act.organization_id = o.id
GROUP BY o.id, o.name, o.type;

-- Grant and RLS for view
GRANT SELECT ON organizations_summary TO authenticated;

ALTER VIEW organizations_summary SET (security_invoker = true);
```

**Benefits:**
- Computed columns without denormalization
- Consistent aggregation logic
- Efficient caching (materialized views)
- Simplifies application queries

## Database Decision Tree

```
Need to add table/column?
│
├─ Step 1: Create migration
│  └─ npx supabase migration new <name>
│
├─ Step 2: Define schema
│  ├─ Enum types first
│  ├─ Tables with GENERATED ALWAYS AS IDENTITY
│  └─ JSONB columns for flexible arrays
│
├─ Step 3: Enable RLS
│  └─ ALTER TABLE <name> ENABLE ROW LEVEL SECURITY
│
├─ Step 4: GRANT permissions
│  ├─ GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated
│  └─ GRANT USAGE ON SEQUENCE <table>_id_seq TO authenticated
│
├─ Step 5: CREATE RLS policies
│  ├─ Personal ownership → Check sales_id
│  ├─ Shared resources → Allow all, admin-only delete
│  └─ Role-based → Use helper functions (is_admin, is_manager_or_admin)
│
└─ Step 6: Add indexes
   ├─ Foreign keys
   ├─ Filtered indexes for common queries
   └─ GIN indexes for JSONB
```

## Best Practices

### DO

✅ Use Supabase CLI for migration names (timestamp format)
✅ Enable RLS on ALL tables
✅ GRANT permissions AND create RLS policies (both required)
✅ Use helper functions for role checks (is_admin, current_sales_id)
✅ Create indexes on foreign keys
✅ Use JSONB for flexible arrays
✅ Add comments to types, functions, triggers
✅ Verify migrations with DO block at end
✅ Use GENERATED ALWAYS AS IDENTITY for primary keys
✅ Create enum types for constrained values

### DON'T

❌ Manually number migrations (001_, 002_)
❌ Enable RLS without GRANT (permission denied)
❌ Create RLS policies without enabling RLS
❌ Hardcode role checks in multiple places (use functions)
❌ Skip indexes on foreign keys (slow joins)
❌ Use text columns for enum values (use enum types)
❌ Create triggers without SECURITY DEFINER for RLS context
❌ Remove enum values (deprecate instead)
❌ Skip verification blocks
❌ Use SERIAL for primary keys (use GENERATED ALWAYS AS IDENTITY)

## Testing Database Changes

### Local Testing

```bash
# Reset local database
npx supabase db reset

# Check migration status
npx supabase migration list

# Create test data
npm run db:local:seed-orgs
```

### Dry Run Before Production

```bash
# Validate migration against cloud schema
npm run db:cloud:push:dry-run

# Review diff
npm run db:cloud:diff

# Push to cloud (manual approval)
npm run db:cloud:push
```

## Related Resources

- [security-patterns.md](security-patterns.md) - RLS policy patterns
- [error-handling.md](error-handling.md) - Database error handling
- [testing-patterns.md](testing-patterns.md) - Testing database logic
- [anti-patterns.md](anti-patterns.md) - What NOT to do

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
