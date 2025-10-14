# Phase 2: InteractiveCard Extraction Guide

**Trigger**: When Organizations list implements elevation pattern (3rd occurrence)
**Estimated Time**: 60 minutes
**Risk Level**: Low (pattern already validated in production)

---

## Prerequisites

Before starting Phase 2:
- [ ] Organizations list module is under active development
- [ ] Pattern needs to be reused (similar to Contacts row layout)
- [ ] You have 30-60 minutes of focused implementation time

---

## Implementation Checklist

### **Step 1: Create Component** (15 min)

Create `/src/components/ui/interactive-card.tsx`:

```tsx
import React from "react";

type Elevation = "low" | "medium" | "high";

interface InteractiveCardProps {
  elevation?: Elevation;
  className?: string;
  children: React.ReactNode;
}

export function InteractiveCard({
  elevation = "low",
  className = "",
  children,
}: InteractiveCardProps) {
  const elevationClasses = {
    low: "shadow-sm hover:shadow-md",
    medium: "shadow-[var(--shadow-card-2)] hover:shadow-[var(--shadow-card-2-hover)]",
    high: "shadow-[var(--shadow-card-3)] hover:shadow-[var(--shadow-card-3-hover)]",
  };

  return (
    <div
      className={`
        group relative bg-card border border-transparent rounded-lg
        transition-all duration-150
        motion-safe:hover:-translate-y-0.5
        active:scale-[0.98]
        focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
        ${elevationClasses[elevation]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] Component exported in `/src/components/ui/index.ts` (if exists)

---

### **Step 2: Refactor Contacts** (15 min)

Update `/src/atomic-crm/contacts/ContactListContent.tsx`:

**Before**:
```tsx
<div className="group relative flex items-center justify-between gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
  {/* Content */}
</div>
```

**After**:
```tsx
<InteractiveCard elevation="low" className="flex items-center justify-between gap-3 px-3 py-2">
  {/* Content */}
</InteractiveCard>
```

**Changes**:
1. Import `InteractiveCard` at top of file
2. Replace `<div className="group relative ...">` with `<InteractiveCard>`
3. Move layout classes (`flex items-center ...`) to `className` prop
4. Remove elevation/interaction classes (handled by component)

**Validation**:
- [ ] Contact list renders correctly
- [ ] Hover states work (shadow + lift)
- [ ] Focus ring appears on keyboard navigation
- [ ] Checkbox and link remain clickable
- [ ] No visual regressions

---

### **Step 3: Implement Organizations** (15 min)

In your new Organizations list component:

```tsx
import { InteractiveCard } from "@/components/ui/interactive-card";

export const OrganizationListContent = () => {
  const { data: organizations } = useListContext();

  return (
    <div className="space-y-2">
      {organizations.map((org) => (
        <InteractiveCard
          key={org.id}
          elevation="low"
          className="flex items-center justify-between gap-3 px-3 py-2"
        >
          <Checkbox className="relative z-10" />
          <Link to={`/organizations/${org.id}`}>
            {org.name}
            <span className="absolute inset-0" aria-hidden="true" />
          </Link>
          {/* Additional org metadata */}
        </InteractiveCard>
      ))}
    </div>
  );
};
```

**Validation**:
- [ ] Organizations list renders
- [ ] Pattern matches Contacts visually
- [ ] All accessibility features work

---

### **Step 4: Refactor Dashboard (Optional)** (10 min)

If Dashboard HotContacts uses similar pattern:

Update `/src/atomic-crm/dashboard/HotContacts.tsx`:

**Before**:
```tsx
<Card className="bg-card border border-border shadow-sm rounded-xl py-0">
```

**After** (if interactive):
```tsx
<InteractiveCard elevation="low" className="py-0">
```

**OR** (if static):
```tsx
<Card className="bg-card border border-border shadow-sm rounded-xl py-0">
```

**Decision criteria**: Only refactor if the card needs hover elevation.

---

### **Step 5: Update Tests** (10 min)

Create `/src/components/ui/interactive-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { InteractiveCard } from './interactive-card';

describe('InteractiveCard', () => {
  it('renders children', () => {
    render(<InteractiveCard>Test content</InteractiveCard>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies low elevation by default', () => {
    const { container } = render(<InteractiveCard>Content</InteractiveCard>);
    expect(container.firstChild).toHaveClass('shadow-sm', 'hover:shadow-md');
  });

  it('applies custom className', () => {
    const { container } = render(
      <InteractiveCard className="custom-class">Content</InteractiveCard>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('supports medium elevation', () => {
    const { container } = render(
      <InteractiveCard elevation="medium">Content</InteractiveCard>
    );
    expect(container.firstChild).toHaveClass('shadow-[var(--shadow-card-2)]');
  });
});
```

**Validation**:
- [ ] All tests pass: `npm test`
- [ ] No regressions in existing tests

---

### **Step 6: Update Documentation** (5 min)

1. Update `/.docs/design-system/elevation.md`:
   - Change status from "Pending Phase 2" to "Implemented"
   - Add component location: `/src/components/ui/interactive-card.tsx`
   - Update "Current Implementations" section with new imports

2. Update this guide's status at top:
   - Change to: **Status**: ✅ Completed on [DATE]

---

## Rollback Plan

If issues arise during Phase 2:

1. **Revert component creation**:
   ```bash
   git checkout HEAD -- src/components/ui/interactive-card.tsx
   ```

2. **Revert Contacts refactor**:
   ```bash
   git checkout HEAD -- src/atomic-crm/contacts/ContactListContent.tsx
   ```

3. **Revert Organizations**:
   - Remove `InteractiveCard` imports
   - Use original `<div className="...">` pattern

**Recovery time**: < 10 minutes

---

## Success Criteria

Phase 2 is complete when:

- [x] `InteractiveCard` component exists in `/src/components/ui/`
- [x] Contacts list uses `InteractiveCard`
- [x] Organizations list uses `InteractiveCard`
- [x] All hover/focus states work correctly
- [x] No visual regressions (compare screenshots)
- [x] TypeScript compiles without errors
- [x] Unit tests pass
- [x] Accessibility audit passes (keyboard nav, screen reader)
- [x] Documentation updated

---

## Post-Implementation

After completing Phase 2:

1. **Capture visual regression baseline**:
   ```bash
   npm run test:visual -- --update-snapshots
   ```

2. **Create Storybook entry** (if not already done):
   - Add stories for all three elevation levels
   - Include accessibility examples

3. **Update CLAUDE.md** (if needed):
   - Document the new component location
   - Add to component architecture section

4. **Consider future applications**:
   - Products list?
   - Tasks list?
   - Activities list?

---

## Troubleshooting

### **Issue**: Hover states don't work after refactor
**Solution**: Ensure `group` class is on `InteractiveCard` root element

### **Issue**: Checkbox clicks don't work
**Solution**: Add `relative z-10` to Checkbox className

### **Issue**: TypeScript errors on elevation prop
**Solution**: Verify `Elevation` type is exported from component

### **Issue**: Visual differences between old and new
**Solution**: Compare rendered HTML in DevTools, ensure all classes transferred correctly

---

## References

- Elevation spec: `/.docs/design-system/elevation.md`
- Storybook examples: `http://localhost:6006/?path=/docs/design-system-elevation`
- Contacts implementation: `/src/atomic-crm/contacts/ContactListContent.tsx`
- Engineering Constitution: `/CLAUDE.md`
