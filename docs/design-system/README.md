# Atomic CRM Design System

Minimal design system utilities following the Engineering Constitution: no over-engineering, fail fast, single source of truth.

## Philosophy

**Constitutional Design:**
- Document standards, don't over-abstract
- Fix components at source, don't wrap them
- Use Tailwind classes directly when possible
- Add utilities only when genuinely needed

**iPad-First Responsive:**
- Design for iPad (768-1024px), scale up/down
- Breakpoints: mobile (default), tablet (md:), tabletLg (lg:), desktop (xl:)

**WCAG 2.1 AA Compliance:**
- 44px minimum touch targets (we use 48px standard)
- 4.5:1 text contrast (validated via `npm run validate:colors`)
- Keyboard navigation, focus management, screen reader support

## Quick Start

### Installation

```typescript
// Import utilities
import { TOUCH_TARGET_MIN, spacing, useAriaAnnounce } from '@/lib/design-system';

// Import components
import { ResponsiveGrid } from '@/components/design-system';
```

### Common Patterns

#### Touch Targets

All interactive elements must meet 44px minimum (WCAG 2.5.5):

```typescript
// Button already uses h-12 (48px) ✅
<Button size="default">Click Me</Button>

// Validate custom components in dev mode
import { validateTouchTarget } from '@/lib/design-system';
validateTouchTarget(buttonHeight, 'CustomButton');
```

#### Responsive Layouts

Use Tailwind classes directly for most layouts:

```tsx
// Simple two-column: use Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

// Dashboard 70/30 pattern: use ResponsiveGrid
<ResponsiveGrid variant="dashboard">
  <div>Main (70%)</div>
  <div>Sidebar (30%)</div>
</ResponsiveGrid>
```

#### Screen Reader Announcements

Announce dynamic updates to screen readers:

```typescript
import { useAriaAnnounce } from '@/lib/design-system';

const Dashboard = () => {
  const announce = useAriaAnnounce();

  const handleRefresh = () => {
    refresh();
    announce('Dashboard data refreshed');
  };
};
```

#### Keyboard Navigation

Add arrow key navigation to lists/tables:

```typescript
import { useKeyboardNavigation } from '@/lib/design-system';

const { currentIndex, handleKeyDown } = useKeyboardNavigation({
  items: principals,
  onSelect: (index) => navigate(`/principals/${principals[index].id}`)
});

return <div onKeyDown={handleKeyDown} tabIndex={0}>...</div>;
```

## File Structure

```
src/lib/design-system/
├── spacing.ts          # Touch target constants, spacing scale
├── accessibility.ts    # Focus management, screen reader utilities
└── index.ts

src/components/design-system/
├── ResponsiveGrid.tsx  # Grid layout patterns
└── index.ts

docs/design-system/
├── README.md           # This file
└── 01-principles.md    # Design principles
```

## Related Documentation

- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles
- [Color System](../internal-docs/color-theming-architecture.docs.md) - OKLCH tokens
- [Accessibility Testing](../claude/testing-quick-reference.md) - WCAG validation

## Validation

### Touch Targets

```bash
# Validate button sizes meet 44px minimum
grep -r "h-[0-9]" src/components/ui/button.tsx
# All should be h-12 or larger (48px+)
```

### Color Contrast

```bash
npm run validate:colors
# Should pass WCAG AA (4.5:1) in light and dark modes
```

### Accessibility Audit

```bash
npm run test:e2e
# Playwright tests include accessibility checks via axe-core
```

## Decision Log

**Why no custom breakpoint system?**
- Tailwind's md:, lg:, xl: already work perfectly
- Custom hook (useBreakpoint) adds complexity without benefit
- Use Tailwind classes for styling, only use JS when absolutely necessary

**Why no TouchTarget wrapper component?**
- Constitution: Fix at source, don't wrap
- Button component already uses h-12 (48px) ✅
- If a component is too small, fix the component, don't wrap it

**Why only 2 ResponsiveGrid variants?**
- Dashboard (70/30) is reused across 5+ pages - worth abstracting
- Cards (auto-fit) is common pattern - worth abstracting
- Other layouts are one-offs - use Tailwind directly (YAGNI)
