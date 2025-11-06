# Opportunities E2E Test Suite

**Status:** Infrastructure Complete | Authentication Issue Being Resolved
**Priority:** Priority 1 from [Playwright Testing Strategy](../../../../docs/plans/2025-11-05-playwright-testing-strategy.md)
**Created:** 2025-11-05

---

## Overview

Comprehensive Playwright E2E testing for the Opportunities feature, covering CRUD operations, Kanban board interactions, workflow transitions, and activity timeline tracking.

## Test Coverage

### Test Suites (42 tests total, 1000+ lines)

1. **`crud.spec.ts`** (7 tests)
   - Create opportunity with minimal/complete data
   - Read and display opportunity details
   - Update opportunity fields
   - Delete opportunity
   - Validation error handling
   - Test data isolation verification

2. **`kanban-board.spec.ts`** (11 tests)
   - Display Kanban board with stage columns
   - Switch between list and Kanban views
   - Display opportunity cards with information
   - Drag-and-drop stage transitions (desktop only)
   - Filter opportunities in Kanban view
   - Empty state handling
   - Visual regression testing with smart masking
   - Responsive layout verification
   - Persist stage changes after drag-and-drop
   - Console error monitoring

3. **`stage-transitions.spec.ts`** (11 tests)
   - Display available transition buttons
   - Transition through standard stages
   - Update stage via edit form
   - Mark opportunity as Closed Won
   - Mark opportunity as Closed Lost
   - Prevent invalid transitions (if business rules exist)
   - Track transitions in activity timeline
   - Display stage history with timestamps
   - Maintain stage consistency across views
   - Handle rapid transitions without errors

4. **`activity-timeline.spec.ts`** (13 tests)
   - Display activity timeline on show page
   - Add notes to opportunities
   - Display activities in chronological order
   - Track opportunity creation
   - Track field updates
   - Display activity with author information
   - Display activity timestamps
   - Group activities by date/time period
   - Handle empty timeline state
   - Display different activity types with icons
   - Allow filtering/searching timeline
   - Refresh timeline with real-time updates
   - Handle long activity text

## Page Object Models

### OpportunitiesListPage.ts (196 lines)
- Navigation: `goto()`, `waitForPageLoad()`
- Actions: `clickCreate()`, `search()`, `viewOpportunity()`, `switchToKanbanView()`, `switchToListView()`
- Kanban: `getKanbanColumn()`, `getOpportunityCard()`, `dragOpportunityToStage()`
- Filters: `applyFilter()`
- Assertions: `expectOpportunityVisible()`, `expectOpportunityNotVisible()`, `expectOpportunityInStage()`

### OpportunityShowPage.ts (249 lines)
- Navigation: `goto()`, `clickEdit()`, `clickDeleteAndConfirm()`
- Data Access: `getOpportunityName()`, `getFieldValue()`, `getCurrentStage()`, `getPrincipalName()`
- Workflows: `getWorkflowSection()`, `clickStageTransition()`
- Products: `getProductsTable()`, `getProductRows()`, `expectProductVisible()`
- Timeline: `getActivityTimeline()`, `getActivityItems()`, `addNote()`, `expectActivityVisible()`
- Assertions: `expectInStage()`, `expectValue()`

### OpportunityFormPage.ts (254 lines)
- Navigation: `gotoCreate()`, `gotoEdit()`
- Form Fields: `fillName()`, `selectOrganization()`, `selectPrincipal()`, `selectStage()`, `fillValue()`, `fillProbability()`, `fillExpectedCloseDate()`, `fillDescription()`
- Products: `addProduct()`
- Actions: `submit()`, `cancel()`
- Helpers: `fillCompleteForm()`, `createOpportunity()`
- Validation: `expectValidationError()`, `expectFieldValue()`

## Test Patterns Enforced

✅ **Page Object Models** - All interactions through POMs
✅ **Semantic Selectors** - `getByRole()` → `getByLabel()` → `getByText()` → `getByTestId()`
✅ **Console Monitoring** - Categorized error tracking (RLS, React, Network)
✅ **Condition-Based Waiting** - No arbitrary timeouts (except visual tests)
✅ **Test Data Isolation** - Timestamp-based unique data
✅ **Visual Regression** - Smart masking for dynamic content

