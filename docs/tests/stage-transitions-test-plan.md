# Stage Transition Validation Test Plan (WF-H1-004)

**Feature:** Opportunity stage transition validation enforces linear pipeline progression
**Validation Logic:** `src/atomic-crm/validation/opportunities/opportunities-operations.ts`
**Form Integration:** `src/atomic-crm/opportunities/OpportunityEdit.tsx`

## Validation Rules

Opportunities must progress through pipeline stages in order. Can drop to `closed_lost` from any active stage (business reality). Terminal states (`closed_won`, `closed_lost`) have no valid transitions.

Valid transition map:
```
new_lead → [initial_outreach, closed_lost]
initial_outreach → [sample_visit_offered, closed_lost]
sample_visit_offered → [feedback_logged, closed_lost]
feedback_logged → [demo_scheduled, closed_lost]
demo_scheduled → [closed_won, closed_lost]
closed_won → [] (terminal)
closed_lost → [] (terminal)
```

## Test Setup

1. Start local Supabase: `supabase start`
2. Ensure database is seeded with test data
3. Navigate to Opportunity Edit form in UI
4. Open browser DevTools console to monitor validation errors

## Test Scenarios

### Valid Transitions (Should Succeed)

**Test 1: new_lead → initial_outreach**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change stage to `initial_outreach`
- [ ] Submit form
- [ ] **Expected:** Save succeeds, no validation error
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 2: initial_outreach → sample_visit_offered**
- [ ] Create opportunity with stage `initial_outreach`
- [ ] Edit opportunity, change stage to `sample_visit_offered`
- [ ] Submit form
- [ ] **Expected:** Save succeeds, no validation error
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 3: sample_visit_offered → feedback_logged**
- [ ] Create opportunity with stage `sample_visit_offered`
- [ ] Edit opportunity, change stage to `feedback_logged`
- [ ] Submit form
- [ ] **Expected:** Save succeeds, no validation error
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 4: feedback_logged → demo_scheduled**
- [ ] Create opportunity with stage `feedback_logged`
- [ ] Edit opportunity, change stage to `demo_scheduled`
- [ ] Submit form
- [ ] **Expected:** Save succeeds, no validation error
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 5: demo_scheduled → closed_won**
- [ ] Create opportunity with stage `demo_scheduled`
- [ ] Edit opportunity, change stage to `closed_won`
- [ ] Fill in required `win_reason` field
- [ ] Submit form
- [ ] **Expected:** Save succeeds, no validation error
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 6: Any active stage → closed_lost**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change stage to `closed_lost`
- [ ] Fill in required `loss_reason` field
- [ ] Submit form
- [ ] **Expected:** Save succeeds (business rule: can abandon at any stage)
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 7: Any active stage → closed_lost (from middle stage)**
- [ ] Create opportunity with stage `sample_visit_offered`
- [ ] Edit opportunity, change stage to `closed_lost`
- [ ] Fill in required `loss_reason` field
- [ ] Submit form
- [ ] **Expected:** Save succeeds
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

### Invalid Transitions (Should Fail)

**Test 8: new_lead → closed_won (skip stages)**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change stage to `closed_won`
- [ ] Fill in required `win_reason` field
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 9: new_lead → demo_scheduled (skip multiple stages)**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change stage to `demo_scheduled`
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 10: new_lead → feedback_logged (skip stages)**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change stage to `feedback_logged`
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 11: closed_won → any stage (terminal state)**
- [ ] Create opportunity with stage `closed_won`
- [ ] Edit opportunity, change stage to `new_lead`
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 12: closed_lost → any stage (terminal state)**
- [ ] Create opportunity with stage `closed_lost`
- [ ] Edit opportunity, change stage to `demo_scheduled`
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 13: initial_outreach → new_lead (backward transition)**
- [ ] Create opportunity with stage `initial_outreach`
- [ ] Edit opportunity, change stage back to `new_lead`
- [ ] Submit form
- [ ] **Expected:** Validation error: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

### Edge Cases

**Test 14: First update (no previous_stage context)**
- [ ] Create brand new opportunity with stage `new_lead`
- [ ] Immediately edit opportunity, change stage to `sample_visit_offered` (invalid jump)
- [ ] Submit form
- [ ] **Expected:** Validation triggers (previous_stage should be captured from initial load)
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail
- [ ] **Note:** This tests that initialStageRef captures the stage on first render

