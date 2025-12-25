# Form Testing Manual Checklist

Manual E2E testing checklist for form validation and submission flows. Based on automated test specifications in `/tests/e2e/specs/forms/`.

## Contact Form Tests

### Error Scenarios

#### Test 1: Empty Form Validation
**Goal:** Verify that the form prevents submission when required fields are empty.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Wait for the create form to load completely
3. Do NOT fill in any fields
4. Locate the "Save & Close" button

**Expected Results:**
- [ ] Save button is disabled when form is empty
- [ ] Form displays "Required field" messages for empty required fields
- [ ] Required fields: First Name, Last Name, Organization, Account Manager, Email

**Additional Validation:**
1. Click into the First Name field
2. Click out of the field (blur)
3. Repeat for Last Name field

**Expected Results:**
- [ ] Validation state becomes visible after blur
- [ ] Save button remains disabled
- [ ] Form stays on create page (no submission)

---

#### Test 2: Missing Required Fields
**Goal:** Verify individual required field validation.

**Prerequisites:** This test verifies server-side validation behavior.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill in First Name only
3. Attempt to submit

**Expected Results:**
- [ ] Form prevents submission or shows validation errors for missing Last Name, Organization, Account Manager, and Email

**Note:** Current implementation uses inline validation with disabled submit buttons, so this scenario may not be fully testable via UI alone.

---

### Success Scenarios

#### Test 3: Minimal Valid Form Submission
**Goal:** Verify that a contact can be created with only required fields.

**Test Data:**
- First Name: `Test Contact [Timestamp]` (use current timestamp for uniqueness)
- Last Name: `User [Timestamp]`
- Email: `test.[timestamp]@example.com`
- Organization: Search for "MFB Consulting" (from seed data)
- Account Manager: Select "Admin"

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill in First Name
3. Fill in Last Name
4. Fill in Email (use the email type selector if visible)
5. Select Organization using the autocomplete/combobox
   - Type "MFB" to search
   - Select "MFB Consulting" from results
6. Select "Admin" from Account Manager dropdown
7. Click "Save & Close"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to contacts list page (`/#/contacts`)
- [ ] URL no longer contains `/create`
- [ ] No RLS (Row Level Security) errors in browser console
- [ ] No React errors in browser console

**Console Monitoring:**
- Open browser DevTools Console tab
- Filter for errors containing "RLS", "policy", or "React"
- Verify no errors appear during submission

---

#### Test 4: Full Form with All Fields
**Goal:** Verify comprehensive contact creation with all optional fields.

**Status:** SKIP - Complex due to JSONB email array UI and LinkedIn URL validation requiring multiple tabs.

**Reason:** Email type selection and LinkedIn URL fields require complex multi-tab navigation and JSONB array interactions that are difficult to test manually without flakiness.

---

#### Test 5: Save & Add Another
**Goal:** Verify "Save & Add Another" keeps user on create form and resets fields.

**Status:** SKIP - Complex email type interactions.

**Reason:** Form reset behavior with JSONB email array is complex and prone to race conditions.

---

## Activity Form Tests

### Error Scenarios

#### Test 6: Empty Activity Form
**Goal:** Verify form prevents submission when empty.

**Steps:**
1. Navigate to `/#/activities/create`
2. Wait for form to load
3. Do NOT fill in any fields
4. Locate the "Save" button

**Expected Results:**
- [ ] Save button is disabled
- [ ] Form displays inline validation messages
- [ ] Form stays on create page

---

### Success Scenarios

#### Test 7: Minimal Valid Activity
**Goal:** Create an activity with only required fields (subject, opportunity, contact).

**Test Data:**
- Subject: `Test Activity [Timestamp]`
- Opportunity: Search for "Ryan Wabeke" (from seed data)
- Contact: Search for "Hancotte" (from seed data)

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill in Subject field
3. Open Opportunity combobox (uses shadcn/ui Command component)
   - Click the trigger button
   - Type "Ryan" in the search input `[cmdk-input]`
   - Click the option containing "Ryan Wabeke" `[cmdk-item]`
4. Open Contact combobox
   - Click the trigger button
   - Type "Hancotte" in the search input
   - Click the matching option
5. Click "Save"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to activities list (`/#/activities`)
- [ ] No RLS errors in console
- [ ] No React errors in console

**Console Monitoring:**
- Verify no errors during submission
- Check for RLS policy violations
- Check for React warnings/errors

---

#### Test 8: Activity with Follow-up
**Status:** SKIP - Requires contact to belong to opportunity's customer organization (complex seed data relationship).

---

#### Test 9: Sample Activity
**Status:** SKIP - Requires complex organization relationships.

---

## Organization Form Tests

### Error Scenarios

#### Test 10: Organization Name Required
**Goal:** Verify that organization name is the only required field.

**Steps:**
1. Navigate to `/#/organizations/create`
2. Do NOT fill in any fields
3. Click "Create Organization" button

**Expected Results:**
- [ ] Form prevents submission (browser-native validation or custom validation)
- [ ] Form stays on create page (`/#/organizations/create`)
- [ ] Name input field is visible and indicates it's required

---

#### Test 11: Website URL Auto-Prefix
**Goal:** Verify that URLs without protocol are automatically prefixed with `https://`.

**Test Data:**
- Organization Name: `URL Test Org [Timestamp]`
- Website: `example.com` (no protocol)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Fill in Website field with `example.com` (no `https://`)
4. Click "Create Organization"
5. If duplicate dialog appears, click "Proceed Anyway"

**Expected Results:**
- [ ] Form submits successfully
- [ ] URL is transformed to `https://example.com` (verify in database or edit form)
- [ ] Organization is created and visible

---

### Success Scenarios

