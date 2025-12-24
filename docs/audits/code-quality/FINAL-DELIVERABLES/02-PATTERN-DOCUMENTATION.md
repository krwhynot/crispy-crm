# Pattern Documentation - Agent 25 Final Synthesis

**Date:** 2025-12-24
**Agent:** 25 - Forensic Aggregator
**Purpose:** Document established patterns vs anti-patterns across the codebase

---

## Excellent Patterns (Maintain These)

### 1. Unified Data Provider Architecture

**Pattern:** Single entry point for all database operations

```typescript
// ✅ CORRECT - src/atomic-crm/providers/supabase/unifiedDataProvider.ts
export const unifiedDataProvider = {
  getList: async (resource, params) => {
    // Centralized validation, transformation, error handling
  },
  // All CRUD operations flow through here
};
```

**Why It Matters:**
- Single source of truth for data access
- Centralized Zod validation at API boundary
- Consistent error handling
- Easy to audit and maintain

**Evidence:** Agent 1 found 98% compliance, zero direct Supabase imports in components.

---

### 2. Zod Validation at API Boundary

**Pattern:** Validate incoming data at the data provider, not in forms

```typescript
// ✅ CORRECT - validation happens in unifiedDataProvider
const processForDatabase = async (resource, data) => {
  const schema = getSchemaForResource(resource);
  const validated = schema.parse(data);  // Throws on invalid
  return transformService.transform(validated);
};
```

**Anti-Pattern:**
```typescript
// ❌ WRONG - validation in form component
const onSubmit = (data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Form-level validation duplicates boundary validation
  }
};
```

**Evidence:** Agent 2 verified 98% schema compliance with proper boundary validation.

---

### 3. Summary Views for List Operations

**Pattern:** Use database views that pre-compute aggregates

```sql
-- ✅ CORRECT - pre-computed view
CREATE VIEW opportunities_summary AS
SELECT
  o.*,
  COUNT(a.id) as activity_count,
  MAX(a.activity_date) as last_activity_date
FROM opportunities o
LEFT JOIN activities a ON a.opportunity_id = o.id
GROUP BY o.id;
```

**Why It Matters:**
- Reduces joins at query time
- Consistent data shape
- Optimized for list views

**Evidence:** Agent 7 found excellent query patterns using summary views.

---

### 4. Comprehensive Code Splitting

**Pattern:** Lazy load all route-level components

```typescript
// ✅ CORRECT - src/atomic-crm/resources.tsx
const OpportunityList = lazy(() => import('./opportunities/OpportunityList'));
const OpportunityCreate = lazy(() => import('./opportunities/OpportunityCreate'));
const OpportunityEdit = lazy(() => import('./opportunities/OpportunityEdit'));

// With Suspense boundary
<Suspense fallback={<Loading />}>
  <OpportunityList />
</Suspense>
```

**Evidence:** Agent 8 found 50+ lazy-loaded components, Grade A bundle architecture.

---

### 5. Manual Chunk Splitting

**Pattern:** Explicit vendor chunk configuration in Vite

```typescript
// ✅ CORRECT - vite.config.ts
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ra-core': ['ra-core', 'ra-i18n-polyglot'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'ui-radix': ['@radix-ui/react-dialog', ...],
  // 11 total chunks
}
```

**Evidence:** Agent 8 found optimal chunk configuration for caching.

---

### 6. Debounced Search Filters

**Pattern:** 300ms debounce on all text filters

```typescript
// ✅ CORRECT - consistent debounce pattern
const debouncedSearch = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  setFilters({ q: debouncedSearch });
}, [debouncedSearch]);
```

**Evidence:** Agent 7 verified all text filters use 300ms debounce.

---

### 7. Context Provider Value Memoization

**Pattern:** Memoize context values to prevent consumer re-renders

```typescript
// ✅ CORRECT - FormOptionsContext.tsx
const value = useMemo(() => ({
  options,
  loading,
  refresh
}), [options, loading, refresh]);

return (
  <FormOptionsContext.Provider value={value}>
    {children}
  </FormOptionsContext.Provider>
);
```

**Evidence:** Agent 6 found all 6 context providers properly memoized.

---

### 8. Batch Fetching with useGetMany

**Pattern:** Use React Admin's batch fetching instead of loops

```typescript
// ✅ CORRECT - batch fetch
const { data } = useGetMany('contacts', { ids: contactIds });

// ❌ WRONG - N+1 query
contactIds.map(id => useGetOne('contacts', { id }));
```

**Evidence:** Agent 7 found zero N+1 patterns; proper useGetMany usage.

---

## Anti-Patterns to Avoid

### 1. .passthrough() at API Boundary

**Anti-Pattern:** Allows arbitrary fields through validation

```typescript
// ❌ WRONG - allows mass assignment
const taskSchema = z.object({
  title: z.string(),
  // ...
}).passthrough();  // DANGER: any field passes through

// ✅ CORRECT - strip unknown fields
const taskSchema = z.object({
  title: z.string(),
}).strict();  // or .strip()
```

