# Organizations Module - Manual E2E Test Checklist

Comprehensive manual E2E testing checklist for the Organizations module. Designed for Claude for Chrome testing with React Admin + Supabase.

## Test Environment Setup

- **Browser:** Chrome (with Claude for Chrome extension)
- **URL:** http://localhost:5173
- **Credentials:** admin@test.com / password123
- **Seed Data:** Run `just seed-e2e` before testing
- **Reference Organization:** MFB Consulting (from seed data)

### Timestamp Convention

Use timestamps for unique test data: `Test Organization 2025-12-31-143022`

---

## Section 1: CRUD Operations

### Test 1.1: Navigate to Organizations List

**Objective:** Verify the organizations list loads correctly.

**Steps:**
1. Log in with admin@test.com / password123
2. Navigate to `/#/organizations`
3. Wait for list to load

**Expected Results:**
- [ ] Organizations datagrid renders within 5 seconds
- [ ] Column headers visible: Name, Type, Priority, Location, Account Manager
- [ ] At least one organization visible (MFB Consulting from seed data)
- [ ] Bulk action checkbox column visible
- [ ] No console errors

---

### Test 1.2: Create Organization - Minimal (Name Only)

**Objective:** Verify organization can be created with only required field.

**Test Data:**
- Organization Name: `Minimal Org [Timestamp]`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Leave all other fields empty
4. Click "Create Organization"
5. If duplicate dialog appears, click "Create Anyway"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to organization show page or list
- [ ] Organization name visible on page
- [ ] No RLS or React errors in console

---

### Test 1.3: Create Organization - Full Form

**Objective:** Verify organization can be created with all fields populated.

**Test Data:**
- Organization Name: `Full Org [Timestamp]`
- Organization Type: "Customer"
- Priority: "A"
- Website: `https://example-full.com`
- Phone: `555-123-4567`
- City: `Grand Rapids`
- State: `MI`
- LinkedIn URL: `https://www.linkedin.com/company/full-org`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Select "Customer" from Organization Type dropdown
4. Select "A" from Priority dropdown
5. Navigate to "More" tab if website/LinkedIn are there
6. Fill in Website, Phone, City, State, LinkedIn URL
7. Click "Create Organization"
8. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form submits successfully
- [ ] All fields saved correctly (verify in edit view)
- [ ] Organization type shows as "Customer"
- [ ] Priority shows as "A"
- [ ] No console errors

---

### Test 1.4: Edit Organization

**Objective:** Verify organization can be edited.

**Test Data:**
- Use organization created in Test 1.2
- Updated Name: `Minimal Org Updated [Timestamp]`

**Steps:**
1. Navigate to `/#/organizations`
2. Click on the organization created in Test 1.2
3. Click "Edit" button in slide-over or navigate to edit URL
4. Change the organization name
5. Click "Save"

**Expected Results:**
- [ ] Edit form loads with existing data
- [ ] Changes save successfully
- [ ] Updated name visible in list/slide-over
- [ ] No console errors

---

### Test 1.5: View Organization Slide-Over

**Objective:** Verify slide-over panel displays correctly with all tabs.

**Steps:**
1. Navigate to `/#/organizations`
2. Click on any organization row
3. Wait for slide-over to open

**Expected Results:**
- [ ] Slide-over opens at 40vw width from right
- [ ] Organization name displayed in header
- [ ] 4-5 tabs visible (Details, Contacts, Opportunities, Notes; Authorizations for distributors)
- [ ] Details tab shows organization information
- [ ] Close button (X) functional
- [ ] No console errors

---

### Test 1.6: Soft Delete Organization

**Objective:** Verify organization soft delete functionality.

**Steps:**
1. Create a new organization for deletion: `Delete Test Org [Timestamp]`
2. Navigate to its edit page
3. Look for delete/archive action
4. Confirm deletion

**Expected Results:**
- [ ] Delete confirmation dialog appears
- [ ] Organization no longer visible in default list view
- [ ] Organization has `deleted_at` timestamp (verify in DB if possible)
- [ ] No console errors

---

## Section 2: Organization Hierarchy Tests

### Test 2.1: Set Parent Organization

**Objective:** Verify parent-child organization hierarchy works.

**Test Data:**
- Parent: MFB Consulting (from seed data)
- Child: `Branch Office [Timestamp]`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name: `Branch Office [Timestamp]`
3. Expand "Organization Hierarchy" section
4. In Parent Organization input, type "MFB"
5. Select "MFB Consulting" from autocomplete
6. Click "Create Organization"

