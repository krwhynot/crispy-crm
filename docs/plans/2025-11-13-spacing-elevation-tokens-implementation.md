# Spacing & Elevation Token Refactor - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor all dashboard files to use semantic Tailwind utilities instead of hardcoded spacing/shadow values for design system consistency.

**Architecture:** Add semantic utilities to `tailwind.config.ts` that map to existing CSS tokens in `index.css`, then systematically refactor ~40 dashboard files in 3 batches (core widgets → layouts → modals/specialized).

**Tech Stack:** React 19, Tailwind CSS 4, TypeScript, Vitest

**Design Reference:** `docs/plans/2025-11-13-spacing-elevation-tokens-refactor.md`

---

## Phase 1: Foundation - Tailwind Configuration

### Task 1: Add Spacing Utilities to Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`
- Reference: `src/index.css:76-123` (spacing tokens)

**Step 1: Read current tailwind.config.ts**

Run: Read the file to understand current structure
Expected: See existing `theme.extend` configuration

**Step 2: Add spacing utilities (non-responsive)**

Add to `theme.extend.spacing`:

```typescript
spacing: {
  // Semantic spacing utilities
  'widget': 'var(--spacing-widget-padding)',      // 12px - card/widget padding
  'section': 'var(--spacing-section)',            // 24px - vertical spacing between sections
  'content': 'var(--spacing-content)',            // 12px - spacing within content
  'compact': 'var(--spacing-compact)',            // 8px - tight spacing
  'dashboard-gap': 'var(--spacing-dashboard-gap)', // 16px - dashboard grid gaps

  // Responsive edge padding
  'edge-mobile': 'var(--spacing-edge-mobile)',    // 16px
  'edge-ipad': 'var(--spacing-edge-ipad)',        // 60px
  'edge-desktop': 'var(--spacing-edge-desktop)',  // 24px
}
```

**Step 3: Verify spacing tokens exist in index.css**

Run: `grep -A 15 "SPACING TOKENS" src/index.css`
Expected: See all referenced CSS variables defined

**Step 4: Save and verify TypeScript compilation**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit spacing utilities**

```bash
git add tailwind.config.ts
git commit -m "feat(design-system): Add semantic spacing utilities

Maps spacing tokens from index.css to Tailwind utilities:
- Non-responsive: widget, section, content, compact, dashboard-gap
- Responsive: edge-mobile, edge-ipad, edge-desktop

Part of P1 spacing/elevation token refactor"
```

---

### Task 2: Add Elevation Utilities to Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`
- Reference: `src/index.css:422-442` (elevation tokens)

**Step 1: Add boxShadow utilities**

Add to `theme.extend.boxShadow`:

```typescript
boxShadow: {
  // Elevation system (warm-tinted shadows)
  'elevation-1': 'var(--elevation-1)',  // Subtle - resting cards
  'elevation-2': 'var(--elevation-2)',  // Medium - hover/focus
  'elevation-3': 'var(--elevation-3)',  // Pronounced - modals/dropdowns
}
```

**Step 2: Verify elevation tokens exist in index.css**

Run: `grep -A 5 "elevation-" src/index.css | grep "elevation-[123]"`
Expected: See --elevation-1, --elevation-2, --elevation-3 definitions

**Step 3: Test utility generation**

Run: `npm run dev` (in background)
Check: Tailwind generates `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3` classes

**Step 4: Verify TypeScript compilation**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit elevation utilities**

```bash
git add tailwind.config.ts
git commit -m "feat(design-system): Add semantic elevation utilities

Maps elevation tokens to Tailwind boxShadow utilities:
- elevation-1: Subtle shadows for resting cards
- elevation-2: Medium shadows for hover/focus
- elevation-3: Pronounced shadows for modals

Part of P1 spacing/elevation token refactor"
```

---

### Task 3: Run Baseline Tests

**Files:**
- None (verification only)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (baseline before refactor)

**Step 2: Record test count**

Note: Current passing test count from output
Purpose: Verify no regressions after refactor

**Step 3: Visual smoke test**

Run: `npm run dev`
Navigate to: `/dashboard`
Check: Dashboard renders normally with current hardcoded spacing

**Step 4: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Baseline tests passing before refactor

Test count: [X] passing
Visual check: Dashboard renders correctly
Ready for component migration"
```

---

## Phase 2: Core Widgets - Batch 1

### Task 4: Refactor PrincipalCard.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/PrincipalCard.tsx:62-130`
- Test: `src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx`

