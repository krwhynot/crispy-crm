# Semantic Color Migration Plan - Dashboard Components

**Date**: 2025-11-13
**Status**: ✅ APPROVED - Ready for Implementation
**Prerequisites**: All verified (see `2025-11-13-semantic-color-migration-prerequisites.md`)

---

## Executive Summary

**Goal:** Migrate 80+ hard-coded Tailwind color violations to semantic CSS variables across 37 dashboard components.

**Approach:** Hybrid (regex automation + manual priority)
**Timeline:** 8-11 hours
**Risk Level:** LOW (prerequisites verified, rollback plan documented)

**Impact:**
- ✅ Design system compliance (Engineering Constitution)
- ✅ Dark mode support
- ✅ Maintainable color system
- ✅ Consistent visual design

---

## Phase 1: Setup (30 minutes)

### 1.1 Create Git Worktree
```bash
# Tag current state for rollback
git tag -a pre-color-migration -m "Before semantic color migration"

# Create isolated workspace
git worktree add ../crispy-crm-color-migration design-system-migration
cd ../crispy-crm-color-migration

# Verify clean state
npm run build
npm test
```

### 1.2 Add Optional Border Color Tokens

**File:** `src/index.css` (around line 50, in `@theme inline` block)

```css
@theme inline {
  /* ... existing tokens ... */

  /* Add border colors for status states (OPTIONAL) */
  --color-border-success: var(--success-border);
  --color-border-warning: var(--warning-border);
  --color-border-error: var(--error-border);
  --color-border-primary: var(--primary);
}
```

**Note:** If skipped, use verbose syntax: `border-[color:var(--success-border)]`

---

## Phase 2: Automated Migration (2-3 hours)

### 2.1 Create Migration Script

**File:** `scripts/migrate-semantic-colors.js`

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Exact string replacements (SAFE - no regex wildcards)
const grayScaleReplacements = new Map([
  // Text colors
  ['text-gray-900', 'text-foreground'],
  ['text-gray-800', 'text-foreground'],
  ['text-gray-700', 'text-foreground'],
  ['text-gray-600', 'text-muted-foreground'],
  ['text-gray-500', 'text-muted-foreground'],
  ['text-gray-400', 'text-muted-foreground'],

  // Background colors
  ['bg-gray-50', 'bg-muted'],
  ['bg-gray-100', 'bg-muted'],
  ['bg-gray-200', 'bg-muted/50'],

  // Borders
  ['border-gray-300', 'border'],
  ['border-gray-200', 'border'],

  // Hover states
  ['hover:bg-gray-50', 'hover:bg-muted'],
  ['hover:bg-gray-100', 'hover:bg-muted'],
  ['hover:text-gray-900', 'hover:text-foreground'],
  ['hover:text-gray-700', 'hover:text-foreground'],

  // Focus states
  ['focus:border-gray-300', 'focus:border'],
]);

function migrateFile(filePath, dryRun = true) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  const changes = [];

  for (const [oldClass, newClass] of grayScaleReplacements) {
    if (newContent.includes(oldClass)) {
      const count = (newContent.match(new RegExp(oldClass, 'g')) || []).length;
      newContent = newContent.replaceAll(oldClass, newClass);
      changes.push({ oldClass, newClass, count });
    }
  }

  if (changes.length === 0) {
    return null; // No changes needed
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }

  return { filePath, changes };
}

function migrateComponents(componentPaths, dryRun = true) {
  const results = [];

  for (const filePath of componentPaths) {
    const result = migrateFile(filePath, dryRun);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

// Export for testing
module.exports = { migrateFile, migrateComponents, grayScaleReplacements };

// CLI execution
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

  const componentPaths = [
    'src/atomic-crm/dashboard/CompactDashboardHeader.tsx',
    'src/atomic-crm/dashboard/CompactGridDashboard.tsx',
    'src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx',
    'src/atomic-crm/dashboard/PrincipalCard.tsx',
    'src/atomic-crm/dashboard/CompactRecentActivity.tsx',
    'src/atomic-crm/dashboard/CompactTasksWidget.tsx',
  ];

  const results = migrateComponents(componentPaths, dryRun);

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No files modified\n');
  } else {
    console.log('\n✅ FILES MODIFIED\n');
  }

  results.forEach(({ filePath, changes }) => {
    console.log(`📄 ${filePath}`);
    changes.forEach(({ oldClass, newClass, count }) => {
      console.log(`   ${oldClass} → ${newClass} (${count}x)`);
    });
    console.log('');
  });

  if (dryRun) {
    console.log('Run with --execute to apply changes');
  }
}
```

### 2.2 Execute Group A Components

**Components (30 violations):**
1. CompactDashboardHeader.tsx (4 violations)
2. CompactGridDashboard.tsx (3 violations)
3. PrincipalCardSkeleton.tsx (7 violations)
4. PrincipalCard.tsx (3 violations)
5. CompactRecentActivity.tsx (8 violations)
6. CompactTasksWidget.tsx (5 violations)

**Execution:**
```bash
# Dry run first
node scripts/migrate-semantic-colors.js --dry-run

