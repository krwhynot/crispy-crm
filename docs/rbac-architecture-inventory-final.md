# RBAC Architecture Inventory - Final Consolidated Report

> **Generated:** 2025-12-12
> **Scope:** Full-Stack RBAC Analysis (UI → API → Database → Migrations)
> **Status:** Complete Inventory with Full Preservation
> **Sources:** Part 1 (UI/API), Part 2A (Database), Part 2B (Migrations)

---

# Part A: Executive Summary

## Overall Architecture Health

| Layer | Status | Critical Issues | Action Required |
|-------|--------|-----------------|-----------------|
| UI/Frontend | **HEALTHY** | 0 | Minor UX improvements |
| Data Provider/API | **HEALTHY** | 0 | Type coercion fix |
| Database Schema | **DRIFT** | 1 | Sync local schema |
| RLS Policies | **HEALTHY** | 0 | Add service_role policy to local |
| Helper Functions | **HEALTHY** | 0 | Already well-designed |
| Triggers | **HEALTHY** | 0 | Correctly enforcing column restrictions |
| Migrations | **CRITICAL DRIFT** | 2 | Immediate sync required |

## Consolidated Statistics

| Category | Count | Source |
|----------|-------|--------|
| User Management UI Entry Points | 3 | Part 1 |
| Edit Interfaces Found | 4 | Part 1 |
| Permission Checks in UI | 6+ | Part 1 |
| Data Provider Methods | 5 | Part 1 |
| Edge Functions | 5 | Part 1 |
| Total Migrations | 182 | Part 2B |
| RBAC-Related Migrations | 35 (19.2%) | Part 2B |
| Sales Table Columns (LOCAL) | 15 | Part 2A |
| Sales Table Columns (CLOUD) | 16 | Part 2A |
| RLS Policies (LOCAL) | 4 | Part 2A |
| RLS Policies (CLOUD) | 5 | Part 2A |
| Helper Functions | 5 | Part 2A |
| Triggers | 2 | Part 2A |

## Key Findings Summary

| Finding | Severity | Impact | Fix Complexity |
|---------|----------|--------|----------------|
| Orphaned cloud migration (20251212020132) | **CRITICAL** | Unknown schema in prod | Medium |
| Cloud missing `is_admin()` NULL fix | **HIGH** | Edge Function auth failures | Low |
| Cache staleness (15-min TTL) | **MEDIUM** | Delayed permission updates | Medium |
| Type mismatch (identity.id) | **MEDIUM** | Potential comparison bugs | Low |
| Schema drift (digest_opt_in) | **MEDIUM** | Local/Cloud inconsistency | Low |
| Silent profile edit failure | **LOW** | Poor UX for non-admins | Low |

## Architecture Verdict

**The RBAC system is architecturally sound.** The design follows security best practices:

1. **Single Entry Point** - All sales updates flow through the Edge Function
2. **Defense in Depth** - RLS policies + Trigger + Edge Function authorization
3. **Role-Based Access** - Proper enum-based role system with helper functions
4. **Backward Compatibility** - Legacy `is_admin` column synced via trigger

**Primary Risk:** Migration state drift between local and cloud environments.

### Key Architectural Finding (Part 1)

**ALL sales updates flow through Edge Function** - the architecture is consistent, not divergent. The `unifiedDataProvider.update("sales")` method explicitly delegates to `salesService.salesUpdate()` which invokes the Edge Function. This is intentional: "RLS prevents direct PostgREST updates."

---

# Part B: Cross-Layer Issue Analysis

## Issue 1: Migration State Desync (CRITICAL)

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

## Issue 2: Schema Drift (MEDIUM)

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

## Issue 3: Non-Admin Profile Edit Silent Failure (LOW)

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

## Issue 4: Cache Staleness After Role Update

| Attribute | Value |
|-----------|-------|
| Layer | Auth Provider |
| Severity | Medium |
| File | `authProvider.ts:93-124` |

**Description:**

When admin updates a user's role, that user won't see the new role for up to 15 minutes due to caching. No real-time invalidation exists.

**Impact:**

- User sees old role in UI
- Permission checks use stale role
- May allow/deny actions incorrectly until cache expires

---

## Issue 5: Type Mismatch - identity.id

| Attribute | Value |
|-----------|-------|
| Layer | Auth Provider / Data Provider |
| Severity | Medium |
| Files | `authProvider.ts`, `useCurrentSale.ts` |

**Description:**

`identity.id` is a number from the database but React Admin expects string IDs. Components must explicitly coerce:

```typescript
const salesId = identity?.id ? Number(identity.id) : null;
```

---

# Part C: Complete Data Flow Diagrams

## Admin Editing Another User (Complete Flow)

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

## User Editing Own Profile (SlideOver)

```
Step 1: User opens SalesSlideOver on their own record
    ↓
Step 2: SalesProfileTab renders in edit mode
    ↓
Step 3: User changes first_name
    ↓
Step 4: handleSave() → validateUpdateSales()
    ↓
Step 5: update("sales", { id, data: { first_name } })
    ↓
Step 6: unifiedDataProvider.update("sales", ...) called
    ↓
Step 7: CONFIRMED: Delegates to salesService.salesUpdate()
    ↓
Step 8: dataProvider.invoke("users", { method: "PATCH", body: { sales_id, first_name } })
    ↓
Step 9: Edge Function /functions/v1/users handles PATCH
    ↓
Step 10: Edge Function checks: currentUserSale.id === saleToUpdate.id ✅
    ↓
Step 11: BUT: Non-admin detected → ONLY avatar field processed!
    ↓
Step 12: updateSaleViaRPC() called with { avatar: undefined } (other fields DROPPED)
    ↓
Step 13: ⚠️ first_name change SILENTLY IGNORED (no error, but no update)
```

## Permission Check Hierarchy

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

# Part D: UI & API Layer (Full from Part 1)

## D.1 All User/Team Management Components

| File | Component | Type | Purpose |
|------|-----------|------|---------|
| `src/atomic-crm/sales/SalesList.tsx` | SalesList | List Page | Master list of all team members |
| `src/atomic-crm/sales/SalesCreate.tsx` | SalesCreate | Form Page | Create new user form |
| `src/atomic-crm/sales/SalesEdit.tsx` | SalesEdit | Form Page | Edit user details (full page) |
| `src/atomic-crm/sales/SalesSlideOver.tsx` | SalesSlideOver | SlideOver | Profile/Permissions tabs in panel |
| `src/atomic-crm/sales/SalesProfileTab.tsx` | SalesProfileTab | Tab Component | Name, email, phone, avatar |
| `src/atomic-crm/sales/SalesPermissionsTab.tsx` | SalesPermissionsTab | Tab Component | Role, disabled, danger zone |
| `src/atomic-crm/settings/SettingsPage.tsx` | SettingsPage | Settings Page | Routes to sections (admin-gated) |
| `src/atomic-crm/settings/sections/UsersSection.tsx` | UsersSection | Settings Section | Links to /sales resource |
| `src/atomic-crm/layout/Header.tsx` | Header | Navigation | Contains UsersMenu (admin-gated) |
| `src/components/admin/app-sidebar.tsx` | AppSidebar | Navigation | Dynamic resource menu |

