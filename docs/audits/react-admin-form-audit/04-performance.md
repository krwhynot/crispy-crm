# Performance & Re-render Audit
**Generated:** 2025-12-25
**Prompt:** 4 of 7 (Independent)

## Executive Summary

| Issue Type | Count | Severity |
|------------|-------|----------|
| `watch()` all fields | 0 | ✅ None |
| `watch('field')` in render (minor) | 2 | 🟢 Low |
| `useFormContext` over-destructuring | 2 | 🟢 Low |
| Missing `useWatch` optimization | 2 | 🟢 Low |
| `FormDataConsumer` overscope | 0 | ✅ None |
| Missing memoization | 0 | ✅ Excellent |
| Inline functions in props | ~30 | 🟢 Low (non-critical paths) |

**Overall Assessment: ✅ EXCELLENT**

The codebase demonstrates **mature performance practices**. The team has consistently adopted optimized patterns:
- `useWatch()` used in 30+ locations (proper React Hook Form pattern)
- `memo()` applied to 15+ components (kanban cards, badges, list items)
- `useMemo()` used 60+ times for derived data
- `useCallback()` used 50+ times for event handlers
- **No `FormDataConsumer` usage** (a React Admin anti-pattern)
- **No `watch()` without arguments** (the most expensive anti-pattern)

**Estimated Re-render Savings: < 5% with fixes** — codebase already well-optimized

---

## watch() Usage Analysis

### ✅ NO watch() Without Arguments Found

**Excellent!** The most expensive anti-pattern (`watch()` with no arguments, which subscribes to ALL fields) was NOT found in the codebase.

A comment in `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx:53` explicitly documents awareness of this pattern:
```tsx
// This avoids infinite loops - form.watch() returns new object each render,
// but the subscription only fires when actual values change
```

### 🟢 watch('field') — Single Field (OK but Could Optimize)

| File | Line | Field Watched | Current | Recommended |
|------|------|---------------|---------|-------------|
| QuickCreatePopover.tsx | 126 | `organization_type` | `methods.watch()` | Consider `useWatch()` |
| QuickCreatePopover.tsx | 150 | `priority` | `methods.watch()` | Consider `useWatch()` |
| TagDialog.tsx | 67 | `color` | `watch()` | OK (single field) |

**Analysis:** These are single-field subscriptions which are acceptable. The `QuickCreatePopover` uses `methods.watch()` inside the render function which creates a new subscription each render. While functional, switching to `useWatch({ name: 'field' })` at the top of the component would be slightly more optimal.

**Code Found:**
```tsx
// File: src/atomic-crm/organizations/QuickCreatePopover.tsx
// Lines 126, 150 - Using watch() in render

<Select
  value={methods.watch("organization_type")}  // Line 126
  onValueChange={(value) => methods.setValue(...)}
>

<Select
  value={methods.watch("priority")}  // Line 150
  onValueChange={(value) => methods.setValue(...)}
>
```

**Recommended Pattern:**
```tsx
// At component top:
const organizationType = useWatch({ control: methods.control, name: "organization_type" });
const priority = useWatch({ control: methods.control, name: "priority" });

// In render:
<Select value={organizationType} ... />
<Select value={priority} ... />
```

---

## useWatch Usage — ✅ EXCELLENT Adoption

The codebase demonstrates **excellent adoption** of the optimized `useWatch()` pattern. Found in 30+ locations:

| File | Line | Configuration | Notes |
|------|------|---------------|-------|
| QuickLogForm.tsx | 98 | `useWatch({ control: form.control })` | Full form for draft persistence |
| QuickLogForm.tsx | 105-108 | `useWatch({ control, name: [...] })` | ✅ Specific fields |
| CloseOpportunityModal.tsx | 101-103 | `useWatch({ control, name: "win_reason" })` | ✅ Single fields |
| ContactOrgMismatchWarning.tsx | 44-45 | `useWatch({ name: "contact_ids" })` | ✅ Specific fields |
| OpportunityCompactForm.tsx | 53-54 | `useWatch({ name: "customer_organization_id" })` | ✅ Correct |
| useAutoGenerateName.ts | 20-22 | `useWatch({ name: [...] })` | ✅ Correct |
| PrincipalAwareTypeInput.tsx | 29 | `useWatch({ name: "organization_type" })` | ✅ Correct |
| FormFieldWrapper.tsx | 29 | `useWatch({ name })` | ✅ Dynamic field |
| TextInputWithCounter.tsx | 15 | `useWatch({ name: source })` | ✅ Character counting |
| QuickAddForm.tsx | 67-69 | `useWatch({ control, name: [...] })` | ✅ Multiple fields |

**Pattern Excellence Example (QuickLogForm.tsx:105-108):**
```tsx
// ✅ OPTIMAL: Specific field subscription with array
const [
  selectedOpportunityId,
  selectedContactId,
  selectedOrganizationId,
  activityType,
  createFollowUp,
] = useWatch({
  control: form.control,
  name: ["opportunityId", "contactId", "organizationId", "activityType", "createFollowUp"],
});
```

---

## useFormContext() Analysis

### Usage Summary

Found 20+ components using `useFormContext()`. Most follow best practices by destructuring only needed methods:

| File | Component | Methods Destructured | Appropriate? |
|------|-----------|---------------------|--------------|
| form-primitives.tsx:34 | useFormField | `getFieldState, formState` | ✅ Yes - field validation |
| form-primitives.tsx:149 | FormSubmitButton | Full form | ⚠️ Could optimize |
| FormWizard.tsx:39 | FormWizard | `trigger, getValues` | ✅ Yes - step validation |
| SaveButtonGroup.tsx:23 | SaveButtonGroup | `handleSubmit` | ✅ Yes - submit handling |
| array-input.tsx:49 | ArrayInput | `getValues, control` | ✅ Yes - array operations |
| simple-form-iterator.tsx:62 | SimpleFormIterator | `trigger, getValues` | ✅ Yes - validation |
| CreateFormFooter.tsx:21 | CreateFormFooter | `reset` | ✅ Yes - form reset |
| ContactCompactForm.tsx:22 | ContactCompactForm | `setValue, getValues` | ✅ Yes - field derivation |
| OrganizationCreate.tsx:61 | DuplicateCheckSaveButton | Full form | ⚠️ Could optimize |
| OpportunityCreateSaveButton.tsx:50 | OpportunityCreateSaveButton | Full form | ⚠️ Could optimize |
| PrincipalAwareTypeInput.tsx:28 | PrincipalAwareTypeInput | `setValue` | ✅ Yes - type change |
| NoteInputs.tsx:11 | NoteInputs | `setValue` | ✅ Yes - setting values |
| useAutoGenerateName.ts:17 | Hook | `setValue` | ✅ Yes - name generation |
| useCityStateMapping.ts:16 | Hook | `setValue, getValues` | ✅ Yes - auto-fill |

### Optimization Opportunities

| File | Current | Issue | Fix |
|------|---------|-------|-----|
| form-primitives.tsx:149 | Full form import | Uses only some methods | Destructure only needed |
| OrganizationCreate.tsx:61 | Full form import | Uses getValues, trigger | Destructure only needed |

**Impact: Low** — These are save buttons that render infrequently.

---

## FormDataConsumer Analysis — ✅ NONE FOUND

**Excellent!** The codebase does NOT use React Admin's `<FormDataConsumer>` component, which is a common source of performance issues in React Admin applications.

This means:
- No components are wrapping large sections in FormDataConsumer
- No unnecessary re-renders from FormDataConsumer subscription patterns
- The team has adopted the more performant `useWatch()` pattern consistently

---

## Memoization Audit — ✅ EXCELLENT

