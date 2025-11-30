# E2E Skipped Tests Triage

**Generated:** 2025-11-29
**Purpose:** Categorize `test.skip` and `test.fixme` for resolution

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Conditional Skips (Data Dependent) | ~35 | KEEP - Appropriate behavior |
| Feature Not Implemented | 8 | FIX or DELETE |
| Obsolete/Broken | 5 | DELETE |
| Platform/Viewport Conditional | 4 | KEEP - Appropriate behavior |

## Category: KEEP - Conditional Data Skips

These skips are **appropriate** - they gracefully handle missing test data:

### `dashboard-v3/pipeline-drilldown.spec.ts` (18 skips)
```typescript
if (rowCount === 0) {
  test.skip("No pipeline data available");
}
```
**Verdict:** KEEP - Tests skip when seed data not present. This is correct behavior.

### `dashboard-v3/task-snooze.spec.ts` (8 skips)
```typescript
if (taskCount === 0) {
  test.skip("No tasks available to snooze");
}
```
**Verdict:** KEEP - Tests skip when no tasks exist. Correct conditional behavior.

### `dashboard-v3/data-flow.spec.ts` (9 skips)
```typescript
test.skip("No pipeline data available");
test.skip("No tasks available to complete");
```
**Verdict:** KEEP - Data-dependent skips. Correct behavior.

### `dashboard-v3/dashboard-v3.spec.ts` (3 skips)
```typescript
test.skip("Dashboard V3 not available");
test.skip("No tasks available");
```
**Verdict:** KEEP - Feature/data availability checks.

### `opportunities/slide-over-tabs.spec.ts` (14 skips)
```typescript
if (!found) {
  test.skip(); // Sample opportunity not in database
}
```
**Verdict:** KEEP - Tests require specific seed data. Correct behavior.

### Other Data-Conditional Skips
- `contacts/slide-over.spec.ts:458` - Skip if <2 contacts
- `contacts/opportunities-tab.spec.ts:213` - Skip if no opportunities
- `organizations/organization-opportunities-filter.spec.ts` (4 skips) - Data checks
- `dashboard-v3/assigned-to-me-filter.spec.ts` (2 skips) - Filter data checks
- `dashboard-v3/quick-logger-kyle-ramsy.spec.ts:251` - Skip if no orgs

## Category: KEEP - Platform/Viewport Conditional

These skips correctly handle platform limitations:

### `specs/opportunities/kanban-board.spec.ts`
```typescript
test.skip(isMobile, "Drag-and-drop requires mouse events (desktop only)");
```
**Verdict:** KEEP - Drag-and-drop genuinely doesn't work on mobile. Correct.

### `spacing/reports-spacing.spec.ts`
```typescript
test.skip(testInfo.project.name !== "chromium", "Run only on chromium");
```
**Verdict:** KEEP - Visual regression tests need consistent rendering.

### `design-system/list-layout.spec.ts`
```typescript
test.skip(); // Kanban view active, skip table tests
```
**Verdict:** KEEP - View mode conditional skip.

### `design-system/slide-over.spec.ts`
```typescript
test.skip(); // No tasks in seed data
test.skip(); // Need at least 2 contacts
```
**Verdict:** KEEP - Data requirements.

## Category: FIX - Feature Not Implemented

These tests are skipped because features aren't complete:

### `specs/dashboard/dashboard-v3.spec.ts` (7 `test.fixme`)
```typescript
test.fixme("Clicking New Activity opens the activity form");
test.fixme("Activity form can be cancelled");
test.fixme("Activity form shows duration field for Call type");
test.fixme("Activity form can enable follow-up task creation");
test.fixme("Activity can be submitted with Save & Close");
test.fixme("Activity submission triggers dashboard refresh");
test.fixme("Activity with follow-up creates task visible in Tasks panel");
```
**File:** `tests/e2e/specs/dashboard/dashboard-v3.spec.ts:343-585`
**Action:** FIX - These test the LogActivityFAB feature. Verify if implemented, then un-fixme.

### `dashboard-quick-actions.spec.ts` (1 `test.skip`)
```typescript
test.skip("auto-detects activity type from task title");
```
**File:** `tests/e2e/dashboard-quick-actions.spec.ts:63`
**Action:** DEFER - Feature may not be implemented yet.

### `design-system/create-form.spec.ts` (1 `test.skip`)
```typescript
test.skip("organizations form saves draft to localStorage");
```
**File:** `tests/e2e/design-system/create-form.spec.ts:273`
**Action:** DELETE - Comment says "may not be implemented yet". Remove test.

## Category: DELETE - Obsolete/Broken

These tests should be removed:

### `specs/layout/opportunities-form-layout.spec.ts` (3 skips)
```typescript
test.skip("dropdown/select height matches text input height");
test.skip("date inputs match text input dimensions");
test.skip("no horizontal scrolling on mobile");
```
**Verdict:** DELETE - Layout tests that are too brittle. Visual regression handles this.

### `dashboard-layout.spec.ts:167`
```typescript
test.skip(); // Inside conditional
```
**Verdict:** REVIEW - Need to check if test is still relevant.

## Resolution Summary

### Immediate Actions

1. **DELETE these tests:**
   - `specs/layout/opportunities-form-layout.spec.ts` - All 3 skipped tests (lines 90, 152, 327)
   - `design-system/create-form.spec.ts:273` - Autosave test

2. **FIX these tests (un-fixme after verifying feature):**
   - `specs/dashboard/dashboard-v3.spec.ts` - All 7 `test.fixme` (lines 343-585)
   - Check if LogActivityFAB features are implemented

3. **KEEP all data-conditional skips** - They're appropriate!

### No Action Needed

The majority of skips (~50) are **correct conditional behavior**:
- Data-dependent test skips
- Platform-specific skips (mobile vs desktop)
- View mode conditional skips

These follow best practices by gracefully handling missing prerequisites.

## Metrics After Cleanup

| Metric | Before | After |
|--------|--------|-------|
| Total `test.skip` | ~75 | ~67 (delete 8) |
| Total `test.fixme` | 7 | 0 (fix or delete) |
| Tests with issues | 15 | 0 |
