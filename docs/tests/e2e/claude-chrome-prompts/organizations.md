# E2E Field Validation Test: Organizations

**URL:** http://localhost:5173/#/organizations
**Goal:** Verify all Organization data fields display, accept input, validate, and persist correctly.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)

---

## Test Sequence

### Phase 1: Organization List Validation

- [ ] Navigate to http://localhost:5173/#/organizations
- [ ] Verify columns display: Name, Type, Priority, Status, City, State
- [ ] Check no "undefined", "null", or empty cells where data should exist
- [ ] Test text filter (search by name)
- [ ] Test organization type filter (customer, prospect, principal, distributor)
- [ ] Test priority filter (A, B, C, D)
- [ ] Test status filter (active, inactive)
- [ ] Verify sorting on Name column
- [ ] Confirm row click opens SlideOver or navigates to edit
- [ ] Screenshot any display issues

### Phase 2: Create Organization Form

- [ ] Click "Create" button
- [ ] Test each field:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Name | empty, >255 chars | "Acme Corp" | **REQUIRED**, max length enforced |
| Organization Type | - | Select "prospect" | Dropdown: prospect, customer, principal, distributor |
| Priority | - | Select "B" | Dropdown: A, B, C, D (default C) |
| Status | - | Select "active" | Dropdown: active, inactive |
| Status Reason | - | Select option | Conditional on status |
| Org Scope | - | Select "regional" | Dropdown: national, regional, local |
| Website | "notaurl" | "acme.com" | Auto-prefixes https://, validates URL |
| LinkedIn URL | "google.com" | "linkedin.com/company/acme" | Must be linkedin.com, auto-prefixes https:// |
| Phone | >30 chars | "555-123-4567" | Max length enforced |
| Email | "notanemail" | "info@acme.com" | Valid email format |
| Address | >500 chars | "123 Main St" | Max length enforced |
| City | >100 chars | "Chicago" | Max length enforced |
| State | >100 chars | "IL" | Max length enforced |
| Postal Code | >20 chars | "60601" | Max length enforced |
| Segment | - | Select from dropdown | UUID reference to segments table |
| Sales Rep | - | Select from dropdown | Optional assignment |
| Parent Organization | - | Select from dropdown | Hierarchy support |
| Description | >5000 chars | "Leading supplier..." | Max length, HTML sanitized |
| Notes | >5000 chars | "Internal notes..." | Max length, HTML sanitized |
| Employee Count | negative, non-integer | "500" | Positive integer |
| Founded Year | 1799, 2030 | "1985" | 1800 - current year |
| Tax Identifier | >50 chars | "12-3456789" | Max length enforced |

**Billing Address Fields:**
| Field | Validation |
|-------|------------|
| billing_street | max 255 |
| billing_city | max 100 |
| billing_state | max 2 (state code) |
| billing_postal_code | max 20 |
| billing_country | max 2 (default "US") |

**Shipping Address Fields:**
| Field | Validation |
|-------|------------|
| shipping_street | max 255 |
| shipping_city | max 100 |
| shipping_state | max 2 |
| shipping_postal_code | max 20 |
| shipping_country | max 2 (default "US") |

**Payment Fields:**
| Field | Test |
|-------|------|
| payment_terms | net_30, net_60, net_90, cod, prepaid, 2_10_net_30 |
| credit_limit | Non-negative number |
| territory | max 100 |

- [ ] Submit empty form - verify name is required
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Fill all fields correctly and submit
- [ ] Confirm redirect and new organization appears in list

### Phase 3: Edit Organization Form

- [ ] Open existing organization from list
- [ ] Verify all fields pre-populated correctly
- [ ] Test edit scenarios:
  - [ ] Change name -> Save -> Reload -> Verify persisted
  - [ ] Change type from prospect to customer -> Save -> Verify
  - [ ] Update priority -> Save -> Verify
  - [ ] Clear optional fields -> Save -> Verify cleared
  - [ ] Change parent organization -> Verify hierarchy updates
