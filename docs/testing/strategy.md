# Testing Strategy

> **PRD Reference:** See `../PRD.md` v1.18 Section 10 (Technical Requirements) for testing coverage targets.

## Overview

Crispy-CRM (Atomic CRM) uses a multi-layer testing approach optimized for a pre-launch CRM with Supabase backend, iPad-first UI, and business workflow complexity.

**Philosophy:** Fast feedback, business-critical coverage, and practical test maintenance for a small team.

## Test Layers

### 1. Unit Tests (Vitest + React Testing Library)

**What:** Pure functions, hooks, validation schemas, utilities

**When to add:**
- New Zod validation schema (always test all branches)
- Custom hooks (usePrefs, useFeatureFlag, useResizableColumns, etc.)
- Utility functions (csvUploadValidator, taskGrouping, etc.)
- Form submission logic
- Complex business logic in components

**Pattern:**
```typescript
// Test validation schema
describe('contactSchema', () => {
  it('requires email format', () => {
    expect(() => contactSchema.parse({ email: 'invalid' })).toThrow();
  });

  it('accepts valid contact with JSONB array email', () => {
    const valid = contactSchema.parse({
      first_name: 'John',
      last_name: 'Doe',
      email: [{ email: 'john@example.com', type: 'Work' }]
    });
    expect(valid.email).toHaveLength(1);
  });
});
```

**Coverage target:** 70%+ for `src/**/*.{ts,tsx}`

**Location:** `src/**/__tests__/*.test.{ts,tsx}`

**Run commands:**
```bash
npm test                 # Watch mode
npm run test:coverage    # Coverage report
npm run test:ci          # Run once (for CI)
```

### 2. Integration Tests (Vitest + Supabase)

**What:** Data provider calls, RLS policies, CSV imports, auth flows

**When to add:**
- New DataProvider methods
- RLS policy changes (especially admin-only policies)
- Bulk operations (CSV import, batch updates with Promise.allSettled)
- Complex business logic spanning multiple tables
- JSONB array operations (email/phone/address fields)

**Pattern:**
```typescript
import { createTestHarness } from './supabase-harness';

describe('CSV Import', () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  afterEach(async () => {
    await harness.cleanup();
  });

  it('sanitizes formula injection', async () => {
    harness = await createTestHarness();
    const sanitized = sanitizeCsvValue('=cmd|/c calc');
    expect(sanitized).toBe("'=cmd|/c calc"); // Escaped

    // Test with real database insert
    const { data, error } = await harness.client
      .from('contacts')
      .insert({ first_name: sanitized })
      .select()
      .single();

    expect(error).toBeNull();
    harness.seedData.contactIds.push(data.id);
  });
});
```

**Location:** `tests/integration/`

**Run command:**
```bash
npm run test:integration
```

**Test Harness:** Use `tests/integration/supabase-harness.ts` for all Supabase tests
- Provides real database client
- Automatic cleanup in afterEach
- Tracks created IDs for deletion

### 3. E2E Tests (Playwright)

**What:** Critical user journeys, multi-step workflows, UI regressions

**When to add:**
- New user-facing feature (Dashboard, Kanban, Reports)
- Multi-step workflows (Opportunity close → activity log → task creation)
- Responsive layout changes (iPad/Desktop viewports)
- Authentication/permissions
- Keyboard shortcuts and accessibility features

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from './support/pom/DashboardPage';

test.describe('Dashboard V2 Filters', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('applies and persists health filter', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.navigate();

    // Apply filter
    await page.getByLabel('At Risk').check();

    // Verify active count badge
    await expect(page.getByTestId('active-filters-count')).toHaveText('1');

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByLabel('At Risk')).toBeChecked();
  });
});
```

**Required patterns:**
- ✅ Use POMs from `tests/e2e/support/pom/`
- ✅ Use authenticated fixture (`test.use({ storageState })`)
- ✅ Use semantic selectors (getByRole, getByLabel, getByText)
- ❌ NO manual login in tests
- ❌ NO arbitrary timeouts (`waitForTimeout`)
- ❌ NO CSS class selectors

**Projects:** Desktop (1440x900), iPad Landscape (1024x768), iPad Portrait (768x1024)

**Location:** `tests/e2e/specs/`

**Run commands:**
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Visible browser mode
```

**Standards:** See `tests/e2e/README.md` for complete Playwright patterns

### 4. Manual Testing

**What:** 5-minute smoke checklist before releases

**When:** Every deployment to production

**Checklist:**
1. Login & Navigation (1 min)
2. Contacts CRUD (1 min)
3. Opportunities & Kanban (1 min)
4. Organizations (1 min)
5. Tasks & Activities (1 min)

**Full checklist:** See `docs/guides/02-testing.md:16-66`

## High-Risk Areas Requiring Tests

