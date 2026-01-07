# Crispy CRM Health Audit Report

**Generated:** 2026-01-06
**Codebase:** src/
**Scope:** Type Safety, Magic Strings, Dead Code, Hardcoded Colors

---

## Executive Summary

| Category | Violations | Test Files | Prod Files | Severity | Priority |
|----------|------------|------------|------------|----------|----------|
| Type Safety Erosion | 589 total | ~577 | ~12 | MEDIUM | P2 |
| Magic String Resources | 70 | N/A | 70 | HIGH | P1 |
| Dead Code Markers | 63 | N/A | 63 | MEDIUM | P2 |
| Hardcoded Hex Colors | 78 | ~12 | ~66* | LOW | P3 |

*\*66 hex colors are in email templates (`src/emails/`) and color mapping utilities (`src/lib/color-types.ts`) - these are acceptable exceptions.*

### Health Score: **B+ (Good)**

The codebase is in solid shape. Type safety issues are concentrated in test files (acceptable). Magic string resources are the primary concern requiring remediation.

---

## Category 1: Type Safety Erosion

### Summary

| Pattern | Total Count | Production | Test Files |
|---------|-------------|------------|------------|
| `: any` | 273 | ~0 | ~273 |
| `as any` | 296 | ~0 | ~296 |
| `@ts-expect-error` | 19 | 11 | 8 |
| `@ts-ignore` | 1 | 1 | 0 |
| `@ts-nocheck` | 0 | 0 | 0 |

**Status:** HEALTHY - All `: any` and `as any` usage is in test files where type flexibility is acceptable for mocking.

### Production Code @ts-expect-error Findings

All production uses have explanatory comments (best practice):

| File | Line | Justification | Severity |
|------|------|---------------|----------|
| `src/components/admin/simple-form-iterator.tsx` | 86 | reset fields - React Admin type limitation | LOW |
| `src/components/admin/simple-form-iterator.tsx` | 99 | Check child source prop - dynamic typing | LOW |
| `src/components/admin/simple-form-iterator.tsx` | 102 | FormDataConsumer check | LOW |
| `src/components/admin/simple-form-iterator.tsx` | 116 | Child source prop check | LOW |
| `src/components/admin/simple-form-iterator.tsx` | 119 | Child source prop check | LOW |
| `src/components/admin/simple-form-iterator.tsx` | 121 | Child source prop check | LOW |
| `src/components/admin/columns-button.tsx` | 4 | diacritic library lacks TS defs (@ts-ignore) | MEDIUM |
| `src/components/admin/form/WizardStep.tsx` | 40 | `inert` attribute - React 19 types lagging | LOW |
| `src/components/admin/file-field.tsx` | 49 | title prop flexibility | LOW |
| `src/components/admin/reference-array-field.tsx` | 155 | total may be undefined (React Admin bug) | MEDIUM |
| `src/components/admin/reference-many-field.tsx` | 72 | total may be undefined (React Admin bug) | MEDIUM |
| `src/lib/genericMemo.ts` | 15 | displayName property | LOW |

### Recommendations

1. **No immediate action needed** - Production code is type-safe
2. **Consider**: Add `@types/diacritic` or create local type declaration
3. **Track**: React Admin type fixes for `total` property
4. **Monitor**: React 19 types update for `inert` attribute

---

## Category 2: Magic String Resources

### Summary

**Total Violations:** 70 instances of `resource="string"` in production code

### Severity Classification

| Pattern Type | Count | Severity |
|--------------|-------|----------|
| `resource="..."` in layout components | 55 | MEDIUM |
| `resource="..."` in form references | 15 | HIGH |

### Detailed Findings by Resource

| Resource Name | Occurrences | Files |
|---------------|-------------|-------|
| `"organizations"` | 18 | OrganizationList, OrganizationSlideOver, OpportunityWizardSteps, etc. |
| `"contacts"` | 10 | ContactList, ContactSlideOver, TagsList |
| `"opportunities"` | 10 | OpportunityList, OpportunitySlideOver, etc. |
| `"tasks"` | 8 | TaskList, TaskSlideOver, AddTask |
| `"products"` | 8 | ProductList, ProductSlideOver |
| `"activities"` | 6 | ActivityList |
| `"sales"` | 6 | SalesSlideOver |
| `"product_distributors"` | 4 | resource.tsx |

