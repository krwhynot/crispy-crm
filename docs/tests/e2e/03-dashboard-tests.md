# E2E Dashboard Tests - Manual Testing Checklist

Comprehensive manual testing checklist for Dashboard V3 functionality, converted from automated E2E tests.

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

- **Browser:** Chrome, Firefox, or Safari (test on all three)
- **URL:** ${BASE_URL}/#/dashboard-v3 (or ${BASE_URL}/#/)
- **Credentials:** See environment selection table above
- **Prerequisites:** Database seeded with test data (principals, opportunities, contacts)

---

## Section A: Pipeline Drill-Down Tests

Tests the pipeline drill-down functionality when clicking principal rows in the Pipeline table.

### A1: Opening Drill-Down Sheet

**Objective:** Verify clicking a pipeline row opens the drill-down sheet.

#### Steps

1. Navigate to Dashboard V3
2. Wait for "Pipeline by Principal" heading to be visible (timeout: 10s)
3. Locate a principal row with button label "View opportunities for [Principal Name]"
4. Note the principal name from the button's aria-label
5. Click the principal row button

#### Expected Results

- ✓ Drill-down sheet opens from the right side of screen
- ✓ Sheet shows heading with the principal's name
- ✓ Sheet has role="dialog" and aria-modal="true"
- ✓ Sheet displays opportunity count (e.g., "3 opportunities" or "1 opportunity")
- ✓ No console errors (check DevTools Console)

#### Skip Condition

If no pipeline data is available (no rows with "View opportunities for" buttons), skip this test.

---

### A2: Loading State

**Objective:** Verify the sheet shows a loading state while fetching data.

#### Steps

1. Navigate to Dashboard V3
2. Click a principal row button
3. **Immediately** observe the sheet content before data loads

#### Expected Results

- ✓ Sheet opens immediately
- ✓ Loading indicator is visible (spinner, skeleton, or "Loading..." text)
- ✓ Sheet transitions from loading to loaded state
- ✓ Loading state disappears once data is fetched

#### Notes

This test requires a slow network connection or large dataset to observe. May be difficult to test manually without network throttling.

---

### A3: Opportunity Display - With Data

**Objective:** Verify the sheet displays opportunity cards correctly.

#### Steps

1. Click a principal row that has opportunities (non-zero count)
2. Wait for opportunities to load
3. Inspect the opportunity cards

#### Expected Results

- ✓ Opportunity cards are displayed
- ✓ Each card shows a stage badge (e.g., "New Lead", "Sample/Visit Offered")
- ✓ Pipeline summary stats are visible (total opportunities, stages breakdown)
- ✓ Cards are clickable/interactive
- ✓ No console errors

---

### A4: Empty State

**Objective:** Verify empty state displays for principals with no opportunities.

#### Steps

1. Click a principal row that has zero opportunities
2. Wait for sheet to load

#### Expected Results

- ✓ Sheet opens successfully
- ✓ Empty state message is displayed (e.g., "No opportunities found")
- ✓ No opportunity cards are shown
- ✓ Appropriate empty state icon or illustration
- ✓ No error messages

#### Notes

If all principals have opportunities, skip this test or temporarily remove opportunities from a principal in the database.

---

### A5: Error State

**Objective:** Verify error state displays when API fails.

#### Steps

**This test requires manual API manipulation:**

1. Open DevTools Network tab
2. Block or throttle requests to `/rest/v1/opportunities*`
3. Click a principal row
4. Wait for error state

#### Expected Results

- ✓ Error message is displayed (e.g., "Failed to load opportunities")
- ✓ No infinite loading state
- ✓ Error is user-friendly (not raw API error)
- ✓ Option to retry (if implemented)

#### Notes

Skip this test if API manipulation is not possible. This is best tested via automated tests.

---

### A6: Navigation from Drill-Down

**Objective:** Verify clicking an opportunity card navigates to the opportunity detail.

