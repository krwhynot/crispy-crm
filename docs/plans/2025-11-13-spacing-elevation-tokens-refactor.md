# Spacing & Elevation Token Refactor - Design Document

**Date:** 2025-11-13
**Status:** Approved - Ready for Implementation
**Priority:** P1 - Design System Compliance
**Estimated Effort:** 7-11 hours

## Overview & Scope

### Goal
Refactor all dashboard files to use semantic Tailwind utilities instead of hardcoded spacing/shadow values, ensuring design system consistency and easier maintenance.

### Scope
~40 dashboard files in `src/atomic-crm/dashboard/`

### What Changes
- **Tailwind Config:** Add semantic spacing and shadow utilities
- **Dashboard Components:** Replace hardcoded values with semantic utilities
- **Conservative Approach:** Only cards/major widgets get elevation (not buttons, rows, or small elements)

### What Stays the Same
- CSS tokens in `index.css` (already optimized)
- Component functionality and behavior
- Design system philosophy (iPad-optimized, warm-tinted shadows)
- Test coverage requirements

### Success Criteria
- Zero hardcoded `p-6`, `mb-4`, `gap-2`, `shadow-sm` in dashboard files
- All spacing uses semantic utilities (`p-widget`, `gap-content`, etc.)
- All elevation uses `shadow-elevation-{1,2,3}`
- Tests pass, visual regression minimal
- Design system documentation updated

---

## Tailwind Configuration Updates

### File: `tailwind.config.ts`

#### New Spacing Utilities (Non-Responsive)

```typescript
spacing: {
  'widget': 'var(--spacing-widget-padding)',      // 12px - card/widget padding
  'section': 'var(--spacing-section)',            // 24px - vertical spacing between sections
  'content': 'var(--spacing-content)',            // 12px - spacing within content
  'compact': 'var(--spacing-compact)',            // 8px - tight spacing
  'dashboard-gap': 'var(--spacing-dashboard-gap)', // 16px - dashboard grid gaps
}
```

#### New Spacing Utilities (Responsive - Edge Padding)

```typescript
spacing: {
  'edge-mobile': 'var(--spacing-edge-mobile)',    // 16px
  'edge-ipad': 'var(--spacing-edge-ipad)',        // 60px
  'edge-desktop': 'var(--spacing-edge-desktop)',  // 24px
}
```

#### New Shadow/Elevation Utilities

```typescript
boxShadow: {
  'elevation-1': 'var(--elevation-1)',  // Subtle - resting cards
  'elevation-2': 'var(--elevation-2)',  // Medium - hover/focus
  'elevation-3': 'var(--elevation-3)',  // Pronounced - modals/dropdowns
}
```

### Usage Patterns

```tsx
// Before: Hardcoded spacing
<div className="p-6 mb-4 gap-4">

// After: Semantic utilities
<div className="p-widget mb-section gap-content">

// Before: Hardcoded shadows
<Card className="shadow-sm hover:shadow-md">

// After: Semantic elevation
<Card className="shadow-elevation-1 hover:shadow-elevation-2">

// Before: Responsive edge padding (hardcoded)
<div className="px-4 md:px-16 lg:px-6">

// After: Responsive edge padding (semantic)
<div className="px-edge-mobile md:px-edge-ipad lg:px-edge-desktop">
```

---

## Migration Strategy

### Approach
Systematic file-by-file refactor with testing checkpoints.

### Common Pattern Mappings

| Current Hardcoded | Semantic Utility | Context |
|-------------------|------------------|---------|
| `p-6` | `p-widget` | Card/widget padding |
| `p-3`, `p-4` | `p-content` | Inner section padding |
| `p-2` | `p-compact` | Tight spacing (badges, chips) |
| `mb-4`, `mt-4` | `mb-section`, `mt-section` | Section spacing |
| `gap-4`, `gap-2` | `gap-content` | Grid/flex gaps |
| `gap-x-4` | `gap-x-dashboard-gap` | Dashboard specific |
| `shadow-sm` | `shadow-elevation-1` | Resting cards |
| `shadow-md` | `shadow-elevation-2` | Elevated cards |
| `hover:shadow-md` | `hover:shadow-elevation-2` | Card hover states |
| `px-4 md:px-16 lg:px-6` | `px-edge-mobile md:px-edge-ipad lg:px-edge-desktop` | Page/container edges |

### Migration Process

