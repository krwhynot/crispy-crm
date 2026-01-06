<context>
Crispy CRM Supabase RLS audit.
Need comprehensive permissions matrix showing all tables, all operations, all roles.
</context>

<goal>
Generate a visual permissions matrix grouped by access pattern.
Use parallel execution to speed up data gathering.
</goal>

<parallel_tasks>
Execute these 4 queries simultaneously, then combine results:

TASK 1 - Raw Policies:
SELECT tablename, policyname, cmd, roles::text,
  COALESCE(qual::text, 'NULL') as using_clause,
  COALESCE(with_check::text, 'NULL') as with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, cmd;

TASK 2 - Table Metadata:
SELECT t.tablename, t.rowsecurity as rls_enabled,
  EXISTS(SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.tablename AND c.column_name = 'deleted_at') as has_soft_delete
FROM pg_tables t WHERE t.schemaname = 'public' ORDER BY t.tablename;

TASK 3 - Policy Counts by Table:
SELECT tablename, 
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_count,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_count,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_count,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_count
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;

TASK 4 - Security Flags:
SELECT tablename, policyname, roles::text, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (roles::text LIKE '%public%' OR roles::text NOT LIKE '%authenticated%')
ORDER BY tablename;
</parallel_tasks>

<combine_results>
After all queries complete, generate this output:

1. PERMISSIONS MATRIX - Group tables by access pattern:

## Team-Wide Access (any authenticated user)
| Table | View | Edit | Add | Delete | Soft-Delete |
|-------|------|------|-----|--------|-------------|
| table_name | ✅ | ✅ | ✅ | ✅ | Yes/No |

## Owner-Only Access (user_id/sales_id/created_by check)
| Table | View | Edit | Add | Delete | Condition |
|-------|------|------|-----|--------|-----------|

## Role-Based Access (admin/manager checks)
| Table | View | Edit | Add | Delete | Required Role |
|-------|------|------|-----|--------|---------------|

## Read-Only Tables (SELECT only)
| Table | View | Notes |
|-------|------|-------|

2. Determine access level from USING clause patterns:
- 'auth.uid()' or 'user_id = auth.uid()' → 🔒 owner
- 'get_current_sales_id()' → 🔒 owner  
- 'is_admin()' → 👑 admin
- 'is_manager_or_admin()' → 👑 manager+
- 'true' or 'deleted_at IS NULL' only → ✅ all
- {public} in roles → 🔓 public (flag!)
- No policy for operation → ❌ blocked

3. SECURITY CONCERNS section:
- Tables with {public} role (should be {authenticated})
- Tables with RLS enabled but missing common operations
- Inconsistent patterns within same table
- Tables without RLS enabled

4. LEGEND at bottom
</combine_results>

<output_format>
# Crispy CRM — RLS Permissions Matrix

Generated: [timestamp]
Total Tables: [count] | Total Policies: [count]

---

## Team-Wide Access
| Table | View | Edit | Add | Delete | Soft-Delete |
|-------|------|------|-----|--------|-------------|

## Owner-Only Access  
| Table | View | Edit | Add | Delete | Condition |
|-------|------|------|-----|--------|-----------|

## Role-Based Access
| Table | View | Edit | Add | Delete | Required Role |
|-------|------|------|-----|--------|---------------|

## Read-Only Tables
| Table | View | Notes |
|-------|------|-------|

---

## ⚠️ Security Concerns
[List issues or "None found ✅"]

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Any authenticated user |
| 🔒 | Owner only |
| 👑 | Admin/Manager required |
| 🔓 | Public (no auth) ⚠️ |
| ❌ | No policy (blocked) |
| 🟡 | Conditional (see notes) |
</output_format>

<constraints>
- Run queries in parallel for speed
- Include ALL tables with RLS enabled
- Flag any {public} role as security concern
- Show soft-delete status per table
- Group by access pattern, not alphabetically
- If a table has mixed patterns (e.g., SELECT=all, UPDATE=owner), put in Role-Based section with notes
</constraints>