## Known Issues

### Authentication Redirect (In Progress)

**Symptom:** Tests navigate to `/#/opportunities` but get redirected to login page

**Current Status:**
- Auth pattern implemented (matches working Contact tests)
- Manual login in `beforeEach` hook
- Console monitoring attached
- LoginPage POM used

**Diagnosis in Progress:**
Investigating why Opportunities route redirects to login while Contacts route works correctly. Possible causes:
1. Route-specific permission requirements
2. Session state not persisting between navigation
3. React Admin resource configuration difference

**Next Steps:**
1. Compare Opportunities resource registration vs Contacts
2. Check RLS policies for opportunities table
3. Verify authProvider permissions for opportunities
4. Test with simplified auth (skip conditional check)

## Running Tests

```bash
# Run all Opportunities tests
npm run test:e2e -- tests/e2e/specs/opportunities/

# Run specific suite
npm run test:e2e -- tests/e2e/specs/opportunities/crud.spec.ts

# Run single test
npm run test:e2e -- tests/e2e/specs/opportunities/crud.spec.ts:63

# Run with headed browser (for debugging)
npm run test:e2e -- tests/e2e/specs/opportunities/ --headed

# Run on specific viewport
npm run test:e2e -- tests/e2e/specs/opportunities/ --project="iPad Portrait"
```

## Test Data Strategy

**Timestamp-Based Isolation:**
```typescript
const timestamp = Date.now();
const opportunityName = `Test Opportunity ${timestamp}`;
```

**Benefits:**
- No conflicts between parallel tests
- No cleanup required
- Realistic user behavior simulation
- Each test creates own data

**Seed Data Used:**
- Organizations from `supabase/seed.sql` (Acme Corp, etc.)
- Test user: admin@test.com / password123

## Console Error Monitoring

Every test includes automatic console error monitoring:

```typescript
test.beforeEach(async ({ page }) => {
  await consoleMonitor.attach(page);
  // ... test setup
});

test.afterEach(async () => {
  if (consoleMonitor.getErrors().length > 0) {
    console.log(consoleMonitor.getReport());
  }
  consoleMonitor.clear();
});
```

**Error Categories:**
- **RLS Errors:** Permission denied, policy violations
- **React Errors:** Component errors, warnings
- **Network Errors:** Failed fetches, timeouts
- **Design System:** Color violations, accessibility issues

## Visual Regression

Kanban board test includes visual regression with smart masking:

```typescript
await expect(page).toHaveScreenshot('kanban-full-view.png', {
  mask: [
    page.locator('[data-testid="timestamp"]'),
    page.locator('[data-testid="avatar"]'),
    page.locator('[data-testid="opportunity-count"]'),
    page.locator('time'),
  ],
  fullPage: true,
  maxDiffPixelRatio: 0.02,
});
```

## Device Testing

Tests run on 3 viewports (configured in `playwright.config.ts`):

1. **iPad Portrait** (768x1024) - Touch events enabled
2. **iPad Landscape** (1024x768) - Touch events enabled
3. **Desktop Chrome** (1280x720) - Mouse events

**Drag-and-drop tests skip on mobile:**
```typescript
test('should drag opportunity...', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Drag-and-drop requires mouse events (desktop only)');
  // ... test implementation
});
```

## Related Documentation

- [Playwright Testing Strategy](../../../../docs/plans/2025-11-05-playwright-testing-strategy.md)
- [Playwright Testing Skill](~/.claude/skills/playwright-e2e-testing/SKILL.md)
- [BasePage.ts](../../support/poms/BasePage.ts)
- [Console Monitor](../../support/utils/console-monitor.ts)

---

**Document Status:** Infrastructure Complete | Auth Issue In Progress
**Last Updated:** 2025-11-05
**Total Test Coverage:** 42 tests, 1600+ lines across POMs and specs
