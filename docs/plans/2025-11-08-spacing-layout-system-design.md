# Spacing & Layout System Design

**Date:** 2025-11-08
**Status:** Approved
**Implementation:** Pending

## Executive Summary

This design establishes a comprehensive spacing and layout system for Atomic CRM using semantic CSS custom properties in Tailwind v4's `@theme` layer. The system solves critical spacing inconsistencies across dashboard, reports, and resource list views by providing a single source of truth for all layout decisions.

**Key Benefits:**
- Eliminates inconsistent spacing (mixing 16px, 24px, 32px without pattern)
- Establishes proper edge padding (120px desktop, 60px iPad vs current 24px)
- Unifies grid system (8-column iPad, 12-column desktop vs current percentage-based)
- Provides semantic tokens that match existing color system approach
- Enables automated testing through computed style validation

## Problem Statement

### Current Issues (Audit Findings)

The codebase audit revealed multiple spacing problems:

1. **Inconsistent spacing rhythm** - Components mix `space-y-4` (16px), `space-y-6` (24px), `mb-6` (24px), `p-2/2.5/3` (8-12px) without coherent system
2. **Insufficient edge padding** - Reports use `p-6` (24px), far below recommended 40-60px (iPad) or 80-120px (desktop)
3. **Ad-hoc grid system** - Dashboard uses percentage splits (`70%/30%`) instead of proper column grid
4. **Mixed layout approaches** - PrincipalDashboardTable uses React Admin inline styles while other components use Tailwind
5. **Widget height chaos** - No baseline alignment; DashboardWidget has minimal, inconsistent responsive padding

### Design Goals

- **Single source of truth** for all spacing decisions
- **Semantic naming** that communicates intent, not just pixel values
- **Responsive by default** with mobile → iPad → desktop progression
- **Grid-first approach** using 8-column (iPad) / 12-column (desktop) foundation
- **Consistency with existing patterns** (matches semantic color system)

## Solution Architecture

### Core Spacing Tokens

Define tokens in `src/index.css` using Tailwind v4's `@theme` directive:

```css
@theme {
  /* ========================================
     GRID SYSTEM
     ======================================== */
  --spacing-grid-columns-desktop: 12;
  --spacing-grid-columns-ipad: 8;
  --spacing-gutter-desktop: 24px;
  --spacing-gutter-ipad: 20px;

  /* ========================================
     EDGE PADDING (Screen Borders)
     ======================================== */
  --spacing-edge-desktop: 120px;
  --spacing-edge-ipad: 60px;
  --spacing-edge-mobile: 16px;

  /* ========================================
     VERTICAL RHYTHM
     ======================================== */
  --spacing-section: 32px;        /* Between major sections */
  --spacing-widget: 24px;         /* Card-to-card, row-to-row spacing */
  --spacing-content: 16px;        /* Within cards, between elements */
  --spacing-compact: 12px;        /* Tight groupings */

  /* ========================================
     WIDGET/CARD INTERNALS
     ======================================== */
  --spacing-widget-padding: 20px;
  --spacing-widget-min-height: 280px;
  --spacing-top-offset: 80px;     /* Space below navbar */
}
```

**Token Naming Principles:**
- Describe **intent** (edge, section, widget), not size
- Support self-documenting code
- Enable global refactoring

### Tailwind Integration

Use tokens through Tailwind's arbitrary value syntax:

**Edge Padding:**
```tsx
className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)]"
```

**Vertical Rhythm:**
```tsx
// Section spacing
className="space-y-[var(--spacing-section)]"

// Widget/Card spacing
className="space-y-[var(--spacing-widget)]"

// Content within cards
className="space-y-[var(--spacing-content)]"
```

**Grid System:**
```tsx
// Dashboard: 12-column grid with 8-column main, 4-column sidebar
<div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter-ipad)] lg:gap-[var(--spacing-gutter-desktop)]">
  <div className="lg:col-span-8">{/* Main: 8/12 = 66% */}</div>
  <div className="lg:col-span-4">{/* Sidebar: 4/12 = 33% */}</div>
</div>

// Stats grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-widget)]">
  <Stat />
  <Stat />
  <Stat />
</div>
```

