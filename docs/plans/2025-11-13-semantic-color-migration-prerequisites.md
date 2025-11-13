# Semantic Color Migration - Prerequisites Report

**Date**: 2025-11-13
**Status**: ✅ Prerequisites Verified
**Next Step**: Proceed with migration implementation

---

## Task 1: Semantic Token Availability ✅ VERIFIED

### Available Tailwind Classes (via `@theme` layer)

**Text Colors:**
```tsx
text-foreground        // Primary text (--foreground)
text-muted-foreground  // Secondary/subtle text (--muted-foreground)
text-primary          // Brand forest green (--primary)
text-primary-foreground // Text on primary backgrounds
text-success          // Success green (--success-default)
text-warning          // Warning yellow (--warning-default)
text-destructive      // Error/destructive red (--destructive)
```

**Background Colors:**
```tsx
bg-background         // Page background
bg-muted              // Subtle backgrounds (--muted)
bg-primary            // Primary brand color
bg-success            // Success background
bg-warning            // Warning background
bg-destructive        // Destructive background
bg-card               // Card backgrounds
bg-popover            // Popover backgrounds
```

**Borders:**
```tsx
border                // Standard borders (--border)
border-input          // Input borders
```

**Interactive:**
```tsx
ring-primary          // Focus rings
```

---

## Task 2: Tailwind v4 Opacity Syntax ✅ VERIFIED

### Test Results

**Opacity modifiers work correctly:**
- ✅ `bg-muted/50` → 50% opacity muted background
- ✅ `bg-success/10` → 10% opacity success background
- ✅ `bg-warning/10` → 10% opacity warning background
- ✅ `bg-destructive/10` → 10% opacity destructive background
- ✅ `bg-primary/10` → 10% opacity primary background
- ✅ `bg-primary/20` → 20% opacity primary background

**Build Verification:**
- Test component compiled successfully
- No Tailwind errors or warnings
- All opacity classes generated correctly

**Test File Location:** `src/atomic-crm/dashboard/ColorSystemTest.tsx` (DELETE after migration)

---

## Revised Color Mapping Strategy

### What Changed from Original Plan

**Original Plan (INCORRECT):**
```tsx
text-green-600  →  text-success-default  // ❌ Class doesn't exist
text-yellow-600 →  text-warning-default  // ❌ Class doesn't exist
text-red-600    →  text-error-default    // ❌ Class doesn't exist
```

**Corrected Mapping (VERIFIED):**
```tsx
text-green-600  →  text-success          // ✅ Available
text-yellow-600 →  text-warning          // ✅ Available
text-red-600    →  text-destructive      // ✅ Available
```

### Complete Verified Mapping Rules

**Gray Scale → Semantic Tokens:**
```tsx
// Text colors (SAFE for automation)
text-gray-900  →  text-foreground
text-gray-800  →  text-foreground
text-gray-700  →  text-foreground
text-gray-600  →  text-muted-foreground
text-gray-500  →  text-muted-foreground
text-gray-400  →  text-muted-foreground

// Background colors (SAFE for automation)
bg-gray-50   →  bg-muted
bg-gray-100  →  bg-muted
bg-gray-200  →  bg-muted/50

// Borders (SAFE for automation)
border-gray-300  →  border
border-gray-200  →  border
```

**Status Colors → Semantic Tokens (REQUIRES MANUAL REVIEW):**
```tsx
// Success (green)
text-green-600    →  text-success
bg-green-50       →  bg-success/10
border-green-300  →  border-success  // ⚠️ Need to add to @theme

// Warning (yellow)
text-yellow-600   →  text-warning
text-yellow-500   →  text-warning
bg-yellow-50      →  bg-warning/10
border-yellow-300 →  border-warning  // ⚠️ Need to add to @theme

// Error/Destructive (red)
text-red-600      →  text-destructive
bg-red-50         →  bg-destructive/10
border-red-300    →  border-destructive  // ⚠️ Need to add to @theme

// Info/Primary (blue)
text-blue-600     →  text-primary
text-blue-800     →  text-primary-foreground
bg-blue-50        →  bg-primary/10
bg-blue-100       →  bg-primary/20
border-blue-300   →  border-primary  // ⚠️ Need to add to @theme
```

---

## Missing Tokens (Need to Add)

### Add to `@theme` layer in `src/index.css`:

```css
@theme inline {
  /* ... existing tokens ... */

  /* Add border colors for status states */
  --color-border-success: var(--success-border);
  --color-border-warning: var(--warning-border);
  --color-border-error: var(--error-border);
  --color-border-primary: var(--primary);
}
```

**Impact:** Without these, border status colors will need manual CSS variable syntax:
```tsx
// Workaround if we don't add them:
className="border-[color:var(--success-border)]"  // Verbose but works

// With tokens added:
className="border-success"  // Clean, semantic
```

