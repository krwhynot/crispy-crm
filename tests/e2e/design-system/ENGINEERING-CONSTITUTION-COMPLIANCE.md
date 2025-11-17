# Engineering Constitution Compliance

**Date:** 2025-11-17
**Status:** ✅ Fully Compliant

## Summary

Updated Playwright test infrastructure to strictly comply with Engineering Constitution principle #1: **NO OVER-ENGINEERING - Fail Fast**.

## What Changed

### Before: Graceful Fallbacks ❌

```typescript
// ❌ Violated "fail fast" principle
const filterSidebar = page
  .locator('[data-testid="filter-sidebar"]')        // Try design system
  .or(page.locator('[role="complementary"]'))        // Fall back to legacy
  .or(page.locator('aside').first());                 // Final fallback

await expect(filterSidebar).toBeVisible();  // Passes on legacy components
```

**Problem:** Graceful degradation masked technical debt. Tests passed on unmigrated components, preventing clear signal about migration status.

### After: Fail Fast ✅

```typescript
// ✅ Complies with "fail fast" principle
const filterSidebar = page.locator('[data-testid="filter-sidebar"]');
await expect(filterSidebar).toBeVisible({ timeout: 5000 });

// Test fails immediately if design system not implemented
```

**Benefit:** Tests fail loudly on unmigrated components, providing clear implementation checklist.

## Engineering Constitution Alignment

### 1. NO OVER-ENGINEERING ✅

**Rule:** No graceful fallbacks for edge cases. Fail fast.

**Compliance:**
- ✅ Removed all `.or()` fallback chains from smoke tests
- ✅ Strict selectors only (`data-testid`, `role="dialog"`, etc.)
- ✅ Tests fail immediately if design system patterns not present
- ✅ No retry logic, no timeout extensions, no conditional checks

**Code Example:**
```typescript
// Smoke test - checks presence (fail fast)
test("has filter sidebar", async ({ page }) => {
  const sidebar = page.locator('[data-testid="filter-sidebar"]');
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  // Fails immediately if not present
});

// Contract test - checks behavior (fail fast)
test("filter sidebar is 256px wide", async ({ page }) => {
  const sidebar = page.locator('[data-testid="filter-sidebar"]');
  const box = await sidebar.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(254);  // 256px - 2px tolerance
  // Fails immediately if width incorrect
});
```

### 2. SINGLE SOURCE OF TRUTH ✅

**Rule:** One data provider, one validation layer.

**Compliance:**
- ✅ `migration-status.json` is single source for migration state
- ✅ Tests read from this file to determine behavior
- ✅ No duplicate tracking in code comments or separate configs

### 3. BOY SCOUT RULE ✅

**Rule:** Fix inconsistencies when editing files.

**Compliance:**
- ✅ Fixed all 7 fixture bugs when editing test files
- ✅ Cleaned up table row filtering logic
- ✅ Removed brittle aria-label selectors

### 4. TYPESCRIPT ✅

**Rule:** `interface` for objects, `type` for unions.

**Compliance:**
- ✅ `interface MigrationStatus` - object shape
- ✅ `interface ResourceStatus` - object shape
- ✅ Proper type annotations throughout utilities

## Test Philosophy

### Two-Tier Strategy (Both Fail-Fast)

**Tier 1: Smoke Tests**
- **Check:** Presence of key elements
- **Example:** "Does filter sidebar exist?"
- **Selector:** `data-testid="filter-sidebar"`
- **Behavior:** Fails if element not found

**Tier 2: Contract Tests**
- **Check:** Full behavior compliance
- **Example:** "Is filter sidebar 256px wide?"
- **Selector:** Same deterministic selector
- **Behavior:** Fails if behavior incorrect

**Key Difference:** What they verify, not how they verify it. Both use strict selectors and fail immediately.

## Migration Impact

### Before Compliance Change

- Smoke tests: 100% pass rate (false positives on unmigrated components)
- Contract tests: Skipped for unmigrated resources
- **Problem:** No visibility into unmigrated technical debt