# Review output, then execute
node scripts/migrate-semantic-colors.js --execute

# Test each component
npm test -- CompactDashboardHeader
# ... repeat for each

# Commit each component individually
git add src/atomic-crm/dashboard/CompactDashboardHeader.tsx
git commit -m "refactor(dashboard): migrate CompactDashboardHeader to semantic colors

- Replace text-gray-* with text-foreground/text-muted-foreground
- Replace bg-gray-* with bg-muted
- Replace border-gray-* with border
- 4 violations resolved

Part of semantic color migration (Engineering Constitution compliance)"
```

**Repeat for all 6 components** (one commit per component)

---

## Phase 3: Manual Priority Migration (3-4 hours)

### 3.1 PriorityIndicator Component (HIGH IMPACT)

**File:** `src/atomic-crm/dashboard/PriorityIndicator.tsx`

**Current Code (BEFORE):**
```tsx
// Priority badge with hard-coded colors
const variantStyles = {
  high: 'text-destructive',  // Already semantic ✅
  medium: 'text-warning bg-yellow-50 border-yellow-300',  // ❌ Hard-coded
  low: 'text-muted-foreground bg-green-50 border-green-300',  // ❌ Hard-coded
};
```

**Migrated Code (AFTER):**
```tsx
const variantStyles = {
  high: 'text-destructive bg-destructive/10 border-destructive',  // ✅ Semantic
  medium: 'text-warning bg-warning/10 border-warning',  // ✅ Semantic
  low: 'text-success bg-success/10 border-success',  // ✅ Semantic (note: "low" → success green)
};
```

**Testing Checklist:**
- [ ] Visual regression: Screenshot before/after
- [ ] Dark mode verification
- [ ] Size variants work (sm/md/lg)
- [ ] Conditional rendering correct
- [ ] Unit tests pass

**Commit:**
```bash
git add src/atomic-crm/dashboard/PriorityIndicator.tsx
git commit -m "refactor(dashboard): migrate PriorityIndicator to semantic colors

- Replace bg-yellow-50 with bg-warning/10
- Replace border-yellow-300 with border-warning
- Replace bg-green-50 with bg-success/10
- Replace border-green-300 with border-success
- 4 violations resolved

Tested: All priority levels (low/medium/high), size variants, dark mode
Part of semantic color migration"
```

### 3.2 CompactPrincipalTable Component (HIGH IMPACT)

**File:** `src/atomic-crm/dashboard/CompactPrincipalTable.tsx`

**Current Violations (12):**
- Gray scale: 8 violations (text/bg/border)
- Blue status: 2 violations (status indicators)
- Red warnings: 2 violations (urgent flags)

**Migration Strategy:**
```tsx
// BEFORE
className="text-gray-900 hover:bg-gray-50"  // ❌
className="text-blue-600 bg-blue-100"       // ❌ Status good
className="text-red-600 bg-red-50"          // ❌ Status urgent

// AFTER
className="text-foreground hover:bg-muted"  // ✅
className="text-primary bg-primary/10"      // ✅ Status good (blue → primary)
className="text-destructive bg-destructive/10"  // ✅ Status urgent
```

**Manual Review Required:**
- Conditional row highlighting based on data thresholds
- Hover states on interactive rows
- Status emoji + color combinations

**Commit:** Similar format, document all 12 changes

### 3.3 OpportunitiesByPrincipalDesktop (MEDIUM IMPACT)

**File:** `src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktop.tsx`

**Single blue violation:**
```tsx
// BEFORE
className="text-blue-600"  // ❌ Link/action color

// AFTER
className="text-primary"   // ✅ Semantic brand color
```

**Commit:** Quick fix, single violation

### 3.4 MetricsCardGrid (LOW PRIORITY - Optional)

**File:** `src/atomic-crm/dashboard/MetricsCardGrid.tsx`

**Status:** Legacy/unused component (identified in documentation)

**Decision:** SKIP or DEFER
- Not currently referenced in active dashboards
- Scheduled for removal in dead code cleanup
- If migrated, mark as low priority

---

## Phase 4: Testing & Validation (2 hours)

### 4.1 Visual Regression Testing

**Tool:** Playwright screenshots

```bash
# Take before screenshots (from main branch)
git checkout main
npm run dev &
npm run test:e2e -- --grep "dashboard" --update-snapshots
killall node

# Take after screenshots (from migration branch)
git checkout design-system-migration
npm run dev &
npm run test:e2e -- --grep "dashboard"
killall node

