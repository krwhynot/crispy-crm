# E2E Spec Updates - December 2025

> **Generated:** 2025-12-22
> **Based on:** `docs/known-issues.md` evidence-based review
> **Status:** Pending implementation

## Summary

Following evidence-based review of E2E test results against actual implementation, **9 specification items** need updating to reflect validated design decisions. These are NOT bugs - the implementation is intentional and correct.

| Issue ID | Category | Change Type |
|----------|----------|-------------|
| #1, #9, #15 | Page Titles | Pattern change: h1 → breadcrumbs |
| #4 | Bulk Actions | Order change: safety-first design |
| #5 | Checkbox State | React Admin limitation documented |
| #6 | Create Page Title | Pattern change: title → progress bar |
| #7 | Save Button | Label change: generic → contextual |
| #10 | Column Name | Data model correction |
| #14 | Required Fields | Count correction: 5 → 1 |
| #16 | Activity Types | Full enumeration: 5 → 13 types |

---

## Detailed Changes

### 1. Page Titles → Breadcrumb Navigation (Issues #1, #9, #15)

**Affected Resources:** Organizations, Contacts, Tasks, Activities

#### Old Spec
```
Page title "[Resource]" displayed at the top (h1 heading)
```

#### New Spec
```
Breadcrumb navigation shown (e.g., "Home > Organizations")
No separate h1 page title - breadcrumbs provide navigation context
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `OrganizationList.tsx` | 243 | `title={false}` |
| `ContactList.tsx` | 52 | `title={false}` |
| `OpportunityList.tsx` | 69 | `title={false}` with comment: "Breadcrumb is handled by List wrapper" |
| `ActivityList.tsx` | 60 | `title={false}` |

#### Rationale
- Breadcrumbs provide hierarchical context (Home > Organizations) more efficiently
- Aligned with iPad-first design principle - saves vertical space
- Consistent pattern across all list views

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

// NEW ASSERTION (add)
await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toContainText('Organizations');
// OR verify breadcrumb structure
await expect(page.locator('[aria-label="breadcrumb"]')).toBeVisible();
```

---

### 2. Bulk Action Button Order (Issue #4)

**Affected Resource:** Organizations (and pattern for all resources)

#### Old Spec
```
Bulk action buttons: "Delete, Reassign"
```

#### New Spec
```
Bulk action buttons appear in this order:
1. Reassign (most common non-destructive action)
2. Export (data portability)
3. Delete (destructive action - always last)
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `OrganizationBulkActionsToolbar.tsx` | 19-23 | `<BulkReassignButton />`, `<BulkExportButton />`, `<BulkDeleteButton />` |

#### Rationale
- **UX Best Practice:** Destructive actions should be placed last to reduce accidental clicks
- **Export Added:** Data portability is a common bulk operation
- **React Admin Convention:** Follows the framework's standard patterns

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(bulkActions.first()).toHaveText('Delete');

// NEW ASSERTION (add)
const bulkButtons = page.locator('[data-testid="bulk-actions"] button');
await expect(bulkButtons.nth(0)).toContainText('Reassign');
await expect(bulkButtons.nth(1)).toContainText('Export');
await expect(bulkButtons.nth(2)).toContainText('Delete');
```

---

### 3. Select All Checkbox Behavior (Issue #5)

**Affected Component:** PremiumDatagrid (all list views)

#### Old Spec
```
"Select all" checkbox shows partial/indeterminate state when some rows selected
```

#### New Spec
```
"Select all" checkbox shows only checked/unchecked states:
- Unchecked: No rows or partial rows selected
- Checked: All visible rows selected

Note: Indeterminate state NOT implemented (React Admin v5.13.0 limitation)
```

#### Code Evidence
| File | Line | Notes |
|------|------|-------|
| `PremiumDatagrid.tsx` | 114-121 | Standard Datagrid - no indeterminate override |

