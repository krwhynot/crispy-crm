# Implementation Plan: es-toolkit Migration

**Date:** 2025-12-03
**Type:** Refactoring
**Scope:** Cross-feature (10 files)
**Estimated Time:** 45-60 minutes
**Execution:** 2 phases with parallel task groups

---

## Executive Summary

Migrate from `lodash@4.17.21` to `es-toolkit` for **85-90% smaller bundle size** and **2-3x better performance**. This is a low-risk refactoring with API compatibility via `es-toolkit/compat`.

---

## Prerequisites

### Required Reading
- **ADR:** `docs/decisions/adr-utilities-best-practices.md` (Section 2 - lodash)
- **Evaluation:** `docs/reviews/2025-12-03-adr-utilities-compliance-review.md`

### Environment Check
```bash
# Verify current lodash version
npm list lodash
# Expected: lodash@4.17.21

# Verify no blocking TypeScript errors
npx tsc --noEmit
```

---

## Phase 0: Setup (Sequential)

### Task 0.1: Install es-toolkit
**File:** `package.json`
**Time:** 2 minutes

```bash
npm install es-toolkit
```

**Verification:**
```bash
npm list es-toolkit
# Expected: es-toolkit@<version>
```

### Task 0.2: Create Migration Parity Tests
**File:** `src/lib/__tests__/es-toolkit-parity.test.ts` (NEW)
**Time:** 10 minutes

```typescript
/**
 * es-toolkit Migration Parity Tests
 *
 * These tests verify that es-toolkit functions behave identically
 * to their lodash equivalents for our specific use cases.
 */
import { describe, it, expect } from 'vitest';

// Phase 1 imports (will switch from lodash to es-toolkit)
import { get } from 'es-toolkit/compat';
import { isEqual } from 'es-toolkit';
import { pickBy } from 'es-toolkit/compat';
import { set } from 'es-toolkit/compat';

// Phase 2 imports
import { isMatch } from 'es-toolkit/compat';

describe('es-toolkit parity with lodash', () => {
  describe('get - deep property access', () => {
    const obj = {
      a: { b: { c: 3 } },
      'x.y': { z: 4 },
      arr: [{ id: 1 }, { id: 2 }],
    };

    it('accesses nested properties with dot notation', () => {
      expect(get(obj, 'a.b.c')).toBe(3);
    });

    it('accesses nested properties with array notation', () => {
      expect(get(obj, ['a', 'b', 'c'])).toBe(3);
    });

    it('returns undefined for missing paths', () => {
      expect(get(obj, 'a.b.d')).toBeUndefined();
    });

    it('returns default value for missing paths', () => {
      expect(get(obj, 'a.b.d', 'default')).toBe('default');
    });

    it('accesses array elements', () => {
      expect(get(obj, 'arr[0].id')).toBe(1);
      expect(get(obj, 'arr.1.id')).toBe(2);
    });

    it('handles null/undefined objects', () => {
      expect(get(null, 'a.b')).toBeUndefined();
      expect(get(undefined, 'a.b', 'fallback')).toBe('fallback');
    });
  });

  describe('set - deep property mutation', () => {
    it('sets nested properties', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.c', 2);
      expect(obj).toEqual({ a: { b: 1, c: 2 } });
    });

    it('creates intermediate objects', () => {
      const obj = {};
      set(obj, 'a.b.c', 1);
      expect(obj).toEqual({ a: { b: { c: 1 } } });
    });

    it('creates arrays for numeric paths', () => {
      const obj = {};
      set(obj, 'a[0]', 1);
      expect(obj).toEqual({ a: [1] });
    });
  });

  describe('isEqual - deep equality', () => {
    it('compares primitives', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(null, null)).toBe(true);
    });

    it('compares objects deeply', () => {
      expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('compares arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('compares Date objects', () => {
      const d1 = new Date('2025-01-01');
      const d2 = new Date('2025-01-01');
      expect(isEqual(d1, d2)).toBe(true);
    });

    it('compares nested arrays in objects', () => {
      expect(isEqual(
        { filters: [{ field: 'a' }] },
        { filters: [{ field: 'a' }] }
      )).toBe(true);
    });
  });

  describe('pickBy - filter object by predicate', () => {
    it('filters object properties by predicate', () => {
      const obj = { a: 1, b: undefined, c: 3, d: null };
      const result = pickBy(obj, (val) => val !== undefined);
      expect(result).toEqual({ a: 1, c: 3, d: null });
    });

    it('filters by truthy values', () => {
      const obj = { a: 1, b: 0, c: '', d: 'hello' };
      const result = pickBy(obj, Boolean);
      expect(result).toEqual({ a: 1, d: 'hello' });
    });
  });

  describe('isMatch - partial object matching (replaces matches)', () => {
    it('matches partial objects', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(isMatch(obj, { a: 1 })).toBe(true);
      expect(isMatch(obj, { a: 1, b: 2 })).toBe(true);
      expect(isMatch(obj, { a: 2 })).toBe(false);
    });

    it('matches nested objects', () => {
      const obj = { a: { b: 2 }, c: 3 };
      expect(isMatch(obj, { a: { b: 2 } })).toBe(true);
    });

    it('works with undefined filtering pattern', () => {
      // This is the exact pattern from toggle-filter-button.tsx
      const filters = { status: 'active', priority: 'high' };
      const value = { status: 'active', other: undefined };
      const cleanedValue = pickBy(value, (val) => typeof val !== 'undefined');
      expect(isMatch(filters, cleanedValue)).toBe(true);
    });
  });
});
```

