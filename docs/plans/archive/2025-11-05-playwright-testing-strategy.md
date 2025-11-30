# Playwright Testing Strategy for Atomic CRM

**Date:** 2025-11-05
**Status:** Ready for Implementation | App Initialization Issue RESOLVED ✅
**Priority:** Pre-launch Confidence + iPad-First UI/UX + Deep Testing on Critical Features

---

## Executive Summary

This document outlines the comprehensive Playwright E2E testing strategy for Atomic CRM, designed to provide pre-launch confidence through systematic test coverage, iPad-first responsive validation, and deep testing of high-risk features.

**Key Decisions:**
- **Comprehensive coverage + visual regression** (not minimal)
- **Touch-first interactions** with desktop variants for drag-and-drop
- **Hybrid seed data** (preserve seed.sql, create test-specific data per-test)
- **Smart masking for visual regression** (mask dynamic content, validate layout)
- **Comprehensive console error monitoring** (RLS, React, Network, Design System)

**Previous Blocker (RESOLVED ✅):** React app failed to initialize in Playwright due to KeyboardShortcutsProvider calling `useNavigate()` before React Admin's Router was established. Fixed by moving KeyboardShortcutsProvider from wrapping `<Admin>` to inside the Layout component (src/atomic-crm/layout/Layout.tsx:16-42).

---

## Testing Priorities (User-Validated)

1. **Pre-launch confidence** (E) - Need production-ready coverage before launch
2. **iPad-first UI/UX validation** (C) - Responsive design is critical
3. **Depth on risky features** (B) - Opportunities, workflows, reports, JSONB

### Prioritized Features for Deep Testing

1. **Opportunity Kanban board** (A) - Drag-and-drop, real-time updates, activity timeline
2. **Opportunity workflows** (E) - Stage transitions, product associations, close/win logic
3. **Dashboard reports** (F) - Principal-centric reports, metrics, charts
4. **JSONB array fields** (D) - Email/phone arrays with add/remove/validate

---

## Test Suite Architecture (Zen-Optimized)

### Directory Structure

```
tests/e2e/
├── support/                     # Centralized helpers & abstractions
│   ├── fixtures/
│   │   ├── auth.fixture.ts      # Auto-login, role switching
│   │   ├── data.fixture.ts      # Test data factories
│   │   └── console.fixture.ts   # Automatic error monitoring
│   │
│   ├── poms/                    # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── KanbanPage.ts
│   │   ├── ContactPage.ts
│   │   ├── DashboardPage.ts
│   │   └── BasePage.ts          # Shared navigation
│   │
│   └── utils/
│       ├── console-monitor.ts   # Error tracking utility
│       ├── api-client.ts        # Direct Supabase calls
│       ├── visual-helpers.ts    # Smart masking utilities
│       └── wait-helpers.ts      # Condition-based waiting
│
└── specs/                       # All test specifications
    ├── accessibility.spec.ts    # ⭐ NEW: a11y scans
    │
    ├── smoke/
    │   └── critical-path.spec.ts   # Quick pre-launch validation
    │
    ├── opportunities/           # PRIORITY 1: Deep coverage
    │   ├── kanban-board.spec.ts    # Includes visual snapshots
    │   ├── stage-transitions.spec.ts
    │   ├── crud.spec.ts
    │   ├── error-states.spec.ts    # ⭐ NEW: API failures, empty states
    │   └── activity-timeline.spec.ts
    │
    ├── dashboard/               # PRIORITY 2: Reports
    │   ├── principal-reports.spec.ts
    │   ├── weekly-activity.spec.ts
    │   ├── metrics.spec.ts
    │   └── empty-states.spec.ts    # ⭐ NEW: No data scenarios
    │
    ├── contacts/                # Standard + PRIORITY 3
    │   ├── crud.spec.ts
    │   ├── jsonb-arrays.spec.ts    # Email/phone patterns
    │   ├── search-filter.spec.ts
    │   └── validation-errors.spec.ts   # ⭐ NEW: Form errors
    │
    ├── organizations/
    │   ├── crud.spec.ts
    │   └── relationships.spec.ts
    │
    └── auth/
        ├── login-logout.spec.ts
        └── rls-policies.spec.ts    # Permission testing
```

