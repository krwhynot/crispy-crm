# Database: Security (GRANT + RLS)

## Purpose

Document the critical two-layer security pattern for Supabase PostgreSQL.

## Core Principle: Two-Layer Security

**Critical Rule:** PostgreSQL needs BOTH grants AND RLS policies.

**Security Model:**
1. **GRANT** - Table-level access permissions
2. **RLS Policies** - Row-level filtering

❌ **Common mistake:** RLS without GRANT = "permission denied" errors

## Pattern: Two-Layer Security (GRANT + RLS)

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

## ❌ WRONG: Only RLS, No GRANT

```sql
-- ❌ WRONG - RLS without GRANT
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- Result: "permission denied for table contacts"
-- Why: authenticated role has no GRANT on table
```

## ❌ WRONG: Only GRANT, No RLS

```sql
-- ❌ WRONG - GRANT without RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

-- Result: All authenticated users see ALL rows
-- Why: No row-level filtering, RLS not enabled
```

## Quick Reference

| Action | SQL Required |
|--------|-------------|
| Enable RLS | `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY` |
| Grant table access | `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated` |
| Grant sequence access | `GRANT USAGE ON SEQUENCE <table>_id_seq TO authenticated` |
| Create policy | `CREATE POLICY <name> ON <table> FOR <action> TO authenticated USING/WITH CHECK` |

## Related Resources

- [database-roles.md](database-roles.md) - Role-based RLS policies
- [database-migrations.md](database-migrations.md) - Migration structure
- [anti-patterns-database.md](anti-patterns-database.md) - Database anti-patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
