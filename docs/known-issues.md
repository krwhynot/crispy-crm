# Known Issues & Spec Deviations

> **Generated:** 2025-12-22
> **E2E Test Date:** 2025-12-22
> **Total Issues Reviewed:** 16
> **Bugs:** 3 | **Spec Updates Needed:** 9 | **Intentional Deviations:** 4

## Summary

| Disposition | Count | Action Required |
|-------------|-------|-----------------|
| Bug | 3 | Fix in code |
| Spec Outdated | 9 | Update E2E spec expectations |
| Intentional | 4 | Document reasoning only |

---

## Bugs (Requires Code Fix)

### #13 - Debug Panel Visible in Production
- **Severity:** HIGH
- **Location:** `#/opportunities` (Kanban board)
- **Code:** `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx:456-476`
- **Problem:** A debug banner displays internal diagnostic data to all users:
  - Total opportunities from API
  - Stage grouping counts
  - Collapsed state preferences
  - Stage mismatch warnings
- **Evidence:** Code comment says "Remove after fixing issue" but banner remains
- **Fix:** Remove debug banner entirely OR gate behind admin-only feature flag
- **Priority:** CRITICAL - exposes implementation details to end users

### #3 - Pagination Template Bug
- **Severity:** Medium
- **Location:** `#/organizations` with empty results
- **Code:** `src/components/admin/list-pagination.tsx:109-118`
- **Problem:** When result count is 0, raw template placeholders `%{from}-%{to}` display instead of proper empty state
- **Root Cause:** React Admin's `<Translate>` component with `allowMissing:true` in i18nProvider causes fallback to raw template strings
- **Fix:** Add conditional rendering to hide pagination text when `total === 0`

### #8 - Validation Error Message Not Displayed
- **Severity:** Medium
- **Location:** `#/organizations/create` on form submission
- **Code:** `src/atomic-crm/organizations/OrganizationInputs.tsx:22-33`
- **Problem:** When validation fails, no visible error feedback appears
- **Evidence:** FormErrorSummary component exists with proper ARIA attributes, but may not be receiving error state
- **Fix:** Debug FormErrorSummary component; verify error state propagation from Zod validation

---

## Spec Updates Needed

### #1, #6, #9, #15 - Page Titles (All Resources)
- **Pattern:** All list pages intentionally use **breadcrumb navigation** instead of h1 page titles
- **Code Evidence:**
  - `OrganizationList.tsx:243` - `title={false}`
  - `ContactList.tsx:52` - `title={false}`
  - `OpportunityList.tsx:69` - `title={false}` with comment: "Breadcrumb is handled by List wrapper"
  - `ActivityList.tsx:60` - `title={false}`
- **Reasoning:** Breadcrumbs provide hierarchical context (Home > Organizations) in a more space-efficient format, aligned with iPad-first design
- **Spec Update:** Remove expectations for h1/page titles; add assertions for breadcrumb navigation

### #7 - Save Button Label
- **Expected (spec):** "Save" button
- **Actual (code):** "Create Organization" button
- **Code:** `src/atomic-crm/organizations/OrganizationCreate.tsx:102`
- **Reasoning:** Context-specific labels ("Create X") are better UX than generic "Save" - follows Nielsen Norman Group best practices
- **Spec Update:** Change expectation to "Create [Entity]" pattern

### #4 - Bulk Actions Order
- **Expected (spec):** Delete before Export
- **Actual (code):** Reassign > Export > Delete
- **Code:** `src/atomic-crm/organizations/OrganizationBulkActionsToolbar.tsx:19-23`
- **Reasoning:** Export-before-Delete reduces accidental data loss; follows React Admin conventions
- **Spec Update:** Document actual order as correct; Delete-first would be anti-pattern

### #5 - Checkbox Indeterminate State
- **Expected (spec):** Indeterminate checkbox when partial rows selected
- **Actual (code):** Only checked/unchecked states
- **Code:** `src/components/admin/PremiumDatagrid.tsx:114-121`
- **Reasoning:** React Admin v5.13.0 Datagrid doesn't implement indeterminate by default; would require custom DatagridHeaderCell override
- **Spec Update:** Document as React Admin limitation, not a bug; mark as "not implemented"

### #10 - Column Name
- **Expected (spec):** "Contacts count" column, "Notes" displayed
- **Actual (code):** Column is labeled "Contacts" (not "Contacts count"), NO "Notes" column exists
- **Code:** `src/atomic-crm/organizations/OrganizationList.tsx:202-209`
- **Evidence:** Notes only appear in slide-over tabs, not in list datagrid
- **Spec Update:** Correct spec to match actual columns: Name, Type, Priority, Parent, Contacts, Opportunities

