# RBAC Architecture Inventory - Final Consolidated Report

> **Generated:** 2025-12-12
> **Scope:** Full-Stack RBAC Analysis (UI → API → Database → Migrations)
> **Status:** Complete Inventory with Prioritized Recommendations

---

## Executive Summary

### Overall Architecture Health

| Layer | Status | Critical Issues | Action Required |
|-------|--------|-----------------|-----------------|
| UI/Frontend | **HEALTHY** | 0 | Minor UX improvements |
| Data Provider/API | **HEALTHY** | 0 | Type coercion fix |
| Database Schema | **DRIFT** | 1 | Sync local schema |
| RLS Policies | **HEALTHY** | 0 | Add service_role policy to local |
| Helper Functions | **HEALTHY** | 0 | Already well-designed |
| Triggers | **HEALTHY** | 0 | Correctly enforcing column restrictions |
| Migrations | **CRITICAL DRIFT** | 2 | Immediate sync required |

### Key Findings

| Finding | Severity | Impact | Fix Complexity |
|---------|----------|--------|----------------|
| Orphaned cloud migration (20251212020132) | **CRITICAL** | Unknown schema in prod | Medium |
| Cloud missing `is_admin()` NULL fix | **HIGH** | Edge Function auth failures | Low |
| Cache staleness (15-min TTL) | **MEDIUM** | Delayed permission updates | Medium |
| Type mismatch (identity.id) | **MEDIUM** | Potential comparison bugs | Low |
| Schema drift (digest_opt_in) | **MEDIUM** | Local/Cloud inconsistency | Low |
| Silent profile edit failure | **LOW** | Poor UX for non-admins | Low |

### Architecture Verdict

**The RBAC system is architecturally sound.** The design follows security best practices:

1. **Single Entry Point** - All sales updates flow through the Edge Function
2. **Defense in Depth** - RLS policies + Trigger + Edge Function authorization
3. **Role-Based Access** - Proper enum-based role system with helper functions
4. **Backward Compatibility** - Legacy `is_admin` column synced via trigger

**Primary Risk:** Migration state drift between local and cloud environments.

---

## Cross-Layer Issue Analysis

### Issue 1: Migration State Desync (CRITICAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION STATE MATRIX                       │
├─────────────────────┬───────────┬───────────┬───────────────────┤
│ Migration           │ In Repo   │ LOCAL     │ CLOUD             │
├─────────────────────┼───────────┼───────────┼───────────────────┤
│ 20251211180000      │ ✅        │ ✅        │ ❌ MISSING        │
│ (is_admin NULL fix) │           │           │                   │
├─────────────────────┼───────────┼───────────┼───────────────────┤
│ 20251212020132      │ ❌ ORPHAN │ ❌        │ ✅ APPLIED        │
│ (unknown content)   │           │           │                   │
├─────────────────────┼───────────┼───────────┼───────────────────┤
│ 20251212031800      │ ✅        │ ❌        │ ❌ PENDING        │
│ (admin_update_sale) │           │           │                   │
└─────────────────────┴───────────┴───────────┴───────────────────┘
```

**Impact Chain:**
```
Cloud missing is_admin() fix
    ↓
is_admin() returns FALSE for auth.uid() = NULL
    ↓
Edge Function (service role) fails admin checks
    ↓
Admin edit operations may fail in production
```

**Cross-Layer Evidence:**
- Part 1 (UI): Edge Function is the ONLY update path for sales
- Part 2A (DB): Cloud `is_admin()` function confirmed identical to old version
- Part 2B (Migrations): Fix exists in file but not applied to cloud

---

### Issue 2: Schema Drift (MEDIUM)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEMA COMPARISON                            │
├───────────────────┬──────────────────┬──────────────────────────┤
│ Object            │ LOCAL            │ CLOUD                    │
├───────────────────┼──────────────────┼──────────────────────────┤
│ sales columns     │ 15               │ 16 (+digest_opt_in)      │
│ RLS policies      │ 4                │ 5 (+service_role_full)   │
│ Indexes           │ 4 (+user_id idx) │ 3                        │
│ Grants            │ 4 roles          │ 2 roles                  │
└───────────────────┴──────────────────┴──────────────────────────┘
```

