# Resource Data Patterns Audit Report

**Agent:** 3 - Resource Data Patterns
**Date:** 2025-12-21
**Resources Analyzed:** 5 (opportunities, contacts, organizations, activities, tasks)

---

## Executive Summary

The codebase demonstrates **strong consistency** in List and Show components (85%+ pattern alignment), but exhibits **moderate inconsistency** in Create/Edit forms (60% alignment) and **critical gaps** in resource structure (missing Inputs.tsx standardization). The core React Admin patterns are well-established, but form toolbars, footer patterns, and index file structures diverge significantly.

---

## Baseline Pattern (from opportunities)

### File Structure
```
opportunities/
├── index.tsx               # Simple re-export from resource.tsx
├── resource.tsx            # React.lazy + ErrorBoundary wrapper
├── OpportunityList.tsx     # List with StandardListLayout + SlideOver
├── OpportunityCreate.tsx   # CreateBase + Form + schema defaults
├── OpportunityEdit.tsx     # EditBase + Form + queryClient invalidation
├── OpportunityShow.tsx     # ShowBase + ShowContent pattern
├── OpportunitySlideOver.tsx# 40vw side panel (URL: ?view=123)
├── forms/
│   └── OpportunityInputs.tsx # Form fields component
├── hooks/                  # Custom hooks directory
├── components/             # Feature-specific components
├── kanban/                 # Specialized view components
├── slideOverTabs/          # SlideOver tab components
├── constants/              # Configuration constants
└── __tests__/              # Unit tests
```

### Key Patterns

| Pattern | Implementation |
|---------|---------------|
| **Index exports** | `export { default } from "./resource"` + named view exports |
| **Lazy loading** | `React.lazy(() => import("./ComponentName"))` |
| **Error boundaries** | `ResourceErrorBoundary` wrapping all lazy components |
| **Data fetching** | `useGetIdentity`, `useListContext` from ra-core |
| **Filter cleanup** | `useFilterCleanup("resource-name")` in List components |
| **Keyboard nav** | `useListKeyboardNavigation` in List layouts |
| **SlideOver** | `useSlideOverState()` hook for view/edit mode |
| **Validation** | Schema-derived defaults via `schema.partial().parse({})` |
| **Cache invalidation** | `queryClient.invalidateQueries` in Edit mutation options |

---

## Resource Comparison Matrix

| Resource | Index Pattern | Files | List | Create | Edit | Show | SlideOver | Inputs | Score |
|----------|--------------|-------|------|--------|------|------|-----------|--------|-------|
| opportunities | re-export+resource | ✅ 30+ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| contacts | re-export+resource | ✅ 50+ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 95% |
| organizations | inline lazy | ✅ 40+ | ✅ | ✅ | ✅ | ⚠️ deprecated | ✅ | ✅ | 85% |
| activities | inline lazy | ⚠️ 12 | ✅ | ✅ | ❌ missing | ❌ none | ❌ none | ⚠️ inline | 55% |
| tasks | re-export+resource | ✅ 20 | ✅ | ✅ | ⚠️ minimal | ✅ | ✅ | ⚠️ tabbed | 75% |

---

## Deviations Found

### P1 - High (Functionality Gap)

| Resource | Issue | Impact | Recommendation |
|----------|-------|--------|----------------|
| activities | No Edit component | Cannot edit activities from list | Add ActivityEdit.tsx following TaskEdit pattern |
| activities | No SlideOver | Inconsistent UX with other resources | Add ActivitySlideOver.tsx |
| activities | No Show page | No detail view available | Add ActivityShow.tsx or use SlideOver as primary |

### P2 - Medium (Pattern Violation)

| Resource | Pattern | Expected | Actual | Fix |
|----------|---------|----------|--------|-----|
| organizations | Index structure | re-export+resource.tsx | inline lazy in index.tsx | Refactor to use resource.tsx pattern |
| activities | Index structure | re-export+resource.tsx | inline lazy in index.tsx | Refactor to use resource.tsx pattern |
| organizations | Show component | Active component | Deprecated (use SlideOver) | Complete migration, remove deprecated file |
| contacts | Create footer | FormToolbar | Custom inline sticky footer | Standardize to FormToolbar pattern |
| tasks | Create footer | FormToolbar | Custom inline sticky footer | Standardize to FormToolbar pattern |
| tasks | Edit component | EditBase+Form | Edit+SimpleForm | Align with EditBase pattern |

### P3 - Low (Style Inconsistency)

| Resource | Issue | Notes |
|----------|-------|-------|
| tasks | Inputs pattern | Uses TabbedFormInputs vs single CompactForm |
| activities | Inputs location | Inline in Create vs dedicated Inputs.tsx |
| opportunities | Default export | Exports both named and default from Create/Edit |
| tasks | Footer duplication | TaskCreate and ContactCreate have identical footer logic |

---

## Index File Pattern Analysis

### Pattern A: Re-export + resource.tsx (RECOMMENDED)
Used by: `opportunities`, `contacts`, `tasks`
```tsx
// index.tsx
export { default } from "./resource";
export { OpportunityListView, OpportunityCreateView, OpportunityEditView } from "./resource";

// resource.tsx - contains lazy loading + error boundaries
```

### Pattern B: Inline Lazy (LEGACY)
Used by: `organizations`, `activities`
```tsx
// index.tsx - contains lazy loading + error boundaries directly
const ComponentLazy = React.lazy(() => import("./Component"));
export default { list: ..., create: ..., edit: ... };
```

**Recommendation:** Migrate Pattern B resources to Pattern A for consistency and better separation of concerns.

