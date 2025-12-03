# Database: Migrations & Enums

## Purpose

Document migration creation patterns and enum type management.

## Pattern: Creating Migrations

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

## Pattern: Enum Types

### Creating Enums

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

### Adding Enum Values (Safe)

```sql
-- Add new enum value (safe, can't be removed)
ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'urgent' AFTER 'critical';
```

### Removing Enum Values (Unsafe)

```sql
-- ❌ WRONG - Can't remove enum values in PostgreSQL
-- ALTER TYPE priority_level DROP VALUE 'urgent'; -- Not supported!

-- ✅ CORRECT - Deprecate with comments, create new enum
COMMENT ON TYPE priority_level IS 'DEPRECATED: urgent value no longer used. Use critical instead.';

-- Or create new enum and migrate
CREATE TYPE priority_level_v2 AS ENUM ('low', 'medium', 'high', 'critical');
-- Then migrate data and swap types
```

### Common Enums in Atomic CRM

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

## Quick Reference

| Action | Command/SQL |
|--------|-------------|
| Create migration | `npx supabase migration new <name>` |
| Reset local DB | `npx supabase db reset` |
| Add enum value | `ALTER TYPE <enum> ADD VALUE IF NOT EXISTS '<value>'` |
| Primary key | `id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY` |

## Related Resources

- [database-security.md](database-security.md) - GRANT + RLS patterns
- [database-roles.md](database-roles.md) - Role-based permissions
- [database-reference.md](database-reference.md) - Decision tree

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
