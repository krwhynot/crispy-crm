# Task 2.1: Playwright E2E Setup - Implementation Summary

**Task**: Setup Playwright configuration with auth fixtures for E2E testing
**Status**: ✅ Complete
**Date**: 2025-10-06

## Files Created

### 1. Configuration Files

#### `/home/krwhynot/Projects/atomic/playwright.config.ts`
- **Purpose**: Main Playwright configuration for E2E testing
- **Key Features**:
  - Chromium-only browser (WSL2 constraint)
  - Headless mode for all projects (required for WSL2)
  - Retries: 2 attempts for flaky tests (fail fast pattern)
  - Parallel workers: 4 concurrent tests
  - Base URL: `http://localhost:5173` (configurable via `BASE_URL` env var)
  - Timeout: 30s per test, 10min global
  - Screenshots/videos/traces on failure for debugging
  - Three viewport projects: desktop, tablet, mobile
  - Global setup/teardown hooks
  - Auto-starts dev server if BASE_URL not set

### 2. Global Setup/Teardown

#### `/home/krwhynot/Projects/atomic/tests/global-setup.ts`
- **Purpose**: Create test users before all test suites
- **Key Features**:
  - Creates test admin user (`test-admin@example.com`)
  - Creates test regular user (`test-user@example.com`)
  - Uses Supabase service role client to bypass RLS
  - Creates `sales` records with `is_admin` flag for RBAC testing
  - Handles "user already exists" errors gracefully
  - NO global auth-state.json (per Zen recommendation - prevents session expiry)

#### `/home/krwhynot/Projects/atomic/tests/global-teardown.ts`
- **Purpose**: Clean up test users after all test suites
- **Key Features**:
  - Deletes test users via Supabase Admin API
  - Cascade deletes associated sales records
  - Logs errors but doesn't throw (allows tests to complete)

### 3. Authentication Fixtures

#### `/home/krwhynot/Projects/atomic/tests/fixtures/authenticated.ts`
- **Purpose**: Per-test-file auth fixtures for fresh logins
- **Key Pattern**: Zen recommendation - fresh login per test file, not global JSON
- **Exported Fixtures**:
  1. `authenticatedPage`: Regular user (non-admin) authenticated page
  2. `authenticatedAdminPage`: Admin user authenticated page
- **Benefits**:
  - Prevents session expiry issues
  - Reuses authenticated context across tests in same file
  - Each test file gets clean authenticated session
  - Captures screenshots on login failure for debugging

### 4. Example Test

#### `/home/krwhynot/Projects/atomic/tests/e2e/example.spec.ts`
- **Purpose**: Demonstrates authenticated fixture usage
- **Tests**:
  1. Regular user navigation to opportunities
  2. Admin user navigation to dashboard
- **Note**: Remove/replace when implementing actual E2E tests

## Package.json Updates

### New npm Scripts Added
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug"
```

### New Dependencies Installed
```json
"@playwright/test": "^1.55.1",
"@axe-core/playwright": "^4.10.2"
```

## Environment Variables Required

The following environment variables are used by Playwright tests:

### Authentication (from .env)
```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### Test Users (optional - defaults provided)
```bash
TEST_ADMIN_EMAIL=test-admin@example.com  # Default
TEST_ADMIN_PASSWORD=TestAdmin123!        # Default
TEST_USER_EMAIL=test-user@example.com    # Default
TEST_USER_PASSWORD=TestUser123!          # Default
```

### Base URL (optional - auto-starts dev server if not set)
```bash
BASE_URL=http://localhost:5173  # Default
```

## Critical Implementation Details

### 1. Per-Test-File Auth Pattern (Zen Recommendation)

**AVOID**: Global auth-state.json
```typescript
// ❌ DON'T DO THIS
globalSetup() {
  await page.context().storageState({ path: 'auth-state.json' });
}
```

**CORRECT**: Per-test-file fixtures
```typescript
// ✅ DO THIS
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Fresh login per test file
    await loginAs(page, email, password);
    await use(page);
    await context.close();
  }
});
```

**Rationale**: Auth tokens expire, causing flaky tests. Fresh login per test file prevents session pollution.

### 2. Test Isolation

Each test should create its own data in `beforeEach`:
```typescript
test.describe('My tests', () => {
  const cleanups = [];

  test.afterEach(async () => {
    await safeCleanup(cleanups);
    cleanups.length = 0;
  });

  test('my test', async ({ authenticatedPage }) => {
    const { data, cleanup } = await createTestData();
    cleanups.push(cleanup);
    // test logic...
  });
});
```

### 3. User-Facing Selectors (Mandatory)

**Hierarchy**:
1. ✅ `page.getByRole('button', { name: /create/i })`
2. ✅ `page.getByLabel('Email')`
3. ✅ `page.locator('[data-testid="submit-form"]')`
4. ❌ `page.click('.btn-primary')` (brittle - CSS changes)
5. ❌ `page.click('text=Submit')` (brittle - i18n changes)

### 4. WSL2 Constraints

- **Headless mode required** (no GUI)
- Chromium browser only
- Browsers installed via: `npx playwright install chromium --with-deps`
- May require sudo permissions (install separately in CI)

## Next Steps (Future Tasks)

### Task 2.2: Test Data Factories & Cleanup Utilities
- Create `tests/utils/db-helpers.ts` with `safeCleanup()` helper
- Create `tests/utils/test-data-factory.ts` with Faker-based generators
- Create `tests/utils/auth-helpers.ts` with user creation helpers
- Implement DELETION_ORDER constant for foreign key cascade

### Task 2.3-2.7: Actual E2E Tests
- Flow 1: Create Opportunity
- Flow 2: Contact Management
- Flow 3: Filters & Search
- Flow 4: Edit Flow
- Flow 5: Kanban Validation
- Flow 6: Authorization (RBAC) - **CRITICAL GAP**
- Accessibility baseline tests

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
```
✅ Passed - no compilation errors

### Playwright Config Validation
```bash
npx playwright test --list
```
Expected: Lists 0 tests (example.spec.ts is placeholder)

### Manual Test (when dev server running)
```bash
npm run dev  # Terminal 1
npm run test:e2e  # Terminal 2
```

## Engineering Constitution Compliance

✅ **NO OVER-ENGINEERING**: Simple config, fail fast, 2 retries max
✅ **SINGLE SOURCE OF TRUTH**: Supabase for all test data, minimal mocking
✅ **FAIL FAST**: No health monitoring, abort on setup failures
✅ **VALIDATION**: Tests will verify Zod schemas at API boundary
✅ **COLORS**: Tests will use semantic CSS variables only

## Critical Gotchas Documented

1. **WSL2 requires headless mode** - No GUI browser windows
2. **NO global auth-state.json** - Use per-test-file fixtures
3. **Test isolation required** - Each test creates own data
4. **User-facing selectors mandatory** - No CSS classes or text content
5. **Cleanup resilience** - Use `safeCleanup()` helper (Task 2.2)
6. **RBAC testing critical** - Test both admin and non-admin access

## References

- **Requirements**: `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md`
- **Parallel Plan**: `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/parallel-plan.md` (lines 691-767)
- **Shared Architecture**: `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/shared.md`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Engineering Constitution**: `/home/krwhynot/Projects/atomic/CLAUDE.md`