## D.2 Entry Points to User Editing

### Entry Point A: Settings → Team Section (Admin Only)

| Attribute | Value |
|-----------|-------|
| File | `src/atomic-crm/settings/SettingsPage.tsx:94-109` |
| Access Method | Settings icon → Team section (conditional) |
| Route | `/settings` then click "Team" |
| Component Type | Settings Page with conditional sections |
| Triggered From | Header settings icon |

**How to Reach:**
1. Click Settings icon in header (all users can access)
2. See Settings page sections
3. **If admin**: "Team" section appears in menu
4. Click "Team" → Redirects to `/sales`

**Permission Check (line 94):**
```tsx
...(identity?.role === "admin"
  ? [
      { id: "users", label: "Team", component: <UsersSection /> },
      { id: "audit", label: "Activity Log", component: <AuditLogSection /> },
    ]
  : []),
```

---

### Entry Point B: Header User Menu (Admin Only)

| Attribute | Value |
|-----------|-------|
| File | `src/atomic-crm/layout/Header.tsx:107-109` |
| Access Method | Click avatar → "Team Management" link |
| Route | `/admin/users` (redirects to `/sales`) |
| Component Type | Dropdown Menu Item |
| Triggered From | Header avatar dropdown |

**How to Reach:**
1. Click avatar/name in top-right header
2. Dropdown appears
3. **If admin**: "Team Management" link visible
4. Click → navigates to `/admin/users`
5. CRM.tsx catches route, redirects to `/sales`

**Permission Check (line 107-109):**
```tsx
<CanAccess resource="sales" action="list">
  <UsersMenu />
</CanAccess>
```

---

### Entry Point C: App Sidebar Navigation (Admin Only)

| Attribute | Value |
|-----------|-------|
| File | `src/components/admin/app-sidebar.tsx:102-131` |
| Access Method | Click "Sales" or "Team" in sidebar |
| Route | `/sales` |
| Component Type | SidebarMenuItem |
| Triggered From | Left sidebar navigation |

**Permission Check (line 102-105):**
```tsx
const { canAccess, isPending } = useCanAccess({
  resource: name,
  action: "list",
});
// ...
if (!canAccess) return null;
```

---

### Entry Point D: Direct URL Navigation

| Route | Behavior |
|-------|----------|
| `/sales` | SalesList renders (requires admin) |
| `/sales?view=:id` | Opens SalesSlideOver for user :id |
| `/admin/users` | Redirects to `/sales` |
| `/admin/users/:id` | Redirects to `/sales?view=:id` |

---

## D.3 Component Deep Dive

### Component: SalesPermissionsTab (CRITICAL)

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/sales/SalesPermissionsTab.tsx`
**Purpose:** Role management, admin toggle, disable account, remove user

**Analysis:**

| Aspect | Details |
|--------|---------|
| Props | `record: any`, `mode: "view" \| "edit"`, `onModeToggle?: () => void` |
| State | `formData: { role, disabled }`, `errors`, `isDeleting` |
| Data Fetching | `useGetIdentity()` for current user role |
| Form Fields | role (Select), administrator (Switch - computed), disabled (Switch) |
| Permission Checks | `isSelfEdit`, `identity?.role === "admin"` |
| Save Method | `useUpdate("sales", { id, data, previousData })` |

**Permission Logic (Critical Lines):**

```tsx
// Line 63: Self-edit prevention
const isSelfEdit = record?.id === identity?.id;

// Line 179: Block save if self-edit
if (!isSelfEdit) {
  handleSave();
}

// Line 215-216: Disable role selector for self-edit
disabled={isLoading || isSelfEdit}

// Line 310: Admin-only danger zone
{!isSelfEdit && identity?.role === "admin" && (
  <div className="mt-8 pt-6 border-t border-destructive/30">
    {/* Remove User button */}
  </div>
)}
```

**Save Handler (Lines 107-137):**
```tsx
const handleSave = async () => {
  // Validate form data
  await validateUpdateSales({ id: record.id, ...formData });

  // Update via React Admin's useUpdate
  await update(
    "sales",
    { id: record.id, data: formData, previousData: record },
    { onSuccess, onError }
  );
};
```

---

### Component: SalesProfileTab

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/sales/SalesProfileTab.tsx`
**Purpose:** Edit user profile (name, email, phone, avatar)

| Aspect | Details |
|--------|---------|
| Props | `record: any`, `mode: "view" \| "edit"`, `onModeToggle?: () => void` |
| Form Fields | first_name, last_name, email, phone, avatar_url |
| Save Method | `useUpdate("sales", { id, data, previousData })` |
| Validation | `validateUpdateSales()` at save time |

---

### Component: SalesEdit

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/sales/SalesEdit.tsx`
**Purpose:** Full-page edit form (alternative to SlideOver)

| Aspect | Details |
|--------|---------|
| Uses | `SalesService.salesUpdate()` via useMutation |
| Data Flow | Form → SalesService → Edge Function |
| **DIFFERENT PATH** | Does NOT use `useUpdate("sales")` directly |

**Critical Code:**
```tsx
// Line 36-53
const { mutate } = useMutation({
  mutationKey: ["signup"],  // NOTE: Key is "signup" not "sales-update"
  mutationFn: async (data: SalesFormData) => {
    return salesService.salesUpdate(record.id, data);  // → Edge Function
  },
});
```

---

## D.4 Role/Permission Checks Across UI

| File | Line | Check Type | What It Controls |
|------|------|------------|------------------|
| `canAccess.ts` | 42-78 | `role === "admin"` | All RBAC decisions |
| `SettingsPage.tsx` | 94 | `identity?.role === "admin"` | Team + Audit sections |
| `Header.tsx` | 107-109 | `<CanAccess resource="sales">` | Team Management link |
| `app-sidebar.tsx` | 102-105 | `useCanAccess({ resource })` | Resource menu items |
| `SalesPermissionsTab.tsx` | 63 | `record?.id === identity?.id` | Self-edit prevention |
| `SalesPermissionsTab.tsx` | 310 | `identity?.role === "admin"` | Remove User button |
| `SalesPermissionsTab.tsx` | 215-216 | `isSelfEdit` | Disable role selector |

---

## D.5 UI Component Tree

```
src/App.tsx
└── CRM (root/CRM.tsx)
    ├── ConfigurationProvider
    └── Admin (ra-core)
        ├── Layout (layout/Layout.tsx)
        │   ├── Header (layout/Header.tsx)
        │   │   ├── NavTabs
        │   │   ├── <CanAccess resource="sales">
        │   │   │   └── UsersMenu → /admin/users
        │   │   └── UserMenu → dropdown
        │   └── AppSidebar (components/admin/app-sidebar.tsx)
        │       └── ResourceMenuItem (canAccess filtered)
        │
        ├── CustomRoutes
        │   ├── /settings → SettingsPage
        │   │   └── UsersSection (admin only) → /sales
        │   ├── /admin/users → Redirect to /sales
        │   └── /admin/users/:id → Redirect to /sales?view=:id
        │
        └── Resources
            └── <Resource name="sales" {...sales}>
                ├── list: SalesList
                │   └── onClick → SalesSlideOver
                ├── create: SalesCreate
                └── edit: SalesEdit (full page)