**Step 1: Read current PrincipalCard implementation**

Run: Read file to identify hardcoded spacing values
Pattern to find: `p-6`, `mb-4`, `gap-4`, `p-3`, `shadow-sm`, `hover:shadow-md`

**Step 2: Replace card container spacing**

Line 62:
```typescript
// Before:
<div className="border border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">

// After:
<div className="border border rounded-lg p-widget bg-white shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
```

**Step 3: Replace header section spacing**

Line 64:
```typescript
// Before:
<div className="flex items-start justify-between gap-4 mb-4">

// After:
<div className="flex items-start justify-between gap-content mb-section">
```

**Step 4: Replace summary stats spacing**

Line 77:
```typescript
// Before:
<div className="grid grid-cols-2 gap-4 mb-4 text-sm">

// After:
<div className="grid grid-cols-2 gap-content mb-section text-sm">
```

**Step 5: Replace top opportunity section spacing**

Line 97:
```typescript
// Before:
<div className="mb-4 p-3 bg-primary/5 rounded border border-primary/20">

// After:
<div className="mb-section p-content bg-primary/5 rounded border border-primary/20">
```

**Step 6: Replace action buttons spacing**

Line 116:
```typescript
// Before:
<div className="flex gap-2 pt-4 border-t border">

// After:
<div className="flex gap-compact pt-section border-t border">
```

**Step 7: Run tests**

Run: `npm test PrincipalCard.test.tsx`
Expected: All tests pass (no behavior change)

**Step 8: Visual regression check**

Run: `npm run dev`
Navigate to: `/dashboard`
Check: PrincipalCard spacing looks identical to before

**Step 9: Commit**

```bash
git add src/atomic-crm/dashboard/PrincipalCard.tsx
git commit -m "refactor(dashboard): Migrate PrincipalCard to semantic spacing/elevation

Changes:
- p-6 → p-widget
- mb-4 → mb-section
- gap-4 → gap-content
- gap-2 → gap-compact
- p-3 → p-content
- shadow-sm → shadow-elevation-1
- hover:shadow-md → hover:shadow-elevation-2

Tests: ✓ All passing
Visual: ✓ No regression"
```

---

### Task 5: Refactor CompactTasksWidget.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactTasksWidget.tsx:13-48`
- Test: `src/atomic-crm/dashboard/__tests__/CompactTasksWidget.test.tsx`

**Step 1: Read current CompactTasksWidget implementation**

Run: Read file to identify hardcoded spacing
Pattern to find: `mb-2`, `space-y-2`, `gap-2`

**Step 2: Replace header spacing**

Line 18:
```typescript
// Before:
<div className="flex items-center justify-between mb-2 h-7">

// After:
<div className="flex items-center justify-between mb-compact h-7">
```

**Step 3: Replace task list spacing**

Line 25:
```typescript
// Before:
<div className="space-y-2">

// After:
<div className="space-y-compact">
```

**Step 4: Replace task item spacing**

Line 27:
```typescript
// Before:
<div key={task.id} className="flex items-center gap-2 py-1">

// After:
<div key={task.id} className="flex items-center gap-compact py-1">
```

**Step 5: Run tests**

Run: `npm test CompactTasksWidget.test.tsx`
Expected: All tests pass

**Step 6: Visual check**

Run: `npm run dev`
Check: Widget spacing in sidebar looks correct

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/CompactTasksWidget.tsx
git commit -m "refactor(dashboard): Migrate CompactTasksWidget to semantic spacing

Changes:
- mb-2 → mb-compact
- space-y-2 → space-y-compact
- gap-2 → gap-compact

Tests: ✓ All passing
Visual: ✓ No regression"
```

---

### Task 6: Refactor RecentActivityFeed.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/RecentActivityFeed.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`

**Step 1: Identify spacing patterns**

Run: `grep -n "className.*[pm][btlrxy]-[0-9]" src/atomic-crm/dashboard/RecentActivityFeed.tsx`
Expected: List of hardcoded spacing values with line numbers

**Step 2: Replace widget container spacing**

Apply semantic spacing pattern:
- Container padding: `p-X` → `p-widget`
- Section margins: `mb-4`, `mt-4` → `mb-section`, `mt-section`
- Item gaps: `gap-4` → `gap-content`, `gap-2` → `gap-compact`
- Elevation: `shadow-sm` → `shadow-elevation-1`

