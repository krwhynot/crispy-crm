# Implementation Plan

**Generated:** 2025-12-17

---

## Quick Reference Checklist

### Pre-Beta (13 tasks)

**ARIA Accessibility**
- [ ] Add `aria-describedby` to form fields with validation errors
- [ ] Add `role="alert"` to all error messages

**CollapsibleSection Migration**
- [ ] OpportunityCompactForm.tsx - Replace 3 instances
- [ ] OrganizationHierarchySection.tsx - Replace wrapper
- [ ] OrganizationAddressSection.tsx - Replace wrapper

**Focus Management**
- [ ] FormErrorSummary.tsx:171 - Add `focus-visible:ring`

**Verification**
- [ ] Run E2E touch target tests
- [ ] Run gap spacing verification
- [ ] Manual: File upload for organization notes
- [ ] Manual: Week-over-week trend accuracy
- [ ] Manual: Gap-2 minimum spacing

### Post-Beta (6 tasks)

**Component Cleanup**
- [ ] Remove CollapsibleSection component
- [ ] Remove CollapsibleSection export from index.ts
- [ ] Remove/update CollapsibleSection tests
- [ ] Remove ProductDistributionTab placeholder

**Test Coverage**
- [ ] Add database schema verification tests

**Documentation**
- [ ] Archive 22 files to docs/archive/2025-12-17/

---

## Immediate Priority (Before Beta)

### 1. ARIA Accessibility Attributes

**Effort:** MEDIUM | **Priority:** HIGH | **Files:** Form components across codebase

**Context:** WCAG 2.1 AA compliance requires assistive technology support. Currently missing critical ARIA attributes.

**Tasks:**

- [ ] Add `aria-describedby` to all form fields with validation errors
  - Links input to error message element
  - Format: `aria-describedby="error-{fieldName}"`
  - Files to check: All components using `TextInput`, `SelectInput`, `DateInput`, etc.

- [ ] Add `role="alert"` to all error messages
  - Triggers screen reader announcements
  - Apply to error text containers
  - Files to check: Form validation error displays

**Verification:**

- Run E2E accessibility tests
- Manual screen reader testing (NVDA/JAWS)
- Check against existing E2E test: `tests/e2e/specs/accessibility.spec.ts`

---

### 2. CollapsibleSection Migration

**Effort:** LOW-MEDIUM | **Priority:** HIGH | **Blocking:** Component cleanup

**Context:** Migrating from deprecated `CollapsibleSection` to `FormSection` component. 7 instances remaining.

**Tasks:**

- [ ] **OpportunityCompactForm.tsx** - Replace 3 CollapsibleSection instances
  - Line 11: Remove CollapsibleSection import
  - Replace with FormSection headers
  - Maintain existing field groupings
  - File: `src/atomic-crm/opportunities/OpportunityCompactForm.tsx`

- [ ] **OrganizationHierarchySection.tsx** - Replace wrapper
  - Remove CollapsibleSection wrapper
  - Use FormSection instead
  - File: `src/atomic-crm/organizations/sections/OrganizationHierarchySection.tsx`

- [ ] **OrganizationAddressSection.tsx** - Replace wrapper
  - Remove CollapsibleSection wrapper
  - Use FormSection instead
  - File: `src/atomic-crm/organizations/sections/OrganizationAddressSection.tsx`

**Verification:**

- Run existing tests for affected components
- Manual UI testing for form rendering
- Verify no CollapsibleSection imports remain

---

### 3. Focus Management Fix

**Effort:** LOW | **Priority:** MEDIUM | **Files:** 1

**Context:** Focus indicators are critical for keyboard navigation. One violation found.

**Tasks:**

- [ ] **FormErrorSummary.tsx:171** - Add `focus-visible:ring`
  - Currently has `focus:outline-none` without corresponding ring
  - File: `src/components/admin/form/FormErrorSummary.tsx`

**Verification:**

- Tab through form with keyboard
- Verify visible focus indicator appears
- Check E2E test: `tests/e2e/specs/accessibility.spec.ts`

---

## Before Beta Release

### 4. Touch Target Verification

**Effort:** HIGH | **Priority:** MEDIUM | **Scope:** Site-wide

**Context:** WCAG 2.1 AA requires 44x44px minimum touch targets. Some instances found but needs systematic verification.

**Tasks:**

- [ ] Run E2E touch target tests
  - Test file: `tests/e2e/specs/touch-targets.spec.ts`
  - Expected: All interactive elements pass 44px minimum

- [ ] Fix any failing tests
  - Apply `h-11 w-11` classes (44px = 2.75rem)
  - Check icon buttons, action buttons, close buttons

- [ ] Manual spot-check critical flows
  - Opportunity creation form
  - Organization slide-over
  - Dashboard filters

**Known Good Examples:**

- `src/atomic-crm/organizations/ActivitiesTab.tsx:51` - Button with `h-11`

---

### 5. Gap Spacing Verification

**Effort:** MEDIUM | **Priority:** MEDIUM | **Scope:** Site-wide

**Context:** Preventing accidental clicks requires minimum spacing between interactive elements.

**Tasks:**

- [ ] Verify `gap-2` minimum between clickable elements
  - Search for `gap-1` or `gap-0` in button groups
  - Check action bars, toolbars, button clusters

- [ ] Manual spot-check
  - DataGrid action columns
  - Form button groups (Save/Cancel)
  - Slide-over headers

**Verification:**

- Visual inspection at 1440px and iPad (1024px)
- Test tap accuracy on iPad

---

### 6. Manual Testing

**Effort:** MEDIUM | **Priority:** HIGH | **Verification Required**

**Tasks:**

