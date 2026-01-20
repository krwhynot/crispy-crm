# Manual Browser Testing: Audit Remediation Verification

**Date:** 2026-01-09
**Status:** Historical - audit findings now tracked in `docs/technical-debt.md`

---

## Prerequisites

1. **Start Local Dev Server:**
   ```bash
   # Option A: Preserve existing test data (recommended if you have data set up)
   just dev-local-quick

   # Option B: Fresh database with seed data (clean slate)
   just dev-local

   # Option C: Vite only (if Supabase already running or using cloud)
   just dev
   ```

2. **Open Browser DevTools:**
   - Chrome: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Install React DevTools extension if not already installed

3. **Login:** Use a test account with Manager or Admin role for full access

---

## Test 1: Bulk Reassign Organizations (Item 6a)

**Purpose:** Verify that bulk reassigning organizations invalidates React Query cache and UI updates immediately without manual refresh.

### Setup
1. Navigate to **Organizations** list (`/organizations`)
2. Ensure you have at least 3 organizations assigned to a specific sales rep

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open DevTools **Network** tab | Ready to monitor requests | |
| 2 | Select 2-3 organizations using checkboxes | Bulk action toolbar appears | |
| 3 | Click **"Reassign"** button in toolbar | Reassign dialog opens | |
| 4 | Select a different sales rep from dropdown | Selection confirmed | |
| 5 | Click **"Confirm"** or **"Reassign"** | Dialog closes, success notification appears | |
| 6 | **CRITICAL:** Check the organization list | Organizations show NEW sales rep immediately (no page refresh needed) | |
| 7 | Check Network tab | Should see `invalidateQueries` trigger new GET request to `/organizations` | |

### Verification Criteria
- [ ] UI updates **immediately** after reassignment (no stale data)
- [ ] No manual refresh (`F5`) required
- [ ] Success notification displays
- [ ] Network shows fresh data fetch after mutation

---

## Test 2: Disable User with Reassignment (Item 6b)

**Purpose:** Verify that disabling a user and reassigning their records invalidates ALL affected resource caches.

### Setup
1. Navigate to **Settings** → **Team** or **Users** page
2. Identify a test user who has assigned:
   - At least 1 opportunity
   - At least 1 contact
   - At least 1 task
3. Have another user ready to receive reassigned records

### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open DevTools **Network** tab, clear existing requests | Ready to monitor | |
| 2 | Click **"Disable"** or **"..."** menu on the test user | Disable dialog appears | |
| 3 | If records exist, dialog should show reassignment options | "Reassign to" dropdown visible | |
| 4 | Select target user for reassignment | Target user selected | |
| 5 | Click **"Disable and Reassign"** | Progress indicator shows, then success | |
| 6 | **CRITICAL:** Navigate to **Opportunities** list | Should show reassigned opportunities under new owner | |
| 7 | Navigate to **Contacts** list | Should show reassigned contacts under new owner | |
| 8 | Navigate to **Tasks** list | Should show reassigned tasks under new owner | |
| 9 | Check Network tab | Should see multiple `invalidateQueries` - one for each resource type | |

### Verification Criteria
- [ ] All 5 resource types invalidated: `opportunities`, `contacts`, `organizations`, `tasks`, `sales`
- [ ] Each list shows updated ownership without refresh
- [ ] User is marked as disabled
- [ ] Network shows fresh fetches for all affected resources

### Expected Network Activity
After successful disable+reassign, you should see GET requests to:
- `/opportunities` or `/opportunities_summary`
- `/contacts` or `/contacts_summary`
- `/organizations`
- `/tasks`
- `/sales`

---

## Test 3: Form Rendering Performance (Item 9)

**Purpose:** Verify that `useWatch()` provides isolated re-renders instead of full form re-renders.

### Setup
1. Install **React DevTools** browser extension if not installed
2. Navigate to **Organizations** → Click **"+ New"** or use Quick Create

