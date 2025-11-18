# Dashboard V3 - End-to-End Testing Guide

## Overview

This guide explains how to run comprehensive E2E tests for the Principal Dashboard V3. The tests verify the complete stack from UI interactions through the DataProvider to Supabase and back.

**Test Suite:** `tests/e2e/dashboard-v3/dashboard-v3.spec.ts`
**Coverage:** 17 test scenarios across 6 categories
**Browsers:** Chromium, iPad Portrait, iPad Landscape

## Prerequisites

### 1. Database Requirements

The Dashboard V3 tests require specific database state:

**Migration Applied:**
```bash
# Verify migration is applied
npm run db:cloud:status | grep 20251118050755

# Should show:
# 20251118050755 | 20251118050755 | 2025-11-18 05:07:55
```

**Required Tables/Views:**
- `principal_pipeline_summary` view (created by migration)
- `tasks` table with test user's tasks
- `activities` table with recent activities
- `organizations` table with principal organizations
- `sales` table with user_id linked to auth.users

### 2. Test User Setup

**Required:**
- Authenticated user in auth.users
- Corresponding sales record with `user_id = auth.users.id`
- Email match for legacy users without user_id

**SQL to create test user:**
```sql
-- 1. Create auth user (via Supabase dashboard or signup flow)
-- Email: test@example.com
-- Password: your-secure-password

-- 2. Link sales record
UPDATE sales
SET user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
WHERE email = 'test@example.com';

-- Verify link
SELECT s.id, s.email, s.user_id, u.email as auth_email
FROM sales s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.email = 'test@example.com';
```

### 3. Test Data

**Minimum data for tests to pass:**

```sql
-- Principal organization (for pipeline panel)
INSERT INTO organizations (name, organization_type, created_at)
VALUES ('Test Principal', 'principal', NOW());

-- Opportunity (for momentum calculations)
INSERT INTO opportunities (
  name,
  stage,
  principal_organization_id,
  customer_organization_id,
  created_by
)
VALUES (
  'Test Opportunity',
  'discovery',
  (SELECT id FROM organizations WHERE name = 'Test Principal'),
  (SELECT id FROM organizations WHERE organization_type = 'customer' LIMIT 1),
  (SELECT id FROM sales WHERE email = 'test@example.com')
);

-- Tasks (for tasks panel - one in each bucket)
INSERT INTO tasks (title, due_date, type, priority, sales_id, created_by)
VALUES
  -- Overdue task
  ('Overdue task', CURRENT_DATE - INTERVAL '2 days', 'call', 'high',
   (SELECT id FROM sales WHERE email = 'test@example.com'),
   (SELECT id FROM sales WHERE email = 'test@example.com')),

  -- Today task
  ('Today task', CURRENT_DATE, 'email', 'medium',
   (SELECT id FROM sales WHERE email = 'test@example.com'),
   (SELECT id FROM sales WHERE email = 'test@example.com')),

  -- Tomorrow task
  ('Tomorrow task', CURRENT_DATE + INTERVAL '1 day', 'meeting', 'low',
   (SELECT id FROM sales WHERE email = 'test@example.com'),
   (SELECT id FROM sales WHERE email = 'test@example.com'));

-- Activities (for momentum indicators)
INSERT INTO activities (
  activity_type,
  type,
  subject,
  activity_date,
  opportunity_id,
  created_by
)
VALUES
  -- This week activity
  ('interaction', 'call', 'Recent call', NOW() - INTERVAL '2 days',
   (SELECT id FROM opportunities WHERE name = 'Test Opportunity'),
   (SELECT id FROM sales WHERE email = 'test@example.com')),

  -- Last week activity
  ('interaction', 'email', 'Last week email', NOW() - INTERVAL '10 days',
   (SELECT id FROM opportunities WHERE name = 'Test Opportunity'),
   (SELECT id FROM sales WHERE email = 'test@example.com'));
```

## Running Tests

### Full Test Suite