- [ ] Test Cancel button doesn't save changes

### Phase 4: Organization SlideOver/Detail View

- [ ] Click organization row to open SlideOver
- [ ] Verify displays: Name, type badge, priority badge, status
- [ ] Check related sections:
  - [ ] Contact count displays (nb_contacts)
  - [ ] Opportunity count displays (nb_opportunities)
  - [ ] Notes count displays (nb_notes)
  - [ ] Parent org link clickable (if set)
- [ ] Verify Edit button opens edit form

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable
- [ ] Focus states visible on all inputs and buttons
- [ ] Buttons/clickable areas >= 44px tall
- [ ] Error messages readable (not just color-coded)
- [ ] Dropdown menus keyboard accessible
- [ ] Address sections properly grouped

### Phase 6: Edge Cases

- [ ] Create organization with only name (minimum required)
- [ ] Create organization with all fields filled
- [ ] Test each organization type:
  - [ ] prospect (default, 80% of new orgs)
  - [ ] customer
  - [ ] principal (manufacturer)
  - [ ] distributor
- [ ] Test URL auto-prefix: enter "acme.com" -> should become "https://acme.com"
- [ ] Test LinkedIn URL validation: enter "facebook.com" -> should reject
- [ ] Create child organization with parent
- [ ] Search for org with special characters (O'Malley's, McDonald's)

---

## Expected Organization Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| name | string | YES | min 1, max 255 |
| organization_type | enum | NO | prospect (default), customer, principal, distributor |
| priority | enum | NO | A, B, C (default), D |
| status | enum | NO | active (default), inactive |
| status_reason | enum | NO | active_customer, prospect, authorized_distributor, account_closed, out_of_business, disqualified |
| org_scope | enum | NO | national, regional, local |
| is_operating_entity | boolean | NO | default true |
| website | string | NO | valid URL, max 2048, auto-prefix https:// |
| linkedin_url | string | NO | linkedin.com domain, max 2048 |
| phone | string | NO | max 30 |
| email | string | NO | valid email, max 254 |
| address | string | NO | max 500 |
| city | string | NO | max 100 |
| state | string | NO | max 100 |
| postal_code | string | NO | max 20 |
| segment_id | UUID | NO | FK to segments |
| sales_id | number | NO | FK to sales |
| parent_organization_id | number | NO | FK to organizations |
| description | text | NO | max 5000, sanitized |
| notes | text | NO | max 5000, sanitized |
| employee_count | number | NO | positive integer |
| founded_year | number | NO | 1800 - current year |
| tax_identifier | string | NO | max 50 |
| payment_terms | enum | NO | net_30, net_60, net_90, cod, prepaid, 2_10_net_30 |
| credit_limit | number | NO | non-negative |
| territory | string | NO | max 100 |

**System/Audit Fields (Not UI-Editable):**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| import_session_id | UUID | NO | Tracks import batch (system-only) |
| playbook_category_id | UUID | NO | Internal categorization |
| cuisine | string (max 100) | NO | Restaurant cuisine type |
| needs_review | boolean | NO | Flags for manual review |
| sector | string (max 100) | NO | Industry sector classification |

---

## Report Issues As

```
**Field:** website
**Issue:** URL without protocol rejected
**Expected:** Auto-prefix "https://" to "acme.com" -> "https://acme.com"
**Actual:** Validation error "Must be a valid URL"
**Severity:** Medium - inconvenient but has workaround
```

---

## Success Criteria

- [ ] Name field enforces required validation
- [ ] Organization type dropdown works with all 4 types
- [ ] URL fields auto-prefix https://
- [ ] LinkedIn validation only accepts linkedin.com
- [ ] Hierarchy (parent org) works correctly
- [ ] All fields save and persist correctly
- [ ] Computed fields display (nb_contacts, nb_opportunities, nb_notes)
- [ ] No console errors during testing
