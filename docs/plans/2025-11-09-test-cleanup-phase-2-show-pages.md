# Test Cleanup Phase 2: Fix Show Page Tests

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 34 failing Show page tests by adding missing `id` prop to `renderWithAdminContext` calls, achieving 97% pass rate (1,164 passing / 1,184 total).

**Architecture:** All Show page component tests use `renderWithAdminContext` helper which wraps components in React Admin context. The helper accepts `initialEntries` for routing but doesn't extract the ID parameter and pass it to React Admin's `ShowBase` component. The fix adds explicit `id` prop to each test's render call.

**Tech Stack:** React Testing Library, Vitest, React Admin

**Impact:**
- Fix: 34 failing tests (87% of all failures)
- Pass rate: 95.4% → 97.0%
- Time: 30-45 minutes
- Risk: Zero (test-only changes)

---

## Context: Root Cause

### The Problem

React Admin's `ShowBase` component (used by all Show pages) internally calls `useShowController()`, which requires **either**:
1. An explicit `id` prop: `<ShowBase id={1}>`
2. OR a route with `:id` parameter in the URL path

### Current Test Setup (Broken)

```typescript
renderWithAdminContext(<ProductShow />, {
  resource: "products",
  initialEntries: ["/products/1/show"],  // Has ID in URL
  // Missing: id prop
});
```

**Error:** `useShowController requires an id prop or a route with an /:id? parameter`

### The Fix

Add explicit `id` prop to `renderWithAdminContext`:

```typescript
renderWithAdminContext(<ProductShow />, {
  resource: "products",
  id: "1",  // Add this
  initialEntries: ["/products/1/show"],
});
```

**Why this works:** `renderWithAdminContext` doesn't extract route params from `initialEntries`, so we must pass `id` explicitly.

---

## Task 1: Fix ProductShow Tests (13 failures)

**Goal:** Add `id` prop to all 13 ProductShow test cases.

**Files:**
- Modify: `src/atomic-crm/products/__tests__/ProductShow.test.tsx`

**Step 1: Verify tests fail with expected error**

```bash
npm test -- src/atomic-crm/products/__tests__/ProductShow.test.tsx --run
```

**Expected output:**
- 13 failing tests
- Error: "useShowController requires an id prop or a route with an /:id? parameter"

**Step 2: Add id prop to first renderWithAdminContext call (line ~52)**

Find the pattern:
```typescript
renderWithAdminContext(<ProductShow />, {
  resource: "products",
  initialEntries: ["/products/1/show"],
});
```

Replace with:
```typescript
renderWithAdminContext(<ProductShow />, {
  resource: "products",
  id: "1",
  initialEntries: ["/products/1/show"],
});
```

**Step 3: Apply same fix to ALL renderWithAdminContext calls in file**

Search for pattern: `renderWithAdminContext(<ProductShow />, {`

For each occurrence:
1. Find the line with `resource: "products",`
2. Add line after it: `id: "1",`

**Occurrences to fix (approximate line numbers):**
- Line ~52 (renders basic show page)
- Line ~78 (renders with specific product data)
- Line ~104 (renders with relationships)
- Line ~130 (renders with empty data)
- Line ~156 (renders with loading state)
- Line ~182 (renders with error state)
- Line ~208 (renders with custom fields)
- Line ~234 (renders with permissions)
- Line ~260 (renders with actions)
- Line ~286 (renders with tabs)
- Line ~312 (renders with aside)
- Line ~338 (renders with title)
- Line ~364 (renders with toolbar)

**Note:** Exact line numbers may vary - search for `renderWithAdminContext(<ProductShow` to find all occurrences.

**Step 4: Run tests to verify all pass**

```bash
npm test -- src/atomic-crm/products/__tests__/ProductShow.test.tsx --run
```

**Expected output:**
- 0 failures (was 13)
- All tests passing

**Step 5: Commit the fix**

```bash
git add src/atomic-crm/products/__tests__/ProductShow.test.tsx
git commit -m "test: fix ProductShow tests - add missing id prop

All 13 ProductShow tests were failing with 'useShowController requires
an id prop or a route with an /:id? parameter'. Fixed by adding explicit
id prop to renderWithAdminContext calls.

Root cause: renderWithAdminContext helper doesn't extract ID from
initialEntries URL, so it must be passed explicitly.

Reference: Test Cleanup Phase 2 - docs/plans/2025-11-09-test-cleanup-phase-2-show-pages.md"
```

---

## Task 2: Fix OrganizationShow Tests (9 failures)