**Widget Padding:**
```tsx
<Card className="p-[var(--spacing-widget-padding)]">
  {/* Consistent 20px padding */}
</Card>
```

### Component Transformations

#### Dashboard.tsx

**Before:**
```tsx
<div className="space-y-4">
  <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
```

**After:**
```tsx
<div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] pt-[var(--spacing-top-offset)]">
  <div className="space-y-[var(--spacing-section)]">
    <Header />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter-ipad)] lg:gap-[var(--spacing-gutter-desktop)]">
      <div className="lg:col-span-8 space-y-[var(--spacing-widget)]">
        {/* Main widgets */}
      </div>
      <div className="lg:col-span-4 space-y-[var(--spacing-widget)]">
        {/* Sidebar widgets */}
      </div>
    </div>
  </div>
</div>
```

#### Reports Pages

**Before:**
```tsx
<div className="p-6 max-w-[1600px] mx-auto">
  <ReportHeader className="mb-6" />
  <Card className="mb-6">
```

**After:**
```tsx
<div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] py-[var(--spacing-section)] max-w-[1600px] mx-auto">
  <div className="space-y-[var(--spacing-section)]">
    <ReportHeader />
    <Card className="p-[var(--spacing-widget-padding)]">
      {/* Stats grid */}
    </Card>
    <GroupedReportTable />
  </div>
</div>
```

#### DashboardWidget.tsx

**Before:**
```tsx
<Card className="rounded-md p-2 md:p-2.5 lg:p-3 min-h-[60px] md:min-h-[70px] lg:min-h-[80px]">
```

**After:**
```tsx
<Card className="p-[var(--spacing-widget-padding)] min-h-[var(--spacing-widget-min-height)]">
  <div className="space-y-[var(--spacing-content)]">
    {/* Header and content */}
  </div>
</Card>
```

### React Admin Integration

React Admin components use inline styles via `sx` prop. Create wrapper component to apply spacing tokens:

```tsx
// src/atomic-crm/components/ThemedDatagrid.tsx
export const ThemedDatagrid = ({ children, ...props }) => (
  <Datagrid
    sx={{
      '& .RaDatagrid-headerCell': {
        backgroundColor: 'var(--secondary)',
        padding: 'var(--spacing-content) var(--spacing-widget-padding)',
        fontWeight: 600,
      },
      '& .RaDatagrid-rowCell': {
        padding: 'var(--spacing-content) var(--spacing-widget-padding)',
      },
      '& .RaDatagrid-row:hover': {
        backgroundColor: 'var(--accent)',
      },
      borderCollapse: 'separate',
      borderSpacing: 0,
    }}
    {...props}
  >
    {children}
  </Datagrid>
);
```

This approach:
- Unifies React Admin styling with Tailwind-based components
- Applies spacing tokens to table cells
- Maintains React Admin functionality

### Responsive Strategy

**Breakpoints:**
- `md:` = 768px (iPad landscape threshold)
- `lg:` = 1024px (desktop threshold)

**Progressive Enhancement Pattern:**
```tsx
className="
  px-[var(--spacing-edge-mobile)]      /* mobile: 16px */
  md:px-[var(--spacing-edge-ipad)]     /* iPad: 60px */
  lg:px-[var(--spacing-edge-desktop)]  /* desktop: 120px */
  gap-[var(--spacing-gutter-ipad)]     /* base: 20px */
  lg:gap-[var(--spacing-gutter-desktop)] /* desktop: 24px */
"
```

**Grid Column Responsiveness:**
```tsx
// 1 column → 8 columns (iPad) → 12 columns (desktop)
<div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12">
  {/* Use col-span-* for positioning */}
</div>
```

## Implementation Plan

### Phase 1: Foundation (Reports Module)

**Target:** Reports in `.worktrees/reports-module/`

**Why reports first?** Isolated worktree enables testing without affecting main codebase.

**Tasks:**
1. Add spacing tokens to `@theme` layer in `src/index.css`
2. Apply to Reports module:
   - `OpportunitiesByPrincipal.tsx`
   - `WeeklyActivitySummary.tsx`
   - Shared components (`ReportHeader`, `ReportFilters`, `GroupedReportTable`)
