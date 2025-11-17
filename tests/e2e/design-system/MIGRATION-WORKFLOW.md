# Design System Migration Workflow

**Status:** Active | **Last Updated:** 2025-11-17

## Overview

This document describes the test-driven workflow for migrating resources to the unified design system. The testing infrastructure is **migration-aware** - tests run incrementally as you implement patterns, providing immediate feedback without blocking ongoing development.

## Architecture

### 1. Migration Status Tracking

**File:** `tests/e2e/design-system/migration-status.json`

Tracks which resources have implemented which patterns. Each resource has 4 patterns:
- `listLayout` - StandardListLayout with filter sidebar
- `slideOver` - ResourceSlideOver with URL sync
- `createForm` - Create forms with autosave/draft restore
- `visualPrimitives` - Semantic colors/spacing/typography

**Sub-flags** track granular features:
```json
{
  "contacts": {
    "listLayout": {
      "migrated": false,
      "hasDataTestIds": false,      // data-testid="filter-sidebar" present?
      "hasFilterSidebar": false,     // Filter sidebar implemented?
      "hasTableBody": true,          // Table uses <tbody> structure?
      "notes": "Legacy React Admin list"
    }
  }
}
```

### 2. Two-Tier Test Strategy

#### Tier 1: Smoke Tests (Fail-Fast Basic Checks)

**File:** `tests/e2e/design-system-smoke.spec.ts`

- **Purpose:** Verify key design system elements exist
- **Approach:** Deterministic selectors only (Engineering Constitution: fail fast)
- **Speed:** < 2 minutes for all resources
- **Behavior:** Fails on unmigrated components (expected - use skip flags)

**Example:**
```typescript
// Fail fast: Expect design system selectors only
const filterSidebar = page.locator('[data-testid="filter-sidebar"]');
await expect(filterSidebar).toBeVisible({ timeout: 5000 });

// No fallbacks - if design system isn't implemented, test fails
```

**Philosophy:** Smoke tests check *presence* of elements, contract tests check *behavior*. Both use strict selectors (no `.or()` fallbacks).

#### Tier 2: Contract Tests (Opt-in per resource)

**Files:** `tests/e2e/design-system/*.spec.ts`

- **Purpose:** Enforce strict design system contracts
- **Approach:** Deterministic selectors, accessibility requirements, focus management
- **Activation:** Set `UNIFIED_DS_RESOURCES=contacts` environment variable
- **Skipped by default:** Uses `shouldSkipTest()` helper to check migration status

**Example:**
```typescript
test.describe("Contacts - StandardListLayout", () => {
  test.beforeEach(({ authenticatedPage }, testInfo) => {
    if (shouldSkipTest('contacts', 'listLayout')) {
      testInfo.skip(true, getSkipReason('contacts', 'listLayout'));
    }
  });

  test("has filter sidebar with correct width", async ({ authenticatedPage }) => {
    // Strict contract enforcement - only runs if contacts.listLayout.migrated = true
    const sidebar = authenticatedPage.locator('[data-testid="filter-sidebar"]');
    await expect(sidebar).toBeVisible();

    const box = await sidebar.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(254);  // 256px - 2px tolerance
  });
});
```

## Developer Workflow

### Step 1: Choose a Resource to Migrate

Pick a resource (e.g., `contacts`) and pattern (e.g., `listLayout`).

Check current status:
```bash
cat tests/e2e/design-system/migration-status.json | jq '.resources.contacts.listLayout'
```

### Step 2: Run Baseline Smoke Tests

Verify current behavior passes smoke tests:
```bash
npx playwright test tests/e2e/design-system-smoke.spec.ts --grep="contacts"
```

**Expected:** ✅ All smoke tests pass (baseline established)

### Step 3: Enable Contract Tests for Your Resource

Set environment variable to enable strict tests:
```bash
export UNIFIED_DS_RESOURCES=contacts
npx playwright test tests/e2e/design-system/list-layout.spec.ts --grep="Contacts"
```

**Expected:** ❌ Many tests fail - these failures show what you need to implement

### Step 4: Implement Design System Patterns

Use test failures as implementation checklist. For `listLayout`:

**Required Changes:**
1. Add `data-testid="filter-sidebar"` to filter component
2. Wrap table in `<tbody>` element
3. Use 256px width for sidebar
4. Implement premium hover effects on rows
5. Use semantic color variables

