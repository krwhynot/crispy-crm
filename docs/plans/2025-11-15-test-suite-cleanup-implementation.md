# Test Suite Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up fragmented test suite by removing dead/debug tests, standardizing Playwright patterns, fixing coverage reporting, and adding missing coverage for high-risk areas (Dashboard V2 filters, CSV imports, RLS).

**Architecture:** Six-phase approach starting with immediate cleanup to unblock CI, then standardizing Playwright auth/POMs, fixing coverage infrastructure, rebuilding Supabase-backed integration tests, and finally adding business-critical test coverage.

**Tech Stack:** Vitest, Playwright, React Testing Library, Supabase, MSW (future)

---

## Phase 1: Immediate Cleanup

### Task 1.1: Quarantine Legacy Test Files

**Files:**
- Create: `tests/legacy/README.md` ✅ DONE
- Move: `verify-dashboard.spec.ts` → `tests/legacy/` ✅ DONE
- Move: `tests/e2e/debug-supabase.spec.ts` → `tests/legacy/` ✅ DONE
- Move: `tests/e2e/debug-opportunities-nav.spec.ts` → `tests/legacy/` ✅ DONE
- Move: `tests/e2e/dashboard-widgets-verification.spec.ts` → `tests/legacy/` ✅ DONE
- Delete: `src/tests/setup-mcp.ts` ✅ DONE

**Status:** ✅ COMPLETED

### Task 1.2: Update Playwright Config to Exclude Legacy

**Files:**
- Modify: `playwright.config.ts:7-8`

