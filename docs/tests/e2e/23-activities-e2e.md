# E2E Manual Tests: Activities Module

Comprehensive manual E2E test checklist for the Activities module in Crispy CRM. Tests cover CRUD operations, Quick Log Dialog, sample workflow, validation edge cases, and filtering.

---

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

**Claude Chrome Commands:**
- Local: "Run activities tests against localhost:5173"
- Production: "Run activities tests against crm.kjrcloud.com"

- **Browser:** Chrome with DevTools open (F12)
- **Timestamp Format:** `2025-12-31-143022` (for unique test data)
- **Seed Data Required:**
  - Ryan Wabeke (opportunity)
  - Hancotte (contact)
  - At least one organization

### Pre-Test Checklist

- [ ] Application loads without errors
- [ ] Console tab open in DevTools
- [ ] Network tab open in DevTools
- [ ] Logged in as admin@test.com
- [ ] Seed data exists (verify at `/#/activities`)

---

## Section 1: CRUD Operations

### Test 1.1: Navigate to Activities List

**Objective:** Verify ActivityList renders correctly with 8-column datagrid.

**Steps:**
1. Navigate to `/#/activities`
2. Wait for page to load completely

**Expected Results:**
- [ ] Page loads within 5 seconds
- [ ] Datagrid displays with columns: Type, Subject, Date, Sample Status, Sentiment, Organization, Opportunity, Created By
- [ ] Sample Status and Sentiment columns show dashes for non-sample activities
- [ ] No console errors
- [ ] No RLS errors

---

### Test 1.2: Create Activity - Minimal Required Fields

**Objective:** Create an activity with only required fields.

**Test Data:**
- Subject: `Test Activity 2025-12-31-143022`
- Type: "Call" (default)
- Contact: Hancotte
- Activity Date: Today (default)

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill in Subject field with test data
3. Open Contact combobox, type "Hancotte", select from results
4. Leave all other fields as defaults
5. Click "Save"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to activities list (`/#/activities`)
- [ ] New activity appears in list with correct subject
- [ ] Type shows "Call" badge
- [ ] No console errors
- [ ] No RLS errors

---

### Test 1.3: Create Activity - All Fields

**Objective:** Create an activity with all optional fields populated.

**Test Data:**
- Subject: `Full Activity 2025-12-31-143022`
- Type: "Meeting"
- Contact: Hancotte
- Organization: (auto-filled from contact)
- Opportunity: Ryan Wabeke
- Duration: 30 minutes
- Notes: "This is a test meeting with all fields populated"
- Sentiment: "Positive"
- Follow-up Date: Tomorrow
- Location: "Conference Room A"
- Outcome: "Successful meeting"

**Steps:**
1. Navigate to `/#/activities/create`
2. Select Type: "Meeting"
3. Fill in Subject
4. Fill in Date (use date picker)
5. Fill in Duration: 30
6. Fill in Notes with test description
7. Select Contact: Hancotte
8. Select Opportunity: Ryan Wabeke
9. Select Sentiment: Positive
10. Fill in Follow-up Date
11. Fill in Follow-up Notes
12. Fill in Location
13. Fill in Outcome
14. Click "Save"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Redirects to activities list
- [ ] Activity shows "Meeting" type badge
- [ ] Sentiment shows "Positive" badge in desktop view
- [ ] No console errors

---

### Test 1.4: Edit Existing Activity

**Objective:** Edit an activity and verify changes persist.

**Steps:**
1. Navigate to `/#/activities`
2. Click on an existing activity row to open edit form
3. Change Subject to include "[EDITED]"
4. Change Sentiment to "Neutral"
5. Click "Save"

**Expected Results:**
- [ ] Edit form loads with current values
- [ ] Form submits successfully
- [ ] Returns to list
- [ ] Updated subject visible in list
- [ ] Sentiment badge updated
- [ ] No console errors

---

### Test 1.5: Delete Activity (Soft Delete)

**Objective:** Verify soft delete removes activity from list.

**Steps:**
1. Navigate to `/#/activities`
2. Note an activity's ID
3. Select the activity using checkbox
4. Click bulk delete action
5. Confirm deletion