**Key Improvements Over Original Design:**

1. **`support/` directory** - Centralized reusable code (POMs, fixtures, utils)
2. **Visual tests merged** - Screenshots taken INSIDE functional tests (no duplication)
3. **Accessibility testing** - New `accessibility.spec.ts` catches WCAG violations
4. **Error state coverage** - New `error-states.spec.ts`, `empty-states.spec.ts`, `validation-errors.spec.ts`
5. **Better abstraction** - Page Object Models hide navigation/UI complexity

---

## Mandatory Testing Patterns

### 1. Page Object Models (POMs) - REQUIRED

**Never write tests with inline page interactions.** Every page needs a POM.

```typescript
// ❌ BAD - Inline interactions, duplication
test('login', async ({ page }) => {
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
});

// ✅ GOOD - Page Object Model
class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }
}

test('login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('admin@test.com', 'password123');
});
```

**Why:** Duplication = maintenance nightmare. Fix selectors once, all tests benefit.

### 2. Semantic Selectors - ENFORCED

**Selector priority (NEVER violate this order):**

1. `getByRole()` - Accessibility first
2. `getByLabel()` - Form fields
3. `getByText()` - Content
4. `getByTestId()` - Last resort
5. ❌ **NEVER**: CSS selectors (`input[name="email"]`, `.btn-primary`)

```typescript
// ❌ BAD - Brittle CSS selectors
await page.fill('input[name="email"]', 'test@example.com');
await page.click('button.submit-btn');

// ✅ GOOD - Semantic, resilient
await page.getByLabel(/email/i).fill('test@example.com');
await page.getByRole('button', { name: /submit/i }).click();
```

### 3. Console Error Monitoring - MANDATORY

**Every test must monitor console errors.** Categorize by type: RLS, React, Network, Design System.

```typescript
import { consoleMonitor } from '../support/utils/console-monitor';

test.beforeEach(async ({ page }) => {
  await consoleMonitor.attach(page);
});

test.afterEach(async () => {
  if (consoleMonitor.getErrors().length > 0) {
    console.log(consoleMonitor.getReport());
  }
});

test('create contact', async ({ page }) => {
  // Test actions...

  // Assert no RLS errors
  expect(consoleMonitor.hasRLSErrors()).toBe(false);

  // Assert no React errors
  expect(consoleMonitor.hasReactErrors()).toBe(false);
});
```

### 4. Condition-Based Waiting - REQUIRED

**Never use arbitrary timeouts.** Wait for conditions.

```typescript
// ❌ BAD - Arbitrary timeout
await page.waitForTimeout(2000);

// ✅ GOOD - Wait for condition
await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
await page.waitForURL('**/dashboard');
await page.waitForResponse(resp =>
  resp.url().includes('/api/contacts') && resp.status() === 200
);
```

### 5. Visual Regression Integration - RECOMMENDED

**Merge visual snapshots INTO functional tests.** Never separate `visual/` folder.

```typescript
test('dashboard loads and displays metrics', async ({ authenticatedPage, dashboard }) => {
  // Functional assertions
  await dashboard.expectMetricVisible('Total Contacts');
  await dashboard.expectWidgetVisible('Pipeline');

  // Visual regression with smart masking
  await expect(authenticatedPage).toHaveScreenshot('dashboard-full.png', {
    mask: dashboard.getDynamicElements(), // Masks dates, counts
  });

  // Console error check
  expect(consoleMonitor.getErrors()).toHaveLength(0);
});
```

### 6. Test Data Isolation - ENFORCED

**Use timestamp-based unique data.** Never rely on seed data for test-specific entities.

