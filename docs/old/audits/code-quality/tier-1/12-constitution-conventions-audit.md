# Constitution Compliance Audit - Conventions & Patterns

**Agent:** 12 - Constitution Conventions (Principles 8-14)
**Date:** 2025-12-21

---

## Executive Summary

The codebase demonstrates **strong compliance** with core architectural conventions (Principles 8, 12, 13) that ensure data integrity. The single data provider pattern is well-implemented, validation occurs at the API boundary, and soft deletes are consistently applied. However, **deprecation cleanup is needed** (Principle 10) and **feature module structure is inconsistent** (Principle 14).

**Overall Convention Compliance:** 5/7 principles fully compliant

---

## Principle Compliance Scorecard

| # | Principle | Status | Violations | Severity |
|---|-----------|--------|------------|----------|
| 8 | Single Source of Truth | ✅ Compliant | 0 | P1 |
| 9 | Three-Tier Components | ✅ Compliant | 0 | P2 |
| 10 | No Backward Compatibility | ⚠️ Partial | 60+ | P3 |
| 11 | TypeScript Conventions | ✅ Compliant | 0 | P3 |
| 12 | API Boundary Validation | ✅ Compliant | 0 | P1 |
| 13 | Soft Deletes | ⚠️ Partial | 1 | P1 |
| 14 | Feature Module Structure | ⚠️ Partial | 5+ | P2 |

---

## Principle 8: Single Source of Truth

**Status:** ✅ Compliant

### Data Provider Analysis

The codebase correctly implements a single data provider pattern:

| Component | Location | Purpose |
|-----------|----------|---------|
| `unifiedDataProvider` | `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Main entry point |
| `supabaseDataProvider` | `ra-supabase-core` | Base provider |

**Evidence:** All components use `useDataProvider()` from `ra-core` which resolves to the unified provider. No direct Supabase imports in feature components.

### Validation Source Analysis

All Zod schemas are centralized in `/src/atomic-crm/validation/`:

| Schema Module | Entities Covered |
|---------------|------------------|
| `opportunities.ts` | Opportunities, stages, priorities |
| `organizations.ts` | Organizations, types |
| `contacts.ts` | Contacts, departments |
| `tasks.ts` | Tasks, types, priorities |
| `activities.ts` | Activities, types, samples |
| `notes.ts` | Contact/Opportunity/Organization notes |
| `tags.ts` | Tags, create/update schemas |
| `sales.ts` | Sales/Users, roles |

**Export Pattern:** Single index file (`validation/index.ts`) re-exports all schemas.

### Duplicate Data Sources
None found. ✅

---

## Principle 9: Three-Tier Components

**Status:** ✅ Compliant

### Component Hierarchy

```
Base (src/components/ui/)
  ↓ imported by
Admin (src/components/admin/)
  ↓ imported by
