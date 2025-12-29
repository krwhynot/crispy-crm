# E2E Test: Create Opportunity

**Version:** 1.0
**Last Updated:** 2024-12-29
**Author:** Claude Code
**Feature:** Opportunity Creation
**Priority:** Critical (Core CRM Function)

---

## Test Environment Setup

### Browser Requirements
- Chrome/Edge with DevTools Console open (F12)
- Console filter: Errors only
- Network tab open to monitor API calls

### Test URL
- Local: `http://localhost:5173/#/opportunities/create`
- Staging: `https://staging.crispycrm.com/#/opportunities/create`

### Test Users
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | [from SETUP.md] |
| Manager | manager@mfbroker.com | [from SETUP.md] |
| Rep | rep@mfbroker.com | [from SETUP.md] |

### Prerequisites
- [ ] Database seeded with `just seed-e2e`
- [ ] At least 1 Principal organization exists
- [ ] At least 1 Customer/Prospect organization exists
- [ ] At least 1 Contact linked to a customer exists
- [ ] At least 1 Product linked to a principal exists

---

## Console Monitoring Checklist

**Watch for these errors throughout all tests:**
- [ ] No RLS errors ("permission denied", "42501")
- [ ] No React errors ("Uncaught", stack traces)
- [ ] No 500/403/401 network responses
- [ ] No form validation console warnings

---

## Test OC-1: Happy Path - Create Opportunity (Admin)

**Objective:** Verify admin can create a complete opportunity with all required fields

### Prerequisites
- [ ] Logged in as admin@test.com
- [ ] On Opportunities list page (`/#/opportunities`)

### Steps

**STEP 1: Navigate to Create**
1. Click "Create" button in top-right
2. Verify URL changes to `/#/opportunities/create`
3. Verify form loads with empty/default values

**STEP 2: Row 1 - Opportunity Name**
| Field | Enter This Value | Required? | Notes |
|-------|------------------|-----------|-------|
| Name | "E2E Test Opportunity [TIMESTAMP]" | YES | Replace [TIMESTAMP] with current time |

**STEP 3: Row 2 - Organizations**
| Field | Enter This Value | Required? | Notes |
|-------|------------------|-----------|-------|
| Customer | Select any existing customer | YES | Autocomplete should filter as you type |
| Principal | Select any existing principal | YES | Autocomplete should filter as you type |

**STEP 4: Row 3 - Pipeline & Timeline**
| Field | Enter This Value | Required? | Notes |
|-------|------------------|-----------|-------|
| Stage | Leave as "New Lead" (default) | YES | Verify dropdown has 7 stages |
| Priority | Select "High" | YES | Verify dropdown has 4 options |
| Est. Close Date | Select date 30 days out | YES | Verify date picker works |

**STEP 5: Row 4 - Team (Optional)**
| Field | Enter This Value | Required? | Notes |
|-------|------------------|-----------|-------|
| Account Manager | Select any rep | NO | Should filter disabled users |
| Distributor | Leave empty | NO | Optional field |

**STEP 6: Contacts & Products Section**
1. Click to expand "Contacts & Products" if collapsed
2. **Contacts:** Select at least 1 contact (filtered by selected customer)
3. **Products:** Select at least 1 product (filtered by selected principal)
4. Optionally add product notes

**STEP 7: Submit**
1. Click "Save" button
2. Verify no console errors
3. Verify redirect to opportunity detail or list page

### Expected Results
- [ ] Form submits without errors
- [ ] Success toast/notification appears
- [ ] Redirects to `/#/opportunities/{id}/show` or `/#/opportunities`
- [ ] New opportunity appears in list with correct name
- [ ] All entered data displays correctly in detail view
- [ ] Console shows no errors

**Pass/Fail:** [ ]

---

## Test OC-2: Required Field Validation

**Objective:** Verify form enforces all required fields

### Prerequisites
- [ ] Logged in as any user
- [ ] On create form (`/#/opportunities/create`)

### Steps
1. Leave all fields empty/default
2. Click "Save" button
3. Observe validation errors