**Verification:**
```bash
npm test -- src/lib/__tests__/es-toolkit-parity.test.ts
# Expected: All tests pass
```

---

## Phase 1: Drop-in Replacements (Parallel)

All tasks in this phase can run in parallel - they modify different files with no dependencies.

### Task 1.1: Migrate filter-form.tsx
**File:** `src/components/admin/filter-form.tsx`
**Time:** 3 minutes

**Current imports (lines 3-8):**
```typescript
// lodash/get: Safe deep property access with dynamic paths - native optional chaining
// requires static paths and doesn't support string notation like "a.b[0].c"
import get from "lodash/get";
// lodash/isEqual: Deep object equality comparison - native === only checks reference,
// and JSON.stringify doesn't handle undefined, functions, or circular references
import isEqual from "lodash/isEqual";
```

**Replace with:**
```typescript
// es-toolkit: Deep property access with dynamic paths (lodash-compatible)
import { get } from "es-toolkit/compat";
// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
```

**Verification:**
```bash
npx tsc --noEmit src/components/admin/filter-form.tsx
```

### Task 1.2: Migrate saved-queries.tsx
**File:** `src/components/admin/saved-queries.tsx`
**Time:** 2 minutes

**Current import (lines 4-6):**
```typescript
// lodash/isEqual: Deep object equality comparison - native === only checks reference,
// and JSON.stringify doesn't handle undefined, functions, or circular references
import isEqual from "lodash/isEqual";
```

**Replace with:**
```typescript
// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
```

### Task 1.3: Migrate simple-form-iterator.tsx
**File:** `src/components/admin/simple-form-iterator.tsx`
**Time:** 2 minutes

**Current import (lines 1-3):**
```typescript
// lodash/get: Safe deep property access with dynamic paths - native optional chaining
// requires static paths and doesn't support string notation like "a.b[0].c"
import get from "lodash/get";
```

**Replace with:**
```typescript
// es-toolkit: Deep property access with dynamic paths (lodash-compatible)
import { get } from "es-toolkit/compat";
```

### Task 1.4: Migrate data-table.tsx
**File:** `src/components/admin/data-table.tsx`
**Time:** 2 minutes

**Current import (lines 31-33):**
```typescript
// lodash/get: Safe deep property access with dynamic paths - native optional chaining
// requires static paths and doesn't support string notation like "a.b[0].c"
import get from "lodash/get";
```

