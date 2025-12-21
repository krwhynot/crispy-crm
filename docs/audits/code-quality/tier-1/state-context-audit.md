# State & Context Audit Report

**Agent:** 9 - State & Context Auditor
**Date:** 2025-12-20
**Contexts Found:** 17 unique contexts
**useState Hooks Found:** 136 files
**useReducer Hooks Found:** 1 file

---

## Executive Summary

The Crispy CRM codebase demonstrates **generally sound state management practices** with well-structured contexts and proper use of React Admin's built-in state. Key strengths include excellent use of `useMemo` for context value stability in critical contexts (SidebarContext, WizardContext) and strategic session-level caching via `CurrentSaleProvider`. Primary concerns are: **one unstable context value** (CreateSuggestionContext), **moderate prop drilling** in the OpportunityList component tree, and **one deprecated context** (FilterContext) that should migrate to ra-core.

---

## Context Architecture

### Context Inventory

| Context | File | Data Fields | Update Freq | Memoized |
|---------|------|-------------|-------------|----------|
| ConfigurationContext | `src/atomic-crm/root/ConfigurationContext.tsx:39` | 11 fields (deal stages, categories, logos, etc.) | Rare (app init) | ❌ No |
| TutorialContext | `src/atomic-crm/tutorial/TutorialProvider.tsx:29` | 6 fields (startTutorial, progress, etc.) | Rare (user action) | ❌ No |
| CurrentSaleContext | `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts:24` | 4 fields (salesId, loading, error, refetch) | Rare (session) | ❌ No |
| SidebarContext | `src/components/ui/sidebar.utils.ts:18` | 7 fields (state, open, isMobile, etc.) | Often (toggle) | ✅ Yes |
| WizardContext | `src/components/admin/form/FormWizard.tsx:17` | 8 fields (currentStep, goToNext, etc.) | Often (step nav) | ✅ Yes |
| FormProgressContext | `src/components/admin/form/FormProgressProvider.tsx:23` | 6 fields (percentage, registerField, etc.) | Often (field change) | ✅ Yes |
| FormItemContext | `src/components/admin/form/form-primitives.tsx:31` | 2 fields (id, name) | Rare (mount) | ✅ Yes |
| FormFieldContext | `src/components/ui/form.tsx:22` | 1 field (name) | Rare (mount) | ❌ No |
| FormItemContext | `src/components/ui/form.tsx:64` | 1 field (id) | Rare (mount) | ❌ No |
| ToggleGroupContext | `src/components/ui/toggle-group.tsx:10` | 2 fields (variant, size) | Rare (mount) | ❌ No |
| ActivityLogContext | `src/atomic-crm/activity-log/ActivityLogContext.tsx:5` | 1 field (contextValue) | Rare (mount) | ❌ N/A (primitive) |
| FilterContext | `src/hooks/filter-context.tsx:22` | Array of filter elements | Often (filter change) | ❌ No |
| CreateSuggestionContext | `src/hooks/useSupportCreateSuggestion.tsx:152` | 3 fields (filter, onCancel, onCreate) | Often (per render) | ❌ **ISSUE** |
| UserMenuContext | `src/hooks/user-menu-context.tsx:17` | 1 field (onClose) | Rare (menu open) | ❌ No |
| ArrayInputContext | `src/hooks/array-input-context.tsx:11` | Field props object | Rare (mount) | ❌ No |
| SimpleFormIteratorContext | `src/hooks/simple-form-iterator-context.tsx:10` | Iterator control fns | Often (item changes) | ❌ No |
| SimpleFormIteratorItemContext | `src/hooks/simple-form-iterator-context.tsx:43` | Item index/remove | Rare (mount) | ❌ No |

### Context Granularity Issues

| Context | Issue | Recommendation |
|---------|-------|----------------|
| ConfigurationContext | Large (11 fields) but OK | All fields change together (app config) - acceptable |
| FilterContext | Deprecated | Migrate to `ra-core` FilterContext when available |

**Overall Assessment:** Context granularity is **appropriate**. No bloated contexts forcing unnecessary re-renders.

### Unstable Context Values (P0 - Critical)

| Context | File | Line | Issue |
|---------|------|------|-------|
| CreateSuggestionContext | `src/hooks/useSupportCreateSuggestion.tsx` | 100-111 | **Value object created inline every render** |

