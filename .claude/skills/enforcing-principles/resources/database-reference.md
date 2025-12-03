# Database: Reference Guide

## Purpose

Quick reference for database decision tree and best practices.

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

## Quick Reference Tables

### Migration Structure

| Part | Content |
|------|---------|
| 1 | Create Types (enums) |
| 2 | Create Tables |
| 3 | Enable RLS |
| 4 | GRANT Permissions |
| 5 | Create RLS Policies |
| 6 | Verification DO block |

### Helper Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `public.user_role()` | `user_role` | Current user's role |
| `public.is_admin()` | `BOOLEAN` | Admin check |
| `public.is_manager_or_admin()` | `BOOLEAN` | Manager+ check |
| `public.current_sales_id()` | `BIGINT` | Current user's ID |

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| B-tree | Default, equality/range | Foreign keys |
| GIN | JSONB containment | `email @> '[{"type": "Work"}]'` |
| Filtered | Common query patterns | `WHERE completed = false` |

### RLS Policy Patterns

| Pattern | USING | WITH CHECK |
|---------|-------|------------|
| Allow all | `(true)` | `(true)` |
| Owner only | `(sales_id = current_sales_id())` | Same |
| Admin only | `(is_admin())` | Same |
| Manager+ | `(is_manager_or_admin() OR owner)` | Same |

## Common Commands

```bash
# Create migration
npx supabase migration new <name>

# Reset local database
npx supabase db reset

# Check migration status
npx supabase migration list

# Seed test data
npm run db:local:seed-orgs

# Dry run against cloud
npm run db:cloud:push:dry-run

# Review diff
npm run db:cloud:diff

# Push to cloud
npm run db:cloud:push
```

## Related Resources

- [database-security.md](database-security.md) - GRANT + RLS patterns
- [database-migrations.md](database-migrations.md) - Migration structure
- [database-roles.md](database-roles.md) - Role-based permissions
- [database-advanced.md](database-advanced.md) - Triggers, JSONB, views
- [anti-patterns-database.md](anti-patterns-database.md) - What NOT to do

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