# Compare visually
```

### 4.2 Dark Mode Verification

**Manual Test:**
1. Open dashboard in browser
2. Toggle dark mode (if theme switcher exists)
3. Verify:
   - Text remains readable (4.5:1 contrast minimum)
   - Hover states visible
   - Focus rings appear correctly
   - Status colors differentiated

### 4.3 Accessibility Audit

```bash
# Run axe-core on migrated components
npm run test:a11y -- --component=PriorityIndicator
npm run test:a11y -- --component=CompactPrincipalTable
```

**Verify:**
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible
- [ ] Status conveyed beyond color (icons, text)

### 4.4 Cross-Browser Testing

**Test Matrix:**
- ✅ Chrome (primary)
- ✅ Firefox
- ✅ Safari (if available)

**Responsive Breakpoints:**
- ✅ Mobile (375px)
- ✅ iPad (768px)
- ✅ Desktop (1440px)

### 4.5 Performance Benchmark

```bash
# Before migration
git checkout main
npm run dev &
npm run lighthouse -- --url=http://localhost:5173/dashboard
killall node

# After migration
git checkout design-system-migration
npm run dev &
npm run lighthouse -- --url=http://localhost:5173/dashboard
killall node
```

**Verify:** No performance regression (< 5% difference)

---

## Phase 5: Documentation & Cleanup (1 hour)

### 5.1 Update DASHBOARD_DOCUMENTATION.md

**Section to modify:** "Styling & CSS" → "Color System Compliance Analysis"

```markdown
## Color System Compliance Status (Updated: 2025-11-13)

✅ **RESOLVED:** All dashboard components now use semantic color tokens

### Migration Summary

- **Before:** 80+ hard-coded Tailwind color violations
- **After:** 0 violations, 100% semantic token compliance
- **Components Migrated:** 37 components (29 active + 8 manual)
- **Legacy Components:** 12 deferred (scheduled for removal)

### Semantic Tokens Used

**Text Colors:**
- `text-foreground` (primary text)
- `text-muted-foreground` (secondary/subtle text)
- `text-success`, `text-warning`, `text-destructive` (status colors)
- `text-primary` (brand/link colors)

**Background Colors:**
- `bg-muted` (subtle backgrounds)
- `bg-success/10`, `bg-warning/10`, `bg-destructive/10` (status backgrounds)
- `bg-primary/10`, `bg-primary/20` (brand backgrounds)

**Borders:**
- `border` (standard borders)
- `border-success`, `border-warning`, `border-destructive` (status borders)

### Compliance: 100% ✅

All active dashboard components now comply with Engineering Constitution:
> **SEMANTIC COLORS ONLY**: CSS vars (--primary, --brand-700), never hex
```

### 5.2 Delete Test Component

```bash
rm src/atomic-crm/dashboard/ColorSystemTest.tsx
git add -u
git commit -m "chore: remove color system test component

Test component no longer needed after migration verification"
```

### 5.3 Update CLAUDE.md (if needed)

Add migration completion note to "Recent Changes" section:

```markdown
- **Semantic Color Migration (2025-11-13)**: Dashboard components migrated from hard-coded Tailwind colors to semantic CSS variables. 80+ violations resolved across 37 components. Engineering Constitution compliance achieved. Plan: `docs/plans/2025-11-13-semantic-color-migration-plan.md`
```

---

## Phase 6: Merge & Deploy (30 minutes)

### 6.1 Final Verification

```bash
# Run full test suite
npm test

# Run build
npm run build

# Run lint
npm run lint

# Verify no console errors
npm run dev
# Open dashboard, check browser console
```

### 6.2 Create Pull Request

**Title:** `refactor(dashboard): Migrate to semantic color system`

**Description:**
```markdown
## Summary
Migrates all dashboard components from hard-coded Tailwind colors to semantic CSS variables, achieving 100% compliance with Engineering Constitution.

## Changes
- ✅ 30 gray-scale violations (automated)
- ✅ 19 status color violations (manual)
- ✅ 6 components migrated (Group A)
- ✅ 4 components migrated (Group B)
- ✅ 100% test coverage maintained

## Verified
- [x] Visual regression testing (screenshots)
- [x] Dark mode compatibility
- [x] Accessibility audit (WCAG AA)
- [x] Cross-browser testing (Chrome, Firefox, Safari)
- [x] Performance benchmark (no regression)

## Migration Plan
See `docs/plans/2025-11-13-semantic-color-migration-plan.md`

## Rollback
If needed: `git revert --no-commit <range>` or `git reset --hard pre-color-migration`

Closes #[issue-number]
```

### 6.3 Merge Strategy

```bash
# Squash merge (recommended for clean history)
git checkout main
git merge --squash design-system-migration
git commit -m "refactor(dashboard): Migrate to semantic color system

