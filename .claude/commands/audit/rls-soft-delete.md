---
name: audit:rls-soft-delete
description: Audit RLS policies for soft-delete filtering. Use when checking security policies, debugging "deleted records visible" issues, or reviewing migrations. Triggers on rls, policy, soft delete, deleted_at, security audit, visible deleted.
---

# RLS Soft-Delete Audit

## Purpose

Ensures all SELECT RLS policies filter out soft-deleted records by checking for `deleted_at IS NULL` condition.

## When to Use

- After creating new RLS policies
- When users report seeing deleted records
- During security reviews
- Before deploying migrations with policy changes

## Audit Process

### 1. Find All SELECT Policies
```bash
rg "CREATE POLICY.*SELECT" supabase/migrations/ -A 5
```

### 2. Check for Soft-Delete Filter
Each SELECT policy MUST include:
```sql
deleted_at IS NULL
```

Unless explicitly for admin "show deleted" functionality.

### 3. Common Patterns

**Correct:**
```sql
CREATE POLICY "users_select_own"
ON contacts FOR SELECT
USING (
  sales_id = auth.uid()
  AND deleted_at IS NULL  -- Required!
);
```

**Incorrect (Missing soft-delete filter):**
```sql
CREATE POLICY "users_select_own"
ON contacts FOR SELECT
USING (
  sales_id = auth.uid()
  -- Missing: AND deleted_at IS NULL
);
```

## Tables Requiring Soft-Delete in RLS

All tables with `deleted_at` column:
- contacts
- organizations
- opportunities
- activities
- tasks
- notes
- tags

## Red Flags

- SELECT policy without `deleted_at IS NULL`
- UPDATE policy that could modify `deleted_at` inappropriately
- Missing RLS on tables with sensitive data

## Fix Template

```sql
-- Drop and recreate with soft-delete filter
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name"
ON table_name FOR SELECT
USING (
  -- existing conditions
  AND deleted_at IS NULL
);
```

## Reference

- Engineering Constitution: Soft deletes via deleted_at
- Provider Rules: Filter automatically with .is('deleted_at', null)