**Expected Results:**
- [ ] Parent organization autocomplete works
- [ ] Form submits successfully
- [ ] Child organization shows parent relationship
- [ ] No console errors

---

### Test 2.2: Organization Scope Selection

**Objective:** Verify org_scope field works correctly.

**Test Data:**
- Organization Name: `National Brand [Timestamp]`
- Scope: National

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name
3. Expand "Organization Hierarchy" section
4. Select "National" from Scope dropdown
5. Click "Create Organization"

**Expected Results:**
- [ ] Scope dropdown shows: National, Regional, Local options
- [ ] Selected scope saves correctly
- [ ] Helper text visible: "National = brand/HQ, Regional = operating company"
- [ ] No console errors

---

### Test 2.3: Operating Entity Toggle

**Objective:** Verify is_operating_entity boolean field works.

**Test Data:**
- Organization Name: `Corporate HQ [Timestamp]`
- Is Operating Entity: OFF (unchecked)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name
3. Expand "Organization Hierarchy" section
4. Uncheck "This location processes orders" toggle
5. Verify helper text visible
6. Click "Create Organization"

**Expected Results:**
- [ ] Toggle shows ON/OFF description text
- [ ] Default is ON (checked)
- [ ] Setting saves correctly when OFF
- [ ] Helper text explains: "ON: Orders and invoices happen here"
- [ ] No console errors

---

## Section 3: Duplicate Detection Tests

### Test 3.1: Duplicate Name Warning Appears

**Objective:** Verify duplicate detection shows soft warning.

**Test Data:**
- Organization Name: `MFB Consulting` (existing seed data)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Enter name: `MFB Consulting`
3. Click "Create Organization"
4. Wait for duplicate check API call

**Expected Results:**
- [ ] Duplicate warning dialog appears
- [ ] Dialog title: "Potential Duplicate Organization"
- [ ] Shows existing organization name in bold
- [ ] Three action buttons visible: "View Existing", "Change Name", "Create Anyway"
- [ ] No console errors

---

### Test 3.2: Duplicate Bypass - Create Anyway

**Objective:** Verify user can proceed despite duplicate warning.

**Test Data:**
- Organization Name: `MFB Consulting` (intentional duplicate)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Enter name: `MFB Consulting`
3. Click "Create Organization"
4. When dialog appears, click "Create Anyway"

**Expected Results:**
- [ ] Dialog closes
- [ ] Organization created successfully
- [ ] Now two organizations named "MFB Consulting" exist
- [ ] No console errors

---

### Test 3.3: Duplicate Detection - View Existing

**Objective:** Verify "View Existing" navigates to existing organization.

**Steps:**
1. Navigate to `/#/organizations/create`
2. Enter name: `MFB Consulting`
3. Click "Create Organization"
4. When dialog appears, click "View Existing"

**Expected Results:**
- [ ] Dialog closes
- [ ] Navigates to existing organization's show/edit page
- [ ] Create form data NOT saved
- [ ] No console errors

---

### Test 3.4: Duplicate Detection - Change Name

**Objective:** Verify "Change Name" returns to form.

**Steps:**
1. Navigate to `/#/organizations/create`
2. Enter name: `MFB Consulting`
3. Click "Create Organization"
4. When dialog appears, click "Change Name"

**Expected Results:**
- [ ] Dialog closes
- [ ] Stays on create form
- [ ] Form data preserved
- [ ] User can modify name and resubmit
- [ ] No console errors

---

## Section 4: Bulk Reassign Tests

### Test 4.1: Bulk Selection

**Objective:** Verify multiple organizations can be selected.

**Steps:**
1. Navigate to `/#/organizations`
2. Click checkbox on 3 different organization rows
3. Observe bulk action toolbar

**Expected Results:**
- [ ] Checkboxes are functional (44px touch targets)
- [ ] Selected row count displayed
- [ ] Bulk action toolbar appears at top
- [ ] "Reassign" button visible in toolbar
- [ ] No console errors

---

### Test 4.2: Bulk Reassign - Execute

**Objective:** Verify bulk reassignment to different sales rep works.

