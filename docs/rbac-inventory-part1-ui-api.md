# RBAC Architecture Inventory - Part 1: UI & Data/API Layer

**Generated:** 2025-12-11
**Session:** Part 1 of 2
**Scope:** UI Components + Data/API Layer
**Mode:** Deep ultrathink analysis

---

## Executive Summary

| Category | Count | Key Findings |
|----------|-------|--------------|
| User Management UI Entry Points | 3 | Settings→Team, Header→UsersMenu, Sidebar (all admin-gated) |
| Edit Interfaces Found | 4 | SalesEdit.tsx, SalesProfileTab, SalesPermissionsTab, SalesSlideOver |
| Permission Checks in UI | 6+ | canAccess(), identity?.role, isSelfEdit, CanAccess component |
| Data Provider Methods | 5 | getList, getOne, create, update (soft), delete (soft) |
| Edge Functions | 5 | users, updatePassword, daily-digest, check-overdue-tasks, digest-opt-out |
| **Potential Issues** | **4 Critical** | Two update paths, cache staleness, type mismatch, RLS/Edge desync |

---

## Part 1: UI Layer Findings

### 1.1 All User/Team Management Components

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

### 1.2 Entry Points to User Editing

#### Entry Point A: Settings → Team Section (Admin Only)

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

#### Entry Point B: Header User Menu (Admin Only)

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

#### Entry Point C: App Sidebar Navigation (Admin Only)

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

#### Entry Point D: Direct URL Navigation

| Route | Behavior |
|-------|----------|
| `/sales` | SalesList renders (requires admin) |
| `/sales?view=:id` | Opens SalesSlideOver for user :id |
| `/admin/users` | Redirects to `/sales` |
| `/admin/users/:id` | Redirects to `/sales?view=:id` |

---

### 1.3 Component Deep Dive

#### Component: SalesPermissionsTab (CRITICAL)

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

#### Component: SalesProfileTab

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/sales/SalesProfileTab.tsx`
**Purpose:** Edit user profile (name, email, phone, avatar)

| Aspect | Details |
|--------|---------|
| Props | `record: any`, `mode: "view" \| "edit"`, `onModeToggle?: () => void` |
| Form Fields | first_name, last_name, email, phone, avatar_url |
| Save Method | `useUpdate("sales", { id, data, previousData })` |
| Validation | `validateUpdateSales()` at save time |

---

#### Component: SalesEdit

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

### 1.4 Role/Permission Checks Across UI

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

### 1.5 UI Component Tree

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

### 1.6 Routes Configuration

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

## Part 2: Data/API Layer Findings

### 2.1 Data Provider Analysis

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (1,319 lines)

#### Resource Handlers

| Resource | getList | getOne | create | update | delete | Custom |
|----------|---------|--------|--------|--------|--------|--------|
| sales | ✅ Base | ✅ Base | ✅ SalesService | ✅ SalesService | ✅ Soft | `salesCreate`, `salesUpdate`, `updatePassword` |
| users | N/A | N/A | N/A | N/A | N/A | Handled by Edge Function |

#### Sales Resource Handling

**Two Distinct Update Paths Discovered (CRITICAL):**

**Path 1: SalesProfileTab & SalesPermissionsTab**
```tsx
// Uses React Admin's useUpdate hook
await update("sales", { id, data, previousData });
```
Flow: `useUpdate` → `unifiedDataProvider.update()` → **Direct Supabase** (with RLS)

**Path 2: SalesEdit.tsx (full-page form)**
```tsx
// Uses SalesService directly
const salesService = new SalesService(dataProvider);
mutate(data); // → salesService.salesUpdate()
```
Flow: `SalesService.salesUpdate()` → `dataProvider.invoke("users")` → **Edge Function**

---

### 2.2 Edge Function Analysis

**File:** `/home/krwhynot/projects/crispy-crm/supabase/functions/users/index.ts` (307 lines)

#### HTTP Methods Supported

| Method | Purpose | Authorization |
|--------|---------|---------------|
| OPTIONS | CORS preflight | None |
| POST | Create new user | Admin only |
| PATCH | Update existing user | Self or Admin |
| GET/DELETE | Not supported | Returns 405 |

#### Admin Check Logic (Lines 114-116, 191)

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

#### Field Restrictions by Role

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

### 2.3 Auth Provider Analysis

**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` (125 lines)

#### getIdentity Returns

```typescript
{
  id: sale.id,                    // From sales table (number)
  fullName: `${first_name} ${last_name}`,
  avatar: sale.avatar_url,
  role: sale.role || "rep",       // Defaults to "rep"
}
```

#### Role Source

- **Fetched from:** `sales` table query on `user_id = auth.uid()`
- **Caching:** 15-minute TTL (`CACHE_TTL_MS = 15 * 60 * 1000`)
- **Refresh trigger:** Cache expiry OR login/logout

#### Caching Behavior

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

### 2.4 Supabase Client Configuration

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

### 2.5 Validation Schemas

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

## Part 3: Issues & Inconsistencies Found

### Issue 1: Two Update Paths for Sales (CRITICAL)