### Test Steps - TagDialog

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to a page with Tags (e.g., Contact edit) | | |
| 2 | Click to add/edit a tag | Tag dialog opens | |
| 3 | Open React DevTools **Profiler** tab | Ready to record | |
| 4 | Click **"Start profiling"** (record button) | Recording starts | |
| 5 | Change the **color** dropdown | Color preview updates | |
| 6 | Click **"Stop profiling"** | Recording stops | |
| 7 | Review the flame graph | Only color-related components should re-render | |

### Test Steps - QuickCreatePopover (Organizations)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Quick Create for Organizations | Popover with form appears | |
| 2 | Open React DevTools **Profiler** tab | Ready to record | |
| 3 | Click **"Start profiling"** | Recording starts | |
| 4 | Type in the **Name** field (several keystrokes) | Text appears in field | |
| 5 | Click **"Stop profiling"** | Recording stops | |
| 6 | Review commits in Profiler | Should see minimal component updates | |
| 7 | Start new recording | Recording starts | |
| 8 | Change **Organization Type** dropdown | Selection changes | |
| 9 | Stop and review | Only `OrganizationTypeSelect` component should re-render, NOT entire form | |
| 10 | Start new recording | Recording starts | |
| 11 | Change **Priority** dropdown | Selection changes | |
| 12 | Stop and review | Only `PrioritySelect` component should re-render | |

### Verification Criteria
- [ ] Changing one field does NOT cause full form re-render
- [ ] `OrganizationTypeSelect` renders in isolation when its value changes
- [ ] `PrioritySelect` renders in isolation when its value changes
- [ ] Name input changes don't trigger dropdown re-renders
- [ ] Flame graph shows targeted updates, not cascading re-renders

### How to Read the React DevTools Profiler

1. **Flame Graph View:** Shows component hierarchy
   - Gray = did not render
   - Colored = rendered (color indicates render time)

2. **Ranked View:** Shows components sorted by render time
   - Look for unexpected components in the list

3. **What to Look For:**
   - When changing Priority dropdown: Only `PrioritySelect` and its children should be colored
   - When changing Organization Type: Only `OrganizationTypeSelect` and its children should be colored
   - The parent `Form` component should be gray (not re-rendered)

---

## Summary Checklist

### Item 6: Stale Data in Bulk Actions
- [ ] **6a:** Bulk reassign organizations → UI updates immediately
- [ ] **6b:** Disable user with reassignment → All 5 resource lists update

### Item 9: Form Rendering Performance
- [ ] **9a:** TagDialog color change → isolated re-render
- [ ] **9b:** QuickCreatePopover fields → isolated re-renders per field

---

## Troubleshooting

### UI Not Updating After Bulk Action
1. Check browser console for errors
2. Verify `useQueryClient` is imported in the component
3. Check that `invalidateQueries` is called with correct query key
4. Look for: `queryClient.invalidateQueries({ queryKey: organizationKeys.all })`

### Full Form Re-renders Still Occurring
1. Ensure `useWatch` is used instead of `watch()`
2. Verify watched components are extracted to separate function components
3. Check that `control` prop is passed to `useWatch`
4. Pattern should be:
   ```tsx
   function IsolatedField({ control }) {
     const value = useWatch({ name: "fieldName", control });
     return <Select value={value} ... />;
   }
   ```

---

## Sign-Off

| Test | Tester | Date | Result |
|------|--------|------|--------|
| Bulk Reassign (6a) | Manual | 2026-01-09 | ✅ PASSED |
| Disable User (6b) | Manual | 2026-01-09 | ✅ PASSED |
| Form Performance (9) | - | - | ⚠️ Needs React DevTools |

**All Tests Passed:** [x] Yes (6a, 6b) / [ ] No

**Notes:**
```
Test 1 (6a): Bulk reassigned 3 organizations (All Ways Catering, A Plus Inc, AKRON)
to Sue Martinez. UI updated immediately without refresh. 2208 total orgs in system.

Test 2 (6b): Disabled Sue Martinez with reassignment to Rep Test.
- 3 Organizations reassigned ✅
- 6 Tasks reassigned ✅
- Both caches invalidated properly, UI reflected changes immediately.

Test 3 (9): Form interactions work correctly. useWatch isolation requires
React DevTools Profiler for verification - cannot be automated.
```