1. **Update `tailwind.config.ts`** - Add all semantic utilities
2. **Run baseline tests** - `npm test` to capture current state
3. **Migrate files in batches** - Group by component type:
   - Batch 1: Core widgets (5-8 files) - `PrincipalCard`, `CompactTasksWidget`, `RecentActivityFeed`, etc.
   - Batch 2: Dashboard layouts (3-5 files) - `Dashboard`, `PrincipalDashboard`, `CompactGridDashboard`
   - Batch 3: Modals & specialized (remaining files)
4. **Test after each batch** - Verify tests pass, visual check in browser
5. **Update documentation** - Reflect new patterns in design system docs

### Edge Cases to Handle

- **Unique values** (e.g., `h-7`, `min-h-[44px]`) - Keep as-is if no token exists
- **Complex responsive patterns** - Evaluate case-by-case (some may need custom values)
- **Inline styles** - Should be rare; migrate to utilities where possible
- **Component-specific spacing** - If a component has unique spacing needs, document why

### Testing Strategy

- Unit tests should continue passing (no behavior changes)
- Visual regression: Check dashboard in browser at iPad viewport (768px-1024px)
- Accessibility: Verify touch targets remain ≥44px
- Performance: No change expected (still Tailwind utilities)

---

## Concrete Examples

### Example 1: PrincipalCard.tsx Refactor

**Before:**
```tsx
<div className="border border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between gap-4 mb-4">
    {/* ... */}
  </div>

  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
    {/* ... */}
  </div>

  {principal.topOpportunity && (
    <div className="mb-4 p-3 bg-primary/5 rounded border border-primary/20">
      {/* ... */}
    </div>
  )}

  <div className="flex gap-2 pt-4 border-t border">
    {/* ... */}
  </div>
</div>
```

**After:**
```tsx
<div className="border border rounded-lg p-widget bg-white shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
  <div className="flex items-start justify-between gap-content mb-section">
    {/* ... */}
  </div>

  <div className="grid grid-cols-2 gap-content mb-section text-sm">
    {/* ... */}
  </div>

  {principal.topOpportunity && (
    <div className="mb-section p-content bg-primary/5 rounded border border-primary/20">
      {/* ... */}
    </div>
  )}

  <div className="flex gap-compact pt-section border-t border">
    {/* ... */}
  </div>
</div>
```

### Example 2: CompactTasksWidget.tsx Refactor

**Before:**
```tsx
<div className="h-full">
  <div className="flex items-center justify-between mb-2 h-7">
    <h2 className="text-sm font-semibold text-foreground">My Tasks This Week</h2>
    {/* ... */}
  </div>

  <div className="space-y-2">
    {displayTasks.map(task => (
      <div key={task.id} className="flex items-center gap-2 py-1">
        {/* ... */}
      </div>
    ))}
  </div>
</div>
```

**After:**
```tsx
<div className="h-full">
  <div className="flex items-center justify-between mb-compact h-7">
    <h2 className="text-sm font-semibold text-foreground">My Tasks This Week</h2>
    {/* ... */}
  </div>

  <div className="space-y-compact">
    {displayTasks.map(task => (
      <div key={task.id} className="flex items-center gap-compact py-1">
        {/* ... */}
      </div>
    ))}
  </div>
</div>
```

---

## Conservative Elevation Guidelines

### ✅ APPLY elevation to:
- Dashboard cards (`PrincipalCard`, `DashboardWidget`)
- Major widgets (`RecentActivityFeed`, `PipelineSummary`)
- Modals (`QuickCompleteTaskModal`, `QuickLogActivity`)
- Dropdowns/popovers (if any)

