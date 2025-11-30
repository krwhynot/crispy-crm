# E2E Test Timeout Inventory

**Generated:** 2025-11-29
**Purpose:** Audit of `waitForTimeout` usage for stabilization effort

## Summary

| Metric | Count |
|--------|-------|
| Total `waitForTimeout` calls | ~155 |
| Files with timeouts | 42 |
| Spec files | 28 |
| POM/fixture files | 14 |

## Files by Timeout Count (Worst Offenders)

### Priority 1: High Impact (20+ timeouts)

| File | Count | Category | Replacement Strategy |
|------|-------|----------|---------------------|
| `contacts/slide-over.spec.ts` | 26 | Animation + Tab switches | `waitForLoadState`, `toBeVisible()` assertions |
| `design-system-coverage.spec.ts` | 23 | Navigation + Layout | `waitForURL`, `waitForLoadState`, element visibility |
| `opportunities/slide-over-tabs.spec.ts` | 16 | Tab content loading | `waitForResponse`, `toBeVisible()` |
| `design-system/create-form.spec.ts` | 15 | Form interactions | `waitForLoadState`, blur events |

### Priority 2: Medium Impact (10-19 timeouts)

| File | Count | Category |
|------|-------|----------|
| `dashboard-v3/log-activity-fab.spec.ts` | 11 | Sheet animations |
| `dashboard-v3/data-flow.spec.ts` | 10 | Data refresh delays |
| `support/poms/OpportunityFormPage.ts` | 10 | Form interactions |
| `dashboard-v3/dashboard-v3.spec.ts` | 9 | Widget loading |
| `dashboard-v3/accessibility.spec.ts` | 5 | Layout verification |

### Priority 3: Low Impact (<10 timeouts)

| File | Count | Category |
|------|-------|----------|
| `contacts/opportunities-tab.spec.ts` | 7 | Animation |
| `support/fixtures/design-system/slideOver.ts` | 9 | Animation helpers |
| `support/fixtures/design-system/createForm.ts` | 6 | Form helpers |
| `support/fixtures/design-system/listPage.ts` | 3 | List loading |
| `support/poms/DashboardV3Page.ts` | 5 | FAB interactions |
| `specs/opportunities/stage-transitions.spec.ts` | 5 | Save operations |
| `specs/opportunities/kanban-board.spec.ts` | 4 | Drag-drop settling |
| Various others | 1-3 each | Mixed |

## Timeout Categories & Replacement Strategies

### Category A: Animation Delays (300ms typical)
**Pattern:** `await page.waitForTimeout(300)` after click/close
**Replacement:**
```typescript
// Before
await slideOver.click();
await page.waitForTimeout(300);

// After
await slideOver.click();
await expect(page.locator('[role="dialog"]')).toBeVisible();
```

### Category B: Navigation/Load Waits (500-1000ms)
**Pattern:** `await page.waitForTimeout(1000)` after `goto()`
**Replacement:**
```typescript
// Before
await page.goto('/#/contacts');
await page.waitForTimeout(1000);

// After
await page.goto('/#/contacts');
await page.waitForLoadState('networkidle');
// Or wait for specific content
await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();
```

### Category C: Tab Content Loading (500-1000ms)
**Pattern:** `await page.waitForTimeout(1000)` after tab.click()
**Replacement:**
```typescript
// Before
await contactsTab.click();
await page.waitForTimeout(1000);

// After
await contactsTab.click();
await expect(contactsTab).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('[role="tabpanel"][data-state="active"]')).toBeVisible();
```

### Category D: Focus/Keyboard Navigation (50-100ms)
**Pattern:** `await page.waitForTimeout(50)` in focus loops
**Replacement:**
```typescript
// Before
for (let i = 0; i < count; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(50);
}

// After
for (let i = 0; i < count; i++) {
  await page.keyboard.press('Tab');
  // Focus is synchronous, no wait needed
}
// Or if checking focus
await expect(element).toBeFocused();
```

### Category E: API Response Delays (1000-2000ms)
**Pattern:** `await page.waitForTimeout(2000)` after form submission
**Replacement:**
```typescript
// Before
await saveButton.click();
await page.waitForTimeout(2000);

// After
await saveButton.click();
await page.waitForResponse(resp =>
  resp.url().includes('/api/') && resp.status() === 200
);
// Or wait for success indication
await expect(page.getByText(/saved|success/i)).toBeVisible();
```

### Category F: Console Settling (2000ms)
**Pattern:** `await page.waitForTimeout(2000)` before console checks
**Replacement:**
```typescript
// Before
await page.waitForTimeout(2000);
const errors = consoleMonitor.getErrors();

// After
await page.waitForLoadState('networkidle');
const errors = consoleMonitor.getErrors();
```

## Files Requiring No Changes

These files already use condition-based waiting properly:
- `specs/contacts/contacts-crud.spec.ts` - Claims "no waitForTimeout"
- `specs/tasks/tasks-crud.spec.ts` - Claims "no waitForTimeout"
- `specs/dashboard/dashboard-v3.spec.ts` - Uses POMs with proper waits
- `dashboard-v3/pipeline-drilldown.spec.ts` - Uses POM methods

## Implementation Priority

### Phase 1: Fix Worst Offenders (High Impact)
1. `contacts/slide-over.spec.ts` - 26 timeouts
2. `design-system-coverage.spec.ts` - 23 timeouts
3. `opportunities/slide-over-tabs.spec.ts` - 16 timeouts
4. `design-system/create-form.spec.ts` - 15 timeouts

### Phase 2: Fix POMs (Cascading Benefits)
Fixing POMs propagates improvements to all tests using them:
1. `support/poms/OpportunityFormPage.ts` - 10 timeouts
2. `support/fixtures/design-system/slideOver.ts` - 9 timeouts
3. `support/fixtures/design-system/createForm.ts` - 6 timeouts
4. `support/poms/DashboardV3Page.ts` - 5 timeouts

### Phase 3: Remaining Specs
Fix remaining spec files after POMs are stabilized.

## Notes

- Some timeouts are legitimately needed for **visual regression** tests where animations need to settle
- Debounce delays (300-500ms) in POMs may need `waitForResponse()` instead
- Focus trap tests may need minimal delays between Tab presses
- Always replace with **condition-based waiting** per playwright-e2e-testing skill