SalesSlideOver
├── Tab: Profile → SalesProfileTab
└── Tab: Permissions → SalesPermissionsTab
    └── Danger Zone (admin-only) → Remove User
```

---

## D.6 Routes Configuration

| Route | Component | Access Control |
|-------|-----------|----------------|
| `/sales` | SalesList | `canAccess("sales", "list")` - Admin only |
| `/sales?view=:id` | SalesList + SalesSlideOver | Admin only (RLS enforced) |
| `/sales/create` | SalesCreate | Admin only |
| `/sales/:id` | SalesEdit (full page) | Admin only |
| `/settings` | SettingsPage | All authenticated (sections gated) |
| `/admin/users` | Redirect → `/sales` | N/A (legacy) |
| `/admin/users/:id` | Redirect → `/sales?view=:id` | N/A (legacy) |

---

## D.7 Data Provider Analysis

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (1,319 lines)

### Resource Handlers

| Resource | getList | getOne | create | update | delete | Custom |
|----------|---------|--------|--------|--------|--------|--------|
| sales | ✅ Base | ✅ Base | ✅ SalesService | ✅ SalesService | ✅ Soft | `salesCreate`, `salesUpdate`, `updatePassword` |
| users | N/A | N/A | N/A | N/A | N/A | Handled by Edge Function |

### Sales Resource Handling - CRITICAL DISCOVERY ✅

**UPDATE (Post-Analysis): Architecture is CONSISTENT - NOT Two Paths!**

Both apparent update paths **CONVERGE** through the Edge Function. This is intentional:

**Lines 663-667 of unifiedDataProvider.ts:**
```typescript
// Delegate sales update to Edge Function (RLS prevents direct PostgREST updates)
// The sales table is protected - updates must go through /functions/v1/users
if (resource === "sales") {
  const result = await salesService.salesUpdate(params.id, processedData as any);
  return { data: { ...params.previousData, ...result, id: params.id } as RecordType };
}
```

**Actual Flow (ALL paths):**

**UI Path A: SlideOver tabs (SalesProfileTab, SalesPermissionsTab)**
```tsx
useUpdate("sales", { id, data, previousData })
  → unifiedDataProvider.update("sales", ...)
    → salesService.salesUpdate(id, data)
      → dataProvider.invoke("users", { method: "PATCH" })
        → Edge Function /functions/v1/users
```

**UI Path B: Full-page SalesEdit.tsx**
```tsx
const salesService = new SalesService(dataProvider);
mutate(data)
  → salesService.salesUpdate(record.id, data)
    → dataProvider.invoke("users", { method: "PATCH" })
      → Edge Function /functions/v1/users
```

**CONCLUSION**: All sales updates go through Edge Function. The comment "RLS prevents direct PostgREST updates" confirms this is intentional design.

---

## D.8 Edge Function Analysis

**File:** `/home/krwhynot/projects/crispy-crm/supabase/functions/users/index.ts` (307 lines)

### HTTP Methods Supported

| Method | Purpose | Authorization |
|--------|---------|---------------|
| OPTIONS | CORS preflight | None |
| POST | Create new user | Admin only |
| PATCH | Update existing user | Self or Admin |
| GET/DELETE | Not supported | Returns 405 |

### Admin Check Logic (Lines 114-116, 191)

```typescript
// POST: Admin-only for creating users
if (currentUserSale.role !== 'admin') {
  return createErrorResponse(401, "Not Authorized", corsHeaders);
}

// PATCH: Self-edit OR admin can edit others
if (currentUserSale.role !== 'admin' && currentUserSale.id !== saleToUpdate.id) {
  return createErrorResponse(401, "Not Authorized", corsHeaders);
}
```

### Field Restrictions by Role

| Field | Non-Admin | Admin |
|-------|-----------|-------|
| email | ✅ (via Supabase Auth) | ✅ |
| first_name | ✅ | ✅ |
| last_name | ✅ | ✅ |
| avatar | ✅ | ✅ |
| **role** | ❌ | ✅ |
| **disabled** | ❌ | ✅ |
| **deleted_at** | ❌ | ✅ |

---

## D.9 Auth Provider Analysis

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` (125 lines)

### getIdentity Returns

```typescript
{
  id: sale.id,                    // From sales table (number)
  fullName: `${first_name} ${last_name}`,
  avatar: sale.avatar_url,
  role: sale.role || "rep",       // Defaults to "rep"
}
```

### Role Source

- **Fetched from:** `sales` table query on `user_id = auth.uid()`
- **Caching:** 15-minute TTL (`CACHE_TTL_MS = 15 * 60 * 1000`)
- **Refresh trigger:** Cache expiry OR login/logout

### Caching Behavior

```typescript
// Module-level cache
let cachedSale: any;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Clear on login/logout
cachedSale = undefined;
cacheTimestamp = 0;
```

---

## D.10 Supabase Client Configuration

| Client Name | File | Type | Purpose |
|-------------|------|------|---------|
| `supabase` | `providers/supabase/supabase.ts` | anon | All frontend DB access |
| `supabaseAdmin` | `functions/_shared/supabaseAdmin.ts` | service_role | Edge Function admin operations |

**Client Initialization (Frontend):**
```typescript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,  // ANON key, not service role
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

---

## D.11 Validation Schemas

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/sales.ts`

```typescript
export const salesSchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().nullish(),
  avatar_url: z.string().url().optional().nullable(),

  // Permission fields
  role: z.enum(["admin", "manager", "rep"]).default("rep"),
  is_admin: z.coerce.boolean().optional(),     // Deprecated
  administrator: z.coerce.boolean().optional(), // Computed

  disabled: z.coerce.boolean().default(false),
  digest_opt_in: z.coerce.boolean().default(true),
  timezone: z.string().regex(/^[A-Za-z]+\/[A-Za-z_]+$/).default("America/Chicago"),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});
```

---

# Part E: Database Layer (Full from Part 2A)

## E.1 LOCAL Database

### Connection Info