| Attribute | Value |
|-----------|-------|
| Layer | UI / Data Provider |
| Severity | **Critical** |
| Files | `SalesProfileTab.tsx`, `SalesPermissionsTab.tsx`, `SalesEdit.tsx`, `sales.service.ts` |

**Description:**

Two different code paths exist for updating sales records:

1. **SlideOver tabs** use `useUpdate("sales")` → Direct Supabase via Data Provider
2. **Full-page SalesEdit** uses `SalesService.salesUpdate()` → Edge Function

**Evidence:**

```tsx
// Path 1: SalesProfileTab.tsx:63
await update("sales", { id: record.id, data: formData, previousData: record });

// Path 2: SalesEdit.tsx:44
return salesService.salesUpdate(record.id, data);  // → Edge Function
```

**Potential Impact on Admin Edit Bug:**

- Path 1 (SlideOver) hits RLS policies directly
- Path 2 (Full-page) bypasses RLS via Edge Function
- **If admin is using SlideOver**, RLS might block role/disabled updates
- **If using full-page edit**, Edge Function handles authorization

---

### Issue 2: Cache Staleness After Role Update

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

### Issue 3: Type Mismatch - identity.id

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

### Issue 4: RLS vs Edge Function Authorization Desync

| Attribute | Value |
|-----------|-------|
| Layer | Database / Edge Functions |
| Severity | **Critical** |
| Files | RLS policies, `users/index.ts` |

**Description:**

- **RLS Policy** allows self-update of ANY field for the user's own record
- **Edge Function** restricts non-admins to avatar-only updates

**Evidence:**

RLS Policy (migration):
```sql
CREATE POLICY "update_sales" ON sales
  FOR UPDATE
  USING (is_admin() OR (user_id = auth.uid()))
```

Edge Function (lines 207-228):
```typescript
// Non-admins can ONLY update avatar
if (currentUserSale.role !== 'admin') {
  await updateSaleViaRPC(supabaseClient, saleToUpdate.user_id, {
    avatar: avatar ?? undefined
  });
}
```

**Impact:**

- If Path 1 (direct Supabase) is used, RLS allows ALL fields including `role`
- If Path 2 (Edge Function) is used, only avatar is allowed
- **Inconsistent security enforcement!**

---

## Part 4: Data Flow Traces

### Flow A: Admin Editing Another User (SlideOver - Path 1)

```
Step 1: Admin clicks user row in SalesList
    ↓
Step 2: SalesSlideOver opens with recordId
    ↓
Step 3: Admin clicks "Edit" → mode="edit"
    ↓
Step 4: Admin modifies role in SalesPermissionsTab
    ↓
Step 5: Admin clicks "Save Changes"
    ↓
Step 6: handleSave() validates with validateUpdateSales()
    ↓
Step 7: update("sales", { id, data: { role }, previousData })
    ↓
Step 8: unifiedDataProvider.update() called
    ↓
Step 9: processForDatabase() → validate → transform
    ↓
Step 10: ⚠️ UNCLEAR: Does it use SalesService or direct update?
    ↓
Step 11: If direct → RLS allows (admin) → Success
Step 11: If SalesService → Edge Function → admin check → Success
    ↓
Step 12: Response returns, SlideOver refreshes
```

### Flow B: User Editing Own Profile (SlideOver)

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
Step 6: unifiedDataProvider.update()
    ↓
Step 7: ⚠️ If direct Supabase: RLS allows (user_id = auth.uid())
Step 7: ⚠️ If Edge Function: Only avatar allowed!
    ↓
Step 8: SUCCESS or FAILURE depending on path taken
```

---

## Part 5: Open Questions for Part 2

Questions that need database/migration analysis to answer:

1. **What RLS policies exist for the sales table?**
   - Need to see exact USING and WITH CHECK conditions

2. **Are there database triggers that sync `is_admin` with `role`?**
   - Documentation mentions trigger but need to verify migration

3. **What SECURITY DEFINER functions exist?**
   - `admin_update_sale` - what parameters does it accept?
   - `get_sale_by_id`, `get_sale_by_user_id` - exact authorization logic?

4. **What is the state of migrations on local vs cloud?**
   - Any drift between environments?

5. **Does the `is_admin` column still exist or has it been removed?**
   - Auth provider still queries it but uses `role` primarily

---

## Appendix: All Files Examined

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

## Summary: Key Findings for Admin Edit Bug Investigation

### Most Likely Causes

1. **Two update paths** - SlideOver uses direct Supabase, SalesEdit uses Edge Function
2. **RLS vs Edge Function mismatch** - Different authorization rules for same operation
3. **Cache staleness** - Role changes not immediately reflected

### Recommended Investigation Path

1. Trace which update path is actually used when admin edits via SlideOver
2. Check if `unifiedDataProvider.update("sales")` delegates to SalesService or goes direct
3. Verify RLS policies allow admin to update ANY sales record
4. Test both paths with debug logging to confirm behavior

### Critical File to Examine Next

`/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` lines 639-681 - the `update()` method for "sales" resource.

---

*End of Part 1 Inventory*