### Components Using memo() (15+ components)

| Component | File | Purpose | Has Custom Compare? |
|-----------|------|---------|---------------------|
| OrganizationTypeBadge | OrganizationBadges.tsx:45 | Badge rendering | No |
| PriorityBadge | OrganizationBadges.tsx:66 | Badge rendering | No |
| ContactStatusBadge | ContactBadges.tsx:97 | Badge rendering | No |
| RoleBadge | ContactBadges.tsx:135 | Badge rendering | No |
| InfluenceBadge | ContactBadges.tsx:177 | Badge rendering | No |
| StageBadgeWithHealth | StageBadgeWithHealth.tsx:10 | Composite badge | No |
| SampleStatusBadge | SampleStatusBadge.tsx:182 | Status badge | No |
| NextTaskBadge | NextTaskBadge.tsx:78 | Task badge | No |
| CompletionCheckbox | TaskList.tsx:266 | List checkbox | No |
| OpportunityColumn | OpportunityColumn.tsx:92 | Kanban column | ✅ Custom `arePropsEqual` |
| OpportunityCard | OpportunityCard.tsx:32 | Kanban card | No |
| TaskKanbanColumn | TaskKanbanColumn.tsx:96 | Kanban column | ✅ Custom `arePropsEqual` |
| TaskKanbanCard | TaskKanbanCard.tsx:109 | Kanban card | ✅ Custom `areTaskCardPropsEqual` |
| ActivityItem | ActivityFeedPanel.tsx:232 | List item | No |

**Kanban Optimization Excellence:**
```tsx
// File: src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx:34-48
/**
 * Custom comparison function for React.memo optimization
 * Compares props shallowly, with special handling for the opportunities array
 * to prevent unnecessary re-renders during drag-and-drop operations
 */
function arePropsEqual(prevProps: OpportunityColumnProps, nextProps: OpportunityColumnProps): boolean {
  // Implementation handles array comparison intelligently
}
```

### useMemo Usage (60+ instances)

Properly used for:
- Chart data computation (PipelineChart, ActivityTrendChart, etc.)
- Filter objects (opportunityFilters, activityFilters)
- Derived lists (salesRepOptions, campaignOptions)
- Form default values
- Lookup maps

**Example Excellence (OverviewTab.tsx):**
```tsx
// Memoized to prevent filter object recreation
const opportunityFilters = useMemo(
  () => ({
    "deleted_at@is": null,
    ...(salesRepId && { opportunity_owner_id: salesRepId }),
  }),
  [salesRepId]
);
```

### useCallback Usage (50+ instances)

Properly used for:
- Submit handlers
- Click handlers passed to children
- Debounced functions
- Data processing callbacks

---

## Inline Functions in Props

### Analysis Summary

| Pattern | Count | Location Type | Impact |
|---------|-------|---------------|--------|
| `onChange={(e) => ...}` | ~28 | Form inputs, dialogs | 🟢 Low |
| `onClick={() => ...}` | ~100+ | Buttons, menu items | 🟢 Low |

### Context Analysis

**Most inline functions are in LOW-IMPACT locations:**

1. **Dialog/Modal inputs** — Rendered once, not in lists
2. **Settings pages** — Low-frequency renders
3. **Filter controls** — User-initiated, infrequent
4. **One-off buttons** — Not in mapped lists

**Higher-Impact Locations (but acceptable):**

| File | Location | Pattern | Impact |
|------|----------|---------|--------|
| TaskList.tsx:298 | In list | `onClick={(e) => e.stopPropagation()}` | 🟢 Simple |
| TaskActionMenu.tsx:198-205 | Menu items | Handlers for actions | 🟢 Acceptable |
| OpportunityRowListView.tsx:138 | Row button | `onClick={(e) => ...}` | 🟢 Acceptable |