### Production Files with Magic Strings

```
src/atomic-crm/notifications/resource.tsx:7
src/atomic-crm/layout/Header.tsx:107
src/atomic-crm/products/ProductList.tsx:104, 116
src/atomic-crm/products/ProductSlideOver.tsx:60
src/atomic-crm/products/resource.tsx:11, 17, 23, 29
src/atomic-crm/tasks/AddTask.tsx:111, 125
src/atomic-crm/organizations/OrganizationList.tsx:134, 147, 160
src/atomic-crm/tasks/TaskList.tsx:129, 141
src/atomic-crm/tasks/TaskSlideOver.tsx:61
src/atomic-crm/organizations/OrganizationSlideOver.tsx:114
src/atomic-crm/activities/resource.tsx:23, 29, 35
src/atomic-crm/tasks/resource.tsx:11, 17, 23
src/atomic-crm/activities/ActivityList.tsx:95, 103, 116
src/atomic-crm/productDistributors/resource.tsx:9, 15, 21
src/atomic-crm/opportunities/forms/OpportunityWizardSteps.tsx:99, 145, 294
src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx:138, 179, 269
src/atomic-crm/opportunities/OpportunitySlideOver.tsx:91
src/atomic-crm/opportunities/OpportunityList.tsx:157, 166, 177, 202
src/atomic-crm/sales/SalesSlideOver.tsx:61
src/atomic-crm/sales/resource.tsx:12, 18, 24, 30
src/atomic-crm/opportunities/OpportunityRowListView.tsx:293
src/atomic-crm/opportunities/resource.tsx:12, 18, 24
src/atomic-crm/organizations/resource.tsx:29, 35, 41, 47
src/atomic-crm/contacts/ContactSlideOver.tsx:88
src/atomic-crm/contacts/ContactList.tsx:98, 111, 120
src/atomic-crm/contacts/TagsList.tsx:51
src/atomic-crm/contacts/resource.tsx:11, 17, 23
```

### Hook-based Magic Strings (dataProvider calls)

Additional magic strings found in React Admin hooks and dataProvider calls:

```
src/hooks/useTeamMembers.ts:18 - useGetList("sales", ...)
src/atomic-crm/organizations/BranchLocationsSection.tsx:19 - useGetList("organizations", ...)
src/atomic-crm/settings/SettingsPage.tsx:20 - useGetOne("sales", ...)
src/atomic-crm/opportunities/OpportunityArchivedList.tsx:24 - useGetList("opportunities", ...)
src/atomic-crm/opportunities/OpportunityListFilter.tsx:36, 43 - useGetList("organizations", ...)
src/atomic-crm/opportunities/BulkActionsToolbar.tsx:79 - useGetList("sales", ...)
src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx:82 - useGetList("organizations", ...)
src/atomic-crm/contacts/ContactListFilter.tsx:22 - useGetList("tags", ...)
src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts:153, 227, 275, 337 - dataProvider calls
src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts:124, 135, 145, 156 - dataProvider.getList
src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts:104 - dataProvider.getList("sales", ...)
src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts:144-231 - multiple dataProvider calls
src/atomic-crm/services/junctions.service.ts:206, 338, 463 - dataProvider.delete
src/atomic-crm/services/products.service.ts:138, 204, 212, 229 - dataProvider calls
src/atomic-crm/services/opportunities.service.ts:107 - dataProvider.create("opportunities", ...)
src/atomic-crm/services/productDistributors.service.ts:169 - dataProvider.delete
src/atomic-crm/activities/QuickLogActivity.tsx:131 - dataProvider.create("activities", ...)
src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx:141, 178 - dataProvider.create
```

### Recommendations