**Step 3: Run tests**

Run: `npm test RecentActivityFeed.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/RecentActivityFeed.tsx
git commit -m "refactor(dashboard): Migrate RecentActivityFeed to semantic spacing

Tests: ✓ All passing"
```

---

### Task 7: Refactor CompactRecentActivity.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactRecentActivity.tsx`
- Test: Manual visual check (no dedicated test file)

**Step 1: Replace spacing with semantic utilities**

Pattern:
- `p-4` → `p-content`
- `mb-2` → `mb-compact`
- `gap-2` → `gap-compact`
- `space-y-2` → `space-y-compact`

**Step 2: Visual check**

Run: `npm run dev`
Navigate to: Dashboard sidebar
Check: Compact activity widget displays correctly

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/CompactRecentActivity.tsx
git commit -m "refactor(dashboard): Migrate CompactRecentActivity to semantic spacing

Visual: ✓ Verified in sidebar"
```

---

### Task 8: Refactor MyTasksThisWeek.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`

**Step 1: Replace spacing with semantic utilities**

Pattern:
- Widget padding: `p-6` → `p-widget`
- Section spacing: `mb-4` → `mb-section`
- Item spacing: `gap-2` → `gap-compact`, `space-y-2` → `space-y-compact`

**Step 2: Run tests**

Run: `npm test MyTasksThisWeek.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/MyTasksThisWeek.tsx
git commit -m "refactor(dashboard): Migrate MyTasksThisWeek to semantic spacing

Tests: ✓ All passing"
```

---

### Task 9: Refactor PipelineSummary.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/PipelineSummary.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/PipelineSummary.test.tsx`

**Step 1: Replace spacing with semantic utilities**

Pattern:
- Card padding: `p-6` → `p-widget`
- Section spacing: `mb-4` → `mb-section`
- Grid gaps: `gap-4` → `gap-content`
- Elevation: `shadow-sm` → `shadow-elevation-1`

**Step 2: Run tests**

Run: `npm test PipelineSummary.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/PipelineSummary.tsx
git commit -m "refactor(dashboard): Migrate PipelineSummary to semantic spacing/elevation

Tests: ✓ All passing"
```

---

### Task 10: Refactor DashboardWidget.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/DashboardWidget.tsx`

**Step 1: Replace spacing with semantic utilities**

Pattern:
- Widget padding: `p-6` → `p-widget`
- Header spacing: `mb-4` → `mb-section`
- Elevation: `shadow-sm` → `shadow-elevation-1`, `hover:shadow-md` → `hover:shadow-elevation-2`

**Step 2: Test all widgets using DashboardWidget**

Run: `npm test -- --run 2>&1 | grep -i dashboard`
Expected: All dashboard-related tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/DashboardWidget.tsx
git commit -m "refactor(dashboard): Migrate DashboardWidget to semantic spacing/elevation

Tests: ✓ All dashboard widgets passing"
```

---

### Task 11: Batch 1 Testing Checkpoint

**Files:**
- None (verification only)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (same count as baseline)

**Step 2: Visual regression check (iPad viewport)**

Run: `npm run dev`
Navigate to: `/dashboard`
Viewport: Resize to 768px width (iPad)
Check: All widgets display correctly with proper spacing

**Step 3: Visual regression check (Desktop viewport)**

Viewport: Resize to 1440px width
Check: Dashboard layout looks correct

**Step 4: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Batch 1 (Core Widgets) complete

Migrated files:
- PrincipalCard.tsx
- CompactTasksWidget.tsx
- RecentActivityFeed.tsx
- CompactRecentActivity.tsx
- MyTasksThisWeek.tsx
- PipelineSummary.tsx
- DashboardWidget.tsx

Tests: ✓ All passing
Visual: ✓ iPad + Desktop verified"
```

---

## Phase 3: Dashboard Layouts - Batch 2

### Task 12: Refactor Dashboard.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/Dashboard.tsx`

**Step 1: Identify layout spacing patterns**

Run: `grep -n "className.*[pm][btlrxy]-[0-9]" src/atomic-crm/dashboard/Dashboard.tsx`
Expected: Line numbers with hardcoded spacing

**Step 2: Replace container/layout spacing**