### #14 - Required Fields Count
- **Expected (spec):** 5 required fields
- **Actual (code):** 1 required field (name only)
- **Code:** `src/atomic-crm/validation/organizations.ts:195-197`
- **Evidence:** Zod schema shows only `name` has `.min(1)` constraint; OrganizationCompactForm shows `requiredFields: ['name']`
- **Spec Update:** Change expectation to 1 required field

### #16 - Activity Type Options
- **Expected (spec):** 5 types (Call, Email, Meeting, Sample, Complete)
- **Actual (code):** 13 types, "Complete" is NOT a type
- **Code:** `src/atomic-crm/validation/activities.ts:16-30`
- **Full List:** call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note, sample
- **Key Insight:** "Complete" is an **outcome** (activityOutcomeSchema), not an activity **type**
- **Spec Update:** List all 13 interaction types; clarify type vs outcome distinction

---

## Intentional Deviations (Documented Design Decisions)

### #2 - Filter Sidebar Hidden by Default
- **Behavior:** Collapsed on tablet (<1024px), expanded on desktop (>=1024px)
- **Code:** `src/components/layouts/StandardListLayout.tsx:58-67`
- **Reasoning:** iPad-first responsive design; state persisted to localStorage
- **Trade-off:** Extra tap on tablet, but consistent cross-device experience
- **Decision Date:** Documented in code

### #11 - Missing Breadcrumb on Create Forms
- **Behavior:** Create forms show progress bar instead of breadcrumbs
- **Code:** `src/atomic-crm/organizations/OrganizationCreate.tsx:221-239`
- **Reasoning:** Multi-step form tracking via FormProgressBar provides better UX than static breadcrumbs
- **Pattern:** CreateBase + custom Card layout vs standard Create wrapper

### #12 - Missing Territory Fields
- **Fields:** District Code, Territory
- **Status:** Intentionally NOT in organizations scope
- **Code:** `supabase/migrations/20251103214809_remove_territory_fields.sql`
- **Reasoning:** PRD explicitly states "No Team Hierarchy: Flat structure, no territory or team concepts"
- **Note:** Territory was later added to **contacts** table only (migration 20251215054823)

---

## Action Items

### Immediate (Pre-Launch Critical)

- [ ] **#13** - Remove debug panel from `OpportunityListContent.tsx:456-476`
- [ ] **#3** - Fix pagination template when `total === 0` in `list-pagination.tsx`
- [ ] **#8** - Debug FormErrorSummary component; ensure validation errors display

### Spec Updates (Documentation)

- [ ] **#1, #6, #9, #15** - Update page title expectations → breadcrumb assertions
- [ ] **#7** - Update button label expectation → "Create [Entity]"
- [ ] **#4** - Document bulk action order: Reassign > Export > Delete
- [ ] **#5** - Document indeterminate checkbox as not implemented (React Admin limitation)
- [ ] **#10** - Correct column expectations (no "Notes" column in list)
- [ ] **#14** - Update required fields count → 1 (name only)
- [ ] **#16** - List all 13 activity types; distinguish type vs outcome

### No Action Required (Documented)

- [x] **#2** - Filter sidebar: intentional responsive design
- [x] **#11** - Create form breadcrumbs: replaced by progress bar
- [x] **#12** - Territory fields: out of MVP scope per PRD

---

## File References

| Issue | Primary File | Line Numbers |
|-------|--------------|--------------|
| #1 | OrganizationList.tsx | 243 |
| #2 | StandardListLayout.tsx | 58-67 |
| #3 | list-pagination.tsx | 109-118 |
| #4 | OrganizationBulkActionsToolbar.tsx | 19-23 |
| #5 | PremiumDatagrid.tsx | 114-121 |
| #6 | ContactList.tsx | 52 |
| #7 | OrganizationCreate.tsx | 102 |
| #8 | OrganizationInputs.tsx | 22-33 |
| #9 | OpportunityList.tsx | 69 |
| #10 | OrganizationList.tsx | 202-209 |
| #11 | OrganizationCreate.tsx | 221-239 |
| #12 | 20251103214809_remove_territory_fields.sql | 1-6 |
| #13 | OpportunityListContent.tsx | 456-476 |
| #14 | organizations.ts (validation) | 195-197 |
| #15 | ActivityList.tsx | 60 |
| #16 | activities.ts (validation) | 16-30 |

---

## Methodology

Each issue was investigated by:
1. Reading the actual source code
2. Checking React Admin component props and patterns
3. Reviewing Zod validation schemas
4. Examining database migrations for design decisions
5. Cross-referencing with PRD requirements where available

All dispositions are evidence-based with specific file:line references.