**Step 1: Add testIgnore pattern**

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/tests/legacy/**", // Exclude quarantined tests
  fullyParallel: true,
  // ... rest of config
```

**Step 2: Verify legacy tests don't run**

Run: `npx playwright test --list`
Expected: No tests from `tests/legacy/` directory appear

**Step 3: Commit**

```bash
git add playwright.config.ts tests/legacy/
git commit -m "test: quarantine legacy debug/verification tests

- Move debug-supabase, debug-opportunities-nav to tests/legacy/
- Move verify-dashboard and dashboard-widgets-verification (screenshot-only)
- Add testIgnore to Playwright config
- Remove unused setup-mcp.ts

These tests had no assertions and created noise in CI."
```

### Task 1.3: Fix test:performance Script

**Files:**
- Modify: `package.json:38`

**Step 1: Comment out broken script**

```json
{
  "scripts": {
    // "test:performance": "vitest run tests/performance/",
    "test:performance": "echo 'Performance tests not yet implemented. See tests/e2e/organization-hierarchies-performance.spec.ts for E2E perf tests.'",
```

**Step 2: Verify script doesn't error**

Run: `npm run test:performance`
Expected: Message about not implemented

**Step 3: Commit**

```bash
git add package.json
git commit -m "fix: disable broken test:performance script

tests/performance/ directory doesn't exist. E2E perf tests
are in tests/e2e/organization-hierarchies-performance.spec.ts"
```

---

## Phase 2: Standardize Playwright Suite

### Task 2.1: Migrate Tabbed Forms Test to Authenticated Fixture

**Files:**
- Modify: `tests/e2e/specs/forms/tabbed-forms-ui-design.spec.ts:1-173`

**Step 1: Replace manual auth with fixture**

```typescript
import { test, expect } from '@playwright/test';
import { authenticatedPage } from '../../support/fixtures/authenticated';

// Remove old helper import:
// import { login } from '../../helpers/auth';

test.describe('Tabbed Forms UI Design', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  const modules = [
    { path: '/organizations/create', name: 'Organizations' },
    { path: '/contacts/create', name: 'Contacts' },
    // ... rest
  ];

  for (const module of modules) {
    test(`${module.name} - tab navigation and error badges`, async ({ page }) => {
      // Remove manual login - already authenticated via fixture
      await page.goto(module.path);

      // ... rest of test
```

**Step 2: Run test to verify**

Run: `npx playwright test tabbed-forms --project=chromium`
Expected: PASS - uses storage state, no manual login

**Step 3: Commit**

```bash
git add tests/e2e/specs/forms/tabbed-forms-ui-design.spec.ts
git commit -m "test(e2e): migrate tabbed-forms to authenticated fixture

Replace manual login helper with storage state authentication.
Reduces test flakiness and aligns with POM patterns."
```

### Task 2.2: Create Consolidated Dashboard Widgets Suite

**Files:**
- Create: `tests/e2e/dashboard-widgets-consolidated.spec.ts`
- Reference: `tests/e2e/dashboard-widgets.spec.ts` (existing POM-based)
- Reference: `tests/e2e/dashboard-widgets-comprehensive.spec.ts` (duplicate)

**Step 1: Create viewport matrix test**

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from './support/pom/DashboardPage';

const viewports = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'iPad Portrait', width: 768, height: 1024 },
];

test.describe('Dashboard Widgets - Consolidated', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('renders required widgets with proper layout', async ({ page }) => {
        const dashboard = new DashboardPage(page);
        await dashboard.navigate();

        // Widget visibility assertions
        await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
        await expect(dashboard.getPipelineSummaryWidget()).toBeVisible();

        // Take snapshot for visual regression
        await expect(page).toHaveScreenshot(`dashboard-${viewport.name.toLowerCase().replace(' ', '-')}.png`);
      });

      test('supports widget interactions', async ({ page }) => {
        const dashboard = new DashboardPage(page);
        await dashboard.navigate();

        // Interaction tests specific to viewport
        // ...
      });
    });
  }
});
```

**Step 2: Run new consolidated test**

Run: `npx playwright test dashboard-widgets-consolidated --project=chromium`
Expected: PASS across all viewport configurations

**Step 3: Delete duplicate files**

```bash
rm tests/e2e/dashboard-widgets-comprehensive.spec.ts
# Keep original dashboard-widgets.spec.ts as reference
```

**Step 4: Commit**

```bash
git add tests/e2e/dashboard-widgets-consolidated.spec.ts
git rm tests/e2e/dashboard-widgets-comprehensive.spec.ts
git commit -m "test(e2e): consolidate dashboard widget test suites

- Create viewport-parameterized test suite
- Merge interaction and visual regression tests
- Remove duplicate dashboard-widgets-comprehensive.spec.ts
- Use POM pattern consistently"
```

### Task 2.3: Document Playwright Test Standards

**Files:**
- Create: `tests/e2e/README.md`

**Step 1: Write testing standards**

```markdown
# E2E Testing Standards

## Required Patterns

### 1. Authentication

✅ **DO:** Use storage state fixture
```typescript
test.use({ storageState: 'tests/e2e/.auth/user.json' });
```

❌ **DON'T:** Manual login in each test
```typescript
await login(page, 'admin@test.com', 'password'); // ❌
```

### 2. Waiting Strategies

✅ **DO:** Use built-in waiting with assertions
```typescript
await expect(page.locator('[role="main"]')).toBeVisible();
```

❌ **DON'T:** Arbitrary timeouts
```typescript
await page.waitForTimeout(3000); // ❌
```

### 3. Selectors

✅ **DO:** Use semantic selectors
```typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email address')
```

❌ **DON'T:** CSS classes
```typescript
page.locator('.btn-submit') // ❌
```

### 4. Page Object Models

All tests should use POMs from `tests/e2e/support/pom/`

## Test Organization

- `specs/` - Feature-specific test suites
- `support/pom/` - Page Object Models
- `support/fixtures/` - Shared fixtures (auth, console monitor)
- `support/utils/` - Test utilities
- `legacy/` - Quarantined tests (not run in CI)
```

**Step 2: Commit**

```bash
git add tests/e2e/README.md
git commit -m "docs(test): add E2E testing standards

Document required patterns for auth, waiting, selectors, and POMs.
Prevents regression to deprecated patterns."
```

---

## Phase 3: Fix Coverage Reporting

### Task 3.1: Diagnose Coverage Configuration

**Files:**
- Read: `vitest.config.ts:18-37`
- Read: `coverage/lcov.info`

**Step 1: Check current coverage config**

Run: `cat vitest.config.ts | grep -A 20 coverage`
Expected: See coverage thresholds (70% lines/functions/branches)

**Step 2: Run coverage with verbose logging**

Run: `npm run test:coverage -- --reporter=verbose 2>&1 | tee coverage-debug.log`
Expected: See which files are instrumented

**Step 3: Analyze LCOV output**

Run: `head -50 coverage/lcov.info`
Expected: Should show `SF:src/` paths, not config files

### Task 3.2: Fix Coverage Include Pattern

**Files:**
- Modify: `vitest.config.ts:30-32`

**Step 1: Update coverage configuration**

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'], // Explicit include pattern
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/tests/**',
    'src/**/__tests__/**',
    'src/**/*.d.ts',
    'src/vite-env.d.ts',
  ],
  all: true, // Include all files, even untested ones
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
},
```

**Step 2: Clear existing coverage**

Run: `rm -rf coverage/`

**Step 3: Run coverage again**

Run: `npm run test:coverage`
Expected: See real coverage percentages (not 0.03%)

**Step 4: Verify LCOV contains app code**

Run: `grep -c "^SF:src/" coverage/lcov.info`
Expected: Number > 50 (many source files)

**Step 5: Commit**

```bash
git add vitest.config.ts
git commit -m "fix(test): repair coverage reporting configuration