---

## Task 3: Simplified Automation Strategy

### Regex-Based Replacement (Safer than AST)

**Approach:**
```typescript
// Simple exact-match replacements
const grayScaleReplacements = new Map([
  ['text-gray-900', 'text-foreground'],
  ['text-gray-800', 'text-foreground'],
  ['text-gray-700', 'text-foreground'],
  ['text-gray-600', 'text-muted-foreground'],
  ['text-gray-500', 'text-muted-foreground'],
  ['text-gray-400', 'text-muted-foreground'],
  ['bg-gray-50', 'bg-muted'],
  ['bg-gray-100', 'bg-muted'],
  ['bg-gray-200', 'bg-muted/50'],
  ['border-gray-300', 'border'],
  ['border-gray-200', 'border'],
  ['hover:bg-gray-50', 'hover:bg-muted'],
  ['hover:bg-gray-100', 'hover:bg-muted'],
]);

// Process files with simple string replacement
let content = fs.readFileSync(filePath, 'utf8');
for (const [oldClass, newClass] of grayScaleReplacements) {
  content = content.replaceAll(oldClass, newClass);
}
```

**Safety Measures:**
- Exact string matching only (no regex wildcards)
- Dry-run preview before actual changes
- Git diff for manual verification
- Skip files with complex `cn()` or `clsx()` utilities
- Manual review for status colors

---

## Task 4: Rollback Plan

### Pre-Migration Steps

```bash
# 1. Create pre-migration tag
git tag -a pre-color-migration -m "Before semantic color migration"

# 2. Create migration branch in git worktree
git worktree add ../crispy-crm-color-migration design-system-migration
cd ../crispy-crm-color-migration
```

### Rollback Commands

```bash
# If visual regression occurs, revert entire migration:
git revert --no-commit <first-commit>^..<last-commit>
git commit -m "Revert: Semantic color migration - visual regressions detected"

# Or restore from tag:
git reset --hard pre-color-migration

# Or remove worktree and start over:
cd ../crispy-crm
git worktree remove ../crispy-crm-color-migration
git branch -D design-system-migration
```

---

## Updated Component Prioritization

### Group A: Automated (Gray-Scale Only)

**Safe for regex script:**
- CompactDashboardHeader.tsx (4 gray violations)
- CompactGridDashboard.tsx (3 gray violations)
- PrincipalCardSkeleton.tsx (7 gray violations)
- PrincipalCard.tsx (3 gray violations)
- CompactRecentActivity.tsx (8 gray violations)
- CompactTasksWidget.tsx (5 gray violations)

**Total:** 30 violations

### Group B: Manual Priority (Status Colors)

**Require human review:**
- PriorityIndicator.tsx (4 status colors) - HIGH IMPACT
  - Conditional colors: high/medium/low priority
  - Size variants: sm/md/lg
- CompactPrincipalTable.tsx (12 mixed violations) - HIGH IMPACT
  - Conditional row colors based on data
  - Hover states, status indicators
- OpportunitiesByPrincipalDesktop.tsx (1 blue violation) - MEDIUM IMPACT
- MetricsCardGrid.tsx (2 status violations) - LOW IMPACT (unused component)

**Total:** 19 violations

---

## Prerequisite Completion Status

- [x] **Task 1:** Verify semantic token availability → ✅ ALL VERIFIED
- [x] **Task 2:** Test Tailwind v4 opacity syntax → ✅ WORKS CORRECTLY
- [x] **Task 3:** Document simplified automation strategy → ✅ REGEX APPROACH
- [x] **Task 4:** Create rollback plan → ✅ DOCUMENTED

---

## Recommendation: PROCEED WITH MIGRATION

**Green Light Conditions Met:**
1. ✅ All semantic tokens verified and available
2. ✅ Opacity syntax works correctly (`/10`, `/20`, `/50`)
3. ✅ Clear mapping strategy with verified class names
4. ✅ Simple, safe automation approach (regex)
5. ✅ Rollback plan documented
6. ✅ Component prioritization validated

**Next Steps:**
1. Add missing border color tokens to `@theme` (optional, can workaround)
2. Create regex-based migration script
3. Execute Group A (automated gray-scale)
4. Execute Group B (manual status colors)
5. Delete test component (`ColorSystemTest.tsx`)
6. Update documentation

**Estimated Timeline:**
- Script creation: 1-2 hours
- Group A migration: 2-3 hours
- Group B migration: 3-4 hours
- Testing & documentation: 2 hours
- **Total:** 8-11 hours

---

**Last Updated:** 2025-11-13
**Author:** Claude Code
**Status:** Ready for implementation