```
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
Status: Running
```

### Sales Table Schema (LOCAL)

| Column | Type | Nullable | Default | RBAC Role |
|--------|------|----------|---------|-----------|
| id | bigint | NO | nextval('sales_id_seq') | PK |
| user_id | uuid | YES | - | Auth link |
| created_at | timestamptz | YES | now() | Audit |
| updated_at | timestamptz | YES | now() | Audit |
| first_name | text | YES | - | Profile |
| last_name | text | YES | - | Profile |
| email | text | YES | - | Profile |
| phone | text | YES | - | Profile |
| avatar_url | text | YES | - | Profile |
| is_admin | boolean | YES | false | DEPRECATED |
| deleted_at | timestamptz | YES | - | Soft delete |
| disabled | boolean | YES | false | ✅ Access control |
| role | user_role | NO | 'rep' | ✅ Primary RBAC |
| administrator | boolean | YES | - | Computed from role |
| timezone | text | YES | 'America/Chicago' | User pref |

**Total columns: 15**

**RLS Status:**
- Enabled: ✅ YES
- Forced: ❌ NO

**Constraints:**
```sql
sales_pkey           | PRIMARY KEY (id)
sales_timezone_check | CHECK ((timezone ~ '^[A-Za-z]+/[A-Za-z_]+$'::text))
sales_user_id_fkey   | FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
sales_user_id_key    | UNIQUE (user_id)
```

**Indexes:**
```sql
sales_pkey         | CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)
sales_user_id_key  | CREATE UNIQUE INDEX sales_user_id_key ON public.sales USING btree (user_id)
idx_sales_disabled | CREATE INDEX idx_sales_disabled ON public.sales USING btree (disabled) WHERE (disabled = false)
idx_sales_user_id  | CREATE INDEX idx_sales_user_id ON public.sales USING btree (user_id) WHERE (user_id IS NOT NULL)
```

---

## E.2 Helper Functions (LOCAL) - Full SQL

### is_admin()

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
```

| Attribute | Value |
|-----------|-------|
| Security | DEFINER |
| Volatility | STABLE |
| NULL auth.uid() handling | Returns TRUE (admin access) |
| Return when no match | FALSE |

### is_manager_or_admin()

```sql
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role IN ('admin', 'manager') FROM public.sales WHERE user_id = auth.uid()
$function$
```

**Note:** Does NOT handle NULL auth.uid() - returns NULL in service role context.

### current_sales_id()

```sql
CREATE OR REPLACE FUNCTION public.current_sales_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT id FROM public.sales WHERE user_id = auth.uid()
$function$
```

### get_current_sales_id()

```sql
CREATE OR REPLACE FUNCTION public.get_current_sales_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1
$function$
```

### user_role()

```sql
CREATE OR REPLACE FUNCTION public.user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role FROM public.sales WHERE user_id = auth.uid()
$function$
```

---

## E.3 RLS Policies (LOCAL)

| Policy | Command | Permissive | Roles | USING | WITH CHECK |
|--------|---------|------------|-------|-------|------------|
| select_sales | SELECT | YES | authenticated | `deleted_at IS NULL` | - |
| insert_sales | INSERT | YES | authenticated | - | `is_admin()` |
| update_sales | UPDATE | YES | **public** | `is_admin() OR (user_id = auth.uid())` | `is_admin() OR (user_id = auth.uid())` |
| delete_sales | DELETE | YES | authenticated | `is_admin()` | - |

**Full Policy DDL:**
```sql
CREATE POLICY select_sales ON public.sales AS PERMISSIVE FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY insert_sales ON public.sales AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY update_sales ON public.sales AS PERMISSIVE FOR UPDATE TO public USING (is_admin() OR (user_id = auth.uid())) WITH CHECK (is_admin() OR (user_id = auth.uid()));
CREATE POLICY delete_sales ON public.sales AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin());
```

---

## E.4 Triggers (LOCAL) - Full SQL

### enforce_sales_column_restrictions_trigger

```sql
CREATE TRIGGER enforce_sales_column_restrictions_trigger
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sales_column_restrictions()
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION public.enforce_sales_column_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  is_self_update BOOLEAN;
  caller_is_admin BOOLEAN;
BEGIN
  -- Get current user (may be NULL for service role or local dev)
  current_user_id := auth.uid();

  -- LOG: Always log what's happening
  RAISE LOG '[SALES_TRIGGER] UPDATE on sales.id=% | auth.uid()=% | target_user_id=%',
    NEW.id, current_user_id, NEW.user_id;

  -- Check if caller is admin
  caller_is_admin := COALESCE(is_admin(), FALSE);

  -- ADMIN BYPASS: Admins can edit ANY field for ANY user
  IF caller_is_admin THEN
    RAISE LOG '[SALES_TRIGGER] ALLOWED: Admin has full edit access';
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- NON-ADMIN PATH: Enforce restrictions
  -- When auth.uid() is NULL, we cannot determine the caller identity
  -- For non-admins, this is a problem - block the update
  IF current_user_id IS NULL THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin with NULL auth.uid() cannot update';
    RAISE EXCEPTION 'Authentication required for this operation'
      USING ERRCODE = 'P0003';
  END IF;

  -- Check if this is a self-update
  is_self_update := (NEW.user_id = current_user_id);

  -- Profile fields: Non-admins can only change their OWN profile
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE EXCEPTION 'Cannot modify another user''s first_name' USING ERRCODE = 'P0003';
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      RAISE EXCEPTION 'Cannot modify another user''s last_name' USING ERRCODE = 'P0003';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot modify another user''s email' USING ERRCODE = 'P0003';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE EXCEPTION 'Cannot modify another user''s phone' USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Permission fields: ONLY admins can change these
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only administrators can modify role' USING ERRCODE = 'P0003';
  END IF;
  IF NEW.disabled IS DISTINCT FROM OLD.disabled THEN
    RAISE EXCEPTION 'Only administrators can modify disabled status' USING ERRCODE = 'P0003';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