1. **Create `src/constants/resources.ts`:**
```typescript
export const RESOURCES = {
  ORGANIZATIONS: 'organizations',
  CONTACTS: 'contacts',
  OPPORTUNITIES: 'opportunities',
  TASKS: 'tasks',
  PRODUCTS: 'products',
  ACTIVITIES: 'activities',
  SALES: 'sales',
  TAGS: 'tags',
  PRODUCT_DISTRIBUTORS: 'product_distributors',
  NOTIFICATIONS: 'notifications',
  DASHBOARD_SNAPSHOTS: 'dashboard_snapshots',
  OPPORTUNITY_PARTICIPANTS: 'opportunity_participants',
  OPPORTUNITY_CONTACTS: 'opportunity_contacts',
} as const;
```

2. **Refactor components** to use constants instead of string literals
3. **Priority**: Start with service layer files (single source of truth)

---

## Category 3: Dead Code Markers

### Summary

| Marker Type | Count | Notes |
|-------------|-------|-------|
| `TODO` | 12 | Active work items |
| `FIXME` | 4 | Known bugs to address |
| `@deprecated` | 47 | Intentional deprecations |
| `HACK/XXX/TEMP` | 0 | None found |

### TODO/FIXME Findings

| File | Line | Marker | Content |
|------|------|--------|---------|
| `src/components/ui/filter-select-ui.tsx` | 151 | TODO | Add aria-controls linking |
| `src/components/ui/select-ui.tsx` | 159 | TODO | Add aria-controls linking |
| `src/components/admin/select-input.tsx` | 236 | FIXME | Radix primitives issue #3135 |
| `src/components/admin/reference-many-field.tsx` | 72 | FIXME | total undefined pagination |
| `src/atomic-crm/validation/opportunities.ts` | 35, 167, 395, 437, 532 | TODO-004a | Win/Loss Reason feature |
| `src/atomic-crm/validation/index.ts` | 12 | TODO PAT-01 | Validation naming consistency |
| `src/components/admin/record-field.tsx` | 80 | FIXME | TypeScript 5.4 native type |
| `src/components/admin/reference-array-field.tsx` | 155 | FIXME | total undefined pagination |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | 238 | TODO | Task slide-over implementation |
| `src/atomic-crm/validation/__tests__/products.test.ts` | 417, 424 | TODO | Zod v4 z.record fix |
| `src/atomic-crm/constants.ts` | 4 | TODO | Environment variable |

### @deprecated Markers (Intentional - Good Practice)

**Files with deprecated code awaiting React Admin updates:**
- `src/hooks/useSupportCreateSuggestion.tsx` - 8 deprecations (waiting for ra-core)
- `src/hooks/simple-form-iterator-context.tsx` - 8 deprecations (waiting for ra-core)
- `src/hooks/saved-queries.tsx` - 6 deprecations (waiting for ra-core)
- `src/hooks/useBulkExport.tsx` - 1 deprecation

**Files with deprecated patterns for migration:**
- `src/atomic-crm/validation/segments.ts` - 4 deprecations (fixed categories)
- `src/atomic-crm/validation/operatorSegments.ts` - 4 deprecations
- `src/atomic-crm/validation/task.ts` - 3 deprecations (schema renaming)
- `src/atomic-crm/utils/listPatterns.ts` - 2 deprecations
- `src/atomic-crm/root/ConfigurationContext.tsx` - 2 deprecations
- `src/atomic-crm/organizations/OrganizationShow.tsx` - 1 deprecation
- `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts` - 2 deprecations
- `src/atomic-crm/providers/supabase/callbacks/commonTransforms.ts` - 1 deprecation
- `src/atomic-crm/providers/supabase/extensions/types.ts` - 2 deprecations
- `src/atomic-crm/services/segments.service.ts` - 1 deprecation
- `src/atomic-crm/organizations/constants.ts` - 1 deprecation
- `src/atomic-crm/types.ts` - 1 deprecation (company_id)

### Recommendations

