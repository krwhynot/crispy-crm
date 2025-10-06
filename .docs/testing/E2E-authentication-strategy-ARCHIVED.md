# E2E Test Authentication Strategy

## Chosen Approach: Global Auth State

### Decision Date
2025-10-06

### Rationale
- **Performance**: Login once in global setup vs. per-test-file
- **Simplicity**: Single auth pattern throughout test suite
- **Smoke Test Optimization**: Critical path tests need speed
- **Scale**: Appropriate for 6-8 user system

### Architecture

```
Global Setup (runs once)
  ├─> Create/verify test users exist (test@gmail.com)
  ├─> Login and save auth state to ./playwright/.auth/user.json
  └─> Login admin and save to ./playwright/.auth/admin.json

Test Execution
  ├─> Regular tests: Load user.json automatically
  └─> Admin tests: Load admin.json automatically

Global Teardown (runs once)
  └─> Skip cleanup (persistent test account)
```

### Test Data Strategy

**Service Role Client** (for test setup/teardown):
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Creates test data before tests run
- Cleans up test data after tests complete
- **Never** used during actual test execution

**Test Execution**:
- Tests use pre-authenticated browser context
- All operations go through application UI/API
- Respects RLS policies (tests real-world behavior)

## Implementation Details

### Files Using This Pattern

1. **`tests/global.setup.ts`** - Creates auth state
2. **`playwright.config.ts`** - Configures storageState for projects
3. **`tests/global-teardown.ts`** - Cleanup (currently disabled)

### Service Role Client Configuration

Service role client must be configured to properly bypass RLS:

```typescript
export const serviceClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  }
);
```

**Key**: Service role key automatically authenticates requests as `service_role` PostgreSQL role.

### Removed Patterns

❌ **Per-Test-File Fixtures** (`tests/fixtures/authenticated.ts`)
- Conflicted with global auth state
- Caused authentication timeouts
- Removed from test imports

## Test Categories

### Regular User Tests
- **Auth State**: `./playwright/.auth/user.json`
- **User**: test@gmail.com (non-admin)
- **Files**: Most test files
- **Config**: `playwright.config.ts` projects with `testIgnore: /.*\.admin\.spec\.ts$/`

### Admin User Tests
- **Auth State**: `./playwright/.auth/admin.json`
- **User**: test@gmail.com (admin privileges via sales.is_admin)
- **Files**: `*.admin.spec.ts`
- **Config**: `playwright.config.ts` admin project

### Authorization Tests
- **Pattern**: Create test users via service role client
- **Auth**: Each test logs in as specific user
- **Cleanup**: Delete test users after test
- **File**: `tests/e2e/authorization.spec.ts`

## Environment Variables

Required in `.env.test`:

```bash
# Test user credentials
TEST_USER_EMAIL=test@gmail.com
TEST_USER_PASSWORD=Welcome123
TEST_ADMIN_EMAIL=test@gmail.com
TEST_ADMIN_PASSWORD=Welcome123

# Service role for test data management
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migration Notes

### Changed Files
1. Removed fixture imports from accessibility tests
2. Removed fixture imports from opportunities tests
3. Updated authorization tests to use base Playwright test
4. Fixed service role client configuration

### Breaking Changes
- Tests using `authenticatedPage` fixture must switch to global auth state
- Import from `@playwright/test` instead of `../fixtures/authenticated`
- Use `page` parameter instead of `authenticatedPage`

## Troubleshooting

### "Permission denied for table X"
- **Cause**: Service role client not properly configured
- **Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.test`
- **Check**: Role has `rolbypassrls: true` in database

### "Timeout waiting for email input"
- **Cause**: Already authenticated from global setup
- **Fix**: Don't try to login again, use existing auth state
- **Check**: Remove fixture imports, use base `test` from Playwright

### "No tests found"
- **Cause**: @smoke tags missing from test names
- **Fix**: Add `@smoke` suffix to test names (not just comments)
- **Example**: `test('creates opportunity @smoke', ...)`
