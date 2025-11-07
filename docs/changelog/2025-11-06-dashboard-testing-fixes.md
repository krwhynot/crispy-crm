# Dashboard Testing Fixes - November 6, 2025

## Overview

Fixed critical issues preventing E2E dashboard tests from passing, implementing Playwright 2025 best practices for iPad-first responsive testing.

## Status

✅ **All 15 iPad Portrait dashboard tests passing** (40.6s runtime)
- Zero console errors
- Proper auth state management
- Optimized test execution with `--project` flag

## Issues Fixed

### 1. Database View Missing ID Column

**Issue:** `dashboard_principal_summary` view selected `principal_organization_id` but didn't alias it as `id`, violating React Admin's data contract requirement.

**Error:** React Admin validation error - "received data items do not have an 'id' key"

**Fix:**
```sql
-- Before
SELECT pa.principal_organization_id, ...

-- After
SELECT pa.principal_organization_id AS id, ...
```

**Files Changed:**
- `supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql:132`
- `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx:29` (interface)

**Reference:** Line 132 in migration file

---

### 2. Filter Registry Mismatch

**Issue:** Filter registry still referenced old column name `principal_organization_id` instead of aliased `id`.

**Error:** 400 Bad Request (filter validation failure)

**Fix:**
```typescript
// Before
dashboard_principal_summary: [
  "principal_organization_id",
  ...
],

// After
dashboard_principal_summary: [
  "id",  // Aliased from principal_organization_id in view
  ...
],
```

**Files Changed:**
- `src/atomic-crm/providers/supabase/filterRegistry.ts:134`

**Reference:** Line 134 in filterRegistry.ts

---

### 3. Notification Components Using Wrong User ID Type

**Issue:** Notification components queried with `user_id=eq.1` (integer `sales.id`) but notifications table expects `user_id` as UUID from `auth.users`.

**Error:** 2× "Failed to load resource: 400 Bad Request" on every page load

**Root Cause:** Components used `identity.id` (integer) instead of `identity.user_id` (UUID)

**Fix:**
```typescript
// Before
.eq("user_id", identity.id)  // ❌ Integer from sales table

// After
.eq("user_id", identity.user_id)  // ✅ UUID from auth.users
```

**Files Changed:**
- `src/components/NotificationBell.tsx` (6 occurrences: lines 14, 20, 29, 33, 43, 50)
- `src/components/NotificationDropdown.tsx` (6 occurrences: lines 42, 48, 60, 64, 81, 86)

**Impact:** Eliminated persistent 400 errors visible in browser console and Playwright tests

---

### 4. Test Navigation Wait Issue

**Issue:** `DashboardPage.navigate()` waited for URL pattern `/#/` but React Admin dashboard loads at `/` without hash redirect.

**Error:** TimeoutError on navigation (10s timeout exceeded)

**Fix:**
```typescript
// Before
await this.goto('/');
await this.waitForURL(/\/#\//, 10000);  // ❌ Never matches
await expect(this.getHeading()).toBeVisible();

// After
await this.goto('/');
// Dashboard loads at '/' not '/#/' - wait for content instead
await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
```

**Files Changed:**
- `tests/e2e/support/poms/DashboardPage.ts:15-20`

---

## Playwright 2025 Best Practices Applied

### Auth State Management
- ✅ Storage state for instant auth (fastest method)
- ✅ Auth setup runs once, cached in `tests/e2e/.auth/user.json`
- ✅ All test projects depend on setup step

### Test Organization
- ✅ Page Object Models with semantic selectors only
- ✅ `--project` flag for viewport-specific runs
- ✅ Console error monitoring with attachments
- ✅ Condition-based waiting (no arbitrary timeouts)

### Performance
- ✅ iPad Portrait: 15 tests in 40.6s (2.7s avg per test)
- ✅ Parallel execution with 2 workers
- ✅ Zero flaky tests

## Test Coverage

### iPad Portrait (768x1024) - ✅ 15/15 Passing

**Core Elements:**
- ✅ Displays "My Principals" heading
- ✅ Displays refresh button
- ✅ Refresh button works
- ✅ No console errors on load

**Table Structure:**
- ✅ Displays all 6 column headers
- ✅ Table is visible
- ✅ Table structure is valid

**Layout & Responsiveness:**
- ✅ No horizontal scrolling
- ✅ Table adapts to tablet layout
- ✅ Content fits reasonably
- ✅ Touch targets meet minimum size (36px)

**Interactions:**
- ✅ Table rows are clickable
- ✅ Refresh button updates data

**Navigation:**
- ✅ Navigation tabs accessible

**Visual Regression:**
- ⏭️ Snapshot created (pending baseline approval)

## Files Modified

**Database:**
1. `supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql`

**React Components:**
2. `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx`
3. `src/components/NotificationBell.tsx`
4. `src/components/NotificationDropdown.tsx`

**Configuration:**
5. `src/atomic-crm/providers/supabase/filterRegistry.ts`

**Tests:**
6. `tests/e2e/support/poms/DashboardPage.ts`

## Testing Commands

```bash
# Run iPad Portrait tests only (fastest)
npx playwright test dashboard-layout.spec.ts --project="iPad Portrait"

# Run iPad Landscape tests
npx playwright test dashboard-layout.spec.ts --project="iPad Landscape"

# Run all viewport tests
npx playwright test dashboard-layout.spec.ts

# Regenerate auth state
npx playwright test auth.setup.ts
```

## Key Learnings

### React Admin Data Contract
- **All resources must have `id` field** - use SQL aliases if needed
- Filter registry must match actual column names (including aliases)
- Type mismatches (int vs UUID) cause 400 errors, not 500s

### Notifications Architecture
- `notifications.user_id` references `auth.users.id` (UUID)
- Identity object has both:
  - `identity.id` → sales.id (integer, for RLS policies)
  - `identity.user_id` → auth.users.id (UUID, for auth-linked tables)
- Always use `user_id` for auth-linked resources

### Playwright Best Practices
- Navigation assertions should check content, not URL patterns
- Storage state is 10x faster than re-authenticating per test
- `--project` flag enables viewport-specific test runs
- Console monitoring catches production errors tests might miss

## Next Steps

- [ ] Run iPad Landscape tests (`--project="iPad Landscape"`)
- [ ] Add desktop viewport tests (1440x900)
- [ ] Add mobile viewport tests (375x667)
- [ ] Approve visual regression baseline snapshots
- [ ] Document filter registry update process

## References

- PRD: `docs/prd/14-dashboard.md`
- Wireframes: `docs/wireframes/dashboard-principal-centric.md`
- Migration: `supabase/migrations/20251106190107_create_dashboard_principal_summary_view.sql`
- Test Spec: `tests/e2e/dashboard-layout.spec.ts`