```typescript
// ❌ BAD - Hardcoded data causes conflicts
await page.fill(nameInput, 'John Doe'); // Conflicts with other tests

// ✅ GOOD - Unique timestamp data
const timestamp = Date.now();
const firstName = `TestContact-${timestamp}`;
await page.getByLabel(/first name/i).fill(firstName);
```

---

## Test Data Strategy (Hybrid Approach)

**Preserve seed.sql** as infrastructure:
- Test users (admin@test.com, user@test.com)
- 16 organizations
- Reference data (tags, product types)

**Seed once globally** - Run seed.sql once before entire test suite (Playwright's `globalSetup`)

**Each test creates its own data** - Unique timestamps prevent conflicts:
```typescript
const timestamp = Date.now();
await page.getByLabel(/first name/i).fill(`TestContact-${timestamp}`);
```

**Benefits:**
- ✅ Preserves seed data - Organizations stay intact
- ✅ Test isolation - Each test's data is unique (no conflicts)
- ✅ Parallel execution - Tests don't step on each other
- ✅ Fast - No DB reset between tests
- ✅ Realistic - Tests create data like real users

---

## Updated Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',  // Changed to specs/
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Use headed mode in local development for better debugging
    headless: !!process.env.CI,
  },

  // Multi-device testing (iPad-first)
  projects: [
    {
      name: 'iPad Portrait',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        isMobile: true,  // Enables touch events
      },
    },
    {
      name: 'iPad Landscape',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 },
        isMobile: true,
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Global setup: seed database once
  globalSetup: './tests/global-setup.ts',

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Best Practices Summary

### Selector Strategy
- ✅ Use `getByRole/Label/Text` (semantic, accessible)
- ❌ Never CSS selectors (brittle, break on HTML changes)

### Console Error Monitoring
- ✅ Attach to every test via fixture
- ✅ Categorize errors (RLS, React, Network, Design System)
- ✅ Assert by category (`expect(monitor.hasRLSErrors()).toBe(false)`)

### Visual Regression
- ✅ Smart masking for dynamic content (dates, counts, avatars)
- ✅ Embed in functional tests (not separate files)
- ✅ Viewport-specific baselines (iPad Portrait, iPad Landscape, Desktop)

### Touch-First Testing
- ✅ Primary workflow: touch/tap (works on all devices)
- ✅ Desktop variants: Use `test.skip(isMobile)` for drag-and-drop

### Test Data Strategy
- ✅ Seed once globally (users, organizations)
- ✅ Create per-test data with timestamps (contacts, opportunities)
- ✅ No cleanup needed (unique names prevent conflicts)

### Accessibility Testing
```typescript
// Install: npm i -D @axe-core/playwright
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no a11y violations', async ({ page }) => {
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## Resolution: App Initialization Issue (2025-11-05)

**Problem:** React app failed to initialize in Playwright's headless browser. All tests timed out waiting for DOM elements.

**Root Cause Identified:**
KeyboardShortcutsProvider (src/providers/KeyboardShortcutsProvider.tsx:22) called `useNavigate()` during render, but was positioned OUTSIDE React Admin's Router context in CRM.tsx:122-158.

**Component Hierarchy (BEFORE - BROKEN):**
```tsx
<ConfigurationProvider>
  <KeyboardShortcutsProvider>  ← useNavigate() called HERE
    <Admin>                      ← Router created HERE (inside CoreAdminUI)
      ...
    </Admin>
  </KeyboardShortcutsProvider>