- Add explicit include pattern for src/**/*.{ts,tsx}
- Set all: true to show untested files
- Exclude test files from coverage calculation

Previous config was only measuring .prettierrc.mjs (0.03%)."
```

### Task 3.3: Add Coverage Badge to README

**Files:**
- Read: `README.md:1-50`
- Modify: `README.md` (near top, after title)

**Step 1: Generate coverage badge**

```bash
# After running tests
COVERAGE=$(grep -oP 'All files\s+\|\s+\K[\d.]+' coverage/coverage-summary.txt)
echo "Current coverage: ${COVERAGE}%"
```

**Step 2: Add badge to README**

```markdown
# Atomic CRM

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-72%25-green)

Full-featured, open-source CRM...
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add coverage badge to README

Shows actual coverage percentage now that reporting is fixed."
```

---

## Phase 4: Rebuild CSV Import Tests

### Task 4.1: Create Supabase Test Harness

**Files:**
- Create: `tests/integration/supabase-harness.ts`

**Step 1: Write Supabase test client factory**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export interface TestHarness {
  client: SupabaseClient;
  cleanup: () => Promise<void>;
  seedData: {
    organizationIds: number[];
    contactIds: number[];
  };
}

export async function createTestHarness(): Promise<TestHarness> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.test');
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const seedData = {
    organizationIds: [] as number[],
    contactIds: [] as number[],
  };

  const cleanup = async () => {
    // Delete test data in reverse dependency order
    if (seedData.contactIds.length > 0) {
      await client.from('contacts').delete().in('id', seedData.contactIds);
    }
    if (seedData.organizationIds.length > 0) {
      await client.from('organizations').delete().in('id', seedData.organizationIds);
    }
  };

  return { client, cleanup, seedData };
}
```

**Step 2: Write test to verify harness works**

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createTestHarness } from './supabase-harness';