Pattern:
- Page padding: `px-4 md:px-16 lg:px-6` → `px-edge-mobile md:px-edge-ipad lg:px-edge-desktop`
- Grid gaps: `gap-4` → `gap-dashboard-gap` or `gap-content`
- Section margins: `mb-4` → `mb-section`

**Step 3: Visual check**

Run: `npm run dev`
Navigate to: `/dashboard`
Check: Page layout spacing at different viewports

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/Dashboard.tsx
git commit -m "refactor(dashboard): Migrate Dashboard layout to semantic spacing

Added responsive edge padding utilities
Visual: ✓ All viewports verified"
```

---

### Task 13: Refactor PrincipalDashboard.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Step 1: Replace spacing with semantic utilities**

Pattern:
- Edge padding: Use responsive `edge-*` utilities
- Grid gaps: `gap-4` → `gap-content` or `gap-dashboard-gap`
- Section spacing: `mb-4` → `mb-section`

**Step 2: Run tests**

Run: `npm test PrincipalDashboard.test.tsx` (if not skipped)
Expected: Tests pass or remain skipped

**Step 3: Visual check**

Navigate to: Principal-specific dashboard view
Check: Card grid spacing looks correct

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/PrincipalDashboard.tsx
git commit -m "refactor(dashboard): Migrate PrincipalDashboard to semantic spacing

Visual: ✓ Grid layout verified"
```

---

### Task 14: Refactor CompactGridDashboard.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactGridDashboard.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx`

**Step 1: Replace grid/layout spacing**

Pattern:
- Container padding: `p-6` → `p-widget`
- Grid gaps: `gap-4` → `gap-dashboard-gap`
- Section spacing: `mb-4` → `mb-section`

**Step 2: Run tests**

Run: `npm test CompactGridDashboard.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/CompactGridDashboard.tsx
git commit -m "refactor(dashboard): Migrate CompactGridDashboard to semantic spacing

Tests: ✓ All passing"
```

---

### Task 15: Refactor CompactDashboardHeader.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactDashboardHeader.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/CompactDashboardHeader.test.tsx`

**Step 1: Replace header spacing**

Pattern:
- Header padding: `p-4` → `p-content`
- Item gaps: `gap-2` → `gap-compact`

**Step 2: Run tests**

Run: `npm test CompactDashboardHeader.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/CompactDashboardHeader.tsx
git commit -m "refactor(dashboard): Migrate CompactDashboardHeader to semantic spacing

Tests: ✓ All passing"
```

---

### Task 16: Batch 2 Testing Checkpoint

**Files:**
- None (verification only)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests still passing

**Step 2: Visual regression check**

Run: `npm run dev`
Check all dashboard views:
- Main dashboard (`/dashboard`)
- Principal dashboard
- Compact grid layout

**Step 3: Responsive breakpoint check**

Test viewports: 375px (mobile), 768px (iPad), 1440px (desktop)
Check: Edge padding adjusts correctly at each breakpoint

**Step 4: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Batch 2 (Dashboard Layouts) complete

Migrated files:
- Dashboard.tsx
- PrincipalDashboard.tsx
- CompactGridDashboard.tsx
- CompactDashboardHeader.tsx

Tests: ✓ All passing
Visual: ✓ All layouts + breakpoints verified"
```

---

## Phase 4: Modals & Specialized - Batch 3

### Task 17: Refactor QuickCompleteTaskModal.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/QuickCompleteTaskModal.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/QuickCompleteTaskModal.test.tsx`

**Step 1: Replace modal spacing**

Pattern:
- Modal padding: `p-6` → `p-widget`
- Section spacing: `mb-4` → `mb-section`
- Button gaps: `gap-2` → `gap-compact`
- Elevation: Modals should use `shadow-elevation-3`

**Step 2: Run tests**

Run: `npm test QuickCompleteTaskModal.test.tsx`
Expected: All tests pass

**Step 3: Visual check**

Run: `npm run dev`
Open modal from dashboard
Check: Modal spacing and shadow look correct

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/QuickCompleteTaskModal.tsx
git commit -m "refactor(dashboard): Migrate QuickCompleteTaskModal to semantic spacing/elevation

Added elevation-3 for modal depth
Tests: ✓ All passing"
```

---

### Task 18: Refactor QuickLogActivity.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx`
- Test: `src/atomic-crm/dashboard/QuickActionModals/__tests__/QuickLogActivity.test.tsx`