#### Rationale
- React Admin's Datagrid doesn't implement indeterminate state by default
- Would require custom DatagridHeaderCell override
- Not a bug - documented limitation of framework

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(selectAll).toHaveAttribute('data-indeterminate', 'true');

// NEW ASSERTION (add) - or remove assertion entirely
// Checkbox shows unchecked when partial selection
await expect(selectAll).not.toBeChecked();
```

---

### 4. Create Form Page Title → Progress Indicator (Issue #6)

**Affected Resources:** All create forms (Organizations, Contacts, Opportunities)

#### Old Spec
```
Page title indicating "Create new [resource]" displayed
```

#### New Spec
```
Progress indicator showing "X of Y required fields" replaces traditional page title
Breadcrumb navigation provides context (e.g., "Organizations > Create")
FormProgressBar component tracks completion status
```

#### Code Evidence
| File | Line | Component |
|------|------|-----------|
| `OrganizationCreate.tsx` | 221-239 | `<FormProgressBar />` |

#### Rationale
- Multi-step form pattern with progress tracking is more actionable
- Users see completion status at a glance
- Breadcrumbs provide sufficient context for "where am I?"

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(page.getByRole('heading', { name: /create.*organization/i })).toBeVisible();

// NEW ASSERTION (add)
await expect(page.getByText(/\d+ of \d+ required fields/i)).toBeVisible();
await expect(page.locator('[aria-label="breadcrumb"]')).toContainText('Create');
```

---

### 5. Save Button Label (Issue #7)

**Affected Resources:** All create forms

#### Old Spec
```
"Save" button for form submission
```

#### New Spec
```
Context-specific button labels:
- Create forms: "Create [Entity]" (e.g., "Create Organization")
- Edit forms: "Save Changes" (distinguishes from create)
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `OrganizationCreate.tsx` | 102 | `label="Create Organization"` |

#### Rationale
- Context-specific labels improve UX clarity
- Users know exactly what action will occur
- Follows Nielsen Norman Group button labeling best practices

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

// NEW ASSERTION (add)
await expect(page.getByRole('button', { name: /create organization/i })).toBeVisible();
// Generic pattern for any resource:
await expect(page.getByRole('button', { name: /^create /i })).toBeVisible();
```

---

### 6. Column Name Correction (Issue #10)

**Affected Resource:** Organizations list view

#### Old Spec
```
Columns include: "Contacts count" column
"Notes" column displayed
```

#### New Spec
```
Actual columns in OrganizationList:
1. Name
2. Type
3. Priority
4. Parent
5. Contacts (count, NOT "Contacts count")
6. Opportunities (count)

Note: "Notes" column does NOT exist in list view.
Notes are shown in the slide-over detail view only.
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `OrganizationList.tsx` | 202-209 | Column definitions - no Notes column |

#### Rationale
- Notes are detailed content - inappropriate for list summary view
- Notes appear in slide-over tabs for detailed viewing
- Column label is "Contacts" (the count is implicit)

#### Test Update
```typescript
// OLD ASSERTIONS (remove)
await expect(page.getByRole('columnheader', { name: 'Contacts count' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'Notes' })).toBeVisible();

// NEW ASSERTIONS (add)
await expect(page.getByRole('columnheader', { name: 'Contacts' })).toBeVisible();
// Notes column should NOT exist
await expect(page.getByRole('columnheader', { name: 'Notes' })).not.toBeVisible();
```

---

### 7. Required Fields Count (Issue #14)

**Affected Resource:** Organizations (and pattern review for others)

#### Old Spec
```
5 required fields indicated on create form
```

#### New Spec
```
1 required field: name only

Other fields (type, priority, etc.) have defaults or are optional.
Progress indicator shows "X of 1 required fields" pattern.
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `organizations.ts` (validation) | 195-197 | Only `name` has `.min(1)` constraint |
| `OrganizationCompactForm` | - | `requiredFields: ['name']` |