### Expected Results
- [ ] Form does NOT submit
- [ ] Error message for "Name" field (required)
- [ ] Error message for "Customer" field (required)
- [ ] Error message for "Principal" field (required)
- [ ] Error message for "Contacts" (minimum 1 required)
- [ ] Error message for "Products" (minimum 1 required)
- [ ] Errors use `aria-invalid` and `role="alert"` (accessibility)
- [ ] Form scrolls to first error or shows summary

**Pass/Fail:** [ ]

---

## Test OC-3: Inline Customer Creation

**Objective:** Verify user can create a new customer while creating opportunity

### Prerequisites
- [ ] On create form (`/#/opportunities/create`)

### Steps
1. In Customer field, click "New Customer" button (or + icon)
2. Fill in new customer details:
   - Name: "Inline Test Customer [TIMESTAMP]"
   - Type: Should default to "Customer" or "Prospect"
3. Save the inline form
4. Verify new customer is auto-selected in dropdown
5. Complete rest of opportunity form and save

### Expected Results
- [ ] Inline create modal/drawer opens
- [ ] New customer saves successfully
- [ ] Customer auto-populates in opportunity form
- [ ] Opportunity saves with new customer linked
- [ ] No console errors

**Pass/Fail:** [ ]

---

## Test OC-4: Inline Contact Creation

**Objective:** Verify user can create a new contact while creating opportunity

### Prerequisites
- [ ] On create form with Customer already selected

### Steps
1. In Contacts section, click "New Contact" button
2. Fill in new contact details:
   - First Name: "E2E"
   - Last Name: "TestContact"
   - Email: "e2e-[timestamp]@test.com"
3. Save the inline form
4. Verify new contact appears in contacts selection
5. Select the new contact
6. Complete and save opportunity

### Expected Results
- [ ] Inline create modal opens
- [ ] Contact auto-linked to selected customer
- [ ] New contact appears in multi-select
- [ ] Opportunity saves with contact linked
- [ ] No console errors

**Pass/Fail:** [ ]

---

## Test OC-5: Field Dependencies - Contact Filtering

**Objective:** Verify contacts filter based on selected customer

### Prerequisites
- [ ] Database has contacts linked to different customers

### Steps
1. Select Customer A
2. Note available contacts in Contacts dropdown
3. Change to Customer B
4. Note contacts dropdown updates

### Expected Results
- [ ] Contacts list changes when customer changes
- [ ] Only contacts linked to selected customer appear
- [ ] Previously selected contacts from other customer are cleared
- [ ] No console errors during filter change

**Pass/Fail:** [ ]

---

## Test OC-6: Field Dependencies - Product Filtering

**Objective:** Verify products filter based on selected principal

### Prerequisites
- [ ] Database has products linked to different principals

### Steps
1. Select Principal A
2. Note available products in Products section
3. Change to Principal B
4. Note products list updates

### Expected Results
- [ ] Products list changes when principal changes
- [ ] Only products linked to selected principal appear
- [ ] Previously selected products from other principal are cleared
- [ ] No console errors during filter change

**Pass/Fail:** [ ]

---

## Test OC-7: Duplicate Detection Warning

**Objective:** Verify system warns about similar existing opportunities

### Prerequisites
- [ ] Existing opportunity named "Test Widget Deal"
- [ ] On create form

### Steps
1. Enter Name: "Test Widget Deal" (exact or very similar)
2. Select same Customer as existing opportunity
3. Select same Principal as existing opportunity
4. Observe for duplicate warning

### Expected Results
- [ ] Warning banner/message appears about similar opportunity
- [ ] Warning shows existing opportunity name and link
- [ ] User can dismiss warning and continue
- [ ] Form still allows submission (warning, not blocker)

**Pass/Fail:** [ ]

---

## Test OC-8: Rep Role - Create Own Opportunity

**Objective:** Verify Rep can create opportunities (assigned to self)

### Prerequisites
- [ ] Logged in as rep@mfbroker.com
- [ ] Navigate to `/#/opportunities/create`

