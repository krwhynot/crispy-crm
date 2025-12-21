# Resource Data Patterns Audit Report

**Agent:** 3 - Resource Data Patterns
**Date:** 2025-12-20
**Resources Analyzed:** 5 (opportunities, contacts, organizations, activities, tasks)
**Reference Pattern:** opportunities/

---

## Executive Summary

Pattern consistency across resources is **moderate with significant drift**. While all resources share core React Admin patterns (CreateBase, Form, List), there are critical inconsistencies in cache invalidation (only opportunities uses useQueryClient), resource registration patterns (3 different approaches), and component structure (activities missing Edit/Show/SlideOver entirely). The opportunities module should be formalized as the canonical reference, with other resources aligned to match.

---

## File Structure Comparison

| File | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| index.tsx | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| resource.tsx | ✅ | ✅ | ❌ | ❌ | ✅ |
| List.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create.tsx | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Edit.tsx | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Show.tsx | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| SlideOver.tsx | ✅ | ✅ | ✅ | ❌ | ✅ |
| Inputs.tsx | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |

**Legend:** ✅ Exists and matches pattern | ⚠️ Exists but differs | ❌ Missing | N/A Not applicable

### Notes on File Structure

- **organizations/index.tsx**: Combines lazy loading + error boundaries + config export (should be split into resource.tsx)
- **activities/index.tsx**: Same issue - no resource.tsx separation
- **activities**: Missing Edit, Show, and SlideOver components entirely (activities are inline-edited only)
- **tasks/Create.tsx**: Uses getTaskDefaultValues() helper instead of inline schema.partial().parse({})
- **tasks/Inputs.tsx**: Uses TabbedFormInputs pattern instead of single-file FormErrorSummary approach

---

## Data Provider Call Patterns

### Reference Pattern (opportunities)
```typescript
// OpportunityCreate.tsx - Form defaults from Zod schema
const formDefaults = {
  ...opportunitySchema.partial().parse({}),
  opportunity_owner_id: identity?.id,
  account_manager_id: identity?.id,
};

// OpportunityEdit.tsx - Cache invalidation on success
import { useQueryClient } from "@tanstack/react-query";
const queryClient = useQueryClient();

<EditBase
  mutationOptions={{
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  }}
>
```

### Deviations Found

| Resource | File | Line | Current Pattern | Expected Pattern |
|----------|------|------|-----------------|------------------|
| contacts | ContactEdit.tsx | 10-14 | No mutationOptions, no useQueryClient | useQueryClient cache invalidation on success |
| organizations | OrganizationEdit.tsx | 1-116 | No useQueryClient import or usage | useQueryClient cache invalidation on success |
| activities | N/A | N/A | No Edit component exists | EditBase with cache invalidation |
| tasks | TaskEdit.tsx | 12-18 | Uses Edit wrapper + SimpleForm | Should use EditBase + Form + useQueryClient |

---

## React Admin Integration

### Resource Registration Comparison

| Resource | Registered? | List | Create | Edit | Show | Icon |
|----------|-------------|------|--------|------|------|------|
| opportunities | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| organizations | ✅ | ✅ | ✅ | ✅ | ✅ (deprecated) | ✅ |
| activities | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Registration Pattern Differences

| Pattern | Resources | Description |
|---------|-----------|-------------|
| **Pattern A (Reference)** | opportunities, tasks | index.tsx re-exports from resource.tsx; resource.tsx has lazy loading + error boundaries |
| **Pattern B** | contacts | Same as Pattern A |
| **Pattern C** | organizations, activities | index.tsx contains everything (no resource.tsx) |

---

## Hook Usage Matrix

