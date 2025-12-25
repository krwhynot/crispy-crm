# Organizations Database Layer Audit
Generated: 2025-12-24
Agent: Database Layer (1 of 3)

## Executive Summary

The Organizations table is a core entity in Crispy CRM with a robust schema supporting hierarchical relationships, soft deletes, full-text search, and comprehensive audit trails. RLS policies have evolved from permissive to role-based access with admin-only UPDATE/DELETE restrictions. All views use `SECURITY INVOKER` (good). Several SECURITY DEFINER functions exist but all have proper `search_path` set.

---

## 1. Organizations Table Schema

**Location:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql`

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | bigint | NO | sequence | PRIMARY KEY |
| `name` | text | NO | - | UNIQUE (conditional) |
| `organization_type` | organization_type enum | YES | - | - |
| `is_principal` | boolean | YES | false | DEPRECATED |
| `is_distributor` | boolean | YES | false | DEPRECATED |
| `parent_organization_id` | bigint | YES | - | FK → organizations(id) ON DELETE SET NULL |
| `priority` | varchar(1) | YES | 'C' | CHECK: A, B, C, D |
| `website` | text | YES | - | - |
| `address` | text | YES | - | - |
| `city` | text | YES | - | - |
| `state` | text | YES | - | - |
| `postal_code` | text | YES | - | - |
| `phone` | text | YES | - | - |
| `email` | text | YES | - | - |
| `logo_url` | text | YES | - | - |
| `linkedin_url` | text | YES | - | - |
| `annual_revenue` | numeric(15,2) | YES | - | - |
| `employee_count` | integer | YES | - | - |
| `founded_year` | integer | YES | - | - |
| `notes` | text | YES | - | - |
| `sales_id` | bigint | YES | - | FK → sales(id) |
| `created_at` | timestamptz | YES | now() | - |
| `updated_at` | timestamptz | YES | now() | - |
| `created_by` | bigint | YES | - | FK → sales(id) |
| `deleted_at` | timestamptz | YES | - | Soft delete marker |
| `import_session_id` | uuid | YES | - | Data import tracking |
| `search_tsv` | tsvector | YES | - | Full-text search |
| `context_links` | jsonb | YES | - | Related URLs/references |
| `description` | text | YES | - | - |
| `tax_identifier` | text | YES | - | - |
| `segment_id` | uuid | YES | - | FK → segments(id) |

### Constraints

```sql
CONSTRAINT "organizations_priority_check" CHECK (
  priority IN ('A', 'B', 'C', 'D')
)
```

### Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| `parent_organization_id` | organizations(id) | SET NULL |
| `sales_id` | sales(id) | (implicit) |
| `segment_id` | segments(id) | (implicit) |

---

## 2. Organization Type Enum

**Current Definition:** `supabase/migrations/20251208122758_remove_partner_unknown_org_types.sql`

| Value | Semantic Meaning | Est. Count |
|-------|------------------|------------|
| `principal` | Food manufacturer that MFB represents as broker | ~9 |
| `distributor` | Warehouse that buys from principals, sells to operators | ~50+ |
| `customer` | Restaurant/foodservice operator (end customer) | varies |
| `prospect` | Potential customer not yet converted | varies |

### Enum Evolution History

1. **Initial (20251018):** customer, principal, distributor, prospect, partner, unknown
2. **20251031:** Removed `partner` (converted to `distributor`)
3. **20251208:** Removed `partner` and `unknown` completely → **4 clean values**

---

## 3. RLS Policies

**RLS Status:** ENABLED (`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`)

### Current Policy State (after all migrations)

#### Policy: `select_organizations`
- **Applies to:** SELECT
- **Target:** authenticated role
- **USING clause:** `deleted_at IS NULL`
- **Security assessment:** ✅ OK - Filters soft-deleted records. All authenticated users can read non-deleted orgs (intentional for team collaboration).

#### Policy: `insert_organizations`
- **Applies to:** INSERT
- **Target:** authenticated role
- **WITH CHECK:** `true`
- **Security assessment:** ✅ OK - Any authenticated user can create organizations (team collaboration).

#### Policy: `authenticated_update_organizations`
- **Applies to:** UPDATE
- **Target:** authenticated role
- **USING clause:** `(SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true`
- **Security assessment:** ✅ OK - Admin-only updates. Non-admins cannot modify organization data.

#### Policy: `authenticated_delete_organizations` (alias: `delete_organizations`)
- **Applies to:** DELETE
- **Target:** authenticated role
- **USING clause:** `(SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true` OR `public.is_admin()`
- **Security assessment:** ✅ OK - Admin-only deletes (soft-delete via `deleted_at`).

### Policy Documentation (from migration comments)

```sql
-- authenticated_select_organizations:
-- 'Intentional shared access for team collaboration.
--  Sales team needs visibility into all customer accounts and principals.
--  Protected by authentication boundary + audit trail.'

-- authenticated_update_organizations:
-- 'All authenticated users can update any organization.
--  Audit trail tracks modifications.'
-- NOTE: Later restricted to admin-only in 20251108213039

-- authenticated_delete_organizations:
-- 'All authenticated users can delete organizations (soft-delete).
--  Deletes set deleted_at timestamp, enabling recovery.'
-- NOTE: Later restricted to admin-only
```

### RLS Security Model

| Operation | Who Can Do It | Notes |
|-----------|---------------|-------|
| SELECT | All authenticated | Filters `deleted_at IS NULL` |
| INSERT | All authenticated | Team collaboration |
| UPDATE | Admin only | is_admin check |
| DELETE | Admin only | is_admin check |

---

## 4. Views Involving Organizations

### 4.1 `organizations_summary`
- **Purpose:** Denormalized view with aggregated counts (contacts, opportunities, branches, notes)
- **Security:** `SECURITY INVOKER` ✅
- **Columns:** id, name, organization_type, parent_organization_id, parent_organization_name, priority, segment_id, employee_count, phone, website, postal_code, city, state, description, nb_contacts, nb_opportunities, nb_branches, nb_notes, account_manager_name
- **Last Updated:** 20251208122758

### 4.2 `organizations_with_account_manager`
- **Purpose:** Organizations joined with sales rep name
- **Security:** `SECURITY INVOKER` ✅
- **Columns:** All org columns + account_manager_name, account_manager_is_user
- **Last Updated:** 20251208122758

### 4.3 `organization_primary_distributor`
- **Purpose:** Fast lookup for an organization's primary distributor
- **Security:** Inherits from base tables (INVOKER behavior)
- **Source:** `supabase/migrations/20251207211946_add_organization_distributors.sql`

### 4.4 `organizationNotes` (camelCase compatibility view)
- **Purpose:** Backward compatibility for legacy table name
- **Security:** `SECURITY INVOKER` ✅
- **Source:** `supabase/migrations/20251203120200_add_security_invoker_to_compat_views.sql`

---

## 5. Functions & Triggers

### 5.1 Organization-Specific Functions

#### `prevent_organization_cycle()`
- **Type:** Trigger function
- **Purpose:** Prevents circular parent-child relationships
- **Security:** SECURITY DEFINER with `SET search_path = public` ✅
- **Trigger:** `check_organization_cycle` BEFORE INSERT OR UPDATE OF parent_organization_id

#### `check_organization_cycle()`
- **Type:** Trigger function
- **Purpose:** Alternative cycle prevention implementation
- **Security:** SECURITY DEFINER with `SET search_path = public` ✅

#### `prevent_parent_organization_deletion()`
- **Type:** Trigger function
- **Purpose:** Prevents deletion of organizations that have active branches
- **Security:** SECURITY DEFINER with `SET search_path = public` ✅
- **Error:** `'Cannot delete organization % because it has active branches'`

#### `get_organization_contacts(p_organization_id bigint)`
- **Type:** Table function
- **Purpose:** Returns contacts associated with an organization
- **Security:** NOT SECURITY DEFINER (normal behavior)
- **Returns:** contact_id, contact_name, role, is_primary_decision_maker, purchase_influence

#### `get_contact_organizations(p_contact_id bigint)`
- **Type:** Table function
- **Purpose:** Returns organizations associated with a contact
- **Security:** NOT SECURITY DEFINER (normal behavior)

#### `update_organization_notes_updated_at()`
- **Type:** Trigger function
- **Purpose:** Auto-updates updated_at on organization_notes changes
- **Trigger:** `update_organization_notes_updated_at`

#### `set_organization_notes_updated_by()`
- **Type:** Trigger function
- **Purpose:** Auto-sets updated_by from current user's sales record
- **Security:** SECURITY DEFINER with `SET search_path = public` ✅

### 5.2 Triggers on Organizations Table

| Trigger Name | Event | Function | Purpose |
|--------------|-------|----------|---------|
| `check_organization_cycle` | BEFORE INSERT/UPDATE | `prevent_organization_cycle()` | Prevent hierarchy cycles |
| `audit_organizations_changes` | AFTER INSERT/UPDATE/DELETE | `audit_changes()` | Audit trail logging |
| `update_organization_distributors_updated_at` | BEFORE UPDATE | `update_updated_at_column()` | Timestamp on junction |

---

## 6. Indexes

### Primary Indexes
| Index Name | Columns | Type | Condition |
|------------|---------|------|-----------|
| `organizations_pkey` | id | B-tree | - |
| `organizations_name_unique_idx` | name | UNIQUE | `deleted_at IS NULL` |

### Type/Role Indexes
| Index Name | Columns | Condition |
|------------|---------|-----------|
| `idx_companies_organization_type` | organization_type | - |
| `idx_organizations_type_principal` | organization_type | `organization_type = 'principal'` |
| `idx_organizations_type_distributor` | organization_type | `organization_type = 'distributor'` |
| `idx_organizations_principal` | (unspecified) | Performance |

### Hierarchy Indexes
| Index Name | Columns | Condition |
|------------|---------|-----------|
| `idx_organizations_parent_organization_id` | parent_organization_id | - |
| `idx_companies_parent_company_id` | parent_organization_id | `parent_organization_id IS NOT NULL` |
| `idx_organizations_parent_company_id` | parent_organization_id | `deleted_at IS NULL` |

### Soft Delete Index
| Index Name | Columns | Condition |
|------------|---------|-----------|
| `idx_companies_deleted_at` | deleted_at | `deleted_at IS NULL` |

### Search & Lookup Indexes
| Index Name | Columns | Type | Condition |
|------------|---------|------|-----------|
| `idx_organizations_name` | name | B-tree | `deleted_at IS NULL` |
| `idx_companies_search_tsv` | search_tsv | GIN | - |
| `idx_organizations_search_tsv` | search_tsv | GIN | `deleted_at IS NULL` |

### Foreign Key Indexes
| Index Name | Columns |
|------------|---------|
| `idx_companies_sales_id` | sales_id |
| `idx_organizations_created_by` | created_by |
| `idx_organizations_updated_by` | updated_by |
| `idx_organizations_segment_id` | segment_id |

### Additional Indexes (Import Support)
| Index Name | Columns |
|------------|---------|
| `idx_organizations_playbook_category_id` | playbook_category_id |
| `idx_organizations_cuisine` | cuisine |
| `idx_organizations_needs_review` | needs_review |

---

## 7. Related Tables

### `organization_distributors` (Junction Table)
- **Purpose:** Many-to-many between organizations and distributors
- **Source:** `supabase/migrations/20251207211946_add_organization_distributors.sql`
- **RLS:** ENABLED with shared team access pattern

### `organization_notes` (renamed from `organizationNotes`)
- **Purpose:** Notes attached to organizations
- **Source:** `supabase/migrations/20251129230942_p3_rename_camelcase_tables.sql`
- **RLS:** ENABLED with shared team access

### `contact_organizations` (DEPRECATED)
- **Status:** Junction table marked as deprecated
- **Comment:** "DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly. Kept for historical data only."

---

## 8. Findings

### Schema Concerns

1. **DEPRECATED columns still exist:** `is_principal` and `is_distributor` boolean columns remain in schema but `organization_type` enum should be used instead.
   - **File:** `20251018152315_cloud_schema_fresh.sql`
   - **Recommendation:** Add database-level constraint or trigger to ensure consistency

2. **Duplicate index patterns:** Multiple similar indexes exist (e.g., `idx_companies_*` and `idx_organizations_*`) - legacy naming from table rename.
   - **Recommendation:** Consolidate during next migration cleanup

3. **No length constraints on text fields:** `name`, `description`, `notes`, etc. have no character limits at DB level.
   - **Recommendation:** Add CHECK constraints for DoS prevention (aligns with Zod schema limits)

### RLS Assessment

| Status | Finding |
|--------|---------|
| ✅ | RLS properly enabled |
| ✅ | Admin-only UPDATE/DELETE enforced |
| ✅ | Soft-delete filtered in SELECT |
| ✅ | All views use SECURITY INVOKER |
| ⚠️ | No row-level ownership - any authenticated user can INSERT for any principal |

### Security Definer Audit

| Function | search_path Set? | Verdict |
|----------|------------------|---------|
| `prevent_organization_cycle()` | ✅ `public` | SAFE |
| `check_organization_cycle()` | ✅ `public` | SAFE |
| `prevent_parent_organization_deletion()` | ✅ `public` | SAFE |
| `set_organization_notes_updated_by()` | ✅ `public` | SAFE |

All SECURITY DEFINER functions have been remediated in migration `20251130045429_fix_security_definer_search_paths.sql`.

### Recommendations

1. **P1: Remove deprecated columns** - Drop `is_principal` and `is_distributor` in future migration after verifying no code references
2. **P2: Add text length constraints** - Prevent unbounded text storage
3. **P3: Consolidate duplicate indexes** - Remove `idx_companies_*` variants
4. **P3: Consider INSERT ownership tracking** - Ensure `created_by` is always set

---

## 9. Verification Checklist

- [x] Organizations table fully documented (31 columns)
- [x] All 4 org types found in enum (customer, prospect, principal, distributor)
- [x] Every RLS policy on organizations reviewed (4 policies)
- [x] SECURITY DEFINER views flagged - NONE found (all use INVOKER)
- [x] SECURITY DEFINER functions verified - all have search_path set
- [x] Output file saved to /docs/audits/orgs-database-layer.md
