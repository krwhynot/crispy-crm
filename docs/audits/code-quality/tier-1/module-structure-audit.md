# Module Structure Audit Report

**Agent:** 10 - Module Structure Auditor
**Date:** 2025-12-21 (Updated)
**Previous Audit:** 2025-12-20
**Modules Analyzed:** 5 (opportunities, contacts, organizations, activities, tasks)
**Reference Module:** opportunities/

---

## Executive Summary

Feature modules show **moderate-to-good structural consistency** with the reference pattern. The `opportunities/` module serves as the gold standard with its resource.tsx pattern using lazy loading, error boundaries, and comprehensive file structure. Key findings from this updated audit:

- **contacts/** and **organizations/**: High compliance (90-100%), excellent input sharing
- **tasks/**: Good compliance (80%), but TaskCreate uses inline fields instead of TaskInputs
- **activities/**: Lower compliance (60%), missing Edit/Show/SlideOver - appears intentionally modal-only
- **organizations/OrganizationShow.tsx**: Marked deprecated but still present

---

## Reference Pattern (opportunities/)

### File Structure
```
opportunities/
├── index.tsx                    # Re-exports resource.tsx
├── resource.tsx                 # Lazy loading + ErrorBoundary wrappers
├── OpportunityList.tsx          # List component with slide-over
├── OpportunityCreate.tsx        # Create form (tabbed)
├── OpportunityCreateWizard.tsx  # Alternative create (wizard - now default)
├── OpportunityEdit.tsx          # Edit form with OpportunityCompactForm
├── OpportunityShow.tsx          # Detail view (full-page)
├── OpportunitySlideOver.tsx     # Slide-over panel
├── forms/
│   ├── OpportunityInputs.tsx    # Shared inputs wrapper
│   └── OpportunityCompactForm.tsx # Actual form fields
├── components/                  # Feature-specific components
├── hooks/                       # Feature-specific hooks
├── constants/                   # Feature-specific constants
└── __tests__/                   # Unit tests
```

### Key Patterns

1. **index.tsx Pattern:**
   ```typescript
   export { default } from "./resource";
   export { OpportunityListView, OpportunityCreateView, OpportunityEditView } from "./resource";
   ```

2. **resource.tsx Pattern:**
   - Lazy loading with `React.lazy()`
   - Wrapped in `ResourceErrorBoundary`
   - Exports `*View` components and default resource config
   ```typescript
   export default {
     list: OpportunityListView,
     create: OpportunityCreateView,
     edit: OpportunityEditView,
     recordRepresentation: (record) => record?.name
   };
   ```

3. **Inputs Sharing Pattern:**
   - `OpportunityInputs.tsx`: Wrapper with FormErrorSummary + mode prop
   - `OpportunityCompactForm.tsx`: Actual form fields, takes mode="create"|"edit"
   - Both Create and Edit use OpportunityCompactForm (shared inputs)

4. **SlideOver Integration:**
   - List uses `useSlideOverState()` hook
   - SlideOver component with tabs (details, notes, etc.)

---

## Module Compliance Matrix

| File | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| index.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| resource.tsx | ✅ | ✅ | 🚫 (in index) | 🚫 (in index) | ✅ |
| {Feature}List.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| {Feature}Create.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| {Feature}Edit.tsx | ✅ | ✅ | ✅ | ❌ Missing | ✅ |
| {Feature}Show.tsx | ✅ | ✅ | ⚠️ Deprecated | ❌ Missing | ✅ (not registered) |
| SlideOver.tsx | ✅ | ✅ | ✅ | ❌ Missing | ✅ |
| {Feature}Inputs.tsx | ✅ | ✅ | ✅ | ⚠️ ActivitySinglePage | ✅ |
| CompactForm.tsx | ✅ | ✅ | ✅ | ❌ Missing | ❌ Missing |
| **Compliance** | **100%** | **100%** | **90%** | **60%** | **80%** |

**Legend:** ✅ Matches pattern | ⚠️ Differs | ❌ Missing | 🚫 Differently located

---

## Naming Convention Issues

| Module | File | Current Name | Expected Name |
|--------|------|--------------|---------------|
| activities | ActivitySinglePage.tsx | ActivitySinglePage | ActivityInputs (or ActivityCompactForm) |
| organizations | OrganizationShow.tsx | N/A (deprecated) | Should be removed (SlideOver is replacement) |

---

## Export Pattern Issues

| Module | Issue | Current | Expected |
|--------|-------|---------|----------|
| organizations | No separate resource.tsx | Resource config in index.tsx | Split to resource.tsx for consistency |
| activities | No separate resource.tsx | Resource config in index.tsx | Split to resource.tsx for consistency |
| tasks | TaskShow.tsx not registered | show: undefined | Optionally add `show: TaskShowView` |

---

## Input Sharing Analysis

### Modules with Proper Input Sharing

| Module | Wrapper File | CompactForm File | Properly Shared? |
|--------|-------------|------------------|------------------|
| opportunities | OpportunityInputs.tsx | OpportunityCompactForm.tsx | ✅ Yes |
| contacts | ContactInputs.tsx | ContactCompactForm.tsx | ✅ Yes |
| organizations | OrganizationInputs.tsx | OrganizationCompactForm.tsx | ✅ Yes |
| tasks | TaskInputs.tsx | TaskGeneralTab.tsx + TaskDetailsTab.tsx | ✅ Yes (tabbed) |

### Modules Without Standard Input Pattern

| Module | Issue | Current Approach |
|--------|-------|------------------|
| activities | No ActivityInputs.tsx | Uses ActivitySinglePage.tsx directly in Create; no Edit exists |

### Input Sharing Details

**opportunities/**
- `OpportunityInputs.tsx:28-44`: Wraps OpportunityCompactForm with mode prop
- `OpportunityCreate.tsx:89`: Uses `<OpportunityInputs mode="create" />`
- `OpportunityEdit.tsx:54`: Uses `<OpportunityCompactForm mode="edit" />` directly

**contacts/**
- `ContactInputs.tsx:18-34`: Wraps ContactCompactForm
- `ContactCreate.tsx:75`: Uses `<ContactInputs />`
- `ContactEdit.tsx:40`: Uses `<ContactInputs />`
- ✅ Fully consistent

**organizations/**
- `OrganizationInputs.tsx:21-37`: Wraps OrganizationCompactForm
- `OrganizationCreate.tsx:264`: Uses `<OrganizationInputs />`
- `OrganizationEdit.tsx:97`: Uses `<OrganizationInputs />`
- ✅ Fully consistent

**tasks/**
- `TaskInputs.tsx:5-22`: Uses TabbedFormInputs with tabs
- `TaskCreate.tsx:72-156`: Inline form fields (NOT using TaskInputs!)
- `TaskEdit.tsx:24`: Uses `<TaskInputs />` via SimpleForm
- ⚠️ **Inconsistency**: TaskCreate has inline fields, TaskEdit uses TaskInputs

---

## React Admin Integration Issues

| Module | Component | Issue | Expected |
|--------|-----------|-------|----------|
| activities | N/A | Missing ActivityEdit | Add ActivityEdit or document why modal-only |
| tasks | TaskCreate | Uses inline form fields | Should use TaskInputs for consistency |

---

## Pattern Drift Details

### contacts/ (100% Compliant)
- ✅ index.tsx re-exports resource.tsx
- ✅ resource.tsx with lazy loading + error boundaries
- ✅ Consistent Create/Edit using ContactInputs wrapper
- ✅ ContactShow.tsx for full-page detail view
- ✅ ContactSlideOver.tsx for list integration

### organizations/ (90% Compliant)
- ⚠️ No separate resource.tsx (config in index.tsx)
- ⚠️ OrganizationShow.tsx marked `@deprecated` (line 1-10)
- ✅ Consistent Create/Edit using OrganizationInputs
- ✅ OrganizationSlideOver.tsx is the replacement for Show
- **Recommendation**: Complete deprecation by removing Show and redirecting

### activities/ (60% Compliant)
- ⚠️ No separate resource.tsx (config in index.tsx)
- ❌ Missing ActivityEdit.tsx - activities are likely edited via modal/dialog
- ❌ Missing ActivityShow.tsx - no standalone detail view
- ❌ Missing ActivitySlideOver.tsx - no slide-over pattern
- ⚠️ ActivitySinglePage.tsx used instead of ActivityInputs/ActivityCompactForm
- **Note**: Activities may intentionally use modal-only editing pattern

### tasks/ (80% Compliant)
- ✅ index.tsx re-exports resource.tsx
- ✅ resource.tsx with lazy loading + error boundaries
- ⚠️ TaskShow.tsx exists but NOT registered in resource config
- ⚠️ TaskCreate.tsx has inline form fields (lines 72-156) instead of using TaskInputs
- ✅ TaskEdit.tsx correctly uses TaskInputs
- ✅ TaskSlideOver.tsx for list integration

---

## Orphan Files

| Module | File | Issue |
|--------|------|-------|
| contacts | contacts_export.csv | Data file in source directory (should be in /data or /fixtures) |
| organizations | organizations_export.csv | Data file in source directory (should be in /data or /fixtures) |
| contacts | StageBadgeWithHealth.test.tsx | Test file outside __tests__/ directory |
| organizations | organizationColumnAliases.test.ts | Test file outside __tests__/ directory |
| organizations | organizationImport.logic.test.ts | Test file outside __tests__/ directory |
| organizations | OrganizationImportDialog.test.tsx | Test file outside __tests__/ directory |
| organizations | OrganizationList.exporter.test.ts | Test file outside __tests__/ directory |
| organizations | OrganizationInputs.test.tsx | Test file outside __tests__/ directory |
| organizations | OrganizationType.spec.tsx | Test file outside __tests__/ directory |
| organizations | OrganizationList.spec.tsx | Test file outside __tests__/ directory |

---

## Prioritized Findings

### P0 - Critical (Broken Functionality)
*None identified - all modules are functional*

### P1 - High (Pattern Violations)
1. **activities/**: Missing ActivityEdit.tsx, ActivityShow.tsx, and ActivityInputs.tsx pattern
   - **Impact**: Inconsistent editing experience; activities lack standard CRUD pattern
   - **Location**: `src/atomic-crm/activities/`
   - **Recommendation**: Create ActivityEdit.tsx or document modal-only editing as intentional

2. **tasks/TaskCreate.tsx:72-156**: Inline form fields instead of TaskInputs
   - **Impact**: Input duplication; changes must be made in two places
   - **Location**: `src/atomic-crm/tasks/TaskCreate.tsx`
   - **Recommendation**: Refactor to use TaskInputs for consistency with TaskEdit

### P2 - Medium (Inconsistencies)
1. **organizations/OrganizationShow.tsx**: Deprecated but still present
   - **Impact**: Dead code; potential confusion for developers
   - **Location**: `src/atomic-crm/organizations/OrganizationShow.tsx:1-10`
   - **Recommendation**: Complete Phase B/C deprecation plan per ADR-005

2. **resource.tsx location inconsistency**:
   - opportunities, contacts, tasks: Separate resource.tsx
   - organizations, activities: Config in index.tsx
   - **Recommendation**: Standardize on separate resource.tsx for all modules

3. **tasks/TaskShow.tsx**: Exists but not registered in resource config
   - **Impact**: Show view exists but may not be accessible via React Admin routing
   - **Location**: `src/atomic-crm/tasks/resource.tsx:30-34`
   - **Recommendation**: Register or remove based on intended usage

### P3 - Low (Cleanup)
1. **Test files outside __tests__/ directories**
   - 8+ test files in organization module at root level
   - **Recommendation**: Move to `__tests__/` subdirectory for consistency

2. **CSV files in source directories**
   - contacts_export.csv, organizations_export.csv
   - **Recommendation**: Move to appropriate fixtures or data directory

3. **activities/ActivitySinglePage.tsx naming**
   - Doesn't follow {Feature}Inputs.tsx or {Feature}CompactForm.tsx pattern
   - **Recommendation**: Rename to ActivityInputs.tsx for consistency

---

## Recommendations

### Immediate Actions

1. **Standardize TaskCreate.tsx** (P1)
   ```typescript
   // Instead of inline form fields:
   <TaskFormContent />

   // Use shared inputs:
   <TaskInputs />
   ```

2. **Create resource.tsx for organizations and activities** (P2)
   - Extract resource config from index.tsx to resource.tsx
   - Update index.tsx to re-export from resource.tsx

### Short-term Actions

3. **Complete OrganizationShow deprecation** (P2)
   - Implement Phase B redirect to list with SlideOver
   - Schedule Phase C removal

4. **Evaluate activities module pattern** (P1)
   - If modal-only editing is intentional, document this deviation
   - If not, create ActivityEdit.tsx following the reference pattern

### Long-term Actions

5. **Relocate orphan files** (P3)
   - Move test files to `__tests__/` directories
   - Move CSV files to appropriate location

6. **Register TaskShow or remove** (P2)
   - If TaskShow is used, add to resource.tsx
   - If SlideOver is the primary detail view, consider removing TaskShow

---

## Module Structure Template

For new modules, follow this structure:

```
{feature}/
├── index.tsx                    # Re-export resource.tsx
├── resource.tsx                 # Lazy loading + ErrorBoundary + config
├── {Feature}List.tsx            # List with slide-over integration
├── {Feature}Create.tsx          # Create form using inputs
├── {Feature}Edit.tsx            # Edit form using inputs
├── {Feature}Show.tsx            # Optional: Full-page detail view
├── {Feature}SlideOver.tsx       # Slide-over panel with tabs
├── {Feature}Inputs.tsx          # Shared input wrapper (FormErrorSummary)
├── {Feature}CompactForm.tsx     # Actual form fields
├── components/                  # Feature-specific components
├── hooks/                       # Feature-specific hooks
├── constants/                   # Feature-specific constants
└── __tests__/                   # All test files
```

---

## Appendix: File Counts by Module

| Module | Core Files | Supporting | Tests | Total |
|--------|------------|------------|-------|-------|
| opportunities | 12 | 25+ | 20+ | 60+ |
| contacts | 9 | 26 | 13 | 64 |
| organizations | 6 | 26 | 11 | 49 |
| activities | 6 | 4 | 4 | 19 |
| tasks | 12 | 7 | 1+ | 20 |

---

**Audit Complete**

*Generated by Agent 10 - Module Structure Auditor*
*Audit scope: Feature module architecture compliance*