**Expected Results:**
- [ ] Activity removed from list
- [ ] No console errors
- [ ] Activity not visible in list (soft deleted via deleted_at)

---

## Section 2: Quick Log Dialog Tests

### Test 2.1: Open Quick Log from Dashboard FAB

**Objective:** Verify Quick Log Dialog opens from floating action button.

**Steps:**
1. Navigate to `/#/dashboard-v3` or `/#/`
2. Locate floating action button (FAB) in bottom-right
3. Click FAB to open Quick Log Dialog

**Expected Results:**
- [ ] Sheet dialog slides in from right
- [ ] Dialog title shows "Log Activity"
- [ ] Form fields are visible: Activity Type, Outcome, Contact, Organization, Opportunity, Notes
- [ ] "Save & Close" and "Save & New" buttons visible
- [ ] Cancel button visible

---

### Test 2.2: Quick Log - Basic Activity

**Objective:** Log an activity via Quick Log Dialog.

**Test Data:**
- Activity Type: "Call"
- Outcome: "Connected"
- Contact: Hancotte
- Notes: `Quick log test 2025-12-31-143022`

**Steps:**
1. Open Quick Log Dialog
2. Select Activity Type: "Call"
3. Select Outcome: "Connected"
4. Search and select Contact: Hancotte
5. Enter Notes
6. Click "Save & Close"

**Expected Results:**
- [ ] Dialog closes after save
- [ ] Success toast notification appears
- [ ] Activity appears in activities list
- [ ] No console errors

---

### Test 2.3: Quick Log - Save & New

**Objective:** Verify "Save & New" saves and clears form for next entry.

**Steps:**
1. Open Quick Log Dialog
2. Fill required fields (Contact + Notes)
3. Click "Save & New"
4. Wait for save to complete

**Expected Results:**
- [ ] Success toast notification appears
- [ ] Dialog stays open
- [ ] Form fields are cleared/reset
- [ ] Ready for next entry
- [ ] Activity saved to database (check list)

---

### Test 2.4: Draft Persistence - Save Draft

**Objective:** Verify form data persists to localStorage.

**Steps:**
1. Open Quick Log Dialog
2. Enter Notes: "Draft test notes"
3. Select a Contact
4. Close dialog WITHOUT saving (click X or outside)
5. Re-open Quick Log Dialog

**Expected Results:**
- [ ] "Draft" badge appears in dialog header
- [ ] Notes field contains previously entered text
- [ ] Contact selection preserved
- [ ] localStorage key "quick-log-activity-draft" contains data

---

### Test 2.5: Draft Persistence - 24-Hour Expiry

**Objective:** Verify drafts expire after 24 hours.

**Steps:**
1. Open browser DevTools Console
2. Execute to simulate old draft:
   ```javascript
   localStorage.setItem('quick-log-activity-draft', JSON.stringify({
     formData: { notes: 'Old draft' },
     savedAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
   }));
   ```
3. Open Quick Log Dialog

**Expected Results:**
- [ ] No "Draft" badge visible
- [ ] Form starts empty (expired draft cleared)
- [ ] localStorage key removed or updated

---

### Test 2.6: Entity Context Pre-fill

**Objective:** Verify Quick Log pre-fills when opened from entity context.

**Prerequisites:** Navigate to a contact or organization slide-over that has "Log Activity" action.

**Steps:**
1. Navigate to `/#/contacts`
2. Click on a contact to open slide-over
3. Click "Log Activity" button (if available)
4. Quick Log Dialog opens

**Expected Results:**
- [ ] Contact field pre-populated and locked
- [ ] Organization field pre-populated (if contact has org)
- [ ] "Locked" badge visible on pre-filled fields
- [ ] Dialog description shows entity name

---

## Section 3: Sample Workflow Tests

### Test 3.1: Create Sample Activity - Status Required

**Objective:** Verify sample_status is required for sample activities.

**Test Data:**
- Type: "Sample"
- Subject: `Sample Activity 2025-12-31-143022`
- Contact: Hancotte

**Steps:**
1. Navigate to `/#/activities/create`
2. Select Type: "Sample"
3. Fill in Subject
4. Select Contact
5. Leave Sample Status empty
6. Click "Save"