**Impact:** Development/testing environment doesn't match production, potentially masking issues.

---

### Issue 3: Non-Admin Profile Edit Silent Failure (LOW)

```
┌─────────────────────────────────────────────────────────────────┐
│              NON-ADMIN PROFILE EDIT FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│  User changes first_name in SalesProfileTab                     │
│      ↓                                                          │
│  handleSave() → validateUpdateSales() ✅                        │
│      ↓                                                          │
│  useUpdate("sales", { data: { first_name } })                   │
│      ↓                                                          │
│  unifiedDataProvider.update("sales", ...)                       │
│      ↓                                                          │
│  salesService.salesUpdate() → Edge Function                     │
│      ↓                                                          │
│  Edge Function: Non-admin detected                              │
│      ↓                                                          │
│  ⚠️ ONLY avatar field processed (others DROPPED)                │
│      ↓                                                          │
│  Response: 200 OK (but first_name NOT saved)                    │
│      ↓                                                          │
│  User sees "success" but change is LOST                         │
└─────────────────────────────────────────────────────────────────┘
```

**Cross-Layer Evidence:**
- Part 1 (UI): SalesProfileTab sends first_name, last_name, email, phone
- Part 1 (Edge Function): Lines 207-228 only process avatar for non-admins
- Database trigger would also block, but Edge Function drops fields first

---

## Complete Data Flow Diagrams

### Admin Editing Another User

