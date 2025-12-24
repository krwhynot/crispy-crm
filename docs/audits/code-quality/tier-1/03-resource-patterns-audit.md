# Resource Data Patterns Audit Report

**Agent:** 3 - Resource Data Patterns
**Date:** 2024-12-24
**Resources Analyzed:** 5 (opportunities, contacts, organizations, activities, tasks)

---

## Executive Summary

The codebase shows **moderate consistency** (72%) across resource CRUD patterns. The core architecture (React Admin + Zod validation) is consistently applied, but implementation details diverge significantly between resources. **Organizations** follows the most comprehensive pattern and should be considered the "golden standard." Key gaps include missing keyboard navigation in opportunities, inconsistent form modes, and different footer component patterns.

---

## Baseline Pattern (from Organizations - "Golden Standard")

### File Structure
```
organizations/
├── index.tsx                    # Re-exports with error boundaries
├── resource.tsx                 # Lazy loading + ResourceErrorBoundary
├── OrganizationList.tsx         # List with StandardListLayout
├── OrganizationCreate.tsx       # Create with FormProgressProvider
├── OrganizationEdit.tsx         # Edit with ResponsiveGrid + Aside
├── OrganizationShow.tsx         # Show view
├── OrganizationInputs.tsx       # FormErrorSummary + CompactForm
├── OrganizationSlideOver.tsx    # Slide-over panel
├── OrganizationEmpty.tsx        # Empty state component
├── OrganizationListFilter.tsx   # Filter component
├── OrganizationBadges.tsx       # Badge components
├── OrganizationAside.tsx        # Aside panel for Edit/Show
├── constants.ts                 # Feature constants
├── types.ts                     # TypeScript types
├── organizationFilterConfig.ts  # Filter configuration
└── components/                  # Subdirectory for components
```

### Key Patterns
| Pattern | Expected Implementation |
|---------|-------------------------|
| Index exports | Named + default exports with error boundary wrappers |
| Lazy loading | `React.lazy()` with `.then()` transform for named exports |
| Data fetching | `useGetIdentity`, `useListContext`, `useGetList` from ra-core |
| Form mode | `mode="onBlur"` on Form component |
| Validation | Via data provider at API boundary (not in component) |
| Error handling | `useQueryClient` for cache invalidation on success |
| Defaults | `schema.partial().parse({})` for schema-derived defaults |
| Loading | `useSmartDefaults` hook with skeleton fallback |
| Slide-over | `useSlideOverState` hook for panel management |
| Keyboard nav | `useListKeyboardNavigation` for list accessibility |
| Filter cleanup | `useFilterCleanup` hook for stale filter removal |
| Unsaved changes | `useUnsavedChangesWarning` hook |

---

## Resource Comparison Matrix

### Overall CRUD Completeness

| Resource | List | Create | Edit | Show | SlideOver | Empty | Inputs | Score |
|----------|------|--------|------|------|-----------|-------|--------|-------|
| opportunities | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| organizations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| activities | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ inline | ✅ | 71% |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ different | 86% |

### Index Export Pattern

| Resource | Named Exports | Default Export | Error Boundary Wrapper | Score |
|----------|---------------|----------------|------------------------|-------|
| opportunities | ⚠️ minimal | ✅ | ✅ | 67% |
| contacts | ⚠️ minimal | ✅ | ✅ | 67% |
| organizations | ✅ comprehensive | ✅ | ✅ | 100% |
| activities | ✅ comprehensive | ✅ | ✅ | 100% |
| tasks | ⚠️ minimal | ✅ | ✅ | 67% |

### Resource.tsx Lazy Loading

| Resource | Uses .then() Transform | Has Show View | Pattern Score |
|----------|------------------------|---------------|---------------|
| opportunities | ❌ direct import | ❌ | 50% |
| contacts | ❌ direct import | ❌ | 50% |
| organizations | ✅ all components | ✅ | 100% |
| activities | ⚠️ partial (Edit only) | ❌ | 60% |
| tasks | ❌ direct import | ❌ | 50% |

### List Component Patterns

