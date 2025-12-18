# Click-to-Filter Badge UX Pattern Research

## Overview

Research document for the "Filter by This Value" click-to-filter functionality on badge/chip elements in data tables. This pattern follows industry standards established by Airtable, Notion, and modern React data grid libraries.

## Industry Standard Sources

### Primary References
- [PatternFly Filters Design Guidelines](https://www.patternfly.org/patterns/filters/design-guidelines/)
- [Mobbin Chip UI Design Patterns](https://mobbin.com/glossary/chip)
- [SetProduct Chip UI Design Best Practices](https://www.setproduct.com/blog/chip-ui-design)
- [shadcn/ui Table with Quick Filters](https://www.shadcn.io/blocks/table-filters-01)
- [MUI React Chip Component](https://mui.com/material-ui/react-chip/)

### Industry Leaders Using This Pattern
- **Airtable**: Click field values to filter views
- **Notion**: Click property values to filter databases
- **Linear**: Click labels/status to filter issues
- **GitHub**: Click labels to filter issues/PRs

---

## UX Best Practices Checklist

### 1. Interaction Behavior

| Requirement | Standard | Our Implementation | Status |
|-------------|----------|-------------------|--------|
| Click to filter | Click badge → filter by value | `setFilters({ ...filterValues, [source]: value })` | ✅ |
| Click to clear | Click active badge → clear filter | `delete newFilters[source]` | ✅ |
| Toggle behavior | Multi-select support | Single filter per source (appropriate for enum) | ✅ |
| Prevent row navigation | `stopPropagation()` on click | `e.stopPropagation(); e.preventDefault();` | ✅ |

### 2. Visual States

| State | Standard | Our Implementation | Status |
|-------|----------|-------------------|--------|
| Default | Normal badge appearance | Children render unchanged | ✅ |
| Hover | Subtle visual change (ring/shadow) | `hover:ring-2 hover:ring-primary/30` | ✅ |
| Active/Selected | Clear indication (ring/checkmark) | `ring-2 ring-primary ring-offset-1 shadow-sm` | ✅ |
| Focus | Visible focus ring for keyboard | `focus-visible:ring-2 focus-visible:ring-primary/50` | ✅ |
| Disabled | Muted/non-interactive | `disabled` prop → renders children only | ✅ |
| Cursor | Pointer on hover | `cursor-pointer` | ✅ |

### 3. Accessibility (WCAG 2.1 AA)

| Requirement | Standard | Our Implementation | Status |
|-------------|----------|-------------------|--------|
| Semantic element | `<button>` for interactive | `<button type="button">` | ✅ |
| ARIA pressed state | Toggle state communicated | `aria-pressed={isActive}` | ✅ |
| Descriptive label | Screen reader context | `aria-label="Filter list by {value}"` | ✅ |
| Keyboard accessible | Focusable, Enter/Space | Native button behavior | ✅ |
| Visual focus indicator | Visible focus ring | `focus-visible:ring-2` | ✅ |
| Title tooltip | Hover hint for action | `title="Filter by: {value}"` | ✅ |

### 4. Touch/Mobile Considerations

| Requirement | Standard | Our Implementation | Status |
|-------------|----------|-------------------|--------|
| Touch targets | 44x44px minimum | Relies on badge padding (badges already have `px-2.5 py-0.5`) | ⚠️ |
| Tap feedback | Visual response | Ring animation on tap | ✅ |
| No accidental triggers | Distinct from scroll | `stopPropagation()` prevents conflicts | ✅ |

**Note**: Touch target size is inherited from the wrapped badge component. The project's `BADGE_TOUCH_CLASSES` constant provides `min-h-[44px]` when needed.

### 5. State Management

| Requirement | Standard | Our Implementation | Status |
|-------------|----------|-------------------|--------|
| Filter state sync | React Admin context | `useListContext()` | ✅ |
| Combine with existing filters | Preserve other filters | `{ ...filterValues, [source]: value }` | ✅ |
| FilterChipBar integration | Show active filters | Automatic (shared state) | ✅ |
| URL persistence | Filters in URL params | React Admin handles automatically | ✅ |

---

## Implementation Verification

### Component: `src/components/admin/FilterableBadge.tsx`

```tsx
// Key implementation patterns verified:

// 1. React Admin integration via useListContext
const { filterValues, setFilters, displayedFilters } = useListContext();

// 2. Toggle behavior (click to set, click again to clear)
if (isActive) {
  const newFilters = { ...filterValues };
  delete newFilters[source];
  setFilters(newFilters, displayedFilters);
} else {
  setFilters({ ...filterValues, [source]: value }, displayedFilters);
}

// 3. Wrapper pattern (children slot for existing badges)
<button>{children}</button>

// 4. Accessibility attributes
aria-pressed={isActive}
aria-label={isActive ? `Active filter: ${displayLabel}. Click to clear.` : `Filter list by ${displayLabel}`}
```

### Lists Implemented

| List | File | Columns | Verified |
|------|------|---------|----------|
| Organizations | `OrganizationList.tsx:166-180` | Type, Priority | ✅ |
| Products | `ProductList.tsx:198-214` | Category, Status | ✅ |
| Contacts | `ContactList.tsx:154-163` | Status | ✅ |
| Tasks | `TaskList.tsx:176-202` | Priority, Type | ✅ |

---

## Comparison with Industry Standards

### PatternFly Filter Guidelines
> "Individual filter labels can be removed by clicking the 'x' in each label"

**Our approach**: Uses click-to-toggle on the badge itself (Airtable style) rather than requiring an X button. Both patterns are valid - Airtable/Notion prefer the click-toggle pattern.

### SetProduct Chip UI Design
> "Implement a subtle visual change to indicate interactivity" through background shifts or shadow effects

**Our approach**: Uses ring highlight (`hover:ring-2`) with animation (`transition-all duration-150`) for subtle hover feedback.

> "Clearly indicate the selected state of chips using visual cues"

**Our approach**: Active state uses `ring-2 ring-primary shadow-sm` for clear visual distinction.

### shadcn/ui Table Filters Pattern
> "Features clickable filter chips for priority and status, count badges showing matching items, clear all filters button"

**Our approach**: Integrates with existing FilterChipBar which provides clear-all functionality. Filter chips appear in the standard location.

---

## Gaps and Future Enhancements

### Minor Gap: Touch Target Size
The FilterableBadge wrapper relies on child badge padding. For strict WCAG compliance on touch devices, consider:
- Adding `min-h-[44px] min-w-[44px]` to the button when child is small
- Or ensuring all badge components use `BADGE_TOUCH_CLASSES`

### Potential Enhancement: Count Badges
Following shadcn pattern, could show filtered count on active filters:
```tsx
// Future: <FilterableBadge showCount>
// Would display "(3)" after active filter showing 3 matching records
```

### Potential Enhancement: Multi-Select
Current implementation is single-select per source. Could support array values:
```tsx
// Future: filterValues[source] = ["active", "coming_soon"]
```

---

## Conclusion

**Implementation Status: ✅ COMPLIANT**

Our FilterableBadge implementation follows industry standard patterns for:
- Click-to-filter/click-to-clear toggle behavior
- Visual states (hover, active, focus)
- Accessibility (ARIA, keyboard, screen reader)
- React Admin integration
- Wrapper component pattern (preserves existing badge styling)

The implementation aligns with UX patterns from Airtable, Notion, PatternFly, and shadcn/ui.

---

## References

1. PatternFly Filters - https://www.patternfly.org/patterns/filters/design-guidelines/
2. Mobbin Chip Design - https://mobbin.com/glossary/chip
3. SetProduct Chip UI - https://www.setproduct.com/blog/chip-ui-design
4. shadcn/ui Table Filters - https://www.shadcn.io/blocks/table-filters-01
5. MUI Chip - https://mui.com/material-ui/react-chip/
6. Airtable Interface Designer - https://support.airtable.com/docs/getting-started-with-airtable-interface-designer
