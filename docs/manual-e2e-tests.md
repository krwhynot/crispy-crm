# Manual E2E Test Plan - Crispy CRM

**URL:** http://localhost:5173
**Generated:** 2026-01-23

---

## Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@test.com | `password` | admin |
| Manager | manager@mfbroker.com | `password` | manager |
| Rep | rep@mfbroker.com | `password` | rep |

---

## Suite 1: Soft Delete Verification

### Test 1.1: Delete Contact
1. Login as Admin
2. Go to **Contacts**
3. Click any contact row to open it
4. Click **Delete** button
5. Confirm deletion

**Expected:**
- [ ] Contact disappears from list
- [ ] No error messages
- [ ] Total count decreases by 1

### Test 1.2: Delete Opportunity
1. Go to **Opportunities**
2. Open any opportunity
3. Click **Archive** or **Delete**
4. Confirm

**Expected:**
- [ ] Opportunity removed from list
- [ ] No errors in UI

### Test 1.3: Delete Organization
1. Go to **Organizations**
2. Open an organization
3. Click **Delete**
4. Confirm

**Expected:**
- [ ] Organization removed from list
- [ ] Related contacts still visible (not deleted)

---

## Suite 2: Role-Based Access

### Test 2.1: Rep Sees Only Own Records
1. Logout (click user menu → Logout)
2. Login as **rep@mfbroker.com** / `password`
3. Go to **Organizations**
4. Note the count

**Expected:**
- [ ] Rep sees limited records (only their own)
- [ ] Cannot see other users' organizations

### Test 2.2: Manager Sees All Records
1. Logout
2. Login as **manager@mfbroker.com** / `password`
3. Go to **Organizations**
4. Compare count to Rep's view

**Expected:**
- [ ] Manager sees more records than Rep
- [ ] Can view any user's records

### Test 2.3: Admin Full Access
1. Logout
2. Login as **admin@test.com** / `password`
3. Navigate to all sections

**Expected:**
- [ ] Admin can access everything
- [ ] Sales team management visible (if exists)

---

## Suite 3: Form Validation

### Test 3.1: Create Opportunity Without Principal
1. Login as Admin
2. Go to **Opportunities** → **Create**
3. Fill in name only
4. Leave Principal empty
5. Click **Save**

**Expected:**
- [ ] Validation error shown for Principal field
- [ ] Cannot save without Principal

### Test 3.2: Close Won Without Reason
1. Open any opportunity
2. Change stage to **Closed Won**
3. Leave Win Reason empty
4. Click **Save**

**Expected:**
- [ ] Validation error for Win Reason
- [ ] Cannot save until reason selected

### Test 3.3: Close Lost Without Reason
1. Open any opportunity
2. Change stage to **Closed Lost**
3. Leave Loss Reason empty
4. Click **Save**

**Expected:**
- [ ] Validation error for Loss Reason
- [ ] Cannot save until reason selected

### Test 3.4: Create Contact Without Organization
1. Go to **Contacts** → **Create**
2. Fill first/last name
3. Leave Organization empty
4. Click **Save**

**Expected:**
- [ ] Validation error for Organization
- [ ] Cannot save without organization

---

## Suite 4: Error Handling

### Test 4.1: Network Error Recovery
1. Open DevTools (F12) → Network tab
2. Check "Offline" checkbox
3. Try to save any form
4. Uncheck "Offline"
5. Try again

**Expected:**
- [ ] Error message shown when offline
- [ ] Data not lost
- [ ] Save works when back online

### Test 4.2: Invalid Email Format
1. Create or edit a Contact
2. Enter email: `not-an-email`
3. Click **Save**

**Expected:**
- [ ] Validation error on email field
- [ ] Clear error message

---

## Suite 5: State & Data Refresh

### Test 5.1: Data Updates Between Tabs
1. Open app in two browser tabs
2. In Tab 1: Edit a contact name → Save
3. In Tab 2: Click into the app (focus)

**Expected:**
- [ ] Tab 2 shows updated name after focus
- [ ] No manual refresh needed

### Test 5.2: Favorites Toggle
1. Go to any list (Contacts/Organizations)
2. Click the star/favorite icon on a record
3. Observe immediate update

**Expected:**
- [ ] Star fills in immediately
- [ ] Persists after page refresh

---

## Suite 6: Touch Targets (iPad Test)

### Test 6.1: Button Sizes
1. Open DevTools → Toggle device toolbar
2. Select iPad (1024x768)
3. Navigate through the app
4. Try tapping all buttons

**Expected:**
- [ ] All buttons easy to tap
- [ ] No mis-taps due to small targets
- [ ] Save/Cancel buttons large enough

### Test 6.2: Form Inputs
1. On iPad view, navigate to any form
2. Tap each input field

**Expected:**
- [ ] Input fields easy to select
- [ ] Dropdowns work properly
- [ ] Date pickers accessible

---

## Suite 7: XSS Security

### Test 7.1: Script in Text Fields
1. Create a new Contact
2. First Name: `<script>alert('xss')</script>`
3. Last Name: `<img src=x onerror=alert(1)>`
4. Save and view the contact

**Expected:**
- [ ] No alert popup appears
- [ ] Text displays as-is (escaped)
- [ ] App doesn't break

### Test 7.2: Script in Notes
1. Open any Contact/Organization
2. Add a note with: `<script>alert('xss')</script>`
3. Save and view

**Expected:**
- [ ] No script execution
- [ ] Note displays safely

---

## Suite 8: Navigation & Layout

### Test 8.1: Sidebar Navigation
1. Click each menu item in sidebar
2. Verify page loads

**Expected:**
- [ ] Contacts loads
- [ ] Organizations loads
- [ ] Opportunities loads
- [ ] Tasks loads (if exists)
- [ ] Dashboard loads

### Test 8.2: Breadcrumb Navigation
1. Go to Contacts → Click a contact → Click Edit
2. Use breadcrumbs to go back

**Expected:**
- [ ] Breadcrumbs show correct path
- [ ] Clicking breadcrumb navigates correctly

### Test 8.3: Back Button
1. Navigate: Contacts → Contact Detail → Edit
2. Click browser Back button

**Expected:**
- [ ] Returns to previous page
- [ ] No errors or broken state

---

## Final Checklist

- [ ] All 8 suites passed
- [ ] No console errors during testing
- [ ] App responsive on desktop and iPad

**Tested By:** _____________
**Date:** _____________