**Test 15: Stage unchanged (no validation needed)**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change a different field (e.g., name) but leave stage unchanged
- [ ] Submit form
- [ ] **Expected:** Save succeeds (validation logic skips when stage not changing)
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 16: Partial update without stage field**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit opportunity, change only the priority field
- [ ] Submit form
- [ ] **Expected:** Save succeeds (no stage in payload → no validation)
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail

**Test 17: Multiple edits (previous_stage persistence)**
- [ ] Create opportunity with stage `new_lead`
- [ ] Edit 1: Change stage `new_lead` → `initial_outreach` (valid)
- [ ] Save successfully
- [ ] Edit 2: Try to change stage `initial_outreach` → `new_lead` (invalid backward)
- [ ] Submit form
- [ ] **Expected:** Second edit should fail validation
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail
- [ ] **Note:** Tests that initialStageRef resets between edit sessions

**Test 18: Kanban drag-and-drop (if applicable)**
- [ ] Navigate to Kanban board view
- [ ] Drag opportunity from `new_lead` column to `closed_won` column
- [ ] **Expected:** Validation error on drop (same validation logic)
- [ ] **Actual:** ___________________
- [ ] **Status:** Pass / Fail
- [ ] **Note:** If Kanban uses different code path, may need separate implementation

## Test Results Summary

**Date Tested:** ___________________
**Tester:** ___________________
**Environment:** Local Supabase / Staging / Production

**Results:**
- Total Tests: 18
- Passed: _____ / 18
- Failed: _____ / 18
- Skipped: _____ / 18

**Critical Failures:**
- Test #: _____ - Description: _____________________
- Test #: _____ - Description: _____________________

**Notes:**
- ___________________
- ___________________

## SQL Test Helpers

Create test opportunity directly in database:

```sql
-- Setup: Create test opportunity
INSERT INTO opportunities (
  name,
  customer_organization_id,
  principal_organization_id,
  stage,
  priority,
  status,
  estimated_close_date
)
VALUES (
  'Test Opportunity - Stage Validation',
  (SELECT id FROM organizations WHERE organization_type = 'customer' LIMIT 1),
  (SELECT id FROM organizations WHERE organization_type = 'principal' LIMIT 1),
  'new_lead',
  'medium',
  'active',
  NOW() + INTERVAL '30 days'
)
RETURNING id, name, stage;

-- Verify opportunity exists
SELECT id, name, stage, created_at
FROM opportunities
WHERE name LIKE 'Test Opportunity - Stage Validation%'
ORDER BY created_at DESC
LIMIT 5;

-- Cleanup after testing
DELETE FROM opportunities
WHERE name LIKE 'Test Opportunity - Stage Validation%';
```

## Integration Notes

**Form Implementation:**
- `OpportunityEdit.tsx` captures initial stage in `initialStageRef` on component mount
- Form's `transform` prop injects `previous_stage` when stage field is present in update
- Validation occurs in `updateOpportunitySchema.refine()` at lines 382-401

**Validation Flow:**
1. User loads opportunity edit form → `initialStageRef` captures current stage
2. User changes stage field → Form includes both `stage` and `previous_stage` in payload
3. Zod schema validates transition → Checks `VALID_STAGE_TRANSITIONS` map
4. If invalid → Returns field-level error on `stage` field
5. If valid → Proceeds to database update

**Error Display:**
- Field-level error appears on stage select input
- Error message: "Invalid stage transition. Opportunities must progress through pipeline stages in order."
- Form submission is blocked until stage is corrected

## Known Limitations

1. **Kanban Drag-and-Drop:** If Kanban board uses different update mechanism, may need separate implementation
2. **Concurrent Updates:** If two users edit same opportunity simultaneously, validation uses stale `previous_stage`
3. **Browser Refresh:** Refreshing edit form resets `initialStageRef` to current DB value (correct behavior)
4. **API Direct Calls:** Validation only runs through form - direct API calls bypass client-side validation (rely on DB constraints)

## Follow-up Tasks

- [ ] Implement Kanban stage transition validation if not already covered
- [ ] Add E2E tests using Playwright for automated regression testing
- [ ] Consider database-level CHECK constraint for defense-in-depth
- [ ] Document stage transition rules in user-facing help text
- [ ] Add analytics tracking for validation failures (identify UX pain points)
