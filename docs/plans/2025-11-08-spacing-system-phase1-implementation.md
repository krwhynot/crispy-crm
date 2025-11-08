# Spacing System Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement semantic spacing system in Reports Module (isolated pilot) to validate approach before rolling out to Dashboard and Lists.

**Architecture:** Replace hardcoded Tailwind spacing (p-6, space-y-4, etc.) with semantic CSS custom properties from @theme layer. Apply to Reports Module in worktree (.worktrees/reports-module/) as isolated testing ground. Validate with Playwright visual regression and computed spacing tests.

**Tech Stack:** Tailwind CSS 4 @theme layer, React, TypeScript, Playwright

---

## Prerequisites

**Working directory:** `.worktrees/reports-module/` (reports module worktree)

**Design reference:** `docs/plans/2025-11-08-spacing-layout-system-design.md`

**Test reference:** Use `@superpowers:playwright-e2e-testing` skill for all test implementation

---

## Task 1: Add Spacing Tokens to @theme Layer

**Files:**
- Modify: `src/index.css` (add tokens to existing @theme block)
- Test: None (tokens will be validated via computed style tests later)

**Step 1: Locate @theme block in index.css**

```bash
grep -n "@theme" src/index.css
```

Expected: Find existing @theme block with color tokens

**Step 2: Add spacing tokens to @theme layer**

Add these tokens to the existing `@theme` block in `src/index.css`:

```css
@theme {
  /* ... existing color tokens ... */

  /* ========================================
     SPACING TOKENS
     ======================================== */

  /* Grid System */
  --spacing-grid-columns-desktop: 12;
  --spacing-grid-columns-ipad: 8;
  --spacing-gutter-desktop: 24px;
  --spacing-gutter-ipad: 20px;

  /* Edge Padding (Screen Borders) */
  --spacing-edge-desktop: 120px;
  --spacing-edge-ipad: 60px;
  --spacing-edge-mobile: 16px;

  /* Vertical Rhythm */
  --spacing-section: 32px;        /* Between major sections */
  --spacing-widget: 24px;         /* Card-to-card, row-to-row spacing */
  --spacing-content: 16px;        /* Within cards, between elements */
  --spacing-compact: 12px;        /* Tight groupings */

  /* Widget/Card Internals */
  --spacing-widget-padding: 20px;
  --spacing-widget-min-height: 280px;
  --spacing-top-offset: 80px;     /* Space below navbar */
}
```

**Step 3: Verify CSS compiles without errors**

```bash
npm run dev
```