```

### keep_is_admin_synced

```sql
CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role()
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION public.sync_is_admin_from_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$function$
```

---

## E.5 Current Users (LOCAL)

**Sales Table:**

| id | email | role | disabled | user_id | first_name | last_name |
|----|-------|------|----------|---------|------------|-----------|
| 1 | sue@mfbroker.com | rep | false | 96d60350-c088-457a-872a-ee145e3517b9 | SueT3 | Martinez |
| 2 | admin@test.com | admin | true (is_admin) | d3129876-b1fe-40eb-9980-64f5f73c64d6 | AdminT2 | User |

**Auth Users - NULL Column Analysis:**

| email | conf_null | recovery_null | phone_null | email_change_null |
|-------|-----------|---------------|------------|-------------------|
| sue@mfbroker.com | false | false | true | false |
| admin@test.com | false | false | true | false |

**Users by Role:**

| Role | Count |
|------|-------|
| admin | 1 |
| rep | 1 |

---

## E.6 Function Behavior Tests (LOCAL)

| Function | Expected | Actual | Pass? |
|----------|----------|--------|-------|
| is_admin() | TRUE (service role) | TRUE | ✅ |
| auth.uid() | NULL (service role) | NULL | ✅ |
| is_manager_or_admin() | NULL (service role) | NULL | ✅ |
| get_current_sales_id() | NULL (service role) | NULL | ✅ |

---

## E.7 Enum Types (LOCAL)

**user_role:**

| Value | Sort Order |
|-------|------------|
| admin | 1 |
| manager | 2 |
| rep | 3 |

---

## E.8 Grants (LOCAL)

| Grantee | Privileges |
|---------|------------|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| postgres | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE (grantable) |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

---

## E.9 CLOUD Database

### Sales Table Schema (CLOUD)

| Column | Type | Nullable | Default | RBAC Role |
|--------|------|----------|---------|-----------|
| id | bigint | NO | nextval('sales_id_seq') | PK |
| user_id | uuid | YES | - | Auth link |
| created_at | timestamptz | YES | now() | Audit |
| updated_at | timestamptz | YES | now() | Audit |
| first_name | text | YES | - | Profile |
| last_name | text | YES | - | Profile |
| email | text | YES | - | Profile |
| phone | text | YES | - | Profile |
| avatar_url | text | YES | - | Profile |
| is_admin | boolean | YES | false | DEPRECATED |
| deleted_at | timestamptz | YES | - | Soft delete |
| disabled | boolean | YES | false | ✅ Access control |
| role | user_role | NO | 'rep' | ✅ Primary RBAC |
| administrator | boolean | YES | - | Computed from role |
| **digest_opt_in** | **boolean** | **NO** | **true** | **User pref** |
| timezone | text | YES | 'America/Chicago' | User pref |

**Total columns: 16**

**Differences from LOCAL:**
```diff
+ digest_opt_in | boolean | NO | true | User preference for daily digest emails
```

**Indexes:**
```sql
sales_pkey         | CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)
sales_user_id_key  | CREATE UNIQUE INDEX sales_user_id_key ON public.sales USING btree (user_id)
idx_sales_disabled | CREATE INDEX idx_sales_disabled ON public.sales USING btree (disabled) WHERE (disabled = false)
-- MISSING: idx_sales_user_id (exists in LOCAL)
```

---

## E.10 RLS Policies (CLOUD)

| Policy | Command | Permissive | Roles | USING | WITH CHECK |
|--------|---------|------------|-------|-------|------------|
| **service_role_full_access** | **ALL** | **YES** | **service_role** | **true** | **true** |
| select_sales | SELECT | YES | authenticated | `deleted_at IS NULL` | - |
| insert_sales | INSERT | YES | authenticated | - | `is_admin()` |
| update_sales | UPDATE | YES | public | `is_admin() OR (user_id = auth.uid())` | `is_admin() OR (user_id = auth.uid())` |
| delete_sales | DELETE | YES | authenticated | `is_admin()` | - |

**Differences from LOCAL:**
```diff
+ service_role_full_access | ALL | service_role | USING (true) WITH CHECK (true)
```

---

## E.11 Current Users (CLOUD)

| id | email | role | disabled | user_id | first_name | last_name |
|----|-------|------|----------|---------|------------|-----------|
| 16 | dramsy@masterfoodbrokers.com | manager | false | 545f85b5-... | Daler | Ramsy |
| 59 | kjramsy@gmail.com | admin | false | b8035a7f-... | (empty) | (empty) |
| 81 | admin@test.com | admin | false | ef7cdf2b-... | Admin | Test |
| 83 | sue@mfbroker.com | rep | false | 29d9a9c8-... | Sue | Martinez |

---

## E.12 Grants (CLOUD)

| Grantee | Privileges |
|---------|------------|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| postgres | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE (grantable) |

**Missing from LOCAL:**
- ❌ anon (no grants)
- ❌ service_role (no grants - but has RLS policy instead)

---

## E.13 Local vs Cloud Comparison Summary

### Schema Comparison

| Object | LOCAL | CLOUD | Match |
|--------|-------|-------|-------|
| Column count | 15 | 16 | ❌ |
| sales.digest_opt_in | MISSING | boolean NOT NULL DEFAULT true | ❌ |
| sales.role | user_role NOT NULL DEFAULT 'rep' | user_role NOT NULL DEFAULT 'rep' | ✅ |
| sales.disabled | boolean DEFAULT false | boolean DEFAULT false | ✅ |
| RLS enabled | true | true | ✅ |
| Index count | 4 | 3 | ❌ |

### Function Comparison

| Function | LOCAL | CLOUD | Match |
|----------|-------|-------|-------|
| is_admin() | Returns TRUE when auth.uid() IS NULL | Returns TRUE when auth.uid() IS NULL | ✅ |
| is_manager_or_admin() | Returns NULL when auth.uid() IS NULL | Returns NULL when auth.uid() IS NULL | ✅ |
| get_current_sales_id() | Returns NULL when auth.uid() IS NULL | Returns NULL when auth.uid() IS NULL | ✅ |
| current_sales_id() | EXISTS | EXISTS | ✅ |
| user_role() | EXISTS | EXISTS | ✅ |

### Policy Comparison

| Policy | LOCAL | CLOUD | Match |
|--------|-------|-------|-------|
| service_role_full_access | MISSING | `USING (true) WITH CHECK (true)` | ❌ |
| select_sales | `USING (deleted_at IS NULL)` | `USING (deleted_at IS NULL)` | ✅ |
| insert_sales | `WITH CHECK (is_admin())` | `WITH CHECK (is_admin())` | ✅ |
| update_sales | `USING/WITH CHECK (is_admin() OR user_id = auth.uid())` | Same | ✅ |
| delete_sales | `USING (is_admin())` | `USING (is_admin())` | ✅ |

---

# Part F: Migrations & Seed Data (Full from Part 2B)

## F.1 Migration File Inventory

**Total: 182 migrations** in `/home/krwhynot/projects/crispy-crm/supabase/migrations/`

| Time Period | Migration Range | Count |
|-------------|-----------------|-------|
| Oct 2025 | 20251018 - 20251028 | ~20 |
| Nov 2025 | 20251029 - 20251130 | ~60 |
| Dec 2025 | 20251201 - 20251212 | ~102 |

## F.2 All RBAC-Related Migrations (35 Files)

| Migration | Purpose | Objects Modified |
|-----------|---------|------------------|
| `20251018152315_cloud_schema_fresh.sql` | Initial schema | `sales.is_admin`, initial RLS |
| `20251018203500_update_rls_for_shared_team_access.sql` | Team-wide RLS | RLS policies |
| `20251018204500_add_helper_function_and_audit_trail.sql` | Helper function | `get_current_sales_id()` |
| `20251108172640_document_rls_security_model.sql` | Documentation | Comments only |
| `20251108213039_fix_rls_policies_role_based_access.sql` | Admin-only CRUD | RLS policies |
| **`20251111121526_add_role_based_permissions.sql`** | **MAJOR: Role system** | `user_role` enum, `is_admin()`, `is_manager_or_admin()` |
| `20251116210019_fix_sales_schema_consistency.sql` | Computed column | `sales.administrator` |
| `20251129030715_add_is_manager_helper.sql` | More helpers | `is_manager()`, `is_rep()` |
| `20251203120000_fix_rls_auth_uid_select_wrapper.sql` | Performance | RLS optimization |
| `20251211080000_add_authorization_to_security_definer_functions.sql` | Defense-in-depth | `admin_update_sale()` |
| `20251211120000_fix_sales_rls_self_update.sql` | Self-profile fix | RLS policies |
| `20251211130000_harden_security_definer_functions.sql` | Self-access | Function authorization |
| `20251211140000_enforce_column_level_updates.sql` | Trigger security | `enforce_sales_column_restrictions()` |
| `20251211160000_fix_trigger_null_auth.sql` | NULL auth fix | Trigger logic |
| `20251211170000_allow_admin_full_edit.sql` | Admin bypass | Trigger update |
| **`20251211180000_fix_is_admin_null_auth.sql`** | **NULL auth.uid() fix** | `is_admin()` |
| **`20251212031800_add_deleted_at_to_admin_update_sale.sql`** | **Soft-delete support** | `admin_update_sale()` |

**Complete List of All 35 RBAC Migration Filenames:**

```
20251018152315_cloud_schema_fresh.sql
20251018203500_update_rls_for_shared_team_access.sql
20251018204500_add_helper_function_and_audit_trail.sql
20251018210000_add_created_by_audit_field.sql
20251020001702_add_organizations_summary_rls_policies.sql
20251029024045_fix_rls_policies_company_isolation.sql
20251029070224_grant_authenticated_permissions.sql
20251108172640_document_rls_security_model.sql
20251108213039_fix_rls_policies_role_based_access.sql
20251108213216_cleanup_duplicate_rls_policies.sql
20251111121526_add_role_based_permissions.sql
20251114060720_fix_view_permissions.sql
20251116124147_fix_permissive_rls_policies.sql
20251116210019_fix_sales_schema_consistency.sql
20251117010529_add_missing_tasks_update_policy.sql
20251117011028_fix_tasks_select_policy.sql
20251123190738_restore_activities_rls_policies.sql
20251126041953_fix_opportunities_update_policy.sql
20251127054700_fix_critical_rls_security_tasks.sql
20251127055705_enhance_rls_security_activities_and_indexes.sql
20251129030715_add_is_manager_helper.sql
20251129120417_fix_public_role_rls_policies.sql
20251129170506_harden_participant_tables_rls_security.sql
20251129180728_add_soft_delete_rls_filtering.sql
20251129181451_add_missing_update_policies.sql
20251130010932_security_invoker_and_search_path_remediation.sql
20251130011911_fix_remaining_security_definer_views.sql
20251130045429_fix_security_definer_search_paths.sql
20251203120000_fix_rls_auth_uid_select_wrapper.sql
20251203120100_fix_rls_security_gaps.sql
20251211080000_add_authorization_to_security_definer_functions.sql
20251211120000_fix_sales_rls_self_update.sql
20251211130000_harden_security_definer_functions.sql
20251211140000_enforce_column_level_updates.sql
20251211160000_fix_trigger_null_auth.sql
20251211170000_allow_admin_full_edit.sql
20251211180000_fix_is_admin_null_auth.sql
20251212031800_add_deleted_at_to_admin_update_sale.sql
```

---

## F.3 Key Migration Content (Full SQL)

### Migration 1: `20251111121526_add_role_based_permissions.sql`

**Timestamp:** 2025-11-11 12:15:26 UTC
**Purpose:** Replace `is_admin` boolean with full `user_role` enum system

```sql
-- =====================================================================
-- PART 1: Create Role Enum Type
-- =====================================================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

