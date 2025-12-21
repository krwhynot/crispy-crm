# State & Context Audit Report

**Agent:** 9 - State & Context Auditor
**Date:** 2025-12-21
**Contexts Found:** 14 custom contexts
**useState Calls:** 68 files with useState

---

## Executive Summary

The codebase demonstrates **strong React Admin integration** with appropriate use of built-in hooks (`useListContext`, `useRecordContext`, `useGetList`, etc.). Custom contexts are generally well-designed with proper memoization. Key concerns include: (1) **ConfigurationContext** is oversized with 11 values causing potential over-rendering, (2) three deprecated contexts should migrate to React Admin equivalents, and (3) one performance anti-pattern fetches 1000+ records for client-side filtering.

---

## Context Architecture

### Custom Contexts Inventory

| Context | Location | Values | Consumers | Re-render Risk |
|---------|----------|--------|-----------|----------------|
| ConfigurationContext | `root/ConfigurationContext.tsx` | 11 | 13 | **High** - All consumers re-render on any config change |
| TutorialContext | `tutorial/TutorialProvider.tsx` | 6 | 3 | Low - Memoized, infrequent updates |
| CurrentSaleContext | `dashboard/v3/hooks/useCurrentSale.ts` | 4 | ~4 | Low - Single user session |
| ActivityLogContext | `activity-log/ActivityLogContext.tsx` | 1 | 1 | **Excellent** - Single value |
| SidebarContext | `components/ui/sidebar.utils.ts` | 7 | UI only | Medium - Frequent toggles |
| FilterContext | `hooks/filter-context.tsx` | 1 | Legacy | **Deprecated** |
| ArrayInputContext | `hooks/array-input-context.tsx` | 9 | Form arrays | **Deprecated** |
| UserMenuContext | `hooks/user-menu-context.tsx` | 1 | Menu | **Deprecated** |
| FormProgressContext | `admin/form/FormProgressProvider.tsx` | 6 | Forms | Low - Feature-scoped |
| WizardContext | `admin/form/FormWizard.tsx` | 8 | Wizards | Low - Feature-scoped |
| FormFieldContext | `components/ui/form.tsx` | 1 | Form fields | Low |
| FormItemContext | `admin/form/form-primitives.tsx` | 2 | Form items | Low |
| ToggleGroupContext | `components/ui/toggle-group.tsx` | 2 | Toggle groups | Low |
| CreateSuggestionContext | `hooks/useSupportCreateSuggestion.tsx` | 1 | Autocomplete | Low |

### Context Hierarchy

```
App.tsx
└── CRM.tsx
    └── ConfigurationProvider (11 values) ⚠️ HIGH BLAST RADIUS
        └── <Admin> (React Admin built-in contexts)
            ├── AuthContext
            ├── DataProviderContext
            ├── StoreContext
            ├── NotificationContext
            ├── ResourceContext
            └── Layout
                ├── SidebarProvider (UI state)
                ├── TutorialProvider (page-level)
                └── Resources
                    └── CurrentSaleProvider (dashboard only)
```

---

## Context Issues

### Oversized Contexts (Split Recommended)

| Context | Current Values | Recommended Split |
|---------|----------------|-------------------|
| ConfigurationContext | dealCategories, dealPipelineStatuses, dealStages, opportunityCategories, opportunityStages, noteStatuses, taskTypes, title, darkModeLogo, lightModeLogo, contactGender | **AppBrandingContext** (title, logos), **StagesContext** (stages, categories), **FormOptionsContext** (noteStatuses, taskTypes, contactGender) |

**Impact Analysis:**
- 13 consumers currently subscribe to ConfigurationContext
- Components only using `taskTypes` still re-render when `logo` changes
- Splitting would isolate re-renders to relevant consumers

### Deprecated Contexts - Migrate to React Admin

| Custom Context | Marked Deprecated | React Admin Equivalent |
|----------------|-------------------|------------------------|
| FilterContext | Yes | `useFilterContext` from `ra-core` |
| ArrayInputContext | Yes | `ArrayInputContext` from `ra-core` |
| UserMenuContext | Yes | `UserMenuContext` from `ra-core` |

**Recommendation:** These are marked as deprecated in the code. Verify React Admin version supports these and migrate.

### Context Best Practices Applied