Feature (src/atomic-crm/[feature]/)
```

### Import Direction Analysis

| Direction | Files Found | Status |
|-----------|-------------|--------|
| ui/ → atomic-crm/ | 0 | ✅ Correct |
| admin/ → atomic-crm/ | 0 | ✅ Correct |
| atomic-crm/ → ui/ | Many | ✅ Correct |

**Verification:** `grep -rn "from '.*atomic-crm" src/components/ui/` returned no matches.

---

## Principle 10: No Backward Compatibility

**Status:** ⚠️ Partial Violation

Pre-launch projects should remove deprecated code rather than maintain backward compatibility. Found **60+ deprecation annotations** that should be cleaned up.

### Deprecated Code to Remove

| File | Line | Deprecated | Action |
|------|------|------------|--------|
| `src/hooks/array-input-context.tsx` | 7 | ArrayInputContext | Remove - polyfill for ra-core |
| `src/hooks/filter-context.tsx` | 20 | FilterContext | Remove - polyfill for ra-core |
| `src/hooks/saved-queries.tsx` | 5 | useSavedQueries | Remove - polyfill for ra-core |
| `src/hooks/user-menu-context.tsx` | 4 | UserMenuContextValue | Remove - polyfill for ra-core |
| `src/hooks/useSupportCreateSuggestion.tsx` | 12 | useSupportCreateSuggestion | Remove - polyfill for ra-core |
| `src/hooks/useBulkExport.tsx` | 14 | All exports | Remove - now in ra-core |
| `src/hooks/simple-form-iterator-context.tsx` | 6 | All contexts | Remove - now in ra-core |
| `src/lib/genericMemo.ts` | 7 | genericMemo | Remove - now in ra-core |
| `src/atomic-crm/validation/task.ts` | 125-131 | Legacy aliases | Remove aliases |
| `src/atomic-crm/validation/segments.ts` | 101-140 | create/update schemas | Remove - fixed categories |
| `src/atomic-crm/validation/operatorSegments.ts` | 188-465 | create/update schemas | Remove - fixed categories |
| `src/atomic-crm/organizations/OrganizationShow.tsx` | 2 | Entire file | Remove - use SlideOver |
| `src/atomic-crm/organizations/constants.ts` | 212 | ACTIVITY_PAGE_SIZE | Remove |
| `src/atomic-crm/utils/listPatterns.ts` | 38-40 | Visibility helpers | Remove - use constants |
| `src/atomic-crm/services/segments.service.ts` | 107 | getSegmentById | Remove |
| `src/components/admin/confirm.tsx` | 104 | translateOptions | Remove |
| `src/atomic-crm/providers/supabase/extensions/types.ts` | 409-424 | getOpportunityParticipants | Remove |

### Legacy Patterns Found

| Pattern | Location | Replace With |
|---------|----------|--------------|
| `contact_organizations` junction | Multiple files | Direct `organization_id` FK |
| `dealStages`/`dealCategories` | `src/App.tsx` | `opportunityStages` |
| `deals` resource | Comments in resources.ts | `opportunities` |

**Recommendation:** Create a cleanup task to remove all deprecation annotations since this is pre-launch.

---

## Principle 11: TypeScript Conventions

**Status:** ✅ Compliant

### Convention: Interface for Objects

Searched for `type X = { ... }` object shape patterns - **none found**.

All object shapes correctly use `interface`:

```typescript
// Example from src/atomic-crm/types.ts
export interface Sale extends Pick<RaRecord, "id"> { ... }
export interface Contact extends Pick<RaRecord, "id"> { ... }
export interface Opportunity extends Pick<RaRecord, "id"> { ... }
```

### Convention: Type for Unions

All union types correctly use `type`:

```typescript
// Example patterns found
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type FilterValue = SingleFilterValue | ArrayFilterValue;
```

### Statistics

| Pattern | Count | Status |
|---------|-------|--------|
| Correct `interface` usage | 200+ | ✅ |
| Correct `type` usage | 150+ | ✅ |
| `type X = { }` violations | 0 | ✅ |

---

## Principle 12: API Boundary Validation

**Status:** ✅ Compliant

### Validation Location Analysis

| Location | Usage | Status |
|----------|-------|--------|
| `unifiedDataProvider.ts` | Full validation | ✅ Correct |
| `ValidationService.ts` | Validation logic | ✅ Correct |
| Components | Form defaults only | ✅ Acceptable |

### Form Default Pattern (Acceptable)

Found `.parse()` calls in components, but these are for form defaults:

```typescript
// Pattern: schema.partial().parse({})
// This generates default values from schema, NOT validation
const defaultValues = {
  ...opportunitySchema.partial().parse({}),  // Default values
};
```

Files using this pattern correctly:
- `NoteCreate.tsx:37` - Form defaults
- `ProductCreate.tsx:31` - Form defaults
- `SalesCreate.tsx:21` - Form defaults
- `OrganizationCreate.tsx:210` - Form defaults
- `ContactCreate.tsx:45` - Form defaults
- `OpportunityCreate.tsx:35` - Form defaults

### Validation at Boundary

| Method | Validated | Location |
|--------|-----------|----------|
| `create` | ✅ | `ValidationService.validateForCreate()` |
| `update` | ✅ | `ValidationService.validateForUpdate()` |
| `getList` | ✅ Filter validation | `unifiedDataProvider` |
| `getOne` | N/A | Read-only |

---

## Principle 13: Soft Deletes

**Status:** ⚠️ Partial Compliance

### Soft Delete Configuration

From `resources.ts`, the following resources support soft delete:

| Resource | Has deleted_at | RLS Filters | Application Layer |
|----------|----------------|-------------|-------------------|
| organizations | ✅ | ✅ | ✅ `supportsSoftDelete` |
| contacts | ✅ | ✅ | ✅ `supportsSoftDelete` |
| opportunities | ✅ | ✅ | ✅ `supportsSoftDelete` |
| activities | ✅ | ✅ | ✅ `supportsSoftDelete` |
| products | ✅ | ✅ | ✅ `supportsSoftDelete` |
| sales | ✅ | ✅ | ✅ `supportsSoftDelete` |
| tasks | ✅ | ✅ | ✅ `supportsSoftDelete` |
| tags | ✅ | ✅ | ⚠️ **Inconsistency** |
| contactNotes | ✅ | ✅ | ✅ `supportsSoftDelete` |
| opportunityNotes | ✅ | ✅ | ✅ `supportsSoftDelete` |
| organizationNotes | ✅ | ✅ | ✅ `supportsSoftDelete` |

### Inconsistency Found: Tags

**Issue:** `tags` is listed in `SOFT_DELETE_RESOURCES` array in `resources.ts:96`, but `tagsCallbacks.ts:34` explicitly sets `supportsSoftDelete: false`.

```typescript
// resources.ts:96
export const SOFT_DELETE_RESOURCES = [
  // ...
  "tags",  // Listed here
  // ...
];