**Steps:**
1. Navigate to `/#/organizations`
2. Select 2-3 organizations using checkboxes
3. Click "Reassign" button in bulk action toolbar
4. Wait for dialog to open
5. Select a different sales rep from dropdown
6. Click "Reassign X Organizations" button

**Expected Results:**
- [ ] Reassign dialog opens
- [ ] Shows list of affected organizations with types
- [ ] Sales rep dropdown populated with active reps
- [ ] Reassignment completes successfully
- [ ] Success notification: "Successfully reassigned X organizations to [Rep Name]"
- [ ] Organizations updated in list
- [ ] Selection cleared
- [ ] No console errors

---

### Test 4.3: Bulk Reassign - Cancel During Operation

**Objective:** Verify AbortController cancellation works mid-operation.

**Prerequisites:** Need 5+ organizations to select for enough time to cancel.

**Steps:**
1. Navigate to `/#/organizations`
2. Select 5+ organizations using checkboxes
3. Click "Reassign" button
4. Select a sales rep
5. Click "Reassign X Organizations"
6. Immediately click "Cancel Operation" while processing

**Expected Results:**
- [ ] "Cancel Operation" button appears during processing
- [ ] Operation stops when cancelled
- [ ] Notification shows: "Cancelled after reassigning X organization(s)"
- [ ] Partial success: some organizations reassigned, others unchanged
- [ ] No console errors

---

### Test 4.4: Bulk Reassign - Partial Failure Handling

**Objective:** Verify partial failures are reported correctly.

**Note:** This test requires an RLS policy violation or other failure scenario. May need admin setup.

**Expected Results:**
- [ ] Success count and failure count both displayed
- [ ] Failed organizations listed with reason
- [ ] Successfully reassigned organizations updated
- [ ] No unhandled exceptions

---

## Section 5: Authorization Tab Tests (Distributor-Specific)

### Test 5.1: Authorizations Tab Visibility

**Objective:** Verify Authorizations tab only appears for distributors.

**Steps:**
1. Navigate to `/#/organizations`
2. Click on a non-distributor organization (e.g., Customer type)
3. Note which tabs are visible
4. Close slide-over
5. Click on a distributor organization (if exists in seed data)
6. Note which tabs are visible

**Expected Results:**
- [ ] Non-distributor: 4 tabs (Details, Contacts, Opportunities, Notes)
- [ ] Distributor: 5 tabs (Details, Authorizations, Contacts, Opportunities, Notes)
- [ ] Authorizations tab has ShieldCheck icon
- [ ] No console errors

---

### Test 5.2: Add Principal Authorization

**Objective:** Verify adding principal to distributor authorization list.

**Prerequisites:** Need a distributor organization and at least one principal organization.

**Steps:**
1. Navigate to `/#/organizations`
2. Click on a distributor organization
3. Click "Authorizations" tab
4. Click "Add Principal" button
5. Select a principal from dropdown
6. Click "Add" or "Save"

**Expected Results:**
- [ ] Add Principal dialog opens
- [ ] Principal dropdown shows available principals (not already authorized)
- [ ] Authorization created successfully
- [ ] Principal appears in authorization list
- [ ] Success notification displayed
- [ ] No console errors

---

### Test 5.3: Remove Principal Authorization

**Objective:** Verify removing principal from authorization list.

**Prerequisites:** Need a distributor with at least one authorization.

**Steps:**
1. Navigate to distributor organization slide-over
2. Click "Authorizations" tab
3. Find an existing authorization
4. Click "Remove" button on authorization card
5. Confirm removal in dialog

**Expected Results:**
- [ ] Remove confirmation dialog appears
- [ ] Dialog shows principal name being removed
- [ ] Authorization removed from list
- [ ] Success notification displayed
- [ ] No console errors

---

### Test 5.4: Empty Authorizations State

**Objective:** Verify empty state for distributor with no authorizations.

**Steps:**
1. Create new distributor: `Empty Distributor [Timestamp]` with type "Distributor"
2. Open its slide-over
3. Click "Authorizations" tab

**Expected Results:**
- [ ] Empty state message displayed: "No authorized principals"
- [ ] "Add Principal" button visible
- [ ] Count shows "0 authorized principals"
- [ ] No console errors

---

## Section 6: CSV Import Tests

### Test 6.1: Import Dialog Opens

**Objective:** Verify import dialog and file selection work.

**Steps:**
1. Navigate to `/#/organizations`
2. Find and click "Import" button
3. Wait for dialog to open