Expected: Dev server starts successfully, no CSS compilation errors in console

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(spacing): add semantic spacing tokens to @theme layer"
```

---

## Task 2: Create Playwright Spacing Test Infrastructure

**Files:**
- Create: `tests/e2e/spacing/spacing-tokens.spec.ts`
- Create: `tests/e2e/spacing/reports-spacing.spec.ts`

**Step 1: Create spacing test directory**

```bash
mkdir -p tests/e2e/spacing
```

**Step 2: Write spacing token validation test**

Create `tests/e2e/spacing/spacing-tokens.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Spacing Tokens Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard');
  });

  test('edge padding matches spec on desktop (120px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reports/opportunities-by-principal');

    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(120); // --spacing-edge-desktop
  });

  test('edge padding matches spec on iPad landscape (60px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(60); // --spacing-edge-ipad
  });

  test('edge padding matches spec on mobile (16px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(16); // --spacing-edge-mobile
  });

  test('section spacing is consistent (32px)', async ({ page }) => {
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('[class*="space-y"]', { state: 'visible' });

    const container = page.locator('[class*="space-y"]').first();
    const gap = await container.evaluate(el => {
      const children = Array.from(el.children);
      if (children.length < 2) return 0;
      const firstRect = children[0].getBoundingClientRect();
      const secondRect = children[1].getBoundingClientRect();
      return secondRect.top - firstRect.bottom;
    });

    expect(gap).toBe(32); // --spacing-section
  });
});
```

**Step 3: Write visual regression test for reports**

Create `tests/e2e/spacing/reports-spacing.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Reports Spacing Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard');
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'ipad-portrait', width: 768, height: 1024 },
    { name: 'ipad-landscape', width: 1024, height: 768 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`OpportunitiesByPrincipal renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/reports/opportunities-by-principal');

      // Wait for content to load
      await page.waitForSelector('h1', { state: 'visible' });

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      // Visual snapshot
      await expect(page).toHaveScreenshot(`opportunities-by-principal-${viewport.name}.png`);
    });

    test(`WeeklyActivitySummary renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/reports/weekly-activity-summary');

      await page.waitForSelector('h1', { state: 'visible' });

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      await expect(page).toHaveScreenshot(`weekly-activity-summary-${viewport.name}.png`);
    });
  }
});
```

**Step 4: Run tests to establish baseline (will fail initially)**

```bash
npm run test:e2e -- tests/e2e/spacing/
```

Expected: Tests FAIL because spacing changes not yet applied. This establishes baseline.

**Step 5: Commit test infrastructure**

```bash
git add tests/e2e/spacing/
git commit -m "test(spacing): add Playwright spacing validation tests"
```

---

## Task 3: Apply Spacing to OpportunitiesByPrincipal Report

**Files:**
- Modify: `.worktrees/reports-module/src/atomic-crm/reports/OpportunitiesByPrincipal.tsx`

**Step 1: Read current implementation**

```bash
cat .worktrees/reports-module/src/atomic-crm/reports/OpportunitiesByPrincipal.tsx | head -50
```

Expected: See current structure with `p-6 max-w-[1600px] mx-auto`

**Step 2: Replace container padding with responsive edge tokens**

In `OpportunitiesByPrincipal.tsx`, find:

```tsx
<div className="p-6 max-w-[1600px] mx-auto">
  <ReportHeader className="mb-6" />
  <Card className="mb-6">
```

Replace with:

```tsx
<div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] py-[var(--spacing-section)] max-w-[1600px] mx-auto">
  <div className="space-y-[var(--spacing-section)]">
    <ReportHeader />
    <Card className="p-[var(--spacing-widget-padding)]">
```

**Step 3: Update stats grid spacing**

Find the stats grid section:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
```

Replace with:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-widget)]">
```

**Step 4: Update vertical spacing throughout**

Replace all instances of hardcoded `mb-6` with semantic tokens:

```tsx
// Old pattern
<Card className="mb-6">

// New pattern - use space-y wrapper instead
<div className="space-y-[var(--spacing-section)]">
  <Card>
  <Card>
</div>
```

**Step 5: Complete file transformation**

Full updated structure for `OpportunitiesByPrincipal.tsx`:

```tsx
export const OpportunitiesByPrincipal = () => {
  // ... existing hooks and logic ...

  return (
    <div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] py-[var(--spacing-section)] max-w-[1600px] mx-auto">
      <div className="space-y-[var(--spacing-section)]">
        <ReportHeader
          title="Opportunities by Principal"
          description="View and analyze opportunities grouped by principal/account manager"
          onExport={handleExport}
        />

        <Card className="p-[var(--spacing-widget-padding)]">
          <CardHeader className="pb-[var(--spacing-content)]">
            <CardTitle className="text-base">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-widget)]">
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Total Opportunities</div>
                <div className="text-2xl font-semibold">{summaryStats.totalOpportunities}</div>
              </div>
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Total Value</div>
                <div className="text-2xl font-semibold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summaryStats.totalValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Unique Principals</div>
                <div className="text-2xl font-semibold">{summaryStats.uniquePrincipals}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <GroupedReportTable
          groups={groupedData}
          columns={columns}
          groupKeyAccessor={(group) => group.principal}
          groupLabelFormatter={(group) => group.principal || 'Unassigned'}
          groupSummaryFormatter={(group) => `${group.opportunities.length} opportunities`}
        />
      </div>
    </div>
  );
};
```

**Step 6: Run spacing tests to verify**

```bash
npm run test:e2e -- tests/e2e/spacing/spacing-tokens.spec.ts
```

Expected: Edge padding tests should now PASS (120px desktop, 60px iPad, 16px mobile)

**Step 7: Update visual regression baseline**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts --update-snapshots
```

Expected: New baseline screenshots captured with correct spacing

**Step 8: Commit**

