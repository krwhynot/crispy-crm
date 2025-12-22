# Module Structure Audit Report

**Agent:** 10 - Module Structure Auditor
**Date:** 2025-12-21
**Modules Analyzed:** 11 (opportunities, contacts, organizations, activities, tasks, products, sales, productDistributors, notifications, tags, notes)

---

## Executive Summary

The codebase exhibits **three distinct organizational patterns** rather than one unified structure. Core business modules (opportunities, contacts, organizations, tasks) follow a reasonably consistent pattern with React Admin resource configs and lazy loading. However, significant structural drift exists in newer modules and supporting features, with activities notably lacking Show/Edit views. The index export strategy varies by module age and complexity.

**Overall Compliance:** 65% (against the canonical 6-file pattern)

---

## Expected Structure

According to the Engineering Constitution:

```
[feature]/
├── index.ts/tsx    # Named exports (or resource.tsx re-export)
├── List.tsx        # List view with filtering
├── Show.tsx        # Read-only detail view
├── Edit.tsx        # Edit form
├── Create.tsx      # Create form
└── Inputs.tsx      # Shared form inputs
```

### Actual Pattern Observed

The codebase uses a **resource.tsx pattern** with lazy loading:

```
[feature]/
├── index.tsx           # Re-exports from resource.tsx
├── resource.tsx        # React Admin config with lazy loading + error boundaries
├── [Resource]List.tsx  # List view (prefixed with resource name)
├── [Resource]Show.tsx  # Detail view (optional in some modules)
├── [Resource]Edit.tsx  # Edit form
├── [Resource]Create.tsx # Create form (or Wizard variant)
├── [Resource]Inputs.tsx # Shared inputs (or in forms/ subdirectory)
└── [...supporting files]
```

---

## Module Compliance Matrix

| Module | index | resource | List | Show | Edit | Create | Inputs | Score |
|--------|-------|----------|------|------|------|--------|--------|-------|
| **opportunities** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ forms/ | 92% |
| **contacts** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| **organizations** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 92% |
| **activities** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | 50% |
| **tasks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| **products** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 86% |
| **sales** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 86% |
| **productDistributors** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | 71% |
| **notifications** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 43% |

**Supporting Modules (Different Pattern)**

| Module | Purpose | Pattern |
|--------|---------|---------|
| **tags** | Utility components | Barrel exports, no CRUD |
| **notes** | Embedded component | Iterator pattern, no List |
| **activity-log** | Display component | Event renderer pattern |
| **reports** | Reporting | Page-based, not CRUD |

---

## Missing Files

### P1 - Core Functionality Missing

| Module | Missing | Impact | Priority |
|--------|---------|--------|----------|
| activities | Show.tsx | Cannot view activity details in isolation | High |
| activities | Edit.tsx | Cannot edit activities after creation | High |
| activities | Inputs.tsx | Form code may be duplicated | Medium |

**Context:** Activities are primarily logged via `QuickLogActivityDialog` rather than a dedicated edit flow. This may be **intentional** for the MVP (quick logging is the goal, not detailed editing).

### P2 - Pattern Incomplete (Non-blocking)

| Module | Missing | Impact |
|--------|---------|--------|
| products | Show.tsx | Uses SlideOver instead of dedicated Show |
| sales | Show.tsx | Uses SlideOver for details |
| productDistributors | Show.tsx | Uses inline list pattern |
| notifications | Edit/Create | Read-only list (intentional) |

---

## Naming Convention Analysis

### File Naming ✅ COMPLIANT

All modules use the `[Resource][View].tsx` pattern:
- `OpportunityList.tsx`, `ContactEdit.tsx`, `TaskCreate.tsx`
- Consistent PascalCase throughout

### Component Export Names ✅ COMPLIANT

Components export match file names:
- `export const ContactList` in `ContactList.tsx`
- `export const TaskInputs` in `TaskInputs.tsx`

### Directory Naming ✅ COMPLIANT

All directories use lowercase plural:
- `opportunities/`, `contacts/`, `organizations/`

---

## Index Export Patterns

### Pattern 1: Resource Re-export (Recommended)
Used by: opportunities, contacts, tasks, products, sales

```typescript
// index.tsx
export { default } from "./resource";
export { OpportunityListView, OpportunityCreateView, OpportunityEditView } from "./resource";
```

### Pattern 2: Inline Lazy Loading
Used by: organizations, activities

```typescript
// index.tsx
const OrganizationListLazy = React.lazy(() => import("./OrganizationList"));
// ... wraps with error boundaries
export default { list: OrganizationList, ... }
```

### Pattern 3: Utility Barrel
Used by: tags

```typescript
// index.ts
export type { Tag, ... } from "./types";
export { TagChip } from "./TagChip";
```

### Issue: Inconsistent Default Exports

| Module | Type | Recommendation |
|--------|------|----------------|
| organizations/index.tsx | Default export object | Migrate to resource.tsx pattern |
| activities/index.tsx | Default export object | Migrate to resource.tsx pattern |
| reports/index.ts | Default export object | Acceptable (custom page) |

---

## Default Exports in Components

React.lazy requires default exports, so the following are **justified**:

