# Contacts Module E2E Manual Testing Checklist

Comprehensive manual E2E testing checklist for the Contacts module using Claude for Chrome.

## Test Environment Setup

- **Browser:** Chrome with DevTools open (F12)
- **URL:** http://localhost:5173
- **Credentials:** admin@test.com / password123
- **Viewports:**
  - Desktop: 1440x900 (minimum)
  - iPad Landscape: 1024x768
  - iPad Portrait: 768x1024

**Seed Data References:**
- Organization: MFB Consulting
- Existing Contact: Hancotte
- Account Manager: Admin user

**Timestamp Format:** Use `YYYY-MM-DD-HHmmss` for unique test data (e.g., `Test Contact 2025-12-31-143022`)

---

## Section 1: CRUD Operations

### Test 1.1: Create Contact - Minimal Required Fields

**Goal:** Verify contact creation with only required fields.

**Test Data:**
- First Name: `Test Contact [Timestamp]`
- Last Name: `User [Timestamp]`
- Email: `test.[timestamp]@example.com`
- Organization: MFB Consulting
- Account Manager: Admin

**Steps:**
1. Navigate to `/#/contacts/create`
2. Wait for form to load completely
3. Fill in First Name field
4. Fill in Last Name field
5. Add email using the email input (select "Work" type)
6. Select Organization using autocomplete:
   - Type "MFB" in search
   - Select "MFB Consulting" from results
7. Select "Admin" from Account Manager dropdown
8. Click "Save & Close"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to contacts list (`/#/contacts`)
- [ ] New contact appears in list
- [ ] No RLS errors in console
- [ ] No React errors in console

---

### Test 1.2: Create Contact - Email-to-Name Parsing

**Goal:** Verify email-to-name auto-fill feature parses email addresses correctly.

**Test Data:**
- Email: `john.smith@example.com`

**Steps:**
1. Navigate to `/#/contacts/create`
2. Focus on the email field first
3. Enter email `john.smith@example.com`
4. Tab out of the email field or blur

**Expected Results:**
- [ ] First Name auto-populates with "John" (or similar parsing)
- [ ] Last Name auto-populates with "Smith" (or similar parsing)
- [ ] Email field retains the entered value
- [ ] Names can be manually edited after auto-fill

---

### Test 1.3: Read - Contact List Display

**Goal:** Verify contact list displays correctly with all columns.

**Steps:**
1. Navigate to `/#/contacts`
2. Wait for list to load
3. Observe the datagrid columns

**Expected Results:**
- [ ] Avatar column displays (hidden on mobile)
- [ ] Name column displays with full name
- [ ] Role column displays Title + Department (hidden on tablet)
- [ ] Organization column displays organization name
- [ ] Status column displays badge
- [ ] Notes count column displays (hidden on tablet)
- [ ] Last Activity date displays (hidden on mobile)
- [ ] Search bar is visible above the list
- [ ] Sort button is functional
- [ ] Export button is functional

---

### Test 1.4: Read - Contact List Search

**Goal:** Verify search functionality works correctly.

**Steps:**
1. Navigate to `/#/contacts`
2. Click in the search bar
3. Type "Hancotte" (from seed data)
4. Wait for results to filter

**Expected Results:**
- [ ] List filters to show matching contacts
- [ ] "Hancotte" contact appears in results
- [ ] Non-matching contacts are hidden
- [ ] Clearing search shows all contacts again

---

### Test 1.5: Update Contact - Edit via Slide-Over

**Goal:** Verify contact editing through slide-over panel.

**Steps:**
1. Navigate to `/#/contacts`
2. Click on "Hancotte" contact row
3. Wait for slide-over to open
4. Click "Edit" button to toggle to edit mode
5. Modify the Title field to "Updated Title [Timestamp]"
6. Click "Save" or confirm changes

**Expected Results:**
- [ ] Slide-over opens at 40vw width
- [ ] Details tab shows current contact info
- [ ] Edit mode enables form fields
- [ ] Changes save successfully
- [ ] Slide-over updates with new data
- [ ] No console errors