| Hook | opportunities | contacts | organizations | activities | tasks |
|------|--------------|----------|---------------|------------|-------|
| useListContext | ✅ | ✅ | ✅ | ✅ | ✅ |
| useGetIdentity | ✅ | ✅ | ✅ | ✅ | ✅ |
| useRecordContext | ✅ | ✅ | ✅ | ❌ | ❌ |
| useQueryClient | ✅ | ❌ | ❌ | ❌ | ❌ |
| CreateBase | ✅ | ✅ | ✅ | ✅ | ✅ |
| EditBase | ✅ | ✅ | ✅ | ❌ | ❌ |
| ShowBase | ✅ | ✅ | ✅ | ❌ | ❌ |
| Form | ✅ | ✅ | ✅ | ✅ | ✅ |

### Critical Finding: useQueryClient

Only **opportunities** uses `useQueryClient` for cache invalidation. This means:
- After editing contacts/organizations/tasks, React Query cache may be stale
- Users might see outdated data until page refresh
- This is a **consistency bug**, not just a pattern deviation

---

## Feature Parity Matrix

| Feature | opportunities | contacts | organizations | activities | tasks |
|---------|--------------|----------|---------------|------------|-------|
| List filtering | ✅ | ✅ | ✅ | ✅ | ✅ |
| List sorting | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pagination | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bulk select | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export (CSV) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Import (CSV) | ❌ | ✅ | ✅ | ❌ | ❌ |
| SlideOver | ✅ | ✅ | ✅ | ❌ | ✅ |
| Quick filters | ✅ | ✅ | ✅ | ✅ | ✅ |
| Keyboard nav | ✅ | ✅ | ✅ | ⚠️ | ✅ |

**Notes:**
- activities keyboard nav has empty onSelect (inline editing comment)
- Import feature exists for contacts/organizations only

---

## Pattern Drift Findings

### Structural Deviations

| Resource | Issue | Reference | Actual | Impact |
|----------|-------|-----------|--------|--------|
| organizations | No resource.tsx | Separate resource.tsx file | All in index.tsx | Harder to maintain, inconsistent structure |
| activities | No resource.tsx | Separate resource.tsx file | All in index.tsx | Harder to maintain, inconsistent structure |
| tasks | Uses Edit wrapper | EditBase directly | Edit component wrapper | Abstracts away cache invalidation opportunity |
| tasks | Uses SimpleForm | Form component | SimpleForm from react-admin | Different form handling patterns |
| tasks | No ShowBase | ShowBase wrapper | useShowContext directly | Missing standard context provider |

### Import Pattern Deviations

| Resource | File | Issue |
|----------|------|-------|
| contacts | ContactCreate.tsx | Uses custom useSmartDefaults hook instead of direct identity access |
| contacts | ContactCreate.tsx | Transform function adds metadata fields (first_seen, last_seen) |
| tasks | TaskCreate.tsx | Uses getTaskDefaultValues() helper instead of inline schema.partial().parse({}) |
| tasks | TaskCreate.tsx | Uses mode='onBlur' explicitly on Form component |

### Error Handling Deviations

| Resource | File | Issue |
|----------|------|-------|
| All | All | ResourceErrorBoundary used consistently ✅ |

---

## Schema Defaults Pattern

| Resource | Pattern | Constitution Compliant? |
|----------|---------|------------------------|
| opportunities | `opportunitySchema.partial().parse({})` | ✅ Yes |
| contacts | `contactSchema.partial().parse({})` | ✅ Yes |
| organizations | `organizationSchema.partial().parse({})` | ✅ Yes |
| activities | `activitiesSchema.partial().parse({})` | ✅ Yes |
| tasks | `getTaskDefaultValues()` wrapping schema | ⚠️ Indirect but valid |

---

## Prioritized Findings

### P0 - Critical (Functional Issues)

1. **Missing useQueryClient cache invalidation** in contacts, organizations, tasks
   - File: ContactEdit.tsx, OrganizationEdit.tsx, TaskEdit.tsx
   - Impact: Stale cache after edits, users see outdated data
   - Fix: Add useQueryClient with invalidateQueries on mutation success
   - Effort: Low (copy pattern from OpportunityEdit.tsx)

### P1 - High (Consistency Issues)

