# Claude Code E2E Test Prompt

Copy and paste this to Claude Code with browser access:

---

## Prompt:

I need you to test these audit remediation changes on localhost:5173. Please use the browser to verify each test.

**Prerequisites**: The dev server should be running. Log in first if needed.

### Test 1: Sample Follow-up Validation (WG-001)

1. Go to http://localhost:5173/#/activities/create
2. Fill in: Subject="Test Sample", Activity Date=today, select any Contact
3. Set Type="sample", Sample Status="sent"
4. Set Follow-up Required=false (unchecked)
5. Try to save
6. **VERIFY**: Should show error "Sample activities require follow-up"
7. Then set Follow-up Required=true, add a future Follow-up Date, save again
8. **VERIFY**: Should save successfully

### Test 2: Win/Loss Reason Required (WG-002)

1. Go to http://localhost:5173/#/opportunities
2. Switch to Kanban view if not already
3. Find any opportunity NOT in Closed Won/Lost
4. Drag it to "Closed Won" column
5. In the modal, leave Win Reason empty
6. Try to save
7. **VERIFY**: Should require win_reason field
8. Fill in a win reason and save
9. **VERIFY**: Should save successfully

### Test 3: Cache Invalidation (SS-001)

1. Go to http://localhost:5173/#/contacts
2. Click on any contact to open details
3. Edit a field (e.g., change the title to "E2E Test Title")
4. Save
5. **VERIFY**: The updated value should appear immediately without refresh

### Test 4: Dashboard Loads Without Errors

1. Go to http://localhost:5173/#/dashboard
2. Wait for it to fully load
3. Open browser DevTools Console
4. **VERIFY**: No unhandled errors or red console messages related to our code

### Report Results:

After testing, report which tests passed/failed in this format:

```
WG-001 (Sample follow-up): PASS/FAIL - [notes]
WG-002 (Win/loss reason): PASS/FAIL - [notes]
SS-001 (Cache invalidation): PASS/FAIL - [notes]
Dashboard: PASS/FAIL - [notes]
```

---

## Quick Version (if time is limited):

Test just these two critical validations:

1. **Sample follow-up**: Create activity with type="sample", status="sent", follow_up=false → should fail validation
2. **Win/loss reason**: Drag opportunity to Closed Won without reason → should fail validation