### Steps
1. Fill all required fields
2. Note Account Manager field behavior (may auto-assign to self)
3. Save opportunity

### Expected Results
- [ ] Rep can access create form
- [ ] Rep can fill and submit form
- [ ] Opportunity created with Rep as owner
- [ ] No RLS permission errors
- [ ] Opportunity appears in Rep's list

**Pass/Fail:** [ ]

---

## Test OC-9: Closed Won - Win Reason Required

**Objective:** Verify win reason is required when closing as won

### Prerequisites
- [ ] On create form OR editing existing opportunity

### Steps
1. Fill required fields
2. Change Stage to "Closed Won"
3. Attempt to save without selecting win reason

### Expected Results
- [ ] Form shows error: Win reason required
- [ ] Dropdown appears for win reason selection
- [ ] Options include: Relationship, Product quality, Price competitive, Timing, Other
- [ ] Selecting "Other" requires close_reason_notes
- [ ] Form saves after selecting valid reason

**Pass/Fail:** [ ]

---

## Test OC-10: Closed Lost - Loss Reason Required

**Objective:** Verify loss reason is required when closing as lost

### Prerequisites
- [ ] On create form OR editing existing opportunity

### Steps
1. Fill required fields
2. Change Stage to "Closed Lost"
3. Attempt to save without selecting loss reason

### Expected Results
- [ ] Form shows error: Loss reason required
- [ ] Dropdown appears for loss reason selection
- [ ] Options include: Price too high, No authorization, Competitor relationship, Product fit, Timing, No response, Other
- [ ] Selecting "Other" requires close_reason_notes
- [ ] Form saves after selecting valid reason

**Pass/Fail:** [ ]

---

## Test OC-11: Unsaved Changes Warning

**Objective:** Verify user is warned before losing unsaved changes

### Prerequisites
- [ ] On create form with some data entered

### Steps
1. Enter data in Name field
2. Click browser back button or navigation link
3. Observe warning dialog

### Expected Results
- [ ] Warning dialog appears: "You have unsaved changes"
- [ ] Options to Stay or Leave
- [ ] Clicking "Stay" keeps form data
- [ ] Clicking "Leave" discards changes and navigates away

**Pass/Fail:** [ ]

---

## Test Summary Matrix

| Test ID | Test Name | Admin | Manager | Rep | Pass/Fail |
|---------|-----------|-------|---------|-----|-----------|
| OC-1 | Happy Path Create | [ ] | [ ] | [ ] | |
| OC-2 | Required Field Validation | [ ] | - | - | |
| OC-3 | Inline Customer Creation | [ ] | - | - | |
| OC-4 | Inline Contact Creation | [ ] | - | - | |
| OC-5 | Contact Filtering | [ ] | - | - | |
| OC-6 | Product Filtering | [ ] | - | - | |
| OC-7 | Duplicate Detection | [ ] | - | - | |
| OC-8 | Rep Create Own | - | - | [ ] | |
| OC-9 | Closed Won Reason | [ ] | - | - | |
| OC-10 | Closed Lost Reason | [ ] | - | - | |
| OC-11 | Unsaved Changes Warning | [ ] | - | - | |

---

## Pass Criteria
- **Minimum:** Tests OC-1, OC-2, OC-8 must pass (core functionality)
- **Full Pass:** All 11 tests pass with no console errors

---

## Troubleshooting

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| "Permission denied" on save | RLS policy blocking | Check user role, verify org_id matches |
| Contacts dropdown empty | No contacts for customer | Create contact first or select different customer |
| Products dropdown empty | No products for principal | Create product first or select different principal |
| Form won't submit | Validation errors | Scroll up to see error summary |
| Duplicate warning not showing | Threshold too strict | Ensure name similarity (Levenshtein < 3) |

### Debug Commands
```bash
# Reset test data
just seed-e2e

# Check opportunities in DB
just db-query "SELECT name, stage FROM opportunities LIMIT 10"

# Check RLS policies
just db-query "SELECT * FROM pg_policies WHERE tablename = 'opportunities'"
```
