# E2E Field Validation Test: Activities

**URL:** http://localhost:5173/#/activities
**Goal:** Verify all Activity data fields display, accept input, validate, and persist correctly. This includes the full Activity form AND the QuickLogActivityDialog for rapid entry.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)
3. Ensure at least one Contact, Organization, and Opportunity exist for relationship testing

---

## Test Sequence

### Phase 1: Activity List Validation

- [ ] Navigate to http://localhost:5173/#/activities
- [ ] Verify columns display: Subject, Type, Activity Type, Date, Contact/Organization, Opportunity, Sentiment
- [ ] Check no "undefined", "null", or empty cells where data should exist
- [ ] Test text filter (search by subject)
- [ ] Test type filter dropdown (13 activity types)
- [ ] Test activity_type filter (engagement vs interaction)
- [ ] Test sentiment filter (positive, neutral, negative)
- [ ] Verify sorting on Date column (newest first by default)
- [ ] Verify sorting on Subject column
- [ ] Confirm row click opens SlideOver or navigates to edit
- [ ] Screenshot any display issues

### Phase 2: Create Activity Form

#### Full Activity Form

- [ ] Click "Create" button
- [ ] Test each field:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Subject | empty, whitespace-only, >255 chars | "Follow-up call with prospect" | Required error, max length enforced |
| Type | - | Select from dropdown | Dropdown shows all 13 types (call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note, sample) |
| Activity Type | - | Select "engagement", "interaction", or "task" | Default "interaction", controls opportunity_id requirement |
| Activity Date | - | Date picker | Default to today |
| Contact | - | Select from dropdown | **Conditional** - required if no organization (EXCEPT for tasks) |
| Organization | - | Select from dropdown | **Conditional** - required if no contact (EXCEPT for tasks) |
| Opportunity | - | Select from dropdown | **Required for interactions**, must be empty for engagements |

**Note**: Tasks (activity_type='task') can exist independently without contact/organization. All other activity types must have at least one.
| Duration (minutes) | negative, decimal | 30 | Positive integer only |
| Description | >5000 chars | "Discussed pricing options" | Max length enforced, HTML sanitized |
| Outcome | >2000 chars | "Agreed to schedule demo" | Max length enforced, HTML sanitized |
| Sentiment | - | Select from dropdown | positive, neutral, negative |
| Location | >255 chars | "Client office" | Max length enforced |
| Follow-up Required | - | Toggle checkbox | Boolean, default false |
| Follow-up Date | - | Date picker | **Required when follow_up_required=true** |
| Follow-up Notes | >5000 chars | "Call back next week" | Max length enforced, HTML sanitized |
| Sample Status | - | Select from dropdown | **Required when type="sample"** (sent, received, feedback_pending, feedback_received) |

- [ ] Submit empty form - verify required errors show (subject, contact/organization)
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Verify error messages have `role="alert"` or linked via `aria-describedby`
- [ ] Fill all fields correctly and submit
- [ ] Confirm redirect and new activity appears in list

#### QuickLogActivityDialog Testing

- [ ] Open QuickLogActivityDialog (typically via FAB or toolbar button)
- [ ] Verify dialog opens with proper modal behavior
- [ ] Test quick-entry fields:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Activity Type | - | Select from grouped dropdown | Grouped by Communication, Meetings, Documentation |
| Outcome | - | Select from dropdown | Connected, Left Voicemail, No Answer, Completed, Rescheduled |
| Date | - | Date picker | Default to today |
| Duration | negative | 15 | Optional, positive number |
| Contact | - | Select from dropdown | **Conditional** - required if no organization |
| Organization | - | Select from dropdown | **Conditional** - required if no contact |
| Notes | empty, whitespace-only | "Discussed new product line" | **Required**, min 1 char |
| Create Follow-up | - | Toggle checkbox | Boolean, default false |
| Follow-up Date | - | Date picker | **Required when createFollowUp=true** |
| Sample Status | - | Select from dropdown | **Required when activityType="Sample"** |