```bash
# Run all Dashboard V3 tests
npm run test:e2e -- dashboard-v3

# Run with UI (headed mode)
npm run test:e2e:headed -- dashboard-v3

# Run with debug mode
npm run test:e2e -- dashboard-v3 --debug

# Run specific test
npm run test:e2e -- dashboard-v3 -g "completes task via checkbox"
```

### Smoke Test

```bash
# Quick verification that route is accessible
npm run test:e2e -- smoke.spec.ts

# Check screenshot
ls -la dashboard-v3-smoke.png
```

### Cross-Browser Testing

```bash
# Run on all configured browsers
npm run test:e2e -- dashboard-v3 --project=chromium --project="iPad Portrait"

# WebKit only
npm run test:e2e -- dashboard-v3 --project=webkit
```

## Test Categories

### 1. Panel Rendering & Loading States (4 tests)

**What it tests:**
- All three panels render with correct headers
- Loading skeletons display before data
- Pipeline data from `principal_pipeline_summary` view
- Tasks grouped by time buckets (Overdue, Today, Tomorrow)

**Expected behavior:**
- ✅ Headers: "Pipeline by Principal", "My Tasks", "Log Activity"
- ✅ Skeletons animate while data loads
- ✅ Pipeline table shows Principal, Pipeline, This Week, Last Week, Momentum
- ✅ Task groups show at least one visible bucket

### 2. Task Interactions (2 tests)

**What it tests:**
- Complete task via checkbox with backend mutation
- Task details show related entity (organization/contact/opportunity)

**Expected behavior:**
- ✅ Clicking checkbox completes task
- ✅ Task disappears or shows completed state
- ✅ Backend state changes (verify in database)
- ✅ Related entity name visible with arrow (→)

### 3. Activity Logging (3 tests)

**What it tests:**
- Log activity with required fields (type, outcome, notes, organization)
- Create follow-up task automatically when checkbox enabled
- Validate required fields before submission

**Expected behavior:**
- ✅ Form accepts activity type, outcome, notes, organization
- ✅ "Save & Close" closes form and resets fields
- ✅ Follow-up checkbox shows date picker
- ✅ New task appears in Tasks panel after save
- ✅ Missing required fields prevents submission

### 4. Resizable Panels & Persistence (3 tests)

**What it tests:**
- Drag handles resize panels
- Panel sizes persist to localStorage
- Panel sizes restore on page reload

**Expected behavior:**
- ✅ Dragging handle changes panel width
- ✅ `localStorage.getItem('principal-dashboard-v3-layout')` contains `[40, 30, 30]`
- ✅ Reloading page restores custom sizes

### 5. Error Handling (3 tests)

**What it tests:**
- Display error when pipeline view fails (500 status)
- Display error when tasks fail to load
- Recover gracefully from activity logging errors

**Expected behavior:**
- ✅ Error message visible in affected panel
- ✅ Other panels continue working
- ✅ Form stays open on save error
- ✅ Error notification displays

### 6. Accessibility (2 tests)

**What it tests:**
- All interactive elements ≥ 44px touch targets (WCAG 2.1 AA)
- Semantic HTML and ARIA attributes

**Expected behavior:**
- ✅ All buttons and checkboxes are 44x44px minimum
- ✅ Table has `role="table"`
- ✅ Checkboxes have `role="checkbox"`
- ✅ Panels have `data-panel` attributes

## Debugging Test Failures

### Tests Skip Immediately

**Symptom:** All tests show status `-` (skipped)

**Likely cause:** Dashboard header not found within timeout

**Debug steps:**
1. Run smoke test: `npm run test:e2e -- smoke.spec.ts`
2. Check screenshot: `dashboard-v3-smoke.png`
3. Verify route exists in browser: `http://127.0.0.1:5173/dashboard-v3`
4. Check auth state: `tests/e2e/.auth/user.json`

**Common fixes:**
- Ensure test user exists with sales record
- Verify `user_id` is set on sales record
- Check migration is applied to test database
- Clear browser storage and re-authenticate

### Tasks Panel Empty

**Symptom:** Task interaction tests skip due to no tasks

**Cause:** Test user has no tasks in database