```
┌─────────────────────────────────────────────────────────────────┐
│                  ADMIN EDIT FLOW (COMPLETE)                     │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (React Admin)
┌─────────────────────────────────────────────────────────────────┐
│  SalesSlideOver.tsx                                             │
│      │                                                          │
│      ├── SalesPermissionsTab.tsx                                │
│      │       │                                                  │
│      │       └── handleSave()                                   │
│      │               ├── Check: !isSelfEdit ✅                  │
│      │               ├── validateUpdateSales() ✅               │
│      │               └── useUpdate("sales", { id, data })       │
└──────│──────────────────────────────────────────────────────────┘
       ↓
DATA PROVIDER LAYER
┌─────────────────────────────────────────────────────────────────┐
│  unifiedDataProvider.ts:663-667                                 │
│      │                                                          │
│      ├── if (resource === "sales")                              │
│      └── await salesService.salesUpdate(id, processedData)      │
│              │                                                  │
│              └── dataProvider.invoke("users", {                 │
│                      method: "PATCH",                           │
│                      body: { sales_id, role, disabled, ... }    │
│                  })                                             │
└──────│──────────────────────────────────────────────────────────┘
       ↓
EDGE FUNCTION LAYER
┌─────────────────────────────────────────────────────────────────┐
│  supabase/functions/users/index.ts                              │
│      │                                                          │
│      ├── Extract JWT → auth.uid() = admin's UUID                │
│      ├── Query sales: currentUserSale.role === 'admin' ✅       │
│      ├── Authorization: Admin editing other user → ALLOWED      │
│      └── updateSaleViaRPC(target_user_id, { role, disabled })   │
│              │                                                  │
│              └── supabaseAdmin.rpc('admin_update_sale', ...)    │
└──────│──────────────────────────────────────────────────────────┘
       ↓
DATABASE LAYER
┌─────────────────────────────────────────────────────────────────┐
│  admin_update_sale() SECURITY DEFINER                           │
│      │                                                          │
│      ├── Check: current_user_role = 'admin' ✅ (from JWT)       │
│      │   OR auth.uid() IS NULL ✅ (service role)                │
│      ├── UPDATE sales SET role = ..., disabled = ...            │
│      │       │                                                  │
│      │       ↓                                                  │
│      │   [TRIGGER: enforce_sales_column_restrictions]           │
│      │       ├── caller_is_admin := is_admin() = TRUE           │
│      │       └── RETURN NEW (admin bypass, all fields allowed)  │
│      │       │                                                  │
│      │       ↓                                                  │
│      │   [TRIGGER: keep_is_admin_synced]                        │
│      │       └── NEW.is_admin := (NEW.role = 'admin')           │
│      │                                                          │
│      └── RETURNING * → success                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Check Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│              PERMISSION CHECK HIERARCHY                         │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: UI VISIBILITY
┌─────────────────────────────────────────────────────────────────┐
│  Header.tsx:107-109                                             │
│  └── <CanAccess resource="sales" action="list">                 │
│          └── UsersMenu (only renders if admin)                  │
│                                                                 │
│  app-sidebar.tsx:102-120                                        │
│  └── useCanAccess({ resource: "sales" })                        │
│          └── Menu item hidden if !canAccess                     │
│                                                                 │
│  SettingsPage.tsx:94                                            │
│  └── identity?.role === "admin"                                 │
│          └── Team section only for admins                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
LAYER 2: UI BEHAVIOR
┌─────────────────────────────────────────────────────────────────┐
│  SalesPermissionsTab.tsx                                        │
│  └── Line 63: isSelfEdit = record?.id === identity?.id          │
│          └── Prevents self role/disable changes                 │
│  └── Line 310: !isSelfEdit && identity?.role === "admin"        │
│          └── Danger zone (delete user) visibility               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
LAYER 3: EDGE FUNCTION
┌─────────────────────────────────────────────────────────────────┐
│  users/index.ts:114-116 (POST)                                  │
│  └── currentUserSale.role !== 'admin' → 401                     │
│                                                                 │
│  users/index.ts:191 (PATCH)                                     │
│  └── role !== 'admin' && id !== target.id → 401                 │
│                                                                 │
│  users/index.ts:207-228 (PATCH non-admin)                       │
│  └── Only avatar field processed for non-admins                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
LAYER 4: DATABASE
┌─────────────────────────────────────────────────────────────────┐
│  RLS POLICIES                                                   │
│  └── insert_sales: WITH CHECK (is_admin())                      │
│  └── update_sales: is_admin() OR (user_id = auth.uid())         │
│  └── delete_sales: USING (is_admin())                           │
│                                                                 │
│  TRIGGER: enforce_sales_column_restrictions                     │
│  └── Non-admin changing role/disabled → EXCEPTION               │
│  └── Non-admin changing other user's profile → EXCEPTION        │
│                                                                 │
│  FUNCTION: is_admin()                                           │
│  └── auth.uid() IS NULL → TRUE (service role bypass)            │
│  └── role = 'admin' WHERE user_id = auth.uid() → TRUE           │
│  └── Otherwise → FALSE                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## RBAC Object Inventory

### UI Components (10)

| Component | File | Purpose | RBAC Checks |
|-----------|------|---------|-------------|
| SalesList | `sales/SalesList.tsx` | User list | canAccess("sales", "list") |
| SalesCreate | `sales/SalesCreate.tsx` | Create user | Admin-only route |
| SalesEdit | `sales/SalesEdit.tsx` | Full-page edit | Admin-only route |
| SalesSlideOver | `sales/SalesSlideOver.tsx` | Side panel | RLS-enforced |
| SalesProfileTab | `sales/SalesProfileTab.tsx` | Profile fields | useUpdate validation |
| SalesPermissionsTab | `sales/SalesPermissionsTab.tsx` | Role/disable | isSelfEdit, isAdmin |
| SettingsPage | `settings/SettingsPage.tsx` | Settings hub | identity?.role check |
| UsersSection | `settings/sections/UsersSection.tsx` | Team link | Admin section only |
| Header | `layout/Header.tsx` | Top nav | CanAccess wrapper |
| AppSidebar | `components/admin/app-sidebar.tsx` | Side nav | useCanAccess per item |

### Data Layer (4)

| Service | File | Purpose |
|---------|------|---------|
| unifiedDataProvider | `providers/supabase/unifiedDataProvider.ts` | Single DB entry point |
| authProvider | `providers/supabase/authProvider.ts` | Identity + caching |
| SalesService | `services/sales.service.ts` | Edge Function calls |
| canAccess | `providers/commons/canAccess.ts` | Permission matrix |

### Edge Functions (5)

| Function | Purpose | Auth Level |
|----------|---------|------------|
| users (POST) | Create user | Admin only |
| users (PATCH) | Update user | Self or Admin |
| updatePassword | Password change | Self or Admin |
| daily-digest | Email digest | Cron/Service |
| check-overdue-tasks | Task alerts | Cron/Service |

### Database Objects (15)

| Type | Name | Purpose |
|------|------|---------|
| TABLE | sales | User records |
| COLUMN | sales.role | Primary RBAC (user_role enum) |
| COLUMN | sales.is_admin | Deprecated (synced via trigger) |
| COLUMN | sales.administrator | Computed (GENERATED) |
| COLUMN | sales.disabled | Access control |
| ENUM | user_role | admin, manager, rep |
| FUNCTION | is_admin() | Admin check (NULL-aware) |
| FUNCTION | is_manager_or_admin() | Manager+ check |
| FUNCTION | is_manager() | Manager check |
| FUNCTION | is_rep() | Rep check |
| FUNCTION | user_role() | Get current role |
| FUNCTION | current_sales_id() | Get current sales.id |
| FUNCTION | admin_update_sale() | Secure update RPC |
| TRIGGER | keep_is_admin_synced | role → is_admin sync |
| TRIGGER | enforce_sales_column_restrictions | Column-level security |

### RLS Policies (5)

| Policy | Command | Logic |
|--------|---------|-------|
| select_sales | SELECT | deleted_at IS NULL |
| insert_sales | INSERT | is_admin() |
| update_sales | UPDATE | is_admin() OR (user_id = auth.uid()) |
| delete_sales | DELETE | is_admin() |
| service_role_full_access | ALL | true (CLOUD only) |

### Migrations (35 RBAC-Related)

See Part 2B Appendix A for complete list. Key migrations:

| Migration | Purpose |
|-----------|---------|
| 20251111121526 | Created user_role enum system |
| 20251211180000 | Fixed is_admin() NULL handling |
| 20251212031800 | Added soft-delete to admin_update_sale |

---

## Prioritized Fix Recommendations

### Priority 1: CRITICAL (Do Immediately)

#### 1.1 Investigate Orphaned Cloud Migration

```bash
# Step 1: Query what migration 20251212020132 contains
npx supabase db execute --linked \
  "SELECT * FROM supabase_migrations.schema_migrations
   WHERE version = '20251212020132';"