| Pattern | opportunities | contacts | organizations | activities | tasks |
|---------|--------------|----------|---------------|------------|-------|
| `useGetIdentity` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useListContext` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `useSlideOverState` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `useListKeyboardNavigation` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `useFilterCleanup` | ✅ | ✅ | ✅ | ✅ | ✅ |
| StandardListLayout | ✅ | ✅ | ✅ | ✅ | ✅ |
| ListSearchBar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skeleton loading | ✅ | ✅ | ✅ | ✅ | ✅ |
| BulkActionsToolbar | ✅ custom | ✅ | ✅ custom | ✅ | ✅ |
| FloatingCreateButton | ❌ | ✅ | ✅ | ✅ | ✅ |
| Exporter location | separate file | separate file | inline | inline | inline |
| Export pattern | named+default | named+default | named+default | default only | default only |

### Create Component Patterns

| Pattern | opportunities | contacts | organizations | activities | tasks |
|---------|--------------|----------|---------------|------------|-------|
| `Form mode="onBlur"` | ❌ missing | ✅ | ✅ | ✅ | ✅ |
| FormProgressProvider | ❌ | ✅ | ✅ | ✅ | ✅ |
| FormProgressBar | ❌ | ✅ | ✅ | ✅ | ✅ |
| `useSmartDefaults` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `useUnsavedChangesWarning` | ✅ | ❌ | ✅ | ✅ | ❌ |
| Schema defaults | ✅ `.partial().parse({})` | ✅ | ✅ | ✅ | ✅ |
| Zod resolver | ❌ | ❌ | ✅ | ❌ | ✅ |
| Loading skeleton | ❌ | ✅ | ✅ | ❌ | ❌ |
| Duplicate check | ✅ | ❌ | ✅ | ❌ | ❌ |
| URL param support | ❌ | ❌ | ❌ | ✅ | ✅ |
| Tutorial component | ✅ | ✅ | ❌ | ❌ | ❌ |

### Edit Component Patterns

| Pattern | opportunities | contacts | organizations | activities | tasks |
|---------|--------------|----------|---------------|------------|-------|
| `Form mode="onBlur"` | ❌ | ✅ | ❌ | ✅ | ❌ |
| ResponsiveGrid | ❌ | ✅ | ✅ | ❌ | ❌ |
| Aside panel | ❌ | ✅ | ✅ | ❌ | ❌ |
| mutationMode="pessimistic" | ✅ | ❌ | ❌ | ✅ | ✅ |
| queryClient invalidation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Schema parsing on record | ✅ useMemo | ✅ useMemo | ❌ direct | ❌ direct | ✅ useMemo |
| CONFLICT error handling | ✅ | ❌ | ❌ | ❌ | ❌ |
| Form key for remount | ✅ | ✅ | ✅ | ✅ | ✅ |
| transform function | ❌ | ❌ | ✅ (URL prefix) | ❌ | ❌ |
| Redirect target | show | show | show | list | show |

### Inputs Component Patterns

| Pattern | opportunities | contacts | organizations | activities | tasks |
|---------|--------------|----------|---------------|------------|-------|
| FormErrorSummary | ✅ | ✅ | ✅ | ✅ | ❌ |
| FIELD_LABELS const | ✅ | ✅ | ✅ | ✅ | ❌ |
| mode prop | ✅ | ❌ | ❌ | ❌ | ❌ |
| Uses CompactForm | ✅ | ✅ | ✅ | ❌ (SinglePage) | ❌ (TabbedForm) |

---

## Deviations Found

### P1 - High (Functionality Gap)

| Resource | Issue | Impact | Fix Priority |
|----------|-------|--------|--------------|
| activities | Missing Show view | Users can't view activity details standalone | High |
| activities | Missing SlideOver | Inconsistent UX vs other resources | High |
| activities | Inline empty state | No separate EmptyState component like others | Medium |
| opportunities | Missing keyboard navigation | Accessibility issue - no `useListKeyboardNavigation` | High |
| opportunities | Missing FloatingCreateButton | UX inconsistency vs other list views | Medium |
| opportunities | Missing FormProgressProvider in Create | UX inconsistency - no progress bar | Medium |

### P2 - Medium (Pattern Violation)

| Resource | Pattern | Expected | Actual | Fix Priority |
|----------|---------|----------|--------|--------------|
| opportunities | Form mode | `mode="onBlur"` | Not set (defaults to onChange) | Medium |
| contacts | useUnsavedChangesWarning | Present in Create | Missing | Medium |
| tasks | useUnsavedChangesWarning | Present in Create | Missing | Medium |
| organizations | useSmartDefaults | Uses hook | Activities/Tasks don't use it | Low |
| activities | Edit redirect | `show` | `list` | Low |
| tasks | Inputs pattern | FormErrorSummary + CompactForm | TabbedFormInputs (different pattern) | Medium |

### P3 - Low (Style Inconsistency)

| Resource | Issue | Notes |
|----------|-------|-------|
| all | Exporter location | Some inline, some separate files |
| all | Export patterns | Mixed named+default vs default only |
| all | List component export | Some use `export default function`, some `export const + default` |
| all | Zod resolver usage | Only Organizations and Tasks use zodResolver |
| all | Schema parsing in Edit | Some use useMemo+parse, some use direct record |

---

## Hook Usage Analysis

### Core React Admin Hooks

| Hook | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| useGetIdentity | ✅ | ✅ | ✅ | ✅ | ✅ |
| useListContext | ✅ | ✅ | ✅ | ✅ | ✅ |
| useRecordContext | ✅ | ❌ (useEditContext) | ✅ | ✅ | ✅ |
| useGetList | ✅ | ✅ | ✅ | ✅ | ❌ |
| useNotify | ✅ | ✅ | ✅ | ✅ | ✅ |
| useRefresh | ✅ | ❌ | ❌ | ❌ | ❌ |
| useQueryClient | ✅ | ✅ | ✅ | ✅ | ✅ |
| useUpdate | ✅ | ❌ | ❌ | ❌ | ✅ |

### Custom Hooks

| Hook | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| useSlideOverState | ✅ | ✅ | ✅ | ❌ | ✅ |
| useListKeyboardNavigation | ❌ | ✅ | ✅ | ✅ | ✅ |
| useFilterCleanup | ✅ | ✅ | ✅ | ✅ | ✅ |
| useSmartDefaults | ❌ | ✅ | ✅ | ❌ | ❌ |
| useUnsavedChangesWarning | ✅ | ❌ | ✅ | ✅ | ❌ |
| useSimilarOpportunityCheck | ✅ | N/A | N/A | N/A | N/A |
| useDuplicateOrgCheck | N/A | N/A | ✅ | N/A | N/A |

---

## Shared Component Opportunities

### Components That Should Be Shared

| Component Type | Current State | Recommendation |
|----------------|---------------|----------------|
| SlideOver | 5 separate implementations | Extract base `ResourceSlideOver` component |
| Empty state | 5 separate + 1 inline | Standardize on `ResourceEmpty` base component |
| Aside panels | 2 implementations (Contact, Organization) | Extract base `ResourceAside` component |
| BulkActionsToolbar | 2 custom + 3 shared | Use shared component for all |
| FormProgressProvider wrapper | Duplicated in 4 Create forms | Extract `CreateFormWrapper` component |
| FormToolbar variations | Multiple patterns | Standardize on single `CreateFormFooter` |

### Duplicated Logic

| Pattern | Found In | Consolidation Opportunity |
|---------|----------|---------------------------|
| Skeleton loading check | All List components | Already using resource-specific skeletons - good |
| Filter empty state | All List components | Could use shared `FilteredEmptyState` |
| Cache invalidation | All Edit components | Could use `useResourceMutation` wrapper hook |
| Schema defaults | All Create components | Pattern is good but `useSmartDefaults` usage inconsistent |
| Exporter functions | 5 resources | Extract `createResourceExporter` factory |

### Field Components Used Across Resources

| Component | Used By | Notes |
|-----------|---------|-------|
| TextInput | All | Good - shared |
| ReferenceInput | All | Good - shared |
| DateInput | Opportunities, Activities, Tasks | Good - shared |
| SelectInput | All | Good - shared |
| BooleanInput | Tasks | Good - shared |

---

## Recommendations

### Immediate (P0)
1. **Add keyboard navigation to OpportunityList** - Accessibility requirement
2. **Add FormProgressProvider to OpportunityCreate** - UX consistency
3. **Set `mode="onBlur"` on all Form components** - Form performance

### Short-term (P1)
4. Add SlideOver to Activities resource
5. Add Show view to Activities resource
6. Add `useUnsavedChangesWarning` to ContactCreate and TaskCreate
7. Standardize Edit component schema parsing (all should use useMemo + parse)
8. Add FloatingCreateButton to OpportunityList

### Medium-term (P2)
9. Extract base `ResourceSlideOver` component
10. Extract base `ResourceEmpty` component
11. Standardize footer pattern (use `CreateFormFooter` everywhere)
12. Consolidate exporter functions into shared factory
13. Standardize index exports (all should match Organizations pattern)

### Long-term (P3)
14. Add CONFLICT error handling to all Edit components
15. Standardize on `useSmartDefaults` across all Create components
16. Extract aside panel base component
17. Add duplicate checking to relevant resources (Contacts?)

---

## Consistency Score by Category

| Category | Score | Notes |
|----------|-------|-------|
| File Structure | 85% | All have basic structure, some missing Show |
| Index Exports | 60% | Only Organizations/Activities are comprehensive |
| List Patterns | 80% | Opportunities missing keyboard nav |
| Create Patterns | 65% | FormProgressProvider, mode inconsistent |
| Edit Patterns | 60% | Form mode, ResponsiveGrid usage inconsistent |
| Hook Usage | 75% | Core hooks consistent, custom hooks vary |
| Input Patterns | 70% | Tasks uses different pattern |
| **Overall** | **72%** | **Moderate consistency** |

---

## Appendix: Component File Counts

| Resource | .tsx Files | .ts Files | Test Files | Total |
|----------|------------|-----------|------------|-------|
| opportunities | 30+ | 6 | 2 | ~40 |
| contacts | 25+ | 8 | 5 | ~40 |
| organizations | 25+ | 6 | 5 | ~38 |
| activities | 10 | 3 | 1 | ~14 |
| tasks | 12 | 2 | 1 | ~15 |
