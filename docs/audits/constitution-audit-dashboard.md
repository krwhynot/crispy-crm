# Engineering Constitution Compliance Audit: Dashboard Module

**Audit Date:** 2025-11-29
**Module:** `src/atomic-crm/dashboard/v3/`
**Constitution Reference:** `docs/claude/engineering-constitution.md`

---

## Executive Summary

| Principle | Status | Severity | Notes |
|-----------|--------|----------|-------|
| 1. NO OVER-ENGINEERING | ✅ PASS | - | Fail-fast patterns observed |
| 2. SINGLE COMPOSABLE ENTRY POINT | ✅ PASS | - | Uses React Admin's dataProvider |
| 3. BOY SCOUT RULE | ⚠️ PARTIAL | Low | Some orphaned exports |
| 4. VALIDATION AT API BOUNDARY | ⚠️ VIOLATION | Medium | Duplicate schema in dashboard |
| 5. FORM STATE FROM SCHEMA | ✅ PASS | - | QuickLogForm uses Zod defaults |
| 6. TYPESCRIPT CONVENTIONS | ⚠️ PARTIAL | Low | Mix of `type` and `interface` |
| 7. FORMS | ✅ PASS | - | Uses React Admin integration |
| 8. COLORS | ✅ PASS | - | Semantic variables only |
| 9. MIGRATIONS | N/A | - | No migrations in module |

**Overall Assessment:** 🟡 MOSTLY COMPLIANT with 2 medium-priority issues

---

## Detailed Findings

### 1. NO OVER-ENGINEERING ✅

**Status:** PASS

**Evidence:**
- Error boundaries let errors bubble up with Sentry reporting (DashboardErrorBoundary.tsx)
- No circuit breakers or retry logic
- Simple error handling: `setError(err as Error)` in hooks
- No fallback data patterns

```typescript
// usePrincipalPipeline.ts:81-84 - Correct fail-fast pattern
} catch (err) {
  console.error("Failed to fetch principal pipeline:", err);
  setError(err as Error);
}
```

---

### 2. SINGLE COMPOSABLE ENTRY POINT ✅

**Status:** PASS

**Evidence:**
- All data access goes through `useDataProvider()` from React Admin
- No direct Supabase client usage in dashboard components
- Consistent pattern across 8 hooks

**Hooks using dataProvider:**
- `usePrincipalPipeline.ts` (1 call)
- `useMyTasks.ts` (4 calls)
- `useKPIMetrics.ts` (3 calls)
- `usePrincipalOpportunities.ts` (1 call)
- `useMyPerformance.ts` (8 calls)
- `useTeamActivities.ts` (1 call)
- `QuickLogForm.tsx` (2 calls)

---

### 3. BOY SCOUT RULE ⚠️

**Status:** PARTIAL VIOLATION

**Issue:** Orphaned/unused exports in barrel files

**Evidence:**

1. **`components/index.ts` exports unused components:**
   - `TasksPanel` - Exported but not used (replaced by `TasksKanbanPanel`)
   - `SnoozePopover` - Only used internally by TasksPanel (not in main dashboard)

2. **`v3/index.ts` internal components exposed:**
   - Comment says "Child components...are internal implementation details and not exported"
   - But they ARE exported via `components/index.ts`

**Recommendation:**
```typescript
// components/index.ts - Remove unused exports
export { TaskGroup } from "./TaskGroup";
// export { TasksPanel } from "./TasksPanel"; // REMOVE: Replaced by TasksKanbanPanel
export { TasksKanbanPanel } from "./TasksKanbanPanel";
// export { SnoozePopover } from "./SnoozePopover"; // REMOVE: Internal to TasksPanel
```

---

### 4. VALIDATION AT API BOUNDARY ⚠️

**Status:** VIOLATION

**Issue:** Duplicate Zod schema exists in dashboard (`v3/validation/activitySchema.ts`) when canonical schema exists at `src/atomic-crm/validation/activities.ts`

**Evidence:**

| Schema Location | Size | Purpose |
|-----------------|------|---------|
| `src/atomic-crm/validation/activities.ts` | 412 LOC | Canonical schema per Constitution |
| `src/atomic-crm/dashboard/v3/validation/activitySchema.ts` | 113 LOC | Dashboard-specific duplicate |

**Differences:**
- Dashboard schema uses `ACTIVITY_TYPE_GROUPS` for UI categorization
- Dashboard schema has different field names (e.g., `activityType` vs `type`)
- Both define `sampleStatusSchema` independently

**Constitution Violation:**
> "Zod schemas at API boundary only (`src/atomic-crm/validation/`)"

**Recommendation:**
1. Move UI-specific constants (ACTIVITY_TYPE_GROUPS) to canonical schema
2. Import schema from `@/atomic-crm/validation/activities` in QuickLogForm
3. Delete `v3/validation/activitySchema.ts`

---

### 5. FORM STATE FROM SCHEMA ✅

**Status:** PASS

**Evidence:** `QuickLogForm.tsx:136-147`
```typescript
const defaultValues = useMemo(() => {
  const schemaDefaults = activityLogSchema.partial().parse({});
  if (initialDraft) {
    return { ...schemaDefaults, ...initialDraft };
  }
  return schemaDefaults;
}, [initialDraft]);

const form = useForm<ActivityLogInput>({
  resolver: zodResolver(activityLogSchema),
  defaultValues,
});
```