**Expected Results:**
- [ ] Form shows validation error: "Sample status is required for sample activities"
- [ ] Form does NOT submit
- [ ] Save button may be disabled or error shown on submission

---

### Test 3.2: Create Sample Activity - With Status

**Objective:** Create a valid sample activity with status.

**Test Data:**
- Type: "Sample"
- Subject: `Sample Activity 2025-12-31-143022`
- Contact: Hancotte
- Sample Status: "Sent"

**Steps:**
1. Navigate to `/#/activities/create`
2. Select Type: "Sample"
3. Fill in Subject
4. Select Contact
5. Select Sample Status: "Sent"
6. Click "Save"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Activity appears in list
- [ ] Sample Status column shows "Sent" badge
- [ ] No console errors

---

### Test 3.3: Sample Status Workflow Progression

**Objective:** Verify sample status can progress through workflow stages.

**Workflow:** sent -> received -> feedback_pending -> feedback_received

**Steps:**
1. Create sample activity with status "Sent"
2. Edit activity, change status to "Received"
3. Save and verify
4. Edit again, change to "Feedback Pending"
5. Save and verify
6. Edit again, change to "Feedback Received"
7. Save and verify

**Expected Results:**
- [ ] Each status change saves successfully
- [ ] Badge updates in list view
- [ ] All 4 statuses: Sent, Received, Feedback Pending, Feedback Received work
- [ ] No validation errors during progression

---

### Test 3.4: Non-Sample Activity Cannot Have Sample Status

**Objective:** Verify validation prevents sample_status on non-sample activities.

**Steps:**
1. Navigate to `/#/activities/create`
2. Select Type: "Call"
3. Fill required fields
4. Attempt to set sample_status (via developer tools if not visible in UI)
5. Submit form

**Expected Results:**
- [ ] If sample_status field is visible, it should be disabled for non-sample types
- [ ] API validation rejects sample_status for non-sample activities
- [ ] Error message: "Sample status should only be set for sample activities"

---

## Section 4: Activity Type Tests

### Test 4.1: All 13 Interaction Types

**Objective:** Verify all 13 activity types can be created.

**Activity Types:**
1. Call
2. Email
3. Meeting
4. Demo
5. Proposal
6. Follow Up
7. Trade Show
8. Site Visit
9. Contract Review
10. Check In
11. Social
12. Note
13. Sample

**Steps:**
For each type:
1. Navigate to `/#/activities/create`
2. Select the activity type
3. Fill required fields (Subject, Contact)
4. Click Save
5. Verify in list

**Expected Results:**
- [ ] Call - Creates successfully, badge shows "Call"
- [ ] Email - Creates successfully, badge shows "Email"
- [ ] Meeting - Creates successfully, badge shows "Meeting"
- [ ] Demo - Creates successfully, badge shows "Demo"
- [ ] Proposal - Creates successfully, badge shows "Proposal"
- [ ] Follow Up - Creates successfully, badge shows "Follow Up"
- [ ] Trade Show - Creates successfully, badge shows "Trade Show"
- [ ] Site Visit - Creates successfully, badge shows "Site Visit"
- [ ] Contract Review - Creates successfully, badge shows "Contract Review"
- [ ] Check In - Creates successfully, badge shows "Check In"
- [ ] Social - Creates successfully, badge shows "Social"
- [ ] Note - Creates successfully, badge shows "Note"
- [ ] Sample - Creates successfully (requires sample_status), badge shows "Sample"

---

## Section 5: Engagement vs Interaction Tests

### Test 5.1: Engagement Activity (No Opportunity)

**Objective:** Verify engagement activities do not require opportunity.

**Validation Rule:** Engagement = contact OR organization, NO opportunity

**Steps:**
1. Navigate to `/#/activities/create`
2. Select Type: "Call"
3. Fill Subject
4. Select Contact only (no opportunity)
5. Click Save

**Expected Results:**
- [ ] Form submits successfully (activity_type = "engagement")
- [ ] Activity created with contact but no opportunity
- [ ] Opportunity column shows dash in list

---

### Test 5.2: Interaction Activity (Requires Opportunity)

**Objective:** Verify interaction activities require opportunity.

**Validation Rule:** Interaction = opportunity AND (contact OR organization)