| Pattern | Status | Example |
|---------|--------|---------|
| useMemo for context value | ✅ Used | ConfigurationProvider, TutorialProvider, FormWizard |
| useCallback for handlers | ✅ Used | TutorialProvider.startTutorial |
| Error boundary for missing provider | ✅ Used | All hooks throw if context missing |
| Single-value contexts | ✅ ActivityLogContext | Excellent pattern |

---

## State Placement Issues

### State That Should Be Derived (useMemo Opportunities)

| File | Line | Current Pattern | Recommended |
|------|------|-----------------|-------------|
| `OpportunityListFilter.tsx` | 100-113 | Fetches 1000 opps, then filters in useMemo | Backend distinct query for campaigns |
| `ChangeLogTab.tsx` | ~50 | Multiple .filter() .map() chains | Consolidate into single useMemo |
| `CampaignActivityReport.tsx` | Multiple | 9 useMemo calls for derivations | Consider reducing or caching |

**Critical Finding - OpportunityListFilter.tsx:100-102:**
```tsx
// ANTI-PATTERN - Fetches 1000 records to extract unique values
const { data: opportunitiesData } = useGetList("opportunities", {
  pagination: { page: 1, perPage: 1000 },
});

const campaigns = React.useMemo(() => {
  // Client-side unique extraction
}, [opportunitiesData]);
```
**Fix:** Create a server-side endpoint or use `SELECT DISTINCT campaign FROM opportunities`.

### State Locality Analysis

| Pattern | Count | Assessment |
|---------|-------|------------|
| useState for UI toggle/modal | 45+ | ✅ Appropriate - local state |
| useState for form state | 20+ | ✅ Appropriate - managed by react-hook-form |
| useState for fetched data | 3 | ⚠️ Review - consider React Admin hooks |
| useState for filter selection | 8 | ✅ Appropriate - local UI state |

### Components Using Manual Data Fetching

| File | Pattern | Should Use |
|------|---------|------------|
| `useCurrentSale.ts` | useState + useEffect + dataProvider.getList | Justified - needs auth.getUser() first |
| `ActivityLog.tsx` | useState + dataProvider direct | Consider useGetList if applicable |

---

## Prop Drilling Analysis

### Deep Prop Chains Identified

Based on interface analysis, most components have **4-8 props** which is reasonable. The codebase uses:

1. **React Admin Contexts** - Heavily leveraged (useListContext, useRecordContext)
2. **Composition Patterns** - SlideOver components receive record via context
3. **Callback Props** - Standard for event handlers (onSubmit, onChange, etc.)

### Components With High Prop Counts

| Component | Props | Assessment |
|-----------|-------|------------|
| QuickLogActivityDialogProps | 8 | Reasonable for dialog config |
| SimpleListBaseProps | 10+ | Generic component - acceptable |
| FilterToolbarProps | 6 | Standard filter controls |

**No severe prop drilling detected.** The codebase properly uses:
- `useRecordContext` instead of passing record through layers
- `useListContext` for list state access
- Feature-scoped contexts (FormProgress, Wizard, Tutorial)

---

## React Admin Integration

### Hook Usage Summary

| Hook | Usage Count | Assessment |
|------|-------------|------------|
| useGetList | 35+ | ✅ Heavy, correct usage |
| useListContext | 40+ | ✅ Excellent - avoids prop drilling |
| useRecordContext | 30+ | ✅ Excellent - pattern for record access |
| useUpdate | 25+ | ✅ Standard mutation pattern |
| useNotify | 45+ | ✅ Consistent notification usage |
| useDataProvider | 15 | ⚠️ Some could use higher-level hooks |

### Underutilized React Admin Features

| Opportunity | Current | Recommended |
|-------------|---------|-------------|
| `useGetIdentity` for current user | Sometimes custom hook | Standardize on React Admin identity |
| Optimistic updates | Not widely used | Consider for inline edits |

### Anti-patterns Found

| File | Line | Pattern | Impact | Fix |
|------|------|---------|--------|-----|
| `OpportunityListFilter.tsx` | 100 | Fetches 1000 records for distinct values | High - wasteful query | Server-side distinct |
| N/A | N/A | No useState for server data anti-patterns found | - | - |

---

## Re-render Blast Radius

### High-Risk Update Patterns