</ConfigurationProvider>
```

**Error:** "useNavigate() may be used only in the context of a <Router> component."

**Solution Implemented:**
Moved KeyboardShortcutsProvider to render INSIDE the Router context by integrating it into Layout.tsx:
- **File:** src/atomic-crm/layout/Layout.tsx
- **Lines:** 10 (import), 16-42 (wrapping layout children)
- **Removed from:** src/atomic-crm/root/CRM.tsx:122-158

**Results:**
- ✅ Auth setup: 3.8s (previously 120s timeout)
- ✅ Test suite: 19.6s for 7 tests (6 passed)
- ✅ user.json created successfully
- ✅ React app loads in Playwright headless mode

**Investigation Tools Used:**
- Diagnostic test: tests/e2e/specs/diagnostics/env-vars.spec.ts
- Zen MCP debug workflow (5-step systematic investigation)
- Console error monitoring
- Perplexity research for common Vite+Playwright issues

---

## Implementation Checklist

### Phase 1: Resolve Blocker ✅ COMPLETE
- [x] Investigate why React app doesn't initialize in Playwright
- [x] Fix environment configuration or Vite settings
- [x] Verify basic navigation works in headless browser
- [x] Document solution for future reference

### Phase 2: Core Infrastructure
- [ ] Create `support/poms/BasePage.ts`
- [ ] Create `support/utils/console-monitor.ts`
- [ ] Create `support/fixtures/auth.fixture.ts`
- [ ] Create `support/poms/LoginPage.ts`
- [ ] Create `support/poms/DashboardPage.ts`
- [ ] Update `playwright.config.ts` with multi-device projects

### Phase 3: Priority Tests
- [ ] **Smoke test** - `specs/smoke/critical-path.spec.ts`
- [ ] **Opportunities** - Kanban, workflows, CRUD (Priority 1)
- [ ] **Dashboard** - Reports, metrics (Priority 2)
- [ ] **Contacts** - JSONB arrays, CRUD (Priority 3)

### Phase 4: Additional Coverage
- [ ] Organizations CRUD
- [ ] Auth & RLS policies
- [ ] Accessibility scans
- [ ] Error states & empty states
- [ ] Visual regression baselines

### Phase 5: CI/CD Integration
- [ ] Configure test execution strategy (smoke vs full regression)
- [ ] Set up failure reporting and notifications
- [ ] Create flake management process
- [ ] Document maintenance procedures

---

## Success Metrics

**Coverage Goals:**
- ✅ All critical paths tested (login → create → search)
- ✅ Each priority feature has deep coverage (10+ tests)
- ✅ Visual regression baselines for all main views
- ✅ Console error monitoring active on every test
- ✅ Accessibility scans passing
- ✅ Tests run on all 3 viewports (iPad Portrait, iPad Landscape, Desktop)

**Quality Metrics:**
- ⚠️ Zero flaky tests (condition-based waiting, not timeouts)
- ⚠️ Test failures provide immediate diagnostic info (console monitoring)
- ⚠️ Semantic selectors survive UI refactors without test changes
- ⚠️ Parallel execution works without data conflicts (timestamp-based data)

---

## Related Skills

- **`~/.claude/skills/playwright-e2e-testing/SKILL.md`** - Enforces all patterns in this document
- **`superpowers:condition-based-waiting`** - Pattern for reliable async testing
- **`superpowers:verification-before-completion`** - Run tests before claiming work complete

---

## Revision History

- **2025-11-05 (Evening)**: App initialization blocker RESOLVED
  - Root cause: KeyboardShortcutsProvider calling useNavigate() outside Router context
  - Solution: Moved KeyboardShortcutsProvider from CRM.tsx to Layout.tsx
  - Results: Auth setup 3.8s (was 120s timeout), 6/7 tests passing
  - Created diagnostic test (tests/e2e/specs/diagnostics/env-vars.spec.ts)
  - Ready for Phase 2 implementation

- **2025-11-05 (Morning)**: Initial design complete (brainstorming + Zen consultation)
  - Identified priorities: pre-launch confidence, iPad-first, deep testing
  - Designed Zen-optimized structure (support/, specs/, merged visual tests)
  - Created Playwright testing skill (~/.claude/skills/playwright-e2e-testing/)
  - Discovered app initialization blocker

---

**Document Status:** READY FOR IMPLEMENTATION ✅

**Next Actions:**
1. Implement Phase 2: Core infrastructure (BasePage, console-monitor, fixtures, POMs)
2. Implement Phase 3: Priority tests (Smoke, Opportunities, Dashboard, Contacts)
3. Set up CI/CD integration with test execution strategy