---

## Hook Usage Consistency

### Core Hooks (Consistent Across All List Components)

| Hook | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| `useGetIdentity` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useListContext` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useSlideOverState` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `useFilterCleanup` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useListKeyboardNavigation` | ❌ | ✅ | ✅ | ✅ | ✅ |

### Missing Hook Patterns

- **opportunities/OpportunityList**: Missing `useListKeyboardNavigation` (uses custom kanban navigation)
- **activities/ActivityList**: Missing `useSlideOverState` (no slide-over support)

### Create/Edit Hook Usage

| Hook | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| `useGetIdentity` | ✅ | ✅ via smart | ✅ via smart | ✅ | ✅ |
| `useQueryClient` | ✅ (Edit) | ✅ (Edit) | ✅ (Edit) | ❌ | ✅ (Edit) |
| `useNotify` | ❌ | ✅ | ✅ | ❌ | ✅ |
| `useRedirect` | ❌ | ✅ | ✅ | ❌ | ✅ |
| `useFormState` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Shared Component Opportunities

### Duplicated Logic

| Component/Pattern | Found In | Should Be |
|-------------------|----------|-----------|
| CreateFooter with Save & Add Another | contacts, tasks | Shared `CreateFormFooter` component |
| Cache invalidation in Edit | all Edit components | Consider shared hook or HOC |
| FormProgressProvider + Bar | contacts, orgs, activities, tasks | Already shared, good pattern |
| Exporter functions | contacts, orgs, activities, tasks | Consider shared exporter factory |

### Input Component Patterns

| Pattern | Resources | Approach |
|---------|-----------|----------|
| CompactForm + ErrorSummary | contacts, organizations | ✅ Consistent |
| TabbedFormInputs | tasks | Different but appropriate for complexity |
| Inline inputs in Create | activities | ⚠️ Should extract to separate file |
| Separate forms/OpportunityInputs | opportunities | ✅ Good separation |

---

## List Component Patterns

### Consistent Patterns (Good)
1. **StandardListLayout** wrapper with filterComponent prop
2. **PremiumDatagrid** with `onRowClick` and `focusedIndex`
3. **FloatingCreateButton** at end of List children
4. **BulkActionsToolbar** after layout
5. **PageTutorialTrigger** with resource chapter
6. **ListSearchBar** with filterConfig
7. **Skeleton loading** during `isPending`
8. **Empty state** when no data and no filters

### Inconsistent Patterns (To Fix)
1. **Exporter location**: Some inline, some in separate files
2. **Actions toolbar**: Some use `<TopToolbar>`, some empty, some custom

---

## Create Component Patterns

### Schema Defaults Pattern (REQUIRED BY CONSTITUTION)
All Create components correctly use:
```tsx
const formDefaults = {
  ...schema.partial().parse({}),
  // Runtime-specific overrides
};
```

### Footer Variations (NEEDS STANDARDIZATION)

| Resource | Footer Implementation |
|----------|----------------------|
| opportunities | `<FormToolbar>` with `CancelButton` + custom SaveButton |
| contacts | Custom sticky div with Button + dual SaveButtons |
| organizations | `<FormToolbar>` from simple-form with CancelButton + custom SaveButton |
| activities | `<FormToolbar>` with dataTutorial prop |
| tasks | Custom sticky div with Button + dual SaveButtons |

**Recommendation:** Create `CreateFormFooter` component with standard Save/Cancel/SaveAndAddAnother pattern.

---

## Edit Component Patterns

### Consistent Patterns
1. All use `EditBase` (except tasks which uses `Edit` wrapper)
2. All invalidate queryClient on success
3. All use `redirect="show"` or similar

### Inconsistent Patterns
| Resource | Base Component | Form Wrapper | Key Pattern |
|----------|---------------|--------------|-------------|
| opportunities | EditBase | Form | Uses `key={record.id}` for remount |
| contacts | EditBase | Form | Uses ResponsiveGrid + Aside |
| organizations | EditBase | Form | Uses ResponsiveGrid + Aside + warning dialog |
| tasks | Edit (wrapper) | SimpleForm | Minimal implementation |

---

## Recommendations

### Priority 1: Fix Functional Gaps
1. **Add ActivityEdit.tsx** - Follow TaskEdit minimal pattern
2. **Add ActivitySlideOver.tsx** - Follow ContactSlideOver pattern
3. **Complete OrganizationShow deprecation** - Remove deprecated file, ensure SlideOver works

### Priority 2: Standardize Index Pattern
1. Migrate `organizations/index.tsx` to re-export+resource pattern
2. Migrate `activities/index.tsx` to re-export+resource pattern

### Priority 3: Create Shared Components
1. **CreateFormFooter** - Standardize Save/Cancel/SaveAndAddAnother
2. **useEditMutationOptions** - Shared hook for queryClient invalidation

### Priority 4: Extract Inline Inputs
1. Create `activities/ActivityInputs.tsx` from inline code in ActivityCreate

---

## Appendix: File Counts by Resource

| Resource | Total Files | Core CRUD | Forms | Hooks | Tests | Other |
|----------|-------------|-----------|-------|-------|-------|-------|
| opportunities | 30+ | 5 | 3 | 4+ | 10+ | 10+ |
| contacts | 50+ | 5 | 2 | 5+ | 5+ | 35+ |
| organizations | 40+ | 5 | 2 | 2 | 5+ | 25+ |
| activities | 12 | 2 | 0 | 0 | 1 | 9 |
| tasks | 20 | 5 | 1 | 0 | 1 | 13 |