---

### Test 1.6: Delete Contact - Soft Delete

**Goal:** Verify contact deletion (soft delete via deleted_at).

**Note:** This test requires a test contact created specifically for deletion.

**Steps:**
1. Create a test contact: `Delete Test [Timestamp]`
2. Navigate to `/#/contacts`
3. Find and click on the test contact
4. Locate delete action (if available in slide-over)
5. Confirm deletion

**Expected Results:**
- [ ] Delete confirmation dialog appears
- [ ] Contact is removed from list after deletion
- [ ] No hard delete - record has deleted_at set
- [ ] No RLS errors in console

---

## Section 2: CSV Import Workflow Tests

### Test 2.1: CSV Import - File Upload

**Goal:** Verify CSV file upload validation.

**Steps:**
1. Navigate to `/#/contacts`
2. Locate and click "Import" button
3. Download sample CSV template
4. Upload the sample CSV file

**Expected Results:**
- [ ] Import dialog opens
- [ ] "Download CSV sample" button works
- [ ] File input accepts .csv files only
- [ ] File validation passes for valid CSV
- [ ] Progress indicator appears during parsing

---

### Test 2.2: CSV Import - Invalid File Rejection

**Goal:** Verify invalid file types are rejected.

**Steps:**
1. Open Import dialog
2. Attempt to upload a .txt or .xlsx file

**Expected Results:**
- [ ] File is rejected with error message
- [ ] Validation error clearly explains the issue
- [ ] Import button remains disabled

---

### Test 2.3: CSV Import - Header Mapping Preview

**Goal:** Verify column header auto-mapping with 600+ aliases.

**Test Data:** CSV with headers like "Email Address", "Phone Number", "Company"

**Steps:**
1. Upload a CSV with common but non-standard headers
2. Wait for preview screen to appear
3. Review auto-detected mappings

**Expected Results:**
- [ ] Preview dialog opens (7xl width, 90vh height)
- [ ] Columns show auto-detected mappings
- [ ] Confidence indicators show mapping quality
- [ ] Sample values display for each column
- [ ] Low-confidence mappings are highlighted

---

### Test 2.4: CSV Import - Manual Column Mapping

**Goal:** Verify manual override of column mappings.

**Steps:**
1. Upload CSV and reach preview screen
2. Find a column with incorrect auto-mapping
3. Click dropdown to change mapping
4. Select correct target field

**Expected Results:**
- [ ] Dropdown shows all available target fields
- [ ] Selection updates the mapping immediately
- [ ] Sample rows update to reflect new mapping
- [ ] User overrides show high confidence (1.0)

---

### Test 2.5: CSV Import - Full Name Split

**Goal:** Verify "Full Name" column splits into first/last name.

**Test Data:** CSV with "Full Name" column containing "John Smith"

**Steps:**
1. Upload CSV with "Full Name" or "Name" column
2. Verify auto-detection of full name pattern
3. Check preview shows split names

**Expected Results:**
- [ ] Full name column mapped to "first_name + last_name (will be split)"
- [ ] Preview shows correctly split first and last names
- [ ] Conflict warning if explicit first_name column also exists

---

### Test 2.6: CSV Import - Data Quality Checks

**Goal:** Verify data quality warnings are displayed.

**Steps:**
1. Upload CSV with:
   - Some contacts missing email/phone
   - Some organizations without contacts
2. Review data quality section

**Expected Results:**
- [ ] "Organizations without contacts" warning appears
- [ ] "Contacts without contact info" warning appears
- [ ] Counts are accurate
- [ ] Decisions can be made for each quality issue

---

### Test 2.7: CSV Import - Batch Processing

**Goal:** Verify batch import with progress tracking.

**Steps:**
1. Complete column mapping in preview
2. Make data quality decisions
3. Click "Continue" to start import
4. Observe progress