- [ ] Verify draft persistence (close dialog, reopen, data retained)
- [ ] Submit with missing contact/organization - verify error
- [ ] Submit with all required fields - verify success and dialog closes
- [ ] Confirm activity appears in list after submission

### Phase 3: Edit Activity Form

- [ ] Open existing activity from list
- [ ] Verify all fields pre-populated correctly
- [ ] Test edit scenarios:
  - [ ] Change subject -> Save -> Reload -> Verify persisted
  - [ ] Change type from "call" to "email" -> Save -> Verify persisted
  - [ ] Change activity_type from "interaction" to "engagement" -> Verify opportunity_id clears/disabled
  - [ ] Toggle follow_up_required -> Verify follow_up_date becomes required
  - [ ] Clear required field -> Verify error appears on save
- [ ] Test Cancel button doesn't save changes

#### Sample Status Workflow Testing

- [ ] Create or edit activity with type="sample"
- [ ] Verify sample_status field becomes visible and required
- [ ] Test workflow progression:
  - [ ] Set status to "sent" -> Verify follow_up_required auto-enables (or error if not set)
  - [ ] Set status to "received" -> Verify follow_up_date still required
  - [ ] Set status to "feedback_pending" -> Verify follow_up_date still required
  - [ ] Set status to "feedback_received" -> Verify follow_up_date no longer required (workflow complete)
- [ ] Change type away from "sample" -> Verify sample_status clears/hides

### Phase 4: Activity SlideOver/Detail View

- [ ] Click activity row to open SlideOver (if applicable)
- [ ] Verify displays: Subject, type badge, activity date, description
- [ ] Check related sections:
  - [ ] Contact link is clickable (if set)
  - [ ] Organization link is clickable (if set)
  - [ ] Opportunity link is clickable (for interactions)
  - [ ] Sentiment indicator displays correctly
  - [ ] Follow-up section shows when follow_up_required=true
  - [ ] Sample status badge shows when type="sample"
- [ ] Verify tabs (if present): Details, Notes, History
- [ ] Verify Edit button opens edit form
- [ ] Verify Delete button (soft delete) works with confirmation

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable
- [ ] Focus states visible on all inputs and buttons
- [ ] Buttons/clickable areas >= 44px tall (check with dev tools)
- [ ] Error messages readable (not just color-coded)
- [ ] Type dropdown keyboard navigable
- [ ] Date pickers accessible via keyboard
- [ ] QuickLogActivityDialog:
  - [ ] Focus trapped within modal when open
  - [ ] Escape key closes dialog
  - [ ] Focus returns to trigger element on close
- [ ] Screen reader announces:
  - [ ] Required field indicators
  - [ ] Error messages when validation fails
  - [ ] Conditional field state changes

### Phase 6: Edge Cases

#### Conditional Validation Rules

- [ ] **Interaction requires opportunity_id:**
  - [ ] Set activity_type="interaction", leave opportunity_id empty -> Error: "Opportunity is required for interaction activities"
- [ ] **Engagement cannot have opportunity_id:**
  - [ ] Set activity_type="engagement", select an opportunity -> Error: "Opportunity should not be set for engagement activities"
- [ ] **At least one entity required:**
  - [ ] Leave both contact_id and organization_id empty -> Error: "Either contact or organization is required"
- [ ] **Sample type requires sample_status:**
  - [ ] Set type="sample", leave sample_status empty -> Error: "Sample status is required for sample activities"
- [ ] **Non-sample type cannot have sample_status:**
  - [ ] Set type="call", try to set sample_status -> Error: "Sample status should only be set for sample activities"
- [ ] **Active sample statuses require follow-up:**
  - [ ] Set type="sample", sample_status="sent", follow_up_required=false -> Error: "Sample activities require follow-up when status is active"
  - [ ] Set type="sample", sample_status="received", leave follow_up_date empty -> Error: "Follow-up date is required for active sample activities"
  - [ ] Set type="sample", sample_status="feedback_received", follow_up_required=false -> Should pass (workflow complete)