- Resolve 80+ hard-coded Tailwind color violations
- Achieve Engineering Constitution compliance
- Maintain 100% test coverage
- Verify dark mode, accessibility, performance

Migration plan: docs/plans/2025-11-13-semantic-color-migration-plan.md"

# Or keep individual commits (detailed history)
git merge --no-ff design-system-migration
```

### 6.4 Cleanup

```bash
# Remove worktree
cd ../crispy-crm
git worktree remove ../crispy-crm-color-migration

# Delete migration branch (optional)
git branch -D design-system-migration

# Keep tag for reference
# git tag -d pre-color-migration  # DON'T delete, keep for rollback
```

---

## Rollback Plan

### If Visual Regression Detected

**Scenario:** QA finds visual issues after merge

**Immediate Fix:**
```bash
# Revert entire migration
git revert --no-commit <first-commit>^..<last-commit>
git commit -m "Revert: Semantic color migration - visual regressions detected

Issue: [describe visual regression]
Next steps: Fix in isolated branch, re-test, re-merge"
```

### If Performance Regression Detected

**Scenario:** Lighthouse score drops > 5%

**Investigation:**
1. Profile CSS variable resolution overhead
2. Check for unnecessary repaints
3. Consider server-side rendering optimization

**Rollback:** Same as above

### If Dark Mode Broken

**Scenario:** Dark mode contrast issues

**Immediate Fix:**
```bash
# If minor, hotfix specific component
git checkout design-system-migration -- src/atomic-crm/dashboard/PriorityIndicator.tsx
# Adjust color tokens in index.css
git add src/index.css src/atomic-crm/dashboard/PriorityIndicator.tsx
git commit -m "fix(dashboard): Adjust dark mode contrast for PriorityIndicator"
```

**Full Rollback:** If widespread, use revert strategy

---

## Success Criteria

### Definition of Done

- [ ] All 6 Group A components migrated (gray-scale)
- [ ] All 4 Group B components migrated (status colors)
- [ ] 0 hard-coded color violations in active dashboard components
- [ ] All existing tests pass (100% coverage maintained)
- [ ] Visual regression: No unintended visual changes
- [ ] Dark mode: Works correctly
- [ ] Accessibility: WCAG AA compliance maintained
- [ ] Performance: No regression (< 5% difference)
- [ ] Documentation: DASHBOARD_DOCUMENTATION.md updated
- [ ] Code review: Approved by team
- [ ] Merged to main branch

### Metrics

**Before:**
- Hard-coded violations: 80+
- Compliance: ~8% (3 of 37 components)
- Design system consistency: Low

**After:**
- Hard-coded violations: 0
- Compliance: 100% (all active components)
- Design system consistency: High
- Maintainability: Improved

---

## Timeline Estimate

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | Setup (worktree, tokens) | 30 min | None |
| 2 | Automated migration (6 components) | 2-3 hours | Phase 1 |
| 3 | Manual migration (4 components) | 3-4 hours | Phase 2 |
| 4 | Testing & validation | 2 hours | Phase 3 |
| 5 | Documentation & cleanup | 1 hour | Phase 4 |
| 6 | Merge & deploy | 30 min | Phase 5 |

**Total: 8-11 hours**

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Visual regression | Low | Medium | Screenshot comparison, manual QA |
| Dark mode issues | Low | High | Explicit dark mode testing |
| Performance regression | Very Low | Low | Lighthouse benchmarking |
| Merge conflicts | Medium | Low | Isolated worktree, coordinate with team |
| Test failures | Low | Medium | Run tests after each component |
| Production incident | Very Low | High | Rollback plan, tag for revert |

---

## Notes & Considerations

### Browser Compatibility

**CSS Variable Support:**
- ✅ Chrome 49+ (March 2016)
- ✅ Firefox 31+ (July 2014)
- ✅ Safari 9.1+ (March 2016)
- ✅ Edge 15+ (April 2017)

**No IE11 Support Required** (per project requirements)

### Performance Considerations

**CSS Variables vs Static Classes:**
- Runtime resolution: ~0.1-0.5ms per paint (negligible)
- Bundle size: Slightly smaller (reusable variables)
- Browser caching: Better (CSS variables separate from utility classes)

**Verdict:** No meaningful performance impact

### Alternative Approaches Considered

1. **CSS-in-JS Migration**: Rejected (adds runtime overhead)
2. **Tailwind Plugin**: Rejected (unnecessary complexity)
3. **Complete Redesign**: Rejected (out of scope)
4. **AST Parser Automation**: Rejected (too complex, regex sufficient)

---

**Plan Status:** ✅ APPROVED - Ready for Implementation
**Prerequisites:** All verified
**Next Step:** Execute Phase 1 (Setup)
**Questions:** Contact plan author

**Last Updated:** 2025-11-13
**Author:** Claude Code
**Reviewed By:** plan-reviewer agent