**Implementation Example:**
```tsx
// src/atomic-crm/contacts/ContactList.tsx
<StandardListLayout
  filterSidebar={
    <aside
      data-testid="filter-sidebar"  // ← Required for tests
      className="w-64"              // ← 256px width
    >
      <FilterControls />
    </aside>
  }
  mainContent={
    <table>
      <thead>
        <tr role="row">...</tr>
      </thead>
      <tbody>                       {/* ← Required for tests */}
        <tr role="row" className="table-row-premium">  {/* ← Hover effects */}
          ...
        </tr>
      </tbody>
    </table>
  }
/>
```

### Step 5: Run Tests Incrementally

As you implement features, run tests to verify:
```bash
# Run just one test to verify specific feature
npx playwright test tests/e2e/design-system/list-layout.spec.ts:49 --grep="filter sidebar"

# Run all list-layout tests for contacts
UNIFIED_DS_RESOURCES=contacts npx playwright test tests/e2e/design-system/list-layout.spec.ts --grep="Contacts"
```

### Step 6: Update Migration Status

When pattern is fully implemented, update migration status:

```json
{
  "contacts": {
    "listLayout": {
      "migrated": true,              // ← Mark as complete
      "hasDataTestIds": true,
      "hasFilterSidebar": true,
      "hasTableBody": true,
      "notes": "Migrated to StandardListLayout 2025-11-17"
    }
  }
}
```

### Step 7: Verify Contract Tests Pass

Remove environment variable to verify tests auto-run:
```bash
unset UNIFIED_DS_RESOURCES
npx playwright test tests/e2e/design-system/list-layout.spec.ts --grep="Contacts"
```

**Expected:** ✅ Tests run automatically (no longer skipped)

### Step 8: Update Pattern Counts

Update the `patterns` object to reflect new completion:
```json
{
  "patterns": {
    "listLayout": {
      "totalResources": 6,
      "migrated": 1,              // ← Increment
      "inProgress": 0,
      "percentage": 16.7          // ← Update (1/6 * 100)
    }
  }
}
```

## CI Integration

### GitHub Actions Workflow

**File:** `.github/workflows/playwright-design-system.yml` (to be created)

```yaml
name: Design System Tests

on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        run: npx playwright test tests/e2e/design-system-smoke.spec.ts

      - name: Upload smoke test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-report
          path: playwright-report/

  contract-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Detect migrated resources
        id: detect
        run: |
          MIGRATED=$(cat tests/e2e/design-system/migration-status.json | \
            jq -r '.resources | to_entries[] | select(.value.listLayout.migrated == true or .value.slideOver.migrated == true or .value.createForm.migrated == true) | .key' | \
            tr '\n' ',' | sed 's/,$//')
          echo "resources=$MIGRATED" >> $GITHUB_OUTPUT
          echo "Running contract tests for: $MIGRATED"

      - name: Run contract tests
        if: steps.detect.outputs.resources != ''
        run: |
          export UNIFIED_DS_RESOURCES=${{ steps.detect.outputs.resources }}
          npx playwright test tests/e2e/design-system/

      - name: Upload contract test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: contract-test-report
          path: playwright-report/
```

## Migration Checklist per Pattern

### StandardListLayout

- [ ] Add `data-testid="filter-sidebar"` to filter component
- [ ] Ensure table uses `<tbody>` structure
- [ ] Set filter sidebar width to 256px
- [ ] Implement premium hover effects (border, shadow, transform)
- [ ] Use semantic color variables for borders/backgrounds
- [ ] Add sticky positioning to filter sidebar
- [ ] Verify no horizontal scroll on desktop (1440px)
- [ ] Test touch target sizes on iPad (44px minimum)

### ResourceSlideOver

- [ ] Implement right-panel slide-over (40vw width, 480-720px)
- [ ] Add URL sync (`?view={id}`, `?edit={id}`)
- [ ] Implement focus trap with Tab/Shift+Tab
- [ ] Add focus return to trigger element on close
- [ ] Support backdrop click to close
- [ ] Add ESC key handler
- [ ] Implement browser back/forward navigation
- [ ] Add ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- [ ] Add slide animation from right (200ms ease-out)

### Create Forms with Autosave

- [ ] Implement autosave every 31 seconds when dirty
- [ ] Save to localStorage with expiration (7 days)
- [ ] Show draft restore prompt on mount
- [ ] Add breadcrumb navigation (Home > Resources > New {Resource})
- [ ] Implement form card styling (max-w-4xl, shadow-lg)
- [ ] Add sticky footer with action buttons
- [ ] Implement dirty state confirmation on cancel
- [ ] Use Zod schema for default values (not defaultValue props)
- [ ] Validate on blur events

### Visual Primitives