**Goal:** Add `id` prop to all 9 OrganizationShow test cases.

**Files:**
- Modify: `src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx`

**Step 1: Verify tests fail with expected error**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx --run
```

**Expected output:**
- 9 failing tests
- Error: "useShowController requires an id prop or a route with an /:id? parameter"

**Step 2: Apply the fix pattern**

Search for: `renderWithAdminContext(<OrganizationShow />, {`

For each occurrence:
1. Find the line with `resource: "organizations",`
2. Add line after it: `id: "1",`

**Pattern:**
```typescript
// Before
renderWithAdminContext(<OrganizationShow />, {
  resource: "organizations",
  initialEntries: ["/organizations/1/show"],
});

// After
renderWithAdminContext(<OrganizationShow />, {
  resource: "organizations",
  id: "1",
  initialEntries: ["/organizations/1/show"],
});
```

**Occurrences to fix (approximate count: 9)**

Search the file for all `renderWithAdminContext(<OrganizationShow` patterns and apply the fix.

**Step 3: Run tests to verify all pass**

```bash
npm test -- src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx --run
```

**Expected output:**
- 0 failures (was 9)
- All tests passing

**Step 4: Commit the fix**

```bash
git add src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx
git commit -m "test: fix OrganizationShow tests - add missing id prop

All 9 OrganizationShow tests were failing with 'useShowController requires
an id prop or a route with an /:id? parameter'. Fixed by adding explicit
id prop to renderWithAdminContext calls.

Reference: Test Cleanup Phase 2 - docs/plans/2025-11-09-test-cleanup-phase-2-show-pages.md"
```

---

## Task 3: Fix OpportunityShow Tests (12 failures)

**Goal:** Add `id` prop to all 12 OpportunityShow test cases.

**Files:**
- Modify: `src/atomic-crm/opportunities/__tests__/OpportunityShow.test.tsx`

**Step 1: Verify tests fail with expected error**

```bash
npm test -- src/atomic-crm/opportunities/__tests__/OpportunityShow.test.tsx --run
```

**Expected output:**
- 12 failing tests
- Error: "useShowController requires an id prop or a route with an /:id? parameter"

**Step 2: Apply the fix pattern**

Search for: `renderWithAdminContext(<OpportunityShow />, {`

For each occurrence:
1. Find the line with `resource: "opportunities",`
2. Add line after it: `id: "1",`

**Pattern:**
```typescript
// Before
renderWithAdminContext(<OpportunityShow />, {
  resource: "opportunities",
  initialEntries: ["/opportunities/1/show"],
});

// After
renderWithAdminContext(<OpportunityShow />, {
  resource: "opportunities",
  id: "1",
  initialEntries: ["/opportunities/1/show"],
});
```

**Occurrences to fix (approximate count: 12)**

Search the file for all `renderWithAdminContext(<OpportunityShow` patterns and apply the fix.

**Step 3: Run tests to verify all pass**

```bash
npm test -- src/atomic-crm/opportunities/__tests__/OpportunityShow.test.tsx --run
```

**Expected output:**
- 0 failures (was 12)
- All tests passing

**Step 4: Commit the fix**

```bash
git add src/atomic-crm/opportunities/__tests__/OpportunityShow.test.tsx
git commit -m "test: fix OpportunityShow tests - add missing id prop

All 12 OpportunityShow tests were failing with 'useShowController requires
an id prop or a route with an /:id? parameter'. Fixed by adding explicit
id prop to renderWithAdminContext calls.

Reference: Test Cleanup Phase 2 - docs/plans/2025-11-09-test-cleanup-phase-2-show-pages.md"
```

---

## Task 4: Verify Final State

**Goal:** Confirm all 34 Show page tests now pass and overall test health improved.

**Files:**
- None (verification only)

**Step 1: Run full test suite**

```bash
npm test -- --run
```

**Expected output:**
- **Total tests:** 1,184
- **Passing:** 1,164 (+34 from baseline)
- **Failing:** 5 (down from 39)
- **Pass rate:** 97.0% (up from 95.4%)

**Step 2: Run only Show page tests to verify**

```bash
npm test -- --run 2>&1 | grep -A 2 "Show.test.tsx"
```

**Expected output:**
- ProductShow.test.tsx: PASS (13 tests)
- OrganizationShow.test.tsx: PASS (9 tests)
- OpportunityShow.test.tsx: PASS (12 tests)

**Step 3: Verify remaining failures are expected**

Run tests and check that only these 5 tests are failing:

```bash
npm test -- --run 2>&1 | grep -B 3 "FAIL"
```

**Expected remaining failures (5 tests):**
1. QuickAdd integration tests (2) - Combobox interaction issue (skipped intentionally)
2. Error handling tests (3) - These are passing but show expected error output

**Step 4: Document completion**

Create summary showing before/after metrics:

```bash
echo "=== Test Cleanup Phase 2 Complete ==="
echo "Files modified: 3"
echo "Tests fixed: 34"
echo "Failing tests: 39 → 5 (87% reduction)"
echo "Pass rate: 95.4% → 97.0%"
echo "Time taken: ~30-45 minutes"
```

**Step 5: Update completion record (optional)**

Add to `docs/internal-docs/test-cleanup-2025-11-09.md`:

```markdown
## Phase 2: Fix Show Page Tests

**Completed:** 2025-11-09

### Files Modified

1. `src/atomic-crm/products/__tests__/ProductShow.test.tsx` (13 tests fixed)
2. `src/atomic-crm/organizations/__tests__/OrganizationShow.test.tsx` (9 tests fixed)
3. `src/atomic-crm/opportunities/__tests__/OpportunityShow.test.tsx` (12 tests fixed)

### Fix Applied

Added explicit `id` prop to all `renderWithAdminContext` calls:
```typescript
renderWithAdminContext(<ShowComponent />, {
  resource: "resource-name",
  id: "1",  // Added this line
  initialEntries: ["/resource/1/show"],
});
```

### Impact

- **Tests fixed:** 34
- **Failing tests:** 39 → 5 (87% reduction)
- **Pass rate:** 95.4% → 97.0%
- **Time:** 30-45 minutes

### Remaining Issues

5 tests still failing (to be addressed in Phase 3):
- QuickAdd integration (2) - Combobox API change
- Error handling (3) - False positives (tests are passing, just verbose)
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] ProductShow.test.tsx: All 13 tests passing
- [ ] OrganizationShow.test.tsx: All 9 tests passing
- [ ] OpportunityShow.test.tsx: All 12 tests passing
- [ ] Total failing tests reduced from 39 to 5
- [ ] Pass rate improved from 95.4% to 97.0%
- [ ] 3 commits created with clear messages
- [ ] No production code changes required
- [ ] Test suite execution time unchanged

---

## Risk Assessment

**Risk Level:** ⚠️ VERY LOW

**Why safe:**
1. **Test-only changes** - No production code modified
2. **Simple fix** - Just adding missing parameter
3. **Isolated scope** - Each Show page test file is independent
4. **Easy rollback** - Can revert individual commits if needed

**Rollback plan:**
```bash
# If any issues arise, revert all commits:
git revert HEAD~3..HEAD
# Or restore specific file:
git checkout HEAD~1 -- path/to/file.test.tsx
```

---

## Related Skills

- @superpowers:verification-before-completion - Run verification commands before claiming completion
- @superpowers:test-driven-development - Verify tests fail before fixing, then pass after
- @superpowers:systematic-debugging - If unexpected issues occur

---

## Technical Details

### Why This Error Occurs

React Admin's architecture:
1. `ShowBase` component calls `useShowController()` hook
2. `useShowController()` tries to get record ID from two sources:
   - **Option A:** Explicit `id` prop passed to `ShowBase`
   - **Option B:** Route parameter extracted from URL by React Router

3. In tests, `renderWithAdminContext` uses `MemoryRouter` which:
   - Accepts `initialEntries` for URL simulation
   - But doesn't configure React Router to extract `:id` parameter
   - Therefore Option B fails

4. Tests don't pass `id` prop, so Option A also fails
5. Result: `useShowController` throws error

### Why Production Works

In production:
- React Router is configured with routes like `/products/:id/show`
- When user navigates to `/products/1/show`, Router extracts `id=1`
- `useShowController` gets ID from route params (Option B works)
- No need for explicit `id` prop

### Long-term Fix (Optional)

Could enhance `renderWithAdminContext` to:
1. Parse `initialEntries` URL
2. Extract ID from path (e.g., extract "1" from "/products/1/show")
3. Automatically pass as `id` prop

This would make tests more realistic (matching production behavior).

**For now:** Explicit `id` prop is simpler and sufficient.

---

## Success Criteria

✅ **Phase 2 Complete When:**
1. All 34 Show page tests passing
2. Only 5 tests failing (QuickAdd + error tests)
3. Pass rate ≥ 97.0%
4. 3 commits created
5. Documentation updated
6. Verification checklist 100% complete

**Next:** Phase 3 will address remaining 5 failures (optional - mostly false positives).
