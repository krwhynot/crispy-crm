# E2E Field Validation Test: Opportunities

**URL:** http://localhost:5173/#/opportunities
**Goal:** Verify all Opportunity data fields display, accept input, validate, and persist correctly.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)

---

## Test Sequence

### Phase 1: Opportunity List/Kanban Validation

- [ ] Navigate to http://localhost:5173/#/opportunities
- [ ] **Kanban View:**
  - [ ] Verify all stage columns display: new_lead, initial_outreach, sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost
  - [ ] Verify cards show: Name, Customer, Principal, Priority badge
  - [ ] Test drag-and-drop between stages
  - [ ] Verify stage change persists after refresh
- [ ] **List View (if available):**
  - [ ] Toggle to list view
  - [ ] Verify columns display properly
  - [ ] Test sorting and filtering
- [ ] Test filters:
  - [ ] Stage filter
  - [ ] Principal filter
  - [ ] Priority filter (low, medium, high, critical)
  - [ ] "Only Mine" toggle
- [ ] Screenshot any display issues

### Phase 2: Create Opportunity Form (Wizard)

- [ ] Click "Create" / "+" button
- [ ] **Step 1 - Basic Info:**

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Name | empty, >255 chars | "Acme Q1 Beverage Deal" | **REQUIRED**, max length enforced |
| Description | >2000 chars | "Initial discussion about..." | Max length, HTML sanitized |
| Estimated Close Date | - | Select date (default +30 days) | Date picker works |

- [ ] **Step 2 - Classification:**

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Stage | - | Select "new_lead" | **REQUIRED** - no silent default |
| Priority | - | Select "medium" | low, medium, high, critical |
| Lead Source | - | Select "referral" | referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer |

- [ ] **Step 3 - Organizations:**

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Customer Organization | empty | Select customer | **REQUIRED** - dropdown populates |
| Principal Organization | empty | Select principal | **REQUIRED** - dropdown populates |
| Distributor Organization | - | Select distributor | Optional dropdown |
| Account Manager | - | Select sales rep | Optional dropdown |

- [ ] **Step 4 - Contacts:**

| Field | Test | Expected Behavior |
|-------|------|-------------------|
| Contact IDs | Multi-select contacts | Array of valid contact IDs, rejects invalid strings |

- [ ] Complete wizard and submit
- [ ] Verify opportunity appears in correct stage column

### Phase 3: Edit Opportunity Form

- [ ] Open existing opportunity (click card or row)
- [ ] Verify all fields pre-populated correctly
- [ ] Test edit scenarios:
  - [ ] Change name -> Save -> Verify persisted
  - [ ] Change stage -> Verify kanban column updates
  - [ ] Change priority -> Verify badge updates
  - [ ] Add/remove contacts -> Verify persisted
- [ ] **Test Win/Loss Reason Fields:**
  - [ ] Change stage to "closed_won" -> Verify win_reason field appears
  - [ ] Select win reason: relationship, product_quality, price_competitive, timing, other
  - [ ] If "other" selected -> Verify close_reason_notes field required
  - [ ] Change stage to "closed_lost" -> Verify loss_reason field appears
  - [ ] Select loss reason: price_too_high, no_authorization, competitor_relationship, product_fit, timing, no_response, other
- [ ] Test Cancel button doesn't save changes

### Phase 4: Opportunity SlideOver/Detail View

- [ ] Click opportunity to open SlideOver
- [ ] **Details Tab:**
  - [ ] Verify displays: Name, stage, priority, dates
  - [ ] Customer organization link clickable
  - [ ] Principal organization link clickable
  - [ ] Distributor org shows if assigned
- [ ] **Products Tab:**
  - [ ] View associated products
  - [ ] Add/remove products if editable
- [ ] **Contacts Tab:**
  - [ ] View associated contacts
  - [ ] Contact links clickable
- [ ] **Notes Tab:**
  - [ ] View existing notes
  - [ ] Add new note
- [ ] **Activity Tab:**
  - [ ] View activity timeline
  - [ ] Log new activity

### Phase 5: Accessibility Audit

- [ ] Tab through wizard - all steps reachable
- [ ] Focus states visible on all inputs
- [ ] Stage columns have proper ARIA labels
- [ ] Drag-and-drop has keyboard alternative
- [ ] Error messages have role="alert"
- [ ] Priority badges have sufficient color contrast
- [ ] Touch targets >= 44px on mobile

### Phase 6: Edge Cases

- [ ] Create opportunity with minimum required fields only
- [ ] Create opportunity with all fields filled
- [ ] Test each stage transition in kanban
- [ ] Test closing opportunity:
  - [ ] Close as won with each win reason
  - [ ] Close as lost with each loss reason
  - [ ] Test "other" reason requires notes
- [ ] Test campaign field (max 100 chars)
- [ ] Test related_opportunity_id linking
- [ ] Test next_action and next_action_date fields
- [ ] Test decision_criteria field (max 2000 chars)
- [ ] Test tags array (max 20 tags, max 50 chars each)

---

## Expected Opportunity Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| name | string | YES | min 1, max 255 |
| description | text | NO | max 2000, HTML sanitized |
| estimated_close_date | date | YES | default +30 days |
| stage | enum | YES | new_lead, initial_outreach, sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost |
| priority | enum | YES | low, medium, high, critical |
| lead_source | enum | NO | referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer |
| customer_organization_id | number | YES | valid org FK |
| principal_organization_id | number | YES | valid org FK |
| distributor_organization_id | number | NO | valid org FK |
| account_manager_id | number | NO | valid sales FK |
| contact_ids | number[] | NO | array of valid contact FKs |
| campaign | string | NO | max 100 |
| related_opportunity_id | number | NO | valid opportunity FK |
| notes | text | NO | max 5000, HTML sanitized |
| tags | string[] | NO | max 20 items, max 50 chars each |
| next_action | string | NO | max 500 |
| next_action_date | date | NO | valid date |
| decision_criteria | text | NO | max 2000, HTML sanitized |
| win_reason | enum | conditional | relationship, product_quality, price_competitive, timing, other |
| loss_reason | enum | conditional | price_too_high, no_authorization, competitor_relationship, product_fit, timing, no_response, other |
| close_reason_notes | string | conditional | max 500, required when reason is "other" |

---

## Pipeline Stage Constants

| Stage | Display Name | Description |
|-------|--------------|-------------|
| new_lead | New Lead | Just identified |
| initial_outreach | Initial Outreach | First contact made |
| sample_visit_offered | Sample/Visit Offered | Product samples sent or visit scheduled |
| feedback_logged | Feedback Logged | Customer feedback received |
| demo_scheduled | Demo Scheduled | Formal demo/presentation scheduled |
| closed_won | Closed Won | Deal won |
| closed_lost | Closed Lost | Deal lost |

---

## Report Issues As

```
**Field:** stage
**Issue:** Changing stage to closed_won doesn't show win_reason field
**Expected:** win_reason dropdown should appear when stage is closed_won
**Actual:** No additional fields shown
**Severity:** High - required business workflow broken
```

---

## Success Criteria

- [ ] Name, stage, customer_org, principal_org enforce required validation
- [ ] Kanban drag-and-drop updates stage correctly
- [ ] Win/Loss reason fields appear conditionally
- [ ] "Other" reason requires notes
- [ ] Contact multi-select works correctly
- [ ] All organization dropdowns populate
- [ ] Wizard completes without errors
- [ ] No console errors during testing
