# Schema Migration Impact Analysis

## Overview

This document maps all dependencies on the duplicate `activitySchema.ts` file in preparation for consolidation into the canonical `validation/activities.ts`.

## Files Importing from Duplicate Schema

### Direct Imports (dashboard/v3/validation/activitySchema.ts)

| File | Line | Imports |
|------|------|---------|
| `dashboard/v3/components/QuickLogForm.tsx` | 42-48 | `activityLogSchema`, `ActivityLogInput`, `ACTIVITY_TYPE_MAP`, `ACTIVITY_TYPE_GROUPS`, `SAMPLE_STATUS_OPTIONS` |
| `dashboard/v3/components/MobileQuickActionBar.tsx` | 20 | `ActivityLogInput` (type only) |
| `dashboard/v3/components/LogActivityFAB.tsx` | 14 | `ActivityLogInput` (type only) |

### Test Mocks

| File | Line | Mocks |
|------|------|-------|
| `dashboard/v3/components/__tests__/QuickLogForm.cascading.test.tsx` | 203 | `activityLogSchema`, `ACTIVITY_TYPE_MAP` |
| `dashboard/v3/__tests__/performance.benchmark.test.tsx` | 423 | `activityLogSchema`, `ACTIVITY_TYPE_MAP` |

### Duplicated Constants (not imports)

| File | Line | Duplicated |
|------|------|------------|
| `activities/QuickLogActivity.tsx` | 36 | `ACTIVITY_TYPE_GROUPS` (inline copy) |

## Schema Comparison

### Duplicate Schema (activitySchema.ts)
- **Purpose:** UI-facing form validation
- **Activity Types:** Title Case (`"Call"`, `"Email"`, `"Meeting"`)
- **Schema:** `activityLogSchema` with camelCase fields
- **Key Exports:**
  - `ACTIVITY_TYPE_GROUPS` (grouped by category)
  - `ACTIVITY_TYPE_MAP` (Title Case → snake_case)
  - `activityLogSchema` (form validation)
  - `ActivityLogInput`, `ActivityLog` (types)

### Canonical Schema (validation/activities.ts)
- **Purpose:** API/database validation
- **Activity Types:** snake_case (`"call"`, `"email"`, `"meeting"`)
- **Schema:** `activitiesSchema` with snake_case fields
- **Key Exports:**
  - `INTERACTION_TYPE_OPTIONS` (flat array for dropdowns)
  - `interactionTypeSchema` (enum validation)
  - `activitiesSchema` (API validation)
  - `validateActivitiesForm()` (React Admin integration)

## Migration Strategy

### Phase 2: Extend Canonical Schema

Add to `validation/activities.ts`:
1. `ACTIVITY_TYPE_GROUPS` - grouped options for UI
2. `ACTIVITY_TYPE_DISPLAY_MAP` - snake_case → Title Case
3. `quickLogFormSchema` - derived from base schema using `.pick()` and `.extend()`

### Phase 3: Update Imports

All dashboard consumers switch to:
```typescript
import {
  quickLogFormSchema,
  ACTIVITY_TYPE_GROUPS,
  ACTIVITY_TYPE_DISPLAY_MAP,
  SAMPLE_STATUS_OPTIONS,
  type QuickLogFormInput
} from "@/atomic-crm/validation/activities";
```

### Phase 4: Type Consolidation

Replace manual types in `types.ts` with Zod inferences:
- `ActivityType` → `z.infer<typeof interactionTypeSchema>`
- `ActivityLog` → `z.infer<typeof quickLogFormSchema>`

## Hook `any` Types (4 instances)

| File | Line | Context | Suggested Type |
|------|------|---------|----------------|
| `usePrincipalPipeline.ts` | 66 | Debug logging | `PipelineSummaryRow` |
| `usePrincipalPipeline.ts` | 71 | Data mapping | `PipelineSummaryRow` |
| `useMyTasks.ts` | 63 | Task mapping | `TaskApiResponse` |
| `usePrincipalOpportunities.ts` | 76 | Opp mapping | `OpportunityApiResponse` |

## Risk Assessment

- **Low Risk:** Type-only imports (no runtime impact)
- **Medium Risk:** Schema validation changes (must preserve validation rules)
- **Mitigation:** Run tests after each file migration

---

*Generated: 2025-11-29*
*PRD Version: v1.18*