1. **Inconsistent resource registration patterns** (3 different approaches)
   - Files: organizations/index.tsx, activities/index.tsx
   - Impact: Harder to onboard developers, inconsistent code structure
   - Fix: Extract resource.tsx for organizations and activities
   - Effort: Medium (refactor file structure)

2. **Missing Edit/Show/SlideOver for activities**
   - Impact: Inconsistent user experience, no slide-over editing
   - Fix: Add ActivityEdit.tsx, ActivityShow.tsx, ActivitySlideOver.tsx OR document why inline-only is intentional
   - Effort: High (new components) or Low (documentation)

### P2 - Medium (Technical Debt)

1. **TaskEdit uses Edit wrapper instead of EditBase**
   - File: TaskEdit.tsx
   - Impact: Different abstraction level than other resources
   - Fix: Refactor to use EditBase + Form pattern
   - Effort: Medium

2. **TaskShow uses useShowContext without ShowBase**
   - File: TaskShow.tsx
   - Impact: Missing standard context provider wrapper
   - Fix: Wrap with ShowBase
   - Effort: Low

3. **Inconsistent Inputs.tsx patterns**
   - Files: TaskInputs.tsx (TabbedFormInputs), ActivitySinglePage.tsx (root directory)
   - Impact: Different form organization approaches
   - Fix: Standardize on FormErrorSummary + CompactForm pattern
   - Effort: Medium

### P3 - Low (Nice to Have)

1. **contacts/ContactCreate uses useSmartDefaults hook**
   - Abstracts identity access, may be over-engineered
   - Consider standardizing to direct useGetIdentity pattern

2. **contacts/ContactCreate transform adds metadata**
   - first_seen, last_seen, tags added in transform
   - Consider if this should be in data provider instead

3. **tasks/TaskCreate uses mode='onBlur'**
   - Different from implicit onSubmit mode elsewhere
   - Document or standardize form mode usage

---

## Recommendations

### 1. Immediate Actions (This Sprint)

| Action | Effort | Impact |
|--------|--------|--------|
| Add useQueryClient cache invalidation to ContactEdit, OrganizationEdit, TaskEdit | 2 hours | High - fixes stale cache bug |

### 2. Short-term (Next Sprint)

| Action | Effort | Impact |
|--------|--------|--------|
| Extract resource.tsx from organizations/index.tsx | 1 hour | Medium - consistency |
| Extract resource.tsx from activities/index.tsx | 1 hour | Medium - consistency |
| Document activities inline-editing decision in ADR | 30 min | Medium - clarity |

### 3. Medium-term (Backlog)

| Action | Effort | Impact |
|--------|--------|--------|
| Refactor TaskEdit to use EditBase pattern | 4 hours | Medium - consistency |
| Refactor TaskShow to use ShowBase wrapper | 2 hours | Low - consistency |
| Standardize form mode usage (document or enforce) | 2 hours | Low - clarity |

---

## Appendix: Reference Pattern Summary

The **opportunities/** module serves as the canonical reference pattern:

```
opportunities/
├── index.tsx              # Re-exports from resource.tsx
├── resource.tsx           # Lazy loading + ResourceErrorBoundary + config
├── OpportunityList.tsx    # List + useListContext + StandardListLayout
├── OpportunityCreate.tsx  # CreateBase + Form + schema.partial().parse({})
├── OpportunityEdit.tsx    # EditBase + Form + useQueryClient + cache invalidation
├── OpportunityShow.tsx    # ShowBase + useShowContext + tabs
├── OpportunitySlideOver.tsx # ResourceSlideOver + TabConfig[]
├── forms/
│   └── OpportunityInputs.tsx  # FormErrorSummary + CompactForm
└── hooks/                 # Custom hooks directory
```

**Key patterns to replicate:**
1. Separate index.tsx (re-exports) from resource.tsx (lazy loading)
2. UseQueryClient for cache invalidation in Edit views
3. ShowBase wrapper for Show views
4. ResourceSlideOver with TabConfig[] for slide-overs
5. FormErrorSummary + CompactForm in forms/ directory
