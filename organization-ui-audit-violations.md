# Organization Pages UI Audit - Violations Report

## Overview
This audit identifies design system violations in the Organizations module based on:
- **ui-ux-design-principles** skill (color system, accessibility, UI laws)
- **ui-design-consistency** skill (Atomic CRM design system)
- **Engineering Constitution** (semantic colors only)

## Critical Violations

### 1. Inline CSS Variable Syntax (CRITICAL)
**Severity:** HIGH
**Impact:** Breaks Tailwind v4 semantic utilities, bypasses design system

#### OrganizationCard.tsx
| Line | Current Code | Should Be |
|------|--------------|-----------|
| 35-39 | `bg-[color:var(--tag-warm-bg)]` | Use semantic utility or define in Tailwind config |
| 82 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 111 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 115 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 126 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |

#### OrganizationShow.tsx
| Line | Current Code | Should Be |
|------|--------------|-----------|
| 163 | `hover:bg-[var(--surface-interactive-hover)]` | `hover:bg-accent` or define semantic utility |
| 172 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 185 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 256 | `hover:bg-[var(--surface-interactive-hover)]` | `hover:bg-accent` |
| 260 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| 274 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |

**Rationale:** From ui-design-consistency skill:
> "❌ WRONG - Inline CSS Variable Syntax: className="text-[color:var(--text-subtle)]"
> ✅ CORRECT - Semantic Utility Classes: className="text-muted-foreground""

### 2. Touch Target Size Verification Needed
**Severity:** MEDIUM
**Impact:** May violate 44px minimum for iPad touch targets

#### OrganizationCard.tsx
| Component | Line | Status |
|-----------|------|--------|
| Checkbox | 52-57 | Need to verify ≥ 44x44px |
| EditButton | 61-63 | Need to verify ≥ 44x44px |

**Requirement:** From ui-design-consistency skill:
> "Touch targets: **44x44px minimum** (no 'acceptable at 40px')"

**Note:** Playwright test includes size verification tests to confirm actual rendered sizes.

### 3. Organization Type Color System
**Severity:** MEDIUM
**Impact:** Custom color mapping not using Tailwind semantic utilities

#### OrganizationCard.tsx Lines 34-40
Current approach uses CSS variables:
```typescript
const organizationTypeColorClasses: Record<string, string> = {
  customer: "bg-[color:var(--tag-warm-bg)] text-[color:var(--tag-warm-fg)]",
  prospect: "bg-[color:var(--tag-sage-bg)] text-[color:var(--tag-sage-fg)]",
  principal: "bg-[color:var(--tag-purple-bg)] text-[color:var(--tag-purple-fg)]",
  distributor: "bg-[color:var(--tag-teal-bg)] text-[color:var(--tag-teal-fg)]",
  unknown: "bg-[color:var(--tag-gray-bg)] text-[color:var(--tag-gray-fg)]",
};
```

**Should be:** Either:
1. Define semantic utilities in `tailwind.config.ts` for these tag colors, OR
2. Use existing semantic badges (like `variant="default"`, `variant="secondary"`)

**Considerations:**
- These tag colors follow MFB Garden to Table theme
- May be intentional custom theming
- Need to verify if `--tag-*` variables are defined in design system

## Lower Priority Issues

### 4. Card Height Consistency
**OrganizationCard.tsx Line 73:** `h-[200px]` - hardcoded height
- Verify this works well across iPad/desktop breakpoints
- Consider using semantic spacing tokens

### 5. Hover Effects
Multiple hover effects use custom CSS variables:
- `hover:shadow-md` (Line 73) - Good, uses Tailwind utility
- `hover:border-primary/20` (Line 73) - Good, uses semantic color
- But missing hover state for edit button visibility/prominence

## Recommendations

### Immediate Fixes (Before Next Release)
1. ✅ Replace all `text-[color:var(--text-subtle)]` with `text-muted-foreground`
2. ✅ Replace all `hover:bg-[var(--surface-interactive-hover)]` with semantic utility
3. ⚠️ Verify touch targets are ≥ 44x44px (use Playwright test results)

### Design System Improvements (Post-Fix)
1. Define organization type tag colors in `tailwind.config.ts` as semantic utilities
2. Document which CSS variables are part of the design system vs. deprecated
3. Run color validation: `npm run validate:colors`

### Testing
1. Run E2E tests: `npm run test:e2e tests/e2e/specs/organizations/organizations-ui-audit.spec.ts`
2. Review generated screenshots in `tests/e2e/specs/organizations/` directory
3. Verify touch target sizes from test console output

## Next Steps
1. Review screenshots from Playwright tests
2. Fix inline CSS variable violations
3. Verify touch target sizes
4. Re-run tests to confirm fixes
5. Update design system documentation

---
**Generated:** 2025-11-10
**Audit Tools:** ui-ux-design-principles skill, ui-design-consistency skill, Code analysis