**Replace with:**
```typescript
// es-toolkit: Deep property access with dynamic paths (lodash-compatible)
import { get } from "es-toolkit/compat";
```

### Task 1.5: Migrate file-field.tsx
**File:** `src/components/admin/file-field.tsx`
**Time:** 2 minutes

**Current import (lines 2-4):**
```typescript
// lodash/get: Safe deep property access with dynamic paths - native optional chaining
// requires static paths and doesn't support string notation like "a.b[0].c"
import get from "lodash/get";
```

**Replace with:**
```typescript
// es-toolkit: Deep property access with dynamic paths (lodash-compatible)
import { get } from "es-toolkit/compat";
```

### Task 1.6: Migrate useSupportCreateSuggestion.tsx
**File:** `src/hooks/useSupportCreateSuggestion.tsx`
**Time:** 2 minutes

**Current import (lines 6-8):**
```typescript
// lodash/set: Deep property mutation with auto-creation of intermediate objects -
// no native equivalent for dynamic nested path assignment
import set from "lodash/set";
```

**Replace with:**
```typescript
// es-toolkit: Deep property mutation with auto-creation (lodash-compatible)
import { set } from "es-toolkit/compat";
```

### Task 1.7: Migrate OpportunityListContent.tsx
**File:** `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx`
**Time:** 2 minutes

**Current import (lines 1-3):**
```typescript
// lodash/isEqual: Deep object equality comparison - native === only checks reference,
// and JSON.stringify doesn't handle undefined, functions, or circular references
import isEqual from "lodash/isEqual";
```

**Replace with:**
```typescript
// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
```

### Task 1.8: Migrate ActivityTimelineFilters.tsx
**File:** `src/atomic-crm/opportunities/ActivityTimelineFilters.tsx`
**Time:** 2 minutes

**Current import (lines 16-18):**
```typescript
// lodash/isEqual: Deep object equality comparison - native === only checks reference,
// and JSON.stringify doesn't handle undefined, functions, or circular references
import isEqual from "lodash/isEqual";
```

**Replace with:**
```typescript
// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
```

### Phase 1 Verification (Sequential after parallel tasks)

```bash
# Run TypeScript check
npx tsc --noEmit

# Run parity tests
npm test -- src/lib/__tests__/es-toolkit-parity.test.ts

# Run full test suite
npm test

# Build verification
npm run build
```

**Expected:** All pass with 0 errors.

---

## Phase 2: API Changes (Sequential)

This phase requires careful attention - the API differs from lodash.

### Task 2.1: Migrate toggle-filter-button.tsx (matches → isMatch)
**File:** `src/components/admin/toggle-filter-button.tsx`
**Time:** 5 minutes

**Current imports (lines 5-10):**
```typescript
// lodash/matches: Creates predicate for partial object matching -
// native Object.entries().every() works but is more verbose for complex matching
import matches from "lodash/matches";
// lodash/pickBy: Filter object by predicate - native Object.fromEntries(Object.entries().filter())
// is verbose; lodash provides cleaner API for conditional property filtering
import pickBy from "lodash/pickBy";
```

**Replace with:**
```typescript
// es-toolkit: Partial object matching (note: isMatch, not matches)
import { isMatch, pickBy } from "es-toolkit/compat";
```

**Current usage (find in file):**
```typescript
// BEFORE: lodash matches creates a predicate function
const isSelected = matches(pickBy(value, (val) => typeof val !== "undefined"))(safeFilters);
```

**Replace with:**
```typescript
// AFTER: es-toolkit isMatch takes (object, source) directly
const isSelected = isMatch(safeFilters, pickBy(value, (val) => typeof val !== "undefined"));
```

**Key difference:**
- `lodash/matches(source)(object)` - Creates predicate, then calls it
- `es-toolkit/isMatch(object, source)` - Direct comparison, arguments swapped

