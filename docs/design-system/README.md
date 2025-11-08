# Atomic CRM Design System

Minimal design system utilities following the Engineering Constitution and Atomic Design methodology: no over-engineering, fail fast, single source of truth.

## Atomic Design Hierarchy

This design system follows [Atomic Design](https://atomicdesign.bradfrost.com/) principles by Brad Frost:

**⚛️ Atoms** → **🧬 Molecules** → **🦠 Organisms** → **📐 Templates** → **📄 Pages**

### ⚛️ Atoms (Basic building blocks)
Design tokens and constants that can't be broken down further:
- Touch target sizes (`TOUCH_TARGET_MIN`, `TOUCH_TARGET_STANDARD`)
- Focus ring constants (`focusRing`)
- Screen reader utilities (`srOnly`)
- Color tokens (semantic CSS vars: `--primary`, `--brand-700`)

**Location:** `src/lib/design-system/spacing.ts`, `accessibility.ts`

### 🧬 Molecules (Simple component groups)
Reusable UI patterns combining atoms:
- `useAriaAnnounce` - Live region + announcement hook
- `useKeyboardNavigation` - Arrow key + focus management hook
- Form field patterns (input + label + error)

**Location:** `src/lib/design-system/accessibility.ts`

### 🦠 Organisms (Complex UI components)
Standalone UI sections with specific purposes:
- `ResponsiveGrid` (dashboard variant: 70/30 layout)
- `ResponsiveGrid` (cards variant: responsive card grids)
- Navigation components, data tables, forms

**Location:** `src/components/design-system/ResponsiveGrid.tsx`

### 📐 Templates (Page-level layouts)
Wireframe layouts showing content structure:
- Dashboard template (main 70% + complementary sidebar 30%)
- List/Detail template (filter sidebar + main content + info sidebar)
- Form template (main form + contextual sidebar)

**Examples:** Dashboard, ContactShow, ContactEdit layouts

### 📄 Pages (Specific instances)
Real content in templates:
- Dashboard with actual widgets and data
- ContactShow with real contact information
- ContactEdit with working form fields

**Examples:** `/dashboard`, `/contacts/123`, `/contacts/123/edit`

## Philosophy

**Constitutional Design:**
- Document standards, don't over-abstract
- Fix components at source, don't wrap them
- Use Tailwind classes directly when possible
- Add atoms/molecules/organisms only when genuinely needed (YAGNI)

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

## File Structure (Atomic Design)

```
src/lib/design-system/          # ⚛️ Atoms & 🧬 Molecules
├── spacing.ts                  # Atoms: Touch targets, spacing constants
├── accessibility.ts            # Molecules: Hooks for focus, announcements
└── index.ts

src/components/design-system/   # 🦠 Organisms
├── ResponsiveGrid.tsx          # Organism: Grid layout patterns
└── index.ts

src/atomic-crm/                 # 📐 Templates & 📄 Pages
├── dashboard/                  # Template: Dashboard layout
│   └── Dashboard.tsx           # Page: Actual dashboard with data
├── contacts/                   # Templates: List/Show/Edit
│   ├── ContactList.tsx         # Page: Contact list with filters
│   ├── ContactShow.tsx         # Page: Contact details
│   └── ContactEdit.tsx         # Page: Contact edit form
└── ...

docs/design-system/
├── README.md                   # This file - Atomic Design overview
├── 01-principles.md            # Design principles & constitution
├── 02-dashboard-pilot.md       # Pilot implementation
└── 03-atomic-design.md         # Detailed Atomic Design guide
```

## Component Creation Guidelines

Before creating a new component, ask:

1. **What level is it?** Atom, Molecule, Organism, Template, or Page?
2. **Does it already exist?** Search `src/lib/design-system/` and `src/components/design-system/`
3. **Is it needed 3+ times?** If not, use Tailwind directly (YAGNI)
4. **Can you fix at source?** Don't wrap broken components, fix them

**Quick decision tree:**
```
Is it a constant/token? → Atom (src/lib/design-system/)
Combines 2-3 atoms? → Molecule (src/lib/design-system/)
Complex reusable UI? → Organism (src/components/design-system/)
Page layout pattern? → Template (document pattern)
Specific page + data? → Page (src/atomic-crm/<resource>/)
```

**Example workflow:**
```typescript
// 1. Check if similar component exists
grep -r "ResponsiveGrid" src/

// 2. If creating new organism:
// - Document in 03-atomic-design.md
// - Add to src/components/design-system/
// - Export from index.ts
// - Add tests
// - Update this README

// 3. Use constitutional principles:
// - YAGNI: Only if needed 3+ times
// - Fail Fast: Validate in dev mode
// - Single Source: One place to change
```

See [Atomic Design Guide](./03-atomic-design.md) for detailed component creation workflow.

## Related Documentation

- [Atomic Design Guide](./03-atomic-design.md) - Detailed hierarchy and guidelines
- [Design Principles](./01-principles.md) - Constitution alignment
- [Dashboard Pilot](./02-dashboard-pilot.md) - Implementation lessons
- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles
- [Color System](../internal-docs/color-theming-architecture.docs.md) - OKLCH tokens

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