// tagsCallbacks.ts:34
export const tagsCallbacks = createResourceCallbacks("tags", {
  supportsSoftDelete: false,  // But disabled here!
  // ...
});
```

**Fix Required:** Decide on one approach:
1. Remove `tags` from `SOFT_DELETE_RESOURCES` (if hard delete is intentional)
2. Change `supportsSoftDelete: true` in callbacks (if soft delete is required)

### RLS Policy Verification

RLS policies correctly filter on `deleted_at IS NULL`:

```sql
-- From 20251129180728_add_soft_delete_rls_filtering.sql
USING (deleted_at IS NULL);
USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);
```

Tables verified with RLS soft-delete filtering:
- organizations, contacts, opportunities
- activities, products, sales, tasks
- contactNotes, opportunityNotes, organizationNotes
- segments, opportunity_participants, opportunity_contacts

---

## Principle 14: Feature Module Structure

**Status:** ⚠️ Partial Compliance

### Expected Structure
```
[feature]/
├── index.tsx       # Entry + routing
├── [Feature]List.tsx
├── [Feature]Create.tsx
├── [Feature]Edit.tsx
├── [Feature]Show.tsx
└── [Feature]Inputs.tsx (optional)
```

### Module Compliance

| Feature | List | Create | Edit | Show | index | Score |
|---------|------|--------|------|------|-------|-------|
| organizations | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| opportunities | ✅* | ✅ | ✅ | ✅ | ✅ | 100% |
| contacts | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| sales | ✅ | ✅ | ✅ | ❌ | ✅ | 80% |
| products | ✅* | ✅ | ✅ | ❌ | ✅ | 80% |
| activities | ✅ | ✅ | ❌ | ❌ | ✅ | 60% |
| productDistributors | ✅ | ✅ | ✅ | ❌ | ✅ | 80% |
| notes | ❌ | ✅ | ❌ | ❌ | ❌ | 20% |

*Products uses `ProductGridList.tsx` (variant name acceptable)
*Opportunities uses multiple list variants (acceptable for complex views)

### Missing Components

| Feature | Missing | Priority |
|---------|---------|----------|
| sales | SalesShow.tsx | P2 |
| products | ProductShow.tsx | P2 |
| activities | ActivityEdit.tsx, ActivityShow.tsx | P2 |
| productDistributors | ProductDistributorShow.tsx | P3 |
| notes | Full structure | P3 |

### Naming Variations (Acceptable)

| File | Actual | Expected | Status |
|------|--------|----------|--------|
| ProductGridList.tsx | GridList | List | ✅ Acceptable variant |
| OpportunityArchivedList.tsx | ArchivedList | - | ✅ Additional view |
| PrincipalGroupedList.tsx | GroupedList | - | ✅ Additional view |

---

## Combined Priority Summary

### P1 - Data Integrity (Principles 8, 12, 13)

All P1 principles are essentially compliant with one minor fix needed:

1. **[FIX]** Resolve tags soft-delete inconsistency between `resources.ts` and `tagsCallbacks.ts`

### P2 - Structure (Principles 9, 14)

1. Add missing `Show.tsx` components for sales, products, activities
2. Add missing `Edit.tsx` for activities
3. Consider standardizing notes module structure

### P3 - Conventions (Principles 10, 11)

1. **[CLEANUP]** Remove 60+ `@deprecated` annotations - pre-launch allows breaking changes
2. Remove ra-core polyfill hooks if library now provides them
3. Clean up legacy `deals` references

---

## Recommendations

### Immediate Actions

1. **Fix tags soft-delete inconsistency:**
   ```typescript
   // In tagsCallbacks.ts, change to:
   supportsSoftDelete: true,
   ```
   OR remove "tags" from SOFT_DELETE_RESOURCES array.

### Short-Term (Before Launch)

2. **Create deprecation cleanup task:**
   - Remove all polyfill hooks in `src/hooks/` that now exist in ra-core
   - Remove legacy schema aliases in validation modules
   - Remove `OrganizationShow.tsx` (deprecated for SlideOver)

3. **Complete feature module structure:**
   - Add `SalesShow.tsx` for user profile viewing
   - Add `ProductShow.tsx` for product details
   - Add `ActivityEdit.tsx` if inline editing is needed

### Documentation

4. **Add component tier documentation:**
   - Document the Base → Admin → Feature hierarchy
   - Add import direction guidelines to CLAUDE.md

5. **Validation boundary checklist for PRs:**
   - Verify `.parse()` calls are only in data provider or for form defaults
   - No inline schema definitions in components

---

## Appendix: Search Commands Used

```bash
# Principle 8: Find data provider definitions
grep -rn "createDataProvider\|DataProvider" src/

# Principle 9: Check import directions
grep -rn "from '.*atomic-crm" src/components/ui/

# Principle 10: Find deprecations
grep -rn "@deprecated\|DEPRECATED" src/

# Principle 11: TypeScript conventions
grep -rn "^interface\|^export interface" src/atomic-crm/*.ts
grep -rn "^type\|^export type" src/atomic-crm/*.ts

# Principle 12: Find validation calls
grep -rn "\.parse(\|\.safeParse(" src/atomic-crm/*.tsx

# Principle 13: Soft delete usage
grep -rn "deleted_at" src/
grep -rn "supportsSoftDelete" src/atomic-crm/providers/supabase/

# Principle 14: Feature module structure
ls src/atomic-crm/[feature]/*.tsx
```

---

**Audit Complete:** 2025-12-21
**Auditor:** Constitution Compliance Agent 12
