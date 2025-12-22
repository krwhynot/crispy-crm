# Supabase Integration Audit Report

**Agent:** 4 - Supabase Integration Auditor
**Date:** 2025-12-21
**Tables Analyzed:** 35+
**Migration Files Reviewed:** 90+

---

## Executive Summary

The Supabase integration demonstrates **good overall security posture** with RLS enabled on all tables and comprehensive soft-delete support. However, there are **P1 issues** with overly permissive RLS policies using `USING (true)` on several tables, and one table (`product_distributors`) is missing soft-delete support. The two-layer security model (GRANT + RLS) is properly implemented across the codebase.

**Risk Level:** Medium
**Recommended Priority:** Address P1 issues in next sprint

---

## RLS Policy Matrix

### Core Tables

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|-------------|--------|--------|--------|--------|--------|
| opportunities | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251116124147 |
| contacts | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251116124147 |
| organizations | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251116124147 |
| activities | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| products | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251117011028 |
| sales | ✅ | ✅ | ✅ | ✅ | ✅ soft | Protected via Edge Function |
| tags | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| notifications | ✅ | ✅ | ✅ | ✅ | ⚠️ service | Uses service role delete |

### Notes Tables

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|-------------|--------|--------|--------|--------|--------|
| contactNotes | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251212034757 |
| opportunityNotes | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251212034757 |
| organizationNotes | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| contact_notes | ✅ | ✅ | ✅ | ✅ | ✅ soft | Migrated table |
| opportunity_notes | ✅ | ✅ | ✅ | ✅ | ✅ soft | Migrated table |
| organization_notes | ✅ | ✅ | ✅ | ✅ | ✅ soft | Migrated table |

### Junction Tables

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|-------------|--------|--------|--------|--------|--------|
| opportunity_contacts | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251129120417 |
| opportunity_participants | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251129170506 |
| interaction_participants | ✅ | ✅ | ✅ | ✅ | ✅ soft | Fixed in 20251129170506 |
| opportunity_products | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| contact_organizations | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| distributor_principal_authorizations | ✅ | ✅ | ✅ | ✅ | ✅ soft | None |
| **product_distributors** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ hard | **P1: USING(true) + hard delete** |

### Other Tables

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|-------------|--------|--------|--------|--------|--------|
| segments | ✅ | ✅ | ✅ | N/A | N/A | Read/Insert only |
| test_user_metadata | ✅ | ✅ | ✅ | ✅ | ✅ | Service role only |
| migration_history | ✅ | ✅ | N/A | N/A | N/A | Read-only |
| audit_trail | ✅ | ✅ | ✅ | N/A | N/A | Append-only |
| tutorial_progress | ✅ | ✅ | ✅ | ✅ | N/A | Per-user scoped |
| dashboard_snapshots | ✅ | ✅ | ✅ | ✅ | ✅ | None |

---

## Security Findings

### P0 - Critical (Data Exposure Risk)

**None identified.** All tables have RLS enabled.

### P1 - High (Policy Gap)

| Table | Issue | File:Line | Fix |
|-------|-------|-----------|-----|
| product_distributors | `USING (true)` for all operations | `20251215054822_08_create_product_distributors.sql:42-51` | Replace with `auth.uid() IS NOT NULL` minimum |
| product_distributors | No soft delete (ON DELETE CASCADE) | `20251215054822_08_create_product_distributors.sql:33` | Add `deleted_at` column |

### P2 - Medium (Overly Permissive - Legacy Fixed)

These were identified and fixed in later migrations:

| Table | Original Issue | Fixed In |
|-------|----------------|----------|
| contacts | `USING (true)` SELECT | 20251116124147_fix_permissive_rls_policies.sql |
| organizations | `USING (true)` SELECT | 20251116124147_fix_permissive_rls_policies.sql |
| opportunities | `USING (true)` SELECT | 20251116124147_fix_permissive_rls_policies.sql |
| opportunity_participants | `USING (true)` | 20251129170506_harden_participant_tables_rls_security.sql |
| interaction_participants | `USING (true)` | 20251129170506_harden_participant_tables_rls_security.sql |

---

## Two-Layer Security Status

### Overview

The codebase implements two-layer security correctly:

1. **GRANT Layer:** `20251029070224_grant_authenticated_permissions.sql` establishes base permissions
2. **RLS Layer:** Individual table policies restrict row-level access

### Table-Level Grants

| Table Category | GRANT SELECT | GRANT INSERT | GRANT UPDATE | GRANT DELETE | Status |
|----------------|--------------|--------------|--------------|--------------|--------|
| Core entities (opportunities, contacts, etc.) | ✅ | ✅ | ✅ | ✅ | Secure |
| Notes tables | ✅ | ✅ | ✅ | ✅ | Secure |
| Junction tables | ✅ | ✅ | ✅ | ✅ | Secure |
| Views (summary, dashboard) | ✅ SELECT only | N/A | N/A | N/A | Secure |

### Key Grant Statements

```sql
-- Base permissions (20251029070224_grant_authenticated_permissions.sql:5-8)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
```

---

## Soft Delete Compliance

### Resources Configuration

From `src/atomic-crm/providers/supabase/resources.ts:78-100`:

```typescript
export const SOFT_DELETE_RESOURCES = [
  "organizations", "contacts", "opportunities",
  "opportunity_participants", "opportunity_contacts",
  "activities", "products", "sales", "tasks",
  "contact_preferred_principals", "segments",
  "contactNotes", "opportunityNotes", "organizationNotes",
  "interaction_participants", "tags", "opportunity_products",
  "notifications", "distributor_principal_authorizations"
] as const;
```

### Tables with deleted_at Column