**Step 1: Replace modal/form spacing**

Pattern:
- Form padding: `p-6` → `p-widget`
- Field spacing: `mb-4` → `mb-section`
- Input gaps: `gap-2` → `gap-compact`

**Step 2: Run tests**

Run: `npm test QuickLogActivity.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/QuickActionModals/QuickLogActivity.tsx
git commit -m "refactor(dashboard): Migrate QuickLogActivity to semantic spacing

Tests: ✓ All passing"
```

---

### Task 19: Refactor LogActivityStep.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/LogActivityStep.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/LogActivityStep.test.tsx`

**Step 1: Replace step spacing**

Pattern:
- Container padding: `p-6` → `p-widget`
- Section spacing: `mb-4` → `mb-section`
- Form element gaps: `gap-4` → `gap-content`

**Step 2: Run tests**

Run: `npm test LogActivityStep.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/LogActivityStep.tsx
git commit -m "refactor(dashboard): Migrate LogActivityStep to semantic spacing

Tests: ✓ All passing"
```

---

### Task 20: Refactor UpdateOpportunityStep.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/UpdateOpportunityStep.tsx`
- Test: `src/atomic-crm/dashboard/__tests__/UpdateOpportunityStep.test.tsx`

**Step 1: Replace step spacing**

Pattern:
- Container: `p-6` → `p-widget`
- Sections: `mb-4` → `mb-section`
- Elements: `gap-2` → `gap-compact`

**Step 2: Run tests**

Run: `npm test UpdateOpportunityStep.test.tsx`
Expected: Most tests pass (some may be skipped)

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/UpdateOpportunityStep.tsx
git commit -m "refactor(dashboard): Migrate UpdateOpportunityStep to semantic spacing

Tests: ✓ Passing (some skipped)"
```

---

### Task 21: Refactor SuccessStep.tsx

**Files:**
- Modify: `src/atomic-crm/dashboard/SuccessStep.tsx`

**Step 1: Replace success step spacing**

Pattern:
- Container: `p-6` → `p-widget`
- Icon/text spacing: `mb-4` → `mb-section`
- Button spacing: `gap-2` → `gap-compact`

**Step 2: Visual check**

Complete a task workflow
Check: Success step displays correctly

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/SuccessStep.tsx
git commit -m "refactor(dashboard): Migrate SuccessStep to semantic spacing

Visual: ✓ Workflow completion verified"
```

---

### Task 22: Refactor Remaining Dashboard Files

**Files:**
- Modify: All remaining dashboard files:
  - `OpportunitiesByPrincipal.tsx`
  - `OpportunitiesByPrincipalDesktop.tsx`
  - `OpportunitiesByPrincipalDesktopContainer.tsx`
  - `UpcomingEventsByPrincipal.tsx`
  - `TasksList.tsx`
  - `TasksListEmpty.tsx`
  - `TasksListFilter.tsx`
  - `CompactPrincipalTable.tsx`
  - `PrincipalCardSkeleton.tsx`
  - `PriorityIndicator.tsx`

**Step 1: Batch find all hardcoded spacing**

Run: `grep -r "className.*[pm][btlrxy]-[0-9]" src/atomic-crm/dashboard/*.tsx | grep -v "test\|node_modules"`
Expected: List of all remaining files with hardcoded spacing

**Step 2: Replace spacing file by file**

For each file:
- Apply semantic spacing pattern
- Test if test file exists
- Visual check in browser
- Commit individually

Pattern:
```bash
# For each file:
git add src/atomic-crm/dashboard/[FileName].tsx
git commit -m "refactor(dashboard): Migrate [FileName] to semantic spacing"
```

**Step 3: Verify all files migrated**

Run: `grep -r "p-[0-9]\|mb-[0-9]\|gap-[0-9]" src/atomic-crm/dashboard/*.tsx | grep -v "test\|node_modules\|min-h-\|h-[0-9]" | wc -l`
Expected: 0 (or very few edge cases documented)

---

### Task 23: Final Comprehensive Testing

**Files:**
- None (verification only)

**Step 1: Run complete test suite**

Run: `npm test`
Expected: 1524 tests passing (same as baseline)

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 3: Run linter**

Run: `npm run lint`
Expected: No linting errors

**Step 4: Visual regression testing (all viewports)**