#### Steps

1. Click a principal row with opportunities
2. Wait for opportunities to load
3. Click an opportunity card
4. Observe the URL change

#### Expected Results

- ✓ Navigation occurs to `/opportunities?view=[opportunity_id]`
- ✓ Opportunity slide-over or detail view opens
- ✓ Drill-down sheet may close (implementation-dependent)
- ✓ No navigation errors

---

### A7: Keyboard Navigation - Opportunity Cards

**Objective:** Verify opportunity cards are keyboard accessible.

#### Steps

1. Click a principal row with opportunities
2. Wait for opportunities to load
3. Press `Tab` to focus the first opportunity card
4. Verify focus ring is visible
5. Press `Enter` while card is focused

#### Expected Results

- ✓ Opportunity card receives focus (visible focus ring)
- ✓ Pressing `Enter` navigates to opportunity detail
- ✓ Focus management is logical (tab order makes sense)
- ✓ All interactive elements are keyboard accessible

---

### A8: Closing Drill-Down Sheet

**Objective:** Verify all methods of closing the sheet work correctly.

#### Method 1: Close Button

1. Open drill-down sheet
2. Click the X close button (top-right corner)
3. Verify sheet closes

#### Method 2: Escape Key

1. Open drill-down sheet
2. Press `Escape` key
3. Verify sheet closes

#### Method 3: Click Outside (Backdrop)

1. Open drill-down sheet
2. Click on the dark overlay/backdrop outside the sheet
3. Verify sheet closes

#### Expected Results (All Methods)

- ✓ Sheet closes smoothly with animation
- ✓ Sheet is no longer visible in DOM
- ✓ Dashboard content is accessible again
- ✓ No console errors

---

### A9: Accessibility - ARIA Attributes

**Objective:** Verify proper ARIA attributes for screen readers.

#### Steps

1. Click a principal row
2. Inspect the sheet element (right-click → Inspect Element)
3. Check ARIA attributes

#### Expected Results - Sheet

- ✓ Sheet has `role="dialog"`
- ✓ Sheet has `aria-modal="true"`
- ✓ Sheet title is linked via `aria-labelledby`

#### Expected Results - Pipeline Row

- ✓ Principal row button has `aria-label` like "View opportunities for [Principal Name]"

#### Expected Results - Opportunity Cards

- ✓ Each opportunity card has descriptive `aria-label` (e.g., "View [Opportunity Name]")

#### Tools

Use browser DevTools Accessibility Inspector or screen reader (NVDA, JAWS, VoiceOver) for verification.

---

### A10: Reopen After Close

**Objective:** Verify drill-down can be reopened after closing.

#### Steps

1. Open drill-down sheet
2. Close via any method (Escape, X button, backdrop click)
3. Wait for close animation to complete (1 second)
4. Click the same or different principal row
5. Verify sheet opens again

#### Expected Results

- ✓ Sheet opens successfully on second attempt
- ✓ Correct principal data is loaded
- ✓ No stale data from previous open
- ✓ No console errors

---

## Section B: Quick Logger Tests

Tests the Quick Logger panel functionality on the dashboard.

### B1: Panel Visibility

**Objective:** Verify Quick Logger panel is visible and correctly labeled.

#### Steps

1. Navigate to Dashboard V3 (or main dashboard `/`)
2. Locate the "Log Activity" panel
3. Wait for panel to load (timeout: 15s)

#### Expected Results

- ✓ Panel header shows "Log Activity"
- ✓ Description text reads "quick capture for calls, meetings, and notes" (case-insensitive)
- ✓ "New Activity" button is visible and enabled
- ✓ Panel is positioned correctly in dashboard layout

---

### B2: Form Opens with All Fields

**Objective:** Verify clicking "New Activity" opens the form with all required fields.

#### Steps

1. Click "New Activity" button
2. Wait for form to appear (timeout: 5s)
3. Inspect all form sections and fields