- [ ] Replace hardcoded hex values with semantic tokens
- [ ] Use spacing variables (--spacing-edge-desktop, etc.)
- [ ] Implement consistent typography scale
- [ ] Add hover/focus states with semantic colors
- [ ] Use shadow tokens (shadow-sm, shadow-lg)
- [ ] Add motion-safe transitions (150-200ms)
- [ ] Ensure border-radius consistency (rounded-xl for cards)
- [ ] Verify WCAG 2.1 AA color contrast

## Troubleshooting

### Tests Still Skip Despite Setting UNIFIED_DS_RESOURCES

**Cause:** Migration status JSON not updated

**Fix:**
```json
{
  "contacts": {
    "listLayout": {
      "migrated": false  // ← Must be false for env var override to work
    }
  }
}
```

Environment variable overrides migration status, allowing testing of work-in-progress.

### Smoke Tests Fail After Migration

**Cause:** Breaking change to component structure

**Fix:** Update both smoke test fallback selectors AND migration status sub-flags
```typescript
// Add new selector to fallback chain
const sidebar = page
  .locator('[data-testid="filter-sidebar"]')
  .or(page.locator('[role="complementary"]'))
  .or(page.locator('.new-sidebar-class'));  // ← Add new fallback
```

### Contract Tests Timeout

**Cause:** Component not rendering expected elements

**Fix:** Check migration status sub-flags:
```json
{
  "hasDataTestIds": true,    // ← Verify this matches reality
  "hasFilterSidebar": true,  // ← Check component actually has this
  "hasTableBody": true       // ← Inspect DOM structure
}
```

## Utilities

### Check Migration Progress

```bash
npx tsx tests/e2e/support/utils/migration-status.ts
```

Output:
```
Unified Design System Migration Progress:

  listLayout           [██████░░░░░░░░░░░░░░]  30% (2/6)
  slideOver            [░░░░░░░░░░░░░░░░░░░░]   0% (0/6)
  createForm           [███░░░░░░░░░░░░░░░░░]  16% (1/6)
  visualPrimitives     [█████░░░░░░░░░░░░░░░]  25% (1.5/6)
```

### Validate Migration Status File

```bash
node -e "const {validateMigrationStatus} = require('./tests/e2e/support/utils/migration-status.ts'); console.log(validateMigrationStatus().join('\n'))"
```

### Generate Test Coverage Report

```bash
npx playwright test tests/e2e/design-system/ --reporter=html
npx playwright show-report
```

## FAQ

**Q: Can I test multiple resources at once?**
A: Yes! `export UNIFIED_DS_RESOURCES=contacts,organizations`

**Q: Do smoke tests replace contract tests?**
A: No. Smoke tests catch basic regressions. Contract tests enforce strict design system compliance.

**Q: What if I break a pattern while working on another?**
A: Smoke tests will catch cross-resource regressions on every PR, even if that resource hasn't migrated yet.

**Q: How do I test isolated components without full pages?**
A: Create a component showcase page (see next section) and point tests at `/showcase/filter-sidebar` instead of `/#/contacts`.

## Component Showcase (Future Enhancement)

**File:** `src/showcase/DesignSystemShowcase.tsx`

Isolated component testing environment:
```tsx
<Route path="/showcase">
  <Route path="/showcase/filter-sidebar" element={<FilterSidebarDemo />} />
  <Route path="/showcase/slide-over" element={<SlideOverDemo />} />
  <Route path="/showcase/create-form" element={<CreateFormDemo />} />
</Route>
```

Benefits:
- Test components in isolation
- Faster feedback loop (no auth, no data)
- Catch component library regressions immediately
- Visual regression testing with Percy/Chromatic

## References

- **Rollout Plan:** `docs/plans/2025-11-16-unified-design-system-rollout.md`
- **Fixture Corrections:** `tests/e2e/design-system/FIXTURE-CORRECTIONS.md`
- **Verification Summary:** `tests/e2e/design-system/VERIFICATION-SUMMARY.md`
- **Migration Status:** `tests/e2e/design-system/migration-status.json`
- **Utilities:** `tests/e2e/support/utils/migration-status.ts`

---

**Next Steps:**
1. Choose first resource to migrate (recommend: `contacts` listLayout)
2. Run baseline smoke tests to establish current behavior
3. Enable contract tests with `UNIFIED_DS_RESOURCES=contacts`
4. Use test failures as implementation checklist
5. Update migration status when complete
6. Repeat for remaining resources

**Progress Tracking:** Update `migration-status.json` after each pattern completion to maintain accurate CI behavior.