**Found:** 7 instances requiring fix (see P1 fixes)

---

### 2. Missing Form Mode Prop

**Anti-Pattern:** Forms without explicit mode use onChange (keystroke validation)

```typescript
// ❌ WRONG - triggers on every keystroke
<Form resolver={zodResolver(schema)}>

// ✅ CORRECT - validates on submit
<Form resolver={zodResolver(schema)} mode="onSubmit">
```

**Found:** 5 forms missing mode prop

---

### 3. Silent Catch Blocks

**Anti-Pattern:** Swallowing errors without logging

```typescript
// ❌ WRONG - error disappears
try {
  await riskyOperation();
} catch (error) {
  // silent fail
}

// ✅ CORRECT - fail fast
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw error;  // or handle explicitly
}
```

**Found:** 17 instances across codebase

---

### 4. Unvalidated Type Assertions

**Anti-Pattern:** Casting without prior validation

```typescript
// ❌ WRONG - trusts external data
return data as UserDigestSummary;

// ✅ CORRECT - validate then return
return userDigestSummarySchema.parse(data);
```

**Found:** 12 high-risk assertions in services

---

### 5. Extreme Page Sizes

**Anti-Pattern:** Fetching thousands of records at once

```typescript
// ❌ WRONG - fetches everything
useGetList('opportunities', {
  pagination: { page: 1, perPage: 10000 }
});

// ✅ CORRECT - reasonable pagination
useGetList('opportunities', {
  pagination: { page: 1, perPage: 100 }
});
```

**Found:** 2 instances (perPage: 10000 and perPage: 1000)

---

### 6. Unmemoized List Components

**Anti-Pattern:** Components in .map() without React.memo

```typescript
// ❌ WRONG - re-renders on every parent change
const ActivityItem = ({ activity }) => { ... };
activities.map(a => <ActivityItem activity={a} />)

// ✅ CORRECT - memoized
const ActivityItem = memo(({ activity }) => { ... });
```

**Found:** 12 components requiring memo

---

### 7. Namespace Imports for Tree-Shakable Libraries

**Anti-Pattern:** `import * as` prevents dead code elimination

```typescript
// ❌ WRONG - imports entire library
import * as dateFns from 'date-fns';
dateFns.format(date, 'PPp');

// ✅ CORRECT - tree-shakable
import { format } from 'date-fns';
format(date, 'PPp');
```

**Found:** 28 actionable instances (excluding React, Sentry which are acceptable)

---

## Pattern Consistency by Resource

| Resource | Data Provider | Validation | Code Split | Memo | Overall |
|----------|--------------|------------|------------|------|---------|
| Organizations | ✅ | ✅ | ✅ | ⚠️ | 90% |
| Contacts | ✅ | ✅ | ✅ | ⚠️ | 90% |
| Opportunities | ✅ | ⚠️ | ✅ | ⚠️ | 85% |
| Tasks | ✅ | ⚠️ | ✅ | ⚠️ | 85% |
| Activities | ✅ | ✅ | ✅ | ❌ | 80% |
| Products | ✅ | ⚠️ | ✅ | ⚠️ | 85% |
| Sales | ✅ | ✅ | ✅ | ⚠️ | 90% |

**Legend:** ✅ Compliant | ⚠️ Minor drift | ❌ Needs attention

---

## Technology Choice Patterns

### Excellent Choices (Keep)

| Category | Choice | Why |
|----------|--------|-----|
| Date handling | `date-fns` | Tree-shakable, ~30KB vs moment's 300KB |
| Utilities | `es-toolkit` | Modern lodash alternative, tree-shakable |
| Icons | `lucide-react` | Individual imports, tree-shakable |
| Forms | `react-hook-form` + `zod` | Best-in-class performance |
| State | `@tanstack/react-query` | Excellent caching, deduplication |
| UI primitives | `@radix-ui` | Accessible, unstyled, composable |
| Charts | `chart.js` | Cherry-picked registration |

### No Duplication Found

- No moment.js (only date-fns)
- No lodash (only es-toolkit)
- No multiple UI libraries
- No multiple form libraries
- No multiple charting libraries

---

## Recommended Pattern Enforcement

### Pre-commit Hooks

```json
{
  "lint-staged": {
    "*.ts?(x)": [
      "eslint --rule 'no-passthrough: error'",
      "eslint --rule 'require-form-mode: error'"
    ]
  }
}
```

### ESLint Rules to Add

1. Ban `.passthrough()` in validation files
2. Require `mode` prop on Form components
3. Warn on `as` type assertions
4. Require error handling in catch blocks

### Code Review Checklist

- [ ] New components in lists wrapped in React.memo?
- [ ] Form has explicit mode prop?
- [ ] Schema uses .strict() not .passthrough()?
- [ ] Service returns validated with Zod?
- [ ] Page size under 100?
- [ ] Errors logged/handled in catch blocks?