```bash
git add .worktrees/reports-module/src/atomic-crm/reports/OpportunitiesByPrincipal.tsx
git commit -m "feat(spacing): apply semantic spacing tokens to OpportunitiesByPrincipal"
```

---

## Task 4: Apply Spacing to WeeklyActivitySummary Report

**Files:**
- Modify: `.worktrees/reports-module/src/atomic-crm/reports/WeeklyActivitySummary.tsx`

**Step 1: Apply same transformation pattern**

The WeeklyActivitySummary has identical structure to OpportunitiesByPrincipal. Apply same changes:

```tsx
export const WeeklyActivitySummary = () => {
  // ... existing hooks and logic ...

  return (
    <div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] py-[var(--spacing-section)] max-w-[1600px] mx-auto">
      <div className="space-y-[var(--spacing-section)]">
        <ReportHeader
          title="Weekly Activity Summary"
          description="View activities grouped by Account Manager for the current week"
          onExport={handleExport}
        />

        <Card className="p-[var(--spacing-widget-padding)]">
          <CardHeader className="pb-[var(--spacing-content)]">
            <CardTitle className="text-base">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-widget)]">
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Total Activities</div>
                <div className="text-2xl font-semibold">{summaryStats.totalActivities}</div>
              </div>
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Unique Account Managers</div>
                <div className="text-2xl font-semibold">{summaryStats.uniqueAccountManagers}</div>
              </div>
              <div>
                <div className="text-sm text-[color:var(--text-subtle)]">Date Range</div>
                <div className="text-2xl font-semibold">{summaryStats.dateRange}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <GroupedReportTable
          groups={groupedData}
          columns={columns}
          groupKeyAccessor={(group) => group.accountManager}
          groupLabelFormatter={(group) => group.accountManager || 'Unassigned'}
          groupSummaryFormatter={(group) => `${group.activities.length} activities`}
        />
      </div>
    </div>
  );
};
```

**Step 2: Run tests to verify**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts -g "WeeklyActivitySummary"
```

Expected: All viewport tests PASS, no horizontal overflow

**Step 3: Update visual snapshots**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts -g "WeeklyActivitySummary" --update-snapshots
```

**Step 4: Commit**

```bash
git add .worktrees/reports-module/src/atomic-crm/reports/WeeklyActivitySummary.tsx
git commit -m "feat(spacing): apply semantic spacing tokens to WeeklyActivitySummary"
```

---

## Task 5: Apply Spacing to ReportHeader Component

**Files:**
- Modify: `.worktrees/reports-module/src/atomic-crm/reports/components/ReportHeader.tsx`

**Step 1: Remove hardcoded mb-6 from component**

Current pattern in parent components:

```tsx
<ReportHeader className="mb-6" />
```

The `className="mb-6"` should be removed from parent usage (already done in Task 3 & 4 by using `space-y-[var(--spacing-section)]` wrapper).

**Step 2: Ensure ReportHeader doesn't have internal hardcoded spacing**

In `ReportHeader.tsx`, verify no hardcoded spacing exists. The component should use semantic tokens for any internal spacing:

```tsx
export const ReportHeader = ({ title, description, onExport }: ReportHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-[var(--spacing-compact)]">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};
```

**Step 3: Verify no visual regression**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts
```

Expected: Tests still PASS (no changes should affect visual output since parent spacing handles it)

**Step 4: Commit**

```bash
git add .worktrees/reports-module/src/atomic-crm/reports/components/ReportHeader.tsx
git commit -m "refactor(spacing): use semantic spacing tokens in ReportHeader"
```

---

## Task 6: Apply Spacing to ReportFilters Component

**Files:**
- Modify: `.worktrees/reports-module/src/atomic-crm/reports/components/ReportFilters.tsx`

**Step 1: Update filter grid spacing**

In `ReportFilters.tsx`, find:

```tsx
<Card className="mb-6">
  <CardHeader className="pb-4">
    {/* ... */}
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

Replace with:

```tsx
<Card>
  <CardHeader className="pb-[var(--spacing-content)]">
    {/* ... */}
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-content)]">
```

Note: `mb-6` removed because parent wrapper handles spacing with `space-y-[var(--spacing-section)]`

**Step 2: Complete updated ReportFilters**

