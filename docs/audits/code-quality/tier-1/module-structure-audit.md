# Module Structure Audit Report

**Agent:** 10 - Module Structure Auditor
**Date:** 2025-12-20
**Modules Analyzed:** 5 (opportunities, contacts, organizations, activities, tasks)
**Reference Module:** opportunities/

---

## Executive Summary

Feature modules show **mixed compliance** with the established pattern. The `contacts/` module closely follows the reference pattern (85% compliance), while `activities/` shows significant structural drift (55% compliance). Key issues include: missing `resource.tsx` separation in 2 modules, flat file organization instead of subdirectories (`forms/`, `components/`), and partial input sharing in slide-over edit views.

---

## Reference Pattern (opportunities/)

### File Structure
```
opportunities/
├── index.tsx                    # Re-exports resource config (default) + named views
├── resource.tsx                 # Lazy-loaded views with error boundaries, RA config
├── OpportunityList.tsx          # List view
├── OpportunityCreate.tsx        # Create form (uses forms/OpportunityInputs)
├── OpportunityEdit.tsx          # Edit form (uses forms/OpportunityCompactForm)
├── OpportunityShow.tsx          # Detail/show view
├── OpportunitySlideOver.tsx     # Slide-over panel (40vw)
├── forms/
│   ├── index.ts                 # Barrel exports
│   ├── OpportunityInputs.tsx    # Shared inputs wrapper
│   ├── OpportunityCompactForm.tsx  # Actual form implementation
│   └── tabs/                    # Tab-specific form sections
├── components/
│   ├── index.ts                 # Barrel exports
│   └── [feature-specific components]
├── hooks/
├── constants/
└── __tests__/
```

### Key Patterns Observed
1. **Separation of Concerns**: `resource.tsx` handles lazy loading + error boundaries; `index.tsx` re-exports
2. **Named View Exports**: `OpportunityListView`, `OpportunityCreateView`, `OpportunityEditView`
3. **Input Sharing**: Both Create and Edit use shared components from `forms/` directory
4. **Error Boundaries**: `ResourceErrorBoundary` wraps each lazy-loaded view
5. **Default Export**: RA resource config with `list`, `create`, `edit`, `recordRepresentation`

---

## Module Compliance Matrix

| File | opportunities | contacts | organizations | activities | tasks |
|------|:------------:|:--------:|:-------------:|:----------:|:-----:|
| index.tsx | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| resource.tsx | ✅ | ✅ | ❌ | ❌ | ✅ |
| List.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit.tsx | ✅ | ✅ | ✅ | ❌ | ✅ |
| Show/SlideOver | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| forms/ directory | ✅ | ❌ | ❌ | ❌ | ❌ |
| Inputs.tsx shared | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| components/ directory | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| **Compliance Score** | **100%** | **85%** | **70%** | **55%** | **75%** |

**Legend:** ✅ Matches pattern | ⚠️ Differs/Partial | ❌ Missing | 🚫 Shouldn't exist

---

## Naming Convention Issues

| Module | File | Current Name | Expected Name |
|--------|------|--------------|---------------|
| activities | ActivitySinglePage.tsx | ActivitySinglePage | ActivityInputs (in forms/) |
| tasks | TaskSlideOverDetailsTab.tsx | TaskSlideOverDetailsTab | Should compose TaskInputs |

All modules correctly use:
- PascalCase for components
- Consistent prefix matching directory name (Contact, Organization, Activity, Task)
- camelCase for config/utility files

---

## Export Pattern Issues

| Module | Issue | Current | Expected |
|--------|-------|---------|----------|
| organizations | Missing resource.tsx | Error boundaries in index.tsx | Separate resource.tsx with lazy views |
| organizations | Missing named exports | No View exports | OrganizationListView, OrganizationCreateView, etc. |
| activities | Missing resource.tsx | All logic in index.tsx | Separate resource.tsx |
| activities | Missing named exports | Only default + dialog exports | ActivityListView, ActivityCreateView |

