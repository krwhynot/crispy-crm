# E2E Smoke Tests - Manual Testing Checklist

Quick verification tests to ensure core functionality is working before running comprehensive test suites.

## Test Environment Setup

- **Browser:** Chrome, Firefox, or Safari
- **URL:** http://localhost:5173
- **Credentials:** admin@test.com / password123

---

## Test 1: Application Loads Without Errors

**Objective:** Verify the application loads successfully and shows the login page.

### Steps

1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Navigate to http://localhost:5173
4. Wait for page to load completely

### Expected Results

- ✓ Login page renders within 10 seconds
- ✓ Email input field is visible
- ✓ Password input field is visible
- ✓ "Sign In" or "Login" button is visible
- ✓ No console errors (red text in Console tab)
- ✓ No failed network requests in Network tab

### Console Monitoring

Watch for:
- **RLS errors:** "permission denied", "row-level security", "42501"
- **React errors:** "Uncaught", "React"
- **Network errors:** 500, 403, 401 status codes

---

## Test 2: Authentication and Dashboard Access

**Objective:** Verify user can log in and access the dashboard.

### Steps

1. From the login page, fill in credentials:
   - Email: `admin@test.com`
   - Password: `password123`
2. Click "Sign In" button
3. Wait for redirect

### Expected Results

- ✓ Authentication request to `/auth/v1/token` completes successfully (200 status)
- ✓ Page redirects to `http://localhost:5173/#/` within 15 seconds
- ✓ Login form is no longer visible
- ✓ Dashboard content loads
- ✓ No authentication errors in console
- ✓ No RLS (Row-Level Security) errors in console

---

## Test 3: Dashboard V3 Route Accessibility

**Objective:** Verify Dashboard V3 route is accessible and renders correctly.

### Steps

1. After successful login, navigate to `/dashboard-v3`
   - URL: http://localhost:5173/#/dashboard-v3
2. Wait for page to load

### Expected Results

- ✓ HTTP 200 response status
- ✓ Page renders without error boundary
- ✓ H1 heading is visible (check page title)
- ✓ No "error", "failed", or "something went wrong" messages
- ✓ Console shows no critical errors

### Debug Information

If test fails, capture:
- Current URL
- Page title (`document.title`)
- First 500 characters of body text
- Screenshot of the page
- Console errors

---

## Test 4: Basic Navigation Works

**Objective:** Verify navigation between core routes works without errors.

### Steps

1. From dashboard, navigate to:
   - `/contacts` (or use sidebar navigation)
   - `/organizations`
   - `/opportunities`
   - Back to `/` (dashboard)
2. On each page, wait for content to load

### Expected Results

- ✓ Each route responds with HTTP 200
- ✓ Page content renders (no blank screens)
- ✓ No error boundaries triggered
- ✓ No console errors during navigation
- ✓ Sidebar/navigation remains functional

---

## Test 5: No Console Errors on Idle

**Objective:** Verify no background errors occur when app is idle.

### Steps

1. Stay on dashboard for 30 seconds
2. Do not interact with the page
3. Monitor console for errors

### Expected Results

- ✓ No new console errors appear
- ✓ No uncaught promise rejections
- ✓ No network polling failures
- ✓ Page remains responsive (not frozen)

---

## Pass Criteria

**All 5 tests must pass** for smoke tests to be considered successful.

If any test fails:
1. Note the specific failure
2. Capture console errors
3. Take screenshot
4. Report to development team
5. **DO NOT proceed with comprehensive E2E tests** until smoke tests pass

---

## Notes

- These tests are designed for **rapid verification** (5-10 minutes total)
- Run smoke tests **before deploying** or after major changes
- Console errors related to `ResizeObserver` can be ignored (known browser quirk)
- Tests assume a clean database state with seed data loaded