**Steps:**
1. Navigate to `/#/activities/create`
2. If form has activity_type selector, set to "interaction"
3. Fill Subject
4. Select Contact
5. Leave Opportunity empty
6. Click Save

**Expected Results:**
- [ ] Form shows validation error: "Opportunity is required for interaction activities"
- [ ] Form does NOT submit
- [ ] After selecting opportunity, form submits successfully

---

### Test 5.3: At Least One Entity Required

**Objective:** Verify either contact or organization is required.

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill Subject
3. Leave Contact AND Organization empty
4. Click Save

**Expected Results:**
- [ ] Form shows validation error: "Either contact or organization is required"
- [ ] Form does NOT submit

---

## Section 6: Filtering and Export Tests

### Test 6.1: Quick Filter - Samples Only

**Objective:** Verify "Samples Only" filter works.

**Prerequisites:** Create at least one sample activity and one non-sample activity.

**Steps:**
1. Navigate to `/#/activities`
2. In sidebar filters, click "Samples Only" toggle

**Expected Results:**
- [ ] List shows only activities where type = "sample"
- [ ] Non-sample activities hidden
- [ ] Toggle button shows active state
- [ ] Click again to clear filter

---

### Test 6.2: Quick Filter - Pending Feedback

**Objective:** Verify "Pending Feedback" filter works.

**Prerequisites:** Create a sample activity with status "feedback_pending".

**Steps:**
1. Navigate to `/#/activities`
2. In sidebar filters, click "Pending Feedback" badge

**Expected Results:**
- [ ] List shows only activities where sample_status = "feedback_pending"
- [ ] Other activities hidden
- [ ] Filter state visible in URL or filter summary

---

### Test 6.3: Activity Type Multi-Select Filter

**Objective:** Verify multi-select filter for activity types.

**Steps:**
1. Navigate to `/#/activities`
2. Expand "Activity Type" filter category
3. Select "Call" toggle
4. Select "Email" toggle (both active)
5. Observe list results

**Expected Results:**
- [ ] List shows activities of type "call" OR "email"
- [ ] Other types filtered out
- [ ] Both toggles show active state
- [ ] Deselecting one keeps the other active

---

### Test 6.4: Date Range Filter - Today

**Objective:** Verify "Today" date filter.

**Steps:**
1. Navigate to `/#/activities`
2. Expand "Activity Date" filter category
3. Click "Today" toggle

**Expected Results:**
- [ ] List shows only activities with activity_date = today
- [ ] Older activities hidden
- [ ] Filter state preserved on page refresh

---

### Test 6.5: Date Range Filter - Last 7 Days

**Objective:** Verify "Last 7 Days" date filter.

**Steps:**
1. Navigate to `/#/activities`
2. Expand "Activity Date" filter category
3. Click "Last 7 Days" toggle

**Expected Results:**
- [ ] List shows activities from past 7 days
- [ ] Older activities hidden

---

### Test 6.6: Sentiment Filter

**Objective:** Verify sentiment filter toggles.

**Steps:**
1. Navigate to `/#/activities`
2. Expand "Sentiment" filter category
3. Select "Positive" toggle
4. Observe results
5. Add "Neutral" toggle
6. Observe results

**Expected Results:**
- [ ] Single sentiment selection filters correctly
- [ ] Multi-select shows activities matching any selected sentiment
- [ ] Badge colors match filter buttons (green=positive, gray=neutral, red=negative)

---

### Test 6.7: Created By - Me Filter

**Objective:** Verify "Me" filter shows only user's activities.

**Steps:**
1. Navigate to `/#/activities`
2. Expand "Created By" filter category
3. Click "Me" toggle

**Expected Results:**
- [ ] List shows only activities where created_by = current user ID
- [ ] Other users' activities hidden

---

### Test 6.8: CSV Export

**Objective:** Verify CSV export includes enriched data.

**Steps:**
1. Navigate to `/#/activities`
2. Locate export button in toolbar
3. Click export
4. Open downloaded CSV file