**Details:** The `CreateSuggestionContext.Provider` creates a new value object on every render:
```tsx
// Line 100-111 - Creates new object each render!
<CreateSuggestionContext.Provider
  value={{
    filter: filterRef.current,
    onCancel: () => setRenderOnCreate(false),
    onCreate: (item) => { ... },
  }}
>
```

**Impact:** Every consumer of `useCreateSuggestionContext` re-renders when parent re-renders, regardless of whether the context value actually changed.

**Fix:** Wrap value in `useMemo` with appropriate dependencies.

---

## State Placement Analysis

### State Appropriately Placed (Good Patterns)

| Component | State | Assessment |
|-----------|-------|------------|
| `PrincipalDashboardV3` | `refreshKey`, `isTaskSheetOpen` | ✅ Correct level - used locally |
| `OpportunityList` | `view` | ✅ Correct - view preference affects children |
| `SidebarProvider` | `open`, `openMobile` | ✅ Correct - affects sidebar tree |
| `FormWizard` | `currentStep`, `isSubmitting` | ✅ Correct - form-scoped state |
| `FormProgressProvider` | `fields` record | ✅ Correct - progress tracking scoped to form |
| `TutorialProvider` | `isActive`, driver ref | ✅ Correct - tutorial-scoped state |

### State That Could Be Lifted (Minor)

No significant issues found. State is well-distributed.

### Derived State Anti-Pattern (useState + useEffect)

**Found 0 critical issues.** The codebase correctly uses:
- `useMemo` for derived values (67 files)
- Direct computation where appropriate
- React Admin's `useListContext` for list state

---

## Prop Drilling Analysis

### Moderate Prop Chains (2-3 Levels)

| Prop | Start | End | Depth | Assessment |
|------|-------|-----|-------|------------|
| `openSlideOver` | OpportunityList | OpportunityListContent → Cards | 3 | Acceptable |
| `onViewChange` | OpportunityList | OpportunityListLayout | 2 | ✅ OK |
| `onRefresh` | PrincipalDashboardV3 | LogActivityFAB, MobileQuickActionBar | 2 | ✅ OK |
| `mode`, `onModeToggle` | OpportunityList | OpportunitySlideOver | 2 | ✅ OK |

### Pass-Through Components Analysis

The `OpportunityListLayout` component passes through several props:
```tsx
const OpportunityListLayout = ({
  view,
  onViewChange,
  openSlideOver,      // Passed to children
  isSlideOverOpen,    // Passed to children
  slideOverId,        // Passed to children
  closeSlideOver,     // Passed to children
})
```

**Assessment:** Borderline acceptable. If slide-over logic spreads further, consider a `SlideOverContext`.

---

## React Admin State Integration

### Excellent Use of React Admin Built-in State

| Pattern | Assessment | Files |
|---------|------------|-------|
| `useListContext` | ✅ Properly used for list data/filters | 163 files |
| `useRecordContext` | ✅ Properly used for record access | 163 files |
| `useGetIdentity` | ✅ Properly used for auth state | 8+ files |
| `useDataProvider` | ✅ Centralized in useCurrentSale fallback | 1 file |

### Smart Integration: CurrentSaleProvider

The `CurrentSaleProvider` demonstrates excellent React Admin integration:
```tsx
// Uses RA's useGetIdentity with 15-min cache
const { data: identity, isLoading } = useGetIdentity();
const salesId = identity?.id ? Number(identity.id) : null;
```

This avoids duplicating RA's auth caching while providing session-level salesId access.

### No Duplicated React Admin State Found

The codebase correctly uses:
- `useListContext` for list data (not duplicating with useState)
- `useGetIdentity` for user data (not duplicating auth state)
- React Admin's built-in store for column preferences (`useStore`)

---

## Re-Render Blast Radius

### High-Impact Context Updates

| Context | Update Trigger | Consumers Affected |
|---------|----------------|---------------------|
| FilterContext | Filter change | List components (~20) |
| SidebarContext | Sidebar toggle | Sidebar tree (~15 components) |
| TutorialContext | Tutorial step | Tutorial overlays (~5) |
| FormProgressContext | Field validation | Form components (scoped) |