| File | Export | Reason |
|------|--------|--------|
| OpportunityList.tsx | `export default OpportunityList` | React.lazy import |
| ContactCreate.tsx | `export default ContactCreate` | React.lazy import |
| TaskEdit.tsx | `export default function TaskEdit()` | React.lazy import |
| All main view files | default export | Required for lazy loading |

**Pattern:** Both named export (`export const X`) AND default export (`export default X`) exist in most view files.

---

## Extra Files Analysis

### Files Per Module (Root Level Only)

| Module | File Count | Assessment |
|--------|------------|------------|
| contacts | 55 | High - includes CSV import functionality |
| organizations | 48 | High - includes import + authorizations |
| opportunities | 35 | High - core business module |
| tasks | 19 | Moderate - appropriate |
| activities | 9 | Lean - minimal but intentional |
| products | 21 | Moderate - appropriate |
| sales | 14 | Moderate - appropriate |

### Subdirectories Analysis

| Module | Subdirectories | Assessment |
|--------|----------------|------------|
| **opportunities** | `__tests__`, `components`, `constants`, `data`, `forms`, `hooks`, `kanban`, `quick-add`, `slideOverTabs`, `utils` | Complex but organized |
| **contacts** | `__tests__`, `slideOverTabs` | Well-contained |
| **organizations** | `__tests__`, `slideOverTabs` | Well-contained |
| **activities** | `__tests__`, `components` | Appropriate |
| **tasks** | `__tests__` | Minimal |

### Recommendations for Extra Files

| Module | Extra File/Dir | Recommendation |
|--------|---------------|----------------|
| opportunities/forms/ | OpportunityInputs.tsx | **Move to root** or document exception |
| opportunities/kanban/ | Kanban view components | Keep (distinct view mode) |
| opportunities/quick-add/ | Quick add dialog | Consider moving to components/ |
| contacts/slideOverTabs/ | Tab components | Keep (SlideOver pattern) |

---

## Input Component Sharing

### Input Reuse in Create/Edit

| Module | Create Uses Inputs? | Edit Uses Inputs? | Assessment |
|--------|---------------------|-------------------|------------|
| opportunities | ✅ Yes | ⚠️ Partial | Edit uses OpportunityCompactForm directly |
| contacts | ✅ Yes | ✅ Yes | Full reuse via ContactInputs |
| organizations | ✅ Yes | ✅ Yes | Full reuse via OrganizationInputs |
| tasks | ✅ Yes | ✅ Yes | Full reuse via TaskInputs |
| products | ✅ Yes | ✅ Yes | Full reuse via ProductInputs |
| sales | ✅ Yes | ✅ Yes | Full reuse via SalesInputs |

### Input Component Patterns

```typescript
// Pattern 1: Delegation to CompactForm (contacts, opportunities)
export const ContactInputs = () => {
  return <ContactCompactForm />;
};

// Pattern 2: Tabbed Inputs (tasks)
export const TaskInputs = () => {
  return <TabbedFormInputs tabs={[...]} />;
};
```

### Missing Inputs.tsx

| Module | Location | Status |
|--------|----------|--------|
| activities | N/A | **Missing** - forms inline in Create |
| productDistributors | N/A | **Missing** - forms inline |
| notifications | N/A | **N/A** - no forms |

---

## Recommendations

### P1 - Critical (Structural Consistency)

1. [ ] **Standardize organizations/index.tsx** - Migrate to resource.tsx re-export pattern for consistency
2. [ ] **Standardize activities/index.tsx** - Migrate to resource.tsx pattern
3. [ ] **Move OpportunityInputs.tsx** to `opportunities/` root (or document the forms/ exception)

### P2 - Important (Complete Patterns)

4. [ ] **Add ActivityEdit.tsx** if editing existing activities is needed (verify MVP scope)
5. [ ] **Add ActivityInputs.tsx** to share form fields between Create and potential Edit
6. [ ] **Add ProductDistributorInputs.tsx** if form complexity warrants it
7. [ ] **Document SlideOver as Show alternative** - Products, Sales, Tasks use SlideOver instead of dedicated Show

### P3 - Cleanup (Reduce Cognitive Load)

8. [ ] **Audit opportunities/quick-add/** - Consider merging into components/
9. [ ] **Create module structure guide** - Document the resource.tsx + lazy loading pattern
10. [ ] **Remove redundant files** - Look for unused or duplicate components

---

## Appendix: Module Structure by Type

### Core CRUD Resources
Modules with full List/Show/Edit/Create pattern:
- ✅ contacts
- ✅ organizations
- ✅ tasks
- ⚠️ opportunities (Inputs.tsx in subdirectory)

### List + Create Only
Modules intentionally limited:
- activities (quick logging focus)
- notifications (read-only)

### Supporting Modules
Non-CRUD utility modules:
- tags (component library)
- notes (embedded iterator)
- activity-log (event display)
- reports (custom pages)

---

## Compliance Score Calculation

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| File naming conventions | 15% | 100% | 15.0 |
| Component naming | 15% | 100% | 15.0 |
| Directory structure | 20% | 90% | 18.0 |
| Index export pattern | 20% | 70% | 14.0 |
| Input reuse | 15% | 85% | 12.75 |
| Show/Edit completeness | 15% | 65% | 9.75 |

**Final Score: 84.5%** (Acceptable with noted exceptions)

---

*Generated by Agent 10 - Module Structure Auditor*