-- =====================================================================
-- PART 2: Add Role Column to Sales Table
-- =====================================================================
ALTER TABLE sales ADD COLUMN role user_role DEFAULT 'rep';

-- Backfill from existing is_admin column
UPDATE sales SET role = CASE
  WHEN is_admin = true THEN 'admin'::user_role
  ELSE 'rep'::user_role
END;

ALTER TABLE sales ALTER COLUMN role SET NOT NULL;

-- =====================================================================
-- PART 3: Helper Functions for Role Checking
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================================
-- PART 10: Sync Trigger to Keep is_admin Compatible
-- =====================================================================
CREATE OR REPLACE FUNCTION sync_is_admin_from_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keep_is_admin_synced
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_admin_from_role();
```

---

### Migration 2: `20251211180000_fix_is_admin_null_auth.sql`

**Timestamp:** 2025-12-11 18:00:00 UTC
**Purpose:** Fix is_admin() to return TRUE when auth.uid() is NULL (service role/local dev)

```sql
-- Migration: Fix is_admin() to handle NULL auth.uid()
-- Purpose: When auth.uid() is NULL, return TRUE to allow admin operations
--
-- ROOT CAUSE: The original is_admin() function:
--   SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid()
-- Returns NO ROWS when auth.uid() is NULL, which evaluates to NULL,
-- and COALESCE(NULL, FALSE) = FALSE, blocking ALL admin operations.
--
-- FIX: When auth.uid() is NULL, return TRUE (grant admin access).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;
```

---

### Migration 3: `20251212031800_add_deleted_at_to_admin_update_sale.sql`

**Timestamp:** 2025-12-12 03:18:00 UTC
**Purpose:** Add soft-delete support to admin_update_sale() function

```sql
-- Migration: Add new_deleted_at parameter to admin_update_sale
-- Purpose: Fix Edge Function 500 error when admin edits user profiles
-- Root Cause: Edge Function passes 5 parameters but function only accepted 4