### Expected Export Pattern (from opportunities/)
```typescript
// index.tsx
export { default } from "./resource";
export { OpportunityListView, OpportunityCreateView, OpportunityEditView } from "./resource";

// resource.tsx
export const OpportunityListView = () => (
  <ResourceErrorBoundary resource="opportunities" page="list">
    <OpportunityListLazy />
  </ResourceErrorBoundary>
);
// ... other views
export default { list, create, edit, recordRepresentation };
```

---

## Input Sharing Issues

### Modules with Duplicated Inputs

| Module | Create File | Edit File | SlideOver | Shared? |
|--------|-------------|-----------|-----------|---------|
| opportunities | ✅ Uses OpportunityInputs | ✅ Uses OpportunityCompactForm | N/A | ✅ Yes |
| contacts | ✅ Uses ContactInputs | ✅ Uses ContactInputs | ✅ Uses ContactInputs | ✅ Yes |
| organizations | ✅ Uses OrganizationInputs | ✅ Uses OrganizationInputs | ✅ Uses tabs | ✅ Yes |
| activities | ⚠️ ActivitySinglePage (monolithic) | ❌ No Edit | N/A | ❌ No |
| tasks | ✅ TaskInputs | ✅ TaskInputs | ⚠️ TaskSlideOverDetailsTab duplicates | ⚠️ Partial |

### Specific Duplications Found

| Module | Input | In Create | In SlideOver Edit | Should Be |
|--------|-------|-----------|-------------------|-----------|
| tasks | Title, Priority, Due Date | via TaskInputs | TaskSlideOverDetailsTab (lines 88-123) | Compose TaskInputs |
| activities | All form fields | ActivitySinglePage | N/A (no edit) | Extract to forms/ActivityInputs |

---

## React Admin Integration Issues

| Module | Component | Issue | Expected |
|--------|-----------|-------|----------|
| activities | ActivityEdit | Missing entirely | Create EditBase wrapper with ActivityInputs |
| activities | ActivityShow | Missing entirely | Create ShowBase or SlideOver component |
| tasks | TaskShow | Orphaned (not in resource config) | Either use in resource.tsx or remove |

All modules correctly use:
- `CreateBase` for create forms
- `EditBase` for edit forms (where they exist)
- `ShowBase` for show views
- `Form` with proper defaultValues

---

## Pattern Drift Details

### contacts/ (85% Compliance)
**Strengths:**
- Clean input sharing hierarchy: Create/Edit/SlideOver → ContactInputs → ContactCompactForm
- Proper resource.tsx separation with lazy loading and error boundaries
- Comprehensive feature set (import/export, filters, tabs)

**Issues:**
- No `forms/` subdirectory (ContactInputs.tsx at root)
- No `components/` subdirectory (26 supporting components at root)
- Extra Show + SlideOver pattern (opportunities only has SlideOver)

**Recommendation:** Move ContactInputs.tsx + ContactCompactForm.tsx to `forms/` subdirectory

---

### organizations/ (70% Compliance)
**Strengths:**
- All core CRUD files present
- Proper input sharing via OrganizationInputs → OrganizationCompactForm
- Good slide-over tab organization

**Issues:**
- **Critical:** No resource.tsx - error boundaries embedded in index.tsx
- **Critical:** No named view exports (OrganizationListView, etc.)
- Flat file structure (49 files at root)
- Some tabs at root level, others in slideOverTabs/

**Recommendation:** Extract resource.tsx with lazy views; consolidate tabs in slideOverTabs/

---

### activities/ (55% Compliance)
**Strengths:**
- Correct Zod form defaults pattern: `activitiesSchema.partial().parse({})`
- Form mode="onBlur" per constitution

**Issues:**
- **Critical:** No resource.tsx file
- **Critical:** No ActivityEdit component (activities are write-once)
- **Critical:** No ActivityShow or SlideOver (uses modal dialog instead)
- **Critical:** ActivitySinglePage is monolithic (container + inputs combined)
- No forms/ directory