**Expected Results:**
- [ ] Progress bar shows batch processing (10 per batch)
- [ ] Success/error/skipped counts update in real-time
- [ ] "Cancel Import" button available during processing
- [ ] Warning about keeping tab open appears
- [ ] Browser beforeunload warning if tab closes

---

### Test 2.8: CSV Import - Result Summary

**Goal:** Verify import completion summary.

**Steps:**
1. Complete a full import
2. Wait for import to finish
3. Review result dialog

**Expected Results:**
- [ ] Result dialog shows total processed
- [ ] Success count displayed
- [ ] Failed count displayed (if any)
- [ ] Skipped count displayed (if any)
- [ ] Error details available for failed rows
- [ ] "Close" button returns to contact list

---

### Test 2.9: CSV Import - Rate Limiting

**Goal:** Verify import rate limiter prevents abuse.

**Steps:**
1. Attempt multiple rapid imports in succession
2. Observe rate limit behavior

**Expected Results:**
- [ ] Rate limit warning appears after threshold
- [ ] Message shows remaining imports allowed
- [ ] Reset time is displayed
- [ ] Import blocked until rate limit resets

---

## Section 3: Tag Management Tests

### Test 3.1: View Existing Tags

**Goal:** Verify tags display correctly on contact.

**Steps:**
1. Navigate to `/#/contacts`
2. Click on a contact with tags
3. View slide-over Details tab

**Expected Results:**
- [ ] Tags section is visible
- [ ] Existing tags display as chips with colors
- [ ] "Add tag" button is visible

---

### Test 3.2: Add Existing Tag to Contact

**Goal:** Verify adding an existing tag to a contact.

**Steps:**
1. Open a contact slide-over
2. Click "Add tag" button
3. Select an existing tag from dropdown
4. Observe the update

**Expected Results:**
- [ ] Dropdown shows available unassigned tags
- [ ] Selected tag appears on contact
- [ ] No page refresh required
- [ ] Tag color is preserved

---

### Test 3.3: Create New Tag Inline

**Goal:** Verify creating a new tag from contact slide-over.

**Steps:**
1. Open a contact slide-over
2. Click "Add tag" button
3. Click "Create new tag" option
4. Fill in tag name: `Test Tag [Timestamp]`
5. Select a color
6. Submit

**Expected Results:**
- [ ] Tag create modal opens
- [ ] Name field is required
- [ ] Color picker shows available colors
- [ ] New tag is created and added to contact
- [ ] Modal closes after success

---

### Test 3.4: Remove Tag from Contact

**Goal:** Verify removing a tag from a contact.

**Steps:**
1. Open a contact with tags
2. Click the "X" or unlink button on a tag chip
3. Observe removal

**Expected Results:**
- [ ] Confirmation or immediate removal
- [ ] Tag is removed from contact display
- [ ] Tag still exists in system (not deleted)
- [ ] Contact can have tag re-added later

---

## Section 4: Slide-Over Tests

### Test 4.1: Slide-Over - Open and Close

**Goal:** Verify slide-over panel opens and closes correctly.

**Steps:**
1. Navigate to `/#/contacts`
2. Click on any contact row
3. Observe slide-over
4. Click close button or outside panel

**Expected Results:**
- [ ] Slide-over opens from right at 40vw width
- [ ] Contact name shows in header
- [ ] Breadcrumb navigation displays
- [ ] Close button (X) is functional
- [ ] Panel closes smoothly

---

### Test 4.2: Slide-Over - Details Tab

**Goal:** Verify Details tab content and editing.

**Steps:**
1. Open contact slide-over
2. Click "Details" tab (default)
3. Toggle edit mode

**Expected Results:**
- [ ] Contact details display in view mode
- [ ] Edit button toggles to edit mode
- [ ] Form fields become editable
- [ ] Save/Cancel buttons appear
- [ ] Changes persist after save

---

### Test 4.3: Slide-Over - Activities Tab

**Goal:** Verify Activities tab displays activity timeline.

**Steps:**
1. Open contact slide-over
2. Click "Activities" tab
3. Review activity list

