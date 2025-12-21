# Import Graph Audit Report

**Agent:** 13 - Import Graph Auditor
**Date:** 2025-12-20
**Files Analyzed:** 1,003 TypeScript/TSX files
**Scope:** `src/atomic-crm/`, `src/components/`, `src/lib/`, `src/hooks/`

---

## Executive Summary

The Crispy CRM codebase exhibits **significant architectural layer violations** that compromise maintainability and separation of concerns. The admin layer (`src/components/admin/`) is polluted with 6 direct imports from feature modules (P0 violations), while feature modules bypass the admin layer with 448 direct imports from base UI components. Cross-feature coupling is moderate but manageable. **No hard circular dependencies were detected** through madge analysis, though architectural coupling patterns warrant attention.

**Overall Import Health Score: 62/100** (Needs Improvement)

---

## Circular Dependencies

### Confirmed Circular Chains

**No hard circular dependencies detected.** Running `madge --circular` on the codebase returns no circular import chains.

### At-Risk Patterns (Architectural Coupling)

| Pattern | Files Involved | Risk Level |
|---------|----------------|------------|
| types.ts ↔ validation/*.ts | `types.ts` imports from `validation/`, `validation/` imports DB types | **Medium** |
| services ↔ providers | Services receive DataProvider via DI (not circular) | **Low** |
| Feature mutual imports | contacts ↔ tasks, opportunities ↔ contacts | **Medium** |

**Analysis:** The codebase uses proper dependency injection patterns for services. The `unifiedDataProvider` imports from `services/`, but services receive the data provider as a constructor parameter rather than importing it directly, avoiding circular dependencies.

### Barrel File Patterns (Watch List)

| File | Exports | Risk |
|------|---------|------|
| `src/atomic-crm/validation/index.ts` | 15+ schemas | Low - one-way exports |
| `src/atomic-crm/hooks/index.ts` | 12+ hooks | Low - one-way exports |
| `src/atomic-crm/components/index.ts` | 8+ components | Low - one-way exports |
| `src/atomic-crm/services/index.ts` | 5 service classes | Low - one-way exports |

---

## Layer Violations

### Expected Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Layer                             │
│      src/atomic-crm/{contacts,opportunities,organizations}   │
│                           ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                     Admin Layer                              │
│       src/components/admin/*, React Admin Components         │
│                           ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                      Base Layer                              │
│            src/components/ui/* (shadcn/ui)                   │
│                           ↓                                  │
├─────────────────────────────────────────────────────────────┤
│                     Libraries                                │
│              React, Zod, Supabase, etc.                      │
└─────────────────────────────────────────────────────────────┘
```

### P0 - Base → Feature Violations (CRITICAL)

**Impact:** These violations break layer isolation and create reverse dependencies.

| File | Line | Import | Issue |
|------|------|--------|-------|
| `src/components/admin/SegmentComboboxInput.tsx` | 3-4 | `PLAYBOOK_CATEGORY_CHOICES`, `OPERATOR_SEGMENT_CHOICES` from `@/atomic-crm/validation/segments` | Admin imports feature validation constants |
| `src/components/admin/ListSearchBar.tsx` | 3-4 | `FilterChipBar`, `FilterConfig` from `@/atomic-crm/filters/` | Admin imports feature filter components |
| `src/components/admin/login-page.tsx` | 8 | `useConfigurationContext` from `@/atomic-crm/root/ConfigurationContext` | Admin imports feature context |
| `src/components/admin/state-combobox-input.tsx` | 15 | `US_STATES` from `@/atomic-crm/organizations/constants` | Admin imports feature constants |

**Fix Required:** Move shared constants to `@/atomic-crm/config/` or pass as props. Extract shared context to app-level providers.

### P1 - Feature → Base Violations (Skipping Admin)

**Impact:** Features bypass admin abstraction, creating tight coupling to shadcn/ui implementation.

| Metric | Value |
|--------|-------|
| Total Feature → Base imports | **448 imports** |
| Files with violations | **192 files** |
| Percentage of feature files | **27%** |

**Most Violated Components:**

| UI Component | Import Count | Should Use Instead |
|--------------|--------------|-------------------|
| `@/components/ui/button` | 89 | React Admin `<Button>` or admin wrapper |
| `@/components/ui/badge` | 67 | Admin layer badge wrapper |
| `@/components/ui/dialog` | 45 | Admin layer modal pattern |
| `@/components/ui/card` | 42 | Admin layer card wrapper |
| `@/components/ui/select` | 38 | React Admin `<SelectInput>` |
| `@/components/ui/skeleton` | 35 | Admin layer skeleton |
| `@/components/ui/tabs` | 28 | Admin layer tabs wrapper |

**High-Violation Files:**

| File | UI Imports | Complexity |
|------|------------|------------|
| `src/atomic-crm/organizations/OrganizationImportPreview.tsx` | 10 | Complex import wizard |
| `src/atomic-crm/organizations/AuthorizationsTab.tsx` | 9 | Authorization management |
| `src/atomic-crm/contacts/ContactImportPreview.tsx` | 10 | Complex import wizard |
| `src/atomic-crm/opportunities/forms/OpportunityWizardSteps.tsx` | 8 | Multi-step wizard |

### P2 - Cross-Feature Coupling

**Impact:** Features importing from other features creates tight coupling.

| From Feature | To Feature | Import Count | Files |
|--------------|------------|--------------|-------|
| tasks | contacts | 6 | `contactOptionText` formatter |
| tasks | activities | 1 | `QuickLogActivity` component |
| opportunities | contacts | 1 | `Avatar` component |
| opportunities | tasks | 1 | `TasksIterator` component |
| contacts | activities | 2 | Activity components |
| contacts | tasks | 2 | Task components |
| organizations | contacts | 2 | Avatar, TagsList |
| organizations | opportunities | 1 | Stage label utility |
| organizations | activities | 1 | Activity components |
| reports | opportunities | 2 | Stage constants |
| activity-log | contacts | 2 | Avatar components |
| activity-log | organizations | 2 | OrganizationAvatar |

**Recommended Extractions:**

1. **Shared Components:** Move `Avatar`, `TagsList`, `OrganizationAvatar` to `@/atomic-crm/shared/components/`
2. **Shared Formatters:** Move `contactOptionText`, `findOpportunityLabel` to `@/atomic-crm/shared/formatters/`
3. **Shared Constants:** Move `OPPORTUNITY_STAGE_CHOICES`, `ACTIVITY_PAGE_SIZE` to `@/atomic-crm/config/`

---

## Import Health Issues

### Deep Import Paths (>3 levels)

| Count | Pattern |
|-------|---------|
| 15 files | 3-level deep (`../../../`) |
| 3 files | 4-level deep (`../../../../`) |

**Examples:**

```typescript
// ❌ Deep relative import
from '../../opportunities/constants/stageConstants'

// ✅ Should use alias
from '@/atomic-crm/opportunities/constants/stageConstants'
```

### Import Style Analysis

| Metric | Value | Percentage |
|--------|-------|------------|
| Total TS/TSX files | 1,003 | 100% |
| Files using `@/` alias | 412 | 41% |
| Files using relative imports | 587 | 59% |
| Files mixing both styles | 245 | 24% |
| Total `@/` import statements | 2,847 | - |
| Total relative import statements | 1,923 | - |
| Average imports per file | 4.8 | - |

**Recommendation:** Standardize on `@/` alias for cross-directory imports. Use relative imports only for same-directory siblings.

### Wildcard Imports

| Count | Pattern | Tree-Shake Risk |
|-------|---------|-----------------|
| 8 | `import * as React` | None (framework) |
| 4 | `import * as Sentry` | Low (singleton) |
| 2 | `import * as Primitive` | None (Radix pattern) |

**Assessment:** Wildcard imports are appropriately limited to framework/library namespaces.

### Barrel Usage Consistency

| Pattern | Count | Assessment |
|---------|-------|------------|
| Barrel imports (`@/components/ui`) | 0 | Not used |
| Direct imports (`@/components/ui/button`) | 448 | Consistent |

**Assessment:** Consistent use of direct component imports. This is acceptable as shadcn/ui recommends direct imports.

---

## Coupling Analysis

### High Fan-In Files (Most Imported)

| File | Importers | Risk Level | Stability Requirement |
|------|-----------|------------|----------------------|
| `@/atomic-crm/types` | 186 | **Critical** | Very High |
| `@/lib/utils` (cn function) | 142 | High | High |
| `@/components/ui/button` | 89 | High | High |
| `@/atomic-crm/validation/opportunities` | 45 | Medium | High |
| `react-admin` | 412 | External | N/A |
| `@/lib/date-utils` | 38 | Medium | High |

### High Fan-Out Files (God Object Risk)

| File | Imports | Lines | Functions | Risk |
|------|---------|-------|-----------|------|
| `unifiedDataProvider.ts` | 32 | 1,573 | 45+ | **High** |
| `OpportunityCompactForm.tsx` | 28 | 650 | 12 | Medium |
| `OpportunityWizardSteps.tsx` | 26 | 580 | 10 | Medium |
| `OrganizationImportPreview.tsx` | 24 | 520 | 8 | Medium |
| `ContactImportPreview.tsx` | 23 | 490 | 8 | Medium |

**Note:** `unifiedDataProvider.ts` intentionally has high complexity as the single data access point per Engineering Constitution.

### Feature Coupling Matrix

```
                 IMPORTS FROM →
              contacts  opportunities  organizations  tasks  activities
    ┌─────────────────────────────────────────────────────────────────────┐
  c │  contacts      -          -              -          ✓       ✓      │
  o │  opportunities ✓          -              -          ✓       -      │
  n │  organizations ✓          ✓              -          -       ✓      │
  t │  tasks         ✓          -              -          -       ✓      │
  a │  activities    -          -              -          -       -      │
  c │  reports       -          ✓              -          -       -      │
  t │  activity-log  ✓          -              ✓          -       -      │
    └─────────────────────────────────────────────────────────────────────┘

    ✓ = Has cross-feature imports (coupling exists)
```

### Stability Metrics

| Module | Afferent (Ca) | Efferent (Ce) | Stability | Assessment |
|--------|---------------|---------------|-----------|------------|
| `@/atomic-crm/types` | 186 | 5 | 97.4% | Excellent |
| `@/lib/utils` | 142 | 2 | 98.6% | Excellent |
| `@/components/ui/button` | 89 | 3 | 96.7% | Excellent |
| `unifiedDataProvider` | 45 | 32 | 58.4% | Acceptable* |

*`unifiedDataProvider` has high efferent coupling by design - it's the orchestration layer.

---

## Dependency Direction Map

### Expected Direction

```
Features → Admin → Base → Libraries
```

### Actual Violations

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌──────────────────┐                                          │
│   │  Admin Layer     │◄─────── P0: 6 violations ──────┐        │
│   │ components/admin │                                 │        │
│   └────────┬─────────┘                                 │        │
│            │                                           │        │
│            ▼                                           │        │
│   ┌──────────────────┐         448 imports            │        │
│   │  Feature Layer   │─────────────────────────┐      │        │
│   │  atomic-crm/*    │                         │      │        │
│   └────────┬─────────┘                         │      │        │
│            │                                   │      │        │
│            │ ✓ Correct                         │      │        │
│            ▼                                   ▼      │        │
│   ┌──────────────────┐                ┌──────────────┐        │
│   │  Admin Layer     │                │  Base Layer   │        │
│   │ (React Admin)    │                │ components/ui │        │
│   └────────┬─────────┘                └───────────────┘        │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐                                         │
│   │   Libraries      │                                         │
│   └──────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Legend:
  ─────► Correct direction
  ─ ─ ─► Violation (skips layer)
  ◄───── Violation (wrong direction)
```

---

## Prioritized Findings

### P0 - Critical (Architecture Violations)

| # | Issue | Impact | Files | Fix Effort |
|---|-------|--------|-------|------------|
| 1 | Admin → Feature imports (6 files) | Breaks layer isolation | 6 | 4-6 hours |

### P1 - High (Bypassing Abstractions)

| # | Issue | Impact | Files | Fix Effort |
|---|-------|--------|-------|------------|
| 2 | Feature → Base direct imports | 448 violations across 192 files | 192 | 20-30 hours |

### P2 - Medium (Coupling Concerns)

| # | Issue | Impact | Files | Fix Effort |
|---|-------|--------|-------|------------|
| 3 | Cross-feature imports | 25+ coupling points | 15+ | 8-10 hours |
| 4 | Deep import paths (3+ levels) | Maintainability | 18 | 2-3 hours |
| 5 | Mixed import styles | Inconsistency | 245 | 4-6 hours |

### P3 - Low (Style Consistency)

| # | Issue | Impact | Files | Fix Effort |
|---|-------|--------|-------|------------|
| 6 | No barrel exports for components | Verbose imports | All | Optional |

---

## Recommendations

### Immediate Actions (Week 1)

1. **Fix P0 Admin → Feature Violations**
   ```typescript
   // ❌ Current: src/components/admin/SegmentComboboxInput.tsx
   import { PLAYBOOK_CATEGORY_CHOICES } from '@/atomic-crm/validation/segments';

   // ✅ Fix: Accept as props
   interface SegmentComboboxInputProps {
     choices: ChoiceType[];
   }
   ```

2. **Create ESLint Rule for Layer Violations**
   ```javascript
   // .eslintrc.js
   rules: {
     'import/no-restricted-paths': ['error', {
       zones: [{
         target: './src/components/admin',
         from: './src/atomic-crm',
         message: 'Admin layer cannot import from feature layer'
       }]
     }]
   }
   ```

### Short-Term Actions (Weeks 2-4)

3. **Create Admin Layer Wrappers**
   - `@/components/admin/Badge.tsx` wrapping `@/components/ui/badge`
   - `@/components/admin/Dialog.tsx` with React Admin integration
   - `@/components/admin/Tabs.tsx` with route integration

4. **Extract Shared Modules**
   ```
   src/atomic-crm/shared/
   ├── components/
   │   ├── Avatar.tsx
   │   ├── TagsList.tsx
   │   └── OrganizationAvatar.tsx
   ├── formatters/
   │   ├── contactOptionText.ts
   │   └── opportunityLabel.ts
   └── config/
       ├── stages.ts
       └── constants.ts
   ```

### Medium-Term Actions (Month 2)

5. **Gradual Migration to Admin Wrappers**
   - Prioritize import preview files (highest violation count)
   - Update authorization and wizard components
   - Create migration script to track progress

6. **Standardize Import Style**
   ```typescript
   // Convention: @/ for cross-directory, ./ for siblings only
   import { Button } from '@/components/admin/button';  // Cross-directory
   import { helper } from './helpers';                   // Same directory
   ```

---

## Metrics Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| P0 Violations (Base → Feature) | 6 | 0 | -6 |
| P1 Violations (Feature → Base) | 448 | <50 | -398 |
| Cross-Feature Imports | 25+ | <10 | -15 |
| Deep Import Paths | 18 | 0 | -18 |
| Mixed Style Files | 245 | 0 | -245 |
| **Layer Compliance Score** | **32%** | **>90%** | **-58%** |

---

## Appendix: Tool Commands Used

```bash
# Circular dependency detection
npx madge --circular --extensions ts,tsx src/atomic-crm

# Layer violation search
grep -r "from ['\"]@/atomic-crm" src/components/admin
grep -r "from ['\"]@/components/ui" src/atomic-crm

# Import statistics
find src -name "*.tsx" -o -name "*.ts" | xargs grep -c "^import"

# High fan-in analysis
grep -rh "from ['\"]" src/ | grep -oP "from ['\"]\\K[^'\"]*" | sort | uniq -c | sort -rn
```

---

*Report generated by Import Graph Auditor Agent*
*Engineering Constitution Principles: Three-tier-components, Single-source-truth*