**Recommendation:** If activities need editing, create full CRUD structure; document if read-only by design

---

### tasks/ (75% Compliance)
**Strengths:**
- Proper resource.tsx with lazy views and error boundaries
- Named view exports (TaskListView, TaskCreateView, TaskEditView)
- TaskInputs.tsx for shared form inputs

**Issues:**
- TaskSlideOverDetailsTab duplicates form fields instead of composing TaskInputs
- TaskShow.tsx exists but isn't used in resource config
- TasksIterator.tsx appears orphaned
- No subdirectory organization (forms/, components/)

**Recommendation:** Refactor TaskSlideOverDetailsTab to use TaskInputs; verify/remove TaskShow.tsx

---

## Orphan Files

| Module | File | Issue |
|--------|------|-------|
| organizations | organizations_export.csv | CSV artifact in source directory |
| organizations | ActivitiesTab.tsx (root) | Should be in slideOverTabs/ |
| organizations | AuthorizationsTab.tsx (root) | Should be in slideOverTabs/ |
| activities | QuickLogActivity.tsx | Purpose unclear, may be orphaned |
| tasks | TasksIterator.tsx | 2 lines, purpose unclear |
| tasks | TaskShow.tsx | Not used by resource config |

---

## Prioritized Findings

### P0 - Critical (Architecture Pattern Violations)
1. **organizations/**: Missing resource.tsx - error boundary logic in index.tsx
2. **activities/**: Missing resource.tsx - all logic in index.tsx
3. **activities/**: No Edit/Show views - CRUD incomplete

### P1 - High (Input Sharing Violations)
1. **tasks/**: TaskSlideOverDetailsTab duplicates form fields
2. **activities/**: ActivitySinglePage monolithic - should extract ActivityInputs

### P2 - Medium (Directory Organization)
1. **All modules except opportunities/**: Missing forms/ subdirectory
2. **All modules except opportunities/**: Missing components/ subdirectory
3. **organizations/**: Tabs scattered between root and slideOverTabs/

### P3 - Low (Cleanup)
1. **organizations/**: organizations_export.csv in source
2. **tasks/**: TaskShow.tsx orphaned
3. **tasks/**: TasksIterator.tsx purpose unclear

---

## Recommendations

### 1. organizations/ - High Priority
```bash
# Create resource.tsx with lazy views
# Move error boundaries from index.tsx
# Add named view exports
# Consolidate tabs in slideOverTabs/
```

### 2. activities/ - Medium Priority
```bash
# Decide: Is read-only by design?
# If not: Create ActivityEdit, ActivityShow/SlideOver
# Extract forms/ActivityInputs.tsx from ActivitySinglePage
# Create resource.tsx with proper structure
```

### 3. tasks/ - Medium Priority
```bash
# Refactor TaskSlideOverDetailsTab to compose TaskInputs
# Verify/remove TaskShow.tsx
# Consider forms/ subdirectory for organization
```

### 4. contacts/ - Low Priority
```bash
# Create forms/ subdirectory
# Move ContactInputs.tsx, ContactCompactForm.tsx to forms/
# Add forms/index.ts barrel export
```

### 5. All Modules - Documentation
Document if pattern deviations are intentional:
- activities/ read-only design
- contacts/ dual Show + SlideOver pattern
- tasks/ simplified edit flow

---

## Appendix: File Counts by Module

| Module | Core Files | Supporting | Tests | Total |
|--------|------------|------------|-------|-------|
| opportunities | 12 | 25+ | 20+ | 60+ |
| contacts | 9 | 26 | 13 | 64 |
| organizations | 6 | 26 | 11 | 49 |
| activities | 6 | 4 | 4 | 19 |
| tasks | 12 | 7 | 0 (seen) | 19 |

---

*Report generated by Agent 10 - Module Structure Auditor*
*Audit scope: Feature module architecture compliance*