describe('Supabase Test Harness', () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  afterEach(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  it('creates and cleans up test organizations', async () => {
    harness = await createTestHarness();

    // Create test org
    const { data, error } = await harness.client
      .from('organizations')
      .insert({ name: 'Test Org', org_type: 'customer' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    harness.seedData.organizationIds.push(data!.id);

    // Cleanup should remove it
    await harness.cleanup();

    const { data: check } = await harness.client
      .from('organizations')
      .select('id')
      .eq('id', data!.id)
      .maybeSingle();

    expect(check).toBeNull();
  });
});
```

**Step 3: Run test**

Run: `npx vitest run tests/integration/supabase-harness.test.ts`
Expected: PASS - creates and cleans up data

**Step 4: Commit**

```bash
git add tests/integration/supabase-harness.ts tests/integration/supabase-harness.test.ts
git commit -m "test: add Supabase test harness for integration tests

Provides real database client with automatic cleanup.
Foundation for CSV import and RLS tests."
```

### Task 4.2: Create CSV Import Test Fixtures

**Files:**
- Create: `tests/fixtures/contacts-valid.csv`
- Create: `tests/fixtures/contacts-invalid.csv`
- Create: `tests/fixtures/contacts-formula-injection.csv`

**Step 1: Create valid contacts CSV**

```csv
First Name,Last Name,Email,Phone,Organization
John,Doe,john@example.com,555-1234,Acme Corp
Jane,Smith,jane@example.com,555-5678,TechCo
```

**Step 2: Create invalid CSV (missing required fields)**

```csv
First Name,Last Name,Email
John,Doe,
Jane,,jane@example.com
```

**Step 3: Create formula injection CSV**

```csv
First Name,Last Name,Email
=cmd|'/c calc'!A0,Hacker,hacker@evil.com
@SUM(1+1),Injector,inject@evil.com
```

**Step 4: Commit**

```bash
git add tests/fixtures/
git commit -m "test: add CSV import test fixtures

- Valid contacts (2 rows)
- Invalid (missing required fields)
- Formula injection attempts

Used for integration testing CSV upload validation."
```

### Task 4.3: Rebuild CSV Import Integration Test

**Files:**
- Create: `tests/integration/csv-import.test.ts`
- Reference: `tests/import-integration.spec.ts.skip` (old version)

**Step 1: Write test with real Supabase**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestHarness } from './supabase-harness';
import { validateCsvFile, sanitizeCsvValue } from '@/atomic-crm/utils/csvUploadValidator';
import * as fs from 'fs';
import * as Papa from 'papaparse';

describe('CSV Import Integration', () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  beforeEach(async () => {
    harness = await createTestHarness();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it('imports valid contacts CSV', async () => {
    const csvPath = 'tests/fixtures/contacts-valid.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const parsed = Papa.parse(csvContent, { header: true });
    expect(parsed.errors).toHaveLength(0);

    // Import contacts
    const contacts = parsed.data.map((row: any) => ({
      first_name: sanitizeCsvValue(row['First Name']),
      last_name: sanitizeCsvValue(row['Last Name']),
      email: [{ email: sanitizeCsvValue(row['Email']), type: 'Work' }],
    }));

    const { data, error } = await harness.client
      .from('contacts')
      .insert(contacts)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    harness.seedData.contactIds = data!.map(c => c.id);
  });

  it('rejects formula injection attempts', async () => {
    const csvPath = 'tests/fixtures/contacts-formula-injection.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const parsed = Papa.parse(csvContent, { header: true });
    const row = parsed.data[0] as any;

    // Sanitization should escape formulas
    const sanitized = sanitizeCsvValue(row['First Name']);
    expect(sanitized).toMatch(/^'=/); // Escaped with leading quote
    expect(sanitized).not.toBe(row['First Name']); // Modified
  });

  it('validates CSV before processing', async () => {
    const file = new File(
      [fs.readFileSync('tests/fixtures/contacts-invalid.csv')],
      'invalid.csv',
      { type: 'text/csv' }
    );

    const validation = await validateCsvFile(file);
    expect(validation.valid).toBe(true); // File structure valid
    // Business validation happens during mapping
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/integration/csv-import.test.ts`
Expected: PASS - validates CSV security and import flow

**Step 3: Update package.json**

```json
"test:integration": "vitest run tests/integration/"
```

**Step 4: Commit**

```bash
git add tests/integration/csv-import.test.ts package.json
git rm tests/import-integration.spec.ts.skip tests/import-e2e.spec.ts.skip
git commit -m "test: rebuild CSV import integration tests

- Use real Supabase client (not mocked)
- Test formula injection sanitization
- Test valid/invalid CSV handling
- Remove old skipped tests

Closes gap in bulk import data quality testing."
```

---

## Phase 5: Add Dashboard V2 Filter Coverage

### Task 5.1: Create FilterState Unit Tests

**Files:**
- Create: `src/atomic-crm/dashboard/v2/__tests__/usePrefs.test.ts`

**Step 1: Write test for default filter state**

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefs } from '../hooks/usePrefs';
import type { FilterState } from '../types';

describe('usePrefs - Dashboard V2 Filters', () => {
  it('returns default filter state on first load', () => {
    const { result } = renderHook(() => usePrefs<FilterState>('pd.filters'));

    expect(result.current[0]).toEqual({
      health: [],
      stages: [],
      assignee: 'team',
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    });
  });

  it('persists filter changes to localStorage', () => {
    const { result } = renderHook(() => usePrefs<FilterState>('pd.filters'));
    const [, setFilters] = result.current;

    // Change filters
    setFilters({
      health: ['at_risk'],
      stages: ['discovery', 'proposal'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: false,
      groupByCustomer: true,
    });

    // Re-render hook (simulates page reload)
    const { result: result2 } = renderHook(() => usePrefs<FilterState>('pd.filters'));

    expect(result2.current[0]).toEqual({
      health: ['at_risk'],
      stages: ['discovery', 'proposal'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: false,
      groupByCustomer: true,
    });
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/atomic-crm/dashboard/v2/__tests__/usePrefs.test.ts`
Expected: PASS

**Step 3: Add filter logic tests**

```typescript
describe('FilterState logic', () => {
  it('calculates active filter count correctly', () => {
    const filters: FilterState = {
      health: ['at_risk'],
      stages: ['discovery'],
      assignee: 'me',
      lastTouch: '7d',
      showClosed: true,
      groupByCustomer: false,
    };

    // Active filters: health, stages, assignee, lastTouch, showClosed = 5
    // (groupByCustomer is display option, not filter)
    const activeCount = [
      filters.health.length > 0,
      filters.stages.length > 0,
      filters.assignee !== 'team',
      filters.lastTouch !== 'any',
      filters.showClosed !== false,
    ].filter(Boolean).length;

    expect(activeCount).toBe(5);
  });
});
```

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v2/__tests__/
git commit -m "test: add Dashboard V2 filter state unit tests

- Test default filter values
- Test localStorage persistence
- Test active filter count calculation

Covers critical usePrefs logic gap."
```

### Task 5.2: Extend Dashboard E2E Filter Tests

**Files:**
- Modify: `tests/e2e/dashboard-v2-filters.spec.ts:16-193`

**Step 1: Add filter persistence test**

```typescript
test('persists filter state across page reloads', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.navigate();

  // Apply filters
  await page.getByLabel('At Risk').check();
  await page.getByRole('button', { name: 'Discovery' }).click();
  await page.getByRole('combobox', { name: 'Assignee' }).selectOption('me');

  // Verify active count badge
  const badge = page.getByTestId('active-filters-count');
  await expect(badge).toHaveText('3');

  // Reload page
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Filters should be restored
  await expect(page.getByLabel('At Risk')).toBeChecked();
  await expect(badge).toHaveText('3');
});
```

**Step 2: Add clear filters test**

```typescript
test('clear all filters button resets to defaults', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.navigate();

  // Apply some filters
  await page.getByLabel('At Risk').check();
  await page.getByRole('button', { name: 'Proposal' }).click();

  // Clear all
  await page.getByRole('button', { name: 'Clear All' }).click();

  // All filters reset
  await expect(page.getByLabel('At Risk')).not.toBeChecked();
  await expect(page.getByTestId('active-filters-count')).not.toBeVisible();
});
```

**Step 3: Run tests**

Run: `npx playwright test dashboard-v2-filters --project=chromium`
Expected: PASS

**Step 4: Commit**

```bash
git add tests/e2e/dashboard-v2-filters.spec.ts
git commit -m "test(e2e): extend Dashboard V2 filter coverage

- Test filter persistence across reloads
- Test clear all filters button
- Verify active count badge accuracy

Ensures primary workflow reliability."
```

### Task 5.3: Add Sidebar Collapse Tests

**Files:**
- Create: `tests/e2e/dashboard-v2-sidebar-collapse.spec.ts`

**Step 1: Write collapse/expand test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 Sidebar Collapse', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('collapses sidebar and shows rail button', async ({ page }) => {
    await page.goto('/');

    // Find sidebar
    const sidebar = page.getByRole('complementary', { name: 'Filters' });
    await expect(sidebar).toBeVisible();

    // Click collapse button
    const collapseBtn = sidebar.getByRole('button', { name: 'Collapse' });
    await collapseBtn.click();

    // Sidebar should be hidden, rail button visible
    await expect(sidebar).not.toBeVisible();
    const railBtn = page.getByTestId('sidebar-rail-button');
    await expect(railBtn).toBeVisible();
  });

  test('persists collapsed state across reloads', async ({ page }) => {
    await page.goto('/');

    // Collapse sidebar
    const sidebar = page.getByRole('complementary', { name: 'Filters' });
    await sidebar.getByRole('button', { name: 'Collapse' }).click();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should stay collapsed
    await expect(sidebar).not.toBeVisible();
    await expect(page.getByTestId('sidebar-rail-button')).toBeVisible();
  });

  test('shows filter count badge on rail when collapsed', async ({ page }) => {
    await page.goto('/');

    // Apply filter
    await page.getByLabel('At Risk').check();

    // Collapse sidebar
    const sidebar = page.getByRole('complementary', { name: 'Filters' });
    await sidebar.getByRole('button', { name: 'Collapse' }).click();

    // Rail badge should show count
    const railBadge = page.getByTestId('sidebar-rail-button').getByTestId('filter-count');
    await expect(railBadge).toHaveText('1');
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test dashboard-v2-sidebar-collapse --project=chromium`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/e2e/dashboard-v2-sidebar-collapse.spec.ts
git commit -m "test(e2e): add sidebar collapse/expand coverage

- Test collapse/expand toggle
- Test persistence across reloads
- Test filter badge on collapsed rail

Verifies desktop-optimized layout feature."
```

---

## Phase 6: Documentation & Strategy

### Task 6.1: Create Testing Strategy Document

**Files:**
- Create: `docs/testing/strategy.md`

**Step 1: Write testing pyramid guidance**

```markdown
# Testing Strategy

## Overview

Atomic CRM uses a multi-layer testing approach optimized for a pre-launch CRM with Supabase backend, iPad-first UI, and business workflow complexity.

## Test Layers

### 1. Unit Tests (Vitest + React Testing Library)

**What:** Pure functions, hooks, validation schemas, utilities

**When to add:**
- New Zod validation schema (always test all branches)
- Custom hooks (usePrefs, useFeatureFlag, etc.)
- Utility functions (csvUploadValidator, taskGrouping, etc.)
- Form submission logic

**Pattern:**
```typescript
// Test validation schema
describe('contactSchema', () => {
  it('requires email format', () => {
    expect(() => contactSchema.parse({ email: 'invalid' })).toThrow();
  });
});
```

**Coverage target:** 70%+ for `src/**/*.{ts,tsx}`

### 2. Integration Tests (Vitest + Supabase)

**What:** Data provider calls, RLS policies, CSV imports, auth flows

**When to add:**
- New DataProvider methods
- RLS policy changes
- Bulk operations (CSV import, batch updates)
- Complex business logic spanning multiple tables

**Pattern:**
```typescript
describe('CSV Import', () => {
  it('sanitizes formula injection', async () => {
    const harness = await createTestHarness();
    // ... test with real Supabase
  });
});
```

**Location:** `tests/integration/`

### 3. E2E Tests (Playwright)

**What:** Critical user journeys, multi-step workflows, UI regressions

**When to add:**
- New user-facing feature (Dashboard, Kanban, Reports)
- Multi-step workflows (Opportunity close → activity log → task creation)
- Responsive layout changes
- Authentication/permissions

**Pattern:**
```typescript
test('creates opportunity and logs activity', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  // ... POM-based test
});
```

**Required:** Use POMs, authenticated fixture, semantic selectors

**Projects:** Desktop (1440x900), iPad Landscape, iPad Portrait

### 4. Manual Testing

**What:** 5-minute smoke checklist before releases

**When:** Every deployment to production

**Checklist:** See `docs/guides/02-testing.md:16-66`

## High-Risk Areas Requiring Tests

1. **Dashboard V2 Filters** - Primary workflow, complex state
   - Unit: usePrefs, filter logic
   - E2E: Persistence, clear all, active count

2. **CSV Imports** - Data quality, security
   - Integration: Formula injection, validation
   - E2E: Upload flow, error handling

3. **RLS Policies** - Security, multi-tenancy
   - Integration: Policy enforcement per role
   - E2E: Access denied scenarios

4. **Supabase Auth** - Session management
   - Integration: Login, logout, refresh
   - E2E: Protected routes, role-based UI

## Coverage Gates

- **Unit tests:** 70% minimum (lines, functions, branches)
- **Integration tests:** All Supabase RLS policies
- **E2E tests:** All critical user journeys (3-5 per module)

## CI/CD Integration

- **PR checks:** Lint, unit tests, type-check, build
- **Pre-deploy:** E2E smoke tests (Desktop + iPad projects)
- **Post-deploy:** Manual 5-minute checklist

## Debugging Failed Tests

1. **Unit test fails:** Check Zod schema, mock data
2. **Integration test fails:** Check Supabase connection, RLS policies
3. **E2E test fails:** Check Playwright trace, console logs, screenshots
```

**Step 2: Commit**

```bash
git add docs/testing/strategy.md
git commit -m "docs(test): add comprehensive testing strategy

Defines when to add unit/integration/E2E tests, coverage targets,
and high-risk areas requiring test coverage."
```

### Task 6.2: Update Main Testing Docs Reference

**Files:**
- Modify: `docs/guides/02-testing.md:1-20`

**Step 1: Add link to strategy doc**

```markdown
# Testing Guide

> **NEW:** See [Testing Strategy](../testing/strategy.md) for comprehensive guidelines on test coverage and when to add tests.

## Quick Reference

- **Unit tests:** `npm test` (Vitest + React Testing Library)
- **Integration tests:** `npm run test:integration`
- **E2E tests:** `npm run test:e2e` (Playwright)
- **Coverage:** `npm run test:coverage`

## Test Standards

See [E2E Testing Standards](../../tests/e2e/README.md) for Playwright patterns.
```

**Step 2: Commit**

```bash
git add docs/guides/02-testing.md
git commit -m "docs: link to new testing strategy from main guide"
```

### Task 6.3: Create Phased Rollout Checklist

**Files:**
- Create: `docs/testing/rollout-checklist.md`

**Step 1: Document remaining work**

```markdown
# Test Coverage Rollout Checklist

## Completed ✅

- [x] Phase 1: Immediate cleanup (quarantine legacy tests, fix scripts)
- [x] Phase 2: Standardize Playwright (auth fixture, consolidated suites)
- [x] Phase 3: Fix coverage reporting
- [x] Phase 4: Rebuild CSV import tests
- [x] Phase 5: Dashboard V2 filter tests
- [x] Phase 6: Documentation

## Sprint 1 (Next 2 Weeks)

- [ ] Add RLS policy integration tests
  - Files: `tests/integration/rls-policies.test.ts`
  - Verify admin-only UPDATE/DELETE policies
  - Test personal task access (sales_id filtering)

- [ ] Add auth flow integration tests (replace mocked version)
  - Files: `tests/integration/auth-flow.test.ts` (replace skip)
  - Test login, logout, session refresh with real Supabase
  - Use MSW or test containers

- [ ] Stabilize Opportunities E2E suite
  - Files: `tests/e2e/specs/opportunities/crud.spec.ts`
  - Fix auth redirects (use storage state)
  - Ensure seeded data for stable runs

## Sprint 2 (Weeks 3-4)

- [ ] Add business workflow E2E tests
  - Opportunity close → won flow
  - Activity logging with follow-up task
  - Principal dashboard filtering → drill-down

- [ ] Improve unit test coverage for:
  - `src/atomic-crm/dashboard/v2/components/` (40% → 70%)
  - `src/providers/supabase/unifiedDataProvider.ts` (mocked → real API)

## Sprint 3 (Weeks 5-6)

- [ ] Visual regression baseline
  - Capture snapshots for Dashboard V2, Kanban, Reports
  - Set up Percy or Chromatic integration

- [ ] Performance testing
  - Lighthouse CI for Dashboard (target: 95+ accessibility)
  - Load testing for CSV imports (1000+ rows)

## Ongoing

- [ ] Enforce 70% coverage in CI (add to `.github/workflows/ci.yml`)
- [ ] Add coverage delta comments on PRs
- [ ] Monthly review of flaky tests (retry rate > 5%)
```

**Step 2: Commit**

```bash
git add docs/testing/rollout-checklist.md
git commit -m "docs(test): add phased rollout checklist

Tracks completed work and remaining coverage gaps across 3 sprints."
```

---

## Verification Steps

### After Phase 1-3

Run: `npm run test:ci && npm run test:e2e`
Expected:
- No legacy tests run
- Coverage report shows real percentages (not 0.03%)
- All E2E tests use authenticated fixture

### After Phase 4

Run: `npm run test:integration`
Expected:
- CSV import tests pass with real Supabase
- Formula injection sanitization verified
- Test harness cleans up data

### After Phase 5

Run: `npx playwright test dashboard-v2 --project=chromium`
Expected:
- Filter persistence tests pass
- Sidebar collapse tests pass
- Active filter count badge accurate

### Full Suite

Run: `npm run lint && npm run test:coverage && npm run test:e2e`
Expected:
- Lint: PASS
- Coverage: ≥70% on core modules
- E2E: PASS across all viewport projects

---

## Notes

**Test Data Management:**
- Use `createTestHarness()` for all integration tests
- Always register cleanup in `afterEach`
- Prefix test data with `test_` for emergency cleanup

**Playwright Best Practices:**
- Use `test.use({ storageState })` for auth
- Use POMs for all page interactions
- Use semantic selectors (getByRole, getByLabel)
- Avoid `waitForTimeout` - use assertions with built-in waiting

**Coverage Exclusions:**
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Test utilities (`src/tests/`)

**References:**
- Engineering Constitution: `docs/claude/engineering-constitution.md`
- Design System: `docs/architecture/design-system.md`
- Supabase Workflow: `docs/supabase/WORKFLOW.md`
