# E2E Test: Create Opportunity

**URL:** `http://localhost:5173/#/opportunities/create`

---

## Test 1: Happy Path - Create Opportunity

1. Login as admin@test.com
2. Go to Opportunities list
3. Click "Create" button
4. Fill in:
   - **Name:** "Test Opportunity [timestamp]"
   - **Customer:** Select any customer
   - **Principal:** Select any principal
   - **Stage:** Leave as "New Lead"
   - **Priority:** Select "High"
   - **Est. Close Date:** 30 days from now
5. Expand "Contacts & Products" section
6. Select at least 1 contact
7. Select at least 1 product
8. Click "Save"
9. **Verify:** Redirects to list, opportunity appears, no console errors

**Pass:** [ ]

---

## Test 2: Required Field Validation

1. Go to `/#/opportunities/create`
2. Leave all fields empty
3. Click "Save"
4. **Verify:** Errors shown for Name, Customer, Principal, Contacts, Products

**Pass:** [ ]

---

## Test 3: Inline Customer Creation

1. On create form, click "New Customer" button
2. Enter name: "Inline Test Customer"
3. Save inline form
4. **Verify:** New customer auto-selected in dropdown
5. Complete and save opportunity

**Pass:** [ ]

---

## Test 4: Inline Contact Creation

1. Select a Customer first
2. Click "New Contact" button
3. Enter: First Name, Last Name, Email
4. Save inline form
5. **Verify:** New contact appears in selection
6. Select it and save opportunity

**Pass:** [ ]

---

## Test 5: Contact Filtering

1. Select Customer A
2. Note contacts in dropdown
3. Change to Customer B
4. **Verify:** Contacts dropdown updates to show only Customer B's contacts

**Pass:** [ ]

---

## Test 6: Product Filtering

1. Select Principal A
2. Note products available
3. Change to Principal B
4. **Verify:** Products list updates to show only Principal B's products

**Pass:** [ ]

---

## Test 7: Duplicate Detection

1. Enter name matching an existing opportunity
2. Select same Customer and Principal as existing
3. **Verify:** Warning banner appears about similar opportunity

**Pass:** [ ]

---

## Test 8: Rep Role Create

1. Login as rep@mfbroker.com
2. Go to `/#/opportunities/create`
3. Fill all required fields
4. Click "Save"
5. **Verify:** Opportunity created, no RLS errors, appears in list

**Pass:** [ ]

---

## Test 9: Closed Won Requires Reason

1. Fill required fields
2. Change Stage to "Closed Won"
3. Click "Save" without selecting win reason
4. **Verify:** Error shown, win reason dropdown appears
5. Select reason, save succeeds

**Pass:** [ ]

---

## Test 10: Closed Lost Requires Reason

1. Fill required fields
2. Change Stage to "Closed Lost"
3. Click "Save" without selecting loss reason
4. **Verify:** Error shown, loss reason dropdown appears
5. Select reason, save succeeds

**Pass:** [ ]

---

## Test 11: Unsaved Changes Warning

1. Enter data in Name field
2. Click browser back button
3. **Verify:** Warning dialog: "You have unsaved changes"
4. Click "Stay" - form data preserved
5. Click "Leave" - navigates away

**Pass:** [ ]

---

## Summary

| # | Test | Pass |
|---|------|------|
| 1 | Happy Path Create | [ ] |
| 2 | Required Validation | [ ] |
| 3 | Inline Customer | [ ] |
| 4 | Inline Contact | [ ] |
| 5 | Contact Filtering | [ ] |
| 6 | Product Filtering | [ ] |
| 7 | Duplicate Detection | [ ] |
| 8 | Rep Role Create | [ ] |
| 9 | Closed Won Reason | [ ] |
| 10 | Closed Lost Reason | [ ] |
| 11 | Unsaved Changes | [ ] |