- [ ] **File upload for organization notes**
  - Navigate to Organization → Notes tab
  - Attempt to attach file to note
  - Verify upload succeeds and file displays
  - No automated test coverage exists

- [ ] **Week-over-week trend accuracy**
  - Check Dashboard metrics
  - Verify trend calculations match raw data
  - Compare against SQL query results
  - Test file exists: `tests/e2e/specs/dashboard.spec.ts` (may not cover trends)

- [ ] **Gap-2 minimum verification**
  - See Gap Spacing Verification above

---

## Post-Beta (Technical Debt)

### 7. Component Cleanup

**Effort:** LOW | **Priority:** LOW | **Dependencies:** CollapsibleSection migration complete

**Tasks:**

- [ ] Remove CollapsibleSection component
  - File: `src/components/admin/form/CollapsibleSection.tsx`
  - Verify no imports remain (search codebase)

- [ ] Remove export from index.ts
  - File: `src/components/admin/form/index.ts`
  - Remove CollapsibleSection from exports

- [ ] Remove/update tests
  - File: `src/components/admin/form/__tests__/CollapsibleSection.test.tsx`
  - Either remove or convert to FormSection tests

- [ ] Remove ProductDistributionTab placeholder
  - File: `src/atomic-crm/products/ProductDistributionTab.tsx`
  - Remove placeholder text: "Additional distribution settings will appear here"

**Verification:**

- Codebase search: No references to CollapsibleSection
- All tests pass
- No console errors

---

### 8. Test Coverage Improvements

**Effort:** HIGH | **Priority:** LOW | **Post-Beta**

**Context:** Gaps identified in automated testing coverage.

**Tasks:**

- [ ] Add database schema verification tests
  - Verify soft-delete columns exist on all required tables
  - Verify indexes exist (tasks.sales_id, activities.opportunity_id, etc.)
  - Verify RLS policies are present
  - Test framework: Vitest + Supabase test client

- [ ] Add performance benchmarks for form completion
  - Measure time to complete Opportunity create form
  - Measure time to complete Organization create form
  - Set baseline metrics for regression testing
  - Tool: Playwright performance API

- [ ] Add screen reader announcement tests
  - Verify `role="alert"` triggers announcements
  - Verify `aria-live` regions work correctly
  - Tool: axe-core or similar

**Verification:**

- Tests run in CI/CD
- Baseline metrics documented
- Coverage metrics improve

---

### 9. Documentation Cleanup

**Effort:** MEDIUM | **Priority:** LOW | **Post-Beta**

**Context:** 22 files identified for archival to reduce maintenance burden.

**Tasks:**

- [ ] Create archive directory
  - Path: `docs/archive/2025-12-17/`

- [ ] Move 22 ARCHIVE files
  - RBAC research/inventory files (6 files)
  - Historical diagnostics (3 files)
  - Temp audit files (4 files)
  - Duplicate files (3 files)
  - See AUDIT-REPORT.md for full list

- [ ] Update any references
  - Search for links to archived files
  - Update or remove as appropriate

**Verification:**

- No broken links in active documentation
- Archive directory clearly labeled
- Git history preserved

---

## Task Dependencies

```
CollapsibleSection Migration (Task 2)
  ├─> Component Cleanup (Task 7)
  └─> Documentation Cleanup (Task 9)

ARIA Accessibility (Task 1)
  └─> Manual Testing (Task 6)

Touch Target Verification (Task 4)
  └─> Manual Testing (Task 6)

All Beta Tasks (1-6)
  └─> Post-Beta Tasks (7-9)
```

---

## Effort Estimates

| Task | Effort | Priority | Blocking? |
|------|--------|----------|-----------|
| 1. ARIA Accessibility | MEDIUM | HIGH | No |
| 2. CollapsibleSection Migration | LOW-MEDIUM | HIGH | Yes (Task 7) |
| 3. Focus Management Fix | LOW | MEDIUM | No |
| 4. Touch Target Verification | HIGH | MEDIUM | No |
| 5. Gap Spacing Verification | MEDIUM | MEDIUM | No |
| 6. Manual Testing | MEDIUM | HIGH | No |
| 7. Component Cleanup | LOW | LOW | No |
| 8. Test Coverage | HIGH | LOW | No |
| 9. Documentation Cleanup | MEDIUM | LOW | No |

**Total Effort (Pre-Beta):** ~2-3 days
**Total Effort (Post-Beta):** ~3-4 days

---

## Success Criteria

### Pre-Beta

- ✅ All E2E accessibility tests pass
- ✅ No CollapsibleSection imports in form components
- ✅ Manual testing confirms file upload works
- ✅ Manual testing confirms trend accuracy
- ✅ Focus indicators visible on all interactive elements

### Post-Beta

- ✅ CollapsibleSection component removed
- ✅ Test coverage >70%
- ✅ Performance benchmarks established
- ✅ 22 files archived successfully

---

## Risk Mitigation

### Risk: Accessibility changes break existing functionality

**Mitigation:**
- Run full E2E test suite after changes
- Manual regression testing of critical flows
- Incremental changes with git commits per file

### Risk: CollapsibleSection migration introduces UI regressions

**Mitigation:**
- Side-by-side visual comparison before/after
- Test all form sections manually
- Revert capability via git

### Risk: Manual testing uncovers major bugs

**Mitigation:**
- Schedule manual testing early in sprint
- Allocate buffer time for fixes
- Prioritize critical path testing first

---

**Next Steps:**

1. Assign tasks to sprint/team members
2. Create tracking tickets for each task
3. Schedule manual testing session
4. Execute tasks in dependency order
5. Update this plan as tasks complete