### Context Value Stability Summary

| Context | Stability | Re-render Risk |
|---------|-----------|----------------|
| SidebarContext | ✅ Memoized | Low |
| WizardContext | ✅ Memoized | Low |
| FormProgressContext | ✅ Memoized | Low |
| ConfigurationContext | ❌ Not memoized | Low (rarely updates) |
| TutorialContext | ❌ Not memoized | Low (rarely updates) |
| CreateSuggestionContext | ❌ **Inline object** | **HIGH** |
| CurrentSaleContext | ❌ Not memoized | Low (rarely updates) |

### Missing Selective Consumption

No significant issues found. Components consume appropriate context slices.

---

## Prioritized Findings

### P0 - Critical (Performance Impact)

1. **CreateSuggestionContext unstable value** (`src/hooks/useSupportCreateSuggestion.tsx:100-111`)
   - Creates new object every render
   - Forces all consumers to re-render
   - **Fix:** Wrap value in `useMemo`

### P1 - High (Should Fix)

1. **FilterContext is deprecated** (`src/hooks/filter-context.tsx`)
   - Comment indicates waiting for ra-core version
   - **Action:** Track ra-core releases for migration

2. **ConfigurationContext value not memoized** (`src/atomic-crm/root/ConfigurationContext.tsx:67-83`)
   - Low impact since value rarely changes
   - **Consider:** Adding `useMemo` for consistency

### P2 - Medium (Technical Debt)

1. **TutorialContext value not memoized** (`src/atomic-crm/tutorial/TutorialProvider.tsx:256-267`)
   - Functions are wrapped in `useCallback` but value object is not memoized
   - Low impact but inconsistent with other contexts

2. **Slide-over props drilling** (OpportunityList → children)
   - 4 props passed through `OpportunityListLayout`
   - **Consider:** Creating `SlideOverContext` if pattern spreads

### P3 - Low (Nice to Have)

1. **Duplicate FormItemContext name**
   - `form-primitives.tsx` and `form.tsx` both define `FormItemContext`
   - No conflict (different scopes) but potentially confusing

---

## Recommendations

### Immediate Actions (P0)

1. **Fix CreateSuggestionContext value stability:**
```tsx
// In useSupportCreateSuggestion.tsx
const contextValue = useMemo(() => ({
  filter: filterRef.current,
  onCancel: () => setRenderOnCreate(false),
  onCreate: (item) => {
    setRenderOnCreate(false);
    handleChange(item as T);
  },
}), [handleChange]);

// Then use:
<CreateSuggestionContext.Provider value={contextValue}>
```

### Short-term Actions (P1)

2. **Memoize ConfigurationContext value:**
```tsx
const value = useMemo(() => ({
  dealCategories,
  dealPipelineStatuses,
  // ... rest
}), [dealCategories, dealPipelineStatuses, /* deps */]);
```

3. **Track ra-core FilterContext release** for migration

### Medium-term Actions (P2)

4. **Consider SlideOverContext** if slide-over props spread to more components
5. **Memoize TutorialContext value** for consistency

---

## Context Architecture Diagram

```
App
├── ConfigurationContext (11 fields, rare updates)
│   └── [All CRM components consume stage configs, etc.]
│
├── SidebarContext (7 fields, ✅ memoized)
│   └── [Sidebar tree: 15+ components]
│
├── TutorialContext (6 fields)
│   └── [Tutorial components: ~5]
│
├── CurrentSaleContext (4 fields, session-scoped)
│   └── [Dashboard hooks: useKPIMetrics, useMyTasks, etc.]
│
└── FilterContext (deprecated, migrate to ra-core)
    └── [List filters: ~20 components]

Form-Scoped Contexts:
├── WizardContext (✅ memoized)
├── FormProgressContext (✅ memoized)
├── FormItemContext (local scope)
└── SimpleFormIteratorContext (iterator scope)
```

---

## Success Criteria Checklist

- [x] All contexts catalogued (17 found)
- [x] State placement analyzed (136 files with useState)
- [x] Prop drilling depth measured (max 3 levels, acceptable)
- [x] React Admin integration checked (excellent usage)
- [x] Output file created at specified location

---

**Audit completed by Agent 9 - State & Context Auditor**
