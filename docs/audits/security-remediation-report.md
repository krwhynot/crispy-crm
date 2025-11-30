# Security Remediation Report

**Date:** 2025-11-30
**Migration:** `20251130010932_security_invoker_and_search_path_remediation.sql`
**Status:** Ready for Deployment

## Executive Summary

This security audit identified and remediated **three critical vulnerability classes** in the Crispy-CRM Supabase backend:

| Priority | Issue | Count | Status |
|----------|-------|-------|--------|
| P0 | Views with SECURITY DEFINER (default) | 8 | FIXED |
| P0 | Auth functions without search_path hardening | 9 | FIXED |
| P1 | Anon grants on sensitive views | 2+ | FIXED |

## Detailed Findings

### P0: SECURITY DEFINER Views (Critical)

**Risk:** Views without explicit `security_invoker = on` default to SECURITY DEFINER behavior, which executes queries with the view owner's privileges. This bypasses Row Level Security (RLS) policies, potentially exposing data that should be restricted.

**Affected Views:**

| View Name | File | Line | Status |
|-----------|------|------|--------|
| `priority_tasks` | `20251114001720_priority_tasks_view.sql` | 13 | FIXED |
| `principal_opportunities` | `20251113235406_principal_opportunities_view.sql` | 13 | FIXED |
| `principal_pipeline_summary` | `20251118050755_add_principal_pipeline_summary_view.sql` | 12 | FIXED |
| `organizations_summary` | `20251117180837_restore_full_branch_parent_functionality.sql` | 8 | FIXED |
| `contacts_with_account_manager` | `20251022172248_add_account_manager_unique_constraint.sql` | 25 | FIXED |
| `organizations_with_account_manager` | `20251022172248_add_account_manager_unique_constraint.sql` | 36 | FIXED |
| `campaign_choices` | `20251104174935_add_campaign_choices_view.sql` | 4 | FIXED |
| `distinct_product_categories` | `20251030025007_create_distinct_product_categories_view.sql` | 17 | FIXED |

**Views Already Secured:**

| View Name | File | Security Setting |
|-----------|------|------------------|
| `contacts_summary` | `20251126015956_add_contacts_summary_counts.sql` | `security_invoker = true` |
| `products_summary` | `20251104044122_add_products_summary_view.sql` | `security_invoker = on` |
| `opportunities_summary` | `20251104125744_update_opportunities_summary_with_principal_name.sql` | `security_invoker = on` |
| `authorization_status` | `20251129051554_add_check_authorization_view.sql` | `security_invoker = on` |

**Remediation:** All views now include `WITH (security_invoker = on)` in their definition.

### P0: Auth Functions Without search_path (Critical)

**Risk:** SECURITY DEFINER functions without `SET search_path = ''` are vulnerable to search_path hijacking attacks. An attacker could create a malicious function in a schema that appears earlier in the search path, causing the auth function to execute attacker-controlled code with elevated privileges.

**Affected Functions:**

| Function | Original search_path | Status |
|----------|---------------------|--------|
| `user_role()` | Not set | FIXED |
| `is_admin()` | Not set | FIXED |
| `is_manager_or_admin()` | Not set | FIXED |
| `current_sales_id()` | Not set | FIXED |
| `get_current_user_sales_id()` | `public` | FIXED |
| `get_current_user_company_id()` | `public` | FIXED |
| `is_manager()` | Not set | FIXED |
| `is_rep()` | Not set | FIXED |
| `get_current_sales_id()` | `public, auth` | FIXED |

**Remediation:** All auth helper functions now include `SET search_path = ''` and use fully-qualified table names (`public.sales`, `auth.uid()`).

### P1: Anon Grants on Sensitive Views

**Risk:** The `anon` role allows unauthenticated access. Granting SELECT on CRM data views to anon exposes business-critical information to anyone with the API URL.

**Affected Views:**

| View | File | Line |
|------|------|------|
| `organizations_summary` | `20251117180837_restore_full_branch_parent_functionality.sql` | 70 |
| `priority_tasks` | `20251129044526_align_task_type_enum.sql` | 116 |

**Remediation:** `REVOKE ALL ON <view> FROM anon` applied to all sensitive views.

## Migration Details

### What the Migration Does

1. **Drops and recreates 8 views** with `security_invoker = on`
2. **Updates 9 auth functions** to include `SET search_path = ''`
3. **Revokes anon grants** from all sensitive views
4. **Re-grants authenticated access** to ensure no disruption

### Safe Rollback

If issues occur, the migration can be rolled back by:
1. Re-creating views without `security_invoker` option
2. Re-creating functions without `search_path` setting
3. Re-granting anon access (not recommended)

However, rollback is **not recommended** as it re-exposes the security vulnerabilities.

## Deployment Instructions

### Pre-Deployment Checklist

- [ ] Review migration file: `supabase/migrations/20251130010932_security_invoker_and_search_path_remediation.sql`
- [ ] Run dry-run: `npm run db:cloud:push:dry-run`
- [ ] Verify no breaking changes to frontend queries
- [ ] Schedule maintenance window (views will be briefly unavailable)

### Deployment Steps

```bash
# 1. Validate migration
npm run db:cloud:push:dry-run

# 2. Deploy to production
npm run db:cloud:push

# 3. Verify migration applied
npm run db:cloud:status

# 4. Test critical paths
# - Dashboard loads correctly
# - Opportunity list/detail works
# - Contact list/detail works
# - Organization list/detail works
```

### Post-Deployment Verification

Run the following SQL to verify security settings:

```sql
-- Verify views have security_invoker
SELECT c.relname as view_name, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v' AND n.nspname = 'public';

-- Verify functions have search_path
SELECT p.proname, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true;

-- Verify no anon grants on views
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee = 'anon';
```

## Security Best Practices Going Forward

### For New Views

Always include `security_invoker`:

```sql
CREATE VIEW my_view
WITH (security_invoker = on)
AS
SELECT ...;
```

### For New SECURITY DEFINER Functions

Always include empty search_path and use fully-qualified names:

```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS ...
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ... FROM public.my_table WHERE user_id = auth.uid()
$$;
```

### Grant Practices

- **Authenticated:** CRM business data (default)
- **Anon:** Only truly public data (login page, public docs)
- **Service Role:** Edge functions, cron jobs

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL SECURITY INVOKER Views](https://www.postgresql.org/docs/15/sql-createview.html)
- [search_path Security](https://www.postgresql.org/docs/15/runtime-config-client.html#GUC-SEARCH-PATH)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Prepared by:** Claude Code (Security Audit)
**Reviewed by:** Pending
**Approved by:** Pending