| State/Context | Update Frequency | Components Affected | Risk |
|---------------|------------------|---------------------|------|
| ConfigurationContext | Rarely (app start) | 13 components | Medium - infrequent updates mitigate |
| useListContext filter | Often (user filtering) | List + items | Managed by React Admin |
| SidebarContext | User action | UI chrome | Low - isolated |
| TutorialContext.isActive | Infrequent | 3 components | Low |

### Provider Placement Analysis

| Provider | Location | Blast Radius | Recommendation |
|----------|----------|--------------|----------------|
| ConfigurationProvider | App root | Whole app | Consider splitting by concern |
| TutorialProvider | Layout level | All pages | ✅ Appropriate |
| CurrentSaleProvider | Dashboard only | Dashboard widgets | ✅ Excellent - scoped |
| SidebarProvider | Layout level | UI only | ✅ Appropriate |

### Optimization Opportunities

| Component/Context | Current | Recommended |
|-------------------|---------|-------------|
| ConfigurationContext consumers | Subscribe to all 11 values | Split context or use selector pattern |
| Heavy list filtering | Client-side in useMemo | Move to server queries where possible |

---

## Positive Patterns Identified

### Well-Designed State Management

1. **Single-value contexts** - `ActivityLogContext` with just `"all" | "company" | "contact" | "opportunity"`
2. **Memoized context values** - All providers use `useMemo` for their value objects
3. **Stable callback refs** - `useCallback` used for context-provided functions
4. **Feature-scoped providers** - Tutorial, FormProgress, Wizard are not app-root level
5. **React Admin integration** - Strong adoption of built-in hooks over custom state

### useMemo Usage

- 111 useMemo occurrences across 36 files
- Properly used for expensive computations (filtering, mapping)
- Good ratio to .filter()/.map() calls (516 occurrences)

---

## Recommendations

### Priority 1 - Performance Critical

1. **Fix Campaign Fetching Anti-pattern**
   - Location: `src/atomic-crm/opportunities/OpportunityListFilter.tsx:100-102`
   - Issue: Fetches 1000 opportunities just to get unique campaign names
   - Fix: Add server-side endpoint `GET /campaigns/distinct` or use SQL view

### Priority 2 - Architecture Improvements

2. **Split ConfigurationContext**
   - Split into: AppBrandingContext, StagesContext, FormOptionsContext
   - Reduces unnecessary re-renders for 13 consumer components

3. **Migrate Deprecated Contexts**
   - Verify React Admin version supports: FilterContext, ArrayInputContext, UserMenuContext
   - Replace custom implementations with ra-core equivalents

### Priority 3 - Code Quality

4. **Standardize useCurrentSale Usage**
   - Ensure CurrentSaleProvider wraps all components needing salesId
   - Remove fallback direct query pattern if possible

5. **Document Context Provider Requirements**
   - Add JSDoc noting which providers are required for each feature area

---

## Metrics Summary

| Metric | Value | Assessment |
|--------|-------|------------|
| Custom Contexts | 14 | Reasonable for app size |
| Deprecated Contexts | 3 | Should migrate |
| Files with useState | 68 | Normal React usage |
| useMemo Occurrences | 111 | Good optimization |
| React Admin Hooks | 200+ | Excellent integration |
| Context Splitting Needed | 1 (ConfigurationContext) | Low priority |
| Performance Anti-patterns | 1 (campaign fetch) | High priority fix |

---

## Appendix: Context Consumer Locations

### ConfigurationContext Consumers (13 total)
- `src/components/supabase/layout.tsx` - logo, title
- `src/components/admin/login-page.tsx` - logo, title
- `src/atomic-crm/layout/Header.tsx` - logos, title
- `src/atomic-crm/tasks/AddTask.tsx` - taskTypes
- `src/atomic-crm/tasks/TaskCreate.tsx` - taskTypes
- `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx` - taskTypes
- `src/atomic-crm/tasks/TasksDatagridHeader.tsx` - taskTypes
- `src/atomic-crm/tasks/TaskDetailsTab.tsx` - taskTypes
- `src/atomic-crm/opportunities/ActivityNoteForm.tsx` - opportunityStages
- `src/atomic-crm/organizations/OrganizationShow.tsx` - opportunityStages
- `src/atomic-crm/shared/components/Status.tsx` - noteStatuses
- (+ tests)

This distribution shows taskTypes is used by 5 components, while logos are used by 3 - a split would reduce coupling.