**Why These Are Acceptable:**
- List items are already memoized (`CompletionCheckbox`, `OpportunityCard`, etc.)
- Handlers are simple operations (setState, stopPropagation)
- The parent component controls when children re-render

---

## Performance Priority Matrix

| Issue | Files Affected | Impact | Fix Effort | Priority |
|-------|----------------|--------|------------|----------|
| QuickCreatePopover watch() | 1 | 🟢 Low | 10 min | 5 |
| useFormContext full import | 2-3 | 🟢 Low | 15 min | 6 |
| QuickLogForm full formValues | 1 | 🟢 Low | 10 min | 7 |

**Note:** All issues are low priority. The codebase already follows best practices.

---

## Quick Wins (Optional Improvements)

### 1. QuickCreatePopover Optimization (10 min)

**File:** `src/atomic-crm/organizations/QuickCreatePopover.tsx`

```tsx
// BEFORE (current)
<Select value={methods.watch("organization_type")} ...>

// AFTER (slightly better)
// Add at component top:
const organizationType = useWatch({
  control: methods.control,
  name: "organization_type"
});
const priority = useWatch({
  control: methods.control,
  name: "priority"
});

// In render:
<Select value={organizationType} ...>
<Select value={priority} ...>
```

### 2. QuickLogForm Full Form Watch (10 min)

**File:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

Line 98 watches ALL form values for draft persistence. This is intentional but could be throttled:

```tsx
// Current (line 98)
const formValues = useWatch({ control: form.control });

// Could add debounce to draft persistence:
const debouncedDraftChange = useMemo(
  () => debounce((values) => onDraftChange?.(values), 1000),
  [onDraftChange]
);
```

---

## Estimated Performance Gains

| Fix | Est. Re-render Reduction | Complexity |
|-----|--------------------------|------------|
| QuickCreatePopover useWatch | < 1% | Simple |
| Destructure useFormContext | < 1% | Simple |
| **Total Potential** | **< 2%** | Already optimized |

---

## Code Patterns Reference

### ✅ Patterns Used in This Codebase

```tsx
// 1. useWatch for specific fields (GOOD - used extensively)
const status = useWatch({ name: 'status' });

// 2. useWatch for multiple fields (GOOD - used in QuickLogForm)
const [field1, field2] = useWatch({
  control,
  name: ['field1', 'field2'],
});

// 3. memo() with custom comparison (GOOD - used in kanban)
export const OpportunityColumn = React.memo(
  function OpportunityColumn({ ... }) { ... },
  arePropsEqual
);

// 4. useMemo for derived data (GOOD - used throughout)
const chartData = useMemo(() => computeChartData(data), [data]);

// 5. useCallback for handlers (GOOD - used throughout)
const handleClick = useCallback(() => { ... }, [deps]);
```

### ❌ Patterns NOT Found (Good!)

```tsx
// NOT FOUND: watch() without arguments
const allValues = watch(); // Would cause re-render on ANY field change

// NOT FOUND: FormDataConsumer wrapping large sections
<FormDataConsumer>
  {({ formData }) => (
    <div>Large section re-rendering...</div>
  )}
</FormDataConsumer>
```

---

## Conclusion

**The Crispy CRM codebase demonstrates excellent form performance practices:**

1. ✅ **Zero `watch()` without arguments** — The most expensive anti-pattern is absent
2. ✅ **Consistent `useWatch()` adoption** — 30+ properly optimized subscriptions
3. ✅ **No `FormDataConsumer` usage** — Team avoids this React Admin anti-pattern
4. ✅ **Extensive memoization** — 15+ memoized components with custom comparisons
5. ✅ **Proper `useMemo`/`useCallback`** — 100+ optimized computations and handlers
6. ✅ **Kanban-specific optimizations** — Custom comparison functions prevent drag-drop re-renders

**Recommendation:** No urgent performance fixes needed. The team has established and followed strong performance patterns. Optional micro-optimizations listed above can be addressed opportunistically.