**Expected Results:**
- [ ] Activities tab shows activity icon
- [ ] Activity count badge displays (if activities exist)
- [ ] Activities list shows recent activities
- [ ] Quick-log activity option available (if implemented)
- [ ] Empty state if no activities

---

### Test 4.4: Slide-Over - Notes Tab

**Goal:** Verify Notes tab functionality.

**Steps:**
1. Open contact slide-over
2. Click "Notes" tab
3. Review and add notes

**Expected Results:**
- [ ] Notes tab shows notes icon
- [ ] Notes count badge displays (if notes exist)
- [ ] Existing notes display
- [ ] Add note functionality works
- [ ] Notes support HTML (sanitized)
- [ ] Max 5000 character limit enforced

---

### Test 4.5: Slide-Over - Quick Add Task

**Goal:** Verify Quick Add Task button in slide-over header.

**Steps:**
1. Open contact slide-over
2. Locate Quick Add Task button in header actions
3. Click to add task

**Expected Results:**
- [ ] Quick Add Task button visible
- [ ] Task creation flow opens
- [ ] Contact is pre-linked to task
- [ ] Task saves successfully

---

### Test 4.6: Slide-Over - Hierarchy Breadcrumb

**Goal:** Verify organization hierarchy breadcrumb navigation.

**Steps:**
1. Open contact slide-over
2. Observe breadcrumb component
3. Click on organization link

**Expected Results:**
- [ ] Breadcrumb shows Contact > Organization hierarchy
- [ ] Organization name is clickable
- [ ] Clicking navigates to organization record

---

## Section 5: Quick Create Popover Tests

### Test 5.1: Quick Create - Trigger from Autocomplete

**Goal:** Verify quick create popover appears when contact not found.

**Steps:**
1. Navigate to a form with contact autocomplete (e.g., Activity create)
2. Type a name that doesn't exist: `NewPerson [Timestamp]`
3. Wait for "No results" or "Create" option
4. Click to trigger quick create

**Expected Results:**
- [ ] Popover opens with pre-filled first name
- [ ] First Name, Last Name, Email fields visible
- [ ] "Just use name" button available
- [ ] "Create" and "Cancel" buttons present

---

### Test 5.2: Quick Create - Full Form Submission

**Goal:** Verify creating contact with all quick create fields.

**Steps:**
1. Trigger quick create popover
2. Fill in:
   - First Name: `Quick [Timestamp]`
   - Last Name: `Create`
   - Email: `quick@test.com`
3. Click "Create"

**Expected Results:**
- [ ] All fields validate before submit
- [ ] Contact is created successfully
- [ ] Success notification appears
- [ ] Popover closes
- [ ] New contact selected in autocomplete

---

### Test 5.3: Quick Create - "Just use name" Flow

**Goal:** Verify minimal creation with just first name.

**Steps:**
1. Trigger quick create popover
2. Leave Last Name and Email empty
3. Click "Just use name" button

**Expected Results:**
- [ ] Contact created with only first name
- [ ] quickCreate flag bypasses validation
- [ ] No email or last name required
- [ ] Contact appears in autocomplete selection

---

### Test 5.4: Quick Create - Validation Errors

**Goal:** Verify validation error display in popover.

**Steps:**
1. Trigger quick create popover
2. Clear the first name field
3. Click "Create"

**Expected Results:**
- [ ] "First name required" error appears
- [ ] Error has `role="alert"` for accessibility
- [ ] Input has `aria-invalid="true"`
- [ ] Form does not submit
- [ ] Focus moves to error field

---

## Section 6: Validation Edge Cases

### Test 6.1: Email Array - Multiple Emails

**Goal:** Verify contact can have multiple emails with types.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Add first email with type "Work"
3. Add second email with type "Home"
4. Add third email with type "Other"
5. Save contact

**Expected Results:**
- [ ] Multiple email entries allowed
- [ ] Each email has type selector (work/home/other)
- [ ] All emails save correctly as JSONB array
- [ ] Each email validated for format
- [ ] Max 254 characters per email enforced