#### Expected Results - Form Sections

- ✓ "What happened?" section is visible
- ✓ "Who was involved?" section is visible

#### Expected Results - Form Fields

- ✓ Activity Type (combobox/dropdown)
- ✓ Outcome (combobox/dropdown)
- ✓ Contact (combobox with search)
- ✓ Organization (combobox with search)
- ✓ Notes (textarea)

#### Expected Results - Action Buttons

- ✓ Cancel button
- ✓ Save & Close button
- ✓ Save & New button

---

### B3: Cancel Button Behavior

**Objective:** Verify Cancel button closes form and returns to initial state.

#### Steps

1. Click "New Activity" to open form
2. Optionally fill in some fields (not required)
3. Click "Cancel" button

#### Expected Results

- ✓ Form closes
- ✓ "New Activity" button is visible again
- ✓ Form fields are not visible
- ✓ No data is saved (verify by reopening form - fields should be empty)

---

### B4: Activity Type Selection - Conditional Fields

**Objective:** Verify selecting different activity types shows/hides duration field.

#### Test 4a: Call Activity Type

1. Open form
2. Click "Activity Type" dropdown
3. Select "Call"

**Expected Results:**
- ✓ Duration field appears
- ✓ Duration field is visible and enabled

#### Test 4b: Meeting Activity Type

1. Select "Meeting" from Activity Type
2. Observe duration field

**Expected Results:**
- ✓ Duration field appears

#### Test 4c: Email Activity Type

1. Select "Email" from Activity Type
2. Observe duration field

**Expected Results:**
- ✓ Duration field is **NOT** visible

#### Test 4d: Note Activity Type

1. Select "Note" from Activity Type
2. Observe duration field

**Expected Results:**
- ✓ Duration field is **NOT** visible

---

### B5: Smart Entity Cascade - Contact Auto-fills Organization

**Objective:** Verify selecting a contact automatically fills the organization field.

#### Steps

1. Open form
2. Click "Contact" combobox
3. Wait for contact options to load
4. Type "and" in the search box to filter contacts
5. Wait for filtered options to appear
6. Click the first contact in the list
7. Wait for popover to close
8. Observe the "Organization" field

#### Expected Results

- ✓ Contact is selected (name appears in Contact field)
- ✓ Organization field is auto-filled with the contact's organization
- ✓ Organization field is visible and accessible
- ✓ No console errors

#### Notes

If the selected contact has no organization, the Organization field will remain empty. This is expected behavior.

---

### B6: Smart Entity Cascade - Organization Filters Contacts

**Objective:** Verify selecting an organization first filters available contacts.

#### Steps

1. Open form
2. Click "Organization" combobox
3. Wait for organization options to load
4. Select the first organization
5. Verify organization name appears in the field
6. Click "Contact" combobox
7. Observe available contacts

#### Expected Results

- ✓ Organization is selected
- ✓ Contact combobox shows filtered contacts (those belonging to selected organization)
- ✓ Search functionality works within filtered contacts
- ✓ Can press Escape to close without selecting

#### Notes

Implementation may show all contacts or filtered contacts depending on feature scope.

---

### B7: Activity Submission - Follow-up Activity

**Objective:** Verify logging a Follow-up activity with contact and organization.

#### Steps

1. Click "New Activity"
2. Select Activity Type: **Follow-up**
3. Select Outcome: **Completed**
4. Select an **Opportunity** first (required for interaction activities):
   - Click Opportunity combobox
   - Wait for search input to appear
   - Select first opportunity