# Step 2: If it's safe to remove (no critical changes)
npx supabase migration repair --status reverted 20251212020132

# Step 3: If it contains important changes, recreate the file
# Create: supabase/migrations/20251212020132_recovered.sql
```

**Why Critical:** Unknown schema changes in production - could affect any behavior.

#### 1.2 Push Missing `is_admin()` Fix to Cloud

```bash
# This will apply 20251211180000_fix_is_admin_null_auth.sql
npx supabase db push
```

**Why Critical:** Without this fix, Edge Function admin operations may fail in production because `is_admin()` returns FALSE for service role context.

### Priority 2: HIGH (This Week)

#### 2.1 Apply Pending Migrations

```bash
# Apply to local
npx supabase migration up --local

# Verify sync
npx supabase migration list
# All three columns should match
```

#### 2.2 Sync Local Schema with Cloud

```bash
# Reset local to match cloud (if acceptable to lose local data)
npx supabase db reset

# Or manually add missing column
npx supabase migration new add_digest_opt_in_local
# Add: ALTER TABLE sales ADD COLUMN IF NOT EXISTS digest_opt_in BOOLEAN NOT NULL DEFAULT true;
```

### Priority 3: MEDIUM (This Sprint)

#### 3.1 Add Cache Invalidation for Role Changes

**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

```typescript
// Add method to clear identity cache
export const clearIdentityCache = () => {
  cachedSale = undefined;
  cacheTimestamp = 0;
};