**Fix:**
```sql
-- Add test tasks (see Test Data section above)
INSERT INTO tasks (title, due_date, sales_id, created_by)
VALUES ('Test task', CURRENT_DATE, YOUR_SALES_ID, YOUR_SALES_ID);
```

### Pipeline Panel Shows No Data

**Symptom:** Pipeline data test fails or shows empty state

**Cause:** No principal organizations with opportunities

**Fix:**
```sql
-- Add principal organization with opportunities
-- (see Test Data section above)
```

### Activity Logging Fails

**Symptom:** Activity logging tests timeout or show errors

**Cause:**
- Missing required enum values
- Organization select has no options
- Validation schema mismatch

**Fix:**
1. Verify `interaction_type` enum has 'note' value
2. Add test organization for selection
3. Check `activitySchema.ts` validation rules

### localStorage Tests Fail

**Symptom:** Panel persistence tests fail

**Cause:** localStorage not enabled in test browser context

**Fix:**
- Verify Playwright config enables localStorage
- Check `playwright.config.ts` has `storageState`
- Clear localStorage before tests: `localStorage.clear()`

## Console Monitoring

All tests include console error monitoring. If errors are detected:

1. **Review attached report:**
   ```
   See attached report: console-report
   ```

2. **Common console errors:**
   - RLS policy violations (403 errors)
   - Missing table columns (400 errors)
   - Network timeouts (Failed to fetch)
   - React errors (unhandled promise rejections)

3. **Fix RLS errors:**
   ```sql
   -- Grant access to authenticated users
   GRANT SELECT, INSERT, UPDATE ON tasks TO authenticated;

   -- Add RLS policy
   CREATE POLICY authenticated_select_tasks ON tasks
     FOR SELECT TO authenticated
     USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
   ```

## Performance Benchmarks

**Expected test duration:**
- Single test: 2-5 seconds
- Full suite (17 tests): 30-60 seconds
- Cross-browser (51 tests): 90-120 seconds

**Network requests:**
- Pipeline panel: 1 request to `/rest/v1/principal_pipeline_summary`
- Tasks panel: 1 request to `/rest/v1/tasks`
- Activity logging: 1-2 requests (activity + optional follow-up task)

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e -- dashboard-v3
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Maintenance

### Adding New Tests

1. **Create test case:**
   ```typescript
   test('descriptive test name', async ({ authenticatedPage }) => {
     // Arrange
     await authenticatedPage.goto('/dashboard-v3');

     // Act
     const element = authenticatedPage.locator('selector');
     await element.click();

     // Assert
     await expect(element).toHaveText('expected');
   });
   ```

2. **Follow patterns:**
   - Use `authenticatedPage` fixture
   - Include `test.skip()` for missing data
   - Add console monitoring check in `afterEach`
   - Verify backend mutations where applicable

3. **Update documentation:**
   - Add test to this guide
   - Update test count in overview
   - Document required data

### Updating for Schema Changes

**When database schema changes:**

1. Update migration number in Prerequisites
2. Add new test data requirements
3. Update SQL examples
4. Run full test suite to verify
5. Update expected request counts

**When UI changes:**

1. Update selectors in tests
2. Verify ARIA attributes still correct
3. Check touch target sizes
4. Update screenshots if using visual regression

## Troubleshooting Checklist

- [ ] Migration `20251118050755` applied to test database
- [ ] Test user exists with email/password
- [ ] Sales record has `user_id` linked to auth.users
- [ ] At least 1 principal organization exists
- [ ] At least 1 task exists for test user
- [ ] At least 1 activity exists in last 14 days
- [ ] Auth state file exists: `tests/e2e/.auth/user.json`
- [ ] Route `/dashboard-v3` accessible in browser
- [ ] Console shows no errors on manual load
- [ ] localStorage enabled in browser context

## Reference

- **Implementation Plan:** `docs/plans/2025-11-17-principal-dashboard-v3-CORRECTED.md`
- **Migration:** `supabase/migrations/20251118050755_add_principal_pipeline_summary_view.sql`
- **Test Pattern:** Testing Anti-Patterns skill (test real behavior, not mocks)
- **Playwright Docs:** https://playwright.dev/docs/intro