5. Select **Contact** (filtered by opportunity's organization):
   - Click Contact combobox
   - Wait for filtered options
   - Click first contact
6. Fill **Notes**: "E2E test note - general observation. Test ID: [current timestamp]"
7. Click "Save & Close"

#### Expected Results

- ✓ Form submits successfully
- ✓ Form closes (New Activity button visible again) within 10 seconds
- ✓ Success notification appears: "Activity logged successfully" (or similar)
- ✓ No console errors
- ✓ Activity is saved to database (verify in activities list if possible)

---

### B8: Activity Submission - Follow-up Task Creation

**Objective:** Verify creating a follow-up task when enabled.

#### Steps

1. Click "New Activity"
2. Select Activity Type: **Follow-up**
3. Select Outcome: **Completed**
4. Select **Opportunity** first
5. Select **Contact** (filtered by opportunity)
6. Fill **Notes**: "Follow-up required for contract discussion. Test ID: [timestamp]"
7. Enable **Follow-up Task** switch
8. Verify "Follow-up Date" field appears
9. Click "Pick a date" button to open date picker
10. Wait for calendar grid to appear
11. Click tomorrow's date (find the day number in the calendar)
12. Press `Escape` to close calendar popover
13. Wait for popover to close
14. Click "Save & Close"

#### Expected Results

- ✓ Follow-up Task switch toggles successfully
- ✓ Follow-up Date field appears when switch is enabled
- ✓ Date picker opens and allows date selection
- ✓ Selected date is displayed in the field
- ✓ Form submits successfully
- ✓ Success notification appears within 5 seconds
- ✓ New Activity button is visible within 10 seconds
- ✓ Follow-up task is created in database (verify in tasks panel if available)

---

### B9: Save & New Flow

**Objective:** Verify "Save & New" submits activity and keeps form open for next entry.

#### Steps

1. Click "New Activity"
2. Fill first activity:
   - Activity Type: **Follow-up**
   - Outcome: **Completed**
   - Opportunity: Select first available
   - Contact: Select first available (filtered by opportunity)
   - Notes: "E2E test email - bulk pricing discussion. Test ID: [timestamp]"
3. Click "Save & New"
4. Wait for success notification
5. Observe form state

#### Expected Results

- ✓ Success notification appears: "Activity logged successfully"
- ✓ Form **stays open** (does NOT close)
- ✓ "What happened?" section is still visible
- ✓ Form is functional (can accept new input)
- ✓ Activity Type and Notes fields are enabled
- ✓ Form may or may not reset fields (implementation-dependent)

#### Notes

Form reset behavior with React Hook Form may vary. The key assertion is that the activity is logged successfully AND the form remains open for the next entry.

---

### B10: Form Validation - Notes Required

**Objective:** Verify notes field is required for submission.

#### Steps

1. Click "New Activity"
2. Fill **only** Activity Type: **Follow-up**
3. Fill **only** Outcome: **Completed**
4. Select a **Contact** (do NOT fill notes)
5. Click "Save & Close"

#### Expected Results

- ✓ Form does NOT submit
- ✓ Form remains visible ("What happened?" section still showing)
- ✓ Validation error may appear (depends on implementation)
- ✓ Notes field may be highlighted as invalid (aria-invalid)
- ✓ No success notification

---

### B11: Form Validation - Contact or Organization Required

**Objective:** Verify at least one entity (contact or organization) is required.

#### Steps

1. Click "New Activity"
2. Fill Activity Type: **Follow-up**
3. Fill Outcome: **Completed**
4. Fill Notes: "Test note without contact or org"
5. Do **NOT** select Contact or Organization
6. Click "Save & Close"

#### Expected Results

- ✓ Form does NOT submit
- ✓ Form remains visible
- ✓ Validation error may appear
- ✓ Contact or Organization field may be highlighted as required
- ✓ No success notification

---

### B12: Accessibility - Form Labels

**Objective:** Verify all form fields have accessible labels.

#### Steps

1. Click "New Activity"
2. Inspect form fields using DevTools Accessibility Inspector
3. Verify each field has an associated label

#### Expected Results

All fields are accessible by label:
- ✓ Activity Type
- ✓ Outcome
- ✓ Contact
- ✓ Organization
- ✓ Notes

#### Tools

- Browser DevTools → Accessibility tab
- Screen reader (NVDA, JAWS, VoiceOver)
- Lighthouse accessibility audit

---

### B13: Accessibility - Touch Target Size

**Objective:** Verify buttons meet minimum 44px touch target size.

#### Steps

1. Click "New Activity"
2. Inspect "Save & Close" button
3. Right-click → Inspect Element → Computed tab
4. Check width and height

#### Expected Results

- ✓ Button height ≥ 44px
- ✓ Button width ≥ 44px (or adequate for text + padding)
- ✓ All action buttons meet touch target requirements

#### Reference

WCAG 2.1 AA requires 44x44px minimum for interactive elements (level AAA: 44x44px).

---

### B14: Accessibility - Keyboard Navigation

**Objective:** Verify comboboxes and form controls are keyboard accessible.

#### Steps

1. Click "New Activity"
2. Tab to "Activity Type" combobox
3. Verify focus ring is visible
4. Press `Space` or `Enter` to open dropdown
5. Verify dropdown opens with options visible
6. Press `Escape` to close dropdown
7. Verify dropdown closes

#### Expected Results

- ✓ Combobox can be focused with Tab key
- ✓ Focus ring is visible (outline or border change)
- ✓ Space or Enter opens the dropdown
- ✓ Options are visible (e.g., "Call", "Meeting", "Email")
- ✓ Escape closes the dropdown
- ✓ Focus remains on combobox after closing

---

## Section C: Activity FAB (Floating Action Button) Tests

Tests the FAB button that opens the Log Activity sheet on Dashboard V3.

### C1: FAB Visibility and Size

**Objective:** Verify FAB is visible and meets size requirements.

#### Steps

1. Navigate to Dashboard V3
2. Locate the FAB button (floating button, likely bottom-right corner)
3. Inspect FAB element

#### Expected Results

- ✓ FAB is visible on dashboard
- ✓ FAB width ≥ 56px (Tailwind h-14 w-14)
- ✓ FAB height ≥ 56px
- ✓ FAB has accessible label "Log Activity"

#### Tools

Right-click FAB → Inspect → Computed tab to check dimensions.

---

### C2: FAB Opens Log Activity Sheet

**Objective:** Verify clicking FAB opens the Log Activity sheet.

#### Steps

1. Click the FAB button
2. Wait for sheet to open

#### Expected Results

- ✓ Log Activity sheet opens from the right side
- ✓ Sheet title is visible (e.g., "Log Activity")
- ✓ Sheet description is visible
- ✓ QuickLogForm is rendered with all fields
- ✓ Action buttons are present (Cancel, Save & Close, Save & New)

---

### C3: FAB Sheet Contains QuickLogForm

**Objective:** Verify the sheet contains the full QuickLogForm with all fields.

#### Steps

1. Click FAB to open sheet
2. Wait for form to load
3. Inspect form sections and fields

#### Expected Results

- ✓ "What happened?" section is visible
- ✓ "Who was involved?" section is visible
- ✓ Activity Type select is visible
- ✓ Outcome select is visible
- ✓ Notes textarea is visible
- ✓ Cancel, Save & Close, Save & New buttons are visible

---

### C4: Closing FAB Sheet - Escape Key

**Objective:** Verify pressing Escape closes the sheet.

#### Steps

1. Click FAB to open sheet
2. Wait for sheet to open
3. Press `Escape` key

#### Expected Results

- ✓ Sheet closes smoothly
- ✓ Sheet is no longer visible
- ✓ FAB is visible again

---

### C5: Closing FAB Sheet - Cancel Button

**Objective:** Verify clicking Cancel closes the sheet.

#### Steps

1. Click FAB to open sheet
2. Wait for form to load
3. Click "Cancel" button

#### Expected Results

- ✓ Sheet closes
- ✓ FAB is visible again

---

### C6: Closing FAB Sheet - X Close Button

**Objective:** Verify clicking the X button closes the sheet.

#### Steps

1. Click FAB to open sheet
2. Wait for sheet to open
3. Click the X close button (top-right of sheet)

#### Expected Results

- ✓ Sheet closes
- ✓ FAB is visible again

---

### C7: FAB Can Be Reopened

**Objective:** Verify FAB sheet can be reopened after closing.

#### Steps

1. Click FAB to open sheet
2. Close via Escape
3. Wait 300ms for close animation
4. Click FAB again

#### Expected Results

- ✓ Sheet opens again successfully
- ✓ Form is functional
- ✓ No console errors

---

### C8: FAB Accessibility - ARIA Attributes (Closed State)

**Objective:** Verify FAB has correct ARIA attributes when sheet is closed.

#### Steps

1. Inspect FAB element (right-click → Inspect)
2. Check attributes

#### Expected Results

- ✓ `aria-label="Log Activity"`
- ✓ `aria-expanded="false"`

---

### C9: FAB Accessibility - ARIA Attributes (Open State)

**Objective:** Verify FAB aria-expanded changes when sheet opens.

#### Steps

1. Inspect FAB `aria-expanded` attribute (should be "false")
2. Click FAB to open sheet
3. Inspect FAB `aria-expanded` attribute again

#### Expected Results

- ✓ Before opening: `aria-expanded="false"`
- ✓ After opening: `aria-expanded="true"`

---

### C10: FAB Draft Indicator - No Draft Initially

**Objective:** Verify no draft badge is shown on fresh load.

#### Steps

1. Clear localStorage (DevTools → Application → Local Storage → Clear All)
2. Reload page
3. Inspect FAB for draft badge/indicator

#### Expected Results

- ✓ No draft badge is visible
- ✓ FAB aria-label is "Log Activity" (no draft indication)

---

### C11: FAB Draft Persistence - Typing Saves Draft

**Objective:** Verify typing in notes field saves draft to localStorage.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Wait for form to load
4. Type in Notes field: "E2E test note for draft persistence"
5. Wait 700ms (for debounce)
6. Open DevTools → Application → Local Storage
7. Find key related to "activityDraft" or similar

#### Expected Results

- ✓ Draft object exists in localStorage
- ✓ Draft contains notes: "E2E test note for draft persistence"
- ✓ Draft has timestamp

---

### C12: FAB Draft Badge - Shows After Saving Draft

**Objective:** Verify draft badge appears after typing content.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Type in Notes field: "Draft content for badge test"
4. Wait 700ms (debounce)
5. Close sheet with Escape
6. Reload the page
7. Wait for page to load
8. Inspect FAB

#### Expected Results

- ✓ Draft badge is visible on FAB (e.g., small dot or icon)
- ✓ FAB aria-label is "Log Activity (draft saved)"
- ✓ Badge has warning color (yellow/amber)
- ✓ Badge has pulse animation

---

### C13: FAB Draft Persistence - Closing Retains Draft

**Objective:** Verify closing sheet without saving retains draft in localStorage.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Fill Notes: "Draft to be retained after close"
4. Wait 700ms
5. Close sheet with Escape
6. Check localStorage for draft

#### Expected Results

- ✓ Draft exists in localStorage
- ✓ Draft contains the notes text
- ✓ Draft timestamp is recent

---

### C14: FAB Draft Restoration - Reopening Restores Data

**Objective:** Verify reopening sheet restores draft data.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Fill Notes: "Draft to be restored"
4. Wait 700ms
5. Close sheet with Escape
6. Reload the page (simulates new session)
7. Wait for page to load
8. Click FAB to open sheet
9. Wait for form to load
10. Inspect Notes textarea

#### Expected Results

- ✓ Notes textarea contains "Draft to be restored"
- ✓ Other fields may also be restored (if filled)

---

### C15: FAB Draft Expiration - Expired Drafts Not Restored

**Objective:** Verify drafts older than 24 hours are not restored.

#### Steps

**This test requires manual localStorage manipulation:**

1. Open DevTools → Application → Local Storage
2. Find or create draft key (e.g., `activityDraft`)
3. Set draft with timestamp 25 hours ago:
   ```json
   {
     "formData": { "notes": "This draft is expired" },
     "timestamp": [current_time_ms - 90000000]
   }
   ```
4. Reload the page
5. Inspect FAB (should have no draft badge)
6. Click FAB to open sheet
7. Inspect Notes field

#### Expected Results

- ✓ No draft badge on FAB
- ✓ Notes field is empty (expired draft not restored)
- ✓ Expired draft removed from localStorage

---

### C16: FAB Draft - Empty Form Does Not Save Draft

**Objective:** Verify empty form does not save draft.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Wait for form to load
4. Do NOT fill any fields
5. Wait 700ms
6. Close sheet
7. Check localStorage

#### Expected Results

- ✓ No draft exists in localStorage
- ✓ No draft badge appears on FAB

---

### C17: FAB Draft - Clearing Notes Removes Draft

**Objective:** Verify clearing notes removes draft from storage.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Fill Notes: "Temporary draft"
4. Wait 700ms
5. Verify draft exists in localStorage
6. Clear Notes field (delete all text)
7. Wait 700ms
8. Check localStorage

#### Expected Results

- ✓ Draft is removed from localStorage after clearing notes
- ✓ No draft badge appears (if page is reloaded)

---

### C18: FAB Focus Return After Escape

**Objective:** Verify focus returns to FAB after closing sheet with Escape.

#### Steps

1. Click FAB to open sheet
2. Wait for sheet to open
3. Press `Escape` to close
4. Wait 200ms for focus return
5. Check which element has focus (use DevTools or screen reader)

#### Expected Results

- ✓ FAB receives focus after sheet closes
- ✓ Focus ring is visible on FAB
- ✓ Pressing Enter reopens sheet

---

### C19: FAB Sheet Accessibility - Dialog Role

**Objective:** Verify sheet has correct ARIA dialog attributes.

#### Steps

1. Click FAB to open sheet
2. Inspect sheet element
3. Check ARIA attributes

#### Expected Results

- ✓ Sheet has `role="dialog"`
- ✓ Sheet has `aria-modal="true"` (if modal)
- ✓ Sheet title has `id="log-activity-title"`
- ✓ Sheet is linked to title via `aria-labelledby="log-activity-title"`

---

### C20: FAB Visual Design - Sheet Slides In From Right

**Objective:** Verify sheet slides in from the right side of viewport.

#### Steps

1. Click FAB to open sheet
2. Observe animation direction

#### Expected Results

- ✓ Sheet slides in from the right side
- ✓ Sheet is positioned on the right half of viewport
- ✓ Smooth animation (not instant)

#### Tools

Inspect sheet bounding box:
- Right-click sheet → Inspect → Computed
- Check `x` position: should be > (viewport width / 2 - sheet width)

---

### C21: FAB Visual Design - Sheet Max Width

**Objective:** Verify sheet has max width of 420px on desktop.

#### Steps

1. Click FAB to open sheet
2. Inspect sheet element
3. Measure width

#### Expected Results

- ✓ Sheet width ≤ 420px on desktop (1440px+ viewport)
- ✓ Sheet is responsive on smaller screens

#### Tools

Right-click sheet → Inspect → Computed → width

---

### C22: FAB Form Submission - Successful Submission Clears Draft

**Objective:** Verify successful submission clears the draft from localStorage.

#### Steps

1. Clear localStorage
2. Click FAB to open sheet
3. Fill required fields:
   - Activity Type: **Follow-up**
   - Outcome: **Completed**
   - Contact: Select first available (after filtering)
   - Notes: "E2E submission test - [timestamp]"
4. Wait 700ms (draft should save)
5. Verify draft exists in localStorage
6. Click "Save & Close"
7. Wait for success notification
8. Verify sheet closes
9. Check localStorage

#### Expected Results

- ✓ Draft exists before submission
- ✓ Form submits successfully
- ✓ Sheet closes
- ✓ Draft is **removed** from localStorage after successful submission
- ✓ No draft badge on FAB (if page is reloaded)

---

## Pass Criteria

### Pipeline Drill-Down (Section A)

- **Core Tests (A1-A4, A6, A8):** Must pass
- **Optional Tests (A5, A7, A9, A10):** Recommended but can be skipped if time-constrained

### Quick Logger (Section B)

- **Core Tests (B1-B3, B7, B9):** Must pass
- **Validation Tests (B10, B11):** Must pass
- **Accessibility Tests (B12-B14):** Recommended

### Activity FAB (Section C)

- **Core Tests (C1-C7, C22):** Must pass
- **Draft Persistence (C11-C14, C17):** Must pass
- **Accessibility (C8-C9, C18-C19):** Recommended
- **Visual Design (C20-C21):** Optional

---

## Notes

- Tests assume a **seeded database** with principals, opportunities, contacts, and organizations
- Console monitoring is critical - watch for RLS errors, React errors, and network failures
- Skip conditions are noted where tests depend on specific data states
- Some tests (e.g., A5, C15) require manual API/localStorage manipulation and may be better suited for automated testing
- Run tests in order within each section for logical flow
- Total estimated time: **2-3 hours** for complete manual testing of all sections

---

## Reporting Issues

When reporting failures, include:

1. Test number and name (e.g., "B7: Activity Submission - Follow-up Activity")
2. Steps completed before failure
3. Expected vs. actual result
4. Console errors (screenshot or copy/paste)
5. Screenshots of UI state
6. Browser and version
7. Database state (if relevant)

---

## Production Safety

**Tests Safe for Production (Read-Only):**
| Test | Safe for Production | Notes |
|------|---------------------|-------|
| A1: Opening Drill-Down Sheet | Yes | Read-only view |
| A2: Loading State | Yes | Read-only observation |
| A3: Opportunity Display | Yes | Read-only view |
| A4: Empty State | Yes | Read-only view |
| A6: Navigation from Drill-Down | Yes | Read-only navigation |
| A7: Keyboard Navigation | Yes | Read-only navigation |
| A8: Closing Drill-Down Sheet | Yes | Read-only interaction |
| A9: Accessibility - ARIA | Yes | Read-only inspection |
| A10: Reopen After Close | Yes | Read-only interaction |
| B1: Panel Visibility | Yes | Read-only view |
| B2: Form Opens | Yes | Read-only view |
| B3: Cancel Button | Yes | Read-only (no save) |
| B4: Activity Type Selection | Yes | Read-only selection |
| B12-B14: Accessibility Tests | Yes | Read-only inspection |
| C1-C9: FAB Visibility/ARIA | Yes | Read-only inspection |
| C10: Draft Indicator - No Draft | Yes | Read-only check |
| C18-C21: Focus/Visual Design | Yes | Read-only inspection |

**Local-Only Tests (Create/Update Operations):**
| Test | Reason |
|------|--------|
| A5: Error State | Requires API manipulation |
| B5: Contact Auto-fills Org | May involve saving |
| B6: Org Filters Contacts | May involve saving |
| B7: Activity Submission - Follow-up | Creates activity records |
| B8: Follow-up Task Creation | Creates task records |
| B9: Save & New Flow | Creates activity records |
| B10-B11: Validation Tests | May attempt to save |
| C11-C17: Draft Persistence | Modifies localStorage |
| C22: Successful Submission Clears Draft | Creates activity records |

**Recommendation:** Run Section A read-only tests on production. Run Sections B and C activity creation tests only on local environment.