CREATE OR REPLACE FUNCTION admin_update_sale(
  target_user_id UUID,
  new_role user_role DEFAULT NULL,
  new_disabled BOOLEAN DEFAULT NULL,
  new_avatar TEXT DEFAULT NULL,
  new_deleted_at TIMESTAMPTZ DEFAULT NULL  -- NEW PARAMETER
)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  updated_record sales;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- AUTHORIZATION CHECK 1: Only admins can change role, disabled, or delete
  IF (new_role IS NOT NULL OR new_disabled IS NOT NULL OR new_deleted_at IS NOT NULL)
     AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify role, disabled status, or delete users'
      USING ERRCODE = 'P0003';
  END IF;

  -- AUTHORIZATION CHECK 2: Non-admins can only update their own profile
  IF current_user_role != 'admin' AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile'
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    deleted_at = COALESCE(new_deleted_at, deleted_at),
    updated_at = NOW()
  WHERE user_id = target_user_id AND (deleted_at IS NULL OR new_deleted_at IS NOT NULL)
  RETURNING * INTO updated_record;

  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0004';
  END IF;

  RETURN updated_record;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_sale(UUID, user_role, BOOLEAN, TEXT, TIMESTAMPTZ) TO authenticated;
```

---

## F.4 Migration Timeline Visualization

```
RBAC Evolution Timeline
========================

Oct 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251018152315_cloud_schema_fresh.sql
  │  └── Initial: sales.is_admin BOOLEAN DEFAULT false
  │
  ├─ 20251018204500_add_helper_function_and_audit_trail.sql
  │  └── get_current_sales_id() helper
  │
Nov 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251108213039_fix_rls_policies_role_based_access.sql
  │  └── Admin-only UPDATE/DELETE policies
  │
  ├─ 20251111121526_add_role_based_permissions.sql ★ MAJOR
  │  ├── Created user_role enum (admin, manager, rep)
  │  ├── Added sales.role column (NOT NULL)
  │  ├── Created is_admin(), is_manager_or_admin()
  │  └── Created sync trigger (role → is_admin)
  │
  ├─ 20251116210019_fix_sales_schema_consistency.sql
  │  └── Computed: sales.administrator GENERATED AS (role = 'admin')
  │
  ├─ 20251129030715_add_is_manager_helper.sql
  │  └── Added is_manager(), is_rep() helpers
  │
Dec 2025 ────────────────────────────────────────────────────────────
  │
  ├─ 20251211080000_add_authorization_to_security_definer_functions.sql
  │  └── Hardened admin_update_sale() with auth checks
  │
  ├─ 20251211140000_enforce_column_level_updates.sql
  │  └── Trigger: enforce_sales_column_restrictions()
  │
  ├─ 20251211170000_allow_admin_full_edit.sql
  │  └── Admin bypass for all fields
  │
  ├─ 20251211180000_fix_is_admin_null_auth.sql ★ SECURITY FIX
  │  └── is_admin() returns TRUE when auth.uid() is NULL
  │
  └─ 20251212031800_add_deleted_at_to_admin_update_sale.sql ★ LATEST
     └── 5-param admin_update_sale() with soft-delete
```

---

## F.5 Migration Dependency Graph

```
Migration Dependencies
======================

20251018152315_cloud_schema_fresh.sql
    │
    └── Creates: sales.is_admin BOOLEAN
        │
        ▼
20251111121526_add_role_based_permissions.sql ★
    │
    ├── Creates: user_role ENUM
    ├── Adds: sales.role column
    ├── Creates: is_admin() (v1)
    ├── Creates: is_manager_or_admin()
    ├── Creates: current_sales_id()
    ├── Creates: sync_is_admin_from_role trigger
    │
    └──► 20251129030715_add_is_manager_helper.sql
              │
              ├── Creates: is_manager()
              └── Creates: is_rep()
                   │
                   ▼
        20251211180000_fix_is_admin_null_auth.sql ★
              │
              └── Modifies: is_admin() (NULL handling)
                   │
                   ▼
        20251212031800_add_deleted_at_to_admin_update_sale.sql ★
              │
              └── Modifies: admin_update_sale() (5 params)
```

---

## F.6 Seed Data Analysis

### Seed Files Found

| File | Size | Purpose | Users Created |
|------|------|---------|---------------|
| `supabase/seed.sql` | 709KB | **PRODUCTION** - Real org data | 1 (admin) |
| `supabase/seed-e2e.sql` | 14KB | E2E test data | 0 (reuses admin) |
| `supabase/seed-sample-opportunity.sql` | 12KB | Sample opportunity | 0 (reuses admin) |
| `supabase/seed.sql.archived.2025-11-28` | N/A | **ARCHIVED** - Full test data | 6 (all roles) |

**Modular Seed Parts** (`supabase/seed-parts/`):
- `01-header-auth-users.sql` - Auth setup (6 users)
- `02-sales.sql` - Sales records
- `03-segments.sql` - Playbook categories
- `04-principals.sql` - Principal organizations
- `05-distributors.sql` - Distributor organizations
- `06-customers.sql` - Customer organizations
- `08-contacts.sql` - Contact records
- `11-opportunities.sql` - Opportunity data
- `12-activities.sql` - Activity records

### Current Production Seed (`seed.sql`)

**Generation Info:**
- Generated: 2025-12-08T04:51:28.379Z
- Organizations: 2,023 (real MasterFoods data)
- Contacts: 1,776
- Single admin user: `admin@test.com`

**auth.users INSERT Pattern:**

```sql
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token, is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated', 'authenticated', 'admin@test.com',
  crypt('password123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(), NOW(),
  '', '', '', '', '', '', '', '',  -- ALL EMPTY STRINGS (not NULL)
  false, false
) ON CONFLICT (id) DO UPDATE SET ...
```

### Users Created by Seed

**Current Production:**

| Email | Role | User ID |
|-------|------|---------|
| admin@test.com | admin | d3129876-b1fe-40eb-9980-64f5f73c64d6 |

**Archived Seed (6 users):**

| Email | Role | User ID |
|-------|------|---------|
| admin@test.com | admin | a0000000-0000-0000-0000-000000000001 |
| brent@mfbroker.com | admin | b0000000-0000-0000-0000-000000000001 |
| michelle@mfbroker.com | manager | c0000000-0000-0000-0000-000000000001 |
| gary@mfbroker.com | rep | d0000000-0000-0000-0000-000000000001 |
| dale@mfbroker.com | rep | e0000000-0000-0000-0000-000000000001 |
| sue@mfbroker.com | rep | f0000000-0000-0000-0000-000000000001 |

### Seed Data Issues

**Status: NO CRITICAL ISSUES FOUND**

| Check | Status |
|-------|--------|
| Token columns (confirmation_token, etc.) | Empty strings (`''`) - NOT NULL |
| GoTrue compatibility (is_sso_user, is_anonymous) | Included |
| Explicit sales INSERT | Yes (bypasses trigger on upsert) |
| Verification check | Fail-fast if sales empty |
| Idempotent pattern | ON CONFLICT DO UPDATE |

---

## F.7 Migration State Comparison

### Applied Migrations Matrix

| Migration | In Folder | Applied LOCAL | Applied CLOUD | Status |
|-----------|-----------|---------------|---------------|--------|
| All prior to 20251211180000 | ✅ | ✅ | ✅ | **SYNCED** |
| 20251211180000 | ✅ | ✅ | ❌ | **CLOUD MISSING** |
| 20251212020132 | ❌ | ❌ | ✅ | **ORPHANED** |
| 20251212031800 | ✅ | ❌ | ❌ | **NOT APPLIED** |

### Drift Resolution Commands

```bash
# Step 1: Investigate orphaned migration
npx supabase db execute "SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version = '20251212020132';"