This correctly implements Constitution Principle 5: defaults derived from Zod schema.

---

### 6. TYPESCRIPT CONVENTIONS ⚠️

**Status:** PARTIAL

**Issue:** Mixed usage of `type` and `interface`

**Evidence in `types.ts`:**
```typescript
// ✅ Correct: interface for object shapes
export interface PrincipalPipelineRow { ... }
export interface TaskItem { ... }

// ⚠️ Incorrect: type used for object (should be interface)
// types.ts:56 - ActivityLog is an object shape
export interface ActivityLog { ... }  // Actually correct in source

// ✅ Correct: type for unions
export type Momentum = "increasing" | "steady" | "decreasing" | "stale";
export type TaskStatus = "overdue" | "today" | "tomorrow" | "upcoming" | "later";
```

**Verdict:** `types.ts` follows conventions correctly. Minor inconsistencies in component files.

---

### 7. FORMS ✅

**Status:** PASS

**Evidence:**
- QuickLogForm uses `@/components/ui/form` components
- React Hook Form integration with Zod resolver
- Uses shadcn/ui form primitives (FormField, FormItem, FormLabel, FormControl)

---

### 8. COLORS ✅

**Status:** PASS

**Evidence:** All color references use semantic tokens:
```typescript
// PrincipalPipelineTable.tsx:150-158
case "increasing":
  return <TrendingUp className="h-4 w-4 text-success" />;
case "decreasing":
  return <TrendingDown className="h-4 w-4 text-warning" />;
case "stale":
  return <AlertCircle className="h-4 w-4 text-destructive" />;
```

No hex codes or arbitrary OKLCH values found in dashboard module.

---

## GOD COMPONENTS (>300 LOC)

| Component | LOC | Status | Action Required |
|-----------|-----|--------|-----------------|
| `QuickLogForm.tsx` | **1167** | 🔴 CRITICAL | **Must split** |
| `PrincipalPipelineTable.tsx` | 456 | 🟡 WARNING | Consider split |
| `TasksPanel.tsx` | 342 | 🟡 WARNING | Minor |
| `useMyTasks.ts` | 319 | 🟡 WARNING | Hook, acceptable |
| `TaskKanbanCard.tsx` | 318 | 🟡 WARNING | Minor |
| `TaskCompleteSheet.tsx` | 309 | 🟡 WARNING | Minor |

### QuickLogForm Analysis (1167 LOC)

**Junk-drawer pattern detected.** This component handles:
1. Form state management
2. Debounced search (custom hook embedded at line 95)
3. Three combobox popovers with filtering
4. Entity cascading logic (contact → org → opportunity)
5. Draft persistence
6. Follow-up task creation
7. Sample status tracking

**Recommended Decomposition:**
```
QuickLogForm.tsx (300 LOC)
├── hooks/useActivityForm.ts (form + submit logic)
├── hooks/useEntitySearch.ts (debounced search)
├── components/ContactCombobox.tsx (150 LOC)
├── components/OrganizationCombobox.tsx (150 LOC)
├── components/OpportunityCombobox.tsx (150 LOC)
└── components/FollowUpSection.tsx (100 LOC)
```

---

## JUNK-DRAWER PATTERNS

### Detected in QuickLogForm.tsx:

1. **Embedded custom hook** (lines 95-113)
   ```typescript
   function useDebouncedSearch(delay: number = DEBOUNCE_MS) { ... }
   ```
   Should be extracted to `hooks/useDebouncedSearch.ts`

2. **Inline type definitions** (lines 73-91)
   ```typescript
   interface Contact { ... }
   interface Organization { ... }
   interface Opportunity { ... }
   ```
   Should be in `types.ts`

3. **UI constants scattered** (lines 51-61)
   ```typescript
   const STALE_TIME_MS = 5 * 60 * 1000;
   const INITIAL_PAGE_SIZE = 100;
   const MIN_SEARCH_LENGTH = 2;
   const DEBOUNCE_MS = 300;
   ```
   Should be centralized in `constants.ts`

---

## Action Items

### High Priority 🔴
1. **Split QuickLogForm.tsx** - Decompose into focused components (Target: each <300 LOC)
2. **Consolidate activity schemas** - Single source in `src/atomic-crm/validation/activities.ts`

### Medium Priority 🟡
3. Remove orphaned exports from `components/index.ts` (TasksPanel, SnoozePopover)
4. Extract `useDebouncedSearch` hook to dedicated file

### Low Priority 🟢
5. Centralize UI constants (STALE_TIME_MS, etc.)
6. Move inline type definitions to `types.ts`

---

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Files | 27 | - | - |
| Components >300 LOC | 6 | 0 | 🔴 |
| Components >500 LOC | 1 | 0 | 🔴 |
| Duplicate schemas | 1 | 0 | 🟡 |
| Orphaned exports | 2 | 0 | 🟢 |
| Direct DB access | 0 | 0 | ✅ |
| Hardcoded colors | 0 | 0 | ✅ |