Test matrix:
- Viewport: Mobile (375px), iPad (768px), Desktop (1440px)
- Pages: Dashboard, Principal Dashboard
- Interactions: Hover cards, open modals, complete tasks

**Step 5: Accessibility check**

Check: Touch targets still ≥44px
Check: Color contrast unchanged
Check: Keyboard navigation works

**Step 6: Post-migration validation**

Run verification commands:

```bash
# Should find minimal/zero results:
grep -r "p-[0-9]" src/atomic-crm/dashboard/*.tsx | grep -v "test\|node_modules\|min-h-\|h-[0-9]"
grep -r "mb-[0-9]" src/atomic-crm/dashboard/*.tsx | grep -v "test\|node_modules"
grep -r "gap-[0-9]" src/atomic-crm/dashboard/*.tsx | grep -v "test\|node_modules"
grep -r "shadow-sm\|shadow-md" src/atomic-crm/dashboard/*.tsx | grep -v "test"

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

Expected: Clean results, all checks pass

---

### Task 24: Final Commit & Summary

**Files:**
- None (final checkpoint)

**Step 1: Create final summary commit**

```bash
git commit --allow-empty -m "checkpoint: Spacing & Elevation Token Refactor Complete

Summary:
- Added semantic spacing utilities to tailwind.config.ts
- Added semantic elevation utilities to tailwind.config.ts
- Migrated ~40 dashboard files to use semantic tokens

Batch 1 (Core Widgets): 7 files
Batch 2 (Layouts): 4 files
Batch 3 (Modals/Specialized): 10+ files

Tests: ✓ 1524 passing (no regressions)
Type Check: ✓ Clean
Lint: ✓ Clean
Visual: ✓ All viewports verified
Accessibility: ✓ Touch targets ≥44px maintained

Design system compliance: 100%
P1 task complete ✓"
```

**Step 2: Verify Dashboard TODOs can be updated**

Check: `docs/tasks/Dashboard-TODOs.md`
Mark complete:
- [x] Refactor ad-hoc spacing to use semantic tokens
- [x] Introduce elevation tokens where appropriate

**Step 3: Prepare for documentation update**

Next task: Update design system documentation
File to update: `docs/architecture/design-system.md` (or create if missing)

---

## Edge Cases & Notes

### When to Keep Hardcoded Values

**Keep these unchanged:**
- `min-h-[44px]` - Accessibility touch targets (no token exists)
- `h-7`, `h-9` - Specific height requirements (no token)
- `w-11`, `w-12` - Button/icon sizes (no token)
- `py-1` - Very specific micro-spacing (not common enough for token)

### Conservative Elevation Guidelines

**✅ Apply elevation:**
- `PrincipalCard` - Main dashboard cards
- `DashboardWidget` - Widget containers
- `QuickCompleteTaskModal` - Modal dialogs (use `elevation-3`)
- `QuickLogActivity` - Modal forms (use `elevation-3`)

**❌ Do NOT apply elevation:**
- Buttons - Keep flat with border
- Table rows - Use border on hover
- List items within widgets
- Small badges/chips
- Input fields

### Testing Strategy

**For each file:**
1. Run dedicated test file if exists
2. Visual check in browser
3. Commit immediately

**For each batch:**
1. Run full test suite
2. Visual regression check (iPad + Desktop)
3. Checkpoint commit

**Final validation:**
1. All tests passing
2. Type check clean
3. Lint clean
4. Visual check all viewports
5. Accessibility maintained

---

## Success Criteria

- [ ] All semantic utilities added to `tailwind.config.ts`
- [ ] All ~40 dashboard files migrated
- [ ] Zero hardcoded `p-[digit]`, `mb-[digit]`, `gap-[digit]` in dashboard files (except documented edge cases)
- [ ] Zero `shadow-sm` or `shadow-md` in dashboard files
- [ ] All 1524 tests passing (no regressions)
- [ ] Type check clean
- [ ] Visual regression: Dashboard looks identical at all viewports
- [ ] Accessibility: Touch targets ≥44px maintained
- [ ] Dashboard TODOs updated (P1 tasks marked complete)

---

## Time Estimate

- Phase 1 (Foundation): 1-2 hours
- Phase 2 (Core Widgets): 2-3 hours
- Phase 3 (Layouts): 1-2 hours
- Phase 4 (Modals/Specialized): 2-3 hours
- Final Testing & Docs: 1 hour

**Total: 7-11 hours** (as estimated in design doc)
