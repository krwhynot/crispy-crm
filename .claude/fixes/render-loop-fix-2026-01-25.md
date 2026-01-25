# Render Loop Fix: OpportunitiesByPrincipalReport

**Date:** 2026-01-25
**Issue:** React render loop caused by unstable object references in useEffect dependency array
**File:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`

## The Problem

### Root Cause
The `FilterToolbar` component had a render loop caused by:
1. `useWatch` from React Hook Form returns a **new object reference on every render**
2. This new reference was passed directly to `useEffect` dependency array
3. Effect runs → calls `onFiltersChange` → parent re-renders → FilterToolbar re-renders → new `watchedValues` object → Effect runs again → **INFINITE LOOP**

### The Analogy: The Panic-Stricken Waiter
- **Component** = Waiter watching a table
- **useWatch** = Returns new table position every time waiter blinks
- **useEffect** = Waiter panics and rushes to kitchen
- **API Call** = Duplicate order submitted
- **Result** = Kitchen flooded, lights flickering

```typescript
// ❌ THE CULPRIT (Before Fix)
const watchedValues = useWatch({ control: form.control });

useEffect(() => {
  onFiltersChange(watchedValues); // New object reference every render!
}, [watchedValues, onFiltersChange]); // <--- INFINITE LOOP
```

## The Solution

### Phase 1: Stabilize Object References ✅

**Added:**
1. `useMemo` to create stable object with individual primitive dependencies
2. Debounced effect to prevent excessive API calls during typing

```typescript
// ✅ THE FIX (After)
const stableWatchedValues = useMemo(
  () => ({
    principal_organization_id: watchedValues.principal_organization_id ?? null,
    stage: watchedValues.stage ?? [],
    opportunity_owner_id: watchedValues.opportunity_owner_id ?? null,
    startDate: watchedValues.startDate ?? null,
    endDate: watchedValues.endDate ?? null,
  }),
  [
    // Depend on PRIMITIVES, not the object
    watchedValues.principal_organization_id,
    watchedValues.stage,
    watchedValues.opportunity_owner_id,
    watchedValues.startDate,
    watchedValues.endDate,
  ]
);

// Debounce to prevent API calls on every keystroke
useEffect(() => {
  const timeoutId = setTimeout(() => {
    onFiltersChange(stableWatchedValues);
  }, FILTER_DEBOUNCE_MS); // 300ms

  return () => clearTimeout(timeoutId);
}, [stableWatchedValues, onFiltersChange]);
```

### Phase 2: Input Debouncing ✅

**Added:**
- 300ms debounce via `setTimeout` in useEffect
- Cleanup function to clear timeout on unmount/dependency change
- Prevents API calls while user is typing date values

### Key Changes

**File:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`

1. **Import debounce constant** (line 20):
   ```typescript
   import { DEFAULT_PAGE_SIZE, FILTER_DEBOUNCE_MS } from "@/atomic-crm/constants/appConstants";
   ```

2. **Add useCallback import** (line 1):
   ```typescript
   import { useState, useMemo, useEffect, useCallback } from "react";
   ```

3. **Stabilize watchedValues** (lines 60-76):
   - Extract primitive values into useMemo
   - Depend on individual fields, not entire object
   - Add debounce timeout

## Verification Checklist

### Phase 1: TypeScript Verification ✅
- [x] No TypeScript errors in modified file
- [x] Imports correct (`useCallback`, `FILTER_DEBOUNCE_MS`)

### Phase 2: Runtime Verification (Manual Testing Required)

**Before Running Tests:**
1. Open Chrome DevTools
2. Go to Network tab
3. Filter by "opportunities"
4. Note the number of requests

**Test Scenario 1: Filter Changes**
- [ ] Change principal filter → Wait 300ms → Single API call
- [ ] Change stage filter → Wait 300ms → Single API call
- [ ] Change sales rep → Wait 300ms → Single API call
- [ ] **Expected:** 1 API call per filter change (not continuous)

**Test Scenario 2: Date Input Typing**
- [ ] Click start date input
- [ ] Type "2026-01-15" character by character
- [ ] **Expected:** Single API call 300ms after last keystroke (not 10 calls)

**Test Scenario 3: Multiple Filter Changes**
- [ ] Change principal + stage + date in quick succession
- [ ] **Expected:** Single API call 300ms after last change (debounce working)

**Test Scenario 4: Performance Profiler**
- [ ] Open React DevTools Profiler
- [ ] Record interaction with filters
- [ ] Check "Rendered" count for FilterToolbar
- [ ] **Expected:** <10 renders per filter change (not continuous re-renders)

### Phase 3: Network Verification

**Before Fix (Expected Symptoms):**
- Network tab shows continuous API requests
- Requests fire every few milliseconds
- Console may show warnings about too many renders

**After Fix (Expected Behavior):**
- [ ] Network tab shows single request per filter change
- [ ] No requests until 300ms after last input change
- [ ] No console warnings about render loops

### Phase 4: DOM Mutation Check

**Using Performance Monitor:**
```javascript
// In Chrome DevTools Console
const observer = new PerformanceObserver((list) => {
  console.log('DOM mutations:', list.getEntries().length);
});
observer.observe({ entryTypes: ['measure'] });
```

- [ ] DOM mutations drop to <100 per filter interaction
- [ ] No continuous mutation during idle state

## Related Files

- **No other files modified** - this was isolated to FilterToolbar component
- **Pattern applies to:** Any component using `useWatch` with `useEffect`

## Prevention Pattern

**General Rule:** Never use objects returned from hooks directly in dependency arrays

```typescript
// ❌ WRONG - Unstable reference
const formValues = useWatch({ control });
useEffect(() => {
  doSomething(formValues);
}, [formValues]); // New object every render!

// ✅ RIGHT - Stable primitives
const formValues = useWatch({ control });
const stableValues = useMemo(
  () => ({ field1: formValues.field1, field2: formValues.field2 }),
  [formValues.field1, formValues.field2]
);
useEffect(() => {
  doSomething(stableValues);
}, [stableValues]); // Only changes when primitives change
```

## Codebase Scan Results

**Other instances of this anti-pattern:** NONE FOUND ✅

Searched for:
- `useEffect.*onFiltersChange` → 0 matches
- `onFiltersChange.*setFilters` → Only this file (now fixed)
- Other report files using similar patterns → None found

## Confidence: 95%

**High confidence because:**
- ✅ Root cause identified (unstable `useWatch` reference)
- ✅ Solution follows React best practices (useMemo for stable objects)
- ✅ TypeScript compiles without errors
- ✅ Debouncing added for input hygiene
- ✅ No other instances found in codebase

**To increase to 100%:**
- [ ] Run manual verification tests above
- [ ] Confirm network requests drop from continuous to single-per-change
- [ ] Verify React DevTools shows <10 renders per interaction

## References

- React Docs: [useMemo for object stabilization](https://react.dev/reference/react/useMemo#memoizing-a-dependency-of-another-hook)
- React Hook Form: [useWatch returns new reference](https://react-hook-form.com/docs/usewatch#rules)
- Engineering Constitution: Fail-fast principle (don't mask symptoms, fix root cause)