**Verification:**
```bash
npx tsc --noEmit src/components/admin/toggle-filter-button.tsx
npm test -- --grep "toggle-filter" --passWithNoTests
```

---

## Phase 3: Cleanup (Sequential)

### Task 3.1: Remove lodash Dependencies
**File:** `package.json`
**Time:** 2 minutes

```bash
npm uninstall lodash @types/lodash
```

**Verification:**
```bash
# Verify lodash is removed
npm list lodash 2>&1 | grep -E "empty|ERR"
# Expected: empty or error (not found)

# Verify no remaining lodash imports
grep -r "from ['\"]lodash" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches
```

### Task 3.2: Final Verification
**Time:** 5 minutes

```bash
# Full TypeScript check
npx tsc --noEmit

# Full test suite
npm test

# Production build
npm run build

# Verify bundle (optional - check for lodash in output)
grep -r "lodash" dist/ 2>/dev/null || echo "No lodash references in build"
```

---

## Dependency Graph

```
Phase 0 (Sequential)
├── Task 0.1: Install es-toolkit
└── Task 0.2: Create parity tests
        │
        ▼
Phase 1 (Parallel - all independent)
├── Task 1.1: filter-form.tsx (get, isEqual)
├── Task 1.2: saved-queries.tsx (isEqual)
├── Task 1.3: simple-form-iterator.tsx (get)
├── Task 1.4: data-table.tsx (get)
├── Task 1.5: file-field.tsx (get)
├── Task 1.6: useSupportCreateSuggestion.tsx (set)
├── Task 1.7: OpportunityListContent.tsx (isEqual)
└── Task 1.8: ActivityTimelineFilters.tsx (isEqual)
        │
        ▼
Phase 1 Verification (Sequential)
        │
        ▼
Phase 2 (Sequential - API differs)
└── Task 2.1: toggle-filter-button.tsx (matches→isMatch, pickBy)
        │
        ▼
Phase 3 (Sequential)
├── Task 3.1: Remove lodash
└── Task 3.2: Final verification
```

---

## Rollback Plan

If issues arise after migration:

```bash
# Revert es-toolkit and reinstall lodash
npm uninstall es-toolkit
npm install lodash @types/lodash

# Revert file changes
git checkout HEAD -- src/components/admin/ src/hooks/ src/atomic-crm/
```

---

## Success Criteria

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| lodash in bundle | ~15-20 KB | 0 KB | ✅ Removed |
| es-toolkit in bundle | 0 KB | ~1-2 KB | ✅ Smaller |
| TypeScript errors | 0 | 0 | ✅ Same |
| Test failures | 0 | 0 | ✅ Same |
| Build time | ~1m 30s | ~1m 30s | ✅ Same |

---

## Constitution Checklist

For each task, verify:
- [ ] No retry logic introduced
- [ ] No validation added to components (API boundary only)
- [ ] No direct Supabase imports
- [ ] Using `interface` for object shapes, `type` for unions
- [ ] No hardcoded colors (semantic tokens only)
- [ ] Touch targets remain 44×44px minimum

---

## Files Modified Summary

| File | Change |
|------|--------|
| `package.json` | Add es-toolkit, remove lodash |
| `src/lib/__tests__/es-toolkit-parity.test.ts` | NEW - parity tests |
| `src/components/admin/filter-form.tsx` | get, isEqual |
| `src/components/admin/saved-queries.tsx` | isEqual |
| `src/components/admin/simple-form-iterator.tsx` | get |
| `src/components/admin/data-table.tsx` | get |
| `src/components/admin/file-field.tsx` | get |
| `src/hooks/useSupportCreateSuggestion.tsx` | set |
| `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` | isEqual |
| `src/atomic-crm/opportunities/ActivityTimelineFilters.tsx` | isEqual |
| `src/components/admin/toggle-filter-button.tsx` | matches→isMatch, pickBy |

**Total:** 11 files (1 new, 10 modified)