#### Rationale
- Zod schema defines only `name` as truly required
- Other fields have sensible defaults (reducing user friction)
- Simpler forms = faster data entry = better adoption

#### Test Update
```typescript
// OLD ASSERTION (remove)
await expect(page.getByText(/5 required fields/i)).toBeVisible();

// NEW ASSERTION (add)
await expect(page.getByText(/1 required field/i)).toBeVisible();
// Or check for specific required indicator on name field only
await expect(page.getByLabel(/name/i)).toHaveAttribute('required');
```

---

### 8. Activity Type Options (Issue #16)

**Affected Resource:** Activities, Dashboard quick logger

#### Old Spec
```
Activity types: Call, Email, Meeting, Sample, Complete (5 types)
```

#### New Spec
```
13 activity types organized in 3 categories:

**Communication (4):**
- call
- email
- check_in
- social

**Meetings (4):**
- meeting
- demo
- site_visit
- trade_show

**Documentation (5):**
- proposal
- contract_review
- follow_up
- note
- sample

IMPORTANT: "Complete" is an OUTCOME, not an activity TYPE.
See `activityOutcomeSchema` for outcomes.
```

#### Code Evidence
| File | Line | Code |
|------|------|------|
| `activities.ts` (validation) | 16-30 | Full type enumeration |

#### Rationale
- Expanded categorization provides better activity tracking granularity
- Aligns with real sales workflow patterns at MFB
- Type vs Outcome distinction is semantically correct

#### Test Update
```typescript
// OLD ASSERTIONS (remove)
await expect(activityTypeSelect).toContainText('Complete');
const types = ['Call', 'Email', 'Meeting', 'Sample', 'Complete'];

// NEW ASSERTIONS (add)
const types = [
  'call', 'email', 'meeting', 'demo', 'proposal',
  'follow_up', 'trade_show', 'site_visit', 'contract_review',
  'check_in', 'social', 'note', 'sample'
];
// Verify Complete is NOT in type options
await expect(activityTypeSelect).not.toContainText('Complete');
```

---

## Affected E2E Test Files

Based on the spec changes, these test files likely need updates:

| Issue | Probable Test File(s) |
|-------|----------------------|
| #1, #9, #15 | `specs/organizations/organizations-ui-audit.spec.ts`, `specs/contacts/contacts-crud.spec.ts`, `specs/tasks/tasks-crud.spec.ts` |
| #4 | `specs/organizations/organizations-ui-audit.spec.ts` |
| #5 | `design-system/list-layout.spec.ts` |
| #6, #7 | `design-system/create-form.spec.ts`, `specs/forms/organization-form.spec.ts` |
| #10 | `specs/organizations/organizations-ui-audit.spec.ts` |
| #14 | `specs/forms/organization-form.spec.ts` |
| #16 | `specs/forms/activity-form.spec.ts`, `dashboard-v3/quick-logger-kyle-ramsy.spec.ts` |

---

## Verification Checklist

After implementing spec updates, verify:

- [ ] #1 - Organizations page title → breadcrumb assertion
- [ ] #4 - Bulk action order assertion updated
- [ ] #5 - Checkbox indeterminate assertion removed/updated
- [ ] #6 - Create form title → progress indicator assertion
- [ ] #7 - Save button → "Create [Entity]" assertion
- [ ] #9 - Contacts page title → breadcrumb assertion
- [ ] #10 - Column name assertions corrected
- [ ] #14 - Required fields count updated to 1
- [ ] #15 - Tasks page title → breadcrumb assertion
- [ ] #16 - Activity type options assertions updated (13 types)

---

## Cross-Reference

- **Source:** `docs/known-issues.md`
- **Related:** Bugs #3, #8, #13 require CODE fixes (separate from spec updates)
- **Intentional Deviations:** #2, #11, #12 documented in known-issues.md (no action needed)

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | | | Pending |
| Dev Lead | | | Pending |
| Product | | | Pending |