```tsx
export const ReportFilters = ({ children, onReset }: ReportFiltersProps) => {
  return (
    <Card>
      <CardHeader className="pb-[var(--spacing-content)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-content)]">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 3: Verify visual consistency**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts
```

Expected: PASS with no visual regressions

**Step 4: Commit**

```bash
git add .worktrees/reports-module/src/atomic-crm/reports/components/ReportFilters.tsx
git commit -m "refactor(spacing): use semantic spacing tokens in ReportFilters"
```

---

## Task 7: Apply Spacing to GroupedReportTable Component

**Files:**
- Modify: `.worktrees/reports-module/src/atomic-crm/reports/components/GroupedReportTable.tsx`

**Step 1: Update group spacing**

In `GroupedReportTable.tsx`, find:

```tsx
<div className="space-y-4">
  {groups.map((group) => (
    <Card key={groupKeyAccessor(group)}>
      <div className="p-4 border-b">
```

Replace with:

```tsx
<div className="space-y-[var(--spacing-widget)]">
  {groups.map((group) => (
    <Card key={groupKeyAccessor(group)}>
      <div className="p-[var(--spacing-widget-padding)] border-b">
```

**Step 2: Update button spacing**

Find:

```tsx
<Button variant="ghost" className="w-full justify-start gap-2 font-semibold">
```

Replace with:

```tsx
<Button variant="ghost" className="w-full justify-start gap-[var(--spacing-compact)] font-semibold">
```

**Step 3: Complete updated GroupedReportTable**

```tsx
export const GroupedReportTable = <T,>({
  groups,
  columns,
  groupKeyAccessor,
  groupLabelFormatter,
  groupSummaryFormatter,
}: GroupedReportTableProps<T>) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-[var(--spacing-widget)]">
      {groups.map((group) => {
        const groupKey = groupKeyAccessor(group);
        const isExpanded = expandedGroups.has(groupKey);

        return (
          <Card key={groupKey}>
            <div className="p-[var(--spacing-widget-padding)] border-b">
              <Button
                variant="ghost"
                className="w-full justify-start gap-[var(--spacing-compact)] font-semibold"
                onClick={() => toggleGroup(groupKey)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>{groupLabelFormatter(group)}</span>
                <span className="ml-auto text-sm text-[color:var(--text-subtle)]">
                  {groupSummaryFormatter(group)}
                </span>
              </Button>
            </div>

            {isExpanded && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key}>{col.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((item, index) => (
                    <TableRow key={index}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        );
      })}
    </div>
  );
};
```

**Step 4: Verify table spacing**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts
```

Expected: PASS with consistent card spacing

**Step 5: Commit**

```bash
git add .worktrees/reports-module/src/atomic-crm/reports/components/GroupedReportTable.tsx
git commit -m "refactor(spacing): use semantic spacing tokens in GroupedReportTable"
```

---

## Task 8: Run Full Test Suite and Verify

**Files:**
- Test: All spacing tests

**Step 1: Run all spacing tests**

```bash
npm run test:e2e -- tests/e2e/spacing/
```

Expected: All tests PASS
- Edge padding: 120px (desktop), 60px (iPad), 16px (mobile)
- Section spacing: 32px
- Widget spacing: 24px
- No horizontal overflow on any viewport

**Step 2: Run full visual regression suite**

```bash
npm run test:e2e -- tests/e2e/spacing/reports-spacing.spec.ts
```

Expected: All 8 snapshots match (2 reports × 4 viewports)

**Step 3: Manual visual inspection**

Start dev server and manually check:

```bash
npm run dev
```

Navigate to:
- `/reports/opportunities-by-principal`
- `/reports/weekly-activity-summary`

Check on viewports:
- Mobile (375px)
- iPad Portrait (768px)
- iPad Landscape (1024px)
- Desktop (1440px)

Verify:
- Proper edge padding (not cramped, not too wide)
- Consistent spacing between cards
- No horizontal scroll

**Step 4: Verify no regressions in other tests**

```bash
npm run test
```

Expected: All existing unit tests still pass

**Step 5: Final commit**

```bash
git add -A
git commit -m "test(spacing): verify all spacing tokens applied correctly in Phase 1"
```

---

## Task 9: Document Phase 1 Completion

**Files:**
- Create: `docs/plans/2025-11-08-spacing-phase1-completion.md`

**Step 1: Create completion document**

```markdown
# Spacing System Phase 1 Completion