**Expected Results:**
- [ ] Import dialog opens
- [ ] Title: "Import Organizations"
- [ ] File upload button visible
- [ ] Description mentions required "name" column
- [ ] "Cancel" and "Import" buttons visible
- [ ] No console errors

---

### Test 6.2: CSV File Selection

**Objective:** Verify CSV file can be selected.

**Prerequisites:** Create a simple CSV file with columns: name, organization_type, city

```csv
name,organization_type,city
Test Import Org 1,customer,Chicago
Test Import Org 2,prospect,Detroit
```

**Steps:**
1. Open Import dialog
2. Click "Choose CSV file" button
3. Select prepared CSV file

**Expected Results:**
- [ ] File name displayed after selection
- [ ] File size shown (X KB)
- [ ] "Import" button enabled
- [ ] No validation errors for valid file
- [ ] No console errors

---

### Test 6.3: Import Preview - Column Mapping

**Objective:** Verify preview shows column mapping with confidence scores.

**Steps:**
1. Open Import dialog
2. Select valid CSV file
3. Click "Import" button
4. Wait for preview to load

**Expected Results:**
- [ ] Preview dialog opens
- [ ] Column mapping table visible
- [ ] Source columns listed with sample values
- [ ] Target field dropdowns for each column
- [ ] Confidence indicators (green check for matched, red for unmapped)
- [ ] Sample rows preview visible
- [ ] Valid count vs total rows displayed
- [ ] No console errors

---

### Test 6.4: Import Preview - Change Column Mapping

**Objective:** Verify user can override auto-detected column mappings.

**Steps:**
1. Open Import preview
2. Find a column with incorrect or missing mapping
3. Click target field dropdown
4. Select different target field
5. Observe sample data update

**Expected Results:**
- [ ] Dropdown shows all available organization fields
- [ ] "(ignore)" option available
- [ ] Changing mapping updates sample data preview
- [ ] "Continue" button remains enabled
- [ ] No console errors

---

### Test 6.5: Import Execution

**Objective:** Verify CSV import processes organizations correctly.

**Steps:**
1. Complete preview validation
2. Click "Continue" button
3. Observe progress indicator

**Expected Results:**
- [ ] Progress bar updates during import
- [ ] "Importing organizations... X of Y" message shown
- [ ] Import completes successfully
- [ ] Results screen shows: Successful count, Failed count, Total count
- [ ] Organizations visible in list after import
- [ ] No console errors

---

### Test 6.6: Import with Duplicates

**Objective:** Verify duplicate handling in CSV import.

**Prerequisites:** CSV with duplicate names:
```csv
name,city
Duplicate Org,Chicago
Duplicate Org,Detroit
```

**Steps:**
1. Import CSV with duplicate names
2. Observe preview warnings
3. Choose to skip or include duplicates

**Expected Results:**
- [ ] Preview shows duplicate warning
- [ ] Duplicate rows listed with row numbers
- [ ] "Skip duplicates" option available
- [ ] If skipped, only first occurrence imported
- [ ] If included, multiple records created
- [ ] No console errors

---

### Test 6.7: Import with Missing Required Field

**Objective:** Verify handling of rows missing name field.

**Prerequisites:** CSV with empty name:
```csv
name,city
,Chicago
Valid Org,Detroit
```

**Steps:**
1. Import CSV with missing names
2. Observe preview warnings

**Expected Results:**
- [ ] Preview shows "Missing name" count
- [ ] Rows without names excluded from valid count
- [ ] Import only processes valid rows
- [ ] No console errors

---

## Section 7: Validation Edge Cases

### Test 7.1: URL Auto-Prefix Transform

**Objective:** Verify URLs without protocol get https:// added.

**Test Data:**
- Website: `example.com` (no protocol)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name: `URL Prefix Test [Timestamp]`
3. Enter Website: `example.com`
4. Click "Create Organization"
5. Edit the organization to verify saved value

**Expected Results:**
- [ ] Form accepts URL without protocol
- [ ] Saved value is `https://example.com`
- [ ] No validation error on input
- [ ] No console errors

---

### Test 7.2: HTTP Protocol Accepted

**Objective:** Verify http:// protocol is not rejected.

**Test Data:**
- Website: `http://legacy-site.com`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name: `HTTP Test [Timestamp]`
3. Enter Website: `http://legacy-site.com`
4. Click "Create Organization"

