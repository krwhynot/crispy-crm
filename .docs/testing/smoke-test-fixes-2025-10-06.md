# Smoke Test Fixes - 2025-10-06

## Test Results

### Before Fixes
```bash
Error: No tests found
```

### After Fixes
```bash
Running 5 tests using 4 workers

  ✘  [smoke] › authorization.spec.ts:34 - non-admin user cannot access sales resource @smoke
  ✘  [smoke] › authorization.spec.ts:96 - admin user can access all resources including sales @smoke
  ✘  [smoke] › accessibility.spec.ts:40 - dashboard has no critical a11y violations @smoke
  ✘  [smoke] › opportunities.spec.ts:35 - creates opportunity with validation @smoke
  ✘  [smoke] › accessibility.spec.ts:85 - opportunities list has no critical a11y violations @smoke

  5 failed (tests now discovered and running)
```

**Progress**: Tests discovered: 0 → 5 ✅

## Remaining Issues

1. **RLS Permission Denied**: Service role cannot insert into `sales` and `organizations` tables
2. **Authentication Timeout**: Fixture authentication conflicts with global auth state

## Changes Made

### 1. Fixed Environment Variables (.env.test)
**File**: `/home/krwhynot/Projects/atomic/.env.test`

**Change**:
```diff
 # Test User Credentials
 TEST_USER_EMAIL=test@gmail.com
+TEST_USER_PASSWORD=Welcome123
 TEST_ADMIN_EMAIL=test@gmail.com
+TEST_ADMIN_PASSWORD=Welcome123
 TEST_PASSWORD=Welcome123
```

**Rationale**: Added missing `TEST_USER_PASSWORD` and `TEST_ADMIN_PASSWORD` variables that the authenticated fixture expects.

### 2. Fixed auth-helpers.ts Environment Loading
**File**: `/home/krwhynot/Projects/atomic/tests/utils/auth-helpers.ts`

**Change**:
```diff
-// Load environment variables
-dotenv.config({ path: path.resolve(process.cwd(), '.env') });
+// Load test environment variables
+dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
```

**Rationale**: Test utilities should load test-specific environment configuration.

### 3. Fixed db-helpers.ts Environment Loading
**File**: `/home/krwhynot/Projects/atomic/tests/utils/db-helpers.ts`

**Change**:
```diff
-// Load environment variables
-dotenv.config({ path: path.resolve(process.cwd(), '.env') });
+// Load test environment variables
+dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
```

**Rationale**: Database helpers should load test-specific environment configuration.

### 4. Added @smoke Tags to Test Names

Added `@smoke` suffix to test names (Playwright grep searches test names, not comments):

- `tests/e2e/authorization.spec.ts` - 2 tests
- `tests/e2e/opportunities.spec.ts` - 1 test
- `tests/e2e/accessibility.spec.ts` - 2 tests

### 5. Fixed ES Module Compatibility (global.setup.ts)

- Added ES module `__dirname` polyfill using `import.meta.url`
- Changed to load `.env.test` instead of `.env`
- Added Supabase client for user creation

### 6. Simplified Global Teardown (global-teardown.ts)

Removed user deletion logic (using persistent test account instead of creating/deleting users)