### 1. Dashboard V2 Filters (CRITICAL)

**Why:** Primary workflow, complex state management, localStorage persistence

**Unit tests:**
- `usePrefs` hook (default state, persistence, update logic)
- Filter count calculation
- FilterState type validation

**E2E tests:**
- Filter persistence across reloads
- Clear all filters button
- Active count badge accuracy
- Sidebar collapse/expand with filter badge on rail
- Multiple filter combinations

**Files:**
- `src/atomic-crm/dashboard/v2/__tests__/usePrefs.test.ts`
- `tests/e2e/dashboard-v2-filters.spec.ts`
- `tests/e2e/dashboard-v2-sidebar-collapse.spec.ts`

### 2. CSV Imports (SECURITY)

**Why:** Data quality, formula injection prevention, DoS protection

**Integration tests:**
- Formula injection sanitization (=, @, +, -)
- Binary file detection (JPEG, ZIP magic bytes)
- Control character filtering
- File size limits (10MB)
- Invalid CSV structure handling

**E2E tests:**
- Upload flow with valid CSV
- Error messages for invalid files
- Bulk import with Promise.allSettled error handling

**Files:**
- `src/atomic-crm/utils/__tests__/csvUploadValidator.test.ts` (26 tests)
- `tests/integration/csv-import.test.ts`
- `tests/fixtures/contacts-{valid,invalid,formula-injection}.csv`

### 3. RLS Policies (SECURITY)

**Why:** Multi-tenancy, admin-only operations, personal data isolation

**Integration tests:**
- Admin-only UPDATE/DELETE policies (contacts, orgs, opportunities)
- Personal task access (sales_id filtering)
- Team-wide read access (shared contacts/orgs)
- Authenticated vs unauthenticated access

**Files:**
- `tests/integration/rls-policies.test.ts` (TO BE CREATED)

**Reference migrations:**
- `20251018203500_update_rls_for_shared_team_access.sql`
- `20251108213039_fix_rls_policies_role_based_access.sql`

### 4. Supabase Auth (SESSION MANAGEMENT)

**Why:** Login failures = app unusable, session refresh critical

**Integration tests:**
- Login flow with valid credentials
- Logout and session cleanup
- Session refresh (token expiration)
- Protected route access

**E2E tests:**
- Login UI flow
- Auto-redirect to login when unauthenticated
- Role-based UI elements (admin-only buttons)

**Files:**
- `tests/integration/auth-flow.test.ts` (TO BE CREATED)
- `tests/e2e/auth.spec.ts` (already exists)

### 5. JSONB Array Operations (DATA INTEGRITY)

**Why:** Email/phone/address fields use JSONB arrays, prone to validation errors

**Unit tests:**
- Zod sub-schemas (emailAndTypeSchema, phoneAndTypeSchema)
- Default value handling (`[]` not `null`)
- Array item validation

**Integration tests:**
- Insert/update with JSONB arrays
- Empty array handling
- Invalid array structure rejection

**Files:**
- `src/atomic-crm/validation/__tests__/*.test.ts`

## Coverage Gates

### Unit Tests
- **Minimum:** 70% (lines, functions, branches, statements)
- **Enforced in:** CI/CD via `vitest.config.ts`
- **Report:** `npm run test:coverage`

### Integration Tests
- **Minimum:** All Supabase RLS policies tested
- **Minimum:** All DataProvider CRUD methods tested
- **No hard percentage** - focus on critical paths

### E2E Tests
- **Minimum:** 3-5 tests per major module (Dashboard, Opportunities, Contacts, Tasks)
- **Required viewports:** Desktop + iPad Landscape
- **Required:** All keyboard shortcuts tested

## CI/CD Integration

### GitHub Actions Workflows

**PR Checks (`.github/workflows/ci.yml`):**
```yaml
jobs:
  test:
    steps:
      - run: npm run lint
      - run: npm run test:ci
      - run: npm run build
      - run: npm run test:coverage
```

**Pre-Deploy (Manual):**
```bash
# Run E2E smoke tests
npm run test:e2e -- --project=chromium --grep="smoke"
```

**Post-Deploy (Manual):**
- Run 5-minute manual checklist
- Check Supabase logs for errors
- Monitor Sentry for exceptions (future)

### Coverage Enforcement

**Current:** 70% minimum enforced in `vitest.config.ts`

```typescript
coverage: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
}
```

**Future:** Add coverage delta comments on PRs via GitHub Actions

## Test Organization