#### Other Edge Cases

- [ ] Create activity with minimum required fields only (subject, contact OR organization)
- [ ] Create activity with all fields filled
- [ ] Test activity with very long subject (near 255 char limit)
- [ ] Test activity with very long description (near 5000 char limit)
- [ ] Test all 13 activity types in dropdown
- [ ] Test sentiment values display with appropriate visual indicators
- [ ] Test date picker with past and future dates
- [ ] Test QuickLogActivityDialog rapid-fire entry (submit, reopen, submit again)
- [ ] Test activity list pagination with many activities

---

## Expected Activity Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| subject | string | YES | min 1, max 255, not empty/whitespace |
| type | enum | NO | call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note, sample; default "call" |
| activity_type | enum | NO | engagement, interaction; default "interaction" |
| activity_date | date | NO | coerce date, default today |
| contact_id | number | CONDITIONAL | Required if no organization_id |
| organization_id | number | CONDITIONAL | Required if no contact_id |
| opportunity_id | number | CONDITIONAL | Required for interactions, must be empty for engagements |
| duration_minutes | number | NO | positive integer |
| description | text | NO | max 5000, HTML sanitized |
| outcome | text | NO | max 2000, HTML sanitized |
| sentiment | enum | NO | positive, neutral, negative |
| location | string | NO | max 255 |
| attendees | string[] | NO | max 50 entries, max 255 per entry |
| attachments | string[] | NO | max 20 entries, max 2048 per URL |
| tags | (string\|number)[] | NO | max 20 entries, max 100 per string |
| follow_up_required | boolean | NO | default false |
| follow_up_date | date | CONDITIONAL | Required when follow_up_required=true |
| follow_up_notes | text | NO | max 5000, HTML sanitized |
| sample_status | enum | CONDITIONAL | sent, received, feedback_pending, feedback_received; Required when type="sample" |

### QuickLogForm Fields

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| activityType | enum | YES | Title Case display values (Call, Email, etc.); default "Call" |
| outcome | enum | YES | Connected, Left Voicemail, No Answer, Completed, Rescheduled |
| date | date | NO | default today |
| duration | number | NO | min 0 |
| contactId | number | CONDITIONAL | Required if no organizationId |
| organizationId | number | CONDITIONAL | Required if no contactId |
| opportunityId | number | NO | Optional |
| notes | string | YES | min 1, HTML sanitized |
| createFollowUp | boolean | NO | default false |
| followUpDate | date | CONDITIONAL | Required when createFollowUp=true |
| sampleStatus | enum | CONDITIONAL | Required when activityType="Sample" |

---

## Sample Workflow States (PRD 4.4)

| Status | Description | Follow-up Required |
|--------|-------------|-------------------|
| sent | Sample has been sent to prospect | YES |
| received | Prospect confirmed receipt | YES |
| feedback_pending | Awaiting feedback from prospect | YES |
| feedback_received | Feedback collected (workflow complete) | NO |

---

## Report Issues As

```
**Field:** opportunity_id
**Issue:** No validation error when activity_type="interaction" but opportunity_id is empty
**Expected:** Error message "Opportunity is required for interaction activities"
**Actual:** Form submits, then API returns 400
**Severity:** High - validation should be client-side
```

---

## Success Criteria

- [ ] All required fields enforce validation (subject, conditional entity relationships)
- [ ] All 13 activity types selectable and functional
- [ ] Activity type (engagement/interaction) correctly controls opportunity_id requirement
- [ ] Sample workflow validation enforced (sample_status, follow-up requirements)
- [ ] Conditional validation rules work correctly (see Phase 6)
- [ ] QuickLogActivityDialog provides rapid entry with draft persistence
- [ ] All fields save and persist correctly
- [ ] List displays all data without errors
- [ ] Accessibility requirements met
- [ ] No console errors during testing
