# Accessibility (A11y) Documentation

This directory contains comprehensive accessibility analysis and implementation guides for Atomic CRM.

## Quick Navigation

### For Developers
Start here when implementing features:
- **[a11y-quick-reference.md](./a11y-quick-reference.md)** - 5-minute developer guide with code examples
  - Common violations and fixes
  - Available accessibility hooks
  - ESLint rules overview
  - Component patterns

### For Managers/Leads
Start here for overview and planning:
- **[a11y-priority-fixes.md](./a11y-priority-fixes.md)** - Implementation roadmap
  - Detailed fixes with code examples
  - Timeline estimates (20 hours to AA compliance)
  - Priority phases (Critical, High, Medium, Documentation)
  - Verification checklist

### For Full Details
Start here for comprehensive analysis:
- **[accessibility-audit.md](./accessibility-audit.md)** - Complete audit (400+ lines)
  - Detailed violation analysis by category
  - WCAG 2.1 compliance status
  - Positive patterns to expand
  - Files requiring attention
  - Testing recommendations

## Current Compliance Status

```
WCAG 2.1 Level A (Partial) - 70% A compliance, 60% AA compliance
On path to AA compliance with 20 hours focused effort
Timeline: 2-3 weeks normal pace, 1 week focused sprint
```

## Key Numbers

- **25+ violations** found across codebase
- **20 hours** effort to reach AA compliance
- **3 critical files** blocking AA compliance
- **8+ positive patterns** already implemented

## Critical Issues (Fix First - 30 minutes)

1. **3 unassociated form labels** (BulkActionsToolbar.tsx)
2. **8 redundant ARIA roles** (Dashboard, ContactList, BulkActionsToolbar)
3. **4+ non-keyboard interactive elements** (various)

## Quick Wins (2-3 days)

1. Add aria-describedby to form inputs (4-6 hours)
2. Add aria-labels to 10+ icon buttons (3-4 hours)
3. Implement live region announcements (2-3 hours)
4. Add aria-required to form fields (1-2 hours)

## Compliance Timeline

| Timeline | Status | Effort |
|----------|--------|--------|
| Now | WCAG A (70%) | - |
| After Priority 1 | WCAG A (85%) | 30 min |
| After Priority 2 | WCAG A (95%) + AA (70%) | 11-13 hours |
| After Priority 3 | WCAG AA (95%) | 6 hours |
| With Testing | WCAG AA (Verified) | 3 hours |

**Total: ~20 hours to full AA compliance**

## What's Already Good

- ESLint jsx-a11y plugin configured
- useAriaAnnounce() hook for live regions
- Consistent focus ring styles
- Semantic HTML structure
- FormField pattern with error messaging
- Radix UI components with built-in a11y

## Tools

```bash
# Check violations
npm run lint:check

# ESLint configuration
eslint.config.js  # jsx-a11y plugin enabled

# Browser testing
- Chrome DevTools Accessibility panel
- axe DevTools extension
- WAVE extension
- VoiceOver (Mac) / NVDA (Windows)
```

## Implementation Priority

### Phase 1 (Critical - 30 minutes)
```
[ ] Fix form label associations
[ ] Remove redundant ARIA roles
[ ] Add keyboard handlers to click divs
```

### Phase 2 (High Impact - 11-13 hours)
```
[ ] Add aria-describedby to inputs
[ ] Verify modal focus traps
[ ] Add icon aria-labels
[ ] Add live announcements
```

### Phase 3 (Polish - 6 hours)
```
[ ] Replace placeholder-only fields
[ ] Add aria-required attributes
[ ] Verify table semantics
```

### Phase 4 (Testing - 1 hour)
```
[ ] Update CLAUDE.md
[ ] Add pre-commit a11y checks
```

## Files Needing Attention

### Critical (3 files)
- `src/atomic-crm/opportunities/BulkActionsToolbar.tsx`
- `src/atomic-crm/dashboard/Dashboard.tsx`
- `src/atomic-crm/contacts/ContactList.tsx`

### High Priority (3 files)
- `src/atomic-crm/tags/TagDialog.tsx`
- `src/components/admin/search-input.tsx`
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`

### Verification Needed (2 files)
- `src/components/admin/data-table.tsx`
- All modal/dialog components

## Testing Checklist

After implementing fixes:
- [ ] Run `npm run lint:check` - 0 jsx-a11y violations
- [ ] Manual keyboard test (Tab through every page)
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Check focus visible rings
- [ ] Verify color contrast
- [ ] Test with axe DevTools

## Resources

### WCAG Standards
- [WCAG 2.1 Checklist](https://www.w3.org/WAI/test-evaluate/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Learning
- [WebAIM: Intro to Web Accessibility](https://webaim.org/intro/)
- [A11ycasts by Google Chrome](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9Xc-RgEzwLvePng7V)
- [Deque University](https://dequeuniversity.com/)

## Accessibility Hooks Available

```tsx
import { 
  useAriaAnnounce,      // Live region announcements
  useKeyboardNavigation, // Arrow key navigation
  focusRing,            // Focus styles
  srOnly                // Screen reader only text
} from '@/lib/design-system';
```

## Next Steps

1. **Read** `a11y-quick-reference.md` (5 minutes)
2. **Fix** Priority 1 violations (30 minutes)
3. **Plan** Priority 2-3 implementation (review a11y-priority-fixes.md)
4. **Implement** in phases (20 hours total)
5. **Test** with ESLint + manual testing

## Questions?

See detailed documentation:
- **Quick answers**: a11y-quick-reference.md
- **How to fix**: a11y-priority-fixes.md  
- **Full analysis**: accessibility-audit.md

---

**Audit Date:** 2025-11-08  
**Compliance Level:** WCAG 2.1 Level A (Partial)  
**Target Level:** WCAG 2.1 Level AA (2-3 weeks)