| Table | Has deleted_at | RLS Filters | Data Provider Respects |
|-------|----------------|-------------|------------------------|
| opportunities | ✅ | ✅ | ✅ (via cascade RPC) |
| contacts | ✅ | ✅ | ✅ |
| organizations | ✅ | ✅ | ✅ |
| activities | ✅ | ✅ | ✅ |
| products | ✅ | ✅ | ✅ |
| tasks | ✅ | ✅ | ✅ |
| sales | ✅ | ✅ | ✅ |
| All *Notes tables | ✅ | ✅ | ✅ |
| distributor_principal_authorizations | ✅ | ✅ | ✅ |
| organization_distributors | ✅ | ✅ | ✅ |
| **product_distributors** | ❌ | N/A | ❌ (hard delete) |

### Hard Delete Violations

| File | Line | Table | Issue | Fix |
|------|------|-------|-------|-----|
| `unifiedDataProvider.ts` | 807 | product_distributors | `.delete()` used for sync | Design decision - junction without audit trail |
| `unifiedDataProvider.ts` | 961 | product_distributors | `.delete()` in delete handler | Same - add `deleted_at` to table |

### Cascade Soft Delete Functions

The opportunity deletion uses proper cascade:

```typescript
// unifiedDataProvider.ts:976-990
const { error: rpcError } = await supabase.rpc(
  'archive_opportunity_with_relations',
  { opp_id: params.id }
);
```

This RPC cascades soft-delete to:
- activities
- opportunityNotes
- opportunity_participants
- tasks
- opportunity_products
- opportunity_contacts

---

## Query Efficiency Issues

### N+1 Patterns Found

**None identified.** The data provider uses batch operations correctly.

### Over-Fetching (SELECT *)

| File | Line | Table | Context | Severity |
|------|------|-------|---------|----------|
| `dataProviderSchemaValidation.test.ts` | 65, 111 | Various | Test file | Low - tests only |
| `product-filtering-integration.test.tsx` | 78+ | products_summary | Test file | Low - tests only |
| `unifiedDataProvider.test.ts` | 66 | contacts_summary | Test file | Low - tests only |

**Finding:** All `SELECT *` usage is in test files, not production code. The data provider uses the base `ra-supabase-core` provider which selects specific columns.

### Direct Supabase Access Violations

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `useCurrentSale.ts` | 3 | Direct import: `import { supabase } from "@/atomic-crm/providers/supabase/supabase"` | **P2 - Medium** |

This violates the constitution's single data provider entry point rule. The hook should use the data provider instead.

---

## Error Handling Compliance

### Fail-Fast Pattern

**Status: COMPLIANT** ✅

The codebase follows fail-fast principles:

1. **No retry logic found** in data provider or services
2. **No circuit breakers** implemented
3. **Errors throw immediately** via `wrapMethod()` in `unifiedDataProvider.ts`

### Error Logging

```typescript
// unifiedDataProvider.ts:194-256
function logError(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  error: unknown
): void {
  // Logs to Sentry via structured logger
  // Logs to console in development
  // Tracks error rate
}
```

### Retry UI Elements

Found "retry" in UI components but these are **user-initiated** (not automatic):
- `ErrorBoundary.tsx` - User clicks retry button
- `ResourceErrorBoundary.tsx` - User clicks retry button
- `ContactImportResult.tsx` - User clicks retry failed imports

**These are acceptable** - they let users manually retry after fixing issues.

---

## Recommendations

### P0 - Immediate Action Required

None.

### P1 - Next Sprint

1. **Add soft delete to product_distributors**
   ```sql
   -- Migration to add deleted_at
   ALTER TABLE product_distributors
     ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

   -- Update RLS policies
   DROP POLICY "Users can view product_distributors" ON product_distributors;
   CREATE POLICY "Users can view product_distributors"
     ON product_distributors FOR SELECT
     USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);
   ```

2. **Tighten product_distributors RLS policies**
   ```sql
   -- Replace USING (true) with auth check
   DROP POLICY "Users can insert product_distributors" ON product_distributors;
   CREATE POLICY "Users can insert product_distributors"
     ON product_distributors FOR INSERT
     WITH CHECK (auth.uid() IS NOT NULL);
   ```

### P2 - Backlog

1. **Refactor useCurrentSale.ts** to use data provider instead of direct Supabase import
2. **Audit SELECT * in tests** to use specific column lists for documentation

---

## Appendix: Migration Timeline

Key security-related migrations in chronological order:

| Date | Migration | Purpose |
|------|-----------|---------|
| 2025-10-18 | cloud_schema_fresh | Initial schema with base RLS |
| 2025-10-29 | grant_authenticated_permissions | Two-layer security base |
| 2025-11-08 | document_rls_security_model | Security documentation |
| 2025-11-08 | fix_rls_policies_role_based_access | Role-based policy fixes |
| 2025-11-16 | fix_permissive_rls_policies | Fixed USING(true) issues |
| 2025-11-17 | fix_tasks_select_policy | Tasks policy fix |
| 2025-11-27 | enhance_rls_security_activities | Activities hardening |
| 2025-11-29 | harden_participant_tables_rls | Participant table security |
| 2025-11-29 | add_soft_delete_rls_filtering | Soft delete in RLS |
| 2025-12-03 | fix_rls_auth_uid_select_wrapper | Auth.uid() wrapper fix |
| 2025-12-12 | align_notes_schemas | Notes table alignment |
| 2025-12-15 | create_product_distributors | **P1: Overly permissive** |
| 2025-12-21 | complete_soft_delete_cascade | Opportunity cascade delete |

---

## Sign-off

- [x] All tables checked for RLS
- [x] Two-layer security verified
- [x] Soft delete compliance checked
- [x] Query patterns analyzed
- [x] Error handling verified fail-fast compliant
- [x] Output file created at specified location