```
/tests
├── e2e/                          # Playwright E2E tests
│   ├── specs/                    # Feature-specific suites
│   │   ├── dashboard/
│   │   ├── opportunities/
│   │   └── forms/
│   ├── support/
│   │   ├── pom/                  # Page Object Models
│   │   ├── fixtures/             # Auth, console monitor
│   │   └── utils/                # Test utilities
│   ├── legacy/                   # Quarantined tests (not run)
│   └── README.md                 # E2E standards
├── integration/                  # Supabase integration tests
│   ├── supabase-harness.ts       # Test harness factory
│   ├── csv-import.test.ts
│   └── rls-policies.test.ts      # TO BE CREATED
└── fixtures/                     # Test data files
    ├── contacts-valid.csv
    └── contacts-formula-injection.csv

/src
└── atomic-crm/
    └── */__tests__/              # Unit tests co-located with code
        ├── usePrefs.test.ts
        └── csvUploadValidator.test.ts
```

## Debugging Failed Tests

### Unit Test Fails
1. Check Zod schema definition
2. Verify mock data matches schema
3. Check default values (JSONB arrays should default to `[]`)
4. Run single test: `npm test -- usePrefs.test.ts`

### Integration Test Fails
1. Check Supabase connection (`.env.test` file)
2. Verify RLS policies with `psql` query
3. Check GRANT permissions (two-layer security)
4. Inspect test harness cleanup logic
5. Run with verbose logging: `npm run test:integration -- --reporter=verbose`

### E2E Test Fails
1. Check Playwright trace: `npx playwright show-trace trace.zip`
2. Inspect console logs for React errors
3. Check screenshots in `test-results/`
4. Verify storage state auth: `cat tests/e2e/.auth/user.json`
5. Run in headed mode: `npm run test:e2e:headed`

### Known Issues
- **Supabase unresponsive during long E2E runs:** Restart with `npx supabase stop && npx supabase start`
- **Permission denied errors:** Missing GRANT - check migration for `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated`
- **Assignee filter always filters to zero:** sales.user_id column missing, requires DB migration

## Best Practices

### DO
- ✅ Test validation schemas exhaustively (all branches)
- ✅ Use `Promise.allSettled` for bulk operations
- ✅ Clean up test data in `afterEach`
- ✅ Use semantic colors in tests (--primary, --destructive)
- ✅ Test keyboard shortcuts and accessibility
- ✅ Use Page Object Models for E2E tests
- ✅ Wait for conditions, not timeouts

### DON'T
- ❌ Test simple CRUD without business logic
- ❌ Mock Supabase in integration tests (use real client)
- ❌ Use `waitForTimeout` in Playwright
- ❌ Use CSS class selectors (use getByRole/Label)
- ❌ Skip cleanup in integration tests
- ❌ Test implementation details (test behavior)

## Test Data Management

### Supabase Integration Tests
```typescript
let harness: Awaited<ReturnType<typeof createTestHarness>>;

afterEach(async () => {
  if (harness) {
    await harness.cleanup(); // Deletes all created data
  }
});
```

### Playwright E2E Tests
- Use seeded data from `supabase/seed.sql`
- Test user: `admin@test.com` / `password123`
- 16 organizations, 50+ contacts available
- DO NOT create new data unless testing creation flow
- Use `.only` cautiously - may leave dirty state

### Emergency Cleanup
```sql
-- Delete all test data (prefix with test_)
DELETE FROM contacts WHERE first_name LIKE 'test_%';
DELETE FROM organizations WHERE name LIKE 'Test %';
```

## Coverage Exclusions

Configured in `vitest.config.ts`:
```typescript
exclude: [
  'src/**/*.test.{ts,tsx}',      // Test files
  'src/**/*.spec.{ts,tsx}',      // Spec files
  'src/tests/**',                // Test utilities
  'src/**/__tests__/**',         // Test directories
  'src/**/*.d.ts',               // Type definitions
  'src/vite-env.d.ts',           // Vite env types
]
```

## Performance Considerations

### Unit Tests
- **Target:** < 10ms per test
- **Slow tests:** Consider memoization or caching
- **Watch mode:** Auto-runs affected tests only

### Integration Tests
- **Target:** < 500ms per test
- **Cleanup:** Essential for test isolation
- **Parallel:** Run with `--reporter=verbose` to identify bottlenecks

### E2E Tests
- **Target:** < 30s per test
- **Parallelism:** Default 3 workers (configured in `playwright.config.ts`)
- **Retries:** 2 retries on CI, 0 locally
- **Timeout:** 30s per test

## Next Steps

See `docs/testing/rollout-checklist.md` for phased coverage improvements:
- Sprint 1: RLS policies, auth flows
- Sprint 2: Business workflows, component coverage
- Sprint 3: Visual regression, performance testing

## References

- [Testing Guide](../guides/02-testing.md) - Quick start and manual testing
- [E2E Testing Standards](../../tests/e2e/README.md) - Playwright patterns
- [Engineering Constitution](../claude/engineering-constitution.md) - Testing principles
- [Supabase Workflow](../supabase/WORKFLOW.md) - Database testing
- [Design System](../architecture/design-system.md) - UI testing patterns