**Expected Results:**
- [ ] CSV downloads successfully
- [ ] File named "activities.csv"
- [ ] Headers include: id, activity_type, type, subject, description, activity_date, duration_minutes, sample_status, sentiment, contact_name, organization_name, opportunity_name, created_by, created_at
- [ ] Contact names, org names, opportunity names populated (not just IDs)
- [ ] Empty optional fields show empty string

---

### Test 6.9: Combined Filters

**Objective:** Verify multiple filters work together.

**Steps:**
1. Navigate to `/#/activities`
2. Apply "Samples Only" quick filter
3. Apply "Last 7 Days" date filter
4. Observe results

**Expected Results:**
- [ ] List shows only sample activities from last 7 days
- [ ] Both filters active simultaneously
- [ ] Clearing one filter keeps the other active

---

## Section 7: Validation Edge Cases

### Test 7.1: Subject Max Length (255 characters)

**Objective:** Verify subject field respects max length.

**Steps:**
1. Navigate to `/#/activities/create`
2. Enter a subject with 256+ characters
3. Fill other required fields
4. Click Save

**Expected Results:**
- [ ] Validation error: "Subject too long"
- [ ] Form does NOT submit
- [ ] After truncating to 255 chars, form submits

---

### Test 7.2: Description Max Length (5000 characters)

**Objective:** Verify description/notes field respects max length.

**Steps:**
1. Navigate to `/#/activities/create`
2. Enter description with 5001+ characters
3. Fill other required fields
4. Click Save

**Expected Results:**
- [ ] Form shows validation error or truncates
- [ ] Description sanitized (HTML tags stripped)

---

### Test 7.3: Follow-up Date Required When Enabled

**Objective:** Verify follow_up_date required when follow_up_required=true.

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill required fields
3. Enable "Follow-up Required" toggle
4. Leave Follow-up Date empty
5. Click Save

**Expected Results:**
- [ ] Validation error: "Follow-up date is required when follow-up is enabled"
- [ ] Form does NOT submit
- [ ] After setting date, form submits successfully

---

### Test 7.4: Duration Must Be Positive

**Objective:** Verify duration_minutes only accepts positive integers.

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill required fields
3. Enter Duration: -5
4. Click Save

**Expected Results:**
- [ ] Validation error (duration must be positive)
- [ ] Form does NOT submit
- [ ] Enter positive value (15), form submits

---

### Test 7.5: Attachments Array Limit (20 items)

**Objective:** Verify attachments field respects max 20 items.

**Note:** This may require API testing or dev tools if UI doesn't expose attachments field.

**Expected Results:**
- [ ] API rejects more than 20 attachment URLs
- [ ] Each URL max 2048 characters

---

### Test 7.6: Attendees Array Limit (50 items)

**Objective:** Verify attendees field respects max 50 items.

**Note:** This may require API testing if UI doesn't expose attendees field.

**Expected Results:**
- [ ] API rejects more than 50 attendees
- [ ] Each attendee name max 255 characters

---

## Section 8: Viewport Testing

### Test 8.1: Desktop View (1440px+)

**Objective:** Verify full datagrid displays on desktop.

**Steps:**
1. Set browser width to 1440px
2. Navigate to `/#/activities`
3. Observe datagrid columns

**Expected Results:**
- [ ] All 8 columns visible: Type, Subject, Date, Sample Status, Sentiment, Organization, Opportunity, Created By
- [ ] Columns properly aligned
- [ ] No horizontal scrolling required

---

### Test 8.2: Tablet View (768px - 1024px)

**Objective:** Verify responsive column hiding on tablet.

**Steps:**
1. Set browser width to 1024px (iPad landscape)
2. Navigate to `/#/activities`
3. Observe datagrid columns

**Expected Results:**
- [ ] Core columns visible: Type, Subject, Date, Organization
- [ ] Hidden on tablet: Sample Status, Sentiment, Opportunity, Created By
- [ ] No layout breakage
- [ ] Touch targets remain 44px minimum

---

### Test 8.3: iPad Portrait (768px)

**Objective:** Verify usability on iPad portrait.

**Steps:**
1. Set browser width to 768px
2. Navigate to `/#/activities`
3. Test filter sidebar
4. Test Quick Log Dialog