#### Test 12: Minimal Organization (Name Only)
**Goal:** Create organization with only the required name field.

**Test Data:**
- Organization Name: `Minimal Org [Timestamp]`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Leave all other fields empty
4. Click "Create Organization"
5. If duplicate dialog appears, click "Proceed Anyway"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to organization show page or list-with-panel
- [ ] Organization name is visible on the page
- [ ] No RLS or React errors in console

---

#### Test 13: Principal Organization with Website
**Goal:** Create a Principal-type organization with website.

**Test Data:**
- Organization Name: `Principal Manufacturer [Timestamp]`
- Organization Type: "Principal"
- Website: `https://example-principal.com`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Select "Principal" from Organization Type dropdown
4. Navigate to "More" tab (if website is on More tab)
5. Fill in Website with full `https://` URL
6. Click "Create Organization"
7. If duplicate dialog appears, click "Proceed Anyway"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Organization is created as Principal type
- [ ] Website is saved correctly
- [ ] No console errors

---

#### Test 14: Customer with Full Address
**Status:** SKIP - Address fields use incorrect source names (street/zip instead of address/postal_code).

**Reason:** Bug in `OrganizationMainTab.tsx` - field names don't match database schema.

---

#### Test 15: Duplicate Name Warning
**Status:** SKIP - Duplicate dialog timing is inconsistent (asynchronous API check).

**Reason:** Dialog appears asynchronously after API duplicate check completes, making timing unreliable for manual testing.

---

### Validation Edge Cases

#### Test 16: HTTP Protocol Website
**Goal:** Verify that `http://` protocol is accepted (not just `https://`).

**Test Data:**
- Organization Name: `HTTP Site Org [Timestamp]`
- Website: `http://legacy-site.com`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Fill in Website with `http://` protocol
4. Click "Create Organization"
5. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form accepts `http://` protocol
- [ ] Organization is created successfully
- [ ] Website is saved as `http://legacy-site.com`

---

#### Test 17: HTTPS Protocol Website
**Goal:** Verify that `https://` protocol is accepted.

**Test Data:**
- Organization Name: `HTTPS Site Org [Timestamp]`
- Website: `https://secure-site.com`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Fill in Website with `https://` protocol
4. Click "Create Organization"
5. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form accepts `https://` protocol
- [ ] Organization is created successfully

---

#### Test 18: Valid LinkedIn URL
**Goal:** Verify LinkedIn URL validation accepts valid formats.

**Test Data:**
- Organization Name: `LinkedIn Org [Timestamp]`
- LinkedIn URL: `https://www.linkedin.com/company/test-org`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name
3. Navigate to "More" tab (if LinkedIn URL is on More tab)
4. Fill in LinkedIn URL with `www` subdomain
5. Click "Create Organization"
6. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form accepts LinkedIn URL with `www` subdomain
- [ ] Organization is created successfully
- [ ] LinkedIn URL is saved correctly

---

#### Test 19: Empty Optional Fields
**Goal:** Verify all optional fields can be left empty.

**Test Data:**
- Organization Name: `Minimal Fields Org [Timestamp]`

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in ONLY Organization Name
3. Leave all optional fields empty:
   - Website
   - LinkedIn URL
   - Address fields
   - Description
   - Phone numbers
4. Click "Create Organization"
5. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form submits successfully with only name filled
- [ ] Organization is created
- [ ] No validation errors for empty optional fields

---

#### Test 20: Whitespace Trimming
**Goal:** Verify that leading/trailing whitespace is trimmed from organization name.

**Test Data:**
- Organization Name: `  Whitespace Org [Timestamp]  ` (with spaces before and after)

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill in Organization Name with leading and trailing spaces
3. Click "Create Organization"
4. Handle duplicate dialog if shown

**Expected Results:**
- [ ] Form submits successfully
- [ ] Organization name is saved without leading/trailing whitespace
- [ ] Organization is visible with trimmed name

---

## Notes

### Console Error Monitoring

For all success scenarios, monitor browser console for:

**RLS (Row Level Security) Errors:**
- Pattern: Contains "policy", "RLS", or "permission denied"
- Indicates database security policy violations
- Should NOT appear in any success scenario

**React Errors:**
- Pattern: Red error messages, stack traces
- Includes warnings about hooks, lifecycle, or rendering
- Should NOT appear in any success scenario

### Timestamp Test Data

Always use timestamps in test data to ensure uniqueness:
- Format: `YYYY-MM-DD HH:mm:ss` or Unix timestamp
- Example: `Test Contact 2025-12-25-143022`
- Prevents duplicate data issues across test runs

### Seed Data References

Tests reference specific seed data:
- **DEFAULT_TEST_ORGANIZATION**: MFB Consulting
- **DEFAULT_TEST_RELATIONSHIP**: Ryan Wabeke (opportunity), Hancotte (contact)
- **Account Manager**: Admin user

Verify this seed data exists before running manual tests.

### Form Navigation Patterns

**Tabbed Forms:**
- Contact Create: Main tab, More tab
- Organization Create: Main tab, More tab
- Opportunity Create: Multiple tabs for different data categories

**Combobox Interactions (shadcn/ui Command):**
- Click trigger button to open dropdown
- Use `[cmdk-input]` search box to filter options
- Click `[cmdk-item]` to select option
- Component provides keyboard navigation (Arrow keys, Enter)

### Skip Reasons

Tests are skipped for these reasons:
1. **Complex JSONB UI**: Email arrays require intricate UI interactions
2. **Multi-tab complexity**: LinkedIn URL, notes require navigating multiple tabs
3. **Seed data relationships**: Activity tests require specific organization-contact-opportunity relationships
4. **Known bugs**: Address field source names incorrect
5. **Timing issues**: Duplicate detection is asynchronous and unreliable for manual testing