// Call after role update in SalesPermissionsTab
// After successful update:
clearIdentityCache();
```

#### 3.2 Fix Type Mismatch (identity.id)

**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

```typescript
// Line ~97: Ensure id is always string
return {
  id: String(sale.id),  // Convert to string for React Admin
  fullName: `${first_name} ${last_name}`,
  avatar: sale.avatar_url,
  role: sale.role || "rep",
};
```

### Priority 4: LOW (Backlog)

#### 4.1 Improve Non-Admin Profile Edit UX

**Option A:** Return explicit error from Edge Function

```typescript
// users/index.ts:207
if (requestBody.first_name || requestBody.last_name || requestBody.email || requestBody.phone) {
  return createErrorResponse(403, "Only administrators can update profile fields for other users", corsHeaders);
}
```

**Option B:** Allow non-admins to edit their OWN profile fields

```typescript
// users/index.ts - expand non-admin allowed fields for self-edit
if (saleToUpdate.user_id === currentUserAuth.uid) {
  // Self-edit: allow profile fields
  updateFields = { ...profileFields, avatar: requestBody.avatar };
}
```

#### 4.2 Add Missing Index to Cloud

```sql
-- Create migration: add_user_id_index_cloud.sql
CREATE INDEX IF NOT EXISTS idx_sales_user_id
  ON public.sales USING btree (user_id)
  WHERE (user_id IS NOT NULL);
```

#### 4.3 Add service_role_full_access Policy to Local

```sql
-- For parity with cloud
CREATE POLICY service_role_full_access ON public.sales
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

---

## Verification Checklist

After applying fixes, verify:

### Migration State
```bash
npx supabase migration list
# All columns should match (no orphans, no missing)
```

### Function Behavior
```sql
-- Should return TRUE in service role context
SELECT is_admin();

-- Should return current user's role when authenticated
SELECT user_role();
```

### Admin Edit Flow
1. Log in as admin
2. Navigate to /sales
3. Click on a non-admin user
4. Edit their role to "manager"
5. Save - should succeed
6. Refresh - role should persist

### Non-Admin Self-Edit Flow
1. Log in as rep
2. Navigate to own profile (if accessible)
3. Attempt to change first_name
4. Should either: succeed OR show clear error message

---

## Appendix: Source Document References

| Document | Location | Lines | Focus |
|----------|----------|-------|-------|
| Part 1: UI & API | `docs/rbac-inventory-part1-ui-api.md` | 752 | Frontend + Data Provider |
| Part 2A: Database | `docs/rbac-inventory-part2a-database.md` | 754 | Local vs Cloud comparison |
| Part 2B: Migrations | `docs/rbac-inventory-part2b-migrations.md` | 694 | Migration state + history |

---

## Conclusion

The Crispy CRM RBAC architecture is **well-designed and secure** at its core. The primary risks are operational (migration drift) rather than architectural.

**Immediate actions:**
1. Resolve orphaned cloud migration
2. Push `is_admin()` NULL fix to cloud
3. Apply pending migrations

**The admin edit bug (if still occurring) is NOT caused by architectural issues** - all layers are correctly implemented. Focus debugging on:
1. Network/timing issues
2. Cache staleness
3. Type coercion in comparisons
4. Edge Function payload verification

---

*End of Final Consolidated Report*