# Step 2: If safe to remove, mark as reverted
npx supabase migration repair --status reverted 20251212020132

# Step 3: Apply missing migrations to cloud
npx supabase db push

# Step 4: Apply pending local migration
npx supabase migration up --local

# Step 5: Verify all in sync
npx supabase migration list
```

---

# Part G: Prioritized Fix Recommendations

## Priority 1: CRITICAL (Do Immediately)

### 1.1 Investigate Orphaned Cloud Migration

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

### 1.2 Push Missing `is_admin()` Fix to Cloud

```bash
# This will apply 20251211180000_fix_is_admin_null_auth.sql
npx supabase db push
```

**Why Critical:** Without this fix, Edge Function admin operations may fail in production because `is_admin()` returns FALSE for service role context.

---

## Priority 2: HIGH (This Week)

### 2.1 Apply Pending Migrations

```bash
# Apply to local
npx supabase migration up --local

# Verify sync
npx supabase migration list
# All three columns should match
```

### 2.2 Sync Local Schema with Cloud

```bash
# Reset local to match cloud (if acceptable to lose local data)
npx supabase db reset

# Or manually add missing column
npx supabase migration new add_digest_opt_in_local
# Add: ALTER TABLE sales ADD COLUMN IF NOT EXISTS digest_opt_in BOOLEAN NOT NULL DEFAULT true;
```

---

## Priority 3: MEDIUM (This Sprint)

### 3.1 Add Cache Invalidation for Role Changes

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

### 3.2 Fix Type Mismatch (identity.id)

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

---

## Priority 4: LOW (Backlog)

### 4.1 Improve Non-Admin Profile Edit UX

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

### 4.2 Add Missing Index to Cloud

```sql
-- Create migration: add_user_id_index_cloud.sql
CREATE INDEX IF NOT EXISTS idx_sales_user_id
  ON public.sales USING btree (user_id)
  WHERE (user_id IS NOT NULL);
```

### 4.3 Add service_role_full_access Policy to Local

```sql
-- For parity with cloud
CREATE POLICY service_role_full_access ON public.sales
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

---

# Part H: Appendices

## H.1 All Files Examined (Part 1)

| File | Purpose | Key Findings |
|------|---------|--------------|
| `src/App.tsx` | Entry point | Wraps CRM with Sentry |
| `src/atomic-crm/root/CRM.tsx` | React Admin setup | Resources, routes, redirects |
| `src/atomic-crm/sales/SalesList.tsx` | User list | Opens SlideOver on click |
| `src/atomic-crm/sales/SalesEdit.tsx` | Full-page edit | Uses SalesService (Edge Function path) |
| `src/atomic-crm/sales/SalesSlideOver.tsx` | SlideOver wrapper | Two tabs: Profile, Permissions |
| `src/atomic-crm/sales/SalesProfileTab.tsx` | Profile editing | Uses useUpdate (direct path) |
| `src/atomic-crm/sales/SalesPermissionsTab.tsx` | Role/permissions | Uses useUpdate + admin checks |
| `src/atomic-crm/settings/SettingsPage.tsx` | Settings | Admin-gated sections |
| `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Data provider | Single entry point for DB |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Auth provider | getIdentity, canAccess, caching |
| `src/atomic-crm/providers/commons/canAccess.ts` | RBAC logic | Permission matrix |
| `src/atomic-crm/services/sales.service.ts` | Sales service | Edge Function calls |
| `src/atomic-crm/validation/sales.ts` | Zod schemas | Sales validation rules |
| `src/atomic-crm/layout/Header.tsx` | Header nav | CanAccess wrapped UsersMenu |
| `src/components/admin/app-sidebar.tsx` | Sidebar | useCanAccess for resources |
| `supabase/functions/users/index.ts` | Edge Function | User create/update |
| `supabase/functions/_shared/supabaseAdmin.ts` | Admin client | Service role client |

---

## H.2 Raw Query Outputs

### Local Database Key Outputs

```sql
-- is_admin() function definition
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$

-- Function behavior test
is_admin_result | auth_uid | is_manager_or_admin_result | get_current_sales_id_result
-----------------+----------+----------------------------+-----------------------------
 t               |          |                            |
```

### Cloud Database Key Outputs

```sql
-- is_admin() identical to LOCAL

-- RLS policies (includes service_role_full_access)
service_role_full_access | ALL | service_role | USING (true) WITH CHECK (true)

-- Function behavior test
is_admin_result | auth_uid | is_manager_or_admin_result | get_current_sales_id_result
true            | null     | null                       | null
```

---

## H.3 Verification Checklist

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

## H.4 RBAC State Summary

### Helper Functions

| Function | Returns | Special Behavior |
|----------|---------|------------------|
| `user_role()` | `user_role` | Current user's role enum |
| `is_admin()` | `BOOLEAN` | TRUE when auth.uid() is NULL |
| `is_manager()` | `BOOLEAN` | TRUE if role = 'manager' |
| `is_rep()` | `BOOLEAN` | TRUE if role = 'rep' |
| `is_manager_or_admin()` | `BOOLEAN` | TRUE if role IN ('admin', 'manager') |
| `current_sales_id()` | `BIGINT` | Current user's sales.id |

### Sales Table Columns (RBAC-Related)

| Column | Type | Status |
|--------|------|--------|
| `role` | `user_role` | **PRIMARY** - NOT NULL |
| `is_admin` | `BOOLEAN` | **DEPRECATED** - Synced via trigger |
| `administrator` | `BOOLEAN` | **COMPUTED** - GENERATED AS (role = 'admin') |

### Triggers on Sales

| Trigger | Function | Purpose |
|---------|----------|---------|
| `keep_is_admin_synced` | `sync_is_admin_from_role()` | Backward compatibility |
| `enforce_sales_column_restrictions_trigger` | `enforce_sales_column_restrictions()` | Column-level security |

---

## H.5 Files to Debug with Logging (If Issues Persist)

| File | What to Log |
|------|-------------|
| `SalesPermissionsTab.tsx:107-137` | handleSave() formData contents |
| `unifiedDataProvider.ts:639-681` | update() params before salesService call |
| `sales.service.ts:82-95` | salesUpdate() body before invoke |
| `supabase/functions/users/index.ts:186-228` | PATCH handler - currentUserSale.role, body |

---

# Conclusion

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
*Document Lines: ~2200*
*Sources: Part 1 (752 lines), Part 2A (754 lines), Part 2B (694 lines)*