### After Compliance Change

- Smoke tests: 0% pass rate (expected - components not migrated)
- Contract tests: Skipped for unmigrated resources
- **Benefit:** Clear signal - test failures = implementation TODO list

### Test Execution Strategy

```bash
# All tests will fail until components migrated
npx playwright test tests/e2e/design-system-smoke.spec.ts
# ❌ 42 failures (expected)

# Enable contract tests for resources you're migrating
export UNIFIED_DS_RESOURCES=contacts
npx playwright test tests/e2e/design-system/list-layout.spec.ts --grep="Contacts"
# ❌ Failures show exactly what to implement

# After implementing design system patterns
npm run test:e2e:design-system
# ✅ Tests pass (strict validation of implementation)
```

## CI Integration

### Recommended Approach

**Option 1: Skip All Design System Tests Until First Migration**
```yaml
# .github/workflows/ci.yml
- name: Run tests (skip design-system)
  run: npx playwright test --ignore-pattern="**/design-system/**"
```

**Option 2: Allow Failures Until Migration Complete**
```yaml
# .github/workflows/ci.yml
- name: Run design system tests (allow failures)
  run: npx playwright test tests/e2e/design-system-smoke.spec.ts || true
  continue-on-error: true
```

**Option 3: Only Run for Migrated Resources (Recommended)**
```yaml
- name: Detect migrated resources
  id: detect
  run: |
    MIGRATED=$(cat tests/e2e/design-system/migration-status.json | \
      jq -r '.resources | to_entries[] | select(.value.listLayout.migrated == true) | .key' | \
      tr '\n' ',' | sed 's/,$//')
    echo "resources=$MIGRATED" >> $GITHUB_OUTPUT

- name: Run design system tests
  if: steps.detect.outputs.resources != ''
  env:
    UNIFIED_DS_RESOURCES: ${{ steps.detect.outputs.resources }}
  run: npx playwright test tests/e2e/design-system/
```

## Rationale for Architecture

### Why Two Test Tiers?

**Q:** If both smoke and contract tests use strict selectors, why have both?

**A:** Different levels of detail:
- **Smoke:** Fast checks for critical elements (~30s for 42 tests)
- **Contract:** Thorough validation of behavior (~10min for 118 tests)

**Analogy:** TypeScript compiler vs. ESLint
- TypeScript: Catches type errors (smoke tests)
- ESLint: Enforces style/patterns (contract tests)
- Both fail fast, different purposes

### Why Not Just Use Contract Tests?

**Speed:** Smoke tests run 20x faster than full contract suite.

**Feedback:** Developers get quick feedback before running full validation.

**CI Efficiency:** Smoke tests can run on every commit, contract tests on PR only.

## Future Enhancements (Engineering Constitution Compliant)

### 1. Add Skip Flags to Smoke Tests

Instead of removing smoke tests, make them respect migration status:

```typescript
test.beforeEach(({ authenticatedPage }, testInfo) => {
  if (shouldSkipTest('contacts', 'listLayout')) {
    testInfo.skip(true, getSkipReason('contacts', 'listLayout'));
  }
});
```

**Benefit:** Tests only run for migrated resources, maintaining fail-fast behavior.

### 2. Progressive Test Enabling

As each resource migrates, smoke tests automatically enable:

```json
{
  "contacts": {
    "listLayout": {
      "migrated": true  // ← Smoke tests now run for contacts
    }
  }
}
```

**Benefit:** Continuous validation as migration progresses.

## Conclusion

The test infrastructure now strictly follows Engineering Constitution principles:
- ✅ **Fail fast** - No fallback selectors or graceful degradation
- ✅ **Single source of truth** - migration-status.json coordinates behavior
- ✅ **Simple validation** - Deterministic selectors, immediate failures

Tests provide clear signal: failures = implementation checklist, passes = compliance verified.

---

**Status:** Engineering Constitution compliant. All tests use strict selectors and fail immediately when design system patterns are not implemented.