**Date:** 2025-11-08
**Status:** Complete

## Summary

Successfully implemented semantic spacing system in Reports Module as isolated pilot.

## Changes Applied

**Tokens Added:**
- Edge padding: `--spacing-edge-desktop/ipad/mobile`
- Vertical rhythm: `--spacing-section/widget/content/compact`
- Widget internals: `--spacing-widget-padding/min-height`
- Grid system: `--spacing-gutter-desktop/ipad`

**Components Updated:**
- OpportunitiesByPrincipal.tsx
- WeeklyActivitySummary.tsx
- ReportHeader.tsx
- ReportFilters.tsx
- GroupedReportTable.tsx

**Tests Added:**
- Computed spacing validation (edge padding at all breakpoints)
- Visual regression tests (8 snapshots across 4 viewports)
- No horizontal overflow validation

## Validation Results

✅ All Playwright spacing tests pass
✅ Edge padding: 120px (desktop), 60px (iPad), 16px (mobile)
✅ Section spacing: 32px consistent
✅ No horizontal overflow at any viewport
✅ Visual snapshots captured as baseline

## Lessons Learned

- Semantic tokens work well with Tailwind arbitrary values
- `space-y-[var(--spacing-*)]` pattern cleaner than individual margins
- React Admin integration not needed for Reports (pure Tailwind)
- Playwright computed style tests catch regressions effectively

## Next Steps

**Phase 2: Dashboard**
- Apply same pattern to Dashboard.tsx
- Update DashboardWidget.tsx
- Create ThemedDatagrid wrapper for React Admin integration
- Add dashboard-specific spacing tests

**Recommendation:** Proceed with Phase 2 using same task structure.
```

**Step 2: Commit documentation**

```bash
git add docs/plans/2025-11-08-spacing-phase1-completion.md
git commit -m "docs(spacing): document Phase 1 completion and lessons learned"
```

---

## Task 10: Merge to Main and Tag

**Files:**
- None (git operations only)

**Step 1: Review all changes**

```bash
git log --oneline origin/main..HEAD
```

Expected: See all commits from Phase 1 (10+ commits)

**Step 2: Run full test suite before merge**

```bash
npm run test && npm run test:e2e
```

Expected: All tests PASS

**Step 3: Switch to main branch**

```bash
git checkout main
```

**Step 4: Merge Phase 1 changes**

```bash
git merge reports-module --no-ff -m "feat(spacing): Phase 1 - Reports Module spacing system implementation"
```

**Step 5: Tag release**

```bash
git tag -a v0.3.0-spacing-phase1 -m "Spacing System Phase 1: Reports Module"
```

**Step 6: Push to remote**

```bash
git push origin main --tags
```

**Step 7: Verify merge success**

```bash
git log --oneline -5
```

Expected: See merge commit and tag

---

## Success Criteria

**Technical:**
- [ ] All spacing tokens defined in @theme layer
- [ ] All Reports components use semantic tokens (zero hardcoded spacing)
- [ ] Edge padding: 120px desktop, 60px iPad, 16px mobile (validated via Playwright)
- [ ] Vertical rhythm: 32px sections, 24px widgets, 16px content (validated via Playwright)
- [ ] No horizontal overflow on any viewport (validated via Playwright)
- [ ] All visual regression tests pass

**Process:**
- [ ] Every change committed incrementally (10+ commits)
- [ ] Tests run after each component update
- [ ] Documentation complete
- [ ] Code reviewed (if applicable)
- [ ] Merged to main with tag

**Quality:**
- [ ] No regressions in existing tests
- [ ] Manual inspection confirms visual quality
- [ ] Lessons learned documented for Phase 2

---

## References

**Design:** `docs/plans/2025-11-08-spacing-layout-system-design.md`

**Testing Skill:** `@superpowers:playwright-e2e-testing`

**Execution Skill:** `@superpowers:executing-plans`

**Next Phase:** Phase 2 - Dashboard (create separate implementation plan)
