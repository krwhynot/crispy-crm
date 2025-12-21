# Edge Case Audit - Forms & Input

**Agent:** 21 - Edge Case Finder (Forms & Input)
**Date:** 2025-12-21
**Forms Analyzed:** 18
**Edge Cases Tested:** 47

---

## Executive Summary

The Crispy CRM forms demonstrate **strong validation patterns** with comprehensive Zod schemas at the API boundary. Double-submit prevention is well-implemented via `isSubmitting` state in the SaveButton component. However, there are a few edge cases around missing dirty-state warnings and inconsistent max length enforcement at the input level (Zod catches them at submit, but users don't get feedback while typing).

**Critical Edge Cases Found:** 2
**Forms Needing Attention:** 5 of 18

---

## Form Inventory

| Form | Fields | Validation Type | Double-Submit | Dirty Warning | Edge Case Score |
|------|--------|-----------------|---------------|---------------|-----------------|
| OpportunityCreate | 15 | Full Zod (strictObject) | ✅ via SaveButton | ❌ Missing | 85% |
| OpportunityEdit | 15 | Full Zod (strictObject) | ✅ via SaveButton | ❌ Missing | 80% |
| ContactCreate | 12 | Full Zod (strictObject) | ✅ via SaveButton | ✅ window.confirm | 95% |
| ContactEdit | 12 | Full Zod (.partial) | ✅ via SaveButton | ❌ Missing | 80% |
| OrganizationCreate | 25+ | Full Zod (strictObject) | ✅ Custom DuplicateCheckSaveButton | ❌ Missing | 90% |
| OrganizationEdit | 25+ | Full Zod (.partial) | ✅ via SaveButton | ❌ Missing | 80% |
| TaskCreate | 9 | Full Zod (strictObject) | ✅ via SaveButton | ✅ window.confirm | 95% |
| ActivityCreate | 14 | Full Zod (strictObject) | ✅ via FormToolbar | ❌ Missing | 85% |
| NoteCreate | 5 | Full Zod (strictObject) | ✅ type="button" SaveButton | ❌ Missing | 85% |
| ProductCreate | 8 | Full Zod | ✅ via SaveButton | ❌ Missing | 85% |
| ProductDistributorCreate | 6 | Full Zod | ✅ via SaveButton | ❌ Missing | 85% |
| QuickLogForm | 10 | Full Zod | ✅ form.formState.isSubmitting | ❌ N/A (modal) | 90% |
| TagDialog | 3 | react-hook-form | ✅ isSubmitting state | ✅ isDirty check | 95% |
| CloseOpportunityModal | 4 | Full Zod (refine) | ✅ isSubmitting prop | ❌ N/A (modal) | 90% |
| SalesEdit | 5 | Full Zod | ✅ via SaveButton | ❌ Missing | 80% |
| ActivityNoteForm | 5 | Full Zod | ✅ isSubmitting state | ❌ Missing | 85% |
| QuickAddOpportunity | 5 | quickCreateOpportunitySchema | ✅ via Kanban | ❌ N/A (quick-add) | 85% |
| SnoozePopover | 2 | Manual validation | ✅ isSubmitting state | ❌ N/A (popover) | 90% |

---

## Empty/Null Input Edge Cases

### Handled Empty States (Good Patterns)
| Form | Field | Schema Handling |
|------|-------|-----------------|
| Opportunity | name | `z.string().min(1, "required")` |
| Contact | first_name/last_name | superRefine requires at least one |
| Organization | name | `z.string().min(1, "required")` |
| Task | title | `z.string().min(1, "required")` |
| Activity | subject | `z.string().min(1, "required")` |
| Note | text | `z.string().min(1, "required")` |

### Potential Empty State Issues
| Form | Field | Current | Risk | Recommendation |
|------|-------|---------|------|----------------|
| Contact | email array | Empty array allowed | User might expect validation | Handled via superRefine for create |
| Opportunity | contact_ids | Empty array blocked on update | ✅ Intentional per PRD | N/A |

### Whitespace-Only Handling
| Field | Trims Whitespace? | Evidence |
|-------|-------------------|----------|
| opportunity.name | ❌ Not trimmed | No `.trim()` in schema |
| contact.first_name | ❌ Not trimmed | No `.trim()` in schema |
| organization.name | ✅ Trimmed in DuplicateCheckSaveButton | `name?.trim()` line 67 |

**Issue:** Most string fields don't trim whitespace, which could allow "   " as valid input.

---

## Maximum Length Edge Cases

### Fields WITH Max Length Constraints (Good)
| Schema | Field | Max | Enforced At |
|--------|-------|-----|-------------|
| Opportunity | name | 255 | Zod |
| Opportunity | description | 2000 | Zod |
| Opportunity | notes | 5000 | Zod |
| Opportunity | campaign | 100 | Zod |
| Opportunity | next_action | 500 | Zod |
| Opportunity | decision_criteria | 2000 | Zod |
| Opportunity | close_reason_notes | 500 | Zod |
| Contact | name | 255 | Zod |
| Contact | first_name | 100 | Zod |
| Contact | last_name | 100 | Zod |
| Contact | title | 100 | Zod |
| Contact | notes | 5000 | Zod |
| Contact | email.value | 254 | Zod |
| Contact | phone.value | 30 | Zod |
| Organization | name | 255 | Zod |
| Organization | description | 5000 | Zod |
| Organization | phone | 30 | Zod |
| Organization | address | 500 | Zod |
| Task | title | 500 | Zod |
| Task | description | 2000 | Zod |
| Activity | subject | 255 | Zod |
| Activity | description | 5000 | Zod |
| Note | text | 10000 | Zod |

### Missing Max Length Constraints
| Schema | Field | Current | Risk | Recommended |
|--------|-------|---------|------|-------------|
| Opportunity | tags (array) | 20 items max, 50 chars per tag | ✅ Good | N/A |
| Activity | attachments | Array max 20, url max 2048 | ✅ Good | N/A |

### Input-Level vs Zod-Level Enforcement
**Issue:** Max lengths are enforced at Zod level (submit time) but NOT at input level (typing time).

| Component | Has maxLength attr? | Impact |
|-----------|---------------------|--------|
| TextInput | ❌ No | Users can type beyond limit, error only on submit |
| Textarea | ❌ No | Same issue |

**UX Impact:** Users don't get real-time feedback when approaching character limits.

---

## Special Character Edge Cases

### XSS Protection Status
| Location | Risk | Mitigation |
|----------|------|------------|
| description fields | Low | `sanitizeHtml()` via DOMPurify in Zod transform |
| notes fields | Low | `sanitizeHtml()` via DOMPurify in Zod transform |
| decision_criteria | Low | `sanitizeHtml()` via DOMPurify in Zod transform |
| close_reason_notes | Low | `sanitizeHtml()` via DOMPurify in Zod transform |
| name fields | None needed | Plain text display, not rendered as HTML |

### dangerouslySetInnerHTML Usage
**Found:** 1 file - `src/atomic-crm/filters/__tests__/FilterChipBar.test.tsx` (test only)
**Risk:** None - test file only

### SQL Injection Protection
All queries go through Supabase client with parameterized queries. No raw SQL construction observed in form handlers.

### Unicode Handling
| Input Type | Emoji Support | RTL Support |
|------------|---------------|-------------|
| Text fields | ✅ Works (no filtering) | ⚠️ No explicit handling |
| LinkedIn URL | ✅ URL validation | N/A |

---

## Paste/Autofill Edge Cases

### Paste Behavior
| Scenario | Current Behavior | Risk |
|----------|-----------------|------|
| Paste beyond max length | Accepted (error on submit) | UX friction |
| Paste multi-line into single-line | Accepted | May break for certain fields |
| Paste with formatting | Stripped by sanitizeHtml | ✅ Safe |

### Autocomplete Attributes
| Form | autocomplete Attrs | Issue |
|------|-------------------|-------|
| ContactCreate | ❌ Not set | Browser autofill may populate wrong fields |
| OrganizationCreate | ❌ Not set | Same issue |
| All forms | ❌ Not standardized | No consistent pattern |

---

## Form State Edge Cases

### Double-Submit Prevention
| Form | Method | Status |
|------|--------|--------|
| All forms using SaveButton | `disabled={isSubmitting}` + `disabled` class | ✅ Protected |
| QuickLogForm | `form.formState.isSubmitting` | ✅ Protected |
| TagDialog | `isSubmitting` state | ✅ Protected |
| CloseOpportunityModal | `isSubmitting` prop | ✅ Protected |
| ActivityNoteForm | `isSubmitting` from useForm | ✅ Protected |
| SnoozePopover | `isSubmitting` useState | ✅ Protected |

**Result:** All forms have double-submit prevention ✅

### Dirty State / Unsaved Changes Warning
| Form | Has Warning? | Implementation |
|------|--------------|----------------|
| ContactCreate | ✅ Yes | `window.confirm` on cancel |
| TaskCreate | ✅ Yes | `window.confirm` on cancel |
| TagDialog | ✅ Yes | `isDirty` check before close |
| OpportunityCreate | ❌ No | Missing |
| OrganizationCreate | ❌ No | Missing |
| ActivityCreate | ❌ No | Missing |
| NoteCreate | ❌ N/A | Inline form, no navigation |
| ProductCreate | ❌ No | Missing |
| SalesEdit | ❌ No | Missing |

**Issue:** 5 major forms lack unsaved changes warnings.

### Error Recovery
| Form | Errors Clear on Fix? | Can Retry After Error? |
|------|----------------------|------------------------|
| All forms | ✅ Yes (react-hook-form default) | ✅ Yes |

---

## Select/Dropdown Edge Cases

### ReferenceInput Loading States
| Select | Has Loading Indicator? | Has Empty Option? | Has Error State? |
|--------|------------------------|-------------------|------------------|
| customer_organization_id | ✅ AutocompleteInput default | ✅ Clearable | ⚠️ Implicit |
| principal_organization_id | ✅ AutocompleteInput default | ✅ Clearable | ⚠️ Implicit |
| distributor_organization_id | ✅ AutocompleteInput default | ✅ Optional | ⚠️ Implicit |
| contact_id | ✅ AutocompleteInput default | ✅ Optional | ⚠️ Implicit |
| sales_id | ✅ AutocompleteInput default | ❌ Required | ⚠️ Implicit |
| opportunity_id | ✅ AutocompleteInput default | ✅ Optional | ⚠️ Implicit |

### Large Dataset Handling
| Select | Expected Count | Virtualized? | Searchable? |
|--------|----------------|--------------|-------------|
| contacts_summary | 100+ | ❌ No | ✅ Yes (Autocomplete) |
| organizations | 100+ | ❌ No | ✅ Yes (Autocomplete) |
| opportunities | 100+ | ❌ No | ✅ Yes (Autocomplete) |

**Potential Issue:** Large datasets without virtualization could cause performance issues.

### SelectInput Choices
| Select | Has Default? | Handles Empty? |
|--------|--------------|----------------|
| priority (Opportunity) | ✅ "medium" | ✅ via default |
| stage (Opportunity) | ✅ "new_lead" | ✅ via default |
| type (Task) | ✅ "Call" | ✅ via default |
| priority (Task) | ✅ "medium" | ✅ via default |

---

## Date Input Edge Cases

### Date Field Inventory
| Form | Field | Required? | Default | Min/Max Validation |
|------|-------|-----------|---------|-------------------|
| Opportunity | estimated_close_date | ✅ Yes | +30 days | ❌ None |
| Opportunity | next_action_date | ❌ No | null | ❌ None |
| Task | due_date | ✅ Yes | today | ❌ None |
| Task | reminder_date | ❌ No | null | ❌ None |
| Task | snooze_until | ❌ No | null | ❌ None |
| Activity | activity_date | ✅ Yes | today | ❌ None |
| Activity | follow_up_date | ❌ No | null | ❌ None |
| Note | date | ✅ Yes | now | ❌ None |
| ProductDistributor | valid_from | ❌ No | null | ❌ None |
| ProductDistributor | valid_to | ❌ No | null | ❌ None |

### Date Boundary Handling
| Scenario | Current Behavior | Risk |
|----------|-----------------|------|
| Far future (year 2100) | ✅ Accepted | Low - intentional |
| Far past (year 1900) | ⚠️ Accepted | Could be data entry error |
| Invalid date (Feb 30) | ✅ Browser rejects | HTML5 date input |
| Timezone handling | Uses `z.coerce.date()` | Converts to Date object |

### Date Input Format
All date inputs use `type="date"` or `type="datetime-local"` HTML5 inputs:
- Browser-native date picker
- Format handled by browser locale
- No custom date picker components

**Issue:** No minimum date validation (could allow past dates where inappropriate).

---

## Accessibility Edge Cases

### Form Accessibility Status
| Pattern | Implementation | Status |
|---------|----------------|--------|
| aria-invalid on errors | ✅ FormControl component | ✅ Good |
| aria-describedby for errors | ✅ FormControl links to FormError | ✅ Good |
| role="alert" on errors | ✅ FormError component | ✅ Good |
| aria-required | ⚠️ Not consistently set | Needs improvement |
| Labels for all inputs | ✅ FormLabel component | ✅ Good |

### Touch Targets
| Component | Size | Meets 44px? |
|-----------|------|-------------|
| SaveButton | Default Button | ✅ h-11 (44px) |
| Cancel Button | Default Button | ✅ h-11 (44px) |
| Form inputs | Default Input | ✅ h-11 (44px) |

---

## Priority Fixes

### P1 - Critical (Data Integrity)
1. **Add whitespace trimming to required string fields** - Fields like `name` should not accept whitespace-only values
   - Files: All validation schemas
   - Fix: Add `.trim()` before `.min(1)` constraints

2. **Add min date validation for due dates** - Prevent historical dates where inappropriate
   - Files: `src/atomic-crm/validation/task.ts`, `src/atomic-crm/validation/activities.ts`
   - Fix: Add `.min(new Date())` or appropriate minimum

### P2 - High (UX)
1. **Add unsaved changes warning to major forms**
   - Files: `OpportunityCreate.tsx`, `OrganizationCreate.tsx`, `ActivityCreate.tsx`, `ProductCreate.tsx`, `SalesEdit.tsx`
   - Fix: Add `isDirty` check with `window.confirm` on cancel/navigation

2. **Add maxLength attribute to text inputs**
   - Files: `src/components/admin/text-input.tsx`
   - Fix: Pass `maxLength` from validation schema to input element for real-time feedback

### P3 - Medium
1. **Add autocomplete attributes for better UX**
   - Files: Form components
   - Fix: Add appropriate `autocomplete` attributes (email, name, tel, etc.)

2. **Consider virtualization for large reference selects**
   - Impact: Performance with 100+ records
   - Fix: Implement `react-window` or similar for large datasets

3. **Add aria-required to required fields**
   - Files: `src/components/admin/form/form-primitives.tsx`
   - Fix: Pass `isRequired` to aria attribute

---

## Recommendations

### Immediate Actions
1. **Create shared `trimmedString` Zod helper**
   ```typescript
   const trimmedString = (min?: number, max?: number) =>
     z.string().trim().min(min ?? 0).max(max ?? 255);
   ```

2. **Create form wrapper with dirty state tracking**
   ```typescript
   const FormWithDirtyWarning = ({ children }) => {
     const { isDirty } = useFormState();
     useBeforeUnload(isDirty);
     return children;
   };
   ```

3. **Standardize input maxLength propagation**
   - Extract max length from Zod schema
   - Pass to input component automatically

### Architecture Improvements
1. Consider React Admin's built-in `warnWhenUnsavedChanges` prop for Create/Edit components
2. Add input-level validation mode (`onChange` with debounce) for critical fields
3. Document form validation patterns in ADR

---

## Positive Findings

The codebase demonstrates several excellent patterns:

1. **Zod strictObject usage** - Prevents mass assignment attacks at API boundary
2. **Comprehensive sanitization** - DOMPurify integration for HTML fields
3. **Consistent double-submit prevention** - All forms protected via SaveButton
4. **Schema-derived defaults** - Forms use `.partial().parse({})` per Constitution
5. **Error summary component** - FormErrorSummary provides good error visibility
6. **ARIA accessibility** - Good foundation with aria-invalid, aria-describedby, role="alert"
7. **No direct Supabase imports** - All data flows through unified data provider