3. Validate on iPad (768px, 1024px) and desktop (1440px)
4. Extract learnings

**Playwright Tests:**
- Visual regression snapshots at 768px, 1024px, 1440px viewports
- Computed padding validation (60px iPad, 120px desktop)
- Grid column measurement

### Phase 2: Dashboard (High-Visibility Application)

**Target:** Dashboard components in `src/atomic-crm/dashboard/`

**Tasks:**
1. Apply to `Dashboard.tsx` main layout
2. Update `DashboardWidget.tsx` base component
3. Migrate individual widgets:
   - `UpcomingEventsByPrincipal`
   - `PrincipalDashboardTable` (create `ThemedDatagrid` wrapper)
   - `MyTasksThisWeek`
   - `RecentActivityFeed`
4. Test cross-browser on iPad and desktop

**Playwright Tests:**
- Dashboard-specific spacing validation
- Widget height consistency checks
- 12-column grid verification

### Phase 3: Resource Lists (Scaling Across CRM)

**Target:** All resource List views

**Tasks:**
1. Create reusable layout components:
   - `<PageContainer>` (applies edge padding)
   - `<ResourceListLayout>` (standard layout for List views)
2. Apply to resource List views:
   - Contacts
   - Organizations
   - Opportunities
   - Tasks
   - All other resources
3. Update `filterRegistry` if needed

**Playwright Tests:**
- Parameterized tests covering all resource lists
- Consistent edge padding across all pages

### Phase 4: Global System Refinement

**Tasks:**
1. Extract common patterns into utility classes or components
2. Document spacing system in `docs/design-system/spacing-and-layout.md`
3. Update `CLAUDE.md` with spacing guidelines
4. Add validation tooling (optional):
   - ESLint rule to prevent hardcoded spacing
   - Storybook examples

**Playwright Tests:**
- Comprehensive cross-page spacing validation
- Responsive breakpoint testing across all major pages

### Migration Checklist (Per Component)

```
☐ Replace hardcoded spacing with tokens
☐ Add responsive edge padding
☐ Convert percentage grids to col-span grid system
☐ Update Card/widget padding to use tokens
☐ Test on iPad (768px-1024px) and desktop (1440px+)
☐ Verify alignment with existing components
```

## Testing Strategy

### Visual Regression Testing

Capture baseline snapshots at key viewports:

```typescript
// tests/e2e/spacing/dashboard-spacing.spec.ts
test('matches spacing baseline on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-desktop.png');
});

test('matches spacing baseline on iPad landscape', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-ipad-landscape.png');
});
```

### Computed Spacing Measurements

Validate actual CSS values match tokens:

```typescript
test('edge padding matches spec on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  const container = page.locator('main').first();
  const paddingLeft = await container.evaluate(el =>
    parseInt(getComputedStyle(el).paddingLeft)
  );

  expect(paddingLeft).toBe(120); // --spacing-edge-desktop
});

test('widget gaps are consistent', async ({ page }) => {
  await page.goto('/dashboard');

  const grid = page.locator('.grid').first();
  const gap = await grid.evaluate(el =>
    parseInt(getComputedStyle(el).gap)
  );

  expect(gap).toBe(24); // --spacing-widget
});
```

### Grid System Validation

Verify grid structure:

```typescript
test('dashboard uses 12-column grid on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  const grid = page.locator('.grid').first();
  const gridTemplateColumns = await grid.evaluate(el =>
    getComputedStyle(el).gridTemplateColumns
  );

  expect(gridTemplateColumns).toContain('repeat(12'); // 12-column grid
});

test('main content spans 8 columns on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');

  const mainColumn = page.locator('[class*="col-span-8"]').first();
  const gridColumnEnd = await mainColumn.evaluate(el =>
    getComputedStyle(el).gridColumnEnd
  );

  expect(gridColumnEnd).toBe('span 8');
});
```

### Widget Height Consistency

Check baseline alignment:

```typescript
test('widgets in same row have aligned heights', async ({ page }) => {
  await page.goto('/dashboard');

  const widgets = page.locator('[class*="min-h-"]');
  const heights = await widgets.evaluateAll(elements =>
    elements.map(el => el.getBoundingClientRect().height)
  );

  const uniqueHeights = new Set(heights);
  expect(uniqueHeights.size).toBeLessThanOrEqual(2); // Allow for content variation
});
```