1. **TODO-004a items**: Bundle into Win/Loss Reason feature sprint
2. **FIXME items**: Track React Admin upstream fixes
3. **Deprecated hooks**: Remove when upgrading to React Admin 6.x
4. **TypeScript 5.4**: Consider upgrade to eliminate FIXME

---

## Category 4: Hardcoded Hex Colors

### Summary

| Location | Count | Status |
|----------|-------|--------|
| `src/emails/` | 48 | ACCEPTABLE - Email templates require inline styles |
| `src/lib/color-types.ts` | 24 | ACCEPTABLE - Color mapping utility with fallbacks |
| Test files | 6 | ACCEPTABLE - Test assertions |
| Production UI | 0 | CLEAN |

### Acceptable Exceptions

**Email Templates (`src/emails/daily-digest.*.ts`):**
- Email clients don't support CSS variables
- Hex colors are required for cross-client compatibility
- Colors match brand guidelines

**Color Mapping (`src/lib/color-types.ts`):**
- `hexFallback` values for CSS variable fallbacks
- Transitional color mapping (marked @deprecated)
- Will be removed after data migration

### Findings Detail

```
src/emails/daily-digest.types.ts - 28 hex colors (brand palette definition)
src/emails/daily-digest.generator.ts - 20 hex colors (email rendering)
src/lib/color-types.ts - 24 hex colors (fallback mappings, marked deprecated)
```

### Recommendations

1. **No action needed** - All hex colors are in appropriate locations
2. **Future**: Remove `color-types.ts` hex mappings after migration complete
3. **Document**: Add comment explaining email template color requirements

---

## Files Requiring Immediate Attention

### Priority 1: Magic Strings (Refactor Batch 1)

These service layer files should be refactored first:

| File | Magic Strings | Impact |
|------|---------------|--------|
| `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts` | 8 | High - Dashboard core |
| `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts` | 4 | High - Dashboard core |
| `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` | 4 | High - Dashboard core |
| `src/atomic-crm/services/products.service.ts` | 4 | High - Service layer |
| `src/atomic-crm/services/junctions.service.ts` | 3 | High - Service layer |

### Priority 2: FIXME Items

| File | Issue | Action |
|------|-------|--------|
| `src/components/admin/reference-array-field.tsx:155` | Pagination total | Track RA fix |
| `src/components/admin/reference-many-field.tsx:72` | Pagination total | Track RA fix |
| `src/components/admin/select-input.tsx:236` | Radix #3135 | Track upstream |

### Priority 3: Feature TODOs

| File | Feature | Owner |
|------|---------|-------|
| `src/atomic-crm/validation/opportunities.ts` | TODO-004a Win/Loss Reasons | Product backlog |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx:238` | Task slide-over | Product backlog |

---

## Metrics Summary

```
┌─────────────────────────────────┬─────────┬───────────────┐
│ Metric                          │ Count   │ Status        │
├─────────────────────────────────┼─────────┼───────────────┤
│ Production @ts-expect-error     │ 11      │ ✅ Documented │
│ Production @ts-ignore           │ 1       │ ✅ Documented │
│ Production @ts-nocheck          │ 0       │ ✅ Clean      │
│ Production `any` types          │ 0       │ ✅ Clean      │
│ Magic string resources          │ 70      │ ⚠️ Needs fix  │
│ TODO/FIXME markers              │ 16      │ ℹ️ Tracked    │
│ @deprecated markers             │ 47      │ ✅ Intentional│
│ Hardcoded hex (prod UI)         │ 0       │ ✅ Clean      │
└─────────────────────────────────┴─────────┴───────────────┘
```

---

## Action Items

### Quick Wins (< 1 day)
1. Create `src/constants/resources.ts` with resource constants
2. Add accessibility TODO items to JIRA backlog

### Medium Effort (1-3 days)
3. Refactor dashboard hooks to use resource constants
4. Refactor service layer files to use resource constants

### Long-term
5. Track React Admin 6.x for deprecated hook replacements
6. Complete color-types.ts deprecation after data migration
7. Implement Win/Loss Reason feature (TODO-004a)

---

*Report generated by Claude Code health audit*