**Expected Results:**
- [ ] Form accepts http:// protocol
- [ ] Organization created successfully
- [ ] Website saved as `http://legacy-site.com`
- [ ] No console errors

---

### Test 7.3: LinkedIn URL Validation

**Objective:** Verify LinkedIn URL must be valid LinkedIn domain.

**Test Cases:**
1. Valid: `https://www.linkedin.com/company/test-org`
2. Valid: `https://linkedin.com/company/test-org`
3. Invalid: `https://example.com/company/test-org`
4. Auto-prefix: `linkedin.com/company/test-org`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name
3. Enter each LinkedIn URL test case
4. Observe validation behavior

**Expected Results:**
- [ ] Valid LinkedIn URLs accepted
- [ ] Invalid domain shows error: "Must be a valid LinkedIn organization URL"
- [ ] Auto-prefix adds https:// to linkedin.com URLs
- [ ] No console errors

---

### Test 7.4: Founded Year Boundary

**Objective:** Verify founded_year validates 1800 to current year.

**Test Cases:**
1. Valid: `2020`
2. Boundary low: `1800` (should pass)
3. Boundary high: `2025` (current year, should pass)
4. Invalid low: `1799` (should fail)
5. Invalid high: `2026` (should fail)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name
3. Find Founded Year field (may be on "More" tab)
4. Enter each test value
5. Attempt to save

**Expected Results:**
- [ ] 1800 accepted (lower boundary)
- [ ] Current year (2025) accepted (upper boundary)
- [ ] 1799 rejected with validation error
- [ ] Future year rejected with validation error
- [ ] No console errors

---

### Test 7.5: Name Whitespace Trimming

**Objective:** Verify organization name trims leading/trailing whitespace.

**Test Data:**
- Name: `  Whitespace Org [Timestamp]  ` (spaces before and after)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Enter name with leading and trailing spaces
3. Click "Create Organization"
4. View saved organization

**Expected Results:**
- [ ] Organization created successfully
- [ ] Saved name has no leading/trailing whitespace
- [ ] Name visible as `Whitespace Org [Timestamp]`
- [ ] No console errors

---

### Test 7.6: Name Maximum Length

**Objective:** Verify name field enforces 255 character max.

**Test Data:**
- Name: 300 character string

**Steps:**
1. Navigate to `/#/organizations/create`
2. Paste a 300 character name
3. Attempt to save

**Expected Results:**
- [ ] Validation error: "Organization name too long"
- [ ] Form does not submit
- [ ] No console errors

---

### Test 7.7: Principal Type Change Blocked

**Objective:** Verify changing Principal type to something else is blocked if products exist.

**Prerequisites:** Need a Principal organization with at least one product assigned.

**Steps:**
1. Navigate to Principal organization edit page
2. Try to change Organization Type from "Principal" to "Customer"
3. Observe behavior

**Expected Results:**
- [ ] Warning dialog appears
- [ ] Type reverts to "Principal"
- [ ] Dialog explains products must be reassigned first
- [ ] Cannot save with different type
- [ ] No console errors

---

### Test 7.8: Phone Number Max Length

**Objective:** Verify phone field enforces 30 character max.

**Test Data:**
- Phone: 35 character string

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in name
3. Enter phone number exceeding 30 characters
4. Attempt to save

**Expected Results:**
- [ ] Validation error: "Phone number too long"
- [ ] Form does not submit
- [ ] No console errors

---

## Section 8: Quick Create Popover Tests

### Test 8.1: Quick Create - Just Use Name

**Objective:** Verify fast path creates organization with name only.

**Prerequisites:** Quick create popover appears from organization autocomplete in other forms.

**Steps:**
1. Navigate to a form with organization autocomplete (e.g., Contact create)
2. Type a new organization name that doesn't exist
3. Click "Create new organization" or similar prompt
4. When popover appears, click "Just use name"

**Expected Results:**
- [ ] Popover closes
- [ ] Organization created with typed name
- [ ] Organization selected in autocomplete
- [ ] Default type: prospect, priority: C
- [ ] Success notification displayed
- [ ] No console errors

---

### Test 8.2: Quick Create - Full Form

**Objective:** Verify extended path allows setting type, priority, city, state.

**Steps:**
1. Trigger quick create popover (as in 8.1)
2. Fill in additional fields: Type, Priority, City, State
3. Click "Create"