### Responsive Breakpoint Testing

Test all key viewports:

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`reports page renders correctly on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/reports/opportunities-by-principal');

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Visual snapshot
    await expect(page).toHaveScreenshot(`reports-${viewport.name}.png`);
  });
}
```

### Integration with playwright-e2e-testing Skill

When implementing tests, use the `playwright-e2e-testing` skill to ensure:
- Page Object Model structure
- Semantic selectors (`getByRole`/`getByLabel` over CSS selectors)
- Condition-based waiting (avoid `waitForTimeout`)
- Console error monitoring

## Documentation

### Design System Documentation

Create `docs/design-system/spacing-and-layout.md`:

**Sections:**
1. Core Principles
2. Spacing Tokens Reference Table
3. Quick Reference Code Examples
4. When to Use Which Token
5. Responsive Patterns
6. Grid System Guide

### CLAUDE.md Update

Add to "Color System" section:

```markdown
## Spacing & Layout System

**Tokens:** All spacing uses semantic CSS custom properties in `@theme` layer

**Rules:**
- Use `--spacing-*` tokens, never hardcoded px values
- Edge padding: Responsive `--spacing-edge-mobile/ipad/desktop`
- Grid: 8-column (iPad) / 12-column (desktop)
- Validate: Visual review on 768px, 1024px, 1440px viewports

[Complete system](docs/design-system/spacing-and-layout.md)
```

### Boy Scout Rule Application

When editing any component file:
- Replace hardcoded spacing with tokens
- Add proper edge padding if missing
- Convert ad-hoc grids to 8/12-column system

### Validation Checklist (Manual)

```
☐ No hardcoded space-y-* or gap-* values
☐ All page containers have responsive edge padding
☐ Cards use --spacing-widget-padding
☐ Grids use col-span system, not percentages
☐ Tested on iPad (768-1024px) and desktop (1440px)
```

## Success Metrics

**Consistency:**
- Zero hardcoded spacing values in new components
- All pages use edge padding tokens
- All grids use col-span system

**Visual Quality:**
- Edge padding: 120px (desktop), 60px (iPad), 16px (mobile)
- Widget gaps: 24px consistent
- Section gaps: 32px consistent
- Card padding: 20px consistent

**Testing:**
- 100% visual regression coverage for dashboard and reports
- All computed spacing tests pass
- Zero horizontal overflow at any breakpoint

## Trade-offs & Decisions

**Why @theme layer over custom Tailwind spacing scale?**
- Consistency with existing semantic color system
- Easier to adjust globally via CSS custom properties
- Works with both Tailwind and React Admin inline styles

**Why 12-column (desktop) / 8-column (iPad)?**
- Industry standard grid systems
- Provides flexible layout options
- Better than percentage-based splits for alignment

**Why wrapper component for React Admin?**
- Maintains React Admin functionality
- Unifies styling approach across component libraries
- Avoids fighting framework defaults

**Why reports module first?**
- Isolated worktree reduces risk
- High-visibility pages demonstrate value quickly
- Faster iteration without affecting main codebase

## Future Enhancements

**Potential additions:**
- ESLint rule to flag hardcoded spacing
- Storybook examples showing spacing system
- Automated visual regression in CI/CD
- Design tokens export for Figma sync

## References

**Audit Files:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/Dashboard.tsx`
- `/home/krwhynot/projects/crispy-crm/.worktrees/reports-module/src/atomic-crm/reports/OpportunitiesByPrincipal.tsx`
- All dashboard widget components

**Related Documentation:**
- [Engineering Constitution](../claude/engineering-constitution.md)
- [Architecture Essentials](../claude/architecture-essentials.md)
- [Color Theming Architecture](../internal-docs/color-theming-architecture.docs.md)
- [Principal-Centric CRM Design](2025-11-05-principal-centric-crm-design.md)

---

**Next Steps:**
1. Review and approve this design
2. Set up for implementation using `superpowers:using-git-worktrees`
3. Create implementation plan using `superpowers:writing-plans`
4. Execute in phases with code review between phases