### ❌ DO NOT apply elevation to:
- Buttons (keep flat with border)
- Table rows (use border on hover instead)
- List items within widgets
- Small badges/chips
- Input fields
- Inline action menus (unless they're true dropdowns)

### When in doubt
Keep it flat. Elevation should create hierarchy, not visual noise.

---

## Documentation & Rollout Plan

### Documentation Updates

**1. Update Design System Docs** (`docs/architecture/design-system.md` or similar)
- Add new spacing utility reference table
- Add elevation utility usage guidelines
- Include before/after examples
- Document conservative elevation philosophy

**2. Update CLAUDE.md** (if needed)
- Reference new semantic utilities in "Spacing System" section
- Add quick reference for common patterns
- Link to full design system docs

**3. Create Migration Guide** (optional, for future reference)
- Pattern mappings table (hardcoded → semantic)
- Common pitfalls and edge cases
- When to use which spacing token

### Rollout Timeline

**Phase 1: Foundation (1-2 hours)**
- [ ] Update `tailwind.config.ts` with new utilities
- [ ] Run baseline tests (`npm test`)
- [ ] Visual smoke test in browser
- [ ] Commit: "feat(design-system): Add semantic spacing and elevation utilities"

**Phase 2: Core Widgets (2-3 hours)**
- [ ] Migrate Batch 1: 5-8 core widget files
  - `PrincipalCard.tsx`
  - `CompactTasksWidget.tsx`
  - `RecentActivityFeed.tsx`
  - `CompactRecentActivity.tsx`
  - `MyTasksThisWeek.tsx`
  - `PipelineSummary.tsx`
  - `DashboardWidget.tsx`
- [ ] Test after batch
- [ ] Visual regression check
- [ ] Commit: "refactor(dashboard): Migrate core widgets to semantic spacing/elevation"

**Phase 3: Dashboard Layouts (1-2 hours)**
- [ ] Migrate Batch 2: 3-5 layout files
  - `Dashboard.tsx`
  - `PrincipalDashboard.tsx`
  - `CompactGridDashboard.tsx`
  - `CompactDashboardHeader.tsx`
- [ ] Test after batch
- [ ] Commit: "refactor(dashboard): Migrate layouts to semantic spacing/elevation"

**Phase 4: Remaining Files (2-3 hours)**
- [ ] Migrate Batch 3: Modals, specialized components
  - `QuickCompleteTaskModal.tsx`
  - `QuickLogActivity.tsx`
  - `OpportunitiesByPrincipal.tsx`
  - All remaining files
- [ ] Final comprehensive test
- [ ] Visual regression check (all viewports)
- [ ] Commit: "refactor(dashboard): Complete spacing/elevation token migration"

**Phase 5: Documentation & Wrap-up (1 hour)**
- [ ] Update design system documentation
- [ ] Update Dashboard TODOs (mark P1 spacing task complete)
- [ ] Final commit: "docs(design-system): Document semantic spacing and elevation utilities"

**Total Estimated Time:** 7-11 hours

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Visual regression (spacing looks different) | Medium | Low | Carefully map tokens; visual check after each batch |
| Tests break from className changes | Low | Medium | Tests shouldn't depend on classNames; fix if they do |
| Performance impact from CSS vars | Very Low | Low | CSS vars are performant; no issue expected |
| Token doesn't match use case | Medium | Low | Keep hardcoded value if no semantic token fits |
| Missed files in migration | Low | Low | Grep for patterns after migration to catch stragglers |

---

## Post-Migration Validation

### Automated Checks

```bash
# Verify no hardcoded spacing remains (should find minimal results)
grep -r "p-[0-9]" src/atomic-crm/dashboard/
grep -r "mb-[0-9]" src/atomic-crm/dashboard/
grep -r "gap-[0-9]" src/atomic-crm/dashboard/
grep -r "shadow-sm\|shadow-md" src/atomic-crm/dashboard/

# Run full test suite
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Manual Checks
- Visual regression test in browser (iPad viewport: 768px-1024px)
- Check touch targets are still ≥44px
- Verify hover states work correctly
- Test responsive breakpoints (mobile, iPad, desktop)

---

## Design Insights

### Why Semantic Utilities?
The approach of mapping CSS tokens to Tailwind utilities (`p-widget` vs `p-[var(--spacing-widget-padding)]`) provides:

1. **Readability:** `p-widget` is self-documenting; the intent is clear
2. **Consistency:** Matches the semantic color pattern already established (`text-muted-foreground`)
3. **Maintainability:** Change the token value once, all usages update
4. **Developer Experience:** Autocomplete works better with semantic names

### Why Conservative Elevation?
Atomic CRM is a business tool focused on data and workflows. Elevation should enhance hierarchy, not compete with content:

- **Cards get elevation** → They contain distinct units of information
- **Buttons stay flat** → They're calls to action, not content containers
- **Modals get elevation** → They float above the main content
- **List items stay flat** → Elevation would create visual noise in data-dense views

This philosophy keeps the interface clean and professional, letting data take center stage.

### Why Mix Responsive Approach?
Most spacing values (widget padding, content gaps) don't need to change across breakpoints—they're universal. But edge padding and gutters legitimately need to adapt:

- **Mobile (375-767px):** Tight edge padding (16px) for small screens
- **iPad (768-1024px):** Generous edge padding (60px) for touch-friendly layout
- **Desktop (1440px+):** Moderate edge padding (24px) for content density

This targeted responsiveness keeps the system simple while addressing real layout needs.

---

## References

- **CSS Tokens:** `src/index.css:76-123` (spacing), `src/index.css:422-442` (elevation)
- **Dashboard TODOs:** `docs/tasks/Dashboard-TODOs.md`
- **Design System Philosophy:** `CLAUDE.md` (Color System, Spacing System sections)
- **Related Skills:** `.claude/skills/crispy-design-system/`
