# E2E Field Validation Test: Contacts

**URL:** http://localhost:5173/#/contacts
**Goal:** Verify all Contact data fields display, accept input, validate, and persist correctly.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)

---

## Test Sequence

### Phase 1: Contact List Validation

- [ ] Navigate to http://localhost:5173/#/contacts
- [ ] Verify columns display: Name, Email, Phone, Organization, Title, Sales Rep
- [ ] Check no "undefined", "null", or empty cells where data should exist
- [ ] Test text filter (search by name)
- [ ] Test organization filter dropdown
- [ ] Verify sorting on Name column
- [ ] Confirm row click opens SlideOver or navigates to edit
- [ ] Screenshot any display issues

### Phase 2: Create Contact Form

- [ ] Click "Create" button
- [ ] Test each field:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| First Name | empty, whitespace-only, >100 chars | "John" | Required error, max length enforced |
| Last Name | empty, whitespace-only, >100 chars | "Smith" | Required error, max length enforced |
| Email (JSONB array) | "notanemail", "test@" | {value: "john@example.com", type: "work"} | Optional - each email has value + type (work/home/other) |
| Phone (JSONB array) | >30 chars per entry | {value: "555-123-4567", type: "work"} | Each phone has value + type (work/home/other), max 30 chars per value |
| Title | >100 chars | "Sales Manager" | Max length enforced |
| Department | >100 chars | "Operations" | Max length enforced |
| Department Type | - | Select from dropdown | Dropdown populates (senior_management, sales_management, district_management, area_sales, sales_specialist, sales_support, procurement) |
| LinkedIn URL | "notaurl", "google.com" | "https://linkedin.com/in/john" | Must be linkedin.com domain |
| Organization | - | Select from dropdown | **REQUIRED** - dropdown populates |
| Sales Rep | - | Select from dropdown | **REQUIRED** - dropdown populates |
| Manager | - | Select from dropdown (optional) | Dropdown shows other contacts |
| Notes | >5000 chars | "Met at trade show" | Max length enforced |
| Avatar | - | Upload image | Image uploads and displays |

- [ ] Submit empty form - verify all required errors show simultaneously
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Verify error messages have `role="alert"` or linked via `aria-describedby`
- [ ] Fill all fields correctly and submit
- [ ] Confirm redirect and new contact appears in list

### Phase 3: Edit Contact Form

- [ ] Open existing contact from list
- [ ] Verify all fields pre-populated correctly
- [ ] Test edit scenarios:
  - [ ] Change first name -> Save -> Reload -> Verify persisted
  - [ ] Add second email to JSONB array -> Save -> Verify persisted
  - [ ] Remove phone entry -> Save -> Verify removed
  - [ ] Change organization -> Save -> Verify new org shows
  - [ ] Clear required field -> Verify error appears on save
- [ ] Test Cancel button doesn't save changes

### Phase 4: Contact SlideOver/Detail View

- [ ] Click contact row to open SlideOver (if applicable)
- [ ] Verify displays: Full name, email(s), phone(s), organization
- [ ] Check related sections:
  - [ ] Organization link is clickable
  - [ ] Manager shows if assigned
  - [ ] Notes display correctly
- [ ] Verify Edit button opens edit form

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable
- [ ] Focus states visible on all inputs and buttons
- [ ] Buttons/clickable areas >= 44px tall (check with dev tools)
- [ ] Error messages readable (not just color-coded)
- [ ] Email/Phone array add/remove buttons accessible

### Phase 6: Edge Cases

- [ ] Create contact with minimum required fields only (first_name, last_name, organization_id, sales_id)
- [ ] Create contact with all fields filled
- [ ] Test contact with multiple emails and phones
- [ ] Search for contact with special characters in name (O'Brien, McDonald's)
- [ ] Test very long text in Notes field (near 5000 char limit)
- [ ] Test circular manager reference prevention (set contact as own manager)

---

## Expected Contact Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| first_name | string | YES | max 100, not empty/whitespace |
| last_name | string | YES | max 100, not empty/whitespace |
| email | JSONB array | NO | valid email format per entry if provided |
| phone | JSONB array | NO | max 30 chars per entry |
| title | string | NO | max 100 |
| department | string | NO | max 100 |
| department_type | enum | NO | senior_management, sales_management, district_management, area_sales, sales_specialist, sales_support, procurement |
| linkedin_url | string | NO | must be linkedin.com domain, max 2048 |
| organization_id | number | YES | valid org FK |
| sales_id | number | YES | valid sales FK |
| manager_id | number | NO | valid contact FK, cannot be self |
| notes | text | NO | max 5000, sanitized HTML |
| avatar | file | NO | image upload |
| district_code | string | NO | max 10 |
| territory_name | string | NO | max 100 |

---

## Report Issues As

```
**Field:** email
**Issue:** No validation error when entering "test@"
**Expected:** Error message "Must be a valid email address"
**Actual:** Form submits, then API returns 400
**Severity:** High - validation should be client-side
```

---

## Success Criteria

- [ ] All required fields enforce validation (first_name, last_name, organization_id, sales_id)
- [ ] JSONB email/phone arrays work correctly (add, remove, edit entries)
- [ ] All fields save and persist correctly
- [ ] List displays all data without errors
- [ ] Accessibility requirements met
- [ ] No console errors during testing