---

### Test 6.2: Email Validation - Invalid Format

**Goal:** Verify invalid email format is rejected.

**Test Data:** `not-an-email`, `missing@domain`, `@nodomain.com`

**Steps:**
1. Navigate to `/#/contacts/create`
2. Enter invalid email format
3. Attempt to save

**Expected Results:**
- [ ] "Invalid email address" error appears
- [ ] Form prevents submission
- [ ] Error message is accessible (aria attributes)

---

### Test 6.3: Manager Cannot Be Self

**Goal:** Verify circular reference validation prevents self-manager.

**Steps:**
1. Navigate to edit an existing contact
2. Find the Manager field
3. Search for and select the same contact as manager
4. Attempt to save

**Expected Results:**
- [ ] "Contact cannot be their own manager" error
- [ ] Form prevents submission
- [ ] Validation catches circular reference

---

### Test 6.4: LinkedIn URL Validation

**Goal:** Verify LinkedIn URL validation accepts valid formats.

**Test Data:**
- Valid: `https://www.linkedin.com/in/username`
- Valid: `https://linkedin.com/company/test`
- Invalid: `https://facebook.com/user`
- Invalid: `not-a-url`

**Steps:**
1. Navigate to contact create/edit
2. Enter LinkedIn URL in the LinkedIn field
3. Test each format above

**Expected Results:**
- [ ] Valid LinkedIn URLs accepted (with/without www)
- [ ] Invalid domains rejected: "URL must be from linkedin.com"
- [ ] Invalid URLs rejected
- [ ] Empty/null allowed (optional field)

---

### Test 6.5: Notes HTML Sanitization

**Goal:** Verify notes field sanitizes HTML content.

**Test Data:**
- Input: `<script>alert('xss')</script>Normal text`
- Input: `<b>Bold</b> and <a href="javascript:void(0)">link</a>`

**Steps:**
1. Navigate to contact edit (Notes tab)
2. Enter HTML content in notes
3. Save and reload

**Expected Results:**
- [ ] Script tags stripped
- [ ] Dangerous attributes removed
- [ ] Safe HTML preserved (if applicable)
- [ ] Max 5000 characters enforced

---

### Test 6.6: Required Fields - Organization

**Goal:** Verify organization is required (no orphan contacts).

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill all fields EXCEPT organization
3. Attempt to save

**Expected Results:**
- [ ] "Organization is required" error
- [ ] Error message mentions: "contacts cannot exist without an organization"
- [ ] Form prevents submission

---

### Test 6.7: Required Fields - Account Manager

**Goal:** Verify sales_id (Account Manager) is required.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill all fields EXCEPT Account Manager
3. Attempt to save

**Expected Results:**
- [ ] "Account manager is required" error
- [ ] Form prevents submission

---

### Test 6.8: String Length Limits

**Goal:** Verify max length constraints are enforced.

**Test Data:**
- First Name: 101 characters (exceeds 100)
- Last Name: 101 characters (exceeds 100)
- Title: 101 characters (exceeds 100)
- Department: 101 characters (exceeds 100)

**Steps:**
1. Enter values exceeding max lengths
2. Attempt to save

**Expected Results:**
- [ ] "First name too long" error for > 100 chars
- [ ] "Last name too long" error for > 100 chars
- [ ] "Title too long" error for > 100 chars
- [ ] "Department too long" error for > 100 chars
- [ ] Form prevents submission

---

### Test 6.9: Phone Number Format

**Goal:** Verify phone number array with types.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Add phone number with type "Work"
3. Add second phone with type "Home"
4. Save contact

**Expected Results:**
- [ ] Multiple phone entries allowed
- [ ] Each phone has type selector
- [ ] Max 30 characters per phone enforced
- [ ] JSONB array saves correctly

---

### Test 6.10: Department Type Enum

**Goal:** Verify department_type accepts only valid enum values.

**Valid Values:**
- senior_management
- sales_management
- district_management
- area_sales
- sales_specialist
- sales_support
- procurement