**Expected Results:**
- [ ] Popover shows editable fields: Name, Type, Priority, City, State
- [ ] All fields save correctly
- [ ] Organization selected after creation
- [ ] No console errors

---

## Section 9: Viewport Testing

### Test 9.1: Desktop View (1440px+)

**Objective:** Verify organizations module works at desktop resolution.

**Steps:**
1. Set browser window to 1440px width
2. Navigate through all organization views
3. Test create, edit, list, slide-over

**Expected Results:**
- [ ] Datagrid columns visible without horizontal scroll
- [ ] Slide-over opens at 40vw (576px)
- [ ] All form fields accessible
- [ ] Bulk action toolbar fully visible
- [ ] No layout breaks

---

### Test 9.2: iPad View (1024px)

**Objective:** Verify organizations module works on iPad resolution.

**Steps:**
1. Set browser window to 1024px width
2. Navigate through all organization views
3. Test touch interactions

**Expected Results:**
- [ ] Touch targets meet 44px minimum (h-11 w-11)
- [ ] Slide-over readable (may adjust width)
- [ ] Form fields have adequate spacing
- [ ] Bulk selection checkboxes easy to tap
- [ ] No horizontal overflow

---

### Test 9.3: Slide-Over Responsive Behavior

**Objective:** Verify slide-over adapts to screen size.

**Steps:**
1. Open organization slide-over at 1440px
2. Resize browser to 1024px
3. Resize to 768px

**Expected Results:**
- [ ] Slide-over maintains 40vw or adapts appropriately
- [ ] Content remains readable at all sizes
- [ ] Tab navigation works at all sizes
- [ ] Close button accessible

---

## Section 10: Console Monitoring Checklist

### Error Patterns to Watch

Run these checks during ALL tests:

**RLS (Row-Level Security) Errors:**
- [ ] No "permission denied" errors
- [ ] No "row-level security" messages
- [ ] No "42501" PostgreSQL error codes

**React Errors:**
- [ ] No "Uncaught" errors in console
- [ ] No React key warnings
- [ ] No uncontrolled to controlled input warnings
- [ ] No missing dependency warnings in hooks

**Network Errors:**
- [ ] No 500 Internal Server errors
- [ ] No 403 Forbidden errors
- [ ] No 401 Unauthorized (after login)
- [ ] No CORS errors

**Performance Issues:**
- [ ] No "ResizeObserver loop limit exceeded" (acceptable browser quirk)
- [ ] No memory leak warnings
- [ ] No infinite loop patterns

---

## Section 11: Pass Criteria

### Minimum Pass Requirements

**Must Pass (Blockers):**
- [ ] All CRUD operations (Section 1) pass
- [ ] Duplicate detection (Section 3) works correctly
- [ ] Validation edge cases (Section 7) pass
- [ ] No RLS errors in console

**Should Pass (High Priority):**
- [ ] Hierarchy tests (Section 2) pass
- [ ] Bulk reassign (Section 4) works
- [ ] Quick create (Section 8) works
- [ ] Desktop viewport (Section 9.1) passes

**Nice to Have:**
- [ ] Authorization tab (Section 5) fully functional
- [ ] CSV import (Section 6) works end-to-end
- [ ] iPad viewport (Section 9.2) passes

### Failure Protocol

If any test fails:
1. Note the specific failure step
2. Capture console errors (screenshot)
3. Take screenshot of failing UI
4. Record current URL
5. Document any data state that may be relevant
6. **DO NOT proceed with dependent tests** until blocker resolved

---

## Appendix: Test Data Reference

### Seed Data Organizations

| Name | Type | Priority | Notes |
|------|------|----------|-------|
| MFB Consulting | customer | B | Default test organization |

### Organization Types

| Value | Display Name |
|-------|--------------|
| customer | Customer |
| prospect | Prospect |
| principal | Principal |
| distributor | Distributor |
| operator | Operator |

### Priority Values

| Value | Description |
|-------|-------------|
| A | Highest priority |
| B | High priority |
| C | Normal priority (default) |
| D | Low priority |

### Status Values

| Status | Reason Options |
|--------|----------------|
| active | active_customer, prospect, authorized_distributor |
| inactive | account_closed, out_of_business, disqualified |

### Payment Terms

- net_30
- net_60
- net_90
- cod
- prepaid
- 2_10_net_30

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-31 | 1.0 | Initial creation |