**Expected Results:**
- [ ] Sidebar filters accessible
- [ ] Datagrid readable (may show fewer columns)
- [ ] Quick Log Dialog fills appropriate width
- [ ] Touch targets usable (44px minimum)

---

### Test 8.4: Quick Log Dialog - Mobile Width

**Objective:** Verify Quick Log Dialog responsive behavior.

**Steps:**
1. Set browser to mobile width (375px)
2. Open Quick Log Dialog

**Expected Results:**
- [ ] Dialog takes full width on mobile
- [ ] All form fields accessible
- [ ] Save buttons visible
- [ ] Scrolling works if content exceeds viewport

---

## Section 9: Console Monitoring Checklist

### Error Categories to Watch

**RLS Errors:**
- [ ] No "permission denied" errors
- [ ] No "row-level security" errors
- [ ] No "42501" PostgreSQL error codes

**React Errors:**
- [ ] No "Uncaught" exceptions
- [ ] No "React" warning/error stack traces
- [ ] No hook order warnings

**Network Errors:**
- [ ] No 500 server errors
- [ ] No 403 forbidden errors
- [ ] No 401 unauthorized errors (after login)

**Validation Errors:**
- [ ] Zod errors caught and displayed in UI
- [ ] No unhandled promise rejections

---

## Section 10: Pass Criteria

### Minimum Requirements for Pass

1. **CRUD Operations:** All 5 tests pass (1.1 - 1.5)
2. **Quick Log Dialog:** At least 4 of 6 tests pass (2.1 - 2.6)
3. **Sample Workflow:** All 4 tests pass (3.1 - 3.4)
4. **Activity Types:** All 13 types create successfully (4.1)
5. **Engagement/Interaction:** All 3 tests pass (5.1 - 5.3)
6. **Filtering:** At least 7 of 9 filter tests pass (6.1 - 6.9)
7. **Validation:** At least 4 of 6 edge case tests pass (7.1 - 7.6)
8. **Viewport:** At least 3 of 4 viewport tests pass (8.1 - 8.4)
9. **Console:** No critical errors in any test

### Test Summary Table

| # | Section | Tests | Pass |
|---|---------|-------|------|
| 1 | CRUD Operations | 5 | [ ] |
| 2 | Quick Log Dialog | 6 | [ ] |
| 3 | Sample Workflow | 4 | [ ] |
| 4 | Activity Types | 1 (13 subtests) | [ ] |
| 5 | Engagement vs Interaction | 3 | [ ] |
| 6 | Filtering & Export | 9 | [ ] |
| 7 | Validation Edge Cases | 6 | [ ] |
| 8 | Viewport Testing | 4 | [ ] |
| 9 | Console Monitoring | 1 | [ ] |
| **Total** | | **39** | |

---

## Notes

### Seed Data Dependencies

- **Ryan Wabeke:** Opportunity for interaction tests
- **Hancotte:** Contact for all contact selection tests
- **admin@test.com:** User for authentication and "Created By" tests

### Known Limitations

- Draft persistence test (2.5) requires console manipulation
- Some validation tests require API-level inspection
- Attachment/attendee limit tests may require dev tools

### Timestamp Convention

Use format: `Test Activity 2025-12-31-143022`
- Year-Month-Day-HourMinuteSecond
- Ensures unique records across test runs
- Easy to identify and clean up test data

### Form Navigation Patterns

**Full Form (ActivitySinglePage):**
- 4 sections: Activity Details, Relationships, Follow-up, Outcome
- Uses FormGrid and FormSection components

**Quick Log Dialog (QuickLogForm):**
- Simplified form with key fields
- Grouped as: Activity Type, Who was involved, Notes, Follow-up
- Cascading entity selection (contact -> org -> opportunity)

### Combobox Interactions

All entity selection uses shadcn/ui Command component:
1. Click trigger button to open dropdown
2. Type in search input to filter
3. Click option to select
4. Use keyboard (Arrow keys, Enter) for navigation

---

## Production Safety

**Safe for Production:**
- [ ] Read/List operations
- [ ] View operations (slide-over, details)
- [ ] Navigation tests
- [ ] Console monitoring

**Local Only (Skip in Production):**
- [ ] Create operations
- [ ] Update operations
- [ ] Delete operations
- [ ] Bulk operations