**Steps:**
1. Navigate to contact create/edit
2. Find department type field (if exposed in UI)
3. Verify dropdown only shows valid options

**Expected Results:**
- [ ] Dropdown shows exactly 7 options
- [ ] Selection saves correctly
- [ ] Invalid values rejected at API boundary

---

## Section 7: Viewport Testing

### Test 7.1: Desktop Layout (1440px+)

**Steps:**
1. Set viewport to 1440x900
2. Navigate through contacts module

**Expected Results:**
- [ ] All 7 columns visible in datagrid
- [ ] Slide-over opens at 40vw
- [ ] Search bar fully visible
- [ ] Filter sidebar visible
- [ ] Comfortable touch targets

---

### Test 7.2: iPad Landscape (1024x768)

**Steps:**
1. Set viewport to 1024x768
2. Navigate through contacts module

**Expected Results:**
- [ ] Avatar column hidden
- [ ] Role column hidden
- [ ] Notes column hidden
- [ ] Last Activity column hidden
- [ ] Name, Organization, Status visible
- [ ] Slide-over width adjusts appropriately
- [ ] Touch targets minimum 44x44px

---

### Test 7.3: iPad Portrait (768x1024)

**Steps:**
1. Set viewport to 768x1024
2. Navigate through contacts module

**Expected Results:**
- [ ] Essential columns visible (Name, Organization, Status)
- [ ] Search accessible
- [ ] Filter may collapse to icon
- [ ] Slide-over takes more width
- [ ] Forms remain usable
- [ ] Touch targets 44x44px minimum

---

## Section 8: Console Monitoring Checklist

Monitor browser console (DevTools > Console) during all tests:

### RLS (Row Level Security) Errors
- [ ] No "permission denied" errors
- [ ] No "row-level security" errors
- [ ] No PostgreSQL error code "42501"
- [ ] No "policy" violation messages

### React Errors
- [ ] No "Uncaught" exceptions
- [ ] No React key warnings in lists
- [ ] No React hook rule violations
- [ ] No component lifecycle errors
- [ ] No state update on unmounted component warnings

### Network Errors
- [ ] No 401 Unauthorized responses
- [ ] No 403 Forbidden responses
- [ ] No 500 Internal Server errors
- [ ] No failed API requests
- [ ] No CORS errors

### Acceptable Console Messages
- ResizeObserver loop errors (known browser quirk)
- Development-only warnings
- React StrictMode double-render messages

---

## Section 9: Pass Criteria

### Critical Tests (MUST PASS)
1. Test 1.1: Create Contact - Minimal Required Fields
2. Test 1.3: Read - Contact List Display
3. Test 1.5: Update Contact - Edit via Slide-Over
4. Test 4.1: Slide-Over - Open and Close
5. Test 4.2: Slide-Over - Details Tab
6. Test 6.6: Required Fields - Organization
7. Test 6.7: Required Fields - Account Manager
8. Test 7.1: Desktop Layout (1440px+)

### Important Tests (SHOULD PASS)
1. All CSV Import Tests (Section 2)
2. All Tag Management Tests (Section 3)
3. All Quick Create Tests (Section 5)
4. Remaining Validation Tests (Section 6)
5. Tablet Viewport Tests (7.2, 7.3)

### Overall Pass Criteria
- **All Critical Tests:** 100% pass required
- **Important Tests:** 90% pass required
- **Console Monitoring:** No RLS or React errors

---

## Notes

### Test Data Cleanup
After testing, consider cleaning up test data:
- Test contacts with "[Timestamp]" in names
- Test tags created during testing
- Imported test records

### Known Limitations
1. Email-to-name parsing may vary based on email format complexity
2. CSV import rate limiting resets after configured time window
3. Tag colors limited to predefined palette

### Reporting Issues
If a test fails:
1. Capture screenshot
2. Copy console errors
3. Note exact URL and state
4. Record viewport dimensions
5. Document steps to reproduce
